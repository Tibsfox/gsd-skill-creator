# Code Review — Dimension A: Cross-cutting Quality & Functional Analysis (2026-07-06)

Read-only quality sweep of `gsd-skill-creator` CODE (not artifact content — that was
covered by `docs/audits/2026-07-06-artifact-ecosystem-review.md`). Focus: error-handling
patterns, empty catches, TODO density, dead code / unwired capability, type-safety escapes,
test-coverage gaps in core surfaces, and process/fs chokepoint compliance.

## Summary

The codebase is large (3,616 `.ts` files, ~387K non-test LOC, 1,544 test files) and, for
its size, **healthy on the classic quality axes**: only 23 TODO/FIXME/XXX lines, 8
`@ts-*` suppressions, ~90 `any` usages (max 7 in any one file — diffuse, no systemic hole),
and 23 empty catch blocks that are almost all deliberate best-effort reads. The two
security chokepoint audits (`process-context-audit.test.ts`, `loader-context-audit.test.ts`)
**pass green — 2,120 assertions** — and `KNOWN_UNWIRED` is at 0 for both ProcessContext and
LoaderContext, so the child_process / node:fs governance MEMORY flags as fragile is in fact
holding. The highest-leverage findings are not bugs but **structural drift**: a purpose-built
shared settings reader (`src/settings/read-settings.ts`) that has **zero adopters** while 19
files re-implement it inline (the source of nearly every empty catch), and a **66-file,
zero-test, unwired `src/dogfood/` subsystem** whose capabilities (an eight-layer verifier,
coverage mapper, gap classifier, knowledge differ) are exactly the self-audit tooling this
review performed by hand. No CRITICAL defects surfaced.

## Findings

### Q-1 (HIGH, tech-debt) — Shared settings reader has zero adopters; 19 files duplicate it inline

**Location:** `src/settings/read-settings.ts` (0 importers) vs. 19 re-implementers:
`src/ace/settings.ts:41-60`, `src/drift/task-drift-monitor.ts:138-158`,
`src/drift/context-entropy.ts`, `src/drift/temporal-retrieval.ts`, `src/drift/bci.ts`,
`src/drift/grounding-faithfulness.ts`, `src/drift/knowledge-mitigations.ts`,
`src/lyapunov/settings.ts`, `src/convergent/settings.ts`, `src/projection/settings.ts`,
`src/stochastic/settings.ts`, `src/langevin/settings.ts`, `src/model-affinity/settings.ts`,
`src/orchestration/settings.ts`, `src/learnable-k_h/settings.ts`, `src/dead-zone/settings.ts`,
`src/bounded-learning-empirical/settings.ts`, `src/coprocessor/applicator-hook.ts`,
`src/sensoria/applicator-hook.ts`.

**Problem (evidenced):** `read-settings.ts` was added 2026-04-23 (`a7221093d`,
"feat(settings): read opt-in flags from .claude/gsd-skill-creator.json") and provides exactly
the four helpers these callers need — `loadGsdScope`, `readNested`, `readBooleanFlag`,
`readNumber` — including the LIB-path-first / settings.json-fallback ordering and the
"opt-out on any error" default. Yet `grep -rln "settings/read-settings" src` returns **no
non-test importers**. Instead, 19 files each hand-roll the same ~25-line block:

```ts
const paths = settingsPath === DEFAULT_PATH ? [LIB_PATH, DEFAULT_PATH] : [settingsPath];
for (const _p of paths) {
  try { const _txt = readFileSync(_p, 'utf8'); if (_txt) return _txt; } catch {}
}
throw new Error('no settings file found');
```

followed by a bespoke nested-key walk and an outer `catch { return false }`. This is the
source of **~19 of the 23 empty catch blocks** in the tree. Every future settings-shape change
(a third fallback path, an env override, telemetry on malformed config) must be applied 19×,
and the shared module — the intended single point of change — silently rots (it has no test
and no caller). This is precisely the class of dead export that no tool currently catches
(see Q-5).

**Recommendation:** Migrate the 19 call sites to the shared helpers — e.g.
`readTaskDriftThresholdSetting(p)` → `readNumber(['drift','alignment','taskDriftThreshold'], 0.5, p ? [p] : undefined)`
and each `is<X>Enabled()` → `readBooleanFlag(['<scope>','<flag>','enabled'], …)`. The
migration is mechanical (semantics are already identical). Do it as a `batch-rewrite-pattern`
cascade, one flag-family per commit. Add a unit test for `read-settings.ts` first so the
target is pinned before adoption.

