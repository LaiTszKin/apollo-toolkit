# Tasks: Media Rendering and Spec Generation Tools

- Date: 2026-05-14
- Feature: Media Rendering and Spec Generation Tools

## **Task 1: 移植 create-specs 工具（優先 — 被其他 spec 依賴）**

Purpose: 將 spec 模板生成腳本移植為 TypeScript handler（較簡單，先行）
Requirements: R7.1, R7.2, R7.3
Scope: `lib/tools/create-specs.ts`（新檔案）
Out of scope: 修改模板內容、刪除原始 Python 腳本

- 1. [ ] **`lib/tools/create-specs.ts`** — 實作 `createSpecsHandler()`：解析 feature_name、--change-name、--batch-name、--output-dir、--template-dir、--force 參數
  - Verify: 參數解析與原 Python argparse 一致

- 2. [ ] **`lib/tools/create-specs.ts`** — 實作模板讀取、佔位符替換、檔案生成邏輯；模板從 `generate-spec/references/templates/` 讀取
  - Verify: 生成的 spec 檔案內容與原腳本一致（diff 比對）

- 3. [ ] **`lib/tools/create-specs.ts`** — 實作 --batch-name、--with-coordination、--with-preparation 邏輯
  - Verify: batch 模式下目錄結構和 coordination/preparation 模板正確生成

- 4. [ ] **`lib/tool-runner.ts`** — 更新 `create-specs` 的 TOOL_COMMANDS 定義：新增 `handler: createSpecsHandler`
  - Verify: `apltk create-specs "Test" --change-name test --force` 成功生成模板

## **Task 2: 移植 render-katex 工具**

Purpose: 將 KaTeX 渲染腳本移植為 TypeScript handler
Requirements: R2.1, R2.2
Scope: `lib/tools/render-katex.ts`（新檔案）
Out of scope: 刪除原始腳本和 shell wrapper

- 1. [ ] **`lib/tools/render-katex.ts`** — 實作 `renderKatexHandler()`：解析參數，通過 `child_process` 調用 `npx katex` CLI
  - Verify: 輸出與原 Python 腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `render-katex` 的 TOOL_COMMANDS 定義：新增 `handler: renderKatexHandler`
  - Verify: `apltk render-katex --tex "x^2"` 正確輸出

## **Task 3: 移植 extract-pdf-text 工具**

Purpose: 將 PDF 文字提取腳本（Swift）移植為 TypeScript handler
Requirements: R6.1, R6.2
Scope: `lib/tools/extract-pdf-text.ts`（新檔案）
Out of scope: 刪除原始 Swift 腳本

- 1. [ ] **`lib/tools/extract-pdf-text.ts`** — 實作 `extractPdfTextHandler()`：解析 PDF 路徑參數，通過 `child_process` 調用 `swift` 執行內嵌的 PDFKit 腳本（或使用 macOS `osascript` / `mdls` / `textutil`）
  - Verify: 輸出格式（PDF_PATH、PAGE_COUNT、per-page text）與原 Swift 腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `extract-pdf-text-pdfkit` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: `apltk extract-pdf-text-pdfkit sample.pdf` 正確輸出

## **Task 4: 移植 render-error-book 工具**

Purpose: 將 PDF 錯誤手冊渲染腳本移植為 TypeScript handler
Requirements: R3.1, R3.2
Scope: `lib/tools/render-error-book.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/render-error-book.ts`** — 實作 `renderErrorBookHandler()`：解析 --input、--output 參數，讀取 JSON，調用 PDF 生成邏輯
  - Verify: 輸出 PDF 與原 Python 腳本生成的比對一致（視覺或 metadata）

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `render-error-book` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: handler 可被 CLI 正確呼叫

## **Task 5: 移植 docs-to-voice 工具（最複雜）**

Purpose: 將最大的腳本（1385 行 Python）移植為 TypeScript handler
Requirements: R1.1, R1.2, R1.3, R1.4
Scope: `lib/tools/docs-to-voice.ts`（新檔案）
Out of scope: 刪除原始腳本和 shell wrapper

- 1. [ ] **`lib/tools/docs-to-voice.ts`** — 實作 `docsToVoiceHandler()`：完整解析所有 CLI 參數
  - Verify: 參數解析覆蓋率與原 Python 腳本相同

- 2. [ ] **`lib/tools/docs-to-voice.ts`** — 實作 macOS `say` 模式：通過 spawn `say` 命令生成音頻、計算句子時間線
  - Verify: 輸出音頻檔案和 SRT timeline 與原腳本一致

- 3. [ ] **`lib/tools/docs-to-voice.ts`** — 實作阿里雲 TTS API 模式（可選）：通過 HTTP 請求調用 API
  - Verify: （需要有效 API key）輸出與原腳本一致

- 4. [ ] **`lib/tool-runner.ts`** — 更新 `docs-to-voice` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: handler 可被 CLI 正確呼叫

## **Task 6: 移植 generate-storyboard-images 工具**

Purpose: 將 storyboard 圖片生成腳本移植為 TypeScript handler
Requirements: R4.1, R4.2
Scope: `lib/tools/generate-storyboard-images.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/generate-storyboard-images.ts`** — 實作 `generateStoryboardImagesHandler()`：讀取輸入、調用 OpenAI API、將圖片寫入輸出目錄
  - Verify: 輸出目錄結構和圖片生成行為與原腳本一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `generate-storyboard-images` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: handler 可被 CLI 正確呼叫

## **Task 7: 移植 enforce-video-aspect-ratio 工具**

Purpose: 將影片比例調整腳本移植為 TypeScript handler
Requirements: R5.1, R5.2
Scope: `lib/tools/enforce-video-aspect-ratio.ts`（新檔案）
Out of scope: 刪除原始 Python 腳本

- 1. [ ] **`lib/tools/enforce-video-aspect-ratio.ts`** — 實作 `enforceVideoAspectRatioHandler()`：解析參數，通過 spawn ffmpeg 調整影片比例
  - Verify: 輸出影片與原 Python 腳本生成的一致

- 2. [ ] **`lib/tool-runner.ts`** — 更新 `enforce-video-aspect-ratio` 的 TOOL_COMMANDS 定義：新增 handler
  - Verify: handler 可被 CLI 正確呼叫
