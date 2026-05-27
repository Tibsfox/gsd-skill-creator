# Retrospective — v1.49.805

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 18th consecutive application. Read `counter-cadence-discipline.md` + `architecture-retrofit-patterns.md` + `failure-mode-contracts.md` + the disciplines.json schema BEFORE writing new docs. Recon surfaced: (a) the existing per-pattern four-field shape; (b) the `## Lesson #NNNN — <title>` append pattern; (c) where to insert S7 (in the existing counter-cadence doc) vs where to start a new doc (S3 and S4); (d) the disciplines.json schema fields. ~10 min recon → ~30-35 min build.
- **Lesson #10422 — Verdict-pattern surface separation.** 15th forward application. S3 + S4 each get their own NEW canonical doc rather than being appended to existing docs. S7 IS appended to an existing doc because it extends rather than creates a discipline. The decision rule, articulated this ship: if the new pattern shares ≥80% with an existing doc, append; if <80%, new doc. S3 is a wholly new framing (three-axis cadence balance); S4 is a wholly new audience (operator's second-30-minutes). S7 is a finer cadence on the same axis the existing counter-cadence doc already covers.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** 15th forward application. Resisted: tool-building for #10428's cadence-overdue check (deferred to forward-shadow inside the doc itself); unified meta-discipline registry; auto-generated CLAUDE.md. Chose: three doc edits + one manifest edit + one regen invocation.
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Twelfth consecutive ship.

## What Worked

- **Four-field shape transferred verbatim to S4.** The existing discipline docs use a recognizable four-field shape (when / why / pattern / cross-refs). For S4 (per-substrate entries), the equivalent four-field shape is what-it-unlocks / what-it-costs / opt-in-mechanic / when-to-defer. The pattern transferred cleanly without re-engineering.
- **`## Lesson #NNNN — <title>` append pattern is the lightest wire for S7-shape additions.** The existing counter-cadence doc has two append-pattern lessons (#10265, #10266); adding #10430 in the same shape was a one-edit operation. No restructuring of the doc; the lesson sections accumulate in order.
- **disciplines.json schema is the source of truth for CLAUDE.md.** Two new entries + one updated entry → `npm run render:claude-md` → CLAUDE.md inline-updated. No manual CLAUDE.md edit needed. The Operative Disciplines section is now 19 entries (was 17). This is the second clean compose ship at this surface (v802 was the first).
- **Forward-shadow in #10428's doc deflects the "build the CLI now" pressure.** The doc names what a programmatic cadence-overdue check would look like, but does not implement it. The discipline names the trigger (≥3 instances under the prose-check), which prevents premature tooling. This matches the v802 codification's forward-shadow pattern (`#10425` named "compute E_n/E_{n-1} by hand" before assuming a fixture works).

## What Could Be Better

- **The codification ship pattern is now at 4 instances (v784, v790, v802, v805) and is itself a candidate discipline.** A 5th instance would meet the codification readiness criterion. The repeated shape: recon → cluster candidates → write/extend canonical docs → update disciplines.json → regenerate CLAUDE.md → write 5-file chapter set → T14 ship. This is a meta-cadence-ship-shape worth naming, but the next codification ship is the right moment, not this one — promoting at instance 4 would skip the SECOND-class-instance rule (#10426).
- **No automated test for the new disciplines.** The cross-link audit step in pre-tag-gate covers internal links within the discipline docs, but there's no test that asserts "every entry in disciplines.json has a canonical_docs file that exists." A future codification ship could add that test as a discipline.
- **S3's cadence-overdue triggers are prose-only.** Each trigger has concrete numeric thresholds (≥5 candidates, ≥10 ships, ≥20 observations) that could be computed by a tool. But the prose check is sufficient until the third codification ship under this discipline (the SECOND-class-instance rule for tooling extraction).
- **The S4 doc is not yet exhaustive.** It covers the substrates from `docs/MODULE-DEFAULTS.md` but not every JSON-flag-gated module is named individually. The pattern names the schema; future ships add entries as substrates mature.

## Surprises

- **Wall-clock landed at ~30-35 min build + ~10 min recon.** At the low end of the codification-ship band (30-45 min). The shape was so well-determined by recon — three discipline docs in one ship is just three repetitions of an established authoring pattern.
- **S6 deferral was a clean operator choice.** Operator asked to defer S6 entirely rather than partially scope it. The codification ship's scope is bounded by which levers are codify-class (articulate discipline) vs tooling-class (implement chokepoint extension). S6 is tooling-class; it doesn't fit in a codification ship.
- **#10428 (S3) and #10429 (S4) are not adjacent in the audit's recommendation order.** S3 was §5.S3 in the audit; S4 was §5.S4. But they don't naturally pair — S3 is about cadence balance, S4 is about public surface. Bundling them under one codification ship is acceptable because both are codify-class, but the chapter set treats each as its own discipline.

## Lesson candidates emitted this ship

None this ship. v805 is the codification of three pre-existing candidates from an audit retrospective; no new candidates surface from a codification ship that is itself the closure of candidate-uncertainty.

## Tentative observation: codification ship pattern at 4 instances

The codification-ship shape has now been instantiated 4 times: v784 (8 lessons), v790 (7 lessons), v802 (3 lessons), v805 (3 lessons). The 5th instance would qualify as a codified discipline under #10426 (extract at the SECOND class instance — already past that; #10426's framing is "extract at the second; net positive at the third"). The pattern shape:

1. Recon: identify lesson candidates ready for promotion (clustered by domain).
2. Author / extend canonical docs (NEW for wholly new domains, APPEND for same-domain refinements).
3. Update `tools/render-claude-md/disciplines.json` — +1 per NEW domain or amended summary + new key_lesson per APPEND.
4. Regenerate CLAUDE.md via `npm run render:claude-md`.
5. Write 5-file chapter set.
6. T14 ship.

Carry forward as a tentative observation; do not promote to a codified discipline until a 5th instance lands (per #10426's third-instance-net-positive rule applied at a meta level).

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active.
- **#10425** — apply at every new bounded-learning math choice.
- **#10426** — apply at every SECOND class instance + every wired-vs-unwired split.
- **#10427** — apply at every accessory-vs-load-bearing surface choice.
- **#10428 (newly ESTABLISHED v805)** — apply at every counter-cadence ship's scope discussion.
- **#10429 (newly ESTABLISHED v805)** — apply at every new operator-facing substrate that has a meaningful opt-in mechanic.
- **#10430 (newly ESTABLISHED v805)** — apply at every counter-cadence cadence-shape decision (batched vs alternating).
- **(tentative) watch-loop tear-down race** — carry forward.
- **(tentative) chained-session architectural-tax break-even** — carry forward.
- **(tentative) registry-abstraction cross-chain payoff** — carry forward (supporting #10426).
- **(tentative) 6th-mode-flag refactor trigger** — carry forward.
- **(tentative NEW v805) codification-ship pattern at 4 instances** — carry forward; promotion at 5th instance.

## Verdict on v805 scope

The codification scope landed in ~30-35 min build + ~10 min recon. At the low end of the codification-ship band (30-45 min). All three levers had been articulated in the audit retrospective, so the codification was largely an exercise in translation from §5 prose into discipline-doc shape.

The chained-session pattern continues to validate: v804 (~30 min) + v805 (~45 min) = ~75-80 min total wall-clock for two ships that together close a +16-test consumer surface AND drain three codify-class levers from the backlog. Compared to two separate cold-start sessions, the chain compressed total wall-clock by ~30-40%.
