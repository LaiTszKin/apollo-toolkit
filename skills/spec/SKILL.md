---
name: spec
description: Transforms user requirements into strictly-scoped business specification documents (SPEC.md). Must dispatch subagents to research the repository before writing (skippable for greenfield repos). Produces batch specs when requirements exceed 5 BDD items. Not for discussion without PROPOSAL.md, nor for single-file changes that don't need a spec.
---

## Goal

Transform user requirements into pure business specifications (SPEC.md).
Answer only "what business goal to achieve" and "what is in/out of scope" — no technical implementation.

Technical architecture (design, dependencies, validation strategy) belongs to the `design` skill.
Execution methodology (task breakdown, coordination routing) belongs to the `plan` skill.

**Core differentiator**: SPEC.md must be grounded in the actual repository state. Every requirement's scope and boundary must align with existing code.

## Acceptance Criteria

- SPEC.md follows the template format strictly
- SPEC.md includes: clear business goal, scope (In/Out), BDD behaviors, error and edge cases, clarification questions
- SPEC.md References section cites key code file paths affected by the requirements
- High-uncertainty requirements are marked with Uncertainty Level and reflected in Clarification Questions
- For non-greenfield repos: `apltk codegraph` survey completed, subagent repo research complete, and every requirement's boundary calibrated against the actual code
- Single spec generated at `docs/plans/<YYYY-MM-DD>/<spec_name>/SPEC.md` or batch spec generated at `docs/plans/<YYYY-MM-DD>/<batch-name>/<spec_name>/SPEC.md`

## Workflow

### 1. Survey the Repo with CodeGraph

Before reading requirements, use `apltk codegraph` to deeply understand the repo.

**Greenfield repo (no existing code)**: Skip this step. Proceed to Step 2.

**Non-greenfield repo**:

1. Run `apltk codegraph survey --json` to get entry points, function clusters, and cross-boundary edges across the project
2. Use `apltk codegraph list-apis` to review API directory — function names, file paths, callers — in modules potentially affected by the requirements
3. Use `apltk codegraph explore` or `apltk codegraph search` to dig into specific areas of interest

Consult `references/codegraph.md` for detailed flags.

**Purpose of this step**: Establish code-level understanding of module boundaries, existing APIs, and data structures BEFORE reading requirements. This ensures every BDD requirement is scoped correctly against real code.

### 2. Read PROPOSAL.md and Understand Requirements

Analyze the user's requirements from the PROPOSAL.md.

**Bridge from Step 1**: Compare codegraph findings against PROPOSAL.md. If the actual code contradicts or constrains what PROPOSAL.md describes, note these calibrations explicitly — they represent the core value the spec skill adds over simple template filling.

For complex repos, dispatch multiple subagents in parallel to deeply investigate:
- Affected modules and their responsibility boundaries
- Existing data structures and persistence patterns
- Existing API contracts and call relationships
- Existing features that overlap or conflict with the requirements

Document findings for the next step.

### 3. Refine, Combine, Split Requirements into BDD

Transform requirements into clearly-bounded BDD business requirements (GIVEN/WHEN/THEN). Use your codegraph findings from Step 1 and research from Step 2 to correctly scope each requirement.

Process:
- **Refine**: Convert vague descriptions into precise BDD behavior statements
- **Combine**: Merge related requirements into coherent BDD items (avoid fragmentation)
- **Split**: Separate oversized requirements into independently verifiable BDD items

**Output structure decision**:
- Total BDD items **≤ 5**: Produce a single SPEC.md
- Total BDD items **> 5**: Must create a batch spec

Batch spec structure:
- Under `docs/plans/{YYYY-MM-DD}/{batch_name}/`, create one subdirectory per group of 3-5 related requirements
- Each subdirectory has its own SPEC.md, independently understandable and executable
- Group related requirements together (same business flow, same user role); unrelated requirements go to separate SPEC.md files
- No coordination.md needed — coordination strategy is defined in the `plan` phase's PROMPT.md

For each requirement, mark **Uncertainty Level**:
- **Known Domain**: Team has experience with the technology or business domain; low risk
- **Exploratory Domain**: Team is unfamiliar or depends on external systems; mark high uncertainty
- High-uncertainty requirements must be reflected in Clarification Questions; suggest a spike/prototype if warranted

