# 04 — Lessons Learned: v1.49.724 Forward Lessons

## 0 new lessons; ESTABLISHED Lesson #10408 sustained obs#9

| Lesson | Cumulative obs | Status |
|---|---|---|
| #10168 counter-cadence cleanup cadence | obs#9 | ESTABLISHED |
| #10406 candidate positive-framing dispatch | obs#13 | candidate (far above promotion threshold) |
| #10407 candidate dispatch-prompt-density | obs#12 | candidate (far above promotion threshold) |
| #10408 per-mission sub-agent rebuild | obs#9 | **ESTABLISHED** |
| W3.5 chapter-gen bake-in | obs#16 | (process gate) |

## Brief-discipline pattern composition validation

v1.126 applied 4 brief-discipline patterns simultaneously without interference:
1. Extended pre-launch verification campaign framed as engineering-discipline-rigor
2. Edwards landing framed as weather-driven landing-site decision
3. Penultimate-Flight reference restricted to engine-state retrospective level only
4. SCAFFOLD-PENDING engine-state suppression

Pattern: **brief-discipline patterns are orthogonal and composable** — multiple patterns can apply to a single mission without interference. This is a stronger property than any individual pattern.

## Substrate-density vs tool-use observation

| Mission | Tool uses | Word count |
|---|---|---|
| v1.118 | 36 | ~23K |
| v1.119 | 28 | ~30K |
| v1.120 | 32 | ~25K |
| v1.121 | 28 | ~25K |
| v1.122 | 30 | ~25K |
| v1.123 | 34 | ~30K |
| v1.124 | 33 | ~28.5K |
| v1.125 | 35 | ~36K |
| v1.126 | 33 | ~47K |

**Observation:** Tool-use stays in 28-36 band (mean 32) regardless of substrate-density. Word-count varies 23K-47K based on substrate-density. Pattern: tool-use is bounded by template-structure (5 Read + 13 Write = 18 minimum); word-count scales with substrate-richness.
