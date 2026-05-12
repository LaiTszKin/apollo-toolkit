---
name: discover-security-issues
description: >-
  面向選定範圍的只讀安全審查技能。先界定信任邊界，再依 `agent-system`、`financial-program`、`software-system` 或 `combined` 攻擊目錄執行可重現的對抗性驗證，要求以 payload、請求形狀、命令或運行結果配合 `path:line` 證據支撐結論；不允許修改代碼、提交 PR 或直接修復漏洞。
---

## 目標
輸出一份只讀的安全審查報告，僅保留可重現、可利用、可定位的安全問題。報告需要包含攻擊前提、攻擊步驟、觀察到的不安全行為、`path:line` 證據、嚴重度排序、建議性加固方向與剩餘風險；本技能不負責修補漏洞。

## 驗收條件
- 審查開始前已明確定義範圍：所選模組目錄、信任邊界、不可信輸入、受保護資產、特權操作與必須成立的安全不變式。
- 每個已確認問題都包含 payload 或請求形狀、前置條件、實際觀察到的不安全行為，以及精確的 `path:line` 證據。
- 每個已確認漏洞都在同一路徑下成功重現至少兩次；對高風險熱點還要補做相鄰變體驗證。無法穩定重現者只能作為假設或剩餘風險。
- 問題排序基於影響、可利用性與波及範圍，並對資金流、權限提升、跨租戶資料暴露與破壞性操作給予更高權重。
- 最終交付物是按嚴重度排序的安全報告，只包含已確認發現、攻擊證據、風險解釋、建議性加固方向與剩餘風險。
- 全流程保持只讀：不得修改代碼、補丁、測試、PR 或直接執行修復工作流。

## 工作流程
1. 先定義安全審查範圍。
   - 根據目標選擇 `agent-system`、`financial-program`、`software-system` 或 `combined`。
   - 列出所有不可信輸入、受保護資產、特權操作與關鍵安全不變式。
   - 在挑選攻擊場景前，先打開對應參考資料，不依賴記憶臆測。
2. 選擇合適的攻擊目錄。
   - `agent-system`：聚焦提示注入、間接注入、工具濫用、記憶污染、資料外洩與 agent handoff 攻擊。
   - `financial-program`：聚焦授權繞過、重放、競態、精度、生命週期、外部依賴與資金流濫用。
   - `software-system`：聚焦注入、XSS、CSRF、SSRF、路徑穿越、檔案上傳、Session/Token、存取控制與配置錯誤。
   - `combined`：合併多個目錄，驗證跨邊界的真實攻擊鏈。
3. 執行可確定的攻擊驗證。
   - 對每條候選路徑記錄 payload、前置條件、入口點、可觀察結果與能解釋結果的代碼路徑。
   - 只保留有證據支撐的候選；「看起來像漏洞」不能直接進報告。
4. 確認或降級。
   - 對每個候選問題做同路徑二次重現。
   - 對 parser 邊界、授權檢查、查詢構造、命令執行、資金流與 prompt/tool 路由等熱點補做相鄰變體。
   - 若第二次重現失敗或證據鏈不足，將其降級為假設或剩餘風險。
5. 按嚴重度排序並只輸出報告。
   - 依影響、可利用性與波及範圍從高到低排序。
   - 交付內容只包含已確認問題、攻擊證據、排序理由、建議性加固方向與剩餘風險。
   - 若使用者要求修復，先完成本技能報告，再交由實作型技能處理。

## 使用範例
- 「審查這個 Web API 是否有 SQLi、IDOR、SSRF 和 token 問題」-> 選擇 `software-system`，圍繞輸入邊界、查詢構造與授權控制執行可重現驗證。
- 「審查這個帶 retrieval、memory 和 tool call 的 agent」-> 選擇 `agent-system`，聚焦提示注入、間接注入、工具濫用、資料外洩與記憶污染。
- 「審查結算、清算或餘額流程是否能被 replay、race 或 precision abuse 利用」-> 選擇 `financial-program`，優先驗證資金守恆、生命週期原子性與精度邊界。
- 「幫我看 prompt injection 能不能一路打到特權 API」-> 選擇 `combined`，設計跨 agent 與後端邊界的真實攻擊鏈。
- 「這裡可能有 SQLi，但我只有模糊直覺」-> 若沒有二次重現與精確參數路徑，只能在報告中標記為假設，不能算作已確認漏洞。

## 參考資料索引
- `references/agent-attack-catalog.md`：AI agent 安全攻擊目錄，涵蓋直接/間接注入、工具濫用、記憶污染、資料外洩與 handoff 攻擊。
- `references/security-test-patterns-agent.md`：AI agent 安全測試模式，用於描述驗證思路與後續補強方向。
- `references/red-team-extreme-scenarios.md`：金融與高風險系統的極端攻擊場景，聚焦重放、競態、生命週期、預言機與安全開關濫用。
- `references/risk-checklist.md`：金融系統風險檢查清單與嚴重度規則，涵蓋授權、資金完整性、依賴風險與運維控制。
- `references/security-test-patterns-finance.md`：金融系統安全測試模式，涵蓋 replay、授權、精度、陳舊資料與狀態機失敗。
- `references/common-software-attack-catalog.md`：通用軟體與 Web/API 攻擊目錄，涵蓋主流注入、瀏覽器端與存取控制問題。
- `references/test-snippets.md`：可重現 payload 與測試模板範例，用於補充報告中的攻擊形狀與驗證描述。
