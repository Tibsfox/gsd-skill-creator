# v1.49.576 — OOPS-GSD Alignment + Implementation

**Closed:** 2026-04-25 (on `dev`)
**Shape:** Two-part single-milestone (Part A research + Part B implementation)
**Phases:** 4 waves (W0 foundations → W1 settings/hooks → W2 dual-impl/memory →
W3 schema/telemetry/inventory → W4 closing wave)
**Components shipped:** 9 (C0, C1, C2, C3 split into 3 sub-commits, C4, C5, C6)
**Audit rows closed:** 18 / 18 HIGH+BLOCK; 11 / 11 supporting MEDIUM; 2 / 2 LOW batched
**Tests:** 28,066 passing (vs v1.49.575 baseline 27,887 → **+179 tests**)
**Test files added:** 24 (per `git log --diff-filter=A` since `11fcec909`)
**BLOCKs closed:** 2 (OGA-013 PostCompact recovery; OGA-023 memory survey scorer 76.6% reduction vs 40% target)
**Commits in range:** 37 (`dba568d3d` W0 → `8c0cf2b9e` W4 manifest regen)
**ADRs landed:** 2 (ADR 0001 vendoring policy; ADR 0002 PreCompact triple-mapping)

## GSD is different from upstream, not behind it

> The mission began as a self-audit: ten OOPS documents (00–09) compared
> against upstream `gsd-build/get-shit-done@1.38.3` and against the local
> `gsd-skill-creator` repo. Part A produced the 65-row three-way alignment
> matrix; 18 of those rows came back BLOCK or HIGH. Part B closed every
> one of them on the same release.

The convergent-discovery framing carried over from v1.49.573–v1.49.575 and
held at row granularity: of the 65 matrix rows, only **17 are local drift**.
**21 are intentional substrate divergence** that neither the OOPS corpus nor
upstream has language for yet. The implementation half therefore had a
smaller, sharper target than a naive "audit found 65 things, fix them all"
framing would have produced.

## Part A — alignment audit deliverable

| Module | Output |
|---|---|
| M1 OOPS extraction | 50 patterns extracted from 10 OOPS docs (target ≥30) |
| M2 Upstream inventory | 84 commands, 33 agents, 11 hooks, 14 runtimes, SDK enumerated |
| M3 Local inventory | 81 commands, 49 agents, 36 hook entries, 150 src/ subdirs |
| M4 Three-way matrix | **65 rows**, 6-status × 5-severity classification, 18 BLOCK/HIGH |
| M5 FINDINGS + REVIEW | 12 success-criteria gate; mission.pdf 22 pages, 3-pass clean |

Artifacts live at `.planning/missions/oops-gsd-alignment/` (gitignored;
internal-only by project rule). Schemas at
`.planning/missions/oops-gsd-alignment/schemas/comparison-matrix.json`
(both bugs fixed in W4).

## Part B — implementation, component-by-component

| ID | Component | Closing Commits | Tests Added |
|---|---|---|---|
| C0 | Foundations + ADRs | `dba568d3d` (ADR 0001), `3efef6b3d` (ADR 0002), `9391df255`, `564603977` | — (foundation) |
| C1 | Settings + hook surface | `4725bdacf`, `b61adc4ee`, `14b1e9b49`, `917270f7f` | 6 hooks-integration files |
| C2 | Dual-impl triage + vendoring | `07d2dc113`, `939cc24a8`, `bbbe04da5`, `f4af6275c`, `df5e8901f` | 2 files |
| C3 | Memory cluster (3 sub-commits) | `5040f18a0`, `72193ec43`, `903aeffde`, `f17eb4bd2`, `07b201ffa` | 5 files |
| C4 | Skill schema migration | `5cdca69ac`, `90fc83020`, `db2fe35f2`, `1cb3a692c`, `9d4bbddcb`, `c2fdf0f1e` | 4 files |
| C5 | Telemetry + effort + flags | `7ae700c60`, `ed3d1b14a`, `8f2702018`, `c3e44dfc5`, `df9930296` | 4 files |
| C6 | Vendoring + inventory + docs | `fcfa73b4d`, `a5879964d`, `0e1dd12a8`, `a7078f413`, `c01b9bb1b`, `d141babfe`, `559c877b7`, `80375344a`, `8c0cf2b9e` (W4 manifest regen) | 4 files |

