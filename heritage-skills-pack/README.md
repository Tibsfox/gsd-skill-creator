# Heritage Skills Educational Pack — Phase 1

> A living skills educational system covering Appalachian, First Nations (Anishinaabe, Cree,
> Haudenosaunee, and others), and Inuit traditions. Built with physical safety enforcement,
> cultural sovereignty architecture, SUMO ontological scaffold, and a Heritage Book authoring
> pipeline.

---

## Glance (30 seconds)

- **14-room educational pack across 3 traditions:** Appalachian, First Nations (Anishinaabe,
  Haudenosaunee, Cree, Dene, Innu, and others), and Inuit — 14 skill rooms from building and
  shelter to oral history and watercraft.
- **Hard-enforced physical safety gates prevent dangerous instructions:** Rooms 05 (Food
  Preservation), 09 (Plant Knowledge), and 14 (Arctic Living) have non-overridable CRITICAL
  safety rules. Botulism risk, plant misidentification, and CO poisoning cannot be bypassed by
  any stated acknowledgment or credential.
- **Cultural sovereignty architecture protects Indigenous knowledge:** A 4-level classification
  system enforces OCAP (Ownership, Control, Access, Possession) and IQ (Inuit Qaujimajatuqangit)
  principles. Level 4 sacred and ceremonial content has no override path — not for academic
  research, not for stated community membership, not for any reason.

---

## Scan (2 minutes)

### What Is in Phase 1

**Skill Hall (14 rooms, Phases 29-32)**

Fourteen rooms organized by domain. Each room contains a room specification, safety
configuration, cultural sovereignty configuration, SUMO ontology mappings, and 2-3 Try Sessions
with step-by-step instruction. Three rooms are critical (safety gates are non-overridable):

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

**Physical Safety Warden (Phase 29)**

9-domain content safety engine: food, plant, tool, medical, structural, fire, chemical,
animal, arctic-survival. Three enforcement modes: ANNOTATE (inline note, can proceed), GATE
(explicit acknowledgment required), REDIRECT (blocked, user sent to professional resource).
CRITICAL rules always produce `canProceed=false` regardless of mode.

**Cultural Sovereignty Warden (Phase 29)**

4-level classification enforcing OCAP, IQ, CARE (Collective Benefit, Authority to Control,
Responsibility, Ethics), and NISR (National Inuit Strategy on Research) compliance. Every
First Nations and Inuit content interaction passes through classification before any content
is generated. Level 4 (SACRED_CEREMONIAL) is a structural hard block with no override path.

**Northern Ways (Phase 29)**

Reference module covering 10 First Nations and Inuit nations and regional groups: Anishinaabe,
Haudenosaunee, Cree, Dene, Algonquin/Anishinabeg, Innu, Metis, and 4 Inuit regional groups
(Inuvialuit, Kitikmeot/Kivalliq/Qikiqtaaluk, Nunavik, Nunatsiavut). Includes IQ principles
(8 Inuit Qaujimajatuqangit principles), OCAP framework, CARE principles, NISR methodology,
and seasonal rounds data.

**Canonical Works Library and Bibliography Engine (Phase 29)**

Creator-first canonical works catalog covering Foxfire volumes, First Nations authors, and
Inuit authors. Bibliography engine generates Chicago, APA, and MLA citations with creator-
direct purchase links. Fair Use notices prevent verbatim reproduction of copyrighted works.

**Oral History Studio and Interview Simulator (Phase 33)**

Oral History Studio provides interview guides based on OHA (Oral History Association) and
IQ methodology for community-appropriate interviewing. Interview Simulator provides practice
scenarios with real-time cultural sovereignty feedback, IQ alignment guidance, and consent
protocol enforcement. The simulator counts cultural sovereignty blocks separately from
general violations.

**Heritage Book Authoring Pipeline (Phase 33)**

Heritage Book Template with 6 chapter types, community review gates for Indigenous content
(OCAP Ownership principle: knowledge holders review before publication), and Export Pipeline
to docx and pdf formats with Inuktitut syllabics support and cultural sovereignty validation
on export.

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

### Phase 2 Preview

Phase 2 (Phases 35-39) adds Pacific Northwest Coast as the fourth tradition, covering Haida,
Coast Salish, Kwakwaka'wakw, and Tlingit heritage skills across Rooms 15-21. Phase 2 also
introduces the Trail Badge progression system (milestone-based skill certification), the
copper and silver metalwork module (Room 07 extension), potlatch cultural context at Level 3,
and the Phase 2 Heritage Book template with expanded cross-tradition comparison chapters. The
README for Phase 2 will be produced at Phase 39.

---

## Read (Full Documentation)

### Architecture Overview

The heritage-skills-pack is a TypeScript library structured as 6 skills and 5 agents wired
together through `chipset.yaml`. The chipset defines routing rules, evaluation gates, model
assignments, and the 14-room directory.

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
| safety-auditor | opus | Independent physical safety auditor across 9 domains |
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

The `SafetyWarden` class evaluates content against 9 physical safety domains using pattern-
matching rules loaded from JSON at construction time.

**9 safety domains:**

