# v1.49.778 — Wave 2 Review HIGHs / Security + Correctness Counter-Cadence

**Released:** 2026-05-26
**Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.777 — Wave 1 Review BLOCKERs Counter-Cadence
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Counter-cadence parents:** v1.49.585 (concerns-cleanup), v1.49.776 (template-pollution), v1.49.777 (Wave 1 BLOCKERs)

## Summary

**Counter-cadence ship #4 in the engine.** v1.49.777 closed the four BLOCKERs surfaced by the full-codebase risk-tier sweep but explicitly deferred the 16+ HIGH findings to a Wave 2 ship. v1.49.778 is that Wave 2: 10 HIGH-severity fixes (4 security + 6 correctness) landed as 10 atomic commits before this release commit. The cadence interval from v777 to v778 is 1 milestone — the tightest counter-cadence cadence to date, reflecting the operator-driven trigger class established last ship.

**Security fixes (4 HIGHs)**

- `src-tauri/src/commands/pty.rs::pty_open` — added a basename allowlist of 12 known interactive shells (`bash`, `sh`, `zsh`, `fish`, `dash`, `ksh`, `tcsh`, `csh`, `cmd.exe`, `powershell.exe`, `pwsh`, `pwsh.exe`). Without this, a Tauri webview could call `pty_open` with `shell = "/bin/rm"` and `args = ["-rf", "/"]` and the host would spawn it. The PTY is interactive, so the user can type anything once a shell is up — gating only the spawned binary is the right shape (CWE-77).
- `src-tauri/src/commands/dashboard.rs::generate_dashboard` — closed both an injection vector and a path-traversal vector. `page` was interpolated unquoted into a JS string literal AND concatenated with `.html` before `path.join`; `planning_dir` was only single-quote-escaped, leaking on any other quote or backslash. Fix: `is_safe_page_slug` enforces `[a-z0-9-]` (1–64 chars); both `page` and `planning_dir` now emit as `serde_json::to_string` JS string literals (CWE-94).
- `scripts/serve-dashboard.mjs` + `src/console/helper.ts` — three coordinated changes locked the LAN-side write primitive into `.planning/console/inbox/pending`. The server now binds `127.0.0.1` explicitly (was implicit dual-stack `0.0.0.0/::`); the `Access-Control-Allow-Origin: *` header is dropped (browsers will block cross-origin reads now); and POSTs whose `Origin` header doesn't match the `Host` header are rejected with 403. Together they close the case where a malicious page (or any localhost-bound dev server like webpack on `:5173`) probes the dashboard port from a browser tab.
- `project-claude/hooks/self-mod-guard.js` + `git-add-blocker.js` — flipped both hooks from silent-ALLOW to fail-closed BLOCK on stdin timeout, malformed JSON input, or any decide-time exception. The previous behavior would silently disable the protection under any hostile or buggy input; the new default surfaces a structured block reason while still honoring the existing `SC_SELF_MOD` / `SC_INSTALL_CALLER` / `npm_lifecycle_event` overrides for self-mod-guard and `SC_FORCE_ADD` for git-add-blocker. Added 3 + 2 new `.test.sh` cases pinning the fail-closed-with-override-respects-override invariant.

**Correctness fixes (6 HIGHs)**