**Effort:** M. **Verify:** `grep -rln "no settings file found" src | grep -v read-settings`
returns 0; `grep -rn "settings/read-settings" src | grep -v test | wc -l` ≥ 19; full vitest green.

### Q-2 (HIGH, tech-debt / new-function) — `src/dogfood/` is a 66-file, zero-test, unwired subsystem

**Location:** `src/dogfood/` (extraction/, verification/, learning/, refinement/, harness/, pydmd/).

**Problem (evidenced):** 66 source files, **0 test files** (`find src/dogfood -name '*.test.ts'`
= empty), and **no runtime importer** — `grep -rln dogfood src | grep -v /dogfood/` returns only
test/audit files (`process-context-audit.test.ts`, `cartridge/__tests__/*`). It is not in
`package.json` bin, not registered in `src/fs/pack-catalog.ts`, not routed by
`src/cli/dispatch.ts`, and has no top-level `index.ts`. Last touched 2026-05-27
(`dcd77260d`, a ProcessContext batch-chip), i.e. the only recent maintenance was to keep it
passing the chokepoint audit — the subsystem is *maintained but never invoked*. Its
capabilities (`verification/eight-layer-verifier.ts`, `coverage-mapper.ts`, `gap-classifier.ts`,
`knowledge-differ.ts`, `refinement/skill-refiner.ts`, `refinement/patch-generator.ts`) are
substantial and directly on-mission for an adaptive-learning layer.

**Recommendation:** Make a decision and record it (mirrors the D1–D4 decision-gate discipline
in MEMORY). Either **(a) surface it** — add a `skill-creator dogfood <run|verify|refine>` CLI
command wiring `harness/` + `verification/`, giving it at least a smoke test per capability; or
**(b) explicitly park it** — move to `experimental/` or add a `Role:` header + a one-line note
in a STATE/backlog doc so it is not mistaken for shipped surface. Do not leave 66 files in the
default `src/` tree with zero tests and zero callers indefinitely.

**Effort:** L to wire, S to park. **Verify:** either a new dispatch route + passing dogfood
smoke test exists, or the tree is relocated and a decision note references it.

### Q-3 (MEDIUM, gap) — CLI command entrypoints under-tested; dispatch test asserts routing only

**Location:** `src/cli/commands/` (29 of ~85 command files have no colocated `.test.ts`),
`src/cli/dispatch.test.ts`.

**Problem (evidenced):** 29 command files lack a sibling test, including stateful/destructive
ones: `migrate.ts` (192 LOC), `rollback.ts`, `delete.ts`, `team-spawn.ts`, `refine.ts`,
`sync-reserved.ts`, `reload-embeddings.ts`. `grep -rln "commands/rollback|commands/delete|commands/migrate|commands/team-spawn" src/**/*.test.ts` returns **0** — none are referenced by any test. `dispatch.test.ts` only asserts a couple of command-name→handler mappings, not per-command behavior. Underlying libraries (e.g. `VersionManager` behind `rollback.ts`) are tested, which mitigates but does not cover the command-level argument parsing, usage-error paths (`return 1`), and the interactive `@clack/prompts` branches (`p.isCancel` → `return 0`). A regression in a command's arg handling or exit code would ship untested.

**Recommendation:** Add a thin command-smoke harness that invokes each command handler with
(i) missing-arg input (asserts usage message + non-zero return) and (ii) a happy-path stub of
its injected dependency, asserting exit code. Prioritize the destructive quartet
(migrate/rollback/delete/team-spawn). This is low-value-per-command but the aggregate is a real
uncovered surface on the tool's primary user-facing API.

**Effort:** M. **Verify:** every file in `src/cli/commands/*.ts` is exercised by at least one
test (a coverage report over `src/cli/commands/` shows the previously-untested files hit).

### Q-4 (LOW, best-practice) — Fire-and-forget empty catches outside the settings pattern

**Location:** `src/dashboard/metrics/tier-refresh.ts:65-66` (`.catch(function(){})` +
`catch(e){}`), `src/coprocessor/applicator-hook.ts:51`, `src/sensoria/applicator-hook.ts:80`.

