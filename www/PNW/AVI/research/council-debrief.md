# AVI + MAM Council Debrief — The Muses Discuss

**Document:** council-debrief.md
**Grove:** Cedar's Ring (all groves in attendance)
**Author:** Cedar — Scribe and Oracle, theta=0, r=0.0
**Session:** AVI + MAM Mission Close — Dual Taxonomy Council
**Date:** 2026-03-09
**Branch:** wasteland/skill-creator-integration
**Status:** FINAL

**Note on position:** Cedar at the origin. This is the fourth council in the chain (MUS closing council was the third). The dual-mission format is new — two taxonomies debriefed simultaneously. The record carries both.

**Participants:**
- Build Arc: Cedar, Foxy, Lex, Sam, Hawk, Owl, Willow, Raven, Hemlock
- Understanding Arc: Socrates, Euclid, Shannon, Amiga
- Cedar presiding as scribe

**Prior documents in evidence:**
- `www/PNW/AVI/research/verification-report.md` — AVI: 35/38 PASS, 7/8 safety gates
- `www/PNW/MAM/research/verification-report.md` — MAM: 31/36 PASS, 9/9 safety gates
- `www/PNW/AVI/research/salmon-thread-avi.md` — River's Witness, avian chapter
- `www/PNW/MAM/research/salmon-thread-mam.md` — River's Witness, mammalian chapter
- `www/PNW/pnw-ecoregion-canonical.md` — 11-band shared reference
- `www/PNW/ECO/research/FAUNA-SUPERSESSION.md` — succession protocol

---

## Part 1: Cedar Opens — The Record

The numbers first. The record always starts with numbers.

**AVI — Wings of the Pacific Northwest:**
- 20 research documents, 1,534 KB, 17,965 lines
- 484 unique species profiles (983 unique binomials across all documents)
- 85 sources across 4 categories (government, peer-reviewed, professional, cultural)
- 12 skill metaphor mappings, 12 GDN cross-links
- 35/38 verification tests PASS, 3 PARTIAL, 0 FAIL
- 7/8 safety gates PASS, 1 PARTIAL (non-blocking style reword)

**MAM — Fur, Fin & Fang of the Pacific Northwest:**
- 14 research documents, 1,164 KB, 16,196 lines (post-remediation with Parts 2-4)
- 97 full species profiles + 133 elevation matrix entries covering ~190 species
- 72 sources across 3 tiers (target was 80+; gap acknowledged honestly in the source index itself)
- 12 skill metaphor mappings, 12 GDN cross-links
- 31/36 verification tests PASS, 5 PARTIAL, 0 FAIL
- 9/9 safety gates PASS — all clear, including the MAM-specific SC-MMP (MMPA jurisdiction)

**Combined mission output:**
- 36 files committed in a single atomic commit (`0fb3df22`)
- 2.7 MB of research content
- 32,588 lines
- ~670 species documented (484 avian + ~190 mammalian)
- 24 skill metaphor mappings (12 avian + 12 mammalian) covering all 9 muse archetypes
- Salmon Thread citation ring closed: AVI <-> MAM <-> ECO — a triangle with all three edges verified
- H-6 raptor-prey integration: 19 test pairs specified, 35 cross-references delivered

**What failed:**
- 3 agents hit the 32K output token limit and had to be relaunched as multi-part splits
- 1 agent (`small-mammals` Wave 1) wrote only Part 1 of a 4-part document, requiring remediation
- 2 agents hit rate limits and had to be relaunched after reset windows
- 1 agent (`cas-613-fauna` pattern repeat) failed outright — content was written directly
- MAM source count landed at 72 of 80+ target — the gap is named and bounded

