#!/usr/bin/env bash
# tools/pre-tag-gate.sh — pre-tag composite gate for v1.49.x ships.
#
# Run BEFORE `git tag` to catch CI-shaped failures that the lighter
# pre-push hook does not exercise. Composes:
#
#   1. npm run build  — catches TypeScript errors (e.g. TS2835 missing-.js
#                       extensions) that vitest does not surface
#   1.5. version-sequence sanity (v1.49.636 C5, Lesson #10183) — verifies
#                       package.json patch is sequential vs the latest
#                       prior tag in the same major.minor line. Soft-warn
#                       by default; SC_REQUIRE_SEQUENTIAL_VERSION=1 hard-
#                       fails; SC_SKIP_VERSION_SEQUENCE_CHECK=1 silences
#                       (use for intentional gaps + document in release-
#                       notes). Closes v1.49.635 slot-correction incident.
#   2. npx vitest run — runs the full vitest suite, mirroring CI
#   3. node tools/release-history/check-completeness.mjs --current --strict
#                     — release-notes 5-file structure (already enforced by
#                       the pre-push hook on push-to-main, but re-checked
#                       here so the operator sees the gate fire pre-tag)
#   4. CI-on-dev verification — origin/dev tip's latest CI run must be
#                       conclusion=success before tag/main-push proceeds.
#                       Added v1.49.587 per HARD RULE: "verify CI passes on
#                       dev before pushing to main".
#                       v1.49.636 C6: SC_SKIP_CI_GATE_TESTS=<csv> is the
#                       enumerated override (closes Lesson #10185 silently-
#                       masked-second-red incident); legacy SC_SKIP_CI_GATE=1
#                       still works but emits DEPRECATION WARNING.
#   5. SPICE renderer bundle freshness — esbuild `spice-renderer/index.ts` →
#                       `index.js`. Idempotent. Added v1.49.587 — closes the
#                       v1.49.581 unwired-build gap that left 126 SPICE
#                       viewer pages broken on tibsfox.com.
#   6. Depth audit (BLOCKER as of v1.49.591) — flags sibling NASA/MUS/ELC
#                       index.html files at <80% predecessor line/byte depth.
#                       Closes Lesson #10188 candidate from v1.49.588 §5:
#                       W2-quota depth gap that required ad-hoc rebuild of 6
#                       files. Added v1.49.589 in WARNING-only mode; soaked
#                       across v1.49.589 + v1.49.590 with zero FAIL findings;
#                       hardened to BLOCKER at v1.49.591 per T2.2. Override:
#                       SC_SKIP_DEPTH_AUDIT=1 (emergency only — fix the
#                       depth gap instead).
#   7. CLAUDE.md auto-render check — runs `node tools/render-claude-md.mjs
#                       --check`. Fails when CLAUDE.md is out of sync with
#                       the source-of-truth manifests at
#                       tools/render-claude-md/. Fix is cheap: run
#                       `npm run render:claude-md` and commit the diff.
#                       Override: SC_SKIP_CLAUDE_MD_GATE=1 (emergency only;
#                       the fix is a 5-second auto-render).
#   8. Catalog-index drift check (BLOCKER — added v1.49.601) — runs
#                       `node tools/update-catalog-indexes.mjs --check`.
#                       Fails when any NASA/MUS/ELC catalog index file is
#                       missing degree entries that exist on-disk. NASA fix:
#                       --write auto-rewrites the completedMissions Set.
#                       MUS/ELC fix: author missing degree-card divs manually.
#                       Override: SC_SKIP_CATALOG_INDEX_GATE=1 (emergency
#                       only — closes the v598/v599/v600 silent-drift class).
#   9. Tauri-boundary audit (BLOCKER — added v1.49.634 §15) — runs
#                       `node tools/tauri-boundary-audit.mjs --check`. Fails
#                       when a NEW import in src/ reaches @tauri-apps/api or
#                       a NEW import in desktop/ reaches a Node.js builtin
#                       (excluding *.test.* files which legitimately use
#                       node:crypto et al. under vitest). Existing
#                       architectural exemption (the runtime-only tauri-ipc
#                       bridge) is allowlisted at
#                       tools/tauri-boundary-audit.allowlist.json. Override:
#                       SC_SKIP_TAURI_BOUNDARY_GATE=1 (emergency only).
#   9.5. Apply-to-self enforcement (v1.49.636 C7, Meta-Lesson) — runs
#                       `node scripts/apply-to-self.mjs` which greps
#                       newly-authored test files in the milestone diff
#                       against pattern violations cataloged from the
#                       discipline docs (existsSync-no-skip-guard,
#                       perf-assertion-no-warmup). WARN-only by default;
#                       converts to BLOCK with SC_REQUIRE_APPLY_TO_SELF=1.
#                       Override: SC_SKIP_APPLY_TO_SELF=1 (emergency only;
#                       fix the findings or allowlist at
#                       .planning/ship-pipeline-discipline/apply-to-self-allowlist.md).
#   10. Scaffolder-residue audit (v1.49.653, CONCERNS §18.2) — detects
#                       TODO markers from capability-scaffolder.ts /
#                       skill-generator.ts that escape into shipped skills/
#                       agents. BLOCKER (--strict).
#   11. Citation-debt ledger sync (v1.49.653, CONCERNS §9.3) — WARN-only;
#                       scans recent retrospectives for V-flag activity.
#   12. STORY.md drift detection (v1.49.653) — WARN-only; detects drift
#                       between docs/release-notes/STORY.md preamble and the
#                       chapter directory count + package.json version.
#                       Recurrence path for the 8-degree v1.49.645→652 sprint.
#   13. Discipline coverage audit (v1.49.653, L-04, CONCERNS §23.4) — WARN-
#                       only; surfaces lesson IDs that appear in 2+
#                       retrospectives but are not captured in
#                       tools/render-claude-md/disciplines.json nor in any
#                       cited canonical doc.
#   14. SPS cohort-uniqueness audit (v1.49.666, Lesson #10364) — WARN-only;
#                       scans www/.../SPS/<slug>/index.html for declared
#                       SPS-number collisions on disk. Closes the recurrence
#                       path for the v1.49.661 marbled-murrelet near-miss
#                       (existing SPS #82 + v661 false first-instance @ #115).
#                       Promote to BLOCKER via
#                       SC_PRE_TAG_GATE_REQUIRE=sps-cohort-uniqueness at
#                       next NASA degree-advance window.
#   15. NASA canonical layout gate (v1.49.716, BLOCKER) — runs
#                       `bash tools/nasa-canonical-layout-gate.sh`. Fails when
#                       any www/.../NASA/<ver>/index.html drifts from the v1.0
#                       canonical 12-card layout (Mission Summary, Mission
#                       Tracks 1a/1b/2-7, Resonance Axes, What to Build, TRY,
#                       DIY, Creative Artifacts, Runnable Sims, Interactive
#                       Lab, Forest Contribution, Data Files, Dedication).
#                       Closes the v1.49.716 restoration campaign: 135/169
#                       missions had drifted from canonical due to v1.58/1.60
#                       spec rewrite + v1.118+ build-pipeline gap. Hybrid
#                       restore (v1.0 cards + substrate-form additions) is
#                       the new normative. Override:
#                       SC_PRE_TAG_GATE_BYPASS=nasa-canonical-layout
#                       (emergency only — fix the drift instead).
#   17. PROJECT.md drift check (v1.49.785, WARN-only) — runs
#                       `node tools/project-md-normalizer.mjs --check`.
#                       Surfaces drift between .planning/PROJECT.md and ground
#                       truth: stale "Latest shipped release" version vs
#                       package.json, malformed GAP table rows, unrecognized
#                       statuses, "Last updated" >30d old. WARN-only by default
#                       (PROJECT.md is gitignored hand-authored prose; auto-fix
#                       is out of scope). Promote to BLOCKER via
#                       SC_PRE_TAG_GATE_REQUIRE=project-md.
#                       Closes audit strengthening lever S5 (audit
#                       .planning/AUDIT-2026-05-26-core-functions-retrospective.md).
#
#   16. NASA canonical sidebar gate (2026-05-24, BLOCKER) — runs
#                       `bash tools/nasa-canonical-sidebar-gate.sh`. Fails
#                       when any NASA Part C page lacks the canonical sidebar
#                       trio (organism-card + Bird:/Animal:/Plant:/Habitat:
#                       companion h3 + S36 Pairing or Dedication). Locks in
#                       the 169/169 PASS milestone closed by the 2026-05-24
#                       canonical-sidebar rollout campaign (handoff:
#                       .planning/HANDOFF-CANONICAL-SIDEBAR-V1.38-V1.49-
#                       2026-05-24.md). Complements step 15 (12-card main-
#                       column layout) by enforcing the sidebar-side
#                       organism/companion/S36 triple from
#                       canonical-pairings.json. Override:
#                       SC_PRE_TAG_GATE_BYPASS=nasa-canonical-sidebar
#                       (emergency only — re-run
#                       .planning/sps-s36-mapping/inject-canonical-sidebar.py
#                       to restore drift).
#
# Exit codes:
#   0   all checks PASS
#   1   build failed
#   2   vitest failed
#   21  tools-suite (vitest.tools.config.mjs) failed (BLOCKER as of v1.49.913)
#   22  tools-node-test (node --test on tools/ + scripts/ node:test files) failed (BLOCKER as of v1.49.914)
#   28  integration project (npx vitest run --project integration) failed (BLOCKER as of v1.49.932)
#   3   completeness gate failed
#   4   CI-on-dev failed / pending
#   5   www-bundles build failed
#   6   depth-audit FAIL findings (BLOCKER as of v1.49.591)
#   7   CLAUDE.md drift
#   76  card-template title-length gate failed (>150 chars; BLOCKER as of v1.49.676 cc1)
#   8   catalog-index drift (BLOCKER added v1.49.601)
#   9   tauri-boundary violation (BLOCKER added v1.49.634)
#   10  apply-to-self findings (BLOCKER only when require flag set; default WARN-only)
#   12  scaffolder-residue findings (BLOCKER as of v1.49.653)
#   13  citation-debt-sync escalation (BLOCKER only when require flag set; default WARN-only)
#   14  story-drift escalation (BLOCKER only when require flag set; default WARN-only)
#   15  discipline-coverage: default-BLOCK when UNCODIFIED/PARTIAL > ceiling (v1.49.822/v1.49.912); also BLOCKs under require flag (legacy strict, UNCODIFIED>0)
#   16  sps-cohort-uniqueness escalation (BLOCKER only when require flag set; default WARN-only)
#   17  nasa-canonical-layout drift (BLOCKER as of v1.49.716)
#   18  nasa-canonical-sidebar drift (BLOCKER as of 2026-05-24)
#   19  project-md: default-BLOCK when latest-shipped patch-drift > SC_PROJECT_MD_MAX_PATCH_DRIFT; also BLOCKs under require flag
#   20  stale-known-unwired entries present (BLOCKER)
#   23  adoption-freshness: stale ADOPTION-BASELINE (BLOCKER as of v1.49.1029, was WARN-only)
#   24  state-backups: lingering .planning/ backup file(s) (BLOCKER as of v1.49.961 cc#28; code was 21, reassigned 21→24 at v1.49.966 to resolve a collision with tools-suite)
#   25  trip-vocab: TRIP-RISK verdict on current NASA page (BLOCKER as of v1.49.1029, was WARN-only)
#   26  ship-review-attestation missing/stale (BLOCKER as of v1.49.1029)
#
# Step overrides (v1.49.653 consolidation; CONCERNS §26):
#   SC_PRE_TAG_GATE_BYPASS=<csv>   skip these steps entirely
#   SC_PRE_TAG_GATE_REQUIRE=<csv>  escalate WARN-only steps to BLOCKER
#
#   step-name vocabulary: the gate's honored bypass tokens are the
#   gate_bypassed "<token>" calls at each step below. The full list is enumerated
#   AND parity-pinned in the runtime step-names help log + in
#   tools/render-claude-md/env-vars.json (drift-guard:
#   tests/integration/bypass-vocab-parity.test.ts). Core steps build, vitest,
#   completeness, www-bundles run unconditionally; version-sequence keeps its own
#   SC_SKIP_VERSION_SEQUENCE_CHECK — none is wired into this CSV.
#
# Legacy per-step env vars (SC_SKIP_*_GATE, SC_REQUIRE_*) are honored with a
# DEPRECATION WARNING for one milestone cycle to ease migration.
#
# Usage:
#   bash tools/pre-tag-gate.sh
#   npm run pre-tag-gate
#
#   # Skip CI gate + depth-audit:
#   SC_PRE_TAG_GATE_BYPASS=ci-gate,depth-audit bash tools/pre-tag-gate.sh
#
#   # Escalate apply-to-self + story-drift to BLOCKER:
#   SC_PRE_TAG_GATE_REQUIRE=apply-to-self,story-drift bash tools/pre-tag-gate.sh
#
# Why this gate exists:
#   v1.49.585 shipped with CI red on dev (run 25096343019) and main
#   (run 25096349789). 1 build error + 4 test failures, all
#   v1.49.585-introduced. The W4 Phase 3 meta-test only ran completeness +
#   chapter idempotent + pre-push BLOCK/ALLOW; CI-shaped tests slipped
#   through. Forward lesson #10176 captured the gap; this script closes it.
#
#   v1.49.586 follow-up (2026-04-29) discovered 126 SPICE viewer pages
#   silently broken on tibsfox.com because v1.49.581 spec'd a Vite build
#   that was never wired up. Steps 4+5 prevent recurrence: CI-on-dev catches
#   missing-automation drift; bundle freshness catches stale build artifacts.
#
# Authored 2026-04-29 in v1.49.585+ post-ship CI-fix follow-up.
# Steps 4+5 added 2026-04-29 in v1.49.587.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "[pre-tag-gate] FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

