import unittest

from scripts.docs_to_voice import (
    DocsToVoiceError,
    build_atempo_filter_chain,
    scale_sentence_durations,
    validate_speech_rate,
)


class ValidateSpeechRateTests(unittest.TestCase):
    def test_accepts_positive_float(self):
        self.assertEqual(validate_speech_rate("1.25"), 1.25)

    def test_returns_none_for_blank_value(self):
        self.assertIsNone(validate_speech_rate("   "))

    def test_rejects_non_positive_value(self):
        with self.assertRaisesRegex(DocsToVoiceError, "--speech-rate"):
            validate_speech_rate("0")

    def test_rejects_non_numeric_value(self):
        with self.assertRaisesRegex(DocsToVoiceError, "--speech-rate"):
            validate_speech_rate("fast")

    def test_rejects_non_finite_values(self):
        for value in ("nan", "inf", "-inf"):
            with self.subTest(value=value):
                with self.assertRaisesRegex(DocsToVoiceError, "--speech-rate"):
                    validate_speech_rate(value)


class BuildAtempoFilterChainTests(unittest.TestCase):
    def test_builds_single_stage_filter(self):
        self.assertEqual(build_atempo_filter_chain(1.25), "atempo=1.25")

    def test_builds_multi_stage_filter_for_high_rate(self):
        self.assertEqual(build_atempo_filter_chain(4.0), "atempo=2.0,atempo=2.0")

    def test_builds_multi_stage_filter_for_low_rate(self):
        self.assertEqual(build_atempo_filter_chain(0.25), "atempo=0.5,atempo=0.5")


class ScaleSentenceDurationsTests(unittest.TestCase):
    def test_scales_all_sentence_durations(self):
        self.assertEqual(
            scale_sentence_durations([1.2, 0.8], 2.0),
            [0.6, 0.4],
        )

    def test_returns_original_when_rate_is_one(self):
        values = [1.2, 0.8]
        self.assertEqual(scale_sentence_durations(values, 1.0), values)


if __name__ == "__main__":
    unittest.main()
