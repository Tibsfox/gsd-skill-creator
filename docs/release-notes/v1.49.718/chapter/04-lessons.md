# 04 — Lessons Learned: v1.49.718 Forward Lessons

## 0 new lessons emitted; 1 candidate eligible for promotion review

- **Lesson #10408 (candidate) — Per-mission sub-agent rebuild pattern.** Sustained obs#3 cumulative. Three substrate-form-distinct mission classes validated under the same brief template (Shuttle-payload v1.118 + Shuttle-Spacelab-science v1.119 + Shuttle-international-PS-multi-deploy v1.120). Lower-bound promotion threshold (3-5 observations) now MET. Recommend 2 more observations across substrate-form-distinct mission classes before promotion to ESTABLISHED.

## Sustained obs#N+ cumulative

| Lesson | Severity | Cumulative obs |
|---|---|---|
| #10168 counter-cadence cleanup cadence | HIGH | obs#3 (v585 + v716 + ongoing campaign) |
| #10406 candidate positive-framing dispatch | HIGH | obs#7 (v712-v718) |
| #10407 candidate dispatch-prompt-density | HIGH | obs#6 (v713-v718) |
| #10408 candidate per-mission sub-agent rebuild | MEDIUM | obs#3 (v716 + v717 + v718) |
| W3.5 chapter-gen bake-in | (process gate) | obs#10 (v709-v718) |

## Promotion progress for Lesson #10408 candidate

| Substrate-form-distinct mission class | Observed at |
|---|---|
| Shuttle-payload-deployment | v1.118 (v1.49.716) |
| Shuttle-Spacelab-microgravity-science | v1.119 (v1.49.717) |
| Shuttle-international-PS-multi-deploy-plus-free-flyer | v1.120 (v1.49.718) |
| (Future) Mars-orbiter / outer-planet-flagship / solar-observatory | TBD |
| (Future) crewed-lunar / cargo-resupply / interplanetary-cruise | TBD |

Recommend: 2 more substrate-form-distinct observations (5 total) before ESTABLISHED promotion to satisfy higher-bound rigor.

## New observation: brief-discipline cross-track suppression

The v1.120 brief explicitly instructed sub-agent to suppress ELC-cross-track regeneration (politically-charged contemporary event registered at v662 ship). Sub-agent followed cleanly. Pattern observed:

- Brief-author can constrain rebuild deliverable scope based on cross-track sensitivity
- Sensitive cross-tracks referenced in `retrospective/lessons-carryover.json` lessons_inherited only
- No per-deliverable rules needed; brief-level instruction sufficient

Not yet a numbered Lesson (single observation); register if pattern reused in future campaign rebuilds.