QUIET="${PRE_TAG_GATE_QUIET:-0}"

log() {
  if [ "$QUIET" != "1" ]; then
    echo "$@"
  fi
}

# ----- v1.49.653 L-02: consolidated bypass/require parsing (CONCERNS §26) -----
#
# Two CSV env vars replace ~15 ad-hoc SC_SKIP_* / SC_REQUIRE_* toggles:
#
#   SC_PRE_TAG_GATE_BYPASS=ci-gate,depth-audit,catalog-index
#       Skip these steps entirely. The skip is logged.
#
#   SC_PRE_TAG_GATE_REQUIRE=apply-to-self,citation-debt-sync,story-drift
#       Escalate WARN-only steps to BLOCKER status.
#
# Step-name vocabulary: see the runtime step-names help log below +
# tools/render-claude-md/env-vars.json (both parity-pinned by
# tests/integration/bypass-vocab-parity.test.ts).
#
# Legacy SC_SKIP_* / SC_REQUIRE_* env vars continue to be honored with a
# deprecation warning for one milestone cycle. Use the new CSV form for new
# work; the legacy vars are kept for back-compat with operator setups.

_PTG_BYPASS_RAW="${SC_PRE_TAG_GATE_BYPASS:-}"
_PTG_REQUIRE_RAW="${SC_PRE_TAG_GATE_REQUIRE:-}"
# shellcheck disable=SC2206  # comma-split into array is intentional
IFS=',' read -ra _PTG_BYPASS_LIST <<< "$_PTG_BYPASS_RAW"
# shellcheck disable=SC2206
IFS=',' read -ra _PTG_REQUIRE_LIST <<< "$_PTG_REQUIRE_RAW"

_ptg_trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# Returns 0 if step is in the bypass set (via CSV or legacy env var).
# Args: $1 = step name, $2 = optional legacy env var name (for back-compat).
gate_bypassed() {
  local name="$1"
  local legacy_var="${2:-}"
  if [ -n "$_PTG_BYPASS_RAW" ]; then
    local item
    for item in "${_PTG_BYPASS_LIST[@]+"${_PTG_BYPASS_LIST[@]}"}"; do
      item="$(_ptg_trim "$item")"
      if [ "$item" = "$name" ]; then
        return 0
      fi
    done
  fi
  if [ -n "$legacy_var" ] && [ "${!legacy_var:-0}" = "1" ]; then
    echo "[pre-tag-gate] DEPRECATED: $legacy_var=1 → migrate to SC_PRE_TAG_GATE_BYPASS=$name" >&2
    return 0
  fi
  return 1
}

# Returns 0 if step is in the require set (escalates WARN → BLOCKER).
# Args: $1 = step name, $2 = optional legacy env var name (for back-compat).
gate_required() {
  local name="$1"
  local legacy_var="${2:-}"
  if [ -n "$_PTG_REQUIRE_RAW" ]; then
    local item
    for item in "${_PTG_REQUIRE_LIST[@]+"${_PTG_REQUIRE_LIST[@]}"}"; do
      item="$(_ptg_trim "$item")"
      if [ "$item" = "$name" ]; then
        return 0
      fi
    done
  fi
  if [ -n "$legacy_var" ] && [ "${!legacy_var:-0}" = "1" ]; then
    echo "[pre-tag-gate] DEPRECATED: $legacy_var=1 → migrate to SC_PRE_TAG_GATE_REQUIRE=$name" >&2
    return 0
  fi
  return 1
}

# Print summary of active overrides at session start (if any).
if [ -n "$_PTG_BYPASS_RAW" ] || [ -n "$_PTG_REQUIRE_RAW" ]; then
  [ -n "$_PTG_BYPASS_RAW" ]  && log "[pre-tag-gate] active BYPASS:  $_PTG_BYPASS_RAW"
  [ -n "$_PTG_REQUIRE_RAW" ] && log "[pre-tag-gate] active REQUIRE: $_PTG_REQUIRE_RAW"
  log "[pre-tag-gate] (step names: tools-suite|tools-node-test|integration|ci-gate|depth-audit|depth-audit-mus-elc|claude-md|card-template-length|catalog-index|tauri-boundary|apply-to-self|scaffolder-residue|citation-debt-sync|story-drift|discipline-coverage|sps-cohort-uniqueness|nasa-canonical-layout|nasa-canonical-sidebar|project-md|stale-known-unwired|state-backups|adoption-freshness|trip-vocab|ship-review-attestation)"
fi

# ----- step 0.5: STATE.md normalizer auto-run (v1.49.671, Lesson #10373) -----
# Deterministic gate converting the recurring v669+v670 manual fix
# (gsd-sdk state.milestone-switch emits frontmatter that the C6 normalizer
# reports as drifted on next run) into an idempotent pre-step. Runs
# state-md-normalizer.mjs --write before vitest so the C6 meta-test
# (tests/integration/v1-49-635-meta-test.test.ts > "STATE.md normalizer
# --check exits 0") sees a normalized STATE.md every invocation.
# Bypass: SC_SKIP_STATE_NORMALIZER=1 (rarely useful — surfaces drift but
# the test will fail anyway).
log "[pre-tag-gate] step 0.5/22: STATE.md normalizer auto-run (v1.49.671 deterministic gate)"
if [ "${SC_SKIP_STATE_NORMALIZER:-0}" = "1" ]; then
  log "[pre-tag-gate] step 0.5/22: SKIPPED (SC_SKIP_STATE_NORMALIZER=1)"
elif [ -f "$REPO_ROOT/.planning/STATE.md" ]; then
  # --write is idempotent: "no drift" outcome leaves the file unchanged
  node tools/state-md-normalizer.mjs --write >/dev/null 2>&1 || true
  # Clean up the backup file the normalizer leaves on actual rewrites
  rm -f "$REPO_ROOT"/.planning/STATE.md.backup-before-normalize-* 2>/dev/null || true
  # v1.49.807 S5 closure: post-write --check round catches any residual drift
  # that survives the --write pass. The historical non-idempotency wedge
  # (omitted Engine state baseline) was closed in v1.49.783 (commit e5d0cbc69);
  # this round is the deterministic regression detector — if --check exits
  # nonzero after a successful --write, the normalizer has regressed.
  if ! node tools/state-md-normalizer.mjs --check >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: state-md-normalizer --check failed AFTER --write" >&2
    echo "[pre-tag-gate]   This indicates a non-idempotency regression in the normalizer." >&2
    echo "[pre-tag-gate]   Diagnose: node tools/state-md-normalizer.mjs --check" >&2
    echo "[pre-tag-gate]   Closed in v1.49.794 (e5d0cbc69); recurrence would be a real regression." >&2
    exit 1
  fi
  log "[pre-tag-gate] step 0.5/22: PASS (STATE.md normalized + idempotency verified)"
