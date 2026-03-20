---
name: marginfi-development
description: Build or analyze integrations on the Solana-based marginfi protocol using the official TypeScript SDK, Rust CLI, and protocol docs. Use when implementing or reviewing marginfi deposits, withdrawals, borrows, repayments, flash loans, liquidations, permissionless banks, bank configuration, account-health logic, or raw instruction mapping, and ground the work in official marginfi documentation before coding.
---

# Marginfi Development

## Dependencies

- Required: none.
- Conditional: `answering-questions-with-research` when the user needs marginfi guidance combined with fresh external verification or local repository discovery.
- Optional: none.
- Fallback: If official docs do not confirm a requested parameter, address, or workflow, say so explicitly instead of guessing.

## Standards

- Evidence: Start from official marginfi docs and official source links, and re-check time-sensitive values before hardcoding them.
- Execution: Pick the correct integration surface first (TypeScript SDK, Rust CLI, or raw program instructions), then scope the exact bank, group, account, and environment involved.
- Quality: Preserve Solana and Anchor conventions, validate margin account health assumptions, and never invent bank config or oracle defaults.
- Output: Provide copy-pastable implementation steps, the exact official source pages consulted, and concrete caveats for unresolved risks.

## Goal

Build or review marginfi integrations with the smallest correct implementation that still respects the protocol's account model, bank risk parameters, oracle rules, and operational constraints.

## Workflow

### 1) Classify the task before coding

Map the request to one of these paths:

- application integration with the TypeScript SDK
- operational/admin work with the Rust CLI
- raw on-chain instruction work against `mfi-v2`
- permissionless bank creation in The Arena
- liquidations, health, or risk-model analysis
- flash loan composition

Then load only the matching reference sections from `references/official-development-notes.md`.

### 2) Reconfirm official docs when values can drift

Re-check live official docs when the task depends on:

- current program or group addresses
- package names or environment configs
- current bank parameters or listing rules
- The Arena flows or permissionless-bank requirements

Use `references/source-index.md` to jump to the right official page quickly.

### 3) Choose the correct development surface

#### TypeScript SDK

Use for frontends, bots, services, scripts, or integration tests.

- Start with `MarginfiClient.fetch(getConfig(...), wallet, connection)`.
- Fetch or create the authority's marginfi account before user actions.
- Resolve banks by token symbol, mint, or public key before depositing, borrowing, repaying, or withdrawing.
- Prefer SDK helpers for instruction construction, transaction processing, flash loans, and account reloads.

#### Rust CLI

Use for operator workflows, group or bank administration, and quick protocol interaction from the terminal.

- Configure the correct profile and environment first.
- Use the CLI for account creation, deposits, borrows, repayments, withdrawals, transfers, emissions setup, and bank-management flows.
- When creating or updating banks, provide explicit config values; do not infer hidden defaults.

#### Raw program work

Use when you need exact instruction names, account constraints, or error mapping.

- Read the `mfi-v2` instruction and error sections first.
- Keep flash-loan state transitions and end-instruction indexing exact.
- Map protocol errors back to the user-visible cause instead of returning opaque Solana failures.

### 4) Apply the task-specific playbook

#### Deposits / borrows / withdrawals / repayments

- Confirm the target group and bank.
- Load or create the user's marginfi account.
- Fetch fresh bank data and oracle-backed pricing before reasoning about health.
- Use SDK or CLI helpers instead of hand-writing instructions unless the task explicitly needs raw instruction control.

#### Flash loans

- Treat flash loans as a begin/end instruction pair or use the SDK helper that builds the full transaction.
- Ensure the end instruction index is correct and that every temporary borrow is repaid within the same transaction.
- Watch for flash-loan-specific errors such as illegal nesting or missing end instructions.

#### Permissionless banks / The Arena

- Collect the mint, oracle setup, risk tier, asset/liability weights, deposit and borrow limits, operational state, and rate configuration before coding.
- Use the official The Arena guidance and listing criteria as the source of truth.
- Surface any missing config explicitly; never invent safe-looking defaults.

#### Liquidations and health analysis

- Distinguish collateral, borrow-only, and isolated assets.
- Explain how asset weights, liability weights, utilization-based rates, and oracle staleness checks affect account health.
- Use official terminology when describing liquidatable states and liquidation flows.

### 5) Respect protocol guardrails

- marginfi relies on Pyth and Switchboard oracle feeds with confidence and staleness checks; do not assume any quoted price is always usable.
- Interest rates are utilization-based and piecewise; account economics depend on bank config, not just spot balances.
- Current docs describe verified builds, audits, fuzz testing, and bug-bounty coverage; do not bypass those assumptions when proposing deployment or upgrade steps.

### 6) Output expectations

When finishing marginfi work:

- name the exact official pages consulted
- state the chosen integration surface
- list the concrete accounts, banks, and env values the implementation needs
- call out any unverified addresses, parameters, or bank settings
- keep examples minimal and directly runnable when possible

## References

- `references/official-development-notes.md`: condensed marginfi development guidance from official docs.
- `references/source-index.md`: official page index and when to consult each source.
