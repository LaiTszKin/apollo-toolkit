# OpenClaw Config Reference Map

This file condenses the official OpenClaw configuration docs into a quick operator map.

## Main file and edit surfaces

- Canonical file: `~/.openclaw/openclaw.json`
- Guided setup:
  - `openclaw onboard`
  - `openclaw configure`
- Precise edits:
  - `openclaw config get <path>`
  - `openclaw config set <path> <value>`
  - `openclaw config unset <path>`
  - `openclaw config validate`
- UI editing:
  - Config tab in the local Control UI at `http://127.0.0.1:18789`
- Direct editing:
  - safe for broader restructures, but validate immediately afterward

## Validation and reload behavior

- OpenClaw enforces a strict schema.
- Unknown keys, bad types, or invalid values can prevent the gateway from starting.
- The root `$schema` string is the documented exception for editor schema metadata.
- When validation fails, the docs point to diagnostic commands such as:
  - `openclaw doctor`
  - `openclaw logs`
  - `openclaw health`
  - `openclaw status`
- The gateway watches `~/.openclaw/openclaw.json` and hot-applies many changes automatically.

## CLI behavior worth remembering

### Paths

- Dot notation works: `agents.defaults.workspace`
- Bracket notation works: `agents.list[0].tools.exec.node`

### Value parsing

- `openclaw config set` parses JSON5 when possible.
- Use `--strict-json` when you want parsing to be required.
- Use strings intentionally for values such as heartbeat durations.

### Assignment modes

- Value mode: plain path/value edit
- SecretRef builder mode: build a supported ref without hand-writing JSON
- Provider builder mode: build `secrets.providers.<alias>` entries
- Batch mode: apply several edits from a JSON payload or file

## Official namespace map

The full reference documents these major sections:

- `channels`
- `agents`
- `session`
- `messages`
- `talk`
- `tools`
- custom providers and base URLs
- `skills`
- `plugins`
- `browser`
- `ui`
- `gateway`
- `hooks`
- canvas host
- discovery
- `environment`
- `secrets`
- auth storage
- logging
- CLI
- wizard
- identity
- `cron`
- media model template variables
- config includes via `$include`

Use the official full reference when you need the exact nested shape under one of these branches.

## Environment variables

The gateway docs describe three non-inline sources:

- env vars from the parent process
- `.env` in the current working directory
- `~/.openclaw/.env` as a global fallback

Neither `.env` file overrides variables that are already present in the parent process.

The docs also describe config-side helpers:

- inline `env` sections
- optional shell env import via `env.shellEnv.enabled`
- config string substitution with `${VAR_NAME}`

Key rules called out by the docs:

- substitution targets uppercase variable names
- missing or empty values fail at load time
- use `$${VAR}` to escape a literal placeholder

## Secrets and credential references

OpenClaw documents a common SecretRef shape:

```json
{
  "source": "env",
  "provider": "default",
  "id": "OPENAI_API_KEY"
}
```

Supported ref sources in the docs:

- `env`
- `file`
- `exec`

Operational rules confirmed by the secrets docs:

- if a supported field has both plaintext and a ref, the ref takes precedence
- `openclaw secrets audit --check` is the default preflight
- `openclaw secrets configure` helps wire providers
- a final `openclaw secrets audit --check` confirms the setup

## Skills configuration

The official skills config page documents these fields:

- `skills.allowBundled`
- `skills.load.extraDirs`
- `skills.load.watch`
- `skills.load.watchDebounceMs`
- `skills.install.preferBrew`
- `skills.install.nodeManager`
- `skills.entries.<skillKey>.enabled`
- `skills.entries.<skillKey>.env`
- `skills.entries.<skillKey>.apiKey`

Notes confirmed by the docs:

- `skills.entries` keys default to the skill name
- if a skill defines `metadata.openclaw.skillKey`, use that key instead
- watcher-driven skill changes are picked up on the next agent turn when watching is enabled
- for workspace-scoped customization, `~/.openclaw/workspace/skills` is a practical local skill root to wire through `skills.load.extraDirs`

## Workspace files often edited alongside config

These are not all part of the OpenClaw JSON schema, but they are common neighboring files when users ask to customize behavior:

- `~/.openclaw/workspace/AGENTS.md`
- `~/.openclaw/workspace/TOOLS.md`
- `~/.openclaw/workspace/SOUL.md`
- `~/.openclaw/workspace/USER.md`
- `~/.openclaw/workspace/memory/*.md`

Use them for persona, tool instructions, durable user profile details, and memory-management rules instead of overloading `openclaw.json`.

## Tool and sandbox checks worth remembering

- A valid config does not prove the tool is usable at runtime.
- When enabling browser automation or sandboxed command execution, verify the effective state after editing:
  - tool policy
  - sandbox mode and workspace access
  - browser enablement and profile selection
- Profile defaults can still block a tool even when a nearby leaf branch looks permissive, so check the effective runtime path, not only the edited key.

## Example snippets to adapt

### Minimal starter

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace"
    }
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"]
    }
  }
}
```

### Custom skill directory plus per-skill env

```json
{
  "skills": {
    "load": {
      "extraDirs": ["~/skills", "~/.apollo-toolkit"]
    },
    "entries": {
      "openclaw-configuration": {
        "enabled": true,
        "env": {
          "OPENCLAW_CONFIG_PATH": "~/.openclaw/openclaw.json"
        }
      }
    }
  }
}
```
