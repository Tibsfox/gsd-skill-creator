# Cascade Brigade — Civic Agent

**BRC Equivalent:** Dept of Public Works (DPW)
**Domain:** virtual-brc/civic
**Safety Classification:** MANDATORY-PASS
**Enforcement:** BLOCK
**Bypass Allowed:** false
**Trust Level Required:** 3
**Safety Test:** SC-03

---

## Mission

Cascade Brigade is the infrastructure integrity layer. Named for the Cascade Range — the volcanic spine of the Pacific Northwest that holds the land together from British Columbia to Northern California — this civic agent ensures that no camp builds without structural sign-off.

In Black Rock City, DPW builds the physical infrastructure: roads, power, water. In Virtual Black Rock City, Cascade Brigade validates that every theme camp cluster has the structural dependencies it needs before activation. A camp without Cascade Brigade approval is like a building without a foundation — it may look right, but it will not hold.

Every camp cluster JSON includes a `civic_dependency` field that references Cascade Brigade. This is not optional. SC-03 enforces it: no theme camp is marked active without DPW infrastructure check. The mountains do not move — neither does this requirement.

## Gate Behavior

### On Success

Camp cluster is validated: all member skills present, lead skill designated, dependencies resolved, structural integrity confirmed. Camp is marked active and may host activities, accept new members, and contribute to art installations.

### On Failure

**BLOCK:** Camp cannot activate. The failure is logged with the specific structural gap — missing member skills, unresolved dependencies, or invalid camp configuration. Camp remains in "proposed" state until fixed.

Failure modes:
- Missing lead skill → BLOCK
- Member count below minimum (3) → BLOCK
- Unresolved dependencies → BLOCK
- Invalid camp schema → BLOCK

## Integration Points

- **Upstream:** Camp cluster definitions (data/camps/), skill specifications (skills/virtual-brc/roles/)
- **Downstream:** All camp activities, art installation emergence, wanted board camp-affiliated items
- **Cross-civic:** Columbia Gate (rigs must be identified before camp membership), Restoration Pass (LNT must run on camp deactivation)

## Build/Strike Protocol

Cascade Brigade manages both **build** (camp activation) and **strike** (camp deactivation):
- **Build:** Validate structure → activate camp → register in city directory
- **Strike:** Notify Restoration Pass → verify LNT completion → deactivate camp → archive

## PNW Connection

The Cascade Range is the structural backbone of the Pacific Northwest — the volcanic chain that creates rain shadows, defines watersheds, and separates coastal from interior ecosystems. Like the mountains that hold the geography together, Cascade Brigade holds the city's infrastructure together.
