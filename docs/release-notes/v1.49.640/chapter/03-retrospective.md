# 03 — Retrospective: v1.49.640 Housekeeping Cluster #7

## What worked

### 1. Lesson #10199 closure-verification gate fired correctly at W0

The gate's whole point: don't manufacture work for already-closed CFs. v1.49.640 W0 ran the mechanical probe (`npm audit --audit-level=high --json`) against CF-7 BEFORE authoring C1 spec. The probe confirmed CF-7 was `still-real` — 4 advisories surfaced including the catalogued GHSAs. C1 proceeded with confidence rather than wasted exploration.

The gate also worked the OTHER direction for CF-9: the lightweight probe (file presence + content snapshot) confirmed `unchanged` status, validating the carry-forward routing without re-investigating the shape families.

**Cost:** ~5-10 min total W0 probe work.
**Value:** prevented any "is CF-7 still real?" speculation during C1 dispatch.

### 2. Operator-routing for the mid-component pivot was responsive

When path (b) `npm audit fix` was shown insufficient at C1 Stage 4 (only 1 of 4 advisories cleared), the team-lead surfaced the operator decision via a second AskUserQuestion with full data: phantom-dependency framing, hybrid (b)+(d) recommendation, alternative paths (c/d/e) listed.

Operator chose hybrid (b)+(d) in <1 minute of context-switch time. No multi-message back-and-forth required. The structured option framing made the decision tractable despite an unanticipated pivot.

### 3. Hidden-transitive recovery cycles were fast and forensic

When path (d) broke 14 test files, the recovery loop was:

1. `npx vitest run <one failing file>` → revealed missing package
2. `grep -rn "from '<pkg>'" src/` → confirmed direct usage
3. `npm install <pkg> --save` → declared as direct dep
4. Re-run vitest → check remaining failures

Each cycle took ~3-5 min. The pattern was straightforward and produced a useful generalization (the hidden-transitive guard added to `cf-closure-verification-templates.md`).

### 4. Companion-template file improved doc usefulness

The mission spec made the companion template at `docs/test-discipline/cf-closure-verification-templates.md` "optional Stage 3". Authoring it anyway proved worth the ~10 min cost: the templates are copy-paste-ready for future cluster authors, and they include a hidden-transitive guard that was directly motivated by C1's experience.

This generalizes Lesson #10196 (forward-note RECOMMENDATION discipline): the doc's own forward-applicability informs whether to author optional companions.

### 5. STORY-gate auto-fire continues working (3rd consecutive ship)

v1.49.638 C5 ordering fix has now triple-validated: v1.49.638 ship ✓ + v1.49.639 ship ✓ + v1.49.640 ship pending. Auto-fire requires zero manual intervention at T14 sequence. Lesson #10197 closure pattern is robust.

### 6. Post-ship refresh absorption pattern continues working (2nd consecutive cluster)

v1.49.638→.639 transition absorbed predecessor's RH+dashboard refresh as a clean first commit (`0f447684c`). v1.49.639→.640 transition did the same (`65d47b72e`). The pattern is now established convention; no per-cluster decision required.

### 7. Lean cluster scope produced clean ship outcome

v1.49.640 had 4 components vs v1.49.639's 7. The smaller surface meant fewer waves, fewer G-gates, faster wall-clock. The closure-verification gate forced a smaller cluster: by retiring or routing CFs upfront, the cluster only worked on what was real.

## What burned cycles

### 1. CF-7 hybrid path pivot cost ~10 minutes

Path (b) was the operator's natural first choice (lowest-risk active fix). The mission spec listed it. The dry-run looked safe. Reality: path (b) cleared 1 of 4 advisories. The mid-component pivot to hybrid (b)+(d) added ~10min of:
- Investigation grep work
- Origin-trace git log
- Second operator AskUserQuestion
- Hybrid commit-message authoring

**Mitigation candidate for future clusters:** add the hidden-transitive guard from `cf-closure-verification-templates.md` to C1 W0 as a STANDARD pre-flight step. Would have caught the fast-xml-parser + yaml issues at probe time instead of at vitest time.

### 2. Hidden-transitive recovery cycles cost ~10 minutes

Two cycles (fast-xml-parser + yaml) each cost ~5min of vitest run + grep + npm install + re-run. The pattern is well-understood; the cost is recoverable.

