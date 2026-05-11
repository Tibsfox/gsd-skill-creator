# 03 — Retrospective: v1.49.634

## Carryover lessons applied

**Lesson #10168 — counter-cadence cleanup-mission cadence (registered at v1.49.585).** Cadence target ~30 forward-cadence milestones; trigger fired at v1.49.615 but milestone shipped at v1.49.634. **The trigger fired correctly; what was missing was a deterministic surface that escalated it.** The trigger lived as a forward lesson in `04-lessons.md`, which is a soft artifact — prose that humans scan but no harness reads. 19 forward milestones passed between trigger-fire and ship without intervention. The lesson APPLIED here is the milestone existing at all; the meta-lesson FORWARD (in `04-lessons.md` of this milestone) is that the cadence itself should be gated.

**Lesson #10169 — gate-not-vigilance discipline (registered at v1.49.585).** APPLIED in W1A: every closure (C1/C2) shipped as deterministic gate code, not as a written rule. C2 explicitly promotes the prose-rule "src/ never imports `@tauri-apps/api`" from a CLAUDE.md bullet to a pre-tag-gate step that mechanically rejects violations. The W3 stage 1 integration meta-test then verifies the gate BLOCKS on a synthetic violation — the system gates itself against the new gate.

**Lesson #10170 — meta-test at ship time (registered at v1.49.585).** APPLIED in W3 stage 1: `tests/integration/v1-49-634-meta-test.test.ts` mirrors the v1.49.585 W4 Phase 3 pattern with 4 subprocess-isolated tests. The watchdog test is in-process (the watchdog is a deterministic unit; no subprocess needed for its surface contract). The other 5 tests spawn `node` subprocesses with sanitized env vars to verify gate BLOCK/ALLOW behavior end-to-end.

**Lesson #10174 — runtime config-guard discipline.** APPLIED in C3 Stage 2B: the new `insecure-plaintext-keystore` feature is declared in `src-tauri/Cargo.toml`, NOT in `.claude/settings.json`. Operator-facing gate behavior is documented in CLAUDE.md "Operational Gates" table; the actual enforcement is compile-time (release profile excludes the feature → branch is `cfg(feature = "insecure-plaintext-keystore")`-gated out).

## What went unusually well

- **Mid-mission audit produced a follow-on stub rather than scope creep.** C6 surfaced 48 LEGACY chipsets and 0 cartridge.yaml siblings — a far larger migration than the spec budgeted for. Per the spec decision tree (>15 LEGACY = follow-on mission stub), the audit was completed audit-only and `v1-49-650-cartridge-finalization-stub.md` was authored without expanding scope. This is the discipline that v1.49.585 Lesson #10172 (scope expansion mid-mission) implicitly grants permission for — when the constraint inverts, contraction is the right answer.
- **Two-phase gate landing for C1 watchdog.** Default policy `observe-only` lets the watchdog soak in the runtime as a pure observer; the `auto-restart` policy is opt-in via setting. No process-spawning authority shipped until the observability surface is validated. This is the inverse of the v1.49.585 W4 hook BLOCK pattern (BLOCK first, learn later) — appropriate because watchdogs touch live processes whereas hooks reject tool calls.

## What went less well

- **Cadence-trigger latency (19 milestones).** Documented above; the forward lesson in `04-lessons.md` is the proposed gate.
- **Three pre-existing test fragilities surfaced but not addressed.** `browser-tab-parity`, `connection-caching`, `public-deployment-smoke` flake intermittently. They are NOT v1.49.634 regressions but they affect signal-to-noise in pre-tag-gate runs. lab-director surfaced these in the W1B G-gate advisory; they are flagged forward to a housekeeping mission rather than fixed inline (the right scope decision, but worth noting that the cleanup milestone left them on the floor).
- **C7 found 1 BEHAVIORAL upstream delta (`gsd-review` → `gsd-quality` rename) but cannot fully absorb it.** Upstream's own migration is incomplete — many upstream-mirrored workflows still reference `/gsd-review`. The right action is "wait for upstream to finish migrating, then absorb in one shot." This is a deferred-absorption pattern that doesn't appear in the C7 spec decision tree; worth refining the spec for future audits.

## Process observations

- **Wave-G-gate gating worked cleanly.** W1A-GGATE.md + W1B-GGATE.md both PASS; no W1C gate per the wave-execution-plan (correctly omitted; T10/T11 are linearly sequenced after T8/T9). lab-director-as-quality-bar was the right G-gate authority; team-lead-as-operator-relay was the right G3-only authority. No authority confusion this milestone.
- **Two-phase commit discipline for bisect-ability.** C3 landed as two separate commits (`ceb05f60a` for the let_underscore_lock rustc fix, `244482e97` for the release-feature gate). C4 landed in one commit (4 small items with shared scope). The discipline is "split if the bisect target differs" — for C3 the rustc fix and the security gate have different blast radii; for C4 the 4 items share the v1.49.585-§4-batch scope and bisect together.
- **Session-2 warm start from W1C boundary worked.** capcom's handoff doc was complete and actionable; flight-ops resumed at T10 without re-reading mission specs except where the active task touched them. The handoff structure (Pipeline State / Completed Work / Pending Tasks / Open Items / Resume Sequence) generalizes well for future wave-boundary handoffs.

## Inline stabilization addendum (post-T11)

The T11 pre-tag-gate smoke check surfaced 4 vitest failures across the 3 pre-existing fragility files lab-director flagged at W1B G-gate: `public-deployment-smoke`, `connection-caching`, `browser-tab-parity`. Operator chose **Option B — pause T12 and stabilize inline** rather than defer to a separate housekeeping mission (the original v1.49.640-650 plan documented in forward Lesson #4). Three atomic stabilization commits landed:

- **`13e2df2a8`** — SCRIBE public-deployment-smoke skip-guard tightened from "DEPLOY_DIR exists" to "full 12-file manifest exists" via `EXPECTED_FILES.every(existsSync)`. Test soft-skips cleanly on partial www/ checkouts; matches the gitignored-www reality its own comment already documented.
- **`c6d49d8ab`** — connection-caching `beforeEach` hook timeout bumped 10s → 60s using vitest's `beforeEach(fn, timeout)` signature. Root cause: sqlite migrations + dual-DB init are fsync-bound under full-suite contention.
- **`c49528c42`** — browser-tab-parity `beforeEach` timeout bumped 10s → 60s; same root cause + same fix as connection-caching (the `seed()` helper uses the same sqlite-migration pattern).

Post-stabilization pre-tag-gate re-run was clean: all 9 steps PASS, 30,396 tests pass / 0 fail / 37 skipped. This validates forward Lesson #4's diagnosis (the three tests shared a sqlite-migration-under-contention root cause + a manifest-completeness gap) and demonstrates that the surgical fixes were tractable inline rather than requiring a multi-session follow-on. The forward lesson stays in `04-lessons.md` as documented — it's still valid that flaky tests in the pre-tag-gate path erode authority, and the v1.49.650 cluster (now operator-pinned) bundles the encryption-rotation + cartridge-finalization + further root-cause hardening for these tests if any latent fragility surfaces.
