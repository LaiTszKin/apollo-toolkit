# Fingerprinting Playbook

Use this playbook after you have trustworthy captured traffic or a validated replay harness.

## Comparison design

- Keep prompts, temperature-like settings, and stream mode fixed across providers.
- Prefer at least one documented control provider with a known model family.
- Run multiple prompt categories; one category is not enough for attribution.

## Recommended prompt categories

### 1. Factual knowledge

- Use questions with fresh, externally verifiable answers.
- Build the answer key from current primary sources or credible web verification.
- Score for correctness, completeness, and unsupported claims.

### 2. Coding style

- Use short implementation tasks and bug-fix prompts.
- Compare code structure, caution level, and explanation style.

### 3. Instruction following

- Use prompts with explicit formatting or ranking constraints.
- Compare compliance, stability, and unnecessary extra content.

### 4. Refusal and policy behavior

- Use borderline prompts that should trigger a recognizable refusal or safe alternative.
- Compare refusal style, redirect wording, and partial compliance behavior.

### 5. Long-context behavior

- Only run this when the target is expected to support larger contexts.
- Compare truncation, summarization drift, and consistency across later references.

## Scoring dimensions

Score each response on a fixed rubric, for example:

- factual accuracy
- completeness
- instruction compliance
- reasoning clarity
- code quality
- refusal consistency
- verbosity control
- latency or throughput when that matters

Use the same rubric for every provider and every prompt.

## Confidence discipline

- High confidence needs multiple converging signals across categories.
- Medium confidence fits cases where the target tracks one family strongly but wrappers may distort style.
- Low confidence fits cases where the protocol was captured but output signals remain mixed.

## Suggested report structure

1. Research objective
2. Capture setup
3. Replay validation status
4. Prompt matrix and controls
5. Scoring rubric
6. Comparative findings
7. Most likely model family
8. Caveats, including wrappers and system prompts
