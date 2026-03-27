# CHANGELOG Writing

Follow the existing changelog format. If none is defined, use Keep a Changelog style.

- Treat `## [Unreleased]` as the canonical source for pending release notes.
- During normal commit/push work, update only the `Unreleased` bullets that correspond to the current actual change set.
- Preserve unrelated pending bullets from other unfinished work, and remove stale or conflicting bullets when the current implementation supersedes them.
- During a version release, do not rebuild notes from `git diff`; move the curated `Unreleased` sections into the new version heading and then clear `Unreleased`.
- Add a new version heading with the release date (YYYY-MM-DD).
- Group entries under clear sections: Added, Changed, Fixed, Removed, Deprecated, Security.
- Write user-facing bullets; avoid commit hashes or internal-only details.
- Call out breaking changes explicitly.
