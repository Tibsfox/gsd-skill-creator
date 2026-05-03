# Confidence Calibration

Honest confidence labels are the briefing's contract with the developer.
Mislabel once and trust erodes for every subsequent briefing. Use these
thresholds; the verifier accepts any label in `{low, medium, high}` syntactically,
so calibration is on you, not the gate.

## Thresholds

### `low`

- Single source for the causal hypothesis (one finding, one diff, one note)
- No cross-corroboration from other findings or prior briefings
- The hypothesis is novel — no precedent in recent meeting records
- Or the underlying data is sparse (project has <5 findings, <2 snapshots,
  no recent meetings)

**Pattern phrase:** "It's hard to say without more data" — if you'd write
this anywhere in the briefing, label `low`.

### `medium`

- 2 or more findings align with the hypothesis (independent evidence)
- OR partial corroboration from prior briefings (recent meeting record cites
  a related concern)
- The hypothesis is consistent with one well-established pattern in the
  KB (e.g., DACP/chipset coupling has appeared in 3+ recent snapshots)

**Pattern phrase:** "The evidence points to X, but we can't rule out Y" —
this is a `medium` shape.

### `high`

- 3 or more distinct findings align with the hypothesis
- AND prior briefings on the same topic were confirmed by outcomes
- AND the underlying mechanism is well-understood (no "I don't know how"
  in the rationale)

**Pattern phrase:** "We've seen this before — last time it was X, and the
fix was Y" — this is a `high` shape, IF the prior fix actually worked.

## Anti-patterns

- **Never label `high` if you can't cite ≥3 distinct findings.** If you only
  have 2 findings, `medium` is the ceiling.
- **Never label `high` on a fresh hypothesis.** First-time observations are
  `low` even if they look obvious.
- **Don't chain `high` confidences across briefings without revalidation.**
  If briefing N said "Wave 2 will land cleanly: high" and Wave 2 is now
  blocked, briefing N+1 cannot say "the blocker is X: high" without fresh
  evidence — the prior `high` is suspect.
- **Don't deflate to `low` to seem humble.** If the evidence supports `medium`,
  label `medium`. False humility erodes trust as much as false confidence.

## Calibration self-check

Before writing the briefing, ask:

1. **Could the developer falsify this hypothesis with a single check?**
   - Yes → at most `medium`
   - Maybe but it would take a snapshot diff or KB query → `medium`
   - No, it requires deep investigation → `low`
2. **How many distinct findings cite this pattern?**
   - 1 → `low`
   - 2 → `medium`
   - 3+ → potential `high`
3. **Has this hypothesis been confirmed by a prior outcome?**
   - No (or no prior briefings on it) → at most `medium`
   - Yes, the prior fix worked → eligible for `high`
   - Yes, the prior fix did NOT work → at most `low` (we got it wrong before)

If the answers don't unanimously support `high`, the label is `medium` or `low`.

## Calibration drift detection

If you find yourself writing the same hypothesis at the same confidence level
across multiple briefings without new evidence, the briefing is stale. Lower
the confidence by one rung each time the same hypothesis appears unchanged
(`high` → `medium` → `low`). If it lands at `low`, the next briefing should
either propose new evidence or change the hypothesis.

This drift detection is the developer's mental model anyway — they
remember "you said this last week and again this week" — but encoding it
explicitly in the calibration prevents the briefing from becoming background
noise.
