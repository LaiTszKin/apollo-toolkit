# learn-skill-from-conversations

Learn and evolve your local Codex skill library from recent conversation logs.

This skill extracts the latest conversations from `~/.codex/sessions` and `~/.codex/archived_sessions`, identifies reusable lessons, and applies skill updates through `skill-creator`.

## Highlights

- Reads all sessions from the last 24 hours
- Stops immediately when there are no recent sessions
- Cleans up `sessions` files older than 7 days after reading
- Deletes `archived_sessions` files after reading them
- Defaults to creating a new skill unless strong overlap is confirmed
- Validates each changed skill with `quick_validate.py`

## Project Structure

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
└── scripts/
    └── extract_recent_conversations.py
```

## Requirements

- Python 3.9+
- Access to `~/.codex/sessions`
- Access to `~/.codex/archived_sessions`
- Local `skill-creator` skill at `~/.codex/skills/.system/skill-creator`

## Quick Start

Run the extractor:

```bash
python3 scripts/extract_recent_conversations.py --lookback-minutes 1440
```

- If output is `NO_RECENT_CONVERSATIONS`, no action is required.
- Otherwise, review extracted `[USER]` / `[ASSISTANT]` messages and apply updates through `skill-creator`.

## License

MIT. See `LICENSE` for details.