else
  log "[pre-tag-gate] step 0.5/22: SKIPPED (no STATE.md; CI/clean-repo path)"
fi

log "[pre-tag-gate] step 1/22: npm run build"
if ! npm run build --silent; then
  echo "[pre-tag-gate] FAIL: npm run build exited non-zero" >&2
  echo "[pre-tag-gate] Check TypeScript errors above; common cause is" >&2
  echo "[pre-tag-gate] missing .js extensions on relative ESM imports" >&2
  echo "[pre-tag-gate] (TS2835 with --moduleResolution node16/nodenext)." >&2
  exit 1
fi
log "[pre-tag-gate] step 1/22: PASS"

# ----- step 1.5: version-sequence sanity (v1.49.636 C5, Lesson #10183) -----
# Soft gate: warn-only by default. Hard fail when SC_REQUIRE_SEQUENTIAL_VERSION=1.
# Bypass: SC_SKIP_VERSION_SEQUENCE_CHECK=1 (intentional gap; document in
# release-notes). Closes v1.49.635 slot-correction incident.
log "[pre-tag-gate] step 1.5/22: version-sequence sanity"
if ! node scripts/check-version-sequence.mjs; then
  echo "[pre-tag-gate] FAIL: version-sequence check exited non-zero" >&2
  echo "[pre-tag-gate]   If non-sequential is intentional, set SC_SKIP_VERSION_SEQUENCE_CHECK=1 + document in release-notes." >&2
  echo "[pre-tag-gate]   If strict-sequential required, this hard-fails per SC_REQUIRE_SEQUENTIAL_VERSION=1." >&2
  exit 1
fi
log "[pre-tag-gate] step 1.5/22: PASS"

log "[pre-tag-gate] step 2/22: npx vitest run (full suite — mirrors CI)"
if ! npx vitest run --silent; then
  echo "[pre-tag-gate] FAIL: npx vitest run exited non-zero" >&2
  echo "[pre-tag-gate] Common v1.49.585+ CI-shaped failures:" >&2
  echo "[pre-tag-gate]   - manifest-drift CF-MED-065b: regenerate via scripts/generate-inventory-manifest.sh" >&2
  echo "[pre-tag-gate]   - harness-integrity hook-ref: settings-hooks.json hooks must use plain relative paths (not \$CLAUDE_PROJECT_DIR-prefixed)" >&2
  echo "[pre-tag-gate]   - claude-md-truth CF-MED-063b: no /media/foxy/ literal paths in CLAUDE.md (use \$REPO/ or \$ARTEMIS_REPO/)" >&2
  exit 2
fi
log "[pre-tag-gate] step 2/22: PASS"

# ----- step 2.5/22: tools-suite gate (v1.49.913 — closes silent-rot of tools/ + scripts/ tests) -----
# The main `npx vitest run` (step 2) does NOT cover tools/ + scripts/ tests
# (vitest.config.ts scopes to src/ .college/ tests/ www/). Those tests ran
# nowhere enforced and silently rotted red — 15 failing catalog/scorer/ftp tests
# went unseen for ~2 weeks. This step runs vitest.tools.config.mjs, which
# includes tools-config-coverage.test.mjs (the Layer-2 drift-guard that fails if
# a new vitest test file is omitted from the include list). Bypass:
# SC_PRE_TAG_GATE_BYPASS=tools-suite (legacy SC_SKIP_TOOLS_SUITE=1).
if gate_bypassed "tools-suite" "SC_SKIP_TOOLS_SUITE"; then
  log "[pre-tag-gate] step 2.5/22: SKIPPED (tools-suite)"
else
  log "[pre-tag-gate] step 2.5/22: tools-suite (vitest.tools.config.mjs — v1.49.913)"
  if ! npx vitest run --config vitest.tools.config.mjs --silent; then
    echo "[pre-tag-gate] FAIL: tools-suite (vitest.tools.config.mjs) exited non-zero" >&2
    echo "[pre-tag-gate]   tools/ + scripts/ tests not covered by the main suite (step 2)." >&2
    echo "[pre-tag-gate]   Reproduce: npx vitest run --config vitest.tools.config.mjs" >&2
    echo "[pre-tag-gate]   If a vitest file is 'missing from include list', add it to vitest.tools.config.mjs." >&2
    exit 21
  fi
  log "[pre-tag-gate] step 2.5/22: PASS"
fi

# ----- step 2.7/22: tools-node-test gate (v1.49.914 — closes the v1.49.913-OPENED gap) -----
# Two node:test files under tools/ run in NO gate at all: vitest cannot execute
# them, so step 2.5 tools-suite skips them, and before this step nothing ran
# them. This step runs them via Node's built-in test runner. The runner is
# DYNAMICALLY DISCOVERED by check-tools-test-coverage.mjs (same classifier as
# its report — no hardcoded list), so a NEW node:test file added later is
# auto-covered without touching this gate. Bypass:
# SC_PRE_TAG_GATE_BYPASS=tools-node-test (legacy SC_SKIP_TOOLS_NODE_TEST=1).
if gate_bypassed "tools-node-test" "SC_SKIP_TOOLS_NODE_TEST"; then
  log "[pre-tag-gate] step 2.7/22: SKIPPED (tools-node-test)"
else
  log "[pre-tag-gate] step 2.7/22: tools-node-test (node --test on tools/ + scripts/ node:test files — v1.49.914)"
  if ! node tools/check-tools-test-coverage.mjs --run-node-test; then
    echo "[pre-tag-gate] FAIL: tools-node-test (node --test) exited non-zero" >&2
    echo "[pre-tag-gate]   Reproduce: node tools/check-tools-test-coverage.mjs --run-node-test" >&2
    echo "[pre-tag-gate]   These are Node built-in test-runner (node --test) files, NOT covered by vitest." >&2
    exit 22
  fi
  log "[pre-tag-gate] step 2.7/22: PASS"
fi

# ----- step 2.8/22: integration-project gate (v1.49.932 — closes the v1.49.931 red-CI escape) -----
# The main `npx vitest run` (step 2) does NOT run the integration project: the
# root vitest project EXCLUDES **/*.integration.test.ts, and the `integration`
# project is opt-in (vitest.config.ts). CI runs it as its own step
# (.github/workflows/ci.yml: `npx vitest run --project integration`). Before this
# step, a red integration test passed the local gate and failed only in CI — the
# v1.49.931 regression (a malformed BranchManifest fixture turned main red). This
# mirrors CI exactly so the gate and CI agree on "green" (#10461
# gate-enforce-every-runnable-surface). Bypass:
# SC_PRE_TAG_GATE_BYPASS=integration.
if gate_bypassed "integration" "SC_SKIP_INTEGRATION"; then
  log "[pre-tag-gate] step 2.8/22: SKIPPED (integration)"
else
  log "[pre-tag-gate] step 2.8/22: integration (npx vitest run --project integration — v1.49.932)"
  if ! npx vitest run --project integration --silent; then
    echo "[pre-tag-gate] FAIL: integration project failed" >&2
    echo "[pre-tag-gate]   Reproduce: npx vitest run --project integration" >&2
    echo "[pre-tag-gate]   These are *.integration.test.ts files, NOT run by step 2's plain vitest run." >&2
    exit 28
  fi
  log "[pre-tag-gate] step 2.8/22: PASS"
fi

log "[pre-tag-gate] step 3/22: release-notes completeness gate"
if ! node tools/release-history/check-completeness.mjs --current --strict; then
  echo "[pre-tag-gate] FAIL: completeness gate failed" >&2
  echo "[pre-tag-gate] Author the missing release-notes files BEFORE tagging." >&2
  echo "[pre-tag-gate] See: docs/release-notes/v1.49.581/ + v1.49.582/ as gold reference." >&2
  exit 3
fi
log "[pre-tag-gate] step 3/22: PASS"

# ----- step 4/22: CI-on-dev gate (v1.49.587 HARD RULE) -----
# v1.49.636 C6: SC_SKIP_CI_GATE_TESTS=<csv> is the enumerated form for
# allowing specific test failures (script-level parameter, unchanged).
# Blanket bypass uses SC_PRE_TAG_GATE_BYPASS=ci-gate (legacy SC_SKIP_CI_GATE=1
# honored with deprecation warning). Closes Lesson #10185.
if gate_bypassed "ci-gate" "SC_SKIP_CI_GATE"; then
  log "[pre-tag-gate] step 4/22: SKIPPED"
