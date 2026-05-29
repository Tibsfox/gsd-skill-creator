> Following v1.49.876 — _EgressContext singleton chip: src/aminet/package-fetcher.ts (Track 5 chip #1)_, v1.49.877 is the **tenth ship of the v868-v882 follow-on campaign** and **Track 5 chip #2**. Wires `src/aminet/index-fetcher.ts` (213 LOC) via **hoist-at-top inside mirror loop** (#10444 catalog N=1-fetch-per-iteration canonical). EgressContextDenied re-thrown from mirror-aggregation catch per #10427.

# v1.49.877 — EgressContext singleton chip: `src/aminet/index-fetcher.ts` (Track 5 chip #2)

**Shipped:** 2026-05-28

Second chip of Track 5. Size-ascending picks index-fetcher (213 LOC) after v876's package-fetcher (177 LOC). **KNOWN_UNWIRED Egress: 5 → 4.**

## What shipped

- **MODIFIED** `src/aminet/index-fetcher.ts` (213 LOC):
  - Added imports for `ensureEgressAllowed`, `EgressContextDenied`, `EgressContext`.
  - Added `ctx?: EgressContext` as 2nd param to `fetchAminetIndex`.
  - Hoisted `ensureEgressAllowed(ctx, 'aminet/index-fetcher', 'fetch', url)` BEFORE the fetch inside the mirror loop.
  - Re-throws `EgressContextDenied` from mirror-aggregation catch per #10427.
- **MODIFIED** `src/aminet/index-fetcher.test.ts`: +1 wire test case (denial).
- **MODIFIED** `src/security/egress-context-audit.test.ts`: removed entry; KNOWN_UNWIRED Egress 5 → 4.

## Engine state

NASA degree 1.178 (UNCHANGED — 95 consecutive ships).
Counter-cadence 6, Manifest 23, Lessons 85, Wired thresholds 5/7 (UNCHANGED).
**KNOWN_UNWIRED Egress: 5 → 4.** Process: 0 (UNCHANGED).
UNCODIFIED 39 ≤ 41.

## Wire shape: hoist-at-top inside mirror loop

Single fetch per mirror iteration → single hoist per iteration. The loop's mirror-aggregation catch handles non-security errors; #10427 re-throw lets security denials propagate.

## Verification

- `npx vitest run src/aminet/index-fetcher.test.ts` → 19/19 PASS.
- `node tools/security/check-stale-known-unwired.mjs` → Egress 4 (was 5).
- `bash tools/pre-tag-gate.sh` → 18/18 PASS.

## Forward path

Remaining Track 5: anthropic-chip (247) → http-client (350) → skill-installer (401) → ipc (516).
Then v882 verify-overdue scan.
