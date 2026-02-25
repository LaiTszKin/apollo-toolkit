import os
import unittest

from scripts.docs_to_voice import resolve_setting


class ResolveSettingTests(unittest.TestCase):
    def setUp(self):
        self.env_key = "DOCS_TO_VOICE_TEST_SETTING"
        self.previous = os.environ.get(self.env_key)
        os.environ.pop(self.env_key, None)

    def tearDown(self):
        os.environ.pop(self.env_key, None)
        if self.previous is not None:
            os.environ[self.env_key] = self.previous

    def test_cli_value_has_highest_priority(self):
        os.environ[self.env_key] = "env-value"
        result = resolve_setting("cli-value", self.env_key, {"DOCS_TO_VOICE_TEST_SETTING": "file-value"})
        self.assertEqual(result, "cli-value")

    def test_env_file_has_priority_over_process_env(self):
        os.environ[self.env_key] = "env-value"
        result = resolve_setting(None, self.env_key, {"DOCS_TO_VOICE_TEST_SETTING": "file-value"})
        self.assertEqual(result, "file-value")

    def test_blank_cli_value_falls_back_to_env_file(self):
        result = resolve_setting("   ", self.env_key, {"DOCS_TO_VOICE_TEST_SETTING": "file-value"})
        self.assertEqual(result, "file-value")

    def test_process_env_used_when_env_file_missing(self):
        os.environ[self.env_key] = "env-value"
        result = resolve_setting(None, self.env_key, {})
        self.assertEqual(result, "env-value")

    def test_default_used_when_no_source_available(self):
        result = resolve_setting(None, self.env_key, {}, "default-value")
        self.assertEqual(result, "default-value")


if __name__ == "__main__":
    unittest.main()
