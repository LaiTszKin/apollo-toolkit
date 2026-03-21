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
ISSUE_TYPE_PROBLEM = "problem"
ISSUE_TYPE_FEATURE = "feature"
PROBLEM_BDD_MARKER_GROUPS = (
    (
        r"Expected Behavior\s*\(BDD\)",
        r"Current Behavior\s*\(BDD\)",
        r"Behavior Gap",
    ),
    (
        r"預期行為\s*[（(]BDD[）)]",
        r"(?:目前|當前)行為\s*[（(]BDD[）)]",
        r"行為(?:落差|差異)",
    ),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Publish a structured GitHub issue or feature proposal. "
            "Auth order: gh CLI login -> GitHub token -> draft only."
        )
    )
    parser.add_argument("--title", required=True, help="Issue title")
    parser.add_argument(
        "--issue-type",
        choices=[ISSUE_TYPE_PROBLEM, ISSUE_TYPE_FEATURE],
        default=ISSUE_TYPE_PROBLEM,
        help="Structured issue type to publish.",
    )
    parser.add_argument(
        "--problem-description",
        help="Issue section content: problem description",
    )
    parser.add_argument(
        "--suspected-cause",
        help="Issue section content: suspected cause",
    )
    parser.add_argument(
        "--reproduction",
        help="Issue section content: reproduction conditions (optional)",
    )
    parser.add_argument(
        "--proposal",
        help="Issue section content: feature proposal summary (optional; defaults to title)",
    )
    parser.add_argument(
        "--reason",
        help="Issue section content: why the feature is needed",
    )
    parser.add_argument(
        "--suggested-architecture",
        help="Issue section content: suggested architecture for the feature",
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


def validate_issue_content_args(args: argparse.Namespace) -> None:
    if args.issue_type == ISSUE_TYPE_FEATURE:
        if not (args.reason or "").strip():
            raise SystemExit("Feature issues require --reason.")
        if not (args.suggested_architecture or "").strip():
            raise SystemExit("Feature issues require --suggested-architecture.")
        return

    if not (args.problem_description or "").strip():
        raise SystemExit("Problem issues require --problem-description.")
    if not (args.suspected_cause or "").strip():
        raise SystemExit("Problem issues require --suspected-cause.")
    if not has_required_problem_bdd_sections(args.problem_description or ""):
        raise SystemExit(
            "Problem issues require --problem-description to include "
            "Expected Behavior (BDD), Current Behavior (BDD), and Behavior Gap sections."
        )


def has_required_problem_bdd_sections(problem_description: str) -> bool:
    normalized = problem_description.strip()
    return any(
        all(re.search(pattern, normalized, flags=re.IGNORECASE) for pattern in marker_group)
        for marker_group in PROBLEM_BDD_MARKER_GROUPS
    )


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
        "User-Agent": "open-github-issue-skill",
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
    issue_type: str,
    language: str,
    title: str,
    problem_description: str | None,
    suspected_cause: str | None,
    reproduction: str | None,
    proposal: str | None,
    reason: str | None,
    suggested_architecture: str | None,
) -> str:
    if issue_type == ISSUE_TYPE_FEATURE:
        proposal_text = (proposal or title).strip()
        reason_text = (reason or "").strip()
        architecture_text = (suggested_architecture or "").strip()

        if language == "zh":
            return (
                "### 功能提案\n"
                f"{proposal_text}\n\n"
                "### 原因\n"
                f"{reason_text}\n\n"
                "### 建議架構\n"
                f"{architecture_text}\n"
            )

        return (
            "### Feature Proposal\n"
            f"{proposal_text}\n\n"
            "### Why This Is Needed\n"
            f"{reason_text}\n\n"
            "### Suggested Architecture\n"
            f"{architecture_text}\n"
        )

    if language == "zh":
        repro_text = (reproduction or DEFAULT_REPRO_ZH).strip()
        return (
            "### 問題描述\n"
            f"{(problem_description or '').strip()}\n\n"
            "### 推測原因\n"
            f"{(suspected_cause or '').strip()}\n\n"
            "### 重現條件（如有）\n"
            f"{repro_text}\n"
        )

    repro_text = (reproduction or DEFAULT_REPRO_EN).strip()
    return (
        "### Problem Description\n"
        f"{(problem_description or '').strip()}\n\n"
        "### Suspected Cause\n"
        f"{(suspected_cause or '').strip()}\n\n"
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
    validate_issue_content_args(args)

    gh_authenticated = has_gh_auth()
    token = get_token()
    repo = resolve_repo(args.repo)

    readme_content = fetch_remote_readme(repo, gh_authenticated, token)
    language = detect_issue_language(readme_content)

    issue_body = build_issue_body(
        issue_type=args.issue_type,
        language=language,
        title=args.title,
        problem_description=args.problem_description,
        suspected_cause=args.suspected_cause,
        reproduction=args.reproduction,
        proposal=args.proposal,
        reason=args.reason,
        suggested_architecture=args.suggested_architecture,
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
        "issue_type": args.issue_type,
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
