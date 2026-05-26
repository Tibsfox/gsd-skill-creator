# v1.49.782 — Lesson candidates

3 lessons emitted, all candidate-status pending codification at next milestone.

---

## #L782-1 — Recon-first discipline graduates from "candidate" to "default"

**Signal.** Third consecutive milestone (v780, v781, v782) where ~15 minutes of pre-execution recon flipped the REVIEW ledger's framing materially:

- v780 — ledger said "extract dispatcher from 2,132-line cli.ts"; reality after recon was "the 2,132-line count was at v779, file is now smaller and partly extracted"
- v781 — ledger said "3 chip-registry.ts files duplicate" + "extract MemoryStore adapter for 7 backends"; reality was "2 files with different classes" + "interface already exists, 4/9 already conforming"
- v782 — ledger said "14 disk-loaders, ctx in constructor"; reality was "15 cited, 4 NOT disk-loaders, 10 of 11 are free functions not classes"

Three independent ledger entries, three material flips. The pattern is not coincidence — REVIEW ledger sweeps are best-effort summaries written without per-file inspection. They WILL mis-estimate scope, miss already-done work, and conflate distinct failure modes.

**Rule.** When picking a wedge from a REVIEW ledger, dedicate the first ~15min of the ship to per-file recon. Verify (a) the actual file structure matches the ledger's description, (b) the suggested fix is the right shape, (c) the work isn't already partly done. Recon-first is now the DEFAULT discipline for ledger-driven work, not a candidate option.

**Anti-pattern.** Executing a ledger entry as a directive without verification. The cost of recon (10-20 min) is bounded; the cost of executing the wrong refactor (hours to days) is unbounded.

**Codification target.** Promote from `lesson candidate` to a CLAUDE.md operative discipline at the next regen. Suggested operative-discipline block: "Ledger-driven work — _Before executing any REVIEW ledger entry; when picking a wedge from a planning artifact written as a sweep summary._ Per-file recon precedes per-file code. Verify scope, framing, and prior-art before writing the first line."

---

## #L782-2 — Audit rules must classify by behavior, not by filename

**Signal.** 4 of the 15 cited "disk loaders" had no `node:fs` import at all. `memory/memory-loader.ts` loads from an in-memory `MemoryEntry[]`. `agc/pack/rope-loader.ts` is a URL locator. `orchestration/tool-attention/lazy-loader.ts` is in-memory schema lazy hydration. `aminet/bulk-downloader.ts` is a delegator that offloads disk I/O to peer modules. The shared `*loader*` suffix was misleading — the verb "load" has at least 4 distinct non-disk semantics.

**Rule.** When authoring an audit rule for "files that do X," classify by the actual behavior signature (here: `import.*node:fs`), not by filename pattern. The filename is a hint at intent; the import statement is a fact about behavior. Discrepancies are common.

**Anti-pattern.** Writing an audit that says "every `*loader*.ts` file MUST [...] OR have a justification doc comment" — that produces false-positive friction for the 4 modules whose name is incidentally loader-shaped but whose behavior is not. Worse, it incentivizes drift: future authors avoid the `*loader*` filename to escape the audit, fragmenting the codebase's vocabulary.

**Codification target.** The audit test in `src/security/loader-context-audit.test.ts` embodies this lesson: it filters its check by `fs` import presence, not by filename alone. Use as a reference pattern for future audit-rule authoring.

---

## #L782-3 — Optional `ctx?` parameter is the cheapest retrofit pattern for chokepoint introduction

**Signal.** Adding `LoaderContext` to 11 disk-loaders touched ~200 call sites between them. A required parameter would have produced a 200-line breaking change with no functional benefit at existing sites. An optional parameter (`ctx?: LoaderContext` defaulting to `undefined` → legacy permissive mode) produced zero churn at existing sites — the chokepoint is fully implemented but invisible until a caller opts in.

**Rule.** When introducing a security chokepoint to N existing modules with high call-site multiplicity, use the optional-parameter pattern. Three states emerge:
- `undefined` ctx → legacy permissive mode (zero call-site churn, audit-bypass)
- `defaultLoaderContext()` ctx → audit-only mode (all paths admitted, all reads logged)
- restricted ctx → enforced mode (allow-list checked, denials throw)

Each state has a clear use case: existing call sites stay on (1) until migrated, security-conscious callers use (2) during rollout, production deployments use (3) for hard enforcement.

**Anti-pattern.** Making the chokepoint required in the public API on day one. Forces a breaking change across the entire dependent call graph before any rollout signal has come back. Adds risk to a security feature whose entire value depends on adoption.

**Codification target.** Reference pattern for future security-chokepoint introduction. Already referenced from `src/security/loader-context.ts` module header.
