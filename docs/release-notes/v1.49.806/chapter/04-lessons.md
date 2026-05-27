# 04 — Lessons Learned: v1.49.806

## 0 new lesson IDs promoted; 3 lessons cross-referenced into new domain; 3 NEW tentative observations

v806 is a tooling ship (substrate addition, not codification). No new lesson IDs are promoted; instead, existing lessons #10414 (chokepoint retrofit pattern), #10426 (second-class-instance extraction), and #10427 (failure-mode contracts) are cross-referenced into the new "Security chokepoints" domain in disciplines.json.

## Lessons applied at v1.49.806

### Forward applications (already ESTABLISHED)

- **#10412 — Recon-first as default.** 19th consecutive application. Saved ~30 min of wrong-direction work (initial assumption was that audit harness = CLI tool in `tools/`).
- **#10414 — Optional `ctx?` parameter chokepoint retrofit.** Direct application: both new surfaces follow the three-state pattern (undefined → permissive / default → audit-only / restricted → enforced) verbatim. Zero call-site churn at existing sites.
- **#10422 — Verdict-pattern surface separation.** Audit-test file is separate from type file for each chokepoint. Per-surface separation prevents cross-contamination of test data (egress KNOWN_UNWIRED vs process KNOWN_UNWIRED).
- **#10423 — Lightest wire that satisfies the verdict.** Three concrete refusals:
  - No `SecurityChokepoint<Op>` generic abstraction (3 sibling modules instead).
  - No CLI audit tools in `tools/security/` (vitest test-as-audit instead).
  - No mass-migration of 30+ callers (KNOWN_UNWIRED allowlist instead).
- **#10424 — Adoption-refresh AFTER bump.** Applied at T14 step 11. 13th consecutive ship.
- **#10426 — Cross-class registry extraction at SECOND class instance.** Applied as a refusal: instances 2+3 arrived simultaneously, but the surfaces are genuinely different (path / URL / command+argv allow-list semantics). Refused to abstract; ship three siblings, observe at instance 4. The non-abstraction decision is itself a discipline data point.
- **#10427 — Failure-mode contracts.** Caught a real bug at wire time. The osv-client.ts `ensureEgressAllowed()` placement initially went inside the network-failure try/catch, which would have made `EgressContextDenied` propagate as graceful "0 vulnerabilities" degradation. Re-reading the diff surfaced the swallow risk; hoisted the call OUT of the try block. One real bug caught per application = the discipline pays for itself.
- **#10415 — Deferred-maintenance escalation.** Closed the v782 loader-context.ts docstring forward-reference (~24 ships escalated to v806). Within the 1-2-milestone closure target *only because* the ship was already touching loader-context.ts. The wedge would have continued to drift had this ship not landed; the drift detection mechanism (operator notice during recon) is currently ad-hoc.

### Cross-references emitted into disciplines.json

The new "Security chokepoints" entry cross-references three existing lessons:

- **#10414** — chokepoint retrofit pattern. Three concrete implementations now exist (Loader / Egress / Process).
- **#10426** — second-class-instance extraction. The sibling-modules-not-generic decision is the load-bearing application.
- **#10427** — failure-mode contracts. The "denials propagate" anti-pattern is highlighted in `docs/security-chokepoints.md` and was the source of the one real bug caught this ship.

## Tentative observations emitted this ship (3 NEW)

### (NEW v806) Chokepoint pattern at 3 instances — promotion-ready in 1 more

LoaderContext (v782), EgressContext (v806), ProcessContext (v806). The three chokepoints share a common shape but specialize their targets. Per #10426, the SECOND class instance is the right moment for abstraction — but here, instances 2+3 arrived simultaneously and the decision was to NOT abstract (siblings, not parameterizations). A 4th instance (e.g. environment-variable read chokepoint, file-write chokepoint, dns-resolve chokepoint) would force the abstraction question. Carry forward.