else
  log "[pre-tag-gate] step 4/22: CI-on-dev verification"
  DEV_SHA="$(git rev-parse origin/dev 2>/dev/null || echo "")"
  if [ -z "$DEV_SHA" ]; then
    echo "[pre-tag-gate] FAIL: cannot resolve origin/dev SHA — fetch first?" >&2
    exit 4
  fi
  if ! command -v gh >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: gh CLI not installed; cannot verify CI" >&2
    echo "[pre-tag-gate] Override (emergency only): SC_SKIP_CI_GATE=1" >&2
    exit 4
  fi
  REPO_NWO="$(git config --get remote.origin.url 2>/dev/null | sed -E 's|^.*github.com[:/]([^/]+/[^/.]+)(\.git)?$|\1|')"
  if [ -z "$REPO_NWO" ]; then
    echo "[pre-tag-gate] FAIL: cannot derive nameWithOwner from remote.origin.url" >&2
    exit 4
  fi
  # Pin the ship-blocking workflow explicitly. Without --workflow, `gh run
  # list` returns runs from ALL workflows on dev; pinning to ci.yml makes the
  # most-recent `.[0]` selection at the dev-tip SHA deterministic regardless of
  # what other workflows run on dev.
  # Before v1.49.923 a SEPARATE non-blocking ci-macos.yml lane ("CI (macOS)")
  # could be workflow_dispatch'd onto dev and win that `.[0]` selection — a false
  # FAIL when it was in_progress/red while ci.yml was green. v1.49.923 folded
  # macOS into ci.yml as a NON-BLOCKING matrix leg (continue-on-error), so its
  # result no longer affects the run-level conclusion this gate reads; the pin
  # stays as a guard against any future push-triggered workflow on dev.
  # Override the workflow file via SC_CI_GATE_WORKFLOW.
  CI_GATE_WORKFLOW="${SC_CI_GATE_WORKFLOW:-ci.yml}"
  RUN_JSON="$(gh run list --repo "$REPO_NWO" --branch dev --workflow "$CI_GATE_WORKFLOW" --limit 10 \
    --json status,conclusion,headSha,databaseId,url,workflowName 2>&1)" || {
    echo "[pre-tag-gate] FAIL: gh run list returned error: $RUN_JSON" >&2
    exit 4
  }
  MATCHING="$(echo "$RUN_JSON" | jq --arg sha "$DEV_SHA" '[.[] | select(.headSha == $sha)] | .[0]')"
  if [ "$MATCHING" = "null" ] || [ -z "$MATCHING" ]; then
    echo "[pre-tag-gate] FAIL: no '$CI_GATE_WORKFLOW' CI run found for origin/dev tip $DEV_SHA" >&2
    echo "[pre-tag-gate]   Possible causes:" >&2
    echo "[pre-tag-gate]     a) you have unpushed commits on dev → \`git push origin dev\`" >&2
    echo "[pre-tag-gate]     b) CI is queued but not yet started → wait + retry" >&2
    echo "[pre-tag-gate]     c) '$CI_GATE_WORKFLOW' does not run on this branch, or was renamed" >&2
    echo "[pre-tag-gate]        (override the workflow file via SC_CI_GATE_WORKFLOW=<file>)" >&2
    echo "[pre-tag-gate]   Override (emergency): SC_SKIP_CI_GATE=1" >&2
    exit 4
  fi
  STATUS="$(echo "$MATCHING" | jq -r '.status')"
  CONCLUSION="$(echo "$MATCHING" | jq -r '.conclusion // ""')"
  RUN_URL="$(echo "$MATCHING" | jq -r '.url')"
  if [ "$STATUS" != "completed" ]; then
    echo "[pre-tag-gate] FAIL: CI run on origin/dev is still $STATUS" >&2
    echo "[pre-tag-gate]   SHA: $DEV_SHA" >&2
    echo "[pre-tag-gate]   URL: $RUN_URL" >&2
    echo "[pre-tag-gate]   Wait for CI to complete then re-run pre-tag-gate." >&2
    echo "[pre-tag-gate]   Override (emergency): SC_SKIP_CI_GATE=1" >&2
    exit 4
  fi
  if [ "$CONCLUSION" != "success" ]; then
    # v1.49.636 C6 (Lesson #10185): allow enumerated override via
    # SC_SKIP_CI_GATE_TESTS=<csv>. The ci-gate-enum.mjs script
    # checks every failing test is covered; exits 0 only if so.
    if [ -n "${SC_SKIP_CI_GATE_TESTS:-}" ]; then
      log "[pre-tag-gate]   SC_SKIP_CI_GATE_TESTS present — checking enumeration..."
      if node scripts/ci-gate-enum.mjs; then
        log "[pre-tag-gate] step 4/22: PASS (CI red(s) authorized via SC_SKIP_CI_GATE_TESTS at $DEV_SHA)"
        echo "[pre-tag-gate]   Rationale required at .planning/ship-pipeline-discipline/ci-gate-override-rationale.md" >&2
      else
        echo "[pre-tag-gate] FAIL: CI red(s) on dev not covered by SC_SKIP_CI_GATE_TESTS" >&2
        echo "[pre-tag-gate]   SHA: $DEV_SHA" >&2
        echo "[pre-tag-gate]   URL: $RUN_URL" >&2
        echo "[pre-tag-gate]   Either fix the test, or extend SC_SKIP_CI_GATE_TESTS=<csv> to cover it." >&2
        exit 4
      fi
    else
      echo "[pre-tag-gate] FAIL: CI run on origin/dev concluded $CONCLUSION" >&2
      echo "[pre-tag-gate]   SHA: $DEV_SHA" >&2
      echo "[pre-tag-gate]   URL: $RUN_URL" >&2
      echo "[pre-tag-gate]   Fix the failing tests on dev BEFORE pushing to main." >&2
      echo "[pre-tag-gate]   Enumerated override (v1.49.636 C6): SC_SKIP_CI_GATE_TESTS=<csv>" >&2
      echo "[pre-tag-gate]   Blanket override (DEPRECATED, emergency only): SC_SKIP_CI_GATE=1" >&2
      exit 4
    fi
  else
    log "[pre-tag-gate] step 4/22: PASS (CI green at $DEV_SHA)"
  fi
fi

# ----- step 5/22: SPICE renderer bundle freshness (v1.49.587 unwired-build closure) -----
log "[pre-tag-gate] step 5/22: www-bundles freshness (SPICE renderer)"
if ! bash "$REPO_ROOT/tools/build-www-bundles.sh" >/dev/null 2>&1; then
  echo "[pre-tag-gate] FAIL: www-bundles build failed" >&2
  echo "[pre-tag-gate] Re-run for diagnostics: bash tools/build-www-bundles.sh" >&2
  exit 5
fi
log "[pre-tag-gate] step 5/22: PASS"

# ----- step 6/22: depth-audit (BLOCKER as of v1.49.591; closes Lesson #10188) -----
# v1.49.654 (FA-652-11 C05): added granular `depth-audit-mus-elc` bypass token
# that downgrades MUS/ELC findings only, leaving NASA depth checks intact. Use
# this when shipping during a counter-cadence cross-track scaffold-pending phase
# instead of the blanket `depth-audit` bypass.
if gate_bypassed "depth-audit" "SC_SKIP_DEPTH_AUDIT"; then
  log "[pre-tag-gate] step 6/22: SKIPPED"
else
  log "[pre-tag-gate] step 6/22: depth-audit (BLOCKER mode — hardened at v1.49.591; cross-link strict at v1.49.595+)"
  if [ -f "$REPO_ROOT/.planning/STATE.md" ]; then
    # Granular MUS/ELC bypass: token `depth-audit-mus-elc` → SC_SKIP_DEPTH_AUDIT_MUS_ELC=1
    # downgrades MUS/ELC FAIL → WARN inside depth-audit.mjs but keeps NASA strict.
    if gate_bypassed "depth-audit-mus-elc" "SC_SKIP_DEPTH_AUDIT_MUS_ELC"; then
      export SC_SKIP_DEPTH_AUDIT_MUS_ELC=1
      log "[pre-tag-gate] step 6/22:   MUS/ELC findings downgraded (SC_SKIP_DEPTH_AUDIT_MUS_ELC=1)"
    fi
    DEPTH_OUT="$(node "$REPO_ROOT/tools/depth-audit.mjs" --current --cross-link-strict 2>&1)" || true
    if echo "$DEPTH_OUT" | grep -qE '(FAIL|MISSING)'; then
      echo "[pre-tag-gate] FAIL: depth-audit reported FAIL/MISSING findings:" >&2
      echo "$DEPTH_OUT" | grep -E '\[(X |!!|OK)\]' >&2 || echo "$DEPTH_OUT" >&2
      echo "[pre-tag-gate]   Author the missing/under-depth files BEFORE tagging." >&2
      echo "[pre-tag-gate]   See template-files/W2-build-agent-prompt.md for the dispatch pattern." >&2
      echo "[pre-tag-gate]   Override (emergency only — almost never the right call): SC_SKIP_DEPTH_AUDIT=1" >&2
      echo "[pre-tag-gate]   Granular (MUS/ELC scaffold-pending only): SC_PRE_TAG_GATE_BYPASS=depth-audit-mus-elc" >&2
      exit 6
    fi
    log "[pre-tag-gate] step 6/22: PASS (depth-audit clean)"
  else
    log "[pre-tag-gate] step 6/22: SKIPPED (.planning/STATE.md absent — cannot derive version)"
  fi
fi

# ----- step 7/22: CLAUDE.md auto-render drift check -----
if gate_bypassed "claude-md" "SC_SKIP_CLAUDE_MD_GATE"; then
  log "[pre-tag-gate] step 7/22: SKIPPED"
else
  log "[pre-tag-gate] step 7/22: CLAUDE.md auto-render drift check"
  if ! node "$REPO_ROOT/tools/render-claude-md.mjs" --check >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: CLAUDE.md is out of sync with source-of-truth manifests" >&2
    echo "[pre-tag-gate]   Fix: npm run render:claude-md   # then commit the diff" >&2
    echo "[pre-tag-gate]   Manifests live at tools/render-claude-md/" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_SKIP_CLAUDE_MD_GATE=1" >&2
    exit 7
  fi
  log "[pre-tag-gate] step 7/22: PASS"
fi

# ----- step 7.6/22: proactive card-template title-length gate (v1.49.676 cc1) -----
# Closes deferred Gate 2 from v1.49.671. Catches MUS/ELC degree-title
# length violations (>150 chars per HARD_LIMITS.degreeTitleChars) BEFORE
# the catalog-index drift BLOCKER at step 8 fires with a cryptic error.
# Surfaced as reactive BLOCKER at v672 + v674 ship cycles.
# Override: SC_SKIP_CARD_TEMPLATE_LENGTH=1 (emergency only).
if gate_bypassed "card-template-length" "SC_SKIP_CARD_TEMPLATE_LENGTH"; then
  log "[pre-tag-gate] step 7.6/22: SKIPPED"
else
  log "[pre-tag-gate] step 7.6/22: card-template title-length gate (v1.49.676 cc1)"
  if ! node "$REPO_ROOT/tools/check-card-template-length.mjs" --quiet; then
    echo "[pre-tag-gate] FAIL: card-template title-length violations detected (>150 chars)" >&2
    echo "[pre-tag-gate]   Diagnose: node tools/check-card-template-length.mjs" >&2
    echo "[pre-tag-gate]   Fix: shorten degree-title in per-degree page <h1> + <title> +" >&2
    echo "[pre-tag-gate]   catalog-card div to <= 150 chars; re-run update-catalog-indexes.mjs --write" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_SKIP_CARD_TEMPLATE_LENGTH=1" >&2
    exit 76
  fi
  log "[pre-tag-gate] step 7.6/22: PASS"
fi

