# Lessons — v1.43

4 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Visualization pipelines are developer experience investments, not features.**
   Gource videos make repository history tangible. The batch processing scripts turn a one-off demo into a repeatable workflow that can be run on every release.
   _⚙ Status: `investigate` · lesson #227_

2. **Avatar and caption systems turn raw visualization into annotated storytelling.**
   Without captions and avatars, a Gource video is a screensaver. With them, it's a presentation tool that maps commit activity to human contributors and project milestones.
   _🤖 Status: `investigate` · lesson #228 · needs review_
   > LLM reasoning: Candidate v1.49.26 is bio-physics sensing, entirely unrelated to avatar/caption systems.

3. **46 BATS tests for 45 files is roughly 1 test per file.**
   Shell scripts that generate videos, manage avatars, and handle batch processing across multiple repositories have many failure modes (missing dependencies, file path issues, permission errors). The test-to-file ratio suggests surface-level coverage.
   _🤖 Status: `investigate` · lesson #229 · needs review_
   > LLM reasoning: Candidate v1.44 is PyDMD dogfood; it doesn't address BATS test coverage for the shell scripts.

4. **No integration with the skill-creator test suite.**
   BATS tests run independently from the 16,000+ Vitest test suite. The total test count in the project doesn't include BATS, which means regression tracking has a blind spot.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #230_
