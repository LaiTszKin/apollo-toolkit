#!/usr/bin/env python3

from __future__ import annotations

import argparse
import importlib.util
import io
import json
import unittest
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "list_issues.py"
SPEC = importlib.util.spec_from_file_location("list_issues", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ListIssuesTests(unittest.TestCase):
    def test_build_command_with_filters(self) -> None:
        args = Namespace(
            repo="owner/repo",
            state="open",
            limit=25,
            label=["bug", "needs-triage"],
            search="panic parser",
            output="table",
        )

        cmd = MODULE.build_command(args)

        self.assertEqual(
            cmd,
            [
                "gh",
                "issue",
                "list",
                "--state",
                "open",
                "--limit",
                "25",
                "--json",
                MODULE.ISSUE_FIELDS,
                "--repo",
                "owner/repo",
                "--label",
                "bug",
                "--label",
                "needs-triage",
                "--search",
                "panic parser",
            ],
        )

    def test_positive_int_rejects_zero(self) -> None:
        with self.assertRaises(argparse.ArgumentTypeError):
            MODULE.positive_int("0")

    def test_truncate_handles_small_width(self) -> None:
        self.assertEqual(MODULE.truncate("abcdef", 2), "ab")

    def test_print_table_handles_missing_fields(self) -> None:
        with patch("sys.stdout", new_callable=io.StringIO) as stdout:
            MODULE.print_table([
                {
                    "number": 42,
                    "title": "Fix formatter fallback",
                }
            ])

        output = stdout.getvalue()
        self.assertIn("NUMBER", output)
        self.assertIn("#42", output)

    def test_main_returns_error_when_gh_missing(self) -> None:
        args = Namespace(
            repo=None,
            state="open",
            limit=50,
            label=[],
            search=None,
            output="table",
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "subprocess.run", side_effect=FileNotFoundError
        ), patch("sys.stderr", new_callable=io.StringIO) as stderr:
            code = MODULE.main()

        self.assertEqual(code, 1)
        self.assertIn("not in PATH", stderr.getvalue())

    def test_main_json_output(self) -> None:
        args = Namespace(
            repo=None,
            state="open",
            limit=50,
            label=[],
            search=None,
            output="json",
        )
        payload = [
            {
                "number": 1,
                "title": "Fix bug",
                "labels": [],
                "assignees": [],
                "updatedAt": "2026-02-26T00:00:00Z",
            }
        ]

        class Result:
            stdout = json.dumps(payload)

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "subprocess.run", return_value=Result()
        ), patch("sys.stdout", new_callable=io.StringIO) as stdout:
            code = MODULE.main()

        self.assertEqual(code, 0)
        self.assertEqual(json.loads(stdout.getvalue()), payload)


if __name__ == "__main__":
    unittest.main()
