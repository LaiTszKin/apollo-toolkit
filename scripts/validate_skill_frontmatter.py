#!/usr/bin/env python3
"""Validate SKILL.md frontmatter for all top-level skills."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
REQUIRED_KEYS = {"name", "description"}
MAX_DESCRIPTION_LENGTH = 1024


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def iter_skill_dirs(root: Path) -> list[Path]:
    return sorted(path for path in root.iterdir() if path.is_dir() and (path / "SKILL.md").is_file())


def extract_frontmatter(content: str) -> str:
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md must start with YAML frontmatter delimiter '---'.")

    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            return "\n".join(lines[1:index])

    raise ValueError("SKILL.md frontmatter is missing the closing '---' delimiter.")


def validate_skill(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_md = skill_dir / "SKILL.md"

    try:
        content = skill_md.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"{skill_md}: cannot read file ({exc})."]

    try:
        frontmatter_text = extract_frontmatter(content)
    except ValueError as exc:
        return [f"{skill_md}: {exc}"]

    try:
        frontmatter = yaml.safe_load(frontmatter_text)
    except yaml.YAMLError as exc:
        return [f"{skill_md}: invalid YAML in frontmatter ({exc})."]

    if not isinstance(frontmatter, dict):
        return [f"{skill_md}: frontmatter must be a YAML mapping."]

    keys = set(frontmatter.keys())
    if keys != REQUIRED_KEYS:
        missing = sorted(REQUIRED_KEYS - keys)
        extra = sorted(keys - REQUIRED_KEYS)
        if missing:
            errors.append(f"{skill_md}: missing required frontmatter keys: {', '.join(missing)}.")
        if extra:
            errors.append(f"{skill_md}: unsupported frontmatter keys: {', '.join(extra)}.")

    name = frontmatter.get("name")
    if not isinstance(name, str) or not name.strip():
        errors.append(f"{skill_md}: 'name' must be a non-empty string.")
    else:
        normalized_name = name.strip()
        if not NAME_PATTERN.fullmatch(normalized_name):
            errors.append(
                f"{skill_md}: 'name' must be kebab-case (lowercase letters, digits, and hyphens)."
            )
        if normalized_name != skill_dir.name:
            errors.append(
                f"{skill_md}: frontmatter name '{normalized_name}' must match folder name '{skill_dir.name}'."
            )

    description = frontmatter.get("description")
    if not isinstance(description, str) or not description.strip():
        errors.append(f"{skill_md}: 'description' must be a non-empty string.")
    elif len(description) > MAX_DESCRIPTION_LENGTH:
        errors.append(
            f"{skill_md}: invalid description: exceeds maximum length of "
            f"{MAX_DESCRIPTION_LENGTH} characters"
        )

    return errors


def main() -> int:
    root = repo_root()
    skill_dirs = iter_skill_dirs(root)
    if not skill_dirs:
        print("No top-level skill directories found.")
        return 1

    all_errors: list[str] = []
    for skill_dir in skill_dirs:
        all_errors.extend(validate_skill(skill_dir))

    if all_errors:
        print("SKILL.md frontmatter validation failed:")
        for error in all_errors:
            print(f"- {error}")
        return 1

    print(f"SKILL.md frontmatter validation passed for {len(skill_dirs)} skills.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
