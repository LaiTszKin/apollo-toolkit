# Tasks: Codex Memory Catalog and Cleanup

- Date: 2026-05-14
- Feature: Codex Memory Catalog and Cleanup

## **Task 1: 移植 validate-skill-frontmatter 工具**

Purpose: 將 SKILL.md frontmatter 驗證腳本移植為 TypeScript handler
Requirements: R3.1
Scope: `lib/tools/validate-skill-frontmatter.ts`（新檔案）
Out of scope: 修改驗證規則

- 1. [ ] **`lib/tools/validate-skill-frontmatter.ts`** — 實作 `validateSkillFrontmatterHandler()`：讀取所有頂層技能的 SKILL.md，解析 YAML frontmatter，驗證必要欄位和命名規範
  - Verify: 比對輸出與原 Python 腳本一致（使用已存在的技能目錄測試）

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `validate-skill-frontmatter` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: `apltk validate-skill-frontmatter` 正確輸出

## **Task 2: 移植 validate-openai-agent-config 工具**

Purpose: 將 agents/openai.yaml 配置驗證腳本移植為 TypeScript handler
Requirements: R3.2
Scope: `lib/tools/validate-openai-agent-config.ts`（新檔案）
Out of scope: 修改驗證規則

- 1. [ ] **`lib/tools/validate-openai-agent-config.ts`** — 實作 `validateOpenaiAgentConfigHandler()`：讀取所有頂層技能的 agents/openai.yaml，驗證配置完整性
  - Verify: 比對輸出與原 Python 腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `validate-openai-agent-config` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: `apltk validate-openai-agent-config` 正確輸出

## **Task 3: 移植 sync-memory-index 工具**

Purpose: 將 Codex 記憶索引同步腳本移植為 TypeScript handler
Requirements: R2.1
Scope: `lib/tools/sync-memory-index.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/sync-memory-index.ts`** — 實作 `syncMemoryIndexHandler()`：讀取記憶目錄中的 .md 檔案，更新 ~/.codex/AGENTS.md 中的記憶索引區塊
  - Verify: 比對輸出與原 Python 腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `sync-codex-memory-index` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: handler 可被 CLI 正確呼叫

## **Task 4: 合併並移植 extract-conversations 工具**

Purpose: 合併兩個完全相同的 `extract_recent_conversations.py` 為單一 TypeScript handler
Requirements: R1.1, R1.2
Scope: `lib/tools/extract-conversations.ts`（新檔案）
Out of scope: 修改會話提取邏輯

- 1. [ ] **`lib/tools/extract-conversations.ts`** — 實作 `extractConversationsHandler()`：讀取 Codex 會話歷史，支援 --hours 參數；合併兩個原始腳本的功能（369 行 × 2 完全一致，確認無差異後合併）
  - Verify: diff 兩個原始 .py 檔案確認完全一致；比對輸出與原腳本一致

- 2. [ ] **`lib/tools/extract-conversations.ts`** — 根據 TOOL_COMMANDS 名稱（`extract-codex-conversations` vs `extract-skill-conversations`）調整輸出格式或行為（若有差異）
  - Verify: 兩個 CLI 命令的輸出分別與對應的原腳本一致

- 3. [ ] **`lib/tool-runner.ts`** — 更新 `extract-codex-conversations` 和 `extract-skill-conversations` 的 TOOL_COMMANDS 定義：兩者共用同一個 handler
  - Verify: `apltk extract-codex-conversations --hours 24` 和 `apltk extract-skill-conversations --hours 24` 均正確執行

## **Task 5: 轉換 architecture 工具**

Purpose: 將 `init-project-html/scripts/architecture.js` 轉換為 TypeScript handler
Requirements: R4.1, R4.2, R4.3
Scope: `lib/tools/architecture.ts`（新檔案）
Out of scope: 修改 atlas 核心邏輯（state.js、schema.js 等保留為 JS 或獨立 TS 轉換）

- 1. [ ] **`lib/tools/architecture.ts`** — 實作 `architectureHandler()`：解析 verb 和選項，轉發到 atlas CLI 模組（`init-project-html/lib/atlas/cli.js`）
  - Verify: `apltk architecture --help` 輸出與原版一致

- 2. [ ] **`lib/tools/architecture.ts`** — 整合 `architecture-bootstrap-render.js` 的邏輯（需要的話）
  - Verify: `apltk architecture`（無參數）打開 atlas HTML

- 3. [ ] **`lib/tool-runner.ts`** — 更新 `architecture` 的 TOOL_COMMANDS 定義：新增 handler（移除 runner: 'node' 或保留為 fallback）
  - Verify: `apltk architecture diff` 正確生成 diff viewer

## **Task 6: 更新 installer 移除 scripts 複製邏輯**

Purpose: 從 installer 中移除 `scripts/` 目錄的複製邏輯
Requirements: R5.3
Scope: `lib/installer.ts`
Out of scope: 其他 installer 行為變更

