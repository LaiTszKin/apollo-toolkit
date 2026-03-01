---
name: learning-error-book
description: A learning-focused error-book workflow. When the user asks to summarize mistakes, the agent summarizes mistakes made while solving questions and generates/updates an error book in Markdown, rendered to PDF (depends on the pdf skill).
---

# Learning Error Book Skill

Goal: when the user asks to "summarize mistakes / summarize errors / compile an error book", **summarize mistakes with evidence** and **generate or update** an error book (Markdown -> PDF).

Dependencies:
- **Must use the `pdf` skill** when PDFs are involved (read/extract/OCR/split as needed).
- This skill expects a renderer script at `learning-error-book/scripts/render_markdown_to_pdf.py` to convert error-book Markdown to a PDF using a CJK-compatible font.

## Behavior Contract (GIVEN/THEN)

GIVEN the user asks to **summarize mistakes/errors**  
THEN the agent summarizes the user's mistakes made while solving questions  
AND generates or updates an **error book** that includes:
- Coverage scope (which question files / sources are included)
- Common mistake types overview
- Conceptual mistake highlights (definition, user's common misjudgment, cautions)
- Mistake-by-mistake analysis and solutions
  - For MC questions: explain why **each option** is wrong/right, and why the correct option is correct
AND the delivered error book must be a **PDF rendered from Markdown**, using fonts that properly render **Chinese text and Markdown symbols**.

## Trigger Conditions

Use this skill when the user intent matches:
- "summarize mistakes", "what did I do wrong", "compile error book", "review wrong answers"
- user provides question files (often PDFs) and asks to summarize mistakes

## Inputs (Facts You Must Collect)

Before writing anything, ensure you have enough facts (do not guess):
- Question source: file paths (PDF), or pasted text/screenshots, or question id/page number
- User's attempt: chosen option / written answer, and their reasoning (if available)
- Correct answer and explanation: extract from the PDF if present; otherwise ask the user to provide it

If the PDF is scanned/image-based and text extraction fails:
- Use the `pdf` skill to attempt OCR (if available)
- If OCR is not possible, request pasted text or screenshots (minimum: stem + options/sub-questions)

## Output Spec (Required Sections)

The error book must contain:
1) **Coverage Scope**: which question files/sources are included (with paths; include page/question ids when available)
2) **Common Mistake Types Overview**: 3-8 categories (concept misunderstanding, misreading conditions, derivation/calculation error, option traps, etc.), with representative questions
3) **Conceptual Mistake Highlights** (per concept):
   - Definition (precise and actionable)
   - User's common misjudgment (mapped to concrete mistakes)
   - Cautions / checklists to avoid repeating the mistake
4) **Per-Question Mistake & Solution**:
   - Traceable locator: file + page/question id
   - User answer vs correct answer
   - Why it's wrong (link back to mistake type + concept)
   - Correct solution (step-by-step)
   - For **MC**: explain why **each option** is wrong/right, and why the correct option is correct

Formats:
- Editable source: `error_book/error-book.md` (Markdown)
- Deliverable: `error_book/error-book.pdf` (PDF rendered from Markdown)

## Recommended File Layout (Keep It Consistent)

```
error_book/
  error-book.md
  error-book.pdf
  sources/          # optional: shortcuts/copies/list of source PDFs
```

## Workflow (Required)

1) **Determine coverage**
   - If the user provided files/question ids: add them to Coverage Scope
   - If not: search the workspace for relevant PDFs and confirm with the user

2) **Extract question text + answers/explanations (extract when possible)**
   - Use the `pdf` skill (pypdf/pdfplumber/OCR as available)
   - If extraction fails, request user-provided text/screenshots

3) **Build an evidence table before writing**
   - For each question: locator, user answer, correct answer, mistake type, concept(s), explanation
   - Then map it into the required four sections

4) **Generate/update `error_book/error-book.md`**
   - If missing: start from `assets/error_book_template.md`
   - If exists: preserve existing content; append new mistakes; update Overview + Concepts sections

5) **Render Markdown -> PDF (CJK font support)**
   - Run:
     - `python3 learning-error-book/scripts/render_markdown_to_pdf.py error_book/error-book.md error_book/error-book.pdf`
   - If paper size/font needs change: adjust script flags (`--help`)

## Built-in Template

- `assets/error_book_template.md`: template for first-time creation

## Rendering Notes (Avoid Pitfalls)

- Supported Markdown subset: headings, lists, **bold**/**italic**, inline `code`, fenced code blocks
- For complex tables/math: prefer bullet lists + step-by-step derivations, or paste original content into the question section
