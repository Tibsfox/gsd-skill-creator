# Retrospective — v1.49.568

## Lessons Learned

1. **Concept panels benefit from an ~350-char-per-panel first-draft target** — Plan 01's over-length Rule 1 trim was the tuition; Plans 02+ adopted the target and shipped clean. CONCEPT-AUTHORING.md now codifies the 200-500 char range.
2. **`featureFlags.<name>` default-off is the right posture** for extensions to live simulation code — zero risk to existing behavior, explicit opt-in preserves auditability. Both Phase 681 flags ship off; dual-flag-on 100-step run is NaN-free.
3. **Pandoc + MathJax + section-map YAML** is a workable research-publication spine — Phase 680's `scripts/publish/` demonstrates that the Drift milestone can use the same pipeline verbatim.
4. **Pragmatic plans beat exhaustive plans for tightly-scoped phases** — Phases 680, 681, 682, 683 each closed in a single gsd-executor spawn because the milestone-package's 02-test-plan.md + 00-milestone-spec.md provided the constraints directly. For phases with 10+ plans (like 679), the full discuss/plan cycle still pays off.
