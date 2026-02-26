# Systematic Debug Skill

## Brief Introduction

An agent skill for Codex/Claude workflows that applies a structured debugging loop: hypothesis, minimal logging, user reproduction, evidence-based fixes, and log cleanup.

This skill is designed to locate root causes quickly with minimal code changes, avoid speculation, and iterate based on real runtime evidence.

## Problems this skill solves

Use this skill when:

- The issue is reproducible but root cause is unclear
- Failures happen across module boundaries and are hard to reason about by inspection alone
- You need iterative collaboration with users (reproduce -> share logs -> fix)
- You want to avoid large speculative changes that increase regression risk

## Core method

This skill follows a fixed iteration loop:

1. **Infer the most likely cause**: read code and available signals to form a testable hypothesis.
2. **Add minimal required logs**: instrument only critical paths with diagnostic context.
3. **Provide reproduction steps**: guide users to reproduce and return logs.
4. **Fix from log evidence**: implement evidence-based fixes and re-validate.
5. **Remove temporary logs**: clean up all added logs after resolution.

## Design principles

- **Evidence first**: no guesswork-driven large changes.
- **Minimal change**: keep each iteration tightly scoped.
- **Reversible instrumentation**: every temporary log should be trackable and removable.
- **Clear communication**: each iteration should state what changed and why.

## Typical deliverables

For each debugging iteration, provide:

- Added log locations and purpose
- Reproduction steps for the user
- Fix summary derived from logs
- Confirmation that temporary logs were removed

## Example: one full debugging cycle

### User issue

> "Intermittent 500 after login, but I cannot reproduce it reliably."

### Agent execution (condensed)

1. Identify suspicion: `auth callback` enters an error branch after token exchange.
2. Add minimal logs: record request id, token-provider status, and error code.
3. Provide reproduction steps:
   - Sign in with a test account 10 times
   - Return the request id and full error log for the failed run
4. Fix from logs: provider timeout was incorrectly treated as invalid token.
5. Remove logs after validation: delete all temporary instrumentation after fix confirmation.

### Expected output

- This-round log additions with purpose
- User reproduction steps
- Log-backed fix summary
- Confirmation that temporary logs are removed

## Repository layout

- `SKILL.md`: skill definition and full workflow rules

## License

This project is licensed under [MIT License](LICENSE).
