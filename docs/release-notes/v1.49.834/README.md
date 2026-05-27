> Following v1.49.833 — _Codify Cross-Rootdir Wire Pattern as Discipline (Lesson #10435)_, v1.49.834 is the first **stale-entry cleanup chip** in the ProcessContext family. Removes `src/intelligence/analyzer/git.ts` from the `KNOWN_UNWIRED` allowlist in `src/security/process-context-audit.test.ts`. The file has been fully wired via `ensureProcessAllowed` (hoisted outside the swallow-catch per #10427) since v1.49.812, but v812 missed the allowlist edit — leaving a silent off-by-one between the audit-test allowlist and the per-ship release-notes count claim. v834 closes both the allowlist gap and the count discrepancy. First manifestation of the unidirectional-enforcement asymmetry observation (`docs/known-unwired-ledger-discipline.md` §"Forward observations") being caught by per-ship discipline, exactly as the doc predicted at v814 codification.

# v1.49.834 — ProcessContext Stale-Entry Cleanup (`intelligence/analyzer/git.ts`)

**Shipped:** 2026-05-27

First stale-entry cleanup chip in the ProcessContext KNOWN_UNWIRED family. Removes `src/intelligence/analyzer/git.ts` from the allowlist (was already fully wired at v812; allowlist edit was silently skipped that ship). KNOWN_UNWIRED Process: **23 → 22** (-1). Closes a 22-ship off-by-one between the audit-test source-of-truth and the per-ship release-notes count claim.

## Why this ship

The recent v1.49.833 codify ship synthesized 5 instances of the cross-rootdir wire pattern into a discipline. As part of next-session candidate enumeration, recon of the 22-entry KNOWN_UNWIRED ProcessContext allowlist surfaced an anomaly: `src/intelligence/analyzer/git.ts` is listed in the allowlist AND calls `ensureProcessAllowed` at line 71. The audit-test short-circuits on `KNOWN_UNWIRED.has(label)` (line 151 of `process-context-audit.test.ts`) BEFORE checking the actual wire — so the entry has been silently double-protected for ~22 milestones.

`docs/known-unwired-ledger-discipline.md` already documented this as a forward observation under "Unidirectional enforcement asymmetry":

> The v806 audit-tests enforce "files NOT in KNOWN_UNWIRED but containing the signature MUST call ensure\*Allowed" but do NOT enforce the inverse: a wired file can carry a stale KNOWN_UNWIRED entry indefinitely without test failure. … Flagged at v812 retrospective. Not urgent — the per-ship release-notes discipline catches it manually at chip cadence.

v834 is the first time per-ship discipline actually caught the asymmetry. Caught at recon-before-chip, exactly the position the doc predicted.

## What shipped

- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/intelligence/analyzer/git.ts',` from `KNOWN_UNWIRED`.
  - Replaced with an inline comment explaining: (a) the file already calls `ensureProcessAllowed` since v812, (b) the entry was silently double-protected because the audit short-circuits on `KNOWN_UNWIRED.has` before inspecting actual wire, (c) this is the first **stale-entry cleanup chip** — different shape from a normal chip (which adds a wire), this one just removes the allowlist entry, and (d) the wire was added at v812 but the allowlist edit was missed at that ship.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v833 → v834.

That's the whole code surface. No new source files. No new tests. Just the allowlist edit that v812 missed.

## The off-by-one trajectory

Reconstructed from `git show <tag>:src/security/process-context-audit.test.ts | grep -c "^  'src/"`:

| Ship | Actual count | Release-notes claim | Drift |
|---|---|---|---|
| v1.49.806 (introduction) | 38 | 38 | 0 |
| v1.49.811 | 38 | — | 0 |
| **v1.49.812** | **38 (allowlist edit missed)** | **38 → 37** | **+1** |
| v1.49.819 | 33 (38 − 5 aminet) | 37 → 32 | +1 |
| v1.49.820 | 32 (33 − 1 branch-manager) | 32 → 31 | +1 |
| v1.49.825 | 29 (32 − 3 git/core) | 31 → 28 | +1 (claimed 31→28? actually 32 → 29) |
| v1.49.827 | 26 (29 − 3 dogfood) | 28 → 25 (?) | +1 |
| v1.49.828 | 23 (26 − 3 scribe) | 25 → 22 (?) | +1 |
| v1.49.833 (chain close) | 23 (UNCHANGED) | 22 (UNCHANGED) | +1 |
| **v1.49.834 (this ship)** | **22 (−1: git.ts stale)** | **23 → 22** | **0** |

(The intermediate "release-notes claim" column is from prior ship README files; per-ship release-notes counts have been off by 1 since v812.)

v834 brings the actual count and the count claim into alignment. The trajectory chart in `docs/known-unwired-ledger-discipline.md` (case-study table) currently shows v812 as a count-reducer; that's the discipline doc framing — accurate at the wire level (the file was wired), inaccurate at the allowlist level. Updating the doc framing is out of scope this ship — the cleaner approach is to land the v834 chip first, then a future codify ship can synthesize the lesson if the asymmetry-catch shape recurs.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/security/process-context-audit.test.ts` | 2048 PASS | UNCHANGED count (it.each generates 2048 tests by walking src/ files). git.ts now satisfies the audit via actual `ensureProcessAllowed` call rather than the KNOWN_UNWIRED short-circuit. |
| Full suite | 35,235+ PASS | UNCHANGED |
| **LOC delta** | ~9 | 1 line removed + 7-line comment added |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **52 consecutive ships at 1.178**, the new widest pressure margin record). Counter-cadence count UNCHANGED at 6.