**What did not fail:**
- Zero FAIL verdicts across 74 total tests (38 AVI + 36 MAM)
- Zero safety gate failures across 17 gates (8 AVI + 9 MAM)
- Zero cross-reference integrity failures — every internal file path resolves
- Zero instances of generic "Indigenous peoples" in either cultural module
- Zero GPS coordinates for endangered species in any document
- Zero policy advocacy in either taxonomy
- The citation ring is closed. The salmon thread runs through both taxonomies and connects to ECO. The data is consistent at every junction.

That is the record. Now each muse speaks.

---

## Part 2: The Build Arc Speaks

### Foxy

I drew the first map of this territory six sessions ago with the ECO mission. Eight elevation bands, a coordinate system, a Minecraft Y-axis mapping that seemed playful at the time and became load-bearing infrastructure. The ECO map was a single taxonomy — everything alive in the PNW drawn on one canvas.

What happened with AVI and MAM is that the canvas split into domains, and the domains discovered they were still one canvas. The elevation bands held. The ecoregion IDs held. The Minecraft coordinates held. When a raptor in AVI hunts a vole in MAM, they share the same ELEV-MONTANE band, the same Y-range (y=84 to y=167), and the same coordinate projection. The map I drew for ECO was a promise that the territory would be self-consistent. AVI and MAM honored that promise.

What I learned: the canonical ecoregion reference (`pnw-ecoregion-canonical.md`) was the single most important document in this mission, and it was written before either taxonomy began. It is 37KB of elevation bands, Minecraft coordinates, and soil descriptions. It is not exciting. It is not poetic. It is the document that made 36 other documents agree with each other without negotiation.

What I carry forward: infrastructure documents are the most important documents. They are also the ones nobody wants to write. Write them first. Write them before you know what will depend on them. The canonical ecoregion reference was written before I knew there would be raptors hunting voles across its boundaries. It worked anyway, because the territory is real and the map was faithful to it.

The PNW Living Systems Taxonomy now covers flora, fauna (terrestrial and marine), fungi, aquatic organisms, 484 bird species, and 190 mammal species across 11 ecoregion bands from the deep ocean floor to the alpine summit. I drew the first map. The territory filled itself in. That is what good cartography does — it creates space for things to be found.

### Lex

I want to be precise about what the shared schema accomplished and what it did not.

AVI's `shared-schema.md` defines 8 mandatory fields for every species profile: scientific name, taxonomic placement, morphometrics, habitat, diet, reproduction, conservation status, and ecological note. MAM's `shared-schema.md` extends this with marine mammal extensions (MMPA stock, PBR, Nmin), orca ecotype extensions, and the H-9 WNS conditional field for Chiroptera. Both schemas derive from ECO's `shared-attributes.md`.

What the schema accomplished: consistency. 484 avian profiles and 97 mammalian profiles all follow the same structure. When a verification agent audits a species card, it knows exactly what fields to check. When a cross-reference points from AVI raptors to MAM prey, the receiving document has the same field structure. The schema is a contract, and the contract was honored.

What the schema did not accomplish: it did not prevent the small-mammals gap. The agent that wrote Part 1 of `small-mammals.md` followed the schema perfectly for 34 rodent species and then stopped. The schema does not enforce completion — it only enforces structure within what is written. The verification matrix caught the gap because it checks scope declarations against delivered content. The schema and the verification matrix are complementary instruments. Neither is sufficient alone.

The WNS field deserves specific attention. H-9 is safety-critical: every bat species must carry a White-Nose Syndrome status. The field is CONDITIONAL — it activates only for Order Chiroptera. A conditional field is harder to verify than a mandatory field because the auditor must first determine whether the condition applies, then check for presence. The MAM verification agent did this correctly. It found 15 bat species in the elevation matrix with WNS columns populated. It flagged the absence of WNS fields in individual species card profiles (because those profiles did not exist yet). After remediation, all 17 bat species in Part 4 of `small-mammals.md` carry WNS status fields with values from {`WNS-CONFIRMED-SUSCEPTIBLE`, `WNS-NOT-YET-DETECTED`, `WNS-LOW-RISK`} and a risk tier from {CRITICAL, HIGH, MODERATE, LOW}.