**Provisional rule:** at 3 sibling instances with deliberate non-abstraction, document the discipline (this ship's `docs/security-chokepoints.md`) and the data point. At a 4th instance, re-evaluate.

### (NEW v806) `KNOWN_UNWIRED` allowlist as migration-debt ledger

The v806 audit harnesses introduce a new pattern: a hardcoded set inside the audit-test file that captures grandfathered existing call sites. Operators see migration debt directly in the test source; chipping down the list is a one-line edit per migration. The pattern was forced by the chokepoint introduction at 30+ unwired call sites — too many to wire in one ship, too few to need separate JSON storage.

**Provisional rule:** when introducing a chokepoint to a surface with ≥10 existing unwired callers, use an inline `KNOWN_UNWIRED` allowlist in the audit test rather than mass-migrating or auto-promoting to a CLI/JSON ledger. Promote to a richer ledger only if the allowlist exceeds ~50 entries or operators need filtering/sorting.

Carry forward; a second instance (e.g. if S2's adoption telemetry needs the same shape) would name the pattern.

### (NEW v806) STATE.md normalizer drift recurrence — argues for S5

v805's hand-authored STATE.md contained ~2 lines of canonical-form drift (long milestone_name + verbose status string). The drift was caught at vitest time by `v1-49-635-meta-test.test.ts::C6`. v805's handoff claimed clean test counts, suggesting either the test was skipped at v805 T14 or the drift was introduced after T14.

**The discipline gap:** STATE.md normalizer (`tools/state-md-normalizer.mjs --check`) is NOT currently part of pre-tag-gate. It runs only inside the vitest suite. This means drift can pass T14 if the suite isn't run; the v805 handoff implies this happened.

**Forward-shadow:** S5 from the audit retrospective names a `tools/project-md-normalizer.mjs` (analogous to STATE.md). Including BOTH normalizers in a pre-tag-gate step (step 14 was the audit retrospective's recommendation) would close the recurrence class. This observation argues for S5 being the next tooling-class lever to land.

Carry forward.

## Lessons-learned database state

- **Total lessons emitted to date:** 10430 (cumulative; unchanged this milestone).
- **Lessons promoted this milestone:** **0** (tooling ship; no new lesson IDs).
- **Lessons cross-referenced into new domain:** 3 (#10414 + #10426 + #10427 → "Security chokepoints").
- **Lesson candidates closed:** 0.
- **Open lesson candidate backlog:** 0 (UNCHANGED).
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** **19 → 20** (+1: Security chokepoints).
- **Tentative observations carried forward:** 8 (was 5; +3 from this ship — see above).

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10414** (chokepoint retrofit) — apply when adding a new sibling chokepoint or wiring a `KNOWN_UNWIRED` entry.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active.
- **#10425** — apply at every new bounded-learning math choice.
- **#10426** — apply at every SECOND class instance. **NEW guidance from this ship:** at 3 sibling instances with deliberate non-abstraction, document the rationale; re-evaluate at instance 4.
- **#10427** — apply at every accessory-vs-load-bearing surface choice. **NEW reinforcement from this ship:** security chokepoint denials are LOAD-BEARING; hoist `ensure*Allowed()` calls OUTSIDE any try/catch that swallows errors.
- **#10428** (Meta-cadence — newly ESTABLISHED v805) — apply at every counter-cadence ship's scope discussion.
- **#10429** (Substrate opt-in paths — newly ESTABLISHED v805) — apply at every new operator-facing substrate.
- **#10430** (Finer counter-cadence — newly ESTABLISHED v805) — apply at every counter-cadence cadence-shape decision.

## Tentative observations watchlist (carried forward)

- watch-loop tear-down race (v800)
- chained-session architectural-tax break-even (v798→v801)
- registry-abstraction cross-chain payoff (v798→v804; supporting #10426)
- 6th-mode-flag refactor trigger (v800-v804)
- codification-ship pattern at 4 instances (v784/v790/v802/v805; promote at 5th)
- **(NEW v806) Chokepoint pattern at 3 instances** (v782/v806/v806; re-evaluate abstraction at instance 4)
- **(NEW v806) `KNOWN_UNWIRED` allowlist as migration-debt ledger** (1 instance; pattern-name at 2nd)
- **(NEW v806) STATE.md normalizer drift recurrence** (argues for S5 priority)

## Forward backlog (post-v806)

Open lesson-candidate backlog: **0** (UNCHANGED).
Open tooling-class levers from 2026-05-26 audit: S2 (adoption telemetry weekly report) + S5 (PROJECT.md normalizer + STATE.md pre-tag-gate gate).
Forward-cadence engine state: NASA 1.179 (INTERSTELLAR-BOUNDARY obs#3) is the most visible open item — 23 consecutive ships at 1.178.
