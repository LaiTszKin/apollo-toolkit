# ACCOUNT.md format

Use `ACCOUNT.md` as the canonical account registry.

## Required structure

Start with a short heading and a Markdown table:

```md
# Accounts

| ID | Name | Class | Currency | Status | Aliases | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| cash-wallet | Wallet | asset | HKD | active | cash, pocket money | Daily cash spending |
| hsbc-card | HSBC Card | liability | HKD | active | card, visa | Main credit card |
```

## Field rules

- `ID`: stable machine-friendly identifier; keep it unchanged when the display name changes.
- `Name`: the user-facing account name.
- `Class`: use at least `asset` or `liability`.
- `Currency`: keep the currency explicit even if all accounts share one currency.
- `Status`: use values such as `active`, `closed`, or `archived`.
- `Aliases`: comma-separated names the user may naturally use in requests.
- `Notes`: optional disambiguation such as bank, owner, or usage.

## Maintenance rules

- Add new rows when the user creates a new account.
- Update `Name` and `Aliases` when the user renames an account.
- Do not create a second row for a rename; keep the same `ID`.
- If an account is no longer used, change `Status` instead of deleting historical identity.
