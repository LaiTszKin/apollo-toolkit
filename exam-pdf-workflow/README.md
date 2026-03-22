# Exam PDF Workflow Skill

## Brief Introduction

An agent skill for study-material workflows that read source PDFs, generate mock exams and worked solutions, render math with KaTeX, and grade completed answer-book PDFs into scored graded PDFs.

## Problems this skill solves

Use this skill when:

- lecture slides, past papers, or error books need to be turned into study notes or a new mock exam
- an exam PDF needs a matching solution book by default
- math-heavy PDFs need clean KaTeX-rendered formulas instead of raw TeX/plain text
- handwritten or scanned answer books need visual grading and a graded PDF output
- an existing exam PDF package needs layout cleanup before delivery

## Invocation rule

Invoke this skill when the request involves exam-style PDFs, question books, answer books, lecture-slide study packs, grading, or math-heavy educational PDF generation.

## Core method

1. Verify the real source and output paths.
2. Read the source PDFs and choose the task mode.
3. Produce the full deliverable set for that mode.
4. Render formulas with KaTeX when math appears.
5. Visually inspect the final PDFs before finishing.

## Typical deliverables

- Mock exam PDF
- Worked solution PDF
- Graded answer-book PDF
- Study-note summary extracted from lecture/exam PDFs

## License

This project is licensed under the [MIT License](LICENSE).
