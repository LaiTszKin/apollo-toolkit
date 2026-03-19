# Configuration

## 1. Environment Variables And Config Files

| Key / File | Required | Purpose | Example / Default | Evidence |
| --- | --- | --- | --- | --- |
| `[ENV_KEY]` | `[Yes/No]` | [What it controls] | [Example or default] | [File path] |
| `[config/file]` | `[Yes/No]` | [Why it matters] | [Example or default] | [File path] |

## 2. External Services And Credential Setup

### [Service Name]

- Purpose: [Why this service exists in the project]
- Required keys/config: `[ENV_KEY]`, `[CONFIG_KEY]`
- Official setup entry: [Link or exact console path if known]
- Acquisition steps:
  1. [Create or open the relevant account/project]
  2. [Generate/find the credential]
  3. [Store it in the local/deployment config]
  4. [Verify connectivity]
- Development notes: [sandbox/test mode, rate limit, fake data, or `Unknown`]
- Evidence: [file path or spec path]

## 3. Safety Notes

- Secret handling: [where secrets should live]
- Local overrides: [env file / config layering / secret manager]
- Common misconfiguration symptoms: [brief list]
