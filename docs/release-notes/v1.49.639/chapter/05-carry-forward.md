# 05 — Carry-forward: v1.49.639 Housekeeping Cluster #6 → Cluster #7

This chapter inventories all carry-forwards from v1.49.639 to v1.49.640 (Cluster #7).

## Summary

**3 carry-forward items** routed from v1.49.639 to Cluster #7:

| ID | Type | Source | Priority |
|---|---|---|---|
| CF-7 | Security advisory | v1.49.639 CI Security Audit job failure | HIGH |
| CF-8 | Forward-cadence engine | Engine resumption after 7-cluster counter-cadence chain | LOW (decision-deferred) |
| CF-9 | Operational debt | Phase-2 cartridge shape families (multi-cluster abstract) | LOW (continued) |

This is the **smallest carry-forward inventory** in the 7-cluster chain. Prior clusters routed 3-6 CFs; v1.49.639 routes 3. Two factors:

1. v1.49.639 closed all 6 of its routed CFs (no defer-routings)
2. The new CFs surface from this milestone's findings, not predecessor inheritance

## CF-7: Security Audit job failure — npm audit malware advisory

**Type:** Security advisory (HIGH priority due to malware classification)

**Origin:** v1.49.639 CI run [25725466919](https://github.com/Tibsfox/gsd-skill-creator/actions/runs/25725466919) Security Audit job (job ID 75536973766) FAILED at "Check for HIGH and CRITICAL vulnerabilities" step.

**Surfaced advisories:**

| Advisory ID | Severity | Package | Description |
|---|---|---|---|
| GHSA-3q49-cfcf-g5fm | CRITICAL | `@mistralai/mistralai` (any version) | Malware classification |
| GHSA-p7fg-763f-g4gf | MODERATE | `@anthropic-ai/sdk` 0.79.0 - 0.91.0 | Insecure default file permissions in Local Filesystem Memory Tool |

**Dependency chain (per CI log):**

- `@mistralai/mistralai` ← `gsd-pi >= 2.10.11` ← (gsd-pi as transitive dep)
- `@anthropic-ai/sdk 0.79.0-0.91.0` ← `@anthropic-ai/claude-agent-sdk >= 0.2.91` ← (claude-agent-sdk as transitive dep)

**Mitigation paths (operator-decision at Cluster #7 W0):**

- **(a) `npm audit fix`** — non-breaking changes only. May not fully address the malware advisory (gsd-pi 2.10.10 was mentioned as breaking).
- **(b) `npm audit fix --force`** — includes breaking changes. Cleans the audit gap fully but introduces gsd-pi 2.10.10 (breaking change in a project we depend on).
- **(c) Replace dependencies** — investigate whether gsd-pi or claude-agent-sdk can be removed/replaced with non-vulnerable alternatives. Higher engineering cost but cleaner security posture.
- **(d) Whitelist the advisory** — npm audit allows pinning known-vulnerable versions if rationale exists. Lowest-risk action but persists the vulnerability.

**Recommendation for Cluster #7:** option (a) first (cheapest); if it doesn't clear the malware advisory, escalate to (b) or (c) operator-decision.

**Apply-to-self check (Lesson #10199):** at Cluster #7 W0, mechanically verify the advisories still exist (`npm audit --audit-level=high` against current `package-lock.json`). If `@mistralai/mistralai` has been removed or downgraded by upstream, CF-7 may close trivially.

**Expected Cluster #7 work:** ~30min-2h depending on chosen path.

## CF-8: Forward-cadence engine resumption candidate

**Type:** Engine forward-cadence routing decision

**Origin:** 7-cluster counter-cadence chain (v1.49.585 → .634 → .635 → .636 → .637 → .638 → **.639**) is the longest such chain in this codebase. Forward-cadence (NASA degree advancement) has been paused since v1.49.631 (last degree-advancing milestone).

**Decision-deferred:** v1.49.640 mission-package authoring time decides:

- **(a) Resume forward-cadence at v1.49.640** — STS-7 Sally Ride / Challenger NASA degree candidate per project-context memory
- **(b) Continue counter-cadence at v1.49.640** — absorb CF-7 (and possibly CF-9) as Cluster #8's primary scope
- **(c) Hybrid** — small forward-cadence content (e.g., a single MUS pack or SPS index advancement) alongside CF-7 closure work

**Recommendation:** depends on CF-7 scope. If CF-7 resolution is bounded (~30min-1h), option (c) hybrid is feasible. If CF-7 needs deeper investigation (~2-4h), option (b) continue counter-cadence is safer.

**Project-context inputs:**

- Per memory: STS-7 Sally Ride is the next NASA degree candidate
- Per memory: birds AND mammals SPS scope; SPS #105 is current
- Per memory: 360-degree Seattle engine state at degree 57 (separate engine)

**Expected Cluster #7 work:** mission-package authoring decision; 5-15 min routing.

## CF-9: Phase-2 cartridge shape families (continued)

**Type:** Abstract operational debt (multi-cluster carry-forward)

**Origin:** v1.49.636 C2 cartridge finalization shipped 41/48 chipsets migrated; 7 unfit chipsets across 4 shape families remain. Continued through v1.49.637 / .638 / .639 carry-forward chapters.

**Shape families per `.planning/cartridge-migration-phase2.md`:**

- A: chipset:-wrapped (heavily nested namespaces)
- B: gastown sectioned orchestration
- C: positional staff
- D: math-coprocessor stub

**Status:** unchanged. No work this milestone.

**Cluster #7 routing:** continue carry-forward unless operator decides Phase-2 is timely.

## Carry-forward priority routing

For Cluster #7 mission-package authoring:

- **PRIORITY 1 (must close):** CF-7 — Security Audit job failure (CI red on every push until closed)
- **PRIORITY 2 (decide):** CF-8 — forward-cadence engine resumption decision
- **PRIORITY 3 (continue):** CF-9 — Phase-2 cartridge shape families (no action expected this cluster)

## Closure-verification gate (NEW per Lesson #10199)

**Proposal for Cluster #7 W0:** before authoring component specs for CF-7 and CF-8, run mechanical closure-verification probes:

- **CF-7:** `npm audit --audit-level=high` against current `package-lock.json` to confirm advisories still exist
- **CF-8:** check upstream repos for STS-7 / Challenger source materials (per memory: NASA-series pattern usually requires research-mission generation first)
- **CF-9:** check `.planning/cartridge-migration-phase2.md` for any new entries or status changes

If any CF surfaces as already-closed (e.g., upstream released a non-vulnerable version), it can be retired without component-spec work.

This codifies Lesson #10199 prospectively. Expected to save ~1h cumulative attention at Cluster #7 W0.

## Forward-note RECOMMENDATION (per Lesson #10196 discipline)

**RECOMMENDATION:** v1.49.640 mission-package authoring should:

1. Run the closure-verification gate above as the FIRST W0 step
2. Decide CF-8 forward-cadence routing based on CF-7 scope (after closure-verification)
3. Update `.planning/STATE.md` to reflect v1.49.639 ship + v1.49.640 open

**RE-EVALUATION CRITERION:** if Cluster #7 closes CF-7 but produces a new CF-7+ chain (e.g., `npm audit fix` introduces breaking changes that need additional cluster work), reconsider whether Phase-2 cartridge work (CF-9) deserves its own dedicated cluster rather than another year of carry-forward routing.

**DECISION-TREE CUMULATIVE STATE:** 7 consecutive counter-cadence cleanups in the chain; CF-1 closure validates the pattern works at scale; CF-7 surface area is small relative to CF-1 was at peak. Cluster #7 trajectory looks healthy.
