# Rosetta Stone — Engineering & Scientific Reference Tables

The front matter of the knowledge base. Every engineering handbook starts here.

## Tables (JSON format — machine-readable, renderable to HTML/LaTeX/PDF)

### Complete
- **greek-alphabet.json** — 24 letters with physics/engineering usage
- **physical-constants.json** — 28 fundamental constants (NIST CODATA 2018) + astronomical constants
- **elements.json** — Periodic table: atomic weights, density, melting/boiling points, space applications
- **engineering-tables.json** — Multi-table reference:
  - Physical properties of fresh water (0-100°C)
  - Strength of engineering materials (16 alloys + composites)
  - Strength of wood species (16 species, PNW flagged)
  - Coefficients of friction (15 surface pairs)
  - Factors of safety (18 application categories)
  - Properties of plane areas (7 shapes with formulas)

### Planned (to be built during subsequent missions)
- **homogeneous-bodies.json** — Mass properties of 3D solids (sphere, cylinder, cone, etc.): volume, surface area, centroid, moments of inertia
- **structural-steel.json** — Rolled steel shapes: W-beams, S-beams, channels, angles, tees, pipes. AISC dimensions and properties
- **angle-sections.json** — Equal-leg and unequal-leg angle properties for structural design
- **beam-formulas.json** — Standard beam loading cases: simply supported, cantilever, fixed-fixed, with shear/moment/deflection formulas
- **pipe-data.json** — Standard pipe sizes, schedules, wall thicknesses, flow areas
- **bolt-data.json** — Standard bolt sizes, thread pitches, proof loads, torque specs
- **electrical-tables.json** — Wire gauge (AWG), resistivity, standard voltages, connector types
- **semiconductor-data.json** — Common IC packages, pinouts, basic transistor parameters
- **unit-conversions.json** — Imperial ↔ metric for all common engineering units
- **trigonometric-identities.json** — Complete trig identity reference
- **calculus-formulas.json** — Common derivatives, integrals, series expansions
- **signal-processing.json** — Fourier transform pairs, window functions, filter types

## Format

All tables are JSON for programmatic access. Each will also be rendered as:
- **HTML** — styled reference page (browsable at tibsfox.com)
- **LaTeX** — professional typeset tables for print
- **PDF** — compiled from LaTeX

The tables are the shared vocabulary of the Rosetta Stone translation engine. A student in any College of Knowledge department can look up the fundamental data they need without leaving the knowledge base.

## Source Attribution

Values are from authoritative sources: NIST, IUPAC, AISC, ASME, CRC Handbook, NASA-STD-5001B, USDA Forest Products Laboratory. Each table cites its source. We do not invent data — we organize and annotate it for our context.
