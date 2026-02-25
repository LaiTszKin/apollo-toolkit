import http.client
import unittest
from unittest.mock import patch

from scripts.docs_to_voice import (
    DocsToVoiceError,
    api_text_length_units,
    discover_api_max_chars,
    extract_max_chars_from_text,
    fetch_api_model_max_chars,
    is_max_chars_disabled,
    probe_api_max_chars,
    request_model_studio_audio,
    split_text_for_tts,
)


class ExtractMaxCharsFromTextTests(unittest.TestCase):
    def test_extracts_limit_from_range_message(self):
        message = (
            "Model Studio TTS request failed (HTTP 400): "
            "InvalidParameter: Range of input length should be [0, 600]"
        )
        self.assertEqual(extract_max_chars_from_text(message), 600)

    def test_extracts_limit_with_comma(self):
        message = "Maximum input length is 1,200 characters."
        self.assertEqual(extract_max_chars_from_text(message), 1200)

    def test_extracts_limit_from_chinese_message(self):
        message = "請求失敗：輸入長度上限為 600 字元"
        self.assertEqual(extract_max_chars_from_text(message), 600)

    def test_returns_none_for_unrelated_message(self):
        self.assertIsNone(extract_max_chars_from_text("network timeout"))


class MaxCharsDisabledTests(unittest.TestCase):
    def test_zero_string_disables_chunking(self):
        self.assertTrue(is_max_chars_disabled("0"))

    def test_non_zero_does_not_disable_chunking(self):
        self.assertFalse(is_max_chars_disabled("1200"))


class ApiTextLengthUnitsTests(unittest.TestCase):
    def test_counts_chinese_as_two_units(self):
        self.assertEqual(api_text_length_units("AB測試!"), 7)

    def test_split_text_respects_weighted_units(self):
        chunks = split_text_for_tts("測" * 301, 600, length_func=api_text_length_units)
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0], "測" * 300)
        self.assertEqual(chunks[1], "測")


class FetchApiModelMaxCharsTests(unittest.TestCase):
    @patch("scripts.docs_to_voice.fetch_json_payload")
    def test_fetches_limit_from_model_catalog(self, mock_fetch_json_payload):
        mock_fetch_json_payload.return_value = {
            "output": {
                "total": 1,
                "models": [
                    {
                        "model": "qwen3-tts",
                        "model_info": {"max_input_tokens": 600},
                    }
                ],
            }
        }

        result = fetch_api_model_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
        )

        self.assertEqual(result, 600)

    @patch("scripts.docs_to_voice.fetch_json_payload")
    def test_returns_none_when_catalog_request_fails(self, mock_fetch_json_payload):
        mock_fetch_json_payload.side_effect = RuntimeError("network error")

        result = fetch_api_model_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
        )

        self.assertIsNone(result)

    @patch("scripts.docs_to_voice.fetch_json_payload")
    def test_fetches_limit_from_later_page_when_needed(self, mock_fetch_json_payload):
        mock_fetch_json_payload.side_effect = [
            {
                "output": {
                    "total": 101,
                    "models": [{"model": "other-model", "model_info": {}}],
                }
            },
            {
                "output": {
                    "total": 101,
                    "models": [
                        {
                            "model": "qwen3-tts",
                            "description": "Range of input length should be [0, 800]",
                        }
                    ],
                }
            },
        ]

        result = fetch_api_model_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
        )

        self.assertEqual(result, 800)
        self.assertEqual(mock_fetch_json_payload.call_count, 2)


class ProbeApiMaxCharsTests(unittest.TestCase):
    @patch("scripts.docs_to_voice.request_model_studio_audio")
    def test_probe_extracts_limit_from_api_error(self, mock_request_model_studio_audio):
        mock_request_model_studio_audio.side_effect = DocsToVoiceError(
            "Model Studio TTS request failed (HTTP 400): "
            "InvalidParameter: Range of input length should be [0, 600]"
        )

        result = probe_api_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
            voice="Cherry",
        )

        self.assertEqual(result, 600)

    @patch("scripts.docs_to_voice.request_model_studio_audio")
    def test_probe_returns_none_when_probe_request_succeeds(self, mock_request_model_studio_audio):
        mock_request_model_studio_audio.return_value = {
            "audio_url": "https://example.com/audio.wav",
            "audio_data": "",
            "audio_format": "wav",
        }

        result = probe_api_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
            voice="Cherry",
        )

        self.assertIsNone(result)


class DiscoverApiMaxCharsTests(unittest.TestCase):
    @patch("scripts.docs_to_voice.probe_api_max_chars")
    @patch("scripts.docs_to_voice.fetch_api_model_max_chars")
    def test_prefers_catalog_limit(self, mock_fetch_api_model_max_chars, mock_probe_api_max_chars):
        mock_fetch_api_model_max_chars.return_value = 700

        result = discover_api_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
            voice="Cherry",
        )

        self.assertEqual(result, 700)
        mock_probe_api_max_chars.assert_not_called()

    @patch("scripts.docs_to_voice.probe_api_max_chars")
    @patch("scripts.docs_to_voice.fetch_api_model_max_chars")
    def test_falls_back_to_probe_limit(self, mock_fetch_api_model_max_chars, mock_probe_api_max_chars):
        mock_fetch_api_model_max_chars.return_value = None
        mock_probe_api_max_chars.return_value = 600

        result = discover_api_max_chars(
            api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            api_key="test-key",
            model="qwen3-tts",
            voice="Cherry",
        )

        self.assertEqual(result, 600)
        mock_probe_api_max_chars.assert_called_once()


class RequestModelStudioAudioTests(unittest.TestCase):
    @patch("scripts.docs_to_voice.urllib.request.urlopen")
    def test_wraps_http_client_disconnect_as_user_error(self, mock_urlopen):
        mock_urlopen.side_effect = http.client.RemoteDisconnected(
            "Remote end closed connection without response"
        )

        with self.assertRaisesRegex(DocsToVoiceError, "Remote end closed connection"):
            request_model_studio_audio(
                api_endpoint="https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
                api_key="test-key",
                model="qwen3-tts",
                voice="Cherry",
                text="test",
            )


if __name__ == "__main__":
    unittest.main()
