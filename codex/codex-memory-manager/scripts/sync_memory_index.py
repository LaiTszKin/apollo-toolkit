#!/usr/bin/env python3
"""Synchronize a normalized memory index section into ~/.codex/AGENTS.md."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable

START_MARKER = "<!-- codex-memory-manager:start -->"
END_MARKER = "<!-- codex-memory-manager:end -->"
DEFAULT_SECTION_TITLE = "## User Memory Index"
DEFAULT_INSTRUCTIONS = [
    "Before starting work, review the index below and open any relevant user preference files.",
    "When a new preference category appears, create or update the matching memory file and refresh this index.",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync the Codex user memory index section inside AGENTS.md",
    )
    parser.add_argument(
        "--agents-file",
        default="~/.codex/AGENTS.md",
        help="Path to AGENTS.md (default: ~/.codex/AGENTS.md)",
    )
    parser.add_argument(
        "--memory-dir",
        default="~/.codex/memory",
        help="Directory that stores memory markdown files (default: ~/.codex/memory)",
    )
    parser.add_argument(
        "--section-title",
        default=DEFAULT_SECTION_TITLE,
        help=f"Heading to use for the index section (default: {DEFAULT_SECTION_TITLE!r})",
    )
    parser.add_argument(
        "--instruction-line",
        action="append",
        dest="instruction_lines",
        help="Instruction line to place before the index bullets. Repeat to add more lines.",
    )
    return parser.parse_args()


def title_from_memory_file(path: Path) -> str:
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return path.stem.replace("-", " ").title()

    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip() or path.stem.replace("-", " ").title()

    return path.stem.replace("-", " ").title()


def iter_memory_files(memory_dir: Path) -> Iterable[Path]:
    if not memory_dir.exists() or not memory_dir.is_dir():
        return []
    return sorted(
        (path for path in memory_dir.glob("*.md") if path.is_file()),
        key=lambda path: path.name.lower(),
    )


def render_section(memory_files: list[Path], section_title: str, instruction_lines: list[str]) -> str:
    lines = [START_MARKER, section_title.strip(), ""]

    cleaned_instructions = [line.strip() for line in instruction_lines if line and line.strip()]
    for line in cleaned_instructions:
        lines.append(line)
    if cleaned_instructions:
        lines.append("")

    if memory_files:
        entries = sorted(
            ((title_from_memory_file(path), path.expanduser().resolve()) for path in memory_files),
            key=lambda item: (item[0].lower(), str(item[1]).lower()),
        )
        for title, path in entries:
            lines.append(f"- [{title}]({path})")
    else:
        lines.append("- No memory files are currently indexed.")

    lines.append(END_MARKER)
    return "\n".join(lines)


def remove_existing_section(content: str) -> str:
    pattern = re.compile(
        rf"\n*{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}\n*",
        re.DOTALL,
    )
    return re.sub(pattern, "\n\n", content).rstrip()


def sync_agents_file(agents_file: Path, section_text: str) -> None:
    agents_file.parent.mkdir(parents=True, exist_ok=True)
    try:
        original = agents_file.read_text(encoding="utf-8")
    except FileNotFoundError:
        original = ""

    base = remove_existing_section(original)
    if base:
        updated = f"{base}\n\n{section_text}\n"
    else:
        updated = f"{section_text}\n"
    agents_file.write_text(updated, encoding="utf-8")


def main() -> int:
    args = parse_args()
    agents_file = Path(args.agents_file).expanduser()
    memory_dir = Path(args.memory_dir).expanduser()
    instruction_lines = args.instruction_lines or DEFAULT_INSTRUCTIONS
    section_text = render_section(list(iter_memory_files(memory_dir)), args.section_title, instruction_lines)
    sync_agents_file(agents_file, section_text)
    print(f"SYNCED_AGENTS_FILE={agents_file.resolve()}")
    print(f"MEMORY_FILES_INDEXED={len(list(iter_memory_files(memory_dir)))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
