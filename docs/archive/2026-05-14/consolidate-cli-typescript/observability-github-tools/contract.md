# Contract: Observability and GitHub Tools Migration

- Date: 2026-05-14
- Feature: Observability and GitHub Tools Migration
- Change Name: observability-github-tools

> **Purpose:** External-dependency context for `tasks.md`.

## Scope

- **External deps in this doc:** 1

## Dependencies

### gh CLI (GitHub)

#### Evidence

| Primary docs URL(s)             | Sections / anchors used |
| ------------------------------- | ----------------------- |
| https://cli.github.com/manual/ | gh issue create, gh issue list, gh issue view, gh api |

**Version revision assumed:** Not fixed（使用系統安裝的 gh）

#### Facts we rely on (must be citeable)

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| `gh issue create` 支援 `--body-file`、`--repo`、`--label` 等參數 | https://cli.github.com/manual/gh_issue_create |
| `gh issue list` 支援 `--search`、`--json`、`--limit` 查詢 | https://cli.github.com/manual/gh_issue_list |
| `gh issue view` 支援 `--json` 輸出 | https://cli.github.com/manual/gh_issue_view |
| `gh api` 支援 GraphQL 查詢用於 review threads | https://cli.github.com/manual/gh_api |
| `gh auth token` 取得當前認證 token | https://cli.github.com/manual/gh_auth_token |

#### Limits & failures (coding obligations)

| Category                         | Doc fact | Meaning while executing `tasks.md` |
| -------- | --------- | ---------------------------------------- |
| Rate limit | GitHub API 有 rate limit（未認證 60/hr，已認證 5000/hr） | 不必在工具中實作 rate limit 處理（gh CLI 內建） |
| Auth fallback | gh 可能未安裝或未認證 | 必須檢查 `gh auth status` 並提供明確錯誤訊息 |
| Errors | gh 輸出 stderr 包含錯誤訊息 | handler 必須捕捉 stderr 並顯示給使用者 |

#### Security & secrets (policy level)

| Concern           | Constraint |
| ----------------- | ---------- |
| Auth / scopes    | 使用 gh CLI 內建的 auth 機制，不直接處理 token |
| Secret keys      | 不讀取或儲存任何 GitHub token |

#### Integration anchors (`EXT-###`)

| ID        | What we integrate at this boundary | Non‑negotiables | Forbidden assumptions |
| --------- | ---------------------------------- | --------------- | --------------------- |
| `EXT-010` | `gh` CLI binary (via `child_process.execFileSync` / `spawn`) | gh 必須在 PATH 中；對於需要 auth 的操作，gh 必須已登入 | 不可假設特定 gh 版本；不可假設 GITHUB_TOKEN 環境變數存在 |

**Doc-level ordering constraint:** `None`

#### Trace hooks (no task parroting)

- Spec IDs covered: R3.x, R4.x, R5.x
- Related `design.md` module keys / `INT-###`: `INT-011`
- **Unknown / `TBD`:** `None`
