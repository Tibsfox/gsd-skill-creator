# PNW Avian Taxonomy — Cross-Dependency Degraded Output Protocol

> **Wings of the Pacific Northwest — AVI Mission, Wave 0 Foundation**
>
> **Resolves:** H-7 (Cross-dependency degraded output handling)
> **Responsible Muse:** Cedar (timeline integrity)
> **Companion Document:** `integration-test-spec.md` (H-6 resolution)

---

## Principle

AVI (avian taxonomy) and MAM (mammal taxonomy) are produced by different agents in different waves with cross-dependencies. When one module produces output that contradicts assumptions made by the other, the contradiction is never silently resolved. It is recorded, flagged, and surfaced for explicit reconciliation in Wave 4.

Silent resolution of contradictions degrades trust in the knowledge base. A reader who finds conflicting predator-prey claims between AVI and MAM will lose confidence in both documents. The protocol below ensures that contradictions are visible, tracked, and resolved with documented reasoning.

---

## Scenario 1: AVI Output Contradicts MAM Assumptions

**Trigger:** AVI Wave N produces a raptor profile whose prey list contradicts the predator list in an existing or assumed MAM prey profile.

**Examples:**
- AVI lists Northern Spotted Owl as taking Red Tree Vole as primary prey, but MAM (if already produced) does not list Northern Spotted Owl as a predator of Red Tree Vole.
- AVI lists an interaction strength of "Obligate" for a prey relationship that MAM documents as "Opportunistic."
- AVI documents a prey species in a habitat where MAM places that prey species as absent.

**Protocol:**

1. **Document the contradiction.** The AVI agent writes a contradiction record in the following format at the end of the relevant species profile:

```markdown
> **CONTRADICTION FLAG [AVI→MAM]**
> - AVI claim: [Exact claim from AVI profile]
> - MAM claim: [Exact claim from MAM profile, or "MAM not yet produced — assumed based on ECO data"]
> - Source conflict: [AVI source ID] vs [MAM source ID or ECO source ID]
> - Flagged for: Wave 4 reconciliation
> - Cedar review: Pending
```

2. **Produce the AVI module using ECO data as fallback.** If the MAM module is not yet produced, the AVI agent uses ECO shared-attributes and the ECO fauna module (if available) as the authoritative reference for mammal prey species. The AVI profile is written using ECO-sourced data and marked with the cross-reference format `See MAM (pending)`.

3. **Flag for Wave 4 reconciliation.** The contradiction record is added to the Wave 4 reconciliation queue. Cedar tracks all contradiction flags across both taxonomies.

4. **Do not modify the other module's output.** An AVI agent never edits MAM profiles, and a MAM agent never edits AVI profiles. Reconciliation happens in Wave 4 under orchestrator supervision.

---

## Scenario 2: MAM Output Contradicts AVI Assumptions

**Trigger:** MAM Wave N produces a prey species profile whose predator list contradicts the prey list in an existing or assumed AVI raptor profile.

**Examples:**
- MAM lists Snowshoe Hare with no raptor predators documented, but AVI lists Northern Goshawk and Great Horned Owl as taking Snowshoe Hare as primary prey.
- MAM documents a mammal species in an elevation band where AVI does not place any raptors that prey on it.
- MAM assigns a conservation status that affects the safety constraints on how the raptor-prey relationship can be documented.

**Protocol:**

1. **Document the contradiction.** Same format as Scenario 1, reversed:

```markdown
> **CONTRADICTION FLAG [MAM→AVI]**
> - MAM claim: [Exact claim from MAM profile]
> - AVI claim: [Exact claim from AVI profile, or "AVI not yet produced — assumed based on ECO data"]
> - Source conflict: [MAM source ID] vs [AVI source ID or ECO source ID]
> - Flagged for: Wave 4 reconciliation
> - Cedar review: Pending
```

2. **Produce the MAM module using ECO data as fallback.** Same approach — use ECO shared-attributes as authoritative reference for avian predator information until AVI profiles are available.

3. **Flag for Wave 4 reconciliation.** Same tracking mechanism.

4. **Do not modify the other module's output.** Same boundary rule.

---

## Scenario 3: Both Modules Produced Independently with Contradictions

**Trigger:** Both AVI and MAM were produced in parallel or in different sessions, and the integration test IN-AVI-MAM-RAPTOR-PREY detects contradictions during verification.

**Protocol:**

1. **VERIFY agent documents all contradictions** using the contradiction flag format.
2. **INTEG agent assesses contradiction severity:**
   - **Factual contradiction:** One module cites data that directly conflicts with the other (e.g., different population numbers for the same species). Requires source arbitration.
   - **Omission contradiction:** One module documents a relationship the other omits. Requires adding the missing reference.
   - **Strength contradiction:** Both modules document the relationship but disagree on interaction strength. Requires evidence review.
   - **Habitat/range contradiction:** Modules place species in incompatible locations. Requires geographic data review.
3. **Cedar reviews all contradictions** and assigns resolution priority.
4. **Orchestrator resolves in Wave 4** by:
   - Identifying which source has higher authority (Tier 1 > Tier 2 > Tier 3).
   - When sources are of equal authority, preserving the claim with more specific geographic scope (PNW-specific > continental > global).
   - When sources genuinely conflict, documenting both claims with an explicit note: "Sources differ on this point. [Source A] reports X; [Source B] reports Y. This taxonomy uses [chosen claim] because [reasoning]."

---

## Contradiction Record Tracking

All contradiction flags are tracked in a running log appended to during execution:

```markdown
## Contradiction Log

| ID | Direction | Species Pair | Type | Severity | Status |
|----|-----------|-------------|------|----------|--------|
| CONT-001 | AVI→MAM | Spotted Owl / Flying Squirrel | Strength | Low | Pending |
| CONT-002 | MAM→AVI | Snowshoe Hare / Goshawk | Omission | Medium | Pending |
```

This log is maintained by Cedar and reviewed at each wave boundary.

---

## Safety Constraints on Contradiction Resolution

Some contradictions involve ESA-listed species or Indigenous knowledge and carry safety implications:

1. **ESA species contradictions (SC-END):** If a contradiction involves the range, population, or habitat of an ESA-listed species, resolution must use the most conservative (protective) interpretation. When in doubt, generalize locations to county/watershed level and defer to the USFWS recovery plan as authoritative source.

2. **Indigenous knowledge contradictions (SC-IND, SC-CUL):** If cultural references in AVI and MAM conflict on the cultural significance of a species, both claims are preserved with nation-specific attribution. Cultural claims are never overridden by biological data, and biological data is never overridden by cultural claims — they document different knowledge systems.

3. **Population data contradictions (SC-NUM):** When AVI and MAM cite different population numbers for the same species, use the most recent government agency source. If both are equally recent, note the discrepancy explicitly.

---

## Timeline

| Wave | Action |
|------|--------|
| Wave 0 | This protocol defined and published. |
| Wave 1-3 | Agents apply protocol as contradictions are encountered. Contradiction flags accumulate. |
| Wave 4 (pre-verification) | Cedar reviews all contradiction flags. |
| Wave 4 (verification) | VERIFY and INTEG agents run IN-AVI-MAM-RAPTOR-PREY test. |
| Wave 4 (reconciliation) | Orchestrator resolves all flagged contradictions per this protocol. |
| Wave 4 (publication) | No unresolved FAIL-level contradictions remain. PARTIAL PASS contradictions documented in final publication notes. |

---

*Wave 0 — Foundation: Degraded Output Protocol*
*PNW Avian Taxonomy v0.1*
*Wings of the Pacific Northwest — AVI Mission*
