"""Prompt module for Interactive GUI Grounding (IGG) benchmark.

Shared by every model-specific eval script in ``scripts/interaction/``.
Designed for prompt-engineering iteration: each prompt variant lives in this
file as a named constant so you can A/B test by switching ``PROMPT_VERSION``.

Covers the proposal loop (proposal.md Sec. 6) by:
    - providing the system prompt that defines the IGG task and action space,
    - building a per-step user message that includes the instruction and the
      accumulated interaction trace,
    - parsing the model response back into a normalized action dict.

The action JSON shapes match ``lib/interaction-contract.mjs``:

    {"type": "scroll", "x": <int>, "y": <int>, "dy": <int>}
    {"type": "move",   "x": <int>, "y": <int>}
    {"type": "drag",   "startX": <int>, "startY": <int>, "endX": <int>, "endY": <int>}
    {"type": "wait",   "ms": <int>}
    {"type": "click",  "x": <int>, "y": <int>}
"""

from __future__ import annotations

import json
import re
from typing import Any

PROMPT_VERSION = "v1.0"

VIEWPORT_WIDTH = 1440
VIEWPORT_HEIGHT = 900


SYSTEM_PROMPT_V1 = f"""You are an Interactive GUI Grounding agent.

Your ONLY goal is to locate the single UI element described in the instruction
and click on it. The element may NOT be visible in the current screenshot.
In that case, take the minimum interaction needed to reveal it (scroll, hover,
expand, wait, drag away an occluder, etc.) and then click the element.

This is a grounding task, not a navigation task. Do NOT try to complete any
higher-level workflow; just find the target and click it.

The viewport is {VIEWPORT_WIDTH} x {VIEWPORT_HEIGHT} pixels. All coordinates
must be integer pixels in that viewport, with (0,0) at the top-left.

Action space (emit exactly ONE action per turn):
  - Scroll a region:   {{"type": "scroll", "x": <int>, "y": <int>, "dy": <int>}}
        dy > 0 scrolls down, dy < 0 scrolls up. Use (x, y) to pick which
        scroll container gets the event (e.g. a left sidebar vs the main feed).
  - Move the cursor:   {{"type": "move", "x": <int>, "y": <int>}}
        Triggers hover effects, tooltips, and hover-reveal menus.
  - Drag:              {{"type": "drag", "startX": <int>, "startY": <int>, "endX": <int>, "endY": <int>}}
        Use to nudge an occluding popup aside without fully closing it, or to
        move sliders/panels.
  - Wait:              {{"type": "wait", "ms": <int>}}
        Use when the target is gated by a timer, async load, ad countdown,
        auto-rotating carousel, etc.
  - Click:             {{"type": "click", "x": <int>, "y": <int>}}
        Grounding trigger. If (x, y) lands on the target element, the task
        ends immediately with success. If it lands on anything else, the task
        continues and the screen state may change.

Strategy:
  1. Read the instruction. Identify a unique visual description of the target.
  2. Scan the screenshot. If the target is visible, click its center.
  3. If not visible, reason about why: is it offscreen, in a collapsed panel,
     hidden behind a popup, revealed only on hover, or not loaded yet?
  4. Pick the single cheapest action that could make it visible or confirm it.
  5. Avoid exploratory clicks on random UI elements; each click is evaluated.

Output format (STRICT):
  Reply with exactly ONE line containing a single JSON object for the next
  action. No prose, no markdown, no code fences, no explanation.
  ALL coordinates are SEPARATE integer keys, NEVER a list and NEVER a nested
  object. For a click, emit both "x" and "y" as integers.
  Correct examples:
    {{"type": "click", "x": 512, "y": 340}}
    {{"type": "scroll", "x": 720, "y": 480, "dy": 600}}
    {{"type": "drag", "startX": 100, "startY": 200, "endX": 400, "endY": 200}}
    {{"type": "wait", "ms": 1500}}
  Incorrect (do NOT do any of these):
    {{"type": "click", "x": [512, 340]}}          ← coordinates must be scalars
    {{"type": "click", "point": [512, 340]}}     ← use x and y keys
    {{"type": "click", "bbox": [500, 330, 524, 350]}}
"""


SYSTEM_PROMPT_V1_NORM1000 = SYSTEM_PROMPT_V1.replace(
    f"""The viewport is {VIEWPORT_WIDTH} x {VIEWPORT_HEIGHT} pixels. All coordinates
must be integer pixels in that viewport, with (0,0) at the top-left.""",
    """Coordinates are integer values in a 0..1000 normalized space over the current viewport.
(0,0) is the top-left and (1000,1000) is the bottom-right. Scroll dy remains a pixel delta.""",
)