- 1. [ ] **`lib/installer.ts`** — 從 `COPY_DIRS` Set 中移除 `'scripts'`
  - Verify: `npm test` 中 installer 測試通過（技能目錄不再包含 scripts/）

## **Task 7: 刪除所有舊腳本**

Purpose: 清理所有技能中的 `scripts/` 目錄、Python/Shell/Swift 腳本、`__pycache__/`
Requirements: R5.1, R5.2
Scope: 14 個技能的 `scripts/` 目錄、`test/python-scripts.test.js`
Out of scope: 頂層 `scripts/install_skills.sh` 和 `scripts/install_skills.ps1`

- 1. [ ] **各技能目錄** — 刪除以下 `scripts/` 目錄：
  - `analyse-app-logs/scripts/`（filter_logs_by_time.py, search_logs.py, log_cli_utils.py + `__pycache__/`）
  - `docs-to-voice/scripts/`（docs_to_voice.py, docs_to_voice.sh + `__pycache__/`）
  - `read-github-issue/scripts/`（find_issues.py, read_issue.py + `__pycache__/`）
  - `open-github-issue/scripts/`（open_github_issue.py + `__pycache__/`）
  - `resolve-review-comments/scripts/`（review_threads.py + `__pycache__/`）
  - `learning-error-book/scripts/`（render_error_book_json_to_pdf.py + `__pycache__/`）
  - `katex/scripts/`（render_katex.py, render_katex.sh + `__pycache__/`）
  - `openai-text-to-image-storyboard/scripts/`（generate_storyboard_images.py + `__pycache__/`）
  - `text-to-short-video/scripts/`（enforce_video_aspect_ratio.py + `__pycache__/`）
  - `weekly-financial-event-report/scripts/`（extract_pdf_text_pdfkit.swift）
  - `generate-spec/scripts/`（create-specs + `__pycache__/`）
  - `init-project-html/scripts/`（architecture.js, architecture-bootstrap-render.js）
  - `codex/codex-memory-manager/scripts/`（extract_recent_conversations.py, sync_memory_index.py）
  - `codex/learn-skill-from-conversations/scripts/`（extract_recent_conversations.py）
  - Verify: `find . -name "scripts" -type d | grep -v node_modules` 只有頂層 `./scripts`（安裝輔助）

- 2. [ ] **`test/python-scripts.test.js`** — 刪除（Python 測試已無對應腳本）
  - Verify: `npm test` 不執行 Python 測試

- 3. [ ] **`.gitignore`** — 移除 `__pycache__/` 和 `*.pyc` 規則（若確認無其他 Python 檔案）
  - Verify: `git status` 檢查

- 4. [ ] **`test/`** — 新增 TypeScript 工具測試：`test/tools/extract-conversations.test.ts`、`test/tools/validate-skills.test.ts`、`test/tools/sync-memory-index.test.ts`、`test/tools/architecture.test.ts`
  - Verify: `npm test` 通過

## **Task 8: 更新所有 SKILL.md 文檔引用**

Purpose: 將 SKILL.md 中的腳本路徑引用改為 CLI 命令引用
Requirements: R6.1, R6.2, R6.3
Scope: 13 個技能的 `SKILL.md`
Out of scope: 修改技能業務邏輯

- 1. [ ] **各 SKILL.md** — 更新以下技能的 `SKILL.md`（將 `scripts/<name>.py` 引用改為 `apltk <tool-name>`）：
  - `analyse-app-logs/SKILL.md` — 更新 filter_logs_by_time.py、search_logs.py、log_cli_utils.py 引用
  - `docs-to-voice/SKILL.md` — 更新 docs_to_voice.sh 引用
  - `read-github-issue/SKILL.md` — 更新 find_issues.py、read_issue.py 引用
  - `open-github-issue/SKILL.md` — 更新 open_github_issue.py 引用
  - `resolve-review-comments/SKILL.md` — 更新 review_threads.py 引用
  - `learning-error-book/SKILL.md` — 更新 render_error_book_json_to_pdf.py 引用
  - `katex/SKILL.md` — 更新 render_katex.py、render_katex.sh 引用
  - `openai-text-to-image-storyboard/SKILL.md` — 更新 generate_storyboard_images.py 引用
  - `text-to-short-video/SKILL.md` — 更新 enforce_video_aspect_ratio.py 引用
  - `weekly-financial-event-report/SKILL.md` — 更新 extract_pdf_text_pdfkit.swift 引用
  - `generate-spec/SKILL.md` — 更新 create-specs 引用
  - `codex/codex-memory-manager/SKILL.md` — 更新 extract_recent_conversations.py、sync_memory_index.py 引用
  - `codex/learn-skill-from-conversations/SKILL.md` — 更新 extract_recent_conversations.py 引用
  - Verify: `grep -r "scripts/" --include="SKILL.md"` 無結果（或僅剩 non-tool 引用）

- 2. [ ] **驗證** — `npm test` 全部通過
  - Verify: `npm test` 輸出全部 PASS
