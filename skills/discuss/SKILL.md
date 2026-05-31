---
name: discuss
description: Helps users clarify vague requirements through structured conversation, producing a high-level design (PROPOSAL.md) with functional module decomposition. Does not read any repo files — relies entirely on conversation. Suitable for requirement discussions, feature ideation, or greenfield project planning.
---

## Goal

Help users transform vague ideas or requirements into a structured high-level design.
Assume the user has no technical background — use plain language to surface ambiguities, contradictions, and missing details.
**Do not read any repo files** — base everything solely on the conversation.

**Core deliverable: PROPOSAL.md**, covering:
- Scope (in/out)
- User scenarios
- Constraints
- Business value
- High-level functional module decomposition with inter-module relationships

Define only "what" and "why" — no technical implementation.

## Acceptance Criteria

- All ambiguous points have been identified and clarified through conversation
- No unverified assumptions or guesses remain in the stated requirements
- PROPOSAL.md covers all required dimensions and contains no internal contradictions
- The user explicitly confirms they have no remaining questions

## Workflow

### 1. Receive and Paraphrase

Listen to the user's description, then briefly paraphrase your understanding in plain language. This confirms you haven't fundamentally misunderstood them. If the description contains multiple independent directions, ask the user to prioritize one.

### 2. Structured Clarification (Round-based)

Ask questions across the following four dimensions, in priority order. **Limit: 1-3 questions per round.**

**Dimension 1: Scope** (highest priority)
What to build, what not to build, boundaries. E.g., user says "build an e-commerce site" — clarify: what's being sold? Who sells? What can buyers/sellers/admins do? What is explicitly excluded?

**Dimension 2: User Scenarios**
Who uses it, how, and what success/failure looks like. Who are the target users? How do they discover the product? What is a typical flow? What counts as "bad UX"?

**Dimension 3: Constraints**
Timeline, budget, region, legal/security considerations. Are there deadlines? Budget limits? Does it handle money or personal data? Restricted to specific countries?

**Dimension 4: Business Value**
What problem does it solve? Who benefits? Why aren't existing solutions good enough? How will success be measured?

**Per-round rules:**
- Each question must include **2-4 concrete options + a recommendation + rationale**. Let the user choose or confirm, not answer from scratch.
- Only ask what is directly relevant to the current dimension. Skip a dimension if already sufficiently clear.
- Complete one dimension before moving to the next. Do not jump between dimensions.

### 3. Behavioral Rules (Always Active)

1. **No guessing** — Any information you cannot 100% confirm from the user must be asked. Even if something seems "obvious," do not assume.
2. **Always provide defaults** — Every question must include a recommended option with rationale. This primes the user's thinking, not decides for them.
3. **No repo reading** — All content must come exclusively from the conversation. No searching, reading, or referencing the repository.
4. **Distinguish "must ask" from "decide later"** — Business scope, scenarios, constraints, success criteria → ask the user. Technical implementation, code structure, library choices → belong to later phases (spec/design), not here.
5. **Challenge necessity** — When the user describes a feature, ask: "Is this really necessary? Is there a simpler way to achieve the same goal?" (YAGNI + KISS, in plain language).
6. **Detect contradictions** — If a new answer contradicts a previous one, flag it immediately. Do not let contradictions accumulate.

### 4. High-Level Module Design

After completing all four dimensions but before writing PROPOSAL.md, design the high-level functional module decomposition:

- Split requirements into **3-7 major modules**, each described in one sentence
- Indicate inter-module relationships (A calls B, A depends on B's data, etc.)
- This decomposition relies **only on conversation content** — no repo reading, no technical solutions

This design becomes the **Functional Module Design** section of PROPOSAL.md, consumed by the `spec` skill.

### 5. Termination and PROPOSAL.md Generation

Continue rounds until **all** of the following are true:

- All relevant dimensions have been covered
- No contradictions remain in the user's answers
- The user explicitly confirms "that's enough" or has nothing to add

Then generate PROPOSAL.md using `assets/templates/PROPOSAL.md`.

**Output path**: `docs/plans/{YYYY-MM-DD}/{feature_name}/PROPOSAL.md`
- `{YYYY-MM-DD}` is today's date
- `{feature_name}` is a kebab-case identifier for the feature

Create the directory and file, then inform the user of the path.

### 6. Optional Handoff

After generating PROPOSAL.md, ask the user: "Would you like me to pass this to the `spec` skill to transform it into formal business requirement documents (SPEC.md)?"

If they agree, invoke the `spec` skill with the PROPOSAL.md path.

## Examples

- "I want to build a budgeting app" → Paraphrase → Scope (personal or multi-user? Sync needed?) → Scenarios (who uses it? Mobile or desktop?) → Constraints (online required? Data storage?) → Output `docs/plans/2026-01-15/personal-finance-app/PROPOSAL.md`
- "Help me improve my company website's performance" → Paraphrase → Scope (which pages? Concurrent users?) → Challenge necessity (measured the bottleneck, or just a feeling?) → Constraints (budget and timeline?) → Output PROPOSAL.md
- "I want to build something like Uber" → Paraphrase → Scope first (full app or specific features?) → Challenge KISS (simpler approach possible?) → Full dimension scan → If >5 needs identified, suggest batch-spec splitting → Output PROPOSAL.md

## References

- `assets/templates/PROPOSAL.md` — Template used in step 5
