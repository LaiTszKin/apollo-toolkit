# Integration Testing Guide

## Purpose
- Verify correctness of cross-layer/cross-module collaboration.
- Focus especially on user-critical logic chains.

## Required when
- Any change affecting service/repository/API handlers/event flows should add or update integration tests.
- Integration tests for user-critical logic chains are required even when specs are not used.

## Coverage focus
- Key data flow from entrypoint to output.
- Cross-module contract and configuration interaction.
- Common failure patterns (timeout, data inconsistency, external dependency failure).

## Design guidance
- Prefer near-real dependencies; use stable test doubles when necessary.
- Keep test data reconstructable and cleanable.
- Each test case should map to an explainable risk.

## Recording rules
- Specs flow: record IT cases and outcomes in `checklist.md`.
- Non-specs flow: list user-critical integration tests and outcomes in the response.
