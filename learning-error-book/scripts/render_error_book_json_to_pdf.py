#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from typing import Any, List, Optional, Sequence, Tuple
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


THEME = {
    "ink": colors.HexColor("#1F2937"),
    "muted": colors.HexColor("#6B7280"),
    "line": colors.HexColor("#D1D5DB"),
    "panel": colors.HexColor("#F8FAFC"),
    "panel_alt": colors.HexColor("#EEF2FF"),
    "accent": colors.HexColor("#0F766E"),
    "warning": colors.HexColor("#9A3412"),
    "warning_soft": colors.HexColor("#FFEDD5"),
}


def _read_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _ensure_parent_dir(path: str) -> None:
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)


def _detect_cjk_font_path(user_font_path: Optional[str]) -> Tuple[str, int]:
    if user_font_path:
        return user_font_path, 0

    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W5.ttc",
        "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path, 0
    raise SystemExit("No CJK font found. Re-run with --font-path pointing to a .ttf/.otf/.ttc font file.")


def _register_font(font_path: str, subfont_index: int) -> str:
    font_name = "ErrorBookBodyFont"
    if font_name not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(font_name, font_path, subfontIndex=subfont_index))
    return font_name


def _safe_text(value: Any, default: str = "-") -> str:
    if value is None:
        return default
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else default
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        parts = [_safe_text(item, default="") for item in value]
        joined = ", ".join(part for part in parts if part)
        return joined if joined else default
    return str(value)


def _markup(value: Any, default: str = "-") -> str:
    return escape(_safe_text(value, default=default)).replace("\n", "<br/>")


def _paragraph(text: Any, style: ParagraphStyle, default: str = "-") -> Paragraph:
    return Paragraph(_markup(text, default=default), style)


def _bullet_lines(items: Sequence[Any], styles: dict, empty_text: str = "-") -> List[Any]:
    values = list(items or [])
    if not values:
        return [_paragraph(empty_text, styles["body"])]
    return [Paragraph(f"- {_markup(item)}", styles["bullet"]) for item in values]


def _bullet_paragraph(items: Sequence[Any], style: ParagraphStyle, empty_text: str = "-") -> Paragraph:
    values = list(items or [])
    if not values:
        return Paragraph(_markup(empty_text), style)
    lines = "<br/>".join(f"- {_markup(item)}" for item in values)
    return Paragraph(lines, style)


def _table(data: List[List[Any]], col_widths: Sequence[float], table_style: TableStyle) -> Table:
    table = Table(data, colWidths=list(col_widths), repeatRows=1)
    table.setStyle(table_style)
    return table


def _build_styles(font_name: str, font_size: int) -> dict:
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ErrorBookTitle",
            parent=styles["Title"],
            fontName=font_name,
            fontSize=24,
            leading=30,
            textColor=THEME["ink"],
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "ErrorBookSubtitle",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=11,
            leading=15,
            textColor=THEME["muted"],
            spaceAfter=8,
        ),
        "section": ParagraphStyle(
            "ErrorBookSection",
            parent=styles["Heading1"],
            fontName=font_name,
            fontSize=16,
            leading=20,
            textColor=THEME["accent"],
            spaceBefore=8,
            spaceAfter=6,
        ),
        "question": ParagraphStyle(
            "ErrorBookQuestion",
            parent=styles["Heading2"],
            fontName=font_name,
            fontSize=14,
            leading=18,
            textColor=THEME["ink"],
            spaceAfter=4,
        ),
        "subhead": ParagraphStyle(
            "ErrorBookSubhead",
            parent=styles["Heading3"],
            fontName=font_name,
            fontSize=11,
            leading=14,
            textColor=THEME["ink"],
            spaceBefore=4,
            spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "ErrorBookBody",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=font_size,
            leading=int(font_size * 1.55),
            textColor=THEME["ink"],
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "ErrorBookBullet",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=font_size,
            leading=int(font_size * 1.5),
            textColor=THEME["ink"],
            leftIndent=10,
            spaceAfter=3,
        ),
        "meta": ParagraphStyle(
            "ErrorBookMeta",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=10,
            leading=13,
            textColor=THEME["muted"],
        ),
        "label": ParagraphStyle(
            "ErrorBookLabel",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=10,
            leading=13,
            textColor=THEME["accent"],
        ),
        "table": ParagraphStyle(
            "ErrorBookTable",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=9,
            leading=12,
            textColor=THEME["ink"],
        ),
        "table_head": ParagraphStyle(
            "ErrorBookTableHead",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=9,
            leading=12,
            textColor=colors.white,
        ),
        "callout": ParagraphStyle(
            "ErrorBookCallout",
            parent=styles["BodyText"],
            fontName=font_name,
            fontSize=10,
            leading=14,
            textColor=THEME["warning"],
        ),
    }


