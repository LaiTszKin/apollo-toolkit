#!/usr/bin/env python3
"""Edge-case tests for extract_recent_conversations.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "extract_recent_conversations.py"
)


def write_session(path: Path, timestamp: datetime) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    entries = [
        {
            "type": "session_meta",
            "payload": {"timestamp": timestamp.isoformat()},
        },
        {
            "type": "event_msg",
            "payload": {"type": "user_message", "message": f"user:{path.stem}"},
        },
        {
            "type": "event_msg",
            "payload": {"type": "agent_message", "message": f"assistant:{path.stem}"},
        },
    ]
    with path.open("w", encoding="utf-8") as handle:
        for entry in entries:
            handle.write(json.dumps(entry) + "\n")


def run_extractor(
    sessions_dir: Path,
    archived_dir: Path | None = None,
    *extra_args: str,
) -> str:
    effective_archived_dir = archived_dir or (sessions_dir.parent / "__isolated_archived_sessions__")
    cmd = [
        sys.executable,
        str(SCRIPT_PATH),
        "--sessions-dir",
        str(sessions_dir),
        "--archived-sessions-dir",
        str(effective_archived_dir),
    ]
    cmd.extend(extra_args)
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout


class ExtractRecentConversationsTests(unittest.TestCase):
    def test_default_lookback_covers_last_24_hours(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sessions_root = Path(tmp) / "sessions"
            now = datetime.now(timezone.utc)
            write_session(sessions_root / "recent.jsonl", now - timedelta(hours=3))

            output = run_extractor(sessions_root)

            self.assertIn("RECENT_CONVERSATIONS_FOUND=1", output)
            self.assertIn("LOOKBACK_MINUTES=1440", output)

    def test_limit_zero_is_treated_as_unlimited(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sessions_root = Path(tmp) / "sessions"
            now = datetime.now(timezone.utc)
            write_session(sessions_root / "a.jsonl", now - timedelta(minutes=5))
            write_session(sessions_root / "b.jsonl", now - timedelta(minutes=10))
            write_session(sessions_root / "c.jsonl", now - timedelta(minutes=15))

            output = run_extractor(
                sessions_root,
                None,
                "--lookback-minutes",
                "60",
                "--limit",
                "0",
            )

            self.assertIn("RECENT_CONVERSATIONS_FOUND=3", output)

    def test_archived_sessions_are_read_before_cleanup(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sessions_root = Path(tmp) / "sessions"
            archived_root = Path(tmp) / "archived_sessions"
            now = datetime.now(timezone.utc)
            archived_file = archived_root / "archived.jsonl"
            write_session(archived_file, now - timedelta(minutes=30))

            output = run_extractor(
                sessions_root,
                archived_root,
                "--lookback-minutes",
                "60",
            )

            self.assertIn("RECENT_CONVERSATIONS_FOUND=1", output)
            self.assertIn("ARCHIVED_SESSIONS_INCLUDED=true", output)
            self.assertIn("user:archived", output)
            self.assertIn("assistant:archived", output)
            self.assertIn("CLEANUP_REMOVED_ARCHIVED_SESSIONS=1", output)
            self.assertFalse(archived_file.exists())

    def test_cleanup_removes_only_old_sessions_from_sessions_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sessions_root = Path(tmp) / "sessions"
            now = datetime.now(timezone.utc)
            recent_file = sessions_root / "recent.jsonl"
            old_file = sessions_root / "old.jsonl"
            write_session(recent_file, now - timedelta(hours=6))
            write_session(old_file, now - timedelta(days=8))

            output = run_extractor(
                sessions_root,
                None,
                "--lookback-minutes",
                "1440",
                "--retention-days",
                "7",
            )

            self.assertIn("RECENT_CONVERSATIONS_FOUND=1", output)
            self.assertIn("CLEANUP_REMOVED_OLD_SESSIONS=1", output)
            self.assertTrue(recent_file.exists())
            self.assertFalse(old_file.exists())

    def test_archived_cleanup_skips_active_sessions_when_paths_overlap(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sessions_root = Path(tmp) / "sessions"
            now = datetime.now(timezone.utc)
            recent_file = sessions_root / "recent.jsonl"
            write_session(recent_file, now - timedelta(minutes=5))

            output = run_extractor(
                sessions_root,
                sessions_root,
                "--lookback-minutes",
                "60",
            )

            self.assertIn("RECENT_CONVERSATIONS_FOUND=1", output)
            self.assertIn("CLEANUP_REMOVED_ARCHIVED_SESSIONS=0", output)
            self.assertTrue(recent_file.exists())

    def test_limit_one_only_returns_latest_session_across_sources(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sessions_root = Path(tmp) / "sessions"
            archived_root = Path(tmp) / "archived_sessions"
            now = datetime.now(timezone.utc)
            write_session(sessions_root / "older.jsonl", now - timedelta(minutes=20))
            newest = archived_root / "newest.jsonl"
            write_session(newest, now - timedelta(minutes=5))

            output = run_extractor(
                sessions_root,
                archived_root,
                "--lookback-minutes",
                "60",
                "--limit",
                "1",
            )

            self.assertIn("RECENT_CONVERSATIONS_FOUND=1", output)
            self.assertIn("newest.jsonl", output)


if __name__ == "__main__":
    unittest.main()
