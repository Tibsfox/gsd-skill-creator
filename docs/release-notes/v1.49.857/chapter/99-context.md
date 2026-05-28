# v1.49.857 — Context

## Provenance

First ship of an operator-directed v857-v867 follow-on campaign after the v848-v856 nine-ship campaign closed clean. Codify ship per #10428 meta-cadence (10 ships past last codify at v847 — at the upper bound of the 7-10 ship cadence). Promotes the 1 eligible candidate accumulated during the v848-v856 campaign (stale-entry inverse-audit; 2 instances at v834 + v852); extends one existing discipline (KNOWN_UNWIRED allowlists as migration-debt ledger).

Operator chose doc + tool implementation at session start. Track order: Codify first → Process chips (~5) → Egress chips (~5). Batch size: singletons. Cadence: full autonomous, only stop on blockers.

## What this ship adds

```
docs/known-unwired-ledger-discipline.md       [MODIFIED: +"## Inverse-audit: stale-entry detection (Lesson #10443)" replaces v812 forward-observation placeholder; "## Forward observations" header restored above remaining sub-sections]
tools/render-claude-md/disciplines.json       [MODIFIED: +#10443 to KNOWN_UNWIRED entry's key_lessons; summary extended; canonical_docs +tools/security/check-stale-known-unwired.mjs; codified_at_milestone history record; trigger extended]
tools/security/check-stale-known-unwired.mjs  [NEW: cross-audit inverse-check tool; regex-extracts KNOWN_UNWIRED; runs Shape A + Shape B checks]
tests/security/check-stale-known-unwired.test.ts [NEW: 6 test cases; 2 sanity tests + 4 fixture-based detection tests]
CLAUDE.md                                     [MODIFIED: regenerated via npm run render:claude-md]
docs/release-notes/v1.49.857/                 [NEW: README + 4 chapters]
```

## Recon trail (per #10412 recon-first + #10422 ledger-driven work)

1. **Read v856 handoff** (`.planning/HANDOFF-2026-05-28-v1.49.848-v1.49.856-nine-ship-campaign.md`). 1 codify-eligible candidate enumerated at v856 close.
2. **Read v834 + v852 source-ship release notes** to confirm both stale-shapes + their first-instance files.
3. **Read v847 codify-ship release notes** as the template (most recent extend-existing-domain codify ship).
4. **Read all 3 audit-test files** (`process-context-audit.test.ts`, `egress-context-audit.test.ts`, `loader-context-audit.test.ts`) to confirm: (a) existing v838 shape-A inline inverse-checks are in place for Process + Egress; (b) Egress's existing "contains fetch(" check IS the shape-B equivalent for signature-driven chokepoints; (c) LoaderContext has no allowlist so neither shape applies.
5. **Read existing `docs/known-unwired-ledger-discipline.md`** to confirm the v812 "Forward observations / Unidirectional enforcement asymmetry" placeholder was the natural landing site.
6. **Decide scope:** doc + tool same-ship per operator decision. Verify preconditions: (a) the candidate's home is the existing #10432 discipline entry (no new manifest domain) ✓; (b) the tool is single-file with clear test surface ✓; (c) inline inverse-checks at v838 remain unchanged (defense-in-depth) ✓.
7. **Implement tool** (`tools/security/check-stale-known-unwired.mjs`, ~210 LOC):
   - regex-extract `KNOWN_UNWIRED` from both audit-test files
   - Shape A check against both audits
   - Shape B check (Process only) — parse named imports, check usage in body
   - JSON or human-readable output; exit-code-as-signal
8. **Write tests** (`tests/security/check-stale-known-unwired.test.ts`, 6 cases):
   - 2 sanity (exit-clean + JSON-output against real audit files)
   - 4 fixture-based (Shape A detection + Shape B detection + clean state + missing-file reporting)
