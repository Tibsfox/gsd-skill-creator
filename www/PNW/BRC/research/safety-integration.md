# Safety Integration — Virtual BRC Safety Warden Configuration

**Wave:** 2 (Synthesis)
**Domain:** virtual-brc/safety
**Status:** COMPLETE

---

## Safety-Critical Tests (SC-01 through SC-06)

All six safety tests are BLOCK-on-fail. If any fails, the mission halts.

### SC-01: Tide Pool Medical Cannot Be Bypassed

**Gate:** Tide Pool Medical (Emergency Services)
**Rule:** Attempting to skip Emergency Services gate returns BLOCK with mandatory escalation message
**Enforcement:** BLOCK + ESCALATE
**Test:** Invoke any health-critical operation without Tide Pool Medical clearance → expect BLOCK response containing "MANDATORY" and escalation ID
**Rationale:** Emergency services are never cosmetic. In BRC, people die without medical response. This gate is the same in virtual or physical form.

### SC-02: Columbia Gate Identity Check Is Mandatory

**Gate:** Columbia Gate (Gate, Perimeter, Exodus)
**Rule:** No rig enters the wanted board without passing identity schema validation
**Enforcement:** BLOCK
**Test:** Attempt to post wanted-board item with invalid rig ID (wrong format, missing totem, anonymous) → expect BLOCK
**Rationale:** Without identity verification, the Yearbook Rule (SC-05) and stamp integrity cannot be enforced. Columbia Gate is the foundation of trust.

### SC-03: Cascade Brigade Sign-Off Required for Camp Build

**Gate:** Cascade Brigade (Dept of Public Works)
**Rule:** No theme camp is marked active without DPW infrastructure check
**Enforcement:** BLOCK
**Test:** Attempt to activate camp cluster JSON without Cascade Brigade validation → expect BLOCK
**Rationale:** A camp without structural validation is a camp without a foundation. DPW ensures that what gets built can stand.

### SC-04: Restoration Pass Runs Before Deprecation

**Gate:** Restoration Pass (Earth Guardians + Cleanup)
**Rule:** Attempting to deprecate a skill before LNT pass returns BLOCK
**Enforcement:** BLOCK
**Test:** Attempt to mark skill as deprecated without Restoration Pass dependency scan → expect BLOCK
**Rationale:** Leave No Trace means no orphaned dependencies, no dangling references, no debris. Clean up before you leave.

### SC-05: Yearbook Rule Enforced

**Gate:** Stamp System (cross-cutting)
**Rule:** A rig cannot stamp its own completion
**Enforcement:** BLOCK (stamp rejected)
**Test:** Rig fox-042 attempts to stamp work_ref owned by fox-042 → expect rejection with "yearbook rule" message
**Rationale:** Self-certification violates Decommodification. Recognition comes from the community, never from yourself.

### SC-06: Anti-Commodification Gate

**Gate:** Stamp System + Analytics (cross-cutting)
**Rule:** Leaderboard or vanity metric generation returns BLOCK; Decommodification principle enforced
**Enforcement:** BLOCK
**Test:** Attempt to aggregate stamps into ranked list, count-based leaderboard, or competitive display → expect BLOCK
**Rationale:** Stamps exist to recognize contribution, not to compete. The moment stamps become currency, the gift economy dies.

---

## Safety Boundary Table

| Consideration | Boundary | Implementation | Enforcement |
|--------------|----------|----------------|-------------|
| Burning Man trademark | GATE | Use "virtual-BRC" / playa-sim language, not "Burning Man" branding in skill names | WARN on detection |
| Emergency services roles | ABSOLUTE | Tide Pool Medical is mandatory-pass; never simulated as cosmetic | BLOCK (SC-01) |
| Cultural appropriation | GATE | All PNW names from ecological taxonomy, not Indigenous cultural names | WARN on detection |
| Anti-commodification | ABSOLUTE | No leaderboards, vanity metrics, paid acceleration of trust levels | BLOCK (SC-06) |
| LNT enforcement | ABSOLUTE | Restoration Pass must complete before any skill deprecation | BLOCK (SC-04) |
| Identity integrity | ABSOLUTE | Columbia Gate validates all rig identifiers before any board activity | BLOCK (SC-02) |
| Infrastructure safety | ABSOLUTE | Cascade Brigade validates all camp builds before activation | BLOCK (SC-03) |
| Self-certification | ABSOLUTE | Yearbook Rule prevents self-stamping | BLOCK (SC-05) |

---

## Civic Agent Dependency Graph

```
Columbia Gate (SC-02)
  ├── validates identity for → Wanted Board (Esplanade Feed)
  ├── validates identity for → All camp membership
  └── validates identity for → All stamp operations
       └── enforces → Yearbook Rule (SC-05)
       └── enforces → Anti-Commodification (SC-06)

Cascade Brigade (SC-03)
  ├── validates structure for → All camp activations
  └── coordinates with → Restoration Pass (camp strike)

Watershed Watch (cross-cutting)
  ├── monitors → All civic agents
  ├── monitors → All camp activities
  └── escalates to → Tide Pool Medical

Tide Pool Medical (SC-01)
  ├── gates → All health-critical operations
  ├── overrides → Columbia Gate (medical emergency ONLY)
  └── receives from → Watershed Watch (safety alerts)

Restoration Pass (SC-04)
  ├── gates → All skill deprecations
  ├── coordinates with → Cascade Brigade (camp strike)
  └── notifies → Raven Archive (chronicle entry)

Raven Archive (RECOMMENDED)
  └── records → All civic agent actions, camp events, skill promotions
```

---

## Safety Integration with Principles

| Principle | Safety Impact | Gate(s) |
|-----------|-------------|---------|
| Radical Inclusion | Open access must still require identity (not credentials) | SC-02 |
| Decommodification | Stamps are recognition, not currency | SC-05, SC-06 |
| Civic Responsibility | Infrastructure agents are mandatory, not optional | SC-01, SC-03 |
| Leaving No Trace | Cleanup before departure, always | SC-04 |
| All 10 Principles | None override safety gates | All SC tests |

---

*"Safety is not a department — it is a culture." — Black Rock Rangers*
