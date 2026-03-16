---
name: deep-research-topics
description: "Research specific topics deeply and turn them into evidence-based deliverables. Use when users need a structured research report, briefing, background memo, literature scan, or decision-support document grounded in authoritative sources. Default to PDF output, but switch to DOCX or PPTX when the user explicitly asks for those formats."
---

# Deep Research Topics

## Dependencies

- Required: none.
- Conditional: `pdf` by default, `doc` when Word output is requested, and `slides` when slides are requested.
- Optional: none.
- Fallback: If the required output skill is unavailable, stop and report the missing dependency instead of inventing another export path.

## Standards

- Evidence: Prioritize authoritative sources, verify time-sensitive claims, and keep traceable notes for important facts.
- Execution: Define research questions, inspect workspace style, draft the content, then hand off to exactly one output skill unless multiple formats are explicitly requested.
- Quality: Distinguish verified facts from analysis or inference and call out limitations, conflicts, or stale data explicitly.
- Output: Deliver a polished research file with clear sections, citations, dates, and source links.

## Overview

Use this skill when a user needs topic research that goes beyond a quick answer and should end as a polished file deliverable.

## Required Workflow

1. Understand the request
   - Identify the research goal, target audience, decision context, time range, geography, and required depth.
   - Extract explicit deliverable requirements such as format, sections, length, and citation expectations.
2. Break the topic into research questions
   - Define the topic boundary and key terms.
   - Split the work into the main subtopics, competing views, recent developments, supporting data, and open questions.
   - Turn vague requests into a concrete research checklist before drafting.
3. Perform deep research
   - Prioritize authoritative sources: official documentation, government or regulator materials, academic papers, standards bodies, company filings, and well-established institutions.
   - Use secondary reporting only to triangulate, summarize, or discover primary sources.
   - Verify time-sensitive facts with current sources and record publication dates.
   - Keep traceable notes for claims, metrics, dates, and citations.
4. Read workspace files before writing
   - Inspect relevant files in the current workspace to learn the existing language, tone, terminology, heading structure, table style, and citation pattern.
   - Reuse established structure and vocabulary when a clear house style already exists.
   - If no relevant files exist, use a clean evidence-first structure.
5. Decide output language and character compatibility
   - Default to Chinese.
   - If the user explicitly requests another language, follow the user request.
   - Otherwise, if the workspace already has a dominant language, follow that language for consistency.
   - Use characters, punctuation, and fonts that are safe for Chinese or mixed CJK output. Avoid unusual glyphs that commonly break in PDF, DOCX, or PPTX rendering.
6. Draft the deliverable
   - Include an executive summary or research overview.
   - Organize findings by research question or subtopic.
   - Distinguish verified facts from analysis or inference.
   - Include citations, dates, and source links for important claims.
   - State limitations, unresolved questions, and conflicts in the evidence when they exist.
7. Hand off to the selected output skill
   - Use `pdf` by default.
   - Switch to `doc` or `slides` only when requested or clearly required by the workspace convention.
   - Preserve headings, tables, citations, and appendix material during the handoff.
   - If the selected output skill is `pdf`, require PDF visual QA before completion:
     - open the rendered PDF locally
     - capture temporary screenshots from representative pages
     - inspect layout, spacing, glyph rendering, tables, and dense text blocks
     - regenerate if the visual result is wrong or unattractive
     - delete all temporary QA screenshots after the final PDF passes inspection unless the user explicitly asks to keep them

## Source Quality Rules

- Prefer primary and authoritative sources over commentary.
- Use multiple high-quality sources when the claim is important or contested.
- Do not guess when evidence is incomplete.
- Call out uncertainty, disagreement, or stale data explicitly.
- Keep citations specific enough that another agent can trace them quickly.

## Output Expectations

The final deliverable should usually contain:

1. Title and scope
2. Executive summary
3. Research questions or evaluation framework
4. Findings by section
5. Evidence and citations
6. Implications, recommendations, or next steps when requested
7. Limitations or open questions
