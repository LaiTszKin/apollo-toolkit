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

Using each requirement's implementation scope and affected files (from DESIGN.md), the subagents dispatched in the next step will locate and read the relevant code changes.

### 2. Dispatch Per-requirement Subagents

**Mandatory: one agent per requirement.** Every `### Requirement N` must have its own dedicated review agent. Never merge requirements or skip any requirement. All subagents can review source code in parallel.

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

### 3. Identify Cross-requirement Connections

After all per-requirement subagents have completed, analyze the collected findings and requirement scopes to detect interactions:

- **Shared modules**: Multiple requirements touch the same code modules or utilities
- **Shared data structures**: Multiple requirements read/write the same data structures or state
- **Functional coupling**: One requirement's output feeds into another's input path
- **Same-file modifications**: Multiple requirements modify the same file (merge conflict risk)
- **Findings cross-references**: Individual agents flagged code that affects multiple requirements

Group connected requirements into **Requirement Groups**:

- Two requirements are connected if they share any interaction type above
- Connections are transitive: if A connects to B and B connects to C, all three form one group
- An isolated requirement (no connections to any other) is its own group of size 1

Output: Requirement Groups list, each with:
- Grouped requirement IDs
- Interaction type (shared module, shared data, functional coupling, file overlap)
- Interaction summary for group-level review

### 4. Dispatch Group Subagents

Create one review agent per Requirement Group. Each group agent reviews the **interactions between requirements** within its group:

1. Read the individual review findings for all requirements in the group
2. Focus on interaction-level concerns:
   - **Interface mismatch**: One requirement's output consumed by another — does the contract align?
   - **Side effect risk**: Changes for one requirement break assumptions of another
   - **Merge conflict potential**: Same-file modifications require careful ordering
   - **Architecture consistency**: Combined changes maintain DESIGN.md integrity
3. Classify interaction findings using the same severity scale (P0-P3)
4. Report findings scoped to the group interaction

### 5. Synthesize Review Results

Collect findings from both per-requirement and group subagents:

1. **Dedup overlapping findings**: Merge identical issues found by multiple agents into a single finding. Preserve dimension-specific notes from each agent.
2. **Resort by severity**: Reorder all findings by P0 → P3 across the entire list.
3. **Collapse empty severity levels**: If a severity level has zero findings, do NOT generate its table header or column labels.
4. **Include group-level findings**: Cross-requirement interaction findings sit alongside individual findings.
5. **Conditional dimension summary**: If total findings exceed 5, include a one-line summary of finding counts per dimension. Otherwise omit.

### 6. Generate REPORT.md

Use `assets/templates/REPORT.md` and populate accordingly.

Include the following sections:
- **Verdict**: Ready to Merge / Needs Attention / Needs Work
- **Requirement Status Summary**: Per-requirement: completion status, evidence location, open findings
- **Findings**: Issue list sorted by P0 → P3 (only levels with findings)
- **Review History**: Previous rounds (if any)
- **References**: List important project context files the next skill (qa) will need (e.g., `CLAUDE.md`, `AGENTS.md`, `resources/project-architecture/**`). This reduces the LLM's need to search for relevant files when processing the report.

**Verdict criteria** (P-level directly determines verdict — no separate requirement check needed):

| Condition | Verdict |
|---|---|
| Has P0 or P1 findings | Needs Work |
| No P0/P1, has P2 findings | Needs Attention |
| Only P3 or no findings | Ready to Merge |

**The report must NOT contain** fix suggestions, root cause analysis, or verification methods. These are handled by the `qa` skill.

## References

- `references/create-review-report.md` — `apltk create-review-report` CLI tool parameters
- `assets/templates/REPORT.md` — review report template
- `references/halluciation-review-instruction.md` — hallucinated code review guidelines
