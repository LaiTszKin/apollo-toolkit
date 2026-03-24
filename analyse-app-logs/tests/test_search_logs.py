#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "search_logs.py"
SCRIPT_DIR = SCRIPT_PATH.parent
if str(SCRIPT_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPT_DIR))
SPEC = importlib.util.spec_from_file_location("search_logs", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class SearchLogsTests(unittest.TestCase):
    def test_keyword_search_respects_time_window(self) -> None:
        with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False) as handle:
            handle.write(
                "2026-03-24T10:00:00Z INFO boot\n"
                "2026-03-24T10:05:00Z ERROR payment timeout\n"
                "2026-03-24T10:10:00Z ERROR payment timeout\n"
            )
            path = handle.name

        args = Namespace(
            paths=[path],
            keyword=["timeout"],
            regex=[],
            mode="any",
            ignore_case=False,
            start="2026-03-24T10:01:00Z",
            end="2026-03-24T10:06:00Z",
            assume_timezone="UTC",
            before_context=0,
            after_context=0,
            count_only=False,
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "sys.stdout", new_callable=io.StringIO
        ) as stdout:
            code = MODULE.main()

        self.assertEqual(code, 0)
        self.assertEqual(
            stdout.getvalue().strip(),
            "2026-03-24T10:05:00Z ERROR payment timeout",
        )

    def test_all_mode_requires_every_matcher(self) -> None:
        matchers = [
            lambda line: "timeout" in line,
            lambda line: "payment" in line,
        ]

        self.assertTrue(MODULE.line_matches("payment timeout", matchers, "all"))
        self.assertFalse(MODULE.line_matches("timeout only", matchers, "all"))

    def test_count_only_reports_match_total(self) -> None:
        with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False) as handle:
            handle.write(
                "2026-03-24T10:00:00Z INFO boot\n"
                "2026-03-24T10:05:00Z ERROR payment timeout\n"
                "2026-03-24T10:06:00Z WARN retry timeout\n"
            )
            path = handle.name

        args = Namespace(
            paths=[path],
            keyword=["timeout"],
            regex=[],
            mode="any",
            ignore_case=True,
            start=None,
            end=None,
            assume_timezone="UTC",
            before_context=0,
            after_context=0,
            count_only=True,
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "sys.stdout", new_callable=io.StringIO
        ) as stdout:
            code = MODULE.main()

        self.assertEqual(code, 0)
        self.assertEqual(stdout.getvalue().strip(), "2")


if __name__ == "__main__":
    unittest.main()
