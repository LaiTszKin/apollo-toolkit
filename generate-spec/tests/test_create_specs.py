#!/usr/bin/env python3

from __future__ import annotations

import importlib.machinery
import importlib.util
import io
import random
import re
import string
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "create-specs"
LOADER = importlib.machinery.SourceFileLoader("create_specs", str(SCRIPT_PATH))
SPEC = importlib.util.spec_from_loader("create_specs", LOADER)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FixedDate(date):
    @classmethod
    def today(cls) -> "FixedDate":
        return cls(2026, 4, 18)


class CreateSpecsTests(unittest.TestCase):
    def test_slugify_property_keeps_safe_slug_shape(self) -> None:
        alphabet = string.ascii_letters + string.digits + string.punctuation + " \t中文"
        generator = random.Random(20260418)

        for _ in range(250):
            raw = "".join(generator.choice(alphabet) for _ in range(generator.randint(0, 40)))
            slug = MODULE._slugify(raw)
            with self.subTest(raw=raw, slug=slug):
                self.assertEqual(slug, slug.lower())
                self.assertNotIn("--", slug)
                self.assertFalse(slug.startswith("-"))
                self.assertFalse(slug.endswith("-"))
                self.assertRegex(slug, r"^[a-z0-9-]*$")

    def test_render_replaces_all_placeholders(self) -> None:
        rendered = MODULE._render(
            content=(
                "[YYYY-MM-DD]\n"
                "[Feature Name]\n"
                "[功能名稱]\n"
                "[change_name]\n"
                "[batch_name]\n"
            ),
            today="2026-04-18",
            feature_name="Batch-safe planner",
            change_name="batch-safe-planner",
            batch_name="parallel-batch",
        )

        self.assertIn("2026-04-18", rendered)
        self.assertEqual(rendered.count("Batch-safe planner"), 2)
        self.assertIn("batch-safe-planner", rendered)
        self.assertIn("parallel-batch", rendered)

    def test_main_creates_spec_files_and_coordination_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            template_dir = root / "templates"
            output_dir = root / "docs" / "plans"
            template_dir.mkdir(parents=True)

            for name in MODULE.TEMPLATE_FILENAMES:
                (template_dir / name).write_text(
                    f"{name} [YYYY-MM-DD] [Feature Name] [change_name] [batch_name]\n",
                    encoding="utf-8",
                )
            (template_dir / MODULE.COORDINATION_TEMPLATE).write_text(
                "coordination [YYYY-MM-DD] [Feature Name] [change_name] [batch_name]\n",
                encoding="utf-8",
            )

            argv = [
                "create-specs",
                "My Feature",
                "--batch-name",
                "parallel-batch",
                "--with-coordination",
                "--output-dir",
                str(output_dir),
                "--template-dir",
                str(template_dir),
            ]

            with patch.object(MODULE, "date", FixedDate), patch.object(sys, "argv", argv), patch(
                "sys.stdout", new_callable=io.StringIO
            ) as stdout:
                exit_code = MODULE.main()

            self.assertEqual(exit_code, 0)
            change_root = output_dir / "2026-04-18" / "parallel-batch" / "my-feature"
            for name in MODULE.TEMPLATE_FILENAMES:
                content = (change_root / name).read_text(encoding="utf-8")
                self.assertIn("2026-04-18", content)
                self.assertIn("My Feature", content)
                self.assertIn("my-feature", content)
                self.assertIn("parallel-batch", content)

            coordination = output_dir / "2026-04-18" / "parallel-batch" / "coordination.md"
            self.assertTrue(coordination.is_file())
            self.assertIn(str(coordination), stdout.getvalue())

    def test_main_rejects_existing_files_without_force(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            template_dir = root / "templates"
            output_dir = root / "docs" / "plans"
            template_dir.mkdir(parents=True)
            for name in MODULE.TEMPLATE_FILENAMES:
                (template_dir / name).write_text("template\n", encoding="utf-8")

            existing_root = output_dir / "2026-04-18" / "existing-change"
            existing_root.mkdir(parents=True)
            (existing_root / "spec.md").write_text("existing\n", encoding="utf-8")

            argv = [
                "create-specs",
                "Existing Change",
                "--change-name",
                "existing-change",
                "--output-dir",
                str(output_dir),
                "--template-dir",
                str(template_dir),
            ]

            with patch.object(MODULE, "date", FixedDate), patch.object(sys, "argv", argv):
                with self.assertRaises(SystemExit) as context:
                    MODULE.main()

            self.assertIn("Files already exist", str(context.exception))

    def test_main_requires_explicit_ascii_change_name_when_slug_is_empty(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            template_dir = Path(temp_dir) / "templates"
            template_dir.mkdir(parents=True)
            for name in MODULE.TEMPLATE_FILENAMES:
                (template_dir / name).write_text("template\n", encoding="utf-8")

            argv = [
                "create-specs",
                "功能名稱",
                "--template-dir",
                str(template_dir),
            ]

            with patch.object(sys, "argv", argv):
                with self.assertRaises(SystemExit) as context:
                    MODULE.main()

            self.assertIn("Unable to build change_name", str(context.exception))


if __name__ == "__main__":
    unittest.main()
