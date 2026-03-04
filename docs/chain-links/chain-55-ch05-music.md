# Chain Link: Chapter 5 — Music and 12-TET

**Chain position:** 55 of 100
**Subversion:** 1.50.55
**Type:** PROOF
**Part:** II: Hearing
**Score:** 4.38/5.0

---

## Score Trend

| Pos | Chapter | Score | Delta |
|-----|---------|-------|-------|
| 51  | Ch 1 — Numbers | 4.25 | — |
| 52  | Ch 2 — Unit Circle | 4.50 | +0.25 |
| 53  | Ch 3 — Pythagorean | 4.25 | -0.25 |
| 54  | Ch 4 — Trig & Waves | 4.25 | +0.00 |
| 55  | Ch 5 — Music & 12-TET | 4.38 | +0.13 |

## Chapter Summary

Chapter 5 applies exponential functions to music theory, deriving the 12-tone equal temperament (12-TET) system that underpins Western music. The core theorem — f_n = f0 * 2^(n/12) — is an exponential formula that divides the octave into 12 equal semitones. The second theorem quantifies how well this equal division approximates the "pure" ratios of just intonation (3/2 for a perfect fifth, 5/4 for a major third).

This chapter sits at the intersection of mathematics and culture. The 12-TET system is a mathematical compromise: it sacrifices the pure ratios of the harmonic series for the ability to play in any key. The chapter proves that this compromise is quantifiably small — the perfect fifth deviates by only 0.11% from the just ratio 3/2, the perfect fourth by a similar margin, the major third by under 1%.

The platform connections are structural parallels rather than identity-level: the chord name mapping in chords.ts is terminological, and the signal-classification.ts connection is a structural analogy between 12 semitones and 12 signal categories.

## Theorems Proved

### Theorem thm-5-3: 12-TET frequency formula f_n = f0 * 2^(n/12)
**Classification:** L1 — "I see it"
**Dependencies:** None
**Test:** proof-5-3-12tet-formula
**Platform Connection:** src/packs/plane/chords.ts terminological (chord name mapping)

Seven test cases verify the formula from unison (n=0) through octave (n=12), sub-octave (n=-12), individual semitone step (2^(1/12) ≈ 1.05946), cumulative product of 12 steps equals 2, and strict monotonicity across all 13 notes. The test demonstrating that applying 2^(1/12) twelve times gives exactly factor 2 is the cleanest verification of the formula's self-consistency.

### Theorem thm-5-4: 12-TET approximation quality
**Classification:** L2 — "I can do this"
**Dependencies:** thm-5-3
**Test:** proof-5-4-12tet-approx
**Platform Connection:** src/packs/plane/signal-classification.ts structural parallel

Quantitative comparison of 12-TET intervals against just intonation ratios. Key results: perfect fifth (7 semitones) deviates ≤ 0.11% from 3/2, perfect fourth (5 semitones) within 0.2% of 4/3, major third (4 semitones) within 1% of 5/4. Additional tests verify octave factoring (fifth * fourth = octave), harmonic series integer ratios, and all 12 semitone ratios lying in (1, 2]. The 0.11% tolerance value traces forward to teach-forward notes in ch07.

## Test Verification

**2 test suites, ~20 individual test cases.** Techniques: exact numerical evaluation (formula verification), percentage deviation bounds (assertPercentDeviation helper), product accumulation (12 semitone steps = octave), monotonicity checking, integer ratio verification. The test design emphasizes quantitative bounds — not just "close enough" but "within 0.11%" — which is the right approach for an approximation quality theorem.

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.00 | Clean L1/L2 proofs; quantitative bounds precisely stated |
| Proof Strategy | 4.50 | Bound-based verification (0.11%, 0.2%, 1%) is the right approach |
| Classification Accuracy | 4.75 | L1 for the formula (immediate), L2 for approximation quality (requires computation) |
| Honest Acknowledgments | 4.50 | Just intonation compromise quantified rather than hand-waved |
| Test Coverage | 4.25 | Good breadth; could have more intervals (minor third, tritone, etc.) |
| Platform Connection | 3.75 | Connections are real but terminological/structural, not identity-level |
| Pedagogical Quality | 4.75 | Cultural context (Western music) grounds abstract math beautifully |
| Cross-References | 4.50 | Forward reference to ch07 teach-forward (0.11% reappears); depends on ch02 |

**Composite:** 4.38

## Textbook Feedback

Chapter 5 is where the textbook earns its "Hearing" part title. The 12-TET system is a perfect pedagogical vehicle: it's familiar (every piano uses it), it's mathematical (exponential functions, logarithmic ratios), and it's imperfect (the approximation quality theorem quantifies the compromise). The student learns that mathematics doesn't just describe music — it reveals the trade-offs that shaped it.

The quantitative bound approach (0.11%, not just "close") is the chapter's strongest pedagogical choice. It teaches the student that mathematical analysis can produce precise answers to qualitative questions ("how good is 12-TET?"). The teach-forward connection to ch07 (where these tolerance values reappear in information density context) shows good textbook design.

## Closing

Chapter 5 brings mathematics to music with two theorems that establish the 12-TET system and quantify its approximation quality. The precision of the bounds (0.11% for the fifth, under 1% for the major third) exemplifies what computational proof verification does well — it turns qualitative claims into quantitative certainties. The platform connections are modest but the pedagogical value is high.

Score: 4.38/5.0