- `src/intelligence/analyzer/walk.ts` — `isBinary()` opened a file handle, called `handle.read()`, then `handle.close()` in linear order with no try/finally. A read failure (EIO, ENOENT after stat, EISDIR on a TOCTOU race) skipped `close()` and leaked the FD. Wrapped the read in try/finally so close always runs.
- `src/branches/commit.ts` — after winning the atomic `'ax'` open on `COMMIT.lock`, the code wrote the lock body and closed the FD in linear order. A writeFile failure (ENOSPC, EIO, EBADF mid-write) leaked the FD AND left the lock file orphaned, wedging every subsequent commit until manual cleanup. Wrap the write in try/catch; on failure, close the FD + unlink the lock + re-throw.
- `src/intelligence/kb/snapshots.ts` + `src/intelligence/kb/meetings.ts` — six bare `JSON.parse(row.*_json)` sites in snapshots.ts plus one in meetings.ts:280 would throw to the caller on any historical writer that left truncated JSON. Added local `safeJsonParse<T>(raw, fallback)` helper to snapshots.ts and routed all six metric-array parses through it; the diff-cache lookup now treats malformed payload as a cache miss and recomputes. meetings.ts `editDecision` falls back to `[]` on parse failure.
- `src-tauri/src/memory_arena/arena.rs` — three call sites computed `total_bytes = slot_size.checked_mul(num_slots).expect("arena size overflow")` inside functions that returned `ArenaResult<Self>`. With operator-misconfigured or attacker-influenced sizing the multiplication wraps to `None` and the unwrap turns into a panic. Added a new `ArenaError::ArithmeticOverflow { operation, slot_size, num_slots }` variant and replaced `.expect` with `.ok_or(...)?` at all 3 sites.
- `src/dependency-resolver/manifest-patcher.ts` — five patch sites plus four remove sites built `RegExp()` from `packageName` with per-ecosystem partial escaping that missed `.`, `+`, `*`, `(`, `)` — all legal in Cargo, conda, gem, and pypi names. A package literally named `lib*` or `foo.bar` would either silently mis-match a sibling (replacing the wrong version) or fail to match at all. Centralized escaping in `escapeRegExp()` and swept all 9 sites. PyPI PEP 503 separator normalization preserved by reintroducing the `[-_.]` character class on the already-escaped name.
- `src-tauri/src/mcp_host/commands.rs::McpHostState::rebuild_router` — replaced the `unsafe { &*ptr }` raw-pointer cast (a workaround for the borrow checker that's actual UB if `rebuild_index` ever touches another field of `self`) with a `let Self { manager, router, .. } = self` destructure. The compiler can prove `manager` and `router` are disjoint named fields, so the immutable + mutable split-borrow holds without unsafe.

**Verification.** Per-fix subsystem tests stayed green at every step: 132 analyzer tests, 61 branches tests, 154 KB tests, 321 memory_arena tests, 58 dependency-resolver tests, 38 mcp_host tests, 17 console/helper tests, 3 pty allowlist tests, 2 dashboard slug tests, 15 self-mod-guard `.test.sh` cases (3 new), 22 git-add-blocker `.test.sh` cases (2 new).

**What this ship doesn't close.** Tier C performance HIGHs (skill-index regex cache, VRAM `read_to_end` pre-sizing), Tier D test-quality HIGHs (feedback-bridge + operation-cooldown fake-timer fixes, 3 untested `.claude/hooks/` scripts), and Tier E architecture HIGHs (cli.ts dispatcher extraction, Store/Registry/Manager dedup, LoaderContext chokepoint) remain queued. Tier A and Tier B MEDIUMs/LOWs also still open. A new `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` ledger in the working tree (gitignored) tracks status per finding so the queue doesn't decay across counter-cadence ships.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.177, INTERSTELLAR-BOUNDARY axis at obs#1 first INSTANCE.
- **No new substrate-anchors emitted** — this is security/correctness operational-debt, not engine-cadence.
- **No new V-flags emitted.**
- **Counter-cadence cadence — fourth instance.** Lesson #10168 extends. Cadence interval from v777 to v778 is 1 milestone — the tightest yet. The operator-driven trigger class (operator authorizes Wave N from a known queue) is now established as a productive cadence.
- **Counter-cadence trigger class refined.** v585 = social-rule-debt accumulation; v776 = script-bug-cascade with public impact; v777 = full-codebase review surfacing BLOCKERs; v778 = pre-itemized HIGH queue from the prior counter-cadence review. The four classes form a hierarchy: passive accumulation → reactive crisis → proactive deep-sweep → planned remediation wave.

## Threads closed / opened / extended

- **CLOSED:** webview-controllable arbitrary-executable spawn in `pty_open` (CWE-77). Allowlist by basename.
- **CLOSED:** JS injection + path traversal vectors in `generate_dashboard` (CWE-94). Slug validation + JSON-encoded literals.
- **CLOSED:** LAN-side write primitive into `.planning/console/inbox/pending` via `0.0.0.0` + `CORS *`. 127.0.0.1 bind + same-origin enforcement.
- **CLOSED:** hook fail-open on malformed/missing input. Fail-closed default with respected env-var overrides.
- **CLOSED:** FD leak on read failure in `walk.ts::isBinary`.
- **CLOSED:** FD + lock-file leak on writeFile failure in `branches/commit.ts`.
- **CLOSED:** unhandled JSON.parse throw on malformed KB rows in `snapshots.ts` (6 sites) + `meetings.ts` (1 site).
- **CLOSED:** panic-on-multiply-overflow in `arena.rs` (3 sites). New `ArenaError::ArithmeticOverflow` variant.
- **CLOSED:** UB from raw-pointer split-borrow in `mcp_host::commands::rebuild_router`. Safe destructure.
- **CLOSED:** silent mis-match / non-match of regex-meaningful package names in `manifest-patcher` (9 sites). Centralized `escapeRegExp`.
- **OPENED:** `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` ledger format. Tracks per-finding status across counter-cadence ships so the open queue doesn't decay into tribal knowledge.
- **OPENED:** `src/cli/entrypoint-guard.ts` pattern (from v777 session arc) re-validated by the v778 `escapeRegExp` extraction. Shared-helper-from-N-sites is now an established discipline with two independent obs.
- **EXTENDED:** counter-cadence trigger class hierarchy to four named classes. Lesson #10168 candidate text updated.

## Forward lessons emitted

This ship sustains and extends several disciplines:

- **Wave-N cadence as a counter-cadence pattern.** Wave 1 closed BLOCKERs only by design; Wave 2 closes HIGHs from the same pre-itemized queue. The pattern is reusable: spawn a periodic deep sweep, identify findings, ship Wave 1 (BLOCKERs), then ship Wave N+1 from the remaining queue in tight cadence until the queue is drained or the next forward-cadence ship interrupts.
- **Cross-language sweep in a single ship.** Wave 2 closed findings across TypeScript (walk, commit, snapshots, meetings, manifest-patcher), Rust (pty, dashboard, arena, mcp_host), and JavaScript hooks (self-mod-guard, git-add-blocker). Each language's idiomatic fix differed (try/finally vs `?` vs env override + fail-closed default), but the underlying review-driven cadence held.
- **Review-ledger-as-working-tree-artifact.** The new `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` lives in the gitignored `.planning/` tree but is referenced by future sessions via Read. This keeps the file out of git history (where it would rot) while preserving its function as the source-of-truth for open findings across ships.

See `chapter/04-lessons.md` for the lesson candidates extracted this ship.
