# v1.49.834 — Context

## Provenance

First chip ship post-v833 chain close. Operator authorization at this session: post-v833 next-direction prompt selected "ProcessContext singleton chips and lowConfidenceThreshold calibration" as a 2-ship sequence (Ship A this ship; Ship B = v835). Within Ship A scope, recon surfaced a stale-entry anomaly (`intelligence/analyzer/git.ts` listed in KNOWN_UNWIRED while already calling `ensureProcessAllowed`); operator confirmed "Stale-entry cleanup" as Ship A target.

## What this ship adds

```
src/security/process-context-audit.test.ts              [MODIFIED: 1 line removed + 7 line comment added]
.planning/PROJECT.md                                    [MODIFIED: pre-bump refresh]
```

No new files. No new tests. No new doc files. Just the allowlist edit that v812 missed.

## Recon trail (per #10422 ledger-driven work discipline)

1. **Confirm KNOWN_UNWIRED inventory:** `grep "^  'src/" src/security/process-context-audit.test.ts` returned 23 entries (not 22 as the handoff claimed). First sign of count drift.
2. **Audit each entry for already-wired status:** `for f in <23 entries>; do grep -c "ensureProcessAllowed\s*(" "$f"; done`. One stale: `src/intelligence/analyzer/git.ts` has 1 `ensureProcessAllowed` call.
3. **Verify the wire is correctly structured (#10427):** Read `src/intelligence/analyzer/git.ts:67-71`. The `ensureProcessAllowed` call IS hoisted outside the swallow-everything catch — canonical #10427 shape. Wire was authored correctly at v812; only the allowlist edit was missed.
4. **Trace the count drift to v812:** `git show v1.49.811:src/security/process-context-audit.test.ts | grep -c "^  'src/"` → 38. Same for v1.49.812: 38. v812 added the wire to git.ts but did NOT update the allowlist. Subsequent chip ships (v819, v820, v825, v827, v828) all referenced the previous ship's claimed count (off by 1) rather than re-deriving from the audit-test source-of-truth.
5. **Confirm doc-prediction:** Read `docs/known-unwired-ledger-discipline.md` § "Forward observations". Line 81-89 documents the "Unidirectional enforcement asymmetry" forward-observation, with explicit prediction: "the per-ship release-notes discipline catches it manually at chip cadence." v834 is that catch.
6. **Audit-test passes after the edit:** `npx vitest run src/security/process-context-audit.test.ts` → 2048 PASS (UNCHANGED count; git.ts now routes via `ensureProcessAllowed` path instead of the KNOWN_UNWIRED short-circuit).
7. **Verify no other ProcessContext entries are stale:** the `for f in ...; do grep -c ...` audit returned only 1 stale entry. All other 21 entries (not counting git.ts) are truly unwired.
8. **Verify pre-tag-gate:** 17/17 PASS at the v834 candidate state (full suite 35,235; step 13 within-ceiling).

## Discipline-extension vs stale-entry chip choice

This is a **stale-entry cleanup chip**, structurally different from the wire-adding chips that preceded it (v812 / v819 / v820 / v825 / v827 / v828). A wire-adding chip removes an allowlist entry by adding `ensureProcessAllowed` calls + threading `ctx?` through callers. A stale-entry chip removes the allowlist entry alone — no source change.

This pattern is at 1 instance; deferred from codification per #10426. If a 2nd instance occurs (e.g. an analogous recon-discovered stale Egress entry or LoaderContext entry), a future codify ship can synthesize the pattern.

## What was deferred

- **Audit-inverse-check enhancement** — add a 4th `it()` block in each `*-context-audit.test.ts` asserting `for each path in KNOWN_UNWIRED, !content.match(ensureXAllowed)`. Closes the unidirectional asymmetry permanently. Forward-flagged for a future small ship (~30 min). Not bundled with this ship to keep stale-entry chip scope minimal.
- **Audit-correct prior ship release-notes count claims** — v819 through v828 all quoted off-by-one counts. Updating those release notes would be post-facto book-keeping; declined.
- **Update `docs/known-unwired-ledger-discipline.md` line 28 table entry** — the v812 row says "Chip 1 — removes `intelligence/analyzer/git.ts` from process KNOWN_UNWIRED | 38 → 37 process". v812 wired but did not actually remove the entry. The doc framing is misleading in detail; correction declined for this ship to preserve the smaller cleanup scope.
- **Egress KNOWN_UNWIRED stale-entry audit** — same recon shape would catch any silently double-protected entries in the EgressContext allowlist. Forward observation; not exercised this ship.

## Verification trail

| Step | Result |
|---|---|
| `grep -c "^  'src/" src/security/process-context-audit.test.ts` | 22 (was 23 pre-edit) |
| `grep -c "ensureProcessAllowed\s*(" src/intelligence/analyzer/git.ts` | 1 (wire is in place) |
| `npx vitest run src/security/process-context-audit.test.ts` | 2048 PASS |
| `npm run build` | PASS |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (step 13 within-ceiling at 39 ≤ 41) |
| Full suite | 35,235 PASS / 45 skipped / 7 todo / 0 fail |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Stale-entry chip; no source-code wire change required.
- Pairs in 2-ship sequence with v835 calibration scaffold; release at session end.

## Forward path

- **v1.49.835 lowConfidenceThreshold calibration scaffold** — pre-planned Ship B this session. Adds `'predictive.low_confidence_threshold'` to `CalibratableThreshold` type + observation source registration (initially unwired with explicit gap doc).
- **NASA 1.179 forward-cadence** — STRONG-DEFAULT post-Ship B (~52 consecutive ships at 1.178 at v835 close).
- **Continued ProcessContext singleton chips** — ~13 truly unwired entries remain after this stale-entry chip; terminal family (3) + mesh family (2) + intel-analyzer-findings/stalled (1) are the obvious family-batch targets.
- **Audit-inverse-check enhancement** — operator-bounded ~30-min ship; closes the unidirectional asymmetry that v834 manually caught.

## References

- Predecessor: v1.49.833 (`docs/release-notes/v1.49.833/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.830-833-chain-closed.md`
- Source-of-truth audit-test: `src/security/process-context-audit.test.ts`
- Forward-observation source: `docs/known-unwired-ledger-discipline.md` § "Forward observations"
- The wire that was missed: v1.49.812 `chore(release): v1.49.812 first ProcessContext chip analyzer/git.ts`
- Already-wired file: `src/intelligence/analyzer/git.ts:67-71` (`ensureProcessAllowed` hoisted per #10427)
- Discipline cross-references: #10427 (failure-mode contracts / load-bearing surfaces) + #10432 (KNOWN_UNWIRED ledger)
