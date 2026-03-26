# The Story the Waveform Tells

> **Domain:** Temporal Analysis & Narrative Synthesis
> **Module:** 4 -- Temporal Narrative Engine
> **Through-line:** *Audio is inherently temporal -- things happen in sequence, and the sequence matters.* The twenty-five-second silence, the cascade trigger at 22.6 seconds, the late-arriving deep voice at 2:10 -- these are not data points. They are plot points. The Temporal Narrative Engine bridges DSP output and human meaning-making.

---

## Table of Contents

1. [Time as Story Structure](#1-time-as-story-structure)
2. [Event Detection](#2-event-detection)
3. [The Reference Recording Timeline](#3-the-reference-recording-timeline)
4. [Chorus Recruitment as Narrative Arc](#4-chorus-recruitment-as-narrative-arc)
5. [The Iterative Refinement Controller](#5-the-iterative-refinement-controller)
6. [Cross-References](#6-cross-references)
7. [Sources](#7-sources)

---

## 1. Time as Story Structure

Every recording has a narrative arc -- a beginning, development, and conclusion shaped by the events that unfold within it. The Temporal Narrative Engine detects these events, tracks their energy over time, and constructs a story from the sequence [1].

For a field recording, the narrative might be: silence, disturbance, assessment, cautious resumption, full activity, climax, conclusion. For a musical recording: intro, verse, chorus, bridge, outro. For an urban recording: dawn quiet, traffic buildup, peak hour, afternoon lull, evening activity.

The engine does not impose narrative -- it discovers it. The structure emerges from the data when the right temporal features are tracked.

---

## 2. Event Detection

Events are detected through convergence of multiple temporal features [1][2]:

### 2.1 Detection Methods

| Method | What It Detects | Resolution |
|--------|----------------|------------|
| RMS energy tracking (1s windows) | Broad energy changes, activity arcs | 1 second |
| Frog-band envelope detection (15-20ms smoothing) | Individual call events, chorus dynamics | 15-20 ms |
| Onset detection (adaptive threshold) | Sharp transients, impacts, first calls | ~5 ms |
| Zero-crossing rate change | Source type transitions | 50 ms |
| Spectral flux | Timbral changes, new source entries | 50 ms |

### 2.2 Onset Detection

Individual acoustic events are isolated using adaptive thresholding at 2.5x the noise floor. When the envelope exceeds this threshold, an onset is marked. The offset is marked when energy drops below 1.5x the noise floor. The gap between offset and next onset defines the inter-event interval -- a key metric for rhythm analysis and call rate estimation.

---

## 3. The Reference Recording Timeline

The reference recording (Pacific tree frog chorus, 2:19 duration) was reconstructed into this timeline through combined RMS, envelope, and onset analysis [1]:

| Time | Event | Evidence |
|------|-------|----------|
| 0.5s | Recorder placement | 64% sub-bass, +30 dB ILD hard right, broadband transient |
| 0-3s | Post-disturbance silence | All local callers suppressed |
| 3-15s | Distant chorus bed | Continuous 2187 Hz +/-38 Hz, -3.0 dB LEFT, modulation index 0.098 |
| 18-19s | First local calls | 10-15 ms pulses, 2100-2200 Hz, LEFT |
| 22.6s | Cascade trigger | 75-112 ms full advertisement call, 17 dB SNR -- catalyzes CENTER callers |
| 25-30s | Full onset | Multi-position calling established |
| 30-60s | Steady buildup | Call rate: 8 -> 10+ calls/sec; ISD: 104 -> 39 ms |
| 60-90s | Dense chorus | Modulation index drops below 0.1; wall of sound |
| 90-130s | Peak chorus | Tripled ILD variance -- maximum spatial distribution |
| 130-135s | Late deep caller | 1500-1700 Hz, -5.4 dB LEFT -- unusually low pitch |
| 139s | Sharp cutoff | Recording ends |

### 3.1 The Cascade Trigger

The event at 22.6 seconds is the narrative pivot. A single frog produces a full-length advertisement call (75-112 ms, 17 dB above the noise floor) -- loud, sustained, unmistakable. Within 3 seconds, callers at the CENTER position begin responding. By 30 seconds, the chorus is fully underway.

This is the "brave soul" -- the frog that decides the silence has lasted long enough and commits to a full call rather than a tentative chirp. The prior probes at 18-19 seconds were information-gathering. The cascade trigger at 22.6 seconds is a decision.

---

## 4. Chorus Recruitment as Narrative Arc

The buildup from silence to full chorus follows a classic recruitment cascade -- a narrative structure found across biological systems [1][3]:

### 4.1 The Five-Act Structure

| Act | Time | Acoustic Feature | Narrative Equivalent |
|-----|------|------------------|---------------------|
| I. Silence | 0-18s | Low RMS, distant bed only | Tension -- assessment |
| II. Probing | 18-22s | Tentative chirps, 10-15 ms | Rising action -- testing |
| III. Trigger | 22.6s | Full call, 17 dB SNR | Turning point -- commitment |
| IV. Buildup | 23-90s | Accelerating call rate, tightening intervals | Development -- recruitment |
| V. Peak | 90-139s | Maximum density, tripled ILD variance | Climax -- full chorus |

### 4.2 Quantitative Markers of Recruitment

The recruitment process produces measurable signatures:

- **Call rate acceleration:** 8 calls/sec (onset) to 10+ calls/sec (peak)
- **Interval compression:** Inter-call standard deviation drops from 104 ms to 39 ms during synchronization
- **Interval expansion:** ISD rises to 161 ms at peak density as overlap increases
- **Modulation index decline:** >0.3 (sparse) to 0.098 (wall of sound)
- **Coherence decline:** 0.275 (early) to 0.016 (peak) as callers disperse spatially

Each of these metrics independently confirms the recruitment cascade. Together they form a redundant evidence chain that makes the narrative conclusion robust.

---

## 5. The Iterative Refinement Controller

The meta-cognitive layer manages the refinement cycle itself: tracking passes, managing context, and determining when analysis has converged [1].

### 5.1 Convergence Detection

The controller asks after each pass: "Did this pass produce new information?" If Pass N+1 contains fewer than 3 new findings compared to Pass N, the analysis may have converged. The controller declares convergence or recommends another pass with specific context suggestions.

### 5.2 Information Gain Tracking

| Pass | New Findings | Context Added | Recommendation |
|------|-------------|---------------|----------------|
| 1 (Foundation) | Baseline -- all findings new | None (cold start) | Continue -- suggest source hypothesis |
| 2 (Source ID) | Species ID, call patterns, chorus dynamics | "Frogs in a pond" | Continue -- suggest spatial context |
| 3 (Spatial) | 5 caller groups, wall reflection, geometry | "Concrete wall, far side" | Continue -- suggest behavioral context |
| 4 (Narrative) | Timeline, cascade trigger, recruitment arc | "They went quiet when I arrived" | Convergence -- narrative complete |

### 5.3 Confidence Scoring

Each finding carries a confidence score:

- **High (>0.8):** Multiple independent indicators agree (species ID confirmed by frequency, call pattern, and chorus behavior)
- **Medium (0.5-0.8):** Two indicators agree or one strong indicator (wall distance from comb filter)
- **Low (<0.5):** Single weak indicator (far boundary distance from marginal reflection peak)

The spatial map, source profiles, and temporal narrative all report confidence scores, allowing the human to know which findings are robust and which are speculative.

---

## 6. Cross-References

| Project | Connection |
|---------|------------|
| [BPS](../BPS/index.html) | Signal processing pipelines; multi-pass analysis refinement in biosonar |
| [FFA](../FFA/index.html) | Audio production for animation; narrative timing in sound design |
| [WAL](../WAL/index.html) | Deep structural analysis of audio; Weird Al's forensic musical reconstruction |
| [STA](../STA/index.html) | Broadcast audio engineering; entertainment audio narrative |
| [VAV](../VAV/index.html) | Signal fidelity across transformation passes; data integrity in iterative processing |

---

## 7. Sources

1. Deep Audio Analyzer Mission Package (GSD, March 8, 2026).
2. Boll, S. (1979). "Suppression of Acoustic Noise in Speech Using Spectral Subtraction." *IEEE Trans. ASSP*, 27(2), 113-120.
3. Gerhardt, H.C. & Huber, F. (2002). *Acoustic Communication in Insects and Anurans*. University of Chicago Press.
