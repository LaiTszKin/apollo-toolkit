#!/usr/bin/env python3
"""Validate agents/openai.yaml for all top-level skills."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

TOP_LEVEL_ALLOWED_KEYS = {"interface", "dependencies", "policy"}
INTERFACE_REQUIRED_KEYS = {"display_name", "short_description", "default_prompt"}
INTERFACE_ALLOWED_KEYS = {
    "display_name",
    "short_description",
    "default_prompt",
    "icon_small",
    "icon_large",
    "brand_color",
}
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def iter_skill_dirs(root: Path) -> list[Path]:
    return sorted(path for path in root.iterdir() if path.is_dir() and (path / "SKILL.md").is_file())


def extract_frontmatter(content: str) -> dict[str, object]:
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md must start with YAML frontmatter delimiter '---'.")

    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            raw_frontmatter = "\n".join(lines[1:index])
            parsed = yaml.safe_load(raw_frontmatter)
            if not isinstance(parsed, dict):
                raise ValueError("SKILL.md frontmatter must be a YAML mapping.")
            return parsed

    raise ValueError("SKILL.md frontmatter is missing the closing '---' delimiter.")


def require_non_empty_string(container: dict[str, object], key: str, context: str, errors: list[str]) -> None:
    value = container.get(key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{context}: '{key}' must be a non-empty string.")


def validate_dependencies(dependencies: object, context: str, errors: list[str]) -> None:
    if not isinstance(dependencies, dict):
        errors.append(f"{context}: 'dependencies' must be a mapping.")
        return

    tools = dependencies.get("tools")
    if tools is None:
        return
    if not isinstance(tools, list):
        errors.append(f"{context}: 'dependencies.tools' must be a list.")
        return

    for index, item in enumerate(tools):
        item_context = f"{context}: dependencies.tools[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{item_context} must be a mapping.")
            continue
        require_non_empty_string(item, "type", item_context, errors)
        require_non_empty_string(item, "value", item_context, errors)

        tool_type = item.get("type")
        if isinstance(tool_type, str) and tool_type != "mcp":
            errors.append(f"{item_context}: unsupported tool type '{tool_type}', only 'mcp' is allowed.")

        for optional_key in ("description", "transport", "url"):
            optional_value = item.get(optional_key)
            if optional_value is not None and (not isinstance(optional_value, str) or not optional_value.strip()):
                errors.append(f"{item_context}: '{optional_key}' must be a non-empty string when provided.")


def validate_policy(policy: object, context: str, errors: list[str]) -> None:
    if not isinstance(policy, dict):
        errors.append(f"{context}: 'policy' must be a mapping.")
        return

    allow_implicit = policy.get("allow_implicit_invocation")
    if allow_implicit is not None and not isinstance(allow_implicit, bool):
        errors.append(
            f"{context}: 'policy.allow_implicit_invocation' must be a boolean when provided."
        )


def validate_skill(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    skill_md = skill_dir / "SKILL.md"
    openai_yaml = skill_dir / "agents" / "openai.yaml"

    try:
        skill_frontmatter = extract_frontmatter(skill_md.read_text(encoding="utf-8"))
    except (OSError, ValueError, yaml.YAMLError) as exc:
        return [f"{skill_md}: unable to read skill name for validation ({exc})."]

    skill_name = skill_frontmatter.get("name")
    if not isinstance(skill_name, str) or not skill_name.strip():
        return [f"{skill_md}: frontmatter 'name' must be a non-empty string."]

    if not openai_yaml.is_file():
        return [f"{openai_yaml}: file is required for every skill."]

    try:
        parsed = yaml.safe_load(openai_yaml.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        return [f"{openai_yaml}: invalid YAML ({exc})."]

    if not isinstance(parsed, dict):
        return [f"{openai_yaml}: top-level structure must be a YAML mapping."]

    top_level_keys = set(parsed.keys())
    unsupported_top_keys = sorted(top_level_keys - TOP_LEVEL_ALLOWED_KEYS)
    if unsupported_top_keys:
        errors.append(
            f"{openai_yaml}: unsupported top-level keys: {', '.join(unsupported_top_keys)}."
        )

    interface = parsed.get("interface")
    if not isinstance(interface, dict):
        errors.append(f"{openai_yaml}: 'interface' must be a mapping.")
        return errors

    missing_interface_keys = sorted(INTERFACE_REQUIRED_KEYS - set(interface.keys()))
    if missing_interface_keys:
        errors.append(
            f"{openai_yaml}: missing required interface keys: {', '.join(missing_interface_keys)}."
        )

    unsupported_interface_keys = sorted(set(interface.keys()) - INTERFACE_ALLOWED_KEYS)
    if unsupported_interface_keys:
        errors.append(
            f"{openai_yaml}: unsupported interface keys: {', '.join(unsupported_interface_keys)}."
        )

    for required_key in sorted(INTERFACE_REQUIRED_KEYS):
        require_non_empty_string(interface, required_key, str(openai_yaml), errors)

    default_prompt = interface.get("default_prompt")
    expected_skill_ref = f"${skill_name.strip()}"
    if isinstance(default_prompt, str) and expected_skill_ref not in default_prompt:
        errors.append(
            f"{openai_yaml}: interface.default_prompt must reference '{expected_skill_ref}'."
        )

    brand_color = interface.get("brand_color")
    if brand_color is not None:
        if not isinstance(brand_color, str) or not HEX_COLOR_PATTERN.fullmatch(brand_color):
            errors.append(f"{openai_yaml}: interface.brand_color must be a hex color like '#1A2B3C'.")

    dependencies = parsed.get("dependencies")
    if dependencies is not None:
        validate_dependencies(dependencies, str(openai_yaml), errors)

    policy = parsed.get("policy")
    if policy is not None:
        validate_policy(policy, str(openai_yaml), errors)

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
        print("agents/openai.yaml validation failed:")
        for error in all_errors:
            print(f"- {error}")
        return 1

    print(f"agents/openai.yaml validation passed for {len(skill_dirs)} skills.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
