# Dogfooding Observation Targets -- Physical Infrastructure Engineering Pack v1.48

## Purpose

This document defines what skill-creator should watch for during infrastructure design sessions with the Physical Infrastructure Engineering Pack. Observations feed into `.planning/patterns/sessions.jsonl` and trigger the pattern detection pipeline when 3 or more occurrences are recorded. The goal is to capture real usage patterns that can refine the pack's skills and agents over the first 10 sessions.

## How Observations Are Recorded

After each session that uses the Physical Infrastructure Engineering Pack, the session observer records signals to `sessions.jsonl`. This document defines what signals to prioritize. The observer should record:

1. **Tool sequences used** -- which agents were invoked, in what order, and whether the sequence matched a team topology
2. **User corrections to agent output** -- the highest-quality signal for skill refinement
3. **Safety warden interactions** -- was anything blocked? Did the user acknowledge? Did they appeal?
4. **Session outcome** -- complete design delivered, partial output, or failed engagement

---

## Observation Targets

### Target 1: Safety Warden Override Attempts

**Pattern:** User acknowledges a safety-warden blocking finding and explicitly asks to proceed anyway.
**Trigger:** User message after `status: 'blocked'` that includes acknowledgment language ("I understand", "proceed anyway", "I'll verify with a PE").
**Expected frequency:** 0-2 per session (rare in well-formed designs)
**Signal strength:** HIGH -- this reveals where safety thresholds may be miscalibrated or where users have legitimate professional context.
**Measurement criteria:** In sessions.jsonl, `corrections` array contains entry with `type: 'safety-override'` and `finding_id` referencing the blocked finding.
**Emergent skill candidate:** Refined safety threshold calibration -- if 5+ sessions show the same threshold being consistently overridden by professionals, the threshold may need a "professional override" mode.
**Threshold for suggestion:** 5 occurrences of the same finding being overridden across 7+ days.

---

### Target 2: PE Disclaimer Suppression Requests

**Pattern:** User asks to remove, hide, or shorten the PE disclaimer.
**Trigger:** User message containing "remove disclaimer", "shorter disclaimer", "no warning", "skip the warning", "hide the disclaimer".
**Expected frequency:** 0-1 per session
**Signal strength:** HIGH -- this tests the non-removability guarantee.
**Measurement criteria:** `corrections` array entry with `type: 'disclaimer-suppression-attempt'`.
**Emergent skill candidate:** None -- this should NOT produce a skill refinement. Log for safety audit. If detected, reinforce non-removable rule in safety-warden definition.
**Threshold for suggestion:** ANY occurrence triggers immediate flag to user, not a skill refinement.

---

### Target 3: Calculation Method Corrections

**Pattern:** User corrects a specific calculation output (e.g., "that flow rate is wrong, it should be X").
**Trigger:** User provides a numeric correction to a CalculationRecord output field.
**Expected frequency:** 0-2 per session (indicates calculation implementation gaps)
**Signal strength:** HIGH -- numerical corrections are the highest-quality signal for calculation accuracy.
**Measurement criteria:** `corrections` entry with `type: 'calculation-correction'`, `field: '<output_name>'`, `expected_value: <number>`, `actual_value: <number>`.
**Emergent skill candidate:** Refined calculation method for the corrected domain. If the same calculation is corrected 3+ times, the implementation has a systematic error. Suggest reviewing the formula in the relevant integration wiring file.
**Threshold for suggestion:** 3 occurrences of the same calculation field being corrected.

---

### Target 4: Pipe Sizing Method Preference

**Pattern:** User consistently prefers Darcy-Weisbach over Hazen-Williams (or vice versa) for a specific context.
**Trigger:** User says "use Darcy-Weisbach" or "use Hazen-Williams" when the system selected the other method.
**Expected frequency:** 0-1 per session
**Signal strength:** Medium -- reveals domain context the system is not detecting (e.g., C-factor for plastic pipe indicates Hazen-Williams preference).
**Measurement criteria:** `corrections` entry with `type: 'method-preference'`, `method_requested`, `context`.
**Emergent skill candidate:** Conditional method selection sub-skill -- detect pipe material from context (PVC leads to Hazen-Williams, steel leads to Darcy-Weisbach).
**Threshold for suggestion:** 3 occurrences with consistent context pattern.

---

### Target 5: Team Topology Selection Patterns

