# Staged Strategy For Large Coupled Or Apparently Core Files

## Purpose

Teach the agent how to keep making progress when a file feels too central, too coupled, or too risky to refactor directly.

The correct response is usually not "stop". The correct response is "find the next unlock step".

## Core rule

A large coupled file is a **decomposition signal**, not a **completion blocker**.

If a safe, behavior-preserving unlock step exists under current guardrails, take that step now instead of deferring the whole area.

## First questions to ask

When a file feels untouchable, ask:

- Which parts are pure logic and which parts are side effects?
- Which names or local concepts are blocking understanding?
- Which behavior can be locked down with characterization tests?
- Which dependency seams can be introduced without changing behavior?
- Which caller groups or workflow slices can be isolated first?
- Which refactor would most reduce the cost of the next refactor?

## Typical unlock sequence

Pick one or more of these, in the order justified by current evidence:

1. Add characterization or regression tests around current behavior.
2. Rename confusing variables, flags, intermediate states, and helper names.
3. Extract constants, schemas, types, and small pure transformations.
4. Separate read path from write path, or decision logic from side effects.
5. Isolate external calls, persistence, and logging behind clearer seams.
6. Group callers by responsibility and split one slice at a time.
7. Move one coherent responsibility into a new internal module.
8. Re-scan and decide whether a deeper split is now safer.

## What not to do

Avoid these anti-patterns:

- declaring the area blocked just because it is important,
- attempting a full rewrite before guardrails exist,
- preserving obvious local design debt only because the file is central,
- escalating ordinary internal decomposition into a fake macro-architecture concern,
- mixing unlock work with unrelated style churn.

## Choosing the next step

Prefer the next step that maximizes:

1. confidence under existing tests or quickly addable tests,
2. leverage for future deeper cleanup,
3. reduction in coupling or cognitive load,
4. low risk to current business behavior.

If two steps are both safe, choose the one that makes the next iteration easier.

## Completion rule for coupled files

Do not ask "Can I solve the whole file now?"

Ask:

- "Can I make this file meaningfully easier to change in the next iteration?"
- "Can I reduce coupling, clarify ownership, or improve guardrails right now?"

If the answer is yes, continue iterating.