# ----- step 8/22: catalog-index drift check (BLOCKER — added v1.49.601) -----
if gate_bypassed "catalog-index" "SC_SKIP_CATALOG_INDEX_GATE"; then
  log "[pre-tag-gate] step 8/22: SKIPPED"
else
  log "[pre-tag-gate] step 8/22: catalog-index drift check (BLOCKER mode — added v1.49.601)"
  if ! node "$REPO_ROOT/tools/update-catalog-indexes.mjs" --check >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: catalog-index drift detected — NASA/MUS/ELC catalog index" >&2
    echo "[pre-tag-gate]   out of sync with on-disk degree dirs" >&2
    echo "[pre-tag-gate]   Diagnose:  node tools/update-catalog-indexes.mjs --check" >&2
    echo "[pre-tag-gate]   NASA fix:  node tools/update-catalog-indexes.mjs --write" >&2
    echo "[pre-tag-gate]   MUS/ELC:   author missing degree-card divs manually" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_SKIP_CATALOG_INDEX_GATE=1" >&2
    exit 8
  fi
  log "[pre-tag-gate] step 8/22: PASS"
fi

# ----- step 9/22: tauri-boundary audit (added v1.49.634 §15) -----
if gate_bypassed "tauri-boundary" "SC_SKIP_TAURI_BOUNDARY_GATE"; then
  log "[pre-tag-gate] step 9/22: SKIPPED"
else
  log "[pre-tag-gate] step 9/22: tauri-boundary audit"
  if ! node "$REPO_ROOT/tools/tauri-boundary-audit.mjs" --check >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: tauri-boundary violations detected" >&2
    echo "[pre-tag-gate]   Inspect: node tools/tauri-boundary-audit.mjs" >&2
    echo "[pre-tag-gate]   Allowlist (existing-only): tools/tauri-boundary-audit.allowlist.json" >&2
    echo "[pre-tag-gate]   Findings: .planning/tauri-boundary-findings.md" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_SKIP_TAURI_BOUNDARY_GATE=1" >&2
    exit 9
  fi
  log "[pre-tag-gate] step 9/22: PASS"
fi

# ----- step 9.5: apply-to-self enforcement (v1.49.636 C7, Meta-Lesson) -----
# WARN-only by default — emits findings without failing the gate. Closes
# the Meta-Lesson "discipline docs only prove their value when their
# authors follow them in the same commit window" by mechanically
# checking newly-authored test files against discipline-doc patterns.
if gate_bypassed "apply-to-self" "SC_SKIP_APPLY_TO_SELF"; then
  log "[pre-tag-gate] step 9.5/22: SKIPPED"
else
  log "[pre-tag-gate] step 9.5/22: apply-to-self enforcement"
  # Propagate require flag into the script's env so the script's existing
  # SC_REQUIRE_APPLY_TO_SELF read continues to drive WARN→BLOCK escalation.
  if gate_required "apply-to-self" "SC_REQUIRE_APPLY_TO_SELF"; then
    export SC_REQUIRE_APPLY_TO_SELF=1
  fi
  if ! node "$REPO_ROOT/scripts/apply-to-self.mjs"; then
    # Default exit is 0 (WARN-only). Only non-zero when the require flag
    # is set + findings present.
    echo "[pre-tag-gate] FAIL: apply-to-self findings present AND require flag set" >&2
    echo "[pre-tag-gate]   Fix the findings OR allowlist them at" >&2
    echo "[pre-tag-gate]   .planning/ship-pipeline-discipline/apply-to-self-allowlist.md" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_PRE_TAG_GATE_BYPASS=apply-to-self" >&2
    exit 10
  fi
  log "[pre-tag-gate] step 9.5/22: PASS"
fi

# ----- step 10/22: scaffolder-residue audit (v1.49.653, CONCERNS §18.2) -----
# Closes the "shipping risk" by detecting scaffolder-emit TODO phrases that
# escape into source-of-truth skills/agents. The tool ships with explicit
# literal phrases from capability-scaffolder.ts + skill-generator.ts so it
# is narrow enough to not false-positive on legitimate agent prompts that
# reference TODO as a concept they detect (doc-linter, gsd-code-reviewer).
if gate_bypassed "scaffolder-residue" "SC_SKIP_SCAFFOLDER_RESIDUE_GATE"; then
  log "[pre-tag-gate] step 10/22: SKIPPED"
else
  log "[pre-tag-gate] step 10/22: scaffolder-residue audit"
  if ! node "$REPO_ROOT/tools/check-scaffolder-residue.mjs" --strict >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: scaffolder-residue TODO markers detected in project-claude/skills or agents" >&2
    echo "[pre-tag-gate]   Inspect: node tools/check-scaffolder-residue.mjs" >&2
    echo "[pre-tag-gate]   Fix:     replace TODO bodies with real content before tagging" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_PRE_TAG_GATE_BYPASS=scaffolder-residue" >&2
    exit 12
  fi
  log "[pre-tag-gate] step 10/22: PASS"
fi

# ----- step 11/22: citation-debt ledger sync (v1.49.653, CONCERNS §9.3) -----
# Scans recent retrospectives for V-flag emit/close patterns. Exit 1 = activity
# detected, ledger may need review. WARN-only by default so the gate does not
# block ships on an informational signal; SC_REQUIRE_CITATION_DEBT_SYNC=1 hard.
if gate_bypassed "citation-debt-sync" "SC_SKIP_CITATION_DEBT_GATE"; then
  log "[pre-tag-gate] step 11/22: SKIPPED"
else
  log "[pre-tag-gate] step 11/22: citation-debt ledger sync scan"
  CITATION_SCAN_OUTPUT="$(node "$REPO_ROOT/tools/citation-debt/scan-retrospectives.mjs" --since "v$(node -p "require('$REPO_ROOT/package.json').version")" 2>&1)" || true
  CITATION_SCAN_EXIT=$?
  if [ "$CITATION_SCAN_EXIT" -ne 0 ]; then
    echo "[pre-tag-gate] INFO: citation-debt scan detected V-flag activity since current tag" >&2
    echo "$CITATION_SCAN_OUTPUT" | head -20 >&2
    if gate_required "citation-debt-sync" "SC_REQUIRE_CITATION_DEBT_SYNC"; then
      echo "[pre-tag-gate] FAIL: citation-debt-sync escalated — review and update .planning/citation-debt.json" >&2
      exit 13
    fi
    log "[pre-tag-gate] step 11/22: WARN (informational; set SC_PRE_TAG_GATE_REQUIRE=citation-debt-sync to block)"
  else
    log "[pre-tag-gate] step 11/22: PASS (no V-flag activity)"
  fi
fi

# ----- step 12/22: STORY.md drift detection (v1.49.653; story-drift hardened v1.49.676 cc2) -----
# Detects drift between docs/release-notes/STORY.md preamble and reality
# (chapter directory count + package.json version). The 8-degree sprint
# 2026-05-12/13 missed T14 step 2.5 (scripts/append-story-entry.mjs)
# eight times; this gate makes that drift visible at audit time.
#
# v1.49.676 cc2: story-drift hardened — message strengthened from
# informational "INFO" to actionable "WARN (action-required)" with the
# remediation single-command shown inline. Default behavior remains
# WARN-not-BLOCKER (T14 step 2.5 may run AFTER pre-tag-gate completes,
# at which point drift will resolve). SC_REQUIRE_STORY_SYNC=1 still blocks.
if gate_bypassed "story-drift" "SC_SKIP_STORY_DRIFT_GATE"; then
  log "[pre-tag-gate] step 12/22: SKIPPED"
else
  log "[pre-tag-gate] step 12/22: STORY.md drift detection"
  STORY_DRIFT_OUTPUT="$(node "$REPO_ROOT/tools/check-story-drift.mjs" 2>&1)" || true
  STORY_DRIFT_EXIT=$?
  if [ "$STORY_DRIFT_EXIT" -ne 0 ] || echo "$STORY_DRIFT_OUTPUT" | grep -q "Detected.*drift"; then
    echo "[pre-tag-gate] WARN: STORY.md drift detected (story-drift hardened v1.49.676 cc2)" >&2
    echo "$STORY_DRIFT_OUTPUT" | head -25 >&2
    echo "[pre-tag-gate]   Action: run \`scripts/append-story-entry.mjs\` (T14 step 2.5) before pushing to main" >&2
    if gate_required "story-drift" "SC_REQUIRE_STORY_SYNC"; then
      echo "[pre-tag-gate] FAIL: story-drift escalated — run T14 step 2.5 (scripts/append-story-entry.mjs) before tagging" >&2
      exit 14
    fi
    log "[pre-tag-gate] step 12/22: WARN (action-required; set SC_PRE_TAG_GATE_REQUIRE=story-drift to block)"
  else
    log "[pre-tag-gate] step 12/22: PASS (STORY.md in sync)"
  fi
fi

# ----- step 13/22: discipline coverage audit (v1.49.653, L-04, CONCERNS §23.4) -----
# Surfaces lesson IDs that appear in 2+ retrospectives but are not captured in
# tools/render-claude-md/disciplines.json or any cited discipline doc.
#
# v1.49.821 (T2.2 part 1): added ceiling-based enforcement infrastructure.
# v1.49.822 (T2.2 part 2): FLIPPED default to BLOCK at ceiling. SC_DISCIPLINE_COVERAGE_CEILING
# defaulted to 41 (was 50), current count (39) + 2 buffer.
# v1.49.912 (UNCODIFIED+PARTIAL both 0 after v910/v911 drain): RATCHETED the
# UNCODIFIED default 41 → 5 (restores near-term sensitivity now that the
# backlog is drained), and ADDED a companion SC_DISCIPLINE_PARTIAL_CEILING
# (default 5) so PARTIAL drift BLOCKs at its ceiling the way UNCODIFIED does —
# the v910 retro flagged that PARTIAL was parsed but never gated. When NASA
# degree-advance resumes (accumulates lessons fast), raise the relevant
# ceiling env-var for forward-progress mode.
#
# SC_PRE_TAG_GATE_REQUIRE=discipline-coverage is the legacy escape valve and
# still works: when set, even WITHIN-ceiling states FAIL on any UNCODIFIED.
# (PARTIAL is intentionally NOT escalated by legacy strict mode — it is gated
# ONLY by its own ceiling SC_DISCIPLINE_PARTIAL_CEILING, never by REQUIRE.)
# Operators wanting to disable the ceiling-BLOCK behavior can:
#   1. Raise SC_DISCIPLINE_COVERAGE_CEILING / SC_DISCIPLINE_PARTIAL_CEILING (forward-progress mode).
#   2. Set SC_PRE_TAG_GATE_BYPASS=discipline-coverage to skip the step entirely.
DISCIPLINE_COVERAGE_CEILING="${SC_DISCIPLINE_COVERAGE_CEILING:-5}"
DISCIPLINE_PARTIAL_CEILING="${SC_DISCIPLINE_PARTIAL_CEILING:-5}"
if gate_bypassed "discipline-coverage"; then
  log "[pre-tag-gate] step 13/22: SKIPPED"
