# KaTeX Insertion Patterns

## HTML or template files

- Use:

```bash
python3 katex/scripts/render_katex.py \
  --tex 'E = mc^2' \
  --output-format html-fragment
```

- Paste the output where the formula should appear.
- Ensure the destination page loads a KaTeX stylesheet such as the official CDN link.

## Standalone preview page

- Use:

```bash
python3 katex/scripts/render_katex.py \
  --tex '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' \
  --display-mode \
  --output-format html-page \
  --output-file /absolute/path/preview.html
```

- Open the generated file in a browser to visually confirm spacing and line breaking.

## Markdown or MDX that preserves raw HTML

- Use `markdown-inline` for inline formulas and `markdown-block` for display formulas.
- The result is still HTML. It works only when the downstream renderer keeps raw HTML intact.
- If the renderer sanitizes or escapes HTML, keep the source TeX instead of pasting the rendered fragment.

## Existing HTML page that stores raw TeX delimiters

- Keep the source TeX in the document.
- Load the official assets:
  - `katex.min.css`
  - `katex.min.js`
  - `contrib/auto-render.min.js`
- Call `renderMathInElement(container, options)` after the DOM is ready.
- Restrict the container instead of rendering the whole page when only one section contains math.

## Shared macros across a document

- Put macros in a JSON file and pass `--macro-file`.
- Reuse the same macro definitions for every formula generated into the same document.

## Error-handling defaults

- Keep `throwOnError` enabled unless the task explicitly prefers graceful fallback rendering.
- When previewing user-supplied formulas that may be invalid, use `--no-throw-on-error` and keep the original TeX nearby for debugging.
