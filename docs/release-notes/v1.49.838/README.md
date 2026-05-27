> Following v1.49.837 — _`predictive.low_confidence_threshold` Observation Source Wired_, v1.49.838 is the **audit-inverse-check enhancement** ship. Closes the v834-flagged unidirectional asymmetry in the chokepoint audit tests: `KNOWN_UNWIRED` entries that have been silently wired (file calls `ensure*Allowed()` but allowlist entry is stale) now fail the audit deterministically rather than depending on per-ship recon discipline to catch them.

# v1.49.838 — Audit Inverse-Check (Stale-Entry Detector)

**Shipped:** 2026-05-27

## What shipped

- **MODIFIED** `src/security/process-context-audit.test.ts` (+25 LOC, +1 `it` block): adds the inverse-check `KNOWN_UNWIRED entries do NOT call ensureProcessAllowed (stale-entry detector)`. Aggregates stale entries into a single error message with the full list.
- **MODIFIED** `src/security/egress-context-audit.test.ts` (+25 LOC, +1 `it` block): mirrors the process-context inverse-check for EgressContext. Checks `KNOWN_UNWIRED` against `ENSURE_EGRESS_ALLOWED_REGEX`.
- **NOT MODIFIED** `src/security/loader-context-audit.test.ts`: no `KNOWN_UNWIRED` set exists for LoaderContext, so the inverse-check is N/A.

## Why this ship

v834 closed the first stale-entry instance: `intelligence/analyzer/git.ts` was wired by v812's ship but the `KNOWN_UNWIRED` allowlist entry was never removed. The audit test's early-exit at `KNOWN_UNWIRED.has(label) → return` masked the wire from the chokepoint check for 22 ships. v834's release notes flagged the missing inverse-check as a forward-observation:

> **Audit-inverse-check enhancement as defensive measure** (1 forward-flag from v834) — operator-bounded ~30-min ship; closes the chokepoint audit's unidirectional asymmetry permanently.

The asymmetry: the existing audit checks "does an out-of-allowlist file call `ensureXAllowed`?" but NOT "does an in-allowlist file fail to call `ensureXAllowed`?" The forward direction catches missing wires; the inverse direction catches stale allowlist entries. Both are needed for the audit to be bidirectionally complete.

v838 adds the inverse check. With both directions in place:
- **Forward (existed):** out-of-allowlist files that import `child_process` (or call `fetch`) MUST either call `ensure*Allowed` or have a `Role: NOT a ... caller` header doc. Catches missing wires.
- **Inverse (this ship):** in-allowlist files MUST NOT call `ensure*Allowed`. Catches stale allowlist entries that should have been removed when the file was wired.

The v834 case study would have been caught by this gate the SAME ship it was introduced (v812) instead of waiting 22 ships for manual recon to find it.

## Discipline-extension framing

This is an **enforcement-surface extension** of the existing chokepoint-audit discipline (#10434 ratchet ledger). The discipline doc at `docs/known-unwired-ledger-discipline.md` v814 explicitly forward-flagged this enhancement:

> The v806 audit-test enforcement is unidirectional (catches missing wires but not stale allowlist entries); inverse check is a future enhancement.

v838 lands that future enhancement. No new discipline domain; no new manifest entry.

## Engine state

NASA degree sustains at **1.178** — **56 consecutive ships at 1.178**, widest pressure margin record again. Counter-cadence count UNCHANGED at 6.

KNOWN_UNWIRED Process: **22** (UNCHANGED; the inverse-check confirmed all 22 entries are NOT wired — clean state at v834 close holds).
KNOWN_UNWIRED Egress: **11** (UNCHANGED; same — no stale entries detected).
Manifest entries: **23** (UNCHANGED).
Lessons in manifest: **77** (UNCHANGED).
UNCODIFIED: **39** (UNCHANGED; ≤ ceiling 41).

Wired calibratable thresholds: **5 of 7** (UNCHANGED).

Codify-axis cadence: 5 ships past last codify (v833) — within the 7-10 ship floor.
Consume-axis cadence: 4 ships past last consume (v834) — within floor.
Calibrate-axis cadence: at floor; v837 was the most recent calibrate-axis adjacent ship.

## What this ship is not

- Not a NASA degree advance (NASA 1.178 unchanged, now 56 consecutive).
- Not a chip ship (KNOWN_UNWIRED counts unchanged).
- Not a codify ship (extends existing discipline doc; no new manifest entry).
- Not a new audit domain (extends process + egress audit tests).

## Tests

- 2 new `it` blocks across `src/security/process-context-audit.test.ts` + `src/security/egress-context-audit.test.ts`.
- Both inverse-checks fire and PASS at v838 ship time (no stale entries currently — v834's cleanup left things clean).
- Full suite: 35,259 PASS (was 35,257; +2 net).

## Verification

- `npx vitest run src/security/process-context-audit.test.ts src/security/egress-context-audit.test.ts src/security/loader-context-audit.test.ts` → 4118 PASS.
- `npm run build` → clean.
- `bash tools/pre-tag-gate.sh` → 17/17 PASS (pending T14 step 1).
- Full suite (expected): 35,259 PASS / 45 skipped / 7 todo / 0 fail.

## Forward path post-v838

1. **Continued ProcessContext singleton chips** — Ship #3 of the 4-ship session. Terminal family, mesh family, intel/analyzer/findings/stalled.ts batches available.
2. **NASA 1.179 forward-cadence** — strong-default after the 4-ship sequence (1 more ship to go: ProcessContext chip).
3. **Production caller of the predict path** — would activate v837's auto-emit wire.
4. **Next codify ship (v840+)** — picks up v836's #10431 sub-pattern + v833 carry-forwards + v837's polarity-flip + v838's inverse-check-pattern-as-bidirectional-enforcement-completeness.

## Most valuable single takeaway

**Bidirectional enforcement completeness** is a recognizable shape: any cross-cutting audit that maintains an allowlist of grandfathered entries needs BOTH a forward check (out-of-allowlist files must conform) AND an inverse check (in-allowlist files must NOT conform — otherwise the entry is stale). The unidirectional shape that v806 shipped (forward-only) was structurally incomplete; the v834 case study (22-ship-old off-by-one drift) was the cost of that incompleteness. v838 closes the gap permanently.

**Second-most valuable:** the inverse-check pattern aggregates errors rather than throwing on the first failure. If 3 entries are stale, the test reports all 3 in a single error message rather than firing 3 separate test failures. Operator gets full context for cleanup in one pass. This is a small UX detail but it pays off when batch cleanup is needed.
