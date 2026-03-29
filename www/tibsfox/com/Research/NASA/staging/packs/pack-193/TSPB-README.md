# The Space Between — Mathematical Textbook
## docs/TSPB/ Directory

*"Start with shapes. Start with circles and triangles. Start with the unit circle, because it contains within its elegant simplicity the seeds of all of trigonometry, which contains the seeds of harmonic analysis, which describes how waves behave, which describes how everything behaves because at a fundamental level the universe is made of waves."*

— The Space Between, February 2026

---

## What This Is

`docs/TSPB/` is the living LaTeX source for *The Space Between* — a 923-page mathematical autodidact's guide built on an eight-layer progression from the unit circle to L-systems. It is the master mathematical textbook underlying the GSD ecosystem.

This directory was initiated by Part G of the NASA Mission Series (March 2026). Each Part G run deposits new chapters and updates existing ones as the mission series exercises the mathematics.

**Structural template:** McNeese & Hoag, *Engineering and Technical Handbook*, Prentice-Hall, 1959 (LC 57-6690). Every section follows their three-element format: **Tables / Formulas / Examples**. Updated for modern mathematics and science.

---

## Directory Structure

```
docs/TSPB/
  README.md                          ← This file
  TSPB.pdf                           ← Compiled book (run tools/compile.sh)
  TSPB-main.tex                      ← Master LaTeX file

  parts/
    00-introduction/                 ← The Space Between essay + How to read
    01-unit-circle/                  ← Layer 1: The circle that generates all trig
    02-pythagorean/                  ← Layer 2: The theorem that measures space
    03-trigonometry/                 ← Layer 3: The language of angles and waves
    04-vector-calculus/              ← Layer 4: Motion, fields, and change
    05-set-theory/                   ← Layer 5: What belongs where
    06-category-theory/              ← Layer 6: The algebra of structure
    07-information-systems/          ← Layer 7: Meaning and measurement
    08-l-systems/                    ← Layer 8: Growth, recursion, form

  appendices/
    physical-constants.tex           ← NIST CODATA 2022 constants
    conversion-factors.tex           ← SI + Imperial + Astronomical
    material-properties.tex          ← NASA materials (from Part D series)
    nasa-mathematics.tex             ← Mathematics from the mission series
    mcneese-hoag-index.tex           ← Cross-reference to 1959 original

  tools/
    compile.sh                       ← Three-pass XeLaTeX compilation
    validate-formulas.py             ← Python formula checker
    update-tables.py                 ← Regenerate tables from modern data
```

---

## The Eight Layers

| Layer | Subject | Status |
|-------|---------|--------|
| 1 | Unit Circle | Scaffold ready |
| 2 | Pythagorean Theorem | Scaffold ready |
| 3 | Trigonometry | Scaffold ready |
| 4 | Vector Calculus | Scaffold ready |
| 5 | Set Theory | Scaffold ready |
| 6 | Category Theory | Scaffold ready |
| 7 | Information Systems Theory | Scaffold ready |
| 8 | L-Systems | Scaffold ready |

Each layer is a complete textbook section: introduction → tables → formulas → worked examples → NASA mission applications → connections to adjacent layers.

---

## How to Compile

```bash
cd docs/TSPB
bash tools/compile.sh
# or manually:
xelatex -interaction=nonstopmode TSPB-main.tex
xelatex -interaction=nonstopmode TSPB-main.tex
xelatex -interaction=nonstopmode TSPB-main.tex
```

Requires: `texlive-xetex`, `texlive-latex-extra`, `fonts-dejavu`, `texlive-science`

---

## Contributing via Part G

New mathematical content is added to this directory by **Part G of the NASA Mission Series**. Each Part G run:
1. Harvests mathematical content exercised across Parts D and E mission runs
2. Formalizes it in McNeese-Hoag three-element format
3. Deposits it to the appropriate `parts/0N-*/` directory
4. Updates `TSPB-main.tex` to include new files
5. Compiles and validates TSPB.pdf

---

## The Philosophy

*"The framework's job — the educational job — is to build the bridge from that circle to those stars, one step at a time, at the pace that feels natural to the specific, unique, impossible child who is walking across it."*

This is not a textbook for the purpose of passing an examination. It is a textbook for the purpose of understanding the universe, using the same mathematical tools that the NASA mission series used to explore it.

---

*Initiated: March 29, 2026 | Part G v1.0 | Miles Tiberius Foxglove | GSD Ecosystem*
