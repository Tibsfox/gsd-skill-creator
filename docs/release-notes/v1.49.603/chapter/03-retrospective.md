# v1.49.603 — Retrospective

## Carryover lessons applied

### From v1.49.585 (counter-cadence pattern — first instance)

v1.49.585 was the first counter-cadence operational-debt milestone — converted 5 categories of prose discipline (self-mod-guard, git-add-blocker, citation invariants, idempotent chapter writes, pre-push completeness) into deterministic gates. v1.49.601 followed the same pattern surgically (1 category, 1 tool, 1 new pre-tag-gate step). v603 follows it again (1 drift class, 2 sub-checks composed under existing step 6, 1 new env-var override). The pattern proves repeatable across three distinct structural-canonical drift classes — the substrate for #10244 ESTABLISHED at observation #3.

### From v1.49.601 (#10244 candidate emitted)

v601 close emitted the #10244 candidate: "when post-ship operator discovery surfaces a silent-drift class of failure that no existing gate catches, ship a focused counter-cadence milestone rather than fix-and-continue." v603 is the third instance that ratifies the pattern. Build the gate + ship the gate + don't stash it. v601's prose anchored the discipline; v603's ship promotes it to ESTABLISHED.

### From v1.49.602 (#10242 ESTABLISHED + reaffirmations)

v602 promoted #10242 (cross-track substrate convergence as opportunistic substrate-emergent finding type) to ESTABLISHED at observation #3 and reaffirmed #10231 / #10232 / #10233 / #10236 / #10237 in nominal direction. None of those lessons are exercised at v603 (no engine-state work; no W1 substrate research; no W2 4-track build). They carry forward unchanged. v603 is a pure operational-debt ship; substrate-side ESTABLISHED lessons accumulate observations only at engine-cadence milestones.

### From v1.49.596 (#10221 ship-sync ESTABLISHED)

`npm run ship-sync` is canonical post-main-merge step. Will fire twice at v603 ship (after dev→main merge, and after RH-refresh sync merge). Idempotent FF.

### From v1.49.599 + v1.49.600 + v1.49.601 + v1.49.602 (#10239 lab-director G3-boundary)

Lab-director sends "G3 GATE QUALITY-BAR PASS — awaiting operator authorization via team-lead. HOLD." NEVER auto-authorizes. v603 honors the discipline; this is the 5th operational test of the patched briefing (v599 + v600 + v601 + v602 + v603). Patch holds across all 5 applications.

### From v1.49.600 + v1.49.602 (#10233 Tier-2 inline-Opus W2 path ESTABLISHED)

v603 is built primarily inline + via 1 sub-agent (the depth-audit gate-extension build). Counter-cadence milestones don't need the full 4-track W2 envelope — they're surgical. The Tier-2 inline-Opus path is the appropriate vehicle for gate-authoring work.

### From v1.49.602 (#10243 RESOLVED — W2 cross-sibling-read template patch)

The #10243 patch from v600 close + v602 first-MANDATORY-application is now part of the standing W2 dispatch protocol. v603 W2.1 adds a new HARD RULE section to the same template (`.planning/missions/template-files/W2-build-agent-prompt.md`) without overlap or conflict — the new rule (canonical 8 Track cards + nav-card scaffolding presence) is additive to the existing rule (sibling-read for cross-track sections). Both rules apply to every W2 NASA build agent; neither subsumes the other; the template grows by composition, not by replacement.

## New observations applied

### The "post-ship operator discovery → spec prevention → counter-cadence ship → gate enforces" pattern is now standing operational practice

v603 demonstrates the same tight operator-in-the-loop pattern as v585 + v601: drift discovered post-ship by operator browsing live URL → spec proposed → operator authorizes prevention scope → counter-cadence milestone opens + ships in compact envelope. The pattern's structural property is that each instance closes one prose-rule that was load-bearing-but-unenforced. The discipline has now reproduced across three distinct drift classes; the cadence is not accidental.

The hot-fix side of the pattern at v603 (operator hot-fixed all six affected NASA pages in-place across 1.76–1.81 immediately post-v602 ship) demonstrates the response side; the gate-extension at v603 demonstrates the prevention side. Both halves are operator-authorized; both are required to close the class permanently.

### Six-milestone drift accumulation is the longest-soak signal yet observed

