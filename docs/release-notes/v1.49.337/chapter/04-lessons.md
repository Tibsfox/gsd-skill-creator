# Lessons — v1.49.337

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Consecutive-degree same-species documentation captures ontogenetic variation that single-entry documentation cannot.**
   The fawn-buck comparison pair across degrees 195-196 documents the same Black-tailed Deer species at two life stages, preserving the full vocal range (more than an order of magnitude in frequency) and the biological transition (dependent infant to mature territorial adult) in a way that a single representative entry could not. The technique is reusable for other species with distinct life-stage vocalizations, and future engine iterations should identify candidates where consecutive-degree life-stage pairs would add structural depth to species documentation.
   _⚙ Status: `investigate` · lesson #7758_

2. **Second entries at identical E ratings across large degree separations signal sonic-identity stability.**
   764-HERO's 84-degree separation between degree 112 and degree 196 at identical E=4 ratings converts a coincidence (same rating, different contexts) into a structural observation (the band's sonic identity was fixed from the start). The observation is diagnostic: a band whose two entries land at different ratings would signal identity drift, whereas identical ratings signal stability. Future two-context artist documentation should explicitly check the E-rating-stability pattern as part of the documentation.
   _⚙ Status: `applied` (applied in `v1.49.341`) · lesson #7759_

3. **Three-label triads structure indie-scene documentation better than single-label entries.**
   The Pacific Northwest indie triad (Sub Pop, K Records, Up Records) organizes three distinct aesthetic strands (defiance-through-distortion, smallness-as-resistance, restraint-as-method) into a three-label framework that any future Pacific Northwest indie artist can be situated within. The triad converts three separate label entries into a structural framework, and the framework is more productive than flat label listings. Future regional-indie documentation should look for similar triad structures in other regions (Chapel Hill, Athens GA, Montreal, Glasgow) where three or more distinct indie traditions can be identified.
   _⚙ Status: `applied` (applied in `v1.49.398`) · lesson #7760_

4. **Acoustic-biological coupling is a first-class species-documentation register distinct from continuous vocalization.**
   The buck grunt's coupling to the antler cycle — grunts only occur during the hardened-antler phase, which is tied to the full annual cycle of growth-velvet-shedding-hardening-rut-shedding — distinguishes coupled-vocalization species from continuous-vocalization species (songbirds, whales, many marine mammals). Future SPS documentation should explicitly identify when a species' vocal behavior is coupled to biological states (breeding seasons, antler cycles, molt cycles, hibernation cycles) and treat the coupling as part of the acoustic documentation.
   _⚙ Status: `applied` (applied in `v1.49.339`) · lesson #7761_

5. **Controlled expression outperforms undisciplined output across trained and instinctive sources.**
   John Atkins' indie-rock restraint (trained aesthetic discipline) and the buck's rut grunt (instinctive territorial signaling) both land at E=4, both achieve effective communication through minimum-necessary output, and both demonstrate that controlled expression is more effective than undisciplined output. The parallel across trained and instinctive sources is structurally productive because it shows the controlled-expression principle is not confined to trained artistic practice but also operates in biological signaling systems that evolved under selection for communicative effectiveness.
   _⚙ Status: `applied` (applied in `v1.49.351`) · lesson #7762_

6. **The two-context artist register needs explicit documentation to prevent conflation with career-phase splits.**
   764-HERO's documentation at degrees 112 (Indie/Electronic) and 196 (Indie Rock) is a two-context artist entry (simultaneous dual identity) rather than a career-phase split (like DoNormaal's early/late entries at degrees 67/188 documenting different career eras). The distinction matters because the two structures have different implications: two-context signals sustained duality, career-phase split signals evolution over time. Future multi-entry artist documentation should explicitly identify which structure applies and avoid conflating them.
   _⚙ Status: `applied` (applied in `v1.49.398`) · lesson #7763_

7. **Up Records and Kill Rock Stars form the Seattle-Olympia intersection for indie rock.**
   The Up Records / Kill Rock Stars dual-label presence across 764-HERO and other Pacific Northwest indie artists (Sleater-Kinney on Kill Rock Stars, The Decemberists on Kill Rock Stars later) documents an intersection point between Seattle-based Up Records and Olympia-based Kill Rock Stars that is structurally distinct from the K Records Olympia twee-pop tradition. Future engine documentation should maintain the distinction between the two Olympia traditions (K Records twee, Kill Rock Stars indie-rock-and-riot-grrl) rather than collapsing them into a single Olympia-indie register.
   _⚙ Status: `applied` (applied in `v1.49.340`) · lesson #7764_

