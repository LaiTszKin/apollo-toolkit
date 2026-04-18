---
name: jupiter-development
description: Build integrations against Jupiter's official Solana APIs and SDKs, including Ultra Swap, Metis Swap, Tokens API V2, Price API V3, Lend, Trigger, Recurring, and Portfolio. Use when implementing Jupiter-based swaps, token search, pricing, lending, DCA, limit-order, or portfolio features, or when updating code that depends on Jupiter official developer docs.
---

# Jupiter Development

## Dependencies

- Required: none.
- Conditional: none.
- Optional: none.
- Fallback: If official Jupiter docs are unavailable, stop and report the missing source instead of guessing endpoint behavior.

## Standards

- Evidence: Treat `https://dev.jup.ag/llms.txt` and linked official pages as the source of truth; re-check them when the task depends on current API behavior.
- Execution: Identify the exact Jupiter product first, then implement against the narrowest official API or SDK that fits the job.
- Quality: Prefer the default happy-path integrations before custom transaction assembly, and call out routing, auth, fee, and rate-limit tradeoffs explicitly.
- Output: Leave the user with working integration changes plus a short note covering which Jupiter surface was used and which official docs were followed.

## Goal

Implement Jupiter-backed Solana features safely by following the current official developer documentation instead of relying on stale examples or assumptions.

## Required Workflow

### 1) Reconfirm the official surface before coding

- Start from `https://dev.jup.ag/llms.txt` to discover the current product map and page URLs.
- Read only the product pages needed for the task.
- If the task depends on exact request or response fields, follow through to the linked API reference or OpenAPI page before editing code.

### 2) Choose the right Jupiter integration path

- For token swaps, default to Ultra Swap.
  - Use `GET /ultra/v1/order` plus `POST /ultra/v1/execute` for the standard path with the least integration work.
  - Use Metis Swap only when the app must own quote-to-transaction construction, compose instructions, or integrate through CPI/Flash Fill style flows.
- For token discovery and token metadata, use Tokens API V2.
  - Use search for symbol, name, or mint lookup.
  - Use tag/category/recent endpoints for discovery experiences such as verified lists, trending tokens, or newly tradable assets.
- For USD token pricing, use Price API V3.
  - Expect `null` or missing prices for assets that Jupiter considers unreliable.
  - Do not invent fallback prices without telling the user.
- For lending, use Jupiter Lend.
  - Use the REST API for Earn when HTTP access is enough.
  - Use `@jup-ag/lend` and `@jup-ag/lend-read` when the task needs instruction building, on-chain composition, flashloans, Borrow flows, or read-side analytics.
- For advanced trading automations, use the product-specific APIs instead of overloading Swap.
  - Trigger for limit-order and stop-style flows.
  - Recurring for DCA.
  - Portfolio for wallet position aggregation.

### 3) Apply Jupiter-specific guardrails while implementing

- Treat Jupiter hostnames and auth rules as time-sensitive.
  - Current official docs still show some `lite-api.jup.ag` quick-start examples.
  - Current migration and Portal docs recommend `api.jup.ag` with `x-api-key`.
  - Reconfirm the exact hostname and auth rule for the chosen product before coding.
- Respect Jupiter Portal rate limits and keep API keys in configuration rather than source control.
- Do not add optional swap parameters blindly.
  - Payer, referral, fee, and router-selection fields can change routing, fee behavior, or gasless support.
  - Re-read the exact product page before shipping these options.
- Match the fee model to the integration path.
  - Ultra handles the quote and execution flow end to end.
  - Metis gives more transaction control but also pushes more assembly responsibility onto the integrator.
- Treat Jupiter token and price data as curated but evolving.
  - Tokens V2 responses can change as Jupiter improves the schema.
  - Price V3 intentionally withholds unreliable prices.
- Treat Jupiter routing program metadata as discovery data, not signer policy.
  - Official program-label mappings such as `program-id-to-label` may help build observability, drift detection, and review queues for newly observed router programs.
  - Do not automatically convert a Jupiter-maintained program list into a signing allowlist for wallet, hot-wallet, or `/swap-to-sol` style flows.
  - Keep local transaction grammar fail-closed around allowed program classes, signer/writable scope, fee/output policy, instruction discriminators, and receiver semantics; only promote newly discovered programs after the local safety contract is understood and tested.
- For Jupiter Lend advanced recipes, expect versioned transactions, address lookup tables, and sometimes extra compute budget.
- Never commit private keys. Use environment variables, wallet adapters, secure signers, or managed key systems.

### 4) Verify the integration path end to end

- Confirm the base URL, auth header, and required parameters match the official docs you used.
- Verify that any routing, payer, referral, or fee assumptions still hold after optional parameters are added.
- When building transactions manually, verify quote endpoint compatibility, instruction order, compute budget, address lookup tables, and signing flow.
- When using Jupiter-maintained program registries, verify that registry drift handling is observability-first: record unknown program labels and route context, alert or fail closed on unsafe transaction shapes, and keep signing decisions owned by the local policy layer rather than by the remote registry response.
- When the task involves on-chain actions, report any remaining environment needs clearly, such as API keys, RPC endpoints, or wallet secrets that were intentionally not embedded.

## Reference Files

- Read `references/official-docs.md` for the condensed official guidance and page map before diving into deeper Jupiter pages.

## Output Expectations

When finishing a Jupiter task:

- state which Jupiter product surface was used
- mention the main official pages consulted
- call out any known tradeoffs such as rate limits, routing restrictions, null prices, or SDK versus REST constraints
