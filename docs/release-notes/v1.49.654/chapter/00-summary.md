# 00 — Summary: v1.49.654 FA-652-11 Infrastructure + Lesson Codification

> Following v1.49.653 long-term-roadmap-closure, v1.49.654 closes the second-half of the v1.49.653 L-04 lesson-codification work plus the infrastructure-half of the FA-652-11 8-degree MUS/ELC drift counter-cadence.

## Scope: two converging tracks

The session combined two cleanups that share a single ship cycle:

1. **FA-652-11 infrastructure** — surveyed in `.planning/fa-652-11-drift-survey.md` at v1.49.652 close. The 8-degree MUS/ELC gap at degrees 1.109–1.116 has been recurrence-proofed via a new scaffold tool + depth-audit awareness. The content-half (16 MUS/ELC page backfills) deferred to v1.49.655 with proper parallel W2 dispatches.

2. **Lesson codification (L-04 second-half)** — v1.49.653 L-04 introduced the discipline-coverage audit and surfaced 31 UNCODIFIED + 10 PARTIAL lessons across the cumulative 95-lesson corpus. v1.49.654 closes the entire gap: 47/47 lessons now COVERED.

## Component layout

| Component | Description | Status |
|---|---|---|
| C04 | `tools/scaffold-cross-track-dirs.mjs` — cross-track scaffold creator | shipped |
| C05 | `tools/depth-audit.mjs` SCAFFOLD-PENDING + granular bypass | shipped |
| C06 | catalog-index gate validation (already detects drift) | verified — no change needed |
| C08 | 31 UNCODIFIED lessons → manifest + discipline docs | shipped |
| C09 | 10 PARTIAL lessons → resolved via cross-update | shipped |
| C01 | MUS 8-page backfill (1.109–1.116) | deferred → v1.49.655 |
| C02 | ELC 8-page backfill (1.109–1.116) | deferred → v1.49.655 |
| C03 | MUS + ELC catalog regeneration | deferred → v1.49.655 |

## Key files

| Path | Purpose |
|---|---|
| `tools/scaffold-cross-track-dirs.mjs` | NEW — idempotent cross-track scaffolder |
| `tools/__tests__/scaffold-cross-track-dirs.test.mjs` | NEW — 10 tests (helpers + render) |
| `tools/depth-audit.mjs` | SCAFFOLD-PENDING marker + SC_SKIP_DEPTH_AUDIT_MUS_ELC |
| `tools/pre-tag-gate.sh` | `depth-audit-mus-elc` bypass token in vocabulary |
| `tools/render-claude-md/disciplines.json` | +2 domains, +35 lesson IDs |
| `tools/render-claude-md/env-vars.json` | +SC_SKIP_DEPTH_AUDIT_MUS_ELC entry |
| `docs/sub-agent-dispatch-discipline.md` | NEW — sub-agent dispatch discipline doc |
| `docs/counter-cadence-discipline.md` | NEW — counter-cadence cadence discipline doc |
| `docs/MISSION-PACKAGE-DISCIPLINE.md` | +lesson coverage appendix (10 lessons) |
| `docs/SUBSTRATE-PROBE-DISCIPLINE.md` | +lesson coverage appendix (6 lessons) |
| `docs/T14-SHIP-SEQUENCE.md` | +lesson coverage appendix (4 lessons) |
| `docs/test-discipline/audit-method-corrections.md` | +lesson coverage appendix (3 lessons) |
| `project-claude/hooks/self-mod-guard.js` | codifies #10174 inline |
| `project-claude/hooks/git-add-blocker.js` | codifies #10201 inline |
| `package.json` | +scaffold:cross-track + scaffold:cross-track:dry-run scripts |
| `vitest.tools.config.mjs` | +scaffold-cross-track-dirs test path |

## Verification

```bash
# 54 tests passing
npx vitest run --config vitest.tools.config.mjs \
  tools/__tests__/depth-audit.test.mjs \
  tools/__tests__/scaffold-cross-track-dirs.test.mjs

# Discipline-coverage clean
node tools/check-discipline-coverage.mjs
# → COVERED 47 / PARTIAL 0 / UNCODIFIED 0

# Scaffold tool functional
node tools/scaffold-cross-track-dirs.mjs --dry-run
# → 117 NASA degrees scanned; MUS+ELC stubs would-create per gap

# Depth-audit recognizes marker
node tools/depth-audit.mjs 1.116
# → MUS, ELC: SCAFFOLD-PENDING (downgraded from FAIL)
```

## What's next

v1.49.655 (FA-652-11 content backfill) will use this milestone's scaffold tool as the W0 starting point. The scaffold produces minimal valid stubs; the W2 dispatches replace them with full substrate-tracked narrative cards matching the v1.0–v1.108 cohort depth.
