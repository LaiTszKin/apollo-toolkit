#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import io
import json
import math
import os
import re
from pathlib import Path
from typing import Any
from urllib import error, request

INVALID_PATH_CHARS = re.compile(r"[\\/:*?\"<>|]+")
SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ENV_FILE = SKILL_DIR / ".env"
CHARACTER_SKELETON_FIELDS = ("id", "name", "appearance", "outfit", "description")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate storyboard images from agent-decided prompts via an OpenAI-compatible image API.",
    )
    parser.add_argument("--content-name", required=True, help="Output subfolder name under pictures/")
    parser.add_argument("--project-dir", default=".", help="Project root path (default: current directory)")
    parser.add_argument(
        "--env-file",
        default=str(DEFAULT_ENV_FILE),
        help=f"Environment file path (default: {DEFAULT_ENV_FILE})",
    )
    parser.add_argument(
        "--api-url",
        help="API base URL for /images/generations (or OPENAI_API_URL)",
    )
    parser.add_argument(
        "--api-key",
        help="API key for /images/generations (or OPENAI_API_KEY)",
    )

    prompt_source = parser.add_mutually_exclusive_group(required=True)
    prompt_source.add_argument(
        "--prompts-file",
        help="Path to a JSON file containing prompt entries (list mode or structured characters/scenes mode)",
    )
    prompt_source.add_argument(
        "--prompt",
        action="append",
        help="Image prompt text; pass multiple times to generate multiple images",
    )

    parser.add_argument(
        "--image-model",
        help="Image model for /images/generations (or OPENAI_IMAGE_MODEL, default: gpt-image-1)",
    )
    parser.add_argument(
        "--aspect-ratio",
        help=(
            "Image aspect ratio, e.g. 16:9 or 4:3 "
            "(or OPENAI_IMAGE_RATIO / OPENAI_IMAGE_ASPECT_RATIO). "
            "If set, output is center-cropped to this ratio. "
            "If omitted, use model/API default size."
        ),
    )
    parser.add_argument(
        "--image-size",
        "--size",
        dest="image_size",
        help=(
            "Optional image size for OpenAI-compatible providers that expect size, "
            "e.g. 1024x768 or 1024x1024 (or OPENAI_IMAGE_SIZE)."
        ),
    )
    parser.add_argument(
        "--quality",
        help="Optional image quality parameter (or OPENAI_IMAGE_QUALITY)",
    )
    parser.add_argument(
        "--style",
        help="Optional image style parameter (or OPENAI_IMAGE_STYLE)",
    )
    return parser.parse_args()


def required_env(name: str, env_file: Path | None = None) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        location_hint = f" and {env_file}" if env_file else ""
        raise SystemExit(f"Missing required configuration: {name}. Set it in environment{location_hint}.")
    return value


def required_arg_or_env(
    arg_value: str | None,
    *,
    arg_name: str,
    env_name: str,
    env_file: Path | None = None,
) -> str:
    if arg_value is not None:
        value = arg_value.strip()
        if not value:
            raise SystemExit(f"{arg_name} cannot be empty.")
        return value
    return required_env(env_name, env_file)


def sanitize_component(name: str, fallback: str) -> str:
    cleaned = INVALID_PATH_CHARS.sub("_", name.strip())
    cleaned = re.sub(r"\s+", "_", cleaned)
    cleaned = re.sub(r"_+", "_", cleaned).strip("._")
    return cleaned or fallback


def normalize_aspect_ratio(value: str | None) -> str | None:
    if value is None:
        return None
    candidate = value.strip()
    if not candidate:
        return None
    if not re.fullmatch(r"\d{1,3}:\d{1,3}", candidate):
        raise SystemExit("Invalid aspect ratio. Use format like 16:9 or 4:3.")
    width, height = parse_ratio_pair(candidate)
    if width <= 0 or height <= 0:
        raise SystemExit("Invalid aspect ratio. Width and height must be positive integers.")
    return candidate


