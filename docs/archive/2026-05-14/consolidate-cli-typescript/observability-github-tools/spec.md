# Spec: Observability and GitHub Tools Migration

- Date: 2026-05-14
- Feature: Observability and GitHub Tools Migration
- Owner: [To be filled]

## Goal

將觀察性工具（filter-logs、search-logs）和 GitHub 工作流工具（open-github-issue、find-github-issues、read-github-issue、review-threads）從 Python 腳本移植為 TypeScript handler，使其可被 `apltk` CLI 直接呼叫。

## Scope

### In Scope
- `analyse-app-logs/scripts/filter_logs_by_time.py` → `lib/tools/filter-logs.ts`
- `analyse-app-logs/scripts/search_logs.py` → `lib/tools/search-logs.ts`
- `analyse-app-logs/scripts/log_cli_utils.py` → `lib/tools/log-cli-utils.ts`
- `open-github-issue/scripts/open_github_issue.py` → `lib/tools/open-github-issue.ts`
- `read-github-issue/scripts/find_issues.py` → `lib/tools/find-github-issues.ts`
- `read-github-issue/scripts/read_issue.py` → `lib/tools/read-github-issue.ts`
- `resolve-review-comments/scripts/review_threads.py` → `lib/tools/review-threads.ts`
- 在 `lib/tool-runner.ts` 的 TOOL_COMMANDS 中為每個移植工具新增 `handler` 欄位

### Out of Scope
- 修改工具 CLI 參數或行為（純移植，功能保持不變）
- 刪除原始 Python 腳本（由 Spec 4 負責）
- 刪除技能中的 `scripts/` 目錄（由 Spec 4 負責）
- 更新 SKILL.md 文檔（由 Spec 4 負責）
- 新增功能或改善錯誤處理

## Functional Behaviors (BDD)

### Requirement 1: Log 過濾工具（filter-logs）
**GIVEN** 使用者有一個包含 ISO 8601 時間戳的日誌檔案
**AND** 使用者指定了 `--start` 和 `--end` 時間範圍
**WHEN** 使用者執行 `apltk filter-logs app.log --start 2026-03-24T10:00:00Z --end 2026-03-24T10:15:00Z`
**THEN** 輸出僅包含時間範圍內的日誌行
**AND** 行為與原 Python 腳本完全一致

**Requirements**:
- [ ] R1.1 `filter-logs` handler 正確解析 CLI 參數（--start、--end、input file）
- [ ] R1.2 支援 stdin 輸入（當未指定檔案時從 stdin 讀取）
- [ ] R1.3 時間戳比對邏輯與原 Python 腳本一致（含時區處理）
- [ ] R1.4 `apltk filter-logs --help` 顯示正確的幫助資訊

### Requirement 2: Log 搜尋工具（search-logs）
**GIVEN** 使用者有一個日誌檔案
**AND** 使用者指定了搜尋模式（關鍵字或 regex）
**WHEN** 使用者執行 `apltk search-logs app.log --pattern "timeout|ECONNRESET"`
**THEN** 輸出包含匹配的日誌行
**AND** 行為與原 Python 腳本完全一致

**Requirements**:
- [ ] R2.1 `search-logs` handler 正確解析 --pattern、--file 等參數
- [ ] R2.2 regex 搜尋邏輯與原 Python 腳本一致
- [ ] R2.3 支援可選的時間範圍過濾（復用 log-cli-utils）

### Requirement 3: GitHub Issue 發布工具（open-github-issue）
**GIVEN** 使用者已準備好 issue payload JSON 檔案
**AND** gh CLI 已認證
**WHEN** 使用者執行 `apltk open-github-issue --payload-file /tmp/issue.json --repo owner/repo`
**THEN** GitHub issue 被成功創建（或 draft-only fallback）
**AND** 輸出 JSON 結果描述發布狀態和 issue URL

**Requirements**:
- [ ] R3.1 `open-github-issue` handler 正確讀取 payload JSON
- [ ] R3.2 支援多種 auth fallback 模式
- [ ] R3.3 輸出 JSON 結果格式與原 Python 腳本一致

### Requirement 4: GitHub Issues 列表和讀取工具（find-github-issues, read-github-issue）
**GIVEN** gh CLI 已認證
**WHEN** 使用者執行 `apltk find-github-issues --repo owner/repo --query "architecture"`
**THEN** 輸出匹配的 issue 列表（JSON 或 table 格式）
**WHEN** 使用者執行 `apltk read-github-issue --repo owner/repo --issue 123`
**THEN** 輸出該 issue 的詳細內容

**Requirements**:
- [ ] R4.1 `find-github-issues` handler 正確呼叫 `gh issue list` 並格式化輸出
- [ ] R4.2 `read-github-issue` handler 正確呼叫 `gh issue view` 並格式化輸出

### Requirement 5: PR Review 執行緒工具（review-threads）
**GIVEN** gh CLI 已認證
**WHEN** 使用者執行 `apltk review-threads list --repo owner/repo --pr 42`
**THEN** 輸出 PR 的 review threads
**WHEN** 使用者執行 `apltk review-threads resolve --repo owner/repo --thread-id PRT_abc123`
**THEN** 該 review thread 被標記為 resolved

**Requirements**:
- [ ] R5.1 `review-threads` handler 支援 list 和 resolve 子命令
- [ ] R5.2 輸出格式與原 Python 腳本一致

## Error and Edge Cases
- [ ] gh CLI 未安裝或未認證時顯示清晰的錯誤訊息
- [ ] 無效的 JSON payload 格式時顯示具體解析錯誤
- [ ] 空的日誌檔案應輸出空結果而非錯誤
- [ ] 無效的正則表達式模式時顯示錯誤訊息
- [ ] GitHub API rate limit 觸發時正確處理

## Clarification Questions
None

## References
- Official docs:
  - [GitHub CLI Manual](https://cli.github.com/manual/)
- Related code files:
  - `analyse-app-logs/scripts/filter_logs_by_time.py` (64 行)
  - `analyse-app-logs/scripts/search_logs.py` (137 行)
  - `analyse-app-logs/scripts/log_cli_utils.py` (112 行)
  - `open-github-issue/scripts/open_github_issue.py` (705 行)
  - `read-github-issue/scripts/find_issues.py` (148 行)
  - `read-github-issue/scripts/read_issue.py` (108 行)
  - `resolve-review-comments/scripts/review_threads.py` (425 行)
  - `lib/tool-runner.ts`（更新 TOOL_COMMANDS）
