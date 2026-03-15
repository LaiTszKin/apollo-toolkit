---
name: financial-research
description: Research the most important tradeable instruments to watch for the coming week by reviewing the most recent completed local week of financial and economic news, then produce a standardized PDF market report. Use when the user asks for a weekly market briefing, macro recap, market sentiment summary, key financial news review, or a next-week trading watchlist.
---

# Financial Research

## Overview

Create an evidence-based weekly market report for the next trading week. Start from the current local date and time, review the most recent completed local week of financial and economic news, distill the key market signals, and deliver a standardized PDF report in Chinese by default.

## Dependency Contract

- Must use the `pdf` skill for the final deliverable.
- If the `pdf` skill is unavailable, stop and report the missing dependency instead of inventing another export workflow.

## Behavior Contract

GIVEN the user needs research on the instruments worth watching in the coming week  
WHEN the agent uses this skill proactively or the user calls this skill directly  
THEN the agent must check the current local date, time, and timezone first  
AND define the research window as the most recent completed local 7-day period ending yesterday  
AND search financial and economic news from that window  
AND identify the week's macro conditions, overall market sentiment, key news, and the most important instruments to monitor next week  
AND save the report under a month-based folder  
AND keep only the final PDF report as the persistent deliverable  
AND generate a standardized PDF report with Chinese-compatible characters  
AND default the report language to Chinese unless the user explicitly requests another language.

## Required Inputs

Before drafting the report, confirm these facts from context or current sources:

- Current local date, time, and timezone
- Any user-specified geography, market, asset class, or language preference
- If the user did not narrow the scope, cover the major global cross-asset picture

Do not guess missing facts that materially change the report scope.

## Research Window Rules

1. Always resolve the user's local date first.
2. Use the most recent completed 7-day local window that ends on yesterday.
3. State exact calendar dates in the report.
4. Example:
   - if the local date is Sunday, research the previous Sunday through Saturday
   - if the local date is Friday, research the previous Friday through Thursday

## Source Rules

- Use current web research for time-sensitive facts.
- Prefer primary or authoritative sources first:
  - central banks
  - government statistical agencies
  - regulators
  - exchange operators
  - company filings or official releases
- Use high-quality financial reporting only to supplement, triangulate, or surface primary sources.
- Record the publication date or event date for all important claims.
- Separate verified facts from inference.

## Workflow

### 1) Lock the scope and timing

- Check the current local time before searching.
- Write down the exact research window with start date, end date, and timezone.
- If the user names a region or market, prioritize that scope while keeping enough macro context to explain cross-asset spillovers.

### 2) Collect the week's market evidence

- Search the week's financial and economic news across the relevant markets.
- Cover at least the drivers that materially moved markets during the window, such as:
  - central bank decisions and guidance
  - inflation, employment, growth, and liquidity data
  - major fiscal, regulatory, or geopolitical developments
  - important earnings or sector shocks when they changed broader risk appetite
  - large moves in rates, equities, foreign exchange, commodities, or crypto when relevant
- Build an evidence table before writing the report. For each item capture:
  - date
  - source
  - event
  - affected assets
  - why it mattered during the week
  - why it may matter next week

### 3) Distill the market picture

- Produce a concise macro summary of the week.
- Judge the overall market sentiment from confirmed cross-asset behavior rather than headlines alone.
- Explain whether the tone was risk-on, risk-off, mixed, or regime-shifting, and why.
- Highlight conflicts in the evidence instead of forcing a single narrative.

### 4) Select the instruments worth watching next week

- Rank the most important tradeable instruments by expected relevance for the coming week.
- Default to 3-8 instruments unless the user requests a different number.
- Prefer liquid, recognizable instruments:
  - major indices or ETFs
  - major FX pairs
  - government bond futures or benchmark yields
  - major commodities
  - liquid crypto pairs only when they were materially relevant during the week
- For each selected instrument, include:
  - instrument name and ticker or pair when available
  - asset class
  - this week's key driver
  - what to watch next week
  - base case or monitoring thesis
  - main upside/downside risk or invalidation condition

