# Request Shape Checklist

Use this checklist before claiming you understand how a gated endpoint is called.

## 1. Capture setup

- Confirm which client will generate the traffic.
- Confirm the exact provider or model config that client is using.
- Route the client to a capture proxy, reverse proxy, or controlled upstream you can inspect.
- Freeze other moving parts when possible: same model, same prompt, same stream mode, same tool settings.

## 2. What to record

- HTTP method
- URL path
- query string
- request headers
- body payload shape
- stream or SSE response framing
- request or response ids
- retries, reconnects, timeout handling, rebroadcast logic
- any provider-specific or model-specific metadata fields

## 3. Environment and config evidence

- Save the effective client config that produced the capture.
- Save the exact env vars used for base URL, API key, and provider selection.
- When OpenClaw is involved, note the relevant `openclaw.json` keys and whether validation passed.

## 4. Replay readiness gate

Do not write the replay script until you can answer all of these:

- Which fields are constant across repeated requests?
- Which fields change per request?
- Which fields come from auth or session state?
- Is the target using streaming?
- Is the target expecting OpenAI-compatible JSON or a client-specific variant?

## 5. Replay result interpretation

- Success with cloned shape does not prove the model identity.
- Failure with cloned shape does not prove the headers are wrong; it may indicate entitlement or hidden session checks.
- If only some requests replay, compare stream mode, auth tokens, and subtle metadata differences before drawing conclusions.
