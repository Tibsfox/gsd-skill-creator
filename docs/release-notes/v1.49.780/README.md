# v1.49.780 — Tier E Architecture: cli.ts Dispatcher Extraction

**Released:** 2026-05-26
**Type:** forward-cadence architecture milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.779 — Wave 3 Review HIGHs Counter-Cadence
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Architecture pass:** Tier E HIGH #1 of 3 (REVIEW ledger 2026-05-26)

## Summary

**First Tier E architecture forward-cadence ship.** v1.49.777-779 drained the BLOCKER + HIGH queue across Tiers A/B/C/D via three counter-cadence waves. This ship closes the first of three deferred Tier E architecture HIGHs: the `src/cli.ts` god-dispatcher extraction. Cadence interval from v779 is 1 milestone — but unlike the v777-779 waves, this is a forward-cadence remediation, not a counter-cadence one.

**The problem.** `src/cli.ts` had grown to 2132 lines as a pure command dispatcher — a 152-case switch statement with 42 top-level imports, a 30-line `processAction` helper, two help-text helpers (`showDacpHelp`, `showTeamHelp`), and a 328-line `showHelp` template. Most cases routed to per-command modules in `src/cli/commands/` (102 of them already existed), but the central dispatch + the ~12 still-inline cases (suggest, suggestions, agents, team, dacp, etc.) kept ballooning the file. The REVIEW ledger captured it as Tier E HIGH #1 with target `<300` lines.

**The shape.** 13 atomic commits, infrastructure-first incremental migration:

1. **`bf7fa7028`** — `src/cli/dispatch.ts` skeleton: `CliContext` interface, `CommandEntry` type, `REGISTRY` const array, `lookup(command)` function. Wired into `cli.ts` main() as a try-dispatch-first / fall-through-to-legacy-switch path. Enables every subsequent migration to be a single self-contained commit without breaking any other command path.
2. **`c84cdfe46`** — extracts `suggest`/`sg` (95 lines), `suggestions`/`sgs` (54 lines), and the `processAction` helper (30 lines) into `src/cli/commands/suggest.ts`. -168 lines.
3. **`a0dd1cebe`** — `feedback`/`fb` + `refine`/`rf` into `src/cli/commands/{feedback,refine}.ts`. -118 lines.
4. **`1775a3e8d`** — `delete`/`del`/`rm` + `invoke`/`i` into `src/cli/commands/{delete,invoke}.ts`. -89 lines.
5. **`75809ca04`** — the 216-line `agents`/`ag` command (3 subcommands + default help) into `src/cli/commands/agents.ts`. Largest single extraction. -219 lines.
6. **`79cd377ae`** — `team`/`tm` (6 subcommand dispatcher) + `dacp`/`dp` (5 subcommand dispatcher) + their `showTeamHelp` + `showDacpHelp` text into `src/cli/commands/{team,dacp}.ts`. -169 lines.
7. **`fd740df85`** — the 328-line `showHelp` function (pure template-literal) into `src/cli/help.ts` as `printHelp()`. Single biggest extraction by line count. -328 lines.
8. **`f59f59414`** — `rollback`/`rb` (58 lines) + `skill` namespaced subcommand (33 lines) into their own modules. -94 lines.
9. **`f025e8d3f`** — batched migration of 45 simple-dispatch cases into `dispatch.REGISTRY` as inline closures. Covers create, list, search, migrate, cartridge, keystore, chip, coprocessor, eval, sync-reserved, test, mcp-server, audit, reload-embeddings, status, resolve, budget, budget-estimate, teach, co-evolution, quintessence, capabilities, compress-research, generate-collector, session, purge, discover, orchestrator, workflow, role, bundle, event, quality, integration, graph, impact, dashboard, gsd-init, advise-parallelization, terminal, plane-status, project, pack, contrib, www, output-structure, tractability, representation-audit, drift, model-affinity, ab, help, migrate-agent, migrate-plane. -499 lines.
10. **`286a39220`** — final batch: the 14 remaining inline-arg-parsing cases (validate, detect-conflicts, score-activation, simulate, critique, test-triggering, history, calibrate, benchmark, config, publish, install, export, sensoria) migrated into dispatch.REGISTRY as inline closures. The cli.ts switch is fully gone; main() body collapses to: parse `--version`, build `CliContext`, `dispatchLookup(command)`, unknown-command error path. -328 lines.
11. **`fa275b64d`** — test wiring: 3 source-grep tests in `eval.test.ts` + `critique.test.ts` updated to look in `src/cli/dispatch.ts` instead of `src/cli.ts` (since the registration moved). INVENTORY-MANIFEST.json regenerated to include the 12 new `src/cli/commands/` modules.

**Final shape:**

| File | Before | After | Delta |
|---|---:|---:|---:|
| `src/cli.ts` | 2132 | 120 | **−2012 (−94.4%)** |
| `src/cli/dispatch.ts` | — | 543 | new |
| `src/cli/help.ts` | — | 329 | new |
| `src/cli/commands/{suggest,feedback,refine,delete,invoke,agents,team,dacp,rollback,skill}.ts` | — | 843 | new |
| **Total CLI surface** | 2132 | 1835 | **−297 (−13.9%)** |

