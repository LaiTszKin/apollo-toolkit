# Spec: Codex Memory Catalog and Cleanup

- Date: 2026-05-14
- Feature: Codex Memory Catalog and Cleanup
- Owner: [To be filled]

## Goal

移植 Codex 記憶工具（合併重複腳本）、目錄維護工具、init-project-html JS 腳本為 TypeScript，並清理所有技能中的舊 `scripts/` 目錄、Python/Shell/Swift 腳本、`__pycache__/`，以及更新相關文檔和測試。

## Scope

### In Scope
- **合併重複**：兩個相同的 `extract_recent_conversations.py`（369 行 × 2）→ 單一 `lib/tools/extract-conversations.ts`
- `codex/codex-memory-manager/scripts/sync_memory_index.py` → `lib/tools/sync-memory-index.ts`
- `scripts/validate_skill_frontmatter.py` → `lib/tools/validate-skill-frontmatter.ts`
- `scripts/validate_openai_agent_config.py` → `lib/tools/validate-openai-agent-config.ts`
- `init-project-html/scripts/architecture.js` → `lib/tools/architecture.ts`（從 CommonJS 轉換）
- `init-project-html/scripts/architecture-bootstrap-render.js` → 整合進 `lib/tools/architecture.ts`
- 在 `lib/tool-runner.ts` 的 TOOL_COMMANDS 中為所有移植工具新增 `handler` 欄位
- **清理**：刪除所有技能中的 `scripts/` 目錄及其內容（18 個 Python、2 個 Shell、1 個 Swift、2 個 JS + `__pycache__/`）
- **更新 `lib/installer.ts`**：從 `COPY_DIRS` 中移除 `'scripts'`
- **更新所有 SKILL.md**：將腳本路徑引用改為 `apltk <tool-name>` CLI 引用
- **更新測試**：移除 `test/python-scripts.test.js`，為新 TypeScript 工具新增測試
- **清理 `.gitignore`**：移除 `__pycache__/` 規則（如已無 Python 檔案）

### Out of Scope
- 修改技能的非腳本內容（SKILL.md 中的業務邏輯保持不變）
- 修改 installer 的安裝目標邏輯（除了移除 scripts 複製）
- 移除頂層 `scripts/` 目錄中的 `install_skills.sh` 和 `install_skills.ps1`（這些是安裝輔助腳本，非技能腳本）

## Functional Behaviors (BDD)

### Requirement 1: 合併重複的 extract-conversations 腳本
**GIVEN** 兩個完全相同的 `extract_recent_conversations.py` 分別在 `codex/codex-memory-manager/scripts/` 和 `codex/learn-skill-from-conversations/scripts/`
**WHEN** 合併後的 TypeScript handler 被呼叫
**THEN** `apltk extract-codex-conversations --hours 24` 行為與原腳本一致
**AND** `apltk extract-skill-conversations --hours 24` 行為與原腳本一致

**Requirements**:
- [ ] R1.1 單一 TypeScript handler 支援兩個 CLI 工具名稱（通過不同參數或包裝函數）
- [ ] R1.2 行為與兩個原始 Python 腳本一致

### Requirement 2: 移植 sync-memory-index 工具
**GIVEN** Codex 記憶檔案已更新
**WHEN** 使用者執行 `apltk sync-codex-memory-index`
**THEN** AGENTS.md 中的記憶索引被正確同步

**Requirements**:
- [ ] R2.1 handler 正確同步記憶索引，行為與原 Python 腳本一致

### Requirement 3: 移植目錄維護工具
**GIVEN** 技能目錄存在
**WHEN** 使用者執行 `apltk validate-skill-frontmatter`
**THEN** 驗證所有 SKILL.md 的 frontmatter 格式
**AND** 輸出驗證結果（PASS 或錯誤列表）

**WHEN** 使用者執行 `apltk validate-openai-agent-config`
**THEN** 驗證所有 agents/openai.yaml 的配置完整性
**AND** 輸出驗證結果

