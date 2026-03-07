# Integration Testing Guide

## Purpose
- Verify correctness of cross-layer/cross-module collaboration.
- Focus especially on user-critical logic chains.
- Validate business outcomes across the full changed chain, not just connectivity.

## Required when
- Any change affecting service/repository/API handlers/event flows should add or update integration tests.
- Integration tests for user-critical logic chains are required even when specs are not used.

## Coverage focus
- Key data flow from entrypoint to output.
- Cross-module contract and configuration interaction.
- Common failure patterns (timeout, data inconsistency, external dependency failure).
- External dependency state changes and fallback/compensation behavior.
- Adversarial/abuse paths such as invalid transitions, replay, duplication, forged identifiers, or out-of-order events when relevant.

## Design guidance
- Prefer near-real dependencies inside the application boundary; mock/fake external services unless the real service contract itself is under test.
- Build scenario matrices for external states such as success, timeout, retries exhausted, partial data, stale data, duplicate callbacks, inconsistent responses, and permission failures.
- Keep test data reconstructable and cleanable.
- Each test case should map to an explainable risk.

## Recording rules
- Specs flow: record IT cases and outcomes in `checklist.md`.
- Non-specs flow: list user-critical integration tests, mocked external scenarios, adversarial cases, and outcomes in the response.
