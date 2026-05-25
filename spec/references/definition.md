## 功能模塊

功能模塊是直接面向用戶的功能，如：
- 登陸功能
- 註冊功能
- 邀請碼功能

功能模塊由子模塊的合作、交互實現

功能模塊對應 C4 model 的 **Container** 層級：高階功能邊界，可獨立部署或辨識的系統能力單元。

## 子模塊

子模塊是功能模塊的關鍵組成部分。具體定義依照代碼的實作邊界得出。

子模塊對應 C4 model 的 **Component** 層級：功能內部的實作單元（如 controller、service、repository）。

## C4 模型層級對照

| C4 層級 | 對應概念 | 用途 |
|---------|---------|------|
| System Context | 整體系統 + 外部 actor | 定義系統邊界與外部依賴 |
| Container | 功能模塊（feature） | 高階功能邊界 |
| Component | 子模塊（submodule） | 功能內部的實作單元 |
| Code | function 行 | 函式層級細節（選擇性） |