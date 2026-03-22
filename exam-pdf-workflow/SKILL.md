---
name: exam-pdf-workflow
description: Create, typeset, and grade exam-style PDF deliverables for study workflows. Use when the user asks to read lecture or exam PDFs, generate mock exams, produce matching solution books, render math-heavy content with KaTeX, or grade completed answer-book PDFs into a scored graded PDF.
---

# Exam PDF Workflow

## Dependencies

- Required: `pdf` for reading source PDFs, rendering deliverables, and final PDF QA.
- Conditional: `document-vision-reader` when handwritten answers, scanned pages, or layout-sensitive grading require visual inspection instead of raw text extraction.
- Conditional: `katex` when the output contains mathematical notation that should be rendered instead of left as raw TeX/plain text.
- Optional: none.
- Fallback: If `pdf` is unavailable, stop and report the blocked dependency instead of improvising a text-only workflow.

## Standards

- Evidence: Read the actual source PDFs and answer-book pages first, and verify any referenced file path against the filesystem before acting.
- Execution: Decide the task mode first, extract the needed source content, produce the full deliverable set for that mode, then inspect rendered PDFs before finishing.
- Quality: Treat solution books, math rendering, layout cleanup, and graded-PDF output as default completion criteria when the task implies them; do not leave raw TeX, ambiguous scoring, or unverified PDF layout behind.
- Output: Save only the requested final PDFs in the target folder and report the exact output paths plus grading or coverage notes.

## Overview

Use this skill for study-material workflows where PDFs are both the input and the final deliverable. The skill covers source reading, mock-exam authoring, solution generation, math typesetting, handwritten-answer grading, and graded-PDF production.

## Workflow

### 1) Confirm the real input/output paths

- Verify every user-mentioned PDF path on disk before reading it.
- If the named file is missing but a clearly matching nearby file exists, switch to the real file and state the exact path used.
- Confirm the target output folder before rendering; create it only when the task requires writing deliverables.

### 2) Choose the task mode

Pick one primary mode, and combine modes when the user asks for a package:

- `source-summary`: read lecture slides, past papers, or error books and extract study notes.
- `mock-exam`: create a new exam paper modeled on source material or user weaknesses.
- `solution-book`: produce worked solutions for an exam paper.
- `grading`: mark a completed answer book and write scores back into a graded PDF.
- `typesetting-refresh`: improve layout, rebuild formulas with KaTeX, or clean up an existing PDF package.

### 3) Read source materials first

- Use `pdf` to extract the source exam, lecture slides, marking scheme, error book, or answer book.
- When the source is handwritten, scanned, or visually complex, use `document-vision-reader` so judgments come from the rendered page rather than noisy OCR alone.
- Base the output on the actual source artifacts; do not invent syllabus scope, notation, or marking rules when the source does not support them.

### 4) Produce the complete deliverable set for the chosen mode

#### `mock-exam`

- Build the paper around the user's weak topics or the patterns visible in the source materials.
- Match the source paper's structure, tone, and sectioning closely enough to feel familiar without copying it verbatim.
- Unless the user explicitly says otherwise, also produce a matching `solution-book` as part of the same task.

#### `solution-book`

- Give full working, not answer-only stubs.
- Keep notation and variable names aligned with the paired exam paper.
- Use concise marking-friendly steps so the solution can also act as the grading reference.

#### `grading`

- Establish or derive the answer key before assigning scores.
- Judge each question from the rendered student pages, not from OCR fragments alone when handwriting matters.
- Write per-question scores and the total score into a new graded PDF rather than only reporting marks in chat.
- If any page is unreadable or ambiguous, say so explicitly and grade conservatively with a short note.

#### `typesetting-refresh`

- Improve spacing, pagination, headings, and section breaks so the PDF reads like a clean exam handout.
- Rebuild all mathematical expressions through `katex` when formulas appear.
- Do not leave raw TeX, ASCII approximations, or partially rendered formulas in the final PDF.

### 5) Render math correctly

- When the output includes formulas, invoke `katex` and render the expressions before PDF export.
- Use display math for multi-step derivations and dense formulas; use inline math only for short expressions.
- After rendering, visually verify representative pages so symbols, superscripts, fractions, and brackets display correctly.

### 6) Run PDF visual QA before finishing

- Open the rendered PDFs and inspect representative pages.
- Always check:
  - the first page
  - one page with dense mathematics
  - one page with longer prose or worked solutions
  - any page with grading annotations when in `grading` mode
- Confirm that layout is readable, formulas are fully rendered, page breaks are sensible, and annotations are visible.
- Revise and re-render if math, spacing, or score overlays are unclear.

## Default completion rules

- If the user asks for a mock exam, default to delivering both the exam PDF and its solution PDF.
- If the user asks to improve exam formatting and the paper contains formulas, default to KaTeX-rendered math.
- If the user asks for grading, default to a new graded PDF with visible marks plus a chat summary of per-question scores.
- If the task is read-only, do not modify files; provide notes only.

## Output rules

- Keep filenames explicit and stable, for example `... Mock Test.pdf`, `... Solution.pdf`, or `..._graded.pdf`.
- Store outputs in the user-requested folder when one is given; otherwise reuse the source document's nearby study-material folder.
- Report the exact final PDF paths and any unresolved ambiguity, such as unreadable handwriting or missing marking guidance.
