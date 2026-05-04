# v1.49.596 — Forward Lessons Emitted

Numbered carry-forwards + new candidates emitted at this milestone close.

## Forward Lessons summary

1. **#10221 — Dev/main sync discipline PROMOTED to ESTABLISHED.** Three-instance soak complete (v1.49.594/595/596 all maintained 0-commit drift across both main-merge boundaries each).
2. **#10225 — Trailing-median refinement implementation deferred to v1.49.597.** Carry-forward; composite-pass third-soak observation supports the trailing-median direction.
3. **#10227 — Composite-pass default-flip decision** held for v1.49.597 W4 retrospective.
4. **#10230 — M0 substrate closure cadence (multi-milestone phase boundaries).** First observed phase-boundary closure at the ship-cadence level; closure milestones structurally distinct from intermediate arc milestones.
5. **#10231 — Iconic-mission depth-recovery pattern** soak observation #1 emitted (Apollo 13 narrative density below predecessor-ratio is acceptable for iconic missions).
6. **#10232 — Cross-track structural-pair INSIDE-window discovery** soak observation #1 emitted (McCartney solo released INSIDE Apollo 13 mission window +6 days).
7. **#10233 — Tier 2 inline-Opus W2 build path** second consecutive instance (v1.49.595 + v1.49.596).
8. **Pack-11 / pack-12 / pack-13 Wave-1.5 fetches** carry-forward to v1.49.597+.

## PROMOTED: #10221 — Dev/main sync ESTABLISHED canonical ship-pipeline step

Three-instance soak complete. v1.49.594 (first) + v1.49.595 (second) + v1.49.596 (third) all maintained 0-commit drift across both main-merge boundaries each (6 boundary verifications total).

**Status:** PROMOTED from "third-instance test" to ESTABLISHED canonical ship-pipeline step.

**Canonical practice:**
After EACH `git push origin main` (initial ship merge AND post-ship RH refresh sync merge), fast-forward `dev` to include the merge commit:

```bash
git checkout dev
git merge --ff-only main    # always succeeds — main's tip merge commit has dev's tip as parent
git push origin dev
```

Pre-push hook at `.git/hooks/pre-push` provides advisory warning when `dev..origin/main` returns >0 (dev is behind main); the warning + 3-line ff-only sync above are the canonical ship-pipeline integration. Add to W4 ship-pipeline checklist; remove from carry-forward queue.

## NEW CANDIDATE: #10230 — M0 substrate closure cadence (multi-milestone phase boundaries)

**Origin:** v1.49.596 closes M0 (research substrate) via TRS Wave 3 master-index + part-bundles + coverage-report. The TRS-EXECUTION-MAP.md committed cadence maps M0 → M1 → M2 → M3 → M4 → M5 phase boundaries cleanly to milestone groups (10-milestone M0 arc; 3-milestone M1; etc.). This is the first observed phase-boundary closure at the ship-cadence level.

**Hypothesis:** multi-milestone arcs benefit from explicit closure-milestone artifacts (here: master-index + coverage-report) that consolidate the arc's outputs and establish substrate-readiness assessment for the next phase. The closure milestone is structurally distinct from intermediate arc milestones — focus shifts from generation to aggregation + readiness verification.

**Soak target:** M1 closes at v1.49.599 (3-milestone arc). M2 closes at v1.49.609 (10-milestone arc). M3 closes at v1.49.610. Apply closure-milestone artifact pattern to each phase end + observe whether the pattern generalizes.

## NEW CANDIDATE: #10231 — Iconic-mission depth-recovery pattern

**Origin:** MUS 1.77 (McCartney solo) shipped at 117.6% lines / 111.2% bytes vs MUS 1.75 reference (gold-standard); ELC 1.77 (LM Aquarius) shipped at 116.3% lines / 152.8% bytes vs ELC 1.75 (gold). Both are SIGNIFICANT depth-recoveries from MUS 1.76 + ELC 1.76 Tier-2 inline-recovery WARN profiles (81% / 85% lines).

