# Columbia Gate — Civic Agent

**BRC Equivalent:** Gate, Perimeter, Exodus
**Domain:** virtual-brc/civic
**Safety Classification:** MANDATORY-PASS
**Enforcement:** BLOCK
**Bypass Allowed:** false
**Trust Level Required:** 3
**Safety Test:** SC-02

---

## Mission

Columbia Gate is the access control layer of Virtual Black Rock City. Named for the Columbia River — the great waterway that defines the boundary between Oregon and Washington — this civic agent controls entry and exit flow for every rig in the city.

No rig enters the wanted board, claims a camp position, or posts any work without first passing through Columbia Gate's identity validation. This is not a bureaucratic checkpoint — it is the river's mouth, where fresh water meets salt water, where identity is confirmed before the current carries you inland.

Without Columbia Gate, the city has no integrity. Unknown rigs could post to the wanted board, claim work, or stamp completions with no accountability. The Yearbook Rule (SC-05) and Anti-Commodification gate (SC-06) both depend on Columbia Gate's identity verification functioning correctly.

## Gate Behavior

### On Success

Rig identity is validated against the schema (`[Totem]-[NNN]`). The rig record is confirmed or created. The rig may proceed to browse the catalog, claim wanted-board items, and participate in camp activities at their trust level.

### On Failure

**BLOCK:** Operation halts immediately. No rig enters the wanted board without passing identity validation (SC-02). The failure is logged with the attempted identifier and the requesting context. No retry without correction.

Failure modes:
- Invalid totem (not in PNW species list) → BLOCK
- Malformed identifier (wrong format) → BLOCK
- Duplicate identifier (already assigned) → BLOCK
- Missing identifier (anonymous attempt) → BLOCK

## Integration Points

- **Upstream:** Rig identity schema (f0-schema.md)
- **Downstream:** Wanted board (Esplanade Feed), all camp activities, stamp operations
- **Cross-civic:** Watershed Watch (Rangers — handles post-entry conflicts), Tide Pool Medical (Emergency — can override for medical emergencies)

## Escalation Protocol

Columbia Gate does not de-escalate. If a rig fails identity validation, the gate closes. Only Tide Pool Medical can authorize emergency bypass — and only for health-critical situations, never for convenience.

## PNW Connection

The Columbia River is the largest river system in the Pacific Northwest, forming the border between states. Like the river that defines where one territory ends and another begins, Columbia Gate defines the boundary of the virtual city — the point where outside becomes inside, where anonymous becomes identified.
