#!/usr/bin/env python3
"""Convert text or text files into audio and sentence timelines."""

import argparse
import base64
import datetime as dt
import http.client
import json
import math
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import wave

try:
    import aifc  # type: ignore
except Exception:  # pragma: no cover
    aifc = None


DEFAULT_API_ENDPOINT = (
    "https://dashscope-intl.aliyuncs.com/api/v1/services/"
    "aigc/multimodal-generation/generation"
)
DEFAULT_API_MODEL = "qwen3-tts"
DEFAULT_API_VOICE = "Cherry"
DEFAULT_API_MAX_CHARS_PROBE_LENGTH = 5000


class DocsToVoiceError(Exception):
    """User-facing error for CLI failures."""


def parse_args(argv):
    parser = argparse.ArgumentParser(
        prog="docs_to_voice.py",
        description="Convert text into speech and generate timeline JSON/SRT files.",
    )

    parser.add_argument("--project-dir", required=True, help="Root project directory")
    parser.add_argument("--project-name", help="Folder name under DIR/audio/")
    parser.add_argument("--output-name", help="Output filename")
    parser.add_argument("--env-file", help="Path to .env file")
    parser.add_argument("--mode", help="TTS mode: say|api")
    parser.add_argument("--voice", help="macOS say voice")
    parser.add_argument("--rate", help="macOS say rate (WPM)")
    parser.add_argument(
        "--speech-rate",
        help="Speech rate multiplier applied after synthesis (e.g. 1.2 faster, 0.8 slower)",
    )
    parser.add_argument("--api-endpoint", help="Model Studio TTS endpoint")
    parser.add_argument("--api-model", help="Model Studio model name")
    parser.add_argument("--api-voice", help="Model Studio voice")
    parser.add_argument(
        "--max-chars",
        help="Max chars per TTS request before auto chunking (0 disables chunking)",
    )
    parser.add_argument(
        "--no-auto-prosody",
        action="store_true",
        help="Disable punctuation pause enhancement in say mode",
    )
    parser.add_argument(
        "--force", action="store_true", help="Overwrite output if it already exists"
    )

    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--text", help="Raw text input")
    input_group.add_argument("--input-file", help="Path to input text file")

    return parser.parse_args(argv)


def trim(value):
    return value.strip()


def strip_wrapping_quotes(value):
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def load_env_file(file_path):
    values = {}
    if not file_path.is_file():
        return values

    line_pattern = re.compile(r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$")
    for raw_line in file_path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = trim(raw_line)
        if not line or line.startswith("#"):
            continue
        match = line_pattern.match(line)
        if not match:
            continue
        key = match.group(1)
        value = strip_wrapping_quotes(trim(match.group(2)))
        values[key] = value

    return values


def resolve_setting(cli_value, env_key, env_values, default=""):
    if cli_value is not None and str(cli_value).strip() != "":
        return cli_value

    file_value = env_values.get(env_key, "")
    if file_value:
        return file_value

    env_value = os.environ.get(env_key)
    if env_value:
        return env_value

    return default


def normalize_mode(raw_mode):
    mode = (raw_mode or "say").strip().lower()
    if mode not in {"say", "api"}:
        raise DocsToVoiceError("--mode must be one of: say, api")
    return mode


def ensure_command(name, hint):
    if shutil.which(name):
        return
    raise DocsToVoiceError(hint)


def read_input_text(args):
    if args.input_file:
        input_file = pathlib.Path(args.input_file).expanduser()
        if not input_file.is_absolute():
            input_file = (pathlib.Path.cwd() / input_file).resolve()
        if not input_file.is_file():
            raise DocsToVoiceError("Input file not found: {0}".format(input_file))
        return input_file.read_text(encoding="utf-8", errors="replace")
    return args.text or ""


def normalize_project_dir(project_dir):
    path = pathlib.Path(project_dir).expanduser()
    if not path.is_absolute():
        path = pathlib.Path.cwd() / path
    return path.resolve()


def extract_extension_from_url(source_url):
    parsed = urllib.parse.urlparse(source_url)
    filename = pathlib.Path(parsed.path).name
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].strip().lower()


def extract_extension_from_audio_format(raw_format):
    if not raw_format:
        return ""

    value = raw_format.strip().lower().lstrip(".")
    if ";" in value:
        value = value.split(";", 1)[0].strip()
    if "/" in value:
        value = value.split("/")[-1]

    alias = {
        "x-wav": "wav",
        "mpeg": "mp3",
        "x-m4a": "m4a",
        "x-aiff": "aiff",
    }
    return alias.get(value, value)


def determine_api_extension(api_result):
    ext = ""
    if api_result.get("audio_url"):
        ext = extract_extension_from_url(api_result["audio_url"])
    if not ext:
        ext = extract_extension_from_audio_format(api_result.get("audio_format", ""))
    if not ext:
        ext = "wav"
    return ext


