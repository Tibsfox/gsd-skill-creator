# Deferred-Maintenance Escalation Discipline

**Surface:** When a handoff lists a fix as 'escalated' or 'load-bearing'; when a test in `tests/integration/` has been red across 2+ consecutive ships; when operator memory accumulates workarounds for a known broken tool.

**Codified at:** v1.49.784 (lesson from v1.49.783 STATE.md normalizer fix — the C6 test had been failing since at least v781 ship tip `6337fad53`).

## Why this discipline exists

The cost of deferred-maintenance debt is not the eventual fix. It is the **silent test-suite drift + workaround documentation** that accumulates while the fix is deferred. By the time an operator hand-authors workaround instructions into memory or accepts a red test as background noise, the deferral cost has already been paid — and the eventual fix is still the same size it would have been at first observation.

At v783, a 45-minute wedge closed a normalizer bug that had been load-bearing for ~5 months. The fix was small; the cost was the accumulated workaround documentation in operator memory ("STATE.md normalizer needs 2× --write") and the silent acceptance of a red test in `tests/integration/`.

## Discipline pattern

### Close escalated wedges within 1-2 milestones (Lesson #10415)

When a handoff document escalates a deferred-maintenance item — e.g., transitions from "candidate Path B" to "load-bearing operator pain point" or "escalated since vNNN" — treat it as a **hard interrupt** to the engine-state-advance cadence.

The discipline:

1. **At T+0 (handoff written):** Mark the item as candidate; defer is acceptable.
2. **At T+1 ship (escalated in next handoff):** Add to forward-paths menu as recommended.
3. **At T+2 ship (still escalated):** Close it. Do not defer beyond this point.

Forward-cadence engine-state work can wait one milestone. An open red test in `tests/integration/` or a workaround-required tool cannot. The asymmetry: engine-state lost time is recovered with the next ship; deferred-maintenance lost time compounds with every subsequent ship that ran around the workaround.

**Signal triggers for "this needs closing now":**

- A handoff document marks the item as "escalated" or "load-bearing."
- An operator memory note documents a workaround for the broken tool.
- A test in `tests/integration/` has been silently failing for 2+ ships.
- The pre-tag-gate's "discipline coverage" or similar advisory step is the alarm.

**Anti-pattern.** Continuing to defer the wedge because "we just shipped a series; let's do NASA next." The series itself is evidence that the cadence is healthy and a 30-45min wedge will not disrupt it. The pre-tag-gate's silent acceptance of a known-failing test is the alarm — heed it.

## When this discipline kicks in

- Reading a handoff document that uses words like "escalated," "load-bearing," "still failing," "carried forward."
- Closing a session where a `tests/integration/` test was acknowledged-as-failing.
- Choosing the next milestone after a forward-cadence series of 2+ ships.
- Encountering an operator memory note that documents a workaround for a tool.

## Anti-pattern summary

- ❌ Deferring an escalated fix because the next-up engine-state work feels more exciting.
- ❌ Accepting a red `tests/integration/` test as background noise.
- ❌ Encoding a workaround in operator memory instead of fixing the underlying tool.

## Lesson reference

- **#10415** — Deferred-maintenance debt has a half-life; close it when the handoff escalates it. v783 candidate.
