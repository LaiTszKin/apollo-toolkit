---
name: plan
description: Converts SPEC.md + DESIGN.md + CHECKLIST.md into a self-contained coordinator prompt (PROMPT.md) with complete task decomposition, dependency analysis, batch scheduling, and pre-written worker prompts. The generated PROMPT.md is consumed directly by the implement skill.
---

## Goal

Transform business specifications (SPEC.md) and technical design (DESIGN.md + CHECKLIST.md) into a **coordinator prompt** (PROMPT.md).

This prompt defines a coordinator agent:
- The **main agent** only coordinates and supervises: reads tasks, dispatches workers, checks results, merges, verifies
- **Workers** handle implementation: each receives a pre-written self-contained task prompt and reports back

This skill is responsible for "planning the coordination strategy" — extracting information from SPEC/DESIGN/CHECKLIST, decomposing into concrete tasks, pre-writing worker prompts, and scheduling batch execution order.

## Acceptance Criteria

- `docs/plans/<YYYY-MM-DD>/<spec_name>/PROMPT.md` is produced and placed at the root of the spec or batch spec directory
- PROMPT.md is a **self-contained coordinator prompt**, containing:
  - Coordinator role definition (what to do, what not to do)
  - Task decomposition with dependency graph
  - Pre-written worker prompts for every dispatchable task (self-contained, ready to send)
  - Batch schedule with verification gates
  - Error recovery strategy
  - Boundary rules (ALWAYS / ASK FIRST / NEVER)

## Workflow

### 1. Identify Spec Type

Read the specified directory and determine the type:

- **Single Spec**: The directory contains one set of SPEC.md + DESIGN.md + CHECKLIST.md
- **Batch Spec**: The directory contains multiple subdirectories, each with its own SPEC.md + DESIGN.md + CHECKLIST.md

### 2. Read and Understand All Documents

