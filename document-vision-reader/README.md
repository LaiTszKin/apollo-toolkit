# Document Vision Reader

A visual-reading skill for non-plain-text files that should be checked from their rendered appearance instead of raw text extraction.

## What this skill does

- Creates a temporary screenshot workspace for the target file.
- Converts or captures the requested pages/regions into temporary images.
- Reads those images as the evidence source.
- Answers user requests such as summaries, transcription, field lookup, table extraction, comparison, and translation from the visible content.
- Cleans up temporary screenshots by default after the answer is prepared.

## Best-fit use cases

- scanned PDFs
- rendered PDF files
- rendered PPT/PPTX slides
- receipts, invoices, and forms
- slide decks with annotations or visual emphasis
- documents where highlights, layout, handwriting, or stamps matter
- spreadsheets where merged cells or formatting affect meaning
- files whose text extraction is unreliable
- not plain-text files whose meaning depends on visual rendering

## Repository layout

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
└── references/
    ├── legibility-checklist.md
    └── rendering-guide.md
```

## Usage

```text
Use $document-vision-reader to inspect this non-plain-text file by turning its rendered pages into temporary screenshots, reading the screenshots as images, and answering from the visible content only.
```

Example requests:

```text
Use $document-vision-reader to inspect pages 3-5 of this scanned PDF, extract the totals table, and flag any handwritten notes.
```

```text
Use $document-vision-reader to capture the rendered slides of this PPTX as temporary screenshots, read them visually, and tell me whether the key metrics on slide 7 match slide 12.
```

## Output expectations

A good result should include:

1. the direct answer to the user's request
2. which screenshots/pages were used
3. any visibility limits or unreadable regions
4. whether the temporary screenshot directory was removed or preserved

## License

MIT. See `LICENSE`.
