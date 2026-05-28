> Following v1.49.873 — _ProcessContext singleton chip: src/git/gates/pre-flight.ts (Track 4 chip #4)_, v1.49.874 is the **seventh ship of the v868-v882 follow-on campaign** and **Track 4 chip #5** (Process singleton chips ×6, size-ascending). Wires `src/learn/acquirer.ts` (509 LOC, 9 spawn sites across 6 helper functions) via the **module-internal-helper with safeExecFile wrapper** wire shape: introduces a `safeExecFile()` module-level helper that pairs `ensureProcessAllowed` + `execFileSync`. Records actual binary targets (`unzip`/`tar`/`git`/`curl`/`pdftotext`) rather than `sh`, giving better security visibility than the v870-v873 shell-exec chips.

# v1.49.874 — ProcessContext singleton chip: `src/learn/acquirer.ts` (Track 4 chip #5)

**Shipped:** 2026-05-28

Fifth chip of Track 4. Size-ascending picks acquirer.ts (509 LOC, 9 spawn sites) after v873's pre-flight.ts (363 LOC). The new step 18/18 cross-audit gate (wired v869) runs at pre-tag-gate as automatic continuous-verification. First chip to land in the upper-mid LOC band (400-800).

## What shipped

- **MODIFIED** `src/learn/acquirer.ts` (509 LOC pre-wire):
  - Added imports for `ensureProcessAllowed`, `ProcessContextDenied`, `ProcessContext`, `ExecFileSyncOptions`.
  - Added new module-internal helper `safeExecFile(ctx, command, args, opts)` that pairs `ensureProcessAllowed` (records `op='exec-file' target=<binary> argv=args`) with `execFileSync`.
  - Threaded `ctx?: ProcessContext` through `acquireSource` (3rd param) + 6 internal helpers (`acquireLocalFile`, `acquireArchive`, `acquireGitHub`, `acquireUrl`, `extractPdfText`, `extractDocxText`, `extractEpubText`).
  - Refactored all 9 spawn sites from `execFileSync(...)` to `safeExecFile(ctx, ...)`. Spawned binaries: `unzip` × 4, `tar` × 2, `git` × 1, `curl` × 1, `pdftotext` × 1.
  - Re-throws `ProcessContextDenied` from 3 result-wrapping catches (`extractPdfText` fallback, `extractDocxText` error path, `extractEpubText` error path) per Lesson #10427.
- **MODIFIED** `src/learn/acquirer.test.ts`:
  - Added imports for `ProcessContext`, `ProcessContextDenied`, `NULL_PROCESS_AUDIT_SINK`.
  - Added new `describe('ProcessContext wire (v1.49.874)')` block with 3 test cases: default-undefined preserves behavior on local file; denial throws ProcessContextDenied on a fake .zip; permissive ctx records audit event with `target='unzip'` (better visibility than `target='sh'`).
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/learn/acquirer.ts'` from `KNOWN_UNWIRED` (was the second-to-last entry).
  - Added v1.49.874 block comment documenting the safeExecFile module-internal helper + 9-spawn-site refactor + 3 #10427 re-throws.
  - KNOWN_UNWIRED Process: **2 → 1**.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/learn/acquirer.test.ts` | +3 cases (27/27 PASS) | Wire verification across acquireSource + archive + docx paths |
| `src/security/process-context-audit.test.ts` | 2051 PASS (no count change) | Allowlist count drops 2 → 1; inverse-audit invariants preserved |

`node tools/security/check-stale-known-unwired.mjs` reports `ProcessContext (KNOWN_UNWIRED: 1) clean` (was 2).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **92 consecutive ships at 1.178**).
Counter-cadence count UNCHANGED at 6. Manifest 23 / Lessons 85 / Wired thresholds 5 of 7 (UNCHANGED).
**KNOWN_UNWIRED Process: 2 → 1** (-1). Egress: 6 (UNCHANGED).
UNCODIFIED: 39 ≤ 41 (UNCHANGED).

## Wire shape: module-internal-helper with safeExecFile wrapper (variant of #10433)

509-LOC file with N=9 spawn sites across 6 helper functions. The closure-capture variant (v871) would require duplication across helpers; the module-internal-helper variant (v873) works but the spawn sites are non-uniform (different binaries, different argv shapes). Solution: introduce a `safeExecFile(ctx, command, args, opts)` helper that pairs `ensureProcessAllowed` with `execFileSync`. All 9 sites become 1-line `safeExecFile(...)` calls.

**Key improvement over v870-v873 shell-exec wires:** the safeExecFile pattern records the actual binary as the audit `target` (e.g., `unzip`, `tar`, `git`, `curl`, `pdftotext`), not just `sh`. This gives operators per-binary visibility into what's being spawned — useful for allow-list construction (allow `git` but not `curl`) and for forensic audits.

The 3-catch #10427 application is on the lower end of recent chips (v870: 5, v871: 4, v873: 11). Most of acquirer's spawn sites don't have surrounding catches — they propagate errors directly. Only the 3 fault-tolerant extractor catches needed re-throw.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 92 consecutive ships).
- Not a new discipline domain (manifest 23 entries).
- Not a counter-cadence ship.

## Verification

- `npx vitest run src/learn/acquirer.test.ts` → 27/27 PASS.
- `npx vitest run src/security/process-context-audit.test.ts` → 2051 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → ProcessContext entryCount 1 (was 2); Egress 6 (UNCHANGED).
- `npm run build` → PASS.
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path post-v874

Remaining v868-v882 campaign:
- **v1.49.875** — Process chip #6 (Track 4 close): `src/chipset/harness-integrity.ts` (1440 LOC; largest of the campaign).
- v1.49.876-881 — Egress chips ×6.
- v1.49.882 — Verify-overdue forecast scan tool.

Track 4 progress: 5/6 closed. One chip away from Track 4 close.
