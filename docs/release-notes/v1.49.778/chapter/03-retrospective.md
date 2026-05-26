# Retrospective — v1.49.778

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Fourth instance; the cadence concept refines into a 4-class trigger hierarchy: passive accumulation (v585) → reactive crisis (v776) → proactive deep-sweep (v777) → planned remediation wave (v778). Tight-cadence Wave N from a pre-itemized queue is qualitatively different from the prior three.
- **Atomic-commit-per-logical-fix.** Ten separate commits for the ten HIGH fixes, plus one release commit + post-ship RH refresh. Per-fix commit messages cite the specific tier finding for traceability.
- **Shared-helper extraction for N-site patterns (obs#3 cumulative).** First obs at the v777 session arc with `src/cli/entrypoint-guard.ts` (4 sites). Second obs at v777's `src/safety/write-queue.ts` (14 sites across 10 stores). Third obs at v778's `escapeRegExp` in `src/dependency-resolver/manifest-patcher.ts` (9 sites within one file). The pattern is now sufficiently established to write as a forward gate.

## What Worked

- **Pre-itemized queue from a prior review enabled fast Wave 2 execution.** The v1.49.777 risk-tier sweep produced 16+ HIGH findings; the v777 handoff explicitly enumerated them as Wave 2 candidates with file paths and one-line descriptions. This let v778 open with a verified-findings pass (10/10 still present at the cited lines) rather than re-discovering them.
- **Per-finding sub-system test verification before commit.** Each fix ran its subsystem's vitest suite (or `cargo test --lib <module>::`) before the atomic commit. Catches regressions at the fix-site rather than at pre-tag-gate time. 132 + 61 + 154 + 321 + 58 + 38 + 17 + 3 + 2 + 37 = 823 tests touched across the 10 fixes, all green at fix-time.
- **Defense-in-depth on shells/dashboards over removal.** pty_open and generate_dashboard both have legitimate callers. Allowlist + slug-validation preserves the legit surfaces while closing the attack vectors. Same disposition class as v777's blitter-executor 4-pillar hardening.
- **Cross-language sweep landed in one ship.** TypeScript (5 fixes), Rust (4 fixes), JavaScript hooks (1 paired fix). The reviewer-tier dispatch didn't care about language boundaries, and neither did the remediation cadence.
- **Working-tree-only review ledger.** The new `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` lives in the gitignored `.planning/` tree. It preserves the function (per-finding status tracking) without committing review artifacts that would rot in git history. Future sessions Read it explicitly when picking the next Wave scope.
- **The fail-closed hook fix shipped despite the hook itself blocking its own deployed copy.** Working through that constraint surfaced the gitignored-deployed-copy pattern: the source of truth is `project-claude/hooks/`, the deployed `.claude/hooks/` copy is gitignored runtime state. Future hook fixes should follow the same pattern: edit source, run `node project-claude/install.cjs` (or `SC_SELF_MOD=1 cp` if install.cjs doesn't cover the file), commit only the source.

## What Could Be Better

- **install.cjs doesn't cover self-mod-guard.js or git-add-blocker.js.** These hooks were apparently installed manually at some point; the installer's hook list only covers session-state, validate-commit, phase-boundary-check, post-commit. A future cleanup should either extend install.cjs to cover them or formally document the manual-sync pattern.
- **The hook deployed-copy sync needed an `SC_SELF_MOD=1 cp` workaround.** Claude Code's hook subsystem doesn't propagate env-var prefixes from the Bash command into the hook process's `process.env`, so the standard `SC_FORCE_ADD=1 git add` pattern fails when staging files in protected paths. The fail-closed hooks themselves catch this case (because their env-var checks now run BEFORE the parse-fail fail-closed BLOCK), but it's a sharp edge worth documenting.
- **Wave 2 closed 10 HIGHs but the queue still has ~6 HIGHs across Tiers C/D/E + all MEDIUMs/LOWs.** Tier C (performance), Tier D (test quality), and Tier E (architecture) HIGHs are out of scope for a security/correctness counter-cadence. A separate Wave 3 (performance/test) or a forward-cadence architecture pass would be needed to drain the queue.
- **The dashboard server bind change requires a re-test in the live webview.** Tauri's `tauri.conf.json` references the dev server at `http://localhost:5174`; the production binding now strictly resolves to `127.0.0.1`. If any consumer was inadvertently relying on `localhost` resolving to `::1` (IPv6 loopback) on a dual-stack system, that path is now broken. Smoke-testing in next session recommended.

## Decisions

- **Wave 2 scope = 4 security + 6 correctness HIGHs (operator-authorized).** Alternative considered: pack Wave 2 with Tier C/D/E HIGHs into one larger ship. Operator picked the security+correctness envelope to keep ship-time bounded and keep the Wave-N cadence productive.
- **Shell allowlist by basename, not full-path.** Path-based allowlist would have required maintaining a per-distro / per-Windows-install list of canonical shell paths. Basename match against a 12-entry list is simpler, cross-platform, and the same protection surface (the threat is "what binary does the kernel exec," not "where does it live on disk").
- **Drop `Access-Control-Allow-Origin: *` from console helper, not allowlist a specific origin.** Same-origin-only is the simpler default once the server binds 127.0.0.1; a specific origin allowlist would have to be wired through `createHelperRouter(basePath)` which doesn't currently know the server port.
- **`safeJsonParse<T>` as a local helper in snapshots.ts, not a new shared module.** The helper is 8 lines; a new module would have added one more import for one more file in a codebase that Tier E already flagged as suffering from subsystem sprawl. Co-locating with the only consumer keeps the diff small.
- **Destructure-into-fields for mcp_host instead of changing rebuild_index signature.** Could have changed `rebuild_index(&mut self, conns: &HashMap<...>)` to take an iterator and avoid the borrow split entirely, but that would have touched the router API. The destructure stays purely in commands.rs and is the smallest fix.

## Surprises

- **The fail-closed hook fix tripped the live git-add-blocker on commit.** A correct end-state — the hook is doing its job — but it required understanding that Claude Code's hook process doesn't see env-var prefixes set on the bash command. Once the staging was scoped to the gitignored copy's exclusion, the commit went through cleanly.
- **`escapeRegExp` was missing for 9 sites across 5 ecosystems despite the file being only 98 lines.** Each ecosystem had its own partial escape pattern (`/[@/]/` for npm, `/[-]/` for cargo, `/[-_.]/` for pypi, none for conda removes). The pattern of "different escape per ecosystem" actively hid the underlying bug; the centralized helper makes the gap visible.
- **The arena.rs overflow panic existed in THREE call sites with identical code.** Same comment, same `.expect("arena size overflow")`. A grep at fix time caught all three; the original review only cited one line (352). Lesson: grep for the exact panic message before authoring the fix, not just at the cited line.
- **mcp_host's `unsafe` block had an apologetic SAFETY comment that was wrong.** The comment said "both fields are independent and non-overlapping" — which is true — but the raw-pointer cast is only sound if `rebuild_index` never invokes a re-entrant path back into `self`. The destructure proves the disjointness to the compiler instead of asserting it in prose.

## Lessons Learned

See `04-lessons.md`.
