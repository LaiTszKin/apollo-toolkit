# Issue Type Schemas

## Problem

Required sections:
- `problem-description`
  - `Expected Behavior (BDD)`: `Given / When / Then` for what the program should do.
  - `Current Behavior (BDD)`: `Given / When / Then` for what the program does now.
  - `Behavior Gap`: a short explicit comparison of the observable difference and impact.
  - Include the symptom, impact, and key evidence alongside the behavior diff; do not leave the mismatch implicit.
- `suspected-cause`
- `reproduction` (optional)

If reproduction is missing, insert the default non-reproducible note in the target issue language.

## Feature

Required sections:
- `proposal` (optional; defaults to title when omitted)
- `reason`
- `suggested-architecture`

## Performance

Required sections:
- `problem-description`
- `impact`
- `evidence`
- `suggested-action`

## Security

Required sections:
- `problem-description`
- `severity`
- `affected-scope`
- `impact`
- `evidence`
- `suggested-action`

## Docs

Required sections:
- `problem-description`
- `evidence`
- `suggested-action`

## Observability

Required sections:
- `problem-description`
- `impact`
- `evidence`
- `suggested-action`
