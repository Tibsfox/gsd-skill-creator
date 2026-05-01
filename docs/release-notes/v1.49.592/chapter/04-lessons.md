# v1.49.592 Forward Lessons (#10207 — #10210)

## #10207 — Depth-audit composite-signal evaluation supersedes moving-baseline hypothesis

**Origin:** v1.49.592 W0.3 (T2.2) NASA bytes WARN moving-baseline analysis, building on v1.49.591 Lesson #10204.

**Hypothesis tested:** moving-3-milestone baseline would smooth out predecessor-density variance and reduce false-WARN signals.

**Result:** moving-baseline does NOT cleanly improve over single-predecessor. Historical analysis across v1.62-v1.72 shows:
- v1.71 byte-WARN UPGRADES to PASS under moving-3-baseline (improvement)
- v1.69 byte-PASS REGRESSES to WARN under moving-3-baseline (regression)
- v1.68 FAIL preserved correctly under both baselines
- v1.72 byte-WARN unchanged under moving-3-baseline (no help)

**Net: 1 improvement, 1 regression, 2 unchanged. Not a clean win.**

**Better fix (option (a) from #10204):** composite-signal evaluation. When lines ≥ 95% AND sections meet threshold, relax bytes threshold from 0.95 (PASS) / 0.80 (WARN) to 0.75 (PASS) / 0.60 (WARN). Captures the true signal: "structure healthy + content concise = legitimate brevity, NOT lazy-truncate."

**3-criterion test for composite-pass:**
1. Lines ratio ≥ 95% (line-count health signal)
2. Sections meet threshold (NASA: 5/7 canonical; MUS+ELC: ≥10 numbered card-titles)
3. Bytes ratio between 0.60 and 0.95 (concise-not-lazy signal)

When all three satisfied → composite PASS instead of bytes-only WARN.

**Forward action — DEFERRED to v1.49.593 W0:**
- Add `--composite-pass` flag to `tools/depth-audit.mjs` (opt-in; preserves backward compat)
- Default behavior unchanged (single-predecessor; 0.95/0.80 thresholds)
- Tests verify v1.71+v1.72+v1.73 false-WARN clear under composite-pass; v1.68 FAIL preserved
- Document in CLAUDE.md depth-audit subsection

**Carry-forward soak count:** v1.49.591 (NASA 88% bytes WARN) + v1.49.592 (MUS 84% bytes WARN + ELC 86% lines WARN) = 3 instances of the false-WARN pattern. Three soak milestones is sufficient for the canonical 2-soak-then-harden discipline (#10202) to apply.

---

## #10208 — Forward-action fixes can preempt their own future-incidents

**Origin:** v1.49.592 W0.2 + W2-NASA observation.

At v1.49.591 the W2-NASA build agent renamed/combined 4 of 7 canonical sections, requiring 4-Edit inline-recovery from main-context Opus (~10 min wall-clock; Lesson #10203 candidate). The forward action was: enumerate the 7 NASA canonical-section regexes verbatim in the W2-build-agent template.

**v1.49.592 result:** the W2-NASA agent produced 7/7 canonical sections WITHOUT any inline-recovery cycles. The 10-minute recovery overhead at v1.49.591 collapsed to zero at v1.49.592.

**3-criterion test for forward-action-success:**
1. The lesson identifies a specific structural gap (V/V regex enforcement in build-agent prompt was absent)
2. The fix shape mirrors the gap (enumerate the regexes + give canonical h2 examples + add hard-rule paragraph)
3. The first application after fix lands clean (no inline-recovery needed)

**LM AGS framing parallels:** the same pattern applied at G0 with brief errors. BE-1 caught at W1a; BE-1 correction ("entirely digital, NOT analog") propagated to W2-NASA + W2-ELC + W2-MUS prompts; all three W2 outputs framed AGS correctly (zero post-build correction needed).

**Forward action:** when emitting forward-action lessons, prefer fixes whose first application can be measured cleanly. Avoid lessons that say "do X better" without a concrete deliverable (template edit; new flag; new test; etc.).

---

## #10209 — Sibling depth-ratios diverge legitimately when subject density differs

**Origin:** v1.49.592 W2 depth-audit verdict (NASA PASS 96%/98% / MUS WARN 97%/84% / ELC WARN 86%/101%).

The three sibling builds at v1.73 produced different depth ratios despite identical W2 dispatch templates and prompt structure. Investigation reveals subject-driven divergence:

- **NASA 1.73 (Apollo 9):** 5 load-bearing firsts + complex narrative (LM separation/rejoin + EVA + AGS + new pogo + AGS-CSM rendezvous) — 96% lines / 98% bytes (PASS)
- **MUS 1.73 (CSN debut):** 12-track album with 3-voice harmony analysis + Suite-Judy-Blue-Eyes form study + Domain 10 origination — 97% lines / 84% bytes (bytes WARN; the form analysis prose is denser per line than v1.72 White Album's 30-track-per-page format)
- **ELC 1.73 (LM AGS):** entirely-digital computer + first-strapdown-IMU narrative + DEDA + magnetic-core memory — 86% lines / 101% bytes (lines WARN; digital-computer narrative is structurally more bullet-pointed than v1.72 J-2-mechanical-engineering narrative)

**Conclusion:** depth-ratio variance across siblings is NOT a quality signal; it's a subject-density signal. The depth-audit BLOCKER mode (FAIL/MISSING only) correctly does NOT block these WARN cases.

**3-criterion test for legitimate divergence:**
1. The build was clean (no inline-recovery; zero W2-quota interruptions)
2. Sections meet threshold (7/7 NASA; ≥10 numbered MUS+ELC)
3. The differing axis (lines vs bytes) is explainable by subject (digital vs mechanical; track-count vs form-analysis)

When all three satisfied → WARN is acceptable for ship.

**Forward action:** when both bytes AND lines drop below 80%, that IS the lazy-truncate signal (FAIL). When only one drops below 95% but the other is healthy, it's legitimate density variance.

---

## #10210 — Two-stage error-correction pipeline (W1a brief-error + W2 build-agent inline)

**Origin:** v1.49.592 BE-1 / BE-2 / BE-6 propagation across all three W2 build outputs.

**Stage 1 — W1a brief-error catch:** Sonnet dossier identifies factual errors in initial framing. v1.49.592 caught 10 errors (target 8-12; 2 HIGH + 5 MED + 3 LOW). HIGH-severity errors are surfaced at G0 user adjudication; user accepts the corrections.

**Stage 2 — W2 build-agent inline correction:** corrected facts propagate through W2-NASA + W2-MUS + W2-ELC dispatches via the MISSION-BRIEF.md (which records the G0 lock decisions + applied brief-error corrections). All three W2 agents read the brief; all three apply the corrections; all three produce content with the correct facts.

**Result at v1.49.592:** zero post-build corrections needed. All 37 build files (17 NASA + 10 MUS + 10 ELC) frame AGS correctly (digital, not analog), Schweickart EVA correctly (46-min hatch-cycle), and Saturn V pogo correctly (Apollo 9 introduced new S-II mode, did NOT complete remediation begun at Apollo 8).

**3-criterion test for the pipeline:**
1. W1a dossier catches errors load-bearing for downstream W2 narrative
2. G0 surfaces HIGH-severity errors for user adjudication (not auto-applied)
3. MISSION-BRIEF records both corrections + G0 lock decisions in same place; W2 agents read MISSION-BRIEF as part of mandatory reading

**Forward action:** at v1.49.593+, if W2 outputs occasionally still contain pre-correction framing, investigate whether the MISSION-BRIEF correction wording is precise enough. Currently the wording is "BE-N HIGH: [old framing] → corrected to [new framing]"; this verbatim-old-and-new pattern works because the W2 agents pattern-match on the old phrase + replace with the new one.

---

## Lesson candidates from this milestone (held for v1.49.593+ emission)

- **#10211 candidate** — sibling depth-audit verdicts should be reported as a triple (NASA + MUS + ELC) not three separate ones. The current depth-audit output groups them but the summary line "PASS=1 / WARN=2" loses subject-track context.
- **#10212 candidate** — visual canonical-card-separation enforcement (extending depth-audit beyond section-presence to card-container separation). Background: at session-start (pre-W0) the user flagged that 1.71/1.72 had Forest Contribution + Governance combined into ONE card; depth-audit's regex passed because both names appeared, but the structural intent (separate cards) was violated. Forward action: enforce that each canonical section is in its own `<div class="card">` container.

These candidates carry forward to v1.49.593 W0 review.
