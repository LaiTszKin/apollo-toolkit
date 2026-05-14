# Contract: Media Rendering and Spec Generation Tools

- Date: 2026-05-14
- Feature: Media Rendering and Spec Generation Tools
- Change Name: media-rendering-tools

> **Purpose:** External-dependency context for `tasks.md`.

## Scope

- **External deps in this doc:** 5

## Dependencies

### KaTeX CLI

#### Evidence

| Primary docs URL(s)             | Sections / anchors used |
| ------------------------------- | ----------------------- |
| https://katex.org/docs/cli.html | CLI usage, options |

**Version revision assumed:** Not fixed（通過 `npx katex` 使用）

#### Facts we rely on

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| `npx katex` 可接受 TeX 輸入並輸出 HTML | https://katex.org/docs/cli.html |

#### Limits & failures

| Category | Doc fact | Meaning |
| -------- | --------- | ------- |
| Errors | 無效 TeX 語法時 katex 回報錯誤 | handler 須將 stderr 傳遞給使用者 |

### macOS `say` command

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| `say -v <voice> -o <output.aiff> <text>` | macOS man page |

**Limits:** macOS 專有；非 macOS 環境不可用

### ffmpeg

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| `ffmpeg -i input -vf "scale=...:force_original_aspect_ratio=..." output` | https://ffmpeg.org/documentation.html |

**Limits:** 系統需安裝 ffmpeg

### OpenAI API

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| Image generation endpoint | https://platform.openai.com/docs/guides/images |

**Auth:** API key 通過環境變數或 .env 檔案提供

### macOS PDFKit (Swift)

| Fact / capability needed | Doc location |
| ------------------------ | ------------ |
| PDFKit PDFDocument 可提取頁面文字 | https://developer.apple.com/documentation/pdfkit |

**Limits:** macOS 專有

#### Integration anchors (`EXT-###`)

| ID        | What we integrate at this boundary | Non‑negotiables | Forbidden assumptions |
| --------- | ---------------------------------- | --------------- | --------------------- |
| `EXT-020` | KaTeX CLI (`npx katex`) | 通過 `child_process.spawn` 調用，不假設全域安裝 | 不可硬編碼路徑 |
| `EXT-021` | macOS `say` | 僅在 macOS 上可用 | 不可假設 Linux/Windows 支援 |
| `EXT-022` | ffmpeg CLI | 必須檢查 ffmpeg 是否存在 | 不可假設已安裝 |
| `EXT-023` | OpenAI API (HTTPS) | API key 從環境變數讀取 | 不可硬編碼 API key |
| `EXT-024` | Swift PDFKit | 僅在 macOS 上可用 | 不可假設跨平台 |

#### Trace hooks

- Spec IDs covered: R1.x, R2.x, R4.x, R5.x, R6.x
- Related `design.md` module keys / `INT-###`: `INT-021` ~ `INT-023`
- **Unknown / `TBD`:** `None`
