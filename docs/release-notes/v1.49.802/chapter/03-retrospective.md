# Retrospective — v1.49.802 (Codification Ship)

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 15th consecutive application since v784 codification. ~10 min of recon on `tools/render-claude-md/disciplines.json` + `docs/release-notes/v1.49.784/chapter/04-lessons.md` + `docs/release-notes/v1.49.790/chapter/04-lessons.md` surfaced the natural 3-cluster grouping (one extension into an existing domain + two new single-lesson domains). Avoided the trap of a single mega-doc covering all three lessons, AND the opposite trap of three new disciplines when one of them belonged in an existing one.
- **Lesson #10422 — Verdict-pattern surface separation.** 12th forward application. Three disciplines, three separate canonical doc files. The failure-mode contracts doc deliberately does NOT cross-reference the bounded-learning calibration doc beyond the e-process trap example — each evolves independently.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** 12th forward application. Rejected three alternative shapes during recon: (a) single mega-doc covering all three lessons, (b) "T1.1 lessons" umbrella discipline, (c) folding #10425 into the existing Static-analysis tool authoring discipline as the technically-lightest wire. All three would have shipped temporary structures that subsequent codification ships would have had to unwind.
- **Lesson #10424 (ESTABLISHED v794) — Adoption-refresh AFTER bump.** Applied. Ninth consecutive ship under the active gate.
- **Lesson #10415 (ESTABLISHED v784) — Deferred-maintenance escalation.** Applied. The 3-candidate backlog was crossing the v784/v790 codification threshold (5-8 candidates) accounting for the tentative observations carrying forward. Closing it at v802 honors the discipline being applied.
- **#10426 candidate (v798) — APPLIED implicitly at every disciplines.json edit.** The disciplines.json file IS the per-class registry of operative disciplines, and the v802 codification adds two new "classes" (Bounded-learning calibration; Failure-mode contracts) to it. The registry was already extracted at v585 (`tools/render-claude-md/disciplines.json` introduction); v802 is the 16th and 17th class instances. The lesson being promoted by this ship is structurally the same operation the ship is performing.

## What Worked

- **Cluster-grouping was the right meta-decision.** The 3 candidates fell into 2 new domains + 1 extension naturally. No discipline boundary was forced. Each new domain has a clear single-question scope (Bounded-learning calibration: "what math primitive to use?"; Failure-mode contracts: "loud or silent?"); the extension dropped into Architecture-retrofit patterns alongside two existing sibling lessons.
- **Cross-references between new disciplines work.** The bounded-learning calibration doc cross-references the architecture-retrofit-patterns doc for #10426 (per-class registry extraction is genuinely architectural-retrofit, not bounded-learning-specific). The failure-mode-contracts doc cross-references nothing — it stands alone.
- **Recon predicted the manifest-entries delta.** Recon: "15 → 17 (+2)" predicted in the v801 forward path; ship: exactly 15 → 17. The plan-as-written was the plan-as-executed. No mid-ship pivots.
- **`npm run render:claude-md` is the single source of truth for CLAUDE.md.** No hand-edits to CLAUDE.md required; the manifest is the only place we wrote. Avoided the trap of drifting between disciplines.json and CLAUDE.md.

## What Could Be Better

- **Two tentative observations carried forward (no codification).** The watch-loop tear-down race observation (v800) and the chained-session architectural-tax break-even observation (v798→v799-801) both have less-than-three-instance evidence. They are documented in v801's 04-lessons.md as "(tentative) NOTE" entries and remain in the carry-forward stack. Promotion path: a future ship that hits the same shape OR an explicit codification call. Not a problem with this ship; a note for tracking.
- **No #10428 candidate emitted.** The "chained-session architectural-tax break-even" observation almost reached candidate-emission threshold during v801 retro but was held back pending one more cross-class registry chain for validation. The bar between "tentative observation" and "candidate" remains useful — the v800/v798 observations are early signals but the empirical case is still N=1 chain. Worth watching for whether the next chained session (e.g. v803-v807) produces a second instance.
- **No `src/` changes triggers no test growth.** Codification ships intentionally don't add code; the discipline-coverage milestone has zero test delta. The pre-tag-gate's discipline-coverage step will reflect the new domains but the vitest suite is unchanged. Acceptable per v784/v790 precedent.

