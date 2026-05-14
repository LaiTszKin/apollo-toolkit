# Spec: Media Rendering and Spec Generation Tools

- Date: 2026-05-14
- Feature: Media Rendering and Spec Generation Tools
- Owner: [To be filled]

## Goal

將媒體/渲染相關工具（docs-to-voice、render-katex、render-error-book、generate-storyboard-images、enforce-video-aspect-ratio、extract-pdf-text）和 spec 生成工具（create-specs）從 Python/Swift/Shell 腳本移植為 TypeScript handler。

## Scope

### In Scope
- `docs-to-voice/scripts/docs_to_voice.py` → `lib/tools/docs-to-voice.ts`（最複雜的移植，1385 行）
- `katex/scripts/render_katex.py` → `lib/tools/render-katex.ts`
- `learning-error-book/scripts/render_error_book_json_to_pdf.py` → `lib/tools/render-error-book.ts`
- `openai-text-to-image-storyboard/scripts/generate_storyboard_images.py` → `lib/tools/generate-storyboard-images.ts`
- `text-to-short-video/scripts/enforce_video_aspect_ratio.py` → `lib/tools/enforce-video-aspect-ratio.ts`
- `weekly-financial-event-report/scripts/extract_pdf_text_pdfkit.swift` → `lib/tools/extract-pdf-text.ts`
- `generate-spec/scripts/create-specs`（Python）→ `lib/tools/create-specs.ts`
- 移除 shell wrapper（`docs_to_voice.sh`、`render_katex.sh`）
- 在 `lib/tool-runner.ts` 的 TOOL_COMMANDS 中為每個移植工具新增 `handler` 欄位

### Out of Scope
- 修改工具 CLI 參數或行為（純移植）
- 刪除原始腳本（由 Spec 4 負責）
- 刪除技能中的 `scripts/` 目錄（由 Spec 4 負責）
- 更新 SKILL.md（由 Spec 4 負責）
- 新增功能或改善錯誤處理

## Functional Behaviors (BDD)

### Requirement 1: 文字轉語音工具（docs-to-voice）
**GIVEN** 使用者有一個文字檔案或 Markdown 檔案
**WHEN** 使用者執行 `apltk docs-to-voice --input notes.md --project-name lecture-01`
**THEN** 生成音頻檔案（通過 macOS `say` 或 Alibaba Cloud TTS API）
**AND** 生成 SRT 字幕時間線
**AND** 行為與原 Python 腳本完全一致

**Requirements**:
- [ ] R1.1 handler 正確解析所有 CLI 參數（--input、--project-name、--engine、--voice 等）
- [ ] R1.2 macOS `say` 模式正確生成音頻
- [ ] R1.3 SRT timeline 生成邏輯與原腳本一致
- [ ] R1.4 Alibaba Cloud TTS API 模式（可選）行為一致

### Requirement 2: KaTeX 渲染工具（render-katex）
**GIVEN** 使用者提供 TeX 公式
**WHEN** 使用者執行 `apltk render-katex --tex "\\int_0^1 x^2 dx"`
**THEN** 輸出渲染後的 KaTeX HTML/MathML
**AND** 行為與原 Python 腳本一致

**Requirements**:
- [ ] R2.1 handler 正確解析 --tex、--format 等參數
- [ ] R2.2 KaTeX 渲染輸出與原腳本一致

### Requirement 3: 錯誤手冊 PDF 渲染工具（render-error-book）
**GIVEN** 使用者有結構化的 error-book JSON
**WHEN** 使用者執行 `apltk render-error-book --input mistakes.json --output mistakes.pdf`
**THEN** 生成格式化的 PDF 檔案
**AND** 行為與原 Python 腳本一致

**Requirements**:
- [ ] R3.1 handler 正確解析 --input、--output 參數
- [ ] R3.2 PDF 生成邏輯與原腳本一致

### Requirement 4: Storyboard 圖片生成工具（generate-storyboard-images）
**GIVEN** 使用者提供文字內容和專案名稱
**WHEN** 使用者執行 `apltk generate-storyboard-images --input chapter.txt --project-name teaser`
**THEN** 生成 storyboard 圖片集到輸出目錄
**AND** 行為與原 Python 腳本一致

**Requirements**:
- [ ] R4.1 handler 正確解析參數，呼叫 OpenAI-compatible API 生成圖片
- [ ] R4.2 輸出目錄結構與原腳本一致

### Requirement 5: 影片比例強制工具（enforce-video-aspect-ratio）
**GIVEN** 使用者有一個影片檔案
**WHEN** 使用者執行 `apltk enforce-video-aspect-ratio --input clip.mp4 --output clip-vertical.mp4 --aspect 9:16`
**THEN** 輸出符合目標比例的影片檔案
**AND** 行為與原 Python 腳本一致

**Requirements**:
- [ ] R5.1 handler 正確解析 --input、--output、--aspect 參數
- [ ] R5.2 ffmpeg 調用邏輯與原腳本一致

### Requirement 6: PDF 文字提取工具（extract-pdf-text）
**GIVEN** 使用者有一個 PDF 檔案（macOS 環境）
**WHEN** 使用者執行 `apltk extract-pdf-text-pdfkit /path/to/source.pdf`
**THEN** 輸出 PDF 每頁的文字內容
**AND** 行為與原 Swift 腳本一致

**Requirements**:
- [ ] R6.1 handler 使用 macOS PDFKit（通過 swift 或替代方案）提取文字
- [ ] R6.2 輸出格式（PDF_PATH、PAGE_COUNT、per-page text）與原腳本一致

### Requirement 7: Spec 模板生成工具（create-specs）
**GIVEN** 使用者指定功能名稱
**WHEN** 使用者執行 `apltk create-specs "Feature Name" --change-name feature-name`
**THEN** 在 `docs/plans/<date>/feature-name/` 下生成完整的 spec 模板
**AND** 支持 --batch-name、--with-coordination、--with-preparation 等選項
**AND** 行為與原 Python 腳本一致

**Requirements**:
- [ ] R7.1 handler 正確生成所有模板檔案（spec、tasks、checklist、contract、design）
- [ ] R7.2 模板內容的佔位符替換與原腳本一致
- [ ] R7.3 --batch-name 模式正確創建 coordination.md 和 preparation.md

## Error and Edge Cases
- [ ] 依賴的工具（say、ffmpeg、swift、katex CLI）未安裝時顯示清晰錯誤訊息
- [ ] TTS API 不可用時優雅降級
- [ ] 無效的輸入檔案路徑時顯示錯誤
- [ ] 空的文字輸入時產生合理的輸出
- [ ] PDF 檔案損壞時正確報錯

## Clarification Questions
None

## References
- Official docs:
  - [KaTeX CLI Documentation](https://katex.org/docs/cli.html)
  - [macOS `say` command](https://ss64.com/mac/say.html)
- Related code files:
  - `docs-to-voice/scripts/docs_to_voice.py` (1385 行)
  - `katex/scripts/render_katex.py` (247 行)
  - `learning-error-book/scripts/render_error_book_json_to_pdf.py` (590 行)
  - `openai-text-to-image-storyboard/scripts/generate_storyboard_images.py` (763 行)
  - `text-to-short-video/scripts/enforce_video_aspect_ratio.py` (350 行)
  - `weekly-financial-event-report/scripts/extract_pdf_text_pdfkit.swift` (89 行)
  - `generate-spec/scripts/create-specs` (Python, 216 行)
  - `lib/tool-runner.ts`（更新 TOOL_COMMANDS）
