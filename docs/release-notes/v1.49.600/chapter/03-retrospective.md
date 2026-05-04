# v1.49.600 — Retrospective

## Carryover lessons applied

- **Lesson #10185** (Incremental Edit operations for files >100 lines): applied at Phase 841 W2 builds. Tier-2 inline-Opus serial path used per #10233 active discipline. NASA W2 build produced 33 files / 358,664 bytes via incremental Edit cycles + initial Write for new files; no single-Write 32K output token cap incidents observed.

- **Lesson #10221** (ship-sync after main-merge ESTABLISHED): scheduled for Phase 843 W4 ship pipeline. `npm run ship-sync` is canonical post-main-merge step. Will run after v1.80 dev→main merge.

- **Lesson #10231** (iconic-mission depth-recovery — ESTABLISHED at v599): applied at v1.80 in **NOMINAL DIRECTION** — full-canonical Mariner 9 depth target with substrate richness supporting full depth. Depth-audit returned clean PASS=3 with no WARN. The discipline holds in both directions: thin substrate produces graceful-thin output (v596/v598/v599); rich substrate produces full canonical output (v600). 4th observation; **ESTABLISHED REAFFIRMED in nominal-iconic-mission direction.**

- **Lesson #10232** (INSIDE-window MUS pick — ESTABLISHED at v599): applied at v1.80 Schmilsson selection. Schmilsson released 1971-11-11 = MOI−3 days (Mars Orbit Insertion 1971-11-14). Within ±8-day envelope around MOI boundary. 4th instance; **ESTABLISHED REAFFIRMED.** The discipline produced material lift — Schmilsson scored 6/6 against Mariner 9 substrate primitives (the only candidate to score 6/6); *Every Picture Tells a Story* (1 HIGH + 1 MED) and *Led Zeppelin IV* (1 HIGH + 3 MED) finished second + third on substrate fit; Schmilsson won on substrate evidence not on commercial-canonical-rank or chronological position.

- **Lesson #10233** (Tier-2 inline-Opus W2 build path): applied at v1.80 W2 builds (Sonnet sub-agent dispatch remained unavailable in flight-ops-v600 tool surface; Tier-2 inline-Opus serial pass per ratified path). Aggregate: 4 build agents / 42 files / 583,235 bytes / ~417K tokens / ~1h 6m wall — **comparable to v598 full-canonical W2 envelope.** **PROMOTED to ESTABLISHED at v1.80 G3.**

- **Lesson #10236** (substrate-emergent cross-track epistemology): applied at v1.80 cross-track pair selection. Three independent strong substrate-emergent pairs surfaced at three fit-levels (Stockholm 6/6 narrative-structural / Gray Whale temporal-lock contingent-temporal / Schmilsson 6/6 surgical-procedural). **Second cross-track substrate convergence on a NEW interface (NASA+SPS)** — convergence is opportunistic across track interfaces, not formulaic. **PROMOTED to ESTABLISHED at v1.80 G3.**

- **Lesson #10237** (§6.6 watchlist-not-pre-decision): applied at v1.80 §6.6 evaluation. 5 candidates surfaced from W1 substrate evidence; zero admitted at G2 (default no-admit confirmed across all 5); active exclusion of FIRST-OF-ITS-KIND-DISCOVERY per W1.NASA explicit recommendation (overfit risk). The discipline behaves cleanly across all disposition outcomes: admit (v598), no-admit (v599 + v600), promotion-to-ESTABLISHED (v598 PREC), active-exclusion (v600 FIRST-OF-ITS-KIND). **PROMOTED to ESTABLISHED at v1.80 G3.**

- **Lesson #10239** (lab-director G3-boundary patch): patch landed pre-spawn at `f4e607781`. Lab-director-v600 inherits patched briefing. **2nd consecutive operational application** at Phase 843 W4 ship pipeline. Operator G3 gate held at Phase 843.3 per patched briefing.

## New observations applied

### Cross-track fabrication detected + remediated at W2.NASA (orchestrator-level grep verification → 1 fix-up dispatch)

The W2.NASA build agent fabricated cross-track pair selections at v600: chose "Steller's Jay" for SPS and "What's Going On / Marvin Gaye" for MUS instead of reading actual W1.MUS / W1.SPS research outputs that selected Nilsson Schmilsson + Gray Whale. The fabrication contaminated 17 files in the NASA 1.80 directory.