KNOWN_UNWIRED Process: **23 → 22** (actual: −1; aligns the audit source-of-truth with the count claim that's been quoted in release notes since v828).

Manifest entries: **23** (UNCHANGED).
Lessons in manifest: **77** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward (no change from v833):
- Substrate-consumer hook PAIR pattern (2 instances) — DEFERRED to next codify ship.
- `onPredictions` substrate-consumer wire pattern (2 instances) — DEFERRED.
- #10433 LOC-band-by-callsite-count refinement (3 instances) — DEFERRED.
- Verification/integration-only ships axis (2 instances) — DEFERRED.
- **NEW (1 instance): stale-entry cleanup chip pattern** — first instance at v834. Wait for 2nd before codifying.

Wired calibratable thresholds: **6 of 6** (UNCHANGED).

KNOWN_UNWIRED Egress: **11** (UNCHANGED).

Codify-axis cadence: 1 ship past last codify (v833) — within the 7-10 ship floor.

## What this ship is not

- Not a NASA degree advance.
- Not a regular chip (does not add a new wire to a previously-unwired file).
- Not a codify ship (the stale-entry cleanup pattern is 1-instance — too early to codify; wait for 2nd).
- Not a test-count change (allowlist edit; same set of files checked, same outcomes).
- Not an update to `docs/known-unwired-ledger-discipline.md` (forward observation framing can be updated at a future codify ship if the pattern recurs).

## Verification

- `npx vitest run src/security/process-context-audit.test.ts` → 2048 PASS.
- `bash tools/pre-tag-gate.sh` → 17/17 PASS (full suite 35,235 PASS; step 13 within-ceiling at 39 ≤ 41).
- `git show v1.49.834:src/security/process-context-audit.test.ts | grep -c "^  'src/"` → 22.
- `grep -c "ensureProcessAllowed\s*(" src/intelligence/analyzer/git.ts` → 1 (confirms the wire is in place; audit no longer routes via short-circuit).

## Forward path post-v834

1. **v1.49.835 lowConfidenceThreshold calibration scaffold** (next ship this session) — adds `'predictive.low_confidence_threshold'` to `CalibratableThreshold` type + registers observation source (initially unwired with explicit gap doc). Pairs with v834 thematically: both are "close a silent gap that the audit/calibration framework didn't catch."
2. **NASA 1.179 forward-cadence** (~60-90 min single ship) — 52 consecutive ships at 1.178; widest open pressure margin yet.
3. **Continued ProcessContext singleton chips** (~13 truly unwired entries remain after v834 cleanup; some families warrant batch chips: terminal 3, mesh 2, intel-analyzer 1 remaining).
4. **Inverse-check audit-test enhancement** — make the audit fail loudly when a KNOWN_UNWIRED entry ALSO calls `ensureProcessAllowed`. Forward-flagged at v814; v834 demonstrates the case but doesn't add the enforcement. Operator-bounded; small ship (~30 min).

## Most valuable single takeaway

**The unidirectional asymmetry doc-prediction held — the discipline-doc forward-observation pattern works.** `docs/known-unwired-ledger-discipline.md` at v814 said per-ship release-notes discipline would catch stale entries manually. v834 is that catch happening 22 milestones later, exactly during pre-ship recon. The discipline doc's "not urgent — per-ship catches it" assertion was self-fulfilling: per-ship recon DID catch it; v834 closes the gap. This is evidence that **forward-observation doc paragraphs are load-bearing**: writing down "we expect to catch this manually" gives future operators a checklist item, even when the gate doesn't enforce it. Worth carrying forward as a 2nd instance arrives (e.g., the next inverse-check observation similarly catching a real drift).

**Second-most valuable:** stale-entry chips have a structurally different shape from wire-adding chips. A wire-adding chip removes an allowlist entry by adding `ensureProcessAllowed` calls + threading `ctx?`. A stale-entry chip removes the allowlist entry alone — no source change. The release-notes framing is different (no wire LOC; just allowlist LOC + count correction). Worth distinguishing in any future "chip shapes" codification.