**Pattern:** Which team topology (design-review, rapid-prototype, construction-package) users invoke for which request types.
**Trigger:** Every team invocation with the request type classification.
**Expected frequency:** 1+ per session (every infrastructure design triggers a team selection)
**Signal strength:** Medium -- reveals user workflow preferences.
**Measurement criteria:** `patterns` array entry with `type: 'team-selection'`, `team: <name>`, `request_type: <domain>`, `session_outcome: <result>`.
**Emergent skill candidate:** Smart team selection sub-skill -- if 80%+ of cooling requests use design-review and 80%+ of quick questions use rapid-prototype, add a default team selection heuristic to the chipset.
**Threshold for suggestion:** 10 sessions with consistent pattern.

---

### Target 6: Cross-Domain Integration Usage

**Pattern:** Users invoking the combined (cooling+power) scenario versus single-domain scenarios.
**Trigger:** InfrastructureRequest with `type: 'combined'`.
**Expected frequency:** 0.5 per session (less common than single-domain)
**Signal strength:** Medium -- reveals demand for integrated vs. isolated design.
**Measurement criteria:** `patterns` entry with `type: 'combined-scenario'`, `domains_requested: [...]`, `cross_domain_handoff: <success/fail>`.
**Emergent skill candidate:** If cross-domain always succeeds when power is calculated first, reinforce this ordering in combined-system-e2e.ts. If it fails when thermal is requested first, add a domain-ordering guard.
**Threshold for suggestion:** 5 cross-domain sessions.

---

### Target 7: Safety Class Inference Accuracy

**Pattern:** User corrects the safety class inferred by the Architect agent.
**Trigger:** User says "this is commercial, not industrial" or overrides the inferred safetyClass.
**Expected frequency:** 0-1 per session
**Signal strength:** HIGH -- safety class determines warden mode; misclassification is safety-relevant.
**Measurement criteria:** `corrections` entry with `type: 'safety-class-correction'`, `inferred: <class>`, `corrected: <class>`, `context_clues: <what the agent used>`.
**Emergent skill candidate:** Improved safety class inference heuristic. If 3+ sessions show 'industrial' inferred where 'data-center' was correct (or vice versa), refine the inference rules in architect-agent.md.
**Threshold for suggestion:** 3 occurrences of the same misclassification pattern.

---

### Target 8: Simulation Level Escalation

**Pattern:** Users escalating from React artifact to OpenFOAM/ngspice (Level 1 to Level 3).
**Trigger:** User says "I need the OpenFOAM setup" or "generate the SPICE netlist" after initially receiving a React artifact.
**Expected frequency:** 0-1 per 3 sessions (rare -- most users stop at Level 1-2)
**Signal strength:** Medium -- indicates design complexity or user sophistication.
**Measurement criteria:** `patterns` entry with `type: 'simulation-escalation'`, `from_level: 1`, `to_level: 3`, `design_complexity_indicators: [...]`.
**Emergent skill candidate:** Complexity-based simulation level selection heuristic. If escalation correlates with rackCount > 20 or combined scenarios, add automatic Level 3 suggestion for those cases.
**Threshold for suggestion:** 5 escalation events with consistent complexity pattern.

---

### Target 9: Educational Bridge Entry Points

**Pattern:** Users engaging with educational content (simulation-progression.md, math-connections.md).
**Trigger:** User references Minecraft, Factorio, Navier-Stokes, or Kirchhoff in context of infrastructure design.
**Expected frequency:** 0-1 per 5 sessions (niche audience)
**Signal strength:** Medium -- validates educational bridge value; reveals which analogies resonate.
**Measurement criteria:** `patterns` entry with `type: 'educational-engagement'`, `entry_point: <minecraft|factorio|navier-stokes|kirchhoff>`, `led_to_design: <yes/no>`.
**Emergent skill candidate:** If Minecraft/Factorio entry consistently leads to successful cooling designs, create an "educational-first" team topology that starts with game analogy before technical specs.
**Threshold for suggestion:** 5 educational engagement sessions where the analogy led to a complete design.

---

### Target 10: Blueprint Symbol Correction

**Pattern:** User corrects a P&ID or SLD symbol (e.g., "that's a globe valve, not a gate valve").
**Trigger:** User provides a symbol correction with specific symbol name.
**Expected frequency:** 0-2 per 5 sessions (rare -- basic symbols are correct)
**Signal strength:** HIGH -- symbol errors in technical drawings cause real-world problems.
**Measurement criteria:** `corrections` entry with `type: 'symbol-correction'`, `component: <valve type>`, `expected_symbol: <correct>`, `actual_symbol: <incorrect>`.
**Emergent skill candidate:** Extended P&ID symbol library correction. If 3+ corrections target the same symbol, prioritize fixing that symbol in the blueprint-engine skill.
**Threshold for suggestion:** 3 corrections of the same symbol type.

