#!/usr/bin/env python3
"""Build the bundled web fonts in lib/fonts/ and the stylesheet lib/igg-fonts.css.

Every font family named by the mock apps (system stacks such as -apple-system,
Segoe UI, Arial, SFMono-Regular, Times New Roman, ...) is redefined with
@font-face to the same set of bundled open-licensed fonts. Each character the
apps can render is assigned to exactly one font file through disjoint
unicode-range lists, so the browser never falls back to an OS font and
screenshots are identical on every OS.

Usage: python scripts/build-fonts.py SRC_DIR
  (needs fonttools + brotli; SRC_DIR holds the files listed in SOURCES)
"""
import os
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "lib" / "fonts"

# file in SRC_DIR -> where it comes from (all SIL OFL 1.1)
SOURCES = {
    "InterVariable.ttf": "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip",
    "InterVariable-Italic.ttf": "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip",
    "JetBrainsMono[wght].ttf": "https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip",
    "JetBrainsMono-Italic[wght].ttf": "https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip",
    "NotoSerif.ttf": "https://github.com/google/fonts/raw/main/ofl/notoserif/NotoSerif%5Bwdth,wght%5D.ttf",
    "NotoSansKR.ttf": "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf",
    "NotoSansJP.ttf": "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf",
    "NotoSansSymbols.ttf": "https://github.com/google/fonts/raw/main/ofl/notosanssymbols/NotoSansSymbols%5Bwght%5D.ttf",
    "NotoSansSymbols2.ttf": "https://github.com/google/fonts/raw/main/ofl/notosanssymbols2/NotoSansSymbols2-Regular.ttf",
    "NotoSansMath.ttf": "https://github.com/google/fonts/raw/main/ofl/notosansmath/NotoSansMath-Regular.ttf",
    "NotoColorEmoji-COLRv1.ttf": "https://github.com/googlefonts/noto-emoji/raw/v2.047/fonts/Noto-COLRv1.ttf",
}

SANS_ALIASES = [
    "IGG Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue",
    "Helvetica", "Arial", "Noto Sans", "Inter", "Google Sans", "Circular", "gg sans",
    "Apple SD Gothic Neo", "Malgun Gothic",
]
MONO_ALIASES = [
    "IGG Mono", "SFMono-Regular", "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono",
    "Courier New", "Courier Prime",
]
SERIF_ALIASES = ["IGG Serif", "Times New Roman", "Times", "Georgia", "Cambria"]

# Text-default characters the apps use with U+FE0F (emoji presentation), plus
# BMP characters whose default presentation is emoji.
EMOJI_BMP = set("‼↩☀⚔⚙⚛⚠✈✍✏❤✅✨❓⭐☕⚡⛅⚽⏳⌚⌛⏰☔♿⚓⚪⚫⚾⛄⛔⛪⛲⛳⛵⛺⛽✊✋❌❎❔❕❗➕➖➗➰➿⬛⬜⭕")


def used_chars():
    chars = set()
    for root in ("apps", "lib"):
        for dirpath, dirnames, files in os.walk(REPO / root):
            dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".next", "fonts")]
            for name in files:
                if name.endswith((".tsx", ".ts", ".css", ".mjs")):
                    chars |= set((Path(dirpath) / name).read_text("utf8"))
    return {ord(c) for c in chars if ord(c) > 0x7E}


def is_emoji(cp):
    return cp >= 0x1F000 or chr(cp) in EMOJI_BMP or cp in (0x200D, 0xFE0F, 0x20E3)


def ranges(cps, universe):
    """unicode-range for `cps`, merging runs that no other character of `universe` interrupts."""
    out, run = [], []
    for cp in sorted(universe):
        if cp in cps:
            run.append(cp)
        elif run:
            out.append(run)
            run = []
    if run:
        out.append(run)
    return ", ".join(f"U+{r[0]:X}" if len(r) == 1 else f"U+{r[0]:X}-{r[-1]:X}" for r in out)


def write_woff2(font, name, keep=None):
    if keep is not None:
        opts = subset.Options()
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        opts.drop_tables = [t for t in opts.drop_tables if t not in ("COLR", "CPAL")]
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=keep)
        sub.subset(font)
    font.flavor = "woff2"
    font.save(OUT / name)
    return font.getBestCmap()


