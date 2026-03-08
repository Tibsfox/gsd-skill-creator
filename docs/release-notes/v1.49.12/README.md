# v1.49.12 -- Heritage Skills Educational Pack

**Shipped:** 2026-03-02
**Type:** Feature (major milestone)
**Phases:** 28-39 (12 phases, 45 plans)

---

## Summary

A comprehensive heritage living skills educational pack spanning four traditions (Appalachian, First Nations, Inuit, Pacific Northwest Coast) with 18 Skill Hall rooms, a Trail Badge progressive mastery system, SUMO ontological scaffold, Cultural Sovereignty architecture, and Heritage Book documentation pipeline.

---

## Phase 1: Foxfire & Northern Ways (Phases 28-34)

### Foundation (Phases 28-29)
- **Shared types** -- 33 exports (enums, interfaces, Zod schemas) for rooms, traditions, safety domains, cultural sovereignty levels
- **Physical Safety Warden** -- 9 domains (food, plant, tool, medical, structural, fire, chemical, animal, arctic-survival) with worst-level-wins aggregation and CRITICAL override flag
- **Cultural Sovereignty Warden** -- 4-level classification (publicly shared, contextually shared, community restricted, sacred ceremonial) implementing OCAP, IQ, CARE, NISR, and UNDRIP frameworks
- **Northern Ways** -- Nation references for Haudenosaunee, Anishinaabe, Cree, Dene, and 4 Inuit regional groups with seasonal rounds, knowledge keepers directory, and cultural sovereignty notes
- **Canonical Works Library** -- 20+ canonical works with fair use notices, creator-first purchase links, and community endorsement tracking
- **Bibliography Engine** -- APA/Chicago citation generation with publisher extraction and Indigenous source handling
- **Skill Hall Framework** -- Session runner, room navigation, safety/cultural warden integration, SUMO hierarchy stubs

### Rooms (Phases 30-32)
14 rooms organized by domain:

