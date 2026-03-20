---
name: solana-development
description: Build or maintain Solana applications in Rust using official Solana development docs. Use when users ask for native Solana programs, Rust SDK clients, account modeling, instruction design, PDAs, CPIs, local testing, deployment, upgrades, or Solana-specific debugging in Rust codebases.
---

# Solana Development

## Dependencies

- Required: none.
- Conditional: `systematic-debug` when the task is about failing Solana tests, runtime errors, or observed-vs-expected on-chain behavior.
- Optional: none.
- Fallback: If the repository pins Solana crates or CLI behavior that differs from the latest official docs, follow the repository's pinned versions and document the mismatch explicitly.

## Standards

- Evidence: Ground commands, crate choices, and account-model decisions in the current repository plus official Solana docs under `solana.com/docs`.
- Execution: Classify the task as on-chain Rust, off-chain Rust client work, or both before changing code.
- Quality: Prefer minimal account surfaces, explicit instruction schemas, deterministic PDA seeds, and tests for every state transition or authority check.
- Output: Deliver Rust-focused changes with touched accounts, instructions, test commands, deployment notes, and any cluster or authority assumptions.

## Goal

Implement Solana Rust work in a way that matches the official execution model: accounts and instructions first, then PDAs/CPIs, then testing and deployment safety.

## Required Reference

- Read `references/official-solana-rust.md` before making non-trivial Solana changes.
- Refresh the linked official pages when crate versions, CLI commands, or deployment behavior appear different from the reference snapshot.

## Use This Skill For

- Native Solana programs written directly in Rust
- Rust clients, indexers, or operational tools built with the Solana Rust SDK
- Account modeling, authority rules, PDA design, and CPI orchestration
- Local validator workflows, Rust-native tests, build/deploy/upgrade flows
- Solana-specific debugging such as signer, owner, writable, rent, compute, and instruction-data issues

## Workflow

### 1) Classify the repository shape first

- Identify whether the codebase contains on-chain programs, Rust clients, or both.
- Detect whether the repository uses native Solana Rust or a higher-level framework already. Do not rewrite framework conventions unless the user asks.
- Locate program IDs, deploy scripts, test harnesses, keypair handling, and cluster configuration before editing.

### 2) Design the instruction and account contract up front

- List each instruction, the accounts it needs, which accounts must be signer or writable, and which program owns each account.
- Record PDA seeds, bump handling, rent expectations, realloc rules, and close authorities before implementing handlers.
- Reject invalid ownership, signer, and writable assumptions explicitly instead of relying on downstream runtime failures.

### 3) Keep native Rust program structure explicit

- Follow the official native Rust flow: `entrypoint` receives the program call, instruction parsing is explicit, and processor logic is separated from account data definitions.
- Keep serialization and versioning explicit for any state stored inside accounts.
- Prefer custom program errors over panics so failures remain diagnosable.

### 4) Use PDAs and CPIs deliberately

- Use PDAs for program-controlled state or authorities that should not require a private key.
- Use `invoke` for regular cross-program calls and `invoke_signed` only when the current program must sign as one of its PDAs.
- Treat signer and writable privileges as inherited, not escalated; verify every CPI account list carefully.

### 5) Choose the correct Rust crates for the job

- For on-chain code, center the implementation around `solana-program`.
- For off-chain Rust clients and tooling, use `solana-sdk` for transaction primitives and `solana-client` for RPC access.
- When a project mirrors CLI behavior, inspect whether it also depends on `solana-cli-config` or `solana-clap-utils`.

### 6) Validate locally before deploy

- Prefer fast Rust-native tests first, then run the repository's validator or end-to-end flow if available.
- Build with the repository's pinned toolchain when present; otherwise use the current official Solana build/deploy workflow from the reference.
- Exercise account initialization, authority checks, PDA signing, and failure paths instead of only happy-path success.

### 7) Deploy and upgrade safely

- Confirm target cluster, payer, program ID, and upgrade authority before deploy.
- Call out any action that makes a program immutable or permanently closes program state.
- When deployment changes operational assumptions, summarize the exact commands and authority implications in the final handoff.

## Final Checklist

- Account ownership, signer, writable, and PDA assumptions are explicit
- Instruction data and state serialization are version-aware where needed
- Local tests cover success and failure paths for state transitions
- Deployment or upgrade commands match the target cluster and authority setup
- Any mismatch between repo-pinned Solana versions and current docs is documented