def _header_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(THEME["muted"])
    canvas.drawString(doc.leftMargin, doc.height + doc.topMargin + 8, doc.title)
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 12, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def _section_heading(text: str, styles: dict) -> List[Any]:
    return [Spacer(1, 6), Paragraph(_markup(text), styles["section"]), HRFlowable(color=THEME["line"], thickness=1, width="100%"), Spacer(1, 6)]


def _coverage_story(data: dict, styles: dict, width: float) -> List[Any]:
    rows: List[List[Any]] = [[
        Paragraph("Source", styles["table_head"]),
        Paragraph("Questions", styles["table_head"]),
        Paragraph("Notes", styles["table_head"]),
    ]]
    for item in data.get("coverage_scope", []):
        rows.append([
            _paragraph(item.get("source_path"), styles["table"]),
            _paragraph(item.get("included_questions", []), styles["table"]),
            _paragraph(item.get("notes"), styles["table"]),
        ])
    if len(rows) == 1:
        rows.append([_paragraph("-", styles["table"]), _paragraph("-", styles["table"]), _paragraph("-", styles["table"])])

    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), THEME["accent"]),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), styles["table"].fontName),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.6, THEME["line"]),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, THEME["panel"]]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ])
    return _section_heading("Coverage Scope", styles) + [_table(rows, [width * 0.36, width * 0.24, width * 0.40], style)]


def _overview_story(data: dict, styles: dict) -> List[Any]:
    story = _section_heading("Common Mistake Types Overview", styles)
    entries = data.get("mistake_overview", []) or []
    if not entries:
        return story + [_paragraph("No mistake overview provided.", styles["body"])]

    for entry in entries:
        box = [
            Paragraph(_markup(entry.get("type")), styles["subhead"]),
            _paragraph(entry.get("summary"), styles["body"]),
            _paragraph(f"Representative questions: {_safe_text(entry.get('representative_questions', []))}", styles["meta"]),
        ]
        story.append(
            Table(
                [[box]],
                colWidths=[None],
                style=TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), THEME["panel"]),
                    ("BOX", (0, 0), (-1, -1), 0.8, THEME["line"]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]),
            )
        )
        story.append(Spacer(1, 6))
    return story


def _concept_story(data: dict, styles: dict, width: float) -> List[Any]:
    story = _section_heading("Conceptual Mistake Highlights", styles)
    concepts = data.get("concept_highlights", []) or []
    if not concepts:
        return story + [_paragraph("No concept highlights provided.", styles["body"])]

    for concept in concepts:
        rows = [
            [_paragraph("Definition", styles["label"]), _paragraph(concept.get("definition"), styles["body"])],
            [_paragraph("Common misjudgment", styles["label"]), _paragraph(concept.get("common_misjudgment"), styles["body"])],
            [_paragraph("Checklist", styles["label"]), _bullet_paragraph(concept.get("checklist", []), styles["body"])],
        ]
        story.append(Paragraph(_markup(concept.get("name"), default="Unnamed concept"), styles["question"]))
        story.append(
            Table(
                rows,
                colWidths=[width * 0.22, width * 0.78],
                style=TableStyle([
                    ("BACKGROUND", (0, 0), (0, -1), THEME["panel_alt"]),
                    ("BACKGROUND", (1, 0), (1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 0.8, THEME["line"]),
                    ("INNERGRID", (0, 0), (-1, -1), 0.6, THEME["line"]),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]),
            )
        )
        story.append(Spacer(1, 8))
    return story


def _question_meta(question: dict, styles: dict, width: float) -> Table:
    rows = [
        [_paragraph("Source", styles["label"]), _paragraph(question.get("source_path"), styles["body"])],
        [_paragraph("Locator", styles["label"]), _paragraph(question.get("page_or_locator"), styles["body"])],
        [_paragraph("User answer", styles["label"]), _paragraph(question.get("user_answer"), styles["body"])],
        [_paragraph("Correct answer", styles["label"]), _paragraph(question.get("correct_answer"), styles["body"])],
        [_paragraph("Mistake type", styles["label"]), _paragraph(question.get("mistake_type"), styles["body"])],
        [_paragraph("Concepts", styles["label"]), _paragraph(question.get("concepts", []), styles["body"])],
    ]
    return Table(
        rows,
        colWidths=[width * 0.18, width * 0.82],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), THEME["panel"]),
            ("BACKGROUND", (1, 0), (1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.8, THEME["line"]),
            ("INNERGRID", (0, 0), (-1, -1), 0.6, THEME["line"]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]),
    )


