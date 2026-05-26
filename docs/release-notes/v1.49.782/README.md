# v1.49.782 — Tier E Architecture: LoaderContext Security Chokepoint

**Released:** 2026-05-26
**Type:** forward-cadence architecture milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.781 — Tier E Architecture: Store/Registry Naming Hygiene + MemoryStore Audit
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Architecture pass:** Tier E HIGH #3 of 3 (REVIEW ledger 2026-05-26)

## Summary

**Third Tier E architecture forward-cadence ship — closing the architecture-debt drain.** v780 closed Tier E HIGH #1 (cli.ts dispatcher); v781 closed Tier E HIGH #2 (Store / Registry / Manager naming hygiene); v782 closes Tier E HIGH #3 (LoaderContext security chokepoint). All three Tier E HIGHs from the 2026-05-26 REVIEW sweep are now CLOSED.

**The recon flip — third time, same pattern.** v780 and v781 each began with a 15-minute recon that flipped the REVIEW ledger's scope estimate; v782 followed the discipline and surfaced two material discrepancies before any code was written:

1. **The ledger said "14 disk loaders," cited 15, and 4 of the 15 turn out NOT to be disk loaders.** No `node:fs` import: `memory/memory-loader.ts` (in-memory relevance scoring), `agc/pack/rope-loader.ts` (URL locator catalog), `orchestration/tool-attention/lazy-loader.ts` (in-memory schema lazy hydration), `aminet/bulk-downloader.ts` (delegator — disk work lives in mirror-state.ts + package-fetcher.ts). The "load" verb in each module name refers to a non-disk semantic. Actual disk-loaders: 11.
2. **The ledger said "constructor takes ctx" — but 10 of 11 actual disk-loaders are free functions, not classes.** Only `KnowledgeTierLoader` (cloud-ops/knowledge) is a class. Threading must go through function arguments (often inside an existing options bag), not constructor params.

**The shape.** A new `LoaderContext` interface in `src/security/`, 11 atomic loader migrations, 4 role-boundary doc-comment commits, and an automated audit test that holds the chokepoint going forward. ~3 hours wall-clock.

| Commit | SHA | Subject |
|---|---|---|
| 1 | `2e78c5925` | feat(security): add LoaderContext disk-loader chokepoint |
| 2 | `576687981` | refactor(cartridge): thread LoaderContext through loadCartridge |
| 3 | `0cbaa95dc` | refactor(interpreter): thread LoaderContext through loadBundle |
| 4 | `3c3eb7590` | refactor(skill): thread LoaderContext through loadSkillWithLifecycle |
| 5 | `cd75ef46a` | refactor(knowledge): thread LoaderContext through 3 *File loaders |
| 6 | `61f57e8e3` | refactor(knowledge): thread LoaderContext through loadPack |
| 7 | `1a538ed92` | refactor(agc): thread LoaderContext through loadRopeImage |
| 8 | `392cc19c0` | refactor(graph): thread LoaderContext through loadTrsEdges |
| 9 | `33fa3ac3f` | refactor(scribe): thread LoaderContext through loadPgEnv |
| 10 | `90fe90355` | refactor(cloud-ops): thread LoaderContext through KnowledgeTierLoader |
| 11 | `38117b8f0` | docs(security): mark 4 non-disk-loader files with role-boundary headers |
| 12 | `3dc2e5344` | test(security): enforce LoaderContext chokepoint via audit test |

## The `LoaderContext` shape

```ts
export interface LoaderContext {
  readonly allowList: readonly PathPattern[];   // string | RegExp | (path) => boolean
  readonly audit: AuditSink;                    // { record(entry: LoaderAuditRecord): void }
}

export function ensureAllowed(
  ctx: LoaderContext | undefined,
  source: string,
  op: LoaderOp,
  target: string,
  note?: string,
): void;
```

- `ctx` is OPTIONAL on every disk-loader entry point. `undefined` ctx → legacy permissive behavior (zero call-site churn for the 200+ existing consumers).
- `PathPattern` is a `string | RegExp | predicate` union — dependency-free, idiomatic TS, expressive enough for every cited site.
- `LoaderContextDenied` is thrown when a path is not admitted; one audit record is emitted per gated operation (allowed OR denied).
- `defaultLoaderContext()` returns a permissive-but-audited ctx for tests and incremental rollout.

## File changes

