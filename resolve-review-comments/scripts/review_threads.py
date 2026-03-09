#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

LIST_QUERY = """
query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $after) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          comments(first: 20) {
            nodes {
              id
              url
              body
              author {
                login
              }
              createdAt
              path
              line
              outdated
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}
"""

RESOLVE_MUTATION = """
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread {
      id
      isResolved
    }
  }
}
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="List and resolve GitHub PR review threads via gh graphql."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list", help="List review threads.")
    add_common_args(list_parser)
    list_parser.add_argument(
        "--state",
        choices=["unresolved", "resolved", "all"],
        default="unresolved",
        help="Thread state filter.",
    )
    list_parser.add_argument(
        "--output",
        choices=["table", "json"],
        default="table",
        help="Output format.",
    )

    resolve_parser = subparsers.add_parser("resolve", help="Resolve selected threads.")
    add_common_args(resolve_parser)
    resolve_parser.add_argument(
        "--thread-id",
        action="append",
        default=[],
        help="Thread GraphQL ID to resolve (repeatable).",
    )
    resolve_parser.add_argument(
        "--thread-id-file",
        help="Path to JSON file containing thread IDs.",
    )
    resolve_parser.add_argument(
        "--all-unresolved",
        action="store_true",
        help="Resolve every unresolved thread in the PR.",
    )
    resolve_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print thread IDs without resolving.",
    )

    return parser.parse_args()


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--repo", help="Target repository in owner/name format.")
    parser.add_argument("--pr", type=positive_int, help="Pull request number.")


def positive_int(raw: str) -> int:
    value = int(raw)
    if value <= 0:
        raise argparse.ArgumentTypeError("value must be a positive integer")
    return value


def run_gh(cmd: list[str], expect_json: bool = False) -> Any:
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise RuntimeError("gh CLI is not installed or not in PATH") from exc
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.strip() or "gh command failed"
        raise RuntimeError(stderr) from exc

    if not expect_json:
        return result.stdout.strip()

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Failed to parse gh JSON output") from exc


def parse_owner_repo(repo: str) -> tuple[str, str]:
    parts = repo.split("/")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError("repo must be in owner/name format")
    return parts[0], parts[1]


def resolve_repo(repo: str | None) -> str:
    if repo:
        parse_owner_repo(repo)
        return repo

    return run_gh(["gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"])


def resolve_pr_number(repo: str, pr: int | None) -> int:
    if pr is not None:
        return pr

    value = run_gh(["gh", "pr", "view", "--repo", repo, "--json", "number", "--jq", ".number"])
    try:
        return int(value)
    except ValueError as exc:
        raise RuntimeError("Unable to infer PR number from current branch context") from exc


def gh_graphql(query: str, variables: dict[str, Any]) -> dict[str, Any]:
    cmd = ["gh", "api", "graphql", "-f", f"query={query}"]
    for key, value in variables.items():
        cmd.extend(["-F", f"{key}={json.dumps(value)}"])
    return run_gh(cmd, expect_json=True)


def fetch_review_threads(repo: str, pr_number: int) -> list[dict[str, Any]]:
    owner, name = parse_owner_repo(repo)
    threads: list[dict[str, Any]] = []
    after: str | None = None

    while True:
        payload = gh_graphql(
            LIST_QUERY,
            {
                "owner": owner,
                "name": name,
                "number": pr_number,
                "after": after,
            },
        )
        pr = payload["data"]["repository"]["pullRequest"]
        if pr is None:
            raise RuntimeError(f"PR #{pr_number} not found in {repo}")

        review_threads = pr["reviewThreads"]
        threads.extend(review_threads.get("nodes", []))

        page_info = review_threads["pageInfo"]
        if not page_info.get("hasNextPage"):
            break
        after = page_info.get("endCursor")

    return threads


def filter_threads(threads: list[dict[str, Any]], state: str) -> list[dict[str, Any]]:
    if state == "all":
        return threads
    if state == "resolved":
        return [item for item in threads if item.get("isResolved")]
    return [item for item in threads if not item.get("isResolved")]


def normalize_thread(thread: dict[str, Any]) -> dict[str, Any]:
    comments = thread.get("comments", {}).get("nodes", [])
    normalized_comments = [
        {
            "id": comment.get("id"),
            "url": comment.get("url"),
            "author": (comment.get("author") or {}).get("login"),
            "body": comment.get("body", ""),
            "created_at": comment.get("createdAt"),
            "path": comment.get("path"),
            "line": comment.get("line"),
            "outdated": comment.get("outdated"),
        }
        for comment in comments
    ]

    return {
        "thread_id": thread.get("id"),
        "is_resolved": thread.get("isResolved"),
        "is_outdated": thread.get("isOutdated"),
        "path": thread.get("path"),
        "line": thread.get("line"),
        "start_line": thread.get("startLine"),
        "comments": normalized_comments,
    }


def truncate(text: str, width: int) -> str:
    if len(text) <= width:
        return text
    if width <= 3:
        return text[:width]
    return text[: width - 3] + "..."


def preview_body(thread: dict[str, Any]) -> str:
    comments = thread.get("comments", [])
    if not comments:
        return "-"
    body = comments[0].get("body", "").replace("\n", " ").strip()
    return truncate(body or "-", 72)


def render_location(thread: dict[str, Any]) -> str:
    path = thread.get("path") or "-"
    line = thread.get("line")
    if line is None:
        return path
    return f"{path}:{line}"


def print_table(threads: list[dict[str, Any]]) -> None:
    widths = {
        "idx": 4,
        "thread": 12,
        "location": 36,
        "author": 18,
        "preview": 72,
    }
    header = (
        f"{'#':<{widths['idx']}} "
        f"{'THREAD_ID':<{widths['thread']}} "
        f"{'LOCATION':<{widths['location']}} "
        f"{'AUTHOR':<{widths['author']}} "
        f"{'COMMENT_PREVIEW':<{widths['preview']}}"
    )
    print(header)
    print("-" * len(header))

    for idx, thread in enumerate(threads, start=1):
        comments = thread.get("comments", [])
        author = comments[0].get("author") if comments else "-"
        row = (
            f"{idx:<{widths['idx']}} "
            f"{truncate(thread.get('thread_id', '-') or '-', widths['thread']):<{widths['thread']}} "
            f"{truncate(render_location(thread), widths['location']):<{widths['location']}} "
            f"{truncate(author or '-', widths['author']):<{widths['author']}} "
            f"{preview_body(thread):<{widths['preview']}}"
        )
        print(row)


def load_thread_ids(path: str) -> list[str]:
    raw = Path(path).read_text(encoding="utf-8")
    payload = json.loads(raw)

    if isinstance(payload, list):
        ids = payload
    elif isinstance(payload, dict):
        if "thread_ids" in payload:
            ids = payload["thread_ids"]
        elif "adopted_thread_ids" in payload:
            ids = payload["adopted_thread_ids"]
        elif "threads" in payload:
            ids = [
                item.get("thread_id")
                for item in payload["threads"]
                if isinstance(item, dict)
            ]
        else:
            raise ValueError("JSON must include thread_ids, adopted_thread_ids, or threads")
    else:
        raise ValueError("Unsupported JSON payload for thread IDs")

    output = [item for item in ids if isinstance(item, str) and item.strip()]
    return list(dict.fromkeys(output))


def collect_thread_ids(args: argparse.Namespace, unresolved_threads: list[dict[str, Any]]) -> list[str]:
    ids: list[str] = []

    if args.all_unresolved:
        ids.extend([item["thread_id"] for item in unresolved_threads if item.get("thread_id")])

    ids.extend(args.thread_id)

    if args.thread_id_file:
        ids.extend(load_thread_ids(args.thread_id_file))

    normalized = [item for item in ids if item]
    return list(dict.fromkeys(normalized))


def resolve_threads(thread_ids: list[str], dry_run: bool) -> tuple[list[str], list[dict[str, str]]]:
    resolved: list[str] = []
    failed: list[dict[str, str]] = []

    for thread_id in thread_ids:
        if dry_run:
            resolved.append(thread_id)
            continue

        try:
            payload = gh_graphql(RESOLVE_MUTATION, {"threadId": thread_id})
            thread = payload["data"]["resolveReviewThread"]["thread"]
            if not thread or not thread.get("isResolved"):
                raise RuntimeError("thread did not resolve")
            resolved.append(thread_id)
        except Exception as exc:  # pylint: disable=broad-except
            failed.append({"thread_id": thread_id, "error": str(exc)})

    return resolved, failed


def cmd_list(args: argparse.Namespace) -> int:
    repo = resolve_repo(args.repo)
    pr_number = resolve_pr_number(repo, args.pr)

    threads = fetch_review_threads(repo, pr_number)
    filtered = filter_threads(threads, args.state)
    normalized = [normalize_thread(item) for item in filtered]

    result = {
        "repo": repo,
        "pr_number": pr_number,
        "state": args.state,
        "thread_count": len(normalized),
        "threads": normalized,
    }

    if args.output == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Repository: {repo}")
        print(f"PR: #{pr_number}")
        print(f"Threads ({args.state}): {len(normalized)}")
        print_table(normalized)

    return 0


def cmd_resolve(args: argparse.Namespace) -> int:
    repo = resolve_repo(args.repo)
    pr_number = resolve_pr_number(repo, args.pr)

    threads = fetch_review_threads(repo, pr_number)
    unresolved = [normalize_thread(item) for item in filter_threads(threads, "unresolved")]
    thread_ids = collect_thread_ids(args, unresolved)

    if not thread_ids:
        print(
            "Error: no thread IDs selected. Use --thread-id, --thread-id-file, or --all-unresolved.",
            file=sys.stderr,
        )
        return 1

    resolved, failed = resolve_threads(thread_ids, args.dry_run)

    summary = {
        "repo": repo,
        "pr_number": pr_number,
        "requested": thread_ids,
        "resolved": resolved,
        "failed": failed,
        "dry_run": args.dry_run,
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))

    return 0 if not failed else 1


def main() -> int:
    args = parse_args()

    try:
        if args.command == "list":
            return cmd_list(args)
        if args.command == "resolve":
            return cmd_resolve(args)
        print(f"Unsupported command: {args.command}", file=sys.stderr)
        return 1
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