def main(src):
    src = Path(src)
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob("*.woff2"):
        f.unlink()
    load = lambda name: TTFont(src / name)
    chars = used_chars()

    # Primary faces are kept whole (any Latin text renders the same everywhere).
    sans = write_woff2(load("InterVariable.ttf"), "Inter.woff2")
    write_woff2(load("InterVariable-Italic.ttf"), "Inter-Italic.woff2")
    mono = write_woff2(load("JetBrainsMono[wght].ttf"), "JetBrainsMono.woff2")
    write_woff2(load("JetBrainsMono-Italic[wght].ttf"), "JetBrainsMono-Italic.woff2")
    serif_font = instancer.instantiateVariableFont(load("NotoSerif.ttf"), {"wdth": 100})
    serif = write_woff2(serif_font, "NotoSerif.woff2")

    # Fallback faces are subset to the characters the apps actually render.
    fallbacks = [  # (file, source, predicate) in priority order
        ("NotoColorEmoji.woff2", "NotoColorEmoji-COLRv1.ttf", is_emoji),
        ("NotoSansKR.woff2", "NotoSansKR.ttf", lambda cp: True),
        ("NotoSansJP.woff2", "NotoSansJP.ttf", lambda cp: True),
        ("NotoSansSymbols2.woff2", "NotoSansSymbols2.ttf", lambda cp: True),
        ("NotoSansSymbols.woff2", "NotoSansSymbols.ttf", lambda cp: True),
        ("NotoSansMath.woff2", "NotoSansMath.ttf", lambda cp: True),
    ]
    cmaps = {name: TTFont(src / source, lazy=True).getBestCmap() for name, source, _ in fallbacks}

    def assign(primary):
        """Map every used character not drawn by `primary` to one fallback file."""
        plan, missing = {}, []
        for cp in sorted(chars):
            emoji = is_emoji(cp)
            if cp in primary and not emoji:
                continue
            for name, _, wants in fallbacks:
                if wants(cp) and (cp in cmaps[name] or (emoji and name == "NotoColorEmoji.woff2")):
                    plan.setdefault(name, set()).add(cp)
                    break
            else:
                missing.append(chr(cp))
        return plan, missing

    plans = {"sans": assign(sans), "mono": assign(mono), "serif": assign(serif)}
    for kind, (_, missing) in plans.items():
        if missing:
            sys.exit(f"{kind}: no bundled font covers {''.join(missing)!r}")
    needed = {}
    for plan, _ in plans.values():
        for name, cps in plan.items():
            needed.setdefault(name, set()).update(cps)
    for name, source, _ in fallbacks:
        if name in needed:
            write_woff2(load(source), name, keep=needed[name])

    css = [
        "/* Generated by scripts/build-fonts.py. Do not edit. */",
        "/* Every font name used by the apps maps to bundled fonts, so rendering does not depend on the OS. */",
    ]

    def faces(family, primary_file, italic_file, weights, plan):
        # The primary face has no unicode-range; the fallback faces come later, and for
        # overlapping ranges the last declared face wins, so each character has one font.
        for style, file in (("normal", primary_file), ("italic", italic_file)):
            if file:
                css.append(
                    f'@font-face {{ font-family: "{family}"; src: url("./fonts/{file}") format("woff2"); '
                    f"font-weight: {weights}; font-style: {style}; font-display: block; }}"
                )
        for name, cps in plan.items():
            css.append(
                f'@font-face {{ font-family: "{family}"; src: url("./fonts/{name}") format("woff2"); '
                f"font-weight: 100 900; font-display: block; unicode-range: {ranges(cps, chars)}; }}"
            )

    for family in SANS_ALIASES:
        faces(family, "Inter.woff2", "Inter-Italic.woff2", "100 900", plans["sans"][0])
    for family in MONO_ALIASES:
        faces(family, "JetBrainsMono.woff2", "JetBrainsMono-Italic.woff2", "100 800", plans["mono"][0])
    for family in SERIF_ALIASES:
        faces(family, "NotoSerif.woff2", None, "100 900", plans["serif"][0])

    css += [
        "",
        "/* Generic families (ui-monospace, system-ui, sans-serif) cannot be redefined, so point the",
        "   theme variables and the remaining generic uses at the bundled families instead. */",
        ':root:root { --font-sans: "IGG Sans"; --font-mono: "IGG Mono"; --font-serif: "IGG Serif";',
        '  --default-font-family: "IGG Sans"; --default-mono-font-family: "IGG Mono"; }',
        ':where(html), :where(button, input, select, textarea) { font-family: "IGG Sans"; }',
        ':where(svg [font-family="sans-serif"]) { font-family: "IGG Sans"; }',
        "",
    ]
    (REPO / "lib" / "igg-fonts.css").write_text("\n".join(css))
    for f in sorted(OUT.glob("*.woff2")):
        print(f"{f.name:28} {f.stat().st_size / 1024:8.0f} KB")


if __name__ == "__main__":
    main(sys.argv[1])
