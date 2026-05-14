# Preparation: Consolidate Skills Scripts into TypeScript CLI

- Date: 2026-05-14
- Batch: consolidate-cli-typescript

## Preparation Goal

在開始各子 spec 的並行實作前，建立 TypeScript 編譯基礎設施、定義共享型別介面、並確認現有測試基線，確保所有子 spec 可在統一基礎上獨立開發。

- Why this exists: 沒有 TypeScript 基礎設施和共享型別，四個子 spec 無法並行開發
- Core business boundary: 不實現任何具體工具邏輯；不修改任何現有功能行為
- Depends on (specs): [cli-core-typescript, observability-github-tools, media-rendering-tools, codex-memory-catalog-cleanup]
- Parallel work starts after: `tsc` 編譯成功、共享型別定義完成、`npm test` 基線確認
- Out of scope: 具體工具的移植、舊腳本清理、SKILL.md 更新

## **Task P1: TypeScript 編譯基礎設施**

Purpose: 建立 tsconfig、npm scripts、輸出目錄，使 TypeScript 檔案可被編譯並由 Node.js 執行
Scope: `package.json`、`tsconfig.json`、`.gitignore`
Out of scope: 任何 .ts 源碼（除了最小的 smoke-test 檔案）

- P1. [ ] **`package.json`** — 新增 `typescript` devDependency、`build`/`watch` scripts、更新 `main`/`bin` 指向編譯輸出
  - Verify: `npm install && npm run build` 成功（即使尚無 .ts 檔案）

- P2. [ ] **`tsconfig.json`** — 建立 TypeScript 編譯配置：target ES2022、module commonjs、outDir dist/、rootDir .、declaration true、strict true
  - Verify: `npx tsc --noEmit` 成功（無 TypeScript 源碼時）

- P3. [ ] **`.gitignore`** — 新增 `dist/` 和 `*.tsbuildinfo`
  - Verify: `git status` 不顯示編譯產物

## **Task P2: 共享型別定義**

Purpose: 定義所有子 spec 共享的 TypeScript 型別介面，確保一致性
Scope: `lib/types.ts`（新檔案）
Out of scope: 任何執行時邏輯

- P1. [ ] **`lib/types.ts`** — 定義 `ToolDefinition`、`ToolHelp`、`ToolExample`、`ToolContext`、`RunnerKind` 型別
  - Verify: `npx tsc --noEmit` 通過型別檢查

- P2. [ ] **`lib/types.ts`** — 定義 `InstallMode`、`InstallResult`、`ManifestData` 型別（從 installer.js 提取）
  - Verify: `npx tsc --noEmit` 通過型別檢查

## **Task P3: 確認現有測試通過**

Purpose: 在開始修改之前，記錄基線測試結果
Scope: `npm test`
Out of scope: 新增或修改測試

- P1. [ ] **`npm test`** — 執行現有測試套件，確認全部通過，記錄基線
  - Verify: `npm test` 輸出全部 PASS

## Validation

- Verification required: `npm run build && npm test`
- Expected results: TypeScript 專案可編譯、現有測試全通過
- Regression risks covered: 基礎設施變更不影響現有功能

## Handoff

- Preparation commit required before parallel work: Yes
- Member specs assume: TypeScript 基礎設施就緒、共享型別可用、測試基線已確認
- Member specs must not change: `tsconfig.json`、共享型別（除非通過 coordination）
- Member specs own all business behavior: Yes
- If preparation changes later: 所有子 spec 必須停止並重新對齊
