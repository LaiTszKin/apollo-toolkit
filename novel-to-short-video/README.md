# novel-to-short-video

把小說內容自動轉成 50–60 秒、可循環播放的短影音之 Codex Skill。

此 Skill 會：

- 從小說中挑出最精彩、最有張力的 1 段核心情節
- 確保該段能自成一個完整迷你故事（看單支也看得懂）
- 同時在結尾留下關鍵懸念，讓觀眾意猶未盡
- 先依 `references/plan-template.md` 產出前置規劃文件（`docs/plans/<日期>-<章節>.md`）
- 取得使用者同意 plan 後才開始圖片/配音/渲染
- 產生首尾閉環（開頭與結尾呼應）的短影音旁白腳本
- 若不存在 `<project_dir>/roles/roles.json`，先建立後再進入 prompt 流程；若已存在則先重用既有角色，缺少角色才新增（格式見 `references/roles-json.md`）
- 呼叫文生圖生成場景圖
- 呼叫配音工具生成旁白與字幕
- 生成旁白時強制校準語速到每秒 3-4 字，符合短影音節奏預期
- 用 Remotion 組裝與輸出影片，套用分段節奏特效維持觀眾注意力，並保留可調整的 Remotion 專案

## 依賴 Skills

- `openai-text-to-image-storyboard`
- `docs-to-voice`
- `remotion-best-practices`

## 專案結構

```text
novel-to-short-video/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── plan-template.md
│   └── roles-json.md
├── README.md
└── LICENSE
```

## 使用方式

1. 把此資料夾放在 Codex skills 目錄下。
2. 於對話中使用 `$novel-to-short-video` 觸發。
3. 提供 `project_dir`、`content_name` 與小說內容。
4. Skill 會先在 `docs/plans/` 生成計劃 Markdown，並等待你同意。
5. 取得你同意後，才會依流程輸出圖片、配音、字幕與短影音。

## 輸出重點

- 每支短影音長度維持在 **50–60 秒**
- 旁白語速需落在 **3–4 字/秒**（以字數 ÷ 音檔秒數驗證）
- 固定提取 **1 段最精彩核心情節**
- 單一情節覆蓋整支影片（segment-to-video 1:1）
- 內容需自成故事（起承衝結果清楚）但結尾保留一個未解問題
- 先落地規劃文件：`<project_dir>/docs/plans/<YYYY-MM-DD>-<chapter_slug>.md`
- 規劃文件以 `references/plan-template.md` 為模板，且填寫後需移除 placeholder
- 角色骨架檔：`<project_dir>/roles/roles.json`（短影音與長影音共用角色、重用既有角色、僅補缺；格式見 `references/roles-json.md`）
- 結尾語句與畫面回扣開頭，形成閉環
- 依 beat 規劃加入特效（hook / 升壓 / 高潮 / 回環），並控制特效強度避免干擾字幕與敘事
- Remotion 專案預設保留，便於後續手動調整

## License

本專案採用 [MIT License](./LICENSE)。
