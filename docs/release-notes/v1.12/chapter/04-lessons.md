# Lessons — v1.12

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **The `file://` protocol constraint forces good architecture.**
   No runtime dependencies, no CORS, no server -- just HTML/CSS/JS that opens in any browser. This becomes the foundation for all subsequent browser-based tools.
   _🤖 Status: `applied` (applied in `v1.43`) · lesson #59 · needs review_
   > LLM reasoning: v1.43 Gource pack continues the file://-compatible static HTML/JS pattern.

2. **Mirroring `.planning/` artifacts into browsable HTML creates a read-only view of project state.**
   The planning files remain the source of truth; the dashboard is a derived view. This separation means the dashboard can never corrupt planning data.
   _🤖 Status: `investigate` · lesson #60 · needs review_
   > LLM reasoning: Candidate 'Project AMIGA' snippet lacks detail tying it to .planning/ HTML mirroring separation.

3. **Dark theme with consistent layout across all pages establishes a visual identity early.**
   The dashboard pages look like they belong together, which matters when they'll be extended in v1.12.1, v1.15, and beyond.
---
   _⚙ Status: `applied` (applied in `v1.43`) · lesson #61_

4. **Auto-refresh with 3-second default interval could be expensive for large `.planning/` directories.**
   Polling every 3 seconds recalculates hashes even when nothing has changed. File system watch events would be more efficient but harder to implement portably.
   _⚙ Status: `investigate` · lesson #62_

5. **239 tests across 11 test files and 81% branch coverage leaves 19% uncovered.**
   For a dashboard that renders HTML from planning artifacts, the uncovered branches likely include edge cases in markdown parsing that could produce broken output.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #63_
