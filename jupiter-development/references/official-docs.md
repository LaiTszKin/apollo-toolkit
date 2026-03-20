# Jupiter Official Docs Reference

Snapshot source: official Jupiter developer docs reviewed on 2026-03-20 from `https://dev.jup.ag/llms.txt` and linked first-party pages.

## 1. Always refresh from these official entry points

- Docs index: `https://dev.jup.ag/llms.txt`
- Get started: `https://dev.jup.ag/get-started`
- Developer portal and API keys: `https://dev.jup.ag/portal/setup.md`
- Rate limits: `https://dev.jup.ag/portal/rate-limit.md`
- Ultra docs root: `https://dev.jup.ag/docs/ultra-api`
- Swap docs root: `https://dev.jup.ag/docs/swap/index.md`
- Tokens docs root: `https://dev.jup.ag/docs/tokens/v2/token-information.md`
- Price docs root: `https://dev.jup.ag/docs/price/index.md`
- Lend docs root: `https://dev.jup.ag/docs/lend/index.md`

If a task depends on exact schemas, jump from those pages into the matching OpenAPI reference before coding.

## 2. Product selection cheatsheet

| Need | Official Jupiter surface | Notes |
| --- | --- | --- |
| Best default swap flow | Ultra API `/ultra/v1/order` + `/ultra/v1/execute` | Current get-started docs point new integrators here first. |
| Custom swap transaction or CPI composition | Metis Swap API | Use the lower-level swap docs only when the app must own quote/build behavior or compose instructions manually. |
| Token search, metadata, verification, discovery | Tokens API V2 | Search by symbol, name, mint, tag, category, or recency. |
| USD token prices | Price API V3 | Heuristic price engine; unreliable tokens may return `null`. |
| Deposit-and-earn yield | Jupiter Lend Earn API or SDK | REST is enough for simple Earn flows; SDK gives instruction-level control. |
| Borrow, repay, flashloan, or CPI lending | `@jup-ag/lend` plus `@jup-ag/lend-read` | Use SDK and product docs for instruction building and analytics. |
| Limit orders / TP-SL style automation | Trigger API | Trigger V2 uses JWT auth; Trigger V1 remains documented for legacy flows. |
| DCA | Recurring API | Time-based recurring orders. |
| Wallet position aggregation | Portfolio API | Beta status. |

## 3. Auth and operational rules

- Current official docs say `api.jup.ag` requires `x-api-key`.
- Current get-started examples still show public `lite-api.jup.ag` usage for some flows, while Jupiter's update/migration docs say deprecation was postponed and migration toward `api.jup.ag` is in progress.
- Treat hostname choice as a time-sensitive implementation detail and refresh the exact product page before coding.
- Generate keys at `https://portal.jup.ag`.
- Rate limits are per account, not per key.
- Free tier: 60 requests per 60 seconds.
- Pro tiers: 10-second sliding windows; the Price API gets its own bucket on Pro.
- Do not assume that creating more API keys increases throughput.

## 4. Ultra and Metis swap essentials

Primary docs:

- `https://dev.jup.ag/get-started`
- `https://dev.jup.ag/docs/ultra-api`
- `https://dev.jup.ag/docs/swap/index.md`
- `https://dev.jup.ag/docs/swap/get-quote`
- `https://dev.jup.ag/docs/swap/build-swap-transaction`
- `https://dev.jup.ag/docs/swap/build-swap-transaction#build-your-own-transaction-with-flash-fill-or-cpi`

### Default path: Ultra API

- Current get-started guidance points integrators to `GET /ultra/v1/order` and `POST /ultra/v1/execute`.
- Use this path for the least integration work and the official default trade flow.

### Advanced path: Metis Swap API

- Use the lower-level swap docs when the integrator must own quote handling, transaction assembly, CPI composition, or Flash Fill style flows.
- Reconfirm the current endpoint family on the exact swap page you use because Jupiter has been migrating between public and Portal-backed hosts.

### Routing and option guardrails

- Optional payer, referral, fee, or router-selection parameters are not neutral.
- Re-read the exact product page before enabling them because they can affect routing, fees, or gasless support.
- Do not assume all examples on older swap pages still describe the default production path.

## 5. Tokens API V2 essentials

Base URL: `https://api.jup.ag/tokens/v2`

Primary docs:

- `https://dev.jup.ag/docs/tokens/v2/token-information.md`
- `https://dev.jup.ag/docs/tokens/organic-score.md`

Important behaviors:

- Search supports symbol, name, and mint-address lookup.
- Tag queries support curated groups such as `verified` and `lst`.
- Category queries support discovery sets such as `toporganicscore`, `toptraded`, and `toptrending`.
- Recent tokens are keyed off first pool creation time, not token mint time.
- Responses include metadata and market-quality signals such as organic score, holder count, market cap, liquidity, and trading stats.
- The docs explicitly warn that the response schema may change as the API evolves.

Organic score is meant to represent genuine token activity and health using wallet, liquidity, and trading signals while filtering out bot-like or wash-trade patterns.

## 6. Price API V3 essentials

Base URL: `https://api.jup.ag/price/v3`

Primary docs:

- `https://dev.jup.ag/docs/price/index.md`
- `https://dev.jup.ag/docs/price/v3.md`
- `https://dev.jup.ag/guides/how-to-get-token-price.md`

Important behaviors:

- Price V3 derives prices from the last swapped price and validates them with liquidity and market-health heuristics.
- Up to 50 mint addresses can be queried per request according to the official guide.
- Missing or `null` prices are expected for tokens that fail Jupiter's reliability checks.
- Do not treat missing prices as transient transport errors by default.

## 7. Jupiter Lend essentials

Primary docs:

- `https://dev.jup.ag/docs/lend/index.md`
- `https://dev.jup.ag/docs/lend/api-vs-sdk.md`
- `https://dev.jup.ag/docs/lend/program-addresses.md`
- `https://dev.jup.ag/docs/lend/advanced/index.md`

Packages mentioned by the official docs:

- `@jup-ag/lend`
- `@jup-ag/lend-read`
- `@solana/web3.js`

Practical split:

- Use the REST API for straightforward Earn deposit and withdrawal flows.
- Use the SDK when you need Borrow flows, CPI, flashloans, batched operations, address lookup tables, or read-side analytics.
- For advanced recipes such as multiply, unwind, vault swap, and flashloans, expect large multi-instruction transactions and add compute budget when needed.
- Public RPC endpoints are not recommended for production; the docs suggest dedicated providers.

## 8. Other important Jupiter APIs

### Trigger

- Docs root: `https://dev.jup.ag/docs/trigger/index.md`
- Trigger V2 uses a challenge-response auth flow and returns a JWT for subsequent requests.
- Use it for single price orders, OCO, and OTOCO flows.

### Recurring

- Docs root: `https://dev.jup.ag/docs/recurring/index.md`
- Use it for time-based DCA orders.
- Jupiter keeper bots handle recurring execution after setup.

### Portfolio

- Docs root: `https://dev.jup.ag/docs/portfolio/index.md`
- Beta API for wallet positions across Solana protocols, including Jupiter-specific positions.

## 9. Implementation checklist

- Confirm the exact Jupiter product surface first.
- Confirm the latest official page and API version before editing code.
- Confirm whether the chosen host requires `x-api-key`, and keep any key out of source control.
- Preserve the default routing path unless the product requirement truly needs advanced payer, fee, or router controls.
- Treat `null` token prices as a valid product outcome.
- Use SDK flows for Jupiter Lend borrow, CPI, flashloan, and analytics work.
- Report any remaining API-key, RPC, or wallet requirements explicitly.
