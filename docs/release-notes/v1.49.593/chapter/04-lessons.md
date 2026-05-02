# v1.49.593 Forward Lessons (#10213 — #10217)

## #10213 — Artifact-suite enforcement: structural-fix-as-forward-action

**Origin:** v1.49.593 W0.2 (T2.1 + T2.2). USER-FLAGGED 2026-05-01.

**Problem identified:** Three consecutive milestones (v1.71, v1.72, v1.73) shipped NASA artifact suites at 13 / 4 / 4 files respectively (vs v1.69 + v1.70 gold-standard 13 each). User feedback: "1.69 1.70 were done well with creative artifacts and runnable simulations where there are fully built out html pages... 1.71, 1.72, 1.73 fell short of this standard, please bring them up and look into why they are drifting."

**Root cause analysis:** Three reinforcing failures:
1. **Template gap:** `template-files/W2-build-agent-prompt.md` (MANDATORY-elevated at v1.49.591 T2.3) did NOT enumerate artifact-suite deliverables. Only canonical `index.html` sections were enumerated.
2. **W2-NASA dispatch made artifacts "optional":** v1.49.591 + v1.49.592 dispatch prompts wrote `| optional procedural shader | optional Faust DSP |`. Each W2-NASA agent picked the minimum viable count (4) instead of gold-standard count (13).
3. **No depth-audit hook for artifacts:** `tools/depth-audit.mjs` enforced 7 NASA canonical sections in `index.html` but did not count artifact files. Drift was structurally invisible to the BLOCKER gate.

**Structural fix landed at v1.49.593 W0:**
1. **W2-prompt template** grew 111→154 lines with mandatory 13-file canonical artifact-suite enumeration (mirrors the v1.49.592 T2.1 canonical-regex propagation pattern that was successful).
2. **depth-audit.mjs** gained `inspectArtifacts()` function counting files in `artifacts/<category>/` subdirs across 5 canonical categories (story/shaders/audio/sims/circuits). Threshold: ≥10 files PASS, 4-9 WARN, <4 FAIL; 5/5 categories required for PASS.
3. **Tests:** 6 new tests added (14→19 in depth-audit.test.mjs); all pass.