**Mitigation candidate:** the hidden-transitive guard at `cf-closure-verification-templates.md` describes the pre-flight check. Future Cluster #8+ should run it before any path-d-style root-dep removal. Forward-route as CF-12 (LOW priority tooling candidate).

### 3. Vitest cache invalidation cost ~5min per run

After the package-lock churn (4499 line deletions), the second vitest run took 306s vs the first run's 271s. The transform phase grew 81s → 95s. This is expected behavior — vitest re-transforms after dep changes — but it inflated the W1A iteration loop time.

**Mitigation:** no easy fix. Vitest cache invalidation is a deps reality. Future clusters with similar dep churn should expect ~5min cache penalty.

### 4. Reporter buffering hid in-progress vitest state

Running vitest with `| tail -10` in background buffered all output until process completion. During the ~5min runs, the output file appeared empty, requiring `ps -eo etime` checks to confirm progress. Wasted ~5min of operator clock-time on uncertainty.

**Mitigation:** future background vitest runs should drop the `tail` filter and let full output stream, OR use a JSON reporter that emits per-test results immediately. Doc this in the cluster #8 mission package if relevant.

### 5. Wakeup cadence mismatch with vitest duration

Scheduled wakeups at 240s, 90s, 180s, 300s, 90s, 150s — multiple of them fired before vitest completed. Each wakeup roundtrip cost ~30s of context-switching.

**Mitigation:** for vitest runs >5min, schedule first wakeup at 300s (matching prior-run duration), and use process-completion notifications as the primary trigger rather than wakeups. Wakeups serve as deadline-style fallbacks.

## Operator W0 decision trail

| Time | Decision point | Operator response | Component impact |
|---|---|---|---|
| ~04:08 | CF-7 closure path (a/b/c/d/e) | `b` (non-breaking) | C1 path b initial |
| ~04:13 | gsd-pi necessity inquiry | (informational) | C1 investigation revealed phantom |
| ~04:14 | CF-7 pivot (hybrid/whitelist/force/standby) | Hybrid (b)+(d) | C1 final path |
| ~04:55 | CF-8 routing (a/b/c) | (b) continue counter-cadence | Engine state UNCHANGED |
| (T14) | G3 ship authorization | (pending) | Ship trigger |

Total of 4 operator decisions in this cluster. None were blocking; each enabled the next agent dispatch.

## What forward improvements are surfaced

Discretionary, not blocking:

1. **`scripts/closure-verify-cf.mjs` tool** (per `MISSION-PACKAGE-DISCIPLINE.md` §1.7) — automates probe execution from `.planning/c0-cf{N}-record.md` templates. Reduces manual probe work to a single command per CF.

2. **Hidden-transitive guard automation** (per `cf-closure-verification-templates.md` §"Hidden-transitive guard") — pre-flight check that grep's src/ for any imports satisfied by a soon-to-be-removed dep's subtree. Would have caught fast-xml-parser + yaml at W0 instead of at vitest time.

3. **Vitest reporter improvement** — investigate JSON-line reporter for background runs to improve progress visibility.

All three are routed forward to Cluster #8 as discretionary CFs (CF-12). None block.

## Cumulative process-discipline status

Through 8 counter-cadence clusters (v1.49.585, .634, .635, .636, .637, .638, .639, **.640**):

- **Mission-package authoring discipline** — applied consistently; mission specs accurately scoped
- **Iterative dispatch (Lesson #10193)** — applied; sub-agent bounding observed; no token-ceiling terminations this cluster
- **Substrate-probe at W0** (Lesson #10192) — applied via grep-then-spec pattern; SUBSTRATE-PROBE-DISCIPLINE.md is the canonical doc
- **Closure-verification gate** (Lesson #10199, NEW this cluster as standing doc) — applied at v1.49.640 W0 for the first time; codified for future clusters
- **STORY-gate ordering** (Lesson #10197) — applied 3 ships running; no manual intervention needed
- **T14 atomic** (Lesson #10191) — applied; no mid-execution revisions
- **Ship-time directives atomic** — applied; no scope creep at T14
- **git-add-blocker split-commit** (Lesson #10201) — applied throughout this cluster's commits
- **gh CLI `--repo` arg in background** (Lesson #10202) — applied (not invoked this cluster but discipline in place)

8-cluster precedent demonstrates the cleanup pattern works at scale. No discipline regressed this milestone.
