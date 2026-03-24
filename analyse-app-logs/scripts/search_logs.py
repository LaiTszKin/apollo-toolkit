#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import sys
from collections import deque
from typing import Callable

from log_cli_utils import ensure_timezone, extract_timestamp, in_window, iter_input_lines, parse_cli_timestamp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Search log lines by keyword or regex, with optional time filtering."
    )
    parser.add_argument("paths", nargs="*", help="Log file paths. Reads stdin when omitted.")
    parser.add_argument(
        "--keyword",
        action="append",
        default=[],
        help="Keyword to match. Repeat for multiple values.",
    )
    parser.add_argument(
        "--regex",
        action="append",
        default=[],
        help="Regular expression to match. Repeat for multiple values.",
    )
    parser.add_argument(
        "--mode",
        choices=["any", "all"],
        default="any",
        help="Require any or all patterns to match. Default: any.",
    )
    parser.add_argument(
        "--ignore-case",
        action="store_true",
        help="Case-insensitive matching for keywords and regex.",
    )
    parser.add_argument("--start", help="Inclusive start timestamp.")
    parser.add_argument("--end", help="Inclusive end timestamp.")
    parser.add_argument(
        "--assume-timezone",
        default="UTC",
        help="Timezone for naive timestamps and --start/--end values. Default: UTC.",
    )
    parser.add_argument(
        "--before-context",
        type=int,
        default=0,
        help="Print N lines of context before each match.",
    )
    parser.add_argument(
        "--after-context",
        type=int,
        default=0,
        help="Print N lines of context after each match.",
    )
    parser.add_argument(
        "--count-only",
        action="store_true",
        help="Print only the number of matching lines.",
    )
    return parser.parse_args()


def build_matchers(args: argparse.Namespace) -> list[Callable[[str], bool]]:
    flags = re.IGNORECASE if args.ignore_case else 0
    matchers: list[Callable[[str], bool]] = []

    for keyword in args.keyword:
        needle = keyword.lower() if args.ignore_case else keyword

        def match_keyword(line: str, needle: str = needle) -> bool:
            haystack = line.lower() if args.ignore_case else line
            return needle in haystack

        matchers.append(match_keyword)

    for pattern in args.regex:
        compiled = re.compile(pattern, flags)
        matchers.append(lambda line, compiled=compiled: bool(compiled.search(line)))

    return matchers


def line_matches(line: str, matchers: list[Callable[[str], bool]], mode: str) -> bool:
    if not matchers:
        return True
    results = [matcher(line) for matcher in matchers]
    return any(results) if mode == "any" else all(results)


def main() -> int:
    args = parse_args()
    assume_timezone = ensure_timezone(args.assume_timezone)
    start = parse_cli_timestamp(args.start, assume_timezone) if args.start else None
    end = parse_cli_timestamp(args.end, assume_timezone) if args.end else None
    if start and end and start > end:
        print("Error: --start must be earlier than or equal to --end.", file=sys.stderr)
        return 1

    matchers = build_matchers(args)
    matches = 0
    before_buffer: deque[str] = deque(maxlen=args.before_context)
    after_remaining = 0

    for line in iter_input_lines(args.paths):
        timestamp = extract_timestamp(line, assume_timezone)
        if (start or end) and not in_window(timestamp, start, end):
            before_buffer.append(line)
            continue

        is_match = line_matches(line, matchers, args.mode)

        if is_match:
            matches += 1
            if not args.count_only:
                while before_buffer:
                    print(before_buffer.popleft())
                print(line)
            after_remaining = args.after_context
        elif after_remaining > 0 and not args.count_only:
            print(line)
            after_remaining -= 1

        before_buffer.append(line)

    if args.count_only:
        print(matches)
    return 0


if __name__ == "__main__":
    sys.exit(main())
