"use client";

type ReviewWindowState = Window & {
  __IGG_REVIEW_CAPTURE_INSTALLED__?: boolean;
  __IGG_REVIEW_CAPTURE_ENABLED__?: boolean;
  __IGG_REVIEW_LAST_POINTER__?: { x: number; y: number };
  [key: string]: unknown;
};

type ReviewAction = Record<string, unknown>;

export type ReviewPreparedTarget = {
  x: number;
  y: number;
  observedTargetId: string | null;
};

type ReviewRuntimeOptions = {
  runtimeStateKey: string;
  resolveReviewElement: (selector?: string | null) => HTMLElement | null;
  buildReviewSelector: (element: HTMLElement | null) => string | null;
  resolveActionElement?: (element: HTMLElement | null) => HTMLElement | null;
  captureClickTargetSelector: string;
  captureHoverTargetSelector: string;
  captureHoverType?: "move" | "hover";
  hoverDwellMs?: number;
  prepareTarget?: (
    element: HTMLElement,
    selector: string | null,
    action: ReviewAction,
  ) => ReviewPreparedTarget;
  clickUsesNativeFocus?: boolean;
};

function getReviewWindow() {
  return window as unknown as ReviewWindowState;
}

function getObservedTargetId(element: HTMLElement | null) {
  return element?.closest("[data-igg-id]")?.getAttribute("data-igg-id") ?? null;
}

function isActionableTarget(element: HTMLElement | null) {
  const target = element?.closest("[data-igg-id]") as HTMLElement | null;
  if (!target) return false;
  const disabledControl = target.closest("button:disabled, input:disabled, select:disabled, textarea:disabled, option:disabled, optgroup:disabled");
  const ariaDisabled = target.closest("[aria-disabled='true']");
  const inertTarget = target.closest("[inert]");
  return !disabledControl && !ariaDisabled && !inertTarget && window.getComputedStyle(target).pointerEvents !== "none";
}

function centerPointOfRect(rect: DOMRect | { left: number; top: number; width: number; height: number }) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function defaultPrepareTarget(element: HTMLElement, selector: string | null) {
  const rect = element.getBoundingClientRect();
  const visibleLeft = Math.max(rect.left, 0);
  const visibleTop = Math.max(rect.top, 0);
  const visibleRight = Math.min(rect.right, window.innerWidth);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const visibleWidth = visibleRight - visibleLeft;
  const visibleHeight = visibleBottom - visibleTop;

  if (visibleWidth <= 0 || visibleHeight <= 0) {
    throw new Error(`Target is outside the current viewport: ${String(selector ?? "")}`);
  }

  const { x, y } = centerPointOfRect({
    left: visibleLeft,
    top: visibleTop,
    width: visibleWidth,
    height: visibleHeight,
  });
  return {
    x,
    y,
    observedTargetId: getObservedTargetId(document.elementFromPoint(x, y) as HTMLElement | null),
  };
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const SYNTHETIC_HOVER_ATTR = "data-igg-review-hover";
const SYNTHETIC_HOVER_STYLE_ID = "igg-review-synthetic-hover-style";

function ensureSyntheticHoverStyles() {
  if (document.getElementById(SYNTHETIC_HOVER_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = SYNTHETIC_HOVER_STYLE_ID;
  style.textContent = `
[${SYNTHETIC_HOVER_ATTR}="true"] .group-hover\\:opacity-100,
[${SYNTHETIC_HOVER_ATTR}="true"].group-hover\\:opacity-100 {
  opacity: 1 !important;
}

[${SYNTHETIC_HOVER_ATTR}="true"] .group-hover\\:block,
[${SYNTHETIC_HOVER_ATTR}="true"].group-hover\\:block {
  display: block !important;
}

[${SYNTHETIC_HOVER_ATTR}="true"] .group-hover\\:flex,
[${SYNTHETIC_HOVER_ATTR}="true"].group-hover\\:flex {
  display: flex !important;
}
`;
  document.head.appendChild(style);
}

function setSyntheticHoverTarget(element: HTMLElement, eventTarget: HTMLElement) {
  ensureSyntheticHoverStyles();

  document.querySelectorAll(`[${SYNTHETIC_HOVER_ATTR}="true"]`).forEach((node) => {
    node.removeAttribute(SYNTHETIC_HOVER_ATTR);
  });

  const targets = new Set<HTMLElement>();
  targets.add(element);
  targets.add(eventTarget);

  const elementGroup = element.closest(".group");
  const eventTargetGroup = eventTarget.closest(".group");
  if (elementGroup instanceof HTMLElement) targets.add(elementGroup);
  if (eventTargetGroup instanceof HTMLElement) targets.add(eventTargetGroup);

  for (const target of targets) {
    target.setAttribute(SYNTHETIC_HOVER_ATTR, "true");
  }
}

function dispatchMouseEvent(
  target: HTMLElement | Document,
  type: string,
  x: number,
  y: number,
  bubbles = true,
) {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles,
    cancelable: true,
    clientX: x,
    clientY: y,
    view: window,
  }));
}

