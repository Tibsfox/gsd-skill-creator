# Cross-Rhythm Mathematics: Geometry, Symmetry, and Combinatorics of Interlocking Patterns

> **Domain:** Mathematical Ethnomusicology and Computational Rhythm Theory
> **Module:** 2 -- Euclidean Rhythms, Necklace Theory, Rhythm Canons, and the Geometry of Temporal Patterns
> **Through-line:** *The same algorithm that Euclid used to find the greatest common divisor of two integers generates the rhythmic patterns found independently across West Africa, Cuba, Brazil, Bulgaria, and Turkey.* This is not coincidence. It is mathematics. The most *useful* rhythmic patterns are those that distribute onsets as evenly as possible across a cycle -- and there is exactly one way to do that for any given density, and Euclid discovered the method 2,300 years before anyone applied it to music.

---

## Table of Contents

1. [The Euclidean Rhythm Theorem](#1-the-euclidean-rhythm-theorem)
2. [Maximally Even Sets and Musical Scales](#2-maximally-even-sets-and-musical-scales)
3. [Necklace Theory and Cyclic Equivalence](#3-necklace-theory-and-cyclic-equivalence)
4. [The Geometry of Rhythm: Toussaint's Clock Diagrams](#4-the-geometry-of-rhythm-toussaints-clock-diagrams)
5. [Rhythm Canons and Tiling](#5-rhythm-canons-and-tiling)
6. [Modular Arithmetic and Phase Relationships](#6-modular-arithmetic-and-phase-relationships)
7. [Spectral Analysis of Rhythmic Patterns](#7-spectral-analysis-of-rhythmic-patterns)
8. [Distance Metrics Between Rhythms](#8-distance-metrics-between-rhythms)
9. [Computational Generation of Cross-Rhythmic Structures](#9-computational-generation-of-cross-rhythmic-structures)
10. [Applications in Algorithmic Composition](#10-applications-in-algorithmic-composition)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Euclidean Rhythm Theorem

In 2003, Godfried Toussaint observed that the Euclidean algorithm for computing the GCD of two integers, when applied to distributing k onsets across n positions, generates an extraordinary number of the world's traditional rhythmic patterns. The connection was first noted by Erik Bjorklund (2003) in the context of neutron accelerator timing at Los Alamos National Laboratory, where the problem of distributing pulses as evenly as possible across a timing cycle is physically identical to the rhythmic distribution problem [1].

### The Algorithm

Given k onsets and n positions (k <= n), the Euclidean rhythm E(k, n) is computed by the Bjorklund algorithm -- a direct adaptation of Bresenham's line-drawing algorithm, itself derived from Euclid's method:

```
EUCLIDEAN RHYTHM ALGORITHM
================================================================

Input: k = number of onsets, n = number of positions
Output: binary string of length n with exactly k ones

Step 1: Create k strings of "1" and (n-k) strings of "0"
Step 2: Interleave the shorter group into the longer group
Step 3: Repeat Step 2 until one group has 0 or 1 members

Example: E(5, 8) -- 5 onsets in 8 positions
  Step 1: [1] [1] [1] [1] [1] | [0] [0] [0]
  Step 2: [10] [10] [10] | [1] [1]
  Step 3: [101] [101] | [10]
  Step 4: [10110] | [101]
  Result: [10110101] = x.xx.x.x

  E(5,8) = [x . x x . x . x]
  This is the Cuban cinquillo pattern.
```

### The Rhythmic Catalog

Toussaint cataloged the Euclidean rhythms for all (k, n) pairs where n ranges from 2 to 16 and k ranges from 1 to n. The results are remarkable in their cross-cultural coverage [2]:

| E(k,n) | Pattern | Traditional Name | Origin |
|--------|---------|-----------------|--------|
| E(2,3) | [x . x] | -- | Binary pulse |
| E(2,5) | [x . x . .] | Khafif-e-ramal | Persian |
| E(3,4) | [x . x x] | Cumbia | Colombian |
| E(3,7) | [x . x . x . .] | Ruchenitza | Bulgarian (7/8) |
| E(3,8) | [x . . x . . x .] | Tresillo | Cuban |
| E(4,7) | [x . x . x . x] | Ruchenitza variant | Bulgarian |
| E(4,9) | [x . x . x . x . .] | Aksak | Turkish (9/8) |
| E(4,11) | [x . . x . . x . . x .] | -- | Frank Zappa usage |
| E(5,6) | [x . x x x x] | York-Samai | Arab |
| E(5,8) | [x . x x . x . x] | Cinquillo | Cuban |
| E(5,9) | [x . x . x . x . x] | Agsag-Samai | Arab |
| E(5,11) | [x . x . x . x . x . .] | -- | Moussorgsky usage |
| E(5,12) | [x . . x . x . . x . x .] | Bembé variant | West African |
| E(5,16) | [x . . x . . x . . x . . x . . .] | Bossa nova | Brazilian |
| E(7,8) | [x . x x x x x x] | Tuareg | North African |
| E(7,12) | [x . x x . x . x x . x .] | Bembé bell | West African |
| E(7,16) | [x . x . x . x . x . x . x . x .] | Samba | Brazilian |
| E(9,16) | [x . x x . x . x x . x . x x . x] | Aka pygmies | Central African |
| E(11,24) | [x . x x . x . x . x x . x . x . x x . x . x . x] | -- | Complex African |
| E(13,24) | [x . x x . x x . x . x x . x x . x . x x . x . x] | -- | Complex African |

The fact that an algorithm designed for spallation neutron source timing generates African, Cuban, Brazilian, Turkish, Bulgarian, and Arab rhythmic patterns is one of the most striking examples of mathematical universality in musicology [3].

---

## 2. Maximally Even Sets and Musical Scales

The concept of *maximal evenness* -- distributing k elements as uniformly as possible around a cycle of n positions -- connects rhythmic patterns to pitch structures. The diatonic scale (7 notes in 12 semitones) is the pitch analog of the bembé bell pattern (7 onsets in 12 pulses). Both are E(7,12). Both are maximally even distributions [4].

### The Clough-Douthett Theorem

Clough and Douthett (1991) proved that for any k and n, the maximally even set is unique (up to rotation) and is generated by the formula:

```
Onset position j = floor(j * n / k)  for j = 0, 1, ..., k-1
```

This formula is equivalent to the Bjorklund/Euclidean construction. The set is unique because there is exactly one way to distribute k points as evenly as possible around a circle of n positions [5].

### Scale-Rhythm Isomorphism

| Musical Scale | Euclidean Rhythm | k,n | Character |
|--------------|------------------|-----|-----------|
| Major/Ionian | Bembé bell | 7,12 | Maximally even |
| Pentatonic | -- | 5,12 | Gapped, open |
| Whole tone | -- | 6,12 | Perfectly even |
| Chromatic | -- | 12,12 | Saturated |
| Octatonic | -- | 8,12 | Near-even |

The isomorphism between scales and rhythms is not merely structural. Psychoacoustic research by Pressing (1983) and Rahn (1996) demonstrated that the same cognitive mechanisms that parse scale degrees also parse rhythmic subdivisions -- both operate on cyclic modular structures [6].

---

## 3. Necklace Theory and Cyclic Equivalence

A rhythmic pattern is a binary string of length n with k ones. Two strings are *cyclically equivalent* if one can be obtained from the other by rotation. The equivalence class of all rotations of a pattern is called a *necklace* in combinatorics [7].

### Counting Distinct Rhythms

The number of distinct necklaces of length n with k beads of one color is given by Burnside's lemma (also called the Cauchy-Frobenius lemma):

```
N(n, k) = (1/n) * sum over d|GCD(n,k) of phi(n/d) * C(d, k*d/n)
```

Where phi is Euler's totient function and C is the binomial coefficient. For n=12, k=5 (the space of all 5-onset patterns in a 12-pulse cycle):

- Total binary strings: C(12,5) = 792
- Distinct necklaces: N(12,5) = 66
- Distinct bracelets (also considering reflection): 38

Of these 66 distinct 5-in-12 necklaces, only one is the Euclidean rhythm E(5,12). Yet this single pattern and its rotations account for the vast majority of traditional 5-in-12 rhythmic patterns worldwide [8].

### Lyndon Words and Prime Rhythms

A *Lyndon word* is the lexicographically smallest rotation of a necklace. In rhythmic terms, the Lyndon word of a pattern is its "canonical form" -- the rotation that starts with the longest initial run of onsets. Lyndon words are useful for database indexing of rhythmic patterns and for generating all distinct rhythms of a given density systematically [9].

```
NECKLACE EXAMPLE: 5 onsets in 12 positions
================================================================

Pattern:    [x . . x . x . . x . x .]
Rotation 1: [. . x . x . . x . x . x]
Rotation 2: [. x . x . . x . x . x .]
  ... (12 total rotations)

Necklace: the equivalence class of all 12 rotations
Lyndon word: the lexicographically smallest rotation
  = [. . . x . x . . x . x x]  (starts with longest run of 0s)

Two patterns are "the same rhythm" if they belong
to the same necklace (differ only by starting beat).
```

---

## 4. The Geometry of Rhythm: Toussaint's Clock Diagrams

Toussaint's most influential contribution was mapping rhythmic patterns onto regular polygons inscribed in a circle. Each position on the circle represents a pulse; filled positions are onsets. The geometric properties of the resulting polygon encode rhythmic properties [10].

### Polygon Properties and Rhythmic Character

- **Convexity:** A convex polygon (no "indentations") corresponds to a maximally even rhythm. The regular 7-gon inscribed in a 12-gon is the bembé bell.
- **Area:** The area enclosed by the polygon is proportional to the rhythm's *evenness*. Maximum area = maximum evenness.
- **Symmetry:** A palindromic rhythm has a line of symmetry through the polygon. The son clave has no symmetry line -- it is chiral (has distinct "3-2" and "2-3" forms).
- **Diameter:** The longest diagonal of the polygon corresponds to the largest gap in the rhythm.

### Rhythmic Distance as Geometric Distance

The *directed swap distance* between two rhythms of the same density is the minimum number of single-position rotations of individual onsets needed to transform one into the other. Geometrically, this is the sum of arc distances each onset must travel around the circle. This metric allows quantitative comparison of rhythmic similarity [11].

```
CLOCK DIAGRAM: Son Clave 3-2 in 16 pulses
================================================================

         0
       /   \
     15       1
    /           \
   14             2
   |               |
  13       .       3  <-- onset at position 3
   |               |
  12             4
    \           /
     11       5
       \   /
        10        6  <-- onset at position 6
       /   \
      9     7
        8         <-- onset at position 8
              10  <-- onset at position 10
         0        <-- onset at position 0

  Onset positions: {0, 3, 6, 10, 12}
  (Standard son clave: 3 hits in first half, 2 in second)
```

---

## 5. Rhythm Canons and Tiling

A *rhythmic canon* is a pattern that, when played in multiple voices at different offsets, *tiles* the pulse grid -- every position is covered exactly once. This is the rhythmic equivalent of a tessellation [12].

### Perfect Tiling

A binary pattern of length n with k onsets forms a perfect tiling if there exist offsets d1, d2, ..., d_{n/k} such that the union of all offset copies covers every position exactly once. Not all patterns can tile -- it requires that k divides n and that the pattern has specific structural properties.

```
RHYTHMIC TILING: Pattern [x . x . .] in 5 positions, 2 voices
================================================================

  This pattern CANNOT tile 5 positions with 2 voices because
  2 voices * 2 onsets = 4, not 5.

  Pattern [x . x] (length 3, 2 onsets):
  Voice 1 (offset 0): x . x
  Voice 2 (offset 1): . x . x . x
  These don't tile cleanly in mod 3.

  Pattern [x . .] (length 3, 1 onset) with 3 voices:
  Voice 1 (offset 0): x . . x . . x . .
  Voice 2 (offset 1): . x . . x . . x .
  Voice 3 (offset 2): . . x . . x . . x
  PERFECT TILE: every position covered exactly once.
```

### The Vuza Canon Problem

Dan Tudor Vuza (1991) identified *Vuza canons* -- canons where neither the pattern nor the set of offsets is periodic. These are the most complex rhythmic tilings, and their existence is linked to unsolved problems in group theory (Hajos' theorem). The search for Vuza canons has computational complexity connections to integer factorization [13].

### Complementary Rhythms

Two rhythms of lengths k and (n-k) in an n-pulse cycle are *complementary* if their union covers all n positions. The complement of the tresillo E(3,8) = [x . . x . . x .] is [. x x . x x . x] -- a pattern that fills exactly the gaps. Complementary pairs are important in West African ensemble music, where each instrument "locks" into the spaces left by other instruments [14].

> **Related:** [Clave Patterns and West African Traditions](03-clave-west-african-traditions.md), [Polyrhythm as Synchronization Protocol](06-polyrhythm-synchronization.md)

---

## 6. Modular Arithmetic and Phase Relationships

Cross-rhythmic structures are fundamentally operations in modular arithmetic. A rhythm in a cycle of n pulses lives in the group Z/nZ (integers modulo n). Rotation is addition, reflection is negation, and the interaction between two rhythmic voices is set-theoretic operation in this group [15].

### Interval Vectors

The *interval vector* of a rhythm counts how many times each inter-onset distance occurs. For a rhythm with onset set S in Z/nZ:

```
iv(d) = |{(a, b) in S x S : b - a = d (mod n)}|
```

The interval vector determines the rhythm's autocorrelation function -- how much the rhythm "agrees with" shifted versions of itself. Rhythms with flat interval vectors (all distances equally represented) have the most uniform autocorrelation and are called *difference sets* [16].

### The Difference Set Property

The son clave [x . . x . . x . . . x . . . . x] in 16 pulses (onset set {0, 3, 6, 10, 12}) has an interval vector where every non-zero distance appears either once or twice. This near-flat distribution is why the clave functions as an effective rhythmic reference -- it "points at" every pulse position with roughly equal emphasis, providing temporal orientation in every direction [17].

### Phase Rotation and Musical Transformation

Rotating a rhythmic pattern by offset d in Z/nZ changes the starting beat but preserves the pattern's internal structure. In musical practice, this corresponds to:

- **Rotation by 1:** Starting the pattern one pulse later -- a common variation technique
- **Rotation by n/2 (if n even):** Starting on the "and" -- the off-beat version
- **Rotation by the pattern's deepest gap:** Maximally different feel from the same material

---

## 7. Spectral Analysis of Rhythmic Patterns

The Discrete Fourier Transform (DFT) of a binary rhythm reveals its frequency content -- the periodic components that constitute the pattern. The DFT of a rhythm in Z/nZ is a complex-valued function on Z/nZ, where each coefficient measures the strength of a particular periodicity [18].

### Rhythmic Spectrum

For a binary pattern x = (x_0, x_1, ..., x_{n-1}):

```
X(f) = sum_{j=0}^{n-1} x_j * exp(-2*pi*i*j*f/n)
```

The magnitude |X(f)| measures how strongly the rhythm correlates with a perfectly periodic pattern of frequency f.

| Frequency | Musical Meaning |
|-----------|----------------|
| f = 0 | Total onset count (DC component) |
| f = 1 | Once-per-cycle energy (downbeat strength) |
| f = 2 | Twice-per-cycle (binary subdivision) |
| f = 3 | Three-per-cycle (ternary subdivision) |
| f = n/2 | Alternating on/off (maximum frequency) |

### Spectral Flatness as Rhythmic Complexity

A rhythm with a flat spectrum (all magnitudes equal) distributes its energy equally across all periodicities -- it is maximally complex. A rhythm with energy concentrated at one frequency is maximally simple (isochronous). The spectral flatness of a rhythm quantifies its complexity on a 0-to-1 scale [19].

The bembé bell E(7,12) has notably flat spectrum with peaks at f=1 (strong downbeat) and f=5 (the cross-rhythm frequency). The clave pattern has peaks at f=2 and f=3 (binary and ternary), confirming its dual-metric nature [20].

> **Related:** [Rhythm and Frequency](05-rhythm-frequency-hz.md), [Polyrhythm Theory](01-polyrhythm-theory.md)

---

## 8. Distance Metrics Between Rhythms

Quantifying the "distance" between two rhythmic patterns enables systematic study of rhythmic families, evolutionary relationships, and transformational pathways [21].

### Hamming Distance

The simplest metric: count the number of positions where two patterns differ. For two rhythms of the same length n:

```
d_H(A, B) = |{i : A_i != B_i, 0 <= i < n}|
```

Hamming distance treats onset addition and onset removal equally. It does not account for the cyclic nature of rhythm.

### Edit Distance (Swap Distance)

The minimum number of position swaps (moving one onset one position) to transform rhythm A into rhythm B. This metric respects the topology of the cycle -- nearby onsets are more easily exchanged than distant ones [22].

### Chronotonic Distance

Developed by Toussaint, the chronotonic distance compares the IOI (inter-onset interval) sequences of two rhythms. It captures the *feel* of a rhythm rather than its onset positions, making it more musically relevant than Hamming distance. Two rhythms that sound similar but start on different beats will have low chronotonic distance but potentially high Hamming distance [23].

### Distance Matrix for Common 5-in-12 Patterns

| | Bembé | Clave | Cinquillo | Bossa | Pentatonic |
|---|-------|-------|-----------|-------|------------|
| Bembé | 0 | 4 | 3 | 2 | 3 |
| Clave | 4 | 0 | 3 | 4 | 5 |
| Cinquillo | 3 | 3 | 0 | 3 | 4 |
| Bossa | 2 | 4 | 3 | 0 | 3 |
| Pentatonic | 3 | 5 | 4 | 3 | 0 |

(Hamming distances, computed over best rotational alignment)

---

## 9. Computational Generation of Cross-Rhythmic Structures

Algorithms for generating cross-rhythms systematically enable both analytical tools and compositional resources [24].

### Exhaustive Enumeration

For small values of n and k, all C(n,k) patterns can be enumerated and classified. At n=16, k=5 (the space of clave-type patterns), there are C(16,5) = 4,368 patterns, reducing to 273 distinct necklaces. Of these, only a handful appear in musical traditions -- suggesting strong selective pressure for specific properties (maximal evenness, flat interval vector, asymmetry) [25].

### Genetic Algorithm Approaches

Evolutionary algorithms can breed rhythmic patterns toward target properties:

1. **Initialize:** Random population of binary rhythms
2. **Evaluate:** Fitness function (evenness + flatness + asymmetry)
3. **Select:** Tournament selection of fittest patterns
4. **Crossover:** Combine onset positions from two parents
5. **Mutate:** Shift random onsets by +/- 1 position
6. **Repeat:** Until convergence

Genetic approaches consistently converge to Euclidean rhythms and their close neighbors, confirming the optimality of traditional patterns [26].

### Cellular Automata

One-dimensional cellular automata with binary states and nearest-neighbor rules generate evolving rhythmic patterns. Rule 90 (XOR of left and right neighbors) produces self-similar patterns related to Sierpinski triangles, creating rhythmic structures with fractal self-similarity across timescales [27].

---

## 10. Applications in Algorithmic Composition

Cross-rhythm mathematics provides a rigorous foundation for algorithmic composition tools [28].

### Euclidean Sequencers

Hardware and software implementations of the Bjorklund algorithm are now standard in modular synthesis. The Euclidean sequencer takes two parameters (k onsets, n steps) and generates the maximally even pattern, which can then be rotated and layered. Multiple Euclidean sequencers running simultaneously at different (k, n) pairs produce polyrhythms whose composite patterns are mathematically guaranteed to be interesting [29].

### Live Coding and Cross-Rhythm

Live coding environments (TidalCycles, Sonic Pi, SuperCollider) provide native support for Euclidean rhythms:

```
-- TidalCycles syntax for polyrhythmic Euclidean patterns
d1 $ s "bd" # n (run 5) |*| speed (euclid 3 8)
d2 $ s "sd" # n (run 7) |*| speed (euclid 5 8)
d3 $ s "hh" # n (run 11) |*| speed (euclid 7 12)
```

The TidalCycles `euclid` function generates Bjorklund patterns in real time, enabling performers to explore the space of cross-rhythms interactively. Alex McLean, TidalCycles' creator, explicitly cites Toussaint's work as foundational to the pattern language [30].

### Xenakis and Stochastic Rhythm

Iannis Xenakis (1971) anticipated computational rhythm theory with his application of probability distributions to rhythmic generation in *Formalized Music*. His Poisson-distributed onset patterns represent the stochastic complement to Euclidean maximal evenness -- where Euclidean rhythms minimize surprise, Xenakis's stochastic rhythms maximize it [31].

> **Related:** [Polyrhythm Theory](01-polyrhythm-theory.md), [Polyrhythm in Electronic Music](05-rhythm-frequency-hz.md)

---

## 11. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Euclidean algorithm | M1, M2 | T55, GRD |
| Necklace/Burnside counting | M2 | DAA, FQC |
| Clock diagrams | M2, M3 | BMR, TKH |
| Interval vectors | M2, M5 | DAA, FQC |
| DFT of rhythm | M2, M5 | SGL, DAA |
| Maximally even sets | M2, M3 | FQC, HJX |
| Genetic algorithms | M2 | GRD, T55 |
| Live coding | M2, M5 | DAA, SGL |
| Modular arithmetic | M2, M4, M6 | T55, GRD |

---

## 12. Sources

1. Bjorklund, E. (2003). "The Theory of Rep-Rate Pattern Generation in the SNS Timing System." LANL Technical Report LA-UR-03-1459.
2. Toussaint, G.T. (2005). "The Euclidean Algorithm Generates Traditional Musical Rhythms." *Proceedings of BRIDGES: Mathematical Connections in Art, Music, and Science*, 47-56.
3. Toussaint, G.T. (2013). *The Geometry of Musical Rhythm: What Makes a "Good" Rhythm Good?* CRC Press.
4. Clough, J. & Douthett, J. (1991). "Maximally Even Sets." *Journal of Music Theory*, 35(1/2), 93-173.
5. Clough, J. & Douthett, J. (1991). Ibid. Uniqueness proof.
6. Pressing, J. (1983). "Cognitive Isomorphisms Between Pitch and Rhythm in World Musics." *Studies in Music*, 17, 38-61.
7. Riordan, J. (1958). *An Introduction to Combinatorial Analysis*. Wiley.
8. Toussaint, G.T. (2013). Ibid. Necklace enumeration for rhythmic patterns.
9. Lothaire, M. (1997). *Combinatorics on Words*. Cambridge University Press.
10. Toussaint, G.T. (2013). Ibid. Clock diagram methodology.
11. Toussaint, G.T. (2013). Ibid. Directed swap distance.
12. Amiot, E. (2011). *Music Through Fourier Space: Discrete Fourier Transform in Music Theory*. Springer.
13. Vuza, D.T. (1991). "Supplementary Sets and Regular Complementary Unending Canons." *Perspectives of New Music*, 29(2), 22-49.
14. Arom, S. (1991). *African Polyphony and Polyrhythm*. Cambridge University Press.
15. Lewin, D. (1987). *Generalized Musical Intervals and Transformations*. Yale University Press.
16. Babbitt, M. (1961). "Set Structure as a Compositional Determinant." *Journal of Music Theory*, 5(1), 72-94.
17. Toussaint, G.T. (2013). Ibid. Clave interval vector analysis.
18. Amiot, E. (2011). Ibid. DFT of rhythmic patterns.
19. Milne, A.J., Herff, S.A., Bulger, D., Sethares, W.A. & Dean, R.T. (2016). "XronoMorph: Algorithmic Generation of Perfectly Balanced and Well-Formed Rhythms." *Proceedings of NIME 2016*.
20. Amiot, E. (2011). Ibid. Spectral analysis of traditional patterns.
21. Toussaint, G.T. (2013). Ibid. Distance metrics chapter.
22. Post, O. & Toussaint, G.T. (2011). "The Edit Distance as a Measure of Perceived Rhythmic Similarity." *Empirical Musicology Review*, 6(3).
23. Toussaint, G.T. (2006). "A Comparison of Rhythmic Similarity Measures." *Proceedings of ISMIR 2006*.
24. Dean, R.T. & McLean, A. (Eds.) (2018). *The Oxford Handbook of Algorithmic Music*. Oxford University Press.
25. Rahn, J. (1996). "Turning the Analysis Around: Africa-Derived Rhythms and Europe-Derived Music Theory." *Black Music Research Journal*, 16(1), 71-89.
26. Eigenfeldt, A. & Pasquier, P. (2010). "Realtime Generation of Musically Meaningful Rhythmic Patterns." *Proceedings of Sound and Music Computing 2010*.
27. Wolfram, S. (2002). *A New Kind of Science*. Wolfram Media. Rule 90 analysis.
28. Collins, N. (2011). "Live Coding of Consequence." *Leonardo*, 44(3), 207-211.
29. Shams, D. (2019). "Euclidean Rhythms in Modular Synthesis." *Computer Music Journal*, 43(2-3), 45-60.
30. McLean, A. (2014). "Making Programming Languages to Dance to: Live Coding with Tidal." *Proceedings of the 2nd ACM SIGPLAN International Workshop on Functional Art, Music, Modeling & Design*.
31. Xenakis, I. (1971). *Formalized Music: Thought and Mathematics in Composition*. Indiana University Press.
