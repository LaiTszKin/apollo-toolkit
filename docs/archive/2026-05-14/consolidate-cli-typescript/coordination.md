# Coordination: Consolidate Skills Scripts into TypeScript CLI

- Date: 2026-05-14
- Batch: consolidate-cli-typescript

## Business Goals

將所有技能中分散的腳本（Python、Shell、Swift）從技能目錄中剝離，統一以 TypeScript 重寫並整合進 `apltk` CLI 工具，消除對外部執行環境（Python3、Swift、bash）的依賴，並消除重複腳本。

- Batch members: [cli-core-typescript, observability-github-tools, media-rendering-tools, codex-memory-catalog-cleanup]
- Shared outcome: `apltk` CLI 成為單一入口，所有工具功能通過直接 TypeScript 函數呼叫執行（不再通過 child_process.spawn 啟動外部腳本），技能目錄中不再有 `scripts/` 目錄。
- Out of scope: 修改技能的 SKILL.md 業務邏輯（只更新工具引用路徑），新增功能，修改 installer 的安裝目標邏輯以外的行為。

## Design Principles

- Current baseline: CLI 入口 `bin/apollo-toolkit.js` + `lib/cli.js` + `lib/tool-runner.js`；工具通過 `child_process.spawn` 執行分散在各技能 `scripts/` 目錄的 Python/Shell/Swift 腳本；共 18 個 Python 腳本、2 個 Shell wrapper、1 個 Swift 腳本、2 個 JS 腳本。
- Shared invariants:
  - `apltk <tool> [...args]` CLI 介面保持不變
  - `TOOL_COMMANDS` registry 結構保持相同欄位定義，但 `runner` 欄位改為內部模組引用
  - 每個工具的 CLI 參數（flags）保持向後兼容
  - `npm test` 必須通過
- Shared constraints:
  - TypeScript 編譯目標：Node.js >= 18.18（與 package.json engines 一致）
  - 輸出 CommonJS 模組（與現有 package.json `"type": "commonjs"` 一致），或改為 ESM 並更新 package.json
  - 不引入新的外部依賴（使用 Node.js 內建模組 + 現有依賴 js-yaml、elkjs）
  - 對 macOS 專有的 PDFKit 功能：通過 `swift` 執行內嵌 Swift 腳本或改用其他方式
- Legacy direction: 所有 Python/Shell/Swift 腳本及其 `__pycache__/` 目錄完全移除
- Compatibility window: 新的 TypeScript CLI 完全取代舊有 spawn 機制，無共存期
- Cleanup after cutover: 移除所有技能中的 `scripts/` 目錄、移除 `COPY_DIRS` 中的 `scripts`、移除 `test/python-scripts.test.js`、更新所有 SKILL.md 中的腳本引用

## Spec Boundaries

### Ownership Map

#### Spec Set 1: cli-core-typescript
- Primary concern: TypeScript 編譯基礎設施、CLI 核心模組轉換（cli、tool-runner、installer、updater）、共享工具模組
- Allowed touch points: `package.json`、`tsconfig.json`、`lib/*.ts`（新）、`bin/apollo-toolkit.ts`（新）、`.gitignore`、`lib/utils/`
- Must not change: 技能目錄內容（SKILL.md、agents/ 等），Python 腳本（只由其他 spec 負責移除）

#### Spec Set 2: observability-github-tools
- Primary concern: 將觀察性工具和 GitHub 工作流工具的 Python 腳本移植為 TypeScript
- Allowed touch points: `lib/tools/filter-logs.ts`、`lib/tools/search-logs.ts`、`lib/tools/log-cli-utils.ts`、`lib/tools/open-github-issue.ts`、`lib/tools/find-github-issues.ts`、`lib/tools/read-github-issue.ts`、`lib/tools/review-threads.ts`、`lib/tool-runner.ts`（更新 registry）
- Must not change: 現有 Python 腳本內容（只讀取作為移植參考），CLI 核心邏輯

#### Spec Set 3: media-rendering-tools
- Primary concern: 將媒體/渲染相關工具的腳本移植為 TypeScript
- Allowed touch points: `lib/tools/docs-to-voice.ts`、`lib/tools/render-katex.ts`、`lib/tools/render-error-book.ts`、`lib/tools/generate-storyboard-images.ts`、`lib/tools/enforce-video-aspect-ratio.ts`、`lib/tools/extract-pdf-text.ts`、`lib/tools/create-specs.ts`、`lib/tool-runner.ts`（更新 registry）
- Must not change: 現有 Python/Swift 腳本內容（只讀取）

#### Spec Set 4: codex-memory-catalog-cleanup
- Primary concern: 移植 Codex 記憶工具（合併重複腳本）、目錄維護工具、init-project-html JS 腳本、清理所有舊腳本和測試
- Allowed touch points: `lib/tools/extract-conversations.ts`（合併兩個重複）、`lib/tools/sync-memory-index.ts`、`lib/tools/validate-skill-frontmatter.ts`、`lib/tools/validate-openai-agent-config.ts`、`lib/tools/architecture.ts`（從 JS 轉換）、`lib/tool-runner.ts`（更新 registry）、各技能的 `scripts/` 目錄（刪除）、各技能的 `SKILL.md`（更新引用）、`lib/installer.ts`（移除 scripts 複製邏輯）、`test/` 目錄
- Must not change: 業務邏輯、工具行為

### Collisions & Integration

- Shared files & edit rules:
  - `lib/tool-runner.ts`: Spec 2/3/4 都會更新 TOOL_COMMANDS registry → 按順序合併，每個 spec 只新增自己負責的工具定義
  - `package.json`: Spec 1 設定基礎，其他 spec 如需新增 npm scripts 需通過 coordination
- Shared API / schema freeze: `TOOL_COMMANDS` 介面由 Spec 1 定義並凍結
- Compatibility shim retention: 在全部 4 個 spec 完成前，保留 spawn-based 執行作為 fallback；Spec 4 負責最終移除
- Merge order: cli-core-typescript → observability-github-tools / media-rendering-tools（可並行）→ codex-memory-catalog-cleanup
- Integration checkpoints:
  - Spec 1 完成後：`apltk` CLI 可啟動，但工具仍通過 spawn 執行
  - Spec 2+3 完成後：所有工具可通過直接函數呼叫執行
  - Spec 4 完成後：所有舊腳本已移除，`npm test` 通過
- Re-coordination trigger: TOOL_COMMANDS 介面變更、TypeScript 編譯目標變更、Node.js 版本需求變更