### 5) Write the standardized report

- Start from `assets/weekly_market_report_template.md`.
- Localize headings to the requested output language.
- Default to Chinese if the user did not specify a language.
- Use Chinese-compatible characters, punctuation, and fonts.
- On macOS, do not assume a font family is available just because it worked elsewhere.
- On macOS, prefer a locally verified CJK font in this order when the PDF workflow allows explicit font selection:
  - `/System/Library/Fonts/Hiragino Sans GB.ttc`
  - `/System/Library/Fonts/Supplemental/Songti.ttc`
  - `/Library/Fonts/Arial Unicode.ttf`
  - `/System/Library/Fonts/STHeiti Medium.ttc`
  - `/System/Library/Fonts/STHeiti Light.ttc`
- Do not hardcode fonts that are missing or known to render poorly on the current macOS host.
- Do not assume `PingFang` exists on every macOS environment.
- If the `pdf` skill already has a verified CJK-safe default on the current machine, reuse that default instead of overriding it.
- Avoid emoji, decorative symbols, and unusual glyphs that often break in PDF rendering.
- Only include exact price levels, yields, or percentages when they were verified from current sources.

### 6) Render the final PDF

- Convert the completed report into PDF through the `pdf` skill.
- Ensure the chosen font and renderer support Chinese text and common Markdown symbols.
- On macOS, verify the selected font path exists before rendering.
- If the renderer cannot safely output Chinese text, fix the font or rendering path before finishing.

### 7) Perform visual QA before finishing

- Open the rendered PDF locally before completing the task.
- Inspect at least:
  - the first page
  - one section with a table
  - one section with dense paragraph text
- Take a screenshot of the rendered PDF page as a final QA check.
- Verify the screenshot for:
  - correct Chinese glyph rendering
  - no missing characters or tofu boxes
  - reasonable line wrapping
  - table borders and columns staying readable
  - page margins and spacing looking clean
  - title, headings, and body hierarchy looking visually balanced
- If the layout or glyph rendering is wrong or unattractive, fix the font, spacing, or content structure and render again before finishing.
- Do not treat the task as complete until this screenshot-based visual check passes.

## File Layout Rules

- Store reports inside a month-based folder named `YYYY-MM`.
- If the user gives a base output directory, create or reuse `YYYY-MM` beneath it.
- If the user does not give a base output directory, use the current working directory as the base.
- Keep only the final PDF report as the persistent output. Do not leave Markdown, DOCX, or temporary export files behind after rendering.
- Remove temporary working files before finishing.
- The QA screenshot is temporary and should be deleted after the visual check unless the user explicitly asks to keep it.

## Report Naming Rules

- The visible report title must use this exact pattern:
  - `[YYYY/M/D-YYYY/M/D]-market-research`
- Build the date range from the exact research window start and end dates.
- Example:
  - `[2025/12/6-2025/12/13]-market-research`
- Because `/` is not safe in macOS filenames, do not use the visible title string directly as the filename.
- The PDF filename must be the filesystem-safe variant:
  - `[YYYY-M-D-YYYY-M-D]-market-research.pdf`
- Example:
  - `[2025-12-6-2025-12-13]-market-research.pdf`

## Standard Report Requirements

The report must contain these sections in order:

1. Report title and scope
2. Generated time and research window
3. Executive summary
4. Weekly macro recap
5. Overall market sentiment
6. Key news and why each item mattered
7. Instruments to watch next week
8. Next-week watchpoints or catalyst calendar
9. Risks and limitations

## Output Rules

- The default deliverable is a PDF.
- Save the final file at `YYYY-MM/[YYYY-M-D-YYYY-M-D]-market-research.pdf`.
- The default language is Chinese unless the user explicitly asks for another language.
- Keep the report evidence-based, concise, and decision-useful.
- Call out uncertainty, disputed interpretations, and missing data explicitly.
- Do not present speculative trade recommendations as facts.
