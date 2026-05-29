# v1.49.883 — Context

## Provenance

Post-Track-5 codify ship for the v868-v882 follow-on campaign. The campaign closed at v882 with the verify-overdue forecast scan tool; the v882 retrospective enumerated 6 promotion-eligible candidates accumulated across the 15-ship campaign. v883 lands 5 of the 6 as new ESTABLISHED lessons and holds the 6th (module-singleton, 1 instance at v881 ipc.ts) as explicit carry-forward.

Codify ship per #10428 meta-cadence (15 ships past last codify at v868 — 5 over the 7-10 ship upper bound, but the v878-v881 chip cluster added 4 candidates beyond what the v877-close mid-campaign handoff predicted, so the candidate backlog grew during Track 5 rather than being clear at codify time as v868 was). Codify-on-demand still beats codify-on-schedule when the active campaign is chipping.

Operator-confirmed scope at session start via 3-question AskUserQuestion flow: (1) Track 5 wire-shape table — add as appendix to #10448 [recommended]; (2) module-singleton — carry-forward note in #10448 anti-pattern section [recommended]; (3) #10446 home — failure-mode-contracts [recommended]. All three recommendations accepted.

## Predecessor

- **v1.49.882** — Verify-overdue forecast scan tool (campaign CLOSE; v868-v882 15-ship campaign delivered). New `tools/calibratable/verify-overdue-scan.mjs` enumerates the CalibratableThreshold registry + flags drift past the 10-ship verify-axis trigger per #10428. Clean run at ship time: 5 COVERED / 0 OVERDUE / 2 UNWIRED. Engine state UNCHANGED.
- **v1.49.881** — EgressContext singleton chip: `src/intelligence/ipc.ts` (Track 5 CLOSE). 516 LOC. module-singleton wire shape (NEW variant — first instance). KNOWN_UNWIRED Egress 1→0. Both chokepoints (Process + Egress) now fully wired.
- **v1.49.880** — EgressContext singleton chip: `src/mcp/skill-installer.ts`. 401 LOC. Router-with-conditional-bypass + hoist-at-top. KNOWN_UNWIRED Egress 2→1.
- **v1.49.879** — EgressContext singleton chip: `src/chips/http-client.ts`. 350 LOC. Class-instance two-site hoisted-check (sibling of v878). KNOWN_UNWIRED Egress 3→2.
- **v1.49.878** — EgressContext singleton chip: `src/chips/anthropic-chip.ts`. 247 LOC. Class-instance two-site hoisted-check (first class-based wire). KNOWN_UNWIRED Egress 4→3.
- **v1.49.877** — EgressContext singleton chip: `src/aminet/index-fetcher.ts`. 213 LOC. Hoist-at-top inside mirror loop. KNOWN_UNWIRED Egress 5→4.
- **v1.49.876** — EgressContext singleton chip: `src/aminet/package-fetcher.ts`. 177 LOC. Two-site hoisted-check. KNOWN_UNWIRED Egress 6→5 (Track 5 opens).
- **v1.49.875** — ProcessContext singleton chip: `src/chipset/harness-integrity.ts` (Track 4 CLOSE). 1440 LOC, N=1. Hoist-at-top. KNOWN_UNWIRED Process 1→0.
- **v1.49.874** — ProcessContext singleton chip: `src/learn/acquirer.ts`. 509 LOC, N=9. safeExecFile wrapper. KNOWN_UNWIRED Process 2→1.
- **v1.49.873** — ProcessContext singleton chip: `src/git/gates/pre-flight.ts`. 363 LOC, N=12. module-internal-helper. KNOWN_UNWIRED Process 3→2.
- **v1.49.872** — ProcessContext singleton chip: `src/cli/commands/pic2html.ts`. 311 LOC, N=1. Hoist-at-top. KNOWN_UNWIRED Process 4→3.
- **v1.49.871** — ProcessContext singleton chip: `src/git/workflows/contribute.ts`. 183 LOC, N=9. Closure-capture. KNOWN_UNWIRED Process 5→4.
- **v1.49.870** — ProcessContext singleton chip: `src/learning/version-manager.ts`. 177 LOC, N=7. Class-private-method. KNOWN_UNWIRED Process 6→5 (Track 4 opens).
- **v1.49.869** — Pre-tag-gate integration of cross-audit tool (step 18/18). New automatic gate.
- **v1.49.868** — Codification ship: Promote #10444 + Refine #10443. Doc-only.
- **v1.49.867 and earlier** — see prior release-notes.

## Disciplines this ship updates

- **Architecture-retrofit patterns** (`docs/architecture-retrofit-patterns.md`) — 3 new ESTABLISHED lessons: #10445 (spawn-site count as primary predictor), #10447 (router-with-conditional-bypass), #10448 (shared-helper hoist sub-variant catalog + Track 5 wire-shape table appendix + module-singleton carry-forward). Manifest entry summary + key_lessons + codified_at_milestone all updated.
- **Failure-mode contracts** (`docs/failure-mode-contracts.md`) — 1 new ESTABLISHED lesson: #10446 (multi-catch helper for chokepoint denials). Manifest entry summary + key_lessons + codified_at_milestone updated.
- **Security chokepoints** (`docs/security-chokepoints.md`) — 1 new ESTABLISHED lesson: #10449 (execFile vs shell-exec audit target accuracy). Manifest entry summary + key_lessons + codified_at_milestone updated.
- **CLAUDE.md** — regenerated via `npm run render:claude-md`. All three updated entries render the new content.

## Cross-references to related disciplines

- Architecture-retrofit patterns: existing #10414, #10416, #10426, #10440, #10444 + new #10445, #10447, #10448.
- Failure-mode contracts: existing #10427, #10437, #10442 + new #10446.
- Security chokepoints: existing #10414, #10426, #10427, #10433, #10441 + new #10449.
- KNOWN_UNWIRED ledger discipline (#10432, #10434, #10443): SUSTAINED. Both Process + Egress KNOWN_UNWIRED held at 0 across the v868-v882 campaign close; this ship codifies disciplines that emerged FROM the migration without changing the ratchet-ledger state itself.
- Meta-cadence (#10428): SUSTAINED. v883 is 15 ships past v868 codify (5 over the 7-10 band's upper bound). The flex is acceptable when active chip-clusters accumulate candidates; the floor is the harder constraint.

## Forward path

**No specific next-ship target** — the v868-v882 campaign is fully closed (15 ships + this codify follow-through). Options:

1. **NASA forward-cadence at 1.179** — per the v882 retro's "strong default for the next session" recommendation. The pressure-margin record now sits at 101 consecutive ships at 1.178; a degree advance would consume this margin.
2. **LoaderContext chip-down opening** — the third Tier-E chokepoint surface; majority-wired since v782 but no KNOWN_UNWIRED ratchet-ledger has been opened on it. The v868-v882 campaign's wire-shape catalog (now codified) makes a LoaderContext campaign turnkey.
3. **Counter-cadence cleanup-mission** — the 6th counter-cadence ship landed at v838; the next "every ~30 forward milestones" counter-cadence is overdue per #10168 / #10169. Operational debt has been accumulating; an operator-directed cleanup-mission could land 5-8 deterministic gates from accumulated below-threshold observations.
4. **Bounded-learning verify-axis chip** — the v882 tool flagged 0 OVERDUE thresholds but 2 UNWIRED (`token_budget.max_percent`, `observation.retention_days`). Wiring these would close the second-30-minutes path on the verify-axis (#10438) and validate the CLI manual + substrate auto-emit duality (#10439).

Operator picks at session N+1.