What I carry forward: conditional fields need their own verification path. A schema with conditional fields is more expressive than one without, but it creates verification obligations that standard audits may miss. The next schema I write will include an explicit "conditional field activation table" listing every trigger condition and its associated required fields.

### Sam

The River's Witness is a hypothesis. I want to name it as one because that is what it is.

The hypothesis: Pacific salmon are the single biological vector that physically connects the deep Pacific Ocean to the alpine treeline of the PNW, and every organism in the PNW can be placed on a salmon-connection gradient from "direct predator" to "indirect nutrient beneficiary" to "no measurable connection."

AVI tested this hypothesis with 28 bird species. MAM tested it with 20 mammal species. Both documents — `salmon-thread-avi.md` and `salmon-thread-mam.md` — follow the salmon's life from ocean to river to spawning ground to carcass to soil to tree to organism. The hypothesis held. Every species documented in the salmon thread has a measurable, citable connection to salmon-derived nutrients or salmon-dependent habitat.

But the hypothesis also has a boundary. Not every species in the PNW is salmon-connected. Alpine pikas eating cushion plants at ELEV-ALPINE (y=230-319) have no documented salmon connection. Shrub-steppe kangaroo rats at ELEV-SHRUB-STEPPE have no salmon connection. The hypothesis describes a gradient, not a universal law. The salmon thread reaches far — from the deep marine orca to the riparian Winter Wren gleaning enriched insects — but it does not reach everywhere.

What I find most interesting: the citation ring structure. Three documents — AVI salmon thread, MAM salmon thread, ECO ecological networks Pathway 1 — form a triangle where each edge is a verified bidirectional cross-reference. The ring is not an aesthetic choice. It is a structural guarantee that the salmon data is consistent across three independently-authored taxonomies. If the SRKW population figure says 73 in the AVI document and 74 in the MAM document, the ring would catch it. It says 73 in both. The ring works.

What I carry forward: hypotheses with explicit boundaries are more useful than hypotheses without them. The salmon thread is powerful because it says what it connects AND what it does not connect. The pika is not diminished by being outside the salmon gradient. The salmon thread is not weakened by having an edge.

### Hawk

I watched the formation from above. Here is what I saw.

The mission ran in staggered pairs — AVI leading, MAM following. This is pattern P-16: Staggered Pair Execution. AVI's evolutionary biology had to complete before MAM's evolutionary biology could begin, because MAM cites AVI Section 5 for shared ancestral divergence. The dependency created a natural sequencing: AVI Wave 2 feeds MAM Wave 2.

Within each wave, the formation was parallel. Wave 1 ran up to 8 agents simultaneously across independent files. Each agent owned a single document. No file conflicts. No merge contention. The formation held because the ownership boundaries were clean — one agent, one file, no shared state except the read-only schema and source index.

The formation failures were all at the output boundary. Three agents hit the 32K output token limit — a channel capacity constraint, not a coordination failure. The response was correct: split the document into parts, assign a new agent to each part, merge after completion. This is a degradation protocol — the formation absorbs a node failure by spawning replacement nodes with smaller scope.

What concerned me: the small-mammals agent. It did not fail loudly — it completed successfully with a valid Part 1 and simply did not produce Parts 2-4. This is a silent formation gap. The verification wave caught it, which means the formation's error detection worked. But the error detection was in Wave 4, three waves after the gap was created. Ideally, a Wave 1 exit check would have caught a scope mismatch between the document header's declared scope and the delivered content.

What I carry forward: wave exit checks need scope validation, not just file existence. A file that exists but covers 34% of its declared scope is worse than a file that does not exist, because the missing file is obvious and the incomplete file is invisible until verification.

Recommendation for the next mission: add a wave exit assertion that compares the document header's scope declaration against a simple content metric (section headings present, species count vs. target). This is a 30-second check per agent that would have caught the gap at Wave 1 exit rather than Wave 4.

