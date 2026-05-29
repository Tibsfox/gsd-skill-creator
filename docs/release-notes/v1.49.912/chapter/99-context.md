# Context — v1.49.912

## Predecessor

- **v1.49.911** — Counter-cadence codify ship: UNCODIFIED drain — new "NASA mission authoring" domain (27 lessons) + reusable-subset promotion (12 lessons). Drained UNCODIFIED 39 → 0 (with v910 PARTIAL 8 → 0, the discipline-coverage surface reached fully-drained for the first time). Its retrospective named this gate-tightening follow-on as forward option 2.
- Shipped at: `7c3af8f99` (release commit), with post-ship rh refresh `a7437fd28`.
- Counter-cadence: true (12th).

## This ship

- **v1.49.912** — Counter-cadence gate-tightening micro-ship: ratchet `SC_DISCIPLINE_COVERAGE_CEILING` 41 → 5, add companion `SC_DISCIPLINE_PARTIAL_CEILING` (5) + `--max-partial=N` flag, first test coverage for `check-discipline-coverage.mjs`.
- **Counter-cadence: true** (this is the 13th counter-cadence ship).
- NASA degree: 1.178 (UNCHANGED — **130 consecutive ships** at this degree; pressure-margin record extended by 1).
- Manifest entries: 24 (UNCHANGED); lessons in manifest: 147 (UNCHANGED — no codification).
- Counter-cadence count: 12 → 13 (+1).
- Discipline-coverage UNCODIFIED 0 / PARTIAL 0 (both UNCHANGED); ceilings ratcheted 41/∞ → 5/5.

## Provenance

- Branch: `dev`.
- Pre-ship tip: `a7437fd28` (post-v911 rh refresh).
- Opened from the v911 handoff (`.planning/HANDOFF-2026-05-29-v1.49.911-uncodified-drain-codify.md`), forward-path **option 2** (gate-tightening micro-ship — operator-selected via AskUserQuestion over the recommended NASA-1.179 default).
- Operator-confirmed design (second AskUserQuestion): **tight & symmetric 5/5, both BLOCK**.
- Adversarial pre-ship verification: a 3-agent workflow (tool / gate-shell / test reviewers) returned clean; 3 minor/nit refinements applied.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- The new test runs in `vitest.tools.config.mjs`, NOT in the pre-tag-gate's `npx vitest run` step — verified separately via `--config vitest.tools.config.mjs`.
- Meta-test of the tightened gate: with live UNCODIFIED 0 / PARTIAL 0, pre-tag-gate step 13 PASSes under the new 5/5 ceilings. The BLOCK path was verified offline via the boundary state-matrix + the tool's own test suite (a live BLOCK can't be exercised at 0/0).
- No FTP sync, no GH release (consistent with the v886–v911 pattern; git tags authoritative).

## Codify-axis / gate arc (v899 → v912)

| Ship | Type | Coverage delta |
|---|---|---|
| v910 | Counter-cadence codify | PARTIAL 8 → 0 |
| v911 | Counter-cadence codify (UNCODIFIED drain) | UNCODIFIED 39 → 0 |
| v912 | Counter-cadence gate-tightening | counts UNCHANGED (0/0); ceilings 41/∞ → 5/5; first tool test |

With the buckets drained (v910/v911) and the gate re-sensitized (v912), the discipline-coverage surface is now both clean AND tightly guarded: any new UNCODIFIED or PARTIAL drift above 5 BLOCKs the ship.

## Forward path (post-v912)

1. **NASA forward-cadence at 1.179** — the strongest move (now confirmed by both the v911 handoff and this ship's completion). 130 consecutive ships at 1.178; codify-axis fully drained AND its gate re-tightened, so there is no remaining gate/codify debt competing with degree-advance. Standard NASA T14 per `feedback_nasa-ship-sequence-streamlined`; author the W0 brief per `docs/MISSION-PACKAGE-DISCIPLINE.md` + `docs/nasa-mission-authoring-discipline.md`. Title-line trip-vocab budget = 0 (#10401); secondary density → Path B if primary > 0 OR secondary > 5 (#10402). NOTE: when the degree-advance run accumulates UNCODIFIED lessons fast, raise `SC_DISCIPLINE_COVERAGE_CEILING` (now 5) for forward-progress mode — the tightened ceiling is calibrated for the current ~0/ship non-NASA cadence.
2. **Wire the tools-config suite into the gate** — the new test (and ~30 sibling tool tests) run only via `--config vitest.tools.config.mjs`, not in the pre-tag-gate's `npx vitest run`. Wiring them in would gate-enforce the coverage tool's own test, but pulls in network/ftp tool tests (larger blast radius). Deferred candidate.
3. **Promote #10460** when a 2nd/3rd instance of "parsed-but-ungated metric" or "slack ceiling after drain" appears — into the manifest against `docs/known-unwired-ledger-discipline.md`.
4. **New substrate or threshold ship** — opens a fresh verify-axis window; none pending, all 7 thresholds COVERED.

**Operator-recommended priority:** option 1 (NASA 1.179).

## Engine state at close

- NASA degree: **1.178** (130 consecutive ships; pressure-margin record extended by 1).
- **Counter-cadence count: 13** (was 12).
- **Manifest entries: 24** (UNCHANGED); **lessons in manifest: 147** (UNCHANGED).
- **Discipline-coverage: UNCODIFIED 0 / PARTIAL 0** (both UNCHANGED); ceilings 41/∞ → **5/5** (both BLOCK on exceed).
- KNOWN_UNWIRED Process / Egress / Loader: **0 / 0 / 0** (UNCHANGED).
- Wired calibratable thresholds: **7 of 7**; verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED — step 13 modified, no step added).
- Operational axes: **4** (UNCHANGED).

## Cross-references

- v1.49.910 / v1.49.911 (the drain ships that motivated this re-sensitization)
- `docs/known-unwired-ledger-discipline.md` (#10434 — ceiling case study, extended this ship)
- `docs/T14-SHIP-SEQUENCE.md` (canonical ship sequence)
- #10430 (Counter-cadence — finer-grained ~5-ship maintenance cadence)
- #10460 (NEW candidate — gate every parsed metric; ratchet drained ceilings promptly)
