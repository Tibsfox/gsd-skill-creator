# v1.49.857 — Codification Ship: Promote #10443 (Inverse-audit Stale-Entry Detection)

**Released:** 2026-05-28

## Why this ship

Codification ship for the v856-handoff's 1-candidate eligible backlog (stale-entry inverse-audit pattern). One ship past the v847 codify ship — the v847 cleared the full 5-candidate backlog so v857 lands at the codify-cadence upper bound with only the v834+v852 candidate accumulated during the v848-v856 nine-ship campaign.

Operator chose doc + tool implementation (not doc-only). The tool sets up the inverse-audit BEFORE the v858-v862 Process chip cluster + v863-v867 Egress chip cluster, so each chip can re-run the tool post-edit to verify no new stale entries are introduced.

## The 1 lesson

### #10443 — Inverse-audit: stale-entry detection (KNOWN_UNWIRED ledger refinement)

The v806 audit-tests are unidirectional: they enforce "files NOT in KNOWN_UNWIRED but containing the signature MUST call `ensure*Allowed`" but do NOT enforce the inverse — that allowlist entries remain load-bearing. Two distinct stale-shapes have accumulated under that asymmetry:

- **Shape A — wired-but-still-in-allowlist** (surfaced v1.49.834): `src/intelligence/analyzer/git.ts` was wired at v812 but the allowlist edit was silently skipped; the off-by-one persisted across 22 milestones of release-notes count claims. Closed at v838 by inline inverse-checks inside `process-context-audit.test.ts` + `egress-context-audit.test.ts`.

- **Shape B — import-without-use** (surfaced v1.49.852): `src/scan-arxiv/bridge.ts` imported `execFileSync` from `node:child_process` but never called it. Audit's "entry imports child_process" check passed (the import was syntactically present); no real spawn ever happened. Not closed by any existing inverse-check.

Two distinct stale-shapes meet the #10426 2-instance promotion threshold at the META level: the inverse-audit isn't shape-A-specific. A third shape would extend the catalog rather than create a new discipline.

**Codification target:** any future audit-test introducing a `KNOWN_UNWIRED` allowlist. Add one inverse-check per stale-shape. The new tool `tools/security/check-stale-known-unwired.mjs` consolidates both shape checks at the cross-audit layer; the existing inline inverse-checks in the audit-test files remain for defense-in-depth + automatic CI enforcement.

Codified into `docs/known-unwired-ledger-discipline.md` as a new top-level section replacing the v812-era "Forward observations / Unidirectional enforcement asymmetry" placeholder.

## Surface delta

- 1 canonical-doc extension (`docs/known-unwired-ledger-discipline.md`)
- 1 manifest entry extension in `disciplines.json` (`KNOWN_UNWIRED allowlists as migration-debt ledger`)
- CLAUDE.md regenerated
- 1 new tool: `tools/security/check-stale-known-unwired.mjs`
- 1 new test file: `tests/security/check-stale-known-unwired.test.ts` (+6 cases)
- 0 source-code changes (chokepoint audit-tests untouched; tool consumes them via regex)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 83 | 84 |
| Open lesson candidate backlog | 1 | 0 |
| Tentative observations carried forward | ~9 | ~8 |

## Engine state

NASA degree at **1.178** (UNCHANGED — 75 consecutive ships at 1.178; was 74 entering this ship). New widest pressure margin record by 1.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 11.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
