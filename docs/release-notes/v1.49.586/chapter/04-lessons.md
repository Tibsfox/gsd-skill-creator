# 04 — Lessons Learned: v1.49.586 Forward Lessons

## 4 forward lessons emitted (#10175–#10178)

These lessons are added to the cumulative lessons-learned database for application by future milestones.

### #10175 — score-completeness rubric must accommodate non-NASA-shaped milestones

**Source:** v1.49.585 §4.2 carry-forward; T2.3 implementation at v1.49.586 W0.

**Observation:** v1.49.585 release-notes scored F/28 under the existing structured rubric because the rubric expected NASA-degree-shape markers (`## Key Features`, `## Cross-References` pipe-tables, Part A/B sections) that cleanup-mission releases simply do not carry. The correct shape — `## Components` / `## Threads opened` / `## Forward lessons emitted` / `Engine state: UNCHANGED` — was unscored. Without rubric extension, every counter-cadence cleanup milestone would score F/under-graded, making the `score-completeness.mjs` gate unusable on cleanup releases and creating pressure to either skip cleanups or pad them with NASA-shape boilerplate.

**Application:** v1.49.586 T2.3 shipped the `cleanup-mission` rubric with `isCleanupMission()` auto-detect heuristic (≥2 of 3 signals: explicit "counter-cadence/cleanup" type marker, no NASA mission code in header, structural cleanup sections present). v1.49.585 lifted F/28 → B/83 under the new rubric. Auto-detect routes degrees to prose rubric, cleanup-shape to cleanup-mission rubric, everything else to structured. Explicit `--rubric=` flag bypasses auto-detect.

**Forward application:** any future scoring tool that targets a specific milestone shape must declare its applicability and provide an auto-detect path; tools that fail-fast on unsupported shapes block legitimate-but-different-shaped work.

### #10176 — pre-tag-gate composite as HARD RULE

**Source:** v1.49.585 post-ship CI red (run 25096343019 + 25096349789); 1 build error + 4 test failures, all v1.49.585-introduced.

**Observation:** v1.49.585 W4 Phase 3 meta-test ran completeness + chapter idempotent + pre-push BLOCK/ALLOW; CI-shaped tests slipped through the meta-test net. Specifically: TS2835 missing-`.js` extensions on relative ESM imports under node16/nodenext moduleResolution; harness-integrity hook-ref invariants; manifest-drift CF-MED-065b; claude-md-truth CF-MED-063b. The lighter pre-push hook did not exercise these failure modes; full vitest run did. Without the composite gate, these errors only surface post-push when CI fires.

**Application:** `npm run pre-tag-gate` shipped as HARD RULE. Composite of: (1) `npm run build` (catches TS errors that vitest does not surface), (2) `npx vitest run` (full suite mirroring CI exactly), (3) `node tools/release-history/check-completeness.mjs --current --strict` (release-notes structure gate). Exit codes 0 (PASS) / 1 (build) / 2 (vitest) / 3 (completeness). v1.49.586 W4 ship pipeline runs this gate BEFORE `git tag`. Forward backstop: the pre-push hook still runs `check-completeness.mjs --strict` on push to main; the pre-tag-gate runs the heavier suite operator-side; both gates fire mandatorily.

**Forward application:** any milestone that ships code (not just docs) must run `npm run pre-tag-gate` before tagging. Skipping is documented in CLAUDE.md "Operational Gates" as emergency-only behavior.

### #10177 — founding-instance-as-window-opener as a structural primitive distinct from PCL/FAMC/SAF

**Source:** v1.49.586 W1 research dossier + G0 user adjudication; ratified at single-exemplar via the OAO-2 + Mudhoney + Trumpeter Swan triad.

**Observation:** Without explicit declaration, the CATALOG-WINDOW-OPENING primitive (single-platform single-output that opens a band and produces sustained reference catalog) could be conflated with PERSISTENT-CONSTELLATION-LISTENER (multi-platform multi-decade deployment, v1.66 2-exemplar) or FORM-AS-MULTIPLICITY-COORDINATION (coordination across multiple structurally-distinct elements, v1.66 single-exemplar) or SUCCESS-AFTER-FAILURE (v1.62/63/64 closed at 3-exemplar; OAO-2 IS a SAF instance post-OAO-1 but forward identity is the catalog). The structural distinction (single-platform single-output that opens a band vs multi-platform deployment vs coordination across multiplicity vs recovery-from-failure arc) is what makes the CWO thread reproducibly identifiable across substrates.

