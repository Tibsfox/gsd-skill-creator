# v1.49.601 — Retrospective

## Carryover lessons applied

### From v1.49.585 (counter-cadence pattern)

v1.49.585 was the first counter-cadence operational-debt milestone — converted 5 categories of prose discipline (self-mod-guard, git-add-blocker, citation invariants, idempotent chapter writes, pre-push completeness) into deterministic gates. v1.49.601 follows the same pattern surgically: 1 category, 1 tool, 1 new pre-tag-gate step. The pattern proves repeatable.

### From v1.49.596 (#10221 ship-sync ESTABLISHED)

`npm run ship-sync` is canonical post-main-merge step. Will fire twice at v601 ship (after dev→main merge, and after RH-refresh sync merge). Idempotent FF.

### From v1.49.599 / v1.49.600 (#10239 lab-director G3-boundary)

Lab-director sends "G3 GATE QUALITY-BAR PASS — awaiting operator authorization via team-lead. HOLD." NEVER auto-authorizes. v601 honors the discipline.

### From v1.49.600 (#10233 Tier-2 inline-Opus W2 path ESTABLISHED)

v601 is built primarily inline + via 1 sub-agent (the tool-build agent). Counter-cadence milestones don't need the full 4-track W2 envelope — they're surgical.

## New observations applied

### The "live-site post-ship discovery → counter-cadence ship" pattern

v601 demonstrates a tight operator-in-the-loop pattern: drift discovered post-ship by operator browsing live URL → spec proposed (B + C options) → operator authorizes both → counter-cadence milestone opens + ships same-day. Closes the drift class permanently. Worth pattern-naming for future surfaces.

**Candidate forward-lesson #10244:** when post-ship operator discovery surfaces a silent-drift class of failure that no existing gate catches, the right response is a focused counter-cadence milestone (matching v1.49.585 pattern) — not "fix and continue" — because the gate addition is the prevention, and the gate must be exercised by a real ship to validate it lands cleanly. Build the gate + ship the gate; don't stash it.

## Trust-budget observations

- **Sub-agent fabrication risk lower for tool builds than narrative builds.** v600 W2.NASA had cross-track fabrication caught at orchestrator grep (Steller's Jay + Marvin Gaye instead of Gray Whale + Nilsson Schmilsson). v601 W0 tool-build had no equivalent fabrication risk because the spec was deterministic (read on-disk, write JS Set). The token budgets reflect this: v600 W2.NASA cost ~245K tokens (build + fix-up); v601 W0 tool-build cost ~119K tokens for ~5x more substantive deliverable.

- **Retroactive --check passing on first run is high signal.** The tool's first invocation against full repo state showed zero drift across all 3 tracks (81 NASA degrees / 81 MUS degrees / 81 ELC degrees, all matching). This validates two things at once: (a) the tool is correctly implemented, (b) the operator's hand-fix at v600+1 was correct ground truth. If retroactive --check had shown drift, we'd have had to investigate whether the tool was wrong or the hand-fix was wrong — a confounded signal. Zero-drift first-run is the cleanest possible verification.

## What's open at v601 close

- **#10244 candidate** for ratification at v602+: counter-cadence-on-post-ship-discovery pattern.
- All v600 carry-forward items still active (5 §6.6 watchlist · #10238 deferred · #10240 deferred · #10243 prompt-template patch).
- v600 #10243 prompt-template patch is **not** addressed at v601 (not in scope for catalog-index work; will land at v602+ as a separate small ship or fold-in).