else
  log "[pre-tag-gate] step 13/22: discipline coverage audit (uncodified-ceiling=$DISCIPLINE_COVERAGE_CEILING partial-ceiling=$DISCIPLINE_PARTIAL_CEILING)"
  COVERAGE_OUTPUT="$(node "$REPO_ROOT/tools/check-discipline-coverage.mjs" 2>&1)" || true
  UNCODIFIED_COUNT="$(echo "$COVERAGE_OUTPUT" | grep -oE "UNCODIFIED.*: [0-9]+" | head -1 | grep -oE "[0-9]+$" || echo "0")"
  PARTIAL_COUNT="$(echo "$COVERAGE_OUTPUT" | grep -oE "PARTIAL.*: [0-9]+" | head -1 | grep -oE "[0-9]+$" || echo "0")"
  if [ "${UNCODIFIED_COUNT:-0}" -gt 0 ] || [ "${PARTIAL_COUNT:-0}" -gt 0 ]; then
    echo "[pre-tag-gate] INFO: $UNCODIFIED_COUNT uncodified lesson(s) (ceiling=$DISCIPLINE_COVERAGE_CEILING) + $PARTIAL_COUNT partial match(es) (ceiling=$DISCIPLINE_PARTIAL_CEILING)" >&2
    echo "[pre-tag-gate]   Run: node tools/check-discipline-coverage.mjs for the full report" >&2
    DISCIPLINE_COVERAGE_BLOCK=0
    if [ "${UNCODIFIED_COUNT:-0}" -gt "${DISCIPLINE_COVERAGE_CEILING:-0}" ]; then
      echo "[pre-tag-gate]   CEILING EXCEEDED: UNCODIFIED $UNCODIFIED_COUNT > ceiling $DISCIPLINE_COVERAGE_CEILING" >&2
      DISCIPLINE_COVERAGE_BLOCK=1
    fi
    if [ "${PARTIAL_COUNT:-0}" -gt "${DISCIPLINE_PARTIAL_CEILING:-0}" ]; then
      echo "[pre-tag-gate]   CEILING EXCEEDED: PARTIAL $PARTIAL_COUNT > ceiling $DISCIPLINE_PARTIAL_CEILING" >&2
      DISCIPLINE_COVERAGE_BLOCK=1
    fi
    if [ "$DISCIPLINE_COVERAGE_BLOCK" -eq 1 ]; then
      echo "[pre-tag-gate] FAIL: discipline-coverage ceiling exceeded (v822 UNCODIFIED-block + v912 PARTIAL-block) — codify lessons OR raise SC_DISCIPLINE_COVERAGE_CEILING / SC_DISCIPLINE_PARTIAL_CEILING" >&2
      exit 15
    fi
    if [ "${UNCODIFIED_COUNT:-0}" -gt 0 ] && gate_required "discipline-coverage"; then
      echo "[pre-tag-gate] FAIL: discipline-coverage escalated (legacy strict mode) — codify uncodified lessons into discipline docs / manifest" >&2
      exit 15
    fi
    log "[pre-tag-gate] step 13/22: WARN (within ceilings: UNCODIFIED $UNCODIFIED_COUNT ≤ $DISCIPLINE_COVERAGE_CEILING, PARTIAL $PARTIAL_COUNT ≤ $DISCIPLINE_PARTIAL_CEILING; ceiling-exceed BLOCKs since v822/v912)"
  else
    log "[pre-tag-gate] step 13/22: PASS (no uncodified or partial lessons)"
  fi
fi

# ----- step 14/22: SPS cohort-uniqueness audit (v1.49.666, Lesson #10364 codification) -----
# Walks www/tibsfox/com/Research/SPS/<slug>/index.html and reports duplicate-
# number collisions on disk + (when --prospective is passed at the CLI level
# for catalog-card workflows) duplicate-number / duplicate-slug for a
# hypothetical new entry. Closes the recurrence path for the v1.49.661
# marbled-murrelet near-miss: v661 release-notes claimed FIRST-INSTANCE at
# SPS #115 for a slug already living at SPS #82 from the v608 era. The cc-2
# session caught it pre-dispatch; this gate makes the next near-miss
# detectable at pre-tag time.
# WARN-only by default (soak per v1.49.594 cross-link-strict pattern); promote
# to BLOCKER via SC_PRE_TAG_GATE_REQUIRE=sps-cohort-uniqueness at the next
# NASA degree-advance window.
if gate_bypassed "sps-cohort-uniqueness" "SC_SKIP_SPS_COHORT_UNIQUENESS_GATE"; then
  log "[pre-tag-gate] step 14/22: SKIPPED"
else
  log "[pre-tag-gate] step 14/22: SPS cohort-uniqueness audit"
  SPS_UNIQ_OUTPUT="$(node "$REPO_ROOT/tools/check-sps-cohort-uniqueness.mjs" 2>&1)" || true
  if echo "$SPS_UNIQ_OUTPUT" | grep -qE "COLLISION-DETECTED|PROSPECTIVE.*COLLISION"; then
    echo "[pre-tag-gate] INFO: SPS cohort-uniqueness findings:" >&2
    echo "$SPS_UNIQ_OUTPUT" | head -20 >&2
    if gate_required "sps-cohort-uniqueness" "SC_REQUIRE_SPS_COHORT_UNIQUENESS"; then
      echo "[pre-tag-gate] FAIL: sps-cohort-uniqueness escalated — resolve duplicate SPS numbers before tagging" >&2
      exit 16
    fi
    log "[pre-tag-gate] step 14/22: WARN (informational; set SC_PRE_TAG_GATE_REQUIRE=sps-cohort-uniqueness to block)"
  else
    log "[pre-tag-gate] step 14/22: PASS (no SPS-number collisions)"
  fi
fi

# ----- step 15/22: NASA canonical layout gate (v1.49.716 BLOCKER) -----
# Verifies every www/.../NASA/<ver>/index.html matches the v1.0 canonical
# 12-card layout. Closes the v1.49.716 restoration campaign: 135/169
# missions had drifted from canonical due to (1) v1.58/1.60 spec rewrite
# introducing substrate-form discipline cards and (2) v1.118+ build
# pipeline ceasing to ship canonical siblings. Hybrid restore (v1.0 12
# cards + substrate-form additions) is the new normative.
# Override: SC_PRE_TAG_GATE_BYPASS=nasa-canonical-layout (emergency only —
# fix the drift; the restorer at tools/nasa-layout-restorer.mjs is
# card-additive and safe to re-run).
if gate_bypassed "nasa-canonical-layout" "SC_SKIP_NASA_CANONICAL_LAYOUT_GATE"; then
  log "[pre-tag-gate] step 15/22: SKIPPED"
else
  log "[pre-tag-gate] step 15/22: NASA canonical layout gate"
  if ! bash "$REPO_ROOT/tools/nasa-canonical-layout-gate.sh" >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: NASA canonical layout drift detected" >&2
    echo "[pre-tag-gate]   Diagnose:  bash tools/nasa-canonical-layout-gate.sh" >&2
    echo "[pre-tag-gate]   JSON:      bash tools/nasa-canonical-layout-gate.sh --json" >&2
    echo "[pre-tag-gate]   Restore:   node tools/nasa-layout-restorer.mjs <ver>" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_PRE_TAG_GATE_BYPASS=nasa-canonical-layout" >&2
    exit 17
  fi
  log "[pre-tag-gate] step 15/22: PASS"
fi

# ----- step 16/22: NASA canonical sidebar gate (2026-05-24 BLOCKER) -----
# Verifies every www/.../NASA/<ver>/index.html contains the canonical sidebar
# trio: organism-card + Bird:/Animal:/Plant:/Habitat: companion h3 + S36
# Pairing or Dedication. Locks in the 169/169 PASS milestone closed by the
# 2026-05-24 canonical-sidebar rollout (handoff:
# .planning/HANDOFF-CANONICAL-SIDEBAR-V1.38-V1.49-2026-05-24.md). Companion
# to step 15 (12-card main-column layout). Override:
# SC_PRE_TAG_GATE_BYPASS=nasa-canonical-sidebar (emergency only — re-run
# .planning/sps-s36-mapping/inject-canonical-sidebar.py to restore drift).
if gate_bypassed "nasa-canonical-sidebar" "SC_SKIP_NASA_CANONICAL_SIDEBAR_GATE"; then
  log "[pre-tag-gate] step 16/22: SKIPPED"
else
  log "[pre-tag-gate] step 16/22: NASA canonical sidebar gate"
  if ! bash "$REPO_ROOT/tools/nasa-canonical-sidebar-gate.sh" >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: NASA canonical sidebar drift detected" >&2
    echo "[pre-tag-gate]   Diagnose:  bash tools/nasa-canonical-sidebar-gate.sh" >&2
    echo "[pre-tag-gate]   JSON:      bash tools/nasa-canonical-sidebar-gate.sh --json" >&2
    echo "[pre-tag-gate]   Restore:   python3 .planning/sps-s36-mapping/inject-canonical-sidebar.py" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_PRE_TAG_GATE_BYPASS=nasa-canonical-sidebar" >&2
    exit 18
  fi
  log "[pre-tag-gate] step 16/22: PASS"
fi