**Detection mechanism:** orchestrator-level grep verification (`grep -liE "steller|marvin gaye|what's going on" www/tibsfox/com/Research/NASA/1.80/`) before phase-close. The grep caught the fabrication immediately.

**Recovery:** 1 fix-up agent dispatch (~131K tokens, 107 tool-uses, ~1421s wall) replacing all cross-track refs in 12 files + deleting 3 Steller's Jay-specific artifacts + creating 3 Gray Whale equivalent artifacts + 5 inline orchestrator edits to story files. Total recovery: ~1500s additional wall + ~131K extra tokens.

**Root cause:** W2.NASA prompt told the agent to read the NASA research.md but did NOT explicitly require reading the sibling-track MUS/SPS research outputs. The Tier-2 inline-Opus agent then defaulted to plausibility-driven content generation for cross-track sections, producing internally-consistent but factually-fabricated cross-track narratives.

**Forward-lesson candidate emitted:** **#10243** — W2 build-agent prompts must explicitly require reading all sibling-track W1 research outputs before authoring cross-track sections. The W2 build-agent prompt template at `.planning/missions/template-files/W2-build-agent-prompt.md` should be updated before v601 to add: "Files to read MUST include all 4 W1 research drafts (NASA + MUS + ELC + SPS), not only the build-track's own draft." Closes a Tier-2-path-specific quality risk surfaced at v600 observation #3.

**Importance for #10233 ESTABLISHED disposition:** the failure mode is **path-specific** (Tier-2 inline-Opus shows it; Sonnet sub-agent dispatch may or may not show it — untestable until Sonnet path returns). Its mitigation is **template-level** (prompt discipline), not engine-level. The path remains the canonical W2 fallback; the v600 fix-up recovery is **disposition-codifiable**, not a regression: detected at orchestrator grep, remediated within the path's standard cadence, produces clean forward-lesson candidate (#10243) for prompt-template hardening. Promotion to ESTABLISHED proceeds.

**Mutual-reinforcement with #10236:** substrate-emergent epistemology (#10236) provides the detection mechanism for cross-track fabrication, which is the principal Tier-2 path quality risk (#10233). Without #10236's substrate anchor, the fabricated Steller's Jay + Marvin Gaye narrative might have been accepted as "plausible enough" — the fabrication's ability to feel internally coherent is a known LLM failure mode that #10236's substrate anchor neutralizes. Observations #10233 and #10236 are mutually-reinforcing.

### #10240 DEFERRED to v601+ per insufficient observation signal

Operator decision at G2 (per `decision-10240.md`): DEFER #10240 (depth-audit gate refinement to honor #10231 ESTABLISHED graceful-thinness dispositions) to v601+. Rationale:

1. v600 depth-audit gate produced clean PASS=3 with no WARN at this milestone (Mariner 9 nominal-iconic + MUS Schmilsson canonical + ELC Stockholm canonical) — no v600 substrate to validate the refinement against.
2. Tier-2-vs-Tier-2 inflation hypothesis still has only 1 observation point (v598 was the first; v599 + v600 are observation #2 + #3 across same Tier-2 path; insufficient signal to design refinement against).
3. #10231 ESTABLISHED policy is "WARN is expected signal not blocker" — the existing operator override (`SC_SKIP_DEPTH_AUDIT=1`) already provides a ratified emergency mechanism. The #10240 refinement is a finer-grained quality-of-life improvement, not an enforcement gap.
4. Soak through v601 + v602 to gather more signal on whether the depth-audit gate's WARN/FAIL distinction needs structural refinement, or whether operator-level review of the WARN reason (graceful-thinness vs quality gap) is sufficient. Re-evaluate at v603.

Forward action: track depth-audit gate behavior across v601 + v602; mark RESOLVED-without-implementation at v603 if pattern remains worth refining vs operator override is sufficient.

## Trust-budget notes

No trust-budget incidents at v600. The Phase 841 self-attestation discipline (wc -w + exit codes verified at section boundaries) was followed throughout. The W2.NASA cross-track fabrication was caught at orchestrator-level grep — not a trust-budget incident; the orchestrator verification step worked as designed and produced a clean forward-lesson candidate. The patched lab-director G3 boundary held at Phase 843.3 per #10239 ESTABLISHED.
