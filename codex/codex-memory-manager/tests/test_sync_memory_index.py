#!/usr/bin/env python3
"""Tests for sync_memory_index.py."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "sync_memory_index.py"


def run_sync(agents_file: Path, memory_dir: Path, *extra_args: str) -> str:
    cmd = [
        sys.executable,
        str(SCRIPT_PATH),
        "--agents-file",
        str(agents_file),
        "--memory-dir",
        str(memory_dir),
    ]
    cmd.extend(extra_args)
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout


class SyncMemoryIndexTests(unittest.TestCase):
    def test_appends_memory_index_with_sorted_links(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            agents_file = root / "AGENTS.md"
            agents_file.write_text("# Base Instructions\n", encoding="utf-8")
            memory_dir = root / "memory"
            memory_dir.mkdir()
            (memory_dir / "workflow-preferences.md").write_text("# Workflow Preferences\n", encoding="utf-8")
            (memory_dir / "architecture-preferences.md").write_text("# Architecture Preferences\n", encoding="utf-8")

            run_sync(agents_file, memory_dir)

            content = agents_file.read_text(encoding="utf-8")
            self.assertIn("## User Memory Index", content)
            self.assertIn("Before starting work, review the index below", content)
            self.assertLess(
                content.index("[Architecture Preferences]"),
                content.index("[Workflow Preferences]"),
            )

    def test_replaces_existing_managed_section_without_duplication(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            agents_file = root / "AGENTS.md"
            agents_file.write_text(
                "# Base\n\n<!-- codex-memory-manager:start -->\nold\n<!-- codex-memory-manager:end -->\n",
                encoding="utf-8",
            )
            memory_dir = root / "memory"
            memory_dir.mkdir()
            (memory_dir / "style-preferences.md").write_text("# Style Preferences\n", encoding="utf-8")

            run_sync(agents_file, memory_dir, "--instruction-line", "Read this first.")

            content = agents_file.read_text(encoding="utf-8")
            self.assertEqual(content.count("<!-- codex-memory-manager:start -->"), 1)
            self.assertIn("Read this first.", content)
            self.assertNotIn("\nold\n", content)

    def test_uses_filename_when_heading_is_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            agents_file = root / "AGENTS.md"
            memory_dir = root / "memory"
            memory_dir.mkdir()
            (memory_dir / "java-preferences.md").write_text("No heading here\n", encoding="utf-8")

            run_sync(agents_file, memory_dir)

            content = agents_file.read_text(encoding="utf-8")
            self.assertIn("[Java Preferences]", content)


if __name__ == "__main__":
    unittest.main()
