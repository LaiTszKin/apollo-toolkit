#!/usr/bin/env python3
"""Tests for the codex-memory-manager memory template reference."""

from __future__ import annotations

import unittest
from pathlib import Path


TEMPLATE_PATH = (
    Path(__file__).resolve().parents[1]
    / "references"
    / "templates"
    / "memory-file.md"
)


class MemoryTemplateTests(unittest.TestCase):
    def test_template_contains_required_sections(self) -> None:
        content = TEMPLATE_PATH.read_text(encoding="utf-8")

        self.assertIn("# User Memory - [Category Name]", content)
        self.assertIn("## Scope", content)
        self.assertIn("## Preferences", content)
        self.assertIn("## Maintenance", content)
        self.assertIn("## Evidence notes", content)

    def test_template_enforces_preference_first_generalization_rules(self) -> None:
        content = TEMPLATE_PATH.read_text(encoding="utf-8")

        self.assertIn("preference-heavy and reusable across projects", content)
        self.assertIn("Remove or rewrite project names, issue numbers, branch names", content)
        self.assertIn("Split the file when it starts mixing unrelated decision domains", content)


if __name__ == "__main__":
    unittest.main()
