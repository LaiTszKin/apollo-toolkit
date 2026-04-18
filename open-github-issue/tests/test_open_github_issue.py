#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import io
import json
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "open_github_issue.py"
SPEC = importlib.util.spec_from_file_location("open_github_issue", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class OpenGitHubIssueTests(unittest.TestCase):
    def test_validate_repo_rejects_invalid_format(self) -> None:
        with self.assertRaises(SystemExit):
            MODULE.validate_repo("owner-only")

    def test_hydrate_args_loads_payload_file_with_literal_backticks(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            payload_path = Path(temp_dir) / "issue.json"
            payload_path.write_text(
                json.dumps(
                    {
                        "title": "[Log] backticks",
                        "issue_type": MODULE.ISSUE_TYPE_PROBLEM,
                        "problem_description": (
                            "Expected Behavior (BDD)\n"
                            "Given markdown content contains code spans\n"
                            "When the issue is published\n"
                            "Then `printf should_not_run` remains literal\n\n"
                            "Current Behavior (BDD)\n"
                            "Given markdown content contains code spans\n"
                            "When the issue is published\n"
                            "Then `printf should_not_run` can be eaten by shell quoting\n\n"
                            "Behavior Gap\n"
                            "- Expected: `printf should_not_run` survives.\n"
                            "- Actual: inline shell args are fragile.\n"
                            "- Difference/Impact: issue evidence can be corrupted.\n"
                        ),
                        "suspected_cause": "Shell command substitution happens before Python receives argv.",
                    }
                ),
                encoding="utf-8",
            )

            args = Namespace(
                payload_file=str(payload_path),
                title=None,
                issue_type=None,
                problem_description=None,
                suspected_cause=None,
                reproduction=None,
                proposal=None,
                reason=None,
                suggested_architecture=None,
                impact=None,
                evidence=None,
                suggested_action=None,
                severity=None,
                affected_scope=None,
                repo=None,
                dry_run=False,
            )

            hydrated = MODULE.hydrate_args(args)

        self.assertEqual(hydrated.title, "[Log] backticks")
        self.assertIn("`printf should_not_run` remains literal", hydrated.problem_description)
        self.assertEqual(hydrated.issue_type, MODULE.ISSUE_TYPE_PROBLEM)

    def test_hydrate_args_reads_at_file_text_values(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            description_path = Path(temp_dir) / "description.md"
            description_path.write_text(
                "Expected Behavior (BDD)\n"
                "Given a markdown file contains backticks\n"
                "When it is loaded with @file syntax\n"
                "Then `literal` content survives\n\n"
                "Current Behavior (BDD)\n"
                "Given a markdown file contains backticks\n"
                "When inline shell args are avoided\n"
                "Then `literal` content reaches argparse unchanged\n\n"
                "Behavior Gap\n"
                "- Expected: file content is safe.\n"
                "- Actual: inline shell content is fragile.\n"
                "- Difference/Impact: safer invocation is needed.\n",
                encoding="utf-8",
            )
            args = Namespace(
                payload_file=None,
                title="[Log] @file",
                issue_type=MODULE.ISSUE_TYPE_PROBLEM,
                problem_description=f"@{description_path}",
                suspected_cause="Use @file for rich text fields.",
                reproduction=None,
                proposal=None,
                reason=None,
                suggested_architecture=None,
                impact=None,
                evidence=None,
                suggested_action=None,
                severity=None,
                affected_scope=None,
                repo="owner/repo",
                dry_run=True,
            )

            hydrated = MODULE.hydrate_args(args)

        self.assertIn("Then `literal` content survives", hydrated.problem_description)

    def test_detect_issue_language_prefers_chinese_when_threshold_met(self) -> None:
        readme = "這是一個中文專案說明。" * 10

        self.assertEqual(MODULE.detect_issue_language(readme), "zh")

    def test_detect_issue_language_defaults_to_english_for_sparse_chinese(self) -> None:
        readme = "English README with only 少量中文 and mostly latin text." * 2

        self.assertEqual(MODULE.detect_issue_language(readme), "en")

    def test_build_issue_body_uses_default_reproduction_text(self) -> None:
        zh_body = MODULE.build_issue_body(
            issue_type=MODULE.ISSUE_TYPE_PROBLEM,
            language="zh",
            title="[Log] 問題",
            problem_description="問題",
            suspected_cause="原因",
            reproduction=None,
            proposal=None,
            reason=None,
            suggested_architecture=None,
        )
        en_body = MODULE.build_issue_body(
            issue_type=MODULE.ISSUE_TYPE_PROBLEM,
            language="en",
            title="[Log] problem",
            problem_description="problem",
            suspected_cause="cause",
            reproduction=None,
            proposal=None,
            reason=None,
            suggested_architecture=None,
        )

        self.assertIn(MODULE.DEFAULT_REPRO_ZH, zh_body)
        self.assertIn(MODULE.DEFAULT_REPRO_EN, en_body)

    def test_build_issue_body_supports_feature_issue_sections(self) -> None:
        zh_body = MODULE.build_issue_body(
            issue_type=MODULE.ISSUE_TYPE_FEATURE,
            language="zh",
            title="[Feature] 匯出事故時間線",
            problem_description=None,
            suspected_cause=None,
            reproduction=None,
            proposal="新增事故時間線匯出功能",
            reason="減少手動整理 postmortem 成本",
            suggested_architecture="重用時間線查詢服務，新增共用匯出模組",
        )
        en_body = MODULE.build_issue_body(
            issue_type=MODULE.ISSUE_TYPE_FEATURE,
            language="en",
            title="[Feature] Export incident timeline",
            problem_description=None,
            suspected_cause=None,
            reproduction=None,
            proposal="Allow exporting incident timelines",
            reason="Support postmortem handoff",
            suggested_architecture="Add shared exporters and UI action",
            impact=None,
            evidence=None,
            suggested_action=None,
            severity=None,
            affected_scope=None,
        )

        self.assertIn("### 功能提案", zh_body)
        self.assertIn("### 建議架構", zh_body)
        self.assertIn("### Feature Proposal", en_body)
        self.assertIn("### Suggested Architecture", en_body)

    def test_build_issue_body_supports_security_issue_sections(self) -> None:
        en_body = MODULE.build_issue_body(
            issue_type=MODULE.ISSUE_TYPE_SECURITY,
            language="en",
            title="[Security] Missing auth",
            problem_description="Endpoint misses admin check",
            suspected_cause=None,
            reproduction=None,
            proposal=None,
            reason=None,
            suggested_architecture=None,
            impact="Sensitive export may leak",
            evidence="Reproduced request and code path review",
            suggested_action="Add authz and tests",
            severity="high",
            affected_scope="/admin/export",
        )

        self.assertIn("### Security Risk", en_body)
        self.assertIn("### Severity", en_body)
        self.assertIn("### Suggested Mitigation", en_body)

    def test_validate_issue_content_args_requires_feature_fields(self) -> None:
        with self.assertRaises(SystemExit):
            MODULE.validate_issue_content_args(
                Namespace(
                    issue_type=MODULE.ISSUE_TYPE_FEATURE,
                    reason="",
                    suggested_architecture="shared module",
                    problem_description=None,
                    suspected_cause=None,
                )
            )

        with self.assertRaises(SystemExit):
            MODULE.validate_issue_content_args(
                Namespace(
                    issue_type=MODULE.ISSUE_TYPE_FEATURE,
                    reason="important now",
                    suggested_architecture="",
                    problem_description=None,
                    suspected_cause=None,
                )
            )

        MODULE.validate_issue_content_args(
            Namespace(
                issue_type=MODULE.ISSUE_TYPE_FEATURE,
                reason="important now",
                suggested_architecture="shared module",
                problem_description=None,
                suspected_cause=None,
                impact=None,
                evidence=None,
                suggested_action=None,
                severity=None,
                affected_scope=None,
            )
        )

    def test_validate_issue_content_args_requires_security_fields(self) -> None:
        with self.assertRaises(SystemExit):
            MODULE.validate_issue_content_args(
                Namespace(
                    issue_type=MODULE.ISSUE_TYPE_SECURITY,
                    problem_description="auth missing",
                    affected_scope="",
                    impact="sensitive export may leak",
                    evidence="reproduced",
                    suggested_action="add authz",
                    severity="high",
                    reason=None,
                    suggested_architecture=None,
                    suspected_cause=None,
                )
            )

        MODULE.validate_issue_content_args(
            Namespace(
                issue_type=MODULE.ISSUE_TYPE_SECURITY,
                problem_description="auth missing",
                affected_scope="/admin/export",
                impact="sensitive export may leak",
                evidence="reproduced",
                suggested_action="add authz",
                severity="high",
                reason=None,
                suggested_architecture=None,
                suspected_cause=None,
            )
        )

    def test_validate_issue_content_args_requires_problem_bdd_sections(self) -> None:
        with self.assertRaises(SystemExit):
            MODULE.validate_issue_content_args(
                Namespace(
                    issue_type=MODULE.ISSUE_TYPE_PROBLEM,
                    reason=None,
                    suggested_architecture=None,
                    problem_description="Repeated timeout warnings escalated into request failures.",
                    suspected_cause="handler.py:12",
                    impact=None,
                    evidence=None,
                    suggested_action=None,
                    severity=None,
                    affected_scope=None,
                )
            )

        MODULE.validate_issue_content_args(
            Namespace(
                issue_type=MODULE.ISSUE_TYPE_PROBLEM,
                reason=None,
                suggested_architecture=None,
                problem_description=(
                    "Expected Behavior (BDD)\n"
                    "Given requests arrive during transient upstream latency\n"
                    "When the retry path runs\n"
                    "Then the request should recover without user-visible failure\n\n"
                    "Current Behavior (BDD)\n"
                    "Given requests arrive during transient upstream latency\n"
                    "When the retry path runs\n"
                    "Then the request still fails after immediate retries\n\n"
                    "Behavior Gap\n"
                    "- Expected: retries absorb transient slowness.\n"
                    "- Actual: retries amplify failures.\n"
                    "- Difference/Impact: users still receive errors.\n"
                ),
                suspected_cause="handler.py:12",
                impact=None,
                evidence=None,
                suggested_action=None,
                severity=None,
                affected_scope=None,
            )
        )

    def test_main_dry_run_returns_structured_json_without_publish_attempt(self) -> None:
        args = Namespace(
            title="[Log] sample",
            issue_type=MODULE.ISSUE_TYPE_PROBLEM,
            problem_description=(
                "Expected Behavior (BDD)\n"
                "Given the issue is confirmed\n"
                "When the issue body is rendered\n"
                "Then the expected path should be explicit\n\n"
                "Current Behavior (BDD)\n"
                "Given the issue is confirmed\n"
                "When the issue body is rendered\n"
                "Then the current path should be explicit\n\n"
                "Behavior Gap\n"
                "- Expected: clear behavior diff.\n"
                "- Actual: sample payload for dry run.\n"
                "- Difference/Impact: contract stays structured.\n"
            ),
            suspected_cause="handler.py:12",
            reproduction=None,
            proposal=None,
            reason=None,
            suggested_architecture=None,
            repo="owner/repo",
            dry_run=True,
            impact=None,
            evidence=None,
            suggested_action=None,
            severity=None,
            affected_scope=None,
        )

        with patch.object(MODULE, "parse_args", return_value=args), patch.object(
            MODULE, "has_gh_auth", return_value=False
        ), patch.object(MODULE, "get_token", return_value=None), patch.object(
            MODULE, "fetch_remote_readme", return_value="中文說明" * 20
        ), patch.object(MODULE, "create_issue_with_gh") as create_with_gh, patch.object(
            MODULE, "create_issue_with_token"
        ) as create_with_token, patch("sys.stdout", new_callable=io.StringIO) as stdout:
            code = MODULE.main()

        create_with_gh.assert_not_called()
        create_with_token.assert_not_called()
        self.assertEqual(code, 0)

        payload = json.loads(stdout.getvalue())
        self.assertEqual(payload["mode"], "dry-run")
        self.assertEqual(payload["issue_type"], MODULE.ISSUE_TYPE_PROBLEM)
        self.assertEqual(payload["language"], "zh")
        self.assertIn("### 問題描述", payload["issue_body"])


if __name__ == "__main__":
    unittest.main()
