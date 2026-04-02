#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<"USAGE"
Usage:
  ./scripts/install_skills.sh [codex|openclaw|trae|agents|claude-code|all]...

Modes:
  codex       Copy skills into ~/.codex/skills (includes ./codex/ agent-specific skills)
  openclaw    Copy skills into ~/.openclaw/workspace*/skills
  trae        Copy skills into ~/.trae/skills
  agents      Copy skills into ~/.agents/skills (for agent-skill-compatible software)
  claude-code Copy skills into ~/.claude/skills
  all         Install all supported targets

Optional environment overrides:
  CODEX_SKILLS_DIR    Override codex skills destination path
  OPENCLAW_HOME       Override openclaw home path
  TRAE_SKILLS_DIR     Override trae skills destination path
  AGENTS_SKILLS_DIR   Override agents skills destination path
  CLAUDE_CODE_SKILLS_DIR Override claude-code skills destination path
  APOLLO_TOOLKIT_HOME  Override local install path used in curl/pipe mode
  APOLLO_TOOLKIT_REPO_URL Override git repository URL used in curl/pipe mode
USAGE
}

SCRIPT_SOURCE="${BASH_SOURCE[0]-}"
TOOLKIT_REPO_URL="${APOLLO_TOOLKIT_REPO_URL:-https://github.com/LaiTszKin/apollo-toolkit.git}"

expand_user_path() {
  local raw_path="${1-}"

  case "$raw_path" in
    "~")
      printf '%s\n' "$HOME"
      ;;
    "~/"*)
      printf '%s\n' "$HOME/${raw_path#~/}"
      ;;
    *)
      printf '%s\n' "$raw_path"
      ;;
  esac
}

TOOLKIT_HOME="$(expand_user_path "${APOLLO_TOOLKIT_HOME:-$HOME/.apollo-toolkit}")"

show_banner() {
  cat <<'BANNER'
+------------------------------------------+
|              Apollo Toolkit              |
|      npm installer and skill copier      |
+------------------------------------------+
BANNER
}

bootstrap_repo_if_needed() {
  if [[ -d "$TOOLKIT_HOME/.git" ]]; then
    git -C "$TOOLKIT_HOME" pull --ff-only >/dev/null
  else
    rm -rf "$TOOLKIT_HOME"
    git clone --depth 1 "$TOOLKIT_REPO_URL" "$TOOLKIT_HOME" >/dev/null
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
    REPO_ROOT="$TOOLKIT_HOME"
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

  # For codex mode, also include codex-specific skills
  if [[ " ${SELECTED_MODES[*]} " =~ " codex " ]]; then
    local codex_dir="$REPO_ROOT/codex"
    if [[ -d "$codex_dir" ]]; then
      while IFS= read -r dir; do
        if [[ -f "$dir/SKILL.md" ]]; then
          SKILL_PATHS+=("$dir")
        fi
      done < <(find "$codex_dir" -mindepth 1 -maxdepth 1 -type d | sort)
    fi
  fi

  if [[ ${#SKILL_PATHS[@]} -eq 0 ]]; then
    echo "No skill folders found in: $REPO_ROOT" >&2
    exit 1
  fi
}

replace_with_copy() {
  local src="$1"
  local target_root="$2"
  local name target

  name="$(basename "$src")"
  target="$target_root/$name"

  mkdir -p "$target_root"
  if [[ -e "$target" || -L "$target" ]]; then
    rm -rf "$target"
  fi
  cp -R "$src" "$target"
  echo "[copied] $src -> $target"
}

install_codex() {
  local codex_skills_dir
  codex_skills_dir="$(expand_user_path "${CODEX_SKILLS_DIR:-$HOME/.codex/skills}")"

  echo "Installing to codex: $codex_skills_dir"
  for src in "${SKILL_PATHS[@]}"; do
    replace_with_copy "$src" "$codex_skills_dir"
  done
}

install_openclaw() {
  local openclaw_home workspace skills_dir
  local -a workspaces

  openclaw_home="$(expand_user_path "${OPENCLAW_HOME:-$HOME/.openclaw}")"

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
      replace_with_copy "$src" "$skills_dir"
    done
  done
}

install_trae() {
  local trae_skills_dir
  trae_skills_dir="$(expand_user_path "${TRAE_SKILLS_DIR:-$HOME/.trae/skills}")"

  echo "Installing to trae: $trae_skills_dir"
  for src in "${SKILL_PATHS[@]}"; do
    replace_with_copy "$src" "$trae_skills_dir"
  done
}

install_agents() {
  local agents_skills_dir
  agents_skills_dir="$(expand_user_path "${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}")"

  echo "Installing to agents: $agents_skills_dir"
  for src in "${SKILL_PATHS[@]}"; do
    replace_with_copy "$src" "$agents_skills_dir"
  done
}

install_claude_code() {
  local claude_code_skills_dir
  claude_code_skills_dir="$(expand_user_path "${CLAUDE_CODE_SKILLS_DIR:-$HOME/.claude/skills}")"

  echo "Installing to claude-code: $claude_code_skills_dir"
  for src in "${SKILL_PATHS[@]}"; do
    replace_with_copy "$src" "$claude_code_skills_dir"
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
    codex|openclaw|trae|agents|claude-code)
      add_mode_once "$mode"
      ;;
    all)
      add_mode_once "codex"
      add_mode_once "openclaw"
      add_mode_once "trae"
      add_mode_once "agents"
      add_mode_once "claude-code"
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

  show_banner
  echo
  echo "Select install options (comma-separated):"
  echo "1) codex (~/.codex/skills, includes ./codex/ agent-specific skills)"
  echo "2) openclaw (~/.openclaw/workspace*/skills)"
  echo "3) trae (~/.trae/skills)"
  echo "4) agents (~/.agents/skills)"
  echo "5) claude-code (~/.claude/skills)"
  echo "6) all"
  choice="$(read_choice_from_user 'Enter choice(s) [1-6]: ')"

  IFS=',' read -r -a choices <<< "$choice"
  for raw_choice in "${choices[@]}"; do
    raw_choice="${raw_choice//[[:space:]]/}"
    case "$raw_choice" in
      1) add_mode_once "codex" ;;
      2) add_mode_once "openclaw" ;;
      3) add_mode_once "trae" ;;
      4) add_mode_once "agents" ;;
      5) add_mode_once "claude-code" ;;
      6) add_mode_once "codex"; add_mode_once "openclaw"; add_mode_once "trae"; add_mode_once "claude-code" ;;
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
      agents) install_agents ;;
      claude-code) install_claude_code ;;
      *)
        usage
        exit 1
        ;;
    esac
  done

  echo "Done."
}

main "$@"
