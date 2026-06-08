# Lessons — v1.49.1014

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A precise position turns a flash into a source that can be studied.**
   By fixing each burst to a few arcseconds within minutes, Swift turned the bursts from points on a coarse map into sources that could be followed up across the spectrum, showing that precise localization is what unlocks detailed study of a transient.
   _⚙ Status: `investigate` · lesson #11827_

2. **A rapid response catches what a slow one would miss.**
   By slewing onto each burst within about a minute, Swift reached the early afterglow, the part that fades the fastest and carries the most information, showing that response time is set against the steep early decay of the target it is chasing.
   _⚙ Status: `investigate` · lesson #11828_

3. **Several bands together connect a flash to its afterglow.**
   By following each burst across hard X-rays, soft X-rays, and ultraviolet-to-optical light, Swift connected the high-energy flash to its longer-wavelength afterglow, showing that a multiwavelength view traces the physics of an event one band alone cannot.
   _⚙ Status: `investigate` · lesson #11829_

4. **Locating an event in its host reveals its origin.**
   By locating the short bursts in their host galaxies, Swift tied them to the merging of compact stellar remnants, showing that the setting of an event distinguishes its origin from a similar-looking one.
   _⚙ Status: `investigate` · lesson #11830_

5. **An axis sustains at a substrate-form-distinct second observation.**
   By localizing and following up each burst rather than only catching it, Swift sustained the gamma-ray-astronomy axis at obs#2, showing that an INTRA-AXIS continuation extends a domain with a distinct form rather than repeating the first.
   _⚙ Status: `investigate` · lesson #11831_

6. **A brief, bright transient can be a beacon for the distant universe.**
   By locating the most distant bursts, Swift used events that briefly outshine their host galaxies to probe the early universe, showing that a bright transient can light up what is too faint to see directly.
   _⚙ Status: `investigate` · lesson #11832_

7. **A reference template carries forward cleanly across an INTRA-AXIS continuation.**
   Because Swift reuses the canonical card structure of the v1.204 Compton template, the build preserved the structural template exactly and swapped the content to the burst follow-up while keeping the warm palette, making the axis-sustaining continuation a clean build.
   _⚙ Status: `investigate` · lesson #11833_

8. **The shader renders procedural structure rather than archived data.**
   The Swift gamma-ray-burst-follow-up shader uses analytic geometry and procedural noise rather than loading actual Swift afterglow light curves from the UK Swift Science Data Centre. A future revision could load encoded Swift data for a higher-fidelity rendering keyed to real afterglows.
   _⚙ Status: `investigate` · lesson #11834_

9. **The three-telescope diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the observatory, its three telescopes, and the low Earth orbit.
   _⚙ Status: `investigate` · lesson #11835_

10. **The gamma-ray-burst-observatory sidebar table is illustrative rather than exhaustive.**
   The sidebar lists representative lineage and observatory elements (Swift, Compton, Chandra, Hubble) but does not enumerate the full set of Swift results per instrument; a future revision could expand the table with per-telescope band coverage.
   _⚙ Status: `investigate` · lesson #11836_

11. **The afterglow statistics are described rather than computed.**
   The power-law decay and the redshift dropout are described but not run against the archived light curves; a future ship could query a real Swift afterglow light curve and fit the decay index directly.
   _⚙ Status: `investigate` · lesson #11837_
