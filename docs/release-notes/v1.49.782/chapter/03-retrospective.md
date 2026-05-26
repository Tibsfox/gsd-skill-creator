# v1.49.782 — Retrospective

## decisions

- **Recon-first scoping, third time validated.** Spent ~15 minutes after the operator picked Path A surveying the 15 cited disk-loaders before writing any code. Discovered that 4 of them have NO `node:fs` import (`memory/memory-loader.ts`, `agc/pack/rope-loader.ts`, `orchestration/tool-attention/lazy-loader.ts`, `aminet/bulk-downloader.ts`) and that 10 of the 11 real disk-loaders are free functions, not classes. Both findings would have caused major rework if discovered mid-execution. This is the third milestone in a row (v780, v781, v782) where ~15min of recon-before-code saved 2-3 days of doing the wrong refactor. The discipline is graduating from "candidate" to default.

- **Path γ — full enforcement, not audit-only or audit-deferred.** Operator picked the full implementation (LoaderContext + 11 migrations + automated audit) over the lighter audit-only and defer paths. Justified by the chokepoint's role: a chokepoint that doesn't enforce isn't a chokepoint, it's a comment. The automated audit test is the load-bearing piece — without it the chokepoint decays as soon as the next disk-loader is added.

- **Optional `ctx?` parameter pattern, not a breaking constructor change.** The 11 disk-loaders have ~200 call sites between them. Threading `LoaderContext` as an OPTIONAL last/options-bag parameter means zero churn at existing call sites and incremental opt-in for security-conscious callers. `undefined` ctx → legacy permissive mode; `defaultLoaderContext()` → audit-only mode; restricted ctx → enforced. The same pattern would have failed with a required constructor change.

- **`PathPattern = string | RegExp | predicate` over a glob dependency.** A glob library (minimatch, picomatch) would have given more expressive matching but added a security-boundary dependency. The union type covers every cited site (prefix-match for dirs via trailing `/`, regex for complex patterns, predicate for custom logic) without pulling in 3rd-party code. Security boundaries should minimize surface area.

- **Audit-as-test, not audit-as-script.** A standalone `tools/security/audit-loader-context.mjs` would have required wiring into `pre-tag-gate.sh`. A vitest test runs in the existing CI loop, fails the same suite a `git push` already gates on, and uses the same expressive assertion library as the rest of the codebase. Single source of truth.

- **Atomic commits for the 11 migrations, batched for the 3 uniform knowledge `*File` loaders.** Mirrors v780+v781's "STRUCTURALLY DIFFERENT → atomic; STRUCTURALLY UNIFORM → batched" rule. The 3 `*File(filePath, ctx?)` loaders in `src/knowledge/` had identical touch shape and shared a single semantic so they batched cleanly into commit 5. The 4th knowledge loader (`loadPack(directory, ctx?)`) operates on a directory + multiple sub-reads — different shape, separate commit.

## surprises

- **`aminet/bulk-downloader.ts` is a delegator, not a disk-loader.** The filename matches the audit pattern (`*loader*` via "down**loader**") but the module has zero `node:fs` imports. Disk reads/writes are delegated to `mirror-state.ts` (state persistence) and `package-fetcher.ts` (network fetch + write-to-disk). The original REVIEW ledger flagged it as one of the 14 disk-loaders; reality is it's a 4th false-positive alongside the 3 already-suspected. Lesson candidate: audit rules must classify by behavior (fs imports), not by filename — the audit test in this milestone embodies this lesson.

- **`memory/memory-loader.ts` loads from memory, not disk.** Despite the name, it scores `MemoryEntry[]` arrays for relevance against a `TaskContext`. No fs imports anywhere. Same false-positive class as `aminet/bulk-downloader.ts` — the verb "load" got attached to a non-disk semantic.

- **JSDoc parser tripped on `src/**/*loader*.ts` inside a comment.** First draft of `loader-context.ts` had this glob pattern in a JSDoc block; TypeScript parsed `**/*` as end-of-comment + code-start and produced a cascade of TS1443 errors. Fixed by rephrasing without the glob substring. Future doc comments should avoid embedded JSDoc-terminator-like substrings when discussing globs.

- **Bundle-level gating is sufficient when sub-reads are confined.** `interpreter/loader.ts` does ~6 reads inside `loadBundle`: manifest, intent, data files, schemas, scripts. All paths are derived from `resolvedPath` via `path.join`, so checking ONLY the bundle root against `ctx.allowList` is enough — no path can escape the bundle subtree without an explicit symlink (out of scope for v782). Same applies to `knowledge/module-loader.ts` (pack directory). Saves emitting 6+ audit records per `loadBundle` call.

- **`KnowledgeTierLoader` is the only class in the 11.** Made the migration shape slightly different — ctx stored as an instance field (`private readonly ctx: LoaderContext | undefined`) and the 3 standalone wrapper functions (`loadSummaryTier`, `loadActiveTier`, `loadReferenceTier`) accept ctx and pass it through to the constructor. A pure free-function world would have been simpler, but the class is reasonable for the per-tier config + timeout-controller state it carries.

## process

- **Wall-clock:** ~3 hours end-to-end (recon ~15m + interface design + tests ~25m + 11 loader migrations ~75m + role-boundary docs ~10m + audit test ~20m + ship ~30m).
- **Commits:** 12 pre-ship (1 feat + 8 refactor + 1 docs + 1 test + 1 batched-refactor for the 3 uniform knowledge loaders) + 1 ship + 1 post-ship RH.
- **Push events:** 4 (push dev + push tag + push main; post-ship push dev + push main).
- **TS test runs:** 13 (per-commit `npx vitest run <touched-dirs>` + 1 full-suite).
- **Full-suite vitest:** 1 (29,743 pass / 1 pre-existing fail / 39 skip / 7 todo). The pre-existing failure is `tests/integration/v1-49-635-meta-test.test.ts:146` C6 STATE.md normalizer invariant — confirmed pre-existing at v781 ship tip `6337fad53` (broken normalizer per v781 handoff lesson candidate).
- **`SC_SELF_MOD=1 cp` invocations:** 0 (no hook touches this ship).
- **Errors:** 1 minor — JSDoc parser tripped on `**/*` substring inside a comment (TS1443 cascade). Fixed by rephrasing. ~2 minutes lost.
