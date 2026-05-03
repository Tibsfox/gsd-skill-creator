# Briefing Format

A good briefing tells the developer three things in 2-3 paragraphs:

1. **What's happening** — current state of the project
2. **Why it might be happening** — at least one causal hypothesis
3. **What we don't yet know** — at least one acknowledged uncertainty

Then ends with confidence: `low`, `medium`, or `high`.

The verifier (`scripts/verify-briefing.ts`) gates the briefing on:

- Body matches the causal-hypothesis regex
  `/(probably|likely|because|seems to|suggests|appears to)/i`
- Body matches the uncertainty regex
  `/(unclear|don'?t (yet )?know|unknown|whether|might|may|could)/i`
- `confidence` value ∈ {`low`, `medium`, `high`}
- Each suggested move has a non-empty `rationale` (≥10 chars) and a
  `source_findings` array (empty allowed only for forward-looking moves whose
  rationale explicitly notes "no prior evidence")

Briefings that fail verification are NOT persisted to KB.

## Example (good)

> Wave 2 calibration work is roughly 80% complete — three modules in
> `rosetta-core/` remain unfinished. The CAPCOM gate from yesterday is
> still held; the analyzer flagged a coupling spike between DACP and
> chipset (2.3× project baseline) that **probably** explains it. Two paths
> forward look reasonable: investigate the coupling first to inform a
> clean fix, or clear the gate now and accept some technical debt.
> The unknown: it's **unclear whether** the remaining rosetta-core modules
> will hit the same coupling pattern when they land.
>
> Confidence: medium

The good example carries:

- A causal hypothesis (the coupling spike "probably explains" the held gate)
- An explicit uncertainty ("unclear whether the remaining modules will hit
  the same pattern")
- A confidence label sized to the evidence (medium because we have a single
  finding cluster but no cross-corroboration yet)

## Example (bad — no hypothesis)

> Wave 2 is 80% done. The CAPCOM gate is held. There are 47 open findings.
>
> Confidence: high

This is a status summary, not a briefing. It tells the developer nothing they
didn't already see in the dashboard. **Verification fails: no causal hypothesis
pattern in the body.** Result: status=failed; no KB write.

## Example (bad — false confidence)

> Wave 2 is held entirely because of the DACP/chipset coupling. Clear the
> gate now and the calibration will land.
>
> Confidence: high

This claims certainty about causation without acknowledging that other
factors (rosetta-core dependencies, CAPCOM safety findings) might also
be relevant. **Verification fails: no uncertainty pattern in the body.**
Result: status=failed; no KB write.

## Example (bad — confidence mislabel)

> Wave 2 calibration looks like it's about 60% done. The held gate could be
> related to the DACP coupling, or it might just be that one developer is on
> PTO. Hard to say without more snapshot history.
>
> Confidence: high

Body has hypothesis + uncertainty, but the **confidence label doesn't match
the evidence weight**. With "hard to say without more snapshot history,"
this should be `low`, not `high`. The verifier accepts the label as
syntactically valid (it's in the enum), so the dashboard will display
"high" and the developer is misled. Calibration is the developer's
contract with the briefing — break it once and trust erodes for every
subsequent briefing. See `confidence-calibration.md`.

## Length and pacing

- **2-3 paragraphs maximum.** A briefing read at meeting start is a focusing
  device, not a report.
- **First sentence is the most important.** It should state the project's
  current state in plain language.
- **Causal hypothesis sits in the second paragraph or middle of the first.**
  This is the briefing's gravitational center.
- **Uncertainty acknowledgement closes the body.** It signals epistemic
  honesty and gives the developer permission to redirect.
- **Confidence label is on its own line at the end.** Format: `Confidence: medium`.

## Anti-patterns to avoid

- **Listing every open finding.** The dashboard already shows them. The
  briefing's job is to find pattern in the noise.
- **Hedging without committing.** "It might be X, or Y, or Z, or possibly W"
  is not a hypothesis — it's a refusal to take a position. Pick the most
  likely, name it, and acknowledge the alternatives as the uncertainty.
- **Stacking causal claims without evidence.** If you propose three causes,
  each needs a finding to anchor it. Otherwise pick one and acknowledge
  the others as alternatives.
- **Restating the confidence in the body.** "I'm pretty confident this is
  the cause" is not the same as `confidence: high` — it's a hedge masquerading
  as a label. Use the explicit label only.