def split_sentences(raw_text):
    endings = set("。！？!?；;")
    sentences = []

    for raw_line in raw_text.split("\n"):
        line = raw_line.strip()
        if not line:
            continue

        current = []
        for char in line:
            current.append(char)
            if char in endings:
                sentence = "".join(current).strip()
                if sentence:
                    sentences.append(sentence)
                current = []

        tail = "".join(current).strip()
        if tail:
            sentences.append(tail)

    return sentences


def extract_timeline_sentences(source_text):
    sentences = split_sentences(source_text)
    if not sentences:
        stripped = source_text.strip()
        if stripped:
            sentences = [stripped]

    if not sentences:
        raise DocsToVoiceError("No text content found for timeline generation.")

    return sentences


def read_duration_seconds(file_path):
    suffix = file_path.suffix.lower()

    try:
        if suffix == ".wav":
            with wave.open(str(file_path), "rb") as wav_file:
                frame_rate = wav_file.getframerate()
                if frame_rate > 0:
                    return wav_file.getnframes() / float(frame_rate)
        if suffix in {".aiff", ".aif", ".aifc"} and aifc is not None:
            with aifc.open(str(file_path), "rb") as aiff_file:
                frame_rate = aiff_file.getframerate()
                if frame_rate > 0:
                    return aiff_file.getnframes() / float(frame_rate)
    except Exception:
        pass

    try:
        proc = subprocess.run(
            ["afinfo", str(file_path)],
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return None

    if proc.returncode != 0:
        return None

    payload = "{0}\n{1}".format(proc.stdout, proc.stderr)
    patterns = (
        r"estimated duration:\s*([0-9.]+)\s*sec",
        r"duration:\s*([0-9.]+)\s*sec",
        r"duration:\s*([0-9.]+)",
    )
    for pattern in patterns:
        match = re.search(pattern, payload, flags=re.IGNORECASE)
        if not match:
            continue
        try:
            return float(match.group(1))
        except ValueError:
            return None

    return None


def sentence_weight(sentence):
    compact = re.sub(r"\s+", "", sentence)
    if not compact:
        return 1.0

    total = 0.0
    for char in compact:
        if re.match(r"[A-Za-z0-9]", char):
            total += 0.55
        elif re.match(r"[\u4e00-\u9fff]", char):
            total += 1.0
        elif char in "，,、:：":
            total += 0.25
        elif char in "。.!！?？;；":
            total += 0.45
        else:
            total += 0.65

    return max(total, 1.0)


def srt_time(seconds):
    millis = int(round(max(seconds, 0.0) * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1_000)
    return "{0:02}:{1:02}:{2:02},{3:03}".format(hours, minutes, secs, millis)


def write_sentence_timeline_files(
    source_text,
    audio_path,
    sentence_durations=None,
    timing_mode_hint=None,
):
    sentences = extract_timeline_sentences(source_text)
    duration_seconds = read_duration_seconds(audio_path)

    entries = []
    timing_mode = "duration-weighted"

    if sentence_durations is not None and len(sentence_durations) == len(sentences):
        normalized_durations = []
        for raw_duration in sentence_durations:
            try:
                parsed = float(raw_duration)
            except (TypeError, ValueError):
                parsed = 0.0
            normalized_durations.append(max(parsed, 0.0))

        duration_total = sum(normalized_durations)
        if duration_total > 0:
            if duration_seconds is None or duration_seconds <= 0:
                duration_seconds = duration_total

            scale = 1.0
            if duration_seconds and duration_seconds > 0:
                scale = duration_seconds / duration_total

            cursor = 0.0
            for index, sentence in enumerate(sentences):
                if index == len(sentences) - 1:
                    end = duration_seconds
                else:
                    end = cursor + (normalized_durations[index] * scale)
                end = max(end, cursor)

                entries.append(
                    {
                        "index": index + 1,
                        "text": sentence,
                        "start_seconds": round(cursor, 3),
                        "end_seconds": round(end, 3),
                        "start_ms": int(round(cursor * 1000)),
                        "end_ms": int(round(end * 1000)),
                    }
                )
                cursor = end

            timing_mode = timing_mode_hint or "sentence-audio"

    if not entries:
        weights = [sentence_weight(sentence) for sentence in sentences]
        total_weight = sum(weights)
        if total_weight <= 0:
            total_weight = float(len(sentences))

        if duration_seconds is None or duration_seconds <= 0:
            timing_mode = "estimated"
            duration_seconds = max(total_weight * 0.26, 0.4)
        else:
            timing_mode = "duration-weighted"

        cursor = 0.0
        for index, sentence in enumerate(sentences):
            if index == len(sentences) - 1:
                end = duration_seconds
            else:
                portion = weights[index] / total_weight
                end = cursor + (duration_seconds * portion)
            end = max(end, cursor)

            entries.append(
                {
                    "index": index + 1,
                    "text": sentence,
                    "start_seconds": round(cursor, 3),
                    "end_seconds": round(end, 3),
                    "start_ms": int(round(cursor * 1000)),
                    "end_ms": int(round(end * 1000)),
                }
            )
            cursor = end

    if entries:
        entries[-1]["end_seconds"] = round(duration_seconds, 3)
        entries[-1]["end_ms"] = int(round(duration_seconds * 1000))

    timeline_base = audio_path.with_suffix("")
    timeline_json_path = timeline_base.with_suffix(".timeline.json")
    timeline_srt_path = timeline_base.with_suffix(".srt")

    json_payload = {
        "audio_file": audio_path.name,
        "audio_path": str(audio_path),
        "audio_duration_seconds": round(duration_seconds, 3),
        "timing_mode": timing_mode,
        "generated_at": dt.datetime.now(dt.timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "sentences": entries,
    }

    timeline_json_path.write_text(
        json.dumps(json_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    srt_lines = []
    for entry in entries:
        srt_lines.append(str(entry["index"]))
        srt_lines.append(
            "{0} --> {1}".format(
                srt_time(entry["start_seconds"]), srt_time(entry["end_seconds"])
            )
        )
        srt_lines.append(entry["text"])
        srt_lines.append("")

    timeline_srt_path.write_text("\n".join(srt_lines).strip() + "\n", encoding="utf-8")


def apply_plaintext_prosody_rules(segment):
    output = []
    index = 0
    length = len(segment)

    while index < length:
        if segment[index] == "\n":
            cursor = index
            while cursor < length and segment[cursor] == "\n":
                cursor += 1
            newline_count = cursor - index
            if newline_count >= 2:
                output.append("[[slnc 260]] ")
            else:
                output.append("[[slnc 90]] ")
            index = cursor
            continue

        char = segment[index]
        if char in "，、,:;：；":
            output.append("{0} [[slnc 120]] ".format(char))
        elif char in "。.":
            output.append("{0} [[slnc 180]] ".format(char))
        elif char in "？?":
            output.append("{0} [[slnc 190]] ".format(char))
        elif char in "！!":
            output.append("{0} [[slnc 150]] ".format(char))
        else:
            output.append(char)

        index += 1

    converted = "".join(output)
    return re.sub(r"[ \t]{2,}", " ", converted)


def build_auto_prosody_text(raw_text):
    parts = re.split(r"(\[\[[\s\S]*?\]\])", raw_text)
    converted = []

    for index, part in enumerate(parts):
        if index % 2 == 1 and part.startswith("[[") and part.endswith("]]"):
            converted.append(part)
        else:
            converted.append(apply_plaintext_prosody_rules(part))

    return "".join(converted)


def api_text_length_units(raw_text):
    units = 0
    for char in raw_text:
        if "\u4e00" <= char <= "\u9fff":
            units += 2
        else:
            units += 1
    return units


def split_oversized_text(raw_text, max_chars, length_func):
    pieces = []
    current = []
    current_units = 0

    for char in raw_text:
        char_units = length_func(char)
        if char_units <= 0:
            char_units = 1

        if current and current_units + char_units > max_chars:
            piece = "".join(current).strip()
            if piece:
                pieces.append(piece)
            current = [char]
            current_units = char_units
            continue

        current.append(char)
        current_units += char_units

    if current:
        piece = "".join(current).strip()
        if piece:
            pieces.append(piece)

    return pieces


def split_text_into_api_sentence_requests(source_text, max_chars, length_func):
    if length_func is None:
        length_func = len

    sentences = extract_timeline_sentences(source_text)
    request_items = []

    for sentence_index, sentence in enumerate(sentences):
        parts = [sentence]
        if max_chars and length_func(sentence) > max_chars:
            parts = split_oversized_text(sentence, max_chars, length_func)

        if not parts:
            parts = [sentence]

        for part in parts:
            request_items.append({"sentence_index": sentence_index, "text": part})

    return sentences, request_items


def split_text_for_tts(source_text, max_chars, length_func=None):
    if length_func is None:
        length_func = len

    text = source_text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not text:
        return []

    if not max_chars or length_func(text) <= max_chars:
        return [text]

    chunks = []
    current = ""
    paragraphs = [part.strip() for part in re.split(r"\n{2,}", text) if part.strip()]

    for paragraph in paragraphs:
        sentences = [
            item.strip()
            for item in re.split(r"(?<=[。！？!?；;.!?])", paragraph)
            if item.strip()
        ]
        if not sentences:
            sentences = [paragraph]

        for sentence in sentences:
            if length_func(sentence) > max_chars:
                if current:
                    chunks.append(current.strip())
                    current = ""

                for piece in split_oversized_text(sentence, max_chars, length_func):
                    if piece:
                        chunks.append(piece)
                continue

            if not current:
                current = sentence
                continue

            candidate = "{0} {1}".format(current, sentence)
            if length_func(candidate) <= max_chars:
                current = candidate
            else:
                chunks.append(current.strip())
                current = sentence

    if current:
        chunks.append(current.strip())

    return chunks


def concat_wav_files(part_paths, output_path):
    with wave.open(str(part_paths[0]), "rb") as first_file:
        params = first_file.getparams()
        frames = [first_file.readframes(first_file.getnframes())]

    for part_path in part_paths[1:]:
        with wave.open(str(part_path), "rb") as current:
            if (
                current.getnchannels() != params.nchannels
                or current.getsampwidth() != params.sampwidth
                or current.getframerate() != params.framerate
                or current.getcomptype() != params.comptype
            ):
                raise DocsToVoiceError("Chunk WAV formats do not match; cannot concatenate.")
            frames.append(current.readframes(current.getnframes()))

    with wave.open(str(output_path), "wb") as output:
        output.setparams(params)
        for frame in frames:
            output.writeframes(frame)


def concat_aiff_files(part_paths, output_path):
    if aifc is None:
        raise DocsToVoiceError("AIFF concatenation requires Python aifc module.")

    with aifc.open(str(part_paths[0]), "rb") as first_file:
        params = first_file.getparams()
        frames = [first_file.readframes(first_file.getnframes())]

    for part_path in part_paths[1:]:
        with aifc.open(str(part_path), "rb") as current:
            if (
                current.getnchannels() != params.nchannels
                or current.getsampwidth() != params.sampwidth
                or current.getframerate() != params.framerate
                or current.getcomptype() != params.comptype
            ):
                raise DocsToVoiceError("Chunk AIFF formats do not match; cannot concatenate.")
            frames.append(current.readframes(current.getnframes()))

    with aifc.open(str(output_path), "wb") as output:
        output.setparams(params)
        for frame in frames:
            output.writeframes(frame)


def concat_with_ffmpeg(part_paths, output_path):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise DocsToVoiceError("ffmpeg is required for concatenating this audio format.")

    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".txt", delete=False
    ) as handle:
        list_file = pathlib.Path(handle.name)
        for part_path in part_paths:
            escaped = str(part_path).replace("'", "'\\''")
            handle.write("file '{0}'\n".format(escaped))

    codec_args = []
    ext = output_path.suffix.lower()
    if ext == ".wav":
        codec_args = ["-c:a", "pcm_s16le"]
    elif ext in {".aiff", ".aif", ".aifc"}:
        codec_args = ["-c:a", "pcm_s16be"]

    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(list_file),
    ] + codec_args + [str(output_path)]

    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as exc:
        raise DocsToVoiceError(
            "ffmpeg failed while concatenating chunks (exit {0}).".format(exc.returncode)
        )
    finally:
        try:
            list_file.unlink()
        except FileNotFoundError:
            pass


def concat_audio_files(part_paths, output_path):
    if not part_paths:
        raise DocsToVoiceError("No chunk audio generated for concatenation.")

    if len(part_paths) == 1:
        shutil.copyfile(str(part_paths[0]), str(output_path))
        return

    ext = output_path.suffix.lower()
    if ext == ".wav":
        try:
            concat_wav_files(part_paths, output_path)
        except Exception:
            concat_with_ffmpeg(part_paths, output_path)
        return
    if ext in {".aiff", ".aif", ".aifc"}:
        if shutil.which("ffmpeg"):
            concat_with_ffmpeg(part_paths, output_path)
        else:
            try:
                concat_aiff_files(part_paths, output_path)
            except Exception:
                raise DocsToVoiceError(
                    "AIFF chunk concatenation failed without ffmpeg. "
                    "Install ffmpeg or use --output-name with .wav."
                )
        return

    concat_with_ffmpeg(part_paths, output_path)


def build_atempo_filter_chain(speech_rate):
    factors = []
    remaining = float(speech_rate)

    while remaining < 0.5:
        factors.append(0.5)
        remaining /= 0.5

    while remaining > 2.0:
        factors.append(2.0)
        remaining /= 2.0

    factors.append(remaining)

    filters = []
    for factor in factors:
        text = "{0:.6f}".format(factor).rstrip("0").rstrip(".")
        if "." not in text:
            text += ".0"
        filters.append("atempo={0}".format(text))
    return ",".join(filters)


def apply_speech_rate_to_audio(output_path, speech_rate):
    if speech_rate is None or abs(speech_rate - 1.0) < 1e-9:
        return

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise DocsToVoiceError("--speech-rate requires ffmpeg to be installed.")

    with tempfile.NamedTemporaryFile(
        suffix=output_path.suffix,
        prefix="docs-to-voice-rate-",
        dir=str(output_path.parent),
        delete=False,
    ) as handle:
        temp_output_path = pathlib.Path(handle.name)

    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(output_path),
        "-filter:a",
        build_atempo_filter_chain(speech_rate),
        str(temp_output_path),
    ]

    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as exc:
        if temp_output_path.exists():
            temp_output_path.unlink()
        raise DocsToVoiceError(
            "ffmpeg failed while applying --speech-rate (exit {0}).".format(
                exc.returncode
            )
        )

    if not temp_output_path.is_file() or temp_output_path.stat().st_size == 0:
        if temp_output_path.exists():
            temp_output_path.unlink()
        raise DocsToVoiceError("Failed to apply --speech-rate to output audio.")

    temp_output_path.replace(output_path)


def parse_api_error_message(raw_payload):
    try:
        data = json.loads(raw_payload)
    except Exception:
        return raw_payload[:400]

    message = data.get("message")
    code = data.get("code")
    if message and code:
        return "{0}: {1}".format(code, message)
    if message:
        return message
    if code:
        return code
    return raw_payload[:400]


def parse_positive_int(raw_value):
    if raw_value is None:
        return None
    if isinstance(raw_value, bool):
        return None
    if isinstance(raw_value, (int, float)):
        parsed = int(raw_value)
        if parsed > 0:
            return parsed
        return None

    value = str(raw_value).strip().replace(",", "")
    if not value.isdigit():
        return None

    parsed = int(value)
    if parsed <= 0:
        return None
    return parsed


def extract_max_chars_from_text(raw_text):
    if not raw_text:
        return None

    patterns = (
        r"range of input length should be \[\s*\d+\s*,\s*([\d,]+)\s*\]",
        r"max(?:imum)?\s*(?:input\s*)?(?:text\s*)?(?:length|characters?|chars?)\s*(?:is|:|=)\s*([\d,]+)",
        r"(?:cannot exceed|must be less than or equal to|must be <=?|up to)\s*([\d,]+)\s*(?:characters?|chars?)",
        r"(?:不超過|不能超過|上限為|上限为)\s*([\d,]+)\s*(?:個?字元|個?字符|字元|字符)",
    )
    for pattern in patterns:
        match = re.search(pattern, raw_text, flags=re.IGNORECASE)
        if not match:
            continue
        parsed = parse_positive_int(match.group(1))
        if parsed:
            return parsed

    return None


def fetch_json_payload(url, headers, timeout=30):
    request = urllib.request.Request(url, method="GET", headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = response.read().decode("utf-8", errors="replace")
    return json.loads(payload)


def extract_model_entry_max_chars(model_entry):
    model_info = model_entry.get("model_info") or {}
    inference_metadata = model_entry.get("inference_metadata") or {}

    candidates = (
        model_entry.get("max_input_chars"),
        model_entry.get("max_input_characters"),
        model_entry.get("max_input_length"),
        model_entry.get("max_text_length"),
        model_info.get("max_input_chars"),
        model_info.get("max_input_characters"),
        model_info.get("max_input_length"),
        model_info.get("max_text_length"),
        model_info.get("max_input_tokens"),
        inference_metadata.get("max_input_chars"),
        inference_metadata.get("max_input_length"),
    )
    for candidate in candidates:
        parsed = parse_positive_int(candidate)
        if parsed:
            return parsed

    return extract_max_chars_from_text(model_entry.get("description", ""))


def fetch_api_model_max_chars(api_endpoint, api_key, model):
    parsed = urllib.parse.urlparse(api_endpoint)
    if not parsed.scheme or not parsed.netloc:
        return None

    base_url = "{0}://{1}".format(parsed.scheme, parsed.netloc)
    headers = {"Authorization": "Bearer {0}".format(api_key)}

    page_no = 1
    page_size = 100
    while True:
        query = urllib.parse.urlencode({"page_no": page_no, "page_size": page_size})
        url = "{0}/api/v1/models?{1}".format(base_url, query)

        try:
            payload = fetch_json_payload(url, headers=headers)
        except Exception:
            return None

        output = payload.get("output") or {}
        models = output.get("models") or []
        for model_entry in models:
            if (model_entry.get("model") or "").strip() != model:
                continue
            return extract_model_entry_max_chars(model_entry)

        total = parse_positive_int(output.get("total")) or 0
        if total <= 0:
            return None
        if page_no * page_size >= total:
            return None
        page_no += 1


def probe_api_max_chars(api_endpoint, api_key, model, voice):
    probe_text = "測" * DEFAULT_API_MAX_CHARS_PROBE_LENGTH

    try:
        request_model_studio_audio(
            api_endpoint=api_endpoint,
            api_key=api_key,
            model=model,
            voice=voice,
            text=probe_text,
        )
    except DocsToVoiceError as exc:
        return extract_max_chars_from_text(str(exc))

    return None


def discover_api_max_chars(api_endpoint, api_key, model, voice):
    discovered = fetch_api_model_max_chars(
        api_endpoint=api_endpoint,
        api_key=api_key,
        model=model,
    )
    if discovered:
        return discovered
    return probe_api_max_chars(
        api_endpoint=api_endpoint,
        api_key=api_key,
        model=model,
        voice=voice,
    )


def request_model_studio_audio(api_endpoint, api_key, model, voice, text):
    payload = {
        "model": model,
        "input": {
            "text": text,
            "voice": voice,
        },
    }

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        api_endpoint,
        method="POST",
        data=data,
        headers={
            "Authorization": "Bearer {0}".format(api_key),
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            raw_payload = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        raw_payload = exc.read().decode("utf-8", errors="replace")
        detail = parse_api_error_message(raw_payload)
        raise DocsToVoiceError(
            "Model Studio TTS request failed (HTTP {0}): {1}".format(exc.code, detail)
        )
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        raise DocsToVoiceError(
            "Model Studio TTS request failed: {0}".format(reason)
        )
    except http.client.HTTPException as exc:
        raise DocsToVoiceError(
            "Model Studio TTS request failed: {0}".format(exc)
        )

    try:
        response_json = json.loads(raw_payload)
    except json.JSONDecodeError:
        raise DocsToVoiceError("API response is not valid JSON.")

    output = response_json.get("output") or {}
    audio = output.get("audio") or {}
    audio_url = audio.get("url") or ""
    audio_data = audio.get("data") or ""
    audio_format = audio.get("format") or audio.get("mime_type") or ""

    if not audio_url and not audio_data:
        raise DocsToVoiceError(
            "API response does not contain output.audio.url or output.audio.data"
        )

    return {
        "audio_url": audio_url,
        "audio_data": audio_data,
        "audio_format": audio_format,
    }


def download_binary(url, output_path):
    try:
        with urllib.request.urlopen(url, timeout=300) as response:
            payload = response.read()
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        raise DocsToVoiceError("Failed to download audio URL: {0}".format(reason))
    except http.client.HTTPException as exc:
        raise DocsToVoiceError("Failed to download audio URL: {0}".format(exc))

    output_path.write_bytes(payload)


def write_base64_audio(raw_base64_data, output_path):
    try:
        audio_bytes = base64.b64decode(raw_base64_data, validate=True)
    except Exception:
        raise DocsToVoiceError("API returned invalid output.audio.data payload.")

    output_path.write_bytes(audio_bytes)


def ensure_output_not_exists(output_path, force):
    if output_path.exists() and not force:
        raise DocsToVoiceError(
            "Output already exists: {0} (use --force to overwrite)".format(output_path)
        )


def run_say_mode(output_path, text, voice, rate):
    ensure_command("say", "macOS 'say' command not found.")

    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".txt", delete=False
    ) as handle:
        handle.write(text)
        temp_text_path = pathlib.Path(handle.name)

    command = ["say", "-o", str(output_path)]
    if voice:
        command.extend(["-v", voice])
    if rate is not None:
        command.extend(["-r", str(rate)])
    command.extend(["-f", str(temp_text_path)])

    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as exc:
        raise DocsToVoiceError("say mode failed with exit code {0}".format(exc.returncode))
    finally:
        try:
            temp_text_path.unlink()
        except FileNotFoundError:
            pass


def choose_output_name(base_name, has_extension, mode, api_result):
    if has_extension:
        return base_name

    if mode == "say":
        return "{0}.aiff".format(base_name)

    ext = determine_api_extension(api_result)
    return "{0}.{1}".format(base_name, ext)


def validate_rate(raw_rate):
    if raw_rate is None:
        return None
    if not raw_rate.isdigit() or int(raw_rate) <= 0:
        raise DocsToVoiceError("--rate must be a positive integer.")
    return int(raw_rate)


def validate_speech_rate(raw_value):
    if raw_value is None:
        return None

    value = str(raw_value).strip()
    if not value:
        return None

    try:
        parsed = float(value)
    except ValueError:
        raise DocsToVoiceError("--speech-rate must be a positive number.")

    if not math.isfinite(parsed) or parsed <= 0:
        raise DocsToVoiceError("--speech-rate must be a positive number.")
    return parsed


def scale_sentence_durations(sentence_durations, speech_rate):
    if not sentence_durations or speech_rate is None or abs(speech_rate - 1.0) < 1e-9:
        return sentence_durations
    return [max(float(value), 0.0) / speech_rate for value in sentence_durations]


def validate_max_chars(raw_value):
    if raw_value is None:
        return None

    value = str(raw_value).strip()
    if not value:
        return None
    if not value.isdigit():
        raise DocsToVoiceError("--max-chars must be a non-negative integer.")

    parsed = int(value)
    if parsed <= 0:
        return None
    return parsed


def is_max_chars_disabled(raw_value):
    if raw_value is None:
        return False
    return str(raw_value).strip() == "0"


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])

    script_dir = pathlib.Path(__file__).resolve().parent
    skill_dir = script_dir.parent

    env_file = args.env_file
    if env_file:
        env_path = pathlib.Path(env_file).expanduser()
        if not env_path.is_absolute():
            env_path = (pathlib.Path.cwd() / env_path).resolve()
    else:
        env_path = skill_dir / ".env"

    env_values = load_env_file(env_path)

    mode = normalize_mode(resolve_setting(args.mode, "DOCS_TO_VOICE_MODE", env_values, "say"))
    say_voice = resolve_setting(args.voice, "DOCS_TO_VOICE_VOICE", env_values)
    api_endpoint = resolve_setting(
        args.api_endpoint,
        "DOCS_TO_VOICE_API_ENDPOINT",
        env_values,
        DEFAULT_API_ENDPOINT,
    )
    api_model = resolve_setting(
        args.api_model,
        "DOCS_TO_VOICE_API_MODEL",
        env_values,
        DEFAULT_API_MODEL,
    )
    api_voice = resolve_setting(
        args.api_voice,
        "DOCS_TO_VOICE_API_VOICE",
        env_values,
        DEFAULT_API_VOICE,
    )
    api_key = resolve_setting(None, "DASHSCOPE_API_KEY", env_values)
    raw_max_chars = resolve_setting(args.max_chars, "DOCS_TO_VOICE_MAX_CHARS", env_values)
    raw_speech_rate = resolve_setting(
        args.speech_rate,
        "DOCS_TO_VOICE_SPEECH_RATE",
        env_values,
    )
    max_chars = validate_max_chars(raw_max_chars)
    max_chars_disabled = is_max_chars_disabled(raw_max_chars)

    rate = validate_rate(args.rate)
    speech_rate = validate_speech_rate(raw_speech_rate)

    if mode == "api" and not api_key:
        raise DocsToVoiceError("DASHSCOPE_API_KEY is required for api mode.")

    source_text = read_input_text(args)
    if not source_text.strip():
        raise DocsToVoiceError("No text content found for conversion.")

    if mode == "api" and max_chars is None and not max_chars_disabled:
        discovered_max_chars = discover_api_max_chars(
            api_endpoint=api_endpoint,
            api_key=api_key,
            model=api_model,
            voice=api_voice,
        )
        if discovered_max_chars:
            max_chars = discovered_max_chars

    timeline_sentence_durations = None
    timeline_timing_mode_hint = None

    if mode == "api":
        api_sentences, api_request_items = split_text_into_api_sentence_requests(
            source_text=source_text,
            max_chars=max_chars,
            length_func=api_text_length_units,
        )
        if not api_request_items:
            raise DocsToVoiceError("No text content found for conversion.")
    else:
        text_chunks = split_text_for_tts(
            source_text,
            max_chars,
            length_func=None,
        )
        if not text_chunks:
            raise DocsToVoiceError("No text content found for conversion.")

    project_dir = normalize_project_dir(args.project_dir)
    project_name = args.project_name or project_dir.name
    if not project_name:
        raise DocsToVoiceError("Unable to determine project name.")

    output_dir = project_dir / "audio" / project_name
    output_dir.mkdir(parents=True, exist_ok=True)

    output_name = args.output_name or "voice-{0}".format(dt.datetime.now().strftime("%Y%m%d-%H%M%S"))
    output_name_has_extension = "." in output_name

    if mode == "say":
        if not args.no_auto_prosody:
            request_chunks = [build_auto_prosody_text(chunk) for chunk in text_chunks]
        else:
            request_chunks = text_chunks

        final_output_name = choose_output_name(
            output_name,
            output_name_has_extension,
            mode,
            api_result={},
        )
        output_path = output_dir / final_output_name
        ensure_output_not_exists(output_path, args.force)

        if len(request_chunks) == 1:
            run_say_mode(output_path, request_chunks[0], say_voice, rate)
        else:
            with tempfile.TemporaryDirectory(prefix="docs-to-voice-say-") as temp_dir:
                temp_dir_path = pathlib.Path(temp_dir)
                part_ext = output_path.suffix or ".aiff"
                part_paths = []

                for index, chunk_text in enumerate(request_chunks, start=1):
                    part_path = temp_dir_path / "part-{0:04d}{1}".format(index, part_ext)
                    run_say_mode(part_path, chunk_text, say_voice, rate)
                    part_paths.append(part_path)

                concat_audio_files(part_paths, output_path)
    else:
        with tempfile.TemporaryDirectory(prefix="docs-to-voice-api-") as temp_dir:
            temp_dir_path = pathlib.Path(temp_dir)
            part_paths = []
            part_ext = ""
            sentence_durations = [0.0 for _ in api_sentences]
            sentence_duration_known = [True for _ in api_sentences]

            for index, request_item in enumerate(api_request_items, start=1):
                chunk_text = request_item["text"]
                api_result = request_model_studio_audio(
                    api_endpoint=api_endpoint,
                    api_key=api_key,
                    model=api_model,
                    voice=api_voice,
                    text=chunk_text,
                )

                current_ext = determine_api_extension(api_result)
                if not part_ext:
                    part_ext = current_ext
                elif current_ext != part_ext:
                    raise DocsToVoiceError(
                        "API returned inconsistent chunk formats ({0} vs {1}).".format(
                            part_ext, current_ext
                        )
                    )

                part_path = temp_dir_path / "part-{0:04d}.{1}".format(index, part_ext)
                if api_result.get("audio_url"):
                    download_binary(api_result["audio_url"], part_path)
                else:
                    write_base64_audio(api_result.get("audio_data", ""), part_path)

                if not part_path.is_file() or part_path.stat().st_size == 0:
                    raise DocsToVoiceError("Failed to generate audio chunk {0}.".format(index))
                part_paths.append(part_path)

                sentence_index = request_item["sentence_index"]
                part_duration = read_duration_seconds(part_path)
                if part_duration is None or part_duration <= 0:
                    sentence_duration_known[sentence_index] = False
                else:
                    sentence_durations[sentence_index] += part_duration

            final_output_name = output_name
            if not output_name_has_extension:
                final_output_name = "{0}.{1}".format(output_name, part_ext or "wav")

            output_path = output_dir / final_output_name
            ensure_output_not_exists(output_path, args.force)

            requested_ext = output_path.suffix.lower().lstrip(".")
            if len(part_paths) > 1 and requested_ext and requested_ext != part_ext:
                raise DocsToVoiceError(
                    "Output extension .{0} does not match chunk audio format .{1}.".format(
                        requested_ext, part_ext
                    )
                )

            concat_audio_files(part_paths, output_path)

            unknown_sentence_indexes = [
                index
                for index, is_known in enumerate(sentence_duration_known)
                if not is_known
            ]

            if not unknown_sentence_indexes and sum(sentence_durations) > 0:
                timeline_sentence_durations = sentence_durations
                timeline_timing_mode_hint = "sentence-audio"
            elif unknown_sentence_indexes:
                output_duration_seconds = read_duration_seconds(output_path)
                known_total = sum(
                    value
                    for index, value in enumerate(sentence_durations)
                    if sentence_duration_known[index]
                )
                remaining_duration = None
                if (
                    output_duration_seconds is not None
                    and output_duration_seconds > known_total
                ):
                    remaining_duration = output_duration_seconds - known_total

                if remaining_duration and remaining_duration > 0:
                    unknown_weights = [
                        sentence_weight(api_sentences[index])
                        for index in unknown_sentence_indexes
                    ]
                    total_unknown_weight = sum(unknown_weights)
                    if total_unknown_weight > 0:
                        for weight_index, sentence_index in enumerate(
                            unknown_sentence_indexes
                        ):
                            sentence_durations[sentence_index] += (
                                remaining_duration
                                * (unknown_weights[weight_index] / total_unknown_weight)
                            )

                        timeline_sentence_durations = sentence_durations
                        timeline_timing_mode_hint = "sentence-audio-mixed"

    if not output_path.is_file() or output_path.stat().st_size == 0:
        raise DocsToVoiceError("Failed to generate audio file.")

    if speech_rate is not None and abs(speech_rate - 1.0) > 1e-9:
        apply_speech_rate_to_audio(output_path, speech_rate)
        timeline_sentence_durations = scale_sentence_durations(
            timeline_sentence_durations,
            speech_rate,
        )

    write_sentence_timeline_files(
        source_text=source_text,
        audio_path=output_path,
        sentence_durations=timeline_sentence_durations,
        timing_mode_hint=timeline_timing_mode_hint,
    )
    print(str(output_path))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except DocsToVoiceError as exc:
        print("[ERROR] {0}".format(exc), file=sys.stderr)
        raise SystemExit(1)