GPT55_LESSON_BLOCK = """
Additional policy lessons distilled from successful GPT-5.5 IGG traces:
  - Treat a click as the final grounding action, not as exploration. If the
    requested element is not clearly visible, prefer a reveal action first.
  - For off-screen targets, scroll the most plausible container before clicking.
    Use the screenshot layout to choose whether the main pane, sidebar, list, or
    canvas should receive the scroll event.
  - For hover-revealed controls, move the cursor over the relevant row, card,
    message, canvas object, or toolbar region before clicking.
  - For delayed UI, loading states, countdowns, auto-rotating carousels, or
    transient notifications, wait briefly instead of clicking a nearby element.
  - For occlusion, drag only when the task requires moving an overlay or object;
    do not drag ordinary buttons, text, or list items.
  - Preserve the target description across steps. After a reveal action, click
    the requested target, not just the newly exposed or most salient control.
"""


GPT55_SMALL_FEWSHOT_BLOCK = """
Decision-pattern examples from GPT-5.5-style successful behavior. These are
examples of action choice only; do not copy their coordinates for the current
screenshot.

Example: target is a tab or card likely above the current list position.
Action: {"type": "scroll", "x": 500, "y": 500, "dy": -600}

Example: target is a control that appears only when hovering over a row/card.
Action: {"type": "move", "x": 500, "y": 500}

Example: target is gated by an animation, countdown, toast, or delayed load.
Action: {"type": "wait", "ms": 1500}

Example: target is blocked by a movable overlay or occluding canvas object.
Action: {"type": "drag", "startX": 520, "startY": 520, "endX": 820, "endY": 520}
"""


SYSTEM_PROMPT_V1_NORM1000_GPT55_LESSON = (
    SYSTEM_PROMPT_V1_NORM1000
    + "\n"
    + GPT55_LESSON_BLOCK
)


SYSTEM_PROMPT_V1_NORM1000_GPT55_LESSON_4SHOT = (
    SYSTEM_PROMPT_V1_NORM1000
    + "\n"
    + GPT55_LESSON_BLOCK
    + "\n"
    + GPT55_SMALL_FEWSHOT_BLOCK
)


SYSTEM_PROMPTS = {
    "v1.0": SYSTEM_PROMPT_V1,
    "v1.0-norm1000": SYSTEM_PROMPT_V1_NORM1000,
    "v1.0-norm1000-gpt55-lesson": SYSTEM_PROMPT_V1_NORM1000_GPT55_LESSON,
    "v1.0-norm1000-gpt55-lesson-4shot": SYSTEM_PROMPT_V1_NORM1000_GPT55_LESSON_4SHOT,
}


def get_system_prompt(version: str = PROMPT_VERSION) -> str:
    if version not in SYSTEM_PROMPTS:
        raise KeyError(f"Unknown prompt version: {version!r}. Available: {list(SYSTEM_PROMPTS)}")
    return SYSTEM_PROMPTS[version]


def _rescale_trace_action(
    action: dict[str, Any],
    viewport: tuple[int, int],
    coordinate_space: str,
) -> dict[str, Any]:
    if coordinate_space != "normalized1000":
        return dict(action)

    w, h = viewport
    scaled = dict(action)
    for key in ("x", "startX", "endX"):
        if key in scaled and scaled[key] is not None:
            scaled[key] = max(0, min(1000, int(round(float(scaled[key]) / w * 1000))))
    for key in ("y", "startY", "endY"):
        if key in scaled and scaled[key] is not None:
            scaled[key] = max(0, min(1000, int(round(float(scaled[key]) / h * 1000))))
    return scaled


def _format_trace_entry(
    step: dict[str, Any],
    viewport: tuple[int, int] = (VIEWPORT_WIDTH, VIEWPORT_HEIGHT),
    coordinate_space: str = "viewport",
) -> str:
    action = _rescale_trace_action(step.get("action", {}) or {}, viewport, coordinate_space)
    atype = action.get("type", "?")
    parts = [f"#{step.get('step', '?')} {atype}"]
    for key in ("x", "y", "dy", "ms", "startX", "startY", "endX", "endY"):
        if key in action and action[key] is not None:
            parts.append(f"{key}={action[key]}")
    result = step.get("result", {}) or {}
    if atype == "click":
        observed = result.get("observedTargetId")
        parts.append(f"hit={observed!r}")
        if result.get("matched"):
            parts.append("MATCHED")
        else:
            parts.append("miss")
    elif atype == "move":
        observed = result.get("observedTargetId")
        if observed:
            parts.append(f"under={observed!r}")
    return " ".join(str(p) for p in parts)


