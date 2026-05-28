> Following v1.49.875 — _ProcessContext singleton chip: src/chipset/harness-integrity.ts (Track 4 CLOSE)_, v1.49.876 is the **ninth ship of the v868-v882 follow-on campaign** and **Track 5 chip #1** (Egress singleton chips ×6, size-ascending). Track 5 opens with `src/aminet/package-fetcher.ts` (177 LOC) via the **two-site hoisted-check wire shape**: ensureEgressAllowed hoisted before BOTH fetch sites (lha + readme). EgressContextDenied re-thrown from mirror-aggregation catch per #10427.

# v1.49.876 — EgressContext singleton chip: `src/aminet/package-fetcher.ts` (Track 5 chip #1)

**Shipped:** 2026-05-28

First chip of Track 5. Track 5 opens after Track 4 close at v875. **KNOWN_UNWIRED Egress: 6 → 5** (-1, -17%).

## What shipped

- **MODIFIED** `src/aminet/package-fetcher.ts` (177 LOC pre-wire):
  - Added imports for `ensureEgressAllowed`, `EgressContextDenied`, `EgressContext`.
  - Added `ctx?: EgressContext` as 3rd param to `fetchPackage` + 5th param to `fetchReadme`.
  - Hoisted `ensureEgressAllowed(ctx, 'aminet/package-fetcher', 'fetch', url)` BEFORE both fetch sites (lha in fetchPackage's loop, readme in fetchReadme).
  - Re-throws `EgressContextDenied` from the mirror-aggregation catch in fetchPackage per #10427.
  - Moved fetchReadme's hoist OUTSIDE the result-wrapping try/catch so security denial blocks the readme attempt regardless of the non-fatal fallback.
- **MODIFIED** `src/aminet/package-fetcher.test.ts`: +3 wire test cases.
- **MODIFIED** `src/security/egress-context-audit.test.ts`: removed entry; KNOWN_UNWIRED Egress 6 → 5.

## Engine state

NASA degree 1.178 (UNCHANGED — 94 consecutive ships).
Counter-cadence 6, Manifest 23, Lessons 85, Wired thresholds 5/7 (all UNCHANGED).
**KNOWN_UNWIRED Egress: 6 → 5.** Process: 0 (UNCHANGED — Track 4 close).
UNCODIFIED 39 ≤ 41.

## Wire shape: two-site hoisted-check (v867 fork-finder precedent)

Same shape as v867 (last Egress chip of the v857-v867 campaign). Two fetch sites in the file → two hoists. Cheapest viable shape when sites aren't shared by a helper.

## Verification

- `npx vitest run src/aminet/package-fetcher.test.ts` → 13/13 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → Egress 5 (was 6); Process 0 (UNCHANGED).
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path

Track 5 chips remaining: index-fetcher (213) → anthropic-chip (247) → http-client (350) → skill-installer (401) → ipc (516).
Then v1.49.882 verify-overdue scan.