function dispatchPointerEvent(
  target: HTMLElement | Document,
  type: string,
  x: number,
  y: number,
  bubbles = true,
) {
  if (typeof PointerEvent === "undefined") return;
  target.dispatchEvent(new PointerEvent(type, {
    bubbles,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    view: window,
  }));
}

function dispatchSyntheticHover(element: HTMLElement, x: number, y: number) {
  const hitElement = (document.elementFromPoint(x, y) as HTMLElement | null) ?? element;
  const eventTarget = element.contains(hitElement) ? hitElement : element;
  setSyntheticHoverTarget(element, eventTarget);

  dispatchPointerEvent(eventTarget, "pointerover", x, y);
  dispatchMouseEvent(eventTarget, "mouseover", x, y);
  dispatchPointerEvent(element, "pointerenter", x, y, false);
  dispatchMouseEvent(element, "mouseenter", x, y, false);

  dispatchPointerEvent(eventTarget, "pointermove", x, y);
  dispatchMouseEvent(eventTarget, "mousemove", x, y);
  dispatchPointerEvent(document, "pointermove", x, y);
  dispatchMouseEvent(document, "mousemove", x, y);

  element.dispatchEvent(new CustomEvent("igg-review-synthetic-hover", {
    bubbles: true,
    cancelable: false,
    detail: { x, y },
  }));
}

function isScrollableElement(element: HTMLElement | null) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflow = style.overflow;
  const canScrollY =
    overflowY === "auto" ||
    overflowY === "scroll" ||
    overflow === "auto" ||
    overflow === "scroll";
  return canScrollY && element.scrollHeight > element.clientHeight + 4;
}

