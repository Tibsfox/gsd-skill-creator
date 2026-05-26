# v1.49.783 — Lesson candidates

2 lessons emitted, both candidate-status pending codification.

---

## #L783-1 — Deferred-maintenance debt has a half-life; close it when the handoff escalates it

**Signal.** The C6 normalizer failure was first present at v781 ship tip (`6337fad53`). The v782 handoff offered "Path B — STATE.md normalizer fix (escalated since v781)" as a recommended forward path. The operator picked it as v783 and the fix took ~45 minutes. Had the wedge been deferred another 5-10 milestones, the same fix would still have taken ~45 minutes — but the test would have stayed red across all those ships, and the "hand-author STATE.md" workaround would have continued accumulating in operator memory and skill notes.

The cost of deferred-maintenance debt is not the eventual fix; it's the silent test-suite drift + workaround documentation that accumulates while the fix is deferred.

**Rule.** When a handoff escalates a deferred-maintenance item (e.g. "this used to be a candidate path, now it's a load-bearing operator pain point"), treat it as a hard interrupt to the engine-state-advance cadence. Close it within the next 1-2 milestones. Forward-cadence engine-state work can wait one milestone; an open red test in `tests/integration/` cannot.

**Anti-pattern.** Continuing to defer the wedge because "we just shipped a 3-milestone series; let's do NASA next." The 3-milestone series itself is evidence that the cadence is healthy and a 30-45min wedge will not disrupt it. The pre-tag-gate's silent acceptance of a known-failing test is the alarm — heed it.

**Codification target.** Promote from `lesson candidate` to a CLAUDE.md operative discipline at next regen. Suggested operative-discipline block: "Deferred-maintenance escalation — _Before deciding next-milestone scope when a handoff lists a fix as 'escalated' or 'load-bearing'._ Close the wedge within 1-2 milestones; do not defer beyond that. The cost of deferral is silent test drift + workaround accumulation, not the eventual fix."

---

## #L783-2 — Tolerant generators are the default for hand-authored ↔ generated round-trips

**Signal.** The original normalizer used `UNKNOWN` as a sentinel for missing optional fields. Three problems emerged:

1. `UNKNOWN` is visually indistinguishable from a real field value, so it pollutes the file.
2. `UNKNOWN` makes the round-trip property fragile: any hand-authoring pattern that DOESN'T use `UNKNOWN` (i.e. all of them) will drift.
3. `UNKNOWN` masks the actual schema gap — operators can't tell whether the field is optional or required without reading the source.

Replacing `UNKNOWN` with skip-the-line behavior:
- Makes the file readable (no nonsense placeholder text).
- Makes the round-trip property robust (hand-authoring just works).
- Surfaces the schema honestly (fields you don't write don't appear).

**Rule.** When a generator runs on partial input (e.g. hand-authored frontmatter with missing optional fields), prefer skip-the-line over placeholder sentinels. `UNKNOWN` and similar tokens leak into the output, mask real schema gaps, and break round-trip cleanness. The exception is fields with a load-bearing default (here: `predecessor.counter_cadence ?? false`) where the default IS the right semantic answer.

**Anti-pattern.** Emitting `UNKNOWN`, `TODO`, `???`, or `N/A` placeholders when a generator can't resolve a field. The user almost never wants the placeholder in the final output; they want either the real value or no line at all.

**Codification target.** Reference pattern for future template + generator authoring. Already embodied in `tools/state-md-normalizer.mjs::generateCurrentPosition` and `generateEngineStateBaseline`.

---

## Cross-ship lesson queue

After v783, the unshipped lesson queue is:

- 3 from v781 (per v781 handoff)
- 3 from v782 (#L782-1 recon-first default, #L782-2 classify by behavior, #L782-3 optional ctx? retrofit)
- 2 from v783 (#L783-1 deferred-maintenance debt, #L783-2 tolerant generators default)

**8 lesson candidates queued.** Path D (~45min codification ship) is overdue. Suggested as the v784 candidate.