**Result:** v1.74 W2-NASA shipped at 13 artifacts / 5/5 categories WITHOUT post-ship remediation. The forward-action fix preempts its own future-incidents (per Lesson #10208).

**Forward action:** none required; structural fixes durable.

---

## #10214 — Sonnet quota at ~04:08 PDT cadence anchor

**Origin:** Empirical observation across v1.49.592 + v1.49.593 W2-NASA dispatches.

Two consecutive milestone dispatches hit the per-account Anthropic Sonnet quota at approximately the same wall-clock time (~04:08 PDT). v1.49.592 W1a Apollo 9 dossier dispatch returned `You've hit your limit · resets 5am (America/Los_Angeles)`. v1.49.593 W2-NASA Apollo 10 dispatch hit a 401 auth failure at ~9 min wall-clock (different mode; auth credentials issue rather than rate-limit but co-incident timing is suggestive).

**Discipline (advisory; not deterministic gate):**

1. **Avoid multiple Sonnet dispatches in the 03:00-05:00 PDT window** if quota margin is uncertain.
2. **Inline-Opus recovery is functional fallback** — v1.49.593 W0.2d demonstrated 5 files / ~1,500 lines inline-Opus authored after quota hit.
3. **Mid-build 401 recovery pattern (Lesson #10215)** is also functional.

3-criterion test for invoking inline-Opus recovery:
1. Sonnet dispatch returns rate-limit OR auth-failure error
2. Ship deadline is within current session (cannot defer to next session)
3. Bounded scope (≤5-7 files; ≤~50K main-context tokens)

If all three met → switch to inline-Opus authoring with WebSearch verification (token-equivalent cost; cleaner main context).

**Forward action:** none structural; advisory only. Track quota-hit cadence at v1.49.594+ to confirm or refute pattern.

---

## #10215 — Mid-build 401 auth interruption pattern

**Origin:** v1.49.593 W2-NASA Apollo 10 dispatch. The agent ran for 8.8 min before returning `401 authentication_error`. Despite the auth failure, partial state was salvageable: index.html (606 lines / 7/7 canonical sections / PASS on lines+bytes) + 3 empty subdirectory scaffolds (artifacts/, forest-module/, retrospective/).

**Discipline:**
1. **Run depth-audit on partial state** to identify what landed and what's missing.
2. **Dispatch a CONTINUATION agent** with an explicit "DO NOT modify existing index.html" HARD RULE; only author missing files.
3. **Continuation token cost:** ~80K vs ~130K full re-run. ~40% token savings.
4. **Continuation wall-clock:** ~25 min vs ~35 min full re-run. ~30% wall-clock savings.

3-criterion test for invoking continuation pattern (vs full re-run):
1. Partial output passes integrity check (HTML well-formed; canonical sections present)
2. Missing files are mechanically enumerable (e.g. supporting pages + artifacts subdirs)
3. Mid-build error mode is recoverable (auth refresh succeeded; rate-limit reset eventually)

**v1.49.593 evidence:** continuation produced 24 files in 23 min vs 31 min total (8 min initial + 23 min continuation). Compare to estimated 35-min single-dispatch baseline = 3-min net cost penalty for the 401 incident.

**Forward action:** when this pattern recurs, document it as the third confirmed instance and consider promoting to ship-pipeline canonical recovery procedure.

---

## #10216 — Wave 2 synthesis vs Wave 1 fetching is a token-cheaper substrate

**Origin:** v1.49.593 W1bc TRS Wave 2a dispatch (8 packs across 4 batches).

**Empirical comparison:**
- **Wave 1 fetching** (v1.49.591 Wave 1d / v1.49.592 Wave 1e): ~50-75K tokens per pack. WebSearch + WebFetch + arXiv-API-fallback. Subject to rate-limit risk (#10200 motivated the discipline).
- **Wave 2 synthesis** (v1.49.593 Wave 2a): ~30-50K tokens per pack. Read master.json + topic-map.json; no external network dependencies. Zero rate-limit risk on the synthesis layer itself.

**Wave 2a aggregate:** 8 packs × ~40K tokens = ~320K tokens vs Wave 1e 6 packs × ~75K = ~450K tokens. 30% token-efficient at substrate level even though more packs synthesized.

**Forward planning implication:** prefer synthesis-batch milestones when quota margin is uncertain. v1.49.594 + v1.49.595 are scheduled for Wave 2b + Wave 2c synthesis (packs 09-16 + 17-22 respectively); both should run cleaner than v1.49.591 fetching milestones.

**Forward action:** track Wave 2 vs Wave 1 token costs across v1.49.594 + v1.49.595 to confirm pattern. If confirmed, document at v1.49.595 close.

---

## #10217 — Pack-tag inconsistency in master.json (Wave 1 hangover)

**Origin:** v1.49.593 W1bc Wave 2a synthesis. Multiple agents reported anomalies:
- pack-05 reported "20 records cited (target was 10)" — actual master.json has 20 src-p05-* records, but only some carry `pack: "pack-05-linear-algebra"` field; others use `pack_assignments` array.
- pack-06 reported "8 records cited (target was 5)" — same pattern.
- pack-07 reported "31 records cited (target was 20)" — same pattern.
- **pack-08 reported "0 records cited (target was 5)"** — CRITICAL gap. Zero records carry pack-08 tag. 8 priority Wave-1.5 papers identified for fetch (Einstein 1905, Schrödinger 1926, Born 1926, Heisenberg 1925, Bell 1964, Aspect 1981/1982, Robertson 1929, von Neumann 1932).

**Root cause:** Wave 1 fetch agents wrote records with inconsistent pack-tagging — some used the canonical `pack` field, others used `pack_assignments` array, others (pack-08 specifically) wrote zero pack-08-tagged records despite the topic-map carrying 5 pack-08 claims.

**Forward action — Wave 1.5 reconciliation:**
1. **Schema canonicalization:** decide on `pack` (single string) vs `pack_assignments` (array) and reconcile all 305 records.
2. **Pack-08 priority fetch:** 8 papers listed in v1.49.593 W1bc-D pack-08 synthesis report; target Wave 1.5 batch at v1.49.594 W0 or v1.49.595 W0.
3. **Pack-tag audit script:** `tools/trs-pack-audit.mjs` (TBD) — count records per canonical pack tag; flag mismatches; report which packs have zero pack-tagged records.

**Carry-forward to v1.49.594:** pack-08 quantum-mechanics priority Wave-1.5 fetch is the largest single gap in the corpus.

---

## Lesson candidates from this milestone (held for v1.49.594+ emission)

- **#10218 candidate** — composite-pass should be DEFAULT mode at v1.49.594+ once 2 milestones of soak data confirm no false-PASS regressions. v1.49.593 first-soak result: clean (PASS=2 / WARN=1 default; PASS=3 composite-pass; no historical milestone regresses from PASS to FAIL under composite-pass). Track at v1.49.594 to confirm 2-soak.
- **#10219 candidate** — Domain origination per milestone trajectory. v1.49.593 originated TWO domains in one milestone (Domain 11 Rock Opera at MUS + DRC at NASA §6.6). Discipline: when a single milestone originates >1 domain, document the cross-substrate parallelism explicitly in retrospective; this is novel structural data.
- **#10220 candidate** — User-flagged drift catches the structural fix that automated gates miss. Pattern: user feedback at v1.49.592 close → v1.49.593 W0 structural fixes (T2.1 + T2.2). The depth-audit BLOCKER + W2-prompt MANDATORY + canonical-regex propagation + artifact-suite enumeration are all USER-FLAGGED-then-systematized fixes. Forward action: maintain the catch-then-systematize cadence; user-flagged drift is a higher-quality signal than auto-gate output.

These candidates carry forward to v1.49.594 W0 review.
