# 04 — Lessons Learned: v1.49.716 Forward Lessons

## 1 candidate forward lesson emitted (#10408)

### Operational-discipline lesson (applies to NASA Canonical Sibling Files Restoration Campaign)

**Lesson #10408 (candidate) — Per-mission sub-agent rebuild pattern for substrate-era canonical sibling files.**
Severity: MEDIUM. First-instance observation at v1.49.716 STS-51-D Discovery rebuild. Single dispatch via Agent tool with `general-purpose` subagent_type produces a clean 13-file canonical mission rebuild within budget. Process: orchestrator authors a per-mission brief (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline); sub-agent reads brief + 4 reference pages + degree-sync.json (5 Read); writes 13 deliverables (13 Write); reports completion. Observed budget at v1.118: 36 tool uses (well under ~60-tool ceiling per memory `feedback_sub-agent-token-ceiling-iterative-dispatch`). Observed output: ~23,234 words across 13 files at v1.56 gold-standard depth target (not v1.117 latest-predecessor depth). Apply: future campaign-mission rebuilds follow the same template; mission-essentials block adapts per substrate-form-distinct mission class; deliverable table is fixed across campaign; reference-page paths block parameterizes per immediate-predecessor + gold-standard. Promotion-to-ESTABLISHED requires 3–5 clean campaign-ship observations across substrate-form-distinct missions (Shuttle-payload v1.118 = first; future ships at asteroid-orbit v1.163 + flagship outer-planet v1.164 + solar-observatory v1.166/167/168 would meet the threshold).

## Lessons-learned database state

- **Total lessons emitted to date:** 10408 candidate (cumulative since corpus inception)
- **Lessons emitted this milestone:** 1 candidate (#10408)
- **Lessons applied at v1.49.716 (from v1.49.715 + earlier):** 4 (#10168 counter-cadence cadence reuse + #10406 candidate positive-framing-dispatch + #10407 candidate dispatch-prompt-density + W3.5 chapter-gen bake-in)
- **Open lessons watchlist (apply at next opportunity):** #10408 candidate sustainment at v1.49.717+ campaign ship; #10406 / #10407 candidate sustainment via continued positive-framing + abstract-behavioral-guidance discipline across all future ships.

## Cadence + cumulative state

| Lesson | Severity | First observation | Cumulative count |
|---|---|---|---|
| #10168 — Counter-cadence cleanup-mission cadence | HIGH | v1.49.585 | obs#2 cumulative (v1.49.585 + v1.49.716) |
| #10401 — Mission-package discipline §3 | HIGH | v1.49.690 (approx) | obs#27+ cumulative |
| #10406 candidate — Positive-framing dispatch discipline | HIGH | v1.49.712 | obs#5 cumulative (v712 + v713 + v714 + v715 + v716) |
| #10407 candidate — Dispatch-prompt-density discipline | HIGH | v1.49.713 | obs#4 cumulative (v713 + v714 + v715 + v716) |
| W3.5 chapter-gen bake-in | (process gate) | v1.49.709 | obs#8 cumulative (v709 + v710 + v711 + v712 + v713 + v714 + v715 + v716) |
| #10408 candidate — Per-mission sub-agent rebuild pattern | MEDIUM | v1.49.716 | obs#1 first-instance |

## Notes on campaign-launch lesson dynamics

The v1.49.716 ship validates several sustained-cadence patterns simultaneously:

1. **Counter-cadence cleanup-mission cadence cycles successfully.** v1.49.585 was the first; v1.49.716 is the second. The 131-milestone gap exceeds the ~30-milestone reuse threshold registered with Lesson #10168, confirming that the pattern is operationally sustainable across long forward-cadence runs.

2. **Sub-agent dispatch discipline (positive framing + dispatch-prompt density) transfers cleanly to counter-cadence ships.** The disciplines registered at forward-cadence ships v712–v715 apply identically to the v716 counter-cadence rebuild dispatch. The brief structure adapts (per-mission rebuild brief vs forward-cadence mission brief), but the positive-framing + abstract-behavioral-guidance + zero-forbidden-token-enumeration disciplines are invariant.

3. **The v1.49.715 mechanical-patcher + canonical-layout-gate strategy is structurally complete but semantically incomplete by design.** The structural gate guarantees that future drift cannot ship; it does not guarantee that historical substrate-era missions match v1.0 canonical depth. The counter-cadence campaign closes the residual semantic gap one mission per ship. Both layers compose: the gate prevents new drift; the campaign closes historical drift.

4. **The brief template generalizes on first authoring.** v1.118's brief is reusable for v1.119+ campaign rebuilds with mission-essentials-block adaptation (vehicle / crew / payload / EVA / engine state from each mission's degree-sync.json) + reference-page-paths adaptation (immediate-predecessor + gold-standard). Future briefs will be mission-essentials-only authoring rather than full template reauthoring.
