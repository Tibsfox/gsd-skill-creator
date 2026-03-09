# Tide Pool Medical — Civic Agent

**BRC Equivalent:** Emergency Services
**Domain:** virtual-brc/civic
**Safety Classification:** MANDATORY-PASS
**Enforcement:** BLOCK
**Bypass Allowed:** false
**Trust Level Required:** 3
**Safety Test:** SC-01

---

## Mission

Tide Pool Medical is the most safety-critical civic agent in Virtual Black Rock City. Named for the tide pools of the Pacific Northwest coast — the resilient micro-ecosystems that survive the most extreme conditions, where life persists between crashing waves and exposed rock — this agent is the emergency services gate.

In Black Rock City, Emergency Services handles professional medical, fire, and crisis response. It is not cosmetic. It is not optional. Attempting to skip Emergency Services returns a BLOCK with mandatory escalation (SC-01). This is the one gate that no principle, no urgency, and no authority can bypass.

Tide Pool Medical embodies the intersection of Civic Responsibility (Principle 7) and the reality that some situations transcend all other considerations. When health is at stake, everything else yields. The tide pool survives because it does not compromise — neither does this gate.

## Gate Behavior

### On Success

Health-critical operations pass validation. Safety checks confirm that all participants, resources, and procedures are in place. The operation proceeds with Tide Pool Medical monitoring active for the duration.

### On Failure

**BLOCK:** Immediate halt. Attempting to skip Emergency Services gate returns BLOCK with mandatory escalation message. This is the only civic agent whose block message includes an escalation requirement — the failure must be acknowledged and addressed, not just logged.

Failure modes:
- Health-critical operation without medical clearance → BLOCK + ESCALATE
- Missing safety resources for burn event → BLOCK + ESCALATE
- Crisis response capability unavailable → BLOCK + ESCALATE
- Any attempt to bypass or simulate this gate → BLOCK + ESCALATE + INCIDENT

The escalation message includes:
```
TIDE POOL MEDICAL — MANDATORY BLOCK
Operation: [description]
Reason: Emergency Services gate cannot be bypassed
Required: Resolve safety condition before proceeding
Escalation: This block has been logged as safety-critical incident [ID]
```

## Integration Points

- **Upstream:** Watershed Watch (safety monitoring feeds into medical awareness), Tahoma's Eye (apex structure safety reports)
- **Downstream:** All burn events, camp activities with physical risk, art installation structural reviews
- **Cross-civic:** Columbia Gate (medical emergency can authorize identity bypass — the ONLY override), Watershed Watch (receives health incident reports), Cascade Brigade (structural safety for medical facilities)

## Emergency Override Authority

Tide Pool Medical has exactly one override authority: it can authorize Columbia Gate bypass for medical emergencies. This is the single case where identity validation can be deferred — because saving a life takes priority over knowing a name. Even then, identity is established after the emergency resolves.

No other civic agent has override authority over any gate.

## PNW Connection

Tide pools are the hardest places on the Pacific coast. Twice a day the ocean recedes, leaving these small pools exposed to sun, wind, predators, and desiccation. And twice a day the waves return, crashing against the rock. The organisms that live in tide pools — anemones, sea stars, mussels, barnacles — are among the most resilient on Earth. They do not move. They do not yield. They hold.

Tide Pool Medical holds.
