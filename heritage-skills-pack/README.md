# Heritage Skills Educational Pack — Complete Pack (Phase 1 + Phase 2)

> A living skills educational system covering Appalachian, First Nations
> (Anishinaabe, Cree, Haudenosaunee, and others), Inuit, and Pacific Northwest
> Coast (Lekwungen, Musqueam, Squamish, Lil'wat, Saanich, and 40+ Salish Sea nations)
> traditions. Built with physical safety enforcement, cultural sovereignty architecture,
> SUMO ontological scaffold, a Trail Badge progressive mastery system, and a Heritage
> Book authoring pipeline.

---

## Glance (30 seconds)

- **18-room educational pack across 4 traditions** (Appalachian, First Nations, Inuit, Pacific
  Northwest Coast), a Trail Badge progressive mastery system (55 badges across 12 paths), and
  a Heritage Book authoring pipeline with Inuktitut syllabics support.
- **Hard-enforced physical safety gates (10 domains including MARINE) prevent dangerous
  instructions from reaching learners** — critical rules cannot be bypassed by user claims,
  stated acknowledgments, or professional credentials.
- **Cultural sovereignty architecture protects Indigenous knowledge across all 4 traditions** —
  Level 4 sacred content (Cedar ceremonial carvings, First Salmon protocols, sweat lodge
  ceremonies) has no override path, no academic exception, and no community self-attestation
  bypass.

---

## Scan (2 minutes)

### What Is in the Pack

**Phase 1 modules (14 rooms, Phases 28-34)**

**Skill Hall Framework** — navigates all 18 rooms with tradition-aware routing.

**Physical Safety Warden** — 10 domains (food, plant, tool, medical, structural, fire,
chemical, animal, arctic-survival, marine), 3 modes (annotate/gate/redirect).

**Cultural Sovereignty Warden** — 4-level knowledge classification, OCAP/IQ/CARE/NISR
compliant.

**Northern Ways module** — IQ principles, OCAP framework, CARE principles, reference for
Anishinaabe, Haudenosaunee, Cree, Dene, Algonquin/Anishinabeg, Innu, Metis, and 4 Inuit
regional groups (Inuvialuit, Kitikmeot/Kivalliq/Qikiqtaaluk, Nunavik, Nunatsiavut).

**Canonical Works Library** — 12 Foxfire volumes and First Nations and Inuit sources,
creator-first links.

**Oral History Studio** — OHA, Smithsonian, IQ-Pilimmaksarniq, and Foxfire interview
methods.

**Heritage Book pipeline** — template, project builder, docx/pdf export with Inuktitut
syllabics.

Fourteen rooms organized by domain. Each room contains a room specification, safety
configuration, cultural sovereignty configuration, SUMO ontology mappings, and 2-3 Try
Sessions with step-by-step instruction. Three rooms are critical (safety gates are
non-overridable):

| Room | Domain | Critical |
|------|--------|---------|
| 01 | Building and Shelter | no |
| 02 | Fiber and Textile | no |
| 03 | Animals and Wildlife | no |
| 04 | Woodcraft and Tools | no |
| 05 | Food Preservation | **yes** |
| 06 | Music and Instruments | no |
| 07 | Metalwork and Smithing | no |
| 08 | Pottery and Clay | no |
| 09 | Plant Knowledge | **yes** |
| 10 | Community and Culture | no |
| 11 | Seasonal Living | no |
| 12 | History and Memory | no |
| 13 | Northern Watercraft | no |
| 14 | Arctic Living | **yes** |

**Phase 2 modules (4 rooms and extensions, Phases 35-39)**

**Trail Badge Engine** — 55 badges across 12 paths (cedar, salmon, weaving, shelter, fiber,
food, plant, tool, music, watercraft, heritage, neighbors), 4 tiers: Explorer, Apprentice,
Journeyman, Keeper. Keeper tier requires "Can You Teach It?" verification through
TeachItEvaluator.

**Practice Journal Engine** — tracks observation, practice, reflection, sketch, and teaching
entries per badge path.

**Salish Sea Ways module** — 40+ nations across British Columbia, Washington, Oregon, and
Alberta; watershed identity framework; cross-border sovereignty notes; potlatch historical
context.

**Marine Safety domain** — cold water, tidal current, vessel loading, and night navigation
rules extending Phase 1 Safety Warden to 10 domains.

**Pacific Northwest Coast rooms (15-18):**

| Room | Domain | Traditions |
|------|--------|-----------|
| 15 | Cedar Culture | Lekwungen, Musqueam, Squamish, Lil'wat |
| 16 | Salmon World | Saanich, Sts'ailes, and others |
| 17 | Salish Weaving | Coast Salish weaving nations |
| 18 | Village World | Village World, Neighbors Path |

**Reconnecting Descendant Pathway** — terminology guide, watershed investigation tools,
resource directory (Sixties Scoop Network, NICWA, tribal enrollment, cultural centers).

**SEL Mapping** — Neighbors Path to modern SEL frameworks (heritage-first, modern second).

**Badge Retrofit** — all 14 Phase 1 rooms now have badge definitions via existing Try
Sessions.

### Phase 2 Highlights

**Trail Badge System:** Learners earn Explorer, Apprentice, Journeyman, and Keeper badges
by completing practice journal entries (observation, practice, reflection, sketch, teaching).
Keeper tier requires demonstrating mastery through "Can You Teach It?" evaluation. Badge
paths cross tradition boundaries — the Shelter path spans log cabin (Room 01, Appalachian),
longhouse (Room 15, Lekwungen/Musqueam/Squamish), and igloo (Room 14, Inuit).

**Salish Sea Ways:** The PNW Coast module references 40+ nations across 4 provinces with
watershed identity framing. Potlatch is taught as a technology for community wealth
redistribution and relationship maintenance (Level 1-2 content) — ceremony protocols remain
Level 3-4 protected.

**Reconnecting Descendant Pathway:** For learners with Indigenous ancestry who were
disconnected from their heritage, the pathway provides terminology guidance, watershed
investigation tools, and connections to Sixties Scoop Network, NICWA, tribal enrollment
resources, and cultural centers — without pan-Indigenous generalization or unauthorized
ceremony content.

### Quick Start

Install the pack and navigate to Room 05 (Food Preservation) using the Skill Hall Framework:

```typescript
import { SkillHallFramework, SafetyWarden, CulturalSovereigntyWarden } from
  './heritage-skills-pack/skill-hall/framework.js';
import { RoomNumber, SafetyDomain, Tradition } from './heritage-skills-pack/shared/types.js';

// Construct the framework with both wardens
const framework = new SkillHallFramework(
  new SafetyWarden(),
  new CulturalSovereigntyWarden(),
);

// Navigate to Room 05 (Food Preservation — critical room)
const room = framework.getRoom(RoomNumber.FOOD);
console.log(room?.title);          // "Food and Preservation"
console.log(room?.isCritical);     // true
console.log(room?.safetyDomains);  // ['food']

// Get available sessions
console.log(room?.availableSessions.map(s => s.id));
// e.g. ['food-05-water-bath-canning', 'food-05-pemmican', 'food-05-fermented-foods']

// Start a session — runner enforces safety + cultural checks on every step
const session = /* load your TrySession from rooms/05-food-preservation/try-sessions/ */;
framework.registerSessions(RoomNumber.FOOD, [session]);
const runner = framework.startSession(session);

let result = runner.nextStep();
while (result !== null) {
  if (!result.canProceed) {
    // Safety gate fired — check result.safetyEvaluation
    console.log('BLOCKED:', result.warnings);
    // result.safetyEvaluation.annotations[0].isCritical === true for CRITICAL rules
    break;
  }
  console.log('Step OK:', result.step.instruction);
  result = runner.nextStep();
}
```

Direct safety warden usage (without the full framework):

```typescript
import { SafetyWarden } from './heritage-skills-pack/safety/warden.js';
import { SafetyDomain } from './heritage-skills-pack/shared/types.js';

const warden = new SafetyWarden();

// This triggers FOOD-001 (CRITICAL — botulism risk)
const result = warden.evaluate(
  'can low-acid green beans using a water bath canner',
  SafetyDomain.FOOD,
);

console.log(result.canProceed);                      // false
console.log(result.annotations[0].isCritical);       // true
console.log(result.annotations[0].message);          // "BOTULISM RISK: ..."
// result.level === SafetyLevel.REDIRECTED
// result.redirectTarget === 'https://nchfp.uga.edu/'
```

Cultural sovereignty classification:

```typescript
import { CulturalSovereigntyWarden } from './heritage-skills-pack/safety/cultural-warden.js';
import { Tradition } from './heritage-skills-pack/shared/types.js';

const warden = new CulturalSovereigntyWarden();

// Ceremonies domain — triggers Level 4 hard block
const result = warden.classify(
  'What ceremonies accompany building a birchbark canoe?',
  Tradition.FIRST_NATIONS,
  'ceremonies',
);

console.log(result.level);          // 4 (SACRED_CEREMONIAL)
console.log(result.action);         // 'block'
console.log(result.referralTarget); // undefined — structurally absent, not null
```

---

## Read (Full Documentation)

### Architecture Overview

The heritage-skills-pack is a TypeScript library structured as 6 skills and 5 agents wired
together through `chipset.yaml`. The chipset defines routing rules, evaluation gates, model
assignments, and the 18-room directory.

**6 skills and their model assignments:**

| Skill | Model | Module |
|-------|-------|--------|
| safety-warden | opus | `safety/warden.ts` |
| cultural-sovereignty-warden | opus | `safety/cultural-warden.ts` |
| northern-ways | sonnet | `northern-ways/index.ts` |
| canonical-works | sonnet | `canonical-works/index.ts` |
| skill-hall | sonnet | `skill-hall/framework.ts` |
| authoring-pipeline | haiku | `project-builder/workflow.ts` |

Safety-critical and cultural sovereignty components run on Opus. Skill hall navigation,
canonical works, and northern ways reference data run on Sonnet. The authoring pipeline
(Heritage Book creation and export) runs on Haiku.

**5 agents:**

| Agent | Model | Role |
|-------|-------|------|
| heritage-guide | opus | Primary learner-facing: room navigation, Try Sessions, safety + cultural enforcement |
| safety-auditor | opus | Independent physical safety auditor across 10 domains |
| cultural-auditor | opus | Cultural sovereignty classification, OCAP/IQ/CARE compliance |
| knowledge-curator | sonnet | Canonical works, bibliography, Fair Use notices |
| heritage-author | haiku | Heritage Book authoring, export, community review gates |

The heritage-guide agent is the integration point: every user query passes through the
physical-safety-check, cultural-sovereignty-check, and pan-indigenous-language-check
evaluation gates before any content is generated.

**4 evaluation gates:**

- `physical-safety-check` — fires before any content that could cause physical harm; CRITICAL
  rules block with `canProceed=false`, non-overridable by any acknowledgment
- `cultural-sovereignty-check` — fires before any First Nations or Inuit content; Level 4
  triggers HARD BLOCK with no override path
- `fair-use-check` — fires before any Foxfire or canonical works content; prevents verbatim
  reproduction, directs to creator-first purchase links
- `pan-indigenous-language-check` — fires on all generated content before delivery; rejects
  any response containing pan-Indigenous generalizations ("Native American tradition",
  "Indigenous peoples believed", etc.) and requires nation-specific rewrite

### Safety Architecture

The `SafetyWarden` class evaluates content against 10 physical safety domains using pattern-
matching rules loaded from JSON at construction time.

**10 safety domains:**

1. `food` — botulism, canning, preservation temperature
2. `plant` — plant identification, toxic species, foraging
3. `tool` — blade safety, sharp tools, woodworking
4. `medical` — self-treatment, medicinal preparations (redirects to professional care)
5. `structural` — load-bearing construction, structural integrity
6. `fire` — forge, kiln, open fire, indoor fire, CO risk
7. `chemical` — glaze materials, flux, solvents, silica dust
8. `animal` — handling, trapping, brain tanning
9. `arctic-survival` — igloo ventilation, CO prevention, ice travel, hypothermia
10. `marine` — cold water immersion, tidal currents, vessel loading, solo paddling, open-water
    crossings, night navigation. Triggered by Rooms 15-16 (Salish Sea watercraft content,
    reef net fishing) and any query involving Salish Sea water travel.

**3 enforcement modes:**

- `ANNOTATE` — inline safety note appended to the step; user can proceed. Used for tool
  handling reminders and general hazard awareness.
- `GATE` — explicit acknowledgment required before proceeding (`canProceed=false` until
  acknowledged). Used for forge lighting, kiln loading, structural construction.
- `REDIRECT` — content blocked; user redirected to a professional resource
  (`canProceed=false`, `redirectTarget` populated). Used for botulism-risk food processing
  and plant identification from description alone.

**CRITICAL rules:**

Rules with `annotation.isCritical === true` always produce `canProceed=false` regardless of
the mode level. They set `canOverride=false`. No stated acknowledgment, claimed credential,
or professional background overrides a CRITICAL rule. The warden evaluates content patterns,
not requester identity.

**Critical rooms (non-overridable gates):**

- Room 05 (Food Preservation): FOOD-001 CRITICAL — botulism risk from water bath canning of
  low-acid vegetables. Redirects to NCHFP (National Center for Home Food Preservation).
- Room 09 (Plant Knowledge): PLANT-001 CRITICAL — plant identification from description alone
  is structurally prohibited. In-person expert confirmation required.
- Room 14 (Arctic Living): ARCTIC-001 CRITICAL — igloo and enclosed shelter ventilation. CO
  poisoning prevention. Every enclosed shelter scenario requires an explicit ventilation note.
- Rooms 15-16 (Cedar Culture, Salmon World): MARINE-001 CRITICAL — cold water immersion. The
  1-10-1 rule (1 minute cold shock, 10 minutes swimming ability, 1 hour consciousness) is
  mandatory for any Salish Sea watercraft content. MARINE-003 CRITICAL — solo paddling
  requires a float plan. Historical tradition framing does not override this gate.

### Trail Badge System

55 badges across 12 paths and 4 tiers. Paths: cedar, salmon, weaving, shelter, fiber, food,
plant, tool, music, watercraft, heritage, neighbors. All Phase 1 rooms (01-14) are retrofitted
with badge definitions via Try Session mapping.

Badge tier progression:

- **Explorer:** Complete an observation journal entry for the skill.
- **Apprentice:** Complete practice and reflection entries (minimum 3 journal entries total).
- **Journeyman:** Demonstrate skill through a hands-on practice entry with documentation.
- **Keeper:** Pass "Can You Teach It?" evaluation — explain the skill to someone else and
  receive feedback through TeachItEvaluator. Pan-Indigenous generalizations in teaching
  content are detected and reject the Keeper award.

Cross-tradition paths: Badge paths intentionally cross tradition boundaries. The Shelter path
spans Appalachian log cabin construction (Room 01), Pacific Northwest Coast longhouse
(Room 15, Lekwungen/Musqueam/Squamish), and Inuit igloo geometry (Room 14) — each with
distinct nation-specific attribution. A learner earning all three Shelter badges develops
cross-tradition structural literacy without pan-Indigenous conflation.

### Reconnecting Descendant Pathway

For learners who identify as having Indigenous ancestry but were separated from their heritage
community (through adoption, relocation, Sixties Scoop, or other ruptures), the Reconnecting
Pathway provides:

- Terminology guide: nation-specific language with no pan-Indigenous generalizations
- Watershed investigation tools: starting points for tracing ancestral territory
- Resource directory: Sixties Scoop Network, National Indian Child Welfare Association
  (NICWA), tribal enrollment research guidance, cultural center connections
- Heritage Book "Reconnecting" template variant: homecoming journal structure

The pathway does not provide ceremony content, sacred knowledge, or community protocols —
those belong in community-led reconnection, not in an AI system. The pathway's role is to
provide tools and connections, not to substitute for community relationships.

### Cultural Sovereignty Architecture

The `CulturalSovereigntyWarden` classifies content into 4 levels and enforces hard-block
behavior for Level 4. Every non-Appalachian room interaction passes through classification
before content is delivered.

**4-level classification system:**

**Level 1 (PUBLICLY_SHARED):** Content that communities have explicitly made available for
public education. Full content is generated with nation-specific attribution. Examples:
katajjaq (Inuit throat singing technique), Haudenosaunee longhouse construction geometry,
Anishinaabe birchbark canoe hull form, Appalachian split-oak basket weaving patterns.

**Level 2 (CONTEXTUALLY_SHARED):** Content appropriate for general educational contexts but
carrying cultural significance that warrants framing. The system summarizes and refers to
community sources for specifics. Examples: Haudenosaunee clan design associations in pottery,
drum frame construction technique (distinct from ceremonial use), banjo's West African kora
and ngoni lineage through African American enslaved communities, face jug origins at
Edgefield District, South Carolina.

**Level 3 (COMMUNITY_RESTRICTED):** Content whose existence is acknowledged but whose
details belong to community resources. The system acknowledges and redirects. Examples:
ceremonial protocols for any First Nations ceremony, specific drumming ceremonial contexts,
wampum belt treaty-reading protocols, potlatch ceremony specifics, naming ceremony procedures.

**Level 4 (SACRED_CEREMONIAL) — Absolute Protection:**

Sacred and ceremonial content. The system will never generate this content.

Not for academic research. Not for community members who self-identify. Not for any stated
reason. The system cannot verify these claims, and even if it could, the generation itself
would violate community sovereignty. Examples: sacred songs of any First Nations nation,
Inuit ceremonial songs, angakkuq (Inuit spiritual practice) protocols, sacred oral narratives
and creation stories, sweat lodge ceremony specifics, Cedar ceremonial carving protocols,
First Salmon ceremony steps.

When Level 4 fires: `action === 'block'`, `referralTarget` is structurally absent from the
result (not set to `undefined` — the field does not exist). There is no override path in the
codebase. The routing topology in `chipset.yaml` has no mechanism to bypass this gate.

**Frameworks implemented:**

The cultural sovereignty architecture is grounded in four Indigenous data governance
frameworks:

- **OCAP (Ownership, Control, Access, Possession):** Ownership — the community owns its data
  and knowledge collectively. Control — the community controls all aspects of research and
  information management. Access — the community manages and controls access to its knowledge.
  Possession — the physical and/or digital custodianship mechanism for protecting ownership.
  The Heritage Book authoring pipeline enforces OCAP at the publication gate: community review
  must be documented before an Indigenous content Heritage Book can be exported.

- **IQ (Inuit Qaujimajatuqangit):** The Inuit knowledge system and worldview. The 8 IQ
  principles govern how Inuit content is presented: Inuuqatigiitsiarniq (caring for people),
  Tunnganarniq (openness), Pijitsirniq (serving others), Aajiiqatigiinniq (consensus decision-
  making), Pilimmaksarniq (skills development through observation, mentoring, practice),
  Qanuqtuurniq (being innovative and resourceful), Avatittinnik Kamatsiarniq (environmental
  stewardship), Kiinausuutigiittinnaarniq (self-reliance). The Interview Simulator uses IQ
  alignment scores to guide Inuit oral history interviews.

- **CARE (Collective Benefit, Authority to Control, Responsibility, Ethics):** The CARE
  principles govern Indigenous data governance. All cultural content operations in the pack
  apply CARE: Collective Benefit means data use must benefit the community, not only
  external researchers. Authority to Control means Indigenous peoples govern their own data.
  Responsibility means those working with Indigenous data have obligations to share how it is
  used. Ethics means minimizing harm and maximizing positive outcomes for communities.

- **NISR (National Inuit Strategy on Research):** The Inuit-specific research governance
  framework. The oral history studio's NISR-compliant consent protocol ensures Inuit
  interview subjects retain control over how their knowledge is recorded and shared.
  NISR alignment is checked in the Interview Simulator's evaluation of question appropriateness.

**Nation attribution requirement:**

All content in this pack uses nation-specific attribution. The CulturalSovereigntyWarden
includes an `enforceNationAttribution()` method that detects pan-Indigenous generalizations
("Native American", "Indigenous peoples", "Aboriginal", "all First Nations") and flags them
as violations requiring nation-specific rewrite. This check runs on all generated content
before delivery.

### SUMO Ontological Scaffold

The SUMO (Suggested Upper Merged Ontology) scaffold provides ontological grounding for
heritage skills. This enables formal reasoning about what kind of process a skill is and
how heritage domain concepts relate to established ontological categories.

**4 ontology files:**

- `shared/sumo/heritage-domain-ontology.kif` — SUO-KIF definitions for heritage domain
  concepts. Declares `HeritageSkill` as a subclass of both `IntentionalProcess` and
  `TraditionalProcess`. Defines heritage-specific synset IDs (heritage-NNNN-n) for concepts
  not in standard WordNet: pemmican, quillwork, qulliq, qamutik.

- `shared/sumo/sumo-mappings.json` — Maps all 18 rooms and their key concepts to SUMO
  process classes and KIF files. Every room in both phases has at least one SUMO mapping
  entry.

- `shared/sumo/ontological-bridges.json` — 5 ontological tension bridges where Indigenous
  relational ontology differs fundamentally from Western categorical ontology. The primary
  showcase is Room 13 (Northern Watercraft): Canoe-as-Artifact (SUMO: `Artifact`) versus
  Canoe-as-Relationship (Anishinaabe: the canoe as a living being whose spirit must be
  honored). The bridge documents the tension without forcing Indigenous concepts into
  Western categories.

- `shared/sumo/wordnet-bridges.json` — Maps heritage synset IDs to WordNet-compatible entries
  for cross-reference with the SUMO WordNet integration.

The SUMO browser overlay in the framework returns a hierarchy path for any session step that
has a `sumoMapping` field. Example: a step mapped to `Weaving` returns
`['Weaving', 'Making', 'IntentionalProcess', 'Process', 'Physical', 'Entity']`.

### Authoring Pipeline

The authoring pipeline covers the complete workflow from oral history planning to published
Heritage Book.

**Oral History Studio (`oral-history/`):** Two interview guide formats — Foxfire methodology
(Appalachian focus, 11 practices) and NISR-compliant methodology (Inuit focus, 12 practices
including Indigenous Protocols). The OHA (Oral History Association) practices are embedded
in both guides. IQ alignment is mapped: IQ-01 (Inuuqatigiitsiarniq) governs preparation,
IQ-02 (Tunnganarniq) governs relationship building, IQ-05 (Pilimmaksarniq) governs active
listening, IQ-04 (Aajiiqatigiinniq) governs review.

**Interview Simulator (`oral-history/simulator.ts`):** Runs practice interview sessions with
scoring. Each question asked by the learner is evaluated for cultural sovereignty compliance,
IQ alignment, consent protocol adherence, and OHA methodology. The simulator returns
`isAppropriate`, `culturalSovereigntyBlocked`, `iqAlignmentScore`, and detailed feedback.
CRITICAL guidance invokes Pilimmaksarniq (skills development) framing.

**Heritage Book Template (`project-builder/template.ts`):** 6 chapter templates: overview,
skills-documentation, interview-transcript, community-attribution, historical-context,
bibliography. Interview transcripts require `ocapReviewRequired: true` — the OCAP Access
principle mandates knowledge holder review before publication.

**Project Builder Workflow (`project-builder/workflow.ts`):** 5-stage workflow — Research,
Documentation, Review, Publication, Archive. The COMMUNITY_REVIEW_GATE fires at the
Publication stage transition: for any First Nations, Inuit, or cross-tradition project,
`communityReviewDocumented` must be set to `true` before the book can be exported.
This gate has `canBeWaived=false`.

**Export Pipeline (`project-builder/export.ts`):** Exports Heritage Books to docx and pdf
formats. Validates cultural sovereignty statement, title, chapter presence, and territorial
acknowledgment before export. Syllabics (Inuktitut) are detected and flagged in validation —
exports containing syllabics trigger a documentation note about font requirements.

### File Structure

```
heritage-skills-pack/
  chipset.yaml                    # Chipset configuration — skills, agents, routing, gates
  README.md                       # This file
  CULTURAL-SOVEREIGNTY-POLICY.md  # Public cultural sovereignty policy

  shared/
    types.ts                      # Phase 1 shared TypeScript interfaces and enums
    phase2-types.ts               # Phase 2 types (TraditionV2, badge types, marine types)
    constants.ts                  # Room directory, tradition mappings, SUMO file mappings
    schemas.ts                    # Zod validation schemas
    safety-rules/                 # 10 JSON rule files (food-safety.json, marine-safety.json, etc.)
    sumo/                         # SUMO ontology files (heritage-domain-ontology.kif, etc.)

  safety/
    warden.ts                     # SafetyWarden (10 domains, 3 modes)
    cultural-warden.ts            # CulturalSovereigntyWarden (4 levels, hard block)
    warden.test.ts
    cultural-warden.test.ts

  northern-ways/
    index.ts                      # IQ principles, OCAP, CARE, NISR, nations reference
    data/                         # JSON data (iq-principles.json, nations, seasonal rounds)

  salish-sea-ways/
    index.ts                      # 40+ nations, watershed framework, potlatch context
    data/                         # nations.json, watershed-territories.json

  canonical-works/
    index.ts                      # Canonical works library and bibliography engine
    data/                         # JSON catalogs (foxfire-catalog.json, fair-use-notices/)

  skill-hall/
    framework.ts                  # SkillHallFramework, SessionRunner, ProgressTracker
    framework.test.ts
    rooms/                        # 18 rooms
      01-building-shelter/        # Appalachian, Anishinaabe, Inuit
        room-spec.json
        safety-config.json
        cultural-config.json
        sumo-mappings.json
        try-sessions/
      ...                         # rooms 02-14 (Phase 1)
      15-cedar-culture/           # Lekwungen, Musqueam, Squamish, Lil'wat
      16-salmon-world/            # Saanich, Sts'ailes, and others
      17-salish-weaving/          # Coast Salish weaving nations
      18-village-world/           # Village World, Neighbors Path

  badge-engine/
    engine.ts                     # BadgeEngine, PracticeJournalEngine, TeachItEvaluator
    badge-definitions.json        # 55 badges, 12 paths, 4 tiers

  oral-history/
    index.ts                      # OralHistoryStudio (interview guides)
    simulator.ts                  # InterviewSimulator, FeedbackEngine
    data/                         # scenarios.json, iq-principles.json

  project-builder/
    template.ts                   # HeritageBookTemplate, chapter templates
    workflow.ts                   # ProjectBuilderWorkflow (5-stage pipeline)
    export.ts                     # DocxExporter, PdfExporter, ExportValidator

  reconnecting-pathway/
    index.ts                      # Terminology guide, watershed tools, resource directory
    data/                         # resources.json, terminology.json

  sel-mapping/
    index.ts                      # Neighbors Path SEL alignment

  tests/
    integration/
      integration.test.ts           # Phase 1: cross-module safety tests
      safety-critical.test.ts       # Phase 1: safety-critical scenarios
      cultural-sovereignty.test.ts  # Phase 1: cultural sovereignty end-to-end
      core-functionality.test.ts    # Phase 1: core functionality
      fair-use.test.ts              # Phase 1: Fair Use compliance
      phase2-integration.test.ts    # Phase 2: cross-module integration (12 tests)
      marine-safety.test.ts         # Phase 2: marine safety domain (10 tests)
      pnw-sovereignty.test.ts       # Phase 2: PNW cultural sovereignty (14 tests)
      badge-engine.test.ts          # Phase 2: badge engine and TeachItEvaluator (16 tests)
      monotonicity.test.ts          # Phase 2: safety monotonicity MONO-01 through MONO-10
      pan-indigenous-scan.test.ts   # Phase 2: language scan across all 18 rooms (6 tests)
    cultural-audit/
      red-team.test.ts              # Phase 1: 18 adversarial red-team scenarios
      audit-report.md               # Phase 1: CLEARED FOR DEPLOYMENT
      phase2-red-team.test.ts       # Phase 2: 18 adversarial red-team scenarios
      phase2-audit-report.md        # Phase 2: CLEARED FOR DEPLOYMENT
```

### Running Tests

Run Phase 1 integration tests:

```bash
npx vitest run heritage-skills-pack/tests/integration/integration.test.ts \
  heritage-skills-pack/tests/integration/safety-critical.test.ts \
  heritage-skills-pack/tests/integration/cultural-sovereignty.test.ts \
  heritage-skills-pack/tests/integration/core-functionality.test.ts \
  heritage-skills-pack/tests/integration/fair-use.test.ts
```

Run Phase 2 integration tests:

```bash
npx vitest run heritage-skills-pack/tests/integration/phase2-integration.test.ts \
  heritage-skills-pack/tests/integration/marine-safety.test.ts \
  heritage-skills-pack/tests/integration/pnw-sovereignty.test.ts \
  heritage-skills-pack/tests/integration/badge-engine.test.ts \
  heritage-skills-pack/tests/integration/monotonicity.test.ts \
  heritage-skills-pack/tests/integration/pan-indigenous-scan.test.ts
```

Run all adversarial red-team audits:

```bash
npx vitest run heritage-skills-pack/tests/cultural-audit/
```

Run full test suite:

```bash
npm test
```

**Test count:**

- 1,151+ unit tests (Phases 28-38, covering all rooms, wardens, badge engine, salish-sea-ways,
  reconnecting pathway, sel-mapping, northern ways, canonical works, oral history studio,
  interview simulator, heritage book template, project builder workflow, and export pipeline)
- Phase 1 integration tests (Phase 34): 68 tests across 5 files
- Phase 2 integration tests (Phase 39): 68 tests across 6 files
- Phase 1 red-team scenarios (Phase 34): 18 tests
- Phase 2 red-team scenarios (Phase 39): 18 tests
- **Total integration + red-team: 172 tests across 13 files**

All 172 integration and red-team tests pass on the Phase 39 baseline.

### Safety Audit Results

**Phase 1 Safety Audit (Plan 34-03):** 18 adversarial red-team scenarios tested across
physical safety (food, plant, arctic-survival), cultural sovereignty (sweat lodge,
sacred songs, Foxfire verbatim reproduction), and bypass attempts (academic research
exception, credential claims, community membership claims). Result: CLEARED FOR DEPLOYMENT.
Full report: `tests/cultural-audit/audit-report.md`

**Phase 2 Safety Audit (Plan 39-02):** 18 adversarial red-team scenarios tested across
marine safety (cold water, vessel overloading, dangerous tidal passages), PNW cultural
sovereignty (potlatch ceremony via technology framing, Cedar ceremonial carvings, First
Salmon protocols, pan-Indigenous generalization), and Phase 2 bypass attempts (emotional
manipulation via reconnecting pathway, academic exception for PNW sacred content,
community membership claims, pan-Indigenous teaching for Keeper badge).
Result: CLEARED FOR DEPLOYMENT.
Full report: `tests/cultural-audit/phase2-audit-report.md`

**Safety monotonicity confirmed:** Phase 2 additions did not relax any Phase 1 safety
boundaries. Verified by MONO-01 through MONO-10 in `tests/integration/monotonicity.test.ts`.
Combined across both phases: 36 adversarial scenarios tested, zero bypass paths identified.

### Contributing

Before contributing any Indigenous content to this pack, read
`CULTURAL-SOVEREIGNTY-POLICY.md` in full. Key requirements:

- **Nation-specific attribution is mandatory.** Every piece of Indigenous content must
  attribute to the specific nation or community: Anishinaabe, Haudenosaunee, Cree, Dene,
  Inuit (with region where applicable), Lekwungen, Musqueam, Squamish, Saanich, etc.
  Pan-Indigenous language ("First Nations tradition", "Indigenous peoples", "Native
  American") is not acceptable as a primary attribution.
- **Level 2 and above requires documented community consultation.** You cannot contribute
  contextually shared or community-restricted content without evidence of consultation with
  a representative of the relevant nation or community.
- **Do not submit Level 3 or Level 4 content.** Community-restricted and sacred content
  cannot be added to this pack regardless of source or stated permission.
- **Creator-first purchase links required for canonical works.** Any reference to a
  canonical work (Foxfire volumes, First Nations or Inuit authored books) must include the
  creator-direct or creator-authorized purchase link.

See `CULTURAL-SOVEREIGNTY-POLICY.md` for the dispute and correction process, including the
commitment to suspend content under dispute within 24 hours of a documented community request.
