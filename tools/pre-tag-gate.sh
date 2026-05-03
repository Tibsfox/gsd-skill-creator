#!/usr/bin/env bash
# tools/pre-tag-gate.sh — pre-tag composite gate for v1.49.x ships.
#
# Run BEFORE `git tag` to catch CI-shaped failures that the lighter
# pre-push hook does not exercise. Composes:
#
#   1. npm run build  — catches TypeScript errors (e.g. TS2835 missing-.js
#                       extensions) that vitest does not surface
#   2. npx vitest run — runs the full vitest suite, mirroring CI
#   3. node tools/release-history/check-completeness.mjs --current --strict
#                     — release-notes 5-file structure (already enforced by
#                       the pre-push hook on push-to-main, but re-checked
#                       here so the operator sees the gate fire pre-tag)
#   4. CI-on-dev verification — origin/dev tip's latest CI run must be
#                       conclusion=success before tag/main-push proceeds.
#                       Added v1.49.587 per HARD RULE: "verify CI passes on
#                       dev before pushing to main". Override: SC_SKIP_CI_GATE=1
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
#
# Exit codes:
#   0  all checks PASS
#   1  build failed
#   2  vitest failed
#   3  completeness gate failed
#   4  CI-on-dev failed / pending (SC_SKIP_CI_GATE=1 overrides)
#   5  www-bundles build failed
#   6  depth-audit FAIL findings (BLOCKER as of v1.49.591; SC_SKIP_DEPTH_AUDIT=1 overrides)
#   7  CLAUDE.md drift (SC_SKIP_CLAUDE_MD_GATE=1 overrides)
#
# Usage:
#   bash tools/pre-tag-gate.sh
#   npm run pre-tag-gate
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

log "[pre-tag-gate] step 1/7: npm run build"
if ! npm run build --silent; then
  echo "[pre-tag-gate] FAIL: npm run build exited non-zero" >&2
  echo "[pre-tag-gate] Check TypeScript errors above; common cause is" >&2
  echo "[pre-tag-gate] missing .js extensions on relative ESM imports" >&2
  echo "[pre-tag-gate] (TS2835 with --moduleResolution node16/nodenext)." >&2
  exit 1
fi
log "[pre-tag-gate] step 1/7: PASS"

log "[pre-tag-gate] step 2/7: npx vitest run (full suite — mirrors CI)"
if ! npx vitest run --silent; then
  echo "[pre-tag-gate] FAIL: npx vitest run exited non-zero" >&2
  echo "[pre-tag-gate] Common v1.49.585+ CI-shaped failures:" >&2
  echo "[pre-tag-gate]   - manifest-drift CF-MED-065b: regenerate via scripts/generate-inventory-manifest.sh" >&2
  echo "[pre-tag-gate]   - harness-integrity hook-ref: settings-hooks.json hooks must use plain relative paths (not \$CLAUDE_PROJECT_DIR-prefixed)" >&2
  echo "[pre-tag-gate]   - claude-md-truth CF-MED-063b: no /media/foxy/ literal paths in CLAUDE.md (use \$REPO/ or \$ARTEMIS_REPO/)" >&2
  exit 2
fi
log "[pre-tag-gate] step 2/7: PASS"

log "[pre-tag-gate] step 3/7: release-notes completeness gate"
if ! node tools/release-history/check-completeness.mjs --current --strict; then
  echo "[pre-tag-gate] FAIL: completeness gate failed" >&2
  echo "[pre-tag-gate] Author the missing release-notes files BEFORE tagging." >&2
  echo "[pre-tag-gate] See: docs/release-notes/v1.49.581/ + v1.49.582/ as gold reference." >&2
  exit 3
fi
log "[pre-tag-gate] step 3/7: PASS"

# ----- step 4/7: CI-on-dev gate (v1.49.587 HARD RULE) -----
SKIP_CI_GATE="${SC_SKIP_CI_GATE:-0}"
if [ "$SKIP_CI_GATE" = "1" ]; then
  log "[pre-tag-gate] step 4/7: SKIPPED (SC_SKIP_CI_GATE=1)"
