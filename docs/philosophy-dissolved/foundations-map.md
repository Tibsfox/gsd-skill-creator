# Foundations Map — Paradox to Mathematical Foundation

**Pack:** Philosophy Dissolved
**Purpose:** Cross-reference showing which mathematical foundation(s) resolve each paradox.

---

## Coverage Summary

All eight foundations from the mathematical progression appear at least once as a resolving framework.

| Foundation | Code | Paradoxes Resolved | Count |
|-----------|------|-------------------|-------|
| Perception / Number Theory | F1 | — | 0* |
| Algebra | F2 | — | 0* |
| Trigonometry | F3 | Zeno's Dichotomy | 1 |
| Vector Calculus | F4 | Zeno's Dichotomy, Zeno's Achilles | 2 |
| Set Theory | F5 | Goodman's Grue, Sorites, Thomson's Lamp, Sleeping Beauty, Ship of Theseus | 5 |
| Category Theory | F6 | Duhem-Quine, Chinese Room | 2 |
| Information Theory | F7 | Hempel's Raven, Goodman's Grue, Ship of Theseus, Teletransportation, Newcomb, Surprise Examination, Sleeping Beauty, Mary's Room | 8 |
| L-Systems | F8 | Liar's Paradox | 1 |

*F1 and F2 do not appear as primary resolving frameworks. They serve as prerequisite foundations (number theory underlies all counting arguments; algebra underlies all formula manipulation) rather than direct resolvers. Every resolution in this pack implicitly depends on F1 and F2 without explicitly invoking them.*

---

## By Room

### Room 1: Evidence & Confirmation

| Paradox | Primary Foundation | Secondary | Key Mathematical Tool |
|---------|-------------------|-----------|----------------------|
| Hempel's Raven | Information Theory (F7) | — | Bayesian weight of evidence, mutual information I(X;Y) |
| Goodman's Grue | Set Theory (F5) | Information Theory (F7) | Kolmogorov complexity, Minimum Description Length |
| Duhem-Quine | Category Theory (F6) | — | Commutative diagrams, diagnostic weight |

### Room 2: Identity & Persistence

| Paradox | Primary Foundation | Secondary | Key Mathematical Tool |
|---------|-------------------|-----------|----------------------|
| Ship of Theseus | Set Theory (F5) | Information Theory (F7) | Fuzzy membership, standing wave identity, eigenvalues |
| Sorites | Set Theory (F5) | — | Fuzzy set membership function mu(x) in [0,1] |
| Teletransportation | Information Theory (F7) | — | Channel capacity, no-cloning theorem |

### Room 3: Infinity & Motion

| Paradox | Primary Foundation | Secondary | Key Mathematical Tool |
|---------|-------------------|-----------|----------------------|
| Zeno's Dichotomy | Vector Calculus (F4) | Trigonometry (F3) | Convergent geometric series, limits |
| Zeno's Achilles | Vector Calculus (F4) | — | Trajectory equations, simultaneous solution |
| Thomson's Lamp | Set Theory (F5) | — | Discrete vs continuous topology, supertasks |

### Room 4: Decision & Prediction

| Paradox | Primary Foundation | Secondary | Key Mathematical Tool |
|---------|-------------------|-----------|----------------------|
| Newcomb's Problem | Information Theory (F7) | — | Mutual information I(D;P) between decision and predictor |
| Surprise Examination | Information Theory (F7) | — | Fixed-point analysis, self-referential belief updating |
| Sleeping Beauty | Set Theory (F5) | Information Theory (F7) | Sample space definition, self-locating belief |

### Room 5: Self-Reference & Emergence

| Paradox | Primary Foundation | Secondary | Key Mathematical Tool |
|---------|-------------------|-----------|----------------------|
| The Liar's Paradox | L-Systems (F8) | — | Production rule A -> not-A, oscillating sequences |
| The Chinese Room | Category Theory (F6) | — | Functors Sym -> Sem, natural transformations |
| Mary's Room | Information Theory (F7) | — | Channel capacity, encoding scheme distinction |

---

## Foundation Frequency

```
F7 Information Theory  ████████████████████  8 paradoxes (57%)
F5 Set Theory          ██████████████        5 paradoxes (36%)
F4 Vector Calculus     █████                 2 paradoxes (14%)
F6 Category Theory     █████                 2 paradoxes (14%)
F3 Trigonometry        ██                    1 paradox   (7%)
F8 L-Systems           ██                    1 paradox   (7%)
```

Information Theory (F7) is the dominant resolving framework — appearing in 8 of 14 paradoxes. This reflects its role as the epistemological foundation: most philosophical paradoxes are fundamentally questions about evidence, knowledge, and measurement, and information theory is the mathematics of evidence, knowledge, and measurement.

---

## The Progression

Reading the foundations in order (F3 -> F4 -> F5 -> F6 -> F7 -> F8) reveals a progression in the KIND of paradox each resolves:

- **F3/F4** resolve paradoxes of **quantity** — infinite sums, convergent processes, motion
- **F5** resolves paradoxes of **classification** — vague boundaries, identity, discrete vs continuous
- **F6** resolves paradoxes of **structure** — holistic testing, compositional understanding
- **F7** resolves paradoxes of **knowledge** — evidence, prediction, experience, identity
- **F8** resolves paradoxes of **self-reference** — the limits of systems that describe themselves

The progression from quantity to knowledge to self-reference mirrors the progression from perception to generation in the mathematical foundations themselves. Philosophy identified the terrain at each level. Mathematics provided the map.
