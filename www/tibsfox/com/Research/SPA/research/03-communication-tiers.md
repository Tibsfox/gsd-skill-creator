# Order Up

> **Domain:** Signal Architecture & Agent Communication
> **Module:** 3 -- Multi-Tier Communication Bus
> **Through-line:** *The signal does not need to be louder than the noise. It needs to be different from the noise.* Three communication tiers -- covert, directed, broadcast -- mirror the full range of biological signaling, from the frog's body posture to the kitchen's "ORDER UP!" that cuts through chaos.

---

## Table of Contents

1. [The Communication Problem](#1-the-communication-problem)
2. [Tier 1: Covert (Haptic / Private)](#2-tier-1-covert)
3. [Tier 2: Directed (Whisper / Targeted)](#3-tier-2-directed)
4. [Tier 3: Broadcast (Order Up / All-Hands)](#4-tier-3-broadcast)
5. [The Chorus Coordination Protocol](#5-the-chorus-coordination-protocol)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. The Communication Problem

All agent communication currently flows through the same mechanism regardless of urgency, sensitivity, or audience. There is no distinction between [1]:

- A broadcast that must reach every agent instantly ("PAUSE ALL")
- A directed message to a specific agent ("check this dependency")
- A covert signal that should not be visible to other processes (haptic feedback to a human)

The "order up" call and the whispered correction use the same channel at the same volume. This is like a restaurant where every message -- from the head chef's emergency stop to the busser's quiet question about table 4 -- comes through the same PA system.

---

## 2. Tier 1: Covert

| Property | Value |
|----------|-------|
| **Direction** | Point-to-point |
| **Visibility** | Sender and receiver only |
| **Analogy** | Phone vibrating in your pocket |
| **Latency** | Best-effort |
| **Mechanism** | Direct message queue |

### 2.1 Use Cases

- Human notification without broadcast (dashboard alert, haptic buzz)
- Agent-to-agent private signal (dependency check without team disruption)
- Stealth mode feedback (information delivered without observable side effects)

### 2.2 Physical Application

In the physical world, covert communication is haptic. A phone vibrating a pattern against your palm in a dark room tells you where the walls are without emitting light or sound. The vibration channel is private to the person holding the phone -- no one else in the room perceives it.

### 2.3 Implementation

```
CAPCOM -> human: dashboard notification (visual, no audio)
Agent -> agent: direct queue message (not broadcast)
System -> human: haptic pattern (vibration, non-visual)
```

The covert channel is invisible to non-recipient agents. Verification: non-recipient agents' logs contain zero references to covert messages.

---

## 3. Tier 2: Directed

| Property | Value |
|----------|-------|
| **Direction** | One-to-one or one-to-few |
| **Visibility** | Named recipients only |
| **Analogy** | Speaking to the person next to you |
| **Latency** | Normal |
| **Mechanism** | Named-address routing |

### 3.1 Use Cases

- Task delegation without team disruption
- Correction or redirection of a specific agent
- Specialist consultation (one agent requesting help from another)
- TOPO restructuring specific agents without affecting others

### 3.2 Implementation

Agents are addressable by name. A directed message specifies the recipient(s) and is routed only to them. Other agents on the message bus do not receive or process directed messages not addressed to them.

```
Agent "executor-a" -> Agent "cartographer": "verify spatial model"
TOPO -> Agent "narrator": "reduce scope to events only"
FLIGHT -> Agent "sentinel": "increase monitoring frequency"
```

---

## 4. Tier 3: Broadcast

| Property | Value |
|----------|-------|
| **Direction** | One-to-all |
| **Visibility** | Every agent in the system |
| **Analogy** | "ORDER UP!" / chorus going silent |
| **Latency** | Immediate (interrupt-level) |
| **Mechanism** | Interrupt signal + file system |

### 4.1 Use Cases

- Emergency pause (safety boundary crossed)
- Phase transition announcement
- Resource alert (budget ceiling approaching)
- Go/No-Go signal at wave boundary
- The Frog Protocol SILENCE phase

### 4.2 The "Order Up" Pattern

In a noisy kitchen, a trained server's brain extracts "ORDER UP!" from the chaos -- not because it is louder than the ambient noise, but because it is *spectrally distinct*. The call has a frequency profile, timing pattern, and prosodic contour that the brain has learned to extract from background noise.

The broadcast signal in GSD works the same way: it uses an encoding that is orthogonal to normal agent communication. It cannot be confused with regular traffic regardless of system load. The signal stands out against the background the way "ORDER UP!" stands out against kitchen noise.

### 4.3 Implementation

```
Broadcast mechanism: .planning/CHORUS_PAUSE (file creation)
Resume mechanism:    .planning/CHORUS_RESUME (file creation)

Properties:
- Every agent monitors for these files passively
- File appearance triggers immediate state snapshot + halt
- No acknowledgment required
- No round-trip communication
- Latency: <1 second to reach all active agents
```

The file system signal is the computational equivalent of the fox's footstep -- every agent senses it because they cannot help but notice when their environment changes. The signal does not require agents to poll for it; the file system event is ambient.

---

## 5. The Chorus Coordination Protocol

The frog chorus starts, synchronizes, and stops without a conductor. Individual frogs follow local rules, and global coherence emerges from local behavior. The Chorus Coordination Protocol implements this principle for agent teams [1]:

### 5.1 Key Operations

| Operation | Mechanism | Properties |
|-----------|-----------|------------|
| **Distributed pause** | File system signal | Every agent stops independently; no round-trip; <500ms for 5 agents |
| **State preservation** | Agent-local snapshot | Each agent saves state for seamless resume; zero data loss |
| **Graduated resume** | Scout-first protocol | Scout re-engages first; others follow only after scout success |
| **Tempo synchronization** | Output rate observation | Agents adjust work rate to match team rhythm; prevents racing ahead or falling behind |

### 5.2 Distributed Pause vs. Centralized Stop

| Property | Centralized Stop | Distributed Pause (Chorus) |
|----------|-----------------|---------------------------|
| Latency | O(n) -- sequential notification | O(1) -- simultaneous sensing |
| Single point of failure | Yes (coordinator) | No (every agent senses independently) |
| Acknowledgment required | Yes (coordinator confirms) | No (silence IS the acknowledgment) |
| Scale | Degrades with agent count | Constant regardless of count |
| Biological analog | Conductor stopping orchestra | Flock of starlings turning simultaneously |

### 5.3 Tempo Synchronization

Agents in a team should work at a sustainable pace relative to each other. If one agent races ahead while others fall behind, the team output becomes uneven and coordination suffers.

The Chorus Coordination Protocol enables tempo synchronization through passive observation: each agent monitors the output rate of its peers and adjusts its own pace to maintain rhythm. This is the same mechanism that synchronizes the frog chorus -- individual callers match the tempo of nearby callers, and the whole chorus converges to a shared rhythm.

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Cellular signaling; insulin-as-broadcast; Hundred Voices proof |
| [DAA](../DAA/index.html) | Signal extraction from noise; spectral orthogonality; the "ORDER UP!" as acoustic engineering |
| [ECO](../ECO/index.html) | Quorum sensing in bacteria; distributed coordination without central control |
| [MCR](../MCR/index.html) | Minecraft redstone signaling; broadcast vs. directed communication in game systems |
| [ARC](../ARC/index.html) | Visual attention as signal extraction; figure-ground separation |

---

## 7. Sources

1. Spatial Awareness Mission Package (GSD, March 8, 2026).
