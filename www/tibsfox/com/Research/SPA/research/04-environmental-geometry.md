# What Shape Is My Pond?

> **Domain:** Constraint Mapping & Operational Geometry
> **Module:** 4 -- Environmental Geometry Mapper
> **Through-line:** *Every frog knows instinctively: what shape is my pond? How far to the bank? Where are the rocks? Where is deep water? Agents need the same sense -- not of physical space, but of the operational constraints that define where they can and cannot go.*

---

## Table of Contents

1. [Constraint Geometry](#1-constraint-geometry)
2. [Mapping Resource Boundaries](#2-mapping-resource-boundaries)
3. [Dynamic Constraint Tracking](#3-dynamic-constraint-tracking)
4. [Physical Geometry from Acoustic Sensing](#4-physical-geometry-from-acoustic-sensing)
5. [Integration with the Frog Protocol](#5-integration-with-the-frog-protocol)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. Constraint Geometry

An agent's operating environment has a geometry just as real as a physical room. The "walls" are context window limits. The "ceiling" is the token budget. The "floor" is the minimum resource requirement to complete the task. The "other objects" are peer agents consuming shared resources [1].

The Environmental Geometry Mapper constructs and continuously updates a model of these boundaries, giving each agent awareness of:

- **How much room it has** -- distance to each constraint boundary
- **Where constraints are tightest** -- which resource is most limited
- **How the space is changing** -- are walls closing in or opening up?
- **Where peers are operating** -- who is nearby in resource space?

This is not metaphor. Context window limits are hard walls. Token budgets deplete. Rate limits are real speed constraints. The geometry mapper measures them.

---

## 2. Mapping Resource Boundaries

| Boundary | Physical Analog | Measurement | Impact |
|----------|----------------|-------------|--------|
| Context window limit | Room walls | Tokens consumed / total capacity | Hard wall -- cannot be exceeded |
| Token budget | Fuel tank | Budget spent / budget allocated | Hard ceiling -- operations stop at zero |
| Rate limits | Speed limit | Requests / time window | Soft wall -- throttled on approach |
| File system capacity | Storage room | Space used / space available | Hard wall -- writes fail at capacity |
| Session timeout | Closing time | Elapsed / maximum session duration | Hard wall -- session terminates |
| Peer agent activity | Other people in the room | Aggregate resource consumption | Dynamic -- changes with team behavior |

### 2.1 Wall Distance as Operational Metric

The most immediately useful metric is wall distance: how far is this agent from hitting any constraint? The nearest wall determines the agent's operational freedom.

```
CONSTRAINT MAP — Agent executor-a

Context:   [==========........] 62%  | 38% remaining (~76K tokens)
Budget:    [==============....] 66%  | 34% remaining
Rate:      [===...............] 18%  | Well below limit
Disk:      [=.................] 04%  | Not a concern
Session:   [========..........] 45%  | Comfortable
Nearest wall: BUDGET (34% remaining)
```

An agent with 34% budget remaining and 38% context remaining is in a comfortable position. An agent with 5% of either is approaching a wall and should either complete quickly or request reallocation.

---

## 3. Dynamic Constraint Tracking

Constraints are not static. They change as work progresses, as peer agents consume resources, and as external conditions shift [1].

### 3.1 Constraint Velocity

The geometry mapper tracks not just current position but rate of change:

| Metric | Current | Velocity | Time to Wall |
|--------|---------|----------|-------------|
| Context fill | 62% | +2.1%/min | ~18 min |
| Budget spent | 66% | +1.8%/min | ~19 min |
| Rate utilization | 18% | Stable | No concern |

**Time to Wall** is the critical planning metric. If context fill reaches 100% in 18 minutes but the remaining task requires 25 minutes, the agent must either compress its output or request a continuation strategy before hitting the wall.

### 3.2 Constraint Correlation

When multiple constraints converge simultaneously, the risk multiplies. The geometry mapper flags convergence:

- Budget and context both approaching limits = double squeeze
- Rate limit approach + peer agent spike = potential congestion
- Session timeout + incomplete task = continuation required

---

## 4. Physical Geometry from Acoustic Sensing

The Environmental Geometry Mapper extends the Deep Audio Analyzer's reflection detection to active geometry reconstruction in physical space [1].

### 4.1 Room Mapping from Ambient Sound

Using the comb filtering and RT60 techniques documented in DAA Module 03:

1. **Ambient audio capture** -- Phone microphone records ambient sound (no intentional emission)
2. **Reflection analysis** -- Comb filter detection identifies reflecting surfaces and their distances
3. **RT60 measurement** -- Characterizes room size and absorption properties
4. **Geometry assembly** -- Multiple reflection estimates combined into room model

### 4.2 Output to Haptic Feedback

The room model is communicated through non-visual, non-audible channels:

| Haptic Pattern | Meaning |
|---------------|---------|
| Short buzz, increasing frequency | Wall approaching (closer = faster buzz) |
| Long steady pulse | Open space detected |
| Double tap | Obstacle detected at height |
| Triple tap | Doorway or opening detected |

The phone becomes a spatial awareness tool for dark or vision-impaired navigation. The sensing is passive (microphone only), the output is covert (haptic only), and the processing uses established DSP techniques.

---

## 5. Integration with the Frog Protocol

The Environmental Geometry Mapper feeds directly into the Frog Protocol's threat detection and graduated response [1]:

### 5.1 Pre-Anomaly Monitoring

Before any anomaly occurs, the geometry mapper provides the baseline: "Here is the normal shape of the environment. These are the normal distances to walls. This is the normal rate of resource consumption."

### 5.2 Anomaly Geometric Signature

When the geometry changes suddenly -- a wall moves closer (context spike), the space gets crowded (new agents deployed), or a boundary shifts (budget reallocation) -- the geometric change itself is the anomaly signal.

### 5.3 Post-Classification Spatial Model

After the Frog Protocol classifies an anomaly, the geometry mapper updates the spatial model with the new object. The threat-classified object has a position, a size (resource footprint), and a trajectory (is it moving closer or farther?). This updated model persists, keeping the team aware of classified threats even during normal operation.

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Animal spatial navigation; magnetoreception; environmental geometry sensing in biology |
| [ECO](../ECO/index.html) | Elevation mapping; ecological niche as operational constraint geometry |
| [VAV](../VAV/index.html) | Voxel spatial data; 3D constraint representation |
| [CAS](../CAS/index.html) | Elevation gradients as natural constraint boundaries; treeline as hard limit |
| [DAA](../DAA/index.html) | Reflection detection; RT60; comb filter geometry -- the DSP foundation for physical sensing |

---

## 7. Sources

1. Spatial Awareness Mission Package (GSD, March 8, 2026).