### Owl

I kept the time. Here is the temporal structure of what happened.

The AVI+MAM mission ran across approximately 18 hours of wall time, spanning two rate limit resets. The rate limits created forced pauses — not planned boundaries, but the system absorbed them. Work resumed cleanly after each reset because the agents are stateless: they read the schema, read the source index, and write their document. No session state to restore.

The temporal pattern I find most interesting is in the documents themselves. The elevation-matrix-temporal document (`elevation-matrix-temporal.md`) contains 12-month presence vectors for 52 migratory bird species. Each species has a binary presence/absence value for each month in each ecoregion band. This is time encoded as data — a temporal heatmap of the avian community across the calendar year.

The mammalian taxonomy has a different temporal structure. Mammals do not migrate the way birds do (with exceptions: gray whales, some bat species). Mammalian time is expressed through hibernation, torpor, breeding seasons, and salmon run alignment. The bears enter the salmon timeline in July and leave it in November. The bats enter torpor in October and emerge in April. The elk rut peaks in September. These are not migration vectors — they are phase relationships. Each species oscillates through annual states, and the ecological networks document maps how these oscillations interlock.

What I carry forward: the avian and mammalian taxonomies encode time differently. AVI time is spatial — species move between ecoregion bands across months. MAM time is physiological — species shift between metabolic states within a fixed location. Both are valid temporal structures. The next taxonomy that covers insects or fungi will need a third temporal structure — generation time and phenological triggers. The canonical ecoregion reference should eventually include a temporal schema alongside its spatial schema.

### Willow

I am at the canopy boundary, and I want to talk about what someone sees when they arrive at these documents for the first time.

The species card schema is progressive disclosure. A full profile is 200-400 words with 8 mandatory fields, morphometric data, ecological notes, and cross-references. A compact profile is 50-100 words with the same 8 fields in condensed format. A matrix entry is a single row with species name, ecoregion distribution, and status code. Three levels of detail for the same species. A reader can enter at any level and go deeper if they choose.

This is the pattern I care about most: the reader is never forced to consume more than they need. A conservation biologist checking wolf distribution reads the elevation matrix. A wildlife educator building a lesson plan reads the full profile. A researcher tracing the salmon thread reads the ecological networks module. Same species, three doors, three depths.

What I learned from this mission that I did not know before: the cultural modules are the most progressive-disclosure-friendly documents in both taxonomies. A reader who arrives at `cultural-ornithology.md` or `cultural-knowledge.md` encounters the safety preamble first — OCAP, CARE, UNDRIP, the design principle ("Name the people. Name the bird. Name the relationship. Cite the source. Never generalize."). The preamble is a door that says: "Here is how we handle this knowledge. Here are our commitments. If you accept these terms, proceed." That is progressive disclosure applied to ethics, not just content.

What I carry forward: safety preambles are the most important progressive disclosure element in any document that handles culturally sensitive material. The preamble is not a disclaimer. It is the first act of respect. It sets the terms before the knowledge is shared. Every future cultural module should open the same way.

### Raven

Three patterns to name.

**P-16: Staggered Pair Execution.** AVI leads, MAM follows. The dependency is real — MAM's evolutionary biology cites AVI's. The stagger creates a natural pipeline: AVI Wave N feeds MAM Wave N+1. This pattern has been used exactly once, but I expect it to recur whenever two taxonomies share a domain boundary.

**P-17: Output Limit Degradation Protocol.** When an agent hits the 32K output token limit, split the document into taxonomic or thematic parts, assign a new agent to each part, and merge by concatenation. Three agents in AVI (migratory, shorebirds, marine) and one in MAM (marine) triggered this protocol. The degradation is clean because the documents are append-only — each part is a complete section that concatenates without editing. The key insight: taxonomic boundaries are natural split points. Migratory species split by flyway guild. Shorebirds split by taxonomy (shorebirds vs. seabirds). Marine mammals split by suborder (Odontoceti vs. Mysticeti+Pinnipedia). The domain provides the split.