# ----- step 17/22: PROJECT.md drift check (v1.49.785, WARN-only) -----
# Surfaces drift between .planning/PROJECT.md and ground truth: stale
# "Latest shipped release" version vs package.json, malformed GAP table
# rows, unrecognized statuses, "Last updated" >30d old. WARN-only by
# default — PROJECT.md is gitignored hand-authored prose; auto-fix is
# out of scope. Promote to BLOCKER via SC_PRE_TAG_GATE_REQUIRE=project-md.
#
# v1.49.807 S5 tightening: bounded patch-drift gate. The latest-shipped
# version drift is the recurring class; if PROJECT.md's "Latest shipped
# release" trails package.json by more than SC_PROJECT_MD_MAX_PATCH_DRIFT
# (default 3) patch versions, escalate that finding to FAIL regardless of
# the global SC_PRE_TAG_GATE_REQUIRE flag. Other drift findings remain
# WARN-only — they still demand operator attention but don't block ship.
#
# Closes audit strengthening lever S5 (audit
# .planning/AUDIT-2026-05-26-core-functions-retrospective.md).
if gate_bypassed "project-md"; then
  log "[pre-tag-gate] step 17/22: SKIPPED"
else
  log "[pre-tag-gate] step 17/22: PROJECT.md drift check"
  PROJECT_MD_OUTPUT="$(node "$REPO_ROOT/tools/project-md-normalizer.mjs" --check 2>&1)" || true
  PROJECT_MD_EXIT=$?
  if [ "$PROJECT_MD_EXIT" -ne 0 ] || echo "$PROJECT_MD_OUTPUT" | grep -q "drift detected"; then
    echo "[pre-tag-gate] WARN: PROJECT.md drift detected" >&2
    echo "$PROJECT_MD_OUTPUT" | head -25 >&2
    echo "[pre-tag-gate]   Diagnose: node tools/project-md-normalizer.mjs --check" >&2
    echo "[pre-tag-gate]   Fix: hand-edit .planning/PROJECT.md (gitignored)" >&2

    # v1.49.807 S5: bounded patch-drift gate on the latest-shipped-version line.
    # Parse a finding of the form:
    #   [WARN] latest-shipped-version-drift: "Latest shipped release" lists v1.49.801 but package.json is v1.49.806 ...
    # If the patch-version gap exceeds the threshold, escalate to FAIL.
    MAX_PATCH_DRIFT="${SC_PROJECT_MD_MAX_PATCH_DRIFT:-3}"
    # NOTE: `|| true` is load-bearing. Under `set -euo pipefail`, a non-drift
    # PROJECT.md WARN means grep finds no match → exits 1 → pipefail propagates
    # through the substitution → set -e aborts the whole gate. The empty-result
    # case is handled below by `[ -n "$PATCH_DRIFT_LINE" ]`; let it reach there.
    PATCH_DRIFT_LINE="$(echo "$PROJECT_MD_OUTPUT" | grep -E 'latest-shipped-version-drift.*lists v[0-9]+\.[0-9]+\.[0-9]+ but package\.json is v[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)"
    if [ -n "$PATCH_DRIFT_LINE" ]; then
      DOC_PATCH="$(echo "$PATCH_DRIFT_LINE" | sed -nE 's/.*lists v[0-9]+\.[0-9]+\.([0-9]+).*/\1/p')"
      PKG_PATCH="$(echo "$PATCH_DRIFT_LINE" | sed -nE 's/.*package\.json is v[0-9]+\.[0-9]+\.([0-9]+).*/\1/p')"
      if [ -n "$DOC_PATCH" ] && [ -n "$PKG_PATCH" ]; then
        DRIFT=$((PKG_PATCH - DOC_PATCH))
        if [ "$DRIFT" -gt "$MAX_PATCH_DRIFT" ]; then
          echo "[pre-tag-gate] FAIL: latest-shipped patch-drift is $DRIFT (max $MAX_PATCH_DRIFT)" >&2
          echo "[pre-tag-gate]   Hand-edit .planning/PROJECT.md's \"Latest shipped release\" line" >&2
          echo "[pre-tag-gate]   to within $MAX_PATCH_DRIFT patches of package.json before tagging." >&2
          echo "[pre-tag-gate]   Bypass: SC_PROJECT_MD_MAX_PATCH_DRIFT=<N> (raise the ceiling)." >&2
          exit 19
        fi
      fi
    fi

    if gate_required "project-md"; then
      echo "[pre-tag-gate] FAIL: project-md escalated — update .planning/PROJECT.md before tagging" >&2
      exit 19
    fi
    log "[pre-tag-gate] step 17/22: WARN (informational; set SC_PRE_TAG_GATE_REQUIRE=project-md to block)"
  else
    log "[pre-tag-gate] step 17/22: PASS (PROJECT.md in sync)"
  fi
fi

# ----- step 18/22: KNOWN_UNWIRED stale-entry cross-audit (v1.49.869) -----
# Runs tools/security/check-stale-known-unwired.mjs against the
# ProcessContext + EgressContext audit-test files. Detects two stale-
# entry shapes (Shape A — wired-but-still-in-allowlist; Shape B —
# import-without-use). Promotes the v1.49.858-867 operator-invoked
# continuous-verification discipline (codified at v868 as refinement of
# Lesson #10443) to a deterministic gate. The v857 tool's first
# real-world bug surfaced at v867 (vacuous-true parser); the same gate
# would have caught any wire-shape comment colliding with the regex
# extractor in continuous operation.
#
# BLOCKER by default — set SC_PRE_TAG_GATE_BYPASS=stale-known-unwired
# to override (emergency only — fix the stale entry instead).
if gate_bypassed "stale-known-unwired"; then
  log "[pre-tag-gate] step 18/22: SKIPPED"
else
  log "[pre-tag-gate] step 18/22: KNOWN_UNWIRED stale-entry cross-audit"
  # `&& X=0 || X=$?` preserves the real exit code under `set -euo pipefail`
  # (a bare `OUTPUT="$(...)"` would abort the script on a non-zero exit BEFORE
  # the FAIL block; a plain `|| true` would mask the code to 0 and never fire).
  STALE_OUTPUT="$(node "$REPO_ROOT/tools/security/check-stale-known-unwired.mjs" 2>&1)" && STALE_EXIT=0 || STALE_EXIT=$?
  if [ "$STALE_EXIT" -ne 0 ]; then
    echo "[pre-tag-gate] FAIL: KNOWN_UNWIRED stale entries detected" >&2
    echo "$STALE_OUTPUT" | head -30 >&2
    echo "[pre-tag-gate]   Diagnose: node tools/security/check-stale-known-unwired.mjs" >&2
    echo "[pre-tag-gate]   Fix: remove the stale entry from the named audit-test's KNOWN_UNWIRED set" >&2
    echo "[pre-tag-gate]   Bypass: SC_PRE_TAG_GATE_BYPASS=stale-known-unwired (emergency only)" >&2
    exit 20
  fi
  log "[pre-tag-gate] step 18/22: PASS (no stale KNOWN_UNWIRED entries)"
fi

# ----- step 19/22: .planning/ backup-file accumulation check (v1.49.961 cc#28) -----
# Two-layer closure (#10431/#10436) for the .planning/ backup-file drift class:
# tools/state-md-normalizer.mjs and tools/citation-debt/apply-diff.mjs each leave
# timestamped backups in the (gitignored) .planning/ working tree. The source
# eliminator (tools/state-md-clean-backups.mjs --write, self-run at the T14 reset
# by state-md-set-shipped.mjs) removes them; this detector (--check, narrow
# tool-written-prefix scope) BLOCKS a ship if any slip through (e.g. a
# citation-debt .bak.* or a post-gate STATE backup). BLOCKER by default — the fix
# is one command.
# Bypass: SC_PRE_TAG_GATE_BYPASS=state-backups (emergency only — run --write instead).
if gate_bypassed "state-backups"; then
  log "[pre-tag-gate] step 19/22: SKIPPED (state-backups)"
else
  log "[pre-tag-gate] step 19/22: .planning/ backup-file accumulation check"
  # `&& X=0 || X=$?` preserves the real exit code under `set -euo pipefail` (a
  # bare `OUTPUT="$(...)"` aborts the script on the cleaner's exit-1 BEFORE this
  # FAIL block + exit 24; a plain `|| true` would mask the code to 0 and the
  # detector would never fire — see the matching note on step 18).
  BK_OUTPUT="$(node "$REPO_ROOT/tools/state-md-clean-backups.mjs" --check 2>&1)" && BK_EXIT=0 || BK_EXIT=$?
  if [ "$BK_EXIT" -ne 0 ]; then
    echo "[pre-tag-gate] FAIL: lingering .planning/ backup file(s) detected" >&2
    echo "$BK_OUTPUT" | head -20 >&2
    echo "[pre-tag-gate]   Fix: node tools/state-md-clean-backups.mjs --write" >&2
    echo "[pre-tag-gate]   Bypass: SC_PRE_TAG_GATE_BYPASS=state-backups (emergency only)" >&2
    exit 24
  fi
  log "[pre-tag-gate] step 19/22: PASS (no lingering backups)"
fi

# ----- step 20/22: adoption-baseline freshness (v1.49.965 Ship 0.1, audit T1.3) -----
# The adoption shelfware-telemetry baseline (docs/ADOPTION-BASELINE-v*.json, written
# by tools/adoption-refresh.mjs) silently FROZE at v1.49.801 for ~163 ships because
# nothing gated its freshness — the #10461 un-gated-runnable-surface class: the alarm
# the project built to answer the 2026-05-26 audit's #1 concern went quiet unnoticed.
# This step re-arms it: BLOCK (exit 23) when the tool exits 1 (STALE verdict) and the
# newest committed baseline trails the shipping version by more than
# SC_ADOPTION_BASELINE_MAX_DRIFT ships (default 30, FORWARD-PROGRESS mode — NOT
# exact-match, so a fresh baseline is not forced on every ship). Tool exit 2
# (indeterminate/malfunction) stays WARN-only — a broken tool is not a staleness
# verdict (same mislabeling guard step 21 carries for its exit-2 path).
# Fix: node tools/adoption-refresh.mjs (run AFTER bump-version, #10424).
# Bypass: SC_PRE_TAG_GATE_BYPASS=adoption-freshness.
#
# PROMOTION-MARKER: adoption-freshness default-BLOCK since v1.49.1029 (K=30; evidence: 64 consecutive baselines v965-v1028; reporter: tools/gate/warn-promotion-readiness.mjs)
if gate_bypassed "adoption-freshness"; then
  log "[pre-tag-gate] step 20/22: SKIPPED (adoption-freshness)"
