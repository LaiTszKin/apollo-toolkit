#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import json
import random
import string
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "generate_storyboard_images.py"
SPEC = importlib.util.spec_from_file_location("generate_storyboard_images", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def png_bytes(width: int, height: int, color: tuple[int, int, int] = (64, 128, 255)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), color).save(buffer, format="PNG")
    return buffer.getvalue()


class GenerateStoryboardImagesTests(unittest.TestCase):
    def test_sanitize_component_property_removes_invalid_path_characters(self) -> None:
        generator = random.Random(20260418)
        alphabet = string.ascii_letters + string.digits + string.punctuation + " \t中文"

        for _ in range(200):
            raw = "".join(generator.choice(alphabet) for _ in range(generator.randint(0, 30)))
            sanitized = MODULE.sanitize_component(raw, "fallback")
            with self.subTest(raw=raw, sanitized=sanitized):
                self.assertTrue(sanitized)
                self.assertNotRegex(sanitized, MODULE.INVALID_PATH_CHARS)
                self.assertNotIn(" ", sanitized)

    def test_parse_image_dimensions_supports_png_and_jpeg(self) -> None:
        png = png_bytes(320, 180)
        self.assertEqual(MODULE.parse_image_dimensions(png), (320, 180))

        buffer = io.BytesIO()
        Image.new("RGB", (160, 90), (0, 0, 0)).save(buffer, format="JPEG")
        self.assertEqual(MODULE.parse_image_dimensions(buffer.getvalue()), (160, 90))

    def test_parse_prompts_file_supports_structured_scene_mode(self) -> None:
        payload = {
            "characters": [
                {
                    "id": "hero",
                    "name": "Kai",
                    "appearance": "short black hair",
                    "outfit": "blue jacket",
                    "description": "determined teenage inventor",
                }
            ],
            "scenes": [
                {
                    "title": "Workshop",
                    "description": "Kai repairs a flickering lantern inside a cramped workshop.",
                    "character_ids": ["hero"],
                    "character_descriptions": {"hero": "focused and covered with grease"},
                    "camera": "medium shot",
                }
            ],
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            prompts_file = Path(temp_dir) / "prompts.json"
            prompts_file.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            items = MODULE.parse_prompts_file(prompts_file)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Workshop")
        prompt_payload = json.loads(items[0]["prompt"])
        self.assertEqual(prompt_payload["characters"][0]["description"], "focused and covered with grease")
        self.assertEqual(prompt_payload["camera"], "medium shot")

    def test_build_scene_json_prompt_rejects_unknown_override_character(self) -> None:
        scene = {
            "title": "Workshop",
            "description": "Lantern repair",
            "character_ids": ["hero"],
            "character_descriptions": {"ghost": "not listed"},
        }

        with self.assertRaises(SystemExit) as context:
            MODULE.build_scene_json_prompt(
                scene=scene,
                scene_index=1,
                prompts_file=Path("prompts.json"),
                character_profiles={
                    "hero": {
                        "id": "hero",
                        "name": "Kai",
                        "appearance": "short black hair",
                        "outfit": "blue jacket",
                        "description": "determined teenage inventor",
                    }
                },
            )

        self.assertIn("ids not listed in character_ids", str(context.exception))

    def test_generate_image_supports_b64_payload(self) -> None:
        raw = png_bytes(100, 60)

        with patch.object(
            MODULE,
            "post_json",
            return_value={"data": [{"b64_json": MODULE.base64.b64encode(raw).decode("ascii"), "revised_prompt": "ok"}]},
        ):
            image_bytes, revised_prompt = MODULE.generate_image(
                base_url="https://example.com",
                api_key="token",
                image_model="gpt-image-1",
                prompt="scene",
                aspect_ratio=None,
                image_size=None,
                quality=None,
                style=None,
            )

        self.assertEqual(image_bytes, raw)
        self.assertEqual(revised_prompt, "ok")

    def test_main_generates_cropped_images_and_summary(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = Path(temp_dir)
            args = types.SimpleNamespace(
                content_name="Lantern / Story",
                project_dir=str(project_dir),
                env_file=str(project_dir / ".env"),
                api_url="https://example.com",
                api_key="token",
                prompts_file=None,
                prompt=["Lantern workshop at dusk"],
                image_model="gpt-image-1",
                aspect_ratio="1:1",
                image_size=None,
                quality=None,
                style=None,
            )

            with patch.object(MODULE, "parse_args", return_value=args), patch.object(
                MODULE, "load_dotenv_file", return_value=False
            ), patch.object(
                MODULE,
                "generate_image",
                return_value=(png_bytes(200, 100), "Lantern workshop at dusk, improved"),
            ):
                exit_code = MODULE.main()

            self.assertEqual(exit_code, 0)
            output_dir = project_dir / "pictures" / "Lantern_Story"
            summary = json.loads((output_dir / "storyboard.json").read_text(encoding="utf-8"))
            self.assertEqual(summary["aspect_ratio"], "1:1")
            self.assertEqual(summary["images"][0]["width"], 100)
            self.assertEqual(summary["images"][0]["height"], 100)
            self.assertEqual(summary["images"][0]["source_width"], 200)
            self.assertEqual(summary["images"][0]["source_height"], 100)
            self.assertEqual(summary["images"][0]["revised_prompt"], "Lantern workshop at dusk, improved")


if __name__ == "__main__":
    unittest.main()
