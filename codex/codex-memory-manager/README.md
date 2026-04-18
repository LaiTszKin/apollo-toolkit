# codex-memory-manager

Persist durable user preferences from recent Codex conversations into reusable, preference-first memory files and a synchronized AGENTS index.

## Highlights

- Reads the last 24 hours of `~/.codex/sessions` and `~/.codex/archived_sessions`
- Stores categorized preference memory under `~/.codex/memory/*.md`
- Uses a normalized `Scope / Preferences / Maintenance / Evidence notes` memory template
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
├── references/
│   └── templates/
│       └── memory-file.md
├── scripts/
│   ├── extract_recent_conversations.py
│   └── sync_memory_index.py
└── tests/
    ├── test_memory_template.py
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
apltk extract-codex-conversations --lookback-minutes 1440
```

Refresh the AGENTS memory index after updating the memory files:

```bash
apltk sync-codex-memory-index --agents-file ~/.codex/AGENTS.md --memory-dir ~/.codex/memory
```

Use the bundled memory template when creating or refactoring category files:

```bash
sed -n '1,200p' references/templates/memory-file.md
```

## License

MIT. See `LICENSE` for details.
