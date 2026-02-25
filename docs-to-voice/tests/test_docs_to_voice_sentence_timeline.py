import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from scripts.docs_to_voice import (
    DocsToVoiceError,
    api_text_length_units,
    split_text_into_api_sentence_requests,
    write_sentence_timeline_files,
)


class ApiSentenceRequestTests(unittest.TestCase):
    def test_builds_one_request_per_sentence_by_default(self):
        source_text = "第一句。第二句！第三句？"
        sentences, request_items = split_text_into_api_sentence_requests(
            source_text=source_text,
            max_chars=None,
            length_func=api_text_length_units,
        )

        self.assertEqual(sentences, ["第一句。", "第二句！", "第三句？"])
        self.assertEqual([item["sentence_index"] for item in request_items], [0, 1, 2])
        self.assertEqual([item["text"] for item in request_items], sentences)

    def test_splits_oversized_sentence_and_keeps_sentence_index(self):
        source_text = "測" * 301
        sentences, request_items = split_text_into_api_sentence_requests(
            source_text=source_text,
            max_chars=600,
            length_func=api_text_length_units,
        )

        self.assertEqual(sentences, [source_text])
        self.assertEqual(len(request_items), 2)
        self.assertEqual([item["sentence_index"] for item in request_items], [0, 0])
        self.assertEqual(request_items[0]["text"], "測" * 300)
        self.assertEqual(request_items[1]["text"], "測")

    def test_raises_when_text_is_empty(self):
        with self.assertRaises(DocsToVoiceError):
            split_text_into_api_sentence_requests(
                source_text="   \n",
                max_chars=600,
                length_func=api_text_length_units,
            )


class SentenceTimelineTests(unittest.TestCase):
    def test_uses_sentence_audio_durations_for_timestamp(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = pathlib.Path(temp_dir)
            audio_path = temp_dir_path / "voice.wav"

            with patch("scripts.docs_to_voice.read_duration_seconds", return_value=2.0):
                write_sentence_timeline_files(
                    source_text="甲。乙。",
                    audio_path=audio_path,
                    sentence_durations=[1.2, 0.8],
                    timing_mode_hint="sentence-audio",
                )

            timeline_json_path = temp_dir_path / "voice.timeline.json"
            timeline_payload = json.loads(timeline_json_path.read_text(encoding="utf-8"))

            self.assertEqual(timeline_payload["timing_mode"], "sentence-audio")
            self.assertEqual(timeline_payload["sentences"][0]["start_ms"], 0)
            self.assertEqual(timeline_payload["sentences"][0]["end_ms"], 1200)
            self.assertEqual(timeline_payload["sentences"][1]["start_ms"], 1200)
            self.assertEqual(timeline_payload["sentences"][1]["end_ms"], 2000)

    def test_scales_sentence_duration_to_match_output_duration(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = pathlib.Path(temp_dir)
            audio_path = temp_dir_path / "voice.wav"

            with patch("scripts.docs_to_voice.read_duration_seconds", return_value=4.0):
                write_sentence_timeline_files(
                    source_text="甲。乙。",
                    audio_path=audio_path,
                    sentence_durations=[1.0, 1.0],
                    timing_mode_hint="sentence-audio",
                )

            timeline_json_path = temp_dir_path / "voice.timeline.json"
            timeline_payload = json.loads(timeline_json_path.read_text(encoding="utf-8"))

            self.assertEqual(timeline_payload["timing_mode"], "sentence-audio")
            self.assertEqual(timeline_payload["sentences"][0]["end_ms"], 2000)
            self.assertEqual(timeline_payload["sentences"][1]["end_ms"], 4000)

    def test_falls_back_when_sentence_duration_count_mismatched(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = pathlib.Path(temp_dir)
            audio_path = temp_dir_path / "voice.wav"

            with patch("scripts.docs_to_voice.read_duration_seconds", return_value=2.0):
                write_sentence_timeline_files(
                    source_text="甲。乙。",
                    audio_path=audio_path,
                    sentence_durations=[2.0],
                    timing_mode_hint="sentence-audio",
                )

            timeline_json_path = temp_dir_path / "voice.timeline.json"
            timeline_payload = json.loads(timeline_json_path.read_text(encoding="utf-8"))

            self.assertEqual(timeline_payload["timing_mode"], "duration-weighted")
            self.assertEqual(timeline_payload["sentences"][1]["end_ms"], 2000)


if __name__ == "__main__":
    unittest.main()
