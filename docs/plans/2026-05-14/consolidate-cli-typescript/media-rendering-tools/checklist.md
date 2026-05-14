# Checklist: Media Rendering and Spec Generation Tools

- Date: 2026-05-14
- Feature: Media Rendering and Spec Generation Tools

## Usage Notes

- 媒體工具依賴外部 CLI（say、ffmpeg、katex、swift），測試需檢查環境
- create-specs 工具優先移植，因為它被 generate-spec 技能依賴

## Clarification & Approval Gate

- [ ] Clarification responses recorded (N/A — no clarification questions).
- [ ] Affected plans updated after clarification (N/A).
- [ ] Explicit approval obtained (date/ref: [to be filled]).

## Behavior-to-Test Checklist

- [ ] CL-01: `apltk create-specs "Test" --change-name test --force` 生成正確模板 — R7.1~R7.3 → snapshot test — Result: `NOT RUN`
- [ ] CL-02: `apltk render-katex --tex "x^2"` 輸出正確 — R2.x → `test/tools/render-katex.test.ts` — Result: `NOT RUN`
- [ ] CL-03: `apltk extract-pdf-text-pdfkit sample.pdf` 輸出正確 — R6.x → manual (macOS only) — Result: `NOT RUN`
- [ ] CL-04: `apltk docs-to-voice --input test.txt --project-name test` — R1.x → manual (macOS only) — Result: `NOT RUN`
- [ ] CL-05: `apltk render-error-book --input test.json --output test.pdf` — R3.x → manual — Result: `NOT RUN`
- [ ] CL-06: `apltk generate-storyboard-images` 功能一致 — R4.x → mock API test — Result: `NOT RUN`
- [ ] CL-07: `apltk enforce-video-aspect-ratio` 功能一致 — R5.x → manual (requires ffmpeg) — Result: `NOT RUN`

## Hardening Checklist

- [ ] Regression tests: create-specs snapshot test
- [ ] External services mocked/faked: OpenAI API mock、ffmpeg spawn mock
- [ ] Adversarial cases: 無效 TeX、損壞的 PDF、不存在的輸入檔案
- [ ] Assertions verify outcomes: 比對輸出檔案內容，非僅檢查退出碼

## E2E / Integration Decisions

- [ ] create-specs: Integration test with real template files — Reason: 驗證模板讀取和檔案寫入
- [ ] docs-to-voice: Manual E2E (需要 macOS say 或 TTS API key) — Reason: 外部依賴
- [ ] render-katex: Integration test with real katex CLI — Reason: 驗證渲染輸出
- [ ] generate-storyboard-images: Mock API + 手動 E2E — Reason: API key 敏感

## Execution Summary

- [ ] Unit: `NOT RUN`
- [ ] Regression: `NOT RUN`
- [ ] Property-based: `N/A`
- [ ] Integration: `NOT RUN`
- [ ] E2E: `NOT RUN`
- [ ] Mock scenarios: `NOT RUN`
- [ ] Adversarial: `NOT RUN`

## Completion Records

- [ ] All media tools migrated: pending — Remaining: 全部 tasks
