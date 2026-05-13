# 平台自動化

## GitHub Issue 操作

- **Given** 使用者需要在遠端倉庫搜尋 issues
- **When** 使用 `read-github-issue` 技能的 `find-github-issues` 工具
- **Then** 列出符合條件的 issues 供後續檢視

- **Given** 使用者知道 issue 編號
- **When** 使用 `read-github-issue` 技能
- **Then** 顯示 issue 完整內容與討論串

- **Given** 使用者需要建立結構化的 issue
- **When** 使用 `open-github-issue` 技能
- **Then** 發佈至 GitHub，附帶 JSON payload 與 auth fallback 機制

- **Given** 使用者需要從頭到尾處理一個 issue
- **When** 使用 `ship-github-issue-fix` 技能
- **Then** 分析問題、實作修復並推送至指定分支，不開 PR

## GitHub Pull Request 操作

- **Given** 使用者有已就緒的變更需要開 PR
- **When** 使用 `open-source-pr-workflow` 技能
- **Then** 建立 pull request 並填寫標準化的 PR 描述

- **Given** PR 上有審查意見 threads
- **When** 使用 `resolve-review-comments` 技能
- **Then** 列出未解決 threads 或在處理後標記為已解決

## OpenClaw 配置

- **Given** 使用者需要配置 OpenClaw 環境
- **When** 使用 `openclaw-configuration` 技能
- **Then** 依官方文件設定 `~/.openclaw/openclaw.json`、skills 載入、SecretRefs 與 CLI 配置，並可驗證或修復現有設定

## 區塊鏈開發

### Solana

- **Given** 使用者需要開發 Solana 程式
- **When** 使用 `solana-development` 技能
- **Then** 依官方開發流程建立 Rust 客戶端與 Solana 程式

### Jupiter

- **Given** 使用者需要整合 Jupiter DeFi 協議
- **When** 使用 `jupiter-development` 技能
- **Then** 依官方 SDK、CLI 與 API 文件開發 swap、token、price、lending、trigger、recurring 與 portfolio 功能

### Marginfi

- **Given** 使用者需要建置或審查 Marginfi 整合
- **When** 使用 `marginfi-development` 技能
- **Then** 依官方 SDK、CLI、協議與 The Arena 文件進行開發
