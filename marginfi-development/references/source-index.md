# Marginfi Official Source Index

Use this file to jump to the official page that matches the task.

## Primary docs

- `https://docs.marginfi.com/`
  - Read for current program IDs, group IDs, lookup-table references, and top-level navigation.
- `https://docs.marginfi.com/ts-sdk`
  - Read for TypeScript integration, SDK classes, helper methods, and flash-loan or permissionless-bank examples.
- `https://docs.marginfi.com/rust-sdk`
  - Read for CLI workflows, operator tasks, profiles, group commands, and bank administration.
- `https://docs.marginfi.com/protocol-design`
  - Read for risk model, oracle rules, utilization-based interest design, and liquidation reasoning.
- `https://docs.marginfi.com/mfi-v2`
  - Read for raw instruction names, account schemas, and error definitions.
- `https://docs.marginfi.com/the-arena`
  - Read for permissionless-bank flows and links to listing criteria.

## When to open which source

- App, bot, backend, or frontend integration: start with `ts-sdk`, then `protocol-design`.
- CLI or ops automation: start with `rust-sdk`.
- Custom Anchor or raw Solana instruction work: start with `mfi-v2`.
- Health checks, liquidation analysis, or risk explanations: start with `protocol-design`, then confirm relevant instruction behavior in `mfi-v2`.
- Permissionless bank creation: start with `the-arena`, then open `ts-sdk` or `rust-sdk` depending on the chosen toolchain.
- Address or deployment verification: start with the docs home page, then follow its linked source or verification references.

## Working rule

If the request depends on a value that can change over time, reopen the live official page even if this skill already contains a summary.
