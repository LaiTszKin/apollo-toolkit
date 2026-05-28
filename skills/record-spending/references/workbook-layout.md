# Monthly workbook and CHART.md rules

Use one workbook per month and keep the layout stable across months.

## Monthly workbook

- Default filename: `YYYY-MM.xlsx`
- Required worksheets:
  - one worksheet per account
  - one summary worksheet, preferably `Monthly Summary`

## Account worksheet layout

Use a single transaction table with these minimum columns:

| Date | Description | Category | Direction | Amount | Counterparty Account | Running Balance | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

Recommended rules:

- `Direction` should make inflow/outflow explicit.
- `Running Balance` should be formula-driven whenever prior rows exist.
- For transfers, use the same date, description, and amount on both related account sheets.

## Summary worksheet requirements

The summary worksheet should expose these metrics for the target month:

- month-end balance for every account
- total assets
- total liabilities
- net assets
- account-level allocation percentages
- month-to-date balance change by account
- quantified ratios defined in `CHART.md`

## Default charts

Unless `CHART.md` says otherwise, create and maintain these charts every month:

1. Asset allocation by account
   - Type: pie or doughnut chart
   - Basis: month-end balances for `asset` accounts
2. Assets vs liabilities
   - Type: clustered column or stacked column chart
   - Basis: total assets, total liabilities, net assets
3. Monthly balance trend
   - Type: line chart
   - Basis: chronological balance movement for the month

## CHART.md template

Create `CHART.md` when it is missing. Use a structure like this:

```md
# Chart Rules

## Default charts

1. Asset allocation by account
   - Type: doughnut
   - Source: month-end balances of asset accounts
2. Assets vs liabilities
   - Type: clustered column
   - Source: total assets, total liabilities, net assets
3. Monthly balance trend
   - Type: line
   - Source: daily or transaction-order running balances

## Quantified analysis

- Total assets
- Total liabilities
- Net assets
- Debt-to-asset ratio
- Largest-account concentration
- Month-to-date change by account
```

## Extending chart rules

- When the user requests a new chart, add the same rule to `CHART.md`.
- When the user requests new quantified analysis, record the metric name and source logic in `CHART.md`.
- Keep future months aligned with the latest `CHART.md` rules unless the user explicitly overrides them.
