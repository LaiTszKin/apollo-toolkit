#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 is required." >&2
  exit 1
fi

exec python3 "$script_dir/docs_to_voice.py" "$@"
