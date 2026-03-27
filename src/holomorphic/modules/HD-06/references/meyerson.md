# Meyerson Table Theorem (Inscribed Rectangle Problem)

## Statement

**Theorem (Meyerson, conjectured 1981; Greene-Lobb, proved 2020):**
Every Jordan curve in the plane R^2 inscribes a rectangle. That is,
for any continuous non-self-intersecting closed curve, there exist four
points on the curve that form the vertices of a rectangle.

## Historical Timeline

- **1911**: Toeplitz poses the inscribed square problem (still open for
  continuous curves).
- **1981**: Meyerson conjectures that every Jordan curve inscribes a
  rectangle (weaker than a square but still highly non-trivial).
- **2020**: Joshua Greene and Andrew Lobb prove the full Meyerson conjecture.

## Key Insight: Mobius Strips and Intersection Theory

The proof is a masterpiece of algebraic topology. The idea:

1. **Configuration space construction**: Consider pairs of points on the
   Jordan curve. The set of unordered pairs {p, q} with a specific
   geometric relationship forms a Mobius strip in a higher-dimensional
   configuration space.

2. **Intersection argument**: Two such Mobius strips — one for each pair
   of opposite sides of a potential rectangle — must intersect by a
   topological intersection number argument. A point of intersection
   corresponds to an inscribed rectangle.

3. **Why Mobius?** The one-sided nature of the Mobius strip forces the
   intersection. A cylinder (two-sided) could potentially be deformed
   away, but the Mobius strip's non-orientability makes avoidance
   impossible.

## Significance

This result connects three areas of mathematics:
- **Point-set topology**: Jordan curves and their properties
- **Algebraic topology**: intersection theory and characteristic classes
- **Symplectic geometry**: the techniques that Greene and Lobb developed
  here extend to the rectangular peg theorem (see greene-lobb.md)

## Reference

Greene, J. & Lobb, A. (2021). "The rectangular peg problem."
*Annals of Mathematics*, 194(2), 509-517.
