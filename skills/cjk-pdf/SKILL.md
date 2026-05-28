---
name: cjk-pdf
description: Handle CJK PDF font selection, rendering requirements, and visual QA for Chinese-compatible PDF output. Use when any skill needs to render PDFs with Chinese or mixed CJK text, verify font paths, apply content safety rules, and perform screenshot-based visual QA.
---

# CJK PDF

## Dependencies

- Required: `pdf` for all PDF rendering and visual QA.
- Conditional: none.
- Optional: none.
- Fallback: If `pdf` is unavailable, stop and report the missing dependency.

## Standards

- Evidence: Verify font paths exist on the current macOS host before rendering.
- Execution: Select fonts → enforce content safety → delegate to `pdf` → screenshot QA → cleanup.
- Quality: Verify CJK glyphs render correctly (no tofu boxes), headings and body text are balanced, tables stay readable.
- Output: Return the final verified PDF path after passing visual QA.

## Workflow

### 1) Select CJK fonts (macOS)

Prefer fonts in this order (verify path exists before use):
1. `/System/Library/Fonts/Hiragino Sans GB.ttc`
2. `/System/Library/Fonts/Supplemental/Songti.ttc`
3. `/Library/Fonts/Arial Unicode.ttf`
4. `/System/Library/Fonts/STHeiti Medium.ttc`
5. `/System/Library/Fonts/STHeiti Light.ttc`

- Do not hardcode missing or poorly-rendering fonts.
- Do not assume `PingFang` is available on every macOS host.
- If the `pdf` skill already has a verified CJK-safe default, reuse it instead of overriding.

### 2) Content safety

- Use Chinese-compatible characters, punctuation, and fonts.
- Avoid emoji, decorative symbols, and unusual glyphs that often break rendering.

### 3) Delegate rendering to `pdf`

- Pass content and font requirements to the `pdf` skill.
- For tables with long Chinese phrases: require wrapped paragraph cells, width-constrained columns, and row heights that expand with content.

### 4) Visual QA

Open the rendered PDF and inspect:
- First page — layout, title, headings
- One page with a table or structured data
- One page with dense paragraph text

Verify:
- CJK glyphs render correctly (no tofu boxes or missing characters)
- Reasonable line wrapping
- Table borders and columns staying readable
- Page margins and spacing look clean
- Heading hierarchy visually balanced
- Long table cells do not overlap adjacent text
- Row heights expand to fit wrapped content

If layout or glyph rendering is wrong, fix font, spacing, or content and re-render.

### 5) Cleanup

- QA screenshots are temporary — delete after visual check unless the user asks to keep them.
- Keep only the final PDF as the persistent deliverable.
