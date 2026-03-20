# Marginfi Development

`marginfi-development` is a reusable skill for building or reviewing integrations on the marginfi protocol with official documentation as the source of truth.

It helps an agent:

1. Choose the correct marginfi development surface.
2. Reconfirm official addresses, groups, and environment details.
3. Implement or explain deposits, borrows, repayments, withdrawals, flash loans, liquidations, or permissionless banks.
4. Map raw `mfi-v2` instructions and errors when SDK helpers are not enough.

## Repository layout

- `SKILL.md`: trigger rules, workflow, and guardrails
- `agents/openai.yaml`: agent-facing metadata
- `references/official-development-notes.md`: condensed official development guidance
- `references/source-index.md`: quick source routing for official docs

## Main use cases

Use this skill for:

- marginfi SDK integration work
- Solana bots or backends that interact with marginfi
- bank configuration and The Arena permissionless-bank flows
- flash-loan or liquidation implementation reviews
- raw instruction or error mapping against `mfi-v2`

## License

MIT. See `LICENSE`.
