> Following v1.49.850 — _ProcessContext singleton chip: `src/orchestrator/extension/extension-detector.ts`_, v1.49.851 is the **fourth ship of the v848-v856 nine-ship campaign** and third of five ProcessContext singleton chip ships. This ship chips `src/skill/version-backfill.ts` — `gitLastModifiedDate()` wired through the chokepoint with hoisted check per Lesson #10427. New test file `tests/skill/version-backfill.test.ts` (3 cases). **KNOWN_UNWIRED Process count: 14 → 13.**

# v1.49.851 — ProcessContext singleton chip: `src/skill/version-backfill.ts`

**Shipped:** 2026-05-28

Fourth ship of the nine-ship v848-v856 campaign; third of five chip ships. The `version-backfill` module's `gitLastModifiedDate(path)` shells out to `git log -1 --format=%ai -- <path>` to derive a skill file's last-modified date for frontmatter backfill. The function is a forensic accessory (returns `null` on any failure; callers fall back to today's UTC date), but security denials are load-bearing per Lesson #10427 — the wire hoists `ensureProcessAllowed` OUTSIDE the swallow-everything try/catch so `ProcessContextDenied` propagates while git-unavailable + untracked-file + parse-failure continue to return `null` silently.

## What shipped

- **MODIFIED** `src/skill/version-backfill.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `gitLastModifiedDate(path, ctx?: ProcessContext)` accepts optional `ctx` as second positional parameter; `ensureProcessAllowed(ctx, 'skill/version-backfill', 'exec', 'git', ['log', '-1', '--format=%ai', '--', path])` hoisted as first statement (BEFORE the try block) per Lesson #10427.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/skill/version-backfill.ts'` from `KNOWN_UNWIRED`, replaced with inline comment documenting the v1.49.851 wire shape.
- **NEW** `tests/skill/version-backfill.test.ts` — narrow test file targeting the v851 wire (3 cases: deny propagates, allow-records-audit, backward-compat no-ctx works). The pre-existing surface (parseFrontmatter, mergeFrontmatter, backfillSkillContent, findSkillFiles, runBackfill) has no targeted test file; these tests focus narrowly on the security wire.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/skill/version-backfill.test.ts` | +3 | New test file — 3 cases (deny + allow + backward-compat) |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file no longer in `KNOWN_UNWIRED` allowlist |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **69 consecutive ships at 1.178**, new widest pressure margin record by 1 over v850's 68).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
**KNOWN_UNWIRED Process: 14 → 13.**
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
export function gitLastModifiedDate(path: string, ctx?: ProcessContext): string | null {
  ensureProcessAllowed(ctx, 'skill/version-backfill', 'exec', 'git', [
    'log', '-1', '--format=%ai', '--', path,
  ]);
  try {
    const out = execSync(`git log -1 --format=%ai -- ${JSON.stringify(path)}`, ...).trim();
    if (!out) return null;
    // ...parse + validate date
    return datePart;
  } catch {
    return null; // git unavailable / untracked / parse failure — forensic silence
  }
}
```

Matches v849 (`changelog-watch`) hoist-at-top variant: single code path, no DI-override branch. The argv vector `['log', '-1', '--format=%ai', '--', path]` is passed to `ensureProcessAllowed` for audit telemetry even though the actual `execSync` invocation uses a shell-style command string with embedded `JSON.stringify(path)`.

## Surface delta

- 3 files modified (1 new test file)
- +21 source LOC (7 LOC in `version-backfill.ts` — import + 1 param + 7-line hoisted call; 7 LOC + comment in audit-test KNOWN_UNWIRED swap; new test file 56 LOC)
- 0 new dependencies
- 0 manifest changes
