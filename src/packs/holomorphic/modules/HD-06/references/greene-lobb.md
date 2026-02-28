# Greene-Lobb Rectangular Peg Theorem

## Statement

**Theorem (Greene & Lobb, 2021):** Every smooth Jordan curve in the plane
inscribes rectangles of **every aspect ratio**. That is, for any smooth
non-self-intersecting closed curve and any positive real number r, there
exist four points on the curve forming the vertices of a rectangle whose
side lengths have ratio r.

## Method: Symplectic Geometry and Lagrangian Floer Homology

The proof uses deep machinery from symplectic topology:

1. **Symplectic reformulation**: The problem is translated into a question
   about the intersection of Lagrangian submanifolds in a symplectic
   4-manifold. Each aspect ratio r defines a pair of Lagrangian tori.

2. **Lagrangian Floer homology**: The non-vanishing of a Floer homology
   group forces the Lagrangian submanifolds to intersect. This is a
   homological version of the intersection argument — more powerful
   than the topological one used for the Meyerson conjecture.

3. **Continuous family**: Because the Floer-theoretic obstruction persists
   as the aspect ratio varies continuously, the theorem gives inscribed
   rectangles for ALL aspect ratios, not just a specific one.

## Why This Matters

- **Strongest known result**: This goes far beyond the Meyerson conjecture.
  It produces a 1-parameter family of inscribed rectangles.
- **Methods are new**: The application of symplectic geometry to inscribed
  figure problems opened an entirely new research direction.
- **Open problems remain**: The inscribed square problem for continuous
  (non-smooth) curves remains open. Smoothness is essential for the
  symplectic techniques to apply.

## Connection to Dynamics

In holomorphic dynamics, smooth Jordan curves arise naturally:
- Boundaries of Siegel disks (when they are smooth)
- Level curves of Green's function for polynomial Julia sets
- Equipotential curves in the complement of the Mandelbrot set

The Greene-Lobb theorem applies to all of these, giving geometric
constraints on the shapes that dynamical boundaries can take.

## Publication

Greene, J. & Lobb, A. (2021). "The rectangular peg problem."
*Annals of Mathematics*, 194(2), 509-517.
doi:10.4007/annals.2021.194.2.4