1. `food` — botulism, canning, preservation temperature
2. `plant` — plant identification, toxic species, foraging
3. `tool` — blade safety, sharp tools, woodworking
4. `medical` — self-treatment, medicinal preparations (redirects to professional care)
5. `structural` — load-bearing construction, structural integrity
6. `fire` — forge, kiln, open fire, indoor fire, CO risk
7. `chemical` — glaze materials, flux, solvents, silica dust
8. `animal` — handling, trapping, brain tanning
9. `arctic-survival` — igloo ventilation, CO prevention, ice travel, hypothermia

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
and creation stories, sweat lodge ceremony specifics.

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

- `shared/sumo/sumo-mappings.json` — Maps all 14 rooms and their key concepts to SUMO
  process classes and KIF files. Every room in Phase 1 has at least one SUMO mapping entry.

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
    types.ts                      # All shared TypeScript interfaces and enums
    constants.ts                  # Room directory, tradition mappings, SUMO file mappings
    schemas.ts                    # Zod validation schemas
    safety-rules/                 # 9 JSON rule files (food-safety.json, etc.)
    sumo/                         # SUMO ontology files (heritage-domain-ontology.kif, etc.)

  safety/
    warden.ts                     # PhysicalSafetyWarden (9 domains, 3 modes)
    cultural-warden.ts            # CulturalSovereigntyWarden (4 levels, hard block)
    warden.test.ts
    cultural-warden.test.ts

  northern-ways/
    index.ts                      # IQ principles, OCAP, CARE, NISR, nations reference
    data/                         # JSON data (iq-principles.json, nations, seasonal rounds)

  canonical-works/
    index.ts                      # Canonical works library and bibliography engine
    data/                         # JSON catalogs (foxfire-catalog.json, fair-use-notices/)

  skill-hall/
    framework.ts                  # SkillHallFramework, SessionRunner, ProgressTracker
    framework.test.ts
    rooms/                        # 14 rooms (01-building-shelter/ through 14-arctic-living/)
      01-building-shelter/
        room-spec.json
        safety-config.json
        cultural-config.json
        sumo-mappings.json
        try-sessions/
      ...
      14-arctic-living/

  oral-history/
    index.ts                      # OralHistoryStudio (interview guides)
    simulator.ts                  # InterviewSimulator, FeedbackEngine
    data/                         # scenarios.json, iq-principles.json

  project-builder/
    template.ts                   # HeritageBookTemplate, chapter templates
    workflow.ts                   # ProjectBuilderWorkflow (5-stage pipeline)
    export.ts                     # DocxExporter, PdfExporter, ExportValidator

  tests/
    integration/                  # 68 integration tests (Phase 34)
      cross-module-safety.test.ts
      cultural-sovereignty-e2e.test.ts
      export-verification.test.ts
      sumo-consistency.test.ts
      fair-use-compliance.test.ts
    cultural-audit/
      red-team.test.ts            # 18 adversarial red-team scenarios
      audit-report.md             # Final Verdict: CLEARED FOR DEPLOYMENT
```

### Running Tests

```bash
# Full test suite
npm test

# Heritage pack only
npx vitest run heritage-skills-pack/

# Integration tests only
npx vitest run heritage-skills-pack/tests/integration/

# Red-team safety audit
npx vitest run heritage-skills-pack/tests/cultural-audit/red-team.test.ts
```

**Test count:**

- 1,151 unit tests (Phases 28-33, covering all rooms, wardens, northern ways, canonical
  works, oral history studio, interview simulator, heritage book template, project builder
  workflow, and export pipeline)
- 68 integration tests (Phase 34, covering cross-module safety, cultural sovereignty end-to-
  end, export verification, SUMO consistency, and Fair Use compliance)
- **Total: 1,219 tests**

All 1,219 tests pass on the Phase 34 baseline.

### Safety Audit Result

18 adversarial red-team scenarios were executed against the heritage-skills-pack v2.0.0
Phase 1 safety and cultural sovereignty enforcement modules. All 18 scenarios passed.

**Scenario categories:**

- Physical safety (RT-01 through RT-06): botulism risk water bath canning, plant
  identification, igloo ventilation, pemmican fat temperature, indoor forge, pokeweed
- Cultural sovereignty (RT-07 through RT-14): sweat lodge ceremony request, Foxfire full-text
  reproduction, sacred Cree songs, pan-Indigenous plant medicine framing, Heritage Book about
  Cherokee medicine, pan-Indigenous spirituality request, birchbark canoe ceremonies, Inuit
  creation story summary
- Bypass attempts (RT-15 through RT-18): "I understand the risks" override attempt, academic
  research Level 4 exception claim, botanist credential claim, Cree community membership claim

**Result:** All 18 scenarios blocked correctly. No bypass paths identified. Physical safety
CRITICAL gates held under all adversarial inputs. Cultural sovereignty Level 4 hard blocks
held under academic framing, professional credentials, and community membership claims.

**CLEARED FOR DEPLOYMENT** — see `tests/cultural-audit/audit-report.md` for the full report.

### Contributing

Before contributing any Indigenous content to this pack, read
`CULTURAL-SOVEREIGNTY-POLICY.md` in full. Key requirements:

- **Nation-specific attribution is mandatory.** Every piece of Indigenous content must
  attribute to the specific nation or community: Anishinaabe, Haudenosaunee, Cree, Dene,
  Inuit (with region where applicable), etc. Pan-Indigenous language ("First Nations
  tradition", "Indigenous peoples", "Native American") is not acceptable as a primary
  attribution.
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
