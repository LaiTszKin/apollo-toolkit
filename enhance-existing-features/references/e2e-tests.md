# E2E Testing Guide

## Purpose
- Verify critical user-visible paths at end-to-end level.
- Increase confidence in real behavior after cross-layer integration.

## Required when
- If changes impact key user-visible flows, add or update E2E tests.
- E2E must still be evaluated even when specs are not used; if not applicable, record explicit rationale.

## E2E decision rules
- Prefer E2E for high-risk, high-impact, multi-step flow changes.
- Integration tests may replace E2E when E2E is too costly, unstable, or hard to maintain.
- When replacing E2E, provide equivalent risk coverage and record replacement cases plus reasons.

## Design guidance
- Focus on minimal critical path coverage; avoid over-expansion.
- Use stable test data and reproducible flows.
- Prioritize business outcomes over brittle UI details.

## Recording rules
- Specs flow: record E2E or replacement strategy with outcomes in `checklist.md`.
- Non-specs flow: explain E2E execution or replacement testing with rationale in the response.
