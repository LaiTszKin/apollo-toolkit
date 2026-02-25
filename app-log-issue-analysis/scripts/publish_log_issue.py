#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib import error, request

GITHUB_API_BASE = "https://api.github.com"
README_ACCEPT = "application/vnd.github.raw+json"
JSON_ACCEPT = "application/vnd.github+json"
DEFAULT_REPRO_ZH = "尚未穩定重現；需補充更多執行期資料。"
DEFAULT_REPRO_EN = "Not yet reliably reproducible; more runtime evidence is required."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Publish a log investigation finding as a GitHub issue. "
            "Auth order: gh CLI login -> GitHub token -> draft only."
        )
    )
    parser.add_argument("--title", required=True, help="Issue title")
    parser.add_argument(
        "--problem-description",
        required=True,
        help="Issue section content: problem description",
    )
    parser.add_argument(
        "--suspected-cause",
        required=True,
        help="Issue section content: suspected cause",
    )
    parser.add_argument(
        "--reproduction",
        help="Issue section content: reproduction conditions (optional)",
    )
    parser.add_argument(
        "--repo",
        help="Target repository in owner/repo format. Defaults to origin remote.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build and print payload only, without creating an issue.",
    )
    return parser.parse_args()


def run_command(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, check=False, capture_output=True, text=True)


def has_gh_auth() -> bool:
    if shutil.which("gh") is None:
        return False
    result = run_command(["gh", "auth", "status"])
    return result.returncode == 0


def get_token() -> str | None:
    for key in ("GITHUB_TOKEN", "GH_TOKEN"):
        value = os.getenv(key, "").strip()
        if value:
            return value
    return None


def resolve_repo(explicit_repo: str | None) -> str:
    if explicit_repo:
        return validate_repo(explicit_repo)

    remote_result = run_command(["git", "remote", "get-url", "origin"])
    if remote_result.returncode != 0:
        raise SystemExit("Unable to resolve origin remote. Pass --repo owner/repo.")

    remote = remote_result.stdout.strip()
    match = re.search(
        r"github\.com[:/](?P<owner>[A-Za-z0-9_.-]+)/(?P<repo>[A-Za-z0-9_.-]+?)(?:\.git)?$",
        remote,
    )
    if not match:
        raise SystemExit("Origin remote is not a GitHub repository. Pass --repo owner/repo.")

    return f"{match.group('owner')}/{match.group('repo')}"


def validate_repo(repo: str) -> str:
    candidate = repo.strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", candidate):
        raise SystemExit("Invalid repo format. Use owner/repo.")
    return candidate


def github_request(
    method: str,
    path: str,
    *,
    token: str | None,
    accept: str,
    payload: dict | None = None,
) -> str:
    headers = {
        "Accept": accept,
        "User-Agent": "app-log-issue-analysis-skill",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    data = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(
        url=f"{GITHUB_API_BASE}{path}",
        data=data,
        headers=headers,
        method=method,
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub API {exc.code} {path}: {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"GitHub API request failed for {path}: {exc.reason}") from exc


def fetch_remote_readme(repo: str, gh_authenticated: bool, token: str | None) -> str:
    if gh_authenticated:
        result = run_command(
            ["gh", "api", "-H", f"Accept: {README_ACCEPT}", f"repos/{repo}/readme"]
        )
        if result.returncode == 0:
            return result.stdout

    try:
        return github_request(
            "GET",
            f"/repos/{repo}/readme",
            token=token,
            accept=README_ACCEPT,
        )
    except RuntimeError:
        return ""


def detect_issue_language(readme_content: str) -> str:
    if not readme_content.strip():
        return "en"

    chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", readme_content))
    language_chars = len(re.findall(r"[A-Za-z\u4e00-\u9fff]", readme_content))

    if chinese_chars >= 20 and chinese_chars / max(language_chars, 1) >= 0.08:
        return "zh"
    return "en"


def build_issue_body(
    *,
    language: str,
    problem_description: str,
    suspected_cause: str,
    reproduction: str | None,
) -> str:
    if language == "zh":
        repro_text = (reproduction or DEFAULT_REPRO_ZH).strip()
        return (
            "### 問題描述\n"
            f"{problem_description.strip()}\n\n"
            "### 推測原因\n"
            f"{suspected_cause.strip()}\n\n"
            "### 重現條件（如有）\n"
            f"{repro_text}\n"
        )

    repro_text = (reproduction or DEFAULT_REPRO_EN).strip()
    return (
        "### Problem Description\n"
        f"{problem_description.strip()}\n\n"
        "### Suspected Cause\n"
        f"{suspected_cause.strip()}\n\n"
        "### Reproduction Conditions (if available)\n"
        f"{repro_text}\n"
    )


def create_issue_with_gh(repo: str, title: str, body: str) -> str:
    tmp_file: Path | None = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".md", delete=False) as handle:
            handle.write(body)
            tmp_file = Path(handle.name)

        result = run_command(
            [
                "gh",
                "issue",
                "create",
                "--repo",
                repo,
                "--title",
                title,
                "--body-file",
                str(tmp_file),
            ]
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "gh issue create failed")

        url_match = re.search(r"https://github\.com/[^\s]+/issues/\d+", result.stdout)
        return url_match.group(0) if url_match else result.stdout.strip()
    finally:
        if tmp_file and tmp_file.exists():
            tmp_file.unlink()


def create_issue_with_token(repo: str, title: str, body: str, token: str) -> str:
    response = github_request(
        "POST",
        f"/repos/{repo}/issues",
        token=token,
        accept=JSON_ACCEPT,
        payload={"title": title, "body": body},
    )
    parsed = json.loads(response)
    issue_url = parsed.get("html_url", "")
    if not issue_url:
        raise RuntimeError("Issue created but response did not include html_url")
    return issue_url


def main() -> int:
    args = parse_args()

    gh_authenticated = has_gh_auth()
    token = get_token()
    repo = resolve_repo(args.repo)

    readme_content = fetch_remote_readme(repo, gh_authenticated, token)
    language = detect_issue_language(readme_content)

    issue_body = build_issue_body(
        language=language,
        problem_description=args.problem_description,
        suspected_cause=args.suspected_cause,
        reproduction=args.reproduction,
    )

    mode = "draft-only"
    issue_url = ""
    publish_error = ""

    if args.dry_run:
        mode = "dry-run"
    elif gh_authenticated:
        try:
            issue_url = create_issue_with_gh(repo, args.title, issue_body)
            mode = "gh-cli"
        except RuntimeError as exc:
            if token:
                try:
                    issue_url = create_issue_with_token(repo, args.title, issue_body, token)
                    mode = "github-token"
                except RuntimeError as token_exc:
                    publish_error = str(token_exc)
            else:
                publish_error = str(exc)
    elif token:
        try:
            issue_url = create_issue_with_token(repo, args.title, issue_body, token)
            mode = "github-token"
        except RuntimeError as exc:
            publish_error = str(exc)

    output = {
        "repo": repo,
        "language": "zh" if language == "zh" else "en",
        "mode": mode,
        "issue_url": issue_url,
        "issue_title": args.title,
        "issue_body": issue_body,
        "publish_error": publish_error,
    }
    print(json.dumps(output, ensure_ascii=False))

    if mode == "draft-only":
        if publish_error:
            print(f"Issue publish failed. Return draft only: {publish_error}", file=sys.stderr)
        else:
            print(
                "No authenticated gh CLI session and no GitHub token found. "
                "Return draft issue body only.",
                file=sys.stderr,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
