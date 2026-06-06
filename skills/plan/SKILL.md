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

Worker prompts are written to individual files under `<spec_dir>/plan/` (single spec) or `<batch_dir>/plan/` (batch spec) instead of inline in PROMPT.md. This keeps PROMPT.md focused on coordination strategy while each worker prompt is independently dispatchable.

## Acceptance Criteria

- `docs/plans/<YYYY-MM-DD>/<spec_name>/PROMPT.md` is produced and placed at the root of the spec or batch spec directory
- PROMPT.md is a **self-contained coordinator prompt**, containing:
  - Coordinator role definition (what to do, what not to do)
  - Task decomposition with dependency graph
  - Worker prompt index referencing `plan/*.md` files
  - Batch schedule with verification gates
  - Error recovery strategy
  - Boundary rules (ALWAYS / ASK FIRST / NEVER)
- Worker prompts are stored in `<spec_dir>/plan/*.md` or `<batch_dir>/plan/*.md`, one prompt per file
- PROMPT.md References section cites:
  - Worker prompt file paths (`plan/*.md`)
  - All code file paths that need modification across all tasks

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
- `<spec_dir>/references/` or `<batch_dir>/references/` — External method/API reference documents (name, purpose, parameters)

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
- **Workers may run in parallel only when BOTH conditions are met:** (1) file lists have ZERO overlap across all workers within the same batch, AND (2) no logical dependency exists between the tasks. If either condition is violated, the tasks must run sequentially.
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

### 5. Parallelism Gate (File Overlap + Logical Dependency)

File overlap detection and dependency analysis form the **dual gate that determines parallelism**. Parallel execution is only permitted when BOTH conditions are met:

1. Collect the file list each task unit is expected to modify
2. Compare file lists and mark overlaps — zero overlap is required for parallel execution. Any file overlap at all → must be sequential. This is a hard constraint — never dispatch parallel workers for tasks sharing a file.
3. Check for logical dependencies between task units — even with no file overlap, tasks that depend on each other's output must run sequentially.

### 6. Write Worker Prompts (One Per Dispatchable Task)

For each task that needs an independent worker, write a self-contained worker prompt. Save each prompt to a separate file under `<spec_dir>/plan/` or `<batch_dir>/plan/`.

**Worker prompt file naming**: `plan/T{batch}.{sequence}-{kebab-case-name}.md`

Use `assets/templates/WORKER_PROMPT.md`. The template follows the P1-P5 architecture:

