# Lessons — v1.49.13

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Append-only JSONL is the right persistence pattern for event streams.**
   Same pattern as will be used in v1.49.14's health log -- simple, auditable, no schema migrations, crash-safe with `fs.appendFile`.
   _⚙ Status: `investigate` · lesson #320_

2. **Telemetry patterns should map 1:1 to remediation actions.**
   A detected pattern without a concrete "what to do about it" is noise, not signal. The 7-pattern set is valuable because each one triggers a specific response.
   _⚙ Status: `investigate` · lesson #321_

3. **Bounded feedback loops are essential for self-improving systems.**
   The +/-20% cap per cycle prevents oscillation and ensures convergence requires sustained evidence, not a single outlier event.
   _🤖 Status: `applied` (applied in `v1.49.15`) · lesson #322 · needs review_
   > LLM reasoning: Self-Improving Mesh Architecture is the direct vehicle for the bounded ±20% feedback cap.

4. **102 new tests for a pipeline that has no production data yet.**
   The telemetry system is well-tested against synthetic events, but the 7 patterns were chosen based on anticipated behavior, not observed production signals. Real usage may reveal patterns not in the initial set.
   _🤖 Status: `investigate` · lesson #323 · needs review_
   > LLM reasoning: MCP pipeline snippet doesn't clearly indicate production telemetry replaced synthetic-event testing.

5. **90-day retention is a guess.**
   Seasonal pattern detection needs at least one full season (~90 days), but whether that's the right window depends on actual project cadence, which varies.
   _⚙ Status: `investigate` · lesson #324_
