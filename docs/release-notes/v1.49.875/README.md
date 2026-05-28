> Following v1.49.874 — _ProcessContext singleton chip: src/learn/acquirer.ts (Track 4 chip #5)_, v1.49.875 is the **eighth ship of the v868-v882 follow-on campaign** and **Track 4 chip #6 (Track 4 CLOSE)** — the final Process singleton chip. Wires `src/chipset/harness-integrity.ts` (1440 LOC, largest file of the campaign) via the **hoist-at-top wire shape** despite the LOC. Confirms the v872 forward-observation: spawn-site count predicts wire shape more precisely than LOC band — this 1440 LOC file has only N=1 spawn site. **KNOWN_UNWIRED Process: 1 → 0 — chokepoint fully wired.**

# v1.49.875 — ProcessContext singleton chip: `src/chipset/harness-integrity.ts` (Track 4 CLOSE)

**Shipped:** 2026-05-28

Final chip of Track 4. KNOWN_UNWIRED Process drops to **0** — the ProcessContext chokepoint is now fully wired across all src/ files that spawn child processes. Eight months after the v806 introduction (16 grandfathered entries), the migration-debt ledger is empty for Process.

## What shipped

- **MODIFIED** `src/chipset/harness-integrity.ts` (1440 LOC pre-wire):
  - Added imports for `ensureProcessAllowed`, `ProcessContextDenied`, `ProcessContext`.
  - Added `ctx?: ProcessContext` as parameter to `checkNoEnvFilesTracked()` — the ONE function in the file that spawns a child process.
  - Hoisted `ensureProcessAllowed(ctx, 'chipset/harness-integrity', 'exec-sync', 'sh', ['-c', command])` BEFORE the `execSync` call.
  - Re-throws `ProcessContextDenied` from the 1 swallow-everything catch (result-wrapping fallback returns `passed: true` when git fails) per Lesson #10427.
  - Extracted the command into a local const so the hoist + spawn reference the same string for audit fidelity (v872 forward-observation applied).
- **MODIFIED** `src/chipset/harness-integrity.test.ts`:
  - Added imports for `ProcessContext`, `ProcessContextDenied`, `NULL_PROCESS_AUDIT_SINK`.
  - Added new `describe('ProcessContext wire (v1.49.875)')` block with 3 test cases: default-undefined preserves behavior; denial throws ProcessContextDenied; audit sink records source/target on the single spawn.
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/chipset/harness-integrity.ts'` from `KNOWN_UNWIRED` (was the last entry).
  - Added v1.49.875 block comment documenting the hoist-at-top wire + LOC-vs-spawn-count observation + Track 4 close.
  - **KNOWN_UNWIRED Process: 1 → 0** ✓

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/chipset/harness-integrity.test.ts` | +3 cases (46/46 PASS) | Wire verification on the single spawn-site function |
| `src/security/process-context-audit.test.ts` | 2051 PASS (no count change) | KNOWN_UNWIRED Process empty; the audit-test enforcement still applies (every src/ file with `child_process` imports must call `ensureProcessAllowed`) |

`node tools/security/check-stale-known-unwired.mjs` reports `ProcessContext (KNOWN_UNWIRED: 0) clean` (was 1).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **93 consecutive ships at 1.178**; widest pressure margin record extended by 1).
Counter-cadence count UNCHANGED at 6. Manifest 23 / Lessons 85 / Wired thresholds 5 of 7 (UNCHANGED).
**KNOWN_UNWIRED Process: 1 → 0** ✓ (chokepoint fully wired across src/).
Egress: 6 (UNCHANGED).
UNCODIFIED: 39 ≤ 41 (UNCHANGED).

## Wire shape: hoist-at-top despite 1440 LOC

The #10444 catalog uses LOC bands as the primary predictor of wire shape; v875 is the strongest counter-example to date. 1440 LOC predicts internal-helper or large-file patterns — but the file's actual structural shape is "N=1 spawn site buried inside a large invariant-check module." Spawn-site count = 1 → hoist-at-top, regardless of LOC.

This confirms the v872 forward-observation: **spawn-site count is the more precise predictor; LOC band is correlated but not deterministic.** PROMOTION-ELIGIBLE refinement to #10444 at the next codify ship.

## Track 4 close summary

| Chip | Ship | File | LOC | Wire Shape |
|---|---|---|---|---|
| #1 | v1.49.870 | src/learning/version-manager.ts | 177 | class-private-method (internal-helper) |
| #2 | v1.49.871 | src/git/workflows/contribute.ts | 183 | closure-capture |
| #3 | v1.49.872 | src/cli/commands/pic2html.ts | 311 | hoist-at-top (single spawn) |
| #4 | v1.49.873 | src/git/gates/pre-flight.ts | 363 | module-internal-helper |
| #5 | v1.49.874 | src/learn/acquirer.ts | 509 | safeExecFile wrapper (module-internal-helper variant) |
| #6 | v1.49.875 | src/chipset/harness-integrity.ts | 1440 | **hoist-at-top (single spawn — LOC counter-example)** |

6 chips, 6 different wire shape variants. The size-ascending heuristic surfaced wire-shape diversity as predicted by #10444; the v875 LOC counter-example sharpened the spawn-site-count-vs-LOC distinction.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 93 consecutive ships).
- Not a new discipline domain (manifest 23 entries).
- Not a counter-cadence ship.

## Verification

- `npx vitest run src/chipset/harness-integrity.test.ts` → 46/46 PASS.
- `npx vitest run src/security/process-context-audit.test.ts` → 2051 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → ProcessContext entryCount 0 (was 1); Egress 6 (UNCHANGED).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path post-v875

**Track 4 CLOSED.** Remaining v868-v882 campaign:
- **v1.49.876** — First Egress chip (Track 5 open): `src/aminet/package-fetcher.ts` (177 LOC).
- v1.49.877-881 — Egress chips #2-#6: index-fetcher (213) → anthropic-chip (247) → http-client (350) → skill-installer (401) → ipc (516).
- v1.49.882 — Verify-overdue forecast scan tool.
