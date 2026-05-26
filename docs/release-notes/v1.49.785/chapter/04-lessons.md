# 04 — Lessons Learned: v1.49.785 PROJECT.md Normalizer

## 1 candidate emitted (#10417)

**Lesson #10417 candidate — Test-harness stderr-capture semantics depend on exit code with execSync.**
Severity: MEDIUM. When writing a vitest test harness around a Node.js CLI under test, prefer `spawnSync('node', [scriptPath, ...args])` over `execSync(cmd)` for capturing stderr. `execSync` only surfaces stderr via its catch path (i.e., when the child exits non-zero); on exit 0, stderr is lost and the test helper has to hardcode `stderr: ''`. This compounds when the script under test emits WARN messages on exit 0 — a class of behavior that's increasingly common in WARN-only gates (story-drift, discipline-coverage, sps-cohort-uniqueness, project-md). Three test failures lost ~3 min before the root cause was found.
Apply: every new test harness for a CLI that may emit warnings on exit 0. Pattern: use `spawnSync` with `encoding: 'utf8'`, return `{exitCode: result.status, stdout: result.stdout, stderr: result.stderr}`.
Promotion track: candidate at v1.49.785; promotes to ESTABLISHED on second instance.

## Disciplines reinforced (no new IDs)

- **#10416 (Tolerant generators / \\Z-in-JS-regex pitfall)** — caught prophylactically when drafting `parseGapTable()` first regex `(?=^## |\\Z)/m`. Replaced with `stripSection()` line walker. T10 test case locks in.
- **#10412 (Recon-first as default)** — applied to the audit-to-ship transition. ~5min reading PROJECT.md structure before writing the normalizer surfaced the predecessor-vs-current semver semantics (PROJECT.md references N-1 mid-T14, not N).
- **#10414 (Optional `ctx?` chokepoint retrofit)** — not directly applied this ship, but the normalizer's check-only-first-ship posture is analogous: introduce the chokepoint in audit-only mode, defer enforcement until soaked.
- **Gate-not-vigilance discipline (v585 → v784)** — directly applied; PROJECT.md prose-drift is the offending social rule, the normalizer is the deterministic gate, pre-tag-gate step 17 is the enforcement surface.

## What's now codified that wasn't before

Nothing in the manifest — this ship validates an existing discipline (gate-not-vigilance) rather than codifying a new one. The audit's Tier 1 roadmap is the new codified artifact, but it lives in `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` (gitignored) rather than the discipline manifest.

## Forward backlog

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10417 candidate | MEDIUM | Future test-harness authoring | v785 normalizer test fix |

## Discipline-coverage status post-ship

Manifest entries: 13 → 13 (no new discipline domain — #10417 is candidate, not promoted)
Manifest lessons: 57 → 57 (no formal ID emitted; #10417 awaits second instance)
Codified-vs-uncodified gap: unchanged
