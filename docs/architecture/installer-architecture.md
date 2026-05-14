# 安裝器設計原則

## 原子性同步

`syncToolkitHome()` 將倉庫內容同步至 `~/.apollo-toolkit`（或 `$APOLLO_TOOLKIT_HOME`）時，先寫入暫存目錄再原子性地重新命名，避免同步中斷導致目錄處於不一致狀態。僅複製技能目錄（含 `SKILL.md`）、根層級必要文件（`AGENTS.md`、`CHANGELOG.md`、`LICENSE`、`README.md`、`package.json`）與 `codex/` 容器。

## Manifest 追蹤

每個目標目錄寫入 `.apollo-toolkit-manifest.json`，記錄版本、安裝時間、連結模式、目前技能清單與歷史技能清單。解除安裝時依 manifest 移除所有追蹤的技能目錄，包括已不存在的歷史技能，確保無殘留。

## 連結模式分離

支援兩種安裝模式：symlink（符號連結至 `~/.apollo-toolkit`，`git pull` 後自動更新）與 copy（獨立複本，需重新執行安裝程式才更新）。兩種模式的 manifest 格式一致，解除安裝流程與連結模式無關。

## 目標解析抽象化

`getTargetRoots()` 將五種目標平台（codex、openclaw、trae、agents、claude-code）解析為對應檔案系統路徑。OpenClaw 支援多 workspace 掃描，所有平台均可透過環境變數覆蓋路徑。`getUninstallTargetRoots()` 對 OpenClaw 錯誤採寬容處理，避免單一 workspace 缺失阻斷其他目標的清理。
