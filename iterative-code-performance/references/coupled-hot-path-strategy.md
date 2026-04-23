# Staged Strategy For Large Coupled Hot Paths

## Purpose

Teach the agent how to keep making progress when a performance-sensitive file feels too central, too coupled, or too risky to optimize directly.

The correct response is usually not "stop". The correct response is "find the next unlock step".

## Core rule

A large coupled hot path is a **decomposition and measurement signal**, not a **completion blocker**.

If a safe, behavior-preserving unlock step exists under current guardrails, take that step now instead of deferring the whole area.

If measurement or correctness guardrails are too weak for direct optimization, strengthening them is itself the next unlock step.

## First questions to ask

When a hot path feels untouchable, ask:

- Which part is actually slow, and how do we know?
- Which work is pure computation, IO, allocation, synchronization, or side effect?
- Which workload shape, input size, or data distribution matters?
- Which behavior can be locked down with characterization tests?
- Which benchmark or profiler hook would isolate the bottleneck?
- Which dependency seam can be introduced without changing behavior?
- Which optimization would most reduce the cost of the next optimization?

## Typical unlock sequence

Pick one or more of these, in the order justified by current evidence:

1. Add timing, profiling, benchmark, or characterization guardrails around current behavior.
2. Extract pure transformations or workload-shape calculations.
3. Name and isolate expensive repeated work.
4. Separate query/IO preparation from pure decision logic.
5. Introduce a narrow batching, lookup, or data-structure seam.
6. Isolate cache ownership and invalidation decisions.
7. Separate concurrency control from per-item business logic.
8. Re-scan and decide whether a deeper optimization is now safer.

## What not to do

Avoid these anti-patterns:

- declaring the area blocked just because it is important,
- attempting a full hot-path rewrite before guardrails exist,
- adding a cache because measurement is missing,
- removing correctness checks to make the benchmark faster,
- parallelizing side effects without proving ordering and idempotency,
- escalating ordinary internal optimization into a fake macro-architecture concern,
- mixing unlock work with unrelated style churn.

## Choosing the next step

Prefer the next step that maximizes:

1. combined confidence from the agent's own ability, workload understanding, existing tests, benchmarks, or quickly addable guardrails,
2. quality of performance evidence,
3. leverage for future deeper optimization,
4. reduction in repeated work, IO, allocation, or contention,
5. low risk to current business behavior.

If two steps are both safe, choose the one that makes the next iteration easier to measure or validate.

If the file is high-risk and under-tested, prefer adding the smallest useful characterization or benchmark guardrails before attempting deeper edits. If the file is high-risk but well-guarded, do not stop only because the change is difficult; use the guardrails to validate the agent's work and repair any accidental breakage.

## Completion rule for coupled hot paths

Do not ask "Can I solve the whole file now?"

Ask:

- "Can I measure this path more accurately in the next iteration?"
- "Can I make this path meaningfully cheaper in the next iteration?"
- "Can I reduce repeated work, IO, allocation, contention, or cache risk right now?"

If the answer is yes, continue iterating.