**Requirements**:
- [ ] R3.1 `validate-skill-frontmatter` handler 行為與原 Python 腳本一致
- [ ] R3.2 `validate-openai-agent-config` handler 行為與原 Python 腳本一致

### Requirement 4: 轉換 architecture 工具
**GIVEN** init-project-html 的 atlas CLI
**WHEN** 使用者執行 `apltk architecture [verb] [...options]`
**THEN** atlas CLI 功能完整可用（open、diff、validate、mutation）
**AND** 行為與原 JS 腳本一致

**Requirements**:
- [ ] R4.1 `architecture` handler 支援所有現有 verbs (open, diff, validate, feature add/remove/set, submodule add/remove/set, function add, variable add, dataflow add, error add, edge add, render)
- [ ] R4.2 atlas state 讀寫行為與原 `architecture.js` 一致
- [ ] R4.3 `apltk architecture diff` 生成正確的 diff viewer

### Requirement 5: 清理所有舊腳本和目錄
**GIVEN** 所有工具已移植為 TypeScript handler
**WHEN** 執行清理
**THEN** 所有技能中的 `scripts/` 目錄不存在
**AND** 倉庫中無 Python 腳本（除頂層 `scripts/install_skills.sh` 等安裝腳本外）
**AND** `npm test` 通過（無 python-scripts.test.js）

**Requirements**:
- [ ] R5.1 刪除 14 個 `scripts/` 目錄（包括 `__pycache__/`）
- [ ] R5.2 刪除 `test/python-scripts.test.js`
- [ ] R5.3 `lib/installer.ts` 中 `COPY_DIRS` 不再包含 `'scripts'`
- [ ] R5.4 `.gitignore` 中移除 `__pycache__/` 和 `*.pyc` 規則（若無其他 Python）
- [ ] R5.5 `npm test` 通過（所有 TypeScript 測試）

### Requirement 6: 更新 SKILL.md 文檔引用
**GIVEN** 所有工具已整合進 CLI
**WHEN** 查看各技能的 SKILL.md
**THEN** 腳本路徑引用已改為 `apltk <tool-name>` CLI 命令引用

**Requirements**:
- [ ] R6.1 所有 SKILL.md 中 `scripts/<name>.py` 引用改為 `apltk <tool-name>`
- [ ] R6.2 Shell wrapper 引用（`scripts/docs_to_voice.sh`、`scripts/render_katex.sh`）已移除
- [ ] R6.3 技能的功能描述不變

## Error and Edge Cases
- [ ] 清理後驗證 `apltk` CLI 所有工具（包括新移植的）可正常執行
- [ ] 清理後驗證 `apltk install` 仍可正常安裝技能（技能目錄結構改變）
- [ ] 合併後的 extract-conversations 處理兩個不同 CLI 名稱的 help 輸出
- [ ] architecture 工具的 atlas state 目錄權限問題

## Clarification Questions
None

## References
- Related code files:
  - `codex/codex-memory-manager/scripts/extract_recent_conversations.py` (369 行，重複)
  - `codex/learn-skill-from-conversations/scripts/extract_recent_conversations.py` (369 行，重複)
  - `codex/codex-memory-manager/scripts/sync_memory_index.py` (130 行)
  - `scripts/validate_skill_frontmatter.py` (131 行)
  - `scripts/validate_openai_agent_config.py` (209 行)
  - `init-project-html/scripts/architecture.js` (243 行)
  - `init-project-html/scripts/architecture-bootstrap-render.js` (26 行)
  - `init-project-html/lib/atlas/` — 現有 atlas 模組（state.js、schema.js、layout.js、render.js、cli.js）
  - `lib/installer.ts`（需修改 COPY_DIRS）
  - 各技能的 SKILL.md（需更新引用）
  - `test/python-scripts.test.js`（需移除）
