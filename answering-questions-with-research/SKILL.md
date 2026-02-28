---
name: answering-questions-with-research
description: This skill should be used when the user asks a question that needs complete, evidence-based answers by combining repository discovery with web research.
---

# Answering Questions With Research

## Trigger Conditions

Use this skill whenever the user asks a question and expects a complete, factual answer.

## Required Workflow

1. Perform repository discovery first.
   - Explore the codebase before answering.
   - Locate relevant files with fast search tools (for example, `rg --files` and `rg`).
   - Read only the files needed to confirm facts.
2. Perform web search second.
   - Gather external information relevant to the user question.
   - Prefer official docs and primary sources.
   - Verify time-sensitive facts with current sources.
3. Produce a complete answer.
   - Combine repository findings and web findings.
   - Address all user concerns as fully as possible.
   - Clearly separate confirmed facts from assumptions.
   - Include source links for externally verified claims.

## Quality Rules

- Do not guess when evidence is missing.
- State what was verified and what could not be verified.
- Keep the answer concise, direct, and actionable.
