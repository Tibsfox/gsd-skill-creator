> Following v1.49.838 — _Audit Inverse-Check (Stale-Entry Detector)_, v1.49.839 is the **ProcessContext singleton chip** for `intelligence/analyzer/findings/stalled.ts` — closing the 4-ship session's final scheduled ship. Forensic surface; the `ensureProcessAllowed` call is hoisted outside the best-effort-silent try/catch per Lesson #10427. KNOWN_UNWIRED Process 22 → 21.

# v1.49.839 — ProcessContext Singleton Chip: `intelligence/analyzer/findings/stalled.ts`

**Shipped:** 2026-05-27

## What shipped

- **MODIFIED** `src/intelligence/analyzer/findings/stalled.ts` (~18 LOC):
  - Adds optional `ctx?: ProcessContext` parameter to `hasRecentGitActivity` and `detectStalledMissions`.
  - Imports `ensureProcessAllowed` + `ProcessContext` from `src/security/process-context.ts`.
  - Hoists `ensureProcessAllowed(ctx, source, op, command)` OUTSIDE the swallow-everything try/catch (per #10427 + #10433 internal-helper pattern).
  - JSDoc updated to document the wire decision: load-bearing security denials propagate; forensic-surface git-availability errors remain silently swallowed.
- **MODIFIED** `src/security/process-context-audit.test.ts` (~1 line removed + 5 lines of comment added):
  - Removes `'src/intelligence/analyzer/findings/stalled.ts'` from `KNOWN_UNWIRED`.
  - Comment block documents the v839 wire decision + the rationale for the hoisted-outside-try/catch pattern.

## Why this ship

`intelligence/analyzer/findings/stalled.ts` was on the v834-835 handoff's "next obvious chip targets" list. Single child_process call site (`execFile('git', ['log', ...])`) wrapped in a best-effort-silent try/catch. The wire is the canonical forensic-surface pattern:

- Forensic surface (does not propagate execution errors): the try/catch around `execFileAsync` stays.
- Load-bearing security denial (must propagate): `ensureProcessAllowed` hoisted OUTSIDE the try/catch.

This is the same wire shape that v812 applied to `intelligence/analyzer/git.ts` (mentioned in the file header doc as the precedent). v839 follows the v812 pattern exactly.

The internal-helper-pattern refinement (#10433): `hasRecentGitActivity` is an internal helper that wraps the side-effecting `execFileAsync`. Threading `ctx?` through the helper costs 1 LOC × 2 callsites (helper signature + the one call site in `detectStalledMissions`) instead of N LOC × N callsites for a non-helper-wrapped raw spawn. The v839 wire is the canonical LOC-band-by-callsite-count instance: low-callsite-count + internal-helper-already-present = lightest wire.

## Engine state

NASA degree sustains at **1.178** — **57 consecutive ships at 1.178**, widest pressure margin record again. Counter-cadence count UNCHANGED at 6.

KNOWN_UNWIRED Process: **22 → 21** (-1 actual; -1 claim; aligned per the v834 source-of-truth count).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Manifest entries: **23** (UNCHANGED).
Lessons in manifest: **77** (UNCHANGED).
UNCODIFIED: **39** (UNCHANGED; ≤ ceiling 41).

Wired calibratable thresholds: **5 of 7** (UNCHANGED).

Codify-axis cadence: 6 ships past last codify (v833) — within the 7-10 ship floor.
Consume-axis cadence: 5 ships past last consume (v834) — within floor.

## What this ship is not

- Not a NASA degree advance (NASA 1.178 unchanged, now 57 consecutive).
- Not a batch chip (single entry; the v834-835 handoff mentioned terminal/mesh families as multi-entry batches; v839 is the singleton candidate).
- Not a codify ship (no new manifest entries).
- Not a new discipline domain.

## Tests

- 4 existing `detectStalledMissions` tests in `src/intelligence/analyzer/__tests__/stalled.test.ts` continue to PASS (no signature changes affect them; the new optional `ctx?` param defaults to undefined → legacy permissive behavior).
- 2050 ProcessContext audit-test enumeration continues to PASS (one fewer file in KNOWN_UNWIRED; the audit's forward + inverse checks both confirm clean state at v839 ship time).
- Full suite (expected): 35,259 (UNCHANGED; no new tests added — this is a wire ship, not a test-add ship).

## Verification

- `npx vitest run src/security/process-context-audit.test.ts src/intelligence/analyzer/__tests__/stalled.test.ts` → 2054 PASS.
- `npm run build` → clean.
- `bash tools/pre-tag-gate.sh` → 17/17 PASS (pending T14 step 1).

## Forward path post-v839

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT now (57 consecutive ships at 1.178). The 4-ship operational-debt session closes here.
2. **Continued ProcessContext singleton chips** — terminal family (3 entries: `cli/commands/terminal.ts`, `terminal/launcher.ts`, `terminal/session.ts`) remains a batched-chip candidate.
3. **Mesh family** (2 entries with injected-executor pattern; different wire shape — defer to a separate planning pass).
4. **Production caller of the predict path** — would activate v837's auto-emit wire.
5. **Next codify ship (v840+)** — picks up the v836+v838 bidirectional-pattern generalization + v833 carry-forwards + v837's polarity-flip + the 5+ eligible patterns.

## Most valuable single takeaway

**The 4-ship operational-debt session (v836 → v839) closed every flag from the v834-835 handoff that was structurally closeable in one session.** The four ships, in execution order:
- v836: publish.mjs chapter-overwrite friction → CLOSED (251-ship-old workaround)
- v837: predictive.low_confidence_threshold observation source → WIRED (v835 scaffold flipped to wired:true; production-caller-construction deferred per structural blocker)
- v838: audit inverse-check enhancement → CLOSED (v834 carry-forward)
- v839: ProcessContext singleton chip → APPLIED (KNOWN_UNWIRED -1)

Cumulative wall-clock: ~135min across 4 ships (~33min average). NASA degree pressure now 57 consecutive ships at 1.178 — the most visible open item by a margin even wider than the session start.

The pattern: **forward-flag handoffs → recon-then-close discipline → operational-debt paydown cadence.** When a handoff lists 4 candidates, executing them sequentially in one session keeps the discipline tight + the context shared. Per-ship recon caught a scope mismatch on v837 (production caller blocker) and a structural blocker on the audit-inverse-check (LoaderContext exclusion), both adjustments preserved the ship's value while honestly framing what wasn't possible.

**Second-most valuable:** v836's preservation gate fired correctly through v837 + v838 + v839's chapters — 6 PRESERVED log lines total across the 3 subsequent ships. v836's two-layer-closure pattern works end-to-end. The friction class is gone for good.
