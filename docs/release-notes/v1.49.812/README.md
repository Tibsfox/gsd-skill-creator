> Following v1.49.811 — _Batch Chip: cargo + conda + pypi + rubygems Registry Adapters_, v1.49.812 chips the first entry from the v806 `ProcessContext.KNOWN_UNWIRED` allowlist: `src/intelligence/analyzer/git.ts` is now wired through the `ProcessContext` chokepoint. Demonstrates the ProcessContext chip pattern. Process `KNOWN_UNWIRED` drops from 38 to 37.

# v1.49.812 — First ProcessContext Chip: intelligence/analyzer/git.ts

**Shipped:** 2026-05-27

First chip from the v806 chokepoint extension's grandfathered `ProcessContext.KNOWN_UNWIRED` list. Wires `src/intelligence/analyzer/git.ts` through `ProcessContext`. Adds `ctx?: ProcessContext` to the `gitMetadata()` signature; hoists `ensureProcessAllowed()` BEFORE the swallow-everything try/catch per Lesson #10427; adds `instanceof ProcessContextDenied` re-throw in the catch so security denials propagate while accessory git errors (ENOENT, permission, untracked-file) continue to swallow to null.

## What shipped

- **MODIFIED** `src/intelligence/analyzer/git.ts` — `gitMetadata(filePath, repoRoot?, ctx?: ProcessContext)`. Calls `ensureProcessAllowed(ctx, 'intelligence/analyzer/git', 'exec-file', 'git', args)` BEFORE the try/catch per Lesson #10427. Catch block uses `instanceof ProcessContextDenied` to re-throw security denials while continuing to swallow accessory git errors (ENOENT, permission, untracked file → return null).
- **MODIFIED** `src/intelligence/analyzer/__tests__/git.test.ts` — adds 2 tests in a new `ProcessContext integration` describe block: denial-before-execFile (real git repo + restricted ctx → ProcessContextDenied) + audit-record emission (permissive ctx with `'git'` allowList → 1 record with `source='intelligence/analyzer/git'`, `target='git'`, `argv[0]='log'`).
- **MODIFIED** `src/security/process-context-audit.test.ts` — `git.ts` removed from `KNOWN_UNWIRED`. 38 process callers → 37.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| ProcessContext integration | +2 | denial + audit-record |
| **Total added** | **+2** | 35,192 → 35,194 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 30 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v811 | At v812 | Δ |
|---|---|---|---|
| Egress `KNOWN_UNWIRED` | 11 | 11 | 0 |
| Process `KNOWN_UNWIRED` | 38 | **37** | **−1** |

First ProcessContext chip; establishes the playbook for the remaining 37 process callers. The pattern is structurally identical to the v809 EgressContext chip (same shape: optional `ctx?`, hoist ensure outside try, instanceof re-throw in catch).

## Forward path

- **Post-T14-reset STATE.md drift closure** — counter-cadence ship to close the partial wedge from v807.
- **Codification audit** — overdue per #10428.
- **Batch chip aminet family** (5 files) — apply v811-style batch pattern to ProcessContext.
- **NASA 1.179** — 30 consecutive at 1.178.
