#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./install_skills.sh [codex|openclaw]

Modes:
  codex     Install symlinks into ~/.codex/skills
  openclaw  Install symlinks into ~/.openclaw/workspace*/skills

Optional environment overrides:
  CODEX_SKILLS_DIR   Override codex skills destination path
  OPENCLAW_HOME      Override openclaw home path
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

collect_skills() {
  local dir
  SKILL_PATHS=()
  while IFS= read -r dir; do
    if [[ -f "$dir/SKILL.md" ]]; then
      SKILL_PATHS+=("$dir")
    fi
  done < <(find "$SCRIPT_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

  if [[ ${#SKILL_PATHS[@]} -eq 0 ]]; then
    echo "No skill folders found in: $SCRIPT_DIR" >&2
    exit 1
  fi
}

replace_with_symlink() {
  local src="$1"
  local target_root="$2"
  local name target

  name="$(basename "$src")"
  target="$target_root/$name"

  mkdir -p "$target_root"
  if [[ -e "$target" || -L "$target" ]]; then
    rm -rf "$target"
  fi
  ln -s "$src" "$target"
  echo "[linked] $target -> $src"
}

install_codex() {
  local codex_skills_dir
  codex_skills_dir="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"

  echo "Installing to codex: $codex_skills_dir"
  for src in "${SKILL_PATHS[@]}"; do
    replace_with_symlink "$src" "$codex_skills_dir"
  done
}

install_openclaw() {
  local openclaw_home workspace skills_dir
  local -a workspaces

  openclaw_home="${OPENCLAW_HOME:-$HOME/.openclaw}"

  workspaces=()
  while IFS= read -r workspace; do
    workspaces+=("$workspace")
  done < <(find "$openclaw_home" -mindepth 1 -maxdepth 1 -type d -name 'workspace*' | sort)

  if [[ ${#workspaces[@]} -eq 0 ]]; then
    echo "No workspace directories found under: $openclaw_home" >&2
    exit 1
  fi

  for workspace in "${workspaces[@]}"; do
    skills_dir="$workspace/skills"
    echo "Installing to openclaw workspace: $skills_dir"
    for src in "${SKILL_PATHS[@]}"; do
      replace_with_symlink "$src" "$skills_dir"
    done
  done
}

choose_mode() {
  local mode="${1:-}"

  if [[ -n "$mode" ]]; then
    echo "$mode"
    return
  fi

  echo "Select install mode:"
  echo "1) codex"
  echo "2) openclaw"
  read -r -p "Enter choice [1-2]: " choice

  case "$choice" in
    1) echo "codex" ;;
    2) echo "openclaw" ;;
    *)
      echo "Invalid choice." >&2
      exit 1
      ;;
  esac
}

main() {
  local mode

  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  mode="$(choose_mode "${1:-}")"
  collect_skills

  case "$mode" in
    codex) install_codex ;;
    openclaw) install_openclaw ;;
    *)
      usage
      exit 1
      ;;
  esac

  echo "Done."
}

main "${1:-}"
