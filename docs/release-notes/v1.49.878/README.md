> Following v1.49.877 — _EgressContext singleton chip: src/aminet/index-fetcher.ts (Track 5 chip #2)_, v1.49.878 is the **eleventh ship of the v868-v882 follow-on campaign** and **Track 5 chip #3**. Wires `src/chips/anthropic-chip.ts` (247 LOC) via the **class-instance variant of two-site hoisted-check**: `ctx?: EgressContext` added to the constructor and stored as a private field; `chat()` and `health()` each hoist before their respective fetches. First class-based wire in Track 5.

# v1.49.878 — EgressContext singleton chip: `src/chips/anthropic-chip.ts` (Track 5 chip #3)

**Shipped:** 2026-05-28

Third chip of Track 5. **KNOWN_UNWIRED Egress: 4 → 3.** First class-based Egress wire — ctx stored on class instance rather than threaded per-call.

## What shipped

- **MODIFIED** `src/chips/anthropic-chip.ts` (247 LOC):
  - Added imports for `ensureEgressAllowed`, `EgressContextDenied`, `EgressContext`.
  - Added `ctx?: EgressContext` as 2nd param to `constructor`; stored as private field `this.ctx`.
  - `chat()`: hoist before fetch on the strict-fail path.
  - `health()`: hoist BEFORE the result-wrapping try/catch + explicit re-throw inside catch per #10427.
  - Refactored chat/health URLs into local consts for hoist+spawn audit fidelity.
- **MODIFIED** `src/chips/anthropic-chip.test.ts`: +3 wire test cases.
- **MODIFIED** `src/security/egress-context-audit.test.ts`: removed entry; KNOWN_UNWIRED Egress 4 → 3.

## Engine state

NASA degree 1.178 (UNCHANGED — 96 consecutive ships).
Counter-cadence 6, Manifest 23, Lessons 85 (UNCHANGED).
**KNOWN_UNWIRED Egress: 4 → 3.** Process: 0 (UNCHANGED).
UNCODIFIED 39 ≤ 41.

## Wire shape: class-instance two-site hoisted-check

The class-based variant stores ctx on the instance; two-site hoisted-check applied at chat() and health(). The health() path uses both the hoist-outside-try pattern (denial blocks before fetch attempts) AND the #10427 re-throw discipline (defensive belt-and-suspenders).

## Verification

- `npx vitest run src/chips/anthropic-chip.test.ts` → 19/19 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → Egress 3 (was 4).
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path

Remaining Track 5: http-client (350) → skill-installer (401) → ipc (516).
Then v882 verify-overdue scan.