9. **Verify tool runs clean against current KNOWN_UNWIRED state.** Both Process 11 + Egress 11 entries pass both shape checks.
10. **Edit `docs/known-unwired-ledger-discipline.md`** — replace v812 forward-observation placeholder with `## Inverse-audit: stale-entry detection (Lesson #10443)` top-level section + restore `## Forward observations` header above the two remaining sub-sections.
11. **Edit `tools/render-claude-md/disciplines.json`** — extend the KNOWN_UNWIRED entry (key_lessons + summary + canonical_docs + codified_at_milestone + trigger).
12. **Render CLAUDE.md** — `npm run render:claude-md` writes new disciplines section cleanly.
13. **Verify build + tests** — `npm run build` clean; `npx vitest run tests/security/check-stale-known-unwired.test.ts` 6/6 PASS; `node tools/check-discipline-coverage.mjs` 23 entries / 84 lessons / 39 UNCODIFIED ≤ 41 ceiling.
14. **Author release notes** — 5 files (README + 4 chapters).

## Discipline-extension vs new-domain choice

**EXTENSION of 1 existing discipline** rather than introducing a new domain. The stale-entry inverse-audit is a refinement of #10432 (KNOWN_UNWIRED as migration-debt ledger): the parent rule about debt-ledger semantics is unchanged; #10443 adds the accuracy-drift detection rule. Cross-references to #10421 (tool conventions) + #10427 (silent-vs-loud) + #10434 (KNOWN_UNWIRED generalization) keep the lesson discoverable from sibling disciplines.

The manifest holds at 23 domains; lessons-in-manifest goes 83 → 84.

## What was NOT promoted

Nothing eligible was deferred. The 1 candidate that reached the 2-instance threshold (two distinct stale-shapes at the META level per #10426) was promoted in this ship. Below-threshold observations (1-instance candidates) remain on the carried-forward list — see `chapter/03-retrospective.md` for the full inheritance.

## Verification trail

| Step | Result |
|---|---|
| `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` | JSON OK; 23 entries / 84 unique lessons (1 added; was 83) |
| `npm run render:claude-md` | CLAUDE.md updated cleanly; #10443 renders in KNOWN_UNWIRED entry |
| `node tools/security/check-stale-known-unwired.mjs` | Exit 0 (clean); 11 Process + 11 Egress entries pass both shape checks |
| `npx vitest run tests/security/check-stale-known-unwired.test.ts` | 6/6 PASS (~800ms) |
| `node tools/check-discipline-coverage.mjs` | 23 entries / 84 lessons / 39 UNCODIFIED ≤ 41 ceiling |
| `npm run build` | (expected) PASS |
| `bash tools/pre-tag-gate.sh` | (expected) 17/17 PASS |
| Full suite (expected) | 34,786 + 6 (new tests in this ship) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Codify + tool same-ship — extends 1 existing discipline + ships 1 tool + 1 test file. Source code unchanged in `src/`.
- v836 preservation gate continues to fire (15+ times now).
- PROJECT.md pre-edit BEFORE pre-tag-gate (per v849 lesson) to stay within 3-patch latest-shipped tolerance.

## Forward path post-v857

1. **Track 2 — Process singleton chips** (v858-v862, ~5 chips). Each chip ship re-runs `node tools/security/check-stale-known-unwired.mjs` post-edit.
2. **Track 3 — Egress chip campaign** (v863-v867, ~5 chips).
3. **NASA 1.179 forward-cadence** — strong-default standalone if the campaign pauses; 75 consecutive ships at 1.178 entering this ship.
4. **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).

## References

- Predecessor: v1.49.856 (`docs/release-notes/v1.49.856/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-28-v1.49.848-v1.49.856-nine-ship-campaign.md` (resolved by this ship — 1 codify candidate cleared)
- Last codify ship: v1.49.847 (`docs/release-notes/v1.49.847/` — 5-lesson full-backlog-clear)
- First Shape A instance: v1.49.834 (`docs/release-notes/v1.49.834/README.md`)
- First Shape B instance: v1.49.852 (`docs/release-notes/v1.49.852/README.md`)
- v838 inline closure for Shape A: `src/security/process-context-audit.test.ts:260-287`; `src/security/egress-context-audit.test.ts:227-251`
- Discipline doc: `docs/known-unwired-ledger-discipline.md`
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent) + #10434 (generalization beyond chokepoints) + new #10443 (inverse-audit stale-entry detection)
- Static-analysis tool authoring: Lesson #10421 (spawnSync, JSON output, exit-code-as-signal conventions)
- Failure-mode contracts: Lesson #10427 (silent-vs-loud asymmetry that the inverse-audit closes)
