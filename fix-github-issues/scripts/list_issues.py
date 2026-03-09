#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from typing import Any

ISSUE_FIELDS = "number,title,state,updatedAt,url,labels,assignees"


def positive_int(raw: str) -> int:
    value = int(raw)
    if value <= 0:
        raise argparse.ArgumentTypeError("limit must be a positive integer")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="List remote GitHub issues with gh CLI and display table or JSON output."
    )
    parser.add_argument("--repo", help="Target repository in owner/name format.")
    parser.add_argument("--state", default="open", choices=["open", "closed", "all"])
    parser.add_argument("--limit", type=positive_int, default=50)
    parser.add_argument(
        "--label",
        action="append",
        default=[],
        help="Label filter (repeat for multiple labels).",
    )
    parser.add_argument("--search", help="Search query for issue list filtering.")
    parser.add_argument(
        "--output",
        choices=["table", "json"],
        default="table",
        help="Output format.",
    )
    return parser.parse_args()


def build_command(args: argparse.Namespace) -> list[str]:
    cmd = [
        "gh",
        "issue",
        "list",
        "--state",
        args.state,
        "--limit",
        str(args.limit),
        "--json",
        ISSUE_FIELDS,
    ]

    if args.repo:
        cmd.extend(["--repo", args.repo])
    for label in args.label:
        cmd.extend(["--label", label])
    if args.search:
        cmd.extend(["--search", args.search])

    return cmd


def truncate(text: str, width: int) -> str:
    if len(text) <= width:
        return text
    if width <= 3:
        return text[:width]
    return text[: width - 3] + "..."


def format_labels(issue: dict[str, Any]) -> str:
    labels = issue.get("labels", [])
    names = [item.get("name", "") for item in labels if item.get("name")]
    return ",".join(names)


def format_assignees(issue: dict[str, Any]) -> str:
    assignees = issue.get("assignees", [])
    logins = [item.get("login", "") for item in assignees if item.get("login")]
    return ",".join(logins) if logins else "-"


def print_table(issues: list[dict[str, Any]]) -> None:
    columns = {
        "number": 7,
        "title": 54,
        "labels": 22,
        "assignees": 18,
        "updated": 20,
    }

    header = (
        f"{'NUMBER':<{columns['number']}} "
        f"{'TITLE':<{columns['title']}} "
        f"{'LABELS':<{columns['labels']}} "
        f"{'ASSIGNEES':<{columns['assignees']}} "
        f"{'UPDATED':<{columns['updated']}}"
    )
    print(header)
    print("-" * len(header))

    for issue in issues:
        number = f"#{issue.get('number', '')}"
        title = truncate(str(issue.get("title", "")), columns["title"])
        labels = truncate(format_labels(issue), columns["labels"])
        assignees = truncate(format_assignees(issue), columns["assignees"])
        updated = truncate(str(issue.get("updatedAt", "")), columns["updated"])

        row = (
            f"{number:<{columns['number']}} "
            f"{title:<{columns['title']}} "
            f"{labels:<{columns['labels']}} "
            f"{assignees:<{columns['assignees']}} "
            f"{updated:<{columns['updated']}}"
        )
        print(row)


def main() -> int:
    args = parse_args()
    cmd = build_command(args)

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    except FileNotFoundError:
        print("Error: gh CLI is not installed or not in PATH.", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as exc:
        print(exc.stderr.strip() or "gh issue list failed.", file=sys.stderr)
        return exc.returncode

    try:
        issues = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Error: unable to parse gh output as JSON.", file=sys.stderr)
        return 1

    if args.output == "json":
        print(json.dumps(issues, indent=2))
        return 0

    print_table(issues)
    return 0


if __name__ == "__main__":
    sys.exit(main())
