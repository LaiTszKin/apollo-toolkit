#!/usr/bin/env python3
"""Render TeX formulas with the official KaTeX CLI and wrap the output for reuse."""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import sys
import tempfile
from typing import Iterable


DEFAULT_CSS_HREF = "https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css"


class KatexRenderError(Exception):
    """User-facing error for rendering failures."""


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="render_katex.py",
        description="Render TeX with KaTeX and emit insertion-ready output.",
    )

    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--tex", help="Raw TeX expression without delimiters.")
    input_group.add_argument("--input-file", help="Path to a UTF-8 text file containing raw TeX.")

    parser.add_argument(
        "--output-format",
        choices=("html-fragment", "html-page", "markdown-inline", "markdown-block", "json"),
        default="html-fragment",
        help="How to wrap the rendered KaTeX output.",
    )
    parser.add_argument(
        "--katex-format",
        choices=("html", "mathml", "htmlAndMathml"),
        default="htmlAndMathml",
        help="KaTeX internal output format.",
    )
    parser.add_argument("--display-mode", action="store_true", help="Render in display mode.")
    parser.add_argument("--output-file", help="Write the wrapped output to a file.")
    parser.add_argument("--css-href", default=DEFAULT_CSS_HREF, help="Stylesheet href for html-page/json output.")
    parser.add_argument("--title", default="KaTeX Render", help="Document title for html-page output.")
    parser.add_argument("--lang", default="en", help="HTML lang attribute for html-page output.")

    parser.add_argument("--macro", action="append", default=[], help="Macro definition in NAME:VALUE form.")
    parser.add_argument("--macro-file", help="Path to a JSON file mapping macro names to expansion strings.")
    parser.add_argument("--error-color", help="Hex color or CSS color name for parse errors.")
    parser.add_argument("--strict", help="KaTeX strict mode setting.")
    parser.add_argument("--trust", help="KaTeX trust mode setting.")
    parser.add_argument("--max-size", type=float, help="Maximum user-specified size in em.")
    parser.add_argument("--max-expand", type=int, help="Maximum macro expansion count.")
    parser.add_argument("--min-rule-thickness", type=float, help="Minimum rule thickness in em.")
    parser.add_argument("--leqno", action="store_true", help="Render display equations with left equation numbers.")
    parser.add_argument("--fleqn", action="store_true", help="Render display equations flush left.")
    parser.add_argument(
        "--color-is-text-color",
        action="store_true",
        help="Interpret \\\\color like legacy text color behavior.",
    )
    parser.add_argument(
        "--no-throw-on-error",
        action="store_true",
        help="Render invalid input with colored source text instead of failing.",
    )

    return parser.parse_args(argv)


def normalize_path(raw_path: str) -> pathlib.Path:
    path = pathlib.Path(raw_path).expanduser()
    if not path.is_absolute():
        path = pathlib.Path.cwd() / path
    return path.resolve()


def load_tex(args: argparse.Namespace) -> str:
    if args.input_file:
        path = normalize_path(args.input_file)
        if not path.is_file():
            raise KatexRenderError(f"Input file not found: {path}")
        return path.read_text(encoding="utf-8").strip()
    return (args.tex or "").strip()


def load_macro_pairs(values: Iterable[str]) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for raw_value in values:
        if ":" not in raw_value:
            raise KatexRenderError(f"Invalid --macro value '{raw_value}'. Use NAME:VALUE.")
        name, expansion = raw_value.split(":", 1)
        name = name.strip()
        expansion = expansion.strip()
        if not name or not expansion:
            raise KatexRenderError(f"Invalid --macro value '{raw_value}'. Use NAME:VALUE.")
        pairs.append((name, expansion))
    return pairs


def run_katex_cli(tex: str, args: argparse.Namespace) -> str:
    command = [
        "npx",
        "--yes",
        "--package",
        "katex",
        "katex",
        "--format",
        args.katex_format,
    ]

    if args.display_mode:
        command.append("--display-mode")
    if args.leqno:
        command.append("--leqno")
    if args.fleqn:
        command.append("--fleqn")
    if args.color_is_text_color:
        command.append("--color-is-text-color")
    if args.no_throw_on_error:
        command.append("--no-throw-on-error")

    if args.error_color:
        command.extend(["--error-color", args.error_color])
    if args.strict:
        command.extend(["--strict", args.strict])
    if args.trust:
        command.extend(["--trust", args.trust])
    if args.max_size is not None:
        command.extend(["--max-size", str(args.max_size)])
    if args.max_expand is not None:
        command.extend(["--max-expand", str(args.max_expand)])
    if args.min_rule_thickness is not None:
        command.extend(["--min-rule-thickness", str(args.min_rule_thickness)])

    for name, expansion in load_macro_pairs(args.macro):
        command.extend(["--macro", f"{name}:{expansion}"])

    if args.macro_file:
        macro_file = normalize_path(args.macro_file)
        if not macro_file.is_file():
            raise KatexRenderError(f"Macro file not found: {macro_file}")
        command.extend(["--macro-file", str(macro_file)])

    with tempfile.NamedTemporaryFile("w", suffix=".tex", encoding="utf-8", delete=False) as handle:
        handle.write(tex)
        handle.write("\n")
        temp_path = pathlib.Path(handle.name)

    try:
        command.extend(["--input", str(temp_path)])
        result = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    finally:
        temp_path.unlink(missing_ok=True)

    if result.returncode != 0:
        stderr = result.stderr.strip() or "KaTeX CLI failed."
        raise KatexRenderError(stderr)

    return result.stdout.strip()


def build_html_page(rendered_html: str, args: argparse.Namespace) -> str:
    css_link = ""
    if args.css_href.strip():
        css_link = f'  <link rel="stylesheet" href="{args.css_href.strip()}">\n'

    return (
        "<!DOCTYPE html>\n"
        f'<html lang="{args.lang}">\n'
        "<head>\n"
        '  <meta charset="utf-8">\n'
        f"  <title>{args.title}</title>\n"
        f"{css_link}"
        "</head>\n"
        "<body>\n"
        f"{rendered_html}\n"
        "</body>\n"
        "</html>\n"
    )


def wrap_output(rendered_html: str, tex: str, args: argparse.Namespace) -> str:
    if args.output_format == "html-fragment":
        return f"{rendered_html}\n"
    if args.output_format == "html-page":
        return build_html_page(rendered_html, args)
    if args.output_format == "markdown-inline":
        return f"{rendered_html}\n"
    if args.output_format == "markdown-block":
        return f"\n{rendered_html}\n"
    if args.output_format == "json":
        payload = {
            "tex": tex,
            "displayMode": args.display_mode,
            "katexFormat": args.katex_format,
            "cssHref": args.css_href,
            "content": rendered_html,
        }
        return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    raise KatexRenderError(f"Unsupported output format: {args.output_format}")


def write_output(content: str, output_file: str | None) -> None:
    if not output_file:
        sys.stdout.write(content)
        return

    path = normalize_path(output_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    sys.stdout.write(str(path) + "\n")


def main(argv: list[str]) -> int:
    try:
        args = parse_args(argv)
        tex = load_tex(args)
        if not tex:
            raise KatexRenderError("Input TeX is empty.")
        rendered_html = run_katex_cli(tex, args)
        wrapped = wrap_output(rendered_html, tex, args)
        write_output(wrapped, args.output_file)
        return 0
    except KatexRenderError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1
    except FileNotFoundError as exc:
        missing = exc.filename or "required executable"
        if os.path.basename(missing) in {"npx", "node"}:
            print("[ERROR] node and npx are required to render KaTeX.", file=sys.stderr)
            return 1
        raise


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
