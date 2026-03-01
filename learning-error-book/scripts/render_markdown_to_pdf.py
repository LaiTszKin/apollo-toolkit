#!/usr/bin/env python3
"""
Render a small Markdown subset to PDF using ReportLab.

Why not use pandoc/markdown/weasyprint?
- This repo environment may not have those installed.
- ReportLab is already available and works offline.

Supported Markdown subset:
- Headings: # / ## / ###
- Unordered lists: "- " or "* "
- Ordered lists: "1. "
- Fenced code blocks: ``` (optional language ignored)
- Inline: **bold**, *italic*, `code`
"""

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple

from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Spacer,
    Paragraph,
    Preformatted,
    ListFlowable,
    ListItem,
)


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _ensure_parent_dir(path: str) -> None:
    parent = os.path.dirname(os.path.abspath(path))
    if parent:
        os.makedirs(parent, exist_ok=True)


def _detect_cjk_font_path(user_font_path: Optional[str]) -> Tuple[str, int]:
    """
    Returns (font_path, subfont_index).

    ReportLab can load TTC via subfontIndex. We default to 0.
    """
    if user_font_path:
        return user_font_path, 0

    candidates = [
        # macOS common CJK fonts
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W5.ttc",
        "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc",
        # Some systems may have these
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p, 0
    raise SystemExit(
        "No CJK font found. Re-run with --font-path pointing to a .ttf/.otf/.ttc font file."
    )


def _register_fonts(font_path: str, subfont_index: int) -> Tuple[str, str]:
    """
    Registers a CJK-capable font for body text. Returns (body_font_name, code_font_name).
    """
    body_font_name = "ErrorBookBodyFont"
    # Avoid double registration errors when the script is invoked multiple times.
    if body_font_name not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(body_font_name, font_path, subfontIndex=subfont_index))

    # Code blocks: built-in Courier is fine for ASCII code and Markdown symbols.
    code_font_name = "Courier"
    return body_font_name, code_font_name


def _xml_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


_RE_BOLD = re.compile(r"\*\*(.+?)\*\*")
_RE_ITALIC = re.compile(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)")
_RE_CODE = re.compile(r"`([^`]+?)`")


def _inline_to_rl_markup(text: str, code_font: str) -> str:
    """
    Convert a subset of inline Markdown to ReportLab Paragraph markup.
    """
    text = _xml_escape(text)

    # Inline code first to avoid formatting inside code spans.
    def repl_code(m: re.Match) -> str:
        # `text` has already been XML-escaped, so do not escape again here;
        # otherwise sequences like "<" become "&amp;lt;" inside code spans.
        return f'<font face="{code_font}">{m.group(1)}</font>'

    text = _RE_CODE.sub(repl_code, text)
    text = _RE_BOLD.sub(r"<b>\1</b>", text)
    text = _RE_ITALIC.sub(r"<i>\1</i>", text)
    return text


@dataclass(frozen=True)
class Block:
    kind: str
    lines: Tuple[str, ...]


def _parse_blocks(md: str) -> List[Block]:
    """
    Parse Markdown into coarse blocks to keep rendering predictable.
    """
    lines = md.splitlines()
    blocks: List[Block] = []

    i = 0
    in_code = False
    code_buf: List[str] = []
    para_buf: List[str] = []
    list_buf: List[str] = []
    list_kind: Optional[str] = None  # "ul" or "ol"

    def flush_para() -> None:
        nonlocal para_buf
        if para_buf:
            blocks.append(Block("para", tuple(para_buf)))
            para_buf = []

    def flush_list() -> None:
        nonlocal list_buf, list_kind
        if list_buf and list_kind:
            blocks.append(Block(list_kind, tuple(list_buf)))
        list_buf = []
        list_kind = None

    while i < len(lines):
        line = lines[i]

        if line.strip().startswith("```"):
            if in_code:
                # end code
                blocks.append(Block("code", tuple(code_buf)))
                code_buf = []
                in_code = False
            else:
                # start code
                flush_para()
                flush_list()
                in_code = True
                code_buf = []
            i += 1
            continue

        if in_code:
            code_buf.append(line.rstrip("\n"))
            i += 1
            continue

        # Blank line breaks paragraphs/lists
        if not line.strip():
            flush_para()
            flush_list()
            i += 1
            continue

        # Headings
        if line.startswith("#"):
            flush_para()
            flush_list()
            m = re.match(r"^(#{1,6})\s+(.*)$", line)
            if m:
                level = len(m.group(1))
                blocks.append(Block(f"h{level}", (m.group(2).strip(),)))
                i += 1
                continue

        # Lists (simple, non-nested)
        m_ul = re.match(r"^\s*[-\*]\s+(.*)$", line)
        m_ol = re.match(r"^\s*\d+\.\s+(.*)$", line)
        if m_ul:
            flush_para()
            if list_kind not in (None, "ul"):
                flush_list()
            list_kind = "ul"
            list_buf.append(m_ul.group(1))
            i += 1
            continue
        if m_ol:
            flush_para()
            if list_kind not in (None, "ol"):
                flush_list()
            list_kind = "ol"
            list_buf.append(m_ol.group(1))
            i += 1
            continue

        # Default: paragraph line (we keep soft-wrapping by joining with spaces)
        flush_list()
        para_buf.append(line.strip())
        i += 1

    # EOF flush
    if in_code:
        blocks.append(Block("code", tuple(code_buf)))
    flush_para()
    flush_list()

    return blocks