function findScrollableAncestor(start: HTMLElement | null) {
  let node = start;
  while (node && node !== document.body) {
    if (isScrollableElement(node)) return node;
    node = node.parentElement;
  }
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

function findScrollableTargetFromPoint(x: number, y: number) {
  const elements = document.elementsFromPoint(x, y) as HTMLElement[];
  for (const element of elements) {
    const scrollable = findScrollableAncestor(element);
    if (scrollable) return scrollable;
  }
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

function scrollReviewTarget(target: HTMLElement | null, dy: number) {
  if (!target || target === document.body || target === document.documentElement || target === document.scrollingElement) {
    window.scrollBy({ top: dy, behavior: "auto" });
    return {
      scope: "viewport" as const,
      target: document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null,
    };
  }

  target.scrollBy({ top: dy, behavior: "auto" });
  return {
    scope: "container" as const,
    target,
  };
}

export function createReviewRuntime(options: ReviewRuntimeOptions) {
  const hoverType = options.captureHoverType ?? "hover";
  const hoverDwellMs = options.hoverDwellMs ?? 220;
  const resolveActionElement =
    options.resolveActionElement ??
    ((element: HTMLElement | null) => element);
  const prepareTarget = options.prepareTarget ?? defaultPrepareTarget;

  function prepareActionTarget(action: ReviewAction) {
    if (isFiniteCoordinate(action.x) && isFiniteCoordinate(action.y)) {
      const x = action.x;
      const y = action.y;
      const hitElement = document.elementFromPoint(x, y) as HTMLElement | null;
      const element = resolveActionElement(hitElement) ?? hitElement ?? document.body;
      return {
        element,
        eventTarget: hitElement ?? element,
        selector: options.buildReviewSelector(element),
        x,
        y,
        observedTargetId: getObservedTargetId(hitElement ?? element),
      };
    }

    const selector = typeof action.selector === "string" ? action.selector : null;
    const element = resolveActionElement(options.resolveReviewElement(selector));
    if (!element) {
      throw new Error(`Unable to resolve selector: ${String(selector ?? "")}`);
    }
    const prepared = prepareTarget(element, selector, action);
    const hitElement = document.elementFromPoint(prepared.x, prepared.y) as HTMLElement | null;
    return {
      element,
      eventTarget: hitElement && element.contains(hitElement) ? hitElement : element,
      selector: options.buildReviewSelector(element),
      x: prepared.x,
      y: prepared.y,
      observedTargetId: prepared.observedTargetId,
    };
  }

  function installReviewCapture() {
    const reviewWindow = getReviewWindow();
    if (reviewWindow.__IGG_REVIEW_CAPTURE_INSTALLED__) return;
    reviewWindow.__IGG_REVIEW_CAPTURE_INSTALLED__ = true;
    reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__ = false;

    const pressedKeys = new Set<string>();
    let lastHoverSelector = "";
    let hoverTimer: number | null = null;
    let hoverCandidate = "";
    let lastPointer = {
      x: Math.round(window.innerWidth / 2),
      y: Math.round(window.innerHeight / 2),
    };
    reviewWindow.__IGG_REVIEW_LAST_POINTER__ = lastPointer;
    let dragStart: { x: number; y: number; selector: string | null; observedTargetId: string | null } | null = null;

    const emitObservedAction = (detail: Record<string, unknown>) => {
      const runtimeState = reviewWindow[options.runtimeStateKey] ?? null;
      window.parent?.postMessage({ type: "igg-review-observed-action", detail, runtimeState }, "*");
    };

    window.addEventListener("message", (event) => {
      if (event.data?.type !== "igg-review-capture") return;
      reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__ = Boolean(event.data.enabled);
      emitObservedAction({
        type: "capture",
        message: reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__ ? "manual capture enabled" : "manual capture disabled",
      });
    });

    document.addEventListener(
      "mousemove",
      (event) => {
        lastPointer = { x: event.clientX, y: event.clientY };
        reviewWindow.__IGG_REVIEW_LAST_POINTER__ = lastPointer;
      },
      true,
    );

    const emitManualClickAt = (event: MouseEvent) => {
      const hitElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const eventElement = event.target instanceof HTMLElement ? event.target : null;
      const rawTarget = ((hitElement ?? eventElement)?.closest(options.captureClickTargetSelector) ??
        eventElement?.closest(options.captureClickTargetSelector)) as HTMLElement | null;
      const element = resolveActionElement(rawTarget);
      const observedElement = element ?? rawTarget ?? hitElement ?? eventElement;
      emitObservedAction({
        type: "click",
        selector: options.buildReviewSelector(observedElement),
        x: event.clientX,
        y: event.clientY,
        observedTargetId: getObservedTargetId(observedElement),
        targetActionable: isActionableTarget(observedElement),
        message: "manual click observed",
      });
      lastPointer = { x: event.clientX, y: event.clientY };
      reviewWindow.__IGG_REVIEW_LAST_POINTER__ = lastPointer;
    };


    document.addEventListener(
      "mouseover",
      (event) => {
        if (!reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__) return;
        const rawTarget = (event.target as HTMLElement | null)?.closest(options.captureHoverTargetSelector) as HTMLElement | null;
        const element = resolveActionElement(rawTarget);
        const selector = options.buildReviewSelector(element);
        if (!selector || selector === lastHoverSelector || selector === hoverCandidate) return;
        hoverCandidate = selector;
        if (hoverTimer) window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(() => {
          lastHoverSelector = selector;
          hoverCandidate = "";
          emitObservedAction({
            type: hoverType,
            selector,
            dwellMs: hoverDwellMs,
            x: event.clientX,
            y: event.clientY,
            observedTargetId: getObservedTargetId(element),
            message: hoverType === "move" ? "manual hover observed" : "manual hover observed after dwell",
          });
          lastPointer = { x: event.clientX, y: event.clientY };
          reviewWindow.__IGG_REVIEW_LAST_POINTER__ = lastPointer;
        }, hoverDwellMs);
      },
      true,
    );

    document.addEventListener(
      "mouseout",
      () => {
        hoverCandidate = "";
        if (hoverTimer) {
          window.clearTimeout(hoverTimer);
          hoverTimer = null;
        }
      },
      true,
    );

    document.addEventListener(
      "wheel",
      (event) => {
        if (!reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__) return;
        const target = findScrollableTargetFromPoint(event.clientX, event.clientY);
        emitObservedAction({
          type: "scroll",
          dy: Math.round(event.deltaY),
          x: event.clientX,
          y: event.clientY,
          selector: options.buildReviewSelector(target),
          observedTargetId: getObservedTargetId(target),
          scrollScope: target && target !== document.scrollingElement ? "container" : "viewport",
          message: `manual wheel scroll ${Math.round(event.deltaY)}`,
        });
        lastPointer = { x: event.clientX, y: event.clientY };
        reviewWindow.__IGG_REVIEW_LAST_POINTER__ = lastPointer;
      },
      { capture: true, passive: true },
    );

    document.addEventListener("mousedown", (event) => {
      if (!reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__) return;
      const hitElement = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const eventElement = event.target instanceof HTMLElement ? event.target : null;
      const rawTarget = ((hitElement ?? eventElement)?.closest(options.captureClickTargetSelector) ??
        eventElement?.closest(options.captureClickTargetSelector)) as HTMLElement | null;
      const element = resolveActionElement(rawTarget);
      const observedElement = element ?? rawTarget ?? hitElement ?? eventElement;
      dragStart = {
        x: event.clientX,
        y: event.clientY,
        selector: options.buildReviewSelector(observedElement),
        observedTargetId: getObservedTargetId(observedElement),
      };
    }, true);

    document.addEventListener("mouseup", (event) => {
      if (!reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__ || !dragStart) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (Math.hypot(dx, dy) > 8) {
        emitObservedAction({
          type: "drag",
          selector: dragStart.selector,
          startX: Math.round(dragStart.x),
          startY: Math.round(dragStart.y),
          endX: Math.round(event.clientX),
          endY: Math.round(event.clientY),
          observedTargetId: dragStart.observedTargetId,
          message: `manual drag observed`,
        });
      } else {
        emitManualClickAt(event);
      }
      dragStart = null;
      lastPointer = { x: event.clientX, y: event.clientY };
      reviewWindow.__IGG_REVIEW_LAST_POINTER__ = lastPointer;
    }, true);

    window.addEventListener("keydown", (event) => {
      pressedKeys.add(event.key.toLowerCase());
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditableTarget =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        Boolean(target?.isContentEditable);
      const key = event.key.toLowerCase();
      if (!isEditableTarget && !event.metaKey && !event.ctrlKey && !event.altKey && ["p", "f", "s", "n", "r", "e", "x", "c"].includes(key)) {
        event.preventDefault();
        window.parent?.postMessage({ type: "igg-review-shortcut", key }, "*");
        return;
      }
      if (!reviewWindow.__IGG_REVIEW_CAPTURE_ENABLED__) return;
      if (pressedKeys.has("s") && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        const dy = event.key === "ArrowDown" ? 320 : -320;
        const result = scrollReviewTarget(findScrollableTargetFromPoint(lastPointer.x, lastPointer.y), dy);
        emitObservedAction({
          type: "scroll",
          dy,
          x: lastPointer.x,
          y: lastPointer.y,
          selector: options.buildReviewSelector(result.target),
          observedTargetId: getObservedTargetId(result.target),
          scrollScope: result.scope,
          message: `manual key scroll ${dy}`,
        });
      }
    });

    window.addEventListener("keyup", (event) => {
      pressedKeys.delete(event.key.toLowerCase());
    });
  }

  async function executeReviewAction(action: ReviewAction) {
    const reviewWindow = getReviewWindow();
    const type = action.type;

    if (type === "scroll") {
      const dy = Number(action.dy ?? 0);
      const lastPointer = reviewWindow.__IGG_REVIEW_LAST_POINTER__;
      const selectorTarget = typeof action.selector === "string"
        ? resolveActionElement(options.resolveReviewElement(action.selector)) ?? options.resolveReviewElement(action.selector)
        : null;
      const target = selectorTarget
        ? findScrollableAncestor(selectorTarget) ?? selectorTarget
        : typeof action.x === "number" && typeof action.y === "number"
          ? findScrollableTargetFromPoint(action.x, action.y)
          : lastPointer
            ? findScrollableTargetFromPoint(lastPointer.x, lastPointer.y)
            : findScrollableTargetFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      const result = scrollReviewTarget(target, dy);
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return {
        message: `${result.scope === "container" ? "container" : "viewport"} scrolled by ${dy}`,
        actionType: type,
        dy,
        x: typeof action.x === "number" ? action.x : lastPointer?.x ?? Math.round(window.innerWidth / 2),
        y: typeof action.y === "number" ? action.y : lastPointer?.y ?? Math.round(window.innerHeight / 2),
        selector: typeof action.selector === "string" ? action.selector : options.buildReviewSelector(result.target),
        observedTargetId: getObservedTargetId(result.target),
        scrollScope: result.scope,
      };
    }

    if (type === "wait") {
      const waitMs = Number(action.ms ?? 1000);
      await new Promise((resolve) => window.setTimeout(resolve, waitMs));
      return { message: `waited for ${waitMs}ms`, actionType: type, ms: waitMs };
    }

    if (type === "drag") {
      let startX = Number(action.startX ?? 0);
      let startY = Number(action.startY ?? 0);
      const endX = Number(action.endX ?? 0);
      const endY = Number(action.endY ?? 0);
      if (typeof action.selector === "string") {
        const prepared = prepareActionTarget(action);
        startX = prepared.x;
        startY = prepared.y;
      }
      const steps = 20;
      const startEl = (document.elementFromPoint(startX, startY) as HTMLElement | null) ?? document.body;
      startEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, view: window }));
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, view: window }));
      await new Promise((resolve) => window.setTimeout(resolve, 16));
      startEl.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, view: window }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: startX, clientY: startY, view: window }));
      await new Promise((resolve) => window.setTimeout(resolve, 16));
      for (let i = 1; i < steps; i++) {
        const x = startX + (endX - startX) * (i / steps);
        const y = startY + (endY - startY) * (i / steps);
        const el = (document.elementFromPoint(x, y) as HTMLElement | null) ?? document.body;
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
        document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
        await new Promise((resolve) => window.setTimeout(resolve, 16));
      }
      const endEl = (document.elementFromPoint(endX, endY) as HTMLElement | null) ?? document.body;
      endEl.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, view: window }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, clientX: endX, clientY: endY, view: window }));
      await new Promise((resolve) => window.setTimeout(resolve, Number(action.ms ?? 350)));
      reviewWindow.__IGG_REVIEW_LAST_POINTER__ = { x: endX, y: endY };
      return {
        message: `dragged from (${startX},${startY}) to (${endX},${endY})`,
        actionType: type,
        selector: typeof action.selector === "string" ? action.selector : null,
        startX, startY, endX, endY,
      };
    }

    if (type === "move" || type === "hover") {
      const prepared = prepareActionTarget(action);
      dispatchSyntheticHover(prepared.element, prepared.x, prepared.y);
      const dwellMs = Number(action.ms ?? hoverDwellMs);
      await new Promise((resolve) => window.setTimeout(resolve, dwellMs));
      reviewWindow.__IGG_REVIEW_LAST_POINTER__ = { x: prepared.x, y: prepared.y };
      return {
        message: "hovered target element",
        actionType: type,
        selector: prepared.selector,
        observedTargetId: prepared.observedTargetId,
        x: prepared.x,
        y: prepared.y,
        dwellMs,
      };
    }

    if (type === "click") {
      const prepared = prepareActionTarget(action);
      const targetActionable = isActionableTarget(prepared.eventTarget);
      reviewWindow.__IGG_REVIEW_LAST_POINTER__ = { x: prepared.x, y: prepared.y };
      dispatchPointerEvent(prepared.eventTarget, "pointerdown", prepared.x, prepared.y);
      dispatchMouseEvent(prepared.eventTarget, "mousedown", prepared.x, prepared.y);
      dispatchPointerEvent(prepared.eventTarget, "pointerup", prepared.x, prepared.y);
      dispatchMouseEvent(prepared.eventTarget, "mouseup", prepared.x, prepared.y);
      if (options.clickUsesNativeFocus !== false) {
        if (
          prepared.element instanceof HTMLInputElement ||
          prepared.element instanceof HTMLTextAreaElement ||
          prepared.element instanceof HTMLSelectElement ||
          prepared.element.isContentEditable
        ) {
          prepared.element.focus();
        }
      }
      dispatchMouseEvent(prepared.eventTarget, "click", prepared.x, prepared.y);
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      return {
        message: "clicked target element",
        actionType: type,
        selector: prepared.selector,
        observedTargetId: prepared.observedTargetId,
        targetActionable,
        x: prepared.x,
        y: prepared.y,
      };
    }

    throw new Error(`Unsupported action type: ${String(type)}`);
  }

  return {
    installReviewCapture,
    executeReviewAction,
  };
}
