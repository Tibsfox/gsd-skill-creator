# Twenty-Five Seconds of Shared Silence

> **Domain:** Anomaly Detection & Distributed Sensing
> **Module:** 2 -- Threat Detection & The Frog Protocol
> **Through-line:** *Watch what happens when the fox arrives at the pond. The frogs go silent. Not because a central controller sent a PAUSE command. Each frog independently detected a change in its environment and independently decided to stop calling. This is distributed threat detection with zero coordination overhead.*

---

## Table of Contents

1. [Distributed Threat Detection](#1-distributed-threat-detection)
2. [The Frog Protocol: Five-Phase Graduated Response](#2-the-frog-protocol-five-phase-graduated-response)
3. [Phase Details](#3-phase-details)
4. [Probabilistic Anomaly Detection](#4-probabilistic-anomaly-detection)
5. [The Scout Pattern](#5-the-scout-pattern)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. Distributed Threat Detection

Every agent in the system participates in threat detection. This is not centralized surveillance -- it is distributed awareness, like every frog independently noticing the fox's footstep [1].

The current approach to threat detection in multi-agent systems is centralized and slow: when something goes wrong, the detection and response path runs through the Flight Director. This is the equivalent of every frog in the pond waiting for a designated lookout to announce danger. It works, but:

- It has a single point of failure (if the Flight Director is overloaded, threats go unnoticed)
- It is slow (round-trip communication to and from a central point)
- It does not scale (more agents means more traffic to the center)

The biological alternative: every entity senses its own environment and responds independently. Coordination emerges from shared responses to shared signals, not from centralized command.

---

## 2. The Frog Protocol: Five-Phase Graduated Response

Current systems are binary: everything is fine, or BLOCK. There is no graduated response -- no equivalent of the frog's twenty-five-second assessment period [1].

The Frog Protocol implements a five-phase graduated threat response:

```
BASELINE: Agents working (chorus calling)
     |
[ANOMALY DETECTED]
     |
     v
PHASE 1: SILENCE (immediate, distributed)
     |
     v
PHASE 2: ASSESS (passive observation)
     |
     v
PHASE 3: PROBE (graduated testing)
     |
     v
PHASE 4: CLASSIFY (threat model update)
     |
     v
PHASE 5: RESUME (graduated re-engagement)
```

The protocol does not centralize decision-making. Each phase has clear entry and exit criteria that agents evaluate independently. The protocol provides the structure; the agents execute it autonomously.

---

## 3. Phase Details

### 3.1 Phase 1: SILENCE (Immediate, Distributed)

**Trigger:** Anomaly signal detected by any agent
**Action:** All agents pause current work
**Duration:** Configurable (default 5-second equivalent)
**Properties:**
- No acknowledgment required -- the pause propagates through the file system signal (.planning/CHORUS_PAUSE)
- Every agent snapshots its current state for seamless resume
- The pause is instant because it requires no consensus, no round-trip, no negotiation
- Silence IS the coordination mechanism

### 3.2 Phase 2: ASSESS (Passive Observation)

**Trigger:** Silence period elapsed without additional anomalies
**Action:** A designated or volunteer scout agent characterizes the anomaly
**Duration:** Variable -- assessment continues until the anomaly is characterized
**Properties:**
- Other agents remain silent
- The environment is monitored for additional signals
- No active probing yet -- pure observation
- The assessment uses the passive sensor (Module 01) to read ambient signals

### 3.3 Phase 3: PROBE (Graduated Testing)

**Trigger:** Assessment complete, anomaly characterized but not yet classified
**Action:** Scout agent makes minimal test actions
**Duration:** Variable -- multiple probes with increasing scope
**Properties:**
- If probe succeeds without adverse reaction: escalate to next probe
- If probe fails: extend silence, escalate threat level
- The scout is taking a calculated risk to generate information for the group
- This is the first frog chirping after the silence -- if the fox reacts, the frog (and the group) learns

### 3.4 Phase 4: CLASSIFY (Threat Model Update)

**Trigger:** Probe results sufficient for classification
**Action:** Anomaly classified as THREAT, NEUTRAL, or OPPORTUNITY
**Properties:**
- Spatial model updated with new object
- If THREAT: maintain heightened awareness, restrict operations
- If NEUTRAL: resume with object tracked (the fox reclassified as "furniture")
- If OPPORTUNITY: adapt strategy to exploit the new condition

### 3.5 Phase 5: RESUME (Graduated Re-engagement)

**Trigger:** Classification complete, conditions assessed as safe
**Action:** Agents resume in priority order (not all at once)
**Properties:**
- Critical agents resume first
- Non-critical agents resume after sustained safety confirmation
- Threat object remains in spatial model indefinitely
- Awareness level remains elevated for a configurable cooldown period
- Full chorus restored only after sustained safety

---

## 4. Probabilistic Anomaly Detection

Detection is probabilistic, not binary. An anomaly has a threat level that escalates with persistence and correlation [1]:

| Signal | Single Occurrence | Correlated Pair | Three+ Synchronized |
|--------|------------------|-----------------|---------------------|
| Token consumption spike | Monitor | Investigate | Trigger Frog Protocol |
| Dependency failure | Log | Alert | Trigger Frog Protocol |
| Agent silence (unexpected) | Monitor | Investigate | Trigger Frog Protocol |
| Safety boundary approach | Alert | Trigger Frog Protocol | Emergency stop |
| Error rate increase | Monitor | Investigate | Trigger Frog Protocol |

### 4.1 Correlation Logic

A single blip might be noise. Two correlated blips from different agents are a pattern. Three synchronized anomalies from independent sources are a signal that demands response.

The correlation window is configurable. A tight window (1 second) catches rapid cascading failures. A wide window (30 seconds) catches slow-developing environmental degradation. The default is 5 seconds -- enough to catch cascading failures while filtering single-agent noise.

---

## 5. The Scout Pattern

The critical insight from the frog pond: resumption is graduated, not binary. The first frog to call again after a silence is the probe -- it is taking a calculated risk to generate information for the group [1].

### 5.1 Scout Selection

The scout is either:
- **Designated:** The agent closest to the anomaly (best positioned to assess)
- **Volunteered:** An agent that determines it is expendable or lowest-risk
- **Default:** The agent with the most resource headroom (most room to absorb a failure)

### 5.2 Scout Protocol

1. Scout makes a minimal test action (smallest possible probe)
2. Other agents observe the outcome passively
3. If scout succeeds: scout sends all-clear signal via directed channel
4. If scout fails: silence extends, threat level escalates automatically
5. All-clear propagates through graduated resume (not instant full restart)

### 5.3 Why This Works

The scout pattern solves a fundamental problem in distributed systems: after a disruption, how do you know it is safe to resume? The answer is: you send one agent first and see what happens. If it survives, the others follow. If it does not, the others stay safe.

This is the same strategy used by:
- The first frog chirping after the fox arrives
- A military point man entering a potentially hostile space
- A canary in a coal mine
- A single CI pipeline job testing the deployment before full rollout

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Animal threat detection; fight-or-flight as graduated response; cellular signaling |
| [ECO](../ECO/index.html) | Predator-prey dynamics; species alarm call systems; distributed warning |
| [MCR](../MCR/index.html) | Minecraft mob detection; spatial awareness in 3D game environments |
| [DAA](../DAA/index.html) | Audio-based threat detection; silence as information; chorus dynamics |
| [ARC](../ARC/index.html) | Visual threat perception; attention and awareness in visual space |

---

## 7. Sources

1. Spatial Awareness Mission Package (GSD, March 8, 2026).