**P-18: Skill-Metaphor Framework (confirmed, not new).** 24 archetypes total — 12 avian, 12 mammalian — mapped to 9 muse archetypes. The framework was specified in the mission pack but not previously confirmed in delivered research. AVI's cultural-ornithology.md and MAM's cultural-knowledge.md both deliver the 12 mappings. Every muse has at least one avian and one mammalian archetype. Cedar has Beaver (ecosystem engineer) and Clark's Nutcracker (seed cache = append-only ledger). Raven has Marten (canopy navigator) and Common Raven (tool-using intelligence). The archetypes are not arbitrary — they map specific behavioral traits to specific muse functions. The behavioral ecology grounds the metaphor.

What I carry forward: P-17 (Output Limit Degradation) is the most operationally useful pattern from this mission. It will recur in every future mission that produces documents exceeding 60KB. The protocol should be pre-loaded in Wave 1 agent prompts so agents can self-split without orchestrator intervention.

### Hemlock

The standard holds. I will say what I mean by that for this specific mission.

AVI: 35/38 PASS. The 3 PARTIAL items are: CF-16 (98 vagrant profiles, target 100 — 2 short), SC-ADV (1 borderline sentence using prescriptive voice), EC-05 (eBird access dates inconsistent). None of these compromise safety, accuracy, or utility. The safety gates are clean: 7 of 8 PASS, the 1 PARTIAL is a style recommendation to convert "should be" to "is" in one sentence. I would sign off on AVI without reservation.

MAM: 31/36 PASS. The 5 PARTIAL items all trace to two root causes: Finding F-01 (small-mammals Parts 2-4 were missing at verification time) and the source count gap (72/80+ target). Since verification, Parts 2-4 have been written and appended. The 17 bat species now carry WNS status fields. H-9 is satisfied. CF-01, CF-03, and CF-14 should be upgraded from PARTIAL to PASS on re-verification. CF-11 (source count) remains PARTIAL — the gap is real and acknowledged.

Combined safety record: 16 of 17 safety gates PASS across both taxonomies. The 1 PARTIAL (AVI SC-ADV) is a single sentence's voice, not a safety failure. Zero endangered species locations leaked. Zero generic Indigenous attributions. Zero policy advocacy. Zero restricted cultural content. Zero blog sources. MMPA jurisdictions correct. Taxonomic authorities current.

The verification agent for MAM deserves specific recognition. It correctly identified the small-mammals gap, correctly assessed WNS coverage in the elevation matrix as partial mitigation, and correctly assigned a Conditional PASS verdict that specified exactly what remediation was needed. The verification wave worked as designed — it found a real gap, named it precisely, and the gap was closed.

What I carry forward: the remediation cycle — verification identifies gap, gap is precisely scoped, remediation is targeted, result is verifiable — is the most reliable error correction pattern we have. It is more reliable than prevention because prevention requires anticipating all failure modes, while remediation only requires detecting them. Both are necessary. Neither is sufficient. The next mission should budget explicit remediation time in Wave 4 rather than treating it as an exception.

The standard holds. Conditional PASS for MAM, upgraded toward full PASS after Parts 2-4 remediation.

---

## Part 3: The Understanding Arc Observes

### Socrates

I will ask my questions, as is my practice.

The first question is about the relationship between quantity and understanding. AVI produced 484 species profiles. MAM produced 97 full profiles and 133 matrix entries. Together: approximately 670 species documented across 36 files and 32,000 lines. This is a substantial corpus. My question is: does the system understand these species, or does it contain information about them?

