---
name: document-vision-reader
description: Convert rendered non-plain-text files into temporary screenshots, inspect those screenshots as images, and answer the user's request from the visible visual output. Use when an agent needs to inspect PDFs, PPT/PPTX decks, scanned documents, forms, spreadsheets, or other files whose rendered appearance matters more than raw text extraction.
---

# Document Vision Reader

## Dependencies

- Required: none.
- Conditional: `screenshot` when the host needs OS-level captures; `pdf`, `doc`, `pptx`, or `spreadsheet` when the source file needs format-specific rendering before screenshot capture.
- Optional: none.
- Fallback: If the file cannot be rendered or captured safely, ask the user for the relevant screenshots/pages instead of guessing from inaccessible content.

## Standards

- Evidence: Base every conclusion on visible screenshot content only; call out blur, clipping, hidden areas, and unreadable regions explicitly.
- Execution: Create a temporary screenshot workspace, capture only the pages/regions needed, inspect the images, answer the request, and remove temporary artifacts unless the user asked to keep them.
- Quality: Prefer legible crops over full-page miniatures, keep screenshot naming deterministic, and verify that every requested page or region was actually reviewed.
- Output: Return the user-facing answer plus the screenshot coverage used, any visibility limits, and whether temporary files were cleaned up.

## Goal

Use visual reading as the source of truth when the target file is not a plain-text artifact and the rendered appearance matters more than extractable text.

Typical cases:

- scanned PDFs or image-only files
- PDF reports, statements, and forms
- PPT/PPTX slides that must be checked as rendered pages
- forms, receipts, invoices, and reports with layout cues
- slides or documents where comments, highlights, colors, callouts, or alignment matter
- spreadsheets where merged cells, visual grouping, or formatting affects interpretation
- cases where raw text extraction is incomplete, broken, or misleading

Do not use this skill for plain-text files when normal text reading is sufficient.

## Workflow

### 1) Confirm scope and output target

Before capturing anything, determine:

- which file or files must be inspected
- what the user actually needs (summary, transcription, table extraction, comparison, QA, translation, field lookup, etc.)
- which pages, slides, sheets, or regions matter most
- whether the user needs the temporary screenshots returned or only used internally

If the file is long, capture only the requested pages or the smallest range needed to answer correctly.

### 2) Create a temporary screenshot workspace

Create a dedicated temporary directory, for example:

```bash
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/document-vision-reader.XXXXXX")"
```

Inside that directory, keep deterministic names such as:

- `page-001.png`
- `page-002-top.png`
- `slide-004-notes.png`
- `sheet-budget-row-01.png`

Do not write temporary screenshots into the user's project unless they explicitly ask for that.

### 3) Render the document into screenshots

Use the most reliable renderer available for the source format.

- PDFs or scans: render requested pages to images first, then inspect those images.
- DOCX/PPTX/XLSX and similar office files: open a rendered view and capture screenshots from the visual output rather than trusting raw XML/text extraction.
- Existing images: copy or convert into a readable PNG/JPEG only when needed.
- Large pages or dense tables: use multiple crops instead of shrinking the entire page until text becomes unreadable.

Prefer format-specific helper skills when they improve rendering fidelity:

- `pdf` for PDF page handling
- `doc` for Word-like documents
- `pptx` for slides
- `spreadsheet` for sheets/tables
- `screenshot` for OS-level capture when no direct renderer is available

If rendering tooling is missing, stop and ask for the minimal set of screenshots or pages needed.

### 4) Verify screenshot legibility before reading

Check every capture before extracting facts.

- Zoom or recapture if body text is not comfortably readable.
- Split one dense page into multiple overlapping crops when needed.
- Keep labels, units, headers, and nearby notes in frame so interpretation stays grounded.
- If a section is truncated or hidden, do not infer the missing content.

Use `references/legibility-checklist.md` when a page is crowded or the answer depends on small details.

### 5) Read screenshots as images

Read the screenshots with image-capable tools only after the captures are ready.

- Inspect the actual rendered content, not an assumed underlying text layer.
- Treat handwriting, highlights, annotations, stamps, signatures, and color coding as first-class evidence when visible.
- For tables, verify row/column alignment from the image before extracting values.
- For multi-page answers, track which screenshot supports each claim.

When the answer depends on multiple screenshots, reconcile them explicitly instead of paraphrasing from memory.

### 6) Answer the user's request

In the response:

- answer the requested task directly
- note which screenshots/pages were used
- call out any uncertain or unreadable sections
- distinguish visible facts from interpretation

If the user asked for extraction, structure the output so it can be checked against the screenshots.

### 7) Clean up temporary files

After the answer is prepared:

- delete the temporary screenshot directory by default
- keep it only when the user explicitly wants the screenshots, a reusable artifact, or a debugging trail
- if cleanup fails, report the leftover path so it can be removed later

## Decision Rules

- Prefer screenshot reading whenever visual layout changes meaning.
- Prefer this skill for rendered non-plain-text files such as PDF and PPT/PPTX.
- Do not use this skill when a plain-text source can be read directly without losing meaning.
- Prefer the smallest sufficient capture set; avoid screenshotting an entire long document when the user only asked about one section.
- Prefer multiple readable crops over one unreadable full-page image.
- Never invent text hidden outside the visible capture.
- If screenshots and extracted text disagree, trust the visible screenshot and mention the mismatch.

## Output Checklist

Before finishing, confirm all of the following:

- the requested pages/regions were actually captured
- the screenshots were legible enough for the requested task
- the final answer is grounded in visible content
- uncertainty or occlusion is disclosed
- temporary artifacts were deleted or intentionally preserved

## Resources

- `references/rendering-guide.md`: format-by-format screenshot staging guidance.
- `references/legibility-checklist.md`: quick quality gate for readable visual extraction.