def _build_story(
    blocks: Iterable[Block],
    body_font: str,
    code_font: str,
    base_font_size: int,
) -> List[object]:
    styles = getSampleStyleSheet()

    normal = ParagraphStyle(
        "ErrorBookNormal",
        parent=styles["Normal"],
        fontName=body_font,
        fontSize=base_font_size,
        leading=int(base_font_size * 1.45),
        spaceAfter=6,
    )
    h1 = ParagraphStyle(
        "ErrorBookH1",
        parent=styles["Heading1"],
        fontName=body_font,
        fontSize=base_font_size + 8,
        leading=int((base_font_size + 8) * 1.2),
        spaceBefore=10,
        spaceAfter=8,
    )
    h2 = ParagraphStyle(
        "ErrorBookH2",
        parent=styles["Heading2"],
        fontName=body_font,
        fontSize=base_font_size + 4,
        leading=int((base_font_size + 4) * 1.2),
        spaceBefore=10,
        spaceAfter=6,
    )
    h3 = ParagraphStyle(
        "ErrorBookH3",
        parent=styles["Heading3"],
        fontName=body_font,
        fontSize=base_font_size + 2,
        leading=int((base_font_size + 2) * 1.2),
        spaceBefore=8,
        spaceAfter=4,
    )

    story: List[object] = []
    for b in blocks:
        if b.kind == "para":
            text = " ".join(b.lines)
            story.append(Paragraph(_inline_to_rl_markup(text, code_font), normal))
        elif b.kind in ("h1", "h2", "h3"):
            text = b.lines[0] if b.lines else ""
            style = {"h1": h1, "h2": h2, "h3": h3}[b.kind]
            story.append(Paragraph(_inline_to_rl_markup(text, code_font), style))
        elif b.kind.startswith("h"):
            # Fallback: treat other heading levels as h3
            text = b.lines[0] if b.lines else ""
            story.append(Paragraph(_inline_to_rl_markup(text, code_font), h3))
        elif b.kind == "code":
            code_text = "\n".join(b.lines)
            story.append(
                Preformatted(
                    code_text,
                    ParagraphStyle(
                        "ErrorBookCode",
                        fontName=code_font,
                        fontSize=max(9, base_font_size - 1),
                        leading=int(max(9, base_font_size - 1) * 1.25),
                        backColor=None,
                    ),
                )
            )
            story.append(Spacer(1, 4))
        elif b.kind in ("ul", "ol"):
            is_ordered = b.kind == "ol"
            items: List[ListItem] = []
            for item in b.lines:
                items.append(ListItem(Paragraph(_inline_to_rl_markup(item, code_font), normal)))
            story.append(
                ListFlowable(
                    items,
                    bulletType="1" if is_ordered else "bullet",
                    start="1",
                    leftIndent=14,
                    bulletFontName=body_font,
                    bulletFontSize=base_font_size,
                    bulletOffsetY=0,
                )
            )
            story.append(Spacer(1, 6))
        else:
            # Unknown block type: render as plain text.
            text = " ".join(b.lines)
            story.append(Paragraph(_inline_to_rl_markup(text, code_font), normal))

    return story


def main() -> int:
    parser = argparse.ArgumentParser(description="Render Markdown to PDF (CJK-friendly) via ReportLab.")
    parser.add_argument("input_md", help="Input Markdown file path")
    parser.add_argument("output_pdf", help="Output PDF file path")
    parser.add_argument("--font-path", default=None, help="Path to a CJK-capable font file (.ttf/.otf/.ttc)")
    parser.add_argument("--font-size", type=int, default=12, help="Base font size (default: 12)")
    parser.add_argument("--pagesize", choices=["a4", "letter"], default="a4", help="Page size (default: a4)")
    parser.add_argument("--margin-mm", type=float, default=18.0, help="Page margin in mm (default: 18)")
    args = parser.parse_args()

    md = _read_text(args.input_md)
    blocks = _parse_blocks(md)

    font_path, subfont_index = _detect_cjk_font_path(args.font_path)
    body_font, code_font = _register_fonts(font_path, subfont_index)

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
        title=os.path.basename(args.output_pdf),
    )

    story = _build_story(blocks, body_font, code_font, args.font_size)
    doc.build(story)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