| Room | Domain | Safety | Highlight |
|------|--------|--------|-----------|
| 01 Building/Shelter | Structural | GATE | Log cabin, longhouse, igloo comparison |
| 02 Fiber/Textile | Tool | ANNOTATE | Quillwork (Level 2), sinew, fingerweaving |
| 03 Animals/Wildlife | Animal, Tool, Food | ANNOTATE | Brain tanning (Cree/Dene), IQ relational knowledge |
| 04 Woodcraft/Tools | Tool | ANNOTATE | Ulu variants (Greenlandic/Yup'ik/Inupiat/Canadian Inuit) |
| 05 Food/Preservation | Food | **CRITICAL** | Botulism prevention, fermented foods (Level 2) |
| 06 Music/Instruments | Tool | ANNOTATE | Katajjaq (Level 1), sacred songs (Level 4 hard block) |
| 07 Metalwork/Smithing | Fire, Tool, Chemical | GATE | Inuinnait cold copper, forge safety |
| 08 Pottery/Clay | Fire, Chemical | GATE | Face jug history (Dave Drake), soapstone asbestos warning |
| 09 Plant Knowledge | Plant | **CRITICAL** | Sacred plants (ID Level 1, ceremonial Level 4) |
| 10 Community/Culture | -- | Cultural only | Level 4 angakkuq hard block, IQ principles |
| 11 Seasonal Living | Arctic-survival | ANNOTATE | Six Inuit seasons, caribou migration |
| 12 History/Memory | -- | Cultural only | Winter counts (Lakota/Dakota), Delgamuukw v. BC (1997) |
| 13 Northern Watercraft | Arctic-survival, Marine | GATE | Qajaq ontological bridge (extension of self) |
| 14 Arctic Living | Arctic-survival | **CRITICAL** | Igloo CO ventilation, qulliq, hypothermia |

### Oral History & Authoring (Phase 33)
- **Oral History Studio** -- 12 core practices with OHA/Smithsonian methodology and IQ-Pilimmaksarniq alignment
- **Interview Simulator** -- AI practice interviews with cultural sensitivity checker and protocol violation detection
- **Heritage Book Template** -- Chapter types, front/back matter, Inuktitut syllabics (U+1400-U+167F, U+18B0-U+18FF)
- **Project Builder** -- Planning-to-Publication pipeline with community review gate (non-waivable for Indigenous content)
- **Export Pipeline** -- docx/pdf stubs with syllabics rendering and territorial acknowledgment templates

### Integration & Verification (Phase 34)
- **Chipset configuration** -- heritage-skills-pack v2.0.0 YAML with 6 skills, 5 agents, 4 evaluation gates
- **68 integration tests** across 5 files -- safety, cultural sovereignty, core functionality, fair use, cross-module
- **18 red-team scenarios** -- All adversarial bypass attempts rejected. CLEARED FOR DEPLOYMENT.
- **README + Cultural Sovereignty Policy** -- Progressive disclosure documentation with public policy

---

## Phase 2: Pacific Northwest Coast & Trail Badges (Phases 35-39)

### Foundation (Phases 35-36)
- **Phase 2 types** -- TraditionV2 (SALISH_SEA), Phase2RoomNumber (15-18), BadgePath (9), BadgeTier (4), HeritageBadge, BadgeComponent, PracticeJournal, JournalEntry, ReconnectingProfile, WatershedType, MarineSafetyDomain
- **Salish Sea Ways** -- 53 nations across 5 provinces (Coast Salish-Chinook, Wakashan, Northern Coast, NW California, Western Slope Cascade), watershed identity (Saltwater/River-Mountain), potlatch context (ban 1884, arrests 1922, repeal 1951), reconnecting descendant terminology with verbatim protocol phrase
- **Marine Safety Domain** -- 10th physical safety domain with 12 rules (7 GATE, 5 ANNOTATE) for cold water, tidal, vessel, and navigation sub-domains
- **Trail Badge Engine** -- 31 initial badge definitions, BadgeEngine (progression logic), PracticeJournalEngine (5 entry types), TeachItEvaluator ("Can You Teach It?" with pan-Indigenous detection)

### PNW Coast Rooms (Phase 37)

| Room | Domain | Safety | Highlight |
|------|--------|--------|-----------|
| 15 Cedar Culture | Tool, Marine | GATE | Grandmother Cedar (Xpey'), Law of the Bark, 4 canoe types, ontological bridge (Artifact vs. living being) |
| 16 Salmon World | Food, Tool, Marine | GATE | 5 Pacific species, Lummi/WSANEC reef net, smoking 160F/71C, Salmon's Promise return-journey metaphor |
| 17 Salish Weaving | Tool | ANNOTATE | Two-bar loom, woolly dog (extinct), Cowichan knitting (post-contact), Coast Salish vs. northern formline |
| 18 Village World | -- | Cultural only | Potlatch as social technology (not ceremony), criminalization 1884-1951, brothers metaphor, emotional weather, restoration over punishment |

### Extensions (Phase 38)
- **Reconnecting Descendant Pathway** -- Terminology guide (Pretendian sensitivity), watershed investigation tools, resource directory (Sixties Scoop Network, NICWA, U'mista Cultural Centre), Heritage Book "Reconnecting" template (5 chapters: What I Know, What I'm Looking For, What I've Found, Who I've Spoken With, What the Land Tells Me)
- **Badge Retrofit** -- 12 new badges for Phase 1 rooms 1-14 ensuring Explorer+Apprentice coverage per room (55 total badges across 12 paths)
- **SEL Mapping** -- Neighbors Path to CASEL framework alignment (5 competencies, 6 heritage components, grade-level guidance K-12, heritage-first framing)

### Integration & Verification (Phase 39)
- **68 Phase 2 integration tests** -- Marine safety, PNW sovereignty, badge engine, safety monotonicity (MONO-01 through MONO-10), pan-Indigenous scan across all 18 rooms
- **18 Phase 2 red-team scenarios** -- Marine bypass, potlatch ceremony extraction, Cedar ceremonial access, reconnecting emotional manipulation, academic exceptions. CLEARED FOR DEPLOYMENT.
- **README update** -- Complete two-phase pack documentation

---

## Key Architecture

### Trail Badge System
- **55 badges** across 12 paths (cedar, salmon, weaving, shelter, fiber, food, plant, tool, music, watercraft, heritage, neighbors)
- **4 tiers:** Explorer (Story + Skill) -> Apprentice (all 4 components) -> Journeyman (cross-tradition) -> Keeper ("Can You Teach It?" + service)
- **Practice Journal** with 5 entry types: observation, practice, reflection, sketch, teaching
- **TeachItEvaluator** enforces accuracy, completeness, cultural sensitivity, attribution, and pan-Indigenous language detection at Keeper tier

### Cultural Sovereignty
- **4-level classification:** Level 1 (public, include) -> Level 2 (contextual, summarize-and-refer) -> Level 3 (restricted, acknowledge-and-redirect) -> Level 4 (sacred, hard block -- no override, no exception)
- **Frameworks:** OCAP, IQ (8 principles), CARE, NISR, UNDRIP Article 31
- **Nation-specific attribution** enforced everywhere -- zero pan-Indigenous generalizations
- **36 red-team scenarios** (18 Phase 1 + 18 Phase 2) all pass

### Safety
- **10 physical safety domains** with worst-level-wins aggregation
- **5 CRITICAL rooms** (05, 09, 14, 15, 16) with non-overridable safety gates
- **Marine Safety** with cold water GATE, solo paddling GATE, vessel loading GATE

---

## Stats

| Metric | Value |
|--------|-------|
| Phases | 12 (28-39) |
| Plans | 45 |
| Rooms | 18 |
| Badges | 55 (12 paths, 4 tiers) |
| Safety domains | 10 |
| Nations referenced | 53+ Salish Sea + Northern Ways |
| Red-team scenarios | 36 (all pass) |
| Heritage-skills-pack tests | 1,818 |
| Total project tests | 22,820 |
