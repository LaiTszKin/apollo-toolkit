# OpenClaw Official Config Docs

Last verified: 2026-03-20

Use this file as the entry map into the official OpenClaw documentation on `docs.openclaw.ai`.

## Canonical pages

- Gateway configuration overview: `https://docs.openclaw.ai/gateway/configuration`
  - Covers the main config file path, edit surfaces, strict validation, hot reload, env vars, and links to the full reference.
- Full configuration reference: `https://docs.openclaw.ai/gateway/configuration-reference`
  - Covers the major top-level namespaces such as `channels`, `agents`, `tools`, `skills`, `plugins`, `gateway`, `secrets`, `cron`, and `$include`.
- Configuration examples: `https://docs.openclaw.ai/gateway/configuration-examples`
  - Provides minimal and starter-shaped configs plus common deployment patterns.
- Skills config: `https://docs.openclaw.ai/tools/skills-config`
  - Covers `skills.allowBundled`, `skills.load.*`, `skills.install.*`, and `skills.entries.<skillKey>`.
- Secrets management: `https://docs.openclaw.ai/gateway/secrets`
  - Covers SecretRef structure, providers, precedence, audit flow, and secure credential handling.
- CLI config command: `https://docs.openclaw.ai/cli/config`
  - Covers `openclaw config get/set/unset/validate`, path syntax, parsing rules, and SecretRef builder modes.
- CLI configure command: `https://docs.openclaw.ai/cli/configure`
  - Covers the guided configuration wizard.
- CLI doctor command: `https://docs.openclaw.ai/cli/doctor`
  - Covers diagnostics, repair behavior, backups, and environment checks.

## Core facts confirmed from the official docs

- The canonical config file is `~/.openclaw/openclaw.json`.
- OpenClaw supports guided edits, CLI path edits, Control UI editing, and direct file editing.
- The gateway validates the config strictly against schema; unknown keys are rejected except for the root `$schema` metadata key.
- The gateway watches the config file and hot-applies many changes automatically.
- Secrets can be supplied through env vars, files, or exec-backed SecretRefs, depending on the field.

## When to open which doc

- Need the exact field name or namespace: open the full reference.
- Need a starting snippet or pattern: open configuration examples.
- Need to load custom skills or set per-skill env: open skills config.
- Need to wire API keys safely: open secrets management plus CLI config.
- Need to repair a broken config: open gateway configuration plus CLI doctor.
