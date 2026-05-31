---
name: optimise-skill
description: Applies prompt engineering to optimize agent skill SKILL.md files — reduces redundancy, separates behavioral guidance from format, aligns with proven methodology. Reads the target skill's full directory, analyzes its structure, and produces an optimized rewrite.
---

## Goal

Apply prompt engineering to optimize an agent skill's SKILL.md, reducing redundant expression and improving the agent's ability to understand and execute the skill effectively — without altering the skill's core purpose or deliverables.

## Acceptance Criteria

- The optimized skill's core deliverable and workflow are preserved
- Behavioral guidance resides entirely in SKILL.md — no behavioral rules in templates or reference files
- Templates (if any) contain format-only content — no "you should" instructions
- Reference files contain tool usage guidance only — not required reading unless the LLM needs specific CLI flags
- Token count is measurably reduced compared to the original (quantifiable by section/step count)
- Every step in the workflow serves a distinct purpose — no duplicate or overlapping steps
- Cross-file consistency is verified: no references to sections or fields that were removed or renamed

## Workflow

### 1. Read and Map the Skill

Read the skill's complete directory: SKILL.md, templates (assets/templates/), references (references/).

Identify:
- **Core deliverable**: What does this skill produce? Who consumes it?
- **Upstream inputs**: Which documents does this skill read from previous stages?
- **Downstream consumers**: Which documents does this skill produce, and which fields do consumers actually read?

### 2. Classify Every Section (Behavioral vs Format vs Tool)

For every section across SKILL.md, templates, and references, classify into one of three categories:

| Category | Definition | Must live in |
|----------|-----------|-------------|
| **Behavioral guidance** | Tells the agent what to do, how to think, what to check | **SKILL.md** |
| **Format guidance** | Shows the output structure | **Template** |
| **Tool guidance** | CLI flags, API parameters, external tool usage | **References** (indexed, optional lookup) |

**Common violations found during this step:**
- Template sections containing "do this" instructions (should be in SKILL.md)
- Reference files marked as "must read" that contain behavioral rules (should be in SKILL.md)
- SKILL.md describing file format details better left in a template

### 3. Trace the Consumption Chain

For each field in each template, trace who consumes it:

```
Field X in Template → Downstream skill Y reads it for decision Z
                   → Nobody reads it → dead weight, remove
```

Key questions:
- Is this column consumed by the downstream skill? Or is it just "nice to have"?
- Is this ASCII diagram duplicating information already in a structured field?
- Is this table expressing key-value pairs that would be clearer as natural language?

Common pruning targets:
- **ASCII dependency graphs**: Redundant with structured `Depends on` fields and batch schedules
- **Key-value tables**: Labels + values expressed as `| Field | Value |` — use natural language instead
- **File ownership tables**: Redundant with per-task `Files:` fields in task units
- **Speculative columns**: Fields that ask for predictions (symptoms, "how will it be modified") — remove

### 4. Detect Contradictions

Compare closely related rules across the skill's files:

- Does the SKILL.md say one thing and the template say another? (e.g., implement SKILL.md Step 4 vs PROMPT.md NEVER rule)
- Does a behavioral rule appear in both SKILL.md and a template, with slightly different wording?
- Does a downstream skill's assumption about document structure conflict with upstream changes?

### 5. Restructure

Apply changes to align with the three-layer separation:

**SKILL.md** — Restructure so all behavioral guidance is here. Ensure:
- Every step has a clear purpose, distinct from other steps
- No step duplicates decision logic already present in another step
- Self-review is included as its own step (for coordinator-type skills) or at the end of the last step

**Templates** — Strip to pure format:
- Remove all behavioral instructions ("do this", "check that", "write X when Y")
- Replace key-value tables with natural language
- Remove speculative columns (symptoms, predictions)
- Remove ASCII dependency graphs (redundant with structured fields)
- Conditionally collapse empty sections (don't generate table headers for P0 if no P0 findings)

**References** — Keep as optional lookup:
- No file marked "必讀" (must read) — the LLM reads them only if it needs specific CLI flags or definitions
- If a reference file contains behavioral guidance, move it to SKILL.md first

### 6. Verify Cross-File Consistency

Before finalizing, check:

- Every field referenced by a downstream skill still exists in the optimized output
- Section numbers and names referenced across files are updated to match changes
- No contradictions introduced between SKILL.md and templates
- All redundant files or sections removed

### 7. Self-Review

Confirm all acceptance criteria are met:

- [ ] Core deliverable preserved
- [ ] No behavioral guidance in templates
- [ ] No "required reading" references
- [ ] Token count measurably reduced
- [ ] No duplicate or overlapping steps
- [ ] Cross-file consistency verified
- [ ] All files translated to English (if the skill directory uses English naming conventions)

## Examples

- "A skill with a 7-step workflow where Step 3 duplicates Step 2's decision logic" → Identify the duplication → Merge the two steps → Prune an unnecessary reference file → Verify no downstream consumers reference the removed content
- "A skill whose template contains a behavioral blockquote in the history section" → Move the blockquote's instruction to SKILL.md → Keep only the format example in the template → If the instruction references a process already handled upstream, remove it entirely
- "A coordinator skill with a 12-step SKILL.md that reimplements the prompt's execution loop" → Strip all execution steps from SKILL.md → Keep only environment setup, commit, and reporting → Ensure the prompt template fully defines the missing behavior

## References

- `references/example_skill.md` — Example of an optimized skill structure (reference only, not required)
