# Lessons Codified — v1.49.912

No manifest codification this ship (it is a gate-tightening micro-ship, not a codify ship). One new candidate lesson is recorded below; it is NOT added to `tools/render-claude-md/disciplines.json` (1 instance, below the 3-instance promotion bar) and is intentionally NOT placed in any cited canonical doc, so the live discipline-coverage state stays at UNCODIFIED 0 / PARTIAL 0.

## NEW candidate — #10460

**Gate every parsed metric, or stop parsing it; and ratchet a drained ceiling promptly.**

Two sibling sub-rules, both surfaced by this ship:

1. **A metric a gate already computes but never enforces is silent-drift surface.** Step 13 of `tools/pre-tag-gate.sh` parsed `PARTIAL_COUNT` out of the coverage tool's output but only ever evaluated it inside the `UNCODIFIED > 0` branch — never compared it to a ceiling. The result: PARTIAL drifted to 8 unchecked across the entire v903–v909 campaign, and v910 had to drain it by hand. Fix: gate the parsed metric symmetrically (its own ceiling, gated independently), or remove the parse. Sibling of the failure-mode-contracts principle (#10427): a surface that exists to surface drift must not itself be a silent no-op.

2. **Ratchet a count-ledger ceiling down within ~1 ship of its backlog draining.** A ceiling is only as sensitive as the gap between the current count and the ceiling. When v910+v911 drained both buckets to 0, the `=41` ceiling silently tolerated re-accumulation up to 41 — the exact drift the gate exists to catch. v912 ratcheted UNCODIFIED 41→5. The env-var override stays the forward-progress escape valve for fast-accumulating campaigns (NASA degree-advance).

**Promotion path:** this generalizes the count-ledger-ceiling pattern (#10434). When a second and third instance of "a gate parses a metric it never enforces" or "a ceiling left slack after a drain" appear, promote #10460 into the manifest against `docs/known-unwired-ledger-discipline.md` (where the v912 case study already documents the discipline).

## Disciplines applied (existing — no new codification)

| Lesson | How it was applied this ship |
|---|---|
| #10434 | Count-ledger-ceiling generalization — the discipline-coverage ceiling whose ratchet + companion this ship extends; documented in `docs/known-unwired-ledger-discipline.md` |
| #10417 | Test harness uses `spawnSync` (not execSync) so stderr survives exit 0 — the new test's harness |
| #10450 | Static-analysis-tool parsers/tests must be non-vacuous — the fixture's bucket counts are ground-truth-by-construction; mutation-verified |
| #10430 | Finer-grained ~5-ship maintenance cadence — the rationale for the tight 5/5 ceilings (vs the looser one-codify-cycle alternative) |
| #10427 | Failure-mode contracts — a drift-surfacing gate must not be a silent no-op (the parsed-but-ungated PARTIAL) |

## Cross-references

- #10434 (KNOWN_UNWIRED ledger generalization — the count-ledger-ceiling pattern this ship ratchets)
- #10430 (Counter-cadence — finer-grained ~5-ship maintenance cadence; this is counter-cadence #13)
- #10417 / #10450 (Static-analysis-tool discipline — the new test harness + non-vacuity)
- #10427 (Failure-mode contracts — gate-as-silent-no-op anti-pattern)
- v1.49.910 (PARTIAL drain — surfaced the parsed-but-ungated gap this ship closes)
- v1.49.911 (UNCODIFIED drain — its retrospective named this exact follow-on ship)