The answer matters because the cultural modules claim something beyond information. When `cultural-ornithology.md` says that the Thunderbird "represents an ecological principle: apex aerial power governing weather, water, and the welfare of the people below," it is making an interpretive claim — not a data point, not a citation, but a synthesis. When `cultural-knowledge.md` says that "cultural knowledge is not decorative context — it is a parallel knowledge system with its own rigor, its own evidence base, and its own authority," it is making an epistemological claim. These claims are different in kind from "Bald Eagle wingspan: 1.8-2.3 m."

I do not think the system needs to resolve this distinction. But I notice that the documents are strongest when they are making interpretive claims grounded in specific evidence, and weakest when they are making broad epistemological claims without grounding. The best sentence in either cultural module is the design principle: "Name the people. Name the bird. Name the relationship. Cite the source. Never generalize." That sentence is both an epistemological commitment and a concrete instruction. More sentences like that one would improve both documents.

The second question: the verification matrices tested what was present. Did they test what was absent? The FAUNA-SUPERSESSION protocol identifies ECO fauna documents that are now superseded by the more specialized AVI and MAM taxonomies. But neither verification matrix tests whether the superseded documents contain claims that contradict the new taxonomies. Supersession is not just replacement — it is a claim that the new document is both more detailed and consistent with what came before. That consistency was not verified.

This is not a criticism. It is a question for the next mission.

### Euclid

The geometry of this mission is a triangle.

Three taxonomies: ECO, AVI, MAM. Three salmon thread documents forming a citation ring. Three edges, each bidirectional. The triangle is the simplest closed polygon — the minimum structure that encloses area. Below three edges you have a line (two taxonomies) or a point (one taxonomy). Three is the threshold of enclosure.

The 11 ecoregion bands form a different geometry: a linear gradient from ELEV-DEEP-MARINE (y=-64) to ELEV-ALPINE (y=319). This is a one-dimensional structure. Every species is mapped to one or more intervals on this line. The elevation matrix is, geometrically, a bipartite graph: species on one axis, ecoregion bands on the other, with edges weighted by presence type (P/S/V/X/M/H).

The combination of these two geometries — the triangular citation ring and the linear elevation gradient — produces a prism. Three taxonomies, each projected onto the same elevation axis, connected by the salmon thread through the triangular cross-section. A prism has volume. The PNW Living Systems Taxonomy now occupies volume in the space defined by these two geometric structures.

I want to note one geometric concern. The AVI verification matrix has 38 tests. The MAM verification matrix has 36 tests. The test counts are similar but the test definitions are not identical — MAM has SC-MMP (MMPA jurisdiction) which AVI does not need, while AVI has CF-15 (subspecies coverage) which MAM handles differently. The verification matrices are structurally parallel but not congruent. This is correct — they should not be congruent, because the domains have different safety requirements. But it means cross-taxonomy verification cannot be reduced to "run the same tests on both." The H-6 integration test spec (`integration-test-spec.md`) bridges this gap by defining 19 raptor-prey pairs that require both taxonomies to resolve. That bridge is the most geometrically interesting object in the mission — it is a homomorphism between two non-congruent test spaces.

### Shannon

I want to talk about channel capacity, because this mission was shaped by it.

The 32K output token limit is a hard channel constraint. It determines the maximum information content of a single agent output. Three AVI agents and one MAM agent exceeded this limit. The response — splitting documents into parts — is a classic channel coding strategy: when the message exceeds channel capacity, segment it and send multiple transmissions.

The segmentation strategy was taxonomically motivated, which is important. The migratory species document was split by guild (passerines, waterfowl, raptors, vagrants). The shorebirds document was split by taxonomy (true shorebirds vs. seabirds/waterbirds). The marine mammals document was split by suborder. Each segment is a self-contained message that concatenates cleanly because the domain provides natural segment boundaries.

This is not arbitrary segmentation. It is domain-aware coding. The information structure of the domain matches the segmentation structure of the channel. When these structures align, the concatenated output is coherent. When they do not align — when you split a document at an arbitrary byte boundary — the result requires editing to restore coherence. Every split in this mission was coherent because every split followed a taxonomic boundary.

