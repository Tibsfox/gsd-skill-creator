> Following v1.49.879 — _EgressContext singleton chip: src/chips/http-client.ts (Track 5 chip #4)_, v1.49.880 is the **thirteenth ship of the v868-v882 follow-on campaign** and **Track 5 chip #5**. Wires `src/mcp/skill-installer.ts` (401 LOC) via **hoist-at-top before single fetch** in `installFromRemote`. ctx? threaded through installSkill + installFromRemote (4th param each).

# v1.49.880 — EgressContext singleton chip: `src/mcp/skill-installer.ts` (Track 5 chip #5)

**Shipped:** 2026-05-28

Fifth chip of Track 5. **KNOWN_UNWIRED Egress: 2 → 1.** One chip away from Track 5 close.

## What shipped

- **MODIFIED** `src/mcp/skill-installer.ts` (401 LOC):
  - Added imports for `ensureEgressAllowed`, `EgressContextDenied`, `EgressContext`.
  - Added `ctx?: EgressContext` as 4th param to `installSkill` and `installFromRemote`.
  - Hoisted `ensureEgressAllowed` BEFORE the single fetch in installFromRemote, OUTSIDE the try/finally (denial blocks before download attempt).
  - installFromLocal path bypasses ctx (no network egress).
- **MODIFIED** `src/mcp/skill-installer.test.ts`: +1 wire test case (denial).
- **MODIFIED** `src/security/egress-context-audit.test.ts`: KNOWN_UNWIRED Egress 2 → 1.

## Engine state

NASA degree 1.178 (UNCHANGED — 98 consecutive ships).
Counter-cadence 6, Manifest 23, Lessons 85 (UNCHANGED).
**KNOWN_UNWIRED Egress: 2 → 1.** Process: 0 (UNCHANGED).
UNCODIFIED 39 ≤ 41.

## Verification

- `npx vitest run src/mcp/skill-installer.test.ts` → 19/19 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → Egress 1 (was 2).
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path

Next: **v1.49.881** — Track 5 CLOSE: `src/intelligence/ipc.ts` (516 LOC).
Then v882 verify-overdue scan (campaign close).
