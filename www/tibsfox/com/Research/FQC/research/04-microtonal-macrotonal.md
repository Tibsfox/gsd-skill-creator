# Microtonal and Macrotonal Systems

> **Domain:** Music Theory, Acoustics, Mathematics, Ethnomusicology
> **Module:** 4 -- Microtonal and Macrotonal Interval Systems
> **Through-line:** *The Western piano keyboard divides the octave into twelve equal steps of 100 cents each. This is a compromise, not a law of nature. The ancient Greeks carved intervals finer than half a semitone. Indian classical music recognizes 22 shruti per octave. Indonesian gamelan orchestras tune to scales that no piano can play. The Pythagorean comma -- the 23.5-cent gap between twelve perfect fifths and seven octaves -- is the original proof that the circle of fifths is, in fact, a spiral. The spaces between the notes are where the tuning decisions live, and every culture has made different ones.*

---

## Table of Contents

1. [Foundations: The Octave and the Cent](#1-foundations-the-octave-and-the-cent)
2. [The Pythagorean Comma](#2-the-pythagorean-comma)
3. [Just Intonation and Prime Limits](#3-just-intonation-and-prime-limits)
4. [Equal Divisions of the Octave](#4-equal-divisions-of-the-octave)
5. [Microtonal Intervals](#5-microtonal-intervals)
6. [Historical and Cultural Tuning Systems](#6-historical-and-cultural-tuning-systems)
7. [Macrotonal EDO Systems](#7-macrotonal-edo-systems)
8. [Meantone and Well Temperaments](#8-meantone-and-well-temperaments)
9. [Xenharmonic Composition](#9-xenharmonic-composition)
10. [Pioneers and Instrument Builders](#10-pioneers-and-instrument-builders)
11. [Interval Perception and Psychoacoustics](#11-interval-perception-and-psychoacoustics)
12. [Frequency Atlas: Interval Systems](#12-frequency-atlas-interval-systems)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. Foundations: The Octave and the Cent

### The Octave

The octave -- the interval between a frequency and its double -- is the most universal interval in music across all documented cultures. Its universality has a physical basis: a tone at frequency f and a tone at frequency 2f share all even-numbered harmonics. The second partial of the lower tone coincides exactly with the fundamental of the upper tone. This harmonic fusion produces the perception of "sameness at a different height" that defines the octave [1][2].

The octave ratio of 2:1 is one of the very few intervals for which there is effectively no disagreement across tuning systems. Every system documented in the ethnomusicological literature treats the octave as the fundamental repeating unit of pitch space [1].

### The Cent

The cent is a logarithmic unit of interval measurement invented by Alexander Ellis in 1885. One cent equals 1/1200 of an octave, making one semitone in 12-tone equal temperament (12-EDO) exactly 100 cents [1][2]:

```
Cent Conversion Formulas:
  Ratio to cents:  c = 1200 * log2(f2/f1)
  Cents to ratio:  r = 2^(c/1200)

Examples:
  Octave (2:1):           1200 cents exactly
  Perfect fifth (3:2):    701.955 cents (just) vs 700 cents (12-EDO)
  Major third (5:4):      386.314 cents (just) vs 400 cents (12-EDO)
  Semitone (12-EDO):      100 cents exactly
  Quarter tone:           50 cents
  Pythagorean comma:      23.460 cents
  Syntonic comma:         21.506 cents
  Just noticeable diff:   ~5-10 cents (trained listeners)
```

The cent system provides a universal ruler for comparing intervals across any tuning system, whether equal-tempered, just, or culturally specific. It is agnostic to the underlying theory; it simply measures the size of the interval [2].

---

## 2. The Pythagorean Comma

### The Fundamental Problem

The Pythagorean comma is the gap that proves the circle of fifths is not a circle. Starting from any pitch and ascending twelve perfect fifths (ratio 3:2 each), one arrives at a pitch that is not exactly seven octaves above the starting point. The discrepancy is [1][2]:

```
Twelve perfect fifths:  (3/2)^12 = 531441/262144 = 2.02724...
Seven octaves:          2^7 = 128

Pythagorean comma = (3/2)^12 / 2^7
                  = 531441 / 524288
                  = 1.013643...
                  = 23.460 cents
```

This 23.5-cent interval is small but clearly audible to trained musicians. It is the original source of the Western "temperament problem": how to distribute this unavoidable discrepancy across the twelve keys so that all keys are usable without any interval being intolerably out of tune [1].

### Historical Significance

The Pythagorean comma was known to ancient Chinese music theorists (the "ditonic comma" in the Huainanzi, c. 139 BCE) and to medieval European theorists. It drove the entire history of Western temperament from Pythagorean tuning (pure fifths, wolf interval at one position) through meantone temperament (distributed comma, some keys better than others) to 12-EDO (equally distributed comma, all keys equivalent) [1][2].

The comma is not a flaw in mathematics -- it is a fundamental property of the prime factorization of musical ratios. The numbers 2 (octave) and 3 (fifth) are coprime; no power of 3 can ever exactly equal a power of 2. This is provable: 3^m = 2^n has no solution in positive integers. The comma is arithmetic destiny [1].

---

## 3. Just Intonation and Prime Limits

### The Prime Limit System

Just intonation tunes intervals as exact rational frequency ratios (fractions of whole numbers). The "prime limit" of a tuning system is determined by the largest prime factor appearing in any of its interval ratios [1][2]:

| Prime Limit | Name | Defining Intervals | Character |
|---|---|---|---|
| 3-limit | Pythagorean | 3:2 (fifth), 9:8 (whole tone) | Pure fifths, harsh thirds |
| 5-limit | Classical JI | 5:4 (major third), 6:5 (minor third) | Sweet thirds, standard harmony |
| 7-limit | Septimal | 7:4 (harmonic 7th), 7:6 (subminor 3rd) | Barbershop, blues inflections |
| 11-limit | Undecimal | 11:8 (neutral fourth), 11:9 (neutral 3rd) | Quartertone-adjacent, Arabic |
| 13-limit | Tridecimal | 13:8, 13:11 | Extended JI, rarely used |
| 17-limit | Septendecimal | 17:16 (small semitone) | Theoretical limit for most use |

Each higher prime limit introduces intervals that are progressively more "exotic" to Western ears. 5-limit just intonation produces the familiar major and minor triads in their purest form. 7-limit intervals appear naturally in barbershop quartet singing, where the "barbershop seventh" is intuitively tuned to the 7:4 ratio rather than the 12-EDO minor seventh. 11-limit intervals correspond to "neutral" intervals that fall between Western major and minor -- the territory of Arabic maqam and Turkish makam [1][2].

### The Harmonic Series

Just intonation is grounded in the harmonic series -- the natural overtone sequence produced by any vibrating system. A fundamental frequency f generates harmonics at 2f, 3f, 4f, 5f, and so on. The intervals between consecutive harmonics define the just intonation ratios [1]:

```
HARMONIC SERIES AND DERIVED INTERVALS
============================================
Harmonic  Frequency  Interval from fundamental  Cents
1         f          Unison                     0
2         2f         Octave (2:1)               1200
3         3f         Octave + fifth (3:1)       1902
4         4f         Two octaves (4:1)          2400
5         5f         Two oct + major third      2786
6         6f         Two oct + fifth            3102
7         7f         Two oct + harmonic 7th     3369
8         8f         Three octaves              3600
9         9f         Three oct + whole tone     3804
10        10f        Three oct + major third    3986
11        11f        Three oct + neutral 4th    4151
12        12f        Three oct + fifth          4302

Intervals between consecutive harmonics:
2:1 = 1200 cents (octave)
3:2 = 702 cents (fifth)
4:3 = 498 cents (fourth)
5:4 = 386 cents (major third)
6:5 = 316 cents (minor third)
7:6 = 267 cents (subminor third / septimal)
8:7 = 231 cents (septimal whole tone)
9:8 = 204 cents (whole tone)
10:9 = 182 cents (minor whole tone)
11:10 = 165 cents (neutral second)
```

As the harmonic number increases, the intervals between consecutive harmonics become smaller. This natural compression of the harmonic series is the physical origin of microtonal intervals [1].

---

## 4. Equal Divisions of the Octave

### EDO Fundamentals

An Equal Division of the Octave (EDO, also notated as TET for Tone Equal Temperament) divides the octave into n equal steps. The step size in cents is 1200/n. The interval between any two adjacent notes is identical, and the system is perfectly symmetrical -- every key is equivalent [2][3]:

| EDO | Step Size (cents) | Notable Properties |
|---|---|---|
| 5 | 240 | Pentatonic; slendro approximation |
| 7 | 171.4 | Neutral heptatonic |
| 9 | 133.3 | Contains 7/6 approximation |
| 10 | 120 | Contains 5-EDO subset |
| 11 | 109.1 | Xenharmonic; no standard intervals |
| 12 | 100 | Western standard; good 3:2, fair 5:4 |
| 15 | 80 | Contains 5-EDO and 3-EDO subsets |
| 17 | 70.6 | Good diatonic; better major third than 12 |
| 19 | 63.2 | Excellent thirds; meantone-like |
| 22 | 54.5 | Indian shruti approximation; good 7-limit |
| 24 | 50 | Quarter-tone; Arabic theory standard |
| 31 | 38.7 | Excellent 5-limit; Fokker organ |
| 41 | 29.3 | Excellent 7-limit and 11-limit |
| 53 | 22.6 | Near-perfect Pythagorean; Turkish standard |
| 72 | 16.7 | Excellent all limits through 17 |

### Approximation Quality

The usefulness of an EDO depends on how well its available intervals approximate the just intonation ratios considered important. The most common measure is the error in the perfect fifth (3:2 = 702 cents) [2][3]:

```
Fifth Quality in Selected EDOs:
  EDO    Step nearest 702c    Actual cents    Error
  5      3 steps              720             +18
  7      4 steps              685.7           -16.3
  12     7 steps              700             -2.0     <-- Western standard
  17     10 steps             705.9           +3.9
  19     11 steps             694.7           -7.3
  22     13 steps             709.1           +7.1
  31     18 steps             696.8           -5.2
  41     24 steps             702.4           +0.5     <-- nearly perfect
  53     31 steps             701.9           -0.1     <-- essentially perfect
```

---

## 5. Microtonal Intervals

### Definition and Taxonomy

Microtonal intervals are those smaller than the Western semitone (100 cents). The term was coined before 1912 by Maud MacCarthy Mann. Key microtonal intervals include [1][2]:

| Interval | Size (cents) | Context |
|---|---|---|
| Pythagorean comma | 23.5 | 12 fifths vs. 7 octaves |
| Syntonic comma | 21.5 | 4 fifths vs. 3rds + 2 octaves |
| Diesis (great) | 41.1 | 3 major thirds vs. octave |
| Quarter tone | 50.0 | Half-semitone; 24-EDO step |
| Sixth tone | 33.3 | 36-EDO step |
| Twelfth tone | 16.7 | 72-EDO step |
| Sixteenth tone | 12.5 | 96-EDO step |
| Undecimal quarter tone | 53.3 | 11:10 (neutral second) reduced |
| Septimal sixth tone | 27.3 | 7-limit interval |

### Perceptual Thresholds

The just noticeable difference (JND) for pitch in trained listeners is approximately 5-10 cents for isolated tones, but can be as small as 2-3 cents for intervals presented sequentially in a musical context. Untrained listeners may have JNDs of 20-30 cents or more. This means [2]:

- The Pythagorean comma (23.5 cents) is clearly audible to trained musicians and perceptible to most listeners in direct comparison
- Quarter tones (50 cents) are readily audible to all listeners
- Sixth tones (33.3 cents) are audible to most listeners with focused attention
- Sixteenth tones (12.5 cents) approach the perceptual limit for most listeners as isolated intervals

---

## 6. Historical and Cultural Tuning Systems

### Indian 22-Shruti System

Indian classical music (both Hindustani and Carnatic traditions) is organized around a system of 22 shruti (microtonal intervals) per octave. The exact tuning of the shruti has been debated by Indian music theorists for millennia, with modern analyses offering multiple mathematical interpretations [1][4]:

- **Just intonation interpretation:** 22 unequal intervals derived from 5-limit ratios (Bharata, Natya Shastra, c. 200 BCE - 200 CE)
- **Equal-division interpretation:** Sometimes approximated as 22-EDO (54.5 cents per step), though traditional practice is not equal-tempered
- **Performance practice:** Individual shruti are contextual -- the exact intonation of a note varies depending on the raga (melodic framework) and the specific phrase

The shruti system is not simply "more notes per octave" than Western music. It represents a fundamentally different organizational principle: the same named note may be intoned differently in different ragas, with the shruti number indicating a range of acceptable intonation rather than a fixed pitch [1][4].

### Arabic Maqam

The Arabic maqam system employs a set of melodic modes characterized by specific interval sequences, many of which include neutral intervals (between Western major and minor). The theoretical framework is commonly analyzed using 24-EDO (quarter-tone temperament, 50 cents per step), but more precise analysis uses 53-EDO (22.6 cents per step) or just intonation ratios [1][4]:

- **Neutral second:** Approximately 150 cents (between minor 2nd at 100 and major 2nd at 200)
- **Neutral third:** Approximately 350 cents (between minor 3rd at 300 and major 3rd at 400)
- **Quarter-flat and quarter-sharp:** Standard notation uses half-flat and half-sharp accidentals

Key maqams include Rast (featuring the neutral third), Bayati (descending neutral seconds), and Hijaz (featuring an augmented second). Each maqam has characteristic melodic behaviors, modulation pathways, and emotional associations that go far beyond the interval content [4].

### Turkish Makam

Turkish classical music theory uses a system based on the Holdrian comma (53-EDO step = 22.6 cents) as its primary theoretical unit. The 53-EDO framework provides near-perfect Pythagorean fifths and excellent approximations to most intervals used in practice. Standard Turkish music notation marks accidentals in units of commas [4].

### Indonesian Gamelan

Indonesian gamelan music uses two primary scale systems, neither of which corresponds to any Western temperament [1][4]:

**Slendro:** A pentatonic scale with roughly equal intervals of approximately 240 cents per step, close to 5-EDO. However, individual gamelan ensembles are tuned uniquely -- no two gamelans are tuned identically, and the specific tuning is part of each ensemble's identity.

**Pelog:** A heptatonic scale with unequal intervals. A typical pelog tuning might span steps of approximately 100, 150, 280, 120, 150, 280, and 120 cents, though the actual intervals vary significantly between ensembles. Pelog melodies typically use pentatonic subsets (pathet) selected from the seven available tones.

### Ancient Greek Genera

Ancient Greek music theory (Aristoxenus, c. 350 BCE; Ptolemy, c. 150 CE) recognized three genera -- categories of tetrachord division -- that employed intervals much smaller than the modern semitone [1]:

| Genus | Interval Sizes | Character |
|---|---|---|
| Diatonic | ~200, ~200, ~100 cents | Standard Western-like |
| Chromatic | ~300, ~100, ~100 cents | Augmented + two semitones |
| Enharmonic | ~400, ~50, ~50 cents | Major third + two quarter tones |

The enharmonic genus, with its intervals of approximately 50 cents (quarter tones) or less, represents one of the oldest documented uses of microtonal intervals in Western music theory [1].

---

## 7. Macrotonal EDO Systems

### Definition

Macrotonal EDOs are equal divisions of the octave with fewer than 12 divisions, forming a finite set of 11 members (1-EDO through 11-EDO). Six of these (5, 7, 8, 9, 10, 11) are xenharmonic -- they are not subsets of 12-EDO and therefore contain intervals that do not exist on a standard piano [3]:

| EDO | Step (cents) | Subset of 12? | Xenharmonic? | Cultural Correspondence |
|---|---|---|---|---|
| 1 | 1200 | Yes (octave only) | No | Trivial |
| 2 | 600 | Yes (tritone) | No | Tritone dyad |
| 3 | 400 | Yes (aug triad) | No | Augmented triad |
| 4 | 300 | Yes (dim 7th) | No | Diminished seventh |
| 5 | 240 | No | Yes | Slendro, some African |
| 6 | 200 | Yes (whole tone) | No | Whole-tone scale |
| 7 | 171.4 | No | Yes | Thai, equidistant heptatonic |
| 8 | 150 | No | Yes | Diminished scale subset |
| 9 | 133.3 | No | Yes | Rare; good 7/6 |
| 10 | 120 | No | Yes | Contains 5-EDO subset |
| 11 | 109.1 | No | Yes | Highly xenharmonic |

### Detailed Properties

**5-EDO (240 cents/step):** The largest xenharmonic macrotonal EDO. Its 240-cent step is close to the 7:6 septimal minor third (267 cents) and the neutral third of some traditions. It corresponds to some Indonesian slendro tunings and to certain pentatonic scales documented in sub-Saharan African music. 5-EDO contains no interval close to the perfect fifth (3:2), making it harmonically unusual by Western standards [3].

**7-EDO (171.4 cents/step):** Functions as a complete heptatonic scale with all intervals neutral (between major and minor). Its "fifth" (4 steps = 685.7 cents) is 16 cents flat of just, which is noticeable but usable. 7-EDO has been proposed as a model for certain Thai tuning systems and for "equidistant" heptatonic scales documented in several African traditions. It is the largest EDO that provides a single-step diatonic-like scale [3].

**8-EDO (150 cents/step):** Its step size equals the quarter-tone sharp, and its intervals include a neutral third (3 steps = 450 cents) and a "fifth" of 750 cents (a tritone-sharp). 8-EDO is related to the octatonic (diminished) scale but with equal steps rather than the alternating semitone-whole-tone pattern of the diminished scale in 12-EDO [3].

**9-EDO (133.3 cents/step):** Provides a close approximation of the 7/6 septimal minor third (267 cents at 2 steps) and a reasonable "fifth" at 5 steps (666.7 cents), though this fifth is 35 cents flat. The 133-cent step is close to the 27/25 limma of 133 cents. 9-EDO is rare in both theory and practice [3].

**10-EDO (120 cents/step):** Contains 5-EDO as a subset (every other note). Its step size of 120 cents is between a semitone and a whole tone. 10-EDO provides a passable minor third (3 steps = 360 cents) and a fifth at 7 steps (840 cents) that is too sharp to be functional [3].

**11-EDO (109.1 cents/step):** The most xenharmonic of all macrotonal EDOs. Its step size is close to a semitone but slightly wider, creating a scale that sounds perpetually "off" to ears trained in 12-EDO. It features a minor subfifth (5 steps = 545.5 cents, 156 cents flat of just) but provides a decent approximation of the 11th harmonic (11/8 = 551.3 cents). 11-EDO is almost never encountered in traditional music but has been used in xenharmonic composition as a deliberately alien sound world [3].

---

## 8. Meantone and Well Temperaments

### The Temperament Problem

The fundamental temperament problem arises from the impossibility of simultaneously tuning all fifths pure and all thirds pure. In Pythagorean tuning (pure fifths), the major third is 408 cents -- 22 cents sharp of the just 5:4 ratio at 386 cents. This discrepancy is the syntonic comma (21.5 cents). Meantone and well temperaments offer different solutions [1][2]:

### Quarter-Comma Meantone

The most common meantone temperament narrows each fifth by 1/4 of the syntonic comma (approximately 5.4 cents), producing pure major thirds (386 cents) at the expense of slightly narrow fifths (696.6 cents) and one extremely dissonant "wolf fifth" (approximately 738 cents). This system dominated European keyboard music from approximately 1500 to 1750 [1].

### Well Temperaments

Well temperaments (Werckmeister, Kirnberger, Vallotti, and others) distribute the comma unevenly across the twelve fifths, creating keys with different characters -- some more consonant, some more tense -- while avoiding the extreme wolf interval of meantone. This unequal distribution gives each key a distinctive "color," which was valued by composers from Bach through Beethoven [1].

### Equal Temperament Triumph

12-EDO distributes the Pythagorean comma equally across all twelve fifths, making each fifth narrow by approximately 2 cents. The result is a system where all keys are equivalent -- no key has a wolf interval, but no key has a pure third either (the 12-EDO major third at 400 cents is 14 cents sharp of just). This compromise won acceptance gradually, becoming the standard for Western keyboard instruments by the mid-19th century [1][2].

---

## 9. Xenharmonic Composition

### The Xenharmonic Movement

Xenharmonic music is music that uses tuning systems and intervals outside of 12-EDO. The term was coined by Ivor Darreg in the mid-20th century. The modern xenharmonic community is international and connected primarily through online resources including the Xenharmonic Wiki (en.xen.wiki), the Microtonal Encyclopedia, and various forums and social media groups [3].

Compositional approaches include:

- **Adaptive just intonation:** Dynamically retuning intervals based on harmonic context
- **EDO exploration:** Composing in specific EDOs (19, 22, 31, 41, 53, 72 are popular)
- **Free intonation:** No fixed tuning grid; pitches chosen freely within the continuum
- **Spectral music:** Deriving pitch material from the analysis of acoustic spectra
- **Combination tones:** Using sum and difference frequencies as compositional material

---

## 10. Pioneers and Instrument Builders

### Key Figures

The history of microtonal music includes instrument builders, composers, and theorists who expanded the tonal palette beyond 12-EDO [1][4]:

- **Nicola Vicentino (1511-1576):** Built the archicembalo, a keyboard with 36 keys per octave, to perform music in all three ancient Greek genera
- **Harry Partch (1901-1974):** Developed a 43-tone just intonation scale and built an entire orchestra of custom instruments (Cloud Chamber Bowls, Chromelodeon, Diamond Marimba) to perform his compositions
- **Alois Haba (1893-1973):** Composed extensively in quarter-tone and sixth-tone systems; established a microtonal department at the Prague Conservatory (1934-1949)
- **Julian Carrillo (1875-1965):** Developed the "Sonido 13" system extending beyond 12-EDO; built pianos with 16ths and 32nds of a tone
- **Easley Blackwood (1933-2023):** Composed microtonal etudes in every EDO from 13 through 24, each exploring the unique harmonic possibilities of that temperament
- **Adriaan Fokker (1887-1972):** Commissioned a 31-EDO organ (the Fokker Organ) at the Teylers Museum in Haarlem, Netherlands

---

## 11. Interval Perception and Psychoacoustics

### Categorical Perception

Trained Western listeners exhibit categorical perception of pitch intervals: they tend to hear intervals as the nearest 12-EDO category rather than perceiving the exact size. A 390-cent interval is heard as a "major third" (400 cents) rather than as its true size. This categorical warping makes microtonal discrimination more difficult for 12-EDO-trained listeners but does not affect listeners from non-12-EDO traditions similarly [2].

### Roughness and Beating

When two tones are close in frequency, they produce audible beats at the difference frequency. As the interval increases beyond approximately 15-20 Hz of separation, the beats fuse into a perception of "roughness" that gradually decreases as the interval widens. The roughness minimum occurs at intervals of approximately one critical bandwidth (approximately 1/4 octave = 300 cents in the speech range). This roughness-curve physics constrains which intervals are perceived as "consonant" across all cultures [2].

### The Consonance Continuum

Consonance and dissonance are not binary categories but a continuum influenced by harmonic series alignment, roughness, and cultural familiarity. The most consonant intervals across cultures correspond to simple frequency ratios (2:1, 3:2, 4:3, 5:4). Microtonal intervals can achieve both high consonance (when they approximate just ratios closely) and deliberate dissonance (when they fall in the roughness maxima between just ratios) [2].

---

## 12. Frequency Atlas: Interval Systems

| System | Steps/Octave | Step Size (cents) | Origin/Use |
|---|---|---|---|
| 5-EDO | 5 | 240 | Slendro, African pentatonic |
| 7-EDO | 7 | 171.4 | Thai, equidistant heptatonic |
| 12-EDO | 12 | 100 | Western standard |
| 17-EDO | 17 | 70.6 | Renaissance proposals |
| 19-EDO | 19 | 63.2 | Meantone equivalent |
| 22-EDO | 22 | 54.5 | Shruti approximation |
| 24-EDO | 24 | 50 | Arabic quarter-tone standard |
| 31-EDO | 31 | 38.7 | Fokker organ, excellent 5-limit |
| 41-EDO | 41 | 29.3 | Excellent 7-limit and 11-limit |
| 53-EDO | 53 | 22.6 | Turkish makam, near-perfect 3-limit |
| 72-EDO | 72 | 16.7 | Excellent all limits through 17 |
| Pythagorean | N/A | 90, 114 (L, s) | Ancient Greek, medieval European |
| 1/4-comma MT | N/A | 76, 117 (s, L) | Renaissance-Baroque European |
| 43-JI (Partch) | 43 (unequal) | Various | 11-limit just intonation |

---

## 13. Cross-References

- **[M1: Deep Space Pressure Waves](01-deep-space-pressure-waves.md)** -- The harmonic series governs both musical intervals and astrophysical oscillation modes; the same mathematical relationships (integer ratios, overtone structure) appear at all scales
- **[M2: Sub-Hz and Infrasonic Domain](02-sub-hz-infrasonic.md)** -- Interval perception requires frequencies above approximately 20 Hz; below this, pitch discrimination ceases and the frequency is perceived as rhythm or pulsation
- **[M3: The Bridge Zone](03-the-bridge-zone.md)** -- Tonal hearing emerges in the bridge zone; microtonal discrimination is impossible below approximately 50 Hz where pitch perception itself is uncertain
- **[M5: Sonification Methodology](05-sonification-methodology.md)** -- Sonification design must choose which tuning system to use for pitch mapping; microtonal tunings offer finer frequency resolution
- **[DAA: Deep Audio Analyzer](../DAA/index.html)** -- Spectral analysis can reveal the exact intonation of recorded performances, distinguishing 12-EDO from just intonation from other systems
- **[COI: Coil](../COI/index.html)** -- Electromagnetic resonance frequencies in coils follow the same harmonic series physics as acoustic intervals
- **[ARC: Shapes and Colors](../ARC/index.html)** -- Interval lattice diagrams visualize the geometric structure of tuning systems; tonnetz and harmonic lattice are spatial representations of interval relationships
- **[T55: 555 Timer](../T55/index.html)** -- Timer circuits can generate precise frequencies for tuning system comparison and interval audition

---

## 14. Sources

1. Britannica. "Microtonal music." Encyclopaedia Britannica. Christensen, T. (2002). *The Cambridge History of Western Music Theory*. Cambridge University Press. Barker, A. (1989). *Greek Musical Writings, Vol. II*. Cambridge University Press.

2. Xenharmonic Wiki (en.xen.wiki). "Macrotonal EDO," "Equal Division of the Octave," "Just intonation," "Prime limit," "Comma." Community-curated, cross-referenced with academic sources.

3. Microtonal Encyclopedia (microtonal.miraheze.org). Interval tables, EDO comparison charts, tuning system reference. Huygens-Fokker Foundation / Dutch Microtonal Society publications.

4. Microtonaltheory.com. Maqam analysis, gamelan tuning documentation, shruti system analysis. Cross-referenced with Powers, H.S. (2001). "Mode" in *New Grove Dictionary of Music*. Hood, M. (1954). *The Nuclear Theme as a Determinant of Patet in Javanese Music*. Groningen.
