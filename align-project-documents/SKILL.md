---
name: align-project-documents
description: Read the entire codebase, then generate standardized project documentation under docs/features/, docs/architecture/, and docs/principles/ from code evidence. Remove old documentation that does not conform to the template structure, then refresh AGENTS.md/CLAUDE.md via maintain-project-constraints.
---

# Align Project Documents

## Dependencies

- Required: `maintain-project-constraints` to refresh `AGENTS.md/CLAUDE.md` after documentation changes.
- Conditional: none.
- Optional: none.
- Fallback: not applicable.

## Standards

- Evidence: Treat source code, configuration, scripts, and tests as the sole source of truth.
- Execution: Read the entire codebase before writing any documentation; ground every claim in concrete file paths.
- Quality: Remove outdated documentation that does not conform to the template structure; never leave mixed documentation formats in place.
- Output: Produce standardized, maintainable documentation organized into three categories: features, architecture, and principles.

## Goal

Generate a complete, code-grounded project documentation set under `docs/` that describes what the system does from a user perspective (features), how it is designed (architecture), and what conventions govern its code (principles).

## Target Documentation Structure

```
docs/
├── features/       — BDD-described user-facing capabilities, categorized by functional area
├── architecture/   — macro-level design principles, organized by module or layer
└── principles/     — code style, naming conventions, dependency management, and development constraints
```

### docs/features/

- Describe what the system does from a user's perspective.
- Never reference specific code paths, file names, or implementation details.
- Use BDD (Behavior-Driven Development) phrasing: "Given ... When ... Then ...".
- Group features by functional category; each category gets its own markdown file.
- File titles must clearly convey which functional area or module they cover.

Example feature description:

```markdown
# 用戶認證與授權

## 登入

- **Given** 用戶擁有有效的帳號密碼
- **When** 用戶提交登入表單
- **Then** 系統驗證憑證並返回存取令牌，用戶進入主頁面
```

### docs/architecture/

- Extract macro-level design principles from the codebase.
- Group principles by module or architectural layer; each module gets its own markdown file.
- Every principle must be sufficiently abstract to avoid becoming stale after minor code changes.
- Focus on module responsibilities, boundary rules, data flow direction, and integration contracts — not on specific implementation details.

Example architecture principle:

```markdown
# API 層設計原則

## 路由與處理器分離

路由定義與請求處理邏輯存放在不同模組中。路由層只負責 URL 映射與中介軟體綁定，
處理器層負責請求解析、業務邏輯調用與回應組裝。
```

### docs/principles/

- Extract code style, naming conventions, and development constraints from the codebase.
- Categorize into separate markdown files (e.g., naming conventions, dependency management, error handling patterns).
- Each principle must be traceable to concrete examples in the codebase.

Example principle:

```markdown
# 命名約定

## 檔案命名

- TypeScript 模組檔案使用 kebab-case：`user-service.ts`
- React 元件檔案使用 PascalCase：`UserProfile.tsx`
- 測試檔案與被測檔案同名，加上 `.test` 後綴：`user-service.test.ts`
```

## Workflow

### 1) Read the entire codebase

- Read every source file in the repository to build a complete mental model.
- Pay special attention to:
  - Entry points (CLI commands, server startup, job runners)
  - Public-facing interfaces (API routes, CLI commands, UI pages)
  - Module boundaries and dependency directions
  - Configuration files, environment variables, and external service integrations
  - Test files that document expected behavior
- Record concrete file paths as evidence for every claim that will appear in documentation.

### 2) Read existing project documentation as reference

- Enumerate all existing documentation files (`README.md`, `docs/**`, `CONTRIBUTING.md`, etc.).
- Extract factual claims that can be cross-referenced with the codebase.
- Note gaps where documentation is missing or outdated.
- Treat existing docs as secondary sources; code is always the primary source of truth.

### 3) Generate new documentation following the template structure

- Create `docs/features/`, `docs/architecture/`, and `docs/principles/` directories if they do not exist.
- For each category, classify findings from the codebase and write focused markdown files.
- Titles must be descriptive and immediately tell the reader what the file covers.
- Write in the user's language unless the repository clearly uses a different documentation language.

**Features generation checklist:**
- Identify all user-facing capabilities from routes, CLI commands, UI pages, and job outputs.
- Group into functional categories (e.g., authentication, data export, notifications).
- Write BDD scenarios for each feature using Given/When/Then.
- Each file covers one functional category.

**Architecture generation checklist:**
- Identify major modules or layers from the codebase directory structure and import graph.
- For each module, extract the design principles that govern its structure and boundaries.
- Keep principles at the macro level; avoid principles that would need updating for minor code changes.
- Each file covers one module or architectural layer.

**Principles generation checklist:**
- Identify recurring patterns in code style, naming, error handling, dependency management, and testing.
- Categorize patterns into separate files (e.g., `coding-style.md`, `naming-conventions.md`, `dependency-management.md`).
- Support each principle with a brief rationale traceable to the codebase.

### 4) Remove old documentation that does not conform

- Scan `docs/` and the repository root for documentation files that do not fit the new structure.
- Remove any documentation file whose content has been fully migrated into the new structure.
- Keep only files that belong to the new structure or have not yet been migrated.
- When in doubt, preserve the file and note it as a candidate for later migration.

### 5) Update AGENTS.md/CLAUDE.md via maintain-project-constraints

- After the new documentation is complete, invoke `maintain-project-constraints` to refresh `AGENTS.md/CLAUDE.md`.
- `maintain-project-constraints` will read the codebase (or the newly generated docs), extract macro business goals, write them to `AGENTS.md`/`CLAUDE.md`, and maintain the project document index.

## Quality Gate (must pass before finishing)

- Every feature description is written from a user perspective with no code references.
- Every architecture principle is macro-level and resilient to minor code changes.
- Every code principle is traceable to concrete examples in the codebase.
- All generated files have descriptive, scannable titles.
- No stale documentation remains that duplicates or contradicts the new structure.
- `maintain-project-constraints` has been run and `AGENTS.md`/`CLAUDE.md` is up to date.

## Reference Template

- `references/templates/standardized-docs-template.md`: describes the three-category documentation structure, writing rules, and quality checklist for each category.
