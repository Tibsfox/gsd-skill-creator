# Lessons — v1.49.30

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **The texture stack is a genuinely useful organizing principle.**
   Nanoscale (keratin structure) → material (fabric, foam, clay) → assembly (suit, puppet, plush) predicted where cross-domain bridges would exist before looking for them. The structure revealed the connections.
   _⚙ Status: `investigate` · lesson #416_

2. **Each craft domain has substantial professional literature.**
   124 sources across 6 domains confirms these are documented fields with peer-reviewed research, not just community wikis and forum posts. The 3-tier source quality system made this visible.
   _⚙ Status: `investigate` · lesson #417_

3. **Physical fabrication documentation is more complex than digital.**
   Fursuit fabrication (1,196 lines) was the largest module because physical materials have more failure modes — heat, adhesion, structural integrity, skin contact safety — than shader parameters.
   _⚙ Status: `investigate` · lesson #418_

4. **Wave 1 was executed in a prior session with agent dispatch**
   handoff state in STATE.md was sufficient but could include more detail on module content quality for the synthesizer.
   _🤖 Status: `applied` (applied in `v1.49.32`) · lesson #419 · needs review_
   > LLM reasoning: v1.49.32 'Release Integrity & Agent Heartbeat' addresses handoff/agent state visibility.

5. **The PNW index.html update was manual**
   a script to regenerate stats from the file system would prevent drift.
   _⚙ Status: `investigate` · lesson #420_

6. **Release notes were not written before the GitHub release was created**
   the release went out with a partial body. This is the gap that produced the publish-release.sh script in v1.49.31.
   _🤖 Status: `applied` (applied in `v1.49.32`) · lesson #421 · needs review_
   > LLM reasoning: v1.49.32 'Release Integrity' directly addresses release notes timing/completeness gap.
