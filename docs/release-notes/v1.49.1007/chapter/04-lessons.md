# Lessons — v1.49.1007

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Imaging where energy is released reveals what a flux measurement averages over.**
   Rather than measuring the total flux of a flare, RHESSI imaged where on the Sun the high-energy emission came from, showing that resolving a source into its sites reveals the footpoints and coronal sources a single total only sums.
   _⚙ Status: `investigate` · lesson #11750_

2. **An indirect method can image where focusing optics do not work.**
   By using rotating modulation collimators and the spin to modulate the flux, RHESSI reconstructed images at energies that cannot be focused by mirrors, showing that an indirect Fourier method opens imaging where direct optics fail.
   _⚙ Status: `investigate` · lesson #11751_

3. **Imaging and spectroscopy together tie energy to location.**
   By measuring the spectrum at every imaged location, RHESSI read both where the flare released its energy and what kind of emission it was, showing that imaging spectroscopy carries more than either imaging or spectroscopy alone.
   _⚙ Status: `investigate` · lesson #11752_

4. **Imaging the gamma-ray lines separates ion from electron acceleration.**
   By imaging the gamma-ray lines of ion acceleration and the hard-X-ray footpoints of electron acceleration, RHESSI showed that ions and electrons can reach distinct parts of a flare, separating two acceleration sites for the first time.
   _⚙ Status: `investigate` · lesson #11753_

5. **A continuation can deepen an axis across the spectrum.**
   By extending the EUV imaging of the corona into the high-energy imaging of the flare, RHESSI sustained the solar-observatory axis at obs#3 on the same target, showing that an axis can deepen across the spectrum without rotating away.
   _⚙ Status: `investigate` · lesson #11754_

6. **The spin can be the imaging instrument, not just the stabilizer.**
   By making the spin carry the collimator grids across the incoming flux, RHESSI turned the rotation that stabilized the spacecraft into the mechanism that modulated the signal, showing that a design choice can serve two ends at once.
   _⚙ Status: `investigate` · lesson #11755_

7. **A reference template carries forward cleanly across a distinct-palette mission.**
   Because RHESSI reuses the canonical card structure of the v1.197 template, the build preserved the structural template exactly and swapped the content to the high-energy flare imaging with a distinct flare-amber / footpoint-gold / gamma-bright palette, making the distinct-palette mission a clean build.
   _⚙ Status: `investigate` · lesson #11756_

8. **The shader renders procedural structure rather than archived data.**
   The RHESSI flare-hard-X-ray-imaging shader uses analytic geometry and procedural noise rather than loading actual RHESSI flare images from the UC Berkeley and NASA archives. A future revision could load encoded RHESSI flare data for a higher-fidelity rendering keyed to real images.
   _⚙ Status: `investigate` · lesson #11757_

9. **The spacecraft diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the spin-stabilized spacecraft, its rotating modulation collimators, and the model Sun with its flare.
   _⚙ Status: `investigate` · lesson #11758_

10. **The solar sidebar table is illustrative rather than exhaustive.**
   The sidebar lists representative lineage elements (RHESSI, TRACE, OSO, SDO, AMPTE) but does not enumerate the full RHESSI collimator and detector roster with each pitch and energy range; a future revision could expand the table with per-collimator resolutions and per-detector energy bands.
   _⚙ Status: `investigate` · lesson #11759_

11. **The image reconstruction is described rather than computed.**
   The Fourier image reconstruction that recovers the flare image from the modulated signal is described but not run against archived data; a future ship could reconstruct an image from a real RHESSI flare observation.
   _⚙ Status: `investigate` · lesson #11760_
