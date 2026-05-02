# v1.49.594 Forward Lessons

## Numbered lessons emitted at v1.49.594 ship (carry-forward from v1.49.593 close)

### #10221 — Dev/main sync discipline after each main-merge

**Origin:** v1.49.593 close discovered 6-commit drift accumulated across 3 ships (v1.49.591 + v1.49.592 + v1.49.593; 2 merge commits per ship; merge commits exist only on main). `git merge --no-ff dev` on main creates merge commits that exist ONLY on main, not on dev. Across N ships, main accumulates 2N merge commits dev doesn't have.

**Forward-action fix shipped at v1.49.593 close (commit `1ac231baa`):**
- 3-line sync step added to CLAUDE.md HARD RULE: `git checkout dev && git merge --ff-only main && git push origin dev`
- pre-push hook advisory checks `git rev-list --count dev..origin/main` and warns when dev is behind (does not block; advisory only)

**v1.49.594 first-instance test:** APPLIED at every main-merge boundary in this ship pipeline (initial dev→main ship merge AND post-ship RH-refresh main merge). Target: 0-commit drift between dev and main at v1.49.594 close (vs 6-commit drift at v1.49.593 close).

**Soak target:** "ESTABLISHED" if zero-drift confirmed at v1.49.595/596/597 (3 instances). Then promote from "first-instance test" to canonical ship-pipeline step.

### #10222 — Card-population cross-link enforcement

**Origin:** Three milestones (v1.72/v1.73/v1.74) shipped with thin or empty Creative Artifacts / Runnable Simulations / Forest Contribution card lists despite artifacts existing on disk. Root cause: W2-prompt template enumerated artifact-suite categories + canonical h2 sections but NOT the `<li>` list enumeration inside each card.

**Three-criterion structural fix (DONE pre-open at v1.49.594):**
1. `tools/depth-audit.mjs` now verifies cross-link coverage (distinct-paths-referenced / files-on-disk); soak-mode FAIL→WARN downgrade at v1.49.594; flips to BLOCKER at v1.49.595+ via `--cross-link-strict`
2. W2-prompt template gained mandatory `<li>`-enumeration requirement + v1.69 worked example (commit `dcadc4c65`)
3. Carry-forward content fix shipped for v1.72/v1.73/v1.74 via parallel Sonnet sub-agents matching v1.69 gold pattern (29 + 16 + 28 cross-links; 100% coverage all 3 milestones)

**Pattern:** Matches successful v1.49.593 W0.2 (artifact-suite enumeration was the structural fix; #10213 closed). Forward-action structural fixes preempt their own future incidents (#10208 pattern continues).

**Soak target:** v1.49.595 ship runs `--cross-link-strict` flag in pre-tag-gate.sh; if soak clean (zero FAIL findings), gate hardens permanently at v1.49.596+.

## Forward lessons emitted at v1.49.594 (#10223 — #10226)

### #10223 — Rate-limit recovery via main-context dispatch

**Origin:** v1.49.594 W1bc TRS Wave 2b synthesis fork hit Anthropic per-account rate limit during Batch D dispatch (packs 15+16). Fork terminated; 6 of 8 packs completed within fork; 2 packs incomplete.

**Recovery pattern:** Main-context (Opus orchestrator) dispatched packs 15+16 fresh as Sonnet sub-agents ~10 min after fork termination. Both completed within ~5 min. The fork's rate limit applied to the FORK's account/quota state; main context can re-dispatch immediately with a different account/quota window.

**Forward action:** When fork hits rate limit mid-batch, recovery path is main-context fresh-dispatch of remaining work. Wall-clock impact: ~15 min added vs ~50 min total estimate. Document this as canonical recovery procedure parallel to mid-build 401 recovery (#10215).

**Watchlist:** does the fork-vs-main quota state distinction hold for all rate-limit varieties (per-minute, per-day, per-account), or only some? Track at v1.49.595+ if rate-limit recurs.

### #10224 — Fork-managed dispatch produces terser synthesis than direct dispatch

**Observation:** Wave 2b packs 09-14 (fork-dispatched within W1bc loop) came in at 2,900-4,000 words each vs Wave 2a target 5,000-6,000. Packs 15-16 (main-context fresh dispatch after rate-limit recovery) hit the 5,000-6,000 target.

**Hypothesis:** Fork-managed dispatch passes orchestration prompt context to sub-agents, possibly compressing the synthesis prompt's token budget allocation. Direct dispatch passes a clean prompt → sub-agent budgets the full target.

**Forward action:** For depth-sensitive work (multi-thousand-word synthesis), prefer direct main-context dispatch over fork-managed dispatch. Reserve fork for breadth-sensitive batched work where individual depth matters less. Document trade-off in W2-build-agent-prompt template.

**Soak target:** Wave 2c dispatch at v1.49.595+ (if applicable) to confirm direct vs fork dispatch depth delta.

### #10225 — Composite-pass trailing-median refinement candidate

**Observation:** v1.49.594 NASA hit 99% lines / 80% bytes vs v1.74 — composite-pass cleared this to PASS (lines ≥95% threshold). MUS+ELC hit 81% lines / 80-86% bytes — below 95% lines threshold; composite-pass did NOT activate; both stayed WARN.

**Root cause analysis:** v1.74 MUS hit unusually deep at 121% lines vs v1.73 (probably Tommy's rich track-by-track narrative); v1.75 MUS at 81% lines is "natural" sizing for Abbey Road, not regression. The single-milestone-predecessor comparison produces false-WARN signals when the predecessor was an outlier.

**Refinement proposal:** replace `lines ≥ 95% * predecessor.lines` with `lines ≥ 95% * 5-milestone-trailing-median.lines` for composite-pass eligibility. Dampens predecessor outliers. Requires implementing a 5-milestone median lookup in `tools/depth-audit.mjs`.

**Soak target:** v1.49.595 second soak confirms whether MUS/ELC at 81% is recurring pattern or one-off. If recurring at next 2 milestones, implement trailing-median refinement at v1.49.597 W0.

### #10226 — User-flagged drift catches Wave-2 synthesis depth gap that automated gates miss

**Observation:** No automated gate detected the Wave 2b synthesis depth gap (3,000 words vs 5,000-6,000 target). Pre-tag-gate steps 1-6 all pass with the shorter synthesis. The synthesis-quality threshold lives in the W1bc dispatch prompt (target word range), not in the post-ship audit.

**Pattern:** Mirrors #10220 (user-flagged drift catches structural fix that automated gates miss). Quality-floor signals in dispatch prompts are not validated post-build. Consider:
1. Automated post-W1bc word-count check against pack target ranges (script: `tools/wave-synthesis-audit.mjs --milestone 1.75`)
2. WARN if any pack drops below 80% of target word range
3. Soak-then-harden following same pattern as #10222 cross-link gate

**Forward action:** Implement basic word-count audit at v1.49.595+ W0 (similar shape to T2.1 #10222 fix at v1.49.594). Closes the Wave-synthesis-depth audit gap.

## Carry-forward candidates (held for v1.49.595 emission)

- **#10227 candidate** — multi-batch dispatch resilience (rate-limit recovery as designed pattern; document the fork-dispatch + main-recovery model as standard)
- **#10228 candidate** — Wave-3 fetch acceleration (5 packs 09/10/11/12/13 need closure analogous to pack-08 v1.49.594 W0.3; consider scheduling 1 pack per milestone counter-cadence)