**Application:** v1.49.586 NASA 1.67 + MUS 1.67 + ELC 1.67 cards 5 + 9 + 12 + the differentiation_note in each subject-spec.json explicitly declare CWO's structural distinction from PCL, FAMC, SAF, and the soft GA co-instantiation. The triad's structural commonality (founding-instance-as-window-opener: each artifact opens a previously-inaccessible documentation window AND produces sustained reference output) is made explicit at the cross-track-card level.

**Forward application:** all forthcoming forward-cadence degrees with single-platform single-mission output pattern can advance CATALOG-WINDOW-OPENING toward 2-exemplar / 3-exemplar threshold. Watchlist 2nd-exemplar candidates (per NASA 1.67 governance card): Mariner 6/7 Mars (1969) opens Mars-imaging catalog; TIROS-N (1978) opens operational-meteorology catalog; Landsat 1 (1972) opens Earth-observation catalog; Voyager 1+2 (1977) opens outer-solar-system imaging catalog. Archive threshold ~v1.87.

### #10178 — brief-error correction discipline at G0 gate

**Source:** v1.49.586 W1 research subagent caught 6 substantive errors in MISSION-BRIEF.md; G0 user adjudication ("accept all") locked corrections into `G0-LOCKED-DECISIONS.md`; W2 build subagents sourced LOCKED-DECISIONS as canonical.

**Observation:** Without an explicit research-pass-before-build phase, mission briefs authored from secondary sources can carry factual errors that propagate into all build artifacts. v1.49.586 caught NSSDC ID 103A→110A (wrong mission entirely), end-cause "cooling failure"→"WEP HVPS failure 1973-02-01" (folk source), Code et al. catalog framing (4 standalone catalogs vs 33+ paper ApJ series + book + atlas), Mudhoney CWO framing (overstated; refined to grunge-catalog-window-opening), ELC Domain 11 fabricated ("Bandpass-stability" not in schema; actual Domain 11 = EMI/EMC closed), Reciprocal Recording address discrepancy. Six errors across 49 build artifacts would have been a substantial post-ship correction sprint.

**Application:** v1.49.586 W1 research-subagent dispatch BEFORE the user G0 gate produced a 4,467-word dossier with explicit FACTUAL CORRECTION + BRIEF CORRECTIONS sections. G0 user review adjudicated the 6 corrections + 3 decisions ("accept all"). G0-LOCKED-DECISIONS.md became the canonical source-of-truth that W2 build subagents were instructed to obey over the original mission brief. Verified post-W2: zero deviations from locked values across 49 build artifacts.

**Forward application:** any future forward-cadence milestone with a mission brief authored from secondary sources should commit to a W0.5 research-validate-then-revise-brief cycle BEFORE user G0 review. Alternatively: brief authoring AND research validation can happen as a single combined research-author-then-G0-review cycle, with the user G0 review including both narrative decisions AND brief-error adjudications. The explicit subagent-flagged-corrections pattern (FACTUAL CORRECTION / REFINED FRAMING / BRIEF CORRECTIONS) keeps the audit trail explicit.

## Status of carryover lessons from v1.49.585

| Lesson | Status at v1.49.586 close |
|---|---|
| #10168 — counter-cadence cleanup-mission cadence | APPLIED (v1.49.586 W0 sequenced Track 2 small-fix bundle BEFORE Track 1 NASA forward triple) |
| #10169 — gate-not-vigilance discipline | APPLIED (operator set `SC_SELF_MOD=1` at session start to allow T2.1+T2.2 hook edits; gate fired correctly when env was unset) |
| #10170 — meta-test strategy at ship time | APPLIED (W4 ship pipeline runs pre-tag-gate against v1.49.586's own build) |
| #10171 — architectural correction mid-mission | APPLIED at G0 gate (6 brief errors corrected before W2 build commits) |
| #10172 — scope expansion mid-mission | NOT APPLIED at v1.49.586 (no scope expansion mid-mission this milestone) |
| #10173 — hook self-tests must use `env -i` | APPLIED (T2.2 shipped exactly this) |
| #10174 — `.claude/settings.json` is correctly gsd-config-guard-protected | APPLIED (T2.1+T2.2 hook updates flowed through `project-claude/hooks/` source-of-truth) |

## Forward lesson chain integrity

CHAIN-CONVENTIONS stays at v1.4 (no thread promotion this milestone; CATALOG-WINDOW-OPENING joins §6.6 candidate amendments at single-exemplar status). Lessons #10175–#10178 are the v1.49.586 forward-emitted batch; together with v1.49.585 #10168–#10174 they form the cumulative lessons-learned database (#10168–#10178; 11 lessons total in the 2026-04-29 to 2026-04-30 ship window).
