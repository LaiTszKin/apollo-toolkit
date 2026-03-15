---
name: record-spending
description: Maintain monthly multi-account bookkeeping ledgers in Excel. Use when the user asks to record income, expenses, transfers, deposits, withdrawals, balance changes, account additions, account renames, or monthly asset/liability reviews. Always read ACCOUNT.md first, use the xlsx skill to keep one worksheet per account plus a monthly summary sheet, and keep ACCOUNT.md and CHART.md synchronized.
---

# Record Spending

## Overview

Track user-named accounts through monthly Excel workbooks and keep the account registry plus chart rules consistent over time. Treat `ACCOUNT.md` as the source of truth for account identity and `CHART.md` as the source of truth for recurring chart and quantified-analysis rules.

## Core dependency

- `xlsx`: use it for every workbook creation, edit, formula refresh, formatting change, and chart update.

## References

Load these only when needed:

- `references/account-format.md`
- `references/workbook-layout.md`

## Workflow

### 1) Resolve the bookkeeping scope

- Work inside the user-specified ledger directory. If none is given, use the current working directory.
- Determine the target month from the user's date. If no date is given, default to the current local month.
- Keep one workbook per month, named `YYYY-MM.xlsx` unless the user already has a different convention. Preserve existing naming conventions.
- Expect these companion files beside the monthly workbooks:
  - `ACCOUNT.md`
  - `CHART.md`

### 2) Read `ACCOUNT.md` before doing anything else

- Always open `ACCOUNT.md` first.
- Match the user's wording against recorded account names, aliases, and notes.
- If `ACCOUNT.md` is missing, create it with the structure in `references/account-format.md` before editing any workbook.
- If the request could refer to multiple accounts and the correct one is not provable from context, ask one targeted clarification question instead of guessing.

### 3) Handle account maintenance first

- When the user adds an account, append it to `ACCOUNT.md` before writing ledger rows.
- When the user renames an account, update the same account entry in `ACCOUNT.md` and rename the related worksheet in every affected monthly workbook.
- Preserve historical rows and formulas when renaming; update references instead of recreating data.
- After every task, re-check whether a new account, alias, or status change was introduced and sync `ACCOUNT.md`.

### 4) Maintain one worksheet per account in the monthly workbook

- Create or update the target monthly workbook through the `xlsx` skill.
- Ensure every tracked account has its own worksheet for that month.
- Record every balance-changing event on the matching worksheet.
- Use a consistent transaction table with at least these columns:
  - `Date`
  - `Description`
  - `Category`
  - `Direction`
  - `Amount`
  - `Counterparty Account`
  - `Running Balance`
  - `Notes`
- For transfers between two known accounts, write offsetting rows to both worksheets and keep them reconcilable.
- Keep totals, balances, and summary values in Excel formulas instead of hardcoded derived numbers.

### 5) Maintain a monthly summary worksheet

- Every monthly workbook must include one summary worksheet. Reuse the existing summary-sheet name if present; otherwise use `Monthly Summary`.
- The summary worksheet must include:
  - each account's month-end balance
  - asset allocation by account
  - total assets
  - total liabilities
  - net assets
  - month-to-date balance change by account
  - asset/liability ratios and other quantified metrics defined in `CHART.md`
- Build the summary with worksheet formulas and cross-sheet references so the workbook stays updateable.
- If the available data cannot support a requested metric, mark it as unavailable instead of inventing numbers.

### 6) Keep chart rules stable and documented

- Before changing chart behavior, read `CHART.md` if it exists. If it does not exist, create it from the template guidance in `references/workbook-layout.md`.
- Use the same chart rules every month unless the user explicitly asks to change them.
- Default monthly charts must include:
  - an account asset-allocation chart
  - an assets-vs-liabilities chart
  - a monthly balance-change trend chart
- When the user asks for more chart types or more quantified analysis, add them to the workbook and record the new rule in `CHART.md` so later months follow the same standard.

### 7) Validate before finishing

- Confirm the correct month workbook was updated.
- Confirm the correct account worksheet was updated, created, or renamed.
- Confirm `ACCOUNT.md` reflects all account additions, renames, aliases, and status changes.
- Confirm `CHART.md` reflects any new chart or quantified-analysis rule.
- Recalculate workbook formulas and check for Excel errors through the `xlsx` workflow.
- Report the workbook path, changed worksheets, account-registry updates, and chart-rule updates.

## Guardrails

- Prefer the smallest correct edit; do not redesign an existing ledger if it already satisfies the rules.
- Preserve user-defined account names, workbook names, and worksheet names whenever possible.
- Do not create duplicate accounts when an existing alias already matches.
- If a safe answer depends on a missing amount, date, or account target, ask only for that blocking fact.
