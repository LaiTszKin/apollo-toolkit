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
    payload = {
        "type": "session_meta",
        "payload": {"timestamp": timestamp.isoformat()},
    }
    with path.open("w", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


def run_extractor(temp_dir: Path, *extra_args: str) -> str:
    cmd = [
        sys.executable,
        str(SCRIPT_PATH),
        "--sessions-dir",
        str(temp_dir),
        "--lookback-minutes",
        "60",
        *extra_args,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout


class ExtractRecentConversationsTests(unittest.TestCase):
    def test_default_limit_returns_all_recent_sessions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            now = datetime.now(timezone.utc)
            write_session(root / "a.jsonl", now - timedelta(minutes=5))
            write_session(root / "b.jsonl", now - timedelta(minutes=10))

            output = run_extractor(root)

            self.assertIn("RECENT_CONVERSATIONS_FOUND=2", output)

    def test_limit_zero_is_treated_as_unlimited(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            now = datetime.now(timezone.utc)
            write_session(root / "a.jsonl", now - timedelta(minutes=5))
            write_session(root / "b.jsonl", now - timedelta(minutes=10))
            write_session(root / "c.jsonl", now - timedelta(minutes=15))

            output = run_extractor(root, "--limit", "0")

            self.assertIn("RECENT_CONVERSATIONS_FOUND=3", output)

    def test_limit_one_only_returns_latest_session(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            now = datetime.now(timezone.utc)
            newest = root / "newest.jsonl"
            older = root / "older.jsonl"
            write_session(newest, now - timedelta(minutes=5))
            write_session(older, now - timedelta(minutes=20))

            output = run_extractor(root, "--limit", "1")

            self.assertIn("RECENT_CONVERSATIONS_FOUND=1", output)
            self.assertIn("FILE=", output)
            self.assertIn("newest.jsonl", output)


if __name__ == "__main__":
    unittest.main()
