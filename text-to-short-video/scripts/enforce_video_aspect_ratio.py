#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ENV_FILE = SKILL_DIR / ".env"
SIZE_PATTERN = re.compile(r"^(\d{2,5})x(\d{2,5})$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Enforce final video aspect ratio and size. "
            "If input aspect ratio differs from target, center-crop then scale."
        )
    )
    parser.add_argument("--input-video", required=True, help="Path to rendered input video.")
    parser.add_argument(
        "--output-video",
        help=(
            "Path to processed output video. If omitted, write next to input as "
            "<name>_aspect_fixed.mp4."
        ),
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite input file in place (uses a temporary file then replaces input).",
    )
    parser.add_argument(
        "--target-size",
        help="Target size in WIDTHxHEIGHT format, for example 1080x1920.",
    )
    parser.add_argument("--target-width", type=int, help="Target width in pixels.")
    parser.add_argument("--target-height", type=int, help="Target height in pixels.")
    parser.add_argument(
        "--env-file",
        default=str(DEFAULT_ENV_FILE),
        help=f"Path to .env file (default: {DEFAULT_ENV_FILE}).",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite output if it exists.")
    parser.add_argument("--ffmpeg-bin", default="ffmpeg", help="ffmpeg executable name or path.")
    parser.add_argument("--ffprobe-bin", default="ffprobe", help="ffprobe executable name or path.")
    return parser.parse_args()


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


def parse_size(value: str) -> tuple[int, int]:
    match = SIZE_PATTERN.fullmatch(value.strip().lower())
    if not match:
        raise SystemExit("Invalid size format. Use WIDTHxHEIGHT, for example 1080x1920.")
    width = int(match.group(1))
    height = int(match.group(2))
    if width <= 0 or height <= 0:
        raise SystemExit("Width and height must be positive integers.")
    return width, height


def required_command(command: str) -> None:
    if shutil.which(command):
        return
    raise SystemExit(f"Missing required command: {command}")


def probe_video_size(video_path: Path, ffprobe_bin: str) -> tuple[int, int]:
    cmd = [
        ffprobe_bin,
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "json",
        str(video_path),
    ]
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.strip()
        raise SystemExit(f"ffprobe failed for {video_path}: {stderr}") from exc

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Unable to parse ffprobe output for {video_path}.") from exc

    streams = payload.get("streams")
    if not isinstance(streams, list) or not streams:
        raise SystemExit(f"No video stream found in {video_path}.")

    first = streams[0]
    if not isinstance(first, dict):
        raise SystemExit(f"Unexpected ffprobe stream payload for {video_path}.")

    width = first.get("width")
    height = first.get("height")
    if not isinstance(width, int) or not isinstance(height, int) or width <= 0 or height <= 0:
        raise SystemExit(f"Invalid video dimensions from ffprobe for {video_path}.")
    return width, height


def even_floor(value: int, minimum: int = 2) -> int:
    floored = value if value % 2 == 0 else value - 1
    return max(floored, minimum)


def build_video_filter(
    input_width: int,
    input_height: int,
    target_width: int,
    target_height: int,
) -> tuple[str | None, bool]:
    same_ratio = input_width * target_height == input_height * target_width
    same_size = input_width == target_width and input_height == target_height

    if same_ratio and same_size:
        return None, False

    if same_ratio:
        return f"scale={target_width}:{target_height}", False

    input_wider = input_width * target_height > input_height * target_width
    if input_wider:
        crop_width = input_height * target_width // target_height
        crop_height = input_height
    else:
        crop_width = input_width
        crop_height = input_width * target_height // target_width

    crop_width = min(even_floor(crop_width), even_floor(input_width))
    crop_height = min(even_floor(crop_height), even_floor(input_height))

    offset_x = max((input_width - crop_width) // 2, 0)
    offset_y = max((input_height - crop_height) // 2, 0)

    return f"crop={crop_width}:{crop_height}:{offset_x}:{offset_y},scale={target_width}:{target_height}", True


def resolve_target_size(args: argparse.Namespace) -> tuple[int, int]:
    if args.target_size and (args.target_width is not None or args.target_height is not None):
        raise SystemExit("Use either --target-size or --target-width/--target-height, not both.")

    if args.target_size:
        return parse_size(args.target_size)

    env_width = os.getenv("TEXT_TO_SHORT_VIDEO_WIDTH", "").strip()
    env_height = os.getenv("TEXT_TO_SHORT_VIDEO_HEIGHT", "").strip()

    if args.target_width is not None:
        width = args.target_width
    else:
        try:
            width = int(env_width or "1080")
        except ValueError as exc:
            raise SystemExit("TEXT_TO_SHORT_VIDEO_WIDTH must be an integer.") from exc

    if args.target_height is not None:
        height = args.target_height
    else:
        try:
            height = int(env_height or "1920")
        except ValueError as exc:
            raise SystemExit("TEXT_TO_SHORT_VIDEO_HEIGHT must be an integer.") from exc

    if width <= 0 or height <= 0:
        raise SystemExit("Target width and height must be positive integers.")
    return width, height


def resolve_output_path(args: argparse.Namespace, input_video: Path) -> Path:
    if args.in_place and args.output_video:
        raise SystemExit("Do not pass --output-video with --in-place.")

    if args.in_place:
        return input_video

    if args.output_video:
        output_video = Path(args.output_video).expanduser().resolve()
    else:
        output_video = input_video.with_name(f"{input_video.stem}_aspect_fixed.mp4")

    if output_video == input_video:
        raise SystemExit("Output path equals input path. Use --in-place to replace the input file.")

    return output_video


def copy_if_needed(source: Path, target: Path, force: bool) -> None:
    if source == target:
        return
    if target.exists() and not force:
        raise SystemExit(f"Output already exists: {target}. Use --force to overwrite.")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def main() -> int:
    args = parse_args()

    input_video = Path(args.input_video).expanduser().resolve()
    if not input_video.is_file():
        raise SystemExit(f"Input video not found: {input_video}")

    env_file = Path(args.env_file).expanduser()
    if not env_file.is_absolute():
        env_file = SKILL_DIR / env_file
    load_dotenv_file(env_file, override=False)

    target_width, target_height = resolve_target_size(args)
    output_video = resolve_output_path(args, input_video)

    required_command(args.ffmpeg_bin)
    required_command(args.ffprobe_bin)

    input_width, input_height = probe_video_size(input_video, args.ffprobe_bin)
    filter_expression, crop_applied = build_video_filter(
        input_width=input_width,
        input_height=input_height,
        target_width=target_width,
        target_height=target_height,
    )

    if filter_expression is None:
        print(
            f"[INFO] Video already matches target size and aspect ratio: "
            f"{input_width}x{input_height}."
        )
        copy_if_needed(input_video, output_video, args.force)
        if input_video != output_video:
            print(f"[OK] Copied original video to: {output_video}")
        return 0

    replace_in_place = args.in_place
    if replace_in_place:
        temp_fd, temp_name = tempfile.mkstemp(
            prefix=f"{input_video.stem}_aspect_tmp_",
            suffix=".mp4",
            dir=str(input_video.parent),
        )
        os.close(temp_fd)
        temp_output = Path(temp_name)
    else:
        temp_output = output_video
        if temp_output.exists() and not args.force:
            raise SystemExit(f"Output already exists: {temp_output}. Use --force to overwrite.")
        temp_output.parent.mkdir(parents=True, exist_ok=True)

    ffmpeg_cmd = [
        args.ffmpeg_bin,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y" if (args.force or replace_in_place) else "-n",
        "-i",
        str(input_video),
        "-vf",
        filter_expression,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        str(temp_output),
    ]

    try:
        subprocess.run(ffmpeg_cmd, check=True)
    except subprocess.CalledProcessError as exc:
        if replace_in_place and temp_output.exists():
            temp_output.unlink(missing_ok=True)
        raise SystemExit(f"ffmpeg failed with exit code {exc.returncode}.") from exc

    if replace_in_place:
        temp_output.replace(input_video)
        final_output = input_video
    else:
        final_output = output_video

    final_width, final_height = probe_video_size(final_output, args.ffprobe_bin)
    print(
        f"[OK] Processed video written: {final_output}\n"
        f"[INFO] Input size: {input_width}x{input_height}\n"
        f"[INFO] Target size: {target_width}x{target_height}\n"
        f"[INFO] Output size: {final_width}x{final_height}\n"
        f"[INFO] Center crop applied: {'yes' if crop_applied else 'no'}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
