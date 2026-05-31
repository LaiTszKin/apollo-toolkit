---
name: review
description: Reviews spec-related code changes across six dimensions and produces a structured review report (REPORT.md) with findings only — no fix suggestions. Not for non-spec changes, direct code modification, or contexts without a spec.
---

## Goal

Produce a spec-change review report (REPORT.md).
First answer: "Does this change satisfy the planned business requirements?"
Then supplement with boundary, security, and code quality findings.
Every critical requirement must have a traceable status judgment, evidence location, gap description, and remaining uncertainty.

**This skill outputs findings only — no fix plans.** Fix planning is handled by the `qa` skill.

## Acceptance Criteria

- REPORT.md is generated, covering 6 review dimensions
- REPORT.md contains only: verdict, findings list (P0-P3), requirement status summary
- No fix suggestions, root cause analysis, or verification methods
- Every finding is traceable to a SPEC.md requirement
- When the verdict is "Ready to Merge", every requirement is confirmed satisfied
- When the verdict is "Needs Work", at least one requirement is confirmed NOT satisfied

## Workflow

### 1. Parse Requirements and Establish Review Scope

Read the specified SPEC.md and parse all requirements:
- Each `### Requirement N` is an independent review unit
- Sub-items under a requirement are part of the same unit — do not create separate subagents

Using each requirement's implementation scope and affected files (from DESIGN.md), locate and read the relevant code changes.

### 2. Dispatch Per-requirement Subagents

Create one subagent per requirement (Requirement N). All subagents can run in parallel.

**If a previous REPORT.md exists**: Condense its verdict and key findings into one history entry. Prepend it to the Review History section, keeping all past rounds. Then perform a fresh review — do not let prior results bias the new assessment.

Each subagent's task:

1. Locate the relevant code for the requirement's implementation scope
2. Review the code across the following 6 dimensions:
   - **Hallucinated code**: Features or logic not defined in the spec
   - **Redundant code**: Unused variables, functions, or duplicated implementations
   - **Spec implementation deviation**: Code behavior inconsistent with the spec
   - **Spec implementation omission**: Spec requirements not implemented
   - **Architecture defect**: Violations of DESIGN.md's architecture
   - **Performance concern**: Obvious performance issues
3. Classify each finding using the severity scale below
4. Report findings scoped to the requirement

**Severity scale** — defined by impact on **requirement satisfaction**:

| Level | Definition | Verdict Implication |
|---|---|---|
| **P0 — Requirement Blocked** | Requirement not implemented, behavior fundamentally deviates from spec, or hallucinated code exists. This finding directly means at least one requirement is **NOT** satisfied. | → Needs Work |
| **P1 — Requirement Defect** | Functionality exists but behaves incorrectly under specific conditions, or edge cases are unhandled. This finding means at least one requirement is only **PARTIALLY** satisfied. | → Needs Work |
| **P2 — Requirement Risk** | Functionality is correct but there are potential risks (architecture deviation, security weakness, performance bottleneck). This finding does **NOT** affect current requirement satisfaction. | → Needs Attention |
| **P3 — Suggestion** | Functionality is fully correct. Code can be improved but nothing is blocking. This finding does **NOT** affect any requirement's satisfaction. | → Ready to Merge |

If the same code corresponds to multiple requirements, cross-agent findings are handled in the synthesis phase.

### 3. Synthesize Review Results

Collect all subagent findings and synthesize:

1. **Dedup overlapping findings**: Merge identical issues found by multiple agents into a single finding. Preserve dimension-specific notes from each agent.
2. **Resort by severity**: Reorder all findings by P0 → P3 across the entire list (not per-agent order).
3. **Collapse empty severity levels**: If a severity level has zero findings, do NOT generate its table header or column labels.
4. **Cross-requirement interaction check**: Identify code introduced for one requirement that modifies shared modules or data structures used by another requirement. Flag these as potential interaction risks (P2).
5. **Conditional dimension summary**: If total findings exceed 5, include a one-line summary of finding counts per dimension. Otherwise omit — the findings table itself is sufficient.

### 4. Generate REPORT.md

Use `assets/templates/REPORT.md` and populate accordingly.

Include the following sections:
- **Verdict**: Ready to Merge / Needs Attention / Needs Work
- **Requirement Status Summary**: Per-requirement: completion status, evidence location, open findings
- **Findings**: Issue list sorted by P0 → P3 (only levels with findings)
- **Review History**: Previous rounds (if any)

**Verdict criteria** (P-level directly determines verdict — no separate requirement check needed):

| Condition | Verdict |
|---|---|
| Has P0 or P1 findings | Needs Work |
| No P0/P1, has P2 findings | Needs Attention |
| Only P3 or no findings | Ready to Merge |

The verdict is derived directly from the severity of findings. P0 and P1 are defined as "requirement not satisfied" — if they exist, the review must fail. If only P3 exists, requirements are satisfied and no P3 finding can block a merge.

**The report must NOT contain** fix suggestions, root cause analysis, or verification methods. These are handled by the `qa` skill.

## References

- `references/create-review-report.md` — `apltk create-review-report` CLI tool parameters
- `assets/templates/REPORT.md` — review report template
- `references/halluciation-review-instruction.md` — hallucinated code review guidelines
