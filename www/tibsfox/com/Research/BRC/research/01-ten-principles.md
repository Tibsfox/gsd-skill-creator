# Playa Ethics in Code

> **Domain:** Community Philosophy & System Design
> **Module:** 1 -- The Ten Principles as GSD Architectural Guidelines
> **Through-line:** *The playa is not a place you visit. It is something you do.* Every GSD architectural decision is a principle made structural.

---

## Table of Contents

1. [The Origin of the Ten Principles](#1-the-origin-of-the-ten-principles)
2. [Radical Inclusion -- Open Skill Access](#2-radical-inclusion----open-skill-access)
3. [Decommodification -- Anti-Gamification](#3-decommodification----anti-gamification)
4. [Gifting -- Unconditional Skill Share](#4-gifting----unconditional-skill-share)
5. [Radical Self-Reliance -- Agent Autonomy](#5-radical-self-reliance----agent-autonomy)
6. [Communal Effort -- Multi-Agent Topology](#6-communal-effort----multi-agent-topology)
7. [Radical Self-Expression -- User-Defined Content](#7-radical-self-expression----user-defined-content)
8. [Civic Responsibility -- Safety Warden Pattern](#8-civic-responsibility----safety-warden-pattern)
9. [Leaving No Trace -- LNT Cleanup Agent](#9-leaving-no-trace----lnt-cleanup-agent)
10. [Participation -- Execution-First Model](#10-participation----execution-first-model)
11. [Immediacy -- Cache-Optimized Activation](#11-immediacy----cache-optimized-activation)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Origin of the Ten Principles

Burning Man co-founder Larry Harvey wrote the Ten Principles in 2004, not as rules but as "a reflection of the community's ethos and culture as it had organically developed since the event's inception." They describe behaviors that emerged from participation -- not mandates imposed from above, but patterns crystallized from below.

This origin matters for the GSD mapping. The principles are not a governance layer. They are an emergent architecture -- the same way a skill is not a rule but a pattern that was promoted from observed behavior.

The Ten Principles, in order:

| # | Principle | Core Behavior |
|---|-----------|--------------|
| 1 | Radical Inclusion | No prerequisites for participation |
| 2 | Gifting | Value given without expectation of return |
| 3 | Decommodification | No commercial transactions within the community |
| 4 | Radical Self-Reliance | Each participant provides for themselves |
| 5 | Radical Self-Expression | Expression belongs to the expresser |
| 6 | Communal Effort | Cooperation and collaboration valued |
| 7 | Civic Responsibility | Community members care for the commons |
| 8 | Leaving No Trace | The environment is restored after participation |
| 9 | Participation | Being requires doing |
| 10 | Immediacy | Direct experience over mediated experience |

---

## 2. Radical Inclusion -- Open Skill Access

**BRC Principle:** Anyone may be a part of Burning Man. No conditions are set. Burning Man is open to all people.

**GSD Guideline:** No prerequisite gates on skill discovery. Any rig may attempt any wanted-board item at Level 1.

### 2.1 Implementation Pattern

The default posture for all skill entries in the virtual BRC catalog is open. A rig with no stamps, no prior completions, and no affiliation can attempt any Level 1 skill from the Esplanade Feed. The system presents difficulty honestly but never blocks access.

Prerequisites exist inside skills (dependencies between tasks) but never at the skill entry point. The gate is the work itself, not the gatekeeping.

### 2.2 Anti-Pattern

A system that requires a "beginner badge" before attempting a "beginner skill" violates Radical Inclusion by adding a step before the first step. The first step IS the skill. Anything before it is a fence.

---

## 3. Decommodification -- Anti-Gamification

**BRC Principle:** In order to preserve the spirit of gifting, our community seeks to create social environments that are unmediated by commercial sponsorships, transactions, or advertising.

**GSD Guideline:** Stamps cannot be traded, sold, or aggregated into leaderboards. No vanity metrics.

### 3.1 Implementation Pattern

A stamp is an attestation, not a currency. It records that a rig completed a task and that another rig witnessed it. It cannot be:

- Traded or transferred between rigs
- Aggregated into a score or ranking
- Used to unlock paid features
- Displayed publicly in a ranked format

The system offers no "most stamps" display, no leaderboard, no achievement wall. Completing a task is its own reward. The stamp is the record, not the trophy.

### 3.2 Why This Matters

Gamification turns participation into competition. Competition turns contribution into performance. Performance turns authenticity into strategy. The moment a burner starts optimizing their stamp count instead of their experience, they have left the playa without moving.

---

## 4. Gifting -- Unconditional Skill Share

**BRC Principle:** Burning Man is devoted to acts of gift giving. The value of a gift is unconditional. Gifting does not contemplate a return or an exchange for something of equal value.

**GSD Guideline:** Skills are published without expectation of reciprocal use. No license restrictions on skill content.

### 4.1 Implementation Pattern

When a rig publishes a skill to the Black Sand Flat (the Dolt commons), that skill becomes available to every other rig in the city with no reciprocal obligation. The rig does not "own" the skill after publication. It has given it.

The technical form of this: skills published to the commons carry no usage restriction. They can be adapted, extended, forked, or combined by any rig. Attribution is a courtesy, not a condition.

### 4.2 The Gift Economy of Patterns

Skill promotion itself is a gift economy mechanism. When the system observes a pattern across multiple sessions and promotes it into a reusable skill, it is transforming individual labor into community asset. The individual rig's effort becomes available to all future rigs at zero marginal cost. That is the mycorrhizal economy -- nutrients flowing from root to root through the network, with no individual tree keeping score.

---

## 5. Radical Self-Reliance -- Agent Autonomy

**BRC Principle:** Burning Man encourages the individual to discover, exercise, and rely on their inner resources.

**GSD Guideline:** Each agent carries its own context. No external dependency for core execution.

### 5.1 Implementation Pattern

A rig that arrives at the playa self-sufficient carries its own water, food, shelter, and tools. It does not depend on the playa providing what it should have brought.

The GSD analog: a skill that can execute without querying an external service for its core behavior. Skills declare their dependencies upfront in the manifest. If the dependency is unavailable, the skill fails gracefully and reports the failure -- it does not silently degrade or block.

### 5.2 Context Portability

Each agent session pre-inlines its context from disk. The session does not ask the system "what do I need to know?" -- it arrives already knowing, having loaded its task plan, prior summaries, and relevant skills before the first tool call. Self-reliance is architectural, not aspirational.

---

## 6. Communal Effort -- Multi-Agent Topology

**BRC Principle:** Our community values creative cooperation and collaboration. We strive to produce, promote, and protect social networks, public spaces, works of art, and methods of communication that support such interaction.

**GSD Guideline:** No skill works alone. All skills declare their camp affiliation and collaboration surface.

### 6.1 Implementation Pattern

Every skill in the virtual BRC catalog has:

- A `camp` field: which theme camp it belongs to
- A `collaborates_with` list: skills it can combine with to produce emergent art installations
- A `requires` list: skills that must be available in the city for this skill to activate

No skill is an island. The catalog explicitly models interdependence.

### 6.2 The Multi-Agent Wave

The fleet activation profile -- where all eight CEDAR chips execute in parallel tracks before a synthesis pass -- is communal effort made operational. Track A and Track B run simultaneously, not in deference to each other, but producing output that ORCA and GEODUCK synthesize into something neither track could produce alone. The whole is not the sum. The whole is the interaction.

---

## 7. Radical Self-Expression -- User-Defined Content

**BRC Principle:** Radical self-expression arises from the unique gifts of the individual. No one other than the individual or a collaborating group can determine its content.

**GSD Guideline:** Skill content policy is set by the rig, not the system. Only safety boundaries are enforced by the Safety Warden.

### 7.1 Implementation Pattern

The system does not audit skill content for style, approach, or methodology. A rig can implement the "Osprey Survey" skill using any internal logic it chooses. The system validates:

1. The skill produces the declared artifact
2. The skill does not violate safety-critical boundaries (Civic Responsibility / Safety Warden)
3. The skill does not claim capabilities it does not have

Everything inside those constraints belongs to the rig.

### 7.2 Limits of Self-Expression

Self-expression ends where safety begins. A theme camp that causes harm to the playa, other participants, or the environment violates Civic Responsibility -- which is a harder constraint than self-expression is a permission. The Safety Warden is the structural expression of this limit.

---

## 8. Civic Responsibility -- Safety Warden Pattern

**BRC Principle:** We value civil society. Community members who organize events should assume responsibility for public welfare and endeavor to communicate civic responsibilities to participants.

**GSD Guideline:** Infrastructure agents (Gate, Rangers, Medical) are mandatory-pass gates that cannot be bypassed.

### 8.1 The Safety Warden Architecture

The following civic agent roles are non-optional in any virtual BRC deployment:

| Role | PNW Name | Function |
|------|----------|----------|
| Gate | Columbia Gate | Entry/exit flow management; identity verification |
| Rangers | Watershed Watch | Community safety; conflict de-escalation |
| Medical | Tide Pool Medical | Emergency response; health monitoring |
| DPW | Cascade Brigade | Infrastructure build/strike; dependency management |

These roles cannot be disabled, bypassed, or replaced with no-ops. They are the load-bearing civic structure of the city.

### 8.2 Mandatory-Pass Gate Pattern

A mandatory-pass gate means that no execution path exists that bypasses the gate. Not "please pass through safety review" but "the execution engine cannot advance without safety review." The gate is structural, not advisory.

---

## 9. Leaving No Trace -- LNT Cleanup Agent

**BRC Principle:** Our community respects the environment. We are committed to leaving no physical trace of our activities wherever we gather.

**GSD Guideline:** Deprecated skills are fully dereferenced. No orphaned dependencies. The playa is restored.

### 9.1 The LNT Cleanup Agent

When a skill is deprecated in the virtual BRC, the LNT cleanup agent performs:

1. Dependency audit: identify all skills that list this skill in `requires`
2. Cascade notification: alert dependent skills of the upcoming deprecation
3. Graceful handoff: wait for dependent skills to resolve their dependency before final removal
4. Full dereferencing: remove the skill from all indexes, wanted boards, and camp manifests
5. Playa restoration: the space where the skill existed is now clean -- available for a new skill

The playa is not degraded by the skill's removal. It is returned to the condition it was in before the skill arrived.

### 9.2 MOOP Protocol

Matter Out Of Place. Any artifact, stub, or orphaned reference left behind after a skill deprecation is MOOP. The LNT agent sweeps for MOOP after every deprecation cycle. A city with MOOP is a city that disrespects the environment it operates in.

---

## 10. Participation -- Execution-First Model

**BRC Principle:** Our community is committed to a radically participatory ethic. We believe that transformative change, whether in the individual or in society, can occur only through the medium of deeply personal participation.

**GSD Guideline:** "Achieve being through doing." Skills activate on attempt, not on qualification.

### 10.1 The Execution-First Pattern

A rig does not become a "Watershed Watch Ranger" by reading about the role, watching others do it, or passing a quiz. It becomes a ranger by attempting the first ranger skill. The skill itself teaches through execution.

This is the opposite of credential-first systems. The credential emerges from the work, not before it.

### 10.2 The Correction Pipeline as Participation

The skill promotion pipeline requires three corrections before a pattern is promoted. This means the rig must be actively practicing -- making errors and recovering -- for the system to learn from it. Passive observation produces no signal. Only doing generates the data that becomes skill.

---

## 11. Immediacy -- Cache-Optimized Activation

**BRC Principle:** Immediate experience is, in many ways, the most important touchstone of value in our culture. We seek to overcome barriers that stand between us and a recognition of our inner selves.

**GSD Guideline:** Zero-lag skill lookup. 5-minute cache TTL. No bureaucratic wait states.

### 11.1 The Cache Architecture

The CEDAR chipset maintains a 5-minute relevance cache for loaded skills. When a rig activates a skill, the system does not re-scan the entire skill corpus for relevance -- it uses the cached relevance scores from the previous scan. If the context has changed significantly enough to invalidate the cache (new phase, new task type), the cache expires and a fresh scan runs.

The goal is that skill activation feels instantaneous. The playa does not make you wait for art. The system does not make you wait for tools.

### 11.2 Zero Bureaucratic Wait States

A "wait state" in a digital system is the equivalent of a form you have to fill out before you can enter the festival. Immediacy eliminates wait states. The skill is available. The rig attempts it. The execution begins. Documentation and attestation happen after the work, not before.

---

## 12. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Civic infrastructure patterns; server-level gate management |
| [CMH](../CMH/index.html) | Mesh networking for federation; distributed playa communication |
| [FFA](../FFA/index.html) | Art installation culture; community creative expression |
| [TIBS](../TIBS/index.html) | Community principles grounded in place; cultural ethics |
| [WAL](../WAL/index.html) | Gift economy of creative work; unconditional sharing |
| [GSD2](../GSD2/index.html) | Systematic execution methodology; state machine architecture |

---

## 13. Sources

1. [Burning Man: The 10 Principles](https://burningman.org/about/10-principles/) -- Larry Harvey, 2004
2. [Burning Man: Civic Responsibilities](https://burningman.org/black-rock-city/volunteering/)
3. [Burning Man: Leave No Trace](https://burningman.org/event/preparation/leaving-no-trace/)
4. [skill-creator-wasteland-integration-analysis.md](https://github.com/Tibsfox/gsd-skill-creator) -- Strategic convergence analysis
5. [Wasteland MVR Schema](https://github.com/steveyegge/wasteland) -- Rig, wanted board, completions, stamps
6. [tibsfox.com/PNW](https://tibsfox.com/PNW/) -- Pacific Northwest bioregion naming taxonomy