| Path | Action |
|---|---|
| `src/security/loader-context.ts` | NEW — interface + helpers + `LoaderContextDenied` error + `CapturingAuditSink` test util |
| `src/security/loader-context.test.ts` | NEW — 21 unit tests covering pattern matching, audit sink contract, gate semantics, error metadata |
| `src/security/loader-context-audit.test.ts` | NEW — 17 audit tests: walks `src/**/*loader*.ts`, enforces fs-import → ensureAllowed OR role-boundary header |
| `src/security/index.ts` | added LoaderContext exports to security barrel |
| `src/cartridge/loader.ts` | added `ctx?` to `LoadCartridgeOptions`; gated 3 fs touchpoints (loadCartridge, loadAnyCartridge, resolveChipsetEntry src: deref) |
| `src/interpreter/loader.ts` | added `ctx?` 3rd arg to `loadBundle`; gated bundle root (sub-file reads confined under bundlePath via `path.join`) |
| `src/skill/lifecycle-loader.ts` | added `ctx?` to `LoadOptions`; gated `loadSkillWithLifecycle` |
| `src/knowledge/resource-loader.ts` | added `ctx?` 2nd arg to `parseResourcesFile` |
| `src/knowledge/activity-loader.ts` | added `ctx?` 2nd arg to `loadActivitiesFile` |
| `src/knowledge/assessment-loader.ts` | added `ctx?` 2nd arg to `parseAssessmentFile` |
| `src/knowledge/module-loader.ts` | added `ctx?` 2nd arg to `loadPack`; gated pack directory (sub-file reads confined via `path.join`) |
| `src/agc/tools/rope-loader.ts` | added `ctx?` 3rd arg to `loadRopeImage` |
| `src/graph/trs-loader.ts` | added `ctx?` to `LoadTrsOptions`; gated `resolveJson` (single fs touchpoint, only reached when `text` and `json` opts absent) |
| `src/scribe/pg-runtime/env-loader.ts` | added `ctx?` 3rd arg to `loadPgEnv`; gated both `existsSync` and `readFileSync` touchpoints |
| `src/cloud-ops/knowledge/tier-loader.ts` | added `ctx?` 3rd arg to `KnowledgeTierLoader` constructor + 3 standalone wrappers; gated per-tier directory in private `loadTier` |
| `src/memory/memory-loader.ts` | added `Role: NOT a disk loader` header (in-memory relevance scoring) |
| `src/agc/pack/rope-loader.ts` | added `Role: NOT a disk loader` header (URL locator catalog) |
| `src/orchestration/tool-attention/lazy-loader.ts` | added `Role: NOT a disk loader` header (in-memory schema lazy hydration) |
| `src/aminet/bulk-downloader.ts` | added `Role: NOT a disk loader` header (delegator — disk work in mirror-state.ts + package-fetcher.ts) |

## Tests

- New: 21 unit tests for `LoaderContext` + 17 audit tests for the chokepoint enforcement = 38 NEW LOCKED.
- Full vitest suite: 29,743 tests passing (up from 29,705 at v781 ship). 1 pre-existing failure (`tests/integration/v1-49-635-meta-test.test.ts:146` C6 STATE.md normalizer idempotency invariant — pre-existing at v781 ship tip `6337fad53`, caused by the broken normalizer documented in the v781 handoff Lesson candidate). 39 skipped, 7 todo. Test count delta: +38.
- The audit test catches:
  - Files that import `node:fs` but don't call `ensureAllowed` AND don't have a role-boundary header
  - Files that contradict themselves (both `ensureAllowed` AND `Role: NOT a disk loader` present)

## Why this matters

Before v782 the codebase had 11 independent disk-read sites with no shared security enforcement layer. Adding allow-list / audit semantics required modifying every loader individually. With v782, the security boundary is one interface, one `ensureAllowed()` call per fs touchpoint, and one regex-based test that REJECTS new disk-loaders that bypass the chokepoint. Adding a new module that imports `node:fs` in a `*loader*.ts` path now fails CI unless it routes through `LoaderContext` or carries an explicit role-boundary header.

## Forward path

- **All 3 Tier E HIGHs from the 2026-05-26 sweep are CLOSED.** Architecture-debt drain at this tier is complete.
- **Engine state advance** (NASA 1.178, MUS / ELC / SPS / TRS forward-cadence) is the next default-recommendation.
- **Re-spawn the risk-tier sweep around v1.49.789** per the v781 handoff guidance (4 milestones from now).
- **Three v782 lesson candidates** queued for codification:
  - `#L782-1` — Recon-first survives three consecutive milestones (v780, v781, v782 each flipped the ledger's framing). Promote from "candidate" to codified discipline at the next CLAUDE.md regen.
  - `#L782-2` — `*loader*.ts` is an unreliable name for "reads from disk." Audit rules must classify by behavior (fs imports) not by filename. The audit test in this milestone embodies this lesson.
  - `#L782-3` — Optional `ctx?` parameter pattern is the cheapest way to retrofit a security chokepoint onto N legacy free functions without breaking 200+ call sites.
