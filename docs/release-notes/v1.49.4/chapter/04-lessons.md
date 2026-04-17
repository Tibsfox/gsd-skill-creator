# Lessons — v1.49.4

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Purely additive changes are the safest way to introduce structural features.**
   By creating new directories rather than moving existing files, the 97 new tests only need to validate new behavior -- no regression surface.
   _⚙ Status: `investigate` · lesson #277_

2. **Config schemas should work with zero configuration and fail loudly with bad configuration.**
   The Zod validation + defaults pattern in `.sc-config.json` is reusable across the project.
   _⚙ Status: `investigate` · lesson #278_

3. **Filesystem management layers need explicit path traversal prevention.**
   Any module that creates directories from user input must validate names before touching the filesystem.
   _🤖 Status: `investigate` · lesson #279 · needs review_
   > LLM reasoning: Filesystem reorganization doesn't explicitly indicate path traversal validation was added.

4. **97 tests across 7 files for ~630 LOC of source.**
   The test-to-source ratio (15%) is healthy, but the CLI commands (280 LOC) have proportionally less coverage than the core modules.
   _🤖 Status: `investigate` · lesson #280 · needs review_
   > LLM reasoning: Filesystem reorganization doesn't directly address CLI command test coverage gap.

5. **Four new top-level directories add cognitive load.**
   Going from an already-crowded root to adding `projects/`, `contrib/`, `packs/`, `www/` works architecturally but increases the surface area a new contributor must understand.
   _⚙ Status: `investigate` · lesson #281_
