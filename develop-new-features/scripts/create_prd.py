#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def _default_template_path() -> Path:
    return Path(__file__).resolve().parent.parent / "references" / "prd-template.md"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a PRD from template with date-based filename.",
    )
    parser.add_argument("feature_name", help="Display name for the PRD title")
    parser.add_argument(
        "--slug",
        help="Optional kebab-case slug used for filename; defaults to slugified feature_name",
    )
    parser.add_argument(
        "--output-dir",
        default="docs/plans",
        help="Output directory (default: docs/plans)",
    )
    parser.add_argument(
        "--template",
        default=str(_default_template_path()),
        help="Path to PRD template file",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing file if present",
    )
    args = parser.parse_args()

    feature_name = args.feature_name.strip()
    if not feature_name:
        raise SystemExit("feature_name cannot be empty")

    slug = args.slug.strip() if args.slug else _slugify(feature_name)
    if not slug:
        raise SystemExit(
            "Unable to build a kebab-case slug. Provide --slug with ASCII letters/numbers."
        )

    template_path = Path(args.template).expanduser().resolve()
    if not template_path.exists():
        raise SystemExit(f"Template not found: {template_path}")

    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    today = date.today().isoformat()
    output_path = output_dir / f"{today}-{slug}.md"

    if output_path.exists() and not args.force:
        raise SystemExit(f"File already exists: {output_path}. Use --force to overwrite.")

    content = template_path.read_text(encoding="utf-8")
    content = content.replace("[YYYY-MM-DD]", today)
    content = content.replace("[功能名稱]", feature_name)

    output_path.write_text(content, encoding="utf-8")
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
