# Lessons — v1.49

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Communication protocols need drift measurement built in from day one.**
   The retrospective analyzer (Phase 450) with weighted drift scores and pattern detection is what makes DACP self-correcting. Without it, fidelity levels would be static guesses.
   _⚙ Status: `investigate` · lesson #260_

2. **Cooldown enforcement prevents oscillation.**
   7-day promote and 14-day demote cooldowns (SAFE-05) prevent the fidelity model from flip-flopping between levels. The asymmetric window — slower to demote than promote — builds trust in the system's stability.
   _⚙ Status: `investigate` · lesson #261_

3. **Wave planning pays off at 11-phase scale.**
   5 waves with 3 parallel pairs kept the build on schedule. Sequential Wave 0 (types → format) was the right foundation order; parallel Wave 2 (analyzer+library | templates+bus) had zero merge conflicts.
   _🤖 Status: `applied` (applied in `v1.49.60`) · lesson #262 · needs review_
   > LLM reasoning: Inclusionary Wave release reflects continued wave-based planning at scale.

4. **Append-only JSONL persistence is the right default for observability data.**
   Drift history, pattern records, and assembly rationale all use JSONL. No schema migrations, natural audit trail, trivial to query with grep.
   _🤖 Status: `investigate` · lesson #263 · needs review_
   > LLM reasoning: Candidate release about voxel/cedar/data registry has no clear connection to JSONL persistence patterns.

5. **3 CLI field name mismatches shipped as accepted tech debt.**
   The `pattern` vs `handoff_type` mismatch across dacp-status, dacp-history, and dacp-analyze is presentation-only but creates confusion when reading code. Should have been caught in Phase 455 before verification.
   _🤖 Status: `applied` (applied in `v1.49.1`) · lesson #264 · needs review_
   > LLM reasoning: v1.49.1 explicitly delivers DACP CLI Field Alignment patch addressing the named mismatch.

6. **22.7K LOC across 11 phases is dense for a communication protocol.**
   The scope grew from bundle format to include dashboard, CLI, templates, and bus integration. A tighter scope would have shipped the core protocol faster and added extensions incrementally.
   _🤖 Status: `investigate` · lesson #265 · needs review_
   > LLM reasoning: Chorus Protocol release doesn't visibly demonstrate tighter scoping in response to the 22.7K LOC concern.
