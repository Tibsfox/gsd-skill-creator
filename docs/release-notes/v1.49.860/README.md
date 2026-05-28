> Following v1.49.859 — _ProcessContext singleton chip: `src/chipset/blitter/executor.ts`_, v1.49.860 is the **third chip of Track 2** in the v857-v867 follow-on campaign. Wires `src/intelligence/provenance/linker.ts` (mission-attribution linker) through the ProcessContext chokepoint via the internal-helper pattern (#10433): `ctx?` threaded through the `git()` helper + `resolveMissionCommits` + `ProvenanceLinker.run`; `ensureProcessAllowed` called at the top of the helper before `spawnSync`. **KNOWN_UNWIRED Process count: 9 → 8.** Cross-audit tool reports clean.

# v1.49.860 — ProcessContext singleton chip: `src/intelligence/provenance/linker.ts`

**Shipped:** 2026-05-28

Third chip of Track 2. The provenance linker wraps `spawnSync('git', ...)` in an internal `git(cwd, args)` helper called from 4 sites (rev-list, log, ls-files, blame). Internal-helper pattern per #10433: thread `ctx?` through the helper + the 2 exported callers (`resolveMissionCommits`, `ProvenanceLinker.run`); hoist `ensureProcessAllowed` at the helper's single spawn site so all 4 call sites share one chokepoint.

## What shipped

- **MODIFIED** `src/intelligence/provenance/linker.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `git(cwd, args, ctx?)` threads ctx + calls `ensureProcessAllowed` BEFORE the spawn (single chokepoint for 4 call sites); `resolveMissionCommits(db, project_dir, ctx?)` + `ProvenanceLinker.run(cfg, opts?, ctx?)` accept optional `ctx` and pass it down to `git()`.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/intelligence/provenance/linker.ts'` from `KNOWN_UNWIRED` + inline comment documenting the v1.49.860 internal-helper wire shape.
- **MODIFIED** `src/intelligence/provenance/__tests__/linker.test.ts` — new `describe('ProvenanceLinker — ProcessContext wire (v1.49.860)')` block with 3 test cases (resolveMissionCommits denial + backward-compat + ProvenanceLinker.run denial).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/intelligence/provenance/__tests__/linker.test.ts` | +3 | 8 → 11 total |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 8 + Egress 11; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **78 consecutive ships at 1.178**, new widest pressure margin record by 1 over v859's 77).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
**KNOWN_UNWIRED Process: 9 → 8.** Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10433 internal-helper)

```ts
function git(cwd: string, args: string[], ctx?: ProcessContext): GitResult {
  ensureProcessAllowed(ctx, 'intelligence/provenance/linker', 'spawn-sync', 'git', args);
  const r = spawnSync('git', args, { cwd, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
  // ...
}

export function resolveMissionCommits(
  db: Database.Database,
  project_dir: string,
  ctx?: ProcessContext,
): MissionCommitMap[] {
  // ... calls git(project_dir, [...], ctx) ...
}

class ProvenanceLinker {
  run(cfg, opts?, ctx?: ProcessContext): LinkerResult {
    // ... calls resolveMissionCommits(db, project_dir, ctx) + git(...) × 3 ...
  }
}
```

Internal-helper pattern (#10433). One `ensureProcessAllowed` call site protects 4 spawn invocations downstream. Cost: 1 LOC per call site for the `, ctx` pass-through, 1 LOC for the hoisted check, 3 LOC of param threading on the 2 exported entry points.

## Surface delta

- 3 files modified
- +15 source LOC (3 LOC imports; 1 param + 1 LOC ensureProcessAllowed in `git()`; 1 param × 2 exports; 4 × `, ctx` at call sites; 9 LOC in audit-test comment)
- +60 test LOC (3 new test cases including ProvenanceLinker.run end-to-end)
- 0 new dependencies
- 0 manifest changes