**Problem:** The four non-settings empty catches swallow errors with no diagnostic breadcrumb.
`tier-refresh.ts` fire-and-forgets a refresh promise and also wraps the scheduling in a silent
`catch(e){}`; a persistently failing tier refresh would be invisible. These are best-effort by
design, but a swallowed error with zero trace is a debugging tax when the background work
silently stops.

**Recommendation:** Route these through a single `swallow(err, context)` helper that no-ops in
production but emits under a debug flag (`DEBUG`/`GSD_DEBUG`), so best-effort stays best-effort
but becomes observable. (The settings-pattern empty catches are resolved by Q-1.)

**Effort:** S. **Verify:** no bare `catch {}` / `.catch(()=>{})` remains that drops an error
without at least a debug-gated log; grep audit passes.

### Q-5 (MEDIUM, new-function / best-practice) — No dead-export / dead-module detector in the toolchain

**Location:** `package.json` (no `knip`, `ts-prune`, or `unimported` dependency/script).

**Problem (evidenced):** Q-1 (`read-settings.ts`, orphaned 2.5 months) and Q-2 (`src/dogfood/`,
unwired) are both *silent* — nothing in CI flags an exported module with zero importers.
`grep -nE "knip|ts-prune|unimported" package.json` = none. For a self-modifying,
continuously-growing codebase (387K LOC, adding STEM skills/packs every milestone), unreferenced
modules will keep accumulating undetected. This is the systemic root that produced Q-1/Q-2.

**Recommendation:** Add `knip` (covers dead files, unused exports, and unused deps in one pass)
as a dev dependency + a `npm run deadcode` script, seeded with an ignore list for the intentional
research islands (koopman/wasserstein/langevin/etc. per the review's scoping note) so the signal
is the *newly* orphaned modules. Wire it as a non-blocking report first, promote to a gate once
the baseline is clean.

**Effort:** S–M. **Verify:** `npm run deadcode` runs and flags `read-settings.ts`/`dogfood`
pre-fix, reports clean (modulo ignore list) post-fix.

## New-function / capability opportunities

1. **Surface `src/dogfood/` as a self-audit CLI (highest leverage).** The subsystem already
   contains an eight-layer verifier, coverage mapper, gap classifier, knowledge differ, and a
   skill-refiner + patch-generator. Wiring `skill-creator dogfood verify|refine` would turn 66
   dormant files into the tool's own "does my skill corpus actually cover what it claims"
   command — precisely the manual work this multi-agent review performs. (Depends on Q-2 decision.)

2. **Dead-code CI gate (Q-5).** A `knip`-based `deadcode` report would have caught both Q-1 and
   Q-2 automatically and is the durable fix for the whole finding class.

3. **`read-settings` as the single settings SoT + a drift-guard test (Q-1).** After migration,
   add a test asserting no `src/**/settings.ts`-style file re-implements `readFileSync` of
   `.claude/gsd-skill-creator.json` directly — the same "chokepoint audit" pattern already used
   for ProcessContext/LoaderContext, applied to settings reads.

## Notes

- **Chokepoint governance is solid, not fragile-in-practice.** Despite MEMORY's warnings, the two
  audit suites pass with 2,120 assertions and both `KNOWN_UNWIRED` allowlists are at 0. The
  fragility is a *false-negative-on-local-subset* risk (only full vitest catches a new violation),
  not a live hole. No finding filed against it.
- **`any` / `@ts-*` / non-null (`!.`) usage is diffuse and low** (90 / 8 / ~199 across 387K LOC);
  the `any` hotspots are external-boundary adapters (`memory/pg-store.ts`, `memory/chroma-store.ts`,
  `atlas/scales/*`) where `any` at the driver seam is defensible. Not worth a finding.
- **TODO markers are almost all intentional templates** (`capabilities/capability-scaffolder.ts`,
  `vtm/test-plan-generator.ts`, `detection/skill-generator.ts` emit TODO placeholders *by design*
  into generated scaffolds). Real FIXME/XXX debt is effectively nil.
- **`src/holomorphic/` (25 files, 0 tests) is NOT dead** — it is a registered content pack via
  `src/fs/pack-catalog.ts:8` and `src/fs/scaffold.ts:111`. Left as-is per the "don't deep-review
  the research/math surface" scoping.
- The prior artifact-ecosystem review's fixes (Co-Authored trailer, array `tools:`, hardcoded
  paths, phantom command refs, benchmark corpora) were confirmed out of scope here and not
  re-reported.
