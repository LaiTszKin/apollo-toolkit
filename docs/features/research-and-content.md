# 研究與內容生成

## 深度研究

- **Given** 使用者需要特定主題的結構化研究報告
- **When** 使用 `deep-research-topics` 技能
- **Then** 產生具備引用來源、分析與限制說明的證據本位 PDF 報告

- **Given** 使用者需要特定格式的輸出
- **When** 明確要求 Word 或簡報格式
- **Then** 輸出對應格式，但預設維持 PDF

- **Given** 使用者需要結合網路搜尋的研究
- **When** 使用 `answering-questions-with-research` 技能
- **Then** 從倉庫內文件出發，必要時補充網路搜尋結果

## 金融研究

- **Given** 使用者需要分析最新完成的市場週
- **When** 使用 `financial-research` 技能
- **Then** 產出可交易標的的 PDF watchlist，含證據分析

- **Given** 使用者有一份已標記的週報 PDF
- **When** 使用 `weekly-financial-event-report` 技能
- **Then** 轉換為精簡的證據本位金融事件報告

## API 研究

- **Given** 使用者需要逆向分析 LLM API 行為
- **When** 使用 `shadow-api-model-research` 技能
- **Then** 捕捉真實請求形狀、重放流量、透過黑箱指紋辨識推測底層模型

## 語音與音訊生成

- **Given** 使用者有文字或文件需要轉換為語音
- **When** 使用 `docs-to-voice` 技能
- **Then** 產生有字幕時間軸的音訊檔案與 SRT 字幕

## 影片生成

- **Given** 使用者需要從文字提示產生短影片
- **When** 使用 `text-to-short-video` 技能
- **Then** 產生 30-60 秒的短片

- **Given** 使用者需要從小說或文字內容產生循環短影片
- **When** 使用 `novel-to-short-video` 技能
- **Then** 產生包含生成素材的循環式短影片

- **Given** 使用者需要長片製作
- **When** 使用 `video-production` 技能
- **Then** 依 storyboard、語音、Remotion 渲染的流程產出長片

## 故事板圖片生成

- **Given** 使用者有章節、劇本或場景描述
- **When** 使用 `openai-text-to-image-storyboard` 技能
- **Then** 產生對應的故事板圖片集

## PDF 教材與測驗

- **Given** 使用者有講義 slides、歷屆試題與解答本
- **When** 使用 `exam-pdf-workflow` 技能
- **Then** 產生模擬考試、詳解、學習筆記或含 KaTeX 數學公式的評分 PDF

- **Given** 使用者有結構化的錯誤題庫 JSON
- **When** 使用 `learning-error-book` 技能
- **Then** 產出選擇題與申論題分離的錯誤本 PDF

- **Given** 使用者需要渲染數學公式
- **When** 使用 `katex` 技能
- **Then** 將 TeX 公式轉換為可直接嵌入的 KaTeX 輸出

## 文件視覺辨識

- **Given** 使用者需要從文件圖片或掃描檔讀取內容
- **When** 使用 `document-vision-reader` 技能
- **Then** 透過視覺辨識提取文件中的文字與結構
