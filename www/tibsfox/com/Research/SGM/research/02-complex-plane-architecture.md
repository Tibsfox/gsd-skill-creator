# Complex Plane Architecture

> **Domain:** Sacred Geometry and the Complex Plane
> **Module:** 2 -- The Complex Plane as Native Habitat of Sacred Form
> **Through-line:** *The complex plane is not merely a mathematical convenience for handling square roots of negative numbers. It is a two-dimensional space of experience: the real axis encoding magnitude, the imaginary axis encoding rotation, and together they encode every transformation preservable under angle.* Euler's identity is the unit circle announcing itself as the alpha point of all sacred geometry.

---

## Table of Contents

1. [The Complex Plane as Geometric Space](#1-the-complex-plane-as-geometric-space)
2. [Euler's Formula: The Genesis of Sacred Form](#2-eulers-formula-the-genesis-of-sacred-form)
3. [Euler's Identity](#3-eulers-identity)
4. [Roots of Unity as Sacred Polygon Generators](#4-roots-of-unity-as-sacred-polygon-generators)
5. [Cyclotomic Polynomials](#5-cyclotomic-polynomials)
6. [Mobius Transformations](#6-mobius-transformations)
7. [Conformal Mappings and Angle Preservation](#7-conformal-mappings-and-angle-preservation)
8. [The Riemann Sphere and Stereographic Projection](#8-the-riemann-sphere-and-stereographic-projection)
9. [Domain Coloring: Visualizing Complex Functions](#9-domain-coloring-visualizing-complex-functions)
10. [The Unit Circle as Primordial Sacred Form](#10-the-unit-circle-as-primordial-sacred-form)
11. [Complex Dynamics and Fractal Generation](#11-complex-dynamics-and-fractal-generation)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Complex Plane as Geometric Space

The complex plane (Argand plane, Gauss plane) assigns every complex number `z = a + bi` a unique point with Cartesian coordinates `(a, b)`. The real axis is the horizontal axis; the imaginary axis is the vertical. Every complex number has two equivalent representations [1]:

- **Cartesian form:** `z = a + bi` where `a = Re(z)` and `b = Im(z)`
- **Polar form:** `z = r * e^(i*theta)` where `r = |z|` (modulus) and `theta = arg(z)` (argument)

The polar form reveals the geometric meaning of complex multiplication: multiplying two complex numbers multiplies their moduli and adds their arguments. This means multiplication by `e^(i*theta)` is pure rotation by angle theta. Multiplication by a real scalar `r` is pure scaling. Every complex multiplication is a rotation-and-scaling -- a *spiral similarity* [2].

```
THE COMPLEX PLANE
================================================================

  Im (imaginary axis)
   ^
   |            . z = a + bi = r*e^(i*theta)
   |           /|
   |          / |
   |     r   /  |
   |        /   | b = Im(z)
   |       / th |
   |      /_____|____________> Re (real axis)
   |        a = Re(z)
   |
   |  r = |z| = sqrt(a^2 + b^2)     (modulus)
   |  theta = atan2(b, a)            (argument)
   |
   |  Multiplication: z1 * z2
   |    |z1*z2| = |z1| * |z2|        (multiply moduli)
   |    arg(z1*z2) = arg(z1)+arg(z2) (add arguments)
```

This makes the complex plane the natural coordinate system for any mathematics involving rotation, oscillation, or cyclic phenomena -- which is to say, all of sacred geometry [3].

---

## 2. Euler's Formula: The Genesis of Sacred Form

Euler's formula, published in *Introductio in analysin infinitorum* (1748), establishes the fundamental connection between complex exponentials and trigonometry [4]:

```
e^(i*theta) = cos(theta) + i*sin(theta)
```

This formula states that the complex exponential of a purely imaginary number traces the unit circle. Every point on the unit circle `|z| = 1` can be written as `e^(i*theta)` for some real angle theta.

### Proof Sketch (Taylor Series)

The formula follows from comparing the Taylor series of `e^x`, `cos(x)`, and `sin(x)`:

```
e^x     = 1 + x + x^2/2! + x^3/3! + x^4/4! + ...
cos(x)  = 1     - x^2/2!          + x^4/4! - ...
sin(x)  =     x          - x^3/3!          + x^5/5! - ...

Substituting x = i*theta:
e^(i*theta) = 1 + i*theta - theta^2/2! - i*theta^3/3! + theta^4/4! + ...
            = (1 - theta^2/2! + theta^4/4! - ...) + i(theta - theta^3/3! + ...)
            = cos(theta) + i*sin(theta)
```

The three series align perfectly. This is not coincidence; it is the deep identity connecting exponential growth, circular motion, and oscillation [5].

### Why Euler's Formula Matters for Sacred Geometry

Euler's formula transforms sacred geometry from compass-and-straightedge construction to algebraic computation:

- **Circles:** `z = r * e^(i*theta)` for theta in `[0, 2*pi)`
- **Regular n-gons:** Vertices at `e^(2*pi*i*k/n)` for `k = 0, ..., n-1`
- **Rotation:** Multiply by `e^(i*alpha)` to rotate by angle alpha
- **Reflection:** Complex conjugation `z -> z*` reflects across the real axis
- **Spiral similarity:** Multiply by `r * e^(i*alpha)` to rotate and scale simultaneously

Every sacred geometric construction becomes an algebraic operation on complex numbers [6].

---

## 3. Euler's Identity

Setting `theta = pi` in Euler's formula yields:

```
e^(i*pi) + 1 = 0
```

This equation unites five fundamental mathematical constants: `e` (base of natural logarithm, 2.71828...), `i` (imaginary unit, sqrt(-1)), `pi` (circle constant, 3.14159...), `1` (multiplicative identity), and `0` (additive identity) [7].

A 1990 poll in *The Mathematical Intelligencer* named Euler's identity the most beautiful theorem in mathematics. A 2004 *Physics World* poll tied it with Maxwell's equations as the greatest equation ever written [8].

### Geometric Interpretation

Euler's identity says: start at the number 1 on the real axis. Travel a distance of pi along the unit circle (which is halfway around). You arrive at -1. Add 1, and you are at the origin: 0.

The identity encodes the fact that the unit circle is the fundamental mediator between the exponential function (growth) and the trigonometric functions (oscillation). Sacred geometry lives on this bridge.

```
EULER'S IDENTITY ON THE UNIT CIRCLE
================================================================

            i
            |
            |
   -1 ------O------ 1       e^(i*0) = 1
            |                e^(i*pi/2) = i
            |                e^(i*pi) = -1
           -i                e^(i*3*pi/2) = -i

  The journey from 1 to -1 along the upper
  semicircle is the path e^(i*theta) traces
  as theta goes from 0 to pi.

  e^(i*pi) = -1
  e^(i*pi) + 1 = 0

  Five constants. One equation. One circle.
```

---

## 4. Roots of Unity as Sacred Polygon Generators

The nth roots of unity are the solutions to `z^n = 1` in the complex numbers [9]:

```
U_n = { e^(2*pi*i*k/n) | k = 0, 1, ..., n-1 }
```

These n points are equally spaced on the unit circle. They form the vertices of a regular n-gon centered at the origin. This is the complex-plane mechanism by which the unit circle generates every sacred polygon.

### Key Properties

- **Sum equals zero:** For `n > 1`, the sum of all nth roots of unity is 0. The roots are perfectly balanced on the circle, canceling each other. Quanta Magazine (2021) describes this as "a geometric fact: the roots are perfectly balanced" [10].
- **Product equals `(-1)^(n-1)`:** The product of all nth roots reflects the parity of n.
- **Primitive roots:** A root `e^(2*pi*i*k/n)` is primitive if `gcd(k, n) = 1`. The number of primitive nth roots is Euler's totient `phi(n)`.
- **Group structure:** Under multiplication, the nth roots of unity form a cyclic group of order n, isomorphic to `Z/nZ`.

### Sacred Form Generation Table

| n | Roots | Sacred Form | Complex Encoding |
|---|---|---|---|
| 3 | 1, omega, omega^2 | Equilateral triangle | Cyclotomic field Q(zeta_3) |
| 4 | 1, i, -1, -i | Square / Cube face | Gaussian integers Z[i] |
| 5 | 5th roots | Pentagon / Pentagram | Q(zeta_5) contains phi |
| 6 | 6th roots | Hexagon / Flower of Life | Eisenstein integers Z[omega] |
| 8 | 8th roots | Octagon / Islamic stars | Q(zeta_8) = Q(i, sqrt(2)) |
| 10 | 10th roots | Decagon | Q(zeta_10) = Q(zeta_5) |
| 12 | 12th roots | Dodecagon / Rose windows | Q(zeta_12) = Q(i, sqrt(3)) |

The cyclotomic field `Q(zeta_n)` is the smallest field extension of the rationals containing all nth roots of unity. It is the algebraic structure underlying the sacred polygon [11].

---

## 5. Cyclotomic Polynomials

The nth cyclotomic polynomial `Phi_n(x)` is the minimal polynomial of the primitive nth roots of unity over the rationals. It divides `x^n - 1` and has degree `phi(n)` (Euler's totient) [12]:

```
x^n - 1 = product of Phi_d(x) for all d dividing n

Examples:
  Phi_1(x) = x - 1
  Phi_2(x) = x + 1
  Phi_3(x) = x^2 + x + 1
  Phi_4(x) = x^2 + 1
  Phi_5(x) = x^4 + x^3 + x^2 + x + 1
  Phi_6(x) = x^2 - x + 1
  Phi_8(x) = x^4 + 1
  Phi_12(x) = x^4 - x^2 + 1
```

### Why Cyclotomic Polynomials Matter

Cyclotomic polynomials encode the algebraic complexity of each sacred polygon:

- **Phi_3:** Degree 2 -- the equilateral triangle requires only a square root extension of Q
- **Phi_5:** Degree 4 -- the pentagon requires nested square roots (involving phi)
- **Phi_7:** Degree 6 -- the heptagon is not constructible by ruler and compass (Gauss-Wantzel theorem)
- **Phi_17:** Degree 16 -- the 17-gon IS constructible (Gauss's famous 1796 discovery)

The constructibility of a regular n-gon depends entirely on the factorization structure of `Phi_n(x)` over the rationals. If all prime factors of `phi(n)` are powers of 2, the polygon is constructible [13].

---

## 6. Mobius Transformations

A Mobius transformation (linear fractional transformation) has the form [14]:

```
f(z) = (a*z + b) / (c*z + d)

where a, b, c, d are complex numbers and a*d - b*c != 0
```

### Fundamental Properties

- **Circle-preserving:** Maps every circle or straight line to a circle or straight line. Lines are "circles through infinity" on the Riemann sphere.
- **Conformal (angle-preserving):** Preserves angles at every point where the map is defined.
- **Three-point determination:** Any three distinct points `z_1, z_2, z_3` can be mapped to any other three distinct points `w_1, w_2, w_3` by a unique Mobius transformation.
- **Group structure:** Mobius transformations form a group under composition, isomorphic to `PSL(2, C)` -- the projective special linear group over the complex numbers.
- **Fixed points:** A non-identity Mobius transformation has exactly 1 or 2 fixed points. This classifies Mobius transformations into four types: elliptic (rotation), hyperbolic (dilation), parabolic (translation), and loxodromic (spiral) [15].

### Classification of Mobius Transformations

| Type | Fixed Points | Geometric Action | Trace Condition |
|---|---|---|---|
| Elliptic | 2, conjugate | Rotation about an axis | trace^2 in [0, 4) |
| Hyperbolic | 2, real | Dilation along an axis | trace^2 in (4, inf) |
| Parabolic | 1 (double) | Translation | trace^2 = 4 |
| Loxodromic | 2, general | Spiral motion | trace^2 not in [0, 4] |

### Why Mobius Transformations Are the Symmetry Group of Sacred Form

Sacred geometry is fundamentally about configurations of circles and their intersections. Since Mobius transformations preserve circles and angles, they preserve the qualitative structure of every sacred form. The Flower of Life under any Mobius transformation is still recognizably a configuration of circles intersecting at the same angles. Sacred geometry is Mobius-invariant [16].

```
MOBIUS TRANSFORMATION GALLERY
================================================================

  Elliptic (rotation):
    f(z) = e^(i*theta) * z
    Rotates the entire plane by theta about the origin

  Hyperbolic (dilation):
    f(z) = k * z, k > 0, k != 1
    Scales the plane by factor k

  Parabolic (translation):
    f(z) = z + b
    Shifts the entire plane by b

  Inversion:
    f(z) = 1/z
    Maps circles through origin to lines, and vice versa
    The inside of the unit circle maps to the outside

  General Mobius:
    f(z) = (a*z + b) / (c*z + d)
    Composition of the above four types
```

> **Related:** [Computational Expression](05-computational-expression.md) -- GLSL implementation of Mobius transformations as real-time fragment shaders (reference: ubavic/mobius-shader on GitHub)

---

## 7. Conformal Mappings and Angle Preservation

A conformal mapping is a function that preserves angles locally. In the complex plane, a holomorphic (complex-differentiable) function `f(z)` is conformal at every point where `f'(z) != 0`. This is a consequence of the Cauchy-Riemann equations, which enforce the angle-preservation condition [17].

### The Riemann Mapping Theorem

Every simply connected proper subset of the complex plane can be conformally mapped to the unit disk. This theorem (Riemann, 1851; rigorous proof by Koebe, 1912) means that the unit disk (unit circle plus its interior) is the universal template for all simply connected domains. Every such domain is "conformally equivalent" to the unit circle [18].

For sacred geometry, this has a profound implication: every bounded sacred figure, regardless of its specific shape, is conformally equivalent to the circle. The circle is not just the starting point of sacred geometry -- it is the *only* shape, from which all others are conformal images.

### Key Conformal Maps

| Map | Formula | Geometric Effect |
|---|---|---|
| Joukowski map | `w = z + 1/z` | Maps circles to airfoil shapes |
| Exponential | `w = e^z` | Maps horizontal strips to wedge sectors |
| Power map | `w = z^n` | Maps wedges to wider wedges; multiplies angles by n |
| Logarithm | `w = log(z)` | Inverse of exponential; maps circles to vertical lines |
| Schwarz-Christoffel | (integral formula) | Maps upper half-plane to arbitrary polygons |

The Schwarz-Christoffel mapping is particularly relevant: it provides an explicit conformal map from the upper half-plane (or unit disk) to any polygon. This means every sacred polygon is a conformal image of the unit circle, with an explicit transformation formula [19].

---

## 8. The Riemann Sphere and Stereographic Projection

The Riemann sphere is the extended complex plane: `C_hat = C union {infinity}`. Topologically, it is the two-sphere `S^2`. The connection between the complex plane and the sphere is stereographic projection [20].

### Stereographic Projection

Place a unit sphere on the complex plane so the south pole touches the origin. For any point P on the sphere (except the north pole N), draw a straight line from N through P. Where this line intersects the complex plane is the stereographic image of P.

```
STEREOGRAPHIC PROJECTION
================================================================

       N (north pole = infinity)
       *
      /|\
     / | \
    /  |  \
   /   |   \
  /    |    \    Sphere S^2
 /     |     \
|      |      |
 \     |     /
  \    |    /
   \   |   /
    \  P  /
     \ | /
      \|/
  ─────*────────────── Complex plane C
       S (south pole = 0)
       |
       z (stereographic image of P)

  North pole N maps to infinity
  South pole S maps to origin 0
  Equator maps to unit circle |z| = 1
```

### Properties of Stereographic Projection

- **Conformal:** Preserves angles everywhere -- the definitive property for sacred geometry preservation
- **Circle-preserving:** Maps circles on the sphere to circles or lines in the plane
- **Bijects S^2 minus N to C:** One-to-one correspondence (adding infinity completes the bijection)
- **Inverse:** Given `z = x + iy` in the plane, the sphere point is `(2x/(|z|^2+1), 2y/(|z|^2+1), (|z|^2-1)/(|z|^2+1))` [21]

### Consequence for Sacred Geometry

Mobius transformations on the complex plane correspond exactly to rotations and reflections of the Riemann sphere. This means:

1. The sphere IS the complex plane with infinity added
2. Mobius transformations are the most natural symmetries of both
3. The sacred sphere (Platonic solid circumsphere, mandala, celestial globe) is mathematically equivalent to the full complex plane extended by infinity
4. Stereographic projection is the canonical "sacred geometry projection" because it preserves both circles and angles [22]

---

## 9. Domain Coloring: Visualizing Complex Functions

Domain coloring is a visualization technique that represents a complex function `f(z)` by coloring each point z in the domain according to the value `f(z)`. The standard encoding uses [23]:

- **Hue:** Determined by `arg(f(z))` -- the argument (angle) of the output. Full color wheel maps to full circle.
- **Brightness/Saturation:** Determined by `|f(z)|` -- the modulus (magnitude) of the output. Zeros appear as dark spots; poles appear as bright spots.

```
DOMAIN COLORING SCHEME
================================================================

  For each pixel at position z = x + iy:
    1. Compute w = f(z)
    2. Extract: angle = arg(w), magnitude = |w|
    3. Map angle to hue:
         0     -> Red
         pi/3  -> Yellow
         2pi/3 -> Green
         pi    -> Cyan
         4pi/3 -> Blue
         5pi/3 -> Magenta
         2pi   -> Red (wraps)
    4. Map magnitude to brightness:
         |w| = 0 -> Black (zero)
         |w| = 1 -> Normal brightness
         |w| -> inf -> White (pole)

  Phase portraits reveal:
  - Zeros: points where all colors converge to black
  - Poles: points where all colors converge to white
  - Branch cuts: discontinuities in the color map
  - Symmetries: repeated color patterns
```

### Why Domain Coloring Matters for Sacred Geometry

Domain coloring makes the invisible structure of complex functions visible. Applied to sacred geometry:

- **Roots of unity:** `f(z) = z^n - 1` shows n zeros equally spaced on the unit circle -- the sacred polygon vertices as dark spots in a color wheel
- **Mobius transformations:** The color patterns reveal the conformal structure -- how angles are preserved while shapes distort
- **Julia and Mandelbrot sets:** Domain coloring of iterated maps reveals the fractal boundary structure in full color detail [24]

> **Related:** [Computational Expression](05-computational-expression.md) -- GLSL shader specification for domain coloring of complex functions

---

## 10. The Unit Circle as Primordial Sacred Form

The unit circle `|z| = 1` is the intersection point of all the mathematical structures discussed in this module. It is simultaneously [25]:

1. **The domain of Euler's formula:** Every point on `|z| = 1` is `e^(i*theta)` for some theta
2. **The locus of all roots of unity:** Every nth root of unity lies on `|z| = 1`
3. **The fixed set of inversion:** The unit circle is its own image under `z -> 1/z`
4. **The equator of the Riemann sphere:** Under stereographic projection, `|z| = 1` maps to the sphere's equator
5. **The boundary of the Riemann mapping target:** The Riemann mapping theorem maps every simply connected domain to the interior of the unit circle
6. **The natural domain of Fourier analysis:** The Fourier transform on the circle (Fourier series) decomposes periodic functions into harmonics at frequencies that are roots of unity

The unit circle is not one sacred form among many. It is the form from which all others derive. This is the mathematical content of the ancient intuition that the circle is sacred.

```
UNIT CIRCLE: CONVERGENCE OF ALL SACRED STRUCTURE
================================================================

  Euler's formula
       |
       v
  e^(i*theta) -----> Points on |z| = 1
       |
       v
  Roots of unity ----> Sacred polygons
       |                    |
       v                    v
  Cyclotomic fields    Flower of Life
       |                    |
       v                    v
  Galois theory        Metatron's Cube
       |                    |
       v                    v
  Constructibility     Platonic Solids
       |
       v
  Conformal maps ----> All bounded sacred forms
       |
       v
  Riemann sphere ----> Sacred sphere = C + infinity
```

---

## 11. Complex Dynamics and Fractal Generation

Complex dynamics studies the iteration of holomorphic functions on the complex plane. The simplest non-trivial case -- the quadratic family `f_c(z) = z^2 + c` -- produces the Mandelbrot and Julia sets [26].

### The Mandelbrot Set

The Mandelbrot set M is the set of all complex numbers c for which the orbit of 0 under iteration of `f_c(z) = z^2 + c` remains bounded:

```
M = { c in C : |f_c^n(0)| does not diverge as n -> infinity }
```

The boundary of M has Hausdorff dimension exactly 2 (Shishikura, 1998), meaning it is as dimensionally complex as a filled region despite being a curve. The Mandelbrot set contains infinitely many copies of itself at every scale -- self-similarity without exact repetition [27].

### Julia Sets

For a fixed parameter c, the Julia set `J_c` is the boundary between the set of points z whose orbits escape to infinity and those that remain bounded:

```
For z -> z^2 + c:
  If c is IN the Mandelbrot set: J_c is connected (one piece)
  If c is OUTSIDE the Mandelbrot set: J_c is a Cantor dust (totally disconnected)
```

This dichotomy (Fatou-Julia theorem) is one of the deepest results in complex dynamics: the Mandelbrot set catalogs exactly which parameter values produce connected Julia sets [28].

### Sacred Geometry Connection

The Mandelbrot iteration `z -> z^2 + c` is the simplest nonlinear dynamical system on the complex plane. It produces:

- **Self-similar spirals:** The spiral arms of the Mandelbrot set resemble golden spirals at many scales
- **Period-n bulbs:** The cardioid-shaped main body of M connects to bulbs labeled by rational numbers p/n, with the bulb at angle p/n containing parameters whose Julia sets have n-fold symmetry -- roots-of-unity structure in dynamical space
- **Misiurewicz points:** Parameters where the critical orbit is pre-periodic, producing Julia sets with exact self-similarity -- fractal sacred forms

The complex plane is the medium; iteration is the method; sacred form is the result. One equation, faithfully iterated, produces all the geometric complexity that civilizations across millennia have recognized as sacred [29].

---

## 12. Cross-References

> **Related:** [Geometric Foundations](01-geometric-foundations.md) -- Provides the classical sacred geometry vocabulary that this module maps to complex-plane encodings.

> **Related:** [Nature & Pattern Layer](03-nature-and-pattern.md) -- Natural occurrences of the mathematical structures encoded here: phyllotaxis spirals as golden-angle rotations, hexagonal packing as Eisenstein lattice, fractal branching as iterated function systems.

> **Related:** [Computational Expression](05-computational-expression.md) -- GLSL shader implementations of domain coloring, Mobius transformations, roots-of-unity polygons, and fractal iteration.

**Cross-project links:**

- **MPC (Math Co-Processor):** Complex arithmetic, Euler's formula verification, matrix representations of Mobius transformations
- **GRD (Grid):** Lattice theory, cyclotomic fields, algebraic number theory
- **FQC (Frequency):** Fourier analysis on the unit circle, spectral decomposition via roots of unity
- **ARC (Architecture):** Conformal mapping applications in structural analysis
- **SPA (Space):** Symmetry groups, group theory, PSL(2,C) in physics
- **PRS (Prisms):** Spectral decomposition, color theory and domain coloring
- **BHK (Black Holes):** Mobius transformations in Lorentz group, conformal structure of spacetime, Penrose diagrams

---

## 13. Sources

1. Needham, T. (1997). *Visual Complex Analysis*. Oxford University Press. Ch. 1: Complex numbers as geometric objects.
2. Needham, T. (1997). *Visual Complex Analysis*. Ch. 3: Spiral similarity and complex multiplication.
3. Nahin, P.J. (1998). *An Imaginary Tale: The Story of sqrt(-1)*. Princeton University Press.
4. Euler, L. (1748). *Introductio in analysin infinitorum*. Vol. 1, Ch. VIII.
5. Dunham, W. (1999). *Euler: The Master of Us All*. Mathematical Association of America. Ch. 3: Euler's formula derivation.
6. Stillwell, J. (2010). *Mathematics and Its History*. 3rd ed. Springer. Ch. 15: Complex numbers in geometry.
7. Wikipedia. "Euler's identity." March 2026 revision, with historical citations.
8. Wells, D. (1990). "Are these the most beautiful?" *The Mathematical Intelligencer*, 12(3), 37-41.
9. Brilliant.org. "Roots of Unity." Retrieved 2026. https://brilliant.org/wiki/roots-of-unity/
10. Houston-Edwards, K. (2021). "The Simple Math Behind the Mighty Roots of Unity." *Quanta Magazine*.
11. Ireland, K. & Rosen, M. (1990). *A Classical Introduction to Modern Number Theory*. Springer-Verlag. Ch. 12: Cyclotomic fields.
12. Lang, S. (2002). *Algebra*. 3rd ed. Springer. Ch. VI: Cyclotomic polynomials.
13. Gauss, C.F. (1801). *Disquisitiones Arithmeticae*. Section VII. Also: Wantzel, P.L. (1837). "Recherches sur les moyens de reconnaitre si un probleme de geometrie peut se resoudre avec la regle et le compas." *Journal de Mathematiques Pures et Appliquees*, 2, 366-372.
14. Wolfram MathWorld. "Mobius Transformation." Retrieved 2026. https://mathworld.wolfram.com/MoebiusTransformation.html
15. Wikipedia. "Mobius transformation." March 2026 revision, with classification theorem.
16. Needham, T. (1997). *Visual Complex Analysis*. Ch. 3: Mobius transformations as circle-preserving maps.
17. Ahlfors, L.V. (1979). *Complex Analysis*. 3rd ed. McGraw-Hill. Ch. 6: Conformal mappings.
18. Riemann, B. (1851). "Grundlagen fur eine allgemeine Theorie der Functionen einer veranderlichen complexen Grosse." Doctoral dissertation, Gottingen. Also: Koebe, P. (1912). Rigorous proof.
19. Driscoll, T.A. & Trefethen, L.N. (2002). *Schwarz-Christoffel Mapping*. Cambridge University Press.
20. Needham, T. (1997). *Visual Complex Analysis*. Ch. 6: Stereographic projection and the Riemann sphere.
21. Wikipedia. "Stereographic projection." March 2026 revision, with formulas and proofs.
22. Penrose, R. (2004). *The Road to Reality*. Jonathan Cape. Ch. 8: The Riemann sphere.
23. Wegert, E. (2012). *Visual Complex Functions: An Introduction with Phase Portraits*. Birkhauser.
24. Poelke, K. & Polthier, K. (2012). "Domain Coloring of Complex Functions: An Implementation-Oriented Introduction." *IEEE Computer Graphics and Applications*, 32(5), 90-97.
25. Derbyshire, J. (2006). *Unknown Quantity: A Real and Imaginary History of Algebra*. Joseph Henry Press (National Academies). Ch. on the unit circle.
26. Devaney, R.L. (2003). *An Introduction to Chaotic Dynamical Systems*. 2nd ed. Westview Press.
27. Shishikura, M. (1998). "The Hausdorff dimension of the boundary of the Mandelbrot set and Julia sets." *Annals of Mathematics*, 147(2), 225-267.
28. Milnor, J. (2006). *Dynamics in One Complex Variable*. 3rd ed. Princeton University Press. Annals of Mathematics Studies 160.
29. Mandelbrot, B.B. (1982). *The Fractal Geometry of Nature*. W.H. Freeman. Ch. 19: Julia sets and the Mandelbrot set.