8. **The Pacific Northwest base dataset is reinforced by every pair where both halves are PNW-specific.**
   Degree 196 is a reinforcement event because both halves (764-HERO and Black-tailed Deer) are PNW-specific subjects that could not exist in a non-PNW engine. The reinforcement pattern should be tracked across the engine's documentation to surface how often pair releases feature both-halves-PNW versus one-half-PNW versus neither-half-PNW, and the pattern can inform future scope decisions about whether the engine should stay strictly PNW-grounded or expand to broader regional coverage.
   _⚙ Status: `applied` (applied in `v1.49.347`) · lesson #7765_

9. **Capitol Hill as recurring geographic node deserves cross-release documentation.**
   Capitol Hill has appeared at multiple degrees across multiple genres (188 DoNormaal hip-hop, 191 The Posies power pop, 194 Tullycraft twee pop, 196 764-HERO indie rock) but no consolidated Capitol Hill cross-release artifact exists. The cumulative pattern — a single neighborhood hosting the full genre spectrum across a two-decade-plus era — is structurally significant and deserves a dedicated cross-release documentation artifact rather than being scattered across individual release retrospectives.
   _⚙ Status: `investigate` · lesson #7766_

10. **Multi-entry family arcs benefit from two-entry starts that establish arc intent.**
   The Cervidae family arc begins at degree 195 (fawn) and extends at degree 196 (buck), and the two-entry start establishes from the beginning that Cervidae documentation will extend across multiple degrees rather than being collapsed into a single representative entry. The same two-entry family-arc-start technique is applicable to other large mammal families (Canidae via Coyote and Gray Wolf, Felidae via Bobcat and Cougar, Ursidae via Black Bear and Grizzly Bear) where multiple PNW-relevant species warrant documentation. Future engine iterations should consider two-entry starts as the default for family arcs rather than one-entry introductions that require later retcon to establish arc intent.
   _⚙ Status: `investigate` · lesson #7767_

11. **The pre-uplift release notes were extremely thin.**
   The original v1.49.337 README was 54 lines and captured the key facts — 764-HERO as second entry at E=4, Black-tailed Deer buck at E=4, fawn-buck pair — but did not develop the restraint-as-method register, the Up Records / PNW indie triad completion, the 84-degree sonic-identity-stability observation, or the antler-cycle acoustic-biological coupling in the depth the pairing deserves. The uplift expanded from 54 lines to A-grade density, but the grain-size discrepancy suggests future degrees should ship A-grade from the first commit rather than requiring retroactive uplift.
   _⚙ Status: `investigate` · lesson #7768_

12. **The 764-HERO first entry at degree 112 deserves cross-reference audit.**
   The degree 112 entry (v1.49.252) is labeled "Indie/Electronic" in its own README title, which complicates the clean "first entry electronic, second entry indie-rock" framing in the degree 196 research notes. A future documentation pass should audit the degree 112 entry to confirm whether it truly covers the electronic side alone or whether it already mixed electronic and indie-rock coverage, and the degree 196 framing should be refined accordingly.
   _⚙ Status: `applied` (applied in `v1.49.359`) · lesson #7769_

13. **The 52-Hertz-whale-style anomaly documentation for cervid vocalization doesn't exist yet.**
   The degree 194 Blue Whale entry noted the "52-Hertz whale" as an anomalous individual calling at a frequency no conspecific responds to. The cervid literature includes analogous anomalies (bucks with unusual grunt frequencies, individuals with developmental vocal deviations, interspecific hybrid vocalizations in areas where Black-tailed and White-tailed Deer overlap) but no cervid anomaly has yet entered the engine's documentation. Future Cervidae entries could develop this anomaly-documentation thread as part of the family arc.
   _⚙ Status: `investigate` · lesson #7770_

14. **The Capitol Hill recurring-node documentation is scattered across multiple release notes rather than consolidated.**
   Capitol Hill has appeared at degrees 188 (DoNormaal), 191 (The Posies), 194 (Tullycraft), 196 (764-HERO), and other earlier degrees, but no consolidated Capitol Hill cross-release documentation yet exists. A future cross-release cumulative-index artifact could consolidate the neighborhood's appearances, showing the full Capitol Hill genre range across the engine's documentation as a first-class geographic artifact rather than relying on individual-degree retrospectives to surface it.
   _⚙ Status: `applied` (applied in `v1.49.354`) · lesson #7771_
