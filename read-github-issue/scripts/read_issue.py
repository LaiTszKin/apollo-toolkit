#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys


ISSUE_FIELDS = "number,title,body,state,author,labels,assignees,comments,createdAt,updatedAt,closedAt,url"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read a remote GitHub issue with gh CLI and display summary or JSON output."
    )
    parser.add_argument("issue", help="Issue number or URL.")
    parser.add_argument("--repo", help="Target repository in owner/name format.")
    parser.add_argument(
        "--comments",
        action="store_true",
        help="Keep issue comments in formatted output.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print raw JSON output.",
    )
    return parser.parse_args()


def build_command(args: argparse.Namespace) -> list[str]:
    cmd = [
        "gh",
        "issue",
        "view",
        args.issue,
        "--json",
        ISSUE_FIELDS,
    ]
    if args.repo:
        cmd.extend(["--repo", args.repo])
    return cmd


def join_names(items: list[dict], key: str) -> str:
    values = [item.get(key, "") for item in items if item.get(key)]
    return ", ".join(values) if values else "-"


def print_summary(issue: dict, include_comments: bool) -> None:
    print(f"Number: #{issue.get('number', '')}")
    print(f"Title: {issue.get('title', '')}")
    print(f"State: {issue.get('state', '')}")
    print(f"URL: {issue.get('url', '')}")
    print(f"Author: {(issue.get('author') or {}).get('login', '-')}")
    print(f"Labels: {join_names(issue.get('labels', []), 'name')}")
    print(f"Assignees: {join_names(issue.get('assignees', []), 'login')}")
    print(f"Created: {issue.get('createdAt', '')}")
    print(f"Updated: {issue.get('updatedAt', '')}")
    print(f"Closed: {issue.get('closedAt', '') or '-'}")
    print("")
    print("Body:")
    print(issue.get("body", "") or "-")

    if include_comments:
        comments = issue.get("comments", [])
        print("")
        print(f"Comments ({len(comments)}):")
        if not comments:
            print("-")
            return
        for comment in comments:
            author = (comment.get("author") or {}).get("login", "-")
            created = comment.get("createdAt", "")
            body = comment.get("body", "") or "-"
            print(f"- [{created}] {author}: {body}")


def main() -> int:
    args = parse_args()
    cmd = build_command(args)

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    except FileNotFoundError:
        print("Error: gh CLI is not installed or not in PATH.", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as exc:
        print(exc.stderr.strip() or "gh issue view failed.", file=sys.stderr)
        return exc.returncode

    try:
        issue = json.loads(result.stdout)
    except json.JSONDecodeError:
        print("Error: unable to parse gh output as JSON.", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(issue, indent=2))
        return 0

    print_summary(issue, include_comments=args.comments)
    return 0


if __name__ == "__main__":
    sys.exit(main())
