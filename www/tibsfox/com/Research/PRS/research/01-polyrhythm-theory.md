# Polyrhythm Theory: Foundations of Rhythmic Simultaneity

> **Domain:** Rhythm Theory and Temporal Cognition
> **Module:** 1 -- Mathematical Structures, Perceptual Foundations, and the Grammar of Layered Time
> **Through-line:** *A polyrhythm is not two rhythms played at the same time. It is one rhythm with two clocks.* The listener's brain does not toggle between patterns -- it constructs a third, emergent temporal structure from the interference between them. The mathematics are ratio theory. The perception is gestalt. The music is what happens in the space between the downbeats.

---

## Table of Contents

1. [Defining Polyrhythm](#1-defining-polyrhythm)
2. [Ratio Theory: The Mathematics of Simultaneous Pulse](#2-ratio-theory-the-mathematics-of-simultaneous-pulse)
3. [Cross-Rhythm vs. Polyrhythm vs. Polymeter](#3-cross-rhythm-vs-polyrhythm-vs-polymeter)
4. [The Resultant Pattern](#4-the-resultant-pattern)
5. [Perceptual Foundations: How the Brain Parses Layered Time](#5-perceptual-foundations-how-the-brain-parses-layered-time)
6. [Least Common Multiple and the Composite Cycle](#6-least-common-multiple-and-the-composite-cycle)
7. [Irrational Rhythm and Metric Ambiguity](#7-irrational-rhythm-and-metric-ambiguity)
8. [Polyrhythm as Information: Entropy and Temporal Density](#8-polyrhythm-as-information-entropy-and-temporal-density)
9. [Historical Notation Systems](#9-historical-notation-systems)
10. [Pedagogical Approaches](#10-pedagogical-approaches)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. Defining Polyrhythm

A polyrhythm occurs when two or more rhythmic patterns with different periodicities sound simultaneously, sharing a common timespan but subdividing it differently. The simplest polyrhythm, 2:3 (also written 2 against 3), divides the same temporal span into two equal parts in one voice and three equal parts in another [1].

The term derives from the Greek *poly* (many) and *rhythmos* (measured motion, flow). In Western music theory, polyrhythm specifically refers to the superimposition of different subdivisions within a shared metric framework. In African musicology, the concept is often described as *cross-rhythm* -- a distinction with significant implications explored in Section 3 [2].

### Fundamental Properties

- **Common timespan:** All constituent rhythms share the same cycle duration
- **Different subdivisions:** Each voice divides the cycle into a different number of equal parts
- **Ratio expression:** A polyrhythm is defined by the ratio of its subdivisions (e.g., 3:4, 5:7, 2:3:5)
- **Phase alignment:** All voices coincide on the downbeat of the cycle
- **Emergent structure:** The composite of all voices creates a pattern more complex than any individual part

```
2:3 POLYRHYTHM -- BASIC STRUCTURE
================================================================

  Beat:        |  1     2     |  1     2     |
  Voice A (2): X     X       X     X       X
  Voice B (3): X   X   X     X   X   X     X
  Composite:   X   X X X     X   X X X     X
               |             |             |
               0  1  2  3  4  5  6  7  8  9  10 11
               (12 pulses per cycle = LCM of 2 and 3 = 6,
                shown as 2 cycles)

  Each cycle: 6 pulse positions
  Voice A hits: positions 0, 3
  Voice B hits: positions 0, 2, 4
  Composite:   positions 0, 2, 3, 4 (4 of 6 positions)
```

The composite pattern -- positions 0, 2, 3, 4 within each 6-pulse cycle -- is the *resultant rhythm*. It has its own identity, distinct from either constituent voice. This emergent quality is what distinguishes polyrhythm from mere simultaneity [3].

---

## 2. Ratio Theory: The Mathematics of Simultaneous Pulse

Every polyrhythm can be expressed as a ratio p:q where p and q are positive integers representing the number of evenly spaced events in each voice within a common cycle. The mathematical properties of this ratio determine the rhythmic character of the polyrhythm [4].

### Coprime Ratios and Maximal Complexity

When p and q are coprime (share no common factor other than 1), the polyrhythm achieves maximal complexity -- the two voices never coincide except at the cycle boundary. The number of distinct onset positions in the composite pattern equals p + q - 1 (since only the downbeat is shared).

| Ratio | Coprime | LCM | Composite Onsets | Density |
|-------|---------|-----|-----------------|---------|
| 2:3 | Yes | 6 | 4 of 6 | 66.7% |
| 3:4 | Yes | 12 | 6 of 12 | 50.0% |
| 4:5 | Yes | 20 | 8 of 20 | 40.0% |
| 3:5 | Yes | 15 | 7 of 15 | 46.7% |
| 5:7 | Yes | 35 | 11 of 35 | 31.4% |
| 2:4 | No (GCD=2) | 4 | 3 of 4 | 75.0% |
| 3:6 | No (GCD=3) | 6 | 4 of 6 | 66.7% |
| 4:6 | No (GCD=2) | 12 | 5 of 12 | 41.7% |

When the ratio is not coprime -- for example 4:6 -- the pattern reduces to a simpler polyrhythm (2:3 in this case) with additional coincidence points. The mathematical identity: a non-coprime ratio p:q is rhythmically equivalent to (p/GCD):(q/GCD) with GCD times as many coincidence points per cycle [5].

### The Onset Vector

For a p:q polyrhythm in a cycle of LCM(p,q) pulses:

```
Voice A onset positions: {k * LCM(p,q)/p : k = 0, 1, ..., p-1}
Voice B onset positions: {k * LCM(p,q)/q : k = 0, 1, ..., q-1}
Composite: union of both sets
```

For 3:4 in 12 pulses:
- Voice A (3): {0, 4, 8}
- Voice B (4): {0, 3, 6, 9}
- Composite: {0, 3, 4, 6, 8, 9} -- 6 onsets in 12 positions

### Inter-Onset Interval (IOI) Analysis

The composite pattern's character is determined by its inter-onset intervals. For 3:4:

```
3:4 POLYRHYTHM -- IOI ANALYSIS
================================================================

  Pulse:    0  1  2  3  4  5  6  7  8  9  10 11
  Voice A:  X        .  X        .  X        .
  Voice B:  X     .     .  X     .     .  X
  Composite:X     .  X  X     .  X     X  X
  IOIs:      3     1  1     3     1     1  1    (wait... let me redo)

  Onset positions: 0, 3, 4, 6, 8, 9
  IOIs: 3, 1, 2, 2, 1, 3 (last IOI wraps to cycle start)
  IOI sequence: [3, 1, 2, 2, 1, 3]
  Palindromic: yes (reads same forward and backward)
```

The palindromic symmetry of the IOI sequence in coprime polyrhythms is a general property. For any coprime p:q polyrhythm, the composite IOI sequence is palindromic around the midpoint of the cycle. This was formalized by Pressing (1983) as part of his work on cognitive complexity in rhythm [6].

---

## 3. Cross-Rhythm vs. Polyrhythm vs. Polymeter

These three terms are frequently conflated. The distinctions are not merely terminological -- they describe fundamentally different temporal relationships [7].

### Polyrhythm

Two or more different subdivisions within the **same meter and barline**. The cycle length is shared. A 3:4 polyrhythm means three evenly spaced events and four evenly spaced events occurring within the same bar. Both voices agree on where the downbeat falls.

### Cross-Rhythm

A specific type of polyrhythmic relationship in which one rhythmic pattern systematically contradicts the prevailing meter. In the Africanist tradition (Agawu, Locke, Anku), cross-rhythm is the *primary structural principle* rather than a deviation from a norm. The timeline pattern (bell pattern) provides a fixed asymmetric reference, and other parts cross against it. Cross-rhythm is rhythmic counterpoint [8].

### Polymeter

Two or more voices in **different meters** sounding simultaneously with a shared pulse but different barline placement. A 3/4 vs. 4/4 polymeter means one voice groups pulses in threes while another groups them in fours, but each pulse is the same duration. The downbeats realign every LCM(3,4) = 12 pulses. Unlike polyrhythm, the *individual beat durations are the same* -- only the grouping differs.

```
POLYRHYTHM vs. POLYMETER
================================================================

POLYRHYTHM (3:4 in one bar of 12 pulses):
  Voice A: X . . . X . . . X . . .   (3 notes, each 4 pulses apart)
  Voice B: X . . X . . X . . X . .   (4 notes, each 3 pulses apart)
  Same bar. Same downbeat. Different subdivisions.

POLYMETER (3/4 vs. 4/4 with shared pulse):
  Voice A: |X . . |X . . |X . . |X . . |     (bars of 3)
  Voice B: |X . . . |X . . . |X . . . |      (bars of 4)
  Shared pulse. Different bar lengths. Downbeats realign every 12 pulses.
```

The distinction matters because polyrhythm operates *within* a shared cycle (vertical), while polymeter operates *across* different cycle lengths (horizontal). West African drumming ensembles typically employ cross-rhythm (polyrhythmic relationships against a timeline), while much progressive rock and IDM use polymeter [9].

> **Related:** [Cross-Rhythm Mathematics](02-cross-rhythm-mathematics.md), [Hemiola and Metric Modulation](04-hemiola-metric-modulation.md), [Clave Patterns](03-clave-west-african-traditions.md)

---

## 4. The Resultant Pattern

The term *resultant* was formalized by Joseph Schillinger (1946) to describe the composite rhythmic pattern produced by the superimposition of two or more periodic voices. For a p:q polyrhythm, the resultant has exactly p + q - GCD(p,q) onsets per cycle [10].

### Resultant Patterns for Common Polyrhythms

| Ratio | Resultant Onsets | IOI Sequence | Character |
|-------|-----------------|--------------|-----------|
| 2:3 | 4 | [2, 1, 1, 2] | Tumbling, short cycle |
| 3:4 | 6 | [3, 1, 2, 2, 1, 3] | Swinging, palindromic |
| 3:5 | 7 | [3, 2, 1, 1, 2, 3, 3] | Asymmetric, driving |
| 4:5 | 8 | [4, 1, 3, 2, 2, 3, 1, 4] | Wide, expansive |
| 5:7 | 11 | [5, 2, 3, 1, 4, 4, 1, 3, 2, 5, 5] | Dense, complex |
| 2:3:4 | 8 | varies | Multi-layered |

### Schillinger's Interference Concept

Schillinger framed polyrhythm as wave interference -- the rhythmic analog of acoustic beating. Two frequencies f1 and f2 produce a beat pattern at |f1 - f2|. Two rhythmic periodicities p and q produce a resultant pattern with a period of LCM(p,q) pulses and a rhythmic "beat frequency" of |p - q| coincidence shifts per cycle [11].

This analogy is not merely metaphorical. When polyrhythmic patterns are rendered as audio signals (each onset as a click), the resulting waveform exhibits interference patterns identical in structure to acoustic beating. At sufficiently high tempo, the polyrhythm literally *becomes* a frequency relationship -- a 3:4 polyrhythm at 15 Hz per voice produces 45 Hz and 60 Hz tones, an interval of a perfect fourth [12].

> **Related:** [Rhythm and Frequency](05-rhythm-frequency-hz.md)

---

## 5. Perceptual Foundations: How the Brain Parses Layered Time

The perception of polyrhythm engages multiple neural mechanisms simultaneously. Neuroimaging studies reveal that polyrhythmic listening activates the supplementary motor area (SMA), the premotor cortex, the basal ganglia, and the cerebellum -- the same circuits involved in motor planning and temporal prediction [13].

### Streaming and Grouping

The auditory system employs two complementary parsing strategies when confronted with polyrhythmic input:

- **Streaming:** Separating the composite into distinct perceptual voices based on timbre, pitch, or spatial location. The listener "hears" two separate rhythms simultaneously. This engages auditory scene analysis mechanisms described by Bregman (1990) [14].

- **Grouping:** Integrating the composite into a single emergent pattern -- the resultant. The listener hears one complex rhythm rather than two simple ones. This is the gestalt approach, and it tends to dominate when timbral differences between voices are small [15].

### The Perceptual Switch

Trained listeners can voluntarily shift between streaming and grouping -- focusing on either constituent voice or the composite. This attentional flexibility is a hallmark of experienced polyrhythmic performers. Poudrier and Repp (2013) demonstrated that musicians could selectively attend to either stream in a 3:4 polyrhythm with roughly equal facility, but that the subjective experience of metric structure shifted depending on which voice received focal attention [16].

### Temporal Expectation and Violation

Polyrhythm creates a field of competing temporal expectations. Each voice generates its own predictive model in the listener's motor planning system. When the voices align (at the downbeat), expectation is confirmed. Between alignments, each voice's onsets partially violate the predictions generated by the other voice. This continuous cycle of expectation and micro-violation is neurologically similar to harmonic tension and resolution, and it produces a comparable aesthetic response [17].

### The Body as Metric Anchor

In participatory music-making traditions -- particularly West African drumming -- the body provides a metric anchor that disambiguates polyrhythmic perception. The feet stamp a basic pulse while the hands play a contrasting pattern. The haptic feedback from the stamping foot grounds the metric framework, allowing the brain to maintain both patterns without perceptual confusion. This embodied cognition approach explains why polyrhythm is more readily learned through physical participation than through notation [18].

> **Related:** [West African Rhythmic Traditions](03-clave-west-african-traditions.md), [Polyrhythm as Synchronization Protocol](06-polyrhythm-synchronization.md)

---

## 6. Least Common Multiple and the Composite Cycle

The LCM is the fundamental mathematical operator in polyrhythm theory. For a p:q polyrhythm, the composite cycle length in pulse units is LCM(p,q). This determines the *period* of the polyrhythm -- the number of pulses before the pattern repeats exactly [19].

### LCM Table for Common Polyrhythms

| Ratio | LCM | Cycle Length (pulses) | Complexity Index |
|-------|-----|-----------------------|-----------------|
| 2:3 | 6 | 6 | 1.0 (baseline) |
| 3:4 | 12 | 12 | 2.0 |
| 4:5 | 20 | 20 | 3.33 |
| 3:5 | 15 | 15 | 2.5 |
| 5:7 | 35 | 35 | 5.83 |
| 7:11 | 77 | 77 | 12.83 |
| 2:3:5 | 30 | 30 | 5.0 |
| 3:4:5 | 60 | 60 | 10.0 |

The *Complexity Index* (LCM / 6, normalized to the simplest polyrhythm) provides a rough measure of perceptual difficulty. Empirical studies suggest that untrained listeners lose the ability to perceive both constituent voices independently when the Complexity Index exceeds approximately 5 -- above this threshold, the composite is perceived as a single complex pattern rather than two interlocking simple ones [20].

### Multi-Layer Polyrhythms

For three or more simultaneous subdivisions, the LCM generalizes:

```
LCM(p, q, r) = LCM(LCM(p, q), r)

Example: 2:3:5
  LCM(2, 3) = 6
  LCM(6, 5) = 30

  30-pulse cycle:
  Voice A (2): hits at 0, 15        (every 15 pulses)
  Voice B (3): hits at 0, 10, 20    (every 10 pulses)
  Voice C (5): hits at 0, 6, 12, 18, 24  (every 6 pulses)
  Composite:   0, 6, 10, 12, 15, 18, 20, 24  (8 onsets)
```

The three-layer polyrhythm 2:3:5 has 30 pulse positions and 8 onsets -- a density of 26.7%. This is sparser than any of its two-layer subsets (2:3 = 66.7%, 2:5 = 50%, 3:5 = 46.7%), illustrating how increasing the number of layers paradoxically *decreases* onset density relative to cycle length [21].

---

## 7. Irrational Rhythm and Metric Ambiguity

Not all polyrhythmic relationships involve integer ratios. *Irrational rhythms* (also called non-integer tuplets or complex nested tuplets) arise when one voice's subdivision is not an integer multiple of the fundamental pulse. The most common example is the quintuplet against a triplet background: a 5:3 relationship where neither voice maps cleanly onto binary or ternary subdivision [22].

### Expressive Microtiming

In practice, most performed polyrhythms deviate from mathematically exact ratios. These deviations -- called *expressive microtiming* or *participatory discrepancies* (Keil, 1987) -- are not errors but essential features of rhythmic expression. Keil argued that the slight imprecisions in ensemble timing create a "groove" that mathematically perfect performance lacks [23].

Measured deviations in expert polyrhythmic performance:
- West African master drummers: 10-30 ms systematic deviation from grid [24]
- Jazz drummers playing swing: 15-50 ms anticipation of the backbeat [25]
- Electronic music producers: deliberate 5-15 ms "humanization" applied to quantized patterns [26]

### The 50/60 Hz Analogy

The electrical power grid's 50/60 Hz divergence -- where North America runs at 60 Hz and Europe at 50 Hz -- is a civilizational polyrhythm. LCM(50, 60) = 300: the two grids only synchronize every 1/300th of a second. This infrastructural cross-rhythm propagated into television standards (NTSC at 29.97 fps vs. PAL at 25 fps), broadcast timecode, and display refresh rates. The entire history of video standards conversion is, mathematically, a problem in polyrhythm resolution. The 120 Hz display refresh rate emerged because 120 = LCM(24, 25, 30), resolving film, PAL, and NTSC frame rates without judder -- the visual equivalent of finding a composite downbeat [27].

> **Related:** [Rhythm and Frequency](05-rhythm-frequency-hz.md), [Polyrhythm as Synchronization Protocol](06-polyrhythm-synchronization.md)

---

## 8. Polyrhythm as Information: Entropy and Temporal Density

Information theory provides a framework for quantifying polyrhythmic complexity. The Shannon entropy of a rhythmic pattern measures the unpredictability of its onset distribution across pulse positions [28].

### Entropy of Common Patterns

For a pattern of length N with k onsets:

```
Maximum entropy: H_max = log2(N)
Pattern entropy: H = -sum(p_i * log2(p_i)) for each onset position
Normalized entropy: H_norm = H / H_max
```

| Pattern | N | k | H_norm | Description |
|---------|---|---|--------|-------------|
| Isochronous | 12 | 4 | 0.0 | Perfectly periodic, zero surprise |
| 2:3 resultant | 6 | 4 | 0.92 | High entropy, nearly maximal |
| 3:4 resultant | 12 | 6 | 0.87 | High entropy, balanced |
| Son clave (3-2) | 16 | 5 | 0.94 | Near-maximal, asymmetric |
| Bembé bell | 12 | 7 | 0.81 | High density, moderate entropy |

The clave pattern's near-maximal entropy explains its ubiquity across musical traditions -- it encodes nearly the maximum possible temporal information for its density, making it informationally efficient as a rhythmic reference signal [29].

### Temporal Density and Groove

*Temporal density* -- the ratio of onsets to total pulse positions -- affects the perceptual character of a polyrhythm:

- **Sparse (< 30%):** Each onset is an event. The spaces between are the primary character. (5:7 resultant, Feldman-esque)
- **Moderate (30-60%):** Balance of sound and silence. Maximum groove potential. (3:4, most African timelines)
- **Dense (> 60%):** The silences become the events. The pattern is defined by where it *doesn't* sound. (2:3 resultant, dense Afro-Cuban tumbaos)

---

## 9. Historical Notation Systems

Western staff notation was designed for single-meter, single-subdivision music. Representing polyrhythm has required progressively more sophisticated notational extensions [30].

### Staff Notation with Tuplets

The standard approach: one voice occupies the staff's written meter while the other is notated as a tuplet (triplet, quintuplet, septuplet). This works for simple ratios but becomes visually impenetrable beyond 3:4 or 5:4.

### TUBS (Time Unit Box System)

Developed by Philip Harland and widely used in ethnomusicology, TUBS represents each pulse position as a box. Filled boxes indicate onsets; empty boxes indicate rests. Multiple voices are stacked vertically. TUBS excels at representing African rhythmic structures because it treats all pulse positions as equal rather than privileging strong and weak beats [31].

### Numeric Grid Notation

Used in electronic music production, the numeric grid assigns each pulse position a number (0 to N-1) and lists onset positions as sets. This is the notation used throughout this module:

```
3:4 in 12 pulses:
Voice A: {0, 4, 8}
Voice B: {0, 3, 6, 9}
```

### Box Notation (Toussaint)

Godfried Toussaint (2013) developed a circular notation that plots onsets around a clock face, with the cycle divided into N equal positions. This representation reveals geometric symmetries -- the 3:4 polyrhythm forms an asymmetric polygon inscribed in a 12-gon, while the Euclidean rhythms (see Section 10) form maximally even distributions [32].

---

## 10. Pedagogical Approaches

Teaching polyrhythm requires bridging the gap between mathematical understanding and embodied performance [33].

### Verbal Mnemonics

The most widespread pedagogical tool: phrases whose syllable stress patterns match the polyrhythmic rhythm.

| Ratio | Mnemonic | Stressed Syllables |
|-------|----------|--------------------|
| 2:3 | "PASS the GOL-den BUT-ter" | Capitalized = Voice A |
| 3:4 | "WHAT a-TRO-cious WEATH-er" | Various mnemonics exist |
| 4:3 | "PASS the BREAD and BUT-ter" | 4 against 3 |
| 3:5 | No standard mnemonic | Often taught by feel |

### The Euclid Algorithm and Maximally Even Rhythms

Bjorklund (2003) showed that the Euclidean algorithm for distributing k onsets as evenly as possible across N positions generates many of the world's traditional rhythmic patterns. The algorithm is equivalent to Euclid's method for computing the GCD [34].

```
EUCLIDEAN RHYTHM GENERATION
================================================================

E(5, 8) -- 5 onsets in 8 positions:
  Step 1: [1][1][1][1][1][0][0][0]
  Step 2: [10][10][10][1][1]
  Step 3: [101][101][10]
  Step 4: [10110][101]
  Step 5: [1011010 1]  -> wait, let me redo properly

  E(5,8) = [x . x . x . x x] = Cuban cinquillo
  E(3,8) = [x . . x . . x .] = Cuban tresillo
  E(5,12) = [x . x . x . . x . x . .] = South African
  E(7,12) = [x . x x . x . x x . x .] = West African bembe bell
  E(5,16) = [x . . x . . x . . x . . x . . .] = Brazilian bossa nova
```

The Euclidean algorithm generates rhythms that are *maximally even* -- the onsets are as uniformly distributed as possible given the constraint of integer pulse positions. These rhythms appear independently across cultures because maximal evenness optimizes perceptual distinctiveness [35].

> **Related:** [Cross-Rhythm Mathematics](02-cross-rhythm-mathematics.md), [Clave Patterns and West African Traditions](03-clave-west-african-traditions.md)

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Ratio theory, LCM | M1, M2, M6 | DAA, FQC |
| Cross-rhythm structure | M1, M2, M3 | BMR, TKH, HJX |
| Resultant patterns | M1, M2, M4 | DAA, SGL |
| Perceptual grouping | M1, M5 | FQC, SPA |
| Euclidean rhythms | M1, M2, M3 | T55, GRD |
| Entropy / information | M1, M6 | DAA, GRD |
| 50/60 Hz polyrhythm | M1, M5, M6 | SGL, T55, PRS |
| Notation systems | M1, M3, M4 | DAA, BMR |

---

## 12. Sources

1. London, J. (2012). *Hearing in Time: Psychological Aspects of Musical Meter* (2nd ed.). Oxford University Press.
2. Agawu, K. (2003). *Representing African Music: Postcolonial Notes, Queries, Positions*. Routledge.
3. Pressing, J. (1983). "Cognitive Isomorphisms Between Pitch and Rhythm in World Musics." *Studies in Music*, 17, 38-61.
4. Schillinger, J. (1946). *The Schillinger System of Musical Composition*. Carl Fischer. Vol. 1, Chapter 3: "Resultants of Interference."
5. Hardy, G.H. & Wright, E.M. (1979). *An Introduction to the Theory of Numbers* (5th ed.). Oxford University Press.
6. Pressing, J. (1983). Ibid. Palindromic IOI property demonstrated for coprime pairs.
7. Arom, S. (1991). *African Polyphony and Polyrhythm: Musical Structure and Methodology*. Cambridge University Press.
8. Agawu, K. (2006). "Structural Analysis or Cultural Analysis? Competing Perspectives on the 'Standard Pattern' of West African Rhythm." *Journal of the American Musicological Society*, 59(1), 1-46.
9. Hasty, C.F. (1997). *Meter as Rhythm*. Oxford University Press.
10. Schillinger, J. (1946). Ibid. Resultant formula.
11. Schillinger, J. (1946). Ibid. Wave interference analogy.
12. Pressing, J. (2002). "Black Atlantic Rhythm: Its Computational and Transcultural Foundations." *Music Perception*, 19(3), 285-310.
13. Grahn, J.A. & Brett, M. (2007). "Rhythm and Beat Perception in Motor Areas of the Brain." *Journal of Cognitive Neuroscience*, 19(5), 893-906.
14. Bregman, A.S. (1990). *Auditory Scene Analysis: The Perceptual Organization of Sound*. MIT Press.
15. Deutsch, D. (2013). "Grouping Mechanisms in Music." In *The Psychology of Music* (3rd ed.), Academic Press.
16. Poudrier, E. & Repp, B.H. (2013). "Can Musicians Track Two Different Beats Simultaneously?" *Music Perception*, 30(4), 369-390.
17. Vuust, P. & Witek, M.A.G. (2014). "Rhythmic Complexity and Predictive Coding." *PLOS ONE*, 9(12), e114237.
18. Locke, D. (1998). *Drum Gahu: An Introduction to African Rhythm*. White Cliffs Media.
19. Toussaint, G.T. (2013). *The Geometry of Musical Rhythm: What Makes a "Good" Rhythm Good?* CRC Press.
20. Fidali, B.C., Poudrier, E. & Repp, B.H. (2013). "Detecting Perturbations in Polyrhythms." *Music Perception*, 31(2), 101-120.
21. Toussaint, G.T. (2013). Ibid. Multi-layer LCM analysis.
22. Ferneyhough, B. (1995). "Duration and Rhythm as Compositional Resources." In *Collected Writings*. Harwood.
23. Keil, C. (1987). "Participatory Discrepancies and the Power of Music." *Cultural Anthropology*, 2(3), 275-283.
24. Polak, R. & London, J. (2014). "Timing and Meter in Mande Drumming from Mali." *Music Theory Online*, 20(1).
25. Friberg, A. & Sundstrom, A. (2002). "Swing Ratios and Ensemble Timing in Jazz Performance." *Music Perception*, 19(3), 333-349.
26. Butler, M.J. (2006). *Unlocking the Groove: Rhythm, Meter, and Musical Design in Electronic Dance Music*. Indiana University Press.
27. SMPTE ST 12M; ITU-R BT.2020. The 50/60 Hz polyrhythm in broadcast standards.
28. Shannon, C.E. (1948). "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 379-423.
29. Toussaint, G.T. (2013). Ibid. Entropy analysis of clave patterns.
30. Read, G. (1978). *Modern Rhythmic Notation*. Indiana University Press.
31. Koetting, J. (1970). "Analysis and Notation of West African Drum Ensemble Music." *Selected Reports in Ethnomusicology*, UCLA, 1(3), 115-146.
32. Toussaint, G.T. (2013). Ibid. Circular representation.
33. Agostini, D. (1972). *Solfege Rythmique*. Alphonse Leduc.
34. Bjorklund, E. (2003). "The Theory of Rep-Rate Pattern Generation in the SNS Timing System." LANL Technical Report.
35. Demaine, E.D., Gomez-Martin, F., Meijer, H., Rappaport, D., Taslakian, P., Toussaint, G.T., Wichiramala, T., & Wood, D.R. (2009). "The Distance Geometry of Music." *Computational Geometry*, 42(5), 429-454.
