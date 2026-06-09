# Lessons — v1.49.1022

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **An axis sustains when a second subject keeps the way of seeing fresh.**
   By carrying the orbital exploration of a planet inward from Venus to Mercury, MESSENGER sustained the planetary axis at obs#2 rather than letting it cap after a single entry, showing that a way of seeing earns a second observation when the next subject is substrate-form-distinct — a different world, read by a different suite of instruments.
   _⚙ Status: `investigate` · lesson #11915_

2. **An orbiter turns a half-glimpsed disc into a complete world.**
   By orbiting Mercury where the only prior visitor had imaged less than half of it from passing trajectories, MESSENGER produced the first complete global map of the innermost planet, showing that staying in orbit is what makes a world a charted place rather than a glimpse.
   _⚙ Status: `investigate` · lesson #11916_

3. **Many instruments at once read a planet more fully than one.**
   By carrying a camera system, three spectrometers, a laser altimeter, and a magnetometer, MESSENGER imaged the surface, ranged its height, read its composition, and mapped its magnetic field together, showing that a multi-instrument orbiter reads a world along several axes at once where a single instrument reads one.
   _⚙ Status: `investigate` · lesson #11917_

4. **Composition from orbit reads what a planet is made of.**
   By measuring the elemental composition of the surface with X-ray, gamma-ray, and neutron spectroscopy, MESSENGER found Mercury surprisingly rich in volatile elements such as sulfur and potassium, showing that orbital geochemistry can overturn formation models built only on a planet's appearance.
   _⚙ Status: `investigate` · lesson #11918_

5. **Cold can survive beside extreme heat where the sunlight never reaches.**
   By confirming water ice in the floors of polar craters that never see the Sun, MESSENGER showed that the planet closest to the Sun holds ice in its permanently shadowed places, where the choice of vantage — looking into the shadow — reveals what no surface temperature would predict.
   _⚙ Status: `investigate` · lesson #11919_

6. **A field's shape tells of the interior that makes it.**
   By mapping Mercury's global magnetic field and finding it offset well to the north of the planet's center, MESSENGER constrained how the field is generated in the large iron core, showing that the shape of a field read from orbit is a window onto a planet's deep interior.
   _⚙ Status: `investigate` · lesson #11920_

7. **A reference template carries forward cleanly across an intra-axis continuation.**
   Because MESSENGER reuses the canonical card structure of the v1.212 Magellan template, the build preserved the structural template exactly and swapped the content from the Venus radar mapper to the Mercury orbiter while keeping the warm palette, making the intra-axis obs#2 build a clean intra-template rewrite.
   _⚙ Status: `investigate` · lesson #11921_

8. **The shader renders procedural structure rather than archived data.**
   The MESSENGER mercury-orbital-mapping shader uses fractal noise and analytic geometry rather than loading actual MDIS global mosaics, MLA topographic products, or GRNS/XRS composition maps from NASA's Planetary Data System. A future revision could load encoded MESSENGER imagery and topographic products for a higher-fidelity rendering keyed to real terrain, hollows, and polar deposits.
   _⚙ Status: `investigate` · lesson #11922_

9. **The orbiter-and-Sun-shade diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the spacecraft, the Sun shade, the eccentric near-polar orbit, and the instrument deck.
   _⚙ Status: `investigate` · lesson #11923_

10. **The Mercury-mission lineage sidebar table is illustrative rather than exhaustive.**
   The sidebar lists the planetary-axis and Mercury-mission elements (MESSENGER, the 1974–75 flybys) but does not enumerate the full history of Mercury exploration or the per-instrument coverage; a future revision could expand the table with the complete mission roster and the per-instrument data products.
   _⚙ Status: `investigate` · lesson #11924_

11. **The trajectory and field models are described rather than computed.**
   The six-flyby gravity-assist trajectory and the magnetic-field multipole fit are described but not run against the archived data; a future ship could process real MESSENGER tracking or magnetometer data to demonstrate the cruise design and the field offset directly.
   _⚙ Status: `investigate` · lesson #11925_
