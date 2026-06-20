# Lessons — v1.49.1067

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A rotation removes the predecessor's domain vocabulary entirely — it does not share it.**
   Unlike a sustain, this is a ROTATION (mode=rotation): Pioneer 10 and the Mars Reconnaissance Orbiter clone source share almost no subject vocabulary, so the rewrite removed ALL Mars/MRO content (Mars, the red planet, the Martian surface/subsurface, HiRISE/CTX/MARCI/CRISM/SHARAD/MCS/Electra, recurring slope lineae, the highest-resolution-imaging framing, aerobraking-at-Mars, the Sun-synchronous Mars orbit, JPL-as-manager, the 2005/2006 dates, the Mars-exploration axis siblings, and the Johnson's Jumping Spider + Fringecup pairing) and replaced it with Pioneer 10 and the outer-planets domain (NASA Ames / TRW; the Atlas-Centaur launch; the SNAP-19 RTGs; the first traverse of the asteroid belt; the first flyby of Jupiter and Jupiter's atmosphere, moons, radiation belts, and magnetosphere; the…
   _⚙ Status: `investigate` · lesson #12400_

2. **A rotation OPENS a fresh axis — the rotation framing is present and load-bearing, and there is no prior sibling on the new axis.**
   Pioneer 10 opens the OUTER-PLANETS-EXPLORATION axis at obs#1 via substrate-axis rotation #37, so the substrate-axis-rotation discipline advances from obs#100 to obs#101 (a NEW rotation observed). There is no prior outer-planets member to reference as a sibling; the only backward reference is the single deliberate nav-prev to the 1.249 degree predecessor marking the rotation from the now-complete Mars axis.
   _⚙ Status: `investigate` · lesson #12401_

3. **The Jupiter result is the first FLYBY of Jupiter — first to reach Jupiter, not orbit it.**
   Pioneer 10 made the first flyby of Jupiter (4 December 1973 UT); the catalog scopes this as the first to fly by / reach Jupiter and notes that Pioneer 11 (1974) and Voyager 1 & 2 (1979) came later, and that the later orbiters (Galileo, Juno) belong to forward members of the axis.
   _⚙ Status: `investigate` · lesson #12402_

4. **The escape-trajectory claim is the load-bearing guard — "first placed on an escape trajectory," never "most distant.**
   Pioneer 10 was the first spacecraft set on a path to leave the solar system; the catalog scopes this strictly as the first placed on a solar-system escape trajectory / first to reach solar escape velocity. It does NOT say "most distant" (Voyager 1 overtook Pioneer 10 on 17 February 1998) and does NOT say "first to leave the solar system / cross the heliopause" (Voyager 1, 2012).
   _⚙ Status: `investigate` · lesson #12403_

5. **The asteroid-belt result is the first TRAVERSE of the belt.**
   Pioneer 10 was the first spacecraft to cross the main asteroid belt (1972–73), encountering far fewer impacts than feared; the catalog scopes this as the first to traverse / cross the asteroid belt.
   _⚙ Status: `investigate` · lesson #12404_

6. **RTG power is engineering identity, NOT an anchor.**
   Pioneer 10 relied on four SNAP-19 RTGs because sunlight is too weak in the outer solar system; the catalog scopes the distinction at most to "the first to rely on RTG power in the outer solar system" and does NOT stamp an RTG "first" anchor, because earlier near-Earth/lunar missions (Transit 4A 1961, Apollo ALSEP) carried RTGs.
   _⚙ Status: `investigate` · lesson #12405_

7. **The mission is framed positively, in the past tense — Pioneer 10 is now inert.**
   Routine contact ended in 1997 and the last faint signal came home on 23 January 2003; the catalog frames the mission positively in the past tense as the pathfinder that opened the road to the outer planets.
   _⚙ Status: `investigate` · lesson #12406_

8. **A rotation references its degree predecessor exactly once, deliberately.**
   The only correct backward reference is a single nav-prev lineage note to v1.249 the Mars Reconnaissance Orbiter — the last member of the now-complete Mars-exploration axis (obs#1–12) — marking the rotation from that capped axis to the new outer-planets axis. No Mars missions are listed as outer-planets siblings, and none of the twelve Mars anchors are carried over (0 re-stamps).
   _⚙ Status: `investigate` · lesson #12407_

9. **Clone source is the Mars Reconnaissance Orbiter (a NASA Mars orbiter, JPL / Lockheed Martin, 2005–present); Pioneer 10 is a NASA deep-space flyby probe (Ames / TRW, 1972–2003).**
   The most structural replacement in the rewrite is removing ALL Mars/MRO content and replacing it with Pioneer 10, the Atlas-Centaur launch from Cape Canaveral LC-36A (2 March 1972), the four SNAP-19 RTGs, the first traverse of the asteroid belt, the first flyby of Jupiter (4 December 1973 UT) and Jupiter's atmosphere/moons/radiation belts/magnetosphere, the gravity-assist onto the solar-system escape trajectory, the Pioneer plaque, the long outbound voyage (last signal 23 January 2003), NSSDCA/COSPAR 1972-012A, and the Marbled Godwit + American Dunegrass pairing.
   _⚙ Status: `investigate` · lesson #12408_

10. **The escape-trajectory and Jupiter-flyby scopes, the Ames-not-JPL fact, and the non-RTG-anchor are the load-bearing guards of this rotation.**
   Because Voyager 1 later became the most distant human-made object and the first to cross the heliopause, the escape claim must stay scoped to "first placed on an escape trajectory"; because Pioneer 11 and Voyager came later, the Jupiter claim must stay scoped to "first flyby"; the management is Ames (not JPL) and the builder is TRW; and the RTG is engineering identity, not a "first" anchor. All scopes were held throughout, yielding 0 predecessor re-stamps.
   _⚙ Status: `investigate` · lesson #12409_

11. **The shader renders procedural geometry rather than archived mission imagery.**
   The Pioneer 10 shader uses analytic curves and procedural noise rather than loading actual mission data or Imaging Photopolarimeter imagery. A future revision could render a real Pioneer 10 spin-scan view of Jupiter — the banded atmosphere and the Great Red Spot (publicly available from the National Space Science Data Center) — for a higher-fidelity view.
   _⚙ Status: `investigate` · lesson #12410_

12. **The Pioneer 10 diorama is a forthcoming artifact.**
   The 3D-printable diorama STL files are referenced as forthcoming rather than provided; a future ship could include the actual STL geometry of the probe with its large dish high-gain antenna, its RTG booms, and the Pioneer plaque on its struts.
   _⚙ Status: `investigate` · lesson #12411_

13. **The Jupiter-flyby mode is depicted rather than driven by real data.**
   The radiation-belt and magnetosphere passage in the third mode is depicted but not rendered from archived Pioneer 10 particle and field measurements; a future ship could drive the mode from the real fields-and-particles time series for a quantitatively faithful reading.
   _⚙ Status: `investigate` · lesson #12412_

14. **The escape-trajectory mode is depicted rather than computed.**
   The outbound climb away from the Sun in the fourth mode is depicted rather than rendered from the published Pioneer 10 trajectory; a future ship could drive the mode from the real heliocentric ephemeris for a quantitatively faithful view.
   _⚙ Status: `investigate` · lesson #12413_
