---
name: shadow-api-model-research
description: Investigate gated or shadow LLM APIs by capturing real client request shapes, separating request-shape gating from auth/entitlement checks, replaying verified traffic patterns, and attributing the likely underlying model with black-box fingerprinting. Use when users ask how Codex/OpenClaw/custom-provider traffic works, want a capture proxy or replay harness, need LLMMAP-style model comparison, or want a research report on which model a restricted endpoint likely wraps.
---

# Shadow API Model Research

## Dependencies

- Required: `answering-questions-with-research` for primary-source web verification and code-backed explanations.
- Conditional: `openclaw-configuration` when the capture path uses OpenClaw custom providers or workspace config edits; `deep-research-topics` when the user wants a formal report, especially PDF output.
- Optional: none.
- Fallback: If you cannot inspect either the real client code path or authorized live traffic, stop and report the missing evidence instead of guessing from headers or marketing copy.

## Standards

- Evidence: Base conclusions on actual client code, captured traffic, official docs, and controlled replay results; do not infer protocol details from memory alone.
- Execution: Split the job into request-shape capture, replay validation, and model-attribution analysis; treat each as a separate hypothesis gate.
- Quality: Distinguish request-shape compatibility, auth or entitlement requirements, system-prompt wrapping, and underlying-model behavior; never collapse them into one claim.
- Output: Return the tested providers, exact capture or replay setup, prompt set or scoring rubric, observed differences, and an explicit confidence statement plus caveats.

## Goal

Help another agent run lawful, evidence-based shadow-API research without drifting into guesswork about what a gated endpoint checks or which model it wraps.

## Workflow

### 1. Classify the research ask

Decide which of these the user actually needs:

- capture the true request shape from a known client
- configure OpenClaw or another client to hit a controlled endpoint
- build a replay harness from observed traffic
- compare the endpoint against known providers with black-box prompts
- package findings into a concise report

If the user is mixing all of them, still execute in that order: capture first, replay second, attribution third.

### 2. Verify the real client path before writing any script

- Inspect the local client code and active config first.
- For OpenClaw, load the relevant official docs or local source through `answering-questions-with-research`, and use `openclaw-configuration` if you need to rewire a custom provider for capture.
- When Codex or another official client is involved, verify current behavior from primary sources and the local installed code when available.
- Do not claim that a request shape is "Codex-compatible" or "OpenClaw-compatible" until you have either:
  - captured it from the client, or
  - confirmed it from the current implementation and docs.

### 3. Capture the true request shape

- Read `references/request-shape-checklist.md` before touching the network path.
- Prefer routing the real client to a capture proxy or controlled upstream you own.
- Record, at minimum:
  - method
  - path
  - query parameters
  - headers
  - body schema
  - streaming or SSE frame shape
  - retries, timeouts, and backoff behavior
  - any client-added metadata that changes between providers or models
- Treat aborted turns or partially applied config edits as tainted state; re-check the active config before trusting a capture.

### 4. Separate request gating from auth or entitlement

- Build explicit hypotheses for what the endpoint may be checking:
  - plain OpenAI-compatible schema only
  - static headers or user-agent shape
  - transport details such as SSE formatting
  - token claims, workspace identity, or other entitlement state
- Do not tell the user that replaying the request shape is sufficient unless the replay actually works.
- If the evidence shows the endpoint still rejects cloned traffic, report that the barrier is likely beyond the visible request shape.

### 5. Build the replay harness only from observed facts

- Read `references/fingerprinting-playbook.md` before implementing the replay phase.
- Use `.env` or equivalent env-backed config for base URLs, API keys, and provider labels.
- Mirror only the fields that were actually observed from the client.
- Keep capture and replay scripts separate unless there is a strong reason to combine them.
- Preserve the observed stream mode; do not silently downgrade SSE to non-streaming or vice versa.

### 6. Run black-box fingerprinting

- Compare the target endpoint against one or more control providers with known or documented models.
- Use a prompt matrix that spans:
  - coding or tool-use style
  - factual knowledge questions with externally verified answers
  - refusal and policy behavior
  - instruction-following edge cases
  - long-context or truncation behavior when relevant
- When building factual question sets, verify the answer key from primary sources or fresh web research instead of relying on memory.
- If the user wants LLMMAP-style comparison, keep the benchmark inputs fixed across providers and score each response on the same rubric.

### 7. Report with confidence and caveats

- Summarize:
  - what was captured
  - what replayed successfully
  - which differences were protocol-level versus model-level
  - the most likely underlying model family
  - the confidence level and why
- If system prompts or provider-side wrappers likely distort the output, say so explicitly and lower confidence accordingly.
- If the user wants a report artifact, hand off to `deep-research-topics` after the evidence has been collected.

## References

- `references/request-shape-checklist.md` for the capture and replay evidence checklist.
- `references/fingerprinting-playbook.md` for comparison design, scoring dimensions, and report structure.

## Guardrails

- Keep the work on systems the user is authorized to inspect or test.
- Do not present speculation about hidden auth checks as established fact.
- Do not over-index on one response; model attribution needs repeated prompts and multiple signal types.