## Surprises

- **Three candidates fit naturally into two new domains.** The cluster-grouping recon found two "single-lesson new disciplines" (Bounded-learning calibration anchored by #10425; Failure-mode contracts anchored by #10427) plus one extension (#10426 into Architecture-retrofit patterns). The natural grouping was visible in ~5 min of recon. v784 and v790 both ended with the same "2-3 new domains + 0-1 extensions" shape — codification ships fit the same cluster-grouping pattern across all three.
- **CLAUDE.md regeneration was a one-liner.** No drift, no manual fixups. The render tool has paid for itself across v784 + v790 + v802 (three codification ships now).
- **The discipline being promoted at v802 (Lesson #10426) was applied during v802 itself.** Adding two new classes to the disciplines.json registry IS the second-class instance abstraction the lesson is about. Self-referential validation. Not staged for any explicit narrative — just emerged from the structure.

## Lessons applied at v1.49.802 (from v1.49.795-801 and earlier)

- **#10412** (recon-first) — applied. 15th consecutive.
- **#10415** (deferred-maintenance escalation) — applied (closing the candidate backlog at this point honors the discipline; the v798-v801 candidates were already at the v784/v790-precedent threshold).
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — applied to discipline-doc authorship.
- **#10424** (Adoption-refresh AFTER bump) — applied (T14 step 11).
- **#10425 (NEWLY PROMOTED)** — applied implicitly: codification IS the promotion mechanism. Future bounded-learning ships now have a backing canonical doc.
- **#10426 (NEWLY PROMOTED)** — applied during ship itself: disciplines.json grew by two classes; this is the second-instance-of-second-class extraction the lesson is about. Self-referential validation.
- **#10427 (NEWLY PROMOTED)** — applied during chapter authorship: the v802 chapter-set's structure mirrors the v784 and v790 codification chapter-set structure, all best-effort silent on render failures (regenerate is idempotent on re-run).

## Lesson candidate emitted this ship

None. v802 closes the backlog; no new candidate surfaces from a pure codification ship.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start.
- **#10422-#10423** (Verdict-pattern surface separation + lightest wire) — apply at every extension.
- **#10424** (Adoption-refresh AFTER bump) — gate is active on every ship.
- **#10425 (NEWLY ESTABLISHED)** — apply at every bounded-learning math choice; particularly when adding a new threshold class or extending the loop to continuous bounded observations.
- **#10426 (NEWLY ESTABLISHED)** — apply at every SECOND instance of a class-typed family. The v803 ship is the natural next test: wiring the real token-budget observation source will exercise the per-class registry abstraction at the third class (`token-budget-events` becoming a wired source rather than an unwired stub).
- **#10427 (NEWLY ESTABLISHED)** — apply at every accessory-vs-load-bearing design choice. v803 will likely surface this: the token-budget event log writer is accessory (best-effort silent) while the underlying enforcement is load-bearing.
- **(tentative) watch-loop tear-down race** — apply at every long-running async primitive. Carry forward; promote on second instance.
- **(tentative) chained-session architectural-tax break-even** — apply at the next multi-ship chained session. Carry forward.
- **FlagLookup extract** — non-lesson refactor opportunity, deferred again; v803 is a CLI-touching ship and a natural place to bundle it if scope allows.

## Verdict on codification scope

Three candidates, three docs (2 new + 1 extended), one manifest update, one CLAUDE.md regeneration. Predicted: ~30-45 min. The codification ship is now well-grooved — third instance (v784, v790, v802) with the same shape.

The codification-ship pattern itself may eventually warrant its own discipline doc:

- Cluster the candidates into natural domains (recon answers this).
- Choose 1 new doc per new domain; extend existing docs for fit-in lessons.
- Update disciplines.json; regenerate CLAUDE.md.
- Write the 5-file chapter set (README + 00 + 03 + 04 + 99).
- T14 ship.

Three instances are not yet enough for a discipline (#10412 says recon-first, and recon already informs this every time), but if v900-ish or v950-ish runs another codification ship, the pattern will be three independent codifications with the same shape — promotable.
