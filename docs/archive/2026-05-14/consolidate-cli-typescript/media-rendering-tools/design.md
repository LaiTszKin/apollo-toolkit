# Design: Media Rendering and Spec Generation Tools

- Date: 2026-05-14
- Feature: Media Rendering and Spec Generation Tools
- Change Name: media-rendering-tools

> **Purpose:** High-level architectural context for `tasks.md`.

## Traceability

|                             |                                                                              |
| --------------------------- | ---------------------------------------------------------------------------- |
| Requirement IDs             | R1.x ~ R7.x                                                                 |
| In-scope modules (≤3)       | `lib/tools/docs-to-voice.ts`, `lib/tools/render-katex.ts`, `lib/tools/render-error-book.ts`, `lib/tools/generate-storyboard-images.ts`, `lib/tools/enforce-video-aspect-ratio.ts`, `lib/tools/extract-pdf-text.ts`, `lib/tools/create-specs.ts` |
| External systems touched    | macOS `say`, ffmpeg, katex CLI, OpenAI API, macOS PDFKit/swift, Alibaba Cloud TTS |
| Batch coordination          | [`../coordination.md`](../coordination.md)                                   |

## Target vs baseline

|                       | Baseline (today) | Target (after this change) |
| --------------------- | ---------------- | --------------------------- |
| Structure / ownership | Python/Shell/Swift 腳本在技能 `scripts/`；通過 spawn 執行 | TypeScript 模組在 `lib/tools/`；通過 handler 函數直接呼叫或 spawn 外部 CLI |

## Boundaries

- Entry surface(s): CLI — `apltk <tool-name> [...args]` → `runTool()` → `handler(args, context)`
- Trust boundary crossed: `None`（內部工具）
- Outside → inside (one line): `User (shell)` → `apltk <tool>` → `handler()` → `外部 CLI (say/ffmpeg/katex/swift)`

## Modules (nouns only)

| Module key | Responsibility (one sentence) | Owned artifacts |
| ---------- | ---------------------------- | --------------- |
| `docs-to-voice` | 文字轉語音，支援 macOS say 和阿里雲 TTS | 音頻檔案、SRT timeline |
| `render-katex` | 通過 KaTeX CLI 渲染 TeX 公式 | HTML/MathML 輸出 |
| `render-error-book` | 將結構化 JSON 渲染為 PDF | PDF 檔案 |
| `generate-storyboard-images` | 通過 OpenAI API 生成 storyboard 圖片 | 圖片檔案 |
| `enforce-video-aspect-ratio` | 通過 ffmpeg 調整影片比例 | 影片檔案 |
| `extract-pdf-text` | 通過 macOS PDFKit 提取 PDF 文字 | 純文字輸出 |
| `create-specs` | 從模板生成 spec 規劃文檔 | Markdown 文件 |

---

## Interaction anchors (`INT-###`)

| ID        | Intent | Caller → Callee | Coupling kind | Information crossing | Failure propagation |
| --------- | ------ | --------------- | ------------- | -------------------- | ------------------- |
| `INT-020` | CLI 調用媒體工具 handler | `tool-runner` → 各工具 handler | sync call `handler(args, context)` | CLI 參數、檔案路徑 | 工具錯誤 → 非零退出碼 |
| `INT-021` | KaTeX 工具調用外部 CLI | `render-katex` → `child_process` | spawn `katex` / `npx katex` | TeX 輸入、輸出格式 | katex CLI 錯誤 → stderr |
| `INT-022` | 語音工具調用 macOS say | `docs-to-voice` → `child_process` | spawn `say` | 文字、語音參數 | say 不可用 → 提示安裝 |
| `INT-023` | 影片工具調用 ffmpeg | `enforce-video-aspect-ratio` → `child_process` | spawn `ffmpeg` | 輸入/輸出路徑、比例 | ffmpeg 不可用 → 提示安裝 |

**Ordering / concurrency (design-level):** 所有工具互相獨立，可任意順序移植

## Requirement linkage (coarse ordering)

- 所有 R 群組互相獨立，無強制順序
- 建議順序：簡單工具先行（create-specs → render-katex → extract-pdf-text），然後複雜工具（docs-to-voice、render-error-book、generate-storyboard-images、enforce-video-aspect-ratio）

## Data & persistence (design-level)

| Resource                      | Typical readers/writers | Consistency expectation |
| ----------------------------- | ----------------------- | ----------------------- |
| 檔案系統（輸入/輸出檔案） | 所有工具 (read/write) | 每次調用獨立；不跨調用共享狀態 |
| 外部 API (OpenAI, Alibaba Cloud) | generate-storyboard-images, docs-to-voice | API call 為 best-effort；無重試 |

## Invariants (system-level)

| Invariant | What breaks it architecturally | Symptoms if violated |
| --------- | ------------------------------ | -------------------- |
| CLI 參數向後兼容 | 修改參數名稱或語義 | 現有工作流中斷 |
| 工具輸出格式不變 | 改變輸出目錄結構或檔案命名 | 下游消費者（SKILL.md 引用）失敗 |

## Tradeoffs inherited by implementation

| Decision | Rejected alternative | Locks in |
| -------- | -------------------- | -------- |
| 保留 spawn 調用外部 CLI（say/ffmpeg/katex/swift） | 使用 Node.js 原生模組替代 | handler 仍需透過 child_process 訪問外部工具 |
| macOS PDFKit 保留 Swift | 使用 Node.js pdf-parse 等 npm 套件 | extract-pdf-text 僅在 macOS 可用 |
| create-specs 模板存為 TypeScript 字串內嵌 | 保留外部模板檔案 | 模板與程式碼耦合 |

## Batch-only

- 共享型別（`ToolDefinition`、`ToolContext`）由 Spec 1 定義
- 舊腳本、shell wrapper 清理由 Spec 4 負責
