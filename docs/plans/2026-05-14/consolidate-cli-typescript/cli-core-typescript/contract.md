# Contract: CLI Core TypeScript Conversion

- Date: 2026-05-14
- Feature: CLI Core TypeScript Conversion
- Change Name: cli-core-typescript

> **Purpose:** External-dependency context for `tasks.md`.

## Scope

- **External deps in this doc:** 1

## Dependencies

### typescript (devDependency)

#### Evidence

| Primary docs URL(s)             | Sections / anchors used |
| ------------------------------- | ----------------------- |
| https://www.typescriptlang.org/tsconfig | tsconfig.json options reference |

**Version revision assumed:** `^5.x`（latest），lock file 固定

#### Facts we rely on (must be citeable)

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| CommonJS 模組輸出（`module: "commonjs"`） | https://www.typescriptlang.org/tsconfig#module |
| ES2022 target（支援 top-level await、Array.findLast 等） | https://www.typescriptlang.org/tsconfig#target |
| Declaration 檔案產生（`declaration: true`） | https://www.typescriptlang.org/tsconfig#declaration |
| Strict 模式型別檢查 | https://www.typescriptlang.org/tsconfig#strict |

#### Limits & failures (coding obligations)

| Category                         | Doc fact | Meaning while executing `tasks.md` |
| -------- | --------- | ---------------------------------------- |
| 編譯效能 | tsc 漸進式編譯支援 incremental | 使用 `--incremental` 加速重複編譯 |
| 錯誤處理 | TypeScript 編譯錯誤不產生 JS 輸出 (noEmitOnError) | CI 中 `tsc --noEmit` 必須通過才能 commit |

#### Security & secrets (policy level)

| Concern           | Constraint |
| ----------------- | ---------- |
| 無安全相關依賴 | N/A — TypeScript 僅為開發期依賴 |

#### Integration anchors (`EXT-###`)

| ID        | What we integrate at this boundary | Non‑negotiables | Forbidden assumptions |
| --------- | ---------------------------------- | --------------- | --------------------- |
| `EXT-001` | `tsc` CLI 編譯器 | `tsconfig.json` 必須在 repo root；輸出目錄 `dist/` | 不可假設全域安裝 `typescript`（必須通過 `npx tsc` 或 `npm run build`） |

**Doc-level ordering constraint:** `None`

#### Trace hooks (no task parroting)

- Spec IDs covered: R1.x, R2.x, R3.x
- Related `design.md` module keys / `INT-###`: 所有模組
- **Unknown / `TBD`:** `None`
