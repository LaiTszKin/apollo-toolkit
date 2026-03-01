#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<"USAGE"
Usage:
  ./scripts/install_skills.sh [codex|openclaw|trae|all]...

Modes:
  codex     Install symlinks into ~/.codex/skills
  openclaw  Install symlinks into ~/.openclaw/workspace*/skills
  trae      Install symlinks into ~/.trae/skills
  all       Install all supported targets

Optional environment overrides:
  CODEX_SKILLS_DIR   Override codex skills destination path
  OPENCLAW_HOME      Override openclaw home path
  TRAE_SKILLS_DIR    Override trae skills destination path
  APOLLO_TOOLKIT_REPO_DIR Override local clone path used in curl/pipe mode
  APOLLO_TOOLKIT_REPO_URL Override git repository URL used in curl/pipe mode
USAGE
}

SCRIPT_SOURCE="${BASH_SOURCE[0]-}"
TOOLKIT_REPO_URL="${APOLLO_TOOLKIT_REPO_URL:-https://github.com/LaiTszKin/apollo-toolkit.git}"
TOOLKIT_REPO_DIR="${APOLLO_TOOLKIT_REPO_DIR:-$HOME/.apollo-toolkit-repo}"

bootstrap_repo_if_needed() {
  if [[ -d "$TOOLKIT_REPO_DIR/.git" ]]; then
    git -C "$TOOLKIT_REPO_DIR" pull --ff-only >/dev/null
  else
    git clone --depth 1 "$TOOLKIT_REPO_URL" "$TOOLKIT_REPO_DIR" >/dev/null
  fi
}

if [[ -n "$SCRIPT_SOURCE" && -f "$SCRIPT_SOURCE" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  # curl/pipe mode: use current directory only when it looks like this repo.
  if find "$PWD" -mindepth 1 -maxdepth 1 -type d -exec test -f '{}/SKILL.md' ';' -print -quit | grep -q .; then
    REPO_ROOT="$PWD"
  else
    bootstrap_repo_if_needed
    REPO_ROOT="$TOOLKIT_REPO_DIR"
  fi
  SCRIPT_DIR="$REPO_ROOT/scripts"
fi
SELECTED_MODES=()
SKILL_PATHS=()

collect_skills() {
  local dir
  SKILL_PATHS=()
  while IFS= read -r dir; do
    if [[ -f "$dir/SKILL.md" ]]; then
      SKILL_PATHS+=("$dir")
    fi
  done < <(find "$REPO_ROOT" -mindepth 1 -maxdepth 1 -type d | sort)

  if [[ ${#SKILL_PATHS[@]} -eq 0 ]]; then
    echo "No skill folders found in: $REPO_ROOT" >&2
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

install_trae() {
  local trae_skills_dir
  trae_skills_dir="${TRAE_SKILLS_DIR:-$HOME/.trae/skills}"

  echo "Installing to trae: $trae_skills_dir"
  for src in "${SKILL_PATHS[@]}"; do
    replace_with_symlink "$src" "$trae_skills_dir"
  done
}

add_mode_once() {
  local mode="$1"
  local existing

  if [[ ${#SELECTED_MODES[@]} -gt 0 ]]; then
    for existing in "${SELECTED_MODES[@]}"; do
      if [[ "$existing" == "$mode" ]]; then
        return
      fi
    done
  fi
  SELECTED_MODES+=("$mode")
}

parse_mode() {
  local mode="$1"

  case "$mode" in
    codex|openclaw|trae)
      add_mode_once "$mode"
      ;;
    all)
      add_mode_once "codex"
      add_mode_once "openclaw"
      add_mode_once "trae"
      ;;
    *)
      echo "Invalid mode: $mode" >&2
      usage
      exit 1
      ;;
  esac
}

read_choice_from_user() {
  local prompt="$1"
  local result

  if [[ -t 0 ]]; then
    read -r -p "$prompt" result
  elif [[ -r /dev/tty ]]; then
    read -r -p "$prompt" result < /dev/tty
  else
    echo "Interactive input unavailable. Pass mode arguments (e.g. codex/openclaw/trae/all)." >&2
    exit 1
  fi

  printf '%s' "$result"
}

choose_modes_interactive() {
  local choice raw_choice
  local -a choices

  echo "Select install options (comma-separated):"
  echo "1) codex (~/.codex/skills)"
  echo "2) openclaw (~/.openclaw/workspace*/skills)"
  echo "3) trae (~/.trae/skills)"
  echo "4) all"
  choice="$(read_choice_from_user 'Enter choice(s) [1-4]: ')"

  IFS=',' read -r -a choices <<< "$choice"
  for raw_choice in "${choices[@]}"; do
    raw_choice="${raw_choice//[[:space:]]/}"
    case "$raw_choice" in
      1) add_mode_once "codex" ;;
      2) add_mode_once "openclaw" ;;
      3) add_mode_once "trae" ;;
      4) add_mode_once "codex"; add_mode_once "openclaw"; add_mode_once "trae" ;;
      *)
        echo "Invalid choice: $raw_choice" >&2
        exit 1
        ;;
    esac
  done

  if [[ ${#SELECTED_MODES[@]} -eq 0 ]]; then
    echo "No install option selected." >&2
    exit 1
  fi
}

resolve_modes() {
  local mode

  if [[ $# -eq 0 ]]; then
    choose_modes_interactive
    return
  fi

  for mode in "$@"; do
    parse_mode "$mode"
  done
}

main() {
  local mode
  SELECTED_MODES=()

  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  resolve_modes "$@"
  collect_skills

  for mode in "${SELECTED_MODES[@]}"; do
    case "$mode" in
      codex) install_codex ;;
      openclaw) install_openclaw ;;
      trae) install_trae ;;
      *)
        usage
        exit 1
        ;;
    esac
  done

  echo "Done."
}

main "$@"
