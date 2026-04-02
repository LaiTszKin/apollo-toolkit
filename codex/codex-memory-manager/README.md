# codex-memory-manager

Persist durable user preferences from recent Codex conversations into categorized memory files and a synchronized AGENTS index.

## Highlights

- Reads the last 24 hours of `~/.codex/sessions` and `~/.codex/archived_sessions`
- Stores categorized preference memory under `~/.codex/memory/*.md`
- Keeps a normalized memory index at the end of `~/.codex/AGENTS.md`
- Adds new index entries automatically when new preference categories appear
- Preserves the existing language already used in `~/.codex/AGENTS.md`

## Project Structure

```text
.
├── SKILL.md
├── README.md
├── LICENSE
├── agents/
│   └── openai.yaml
├── scripts/
│   ├── extract_recent_conversations.py
│   └── sync_memory_index.py
└── tests/
    ├── test_extract_recent_conversations.py
    └── test_sync_memory_index.py
```

## Requirements

- Python 3.9+
- Access to `~/.codex/sessions`
- Access to `~/.codex/archived_sessions`
- Write access to `~/.codex/AGENTS.md`
- Write access to `~/.codex/memory/`

## Quick Start

Extract the recent conversations:

```bash
python3 scripts/extract_recent_conversations.py --lookback-minutes 1440
```

Refresh the AGENTS memory index after updating the memory files:

```bash
python3 scripts/sync_memory_index.py --agents-file ~/.codex/AGENTS.md --memory-dir ~/.codex/memory
```

## License

MIT. See `LICENSE` for details.
