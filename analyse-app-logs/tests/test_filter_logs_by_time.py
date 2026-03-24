#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "filter_logs_by_time.py"
SCRIPT_DIR = SCRIPT_PATH.parent
if str(SCRIPT_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPT_DIR))
SPEC = importlib.util.spec_from_file_location("filter_logs_by_time", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FilterLogsByTimeTests(unittest.TestCase):
    def test_filters_lines_inside_window(self) -> None:
        with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False) as handle:
            handle.write(
                "2026-03-24T10:00:00Z INFO boot\n"
                "2026-03-24T10:05:00Z ERROR failed\n"
                "2026-03-24T10:10:00Z INFO recovered\n"
            )
            path = handle.name

        args = Namespace(
            paths=[path],
            start="2026-03-24T10:01:00Z",
            end="2026-03-24T10:06:00Z",
            assume_timezone="UTC",
            keep_undated=False,
            count_only=False,
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "sys.stdout", new_callable=io.StringIO
        ) as stdout:
            code = MODULE.main()

        self.assertEqual(code, 0)
        self.assertEqual(stdout.getvalue().strip(), "2026-03-24T10:05:00Z ERROR failed")

    def test_keep_undated_lines_when_requested(self) -> None:
        with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False) as handle:
            handle.write(
                "2026-03-24T10:00:00Z INFO boot\n"
                "plain undated line\n"
            )
            path = handle.name

        args = Namespace(
            paths=[path],
            start=None,
            end=None,
            assume_timezone="UTC",
            keep_undated=True,
            count_only=False,
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "sys.stdout", new_callable=io.StringIO
        ) as stdout:
            code = MODULE.main()

        self.assertEqual(code, 0)
        self.assertIn("plain undated line", stdout.getvalue())

    def test_rejects_inverted_window(self) -> None:
        args = Namespace(
            paths=[],
            start="2026-03-24T10:10:00Z",
            end="2026-03-24T10:00:00Z",
            assume_timezone="UTC",
            keep_undated=False,
            count_only=False,
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch(
            "sys.stderr", new_callable=io.StringIO
        ) as stderr:
            code = MODULE.main()

        self.assertEqual(code, 1)
        self.assertIn("--start", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