else
  log "[pre-tag-gate] step 20/22: adoption-baseline freshness"
  # `&& X=0 || X=$?` preserves the real exit code under `set -euo pipefail` (a bare
  # `OUTPUT="$(...)"` aborts on the tool's exit-1 BEFORE the WARN/FAIL handling — see
  # the matching note on steps 18/19).
  AF_OUTPUT="$(node "$REPO_ROOT/tools/adoption-baseline-freshness.mjs" 2>&1)" && AF_EXIT=0 || AF_EXIT=$?
  if [ "$AF_EXIT" -eq 1 ]; then
    # exit 1 = STALE verdict — the baseline is genuinely stale. BLOCK by default.
    echo "[pre-tag-gate] FAIL: adoption baseline is stale (default-BLOCK as of v1.49.1029)" >&2
    echo "$AF_OUTPUT" | head -10 >&2
    echo "[pre-tag-gate]   Fix: node tools/adoption-refresh.mjs (AFTER bump-version)" >&2
    echo "[pre-tag-gate]   Bypass: SC_PRE_TAG_GATE_BYPASS=adoption-freshness (emergency only)" >&2
    exit 23
  elif [ "$AF_EXIT" -ne 0 ]; then
    # exit 2+ = tool malfunction (indeterminate) — NOT a staleness verdict.
    # Surface it distinctly and do NOT block (escalating would mislabel a broken
    # tool as a staleness verdict).
    echo "[pre-tag-gate] WARN: adoption-freshness tool could not run (exit $AF_EXIT; not a staleness verdict)" >&2
    echo "$AF_OUTPUT" | head -10 >&2
    log "[pre-tag-gate] step 20/22: WARN (adoption-freshness tool error — not a staleness verdict)"
  else
    log "[pre-tag-gate] step 20/22: PASS"
  fi
fi

# ----- step 21/22: trip-vocab budget (v1.49.983 Ship 5.3 — GAP-7) -----
# Deterministic content-filter trip-vocab check (tools/trip-vocab-check.mjs)
# closing GAP-7, the last open architecture gap (PROJECT.md GAP table). It scans
# the CURRENT NASA degree's generated index.html in --mode page (title-line
# PRIMARY budget 0 + body SECONDARY density ≤ 5), encoding the §3 discipline that
# was a manual grep checklist (an #10461 un-gated runnable surface). This is a
# LOCAL pre-tag advisory: www/ AND .planning/ are gitignored, so a clean-CI
# checkout has no page to scan and the step SKIPs cleanly (same as depth-audit's
# STATE.md-absent path). Page mode is a POST-HOC proxy — the real pre-dispatch
# surface is `node tools/trip-vocab-check.mjs <brief> --mode brief|prompt`, run
# by hand before a build sub-agent dispatch. Tool exit 1 (TRIP-RISK verdict)
# BLOCKs by default (exit 25); tool exit 2 (tool error/malfunction) stays WARN
# (a broken tool is not a content-filter verdict — mislabeling guard).
# Clean-CI SKIP path (no page on disk) unchanged.
# Bypass: SC_PRE_TAG_GATE_BYPASS=trip-vocab.
#
# PROMOTION-MARKER: trip-vocab default-BLOCK since v1.49.1029 (K=30; evidence: degrees 1.161-1.217 all clean under the v983 regime; reporter: tools/gate/warn-promotion-readiness.mjs)
if gate_bypassed "trip-vocab"; then
  log "[pre-tag-gate] step 21/22: SKIPPED (trip-vocab)"
else
  TV_DEGREE="$(grep -oE 'nasa_degree: *"[0-9.]+"' "$REPO_ROOT/.planning/STATE.md" 2>/dev/null | grep -oE '[0-9.]+' || true)"
  TV_PAGE="$REPO_ROOT/www/tibsfox/com/Research/NASA/${TV_DEGREE}/index.html"
  if [ -z "$TV_DEGREE" ] || [ ! -f "$TV_PAGE" ]; then
    log "[pre-tag-gate] step 21/22: SKIPPED (no local NASA page for degree '${TV_DEGREE:-?}'; www/ + .planning/ gitignored — clean-CI path)"
  else
    log "[pre-tag-gate] step 21/22: trip-vocab budget (NASA degree $TV_DEGREE, --mode page)"
    # `&& X=0 || X=$?` preserves the real exit code under `set -euo pipefail`
    # (a bare assignment aborts on the tool's exit-1 before the FAIL handling).
    TV_OUTPUT="$(node "$REPO_ROOT/tools/trip-vocab-check.mjs" "$TV_PAGE" --mode page 2>&1)" && TV_EXIT=0 || TV_EXIT=$?
    if [ "$TV_EXIT" -eq 1 ]; then
      # exit 1 = TRIP-RISK (a content verdict): budget exceeded on the page. BLOCK by default.
      echo "[pre-tag-gate] FAIL: trip-vocab budget exceeded on the current NASA page (degree $TV_DEGREE, default-BLOCK as of v1.49.1029)" >&2
      echo "$TV_OUTPUT" | head -10 >&2
      echo "[pre-tag-gate]   Pre-dispatch: node tools/trip-vocab-check.mjs <brief> --mode brief (docs/MISSION-PACKAGE-DISCIPLINE.md §3)" >&2
      echo "[pre-tag-gate]   Bypass: SC_PRE_TAG_GATE_BYPASS=trip-vocab (emergency only)" >&2
      exit 25
    elif [ "$TV_EXIT" -ne 0 ]; then
      # exit 2 = tool FATAL (unreadable page / usage error) — a TOOL MALFUNCTION,
      # NOT a content-filter verdict. Surface it distinctly and do NOT block
      # (escalating would mislabel a broken tool as a content trip).
      echo "[pre-tag-gate] WARN: trip-vocab check could not run (tool exit $TV_EXIT; not a content verdict)" >&2
      echo "$TV_OUTPUT" | head -10 >&2
      log "[pre-tag-gate] step 21/22: WARN (trip-vocab tool error — not a budget verdict)"
    else
      log "[pre-tag-gate] step 21/22: PASS"
    fi
  fi
fi

# ----- step 22/22: ship-review attestation (v1.49.1029 — default-BLOCK, born-BLOCK) -----
# Deterministic gate verifying that the adversarial ship review (T14 step P) ran on
# THIS ship's diff and wrote .planning/ship-review/last-attestation.json. The
# advisory-only rung was v1.49.968 Ship 1.1 (staged #10463); this step is the
# promotion: 55 distinct release versions all-time document the review (20 within
# v968+; the NASA band's content reviews live in untracked mission artifacts), and the
# caught-defect ledger keeps growing (v1027: 1 BLOCKER + 1 MAJOR; v1028: 1 MAJOR;
# v965: 3 BLOCKERs; v966; v982; 11/35 F4).
#
# Discriminated exactly like step 21 (trip-vocab): if .planning/STATE.md is absent
# (clean-CI checkout — www/ + .planning/ both gitignored) → SKIP. Only the local
# dev ship environment writes an attestation.
#
# Three checks (single source of truth: tools/ship-review/write-attestation.mjs --check):
#   1. File parses + required fields (reviewedHead sha, mode ∈ {full,scaled,content}, writtenAt).
#   2. git merge-base --is-ancestor <reviewedHead> HEAD (the reviewed commits are in this tree).
#   3. <reviewedHead> NOT an ancestor of the newest tag (freshness: stale prior-ship attestation BLOCKs).
#
# Bypass: SC_PRE_TAG_GATE_BYPASS=ship-review-attestation (emergency only — run step P
# and write-attestation.mjs instead).
#
# PROMOTION-MARKER: ship-review-attestation default-BLOCK since v1.49.1029 (K=30; evidence: 55 reviewed release dirs all-time, 20 within v968+ + the caught-defect ledger; reporter: tools/gate/warn-promotion-readiness.mjs)
if gate_bypassed "ship-review-attestation"; then
  log "[pre-tag-gate] step 22/22: SKIPPED (ship-review-attestation)"
elif [ ! -f "$REPO_ROOT/.planning/STATE.md" ]; then
  log "[pre-tag-gate] step 22/22: SKIPPED (no STATE.md; CI/clean-repo path)"
else
  log "[pre-tag-gate] step 22/22: ship-review attestation check"
  # `&& X=0 || X=$?` preserves the real exit code under `set -euo pipefail`
  # (a bare assignment aborts on the tool's exit-1 BEFORE the FAIL block).
  ATTEST_OUTPUT="$(node "$REPO_ROOT/tools/ship-review/write-attestation.mjs" --check 2>&1)" && ATTEST_EXIT=0 || ATTEST_EXIT=$?
  if [ "$ATTEST_EXIT" -eq 1 ]; then
    # exit 1 = attestation missing, stale, or invalid (a clear verdict). BLOCK.
    echo "[pre-tag-gate] FAIL: ship-review attestation missing, stale, or invalid" >&2
    echo "$ATTEST_OUTPUT" | head -10 >&2
    echo "[pre-tag-gate]   Run T14 step P (adversarial ship review), then:" >&2
    echo "[pre-tag-gate]   node tools/ship-review/write-attestation.mjs --mode full --base <first-code-commit>^ --confirmed N" >&2
    echo "[pre-tag-gate]   For NASA content-review ships: --mode content" >&2
    echo "[pre-tag-gate]   For deliberate scale-downs:    --mode scaled --notes \"<why>\"" >&2
    echo "[pre-tag-gate]   Bypass (emergency only): SC_PRE_TAG_GATE_BYPASS=ship-review-attestation" >&2
    exit 26
  elif [ "$ATTEST_EXIT" -ne 0 ]; then
    # exit 2 = tool internal error — NOT an attestation verdict. WARN only.
    echo "[pre-tag-gate] WARN: ship-review-attestation tool could not run (exit $ATTEST_EXIT; not a verdict)" >&2
    echo "$ATTEST_OUTPUT" | head -10 >&2
    log "[pre-tag-gate] step 22/22: WARN (ship-review-attestation tool error — not a verdict)"
  else
    log "[pre-tag-gate] step 22/22: PASS"
  fi
fi

log "[pre-tag-gate] all 22 checks PASS — safe to \`git tag\` and merge to main"
exit 0
