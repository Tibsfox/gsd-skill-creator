# v1.49.779 — Wave 3 Review HIGHs / Performance + Test-Quality Counter-Cadence

**Released:** 2026-05-26
**Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
**Predecessor:** v1.49.778 — Wave 2 Review HIGHs Counter-Cadence
**Engine state:** UNCHANGED (NASA degree sustains at 1.177; MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#60+)
**Counter-cadence parents:** v1.49.585 (concerns-cleanup), v1.49.776 (template-pollution), v1.49.777 (Wave 1 BLOCKERs), v1.49.778 (Wave 2 HIGHs)

## Summary

**Counter-cadence ship #5 in the engine.** The third Wave-N ship in the v1.49.777 risk-tier-sweep remediation arc. v1.49.777 closed BLOCKERs (Wave 1); v1.49.778 closed the security + correctness HIGHs (Wave 2); v1.49.779 closes the remaining performance + test-quality HIGHs (Wave 3). Five fixes landed as five atomic commits before this release commit. Cadence interval from v778 is again 1 milestone — three tight-cadence counter-cadence ships in a row.

**Performance fixes (2 HIGHs)**

- `src/storage/skill-index.ts:224-243` — `findByTrigger` is on the skill-resolution hot path and previously called `new RegExp(pattern, 'i')` (intent match) + `new RegExp('^' + pattern.replace(...) + '$')` (file-glob match) per skill per call. For a project with N skills × M trigger patterns each, every resolution call did N×M compile-and-discard cycles. Added module-level `Map<string, RegExp>` caches (intent + file-glob) keyed by raw pattern; `null` is cached for malformed intent patterns so subsequent calls fall straight to the substring fallback without re-throwing.
- `src-tauri/src/memory_arena/persistence.rs:217-219` — `read_checkpoint` did `Vec::new()` + `file.read_to_end(&mut buf)` for multi-MB checkpoints, which grows the buffer in powers of 2 (multiple intermediate allocations + copies). Pre-size from `file.metadata().len()` so the one allocation fits the whole read. A failed `metadata()` call (rare on a freshly-opened file) falls through to `Vec::new()` so correctness is unchanged.

**Test-quality fixes (3 HIGHs)**

- `src/observation/feedback-bridge.test.ts` — 12 cases each awaited `new Promise(r => setTimeout(r, 50))` (one used 100ms) to wait for the fire-and-forget `storeFeedback` chain to land. ~700ms accumulated wall-clock and a real flake hazard on slow CI runners (matches `flake-audit-2026-05-11.md` pattern). Root cause was architectural: `SignalBus.emit` is fully sync and the listener fires `storeFeedback` as a fire-and-forget promise. Added a chained `pending` promise field on `FeedbackBridge` + a `flushPending()` method that resolves once every in-flight write has settled. Tests now `await bridge.flushPending()` instead of sleeping. Runtime: ~700ms → 154ms; flake risk eliminated.
- `src/safety/operation-cooldown.test.ts:59` — the "allow invocation after cooldown expires" case slept 150ms real-time waiting for a 100ms cooldown to elapse. On slow CI runners with timing jitter, the 50ms slack was the only thing between the test and a flake. Skip the wait: write a state file directly with a timestamp 500ms in the past, then `check()`. Same logical assertion, deterministic.
- `.claude/hooks/gsd-read-guard.js` + `gsd-prompt-guard.js` + `gsd-response-scan.cjs` — 387 lines of advisory PreToolUse/PostToolUse logic with **zero** tests, while sibling `self-mod-guard.js` + `git-add-blocker.js` have `.test.sh` coverage. Added 8 + 10 + 10 = 28 sterile-env `.test.sh` cases each pinning the advisory/silent invariants per hook. **`gsd-read-guard.js` was also promoted to `project-claude/hooks/` as source-of-truth** — it previously lived only at the gitignored `.claude/hooks/` runtime location, so a fresh clone of the repo would not have had it at all. Source-now-tracked + deployed copy kept in sync via the same `SC_SELF_MOD=1 cp` pattern self-mod-guard / git-add-blocker use.

**Verification.** Per-fix subsystem tests stayed green at every step: 51 storage tests + 27 findByTrigger consumer tests + 321 memory_arena tests + 11 feedback-bridge tests + 18 operation-cooldown tests + 28 new hook `.test.sh` cases. The feedback-bridge subsystem's wall-clock dropped from ~700ms to 154ms.

**What this ship doesn't close.** Tier E architecture HIGHs (cli.ts dispatcher extraction, Store/Registry/Manager dedup pairs, LoaderContext chokepoint) remain queued — those are larger structural changes that warrant a dedicated forward-cadence pass rather than a counter-cadence wave. Tier A/B MEDIUMs and LOWs across all tiers also still open; next risk-tier sweep at v1.49.789 will re-itemize them with current line numbers. Status of every finding tracked at `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md`.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at NASA degree 1.177, INTERSTELLAR-BOUNDARY axis at obs#1 first INSTANCE.
- **No new substrate-anchors emitted.**
- **No new V-flags emitted.**
- **Counter-cadence cadence — fifth instance.** Lesson #10168 extends. Three back-to-back counter-cadence ships (v777 + v778 + v779) at 1-milestone intervals — the cadence under operator-driven Wave-N triggers is qualitatively different from passive accumulation and the engine accommodates it without strain.
- **Wave-N cadence pattern fully validated.** Sweep → Wave 1 (BLOCKERs) → Wave 2 (HIGHs subset A) → Wave 3 (HIGHs subset B) is now a documented, reusable counter-cadence shape. Future risk sweeps can follow the same template.

## Threads closed / opened / extended

- **CLOSED:** per-call RegExp compilation in `findByTrigger` skill-resolution hot path. Module-level cache.
- **CLOSED:** incremental Vec realloc on multi-MB checkpoint reads. Pre-size from metadata.
- **CLOSED:** ~700ms accumulated `setTimeout` flake hazard in `feedback-bridge.test.ts`. `FeedbackBridge.flushPending()` method.
- **CLOSED:** 150ms real-sleep flake hazard in `operation-cooldown.test.ts`. Pre-expired state-file write.
- **CLOSED:** zero-tests-for-advisory-hooks gap in `.claude/hooks/gsd-*`. 28 sterile-env `.test.sh` cases.
- **CLOSED:** `gsd-read-guard.js` source-of-truth gap. Promoted from gitignored `.claude/hooks/` to tracked `project-claude/hooks/`.
- **OPENED:** `FeedbackBridge.flushPending()` as a public API. Future callers needing at-least-once delivery before proceeding can await it.

## Forward lessons emitted

This ship sustains and extends several disciplines:

- **Fire-and-forget event-handler test pattern.** When a sync `bus.emit` triggers an async handler, the test cannot rely on `setTimeout` waits — the handler may take longer than the wait under load. The deterministic shape is: expose a `pending` promise (or a `flush()` method) from the consumer and `await` it in the test. Captured at `FeedbackBridge.flushPending()`; reusable across any similar event-bus integration.
- **Skip-the-wait-with-pre-expired-state test pattern.** When a test needs "X time has elapsed" semantics against an externally-stored timestamp, write the state file directly with a sufficiently-old timestamp rather than sleeping. Captured at `operation-cooldown.test.ts`; reusable for any time-keyed state on disk.
- **Hook source-of-truth audit.** Any hook deployed under `.claude/hooks/` MUST have a tracked source under `project-claude/hooks/`. Without it, the hook vanishes on fresh clone. Audit recommended at next counter-cadence: grep for `.claude/hooks/*.js,*.cjs` files without a matching `project-claude/hooks/*` companion.

See `chapter/04-lessons.md` for the lesson candidates extracted this ship.
