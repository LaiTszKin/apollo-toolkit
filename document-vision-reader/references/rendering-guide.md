# Rendering Guide

Use the smallest reliable rendering path that preserves what the user needs to inspect.

## PDF or scanned document

- Capture only the requested pages first.
- If a full page becomes unreadable when scaled down, split it into overlapping crops.
- Preserve headers, footers, totals, and marginal notes when they affect interpretation.

## DOCX or rich-text document

- Read from a rendered page view, not raw XML text.
- Preserve comments, highlights, tracked-style decorations, and side notes when visible.
- Capture section-by-section when the page is text dense.

## PPTX or slide deck

- Capture slide canvases at a readable scale.
- Include presenter notes only if the user asks for them or they are needed to answer.
- When diagrams are dense, take one full-slide capture plus zoomed crops for detailed regions.

## Spreadsheet

- Keep row labels, column headers, and units visible in the same capture.
- Use overlapping viewport captures for wide tables.
- If color coding or conditional formatting matters, mention it explicitly in the answer.

## Existing image file

- Reuse the original image when it is already readable.
- Convert only when the target tool requires a different format.

## General fallback

- If no reliable renderer is available, ask the user for the specific screenshots needed.
- Do not claim coverage for pages or regions that were never captured.