Read all files thoroughly:
- `SPEC.md` — Business requirements and scope (BDD GIVEN/WHEN/THEN), In/Out of Scope
- `DESIGN.md` — Module architecture, interaction anchors (INT-###), external dependencies (EXT-###), system invariants, technical trade-offs
- `CHECKLIST.md` — Behavior-to-test mapping, hardening requirements, test level choices

### 3. Task Decomposition

Decompose the architecture design from DESIGN.md into tasks precise to the file or function level.

**Decomposition principles:**
- Each task corresponds to an independently verifiable outcome
- Task granularity: specific files and functions
- Each task defines a clear verification method
- Follow the interaction anchor order (INT-###) defined in DESIGN.md
- Follow the external dependency setup order (EXT-###) defined in DESIGN.md

**Decide whether each task needs an independent worker:**
- Touches ≥2 files → needs independent worker
- **No file overlap between tasks → workers may run in parallel.** This is permitted ONLY when file lists have ZERO overlap across all workers within the same batch. Any shared file between tasks means sequential execution — this is a hard constraint to prevent overwrite conflicts.
- File overlap or logical dependency between tasks → must run sequentially
- Purely procedural operations (lockfile update, merge, commit) → no worker needed; coordinator handles directly

### 4. Analyze Dependencies

#### 4a. Single Spec: Task-Level Dependency Analysis

Analyze dependencies between tasks:
- **Same-file dependency**: Multiple tasks touch the same file → must be sequential
- **Module dependency**: Task A's output is Task B's input → A before B
- **INT anchor order**: INT-### sequence constraints defined in DESIGN.md
- **EXT anchor order**: External dependency setup must precede consumption

Output: Task DAG → PROMPT.md Section 5 (Task Units).

#### 4b. Batch Spec: Spec-Level Dependency Analysis

Analyze dependencies between specs:
- Identify cross-spec dependencies from each DESIGN.md's interaction anchors
- Detect files shared between specs
- Identify module ownership overlap from each DESIGN.md's module list

Output: Spec DAG.

### 5. Detect File Overlap (Parallelism Gate)

File overlap detection is the **gate that determines parallelism**. Perform this across all task units:

1. Collect the file list each task unit is expected to modify
2. Compare file lists and mark overlaps — zero overlap is the **only** condition for parallel execution
3. Any file overlap at all → must be sequential. This is a hard constraint — never dispatch parallel workers for tasks sharing a file

### 6. Write Worker Prompts (One Per Dispatchable Task)

For each task that needs an independent worker, write a self-contained worker prompt. → PROMPT.md Section 6 (Worker Prompt Library).

Each worker prompt must include:

```
## Mission — What to do and why
## Input — Which files to read
## What to do — Concrete steps, each specifying the exact file path, the function or line range, and what specific change to make (add/delete/modify). Never leave the change description vague.
## Scope — Allowed and forbidden files
## Output — What to report on completion (file list, change summary, test results, risks)
## Verify — Verification commands and expected results
## Boundaries — Constraints (don't touch other workers' files, don't add dependencies, report blockers)
```

**Writing principles:**
- **Self-contained**: Workers do not see the coordinator's context. The prompt must include everything necessary
- **Concrete**: For every file the worker must modify, specify: (1) the exact file path, (2) the function or line range, (3) what to add, delete, or change. Do not write "fix it", "update as needed", or "based on your findings"
- **Declarative**: Describe "what to do", not "which tool to use"
- **Clear boundaries**: Explicitly list allowed and forbidden files

Tasks that do not need a worker (purely procedural operations) do not get a worker prompt. The coordinator handles these directly in the corresponding batch.

### 7. Create Batch Schedule

Based on dependency analysis and file overlap detection, build the batch schedule → PROMPT.md Section 7 (Batch Schedule).

**Batch partitioning principles (file overlap is the hard gate):**
- Within the same batch: tasks must have ZERO file overlap — only then may they dispatch workers in parallel. File-overlapping tasks must be placed in separate sequential batches regardless of dependency
- Between batches: the previous batch must complete and pass its gate before the next batch begins
- A final integration batch handles housekeeping tasks (lockfile update, final test suite)

### 8. Define Error Recovery Strategy

→ PROMPT.md Section 9 (Error Recovery).

- Worker failure: Retry with existing context (do not create a new worker), at most one retry
- After two failures: Pause the flow, preserve successful results from the same batch, notify the user
- Merge conflicts: Coordinator resolves them directly
- Test regression: Pause and report to the user

### 9. Set Boundaries

→ PROMPT.md Section 10 (Boundaries).

- **ALWAYS**: Run gate verification after every batch, extract worker prompts verbatim from Section 6, digest results before deciding next step
- **ASK FIRST**: Modify files not defined in SPEC/DESIGN, add new dependencies, two worker failures, regression with unclear cause
- **NEVER**: Coordinator edits source code directly, workers spawn sub-workers, skip verification, issue vague instructions

### 10. Fill PROMPT.md Sections

Use `assets/templates/PROMPT.md`. Fill each section according to the table below.

| Section | Content Source |
|---------|---------------|
| 1. Your Role | Fixed template (no modification needed) |
| 2. Mission | SPEC.md Goal + business value |
| 3. Scope & Boundaries | SPEC.md In/Out of Scope |
| 4. Technical Context | DESIGN.md: module list with responsibilities, interaction anchors (INT-###) and dependency order, external dependency setup order (EXT-###), system invariants, technical decisions and trade-offs |
| 5. References | Important project context files (CLAUDE.md, AGENTS.md, architecture atlas, codegraph index) — reduces LLM search overhead |
| 6. Task Units | Step 3 (task decomposition) + Step 4 (dependency analysis) |
| 7. Worker Prompt Library | Step 6 — one entry per dispatchable task |
| 8. Batch Schedule | Step 7 (batch schedule) |
| 9. Verification Checkpoints | CHECKLIST.md: behavior-to-test mapping (CL-###), hardening requirements, test execution commands |
| 10. Error Recovery | Fixed template — populate spec-specific test commands from CHECKLIST.md |
| 11. Boundaries | Fixed template + spec-specific rules (including worktree cleanup after each batch) |

### 11. Pre-delivery Self-Review

Before delivering PROMPT.md, verify all of the following.

**Worker prompt quality:**

- Every worker prompt in Section 7 is self-contained. Scan for phrases like "based on your findings", "fix it appropriately", "as discussed above" — these leak shared context assumptions. If found, rewrite the prompt to include the necessary information inline.
- Every worker prompt has a concrete file-level Scope (allowed + forbidden files listed explicitly).
- Every worker prompt has a concrete Verify command with an expected output (not just "run tests").

**Coverage completeness:**

- Every BDD requirement from SPEC.md is addressed by at least one task in Section 6. If a requirement has no task, add one or document why it is already satisfied by existing code.
- Every module from DESIGN.md has a corresponding task or is explicitly noted as unchanged.
- Every hardening requirement from CHECKLIST.md appears in Section 9.

**Structural consistency:**

- Each task's Depends on field in Section 6 matches the batch ordering in Section 8. No task scheduled in a batch before its dependencies are met.
- Every task listed in Section 8 (Batch Schedule) has a worker prompt in Section 7 — unless it is explicitly marked as coordinator-handled.
- No orphaned tasks (a task listed in Section 6 that never appears in any batch), no missing dependencies (a Depends on field referencing a task ID that does not exist).

### 12. Produce PROMPT.md

Place the PROMPT.md at the root of the spec or batch spec directory.

## Examples

- "Generate a coordinator prompt for a single spec" → Read SPEC.md + DESIGN.md → Decompose into 3 tasks → T1.1 and T1.2 have no file overlap → parallel → Write worker prompts for each → Schedule: Batch 1 parallel T1.1+T1.2 → Batch 2 T1.3 → Output PROMPT.md
- "Generate a coordinator prompt for a batch spec with 4 specs" → Read all SPEC.md + DESIGN.md → Build spec DAG → Detect cross-spec file overlap → Schedule batches → Write worker prompts for each spec's task units → Output PROMPT.md
- "Two tasks modify the same file" → Assign to different batches, each with an independent worker prompt, sequential execution

## References

- `assets/templates/PROMPT.md` — PROMPT.md template
