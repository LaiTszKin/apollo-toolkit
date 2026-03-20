# Official Solana Rust Development Reference

Snapshot date: 2026-03-20 (Asia/Hong_Kong).

Use this file when building, reviewing, or debugging Solana work in Rust. It condenses the most important development guidance from the official Solana documentation so the main skill can stay concise.

## Official source map

- Core accounts: `https://solana.com/docs/core/accounts`
- Core instructions: `https://solana.com/docs/core/instructions`
- Core transactions: `https://solana.com/docs/core/transactions`
- Core fees: `https://solana.com/docs/core/fees`
- Program Derived Addresses: `https://solana.com/docs/core/pda`
- Cross Program Invocation: `https://solana.com/docs/core/cpi`
- Native Rust programs overview: `https://solana.com/docs/programs/rust`
- Native Rust program structure: `https://solana.com/docs/programs/rust/program-structure`
- Program deployment and upgrades: `https://solana.com/docs/programs/deploying`
- Official Rust SDK overview: `https://solana.com/docs/clients/official/rust`

If any page changes structure, search `site:solana.com/docs <topic>` and refresh this reference before locking in version-sensitive commands.

## 1. Core execution model you must preserve

- Solana programs operate by receiving instruction data plus an ordered account list. Most implementation mistakes are really account-contract mistakes.
- Accounts are the durable storage boundary. Before editing logic, identify each account's owner, mutability, signer requirement, lamports behavior, and serialized data layout.
- Transactions package one or more instructions and execute atomically. Design instruction handlers with atomic state transitions in mind.
- The official fees model separates:
  - base fee, currently documented as `5000` lamports per signature
  - prioritization fee, computed from compute-unit limit and compute-unit price
- When performance or cost matters, review compute usage per instruction and avoid unnecessary account writes.

## 2. Native Rust program structure

The official native Rust docs and program-structure page emphasize a small, explicit layout:

- `entrypoint.rs`: Solana entrypoint and handoff into program logic
- `instruction.rs`: instruction enum / decoding
- `processor.rs`: instruction handlers and business logic
- `state.rs`: account data structs and serialization
- `error.rs`: custom program errors

Keep the logic readable and explicit:

- parse instruction data up front
- validate account shape before mutation
- separate state serialization from business logic
- return `ProgramError`-compatible failures instead of panicking

The official Rust-program walkthrough currently documents these setup details:

- create a library crate
- add `solana-program` as the primary on-chain dependency
- set `[lib] crate-type = ["cdylib", "lib"]`
- build SBF output with the Solana build flow documented on the page

As of the 2026-03-20 snapshot, the official examples show `solana-program@2.2.0` in native Rust setup examples. Re-check before pinning new projects because Solana crate versions move.

## 3. Instruction and account design checklist

Before writing handlers, lock down:

- instruction enum and binary format
- per-instruction account list order
- which accounts are signer
- which accounts are writable
- which program owns each account
- PDA seeds and bump strategy
- account initialization, realloc, close, and rent expectations

Useful rule: every handler should be reviewable from a table with columns for account, owner, signer, writable, PDA seeds, and failure conditions.

## 4. Program Derived Addresses (PDAs)

Official PDA guidance centers on these ideas:

- A PDA is a deterministic address derived from seeds plus a program ID.
- PDAs are intentionally off the Ed25519 curve, so they have no private key.
- Programs use PDAs for program-controlled authorities and state accounts.
- The same seeds plus the same program ID must derive the same PDA every time.
- The bump seed exists to find a valid off-curve address.

The official PDA page also documents practical limits to remember:

- up to 16 seeds per derivation
- each seed can be up to 32 bytes

Design advice:

- Use stable, domain-specific seeds such as fixed prefixes plus relevant public keys.
- Keep seed schemes obvious and documented near the instruction that consumes them.
- Prefer one clear PDA purpose per seed scheme instead of overloading one PDA for unrelated roles.

## 5. Cross Program Invocation (CPI)

Official CPI guidance highlights:

- Solana programs can invoke instructions in other programs.
- Use `invoke` when no PDA signature is required.
- Use `invoke_signed` when the current program must sign on behalf of one of its PDAs.
- Signer and writable privileges extend from the caller into the callee; CPI does not create new privileges.

Practical implications:

- Validate the entire downstream account list before the CPI.
- Never assume a callee can write to an account unless the outer instruction passed it as writable.
- When debugging CPI failures, inspect signer propagation, writable flags, PDA seed correctness, and program ownership first.

The official page notes a practical limit of 16 PDA signers in `invoke_signed`.

## 6. Fees and compute-budget awareness

The official fees page is the baseline for performance-sensitive work:

- base fee is charged per signature
- prioritization fee depends on compute-unit limit and compute-unit price
- transactions can set compute budget explicitly when needed

When implementing Rust clients or relayers:

- size transaction account lists carefully
- avoid unnecessary signatures
- consider compute budget instructions only when the workflow truly needs them

When implementing programs:

- keep account validation linear and obvious
- avoid redundant serialization passes
- separate expensive CPIs from cheap pure-validation paths when possible

## 7. Local testing workflow

Official Solana docs currently show a Rust-native local test flow for native programs.

From the current documentation snapshot:

- official examples show `litesvm@0.6.1` and `solana-sdk@2.2.0` as dev dependencies in the Rust testing walkthrough
- the docs position LiteSVM as a fast local execution harness for native Rust programs

Recommended execution order:

1. unit-test pure helpers and serialization logic
2. run Rust-native program tests for instruction/state behavior
3. run validator-backed integration flow only when the repository or task needs cluster realism

Test the following explicitly:

- initialization and duplicate-initialization rejection
- authority checks
- signer and writable enforcement
- PDA derivation and PDA signing flows
- state transitions, close flows, and realloc paths
- failure paths for malformed instruction data or wrong account order

## 8. Deployment, upgrades, and irreversible operations

The official deployment docs cover the core operational loop:

- local development often starts with `solana-test-validator`
- deploy with `solana program deploy ...`
- visibility can lag by roughly one slot after deployment
- a program becomes immutable when its upgrade authority is removed
- `solana program close` permanently closes the program and the same program ID cannot be reused for redeployment

Before any deploy or upgrade:

- confirm cluster URL
- confirm payer keypair
- confirm intended program ID
- confirm upgrade authority ownership
- confirm whether the deploy changes any downstream configuration or address registry

For production-facing tasks, always surface immutable or close operations as explicit risk points in the handoff.

## 9. Official Rust SDK crate roles

The official Rust SDK overview maps the common crates this way:

- `solana-program`: on-chain program primitives
- `solana-sdk`: transactions, instructions, keypairs, signatures, and shared primitives for Rust clients
- `solana-client`: RPC access for off-chain Rust applications
- `solana-cli-config`: reuse CLI config from Rust tools
- `solana-clap-utils`: CLI-oriented helper utilities

Default crate choice:

- on-chain program logic: `solana-program`
- Rust service/tool that talks to RPC: `solana-sdk` + `solana-client`
- Rust CLI that should mirror Solana CLI config behavior: add `solana-cli-config`

## 10. When to refresh the official docs before coding

Refresh the linked pages instead of relying on this snapshot when:

- the repository pins newer or older Solana crate versions
- CLI subcommands or flags differ from this reference
- the task depends on recently changed runtime features
- the repository uses Anchor or another framework that wraps native Solana APIs

When docs and code disagree, preserve the repository's actual pinned behavior and note the divergence.
