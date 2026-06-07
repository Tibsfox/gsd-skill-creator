# Lessons — v1.49.1006

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A resolved image reveals structure that aggregate monitoring cannot.**
   Rather than measuring the Sun's emission in aggregate, TRACE imaged the corona at about one arcsecond, showing that resolving a source into its fine structure reveals the loops and threads that aggregate measurement only averages over.
   _⚙ Status: `investigate` · lesson #11739_

2. **A single high-resolution telescope can image across the layers of the solar atmosphere.**
   By using quadrant coatings to select several EUV and UV passbands, one telescope imaged the chromosphere, the transition region, and the corona at several temperatures, showing that a single instrument can read a source across its layers.
   _⚙ Status: `investigate` · lesson #11740_

3. **High cadence turns high-resolution images into movies.**
   By taking rapid repeated images, TRACE assembled high-cadence sequences that became the first detailed movies of the corona, showing that cadence matters as much as resolution for capturing the dynamics a high-resolution image reveals.
   _⚙ Status: `investigate` · lesson #11741_

4. **Resolving the loops opens coronal seismology.**
   By imaging coronal loops oscillating after flares, TRACE let the period and length of a loop be measured and the coronal magnetic field inferred, showing that resolving a structure into its parts opens new ways to measure it.
   _⚙ Status: `investigate` · lesson #11742_

5. **A continuation can deepen an axis without leaving it.**
   By extending the continuous solar monitoring OSO opened into resolved imaging, TRACE sustained the solar-observatory axis at obs#2 on the same target, showing that an axis can deepen from monitoring into imaging without rotating away.
   _⚙ Status: `investigate` · lesson #11743_

6. **A Sun-synchronous orbit gives the long viewing windows imaging sequences need.**
   By flying a Sun-synchronous polar orbit, TRACE kept the Sun in view for long unbroken intervals, showing that the orbit choice is the foundation for the sustained high-cadence imaging the science required.
   _⚙ Status: `investigate` · lesson #11744_

7. **A reference template carries forward cleanly across a distinct-palette mission.**
   Because TRACE reuses the canonical card structure of the v1.196 template, the build preserved the structural template exactly and swapped the content to the high-resolution coronal imaging with a distinct coronal-blue / loop-teal / EUV-bright palette, making the distinct-palette mission a clean build.
   _⚙ Status: `investigate` · lesson #11745_

8. **The shader renders procedural structure rather than archived data.**
   The TRACE coronal-EUV-imaging shader uses analytic geometry and procedural noise rather than loading actual TRACE EUV images from the LMSAL and NASA archives. A future revision could load encoded TRACE coronal data for a higher-fidelity rendering keyed to the real images.
   _⚙ Status: `investigate` · lesson #11746_

9. **The telescope diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the spacecraft, its 30-centimeter Cassegrain telescope, and the model Sun with its resolved corona.
   _⚙ Status: `investigate` · lesson #11747_

10. **The solar sidebar table is illustrative rather than exhaustive.**
   The sidebar lists representative lineage elements (TRACE, OSO, SDO, OGO, AMPTE) but does not enumerate the full TRACE passband roster with each temperature response; a future revision could expand the table with per-passband wavelengths and temperatures.
   _⚙ Status: `investigate` · lesson #11748_

11. **The coronal-loop oscillation fit is described rather than computed.**
   The oscillation period that opens coronal seismology is described but not run against archived data; a future ship could fit the period and length from a real TRACE high-cadence sequence.
   _⚙ Status: `investigate` · lesson #11749_
