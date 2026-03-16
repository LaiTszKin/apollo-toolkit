# [Project Name] Handbook

## 1. Project Overview

- Project purpose: [What the project exists to do]
- Primary users: [Who uses it]
- Supported environments: [local / staging / production / other]
- Source of truth checked: [code/config/spec paths reviewed]

## 2. Installation And Deployment

### 2.1 Prerequisites

- Runtime/tooling: [Node/Python/Docker/etc.]
- Accounts/services needed: [if any]
- Local dependencies: [database, queue, browser, etc.]

### 2.2 Local Installation

```bash
[Clone / install / bootstrap commands]
```

### 2.3 Local Run

```bash
[Run or dev server commands]
```

### 2.4 Deployment Flow

- Deployment targets: [where it deploys]
- Deployment command or pipeline: [command / CI job / script]
- Required pre-deploy checks: [tests, migrations, approvals]
- Rollback notes: [how rollback works or `Unknown`]

## 3. Configuration

### 3.1 Environment Variables And Config Files

| Key / File | Required | Purpose | Example / Default | Evidence |
| --- | --- | --- | --- | --- |
| `[ENV_KEY]` | `[Yes/No]` | [What it controls] | [Example or default] | [File path] |
| `[config/file]` | `[Yes/No]` | [Why it matters] | [Example or default] | [File path] |

### 3.2 External Services And Credential Setup

#### [Service Name]

- Purpose: [Why this service exists in the project]
- Required keys/config: `[ENV_KEY]`, `[CONFIG_KEY]`
- Official setup entry: [Link or exact console path if known]
- Acquisition steps:
  1. [Create or open the relevant account/project]
  2. [Generate/find the credential]
  3. [Store it in the local/deployment config]
  4. [Verify connectivity]
- Development notes: [sandbox/test mode, rate limit, fake data, or `Unknown`]
- Evidence: [file path or spec path]

## 4. Project Architecture

### 4.1 High-Level Structure

- Entry points: [CLI/server/app/worker]
- Major modules: [module names and responsibilities]
- Data flow summary: [request/event/job flow]
- Integration boundaries: [DB/API/queue/filesystem]

### 4.2 Directory Guide

| Path | Responsibility |
| --- | --- |
| `[path]` | [What lives here] |
| `[path]` | [What lives here] |

## 5. Feature Guide

### 5.1 [Feature or Workflow Name]

- User value: [Why it matters]
- Trigger or entrypoint: [route/command/page/job]
- Core flow: [happy path summary]
- Edge or failure notes: [important caveats]
- Evidence: [spec/code/doc path]

### 5.2 [Feature or Workflow Name]

- User value: [Why it matters]
- Trigger or entrypoint: [route/command/page/job]
- Core flow: [happy path summary]
- Edge or failure notes: [important caveats]
- Evidence: [spec/code/doc path]

## 6. Before You Start Developing

- Domain concepts to know: [business rules, glossary, permissions, lifecycle]
- Risk hotspots: [critical modules, concurrency, external dependencies, migrations]
- Testing expectations: [unit/integration/E2E/property-based if relevant]
- Debugging entrypoints: [logs, commands, dashboards, scripts]
- Open documentation gaps: [Unknown/TBD items that still need evidence]

## 7. Change Log For This Documentation Pass

- Specs reviewed: [list of spec directories/files]
- Existing docs updated: [paths]
- Major conflicts resolved: [spec vs code decisions]
- Remaining unknowns: [list or `None`]
