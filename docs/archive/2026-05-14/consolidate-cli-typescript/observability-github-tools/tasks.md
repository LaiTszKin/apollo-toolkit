# Tasks: Observability and GitHub Tools Migration

- Date: 2026-05-14
- Feature: Observability and GitHub Tools Migration

## **Task 1: 移植 log-cli-utils 共享模組**

Purpose: 將日誌處理的共享工具函數從 Python 移植到 TypeScript
Requirements: R1.x, R2.x（輔助）
Scope: `lib/tools/log-cli-utils.ts`（新檔案）
Out of scope: filter-logs 和 search-logs 的具體邏輯

- 1. [ ] **`lib/tools/log-cli-utils.ts`** — 實作 `parseTimestamp()` 函數：解析 ISO 8601 時間戳，行為與 `log_cli_utils.py` 的 `parse_timestamp()` 一致
  - Verify: 單元測試驗證多種 ISO 8601 格式的正確解析

- 2. [ ] **`lib/tools/log-cli-utils.ts`** — 實作 `iterLines()` 函數：從檔案或 stdin 迭代讀取行，行為與 `log_cli_utils.py` 一致
  - Verify: 單元測試驗證檔案和 stdin 兩種輸入模式

## **Task 2: 移植 filter-logs 工具**

Purpose: 將 `filter_logs_by_time.py` 移植為 TypeScript handler
Requirements: R1.1, R1.2, R1.3, R1.4
Scope: `lib/tools/filter-logs.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/filter-logs.ts`** — 實作 `filterLogsHandler()` 函數：解析 CLI 參數（--start、--end、input file），使用 `log-cli-utils` 的 `parseTimestamp()` 和 `iterLines()` 進行時間範圍過濾
  - Verify: 使用已知時間戳的日誌檔案比對輸出與原 Python 腳本一致

- 2. [ ] **`lib/tools/filter-logs.ts`** — 實作 `--help` 輸出，內容與原 Python argparse help 一致
  - Verify: `apltk filter-logs --help` 輸出與原版一致

- 3. [ ] **`lib/tool-runner.ts`** — 更新 `filter-logs` 的 TOOL_COMMANDS 定義：新增 `handler: filterLogsHandler`
  - Verify: `apltk filter-logs app.log --start ... --end ...` 直接通過 handler 執行（非 spawn）

## **Task 3: 移植 search-logs 工具**

Purpose: 將 `search_logs.py` 移植為 TypeScript handler
Requirements: R2.1, R2.2, R2.3
Scope: `lib/tools/search-logs.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/search-logs.ts`** — 實作 `searchLogsHandler()` 函數：解析 CLI 參數，支援 regex 搜尋和可選時間範圍過濾
  - Verify: 使用已知內容的日誌檔案比對輸出與原 Python 腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `search-logs` 的 TOOL_COMMANDS 定義：新增 `handler: searchLogsHandler`
  - Verify: `apltk search-logs app.log --pattern "error"` 直接通過 handler 執行

## **Task 4: 移植 open-github-issue 工具**

Purpose: 將 `open_github_issue.py`（705 行，最複雜的腳本）移植為 TypeScript handler
Requirements: R3.1, R3.2, R3.3
Scope: `lib/tools/open-github-issue.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本、改善 auth 邏輯

- 1. [ ] **`lib/tools/open-github-issue.ts`** — 實作 `openGitHubIssueHandler()`：解析 --payload-file、--repo 參數，讀取 JSON payload
  - Verify: 型別檢查通過；參數解析正確

- 2. [ ] **`lib/tools/open-github-issue.ts`** — 實作 auth fallback 邏輯（gh auth token → GITHUB_TOKEN env → draft-only）
  - Verify: 使用 mock gh 測試三種 fallback 路徑

- 3. [ ] **`lib/tools/open-github-issue.ts`** — 實作 GitHub issue 創建（通過 `gh issue create`）和 JSON 結果輸出
  - Verify: 比對輸出 JSON schema 與原 Python 腳本一致

- 4. [ ] **`lib/tool-runner.ts`** — 更新 `open-github-issue` 的 TOOL_COMMANDS 定義：新增 `handler: openGitHubIssueHandler`
  - Verify: handler 可被 CLI 正確呼叫

## **Task 5: 移植 find-github-issues 和 read-github-issue 工具**

Purpose: 將 `find_issues.py` 和 `read_issue.py` 移植為 TypeScript handlers
Requirements: R4.1, R4.2
Scope: `lib/tools/find-github-issues.ts`、`lib/tools/read-github-issue.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/find-github-issues.ts`** — 實作 `findGitHubIssuesHandler()`：解析 --repo、--query 參數，執行 `gh issue list`
  - Verify: 比對輸出與原 Python 腳本一致

- 2. [ ] **`lib/tools/read-github-issue.ts`** — 實作 `readGitHubIssueHandler()`：解析 --repo、--issue 參數，執行 `gh issue view`
  - Verify: 比對輸出與原 Python 腳本一致

- 3. [ ] **`lib/tool-runner.ts`** — 更新 `find-github-issues` 和 `read-github-issue` 的 TOOL_COMMANDS 定義
  - Verify: handlers 可被 CLI 正確呼叫

## **Task 6: 移植 review-threads 工具**

Purpose: 將 `review_threads.py` 移植為 TypeScript handler
Requirements: R5.1, R5.2
Scope: `lib/tools/review-threads.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/review-threads.ts`** — 實作 `reviewThreadsHandler()`：支援 list 和 resolve 子命令
  - Verify: 比對輸出與原 Python 腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `review-threads` 的 TOOL_COMMANDS 定義：新增 `handler: reviewThreadsHandler`
  - Verify: handler 可被 CLI 正確呼叫
