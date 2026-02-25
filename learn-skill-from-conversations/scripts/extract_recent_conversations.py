#!/usr/bin/env python3
"""Extract recent Codex conversation history from ~/.codex/sessions."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple


@dataclass
class SessionRecord:
    path: Path
    timestamp_utc: datetime


def parse_iso_timestamp(raw: Optional[str]) -> Optional[datetime]:
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def read_session_timestamp(path: Path) -> Optional[datetime]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            first_line = handle.readline().strip()
    except OSError:
        return None

    if not first_line:
        return None

    try:
        first_entry = json.loads(first_line)
    except json.JSONDecodeError:
        return None

    if first_entry.get("type") != "session_meta":
        return None

    payload = first_entry.get("payload", {})
    if not isinstance(payload, dict):
        return None

    return parse_iso_timestamp(payload.get("timestamp")) or parse_iso_timestamp(first_entry.get("timestamp"))


def find_recent_sessions(
    sessions_dir: Path,
    cutoff_utc: datetime,
    limit: Optional[int],
) -> List[SessionRecord]:
    candidates: List[SessionRecord] = []

    for path in sessions_dir.rglob("*.jsonl"):
        timestamp_utc = read_session_timestamp(path)
        if timestamp_utc is None:
            continue
        if timestamp_utc < cutoff_utc:
            continue
        candidates.append(SessionRecord(path=path, timestamp_utc=timestamp_utc))

    candidates.sort(key=lambda record: record.timestamp_utc, reverse=True)
    if limit is None:
        return candidates
    return candidates[:limit]


def sanitize_text(text: str, max_chars: int) -> str:
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if max_chars <= 0:
        return cleaned
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 1].rstrip() + "..."


def looks_like_wrapper_message(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return True
    lower = stripped.lower()
    return (
        stripped.startswith("# AGENTS.md instructions for")
        or stripped.startswith("<environment_context>")
        or "<collaboration_mode>" in lower
        or stripped.startswith("<permissions instructions>")
        or stripped.startswith("<app-context>")
    )


def extract_text_from_content(content: Sequence[object]) -> str:
    texts: List[str] = []
    for part in content:
        if not isinstance(part, dict):
            continue
        part_type = part.get("type")
        if part_type in {"input_text", "output_text", "text"}:
            value = part.get("text", "")
            if isinstance(value, str) and value.strip():
                texts.append(value)
    return "\n".join(texts).strip()


def extract_messages_from_event_entries(entries: Iterable[dict], max_chars: int) -> List[Tuple[str, str]]:
    messages: List[Tuple[str, str]] = []
    for entry in entries:
        if entry.get("type") != "event_msg":
            continue
        payload = entry.get("payload", {})
        if not isinstance(payload, dict):
            continue

        payload_type = payload.get("type")
        if payload_type == "user_message":
            text = payload.get("message", "")
            if isinstance(text, str) and text.strip():
                messages.append(("user", sanitize_text(text, max_chars)))
        elif payload_type == "agent_message":
            text = payload.get("message", "")
            if isinstance(text, str) and text.strip():
                messages.append(("assistant", sanitize_text(text, max_chars)))
    return messages


def extract_messages_from_response_items(entries: Iterable[dict], max_chars: int) -> List[Tuple[str, str]]:
    messages: List[Tuple[str, str]] = []
    for entry in entries:
        if entry.get("type") != "response_item":
            continue
        payload = entry.get("payload", {})
        if not isinstance(payload, dict):
            continue
        if payload.get("type") != "message":
            continue

        role = payload.get("role")
        if role not in {"user", "assistant"}:
            continue

        text = extract_text_from_content(payload.get("content", []))
        if not text or looks_like_wrapper_message(text):
            continue
        messages.append((role, sanitize_text(text, max_chars)))
    return messages


def extract_session_messages(path: Path, max_chars: int) -> List[Tuple[str, str]]:
    entries: List[dict] = []
    try:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return []

    event_messages = extract_messages_from_event_entries(entries, max_chars)
    if event_messages:
        return event_messages
    return extract_messages_from_response_items(entries, max_chars)


def render_text_output(records: Sequence[SessionRecord], lookback_minutes: int, max_chars: int) -> str:
    if not records:
        return "NO_RECENT_CONVERSATIONS"

    lines: List[str] = [
        f"RECENT_CONVERSATIONS_FOUND={len(records)}",
        f"LOOKBACK_MINUTES={lookback_minutes}",
    ]

    for index, record in enumerate(records, start=1):
        lines.append(f"=== SESSION {index} ===")
        lines.append(f"TIMESTAMP_UTC={record.timestamp_utc.isoformat()}")
        lines.append(f"FILE={record.path}")

        messages = extract_session_messages(record.path, max_chars)
        if not messages:
            lines.append("MESSAGES=NONE")
            continue

        for role, message in messages:
            tag = "USER" if role == "user" else "ASSISTANT"
            lines.append(f"[{tag}]")
            lines.append(message)
            lines.append(f"[/{tag}]")

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract the latest conversation history from ~/.codex/sessions",
    )
    parser.add_argument(
        "--sessions-dir",
        default="~/.codex/sessions",
        help="Path to the Codex sessions directory (default: ~/.codex/sessions)",
    )
    parser.add_argument(
        "--lookback-minutes",
        type=int,
        default=60,
        help="How far back to look for sessions (default: 60)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of sessions to return (default: all within lookback window)",
    )
    parser.add_argument(
        "--max-message-chars",
        type=int,
        default=1600,
        help="Maximum characters per extracted message (default: 1600)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    sessions_dir = Path(args.sessions_dir).expanduser().resolve()
    lookback_minutes = max(args.lookback_minutes, 1)
    limit = args.limit if args.limit is not None and args.limit > 0 else None
    max_message_chars = max(args.max_message_chars, 100)

    if not sessions_dir.exists() or not sessions_dir.is_dir():
        print("NO_RECENT_CONVERSATIONS")
        return 0

    cutoff_utc = datetime.now(timezone.utc) - timedelta(minutes=lookback_minutes)
    recent_records = find_recent_sessions(sessions_dir, cutoff_utc, limit)

    print(render_text_output(recent_records, lookback_minutes, max_message_chars))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
