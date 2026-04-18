#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import json
import os
import random
import re
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "enforce_video_aspect_ratio.py"
SPEC = importlib.util.spec_from_file_location("enforce_video_aspect_ratio", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def parse_crop(expression: str) -> tuple[int, int, int, int] | None:
    match = re.search(r"crop=(\d+):(\d+):(\d+):(\d+)", expression)
    if not match:
        return None
    return tuple(int(value) for value in match.groups())


class EnforceVideoAspectRatioTests(unittest.TestCase):
    def test_parse_size_property_round_trips_positive_dimensions(self) -> None:
        generator = random.Random(20260418)
        for _ in range(150):
            width = generator.randint(1, 9999)
            height = generator.randint(1, 9999)
            raw = f"{width}x{height}"
            with self.subTest(raw=raw):
                self.assertEqual(MODULE.parse_size(raw), (width, height))

    def test_load_dotenv_file_parses_quotes_and_respects_override(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            env_file = Path(temp_dir) / ".env"
            env_file.write_text(
                'TEXT_TO_SHORT_VIDEO_WIDTH="720"\n'
                "TEXT_TO_SHORT_VIDEO_HEIGHT=1280 # comment\n",
                encoding="utf-8",
            )
            original = os.environ.get("TEXT_TO_SHORT_VIDEO_WIDTH")
            os.environ["TEXT_TO_SHORT_VIDEO_WIDTH"] = "999"
            try:
                loaded = MODULE.load_dotenv_file(env_file, override=False)
                self.assertTrue(loaded)
                self.assertEqual(os.environ["TEXT_TO_SHORT_VIDEO_WIDTH"], "999")
                self.assertEqual(os.environ["TEXT_TO_SHORT_VIDEO_HEIGHT"], "1280")
                MODULE.load_dotenv_file(env_file, override=True)
                self.assertEqual(os.environ["TEXT_TO_SHORT_VIDEO_WIDTH"], "720")
            finally:
                if original is None:
                    os.environ.pop("TEXT_TO_SHORT_VIDEO_WIDTH", None)
                else:
                    os.environ["TEXT_TO_SHORT_VIDEO_WIDTH"] = original
                os.environ.pop("TEXT_TO_SHORT_VIDEO_HEIGHT", None)

    def test_build_video_filter_property_keeps_crop_within_bounds(self) -> None:
        generator = random.Random(20260418)
        for _ in range(200):
            input_width = generator.randint(32, 4096)
            input_height = generator.randint(32, 4096)
            target_width = generator.randint(32, 2160)
            target_height = generator.randint(32, 3840)

            expression, crop_applied = MODULE.build_video_filter(
                input_width=input_width,
                input_height=input_height,
                target_width=target_width,
                target_height=target_height,
            )

            with self.subTest(
                input_width=input_width,
                input_height=input_height,
                target_width=target_width,
                target_height=target_height,
                expression=expression,
            ):
                if expression is None:
                    self.assertFalse(crop_applied)
                    self.assertEqual((input_width, input_height), (target_width, target_height))
                    continue

                self.assertIn(f"scale={target_width}:{target_height}", expression)
                crop = parse_crop(expression)
                if crop is None:
                    self.assertFalse(crop_applied)
                    self.assertEqual(input_width * target_height, input_height * target_width)
                    continue

                crop_width, crop_height, offset_x, offset_y = crop
                self.assertTrue(crop_applied)
                self.assertEqual(crop_width % 2, 0)
                self.assertEqual(crop_height % 2, 0)
                self.assertGreaterEqual(crop_width, 2)
                self.assertGreaterEqual(crop_height, 2)
                self.assertLessEqual(crop_width, input_width)
                self.assertLessEqual(crop_height, input_height)
                self.assertGreaterEqual(offset_x, 0)
                self.assertGreaterEqual(offset_y, 0)
                self.assertLessEqual(offset_x + crop_width, input_width)
                self.assertLessEqual(offset_y + crop_height, input_height)

    def test_resolve_output_path_enforces_in_place_rules(self) -> None:
        input_video = Path("/tmp/input.mp4")
        args = types.SimpleNamespace(in_place=False, output_video=None)
        self.assertEqual(MODULE.resolve_output_path(args, input_video), Path("/tmp/input_aspect_fixed.mp4"))

        args = types.SimpleNamespace(in_place=True, output_video=None)
        self.assertEqual(MODULE.resolve_output_path(args, input_video), input_video)

        args = types.SimpleNamespace(in_place=True, output_video="/tmp/out.mp4")
        with self.assertRaises(SystemExit):
            MODULE.resolve_output_path(args, input_video)

    def test_main_copies_file_when_video_already_matches_target(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            input_video = Path(temp_dir) / "input.mp4"
            input_video.write_bytes(b"video")
            output_video = Path(temp_dir) / "copy.mp4"
            args = types.SimpleNamespace(
                input_video=str(input_video),
                output_video=str(output_video),
                in_place=False,
                target_size="640x360",
                target_width=None,
                target_height=None,
                env_file=str(Path(temp_dir) / ".env"),
                force=False,
                ffmpeg_bin="ffmpeg",
                ffprobe_bin="ffprobe",
            )

            with patch.object(MODULE, "parse_args", return_value=args), patch.object(
                MODULE, "load_dotenv_file", return_value=False
            ), patch.object(MODULE, "required_command"), patch.object(
                MODULE, "probe_video_size", return_value=(640, 360)
            ), patch("sys.stdout", new_callable=io.StringIO) as stdout:
                exit_code = MODULE.main()

            self.assertEqual(exit_code, 0)
            self.assertEqual(output_video.read_bytes(), b"video")
            self.assertIn("already matches target size", stdout.getvalue())

    def test_main_runs_ffmpeg_and_reports_output_dimensions(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            input_video = Path(temp_dir) / "input.mp4"
            output_video = Path(temp_dir) / "output.mp4"
            input_video.write_bytes(b"video")
            args = types.SimpleNamespace(
                input_video=str(input_video),
                output_video=str(output_video),
                in_place=False,
                target_size="1080x1920",
                target_width=None,
                target_height=None,
                env_file=str(Path(temp_dir) / ".env"),
                force=True,
                ffmpeg_bin="ffmpeg",
                ffprobe_bin="ffprobe",
            )

            def fake_run(command, check):
                self.assertIn("-vf", command)
                Path(command[-1]).write_bytes(b"processed")
                return types.SimpleNamespace(returncode=0)

            with patch.object(MODULE, "parse_args", return_value=args), patch.object(
                MODULE, "load_dotenv_file", return_value=False
            ), patch.object(MODULE, "required_command"), patch.object(
                MODULE,
                "probe_video_size",
                side_effect=[(1920, 1080), (1080, 1920)],
            ), patch.object(MODULE.subprocess, "run", side_effect=fake_run), patch(
                "sys.stdout", new_callable=io.StringIO
            ) as stdout:
                exit_code = MODULE.main()

            self.assertEqual(exit_code, 0)
            self.assertTrue(output_video.is_file())
            self.assertIn("Center crop applied: yes", stdout.getvalue())
            self.assertIn("Output size: 1080x1920", stdout.getvalue())


if __name__ == "__main__":
    unittest.main()
