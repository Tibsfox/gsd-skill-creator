# Lessons — v1.49.1018

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A new substrate-axis opens by turning the gaze a different way.**
   By turning the satellite gaze back from the distant sky to our own planet, Landsat opened the earth-observation axis at obs#1 distinct from the exoplanet axis the cadence rotated away from, showing that a rotation opens a new way of seeing rather than extending an old one.
   _⚙ Status: `investigate` · lesson #11871_

2. **Recording several bands at once turns a picture into a measurement.**
   By imaging each scene in several bands of visible and infrared light, Landsat let one kind of cover be told from another by how it reflects across the spectrum, showing that the multispectral record measures what covers the land, not only depicts it.
   _⚙ Status: `investigate` · lesson #11872_

3. **A long record is what measures change.**
   By imaging the same ground again and again under comparable lighting for decades, Landsat made it possible to measure how the land changes from one year to the next, showing that a single image shows the land at a moment while a continuous record shows how it changes.
   _⚙ Status: `investigate` · lesson #11873_

4. **Comparable lighting is what makes a record consistent.**
   By flying a Sun-synchronous orbit that crosses each part of the land at about the same local solar time, Landsat kept the lighting comparable across the years, showing that a difference between two images is a difference in the land only when the conditions of measurement are held fixed.
   _⚙ Status: `investigate` · lesson #11874_

5. **Opening an archive multiplies a record's reach.**
   By making the imagery free and openly available, the USGS broadened Landsat's use across many fields and many countries, showing that a record's value grows when it is handed freely to all who would read it.
   _⚙ Status: `investigate` · lesson #11875_

6. **A record consistent across instruments needs careful calibration.**
   Because each satellite hands the record to the next, the imagery from one sensor must be made consistent with the next through radiometric calibration, showing that a continuous record across the decades rests on keeping the measurement comparable as the instruments change.
   _⚙ Status: `investigate` · lesson #11876_

7. **A reference template carries forward cleanly across an axis rotation.**
   Because Landsat reuses the canonical card structure of the v1.208 TESS template, the build preserved the structural template exactly and swapped the content to the land survey while keeping the warm palette, making the axis-opening a clean build.
   _⚙ Status: `investigate` · lesson #11877_

8. **The shader renders procedural structure rather than archived data.**
   The Landsat multispectral-land-imaging shader uses fractal noise and analytic geometry rather than loading actual Landsat scenes from the USGS archive. A future revision could load encoded Landsat scenes for a higher-fidelity rendering keyed to real land cover and real land change.
   _⚙ Status: `investigate` · lesson #11878_

9. **The satellite-and-ground-track diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the satellite, the multispectral imager, the swath, and the repeating ground track over a rotating Earth.
   _⚙ Status: `investigate` · lesson #11879_

10. **The observatory sidebar table is illustrative rather than exhaustive.**
   The sidebar lists representative axis-lineage and survey elements (Landsat, TESS, Kepler, IRAS/WISE) but does not enumerate the full Landsat satellite series or instrument set; a future revision could expand the table with per-satellite highlights.
   _⚙ Status: `investigate` · lesson #11880_

11. **The land-change measurement is described rather than computed.**
   The vegetation index and the land-change difference are described but not run against the archived imagery; a future ship could query two real Landsat scenes of the same ground from years apart and compute a vegetation-index change directly.
   _⚙ Status: `investigate` · lesson #11881_