Total **24 new test files**; **+179 net new passing test cases** vs the
v1.49.575 published baseline.

## BLOCK closures highlighted

### OGA-013 — Compaction recovery (PostCompact wiring)

ADR 0002 formalized the triple-mapping (PreCompact event handler →
PostCompact event handler → conversation-resume hook). C1 commit
`4725bdacf` wired both PreCompact and PostCompact in their respective
slots. Two integration test cases at
`src/__tests__/hooks-integration/pre-compact-recovery.test.ts` cover
both halves.

### OGA-023 — Memory survey scorer (token-budget waste)

The acceptance gate was **40% mean reduction** across the 5 fixtures
(toy / small / medium / large / pathological MEMORY corpora). C3
commits `5040f18a0` (scorer with relevance + half-life decay) and
`72193ec43` (scorer integration + pinned-rule preservation) shipped
the substrate. Achieved reduction: **76.6% mean** — nearly 2× the
floor. Three test files cover the substrate.

## ADRs landed

- **ADR 0001 — Vendoring policy** (C0 `dba568d3d`). Codifies when local
  files override upstream, and the `local-modified` marker convention.
  Origin map maintained in `project-claude/hooks/README.md` (C2
  `df5e8901f`).
- **ADR 0002 — PreCompact triple-mapping** (C0 `3efef6b3d`). The
  PreCompact / PostCompact / conversation-resume slot mapping for
  compaction recovery. Closed OGA-051.

ADRs live at `.claude/adr/` (linked from CLAUDE.md per C0 `564603977`).

## Author dedications

This milestone is dedicated to:

- **Tibsfox** — author of the OOPS corpus (00–09). The ten documents are
  the first integrated self-spec of the GSD ecosystem and made the
  three-way alignment audit possible. Without OOPS-00 through OOPS-09
  the matrix would have had no third axis to compare against.
- The **`gsd-build/get-shit-done` upstream maintainers** — for the
  `v1.38.3` release that anchored the upstream column of the matrix and
  for the four vendored commands (`sync-skills`, `plan-review-
  convergence`, `settings-advanced`, `settings-integrations`) now
  carrying upstream lineage in `INVENTORY-MANIFEST.json`.

## Forward-citations to v1.49.577+

1. **Operational install gap.** Live `.claude/settings.json` retains the
   prior five SessionStart subscribers because `install.cjs` additive-
   merges from SOT. The C1 SessionStart consolidation (5 → 1, <200ms)
   is correct in `project-claude/` but not yet realized live. Operator
   one-liner: `rm .claude/settings.json && node project-claude/install.cjs`.
2. **Vendored-command integration testing.** Existence + origin tests
   landed in C6; real-workflow integration testing is queued.
3. **Pre-existing repo merge debris cleanup.** Five files in unmerged
   state pre-date v1.49.576 and remain so at close. Owns its own short
   milestone.
4. **NEEDS-UPSTREAM-PR row OGA-005** stays in the matrix as a future PR
   candidate against `gsd-build/get-shit-done`.
5. **Memory corpus migration scripts** ship dry-run-by-default
   (`scripts/memory-migrate-half-life.mjs`,
   `scripts/memory-migrate-taxonomy.mjs`). Operationalize when ready.

A sixth feed-forward (Gastown skill word-count gate retune) is documented
in `RETROSPECTIVE.md`; it is a 1-commit fix in the next milestone.

## Closing note

18 of 18 audit-actionable rows closed; 11 of 11 supporting MEDIUMs shipped
in their natural layer; 2 of 2 LOWs batched; both BLOCKs over-delivered
against their numeric gates. Full audit at `REVIEW.md` (gitignored
internal artifact); full close summary at `RETROSPECTIVE.md`.

End of release notes.
