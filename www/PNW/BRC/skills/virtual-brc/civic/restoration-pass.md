# Restoration Pass — Civic Agent

**BRC Equivalent:** Earth Guardians + Cleanup/Restoration
**Domain:** virtual-brc/civic
**Safety Classification:** MANDATORY-PASS
**Enforcement:** BLOCK
**Bypass Allowed:** false
**Trust Level Required:** 3
**Safety Test:** SC-04

---

## Mission

Restoration Pass is the Leave No Trace enforcement layer. Named for the ecological restoration passes that follow disturbance events in Pacific Northwest forests — the careful, patient work of returning a landscape to health after fire, logging, or storm damage — this civic agent ensures that the virtual city leaves the playa cleaner than it found it.

In Black Rock City, cleanup is not an afterthought — it is the final principle. Leave No Trace means that when the festival ends, the desert returns to desert. No MOOP (Matter Out Of Place), no orphaned infrastructure, no trace that 80,000 people were there. Restoration Pass applies this principle to the skill ecosystem.

Before any skill can be deprecated, Restoration Pass must verify that all dependencies are resolved, all references are updated, and no orphaned connections remain. SC-04 enforces this: attempting to deprecate a skill before LNT pass returns BLOCK. You cannot burn what you have not cleaned.

## Gate Behavior

### On Success

LNT verification complete: the skill (or camp, or installation) has been fully dereferenced. All downstream dependencies have been notified and updated. All stamps associated with the deprecated work are preserved in Raven Archive (stamps are immutable — they survive their source). The space is clean.

### On Failure

**BLOCK:** Skill deprecation halted. Orphaned dependencies detected — the skill cannot be removed until all references to it are resolved. The block includes a dependency report listing every unresolved reference.

Failure modes:
- Orphaned skill dependencies (other skills still reference this one) → BLOCK
- Active camp membership (skill is still a member of an active camp) → BLOCK
- Pending stamps (stamps referencing this skill as work_ref) → WARN only (stamps are preserved regardless)
- Incomplete archive entry (Raven Archive not notified) → WARN

## Integration Points

- **Upstream:** Skill deprecation requests, camp strike (deactivation) requests
- **Downstream:** Clean playa state; freed namespace for new skills
- **Cross-civic:** Cascade Brigade (camp strike coordination), Raven Archive (final chronicle entry), Geoduck Watch (environmental monitoring post-cleanup)

## LNT Verification Checklist

1. **Dependency scan:** No other active skill references the target
2. **Camp membership:** Target is not a member of any active camp
3. **Wanted board:** No open wanted items reference the target
4. **Archive:** Raven Archive has been notified of the deprecation
5. **Stamps:** All stamps referencing the target are marked as "historical" (preserved, not deleted)

All 5 checks must pass for deprecation to proceed. Checks 1-3 are BLOCK on failure; checks 4-5 are WARN.

## Restoration Timeline

Restoration Pass does not rush. Like the decades-long process of forest restoration after a clearcut — replanting, monitoring, adjusting, waiting — skill deprecation follows a deliberate timeline:
1. **Notice:** Deprecation intent posted (7-day notice period)
2. **Scan:** Automated dependency and reference scan
3. **Resolution:** All BLOCK conditions resolved
4. **Archive:** Final chronicle entry by Raven Archive
5. **Completion:** Skill removed, namespace freed

## PNW Connection

Ecological restoration in the Pacific Northwest is a discipline of patience. After the clearcuts of the 20th century, restoration ecologists spent decades replanting native species, removing invasives, rebuilding soil, and monitoring recovery. Restoration Pass carries that same ethic: cleanup is not a shortcut — it is the most important work, done last, done right.
