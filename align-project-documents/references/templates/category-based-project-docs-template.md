# Category-Based Project Documentation Template

Use this template as a selection guide, not a mandatory outline. Start by classifying the repository's real content and the readers' likely questions, then choose only the document categories and section blocks that are actually supported by evidence.

Base the classification on common open source documentation practice:

- Use the Diataxis content families when deciding what kind of content you are writing: tutorial, how-to, reference, and explanation.
- Use common open source repository documents when deciding where the content should live: `README`, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`, troubleshooting guides, glossary, and release notes when applicable.
- Use The Good Docs Project templates as a practical guide for selecting content types that teams repeatedly need in real projects.

## 1. Start With Reader And Content Classification

Before writing, identify:

| Classification | Questions to answer | Example answers |
| --- | --- | --- |
| Primary readers | Who needs this document first? | New developer, operator, support teammate, PM, founder |
| Reader background | What might they not know yet? | No repo context, no local setup experience, no domain knowledge |
| Main job to be done | What is the reader trying to accomplish? | Run locally, change a feature, deploy, debug an incident |
| Evidence sources | Which files prove the behavior? | `README.md`, `package.json`, `src/server.ts`, `.github/workflows/deploy.yml` |
| Documentation risk | What would go wrong if this is undocumented? | Broken onboarding, misconfigured secrets, incorrect production operation |

Write the document around the real questions above. Do not force a category or section when the repository does not support it.

## 2. Choose The Right Document Categories

Select one or more categories below. Keep the titles content-led and specific. Prefer titles such as `本地啟動後端服務`, `設定 Stripe 測試金鑰`, or `訂單同步失敗時如何排查`, instead of generic headings that hide the real task.

| Open source documentation type | Diataxis family | Use when the repository contains... | Main reader need | Suggested output path |
| --- | --- | --- | --- |
| README / docs index | Mixed entrypoint | Clear project purpose, user value, repo scope, key links | "What is this project and where do I start?" | `README.md`, `docs/README.md` |
| Tutorial / getting started | Tutorial | A first-run path that teaches by doing | "Help me complete my first successful run." | `docs/getting-started.md`, `docs/tutorials/*.md` |
| How-to / runbook / operations guide | How-to | Repeated workflows, CLI commands, dashboards, jobs, support actions | "How do I perform this real task?" | `docs/how-to/*.md`, `docs/runbooks/*.md`, `docs/operations.md` |
| Reference / configuration catalog | Reference | Env vars, config files, commands, endpoints, state tables, limits | "What options, inputs, or values exist?" | `docs/configuration.md`, `docs/reference/*.md` |
| Explanation / architecture / concepts | Explanation | Module boundaries, data flow, ownership, state transitions, tradeoffs | "How is this built and why is it shaped this way?" | `docs/architecture.md`, `docs/concepts/*.md` |
| Troubleshooting | How-to + reference | Known symptoms, causes, checks, recovery actions | "What should I check when it breaks?" | `docs/troubleshooting.md`, `docs/runbooks/*.md` |
| CONTRIBUTING | How-to + explanation | Contribution flow, local validation, review expectations | "How do I contribute safely?" | `CONTRIBUTING.md`, `docs/developer-guide.md` |
| SECURITY | How-to + reference | Vulnerability reporting process, supported versions, security boundaries | "How should I report a security issue?" | `SECURITY.md` |
| CODE_OF_CONDUCT | Community governance | Community expectations and reporting path | "How does this project expect people to behave?" | `CODE_OF_CONDUCT.md` |
| Glossary / terminology | Reference | Business rules, lifecycle states, project vocabulary, permissions | "What do these terms mean?" | `docs/glossary.md`, `docs/terminology.md` |
| FAQ / decisions / release notes | Explanation + reference | Repeated questions, key tradeoffs, notable changes | "Why was this choice made?" / "What changed?" | `docs/faq.md`, `docs/decisions/*.md`, `CHANGELOG.md` |

### Selection Rules

- Start by asking which Diataxis family the content belongs to.
- Then choose the most conventional open source document type that readers would expect to find.
- Do not merge tutorial, how-to, reference, and explanation into one page unless the repository is genuinely small enough that separation would hurt readability.
- Keep community-governance documents such as `CONTRIBUTING`, `SECURITY`, and `CODE_OF_CONDUCT` separate from product usage docs.
- When a document mixes content types, decide which type is primary and move the rest behind links.

## 3. Section Blocks You Can Reuse Inside Any Document

Use only the blocks that help the target reader. Rename each heading to match the specific content.

### A. Reader Context Block

Use when the reader may not understand the project or task yet.

- Who should read this:
- What they are probably trying to do:
- What they need to know first:
- What success looks like after reading:

### B. Before You Start Block

Use for setup, operations, deployments, or debugging.

- Required tools or accounts:
- Required permissions or credentials:
- Files, services, or environments involved:
- Safe test or sandbox alternatives:

### C. Exact Steps Block

Use for any task-oriented content.

1. State the action in plain language.
2. Give the exact command, UI path, or file path.
3. Explain what result should appear.
4. Explain what to do if the result does not appear.

### D. Expected Signals Block

Use when readers need to confirm they are on the right path.

- Success logs, UI states, API responses, artifacts, or screenshots:
- Expected side effects:
- How long the step usually takes:

### E. Failure And Recovery Block

Use when the workflow can fail or confuse newcomers.

- Common mistake:
- Symptom:
- Likely cause:
- How to verify:
- How to fix:

### F. Code Navigation Block

Use for architecture or developer-facing docs.

- Entry point:
- Main modules and responsibilities:
- Important data models:
- External integration touchpoints:
- Highest-risk files to review before editing:

### G. Decision And Limitation Block

Use when the code or operations include tradeoffs.

- Current limitation:
- Why it exists:
- When it matters:
- Safe workaround:
- Evidence:

## 4. Newcomer-Friendly Writing Rules

Every non-trivial document should help a reader who does not yet know the project. Prefer explaining:

- what this part of the system is for
- why the reader would need it
- what they must prepare beforehand
- what exact action they should take
- what result they should expect
- what usually goes wrong
- where in the repository the truth lives

Avoid:

- headings that only repeat template words without conveying meaning
- assuming the reader already knows internal jargon
- mentioning files, services, or commands without saying why they matter
- mixing future plans with current behavior

## 5. Evidence Checklist

Before finishing, confirm:

- every important instruction maps to code, config, scripts, tests, or current deployment files
- every command is current and runnable, or explicitly marked as needing manual confirmation
- each document category exists because the repository actually needs it
- each heading is descriptive of the real content, not just copied from a template
- unknowns are labeled clearly instead of guessed

## 6. Example Of Category Selection

Example classification:

- Readers: new developer and part-time operator
- Main needs: local startup, environment configuration, order sync debugging
- Repository evidence: API server, worker process, queue config, deploy workflow, sync failure logs

Reasonable outputs:

- `README.md`: project overview and links
- `docs/getting-started.md`: tutorial-style first successful run
- `docs/configuration.md`: reference-style env vars and third-party credentials
- `docs/architecture.md`: explanation of API, worker, queue, and database boundaries
- `docs/runbooks/order-sync-failures.md`: how-to troubleshooting for order sync issues
- `CONTRIBUTING.md`: contribution flow, local checks, and review expectations if external contributors are expected

Not needed unless evidence supports them:

- `docs/glossary.md`
- `docs/faq.md`
- separate feature catalog for every route/page
