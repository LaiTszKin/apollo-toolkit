#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator, Sequence


TIMESTAMP_PATTERN = re.compile(
    r"(?P<timestamp>"
    r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:\d{2})?"
    r")"
)

TIMESTAMP_FORMATS = (
    "%Y-%m-%dT%H:%M:%S.%f%z",
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%d %H:%M:%S.%f%z",
    "%Y-%m-%d %H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%S.%f",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S.%f",
    "%Y-%m-%d %H:%M:%S",
)


def normalize_timestamp(raw: str) -> str:
    value = raw.strip().replace(",", ".")
    if value.endswith("Z"):
        return value[:-1] + "+00:00"
    return value


def parse_cli_timestamp(raw: str, assume_timezone: timezone) -> datetime:
    normalized = normalize_timestamp(raw)
    for fmt in TIMESTAMP_FORMATS:
        try:
            parsed = datetime.strptime(normalized, fmt)
        except ValueError:
            continue
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=assume_timezone)
        return parsed
    raise argparse.ArgumentTypeError(f"invalid timestamp: {raw}")


def extract_timestamp(line: str, assume_timezone: timezone) -> datetime | None:
    match = TIMESTAMP_PATTERN.search(line)
    if not match:
        return None
    try:
        return parse_cli_timestamp(match.group("timestamp"), assume_timezone)
    except argparse.ArgumentTypeError:
        return None


def build_timezone(raw: str) -> timezone:
    if raw.upper() == "UTC":
        return timezone.utc

    match = re.fullmatch(r"([+-])(\d{2}):(\d{2})", raw)
    if not match:
        raise argparse.ArgumentTypeError("timezone must be UTC or ±HH:MM")

    sign, hours, minutes = match.groups()
    total_minutes = int(hours) * 60 + int(minutes)
    if sign == "-":
        total_minutes *= -1
    return timezone.utc if total_minutes == 0 else timezone(timedelta(minutes=total_minutes))


def iter_input_lines(paths: Sequence[str]) -> Iterator[str]:
    if not paths:
        import sys

        for line in sys.stdin:
            yield line.rstrip("\n")
        return

    for raw_path in paths:
        if raw_path == "-":
            import sys

            for line in sys.stdin:
                yield line.rstrip("\n")
            continue

        path = Path(raw_path)
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                yield line.rstrip("\n")


def in_window(
    timestamp: datetime | None,
    start: datetime | None,
    end: datetime | None,
) -> bool:
    if timestamp is None:
        return False
    if start and timestamp < start:
        return False
    if end and timestamp > end:
        return False
    return True


def ensure_timezone(value: str) -> timezone:
    return build_timezone(value)
