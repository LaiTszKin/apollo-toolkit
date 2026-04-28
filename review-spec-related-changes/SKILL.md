---
name: review-spec-related-changes
description: Review recent or user-specified spec-related changes against the governing `docs/plans/...` spec documents, treat unmet business goals as the most severe findings, and then run code-practice cross-checks through `review-change-set`, `discover-edge-cases`, and `harden-app-security`. Use when users ask whether implemented work actually satisfies a spec, wants a spec compliance review, or asks to review changes related to recent or named planning documents.
---

# Review Spec Related Changes

## Dependencies

- Required: `review-change-set`, `discover-edge-cases`, and `harden-app-security` for code-affecting spec-related changes.
- Conditional: none.
- Optional: none.
- Fallback: If any required review dependency is unavailable for a code-affecting scope, stop and report the missing dependency instead of returning a partial pass.

## Standards

- Evidence: Read the governing spec documents, the related git changes, and the minimum implementation context before deciding whether the business goal was met.
- Execution: Resolve the spec scope first, review business-goal completion before any secondary code-practice review, then run the required review skills on the same implementation scope.
- Quality: Treat unmet or partially met business goals as the highest-severity findings, keep secondary edge-case/security/code-review findings outside the business-goal verdict, and avoid speculative issues that are not backed by code or spec evidence.
- Output: Return a prioritized issue list with business-goal gaps first, followed by edge-case, security, and code-review findings, each tied to specific spec and code evidence.

## Goal

Determine whether the implementation actually satisfies the relevant planning documents, then separately assess whether the related code is safe, robust, and maintainable.

## Scope Resolution

### User-specified spec documents

- If the user names a spec directory or file, read every governing document in that spec set, including `spec.md`, `tasks.md`, `checklist.md`, `contract.md`, `design.md`, and batch-level `coordination.md` when present.
- Treat the named spec documents as the authoritative business goal unless the repository contains a newer superseding plan that the user explicitly referenced.
- Map the spec to implementation changes using task entries, owned files, git diff paths, branch names, commit messages, and code references from the spec.

### Recent spec-related changes

- If the user asks for recent spec-related review without naming a spec, inspect the current git state first:
  ```bash
  git status -sb
  git diff --name-only
  git diff --cached --name-only
  ```
- Look for changed or recently touched planning documents under `docs/plans/`, `docs/archive/plans/`, or the repository's documented planning location.
- If no planning document changed, inspect recent commits and active plan directories to identify the most recent spec set that plausibly governs the current implementation.
- If multiple candidate spec sets remain plausible and cannot be separated by changed files or branch names, stop and report the ambiguity instead of guessing.

## Workflow

### 1) Build the spec baseline

- Read the governing spec documents end-to-end.
- Extract the concrete business goals, acceptance criteria, non-goals, deferred work, and explicit verification requirements.
- Build a compact checklist of claims that can be proven or disproven from code, tests, docs, or command output.
- Keep business goals separate from implementation-quality expectations. A clean implementation does not compensate for an unmet business requirement.

### 2) Map implementation evidence

- Read the related diff, staged changes, commits, or changed files that correspond to the spec scope.
- Follow the minimum dependency chain needed to understand whether the behavior is actually implemented.
- Run or inspect the verification commands named by the spec when they are available and safe to run.
- Mark each business goal as:
  - `Met`: direct implementation and verification evidence exists.
  - `Partially met`: some required behavior exists, but an acceptance criterion, integration path, or verification proof is missing.
  - `Not met`: implementation evidence is absent or contradicts the spec.
  - `Deferred/N/A`: the spec explicitly excludes or defers the item.

### 3) Review business-goal completion first

- Report every `Not met` and `Partially met` business goal before secondary review findings.
- Assign the highest severity to business-goal failures because they mean the delivered change does not satisfy the requested work.
- Include exact spec evidence and code evidence for each gap.
- Do not continue into archival, submission, or release recommendations while business-goal failures remain unresolved.

### 4) Run secondary code-practice reviews

After the business-goal pass is complete, invoke the required review skills on the same code-affecting scope:

- Use `review-change-set` to identify architecture, abstraction, and simplification findings in the related diff.
- Use `discover-edge-cases` to identify reproducible boundary, failure-path, state, and observability risks.
- Use `harden-app-security` to identify reproducible vulnerabilities and adversarial trust-boundary failures.

Keep these findings separate from the business-goal verdict unless the issue also prevents a required acceptance criterion from being satisfied.

### 5) Produce the final review

Return findings in this order:

1. Business-goal failures
   - Severity: always highest for unmet or partially met required goals.
   - Include spec evidence, implementation evidence, and the missing acceptance criterion.
2. Edge-case findings
   - Include reproduction or concrete trigger evidence.
3. Security findings
   - Include exploit path, protected asset, and reproducibility evidence.
4. Code-review findings
   - Include architecture, abstraction, simplification, or maintainability evidence.
5. Passing evidence
   - Summarize the business goals that were confirmed met.
6. Residual uncertainty
   - List unverified checks, commands not run, ambiguous spec mappings, or external dependencies that could not be proven.

If no actionable issue is found, state that no business-goal, edge-case, security, or code-review findings were identified, and still list the spec documents and verification evidence reviewed.

## Working Rules

- Do not edit code, tests, or specs during this review.
- Do not archive specs, commit, push, tag, or release from this skill.
- Do not let secondary code quality findings bury business-goal failures.
- Do not treat checked tasks as proof by themselves; verify the implementation.
- Do not infer success from author intent, branch names, or prior conversation context unless the repository evidence supports it.
- Prefer fewer confirmed findings over broad speculative feedback.