| Section | Purpose (P#) |
|---------|--------------|
| 1. Mission & Rules | Goal + behavioral rules |
| 2. Context | Files to read, background knowledge |
| 3. Tasks | Concrete file-level instructions (file, line range, change) |
| 4. Verification | Commands and expected results |
| 5. Scope & References | Allowed/forbidden files, related references |

**Writing principles (move these to your process, not the template):**
- **Self-contained**: Workers do not see the coordinator's context. The prompt must include everything necessary. Do not rely on shared context or assume the worker has read other documents.
- **Concrete**: For every file the worker must modify, specify: (1) the exact file path, (2) the function or line range, (3) what to add, delete, or change. Do not write "fix it", "update as needed", or "based on your findings".
- **Declarative**: Describe "what to do", not "which tool to use".
- **Clear boundaries**: Explicitly list allowed and forbidden files. A worker should never need to guess which files it can modify.

Tasks that do not need a worker (purely procedural operations) do not get a worker prompt. The coordinator handles these directly in the corresponding batch.

### 7. Create Batch Schedule

Based on dependency analysis and file overlap detection, build the batch schedule → PROMPT.md Section 7 (Batch Schedule).

**Batch partitioning principles (file overlap and logical dependency are the hard gates):**
- Within the same batch: tasks must have ZERO file overlap AND no logical dependency — only then may they dispatch workers in parallel. Tasks with file overlap or logical dependency must be placed in separate sequential batches regardless.
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

- **ALWAYS**: Run gate verification after every batch, extract worker prompts verbatim from Section 7, digest results before deciding next step
- **ASK FIRST**: Modify files not defined in SPEC/DESIGN, add new dependencies, two worker failures, regression with unclear cause
- **NEVER**: Coordinator edits source code directly, workers spawn sub-workers, skip verification, issue vague instructions

### 10. Fill PROMPT.md Sections

Use `assets/templates/PROMPT.md`. Fill each section according to the table below.

| Section | Content Source |
|---------|---------------|
| 1. Your Role & Rules | Fixed template (Mission from SPEC.md Goal + business value; Boundaries + Error Recovery are fixed scaffold; add spec-specific rules) |
| 2. Context | SPEC.md In/Out of Scope + DESIGN.md: module list with responsibilities, interaction anchors (INT-###) and dependency order, external dependency setup order (EXT-###), system invariants, technical decisions and trade-offs |
| 3. Execution Plan | Step 3 (task decomposition) + Step 4 (dependency analysis) + Step 6 (worker prompts per `assets/templates/WORKER_PROMPT.md`) + Step 7 (batch schedule). Per-batch verification commands from CHECKLIST.md |
| 4. Final Verification | Fixed scaffold (meta-checks) |
| 5. References | Worker prompt file paths (`plan/*.md`), all code file paths that need modification across all tasks, project context files, related documents |

### 11. Pre-delivery Self-Review

Before delivering PROMPT.md, verify all of the following.

**Worker prompt quality:**

- Every worker prompt in `plan/*.md` is self-contained. Scan for phrases like "based on your findings", "fix it appropriately", "as discussed above" — these leak shared context assumptions. If found, rewrite the prompt to include the necessary information inline.
- Every worker prompt has a concrete file-level Scope (allowed + forbidden files listed explicitly).
- Every worker prompt has a concrete Verify command with an expected output (not just "run tests").
- Worker prompt filenames match their task IDs (`plan/T{batch}.{sequence}-*.md`).

**Coverage completeness:**

- Every BDD requirement from SPEC.md is addressed by at least one task in Section 3 (Task Units). If a requirement has no task, add one or document why it is already satisfied by existing code.
- Every module from DESIGN.md has a corresponding task or is explicitly noted as unchanged.
- Every hardening requirement from CHECKLIST.md appears in Section 4 (Final Verification) or in the Batch Schedule gates.

**Structural consistency:**

- Each task's Depends on field matches the batch ordering. No task scheduled in a batch before its dependencies are met.
- Every task listed in Batch Schedule has a worker prompt in `plan/*.md` — unless it is explicitly marked as coordinator-handled.
- No orphaned tasks (a task listed in Task Units that never appears in any batch), no missing dependencies (a Depends on field referencing a task ID that does not exist).
- Section 5 (References) lists all worker prompt paths and all code file paths.

### 12. Produce PROMPT.md and Worker Prompts

Place the PROMPT.md at the root of the spec or batch spec directory.
Place worker prompts in `<spec_dir>/plan/` or `<batch_dir>/plan/`.

## Examples

- "Generate a coordinator prompt for a single spec" → Read SPEC.md + DESIGN.md + references/ → Decompose into 3 tasks → T1.1 and T1.2 have no file overlap → parallel → Write worker prompts to `plan/` → Schedule: Batch 1 parallel T1.1+T1.2 → Batch 2 T1.3 → Output PROMPT.md + plan/*.md
- "Generate a coordinator prompt for a batch spec with 4 specs" → Read all SPEC.md + DESIGN.md + references/ → Build spec DAG → Detect cross-spec file overlap → Schedule batches → Write worker prompts to `plan/` → Output PROMPT.md + plan/*.md
- "Two tasks modify the same file" → Assign to different batches, each with an independent worker prompt in `plan/`, sequential execution → Reference both prompt paths in PROMPT.md

## References

- `assets/templates/PROMPT.md` — Coordinator prompt template
- `assets/templates/WORKER_PROMPT.md` — Worker prompt template (used in Step 6)
