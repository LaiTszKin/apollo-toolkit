#!/usr/bin/env python3

from __future__ import annotations

import argparse
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "review_threads.py"
SPEC = importlib.util.spec_from_file_location("review_threads", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ReviewThreadsTests(unittest.TestCase):
    def test_parse_owner_repo(self) -> None:
        self.assertEqual(MODULE.parse_owner_repo("octo/repo"), ("octo", "repo"))

    def test_parse_owner_repo_rejects_invalid_format(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.parse_owner_repo("octo")

    def test_parse_owner_repo_rejects_extra_segments(self) -> None:
        with self.assertRaises(ValueError):
            MODULE.parse_owner_repo("octo/repo/extra")

    def test_load_thread_ids_supports_multiple_shapes(self) -> None:
        payload = {"adopted_thread_ids": ["A", "B", "A"]}
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir) / "ids.json"
            tmp_path.write_text(json.dumps(payload), encoding="utf-8")
            ids = MODULE.load_thread_ids(str(tmp_path))

        self.assertEqual(ids, ["A", "B"])

    def test_collect_thread_ids_from_flags(self) -> None:
        args = argparse.Namespace(
            all_unresolved=True,
            thread_id=["thread-2"],
            thread_id_file=None,
        )
        unresolved = [{"thread_id": "thread-1"}, {"thread_id": "thread-2"}]

        ids = MODULE.collect_thread_ids(args, unresolved)

        self.assertEqual(ids, ["thread-1", "thread-2"])

    def test_load_thread_ids_ignores_non_dict_thread_entries(self) -> None:
        payload = {"threads": [{"thread_id": "A"}, "bad", 123, {"thread_id": "B"}]}
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir) / "ids.json"
            tmp_path.write_text(json.dumps(payload), encoding="utf-8")
            ids = MODULE.load_thread_ids(str(tmp_path))

        self.assertEqual(ids, ["A", "B"])

    def test_render_location_without_line(self) -> None:
        self.assertEqual(MODULE.render_location({"path": "a.txt", "line": None}), "a.txt")

    def test_filter_threads(self) -> None:
        data = [
            {"id": "a", "isResolved": True},
            {"id": "b", "isResolved": False},
        ]
        self.assertEqual(len(MODULE.filter_threads(data, "resolved")), 1)
        self.assertEqual(len(MODULE.filter_threads(data, "unresolved")), 1)
        self.assertEqual(len(MODULE.filter_threads(data, "all")), 2)


if __name__ == "__main__":
    unittest.main()
