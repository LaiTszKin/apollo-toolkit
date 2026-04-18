#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPORTLAB_AVAILABLE = importlib.util.find_spec("reportlab") is not None

if REPORTLAB_AVAILABLE:
    from reportlab.pdfgen import canvas


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "extract_pdf_text_pdfkit.swift"


@unittest.skipUnless(shutil.which("swift"), "swift is required for PDFKit script tests")
class ExtractPdfTextPdfkitTests(unittest.TestCase):
    def run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["swift", str(SCRIPT_PATH), *args],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_missing_path_prints_usage(self) -> None:
        result = self.run_script()
        self.assertEqual(result.returncode, 1)
        self.assertIn("Usage: swift scripts/extract_pdf_text_pdfkit.swift", result.stderr)

    def test_unreadable_pdf_reports_missing_file(self) -> None:
        result = self.run_script("/tmp/does-not-exist.pdf")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Unable to open PDF", result.stderr)

    @unittest.skipUnless(REPORTLAB_AVAILABLE, "reportlab is required to generate fixture PDFs")
    @unittest.skipUnless(sys.platform == "darwin", "PDFKit extraction only works on macOS")
    def test_extracts_text_from_generated_pdf(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_path = Path(temp_dir) / "sample.pdf"
            pdf = canvas.Canvas(str(pdf_path))
            pdf.drawString(72, 720, "Weekly event headline")
            pdf.showPage()
            pdf.drawString(72, 720, "Second page details")
            pdf.save()

            result = self.run_script(str(pdf_path))

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f"PDF_PATH={pdf_path}", result.stdout)
        self.assertIn("PAGE_COUNT=2", result.stdout)
        self.assertIn("=== PAGE 1 ===", result.stdout)
        self.assertIn("Weekly event headline", result.stdout)
        self.assertIn("Second page details", result.stdout)


if __name__ == "__main__":
    unittest.main()
