# Polyrhythm as Synchronization Protocol

> **Domain:** Systems Theory, Network Synchronization, and Distributed Temporal Coordination
> **Module:** 6 -- Polyrhythmic structures as synchronization primitives, clock distribution, consensus mechanisms, biological rhythm, and the deep isomorphism between musical time-keeping and protocol design
> **Through-line:** *Every network needs a clock. Every clock needs a protocol. Every protocol is a rhythm.* The TCP handshake is a 3:2 polyrhythm between client and server. The MIDI clock is a metronome distributed over a serial bus. The firefly flash synchronization is a phase-coupled oscillator array that converges to unison without a conductor. Polyrhythm is not a metaphor for synchronization -- it is synchronization, observed in the specific domain where humans evolved to do it best: music.

---

## Table of Contents

1. [Synchronization as Temporal Alignment](#1-synchronization-as-temporal-alignment)
2. [Biological Clocks: Circadian and Ultradian Polyrhythms](#2-biological-clocks-circadian-and-ultradian-polyrhythms)
3. [Firefly Synchronization and Coupled Oscillators](#3-firefly-synchronization-and-coupled-oscillators)
4. [Network Clock Distribution](#4-network-clock-distribution)
5. [MIDI Clock and Musical Synchronization](#5-midi-clock-and-musical-synchronization)
6. [Consensus Mechanisms and Rhythmic Agreement](#6-consensus-mechanisms-and-rhythmic-agreement)
7. [Phase-Locked Loops and Tempo Tracking](#7-phase-locked-loops-and-tempo-tracking)
8. [Polyrhythm in Swarm Behavior](#8-polyrhythm-in-swarm-behavior)
9. [The Conductor Problem: Distributed vs. Centralized Timing](#9-the-conductor-problem-distributed-vs-centralized-timing)
10. [Rhythm as Error Correction](#10-rhythm-as-error-correction)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Synchronization as Temporal Alignment

Synchronization is the process by which two or more periodic systems align their phases. In its simplest form, synchronization means "hitting the downbeat together." The mathematical framework is phase coupling: each oscillator adjusts its phase based on the phase difference between itself and its neighbors [1].

### The Synchronization Spectrum

```
SYNCHRONIZATION MODES
================================================================

  MODE           DESCRIPTION                  MUSICAL ANALOG

  Unison         All oscillators in phase     Ensemble unison
  Phase-locked   Fixed phase offset           Canon / round
  Frequency-locked  Same frequency, free phase   Same tempo, different downbeat
  Polyrhythmic   Related frequencies (p:q)    Polyrhythm
  Chaotic        No stable relationship       Free improvisation
  Drift          Slowly diverging phases      Phasing (Steve Reich)

  The modes form a continuum from maximum order (unison)
  to maximum independence (chaos). Polyrhythm occupies
  the middle ground: structured but not uniform.
```

### Coupling Strength and Musical Texture

The *coupling strength* between oscillators determines how quickly they synchronize and how tightly they stay synchronized. In musical terms:

- **Strong coupling:** Tight ensemble playing, locked grooves (James Brown's band)
- **Moderate coupling:** Flexible ensemble, slight timing variation (jazz combo)
- **Weak coupling:** Independent parts, occasional alignment (gamelan, some African ensembles)
- **Zero coupling:** Independent tempi (Charles Ives, Lutoslawski aleatory)

The optimal coupling strength for polyrhythm is moderate: strong enough to maintain the ratio relationship, weak enough to allow individual expression. This is Keil's "participatory discrepancy" (1987) reformulated as a coupling parameter [2].

---

## 2. Biological Clocks: Circadian and Ultradian Polyrhythms

The human body runs on multiple simultaneous clocks at different frequencies -- a biological polyrhythm [3].

### The Circadian Stack

| Clock | Period | Frequency | Function |
|-------|--------|-----------|----------|
| Circadian | ~24 hours | 0.0000116 Hz | Sleep/wake cycle |
| Ultradian (sleep) | ~90 minutes | 0.000185 Hz | REM/NREM cycle |
| Ultradian (rest-activity) | ~90-120 minutes | 0.000139-0.000185 Hz | Attention cycle |
| Cardiac | ~1 second | 1 Hz | Heart rhythm |
| Respiratory | ~4 seconds | 0.25 Hz | Breathing cycle |
| EEG alpha | ~100 ms | 10 Hz | Neural oscillation |
| EEG beta | ~40 ms | 25 Hz | Motor planning |

### The Circadian-Ultradian Polyrhythm

The circadian rhythm (24 hours) and the basic rest-activity cycle (90 minutes) form a polyrhythmic relationship:

```
24 hours / 90 minutes = 16 cycles per day
Ratio: 24:1.5 = 16:1

But the ultradian cycle is not exactly 90 minutes -- it varies
between 80 and 120 minutes depending on individual and context.

At 80 minutes: 24*60/80 = 18 cycles (ratio 18:1)
At 120 minutes: 24*60/120 = 12 cycles (ratio 12:1)

The body's polyrhythm is not fixed -- it modulates, like
a metric modulation between different ultradian periods.
```

### Heart Rate Variability as Microrhythm

A perfectly regular heartbeat is a sign of pathology (reduced heart rate variability is a predictor of cardiac events). The healthy heart exhibits micro-variations in beat timing that follow fractal statistics -- self-similar fluctuations across timescales from seconds to hours. This is the cardiac equivalent of expressive microtiming: the deviations from exact periodicity ARE the health signal [4].

### Entrainment Between Biological Clocks

Musicians in ensemble performance show measurable physiological entrainment:
- Heart rate synchronization between performers (Lindenberger et al., 2009) [5]
- Respiratory synchronization in choir singing (Muller & Lindenberger, 2011) [6]
- EEG phase coherence between performer and listener (Sanger et al., 2012)

These findings demonstrate that musical synchronization is not merely behavioral (moving together) -- it is physiological (oscillating together at the organ level). The ensemble's polyrhythm extends into the performers' bodies [7].

---

## 3. Firefly Synchronization and Coupled Oscillators

The synchronous flashing of Southeast Asian fireflies (Pteroptyx malaccae) is one of nature's most striking examples of distributed synchronization without a conductor. Thousands of fireflies in mangrove trees along riverbanks flash in near-perfect unison -- phase-locked to within a few milliseconds [8].

### The Kuramoto Model

The mathematical framework for firefly synchronization was developed by Yoshiki Kuramoto (1975). The Kuramoto model describes N coupled oscillators, each with a natural frequency omega_i, coupled through a sinusoidal phase interaction:

```
d(theta_i)/dt = omega_i + (K/N) * sum_{j=1}^{N} sin(theta_j - theta_i)

Where:
  theta_i = phase of oscillator i
  omega_i = natural frequency of oscillator i
  K = coupling strength
  N = number of oscillators
```

When coupling strength K exceeds a critical threshold K_c, the oscillators spontaneously synchronize. Below K_c, they drift independently. The transition is a phase transition in the physics sense -- a sudden, global change in behavior triggered by a local parameter [9].

### Musical Analog: The West African Drum Circle

A drum circle functions as a Kuramoto system:
- Each drummer has a natural tempo (omega_i)
- Auditory coupling provides the interaction term
- The coupling strength K is determined by how loudly each drummer plays and how attentively they listen
- Above the critical coupling strength, the ensemble locks into a shared tempo

The key insight: the ensemble does not need a conductor because the synchronization is an emergent property of the coupling. The bell player (timeline) provides a strong reference signal that biases the coupling toward a particular frequency, but even without the bell, coupled drummers will eventually synchronize [10].

---

## 4. Network Clock Distribution

Digital networks face the same synchronization problem as musical ensembles: multiple nodes must agree on a shared time reference despite varying signal delays, clock drift, and asymmetric communication paths [11].

### NTP and PTP

| Protocol | Accuracy | Method | Musical Analog |
|----------|----------|--------|---------------|
| NTP (Network Time Protocol) | 1-50 ms | Hierarchical strata | Conductor hierarchy |
| PTP (IEEE 1588) | < 1 microsecond | Master-slave with delay measurement | Master clock (bell) |
| GPS timing | ~10 ns | Satellite broadcast | External reference (pitch pipe) |
| Crystal oscillator | ~50 ppm drift | Local free-running | Individual musician's internal tempo |

### Clock Drift and Beat Drift

Clock drift in digital systems is measured in parts per million (ppm). A crystal oscillator with 50 ppm accuracy drifts by 50 microseconds per second -- 4.32 seconds per day. This is directly analogous to SMPTE drop-frame timecode's 3.6-second hourly drift: both are consequences of clocks that almost -- but not quite -- agree on the base frequency [12].

```
CLOCK DRIFT ANALOGY
================================================================

  Digital system:
  Clock A: 10.000000 MHz (exact)
  Clock B: 10.000050 MHz (50 ppm fast)
  Drift: 50 us/s = 4.32 s/day
  Correction: NTP adjustments (phase-locked loop)

  Broadcast system:
  NTSC: 29.970030 fps (1000/1001 of 30)
  Wall clock: 30.000000 fps equivalent
  Drift: 3.6 s/hour = 86.4 s/day
  Correction: Drop-frame timecode (rhythmic skip pattern)

  Musical ensemble:
  Drummer: 120.5 BPM (slightly fast)
  Target: 120.0 BPM
  Drift: 0.5 beats/minute = ~8 beats/hour
  Correction: Listening to the bell (auditory coupling)

  Same problem. Same solution structure. Different domain.
```

### The Metronome as Master Clock

A metronome is a PTP grandmaster clock for music. It broadcasts a timing reference; all performers synchronize to it. The metronome's "accuracy" (crystal oscillator, typically < 1 ppm in modern electronic metronomes) vastly exceeds human timing precision (~10-30 ms jitter). The metronome provides the same service as a GPS timing signal: an external, high-precision reference that establishes a shared temporal framework [13].

---

## 5. MIDI Clock and Musical Synchronization

### MIDI Clock as Network Timing Protocol

MIDI clock transmits 24 pulses per quarter note (24 PPQN) as a continuous stream of timing messages. Any device receiving MIDI clock can synchronize its internal sequencer to the master clock source. The protocol is hierarchical (one master, multiple slaves) and unidirectional (master to slave only) [14].

```
MIDI CLOCK PROTOCOL
================================================================

  Message: 0xF8 (Timing Clock) -- sent 24 times per quarter note
  At 120 BPM: 48 messages per second (every 20.83 ms)

  Additional messages:
  0xFA = Start (begin playback from position 0)
  0xFB = Continue (resume from current position)
  0xFC = Stop (halt playback)
  0xF2 = Song Position Pointer (14-bit, in units of 6 MIDI clocks)

  Latency: ~1 ms (MIDI serial transmission delay)
  Jitter: ~0.32 ms (one byte at 31.25 kbaud)

  Compared to NTP (1-50 ms accuracy), MIDI clock is
  actually a very tight synchronization protocol --
  sub-millisecond jitter in a 1983 technology.
```

### MIDI 2.0 Jitter Reduction Timestamps

MIDI 2.0 (2020) introduced Jitter Reduction Timestamps (JR Timestamps) -- a mechanism where the sender pre-stamps each message with a sub-millisecond timestamp. The receiver uses these timestamps to reconstruct the exact intended timing, compensating for transmission jitter. This is the musical equivalent of PTP's delay compensation: measuring the "round trip time" of the communication channel and adjusting for it [15].

### Ableton Link

Ableton Link (2016) is a peer-to-peer music synchronization protocol that allows multiple devices to share a tempo and phase without a designated master. Unlike MIDI clock's hierarchical model, Link uses a consensus protocol where all peers contribute to the shared state. This is musically significant because it models the *democratic ensemble* rather than the *conductor model* [16].

```
SYNCHRONIZATION MODELS COMPARED
================================================================

  MIDI Clock (hierarchical):
  Master --> Slave 1
         --> Slave 2
         --> Slave 3
  One source of truth. If master fails, all lose sync.
  Musical analog: conductor + orchestra.

  Ableton Link (peer-to-peer):
  Peer 1 <--> Peer 2
  Peer 1 <--> Peer 3
  Peer 2 <--> Peer 3
  Consensus tempo. Any peer can join/leave.
  Musical analog: jazz combo, drum circle.

  PTP/GPS (external reference):
  GPS Satellite --> Node 1
                --> Node 2
                --> Node 3
  External truth. Nodes sync to reference, not each other.
  Musical analog: click track / metronome.
```

> **Related:** [Cross-Rhythm Mathematics](02-cross-rhythm-mathematics.md), [Rhythm and Frequency](05-rhythm-frequency-hz.md)

---

## 6. Consensus Mechanisms and Rhythmic Agreement

### Byzantine Fault Tolerance and the Off-Beat Drummer

The Byzantine Generals Problem (Lamport, 1982) asks: how can a distributed system reach agreement when some nodes may be faulty or malicious? In rhythmic terms: how does the drum circle maintain tempo when one drummer is playing a different pattern -- or deliberately playing wrong? [17]

The answer in both domains is redundancy and majority rule:
- **Network:** Require 2/3 + 1 agreeing nodes to accept a value
- **Drum circle:** The majority tempo wins; deviant drummers either adjust or are ignored
- **Clave matrix:** The timeline pattern is the "consensus" -- all parts must align to it or be "cruzado" (crossed)

### Blockchain as Temporal Ledger

A blockchain is a distributed sequence of timestamps -- a polyrhythmic ledger where each block is a "beat" and each chain fork is a "polymetric divergence" that must be resolved to a single canonical sequence. The "longest chain rule" in proof-of-work consensus is analogous to the "strongest beat wins" principle in metric entrainment [18].

---

## 7. Phase-Locked Loops and Tempo Tracking

### The PLL as Musical Tempo Tracker

A Phase-Locked Loop (PLL) is an electronic circuit that synchronizes its output frequency to an input reference signal. The PLL's three components map directly onto musical tempo tracking:

```
PLL STRUCTURE AND MUSICAL ANALOG
================================================================

  Phase Detector:  Compares input phase to output phase
  Musical analog:  The ear comparing incoming beat to internal pulse

  Loop Filter:     Smooths the error signal, sets bandwidth
  Musical analog:  Temporal averaging (not reacting to every microtiming deviation)

  VCO:             Generates output frequency, adjusted by filter
  Musical analog:  Internal pulse generator, adjusted by what you hear

  PLL bandwidth:
  Narrow = slow tracking, stable (orchestral conductor)
  Wide = fast tracking, responsive (jazz drummer)
```

### Auto-DJ and Beat Matching

DJ software's auto-beat-matching feature is a digital PLL. The algorithm:
1. Detects the beat of the playing track (phase detector)
2. Compares it to the beat of the incoming track (error signal)
3. Adjusts the incoming track's playback speed (VCO control)
4. Aligns the downbeats (phase lock)

The DJ's manual beat-matching skill is the same process performed by the auditory-motor system: detect, compare, adjust. Experienced DJs achieve phase lock within 2-3 beats (~1-1.5 seconds at 120 BPM), comparable to the lock-in time of a narrow-bandwidth PLL [19].

---

## 8. Polyrhythm in Swarm Behavior

### Insect Flight Coordination

Insect swarms exhibit rhythmic coordination at multiple scales:
- Individual wing beat: 100-200 Hz (mosquitoes, bees)
- Group oscillation: 1-5 Hz (swarm coherence frequency)
- Migration cycle: seasonal (circannual rhythm)

The ratio between wing beat and swarm oscillation (roughly 50:1) creates a two-level polyrhythm. Individual insects do not consciously coordinate -- the coordination emerges from local interaction rules (avoid collision, match neighbors, head toward center), producing global rhythmic coherence without global timing information [20].

### Frog Chorus Synchronization

Male frogs calling in competition exhibit rhythmic turn-taking that minimizes overlap and maximizes individual audibility. The result is a polyrhythmic chorus where each species occupies a distinct temporal niche -- a frequency-domain interlocking analogous to the complementary rhythm principle in West African drumming. Each frog's call is a "part" in an ensemble where the silence between calls is as structurally important as the calls themselves [21].

### Heart Cell Synchronization

Cardiac pacemaker cells synchronize through gap junctions -- electrical connections that allow current to flow between adjacent cells. The Kuramoto model applies directly: each cell is an oscillator with a natural frequency, coupled to its neighbors through resistive connections. The heart's rhythm is an emergent polyrhythm of millions of coupled cellular oscillators [22].

---

## 9. The Conductor Problem: Distributed vs. Centralized Timing

### The Conductor Model

A conductor provides centralized timing: one source of truth, one temporal authority. Advantages: precise synchronization, clear hierarchy, rapid tempo changes. Disadvantages: single point of failure, latency (visual signal travels at light speed, but processing takes ~200 ms), limited scalability [23].

### The Timeline Model

West African ensembles use a fixed timeline (bell pattern) as a shared reference. The timeline is not a conductor -- it does not change tempo or cue entrances. It provides a fixed reference against which all other parts orient. This is the NTP stratum 1 model: a reliable, constant reference rather than an active director [24].

### The Consensus Model

Jazz ensembles (especially piano-less trios and quartets) operate without a conductor or fixed timeline. Tempo and feel emerge from consensus among the players. The bass establishes a pulse; the drummer responds; the soloist stretches time; the rhythm section adjusts. This is the Ableton Link model: peer-to-peer negotiation of shared temporal state [25].

### Comparative Analysis

| Property | Conductor | Timeline | Consensus |
|----------|-----------|----------|-----------|
| Authority | Centralized | Distributed (fixed) | Distributed (negotiated) |
| Tempo flexibility | High | Low | Moderate |
| Fault tolerance | Low (SPOF) | High (pattern continues) | Moderate |
| Latency | ~200 ms (visual) | ~5 ms (auditory) | ~5 ms (auditory) |
| Scalability | 100+ players | 5-30 players | 2-7 players |
| Polyrhythmic capacity | Low (unison focus) | High (cross-rhythm native) | Moderate |
| Musical cultures | European orchestral | West African, Afro-Caribbean | Jazz, chamber, improv |

---

## 10. Rhythm as Error Correction

### Temporal Error Correction in Music

Musical synchronization tolerates -- and even exploits -- timing errors. Unlike digital systems where bit errors corrupt data, rhythmic timing errors (microtiming deviations) often *improve* the musical result. The question is not "how to eliminate error" but "how much error is optimal" [26].

### The Window of Synchrony

Rasch (1979) measured timing precision in professional string quartets and found inter-onset asynchronies of 30-50 ms between nominally simultaneous notes. These deviations are perceptible in isolation but musically acceptable in context because the brain's "window of synchrony" -- the temporal range within which events are grouped as simultaneous -- is approximately 30-50 ms [27].

### Polyrhythm as Structured Error

From a signal-processing perspective, a polyrhythm is a pattern of *structured temporal offsets* -- events that are precisely placed at non-aligned grid positions. The brain's error-correction mechanism (the PLL-like tempo tracker) must decide whether these offsets are "errors" (timing deviations from the expected grid) or "signal" (intentional cross-rhythmic placement). The decision depends on context: if the offsets are periodic and ratio-related, they are parsed as polyrhythm. If random, they are parsed as sloppy playing [28].

### Redundancy and the Through-Line

The polyrhythm standard is, at its deepest level, a study in how redundant timing information creates resilience. The West African drum ensemble encodes the same temporal reference in the bell, the shaker, the low drum, and the clapping -- four independent channels carrying the same timing data. If any single channel drops out, the reference survives. This is the rhythmic equivalent of RAID (Redundant Array of Independent Disks) -- multiple copies of the timing signal distributed across independent carriers [29].

```
TEMPORAL REDUNDANCY IN DRUM ENSEMBLE
================================================================

  Bell (gankogui):   x . x x . x . x x . x .  (7/12 density)
  Shaker (axatse):   x x x x x x x x x x x x  (12/12 density)
  Low drum (kagan):  . x . . x . x . . x . x  (5/12 density)
  Handclap:          x . . x . . x . . x . .  (4/12 density)

  Pulse position 0:  Bell + Shaker + Clap       = 3 sources
  Pulse position 1:  Shaker + Kagan              = 2 sources
  Pulse position 2:  Bell + Shaker               = 2 sources
  Pulse position 3:  Bell + Shaker + Kagan + Clap = 4 sources

  Average redundancy: 2.67 sources per pulse position
  Minimum redundancy: 2 sources (no pulse has < 2)

  This is 2x to 4x temporal redundancy -- comparable to
  ECC (Error-Correcting Code) memory in computer systems.
```

> **SAFETY NOTE:** The synchronization models described in this module are analytical frameworks. Applying network engineering terminology to living cultural practices is a scholarly tool, not a claim that human music-making is reducible to protocol engineering. The richness of musical experience transcends any formal model [30].

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Kuramoto model | M2, M6 | GRD, T55 |
| MIDI clock / sync | M5, M6 | SGL, DAA |
| Ableton Link | M5, M6 | DAA |
| Biological rhythms | M5, M6 | FQC, BPS |
| Phase-locked loops | M5, M6 | SGL, T55 |
| Clock drift / NTP | M5, M6 | SGL, T55 |
| Byzantine fault tolerance | M6 | GSD2, CMH |
| Ensemble architecture | M3, M6 | BMR, TKH |
| Error correction | M2, M6 | SGL, DAA |
| Swarm behavior | M6 | BPS, ECO |

---

## 12. Sources

1. Strogatz, S.H. (2003). *Sync: How Order Emerges from Chaos in the Universe, Nature, and Daily Life*. Hyperion.
2. Keil, C. (1987). "Participatory Discrepancies and the Power of Music." *Cultural Anthropology*, 2(3), 275-283.
3. Aschoff, J. (1965). *Circadian Clocks*. North-Holland Publishing.
4. Goldberger, A.L. (1996). "Non-linear Dynamics for Clinicians: Chaos Theory, Fractals, and Complexity at the Bedside." *The Lancet*, 347(9011), 1312-1314.
5. Lindenberger, U., Li, S.C., Gruber, W. & Muller, V. (2009). "Brains Swinging in Concert." *BMC Neuroscience*, 10, 22.
6. Muller, V. & Lindenberger, U. (2011). "Cardiac and Respiratory Patterns Synchronize Between Persons During Choir Singing." *PLOS ONE*, 6(9), e24893.
7. Sanger, J., Muller, V. & Lindenberger, U. (2012). "Intra- and Interbrain Synchronization and Network Properties When Playing Guitar in Duets." *Frontiers in Human Neuroscience*, 6, 312.
8. Buck, J. (1988). "Synchronous Rhythmic Flashing of Fireflies. II." *Quarterly Review of Biology*, 63(3), 265-289.
9. Kuramoto, Y. (1975). "Self-Entrainment of a Population of Coupled Non-Linear Oscillators." In *International Symposium on Mathematical Problems in Theoretical Physics*. Springer.
10. Arom, S. (1991). *African Polyphony and Polyrhythm*. Cambridge University Press.
11. Mills, D.L. (1991). "Internet Time Synchronization: The Network Time Protocol." *IEEE Transactions on Communications*, 39(10), 1482-1493.
12. SMPTE ST 12M. Timecode drift specifications.
13. Plomp, R. (1964). "The Rate of Decay of Auditory Sensation." *JASA*, 36(2), 277-282.
14. MIDI Manufacturers Association (1996). *MIDI 1.0 Detailed Specification*. Rev 96.1.
15. MIDI Manufacturers Association (2020). *MIDI 2.0 Specification*. Version 1.0.
16. Ableton (2016). "Ableton Link: A Technology for Synchronizing Musical Beat, Tempo, and Phase Across Multiple Applications." Technical documentation.
17. Lamport, L., Shostak, R. & Pease, M. (1982). "The Byzantine Generals Problem." *ACM Transactions on Programming Languages and Systems*, 4(3), 382-401.
18. Nakamoto, S. (2008). "Bitcoin: A Peer-to-Peer Electronic Cash System." White paper.
19. Best, R.E. (2007). *Phase-Locked Loops: Design, Simulation, and Applications* (6th ed.). McGraw-Hill.
20. Reynolds, C.W. (1987). "Flocks, Herds and Schools: A Distributed Behavioral Model." *Computer Graphics*, 21(4), 25-34.
21. Gerhardt, H.C. & Huber, F. (2002). *Acoustic Communication in Insects and Anurans*. University of Chicago Press.
22. Peskin, C.S. (1975). "Mathematical Aspects of Heart Physiology." Courant Institute of Mathematical Sciences, New York University.
23. Repp, B.H. & Su, Y.H. (2013). "Sensorimotor Synchronization: A Review of Recent Research." *Psychonomic Bulletin & Review*, 20(3), 403-452.
24. Agawu, K. (2006). "Structural Analysis or Cultural Analysis?" *JAMS*, 59(1), 1-46.
25. Monson, I. (1996). *Saying Something: Jazz Improvisation and Interaction*. University of Chicago Press.
26. Madison, G. & Merker, B. (2002). "On the Limits of Anisochrony in Pulse Attribution." *Music Perception*, 19(3), 371-392.
27. Rasch, R.A. (1979). "Synchronization in Performed Ensemble Music." *Acustica*, 43, 121-131.
28. London, J. (2012). *Hearing in Time* (2nd ed.). Oxford University Press.
29. Locke, D. (1998). *Drum Gahu*. White Cliffs Media. Redundancy in ensemble architecture.
30. Agawu, K. (2003). *Representing African Music*. Routledge. On the ethics of analytical framing.
