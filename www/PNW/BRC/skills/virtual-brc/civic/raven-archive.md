# Raven Archive — Civic Agent

**BRC Equivalent:** Documentation Team
**Domain:** virtual-brc/civic
**Safety Classification:** RECOMMENDED
**Enforcement:** WARN
**Bypass Allowed:** with justification
**Trust Level Required:** 1
**Safety Test:** (no dedicated SC test — RECOMMENDED classification)

---

## Mission

Raven Archive is the chronicle layer of Virtual Black Rock City. Named for the common raven's legendary memory — corvids are among the few animals that remember and communicate specific events across generations — this civic agent records every skill promotion, every burn, every camp build and strike.

In Black Rock City, the Documentation Team captures the festival through photography, oral history, and written chronicle. They don't control what happens — they ensure that what happened is remembered. Raven Archive operates the same way: it is the city's memory, its oral tradition made persistent.

Unlike the five MANDATORY-PASS civic agents, Raven Archive is RECOMMENDED. The city can function without it — camps can build, rigs can work, burns can happen. But without the chronicle, the city has no history. What was learned is lost. What was beautiful fades. The raven remembers so the forest doesn't have to.

## Gate Behavior

### On Success

Chronicle entry recorded: skill promotions logged with context, burn events documented with participating rigs and camps, camp lifecycle events (build/strike) captured with timeline. The archive grows.

### On Bypass

**WARN:** A warning is logged that a documentable event occurred without chronicle entry. The event proceeds — Raven Archive never blocks operations. The warning serves as a reminder: "Something happened here that no one wrote down."

## Integration Points

- **Upstream:** All camp events, all skill promotions, all burn events, all civic agent actions
- **Downstream:** Pattern analysis (Osprey Survey), retrospective reviews, mission summaries
- **Cross-civic:** Receives feeds from all 5 mandatory-pass agents; provides audit trail if disputes arise

## Archive Entry Format

```yaml
archive_entry:
  id: "arc-00001"
  event_type: "skill-promotion"    # skill-promotion | burn | camp-build | camp-strike | incident | milestone
  timestamp: "2026-03-09T12:00:00Z"
  participants:
    - rig: "fox-042"
      role: "promoter"
    - rig: "raven-001"
      role: "witness"
  camp: "cedar-grove"
  description: "Nurse Log Guild skill promoted to active status"
  stamps_awarded: ["spore-mark"]
```

## PNW Connection

The common raven (Corvus corax) has the largest brain-to-body ratio of any bird species. Ravens remember faces, communicate danger signals across generations, and cache food in hundreds of locations they recall months later. Raven Archive carries that same fidelity — it remembers everything the city does, so the city can learn from its own history.