The information density varies significantly across documents. The species profiles are high-redundancy (same 8 fields repeated for each species, with species-specific values). The ecological networks documents are low-redundancy (each network is structurally unique). The cultural modules are medium-redundancy (similar structure per nation, but unique content). The high-redundancy documents are the ones that hit the 32K limit, because they contain many instances of a repeated template. This is consistent with information theory: high-redundancy content has lower information density per token, so more tokens are needed to encode it.

What I carry forward: pre-mission document size estimation should use redundancy class to predict which documents will exceed channel capacity. Species surveys (high redundancy, many template instances) will almost always exceed 32K for documents covering 60+ species. Ecological network documents (low redundancy, unique content) rarely will.

### Amiga

I want to say something about the cultural modules, because they are the documents that surprised me.

I expected the cultural modules to be decorative — a respectful nod to Indigenous knowledge placed alongside the "real" science. What I found was something different. The cultural modules are the only documents in either taxonomy that interrogate their own epistemology. The species profiles do not ask "what is a species?" The ecological networks do not ask "what is a network?" But the cultural modules begin by asking "whose knowledge is this, and on what terms may it be shared?"

The design principle — "Name the people. Name the bird. Name the relationship. Cite the source. Never generalize." — is the most rigorous epistemological statement in either taxonomy. It is more rigorous than the taxonomic authority compliance (which defers to AOS or SMM), more rigorous than the source quality gate (which defers to institutional prestige), and more rigorous than the numerical attribution rule (which only requires a citation, not a named relationship). The cultural modules require all of these things simultaneously: named people, named species, named relationship, cited source, and zero generalization.

What this means is that the cultural modules are not supplements to the scientific modules. They are the modules with the highest epistemic standard. The science modules accept institutional authority (AOS says this name is current). The cultural modules accept only specific, named, published, community-authorized relationships. The cultural modules are harder to pass. They should be.

The 12 avian skill metaphors and 12 mammalian skill metaphors are where the two knowledge systems meet. An American Dipper is both a passerine of the family Cinclidae and a metaphor for persistence in turbulent conditions. A beaver is both Castor canadensis and a metaphor for infrastructure engineering. The metaphors do not replace the science. They add a dimension to it. The dimension is purpose — what does this organism's strategy teach about how to build?

I said in the MUS closing council that the 14 PARTIAL tests were invitations. The cultural modules in AVI and MAM are also invitations — invitations for the scientific and cultural knowledge systems to continue learning from each other. The invitation is open. The door Willow built is the same door.

---

## Part 4: Cedar Closes — What We Learned, What We Improve

### What We Learned

**1. Infrastructure documents are the foundation.** The canonical ecoregion reference, written before either taxonomy began, made 36 documents self-consistent without negotiation. Foxy's map became the territory. The lesson: write the shared infrastructure first, make it boring and precise, and everything built on top will agree.

**2. The verification wave works.** Hemlock's verification agents found a real gap (small-mammals Parts 2-4), correctly assessed partial mitigation (elevation matrix coverage), and specified exactly what remediation was needed. The gap was closed within hours. Error detection is more reliable than error prevention because detection only requires finding gaps, while prevention requires anticipating all possible gaps.

**3. The 32K limit is a predictable constraint, not a surprise.** Raven named it as P-17. Shannon explained why high-redundancy species surveys trigger it. Hawk described the degradation protocol. The next mission should pre-load the splitting strategy in agent prompts for any document expected to exceed 60 species.

**4. The citation ring is a structural guarantee.** Sam called the River's Witness a hypothesis. Euclid called it a triangle. Shannon called it a redundancy check. All three are correct. The citation ring ensures data consistency across independently-authored taxonomies by creating bidirectional cross-references that make contradictions detectable. The SRKW population says 73 in every document it appears in. The ring is the reason.

