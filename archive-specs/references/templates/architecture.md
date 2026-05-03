# <模組／層名稱> 設計原則

[One-sentence summary of this module's role in the system.]

## <原則標題>

<原則描述：這條原則規範什麼、為什麼這樣設計、適用範圍>

## <原則標題>

<原則描述>

---

## Writing Rules

- State design principles, not implementation details.
- Keep each principle macro-level so it survives minor code changes.
- Focus on: module responsibilities, boundary rules, data flow direction, and integration contracts.
- Each file covers one module or architectural layer.
- Before writing a principle, ask: "Would a refactor that renames files or extracts a helper violate this principle?" If yes, the principle is too specific.
