# v1.49.867 — Context

## Provenance

Eleventh and final ship of the operator-directed v857-v867 follow-on campaign; **fifth and final chip of Track 3** (closes the Egress cluster + the campaign).

`src/alternative-discoverer/fork-finder.ts` chosen because: 151 LOC with TWO fetch sites (forks list + per-fork releases). Last in size-ascending sequence; introduces two-site hoisted-check variant.

The v867 ship also surfaces + fixes a v857 cross-audit tool bug. The wire-shape comment for v867 contained the substring "all errors return []" which tripped the tool's non-greedy regex terminator `[\s\S]*?\]\s*\)`. Fix: harden the regex with `^\s*\]\s*\)` (line-start anchor + multi-line flag).

## What this ship adds

```
src/alternative-discoverer/fork-finder.ts                    [MODIFIED: ctx? threaded through findForks + class wrapper; two hoisted ensureEgressAllowed sites]
src/alternative-discoverer/fork-finder.test.ts               [MODIFIED: +2 EgressContext wire cases]
src/security/egress-context-audit.test.ts                    [MODIFIED: removed from KNOWN_UNWIRED + v867 comment]
tools/security/check-stale-known-unwired.mjs                 [MODIFIED: hardened KNOWN_UNWIRED-extraction regex with line-start anchor + multi-line flag]
docs/release-notes/v1.49.867/                                [NEW: README + 4 chapters]
```

## Recon trail

1. Pick: `src/alternative-discoverer/fork-finder.ts` (151 LOC, 2 fetches).
2. Read source: 2 fetch sites in single function (forks list + per-fork releases inside Promise.all).
3. Apply wire: 2 hoisted checks + ctx? on findForks + class wrapper.
4. Update audit-test KNOWN_UNWIRED.
5. Add 2 test cases (GitHub URL denial + non-GitHub bypass).
6. **Tool bug surfaced during stale-audit verification** — Egress reported 0 entries instead of 6. Investigation: regex non-greedy terminator collided with `[])` in v867 comment.
7. Fix tool regex with line-start anchor + multi-line flag.
8. Re-verify: tool reports correct counts (Process 6, Egress 6); fixture tests still 6/6 PASS.
9. Pre-tag-gate — pending.
10. Author release notes — this ship.

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Final ship of the v857-v867 campaign. STATE.md will reset to v867 SHIPPED + counter-cadence count UNCHANGED at 6 + NASA degree 1.178.
- Tool fix committed alongside the chip (single-ship coupling per the v857 codify + tool same-ship pattern).

## Wire shape (per Lesson #10427)

Two-site hoisted-check variant. Each fetch site gets its own hoisted `ensureEgressAllowed` call BEFORE the try-block.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship — tool fix is operational, not discipline-doc work). Surfaces new tentative observations (carried forward for next codify ship at ~v874-877).

## Campaign closure

**Track 3 progress: 5 of 5 chips shipped (v863-v867).** Track 3 CLOSED.

**Campaign progress: 11/11 ships shipped.** v857 (codify) + v858-v862 (Process × 5) + v863-v867 (Egress × 5). CAMPAIGN CLOSED.

Final state:
- KNOWN_UNWIRED Process: 6 (was 11 at campaign open; -5, -45%).
- KNOWN_UNWIRED Egress: 6 (was 11 at campaign open; -5, -45%).
- Manifest entries: 23 (UNCHANGED).
- Lessons in manifest: 84 (+1 from v857).
- UNCODIFIED: 39 ≤ 41 (UNCHANGED).
- NASA degree: 1.178 (UNCHANGED — 85 consecutive ships at 1.178, widest pressure margin record by 11).
- Counter-cadence count: 6 (UNCHANGED).
- Cross-audit tool: 10 consecutive clean applications + 1 bug fix.

## Forward path post-v867

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT. 85 consecutive ships at 1.178 is the widest pressure margin to date. Single-ship, ~60-90 min.
2. **Next codify ship** (~v874-877) — eligible candidates:
   - Cross-audit tool continuous-verification (10 instances, promotion-eligible NOW).
   - Chip-pick by size correlates with wire-shape diversity (2 instances).
   - The v867 silent-failure-in-tool sibling rule (1 instance; wait for 2nd).
3. **Continued Process chips** — 6 remaining (harness-integrity, pic2html, pre-flight, contribute, learn/acquirer, learning/version-manager).
4. **Continued Egress chips** — 6 remaining (aminet/index-fetcher, aminet/package-fetcher, chips/anthropic-chip, chips/http-client, intelligence/ipc, mcp/skill-installer).

## References

- Predecessor: v1.49.866
- Campaign opening: v1.49.857 (`docs/release-notes/v1.49.857/`) — codify ship
- Track 2 opening: v1.49.858 (`docs/release-notes/v1.49.858/`)
- Track 2 close: v1.49.862 (`docs/release-notes/v1.49.862/`)
- Track 3 opening: v1.49.863 (`docs/release-notes/v1.49.863/`)
- Cross-audit tool: `tools/security/check-stale-known-unwired.mjs` (10 consecutive clean + 1 bug fix at v867)