**Architecture pattern.** Every command is now registered as `{ aliases: readonly string[], handler: (ctx: CliContext) => Promise<number | void> }`. `CliContext` carries `args`, `skillStore`, `skillIndex`, `parseScope`, `parseSkillsDir`, `parseStringFlag` — the minimum surface every handler needed. Aliases are checked for collision by `dispatch.test.ts`. The registry is a const array literal; adding a new command is a single dispatch.ts entry + the command module.

**What this ship doesn't close.** Tier E HIGH #2 (Store/Registry/Manager dedup pairs + MemoryStore adapter for the 7 memory backends) and Tier E HIGH #3 (LoaderContext security chokepoint for 14 scattered disk loaders) remain queued. They will each warrant their own forward-cadence ship — both are cross-cutting structural refactors that benefit from a dedicated single-concern arc the same way this one did.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone.** Engine remains at NASA degree 1.177, INTERSTELLAR-BOUNDARY axis at obs#1.
- **No new substrate-anchors emitted.**
- **No new V-flags emitted.**
- **Counter-cadence cadence — unchanged at 5 instances.** This ship is forward-cadence (architecture), not counter-cadence (operational debt).
- **REVIEW ledger.** Tier E HIGH #1 marked CLOSED. Updated lineage to reflect v780 as the first dedicated architecture pass.

## Threads closed / opened / extended

- **CLOSED:** Tier E HIGH #1 (cli.ts dispatcher extraction). 2132 → 120 lines.
- **OPENED:** `src/cli/dispatch.ts` as the canonical CLI surface registration point. New commands now require a registry entry + (optionally) a command module — no edits to cli.ts.
- **OPENED:** `CliContext` interface as the handler contract. Any future cross-cutting concern that every command needs (telemetry, logging, transaction scope) gets added here once instead of N times.
- **OPENED:** The infrastructure-first / fall-through-to-legacy pattern (commit #1) as a reusable shape for any future incremental refactor of a monolithic dispatcher. Worth codifying as a discipline.

## Forward lessons emitted

- **Infrastructure-first migration for dispatcher refactors.** When the goal is to replace a central dispatch surface (switch, if-chain, lookup map), the first commit should add the new dispatch infrastructure + wire it into the old one as a fall-through path. Then every subsequent case migration is independent, bisectable, and verifiable in isolation. Captured at v1.49.780 via the 13-commit cli.ts → dispatch.ts migration; reusable for any future similar refactor.
- **The dispatch contract is the surface area; the command modules are content.** Existing command modules in `src/cli/commands/` already used `(args: string[]) => Promise<number>` as their signature. Forcing them to adopt a richer signature (e.g. taking the full CliContext) would have made the refactor 10× larger. The lesson: when migrating to a new dispatch shape, let the dispatch wrapper adapt to existing command signatures rather than rewriting every command. New commands can opt into the richer context.
- **Batched migrations win when the cases are uniform.** Commits #9 and #10 each migrated 14-45 cases in a single commit because each case fit the same shape (simple dispatch / inline-arg-parsing). Bisect granularity is preserved because the batched cases share a logical category. The discipline: extract individual atomic commits for cases that are STRUCTURALLY DIFFERENT (size, dependencies, complexity); batch cases that are STRUCTURALLY UNIFORM.

## Operational notes

- **Pre-tag-gate CI on origin/dev was already failing at v779.** The `sc:start missing` cluster (~24 test failures) is pre-existing — those tests check for `.claude/commands/sc/*.md` files that aren't present in CI builds. Same failures recurred on the v780 push; covered by `SC_SKIP_CI_GATE_TESTS` enumerated override per Lesson #10185 (v1.49.636 C6).
- **Helper functions kept inline:** `parseSkillsDir` + `parseStringFlag` remain exported from `cli.ts` (their callers in `src/cli.test.ts` import them by path); `createScopedStoreAndIndex` + `parseThreshold` were moved into `dispatch.ts` (private to dispatch handlers that need them).
- **No new tests added for the migrated cases themselves** — they're covered by existing per-command-module tests (102 of them) plus the smoke tests at `src/cli.test.ts` that invoke `node dist/cli.js --version` / `--help`. The dispatch surface itself gains 4 tests in `src/cli/dispatch.test.ts` (alias-collision + handler-typed contracts).

## Cumulative `cli.ts` reduction tally

| Commit | Subject | After |
|---|---|---:|
| baseline | (v1.49.779 tip) | 2132 |
| `bf7fa7028` | dispatch skeleton | 2146 |
| `c84cdfe46` | suggest + suggestions + processAction | 1964 |
| `a0dd1cebe` | feedback + refine | 1846 |
| `1775a3e8d` | delete + invoke | 1757 |
| `75809ca04` | agents | 1538 |
| `79cd377ae` | team + dacp | 1369 |
| `fd740df85` | printHelp | 1041 |
| `f59f59414` | rollback + skill | 947 |
| `f025e8d3f` | 45-case simple-dispatch batch | 448 |
| `286a39220` | final 14 inline-arg-parsing batch | 120 |
| **Cumulative** | | **−2012 (−94%)** |
