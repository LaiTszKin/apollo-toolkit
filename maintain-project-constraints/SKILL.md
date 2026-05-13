---
name: maintain-project-constraints
description: >-
  依據倉庫現況刷新根目錄 `AGENTS.md` / `CLAUDE.md`，只保留 Common Development Commands、Project Business Goals、Project Documentation Index 三個可追溯區塊。
---

## 技能目標

基於當前倉庫證據，產出或刷新根目錄 `AGENTS.md` 與 `CLAUDE.md`，使其準確反映開發命令、專案商業目標與文件索引，不捏造任何內容。

## 驗收條件

- 最終文件正文只包含三個區塊，順序固定：`Common Development Commands` → `Project Business Goals` → `Project Documentation Index`。
- `Common Development Commands` 中每條命令可追溯到 `package.json`、`Makefile`、`bin/`、`scripts/` 或 CI 設定等真實入口。
- `Project Business Goals` 只描述專案層級目的、服務對象與交付結果，不展開為功能清單。
- `Project Documentation Index` 覆蓋現存 `docs/features/`、`docs/architecture/`、`docs/principles/` 與重要根目錄文件，每項對應真實路徑。
- 過時路徑、虛構命令與多餘區塊已被移除。
- 若 `AGENTS.md` 與 `CLAUDE.md` 同時存在且未聲明故意分歧，兩者三個區塊內容一致。

## 工作流程

1. 從倉庫現況收集可驗證的命令入口、專案目的與現有文件清單，不以舊約束文件作為唯一真相。
2. 根據證據生成三個必需區塊，確保每條命令、商業目標與文件索引可被直接追溯。
3. 按專案慣例更新或補齊 `AGENTS.md` / `CLAUDE.md`，正文限制在三個規定區塊內。
4. 完成前逐項校驗命令來源、文件路徑與雙文件一致性，清除所有陳舊或多餘內容。

## 使用範例

- 「重建 `docs/` 後，請同步刷新 `AGENTS.md` 和 `CLAUDE.md`」→ 根據當前腳本、入口與文件樹重寫兩個根目錄約束文件，只保留三個規定區塊並確保索引完整。
- 「這個專案的 `CLAUDE.md` 已經過時，請補一份對應的 `AGENTS.md`」→ 依據現有命令與文件結構建立缺失文件，讓兩份約束文件在預期一致時保持同構。
- 「請清理根目錄約束文件裡的舊命令與失效路徑」→ 驗證每條命令與索引路徑是否仍成立，只保留能被倉庫證據支持的內容。

## 參考資料索引

- `references/constraint-file-reference.md`：三區塊契約、撰寫規則、核對清單與輸出模板。
