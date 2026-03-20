# Official Marginfi Development Notes

Checked against official marginfi docs on 2026-03-20.

## Canonical official sources

- Docs home: `https://docs.marginfi.com/`
- TypeScript SDK docs: `https://docs.marginfi.com/ts-sdk`
- Rust CLI docs: `https://docs.marginfi.com/rust-sdk`
- Protocol design: `https://docs.marginfi.com/protocol-design`
- Program docs (`mfi-v2`): `https://docs.marginfi.com/mfi-v2`
- The Arena docs: `https://docs.marginfi.com/the-arena`

## 1. Protocol model to keep in mind

marginfi is a pooled-balance lending protocol on Solana. The main developer objects are:

- `MarginfiGroup`: protocol-wide configuration and shared state for a deployment.
- `Bank`: the per-asset pool with oracle config, risk weights, limits, and utilization-driven rates.
- `MarginfiAccount`: the user's margin account that holds deposits and liabilities across banks.

Important protocol-design facts from the official docs:

- Risk is controlled by asset weights, liability weights, and loan-to-value style constraints.
- Oracles come from Pyth and Switchboard, with confidence and staleness checks before prices are accepted.
- Docs mention a maximum oracle staleness of 60 seconds and a 95% confidence interval requirement.
- Pyth EMA pricing is described as roughly 5,921 slots (about 1 hour) for smoothing.
- Interest rates use a two-segment utilization curve: rates rise with utilization, then increase more aggressively after the optimal-utilization threshold.
- Asset risk tiers include collateral-style assets, borrow-only assets, and isolated assets.

Use these facts when reasoning about account health, liquidations, and bank config; do not reduce health checks to simple spot-price math.

## 2. Official addresses and environments

The official docs currently expose these environment values across the docs home and protocol-design pages:

- Mainnet program: `MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA`
- Mainnet group: `FCPfpHAjHn9R6vWQbtyzcN8PjjobJABQj9rChmC6Cv5j`
- Staging program: `stag8sTKDs4Df2RehcgddBVAtDx6gbDp7YkA94R6HvK`
- Staging group: `2rpQwP4ofD6P2AojSeyjc9kUCzjscX4oMtd2N4eySe7W`

Treat these as time-sensitive. Re-check the docs page before hardcoding them in new work.

## 3. TypeScript SDK essentials

Official docs point to the npm package `@mrgnlabs/marginfi-client-v2` plus `@mrgnlabs/mrgn-common` helpers.

Core setup flow from the docs:

1. Create a Solana `Connection`.
2. Build a wallet adapter or `NodeWallet`.
3. Load `getConfig("production")` or another environment config.
4. Call `MarginfiClient.fetch(config, wallet, connection)`.
5. Fetch existing marginfi accounts for the authority, or create one.
6. Resolve the target bank, then perform actions.

Minimal example pattern:

```ts
import { Connection } from "@solana/web3.js";
import { MarginfiClient, getConfig } from "@mrgnlabs/marginfi-client-v2";
import { NodeWallet } from "@mrgnlabs/mrgn-common";

const connection = new Connection(process.env.RPC_URL!, "confirmed");
const wallet = NodeWallet.local();
const config = getConfig("production");
const client = await MarginfiClient.fetch(config, wallet, connection);

const accounts = await client.getMarginfiAccountsForAuthority();
const account = accounts[0] ?? (await client.createMarginfiAccount());
const bank = client.getBankByTokenSymbol("SOL");
if (!bank) throw new Error("SOL bank not found");

await account.deposit(1, bank.address);
```

Useful SDK objects and methods called out in the docs:

- Client bootstrap: `MarginfiClient.fetch`, `getConfig`
- Bank lookup: `getBankByTokenSymbol`, `getBankByMint`, `getBankByPk`
- Oracle helpers: `getOraclePriceByBank`
- Account discovery: `getMarginfiAccountsForAuthority`
- Account creation: `createMarginfiAccount`
- Permissionless-bank support: `createLendingPool`
- Transaction helper: `processTransaction`
- Margin-account actions on `MarginfiAccountWrapper`: `deposit`, `withdraw`, `borrow`, `repay`, `reload`

Prefer these helpers before assembling raw instructions manually.

## 4. Flash-loan development notes

Official TS SDK docs describe `buildFlashLoanTx` as the preferred helper for building full flash-loan transactions.

The program docs describe flash loans as:

- `lending_account_start_flashloan`
- user instructions that consume the temporary liquidity
- `lending_account_end_flashloan`

Important implementation rules:

- Flash loans must begin and end in the same transaction.
- The end instruction must reference the correct end index.
- Nested or malformed flash-loan flows are rejected.
- Relevant program errors include `AccountInFlashloan`, `IllegalFlashloan`, `IllegalFlag`, and `NoFlashloanInProgress`.

If you need raw control, mirror the exact begin/end instruction ordering from the official docs.

## 5. Rust CLI essentials

The Rust CLI docs describe profile-based configuration through `marginfi profile` and account or bank operations through `marginfi group` and `marginfi account` subcommands.

Representative CLI flows from the docs:

- profile and authority setup: `marginfi profile create`, `marginfi profile set`
- account flows: `marginfi account create`, `deposit`, `borrow`, `withdraw`, `repay`
- bank and admin flows: `marginfi group add-bank`, `configure-bank`, `collect-fees`, `setup-emissions`, `update-emissions`
- permissionless-bank creation: `marginfi group add-bank-permissionless`

Use the CLI when the job is operational, administrative, or quick to script from the terminal. Use the TS SDK when embedding marginfi into apps or bots.

## 6. Permissionless banks and The Arena

The Arena docs describe a permissionless flow where developers can create marginfi banks from listed tokens.

Important configuration areas surfaced in the official docs:

- `asset_weight_init` / `asset_weight_maint`
- `liability_weight_init` / `liability_weight_maint`
- deposit and borrow limits
- interest-rate curve parameters such as optimal utilization, plateau rate, max rate, and fees
- `risk_tier`
- `operational_state`
- `oracle_setup`

The official TS docs also show `BankConfigOpt`, `InterestRateConfigOpt`, `OracleSetup`, `RiskTier`, and `OperationalState` in the permissionless-bank example.

When implementing bank creation:

- treat every config field as an explicit input
- validate the oracle source and required feed accounts
- keep listing-criteria and The Arena docs open while coding
- do not fabricate safe defaults for weights or limits

## 7. Program instruction map

The `mfi-v2` docs expose the on-chain instruction set and typed errors.

Key instruction families to consult before raw program work:

- marginfi-group initialization and configuration
- bank creation and configuration
- margin-account creation
- deposit / withdraw
- borrow / repay
- emissions setup and update
- liquidate
- flash-loan begin / end
- account transfer flows

Useful error names exposed in the docs include:

- `Unauthorized`
- `BankNotFound`
- `MarginfiAccountNotFound`
- `OperationWithdrawOnly`
- `IllegalLiquidation`
- `IllegalFlashloan`
- `AccountInFlashloan`
- `NoFlashloanInProgress`
- `SwitchboardStalePrice`
- `CannotCloseOutstandingEmissions`

When surfacing failures to users, translate these into the failed business condition instead of echoing raw Solana logs only.

## 8. Security and operational notes

The docs highlight:

- Halborn and Sec3 audits
- fuzz testing
- a bug-bounty program
- verifiable-build support via `solana-verify`

The official verification example is:

```bash
solana-verify verify-from-repo -um --program-id MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA https://github.com/mrgnlabs/marginfi-v2
```

Use these references when the task touches deployment verification, trust assumptions, or upgrade review.
