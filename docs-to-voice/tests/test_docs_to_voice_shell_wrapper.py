#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "docs_to_voice.py"
SHELL_SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "docs_to_voice.sh"


class DocsToVoiceShellWrapperTests(unittest.TestCase):
    def test_shell_wrapper_execs_python_script_with_same_arguments(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            capture_path = Path(temp_dir) / "argv.json"
            fake_python = Path(temp_dir) / "python3"
            fake_python.write_text(
                f"#!{sys.executable}\n"
                "import json, os, sys\n"
                "with open(os.environ['CAPTURE_PATH'], 'w', encoding='utf-8') as handle:\n"
                "    json.dump(sys.argv[1:], handle)\n",
                encoding="utf-8",
            )
            fake_python.chmod(0o755)

            env = dict(os.environ)
            env["PATH"] = f"{temp_dir}:{env['PATH']}"
            env["CAPTURE_PATH"] = str(capture_path)

            result = subprocess.run(
                ["bash", str(SHELL_SCRIPT_PATH), "--input", "notes.md", "--project-dir", "/tmp/project"],
                capture_output=True,
                text=True,
                env=env,
                check=False,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            argv = json.loads(capture_path.read_text(encoding="utf-8"))
            self.assertEqual(argv[0], str(SCRIPT_PATH))
            self.assertEqual(argv[1:], ["--input", "notes.md", "--project-dir", "/tmp/project"])


if __name__ == "__main__":
    unittest.main()
