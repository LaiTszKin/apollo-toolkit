# Checklist: [Feature Name]

- **Date**: [YYYY-MM-DD]
- **Feature**: [Feature Name]
- **Source SPEC**: [SPEC.md 路徑]

> **Purpose:** 驗證策略——定義如何確認實作滿足了 SPEC.md 的業務需求。使用 `test-case-strategy` 為測試層級選擇與 oracle 設計提供依據。

---

## Usage Notes

- Add/remove items based on actual scope; keep only applicable items.
- Use `test-case-strategy` for test level selection, oracle design, and drift-check planning.
- Property-based coverage required for business-logic changes unless `N/A` with reason.
- Test result values: `PASS / FAIL / BLOCKED / NOT RUN / N/A`.

---

## Behavior-to-Test Checklist

對照 SPEC.md 中的每個 BDD 需求：

| ID | 可觀察行為 | SPEC 需求 | 對應測試 | 結果 |
|---|---|---|---|---|
| CL-01 | [行為描述] | R?.? | [Test IDs] | `[status]` |
| CL-02 | [行為描述] | R?.? | [Test IDs] | `[status]` |

---

## Hardening Checklist

- [ ] 回歸測試 for bug-prone/high-risk behavior (or `N/A` + reason)
- [ ] Unit drift checks for non-trivial tasks (or `N/A` + reason)
- [ ] Property-based coverage for business logic (or `N/A` + reason)
- [ ] 外部服務 mocked/faked (or `N/A` + reason)
- [ ] Adversarial cases for abuse paths (or `N/A` + reason)
- [ ] 授權、冪等性、並行風險已評估 (or `N/A` + reason)
- [ ] Assertions verify outcomes/side-effects, not just "returns 200"
- [ ] Fixtures reproducible (fixed seed/clock) (or `N/A` + reason)

---

## E2E / Integration Decisions

| Flow/Risk | 測試層級 | 理由 |
|---|---|---|
| [Flow 描述] | [E2E / Integration replacement / Existing coverage / N/A] | [why] |

---

## Execution Summary

| 測試類型 | 狀態 |
|---|---|
| Unit | `[status]` |
| Regression | `[status]` |
| Property-based | `[status]` |
| Integration | `[status]` |
| E2E | `[status]` |
| Mock scenarios | `[status]` |
| Adversarial | `[status]` |

---

## Completion Records

| Flow/Group | 狀態 | 剩餘 |
|---|---|---|
| [Flow/Group] | [completed / partial / blocked / deferred] | [None / list] |
