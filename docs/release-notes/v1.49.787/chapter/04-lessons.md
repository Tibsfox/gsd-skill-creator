# 04 — Lessons Learned: v1.49.787 Adoption Telemetry Dashboard + Automation

## 2 candidates emitted (#10420, #10421)

**Lesson #10420 candidate — process.exit() during pending stdout write truncates output at pipe-buffer boundaries.**
Severity: MEDIUM. When a Node.js CLI calls `process.stdout.write(largeString)` and immediately `process.exit(code)`, the kernel may discard the unwritten portion if the receiving side hasn't drained the pipe. The Linux default pipe buffer is 64 KB; outputs above that size truncate when piped to a downstream command (`a | b`) even though they survive a redirect to file (`a > file`). Surfaced at v1.49.787 first manual integration test of `tools/adoption-scan.mjs --json | node tools/render-adoption-dashboard.mjs` — 168 KB JSON truncated at position 65536, identical to the pipe-buffer size. Fix: implement an `exitWhenDrained()` helper that subscribes to stdout/stderr 'drain' events before calling `process.exit()`. Apply: every CLI in `tools/` that may produce >64KB stdout output (most JSON-emitting analyzers).
Promotion track: candidate at v1.49.787; promotes to ESTABLISHED on second instance.

**Lesson #10421 candidate — Observability tools have a "warm-up period" before their primary value works.**
Severity: LOW-MEDIUM. v787's adoption-refresh tool emits diffs vs prior baseline — but v786 (the prior ship) didn't write the `.json` snapshot that diff comparison requires. So v787's first run reports "no prior baseline found (first run)" — the diff feature doesn't activate until v788. This is a class of expectation-mismatch where a tool's value proposition is built on data that the tool itself must accumulate over time. Document the warm-up explicitly in release notes + the tool's own help output so the first user isn't surprised. Apply: every observability tool whose primary value is diff/trend/comparison over time.
Promotion track: candidate at v1.49.787; promotes to ESTABLISHED on second instance.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — applied to the dashboard-pattern recon: ~5 min inspecting `dashboard/index.html` vs `state.html` (committed vs gitignored) surfaced that most pages are auto-regen targets. Saved building a generator that would have conflicted with an existing system.
- **#10417 candidate (Test-harness stderr-capture)** — applied prophylactically: `adoption-refresh.test.mjs` uses `spawnSync` from the start. Third sequential application of the pattern (after v785 + v786). Now confident-enough to promote at next codification ship.
- **#10418 candidate (Static analyzers scan multiple importer roots)** — not directly exercised this ship; refresh is an orchestrator, not a new scanner.
- **#10419 candidate (Static-analysis tools commit a baseline)** — applied: `tools/adoption-refresh.mjs` writes both .md (human-readable) and .json (machine-readable) baselines. The .json enables structured diff; the .md is the human-facing snapshot. Second application of the pattern (v786 was first).

## What's now codified that wasn't before

Nothing in the manifest — this ship validates existing disciplines and emits two new candidates. Total candidate backlog at v787 close: **5** (#10417, #10418, #10419, #10420, #10421). Approaching codification-readiness — historical precedent codifies at 5-8 candidates (v1.49.654 codified 5, v1.49.784 codified 8).

## Forward backlog

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10417 candidate | MEDIUM | Test-harness authoring (CLI tools with WARN-on-exit-0) | v785 normalizer test fix |
| #10418 candidate | MEDIUM | Cross-module static analyzers | v786 importer-root expansion |
| #10419 candidate | MEDIUM | Metric-emitting static analyzers | v786 baseline commit decision |
| #10420 candidate | MEDIUM | CLIs emitting >64KB stdout | v787 pipe-flush fix |
| #10421 candidate | LOW-MEDIUM | Diff/trend observability tools | v787 first-run no-prior-data case |

Each of #10417-#10419 has been re-applied at v787 — they're effectively ready for promotion to ESTABLISHED at the next codification ship (likely v1.49.790-795 range). #10420 and #10421 are first-instance and await second.

## Discipline-coverage status post-ship

Manifest entries: 13 → 13 (no new domain)
Manifest lessons: 57 → 57 (no formal ID; candidates await second instance)
Codified-vs-uncodified gap: unchanged; the next codification ship will fold in ~5 candidates as a batch.
