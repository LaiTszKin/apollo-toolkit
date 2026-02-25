# docs-to-voice

將文字轉成語音檔，並固定輸出到：

`project_dir/audio/{project_name}/`

每次輸出除了音檔，也會在同一資料夾內建立：

- `{audio_name_without_extension}.timeline.json`：每句字幕的起訖時間（秒與毫秒）
- `{audio_name_without_extension}.srt`：可直接用於字幕軌

支援雙模式：

- `say`：macOS 內建 `say`
- `api`：阿里雲百鍊（Model Studio）TTS API（可用 `qwen3-tts`）

## 功能

- 支援 `--text` 與 `--input-file`
- 支援 `--mode say|api`
- 支援 `.env` 設定 API Key 與模型/音色
- 支援 `--output-name` 固定輸出檔名
- `say` 模式預設啟用標點停頓增強（可用 `--no-auto-prosody` 關閉）
- `api` 模式會逐句送出 TTS 請求，並自動合併為單一音檔
- `api` 模式會先自動取得模型最大輸入長度；句子過長時再依上限切段
- 可用 `--max-chars`（或 `.env`）手動覆蓋分段上限
- 可用 `--speech-rate`（或 `.env`）做後處理語速調整（依賴 `ffmpeg`）
- API 逐句時間軸優先採用每句實際音訊長度，字幕更精準
- 自動輸出逐句時間軸（`.timeline.json` + `.srt`）

## 需求

- `say` 模式：macOS + `say` + `python3`
- `api` 模式：`python3` + 百鍊 API Key
- 長文分段合併：建議安裝 `ffmpeg`（特別是輸出 AIFF 時）

## 快速開始

### 1) say 模式

```bash
python3 scripts/docs_to_voice.py \
  --project-dir "/path/to/project" \
  --mode say \
  --text "你好，這是一段測試語音。"
```

### 2) api 模式（Model Studio）

```bash
python3 scripts/docs_to_voice.py \
  --project-dir "/path/to/project" \
  --mode api \
  --text "你好，這是 qwen3-tts 測試。"
```

> 相容性：`scripts/docs_to_voice.sh` 仍可使用，會自動轉呼叫 Python 腳本。

## `.env` 設定

1. 複製範本

```bash
cp .env.example .env
```

2. 設定模式與 API 參數（示例）

```env
DOCS_TO_VOICE_MODE="api"
DASHSCOPE_API_KEY="sk-xxx"
DOCS_TO_VOICE_API_ENDPOINT="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
DOCS_TO_VOICE_API_MODEL="qwen3-tts"
DOCS_TO_VOICE_API_VOICE="Cherry"
DOCS_TO_VOICE_MAX_CHARS=""
DOCS_TO_VOICE_SPEECH_RATE=""
```

> `--mode`、`--api-model`、`--api-voice`、`--api-endpoint`、`--speech-rate` 會覆蓋 `.env`；若未提供 CLI 參數，會先讀 `.env`，再退回同名 shell 環境變數。

## 參數

```text
--project-dir DIR         必填，專案根目錄
--text TEXT              與 --input-file 二選一
--input-file FILE        與 --text 二選一
--project-name NAME      可選，預設為 project_dir 的資料夾名
--output-name NAME       可選，預設 voice-YYYYmmdd-HHMMSS + 模式副檔名
--env-file FILE          可選，預設 skill 資料夾/.env
--mode MODE              可選，say 或 api
--voice NAME             say 模式可選
--rate N                 say 模式可選
--speech-rate N          可選，語速倍率（>0；1.2=加快、0.8=放慢；需 ffmpeg）
--api-endpoint URL       api 模式可選（Model Studio endpoint）
--api-model NAME         api 模式可選
--api-voice NAME         api 模式可選
--max-chars N            可選，手動指定分段上限（未提供時 api 模式自動抓模型上限；0 表示不分段）
--no-auto-prosody        say 模式可選，關閉標點停頓增強
--force                  可選，覆蓋同名檔案
```

## 長文建議

- API 模式預設逐句請求 TTS，句子超過模型上限時才會切段
- 若你已知合適上限，可手動設定 `--max-chars`（或 `.env` 的 `DOCS_TO_VOICE_MAX_CHARS`）
- `qwen3-tts` 系列常見規則為「中文字 2 單位、其餘字元 1 單位」，腳本已依此規則分段

## 備註：關於 endpoint

若你要「直接接入 Model Studio 的 qwen3-tts」，建議用：

`https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`

`https://dashscope-intl.aliyuncs.com/compatible-mode/v1` 是 OpenAI 相容模式 base URL，通常用於相容介面（例如 chat/completions），不是這個腳本預設採用的直接 Model Studio TTS endpoint。

## 授權

MIT License（見 `LICENSE`）
