> Following v1.49.866 — _EgressContext singleton chip: `src/site/deploy.ts`_, v1.49.867 is the **fifth and final chip of Track 3** — closes the v857-v867 operator-directed follow-on campaign. Wires `src/alternative-discoverer/fork-finder.ts` (GitHub fork analyzer) through the EgressContext chokepoint via two-site hoisted-check pattern. Also surfaces + fixes a v857 cross-audit tool regex bug (non-greedy `[]` collision inside comments). **KNOWN_UNWIRED Egress count: 7 → 6.** Campaign closes 11/11.

# v1.49.867 — EgressContext singleton chip: `src/alternative-discoverer/fork-finder.ts` (Track 3 close)

**Shipped:** 2026-05-28

Fifth and final chip of Track 3. `findForks` performs two fetches against the GitHub API (forks list + per-fork releases). Wire threads `ctx?: EgressContext` through `findForks` + `ForkFinder.find`; `ensureEgressAllowed` hoisted at TWO sites (one before each fetch try-block).

**v857 cross-audit tool bug fix:** The v867 chip's wire-shape comment contained the substring "all errors return []" — which collided with the tool's non-greedy regex terminator `[\s\S]*?\]\s*\)`. The regex stopped at the first `[]` inside a comment instead of at the actual Set's closing `])`. Fixed by hardening the regex with `^\s*\]\s*\)` (multi-line flag, line-start anchor). v857 tool's first real-world bug surfaced at v867 — codified at next codify ship as a refinement of #10421.

## What shipped

- **MODIFIED** `src/alternative-discoverer/fork-finder.ts` — imports + `findForks(dep, registryMeta, ctx?)` + `ForkFinder.find(dep, meta, ctx?)`; `ensureEgressAllowed` hoisted at TWO sites (forks-list fetch + per-fork releases fetch inside Promise.all).
- **MODIFIED** `src/security/egress-context-audit.test.ts` — removed entry + v867 wire-shape comment.
- **MODIFIED** `src/alternative-discoverer/fork-finder.test.ts` — new `describe('EgressContext wire (v1.49.867)')` block with 2 test cases (deny on GitHub URL + bypass for non-GitHub deps).
- **MODIFIED** `tools/security/check-stale-known-unwired.mjs` — hardened the KNOWN_UNWIRED-extraction regex to require `^\s*\]\)` (start-of-line anchor + multi-line flag) so `[])` substrings inside comments don't trip the non-greedy terminator. Closes the bug surfaced at v867 authoring.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/alternative-discoverer/fork-finder.test.ts` | +2 | 11 → 13 total |
| `src/security/egress-context-audit.test.ts` | (no count change) | 2052 audit-test cases pass |
| `tests/security/check-stale-known-unwired.test.ts` | (no count change) | 6/6 PASS — regex hardening doesn't break fixtures |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 6 + Egress 6; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **85 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
KNOWN_UNWIRED Process: **6** (UNCHANGED). **Egress: 7 → 6.**
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

Two-site hoisted-check variant. The function has two fetch sites (forks list + per-fork releases inside Promise.all); each gets its own hoisted `ensureEgressAllowed` call BEFORE the try-block. ProcessContextDenied propagates from either site.

## Track 3 closure summary (v863-v867, 5 chips)

| Ship | File | Wire shape | KNOWN_UNWIRED Egress |
|---|---|---|---|
| v863 | `src/terminal/health.ts` | Hoist-at-top fetch (fault-tolerant) | 11 → 10 |
| v864 | `src/alternative-discoverer/equivalent-searcher.ts` | Hoist-at-top with non-npm bypass | 10 → 9 |
| v865 | `src/aminet/index-freshness.ts` | Hoist-before-fetch (strict-fail) | 9 → 8 |
| v866 | `src/site/deploy.ts` | DI-fetch-wrapper (Egress analog of #10441) | 8 → 7 |
| v867 | `src/alternative-discoverer/fork-finder.ts` | Two-site hoisted-check | 7 → 6 |

**Net 5-chip Track 3 batch: KNOWN_UNWIRED Egress 11 → 6** (-5 entries, -45% of the entering Egress list). Pattern coverage: hoist-at-top × 3, DI-fetch-wrapper × 1, two-site × 1.

## Campaign closure summary (v857-v867, 11 ships)

- **Track 1 (codify, 1 ship):** v857 promoted #10443 (inverse-audit stale-entry detection) + shipped `tools/security/check-stale-known-unwired.mjs`.
- **Track 2 (Process chips, 5 ships):** v858-v862. KNOWN_UNWIRED Process 11 → 6 (-45%). 5 distinct wire shapes.
- **Track 3 (Egress chips, 5 ships):** v863-v867. KNOWN_UNWIRED Egress 11 → 6 (-45%). 5 distinct wire shapes (3 reused from Track 2 + 2 new).

**Cross-audit tool operational record:** 10 consecutive applications across v858-v867. First real-world bug surfaced + fixed at v867 (regex hardening). Continuous-verification mode established.

## Surface delta

- 4 files modified (3 source + 1 tool)
- +18 source LOC + 50 test LOC + 4 tool LOC (regex hardening + comment)
- KNOWN_UNWIRED Egress: 7 → 6
- Campaign close: 11/11 ships SHIPPED