def format_trace_for_prompt(
    trace: list[dict[str, Any]],
    max_items: int = 10,
    viewport: tuple[int, int] = (VIEWPORT_WIDTH, VIEWPORT_HEIGHT),
    coordinate_space: str = "viewport",
) -> str:
    """Render the interaction trace as a compact, model-readable string."""
    if not trace:
        return "(no actions taken yet)"
    if len(trace) <= max_items:
        shown = trace
        prefix = ""
    else:
        shown = trace[-max_items:]
        prefix = f"(showing last {max_items} of {len(trace)} actions)\n"
    lines = [_format_trace_entry(step, viewport=viewport, coordinate_space=coordinate_space) for step in shown]
    return prefix + "\n".join(lines)


def build_user_message(
    instruction: str,
    trace: list[dict[str, Any]],
    step_index: int,
    viewport: tuple[int, int] = (VIEWPORT_WIDTH, VIEWPORT_HEIGHT),
    max_trace_items: int = 10,
    coordinate_space: str = "viewport",
) -> str:
    """Build the per-step text prompt. The screenshot is attached separately."""
    w, h = viewport
    trace_block = format_trace_for_prompt(
        trace,
        max_items=max_trace_items,
        viewport=viewport,
        coordinate_space=coordinate_space,
    )
    if coordinate_space == "normalized1000":
        coordinate_line = (
            "Coordinate space: x/y coordinates are integer values in a 0..1000 "
            "normalized space over the current viewport; (0,0) is the top-left "
            "and (1000,1000) is the bottom-right. Scroll dy remains a pixel delta. "
            f"Viewport reference: {w} x {h}."
        )
    else:
        coordinate_line = f"Viewport: {w} x {h} (coordinates must be integer pixels in this space)"
    return (
        f"Instruction: {instruction}\n\n"
        f"Step: {step_index}\n"
        f"{coordinate_line}\n\n"
        f"Interaction trace so far:\n{trace_block}\n\n"
        f"The current screenshot is attached. Emit ONE action as a single-line JSON object."
    )


_ACTION_TYPES = {"scroll", "move", "drag", "wait", "click", "hover"}

_JSON_BLOCK_RE = re.compile(r"\{[^{}]*\}", re.DOTALL)
_FENCE_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL | re.IGNORECASE)
_TYPE_RE = re.compile(r"""["']?(?:type|action|name)["']?\s*:\s*["']?(\w+)["']?""", re.IGNORECASE)
_PAIR_RE = re.compile(
    r"""["']?(?:x|point|position|coordinate|coordinates|coord|xy)["']?\s*:\s*\[\s*"""
    r"""(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)""",
    re.IGNORECASE,
)
_SCALAR_X_RE = re.compile(r"""["']?x["']?\s*:\s*(-?\d+(?:\.\d+)?)""", re.IGNORECASE)
_SCALAR_Y_RE = re.compile(r"""["']?y["']?\s*:\s*(-?\d+(?:\.\d+)?)""", re.IGNORECASE)
_MALFORMED_XY_RE = re.compile(
    r"""["']?x["']?\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*[\]\}]""",
    re.IGNORECASE,
)


def _coerce_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def _pair(value: Any) -> tuple[int, int] | None:
    """Coerce a [x, y] list/tuple (or {'x':..,'y':..}) into (int, int)."""
    if isinstance(value, (list, tuple)) and len(value) == 2:
        a, b = _coerce_int(value[0]), _coerce_int(value[1])
        if a is not None and b is not None:
            return a, b
    if isinstance(value, dict) and "x" in value and "y" in value:
        a, b = _coerce_int(value["x"]), _coerce_int(value["y"])
        if a is not None and b is not None:
            return a, b
    return None


