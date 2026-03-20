# OpenClaw Configuration Best Practices

These rules are distilled from the official OpenClaw docs and adapted into a practical workflow.

## Authoring rules

- Treat `~/.openclaw/openclaw.json` as the source of truth unless the environment proves otherwise.
- Prefer the smallest possible edit surface:
  - one key: `openclaw config set`
  - one subtree removal: `openclaw config unset`
  - several coordinated edits: direct JSON edit plus validation
- Keep JSON structure conservative; OpenClaw rejects unknown keys.
- Use the configuration examples page as a baseline instead of inventing a new root layout.

## Safety rules

- Never store production credentials in plaintext if a SecretRef or env var can be used.
- Avoid mixing plaintext and SecretRefs for the same credential path; the ref wins on supported fields and makes ownership clearer.
- Validate immediately after editing:
  - `openclaw config validate`
  - `openclaw doctor` when the gateway still behaves unexpectedly
- Use `openclaw doctor --repair` only when you are comfortable with automatic cleanup and backup behavior.

## Environment rules

- Prefer `${VAR_NAME}` substitution for portable config shared across machines.
- Keep env var names uppercase to match the documented substitution pattern.
- Use `env.shellEnv.enabled` only when the missing-key import behavior is intentional and understood.
- Avoid scattering the same secret across the parent shell, local `.env`, and `~/.openclaw/.env`; keep precedence simple.

## Skills rules

- Put extra skill roots in `skills.load.extraDirs` instead of hard-coding ad hoc discovery logic elsewhere.
- Use `skills.entries.<skillKey>.enabled` for explicit enable or disable state.
- Use `skills.entries.<skillKey>.env` for skill-local environment variables.
- Use `skills.entries.<skillKey>.apiKey` only when the skill expects a primary env-backed API key convenience field.
- Leave `skills.load.watch` enabled while iterating on local skills unless file-watch churn becomes a confirmed problem.
- If you set `skills.install.nodeManager`, remember the official docs still recommend Node as the runtime for the gateway itself.

## Troubleshooting rules

- If the gateway stops booting after a config change, assume schema breakage first and validate before changing unrelated systems.
- When troubleshooting a credentialed path, inspect both the config branch and the SecretRef provider branch.
- When a user asks for "why did this stop working," capture the exact key path and the command used to validate it.
- For broken skill loading, check both `skills.load.extraDirs` and the effective `skillKey` mapping.

## Recommended delivery format

When answering a user or editing a machine, return:

1. the exact file or key path
2. the change made
3. the validation command
4. the secret or env prerequisites
5. the official docs used
