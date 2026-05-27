# v1.49.812 — First ProcessContext Chip: intelligence/analyzer/git.ts

**Released:** 2026-05-27
**Type:** chip ship (security-chokepoint migration; no new substrate)
**Predecessor:** v1.49.811 — Batch Chip: cargo + conda + pypi + rubygems Registry Adapters
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** chip the first of 38 grandfathered process callers from the v806 `ProcessContext.KNOWN_UNWIRED` allowlist, demonstrating the migration pattern at the ProcessContext sibling surface.

## Summary

First migration ship from the v806 chokepoint extension's `ProcessContext.KNOWN_UNWIRED` grandfathered allowlist. Wires `gitMetadata()` in `src/intelligence/analyzer/git.ts` through `ProcessContext` using a shape structurally identical to the v809 EgressContext chip:

- Optional `ctx?: ProcessContext` parameter (zero call-site churn for existing callers)
- `ensureProcessAllowed(ctx, source, op, command, argv?)` hoisted BEFORE the swallow-try per Lesson #10427
- `catch (err)` block uses `instanceof ProcessContextDenied` to re-throw security denials while continuing to swallow accessory errors (ENOENT, permission, untracked file → null)

The candidate was chosen for its clarity:
- Single execFile site
- Self-contained "best-effort observability" surface (returns null on any failure)
- Existing swallow-everything `catch {}` — perfect setting for the #10427 hoist-and-instanceof pattern
- No external src/ callers beyond `intelligence/analyzer/core.ts` which passes no ctx (legacy permissive)
- 114 LOC, small diff

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/intelligence/analyzer/git.ts` | MODIFIED | `gitMetadata(filePath, repoRoot?, ctx?)` accepts optional ProcessContext. `ensureProcessAllowed(ctx, 'intelligence/analyzer/git', 'exec-file', 'git', args)` hoisted BEFORE the try/catch. Catch block re-throws ProcessContextDenied; accessory git errors continue to swallow to null. Module docstring updated to record the v812 wire date + #10427 invariant. |
| `src/intelligence/analyzer/__tests__/git.test.ts` | MODIFIED | +2 tests in a new `ProcessContext integration` describe block: denial-before-execFile (using a real temp git repo so we pass the `hasGitRepo` early-return) + audit-record emission with source/target/argv assertions. |
| `src/security/process-context-audit.test.ts` | MODIFIED | `git.ts` removed from `KNOWN_UNWIRED`. 38 process callers → 37. Comment annotation records the v812 wire date. |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `src/intelligence/analyzer/git.ts` end-to-end, `src/security/process-context.ts` for the API surface, `src/intelligence/analyzer/__tests__/git.test.ts` for the existing test pattern, and `src/intelligence/analyzer/core.ts` to verify the single src/ caller passes no ctx (so the wire is backward-compatible by default). Recon surfaced: (a) `ProcessOp` type is `'exec-file'` (kebab-case), not `'execFile'` (the build caught this on the first try-build); (b) the `hasGitRepo` early-return means tests must use a real temp git repo to exercise the denial path. |
| #10414 (chokepoint retrofit, optional ctx? pattern) | Mirrored the v806 LoaderContext / v809 EgressContext shape: optional `ctx?` param, ensure*Allowed() outside try, default = call-site-provided permissive context. |
| #10416 (lightest wire) | Resisted: also chipping the `core.ts` caller (passing ctx through requires its own recon); batch-chipping the 4 git/core/ files in the same ship (separate family with different complexity); refactoring the function to extract the args-build (premature). Chose: 1 file + 2 tests + 1 KNOWN_UNWIRED removal. |
| #10422 (verdict-pattern surface separation) | The chokepoint enforcement (audit-test) lives in `src/security/`. The wire decision lives in operator judgment + this release notes. KNOWN_UNWIRED entry removal is the audit's BehaviorViewpoint update. |
| #10427 (failure-mode contracts) | THE central application this ship. The `catch {}` block (parameter-less swallow) is preserved as the right shape for "best-effort observability" but the new `catch (err)` form checks `instanceof ProcessContextDenied` first and re-throws — so security denial propagates even though git's ENOENT/permission/etc errors continue to silently return null. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a wire of the `core.ts` caller (which would require its own recon to identify the right ctx source — likely from `gsd-skill-creator.json` settings). Left for a future ship if a real consumer needs it.
- Not a batch chip across multiple process callers. Single-file, first-of-pattern ship.
- Not a new audit harness or infrastructure.

## Verification

- `npm run build` → PASS.
- `npx vitest run src/intelligence/analyzer/__tests__/git.test.ts src/security/process-context-audit.test.ts` → 2,051/2,051 PASS (5 existing git tests + 2 new + 2,044 audit tests).
- `bash tools/pre-tag-gate.sh` → all 17 steps PASS. PROJECT.md drift WARN at 2 patches (within threshold=3).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 30 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v811 | At v812 |
|---|---|---|
| Egress `KNOWN_UNWIRED` | 11 | 11 (UNCHANGED) |
| Process `KNOWN_UNWIRED` | 38 | **37** (−1) |

ProcessContext migration begins. The chip ship establishes the pattern; future ships can batch-chip families (aminet 5 files, git/core 4 files, scribe/netlist-renderer 3 files) at the v811 cadence.

## Forward path

- **Post-T14-reset STATE.md drift closure** — counter-cadence ship to close the partial wedge from v807.
- **Codification audit** — overdue per #10428.
- **Batch chip aminet family** (5 files) — apply v811-style batch pattern to ProcessContext.
- **NASA 1.179** — 30 consecutive at 1.178.
