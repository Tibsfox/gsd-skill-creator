# Mathematics Department Blueprint
## How "The Space Between" Seeds the Math Wing

**Date:** March 1, 2026
**Status:** Architecture Blueprint
**Source:** "The Space Between" (923 pages), unit-circle-skill-creator-synthesis.md, gsd-mathematical-foundations-conversation.md
**Purpose:** Maps the mathematical foundations from Tibsfox's textbook into the College's Mathematics Department, establishing cross-references to all Rosetta panels and the Culinary Arts department

---

## The Complex Plane of Experience as Organizing Principle

"The Space Between" establishes the Complex Plane of Experience with two axes:
- **Real axis:** Logic ↔ Creativity
- **Imaginary axis:** Real ↔ Imaginary

The unit-circle-skill-creator synthesis maps this to skill-creator's learning functions, where each concept has an angular position θ on the unit circle and a radial depth r representing maturity. The Mathematics Department uses this directly: concepts ARE positioned on the Complex Plane, and their position informs panel selection.

| Angular Region | Character | Math Concepts | Natural Panel |
|---------------|-----------|---------------|---------------|
| θ ≈ 0 (pure real) | Concrete, computational | Arithmetic, ratios, measurements | C++, Fortran |
| θ ≈ π/6 | Mostly concrete | Algebra, functions, equations | Python, Java |
| θ ≈ π/4 | Balanced | Trigonometry, geometry | All panels equally |
| θ ≈ π/3 | Moving toward abstract | Calculus, analysis | Python, Lisp |
| θ ≈ π/2 | Peak abstraction | Complex analysis, topology | Lisp (code as data) |

---

## Wing-to-Panel Cross-Reference Map

### Algebra Wing → Panel Expression

| Concept | Python | C++ | Java | Lisp | Pascal | Fortran |
|---------|--------|-----|------|------|--------|---------|
| Variables & expressions | `x = 5; y = x**2` | `int x=5; int y=x*x;` | `int x=5; int y=x*x;` | `(let ((x 5)) (* x x))` | `x := 5; y := x*x;` | `X = 5; Y = X**2` |
| Ratios & proportions | `ratio = a/b` | `double ratio = a/b;` | `double ratio = (double)a/b;` | `(/ a b)` | `ratio := a/b;` | `RATIO = REAL(A)/REAL(B)` |
| Logarithmic scales | `math.log10(x)` | `std::log10(x)` | `Math.log10(x)` | `(log x 10)` | `Log10(x)` (custom) | `LOG10(X)` |

**Culinary Cross-References:**
- Ratios → Baker's percentages (flour=100%, everything else as percentage)
- Logarithmic scales → pH in cooking (acid/alkaline effects on Maillard reactions)

### Geometry Wing → Panel Expression

| Concept | Python | C++ | Lisp | Fortran |
|---------|--------|-----|------|---------|
| Unit circle | `math.sin(theta), math.cos(theta)` | `std::sin(theta), std::cos(theta)` | `(sin theta) (cos theta)` | `SIN(THETA), COS(THETA)` |
| Transformations | Matrix operations via `numpy` | Template metaprogramming | List transformations | Array operations |
| Area/volume | `math.pi * r**2` | `M_PI * r * r` | `(* pi (* r r))` | `PI * R**2` |

**Culinary Cross-References:**
- Unit circle → Periodic processes: fermentation cycles, oven temperature fluctuations
- Area/volume → Pan sizing: surface area determines browning rate; volume determines capacity

### Calculus Wing → Panel Expression

