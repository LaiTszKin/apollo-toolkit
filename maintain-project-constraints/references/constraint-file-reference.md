# 約束文件參考

## 三區塊契約

根目錄 `AGENTS.md` 與 `CLAUDE.md` 的正文只應包含以下三個區塊，且順序固定：

1. `Common Development Commands`
2. `Project Business Goals`
3. `Project Documentation Index`

若專案未明確說明兩者應有差異，這三個區塊的內容應保持一致。

## 撰寫規則

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

## 核對清單

- [ ] 只保留三個規定區塊，且順序正確。
- [ ] 每條命令都能回溯到真實入口。
- [ ] 商業目標沒有退化成功能清單。
- [ ] 文件索引覆蓋所有現存標準化文檔。
- [ ] 已刪除失效路徑、舊命令與額外區塊。
- [ ] 若 `AGENTS.md` 與 `CLAUDE.md` 都存在，已確認它們在預期情況下保持一致。

## 輸出模板

```markdown
# <專案名稱或標題>

## Common Development Commands

- `<command>` - <用途說明>

## Project Business Goals

- <專案存在的原因、服務對象與交付結果>

## Project Documentation Index

- `<path>` - <文件用途說明>
```