**Pattern observation:** when an iconic mission (high public visibility + dense canonical material) follows a less-iconic mission, W2 builds at the iconic mission outperform predecessors regardless of whether the predecessor was Tier-1 (Sonnet) or Tier-2 (inline Opus). This suggests Tier-2 WARN findings normalize automatically at next iconic-mission iteration without operator intervention.

**Hypothesis:** depth-audit sees the WARN signal, but the underlying cause is mission-specific content density not pattern-degradation. Tier-2 recovery preserves structural integrity (sections + cards + cross-links); only quantitative metrics drift. Subsequent iconic mission rebounds quantitatively because content density rebounds.

**Implication for #10225 trailing-median refinement:** trailing-median may not need to handle Tier-2 specifically — the pattern self-corrects across 1-2 milestones of normal-Sonnet building. Soak target: v1.49.597+ (Apollo 14 candidate) and verify whether NASA+MUS+ELC depth ratios stay above PASS threshold without explicit Tier-2-handling logic.

## NEW CANDIDATE: #10232 — Cross-track structural-pair INSIDE-window discovery

**Origin:** McCartney solo *McCartney* released 1970-04-17 (INSIDE +6 days of Apollo 13 launch 1970-04-11). This is the first INSIDE-narrow-window MUS pick since v1.74 (Apollo 10 era cluster).

**Pattern observation:** across v1.7N degrees (10 milestones v1.71-v1.77), the #10198 fallback rule (admit OUTSIDE-window when structural-pair is iconic + load-bearing) was applied 7 of 8 instances. INSIDE-window is the rare case worth flagging for cadence calibration: when narrow-window admits naturally, the structural-pair often has stronger temporal symmetry than the OUTSIDE-window fallback cases.

**Hypothesis:** INSIDE-window admissions correlate with high-iconicity pairings where the cultural moment (Beatles dissolution + Apollo 13 crisis both dominating April 1970 news cycles) provides the temporal coupling. Distinct from OUTSIDE-window fallback admissions which require structural-symmetry to compensate for temporal-mismatch.

**Soak target:** track INSIDE-window vs OUTSIDE-window MUS picks across v1.49.597-v1.49.605 (Apollo 14-17 + Skylab era); observe whether iconic-mission clusters correlate with INSIDE-window MUS admissibility. If pattern holds, lift #10198 fallback rule to "use INSIDE-window when available; fall back to structural-symmetry OUTSIDE-window when narrow-window dry."

## CARRY-FORWARD: #10225 — Trailing-median refinement implementation deferred to v1.49.597

Three-soak observation complete; pattern reproducibly stable. Implementation deferred to v1.49.597 W0 task: extend `tools/depth-audit.mjs` to compute `trailingMedianRatios` over the prior 3 versions; report as a third row in JSON output. Default-on if v1.49.597 + v1.49.598 soak shows Tier-2 WARNs normalize. (NB: #10231 may obsolete #10225; if iconic-mission depth-recovery pattern self-corrects across 1-2 milestones, trailing-median may not be needed.)

## CARRY-FORWARD: pack-11 / pack-12 / pack-13 Wave-1.5 fetches

Counter-cadence pipeline:
- v1.49.597 W0: pack-11 topology Wave-1.5 fetch
- v1.49.598 W0: pack-12 category-theory Wave-1.5 fetch
- v1.49.599 W0: pack-13 information-theory Wave-1.5 fetch

All three close remaining zero-pack-tagged-records gaps. M0 substrate at 22/22 coverage post-closures (post pack-08+09+10 done at v1.49.594/595/596).

## CARRY-FORWARD: Composite-pass default-flip decision

Defer to v1.49.597 W4 retrospective. If #10225 trailing-median ships at v1.49.597, consider flipping `--composite-pass` default-on at v1.49.598+. If #10231 obsoletes #10225, no flip needed; leave `--composite-pass` as opt-in flag.

---

*Lessons #10221 promoted to ESTABLISHED. Three new candidates (#10230 / #10231 / #10232) emitted. Carry-forwards: #10225 (deferred to v1.49.597); pack-11/12/13 (counter-cadence); composite-pass default-flip (deferred to v1.49.597).*
