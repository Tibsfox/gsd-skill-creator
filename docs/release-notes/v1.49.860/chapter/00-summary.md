# v1.49.860 — ProcessContext singleton chip: `src/intelligence/provenance/linker.ts`

**Released:** 2026-05-28

## Why this ship

Third chip of Track 2. 408 LOC, 4 spawnSync call sites wrapped in an internal `git()` helper. First Track 2 application of #10433 internal-helper pattern: one chokepoint at the helper protects all 4 spawn sites downstream. Picked after v859 to introduce the internal-helper variant.

## The wire

```ts
function git(cwd, args, ctx?): GitResult {
  ensureProcessAllowed(ctx, 'intelligence/provenance/linker', 'spawn-sync', 'git', args);
  const r = spawnSync('git', args, { cwd, ... });
  // ...
}

export function resolveMissionCommits(db, project_dir, ctx?): MissionCommitMap[] {
  // ...calls git(project_dir, [...], ctx)
}

class ProvenanceLinker {
  run(cfg, opts?, ctx?): LinkerResult {
    // ...calls resolveMissionCommits(db, project_dir, ctx) + git(..., ctx) × 3
  }
}
```

Internal-helper pattern (#10433). One `ensureProcessAllowed` site protects 4 spawn invocations.

## Surface delta

- 3 files modified
- +15 source LOC + 60 test LOC
- 0 new test files (3 new cases in `ProvenanceLinker — ProcessContext wire (v1.49.860)` describe block)
- KNOWN_UNWIRED Process: 9 → 8

## Engine state

NASA degree at **1.178** (UNCHANGED — 78 consecutive ships at 1.178).

## Stale-audit (v857 tool, 3rd application)

`node tools/security/check-stale-known-unwired.mjs` — clean (Process 8, Egress 11, 0 stale).