else
  log "[pre-tag-gate] step 4/7: CI-on-dev verification"
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
  RUN_JSON="$(gh run list --repo "$REPO_NWO" --branch dev --limit 10 \
    --json status,conclusion,headSha,databaseId,url 2>&1)" || {
    echo "[pre-tag-gate] FAIL: gh run list returned error: $RUN_JSON" >&2
    exit 4
  }
  MATCHING="$(echo "$RUN_JSON" | jq --arg sha "$DEV_SHA" '[.[] | select(.headSha == $sha)] | .[0]')"
  if [ "$MATCHING" = "null" ] || [ -z "$MATCHING" ]; then
    echo "[pre-tag-gate] FAIL: no CI run found for origin/dev tip $DEV_SHA" >&2
    echo "[pre-tag-gate]   Possible causes:" >&2
    echo "[pre-tag-gate]     a) you have unpushed commits on dev → \`git push origin dev\`" >&2
    echo "[pre-tag-gate]     b) CI is queued but not yet started → wait + retry" >&2
    echo "[pre-tag-gate]     c) CI workflow does not run on this branch (config gap)" >&2
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
    echo "[pre-tag-gate] FAIL: CI run on origin/dev concluded $CONCLUSION" >&2
    echo "[pre-tag-gate]   SHA: $DEV_SHA" >&2
    echo "[pre-tag-gate]   URL: $RUN_URL" >&2
    echo "[pre-tag-gate]   Fix the failing tests on dev BEFORE pushing to main." >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_SKIP_CI_GATE=1" >&2
    exit 4
  fi
  log "[pre-tag-gate] step 4/7: PASS (CI green at $DEV_SHA)"
fi

# ----- step 5/7: SPICE renderer bundle freshness (v1.49.587 unwired-build closure) -----
log "[pre-tag-gate] step 5/7: www-bundles freshness (SPICE renderer)"
if ! bash "$REPO_ROOT/tools/build-www-bundles.sh" >/dev/null 2>&1; then
  echo "[pre-tag-gate] FAIL: www-bundles build failed" >&2
  echo "[pre-tag-gate] Re-run for diagnostics: bash tools/build-www-bundles.sh" >&2
  exit 5
fi
log "[pre-tag-gate] step 5/7: PASS"

# ----- step 6/7: depth-audit (BLOCKER as of v1.49.591; closes Lesson #10188) -----
SKIP_DEPTH="${SC_SKIP_DEPTH_AUDIT:-0}"
if [ "$SKIP_DEPTH" = "1" ]; then
  log "[pre-tag-gate] step 6/7: SKIPPED (SC_SKIP_DEPTH_AUDIT=1)"
else
  log "[pre-tag-gate] step 6/7: depth-audit (BLOCKER mode — hardened at v1.49.591; cross-link strict at v1.49.595+)"
  if [ -f "$REPO_ROOT/.planning/STATE.md" ]; then
    DEPTH_OUT="$(node "$REPO_ROOT/tools/depth-audit.mjs" --current --cross-link-strict 2>&1)" || true
    if echo "$DEPTH_OUT" | grep -qE '(FAIL|MISSING)'; then
      echo "[pre-tag-gate] FAIL: depth-audit reported FAIL/MISSING findings:" >&2
      echo "$DEPTH_OUT" | grep -E '\[(X |!!|OK)\]' >&2 || echo "$DEPTH_OUT" >&2
      echo "[pre-tag-gate]   Author the missing/under-depth files BEFORE tagging." >&2
      echo "[pre-tag-gate]   See template-files/W2-build-agent-prompt.md for the dispatch pattern." >&2
      echo "[pre-tag-gate]   Override (emergency only — almost never the right call): SC_SKIP_DEPTH_AUDIT=1" >&2
      exit 6
    fi
    log "[pre-tag-gate] step 6/7: PASS (depth-audit clean)"
  else
    log "[pre-tag-gate] step 6/7: SKIPPED (.planning/STATE.md absent — cannot derive version)"
  fi
fi

# ----- step 7/7: CLAUDE.md auto-render drift check -----
SKIP_CLAUDE_MD="${SC_SKIP_CLAUDE_MD_GATE:-0}"
if [ "$SKIP_CLAUDE_MD" = "1" ]; then
  log "[pre-tag-gate] step 7/7: SKIPPED (SC_SKIP_CLAUDE_MD_GATE=1)"
else
  log "[pre-tag-gate] step 7/7: CLAUDE.md auto-render drift check"
  if ! node "$REPO_ROOT/tools/render-claude-md.mjs" --check >/dev/null 2>&1; then
    echo "[pre-tag-gate] FAIL: CLAUDE.md is out of sync with source-of-truth manifests" >&2
    echo "[pre-tag-gate]   Fix: npm run render:claude-md   # then commit the diff" >&2
    echo "[pre-tag-gate]   Manifests live at tools/render-claude-md/" >&2
    echo "[pre-tag-gate]   Override (emergency only): SC_SKIP_CLAUDE_MD_GATE=1" >&2
    exit 7
  fi
  log "[pre-tag-gate] step 7/7: PASS"
fi

log "[pre-tag-gate] all 7 checks PASS — safe to \`git tag\` and merge to main"
exit 0
