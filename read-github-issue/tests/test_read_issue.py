#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import json
import unittest
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "read_issue.py"
SPEC = importlib.util.spec_from_file_location("read_issue", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReadIssueTests(unittest.TestCase):
    def test_build_command_with_repo(self) -> None:
        args = Namespace(issue="123", repo="owner/repo", comments=False, json=False)

        self.assertEqual(
            MODULE.build_command(args),
            [
                "gh",
                "issue",
                "view",
                "123",
                "--json",
                MODULE.ISSUE_FIELDS,
                "--repo",
                "owner/repo",
            ],
        )

    def test_main_returns_error_when_gh_missing(self) -> None:
        args = Namespace(issue="123", repo=None, comments=False, json=False)

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "subprocess.run", side_effect=FileNotFoundError
        ), patch("sys.stderr", new_callable=io.StringIO) as stderr:
            code = MODULE.main()

        self.assertEqual(code, 1)
        self.assertIn("not in PATH", stderr.getvalue())

    def test_main_json_output(self) -> None:
        args = Namespace(issue="123", repo=None, comments=False, json=True)
        payload = {
            "number": 123,
            "title": "Need better retries",
            "body": "detail",
            "state": "OPEN",
            "author": {"login": "octocat"},
            "labels": [],
            "assignees": [],
            "comments": [],
            "createdAt": "2026-03-24T00:00:00Z",
            "updatedAt": "2026-03-24T01:00:00Z",
            "closedAt": None,
            "url": "https://github.com/owner/repo/issues/123",
        }

        class Result:
            stdout = json.dumps(payload)

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "subprocess.run", return_value=Result()
        ), patch("sys.stdout", new_callable=io.StringIO) as stdout:
            code = MODULE.main()

        self.assertEqual(code, 0)
        self.assertEqual(json.loads(stdout.getvalue()), payload)

    def test_print_summary_includes_comments(self) -> None:
        issue = {
            "number": 123,
            "title": "Need better retries",
            "body": "detail",
            "state": "OPEN",
            "author": {"login": "octocat"},
            "labels": [{"name": "bug"}],
            "assignees": [{"login": "alice"}],
            "comments": [
                {
                    "author": {"login": "bob"},
                    "createdAt": "2026-03-24T02:00:00Z",
                    "body": "extra context",
                }
            ],
            "createdAt": "2026-03-24T00:00:00Z",
            "updatedAt": "2026-03-24T01:00:00Z",
            "closedAt": None,
            "url": "https://github.com/owner/repo/issues/123",
        }

        with patch("sys.stdout", new_callable=io.StringIO) as stdout:
            MODULE.print_summary(issue, include_comments=True)

        output = stdout.getvalue()
        self.assertIn("#123", output)
        self.assertIn("bug", output)
        self.assertIn("extra context", output)


if __name__ == "__main__":
    unittest.main()