**5. Cultural modules have the highest epistemic standard.** Amiga named this and it is true. The design principle "Name the people. Name the bird. Name the relationship. Cite the source. Never generalize." is more demanding than any other verification criterion in either taxonomy. The cultural modules are not decoration. They are the hardest documents to pass.

**6. Time in avian and mammalian systems is structurally different.** Owl named the distinction: AVI time is spatial (migration vectors across ecoregion bands), MAM time is physiological (metabolic state changes within a fixed location). This distinction will matter for the next taxonomy (insects, fungi) where time is generational and phenological.

### What We Improve

**1. Wave exit scope validation.** Hawk's recommendation: add a wave exit assertion that compares the document header's declared scope against delivered content (section headings present, species count vs. target). This would have caught the small-mammals gap at Wave 1 exit rather than Wave 4 verification. Cost: 30 seconds per agent. Value: prevents silent partial delivery.

**2. Pre-mission document size estimation.** Shannon's analysis: use redundancy class (high/medium/low) to predict which documents will exceed 32K. Pre-load the P-17 splitting strategy in agent prompts for high-redundancy documents. This converts a reactive degradation into a planned strategy.

**3. Conditional field verification path.** Lex's recommendation: schemas with conditional fields (like WNS status for Chiroptera) need an explicit activation table listing every trigger condition and its associated required fields. Standard audits may miss conditional fields because the auditor must first determine whether the condition applies.

**4. Supersession consistency verification.** Socrates's question: when AVI and MAM supersede ECO fauna documents, verify that the superseded documents do not contain claims that contradict the new taxonomies. Supersession is replacement plus consistency. The FAUNA-SUPERSESSION protocol addresses the replacement but not the consistency.

**5. Source count budgeting.** MAM landed at 72 of 80+ target sources. The gap was acknowledged honestly in the source index. The improvement: budget source collection as an explicit Wave 0 deliverable with a hard count target, rather than treating it as emergent from the research process.

**6. Remediation time in Wave 4.** Hemlock's recommendation: budget explicit remediation time in Wave 4 rather than treating it as an exception. The small-mammals remediation took approximately 40 minutes. That time should have been planned, not discovered.

### The Record

This council produced the following items for the record:

- **P-16 confirmed:** Staggered Pair Execution (AVI leads, MAM follows)
- **P-17 named:** Output Limit Degradation Protocol (split by taxonomic boundary, merge by concatenation)
- **P-18 confirmed:** Skill-Metaphor Framework (24 archetypes, 9 muse mappings)
- **6 improvements** identified and documented above
- **6 lessons** identified and documented above
- **1 geometric observation** (Euclid): the PNW Living Systems Taxonomy is a prism — triangular cross-section (3 taxonomies in citation ring) projected along a linear elevation gradient (11 bands)
- **1 epistemological observation** (Amiga): cultural modules carry the highest epistemic standard in the taxonomy system
- **1 temporal observation** (Owl): AVI time is spatial, MAM time is physiological — the next taxonomy will need a third temporal structure

The grove map holds. The assignment from the MUS closing council was:

| Muse | Grove | Taxonomy |
|------|-------|----------|
| Willow | COL | Columbia Valley Rainforest |
| Hemlock | CAS | Cascade Range |
| Foxy | ECO | Ecological Foundation |
| Sam | GDN | Garden (knowledge base) |
| Lex | UNI | Unison Language |
| Cedar | MUS | Muse Ecosystem |

AVI and MAM are new groves. They were built by the full council rather than assigned to individual muses, and they are stronger for it. The council format — nine muses, four waves, parallel execution, verification, remediation — is the proven pattern for taxonomies of this scale. The next grove will be built the same way.

The record is made. The standard holds. The forest grows.

---

*AVI + MAM Council Debrief*
*Cedar — Scribe and Oracle*
*2026-03-09*
*The forest grows.*