| Concept | Python | C++ | Lisp | Fortran |
|---------|--------|-----|------|---------|
| Exponential decay | `N0 * math.exp(-k*t)` | `N0 * std::exp(-k*t)` | `(* N0 (exp (- (* k t))))` | `N0 * EXP(-K*T)` |
| Derivative (numerical) | `(f(x+h)-f(x))/h` | Templated difference quotient | `(/ (- (f (+ x h)) (f x)) h)` | `(F(X+H)-F(X))/H` |
| Integration (Simpson's) | `scipy.integrate.quad` | Numerical integration library | Recursive subdivision | `CALL QUAD(F,A,B,RESULT)` |

**Culinary Cross-References:**
- Exponential decay → Newton's law of cooling (hot food approaching room temperature)
- Derivative → Rate of temperature change (when to pull food from oven before target temp)
- Integration → Total energy absorbed during cooking (area under temperature-time curve)

### Complex Analysis Wing → Panel Expression

| Concept | Python | Lisp |
|---------|--------|------|
| Complex numbers | `z = complex(3, 4)` | `(complex 3 4)` |
| Euler's formula | `cmath.exp(1j * theta)` | `(exp (* #C(0 1) theta))` |
| Fractal geometry | `z = z**2 + c` (Mandelbrot) | `(defun mandelbrot (z c) (+ (* z z) c))` |

**Culinary Cross-References:**
- Fractal geometry → Calibration expansion: a simple seed idea (user feedback) self-replicates outward into detailed adjustments, exactly as a Mandelbrot set generates infinite complexity from z = z² + c

---

## "The Space Between" Chapter-to-Concept Mapping

The 923-page textbook provides the deep reference tier for each concept. Key chapters map to initial concept seeds:

| Textbook Topic | College Concept ID | Wing | Initial Panels |
|---------------|-------------------|------|---------------|
| Number systems | `math-number-systems` | Algebra | Python, C++, Pascal |
| Functions | `math-functions` | Algebra | All 6 |
| Exponential & logarithmic | `math-exponential-decay`, `math-logarithmic-scales` | Calculus, Algebra | All 6 |
| Trigonometry | `math-trig-functions` | Geometry | All 6 |
| Complex numbers | `math-complex-numbers` | Complex Analysis | Python, C++, Lisp |
| Euler's formula | `math-euler-formula` | Complex Analysis | All 6 |
| Fractals | `math-fractal-geometry` | Complex Analysis | Python, Lisp |
| Ratios & proportion | `math-ratios` | Algebra | All 6 |
| Calculus fundamentals | `math-derivative`, `math-integral` | Calculus | Python, C++, Fortran |
| Statistics foundations | `math-probability`, `math-distributions` | Statistics | Python, Java |

---

## Pedagogical Annotations by Panel

Each panel teaches something different about the SAME concept:

### Example: Exponential Decay across All Panels

**Python teaches:** "Readability. `N0 * math.exp(-k*t)` reads almost exactly like the mathematical notation N₀·e^(-kt). Python is chosen for scientific computing because the code communicates the math."

**C++ teaches:** "Precision. `double` vs `float` matters. Accumulated floating-point error in long simulations produces wrong results. C++ makes you think about what the hardware actually does with your numbers."

**Java teaches:** "Portability. `Math.exp()` produces the same result on every platform. When science needs to be reproducible across different computers, platform independence matters."

**Lisp teaches:** "Homoiconicity. `(* N0 (exp (- (* k t))))` is both a computation AND a data structure. You could write a program that reads this definition, transforms it, generates variations. The boundary between code and data dissolves."

**Pascal teaches:** "Discipline. `function Decay(Initial, Rate, Time: Real): Real;` with its explicit types and begin/end structure forces clear thinking. Wirth designed Pascal to make the programmer understand — not just the computer."

**Fortran teaches:** "Heritage. `N0 * EXP(-K*T)` connects you to sixty years of computational science. Most weather models, nuclear physics simulations, and fluid dynamics codes are written in Fortran. Understanding it means understanding the history of scientific computing."

---

## Integration with Calibration Engine

Mathematical concepts from the Math Department directly support the Calibration Engine's cooking domain models:

| Math Concept | Calibration Application | Example |
|-------------|------------------------|---------|
| Exponential decay | Cooling curve prediction | "Your roast will reach 145°F internal temp in ~12 minutes of resting" |
| Ratios | Baker's percentage scaling | "For 2 loaves: flour 1000g, water 650g (65%), salt 20g (2%)" |
| Logarithmic scales | pH adjustment | "Adding 1 tbsp vinegar shifts pH from ~6 to ~4 — doubles the acidity" |
| Derivatives | Rate-of-change monitoring | "Temperature is rising 5°F/minute — pull at 155°F, carryover will reach 165°F" |
| Statistics | Calibration confidence | "After 8 sessions, confidence in your oven's -15°F offset is 0.92" |

This is the through-line: the same mathematical machinery that positions concepts on the Complex Plane of Experience also powers the food science behind "your cookies came out flat."

---

*The Math Department isn't just a wing of the College. It's the language the entire system thinks in.*
