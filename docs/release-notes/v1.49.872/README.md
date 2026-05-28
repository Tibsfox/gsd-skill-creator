> Following v1.49.871 — _ProcessContext singleton chip: src/git/workflows/contribute.ts (Track 4 chip #2)_, v1.49.872 is the **fifth ship of the v868-v882 follow-on campaign** and **Track 4 chip #3** (Process singleton chips ×6, size-ascending). Wires `src/cli/commands/pic2html.ts` (311 LOC) via the **hoist-at-top wire shape**: single `ensureProcessAllowed` before the single Python3 spawn site in `loadImage`. New per-file test surface (2 cases) verifies wire behavior with a fake-PNG fixture (the wire check fires before image decoding).

# v1.49.872 — ProcessContext singleton chip: `src/cli/commands/pic2html.ts` (Track 4 chip #3)

**Shipped:** 2026-05-28

Third chip of Track 4. Size-ascending picks pic2html (311 LOC) after v871's contribute.ts (183 LOC). The new step 18/18 cross-audit gate (wired v869) runs at pre-tag-gate as automatic continuous-verification. First chip in the Process cluster to land in the mid-LOC band (#10444 catalog: 200-400 LOC predicts hoist-at-top, hoist-outside-Promise, or closure-capture).

## What shipped

- **MODIFIED** `src/cli/commands/pic2html.ts` (311 LOC pre-wire):
  - Added `import { ensureProcessAllowed, type ProcessContext }` from `../../security/process-context.js`.
  - Added `ctx?: ProcessContext` as 2nd parameter to `loadImage()` and 3rd parameter to `pic2html()`.
  - Refactored inline `python3 -c "..."` script into local `const pythonScript` so the hoist + the spawn reference the same string for audit fidelity.
  - Hoist-at-top: single `ensureProcessAllowed(ctx, 'cli/commands/pic2html', 'exec-sync', 'sh', ['-c', \`python3 -c "${pythonScript}"\`])` BEFORE the `execSync` call.
  - The shell-exec wraps python3; audit records `op='exec-sync' target='sh' argv=['-c', 'python3 -c "..."']`. `ProcessContextDenied` propagates through the try/finally (finally only handles tmpfile cleanup; security errors never reach finally because hoist fires before the try).
- **NEW** `src/cli/commands/pic2html.test.ts` — 2 test cases:
  - `throws ProcessContextDenied when ctx denies sh exec`: denying ctx + fake-PNG fixture → wire check throws before python3 spawn.
  - `records audit event when ctx is threaded and sh is allowed`: permissive ctx + fake-PNG → wire check records audit event with `source='cli/commands/pic2html'` + `target='sh'` (the spawn itself then fails because the fake PNG can't be decoded, but the wire check fired first).
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/cli/commands/pic2html.ts'` from `KNOWN_UNWIRED` (was line 57).
  - Added v1.49.872 block comment documenting the hoist-at-top wire (3rd-param ctx through pic2html, 2nd-param through loadImage, single ensureProcessAllowed at top of loadImage, pythonScript-refactor for audit fidelity).
  - KNOWN_UNWIRED Process: **4 → 3**.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/cli/commands/pic2html.test.ts` | NEW; +2 cases | First test file for pic2html. Wire verification: denial propagation + audit threading via fake-PNG fixture |
| `src/security/process-context-audit.test.ts` | 2051 PASS (no count change) | Allowlist count drops 4 → 3; inverse-audit invariants preserved |

`node tools/security/check-stale-known-unwired.mjs` reports `ProcessContext (KNOWN_UNWIRED: 3) clean` (was 4).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **90 consecutive ships at 1.178**; widest pressure margin record extended by 1 over v871).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED). Lessons in manifest: **85** (UNCHANGED). Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 4 → 3** (-1). Egress: **6** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED). Operational axes: **4** (UNCHANGED).

## Wire shape: hoist-at-top (single-spawn-site canonical)

311-LOC file with N=1 spawn site (`execSync` inside `loadImage`). The canonical shape per #10444 catalog for N=1 is **hoist-at-top** — single `ensureProcessAllowed` at the top of the function containing the spawn, before any try/catch. The fake-PNG fixture pattern in the new test file lets the wire test run without a real image (the wire check fires synchronously before python3 is invoked).

The pythonScript refactor (extracting the inline string into a local const) preserves audit fidelity: the hoist's argv and the actual execSync command reference the same string. Without the refactor, the hoist would record one string and execSync would execute a slightly different one (potential drift if anyone refactors the python source).

## What this ship is not

- Not a NASA degree advance (still 1.178; now 90 consecutive ships).
- Not a new discipline domain (manifest stays at 23 entries).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).

## Verification

- `npx vitest run src/cli/commands/pic2html.test.ts` → 2/2 PASS.
- `npx vitest run src/security/process-context-audit.test.ts` → 2051 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → exit 0; ProcessContext entryCount 3 (was 4); EgressContext entryCount 6 (UNCHANGED).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS (step 18 cross-audit clean post-wire).

## Forward path post-v872

Remaining v868-v882 campaign:
- **v1.49.873** — Process chip #4: `src/git/gates/pre-flight.ts` (363 LOC).
- v1.49.874-875 — Process chips #5-#6: learn/acquirer (509) → harness-integrity (1440; largest, Track 4 close).
- v1.49.876-881 — Egress chips ×6.
- v1.49.882 — Verify-overdue forecast scan tool.
