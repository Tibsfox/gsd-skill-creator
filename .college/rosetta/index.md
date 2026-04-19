# `.college/rosetta/` — Index

Rosetta Stone cross-reference documents for the gsd-skill-creator College knowledge structure.

## Files

| File | Contents | Status |
|------|----------|--------|
| [README.md](README.md) | Directory purpose, file-format convention, adding new cross-references | active |
| [clusters.md](clusters.md) | Canonical 13-cluster table (reproduced from STATE.md); proposed translation axes | active |
| [translations.md](translations.md) | 6-concept × 13-cluster cross-domain translation table (Living Sensoria v1.49.561) | proposed |
| [concepts.md](concepts.md) | Canonical one-paragraph definitions for the 6 central concepts; primary-source citations | proposed |

## Translation Axes Covered in `translations.md`

| Axis | Primary Cluster | Concept ID |
|------|----------------|------------|
| Gradient descent | AI / SST (12) | `gradient_descent` |
| Equilibrium / homeostasis | Science / BHK (9) | `equilibrium_homeostasis` |
| Noise as exploration | Energy / THE (4) | `noise_as_exploration` |
| Feedback loop | Music / WAL (10) | `feedback_loop` |
| Specialised composition | AI / SST (12) | `specialised_composition` |
| Boundary condition | Science / BHK (9) | `boundary_condition` |

## Cluster Coverage Summary

| Cluster | Hub | Coverage |
|---------|-----|----------|
| 1 Ecology | ECO | Substantive |
| 2 Electronics | LED | Substantive |
| 3 Infrastructure | SYS | Substantive |
| 4 Energy | THE | Substantive |
| 5 Creative | FFA | Light touch |
| 6 Business | BCM | Light touch |
| 7 Vision | ROF | Moderate |
| 8 Broadcasting | RBH | Moderate |
| 9 Science | BHK | Substantive |
| 10 Music | WAL | Substantive |
| 11 Space | CYG | Substantive |
| 12 AI | SST | Substantive |
| 13 Graphics | NEH | Substantive |

## Dependency Chain

`TC-college-bootstrap` (phase 672) created this directory and `README.md` + `clusters.md`.  
`TC-rosetta-translations` (phase 673) added `translations.md`, `concepts.md`, and this `index.md`.  
Gate LS-43 is satisfied by `translations.md` (6 concepts × 13 clusters, all cells present).
