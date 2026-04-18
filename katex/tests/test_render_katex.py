#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import json
import os
import random
import string
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "render_katex.py"
SHELL_SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "render_katex.sh"
SPEC = importlib.util.spec_from_file_location("render_katex", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class RenderKatexTests(unittest.TestCase):
    def test_load_macro_pairs_rejects_invalid_values(self) -> None:
        with self.assertRaises(MODULE.KatexRenderError):
            MODULE.load_macro_pairs(["\\RR"])

        with self.assertRaises(MODULE.KatexRenderError):
            MODULE.load_macro_pairs(["\\RR:"])

    def test_normalize_path_property_returns_absolute_resolved_path(self) -> None:
        generator = random.Random(20260418)
        alphabet = string.ascii_letters + string.digits

        with tempfile.TemporaryDirectory() as temp_dir:
            with patch("pathlib.Path.cwd", return_value=Path(temp_dir)):
                for _ in range(120):
                    depth = generator.randint(1, 4)
                    pieces = [
                        "".join(generator.choice(alphabet) for _ in range(generator.randint(1, 8)))
                        for _ in range(depth)
                    ]
                    raw_path = "/".join(pieces)
                    normalized = MODULE.normalize_path(raw_path)
                    with self.subTest(raw_path=raw_path):
                        self.assertTrue(normalized.is_absolute())
                        self.assertEqual(normalized, (Path(temp_dir) / raw_path).resolve())

    def test_wrap_output_json_includes_metadata(self) -> None:
        args = types.SimpleNamespace(
            output_format="json",
            display_mode=True,
            katex_format="htmlAndMathml",
            css_href="https://cdn.example.com/katex.css",
        )

        payload = json.loads(MODULE.wrap_output("<span>ok</span>", r"x^2", args))
        self.assertEqual(payload["tex"], r"x^2")
        self.assertEqual(payload["displayMode"], True)
        self.assertEqual(payload["content"], "<span>ok</span>")

    def test_run_katex_cli_builds_expected_command(self) -> None:
        captured = {}
        with tempfile.TemporaryDirectory() as temp_dir:
            macro_file = Path(temp_dir) / "macros.json"
            macro_file.write_text('{"\\\\RR":"\\\\mathbb{R}"}\n', encoding="utf-8")
            args = types.SimpleNamespace(
                katex_format="html",
                display_mode=True,
                leqno=True,
                fleqn=False,
                color_is_text_color=True,
                no_throw_on_error=True,
                error_color="#cc0000",
                strict="warn",
                trust="true",
                max_size=12.5,
                max_expand=500,
                min_rule_thickness=0.08,
                macro=[r"\RR:\mathbb{R}"],
                macro_file=str(macro_file),
            )

            def fake_run(command, **kwargs):
                captured["command"] = command
                captured["kwargs"] = kwargs
                return types.SimpleNamespace(returncode=0, stdout="<span>rendered</span>", stderr="")

            with patch.object(MODULE.subprocess, "run", side_effect=fake_run):
                output = MODULE.run_katex_cli(r"\RR + x", args)

        self.assertEqual(output, "<span>rendered</span>")
        command = captured["command"]
        self.assertIn("--display-mode", command)
        self.assertIn("--leqno", command)
        self.assertIn("--color-is-text-color", command)
        self.assertIn("--no-throw-on-error", command)
        self.assertIn("--macro", command)
        self.assertIn(r"\RR:\mathbb{R}", command)
        self.assertIn("--macro-file", command)
        self.assertIn("--input", command)

    def test_main_writes_output_file_when_renderer_succeeds(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "out" / "katex.html"
            argv = [
                "--tex",
                r"\int_0^1 x^2 dx",
                "--output-format",
                "html-page",
                "--output-file",
                str(output_path),
                "--title",
                "Sample Render",
            ]

            with patch.object(MODULE, "run_katex_cli", return_value="<span>ok</span>"), patch(
                "sys.stdout", new_callable=io.StringIO
            ) as stdout:
                exit_code = MODULE.main(argv)

            self.assertEqual(exit_code, 0)
            self.assertIn(str(output_path.resolve()), stdout.getvalue())
            self.assertIn("<span>ok</span>", output_path.read_text(encoding="utf-8"))
            self.assertIn("Sample Render", output_path.read_text(encoding="utf-8"))

    def test_main_reports_missing_node_tooling(self) -> None:
        error = FileNotFoundError(2, "No such file or directory", "npx")

        with patch.object(MODULE, "run_katex_cli", side_effect=error), patch(
            "sys.stderr", new_callable=io.StringIO
        ) as stderr:
            exit_code = MODULE.main(["--tex", r"x+1"])

        self.assertEqual(exit_code, 1)
        self.assertIn("node and npx are required", stderr.getvalue())

    def test_shell_wrapper_invokes_python_script_with_same_arguments(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            capture_path = Path(temp_dir) / "argv.json"
            fake_python = Path(temp_dir) / "python3"
            fake_python.write_text(
                f"#!{sys.executable}\n"
                "import json, os, sys\n"
                "with open(os.environ['CAPTURE_PATH'], 'w', encoding='utf-8') as handle:\n"
                "    json.dump(sys.argv[1:], handle)\n",
                encoding="utf-8",
            )
            fake_python.chmod(0o755)

            env = dict(os.environ)
            env["PATH"] = f"{temp_dir}:{env['PATH']}"
            env["CAPTURE_PATH"] = str(capture_path)

            result = subprocess.run(
                ["bash", str(SHELL_SCRIPT_PATH), "--tex", r"x^2", "--output-format", "json"],
                capture_output=True,
                text=True,
                env=env,
                check=False,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            argv = json.loads(capture_path.read_text(encoding="utf-8"))
            self.assertEqual(argv[0], str(SCRIPT_PATH))
            self.assertEqual(argv[1:], ["--tex", r"x^2", "--output-format", "json"])


if __name__ == "__main__":
    unittest.main()