Define:
- **In Scope**: What this change includes
- **Out of Scope**: What is explicitly excluded (prevents over-implementation)
- **Error and Edge Cases**: Cover the following five categories:
  1. Authorization boundaries (who can or cannot act)
  2. Data boundaries (input length, type, uniqueness, format)
  3. External dependency anomalies (API failure, timeout, degraded response)
  4. Abuse scenarios or invalid state transitions
  5. Failure handling (exceptions, recovery strategy)
- **Clarification Questions**: Required when any requirement is marked Exploratory. List specific items that need user confirmation. Omit only if all requirements are Known AND completely unambiguous.

If a requirement remains unclear after research and it affects scope definition, record it and wait for the user's answer before proceeding.

### 4. Generate SPEC.md

Generate SPEC.md using the template at `assets/templates/SPEC.md`.

1. Create the output structure:
   ```
   apltk create-specs <feature_name> [--batch-name <name>]
   ```
   - Single spec: `docs/plans/{YYYY-MM-DD}/{feature_name}/SPEC.md`
   - Batch: `docs/plans/{YYYY-MM-DD}/{batch_name}/{feature_name}/SPEC.md`

2. Fill in each section of the generated template:
   - **Goal** → One sentence from the PROPOSAL.md's Problem Statement and your research context. State the business goal, not the implementation.
   - **Scope (In/Out)** → Directly from Step 3. Be precise: ambiguous boundaries cause scope creep.
   - **Functional Behaviors** → One BDD block per requirement from Step 3.
   - **Uncertainty Level** → Per requirement, mark Known or Exploratory.
   - **Error and Edge Cases** → List specific cases. Free-form list; no fixed categories needed in the template (the five categories from Step 3 guide your thinking, not the output format).
   - **Clarification Questions** → List questions for the user. Must be populated when any requirement is Exploratory. Omit only if all requirements are fully clear.
   - **References** → Cite key code file paths affected by the requirements, plus project context files and official docs. The code file paths serve as traceability anchors linking requirements to actual code.

   **BDD writing guidelines**:
   - **GIVEN** states the precondition and actor role
   - **WHEN** describes the trigger action (user action or system event)
   - **THEN** describes an observable, verifiable outcome
   - Add AND lines as needed — there is no fixed count
   - Each requirement must be independently testable
   - Do not include technical implementation details in any BDD step

3. If creating a batch spec, repeat the template-filling process for each group of requirements, producing one SPEC.md per group.

### 5. Pre-delivery Verification

Before delivering, verify all of the following. Fix any issues found before proceeding.

- **BDD verifiability**: Every requirement has a clear verification condition — THEN is observable and specific, not vague or qualitative
- **Scope clarity**: In Scope and Out of Scope are unambiguous and do not overlap
- **Error case completeness**: All five categories from Step 3 are substantively covered (individual cases, not category names)
- **Uncertainty reflected**: High-uncertainty requirements are marked Exploratory AND mentioned in Clarification Questions
- **Internal consistency**: No contradictions or overlaps between requirements
- **Code traceability**: References section cites specific code file paths that each requirement maps to
- **CodeGraph data used**: Boundary scoping decisions reference codegraph findings (what exists vs what needs to be built)

Only deliver SPEC.md to the user after passing self-review.

## Examples

- "Build a web-based Texas Hold'em game" → CodeGraph survey to check for existing game engine → 4 BDD items (deal, bet, judge, chips). ≤5, single SPEC.md. → References cite game engine code paths
- "Rewrite the user system: register, login, permissions, password reset, 2FA, session management" → CodeGraph survey of existing auth modules → 6 BDD items. >5, batch spec: Auth spec (register, login, password reset — 3 items) and Security spec (permissions, 2FA, sessions — 3 items). → References cite auth module code paths

## References

- `assets/templates/SPEC.md` — SPEC.md template, used in Step 3
- `references/create-specs.md` — CLI tool parameters for `apltk create-specs`
- `references/spec-quality-checklist.md` — external quality checklist (for human reference)
