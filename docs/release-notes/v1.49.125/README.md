# v1.49.125 "Black Hole Catalog & Mapping"

**Released:** 2026-03-28
**Code:** BHC
**Series:** PNW Research Series (#125 of 167)

## Summary

A comprehensive catalog and mapping project covering all known and strongly candidate black holes across the observable universe, organized by three mass classes: stellar-mass (3-100 solar masses, ~50 confirmed X-ray binaries plus 90+ gravitational wave events), intermediate-mass (100-100,000 solar masses, fewer than 20 credible candidates), and supermassive (millions to billions of solar masses, including the two directly imaged by EHT). Built from 26 years of Chandra X-ray Observatory press archive data, three LIGO observing runs, and the emerging Gaia astrometric series. Where BHK maps the theoretical spacetime, BHC maps the observed population -- the territory, not the map.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 5 |
| Total Lines | ~3,125 |
| Safety-Critical Tests | 5 |
| Parallel Tracks | 2 |
| Est. Tokens | ~180K |
| Color Theme | Singularity dark / accretion gold / nebula blue on near-black gradient |

### Research Modules

1. **M1: Stellar-Mass Black Holes** — X-ray binary catalog (Cygnus X-1, V404 Cygni, GRS 1915+105), LIGO-Virgo-KAGRA gravitational wave detections (90+ events), Gaia astrometric BH series (BH1, BH3), estimated 100 million in the Milky Way
2. **M2: Intermediate-Mass Black Holes** — GW190521 remnant (142 solar masses), Omega Centauri IMBH (8,200+ solar masses), GCIRS 13E candidate, the mass gap between stellar and supermassive, DESI early data
3. **M3: Supermassive Black Holes** — The two imaged black holes (Sgr A* and M87*), TON 618 (66 billion solar masses), NGC 1277, J0529-4351, Chandra Deep Field South (5,000 AGN in deepest X-ray image)
4. **M4: Detection Methods** — Eight independent methods: X-ray binary dynamics, gravitational waves, stellar orbital mechanics, direct EHT imaging, reverberation mapping, megamaser disks, astrometric displacement, tidal disruption events
5. **M5: Dynamics & Phenomena** — Tidal disruption events, relativistic jets, growth regulation and feedback, black hole mergers and pairs, accretion modes from quiescent to super-Eddington, Chandra archive cross-reference

### Cross-References

- **BHK** (Black Hole Kerr) — theoretical spacetime geometry, Kerr metric, Penrose diagrams
- **GRB** (GRB 230906A) — neutron star mergers, gravitational wave detections, Chandra X-ray localization
- **CYG** (Cygnus X-3) — X-ray binary population, stellar-mass compact objects, relativistic jets
- **SMB** (SMBH Growth) — supermassive black hole accretion and co-evolution with host galaxies
- **LTS** (LIGO/Gravitational Waves) — multi-messenger detection instrumentation and catalog reconciliation

## Retrospective

### What Worked
- The three-tier mass taxonomy (stellar / intermediate / supermassive) with a five-axis detection schema provides a clean organizational framework that supports both human navigation and machine-readable export
- Systematically indexing the 26-year Chandra press archive (100+ releases) gives the catalog a unique temporal depth that no other single-source reference provides
- The confidence rating system (confirmed, strong candidate, candidate, speculative) honestly represents the enormous variation in observational certainty across catalog entries

### What Could Be Better
- The intermediate-mass gap remains the weakest section by necessity -- fewer than 20 credible IMBH candidates exist worldwide, and DESI early data needs continuous tracking as results are published
- Multi-messenger reconciliation (same black hole appearing under different designations in X-ray, GW, radio, optical datasets) is flagged but not fully automated -- a future JSON/CSV schema export would enable downstream matching

## Lessons Learned

- Black holes are the universe's most extreme objects yet also among its most common: the Milky Way alone may host 100 million stellar-mass black holes, of which only ~50 are confirmed via X-ray binaries -- the observational iceberg ratio is staggering
- The intermediate-mass gap is not empty, it is the least-understood regime -- and likely holds the seeds from which every supermassive black hole in the universe grew, making it the single most important open question in black hole demographics
- Eight independent detection methods now exist for finding black holes, each with fundamentally different selection biases -- no single method sees the full population, and no unified cross-classified catalog existed before this project

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