v585's drift class spanned ~4 milestones (v582–v585 release-notes structure dropouts). v601's drift class spanned 3 milestones (v598/v599/v600 catalog-index entries missed). v603's drift class spans 6 consecutive milestones (1.76 through 1.81). The longer-soak signal is structurally informative: prose discipline alone arrests drift only when the prose rule is read often (e.g., the W2 build template is read at every NASA-degree W2 dispatch — 6 reads across 6 milestones — yet the scaffolding requirement was not enforced because the rule was not in the template). A deterministic gate enforces every dispatch independent of read frequency.

### The retroactive sweep is informative but should not be remediation-mandatory

Running the new gate against all 81 NASA degrees surfaced 4 pre-existing historical drifts (1.34 / 1.36 / 1.57 / 1.75). These pre-date the gate; they would not have been caught by any prior gate; they are not symptoms of v603's specific drift class but rather of older structural-canonical evolution. The right disposition is documentation-only at v603 — gate runs against `--current` only; historical pre-gate drift is carry-forward for operator decision at v604+. This composition pattern is the substrate for the new candidate **#10245**.

**Candidate forward-lesson #10245:** when introducing a new deterministic gate, the retroactive sweep across all existing artifacts is a transparency measure (surfaces pre-existing drift the gate would have caught had it existed earlier), NOT a remediation requirement. Documenting the sweep findings as known-historical preserves the counter-cadence boundary (gate-authoring milestone scope stays compact); operator schedules retroactive cleanup at a separate counter-cadence (or accepts as-is) rather than expanding the gate-introduction milestone. Soak through v604+ for promotion. ESTABLISHED at 3rd instance — would require future gate introductions to also surface and document historical drift without remediating in the gate-introduction ship.

## Trust-budget observations

- **Sub-agent fabrication risk lower for sub-check authoring than for narrative authoring.** v600 W2.NASA had cross-track fabrication caught at orchestrator grep (Steller's Jay + Marvin Gaye instead of Gray Whale + Nilsson Schmilsson). v603 W1 sub-check authoring had no equivalent fabrication risk because the spec was deterministic (count regex matches; emit threshold disposition). The token budget reflects this: v603 W1 build agent cost ~80–100K tokens for ~150 lines of new code + 10 hermetic test cases.

- **Calibration against on-disk evidence is high signal.** The hermetic test fixtures at v603 W1.3 mirror the pre-hot-fix state of real degrees (1.76 → 4 cards; 1.77 → 0 cards; 1.78/1.80/1.81 → 6 cards). The threshold ladder (8/8 PASS / 6-7 WARN / <6 BLOCKER) is calibrated against observed drift evidence, not theoretical reasoning. This is the cleanest possible calibration discipline: when a gate is introduced in response to drift, the drift state itself becomes the test fixture; the gate's behavior on the drift fixture is a self-validating regression test.

- **Composition under existing step is a quieter pre-tag-gate evolution.** v601 grew the gate vertically (step 7 → step 8). v603 grows it horizontally (step 6 sub-check count 1 → 3). The vertical pattern is more visible (operator sees "8 steps" in pre-tag-gate output); the horizontal pattern is quieter (step 6 just runs more checks internally). Both patterns are structurally valid; the choice depends on whether the new sub-check is conceptually a depth-audit-extension (compose under step 6) or a new dimension entirely (add a new step). v603's sub-checks are scaffolding-presence checks under depth-audit; horizontal composition was the right call.

## What's open at v603 close

- **#10244 PROMOTED to ESTABLISHED at G3.** Future post-ship operator-discovered silent-drift classes follow the counter-cadence pattern as standing operational practice. Watch conditions for ESTABLISHED reversal: if 2 consecutive post-ship discoveries opt for hot-fix-without-gate (treat the drift as one-off rather than a class), revisit the discipline.
- **#10245 candidate** for ratification at v604+ (or later): historical-drift-sweep-at-gate-introduction pattern.
- **4 historical track-card drifts** (1.34 / 1.36 / 1.57 / 1.75) — operator decision at v604+ on whether to schedule retroactive cleanup pass.
- All v602 carry-forward items still active (5+4 §6.6 watchlist · #10238 deferred · #10240 deferred · #10241 lookback · #10243 RESOLVED with continuing soak).
- TRS M1 W2 next-pack binding pass deferred to v604+ W0.
