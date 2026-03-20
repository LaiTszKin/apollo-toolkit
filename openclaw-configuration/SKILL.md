---
name: openclaw-configuration
description: Build, audit, and explain OpenClaw configuration from official documentation. Use when configuring `~/.openclaw/openclaw.json`, mapping config options, adjusting skills or secrets, generating validated snippets, or diagnosing config errors with `openclaw config`, `openclaw configure`, and `openclaw doctor`.
---

# OpenClaw Configuration

## Dependencies

- Required: none.
- Conditional: `answering-questions-with-research` when a request depends on newer OpenClaw docs than the bundled references cover.
- Optional: none.
- Fallback: If the local CLI is unavailable, work from the bundled references and clearly mark any runtime behavior that was not verified on the machine.

## Standards

- Evidence: Verify the active config file, current values, and CLI diagnostics before editing.
- Execution: Prefer the smallest safe change; use `openclaw config` for narrow edits and direct JSON edits for broad restructures.
- Quality: Keep the file schema-valid, avoid plaintext secrets when a SecretRef or env var fits, and preserve unrelated valid settings.
- Output: Return exact file paths, touched keys, validation commands, and any restart or hot-reload caveats.

## Goal

Help another agent configure OpenClaw safely, quickly, and with citations back to the official docs.

## Workflow

### 1. Classify the request

Decide whether the user needs:

- a config explanation
- a new starter config
- a targeted key update
- skills loading or per-skill env setup
- secrets or provider wiring
- validation or repair of a broken config

Assume the canonical config file is `~/.openclaw/openclaw.json` unless the environment proves otherwise.

### 2. Choose the safest edit surface

- Use `openclaw onboard` or `openclaw configure` for guided setup.
- Use `openclaw config get/set/unset/validate` for precise path-based edits.
- Use direct JSON edits only when changing several related branches at once.
- If the local gateway is running, the Control UI config tab at `http://127.0.0.1:18789` can help inspect or edit the same schema-backed config.

### 3. Load only the references you need

- Read `references/official-docs.md` first for the canonical doc map.
- Read `references/config-reference-map.md` when you need option names, CLI behavior, hot reload, skills config, env handling, or secrets rules.
- Read `references/best-practices.md` before producing a new config, touching credentials, or fixing a broken setup.

### 4. Apply minimal, schema-safe changes

- Prefer `openclaw config set` for one-path edits.
- Prefer SecretRefs or env substitution over plaintext credentials.
- For skill-specific setup, use `skills.load.extraDirs`, `skills.entries.<skillKey>`, and per-skill `env` or `apiKey`.
- Do not invent unknown root keys; OpenClaw rejects schema-invalid config.

### 5. Validate before finishing

- Run `openclaw config validate` after edits.
- If the gateway refuses to boot, run `openclaw doctor`.
- Use `openclaw doctor --repair` only after reviewing what it will change; the tool can back up the config and remove unknown keys.
- Call out whether the change should hot-apply or may still need a restart.

### 6. Return a concise handoff

Always include:

- the file or keys changed
- the command or JSON snippet used
- the validation command
- any secret or env prereqs
- the official doc pages that justify the change

## Common Tasks

### Generate a starter config

Start from the official minimal or starter shape, then add only the channels, models, or skills the user actually needs.

### Explain config options

Summarize the relevant branch and point back to the matching official page rather than dumping the entire reference.

### Configure skills

Use `skills.load.extraDirs` for additional skill folders and `skills.entries.<skillKey>` for per-skill enablement, env vars, or `apiKey`.

### Wire secrets

Prefer SecretRefs (`env`, `file`, or `exec`) for supported credential fields. Use plaintext only when the user explicitly wants a local-only quick setup and understands the tradeoff.

### Repair a broken config

Run `openclaw config validate`, then `openclaw doctor`, and only then make the smallest correction that restores schema validity.