def _steps_block(title: str, steps: Sequence[Any], styles: dict) -> List[Any]:
    return [Paragraph(_markup(title), styles["subhead"])] + _bullet_lines(steps or [], styles, empty_text="No steps provided.")


def _mc_options_table(question: dict, styles: dict, width: float) -> Table:
    rows: List[List[Any]] = [[
        Paragraph("Option", styles["table_head"]),
        Paragraph("Text", styles["table_head"]),
        Paragraph("Verdict", styles["table_head"]),
        Paragraph("Reason", styles["table_head"]),
    ]]
    for option in question.get("options", []) or []:
        rows.append([
            _paragraph(option.get("label"), styles["table"]),
            _paragraph(option.get("text"), styles["table"]),
            _paragraph(option.get("verdict"), styles["table"]),
            _paragraph(option.get("reason"), styles["table"]),
        ])
    if len(rows) == 1:
        rows.append([_paragraph("-", styles["table"]), _paragraph("-", styles["table"]), _paragraph("-", styles["table"]), _paragraph("-", styles["table"])])
    return _table(
        rows,
        [width * 0.10, width * 0.28, width * 0.12, width * 0.50],
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), THEME["accent"]),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), styles["table"].fontName),
            ("GRID", (0, 0), (-1, -1), 0.6, THEME["line"]),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, THEME["panel"]]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]),
    )


def _long_key_concepts_table(question: dict, styles: dict, width: float) -> Table:
    rows: List[List[Any]] = [[
        Paragraph("Concept", styles["table_head"]),
        Paragraph("Why it matters", styles["table_head"]),
    ]]
    for item in question.get("key_concepts", []) or []:
        rows.append([
            _paragraph(item.get("name"), styles["table"]),
            _paragraph(item.get("why_it_matters"), styles["table"]),
        ])
    if len(rows) == 1:
        rows.append([_paragraph("-", styles["table"]), _paragraph("-", styles["table"])])
    return _table(
        rows,
        [width * 0.24, width * 0.76],
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), THEME["accent"]),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), styles["table"].fontName),
            ("GRID", (0, 0), (-1, -1), 0.6, THEME["line"]),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, THEME["panel"]]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]),
    )


def _step_comparison_table(question: dict, styles: dict, width: float) -> Table:
    rows: List[List[Any]] = [[
        Paragraph("Step", styles["table_head"]),
        Paragraph("Expected", styles["table_head"]),
        Paragraph("User", styles["table_head"]),
        Paragraph("Gap", styles["table_head"]),
        Paragraph("Fix", styles["table_head"]),
    ]]
    for item in question.get("step_comparison", []) or []:
        rows.append([
            _paragraph(item.get("step_no"), styles["table"]),
            _paragraph(item.get("expected_step"), styles["table"]),
            _paragraph(item.get("user_step"), styles["table"]),
            _paragraph(item.get("gap"), styles["table"]),
            _paragraph(item.get("fix"), styles["table"]),
        ])
    if len(rows) == 1:
        rows.append([
            _paragraph("-", styles["table"]),
            _paragraph("-", styles["table"]),
            _paragraph("-", styles["table"]),
            _paragraph("-", styles["table"]),
            _paragraph("-", styles["table"]),
        ])
    return _table(
        rows,
        [width * 0.08, width * 0.24, width * 0.22, width * 0.20, width * 0.26],
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), THEME["warning"]),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), styles["table"].fontName),
            ("GRID", (0, 0), (-1, -1), 0.6, THEME["line"]),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, THEME["warning_soft"]]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]),
    )


def _mc_question_story(question: dict, styles: dict, width: float) -> List[Any]:
    story: List[Any] = [
        Paragraph(_markup(question.get("question_id"), default="Unnamed question"), styles["question"]),
        _question_meta(question, styles, width),
        Spacer(1, 6),
        Paragraph("Stem", styles["subhead"]),
        _paragraph(question.get("stem"), styles["body"]),
        Paragraph("Why it was wrong", styles["subhead"]),
        _paragraph(question.get("why_wrong"), styles["body"]),
    ]
    story.extend(_steps_block("Correct solution", question.get("correct_solution_steps", []), styles))
    story.extend([Spacer(1, 4), Paragraph("Option-by-option reasoning", styles["subhead"]), _mc_options_table(question, styles, width), Spacer(1, 10)])
    return story


