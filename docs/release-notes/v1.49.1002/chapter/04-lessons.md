# Lessons — v1.49.1002

11 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Two viewpoints recover the depth a single image flattens.**
   A single neutral-atom imager records the ring current as a flat projection, the emission summed along each line of sight; two imagers a wide distance apart resolve the depth through the parallax between their views, showing that a second vantage turns a projection into a reconstruction.
   _⚙ Status: `investigate` · lesson #11695_

2. **A wide separation baseline sets the depth resolution.**
   By placing its two imagers in two widely separated Molniya orbits, TWINS gave the stereo reconstruction the large baseline it needs, showing that the separation between two viewpoints sets the precision with which depth can be recovered.
   _⚙ Status: `investigate` · lesson #11696_

3. **A hosted-instrument Mission of Opportunity can deliver a two-vantage geometry at modest cost.**
   TWINS flew its two imagers as hosted payloads on two separate spacecraft rather than as a dedicated pair of free-flyers, showing that the shared-ride architecture can place identical instruments far enough apart to image a source from two directions affordably.
   _⚙ Status: `investigate` · lesson #11697_

4. **A stereo measurement extends a single-vantage heritage.**
   TWINS built on the single-vantage neutral-atom imaging that IMAGE pioneered, adding a second vantage to recover the depth, showing that a stereo technique can extend an established single-vantage method to a new dimension.
   _⚙ Status: `investigate` · lesson #11698_

5. **The imaging counterpart of binocular depth perception applies to a planetary magnetosphere.**
   TWINS imaged the ring current the way two eyes view a scene, combining two slightly different views into a single sense of depth, showing that the geometry of stereo vision scales from the spacing between two eyes to the spacing between two orbits.
   _⚙ Status: `investigate` · lesson #11699_

6. **A background medium must be measured to make a remote image quantitative.**
   The Lyman-alpha detectors measured the geocorona through which the neutral atoms travel, showing that imaging a source through a medium requires measuring that medium to interpret the image, the geocorona density grounding the ring-current reconstruction.
   _⚙ Status: `investigate` · lesson #11700_

7. **A reference template carries forward cleanly across a distinct-palette mission.**
   Because TWINS reuses the canonical card structure of the v1.192 template, the build preserved the structural template exactly and swapped the content to the stereoscopic ring-current imaging with a distinct ENA-amber / stereo-left-blue / stereo-right-violet / depth-violet palette, making the distinct-palette mission a clean build.
   _⚙ Status: `investigate` · lesson #11701_

8. **The shader renders procedural structure rather than archived data.**
   The TWINS stereoscopic ENA imaging shader uses analytic geometry and procedural noise rather than loading actual TWINS neutral-atom image pairs from the NASA Space Physics Data Facility. A future revision could load encoded TWINS image data for a higher-fidelity rendering keyed to the real data.
   _⚙ Status: `investigate` · lesson #11702_

9. **The two-imager diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the two imagers, the ring-current torus, and the two widely separated orbits.
   _⚙ Status: `investigate` · lesson #11703_

10. **The neutral-atom / stereo imaging sidebar table is illustrative rather than exhaustive.**
   The sidebar lists representative program elements (TWINS, IMAGE, DE-1, Polar, AMPTE, ISEE-1/2) but does not enumerate the full neutral-atom imaging fleet; a future revision could expand the table with mission dates and imaging modes.
   _⚙ Status: `investigate` · lesson #11704_

11. **The stereo reconstruction is described rather than computed.**
   The stereo parallax and the tomographic reconstruction that recover the three-dimensional ring current are described but not run against archived data; a future ship could compute the reconstruction from real TWINS image pairs.
   _⚙ Status: `investigate` · lesson #11705_
