# Retrospective — v1.49.28

## What Worked

- **Retrospective-driven prioritization works.** Mining 10 releases of "What Could Be Better" sections produced a focused, high-value backlog. Every item had evidence — frequency counts, specific version citations, concrete symptoms. No guessing.
- **4-track parallel execution.** All 6 improvements were independent across 3 domains. Waves 1 and 2 ran 4 parallel agents with zero file conflicts.
- **Vision-to-mission pipeline.** First milestone staged entirely through the v2m skill. The 9-document mission package gave each agent a self-contained spec. Zero cross-agent coordination needed.
- **The tsc hook already caught a real bug.** During Wave 2A, the build-check hook (with the new commit-time trigger) validated the kernel cache changes before they were committed.

## What Could Be Better

- **Matrix filtering and kernel cache landed in the same commit** (`7f99124d`). Two independent tracks — different domains, different agents — got combined by commit timing. Ideally these would be separate commits for cleaner history.
- **BCM and SHE have no page.html** — they use a different browser architecture (static index.html linking directly to raw .md files). The TOC enhancement doesn't apply to them. This asymmetry should be documented or the architecture unified in a future pass.
- **The PNW index warning in the hook has a subtle flow issue** that was caught during verification — the original staged-TS guard used `exit 0` which bypassed the PNW check. Fixed by restructuring to use a flag variable instead of early exit.

## Lessons Learned

1. **Retrospectives are a backlog source.** "What Could Be Better" sections are deferred work items. Mining them systematically produces higher-signal work than ad-hoc feature requests.
2. **Self-contained specs enable parallel agents.** When each agent gets a complete spec with no cross-references, coordination overhead drops to zero. The vision-to-mission pattern enforces this.
3. **Hook logic needs flow analysis.** Sequential guard clauses with early exits can skip later checks. When adding new checks to an existing hook, trace all exit paths.
4. **Browser architecture divergence accumulates.** BCM/SHE's different template means every browser enhancement requires an exception list. Worth unifying eventually.