def _long_question_story(question: dict, styles: dict, width: float) -> List[Any]:
    first_wrong = _safe_text(question.get("first_incorrect_step"))
    story: List[Any] = [
        Paragraph(_markup(question.get("question_id"), default="Unnamed question"), styles["question"]),
        _question_meta(question, styles, width),
        Spacer(1, 6),
        Paragraph("Stem", styles["subhead"]),
        _paragraph(question.get("stem"), styles["body"]),
        Paragraph("Why it was wrong", styles["subhead"]),
        _paragraph(question.get("why_wrong"), styles["body"]),
        Spacer(1, 4),
        Table(
            [[Paragraph(f"First incorrect step: {_markup(first_wrong)}", styles["callout"])]],
            colWidths=[width],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), THEME["warning_soft"]),
                ("BOX", (0, 0), (-1, -1), 0.8, THEME["warning"]),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]),
        ),
        Spacer(1, 6),
        Paragraph("Key concepts involved", styles["subhead"]),
        _long_key_concepts_table(question, styles, width),
        Spacer(1, 6),
        Paragraph("Step-by-step comparison", styles["subhead"]),
        _step_comparison_table(question, styles, width),
    ]
    story.extend([Spacer(1, 6)] + _steps_block("Correct solution", question.get("correct_solution_steps", []), styles) + [Spacer(1, 10)])
    return story


def _questions_story(data: dict, styles: dict, width: float) -> List[Any]:
    story = _section_heading("Mistake-by-Mistake Analysis & Solutions", styles)
    questions = data.get("questions", []) or []
    if not questions:
        return story + [_paragraph("No question analysis provided.", styles["body"])]

    builder = _mc_question_story if data.get("book_type") == "mc-question" else _long_question_story
    for question in questions:
        story.extend(builder(question, styles, width))
    return story


def _build_story(data: dict, styles: dict, doc: SimpleDocTemplate) -> List[Any]:
    title = _safe_text(data.get("title"), default="Error Book")
    subtitle = f"Type: {_safe_text(data.get('book_type'), default='general')} | Last updated: {_safe_text(data.get('last_updated'))}"
    story: List[Any] = [
        Spacer(1, 8),
        Paragraph(_markup(title), styles["title"]),
        Paragraph(_markup(subtitle), styles["subtitle"]),
        Paragraph(_markup("A structured review of mistakes, concepts, and corrections."), styles["subtitle"]),
    ]
    story.extend(_coverage_story(data, styles, doc.width))
    story.extend(_overview_story(data, styles))
    story.extend(_concept_story(data, styles, doc.width))
    story.append(PageBreak())
    story.extend(_questions_story(data, styles, doc.width))
    return story


def main() -> int:
    parser = argparse.ArgumentParser(description="Render structured error-book JSON to a polished PDF.")
    parser.add_argument("input_json", help="Input JSON file path")
    parser.add_argument("output_pdf", help="Output PDF file path")
    parser.add_argument("--font-path", default=None, help="Path to a CJK-capable font file (.ttf/.otf/.ttc)")
    parser.add_argument("--font-size", type=int, default=11, help="Base font size (default: 11)")
    parser.add_argument("--pagesize", choices=["a4", "letter"], default="a4", help="Page size (default: a4)")
    parser.add_argument("--margin-mm", type=float, default=16.0, help="Page margin in mm (default: 16)")
    args = parser.parse_args()

    data = _read_json(args.input_json)
    font_path, subfont_index = _detect_cjk_font_path(args.font_path)
    font_name = _register_font(font_path, subfont_index)
    styles = _build_styles(font_name, args.font_size)

    page_size = A4 if args.pagesize == "a4" else letter
    margin = args.margin_mm * mm

    _ensure_parent_dir(args.output_pdf)
    doc = SimpleDocTemplate(
        args.output_pdf,
        pagesize=page_size,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
        title=_safe_text(data.get("title"), default=os.path.basename(args.output_pdf)),
        author="Apollo Toolkit Learning Error Book Skill",
    )

    story = _build_story(data, styles, doc)
    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