def _normalize_parsed(obj: dict[str, Any]) -> dict[str, Any] | None:
    raw_type = obj.get("type") or obj.get("action") or obj.get("name")
    if not isinstance(raw_type, str):
        return None
    atype = raw_type.strip().lower()
    if atype == "hover" or atype == "mouseover":
        atype = "move"
    if atype not in {"scroll", "move", "drag", "wait", "click"}:
        return None

    action: dict[str, Any] = {"type": atype}

    # Qwen-VL-style coordinate compaction: {"x": [X, Y]} or {"point": [X, Y]}
    # or {"coordinate": [X, Y]}. Expand to separate x/y before scalar reads.
    for src in ("point", "coordinate", "coord", "position", "xy"):
        pair = _pair(obj.get(src))
        if pair is not None and "x" not in action:
            action["x"], action["y"] = pair
            break
    if "x" not in action:
        xpair = _pair(obj.get("x"))
        if xpair is not None:
            action["x"], action["y"] = xpair

    for key in ("x", "y", "dy", "ms", "startX", "startY", "endX", "endY"):
        if key in action:
            continue
        if key in obj:
            coerced = _coerce_int(obj[key])
            if coerced is not None:
                action[key] = coerced
    # Some models use "start_x" / "end_x" snake_case.
    for snake, camel in (
        ("start_x", "startX"), ("start_y", "startY"),
        ("end_x", "endX"), ("end_y", "endY"),
    ):
        if snake in obj and camel not in action:
            coerced = _coerce_int(obj[snake])
            if coerced is not None:
                action[camel] = coerced
    # {"start": [X, Y], "end": [X, Y]} compaction
    sp = _pair(obj.get("start"))
    if sp is not None and "startX" not in action:
        action["startX"], action["startY"] = sp
    ep = _pair(obj.get("end"))
    if ep is not None and "endX" not in action:
        action["endX"], action["endY"] = ep
    if "duration_ms" in obj and "ms" not in action:
        coerced = _coerce_int(obj["duration_ms"])
        if coerced is not None:
            action["ms"] = coerced
    if "distance" in obj and "dy" not in action and atype == "scroll":
        coerced = _coerce_int(obj["distance"])
        if coerced is not None:
            action["dy"] = coerced

    # Sanity: click/move MUST have x,y; drag MUST have all four; scroll MUST
    # have dy. Reject otherwise so the runtime can treat it as a failure.
    if atype in ("click", "move") and ("x" not in action or "y" not in action):
        return None
    if atype == "drag" and not all(k in action for k in ("startX", "startY", "endX", "endY")):
        return None
    if atype == "scroll" and "dy" not in action:
        return None
    if atype == "wait" and "ms" not in action:
        action["ms"] = 1000
    return action


def parse_action_response(text: str) -> dict[str, Any] | None:
    """Extract and normalize a single action JSON from arbitrary model output.

    Tolerates:
      - raw JSON
      - fenced code blocks (``` or ```json)
      - extra prose before/after the JSON
      - snake_case keys (start_x, duration_ms, etc.)
      - hover/mouseover aliases for move
    Returns None on unrecoverable parse failure.
    """
    if not text:
        return None
    stripped = text.strip()

    candidates: list[str] = []
    # Prefer fenced block.
    fence = _FENCE_RE.search(stripped)
    if fence:
        candidates.append(fence.group(1))
    # Otherwise first balanced-looking {...}.
    candidates.extend(_JSON_BLOCK_RE.findall(stripped))
    # Final fallback: the whole string.
    candidates.append(stripped)

    for candidate in candidates:
        try:
            obj = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if not isinstance(obj, dict):
            continue
        action = _normalize_parsed(obj)
        if action is not None:
            return action

    # Last-resort recovery for common malformed GUI-agent output:
    # {"type": "click", "x": [226, 104]
    type_match = _TYPE_RE.search(stripped)
    pair_match = _PAIR_RE.search(stripped)
    if type_match and pair_match:
        action = _normalize_parsed({
            "type": type_match.group(1),
            "x": [pair_match.group(1), pair_match.group(2)],
        })
        if action is not None:
            return action

    # Scalar coordinates with a malformed key quote, e.g.
    # {"type": "click", "x": 450, y": 252}
    if type_match:
        x_match = _SCALAR_X_RE.search(stripped)
        y_match = _SCALAR_Y_RE.search(stripped)
        if x_match and y_match:
            action = _normalize_parsed({
                "type": type_match.group(1),
                "x": x_match.group(1),
                "y": y_match.group(1),
            })
            if action is not None:
                return action

        # Some GUI agents drop the coordinate key and leave a broken pair:
        # {"type": "click", "x": 100, 173]}}
        malformed_pair = _MALFORMED_XY_RE.search(stripped)
        if malformed_pair:
            action = _normalize_parsed({
                "type": type_match.group(1),
                "x": [malformed_pair.group(1), malformed_pair.group(2)],
            })
            if action is not None:
                return action
    return None


__all__ = [
    "PROMPT_VERSION",
    "VIEWPORT_WIDTH",
    "VIEWPORT_HEIGHT",
    "SYSTEM_PROMPTS",
    "get_system_prompt",
    "build_user_message",
    "format_trace_for_prompt",
    "parse_action_response",
]