def first_nonempty_env(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value is not None and value.strip():
            return value
    return None


def parse_ratio_pair(value: str) -> tuple[int, int]:
    left, right = value.split(":", 1)
    return int(left), int(right)


def normalize_image_size(value: str | None) -> str | None:
    if value is None:
        return None
    candidate = value.strip().lower()
    if not candidate:
        return None
    if not re.fullmatch(r"\d{2,5}x\d{2,5}", candidate):
        raise SystemExit("Invalid image size. Use format like 1024x768.")
    width_str, height_str = candidate.split("x", 1)
    if int(width_str) <= 0 or int(height_str) <= 0:
        raise SystemExit("Invalid image size. Width and height must be positive integers.")
    return candidate


def parse_image_dimensions(image_bytes: bytes) -> tuple[int, int] | None:
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n") and len(image_bytes) >= 24:
        width = int.from_bytes(image_bytes[16:20], "big")
        height = int.from_bytes(image_bytes[20:24], "big")
        if width > 0 and height > 0:
            return width, height

    if image_bytes.startswith(b"\xFF\xD8"):
        index = 2
        while index + 1 < len(image_bytes):
            while index < len(image_bytes) and image_bytes[index] != 0xFF:
                index += 1
            if index + 1 >= len(image_bytes):
                break
            marker = image_bytes[index + 1]
            index += 2

            if marker in {0xD8, 0xD9}:
                continue
            if marker == 0xDA:
                break
            if index + 2 > len(image_bytes):
                break

            segment_length = int.from_bytes(image_bytes[index : index + 2], "big")
            if segment_length < 2 or index + segment_length > len(image_bytes):
                break

            if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                if segment_length >= 7:
                    height = int.from_bytes(image_bytes[index + 3 : index + 5], "big")
                    width = int.from_bytes(image_bytes[index + 5 : index + 7], "big")
                    if width > 0 and height > 0:
                        return width, height

            index += segment_length

    return None


def simplify_ratio(width: int, height: int) -> str:
    factor = math.gcd(width, height)
    return f"{width // factor}:{height // factor}"


def is_aspect_ratio_mismatch(
    dimensions: tuple[int, int],
    requested_ratio: str,
    tolerance: float = 0.05,
) -> bool:
    width, height = dimensions
    req_width, req_height = parse_ratio_pair(requested_ratio)
    diff = abs(width * req_height - height * req_width)
    allowed = req_width * height * tolerance
    return diff > allowed


def suggest_size_for_ratio(requested_ratio: str) -> str:
    req_width, req_height = parse_ratio_pair(requested_ratio)
    base_width = 1024
    suggested_height = max(2, int(round(base_width * req_height / req_width)))
    if suggested_height % 2 != 0:
        suggested_height += 1
    return f"{base_width}x{suggested_height}"


def center_crop_to_aspect_ratio(
    image_bytes: bytes,
    requested_ratio: str,
) -> tuple[bytes, tuple[int, int], tuple[int, int], bool]:
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Aspect-ratio crop requires Pillow. Install it with `pip install pillow`.") from exc

    req_width, req_height = parse_ratio_pair(requested_ratio)
    with Image.open(io.BytesIO(image_bytes)) as source:
        source_width, source_height = source.size
        scale = min(source_width // req_width, source_height // req_height)
        if scale < 1:
            raise RuntimeError(
                f"Cannot crop {source_width}x{source_height} to aspect ratio {requested_ratio}."
            )

        target_width = req_width * scale
        target_height = req_height * scale
        source_size = (source_width, source_height)
        target_size = (target_width, target_height)

        if target_size == source_size:
            return image_bytes, source_size, target_size, False

        left = (source_width - target_width) // 2
        top = (source_height - target_height) // 2
        right = left + target_width
        bottom = top + target_height

        cropped = source.crop((left, top, right, bottom))
        if cropped.mode not in {"RGB", "RGBA", "L", "LA", "P"}:
            cropped = cropped.convert("RGB")

        output = io.BytesIO()
        # Output filename extension is .png, so write normalized PNG bytes.
        cropped.save(output, format="PNG")
        return output.getvalue(), source_size, target_size, True


def unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    index = 2
    while True:
        candidate = parent / f"{stem}_{index}{suffix}"
        if not candidate.exists():
            return candidate
        index += 1


def parse_dotenv_line(content: str, line_no: int, file_path: Path) -> tuple[str, str] | None:
    stripped = content.strip()
    if not stripped or stripped.startswith("#"):
        return None
    if stripped.startswith("export "):
        stripped = stripped[7:].strip()

    if "=" not in stripped:
        raise SystemExit(f"Invalid .env format at {file_path}:{line_no}: missing =")

    key, value = stripped.split("=", 1)
    key = key.strip()
    value = value.strip()

    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
        raise SystemExit(f"Invalid .env key at {file_path}:{line_no}: {key}")

    if value and value[0] in {"'", '"'}:
        quote = value[0]
        if len(value) >= 2 and value[-1] == quote:
            value = value[1:-1]
    else:
        value = value.split(" #", 1)[0].strip()

    return key, value


def load_dotenv_file(env_file: Path, override: bool = False) -> bool:
    if not env_file.exists():
        return False

    for line_no, line in enumerate(env_file.read_text(encoding="utf-8").splitlines(), start=1):
        parsed = parse_dotenv_line(line, line_no, env_file)
        if not parsed:
            continue
        key, value = parsed
        if override or key not in os.environ:
            os.environ[key] = value
    return True


def normalize_base_url(base_url: str) -> str:
    base = base_url.strip().rstrip("/")
    if not base:
        raise SystemExit("OPENAI_API_URL cannot be empty.")
    return base


def post_json(base_url: str, endpoint: str, api_key: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{normalize_base_url(base_url)}{endpoint}"
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} when calling {url}: {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Network error when calling {url}: {exc.reason}") from exc


def fetch_binary(url: str) -> bytes:
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=180) as response:
        return response.read()


def parse_prompt_entries_list(parsed: list[Any], prompts_file: Path) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for index, item in enumerate(parsed, start=1):
        if isinstance(item, str):
            prompt = item.strip()
            title = f"scene-{index}"
        elif isinstance(item, dict):
            prompt = str(item.get("prompt", "")).strip()
            title = str(item.get("title") or f"scene-{index}").strip() or f"scene-{index}"
        else:
            raise SystemExit(
                f"Invalid item type in {prompts_file} at index {index}: expected string or object"
            )

        if not prompt:
            raise SystemExit(f"Empty prompt in {prompts_file} at index {index}")

        normalized.append({"title": title, "prompt": prompt})

    if not normalized:
        raise SystemExit(f"No prompts found in {prompts_file}")

    return normalized


def parse_character_profiles(
    raw_characters: Any,
    prompts_file: Path,
) -> dict[str, dict[str, str]]:
    if raw_characters is None:
        return {}

    if not isinstance(raw_characters, list):
        raise SystemExit(
            f"Invalid character definition in {prompts_file}: 'characters' must be an array when provided"
        )

    characters: dict[str, dict[str, str]] = {}
    for index, item in enumerate(raw_characters, start=1):
        if not isinstance(item, dict):
            raise SystemExit(
                f"Invalid character definition in {prompts_file} at characters[{index - 1}]: expected object"
            )

        profile = {field: str(item.get(field, "")).strip() for field in CHARACTER_SKELETON_FIELDS}
        missing = [field for field in ("id", "name", "appearance", "outfit", "description") if not profile[field]]
        if missing:
            joined = ", ".join(missing)
            raise SystemExit(
                f"Invalid character definition in {prompts_file} at characters[{index - 1}]: "
                f"missing required fields: {joined}"
            )

        character_id = profile["id"]
        if character_id in characters:
            raise SystemExit(
                f"Invalid character definition in {prompts_file}: duplicate character id '{character_id}'"
            )
        characters[character_id] = profile

    return characters


def parse_scene_character_ids(
    raw_character_ids: Any,
    prompts_file: Path,
    scene_index: int,
) -> list[str]:
    if raw_character_ids is None:
        return []
    if not isinstance(raw_character_ids, list):
        raise SystemExit(
            f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
            "'character_ids' must be an array when provided"
        )

    character_ids: list[str] = []
    for idx, raw_id in enumerate(raw_character_ids, start=1):
        character_id = str(raw_id).strip()
        if not character_id:
            raise SystemExit(
                f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
                f"character_ids[{idx - 1}] cannot be empty"
            )
        if character_id in character_ids:
            raise SystemExit(
                f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
                f"duplicate character id '{character_id}' in character_ids"
            )
        character_ids.append(character_id)
    return character_ids


def build_scene_json_prompt(
    scene: dict[str, Any],
    scene_index: int,
    prompts_file: Path,
    character_profiles: dict[str, dict[str, str]],
) -> dict[str, str]:
    title = str(scene.get("title") or f"scene-{scene_index}").strip() or f"scene-{scene_index}"
    description = str(scene.get("description", "")).strip()
    if not description:
        raise SystemExit(
            f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: 'description' is required"
        )

    character_ids = parse_scene_character_ids(scene.get("character_ids"), prompts_file, scene_index)
    raw_character_descriptions = scene.get("character_descriptions")
    if raw_character_descriptions is None:
        raw_character_descriptions = {}
    if not isinstance(raw_character_descriptions, dict):
        raise SystemExit(
            f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
            "'character_descriptions' must be an object when provided"
        )

    normalized_description_overrides = {
        str(key).strip(): str(value).strip()
        for key, value in raw_character_descriptions.items()
        if str(key).strip()
    }

    unknown_override_ids = sorted(set(normalized_description_overrides.keys()) - set(character_ids))
    if unknown_override_ids:
        joined = ", ".join(unknown_override_ids)
        raise SystemExit(
            f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
            f"'character_descriptions' has ids not listed in character_ids: {joined}"
        )

    scene_characters: list[dict[str, str]] = []
    for character_id in character_ids:
        profile = character_profiles.get(character_id)
        if not profile:
            raise SystemExit(
                f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
                f"character id '{character_id}' is not defined in top-level 'characters'"
            )

        character_prompt = dict(profile)
        if character_id in normalized_description_overrides:
            description_override = normalized_description_overrides[character_id]
            if not description_override:
                raise SystemExit(
                    f"Invalid scene in {prompts_file} at scenes[{scene_index - 1}]: "
                    f"character_descriptions['{character_id}'] cannot be empty"
                )
            character_prompt["description"] = description_override
        scene_characters.append(character_prompt)

    prompt_payload: dict[str, Any] = {
        "scene_title": title,
        "description": description,
    }
    if scene_characters:
        prompt_payload["characters"] = scene_characters

    style = scene.get("style")
    if style is not None:
        style_text = str(style).strip()
        if style_text:
            prompt_payload["style"] = style_text

    camera = scene.get("camera")
    if camera is not None:
        camera_text = str(camera).strip()
        if camera_text:
            prompt_payload["camera"] = camera_text

    lighting = scene.get("lighting")
    if lighting is not None:
        lighting_text = str(lighting).strip()
        if lighting_text:
            prompt_payload["lighting"] = lighting_text

    prompt = json.dumps(prompt_payload, ensure_ascii=False, separators=(",", ":"))
    return {"title": title, "prompt": prompt}


def parse_structured_prompts_file(parsed: dict[str, Any], prompts_file: Path) -> list[dict[str, str]]:
    scenes = parsed.get("scenes")
    if not isinstance(scenes, list):
        raise SystemExit(
            f"Invalid prompt file {prompts_file}: object mode requires a top-level 'scenes' array"
        )
    if not scenes:
        raise SystemExit(f"Invalid prompt file {prompts_file}: 'scenes' cannot be empty")

    character_profiles = parse_character_profiles(parsed.get("characters"), prompts_file)
    normalized: list[dict[str, str]] = []
    for index, scene in enumerate(scenes, start=1):
        if not isinstance(scene, dict):
            raise SystemExit(
                f"Invalid scene in {prompts_file} at scenes[{index - 1}]: expected object"
            )
        normalized.append(
            build_scene_json_prompt(
                scene=scene,
                scene_index=index,
                prompts_file=prompts_file,
                character_profiles=character_profiles,
            )
        )

    return normalized


def parse_prompts_file(prompts_file: Path) -> list[dict[str, str]]:
    raw = prompts_file.read_text(encoding="utf-8")
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {prompts_file}: {exc}") from exc

    if isinstance(parsed, list):
        return parse_prompt_entries_list(parsed, prompts_file)
    if isinstance(parsed, dict):
        return parse_structured_prompts_file(parsed, prompts_file)

    raise SystemExit(
        f"Invalid prompt file {prompts_file}: top-level JSON must be an array or an object"
    )


def build_prompt_items(prompts_file: str | None, prompt_values: list[str] | None) -> list[dict[str, str]]:
    if prompts_file:
        return parse_prompts_file(Path(prompts_file).expanduser())

    if not prompt_values:
        raise SystemExit("At least one --prompt is required when --prompts-file is not set")

    items: list[dict[str, str]] = []
    for index, prompt in enumerate(prompt_values, start=1):
        text = prompt.strip()
        if not text:
            raise SystemExit(f"Empty --prompt at position {index}")
        items.append({"title": f"scene-{index}", "prompt": text})
    return items


def generate_image(
    base_url: str,
    api_key: str,
    image_model: str,
    prompt: str,
    aspect_ratio: str | None,
    image_size: str | None,
    quality: str | None,
    style: str | None,
) -> tuple[bytes, str | None]:
    payload: dict[str, Any] = {
        "model": image_model,
        "prompt": prompt,
    }
    if aspect_ratio:
        payload["aspect_ratio"] = aspect_ratio
    if image_size:
        payload["size"] = image_size
    if quality:
        payload["quality"] = quality
    if style:
        payload["style"] = style

    response = post_json(base_url, "/images/generations", api_key, payload)
    data = response.get("data")
    if not isinstance(data, list) or not data:
        raise RuntimeError("Image generation response has no data.")

    first = data[0]
    if not isinstance(first, dict):
        raise RuntimeError("Unexpected image data format.")

    revised_prompt = first.get("revised_prompt")
    if isinstance(first.get("b64_json"), str):
        raw = base64.b64decode(first["b64_json"])
        return raw, revised_prompt if isinstance(revised_prompt, str) else None

    if isinstance(first.get("url"), str):
        raw = fetch_binary(first["url"])
        return raw, revised_prompt if isinstance(revised_prompt, str) else None

    raise RuntimeError("Image payload missing b64_json/url.")


def main() -> int:
    args = parse_args()

    project_dir = Path(args.project_dir).expanduser().resolve()
    env_file = Path(args.env_file).expanduser()
    if not env_file.is_absolute():
        env_file = SKILL_DIR / env_file
    load_dotenv_file(env_file, override=False)

    api_url = required_arg_or_env(
        args.api_url,
        arg_name="--api-url",
        env_name="OPENAI_API_URL",
        env_file=env_file,
    )
    api_key = required_arg_or_env(
        args.api_key,
        arg_name="--api-key",
        env_name="OPENAI_API_KEY",
        env_file=env_file,
    )

    if args.image_model is not None:
        image_model = args.image_model.strip()
        if not image_model:
            raise SystemExit("--image-model cannot be empty.")
    else:
        image_model = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1")
    aspect_ratio = normalize_aspect_ratio(
        args.aspect_ratio
        if args.aspect_ratio is not None
        else first_nonempty_env("OPENAI_IMAGE_RATIO", "OPENAI_IMAGE_ASPECT_RATIO")
    )
    image_size = normalize_image_size(
        args.image_size if args.image_size is not None else os.getenv("OPENAI_IMAGE_SIZE")
    )
    quality = args.quality if args.quality is not None else os.getenv("OPENAI_IMAGE_QUALITY")
    style = args.style if args.style is not None else os.getenv("OPENAI_IMAGE_STYLE")

    prompts = build_prompt_items(args.prompts_file, args.prompt)

    content_dir_name = sanitize_component(args.content_name, "untitled-content")
    output_dir = project_dir / "pictures" / content_dir_name
    output_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, Any]] = []
    for index, item in enumerate(prompts, start=1):
        title_slug = sanitize_component(item["title"], f"scene-{index}")
        filename = f"{index:02d}_{title_slug}.png"
        image_path = unique_path(output_dir / filename)

        image_bytes, revised_prompt = generate_image(
            base_url=api_url,
            api_key=api_key,
            image_model=image_model,
            prompt=item["prompt"],
            aspect_ratio=aspect_ratio,
            image_size=image_size,
            quality=quality,
            style=style,
        )
        source_dimensions = parse_image_dimensions(image_bytes)
        if aspect_ratio:
            try:
                image_bytes, crop_source, crop_target, crop_applied = center_crop_to_aspect_ratio(
                    image_bytes=image_bytes,
                    requested_ratio=aspect_ratio,
                )
                if crop_applied:
                    print(
                        "[INFO] "
                        f"Applied center crop for aspect ratio {aspect_ratio}: "
                        f"{crop_source[0]}x{crop_source[1]} -> {crop_target[0]}x{crop_target[1]}."
                    )
            except RuntimeError as exc:
                print(f"[WARN] {exc}")

            if source_dimensions and is_aspect_ratio_mismatch(source_dimensions, aspect_ratio):
                actual_width, actual_height = source_dimensions
                suggested_size = suggest_size_for_ratio(aspect_ratio)
                print(
                    "[WARN] "
                    f"Requested aspect ratio {aspect_ratio}, provider returned {actual_width}x{actual_height} "
                    f"(~{simplify_ratio(actual_width, actual_height)}). "
                    f"Post-process crop has been applied when possible. "
                    f"For better quality, try --image-size {suggested_size} or set OPENAI_IMAGE_SIZE={suggested_size}."
                )

        image_path.write_bytes(image_bytes)
        dimensions = parse_image_dimensions(image_bytes)

        record: dict[str, Any] = {
            "index": index,
            "title": item["title"],
            "prompt": item["prompt"],
            "file": str(image_path),
        }
        if source_dimensions and dimensions and source_dimensions != dimensions:
            record["source_width"] = source_dimensions[0]
            record["source_height"] = source_dimensions[1]
        if dimensions:
            record["width"] = dimensions[0]
            record["height"] = dimensions[1]
        if revised_prompt:
            record["revised_prompt"] = revised_prompt
        records.append(record)
        print(f"[OK] Generated {image_path}")

    summary = {
        "content_name": args.content_name,
        "project_dir": str(project_dir),
        "output_dir": str(output_dir),
        "image_model": image_model,
        "images": records,
    }
    if aspect_ratio:
        summary["aspect_ratio"] = aspect_ratio
    if image_size:
        summary["image_size"] = image_size
    summary_path = output_dir / "storyboard.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] Wrote plan to {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
