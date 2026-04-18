#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPORTLAB_AVAILABLE = importlib.util.find_spec("reportlab") is not None

if REPORTLAB_AVAILABLE:
    from reportlab.platypus import Paragraph
    SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "render_error_book_json_to_pdf.py"
    SPEC = importlib.util.spec_from_file_location("render_error_book_json_to_pdf", SCRIPT_PATH)
    MODULE = importlib.util.module_from_spec(SPEC)
    SPEC.loader.exec_module(MODULE)
else:
    Paragraph = object
    MODULE = None


def minimal_payload() -> dict:
    return {
        "title": "Physics Error Book",
        "book_type": "mc-question",
        "last_updated": "2026-04-18",
        "coverage_scope": [
            {
                "source_path": "notes/ch1.pdf",
                "included_questions": ["Q1", "Q2"],
                "notes": "Kinematics review",
            }
        ],
        "mistake_overview": [
            {
                "type": "Concept mix-up",
                "summary": "Mixed up displacement and distance.",
                "representative_questions": ["Q1"],
            }
        ],
        "concept_highlights": [
            {
                "name": "Velocity",
                "definition": "Rate of change of displacement.",
                "common_misjudgment": "Treating it as always positive speed.",
                "checklist": ["Track sign", "Check reference direction"],
            }
        ],
        "questions": [
            {
                "question_id": "Q1",
                "source_path": "notes/ch1.pdf",
                "page_or_locator": "p.3",
                "user_answer": "B",
                "correct_answer": "C",
                "mistake_type": "Concept mix-up",
                "concepts": ["Velocity", "Displacement"],
                "stem": "A car turns around after 10 seconds.",
                "why_wrong": "The answer used total distance instead of signed displacement.",
                "correct_solution_steps": ["Identify direction", "Compute signed displacement"],
                "options": [
                    {"label": "A", "text": "0", "verdict": "wrong", "reason": "Ignores movement"},
                    {"label": "C", "text": "-2", "verdict": "correct", "reason": "Signed displacement"},
                ],
            }
        ],
    }


@unittest.skipUnless(REPORTLAB_AVAILABLE, "reportlab is required for PDF rendering tests")
class RenderErrorBookTests(unittest.TestCase):
    def test_safe_text_handles_lists_numbers_and_defaults(self) -> None:
        self.assertEqual(MODULE._safe_text([" A ", 2, ""], default="-"), "A, 2")
        self.assertEqual(MODULE._safe_text(None, default="(none)"), "(none)")
        self.assertEqual(MODULE._safe_text("   ", default="fallback"), "fallback")

    def test_markup_escapes_html_and_preserves_line_breaks(self) -> None:
        rendered = MODULE._markup("A < B\nline 2")
        self.assertIn("A &lt; B", rendered)
        self.assertIn("<br/>", rendered)

    def test_bullet_lines_returns_default_paragraph_when_empty(self) -> None:
        styles = MODULE._build_styles("Helvetica", 11)
        bullets = MODULE._bullet_lines([], styles, empty_text="No data")
        self.assertEqual(len(bullets), 1)
        self.assertIsInstance(bullets[0], Paragraph)

    def test_build_story_contains_multiple_sections(self) -> None:
        font_path, subfont_index = MODULE._detect_cjk_font_path(None)
        font_name = MODULE._register_font(font_path, subfont_index)
        styles = MODULE._build_styles(font_name, 11)

        with tempfile.TemporaryDirectory() as temp_dir:
            output_pdf = Path(temp_dir) / "preview.pdf"
            doc = MODULE.SimpleDocTemplate(
                str(output_pdf),
                title="Physics Error Book",
            )
            story = MODULE._build_story(minimal_payload(), styles, doc)

        self.assertGreater(len(story), 10)
        self.assertEqual(story[1].text, "Physics Error Book")

    def test_main_renders_pdf_from_minimal_payload(self) -> None:
        font_path, _ = MODULE._detect_cjk_font_path(None)

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_root = Path(temp_dir)
            input_json = temp_root / "error-book.json"
            output_pdf = temp_root / "out" / "error-book.pdf"
            input_json.write_text(json.dumps(minimal_payload(), ensure_ascii=False), encoding="utf-8")

            argv = [
                str(input_json),
                str(output_pdf),
                "--font-path",
                font_path,
                "--font-size",
                "10",
            ]

            with patch("sys.argv", ["render_error_book_json_to_pdf.py", *argv]):
                exit_code = MODULE.main()

            self.assertEqual(exit_code, 0)
            self.assertTrue(output_pdf.is_file())
            self.assertTrue(output_pdf.read_bytes().startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
