> Following v1.49.878 — _EgressContext singleton chip: src/chips/anthropic-chip.ts (Track 5 chip #3)_, v1.49.879 is the **twelfth ship of the v868-v882 follow-on campaign** and **Track 5 chip #4**. Wires `src/chips/http-client.ts` (350 LOC) via the **class-instance two-site hoisted-check** (sibling of v878). `ctx?: EgressContext` added to HttpClient constructor; `stream()` + `_fetch()` each hoist before their respective fetches. EgressContextDenied re-thrown from `_fetch()` retry catch per #10427.

# v1.49.879 — EgressContext singleton chip: `src/chips/http-client.ts` (Track 5 chip #4)

**Shipped:** 2026-05-28

Fourth chip of Track 5. **KNOWN_UNWIRED Egress: 3 → 2.** Sibling pattern of v878 anthropic-chip (class-based two-site hoisted-check).

## What shipped

- **MODIFIED** `src/chips/http-client.ts` (350 LOC):
  - Added imports for `ensureEgressAllowed`, `EgressContextDenied`, `EgressContext`.
  - Added `ctx?: EgressContext` as 2nd param to HttpClient constructor; stored as private field.
  - `stream()`: hoist OUTSIDE result-wrapping try/catch (denial blocks before fetch).
  - `_fetch()`: hoist inside retry loop, before each retry fetch attempt; EgressContextDenied re-thrown from retry-classification catch per #10427.
- **MODIFIED** `src/chips/http-client.test.ts`: +2 wire test cases (get + stream denial).
- **MODIFIED** `src/security/egress-context-audit.test.ts`: KNOWN_UNWIRED Egress 3 → 2.

## Engine state

NASA degree 1.178 (UNCHANGED — 97 consecutive ships).
Counter-cadence 6, Manifest 23, Lessons 85 (UNCHANGED).
**KNOWN_UNWIRED Egress: 3 → 2.** Process: 0 (UNCHANGED).
UNCODIFIED 39 ≤ 41.

## Wire shape: class-instance two-site hoisted-check (sibling of v878)

Same pattern as v878. The retry-loop variant means the _fetch hoist fires once per attempt — desirable because each retry is a distinct egress decision.

## Verification

- `npx vitest run src/chips/http-client.test.ts` → 18/18 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → Egress 2 (was 3).
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path

Remaining Track 5: skill-installer (401) → ipc (516).
Then v882 verify-overdue scan.
