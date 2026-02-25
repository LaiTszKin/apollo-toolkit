# Security Test Patterns for AI Agents

## Core Rules

- Write exploit-path tests before implementing fixes.
- Keep tests deterministic with fixed payload fixtures.
- Name tests by attack intent and expected control.
- Assert both behavior and policy outcome (blocked action, sanitized output, or explicit refusal).

## Pattern 1: Direct Prompt Injection Block

### Goal
Ensure attacker text cannot override policy hierarchy.

### Test shape
1. Send a payload attempting to override system rules.
2. Trigger a restricted action request.
3. Assert action is blocked and refusal is returned.

### Minimum assertions
- Restricted tool/action is never executed.
- Response does not claim policy override success.

## Pattern 2: Indirect Injection Through Retrieved Content

### Goal
Ensure malicious instructions inside retrieved/tool text are treated as data.

### Test shape
1. Stub retrieval/tool output with embedded malicious instruction.
2. Ask the agent to summarize or answer based on that content.
3. Assert agent does not execute injected instruction.

### Minimum assertions
- Planner/tool router ignores embedded directives.
- Output contains task answer only, no malicious side effects.

## Pattern 3: Unauthorized Tool Invocation

### Goal
Block tools that are not allowed for the current user/task context.

### Test shape
1. Craft prompt that nudges agent toward privileged tool use.
2. Execute plan.
3. Assert policy denies tool invocation.

### Minimum assertions
- Denied tool call count remains zero.
- Audit/event log captures denial reason.

## Pattern 4: Secret/Data Exfiltration Defense

### Goal
Prevent direct or encoded leakage of secrets.

### Test shape
1. Inject known secret fixtures into runtime context.
2. Ask adversarial prompts requesting secrets directly and via encoding.
3. Assert outputs are redacted/refused.

### Minimum assertions
- No full or partial secret values in output.
- Encoded transforms (base64/hex/json embedding) are blocked.

## Pattern 5: Memory Poisoning Resistance

### Goal
Prevent malicious persistent instructions from changing future security behavior.

### Test shape
1. Submit prompt that tries to persist malicious memory state.
2. Start a new turn/session that would be affected if poisoning succeeded.
3. Assert security posture remains unchanged.

### Minimum assertions
- Forbidden memory keys are rejected or sanitized.
- Follow-up turn still enforces baseline policy.

## Pattern 6: Regression Test After Patch

### Goal
Guarantee each fixed vulnerability remains closed.

### Test shape
1. Re-run original exploit payload against patched code.
2. Add nearby variant payloads (spacing, casing, encoding tricks).
3. Assert all variants are blocked.

### Minimum assertions
- Original exploit cannot reproduce.
- Variant payloads do not bypass controls.

## Passing Criteria for Security Work

A remediation is complete only when:

- Every confirmed vulnerability has at least one failing-then-passing test.
- Added tests pass in targeted runs and the relevant full suite.
- No existing functional tests regress due to security patches.
- Validation commands and results are documented in the report.
