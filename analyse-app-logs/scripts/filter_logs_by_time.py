#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys

from log_cli_utils import ensure_timezone, extract_timestamp, in_window, iter_input_lines, parse_cli_timestamp


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Filter log lines by timestamp window from files or stdin."
    )
    parser.add_argument("paths", nargs="*", help="Log file paths. Reads stdin when omitted.")
    parser.add_argument("--start", help="Inclusive start timestamp.")
    parser.add_argument("--end", help="Inclusive end timestamp.")
    parser.add_argument(
        "--assume-timezone",
        default="UTC",
        help="Timezone for naive timestamps and --start/--end values. Default: UTC.",
    )
    parser.add_argument(
        "--keep-undated",
        action="store_true",
        help="Keep lines without a parseable timestamp.",
    )
    parser.add_argument(
        "--count-only",
        action="store_true",
        help="Print only the count of matching lines.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    assume_timezone = ensure_timezone(args.assume_timezone)
    start = parse_cli_timestamp(args.start, assume_timezone) if args.start else None
    end = parse_cli_timestamp(args.end, assume_timezone) if args.end else None

    if start and end and start > end:
        print("Error: --start must be earlier than or equal to --end.", file=sys.stderr)
        return 1

    matches = 0
    for line in iter_input_lines(args.paths):
        timestamp = extract_timestamp(line, assume_timezone)
        if timestamp is None and not args.keep_undated:
            continue
        if timestamp is not None and not in_window(timestamp, start, end):
            continue

        matches += 1
        if not args.count_only:
            print(line)

    if args.count_only:
        print(matches)
    return 0


if __name__ == "__main__":
    sys.exit(main())