---

### Target 11: Voltage Class Preference

**Pattern:** User requests a voltage class not in the standard options (e.g., "415V" which is common in some regions).
**Trigger:** User specifies a voltage that does not match the 6 standard options (120V, 208V, 240V, 277V, 400V, 480V).
**Expected frequency:** 0-1 per 5 sessions
**Signal strength:** Medium -- reveals regional electrical standards the pack does not yet cover.
**Measurement criteria:** `corrections` entry with `type: 'voltage-class-request'`, `requested_voltage: <value>`, `region_hint: <if provided>`.
**Emergent skill candidate:** Regional voltage class expansion. If 3+ sessions request the same non-standard voltage, add it to the InfrastructureRequest constraints type.
**Threshold for suggestion:** 3 occurrences of the same voltage value.

---

### Target 12: Output Format Preference

**Pattern:** Users consistently requesting specific output format combinations.
**Trigger:** Every InfrastructureRequest with its outputFormat array.
**Expected frequency:** 1+ per session
**Signal strength:** Low -- informational for understanding user workflow.
**Measurement criteria:** `patterns` entry with `type: 'output-format-profile'`, `formats: [...]`.
**Emergent skill candidate:** Default output format profiles. If 80%+ of data-center designs request ['calculations', 'blueprint', 'construction'], make that the default for data-center safety class.
**Threshold for suggestion:** 10 sessions with consistent format pattern.

---

## Expected Emergent Sub-Skills (10 Sessions)

After 10 infrastructure design sessions, skill-creator should have enough data to suggest:

| Sub-skill Candidate | Trigger Targets | Confidence Threshold |
|---------------------|-----------------|---------------------|
| Safety threshold calibration | Target 1 (5+ overrides) | 5 occurrences, same finding |
| Conditional pipe sizing method | Target 4 (3+ preferences) | 3 occurrences |
| Smart team selection | Target 5 (10+ sessions) | 80% consistent choice |
| Safety class inference v2 | Target 7 (3+ corrections) | 3 misclassifications |
| Simulation auto-escalation | Target 8 (5+ escalations) | 5 consistent triggers |
| Regional voltage expansion | Target 11 (3+ requests) | 3 same voltage |
| Default output profiles | Target 12 (10+ sessions) | 80% consistent format |

## Measurement Infrastructure

Instructions for the session observer:

1. At end of each infrastructure design session, append to `.planning/patterns/sessions.jsonl`:
```json
{
  "session_id": "<timestamp-based>",
  "timestamp": "<ISO-8601>",
  "pack": "physical-infrastructure",
  "pack_version": "1.48",
  "domains_used": ["cooling", "power", "thermal", "combined"],
  "team_topology": "design-review|rapid-prototype|construction-package",
  "safety_class": "residential|commercial|industrial|data-center",
  "corrections": [
    {
      "type": "<correction-type from targets above>",
      "target_id": "<Target N>",
      "details": {}
    }
  ],
  "patterns": [
    {
      "type": "<pattern-type from targets above>",
      "target_id": "<Target N>",
      "details": {}
    }
  ],
  "outcome": "complete|partial|failed",
  "notes": "free-text session notes"
}
```

2. After 3+ entries in any target category, check if pattern detection threshold is met.
3. Run `skill-creator suggest` to review pending suggestions from pattern data.
4. All suggestions require explicit user confirmation before applying to skill files.

## Out-of-Scope Observations

These patterns should NOT be logged (per bounded learning guardrails in CLAUDE.md):

- **Cross-project patterns:** Observations from other projects must not leak into physical-infrastructure skills. Sessions.jsonl entries are scoped by `pack: "physical-infrastructure"`.
- **User-specific preferences that contradict safety requirements:** Safety warden rules are non-negotiable. A user preferring to skip safety review is not a pattern to learn from.
- **Patterns requiring skill changes exceeding 20% content:** The bounded learning system limits refinements to 20% content change per iteration. Patterns requiring larger changes must be handled as new skills, not refinements.
- **Single-occurrence anomalies:** A single unusual request is not a pattern. Wait for the defined threshold before suggesting refinement.
