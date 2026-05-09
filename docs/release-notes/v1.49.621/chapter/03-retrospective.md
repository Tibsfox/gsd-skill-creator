# v1.49.621 — Retrospective

## Carryover lessons applied

- **v1.49.585 operational-debt cleanup pattern.** The `migrations.test.ts` SCRIBE_RESEARCH_CARTRIDGES skip set follows the same "convert social-rule operational debt into deterministic gates" discipline that v1.49.585 introduced. The 5 SCRIBE example cartridges ship as research-output schema, not unified-chipset schema; the test gate rejects the wrong-schema parse explicitly rather than silently failing.
- **v1.49.587 CI-on-dev verification HARD RULE.** Pre-tag-gate sub-check 4 ran without override before this milestone tagged; CI green on `origin/dev` was confirmed before any push to main.
- **v1.49.587-590 composite-gate maturation.** All 8 pre-tag-gate sub-checks ran; no `SC_SKIP_*` override was used. The substrate-continuity milestone is the canonical case for "ship discipline matters" — overrides would have undermined the very thesis the milestone instantiates.
- **v1.49.589 atomic version-bump discipline.** Used `node scripts/bump-version.mjs 1.49.621` to advance all 4 manifests + 5 version slots together. No manual manifest edits. Closes the v1.49.588 partial-bump failure mode.
- **v1.49.591 W2 build-agent dispatch template (MANDATORY).** Prompt template at `.planning/missions/template-files/W2-build-agent-prompt.md` was followed; output-token-cap discipline (incremental Edit operations for files >100 lines) prevented silent truncation across the entire fleet.
- **v1.49.594 ship-sync wrapper.** `npm run ship-sync` is the canonical post-main-merge step; preserved across this milestone.

## New lessons captured (carry these forward)

1. **Recursive subagent spawning is hard-blocked at the Claude Code runtime layer.** Discovered Wave 0 of this mission; formalized as the **INLINE SERIAL pattern** across Waves 1-3. Convoy-lead agents author files directly within their own context; nested `Agent` calls fail at the runtime layer and cannot be papered over. Promoted to v1.50 mission-pattern guidance.
2. **Sub-agent harness blocks REPORT.md writes.** Convoy-lead agents could not write final REPORT.md files to disk; parent agent had to author the reports from returned content text. Workaround used Waves 1-3: parent-agent-lands-from-returned-content. Future improvement: structured-output return shape for agent contexts.
3. **~16% of fleet token ceiling spent across 4 waves** (vs. ~5M projected). Over-budgeting is safe but signals the model-of-fleet-cost is too conservative. Tune the next mission spec downward.
4. **Wave-2 contract-audit pattern (WAVE-2-AUDIT.md) BEFORE dispatch saved cycles.** Contract audits caught at the G2 review step prevented Wave-2 component agents from importing wrong symbol names. Pattern promoted to standard pre-dispatch step.
5. **flight-ops audit-then-author pattern for Wave 4 worked.** WAVE-4-AUDIT.md was authored before the C09 dispatch briefing; the briefing itself was authored from the audit findings. C09 began with zero blockers because all 3 advisories were pre-resolved (option-i for migrations.test.ts; CAP-040/021/041 matrix classification; ship-pipeline order spelled out).
6. **Substrate-continuity is checkable in CI.** The 5 substrate-conformance tests in `src/scribe/__tests__/integration/substrate/` are now part of the standard CI run. If anyone silently changes the SQL CHECK constraint, the namespace URI, or the SVGO BLOCKER opt-outs, vitest catches it.
7. **Counter-cadence is a viable cadence pattern.** v1.49.585 + v1.49.621 = 2 of 2 counter-cadence milestones shipped without NASA degree advance. Pattern stands for substrate work where substrate IS the work.

## What worked unusually well

- **Pre-existing-failure resolution via WAVE-4-AUDIT discovery.** The "test fix was reverted out-of-band" claim in the operator brief was investigated by the audit; the fix was actually IN the working tree, uncommitted, and passing 105/105. Option (i) (commit the existing diff) replaced the planned Option (ii) (author proper unified-chipset format for the 5 cartridges) and dropped a deferred follow-on milestone of work.
- **Component 08 deployment evidence preserved at DEPLOYMENT-LOG-v1.49.621.md.** The 12 file / 369,668-byte manifest + 5/5 HTTPS probe results gave Component 09 evidence cells in VERIFICATION-MATRIX without re-running the deploy.
- **Test suite stability.** SCRIBE went from 211 → 255 passing tests with 0 regressions; the full repo vitest run also stayed clean. The substrate frozen by Component 00 held across all 8 downstream consumers.
