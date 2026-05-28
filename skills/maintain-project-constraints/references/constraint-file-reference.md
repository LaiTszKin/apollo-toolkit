# 約束文件參考

## CLAUDE.md 與 AGENTS.md 的角色區分

| 面向 | AGENTS.md | CLAUDE.md |
|------|-----------|-----------|
| 目標 agent | Codex 等非 Claude agent | Claude Code |
| 語言風格 | agent 中立，無平台特定語法 | 可使用 Claude Code 特有語法 |
| 內容範圍 | 架構概覽、建構指令、通用慣例、prohibitions | 同 AGENTS.md + Claude Code 特有設定 |
| Claude 特有內容（hooks、scheduled tasks、cowork、MCP） | 不應包含 | 可以包含 |
| 優先原則 | 與任何 coding agent 相容 | 專為 Claude Code 最佳化 |

若專案同時使用兩種 agent，建議維護兩份檔案：
- `AGENTS.md` 作為 baseline 提供通用規則
- `CLAUDE.md` 在 baseline 之上疊加 Claude 特有設定

若專案只使用 Claude Code，仍建議從 AGENTS.md 開始再增強 CLAUDE.md。

## 三區塊契約

根目錄 `AGENTS.md` 與 `CLAUDE.md` 的正文只應包含以下三個區塊，且順序固定：

1. `Common Development Commands`
2. `Project Business Goals`
3. `Project Documentation Index`

CLAUDE.md 可在這三個區塊之後額外加入 Claude Code 特有設定區塊。

## 撰寫規則

### 行數限制

兩份檔案皆應維持在 **100 行以內**。超過時優先精煉內容而非擴充篇幅。

### `Common Development Commands`

- 只收錄能被當前倉庫驗證的命令。
- 優先從 `package.json`、`Makefile`、`bin/`、`scripts/`、CI 設定或其他真實入口提取。
- 每條命令附上一句簡短用途說明，避免捏造不存在的工作流。

### `Project Business Goals`

- 只描述專案層級的目的、服務對象與最終價值。
- 保持宏觀，不展開成細碎功能列表。
- 若存在產品說明文件，僅在能被當前倉庫內容支撐時採納。

### `Project Documentation Index`

- 覆蓋現存 `docs/features/`、`docs/architecture/`、`docs/principles/` 下的所有文件。
- 補充重要且實際存在的根目錄文件，例如 `README.md`、`CONTRIBUTING.md`、`SECURITY.md`。
- 每個條目都應包含檔案路徑與一句用途說明。
- 若專案中不存在標準化文檔目錄，列出實際存在的關鍵文件即可。

### Prohibitions 區塊

從以下來源萃取消禁止事項：
- git log 中反覆出現的 revert / fix 記錄
- 過去 issues 中提及的不可行方案
- CI 配置中明確禁止的操作（如禁止套件升級、禁止特定環境變數）
- 專案既有文檔中標註的技術限制

每條 prohibition 應簡潔明確，例如：

```
- 禁止自動建立資料庫 migrations
- 禁止更新 major 版本套件而未經審查
- 禁止提交 .env 檔案
```

## 核對清單

- [ ] 只保留三個規定區塊，且順序正確。
- [ ] AGENTS.md 與 CLAUDE.md 已按角色區分原則撰寫。
- [ ] 每條命令都能回溯到真實入口。
- [ ] 商業目標沒有退化成功能清單。
- [ ] 文件索引覆蓋所有現存標準化文檔。
- [ ] 已萃取 prohibitions 並納入對應區塊。
- [ ] 檔案未超過 100 行限制。
- [ ] 已刪除失效路徑、舊命令與額外區塊。
- [ ] 若 `AGENTS.md` 與 `CLAUDE.md` 都存在，已確認它們在預期情況下保持一致。
