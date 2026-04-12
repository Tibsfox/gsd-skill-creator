---
name: mind-body-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/mind-body-department/README.md
description: >
  Coordinated mind-body department — seven named agents, six knowledge
  skills spanning eight practice wings, three teams. Forked from the
  department template pattern first instantiated by math-department.
  Lineage-respectful and non-sectarian in framing, safety-first in
  posture, and the largest department in the college structure by
  wing count.
superseded_by: null
---

# Mind-Body Department

## 1. What is the Mind-Body Department?

The Mind-Body Department chipset is a coordinated set of reasoning agents,
domain skills, and pre-composed teams that together provide structured
mind-body support across eight distinct practice wings: breath, meditation,
yoga, Pilates, martial arts, tai chi, qigong, and somatics. It is a direct
instantiation of the "department template pattern" established by the math
department: a router-topology architecture in which a single chair agent
classifies incoming queries and dispatches them to named specialists whose
work products are persisted as Grove records linked to the college concept
graph.

Where the math department's specialists are named after historical
mathematicians (Euclid for proof, Gauss for computation, Hypatia as chair),
the mind-body department is named after historical figures whose lives and
work defined the practice wings the department teaches: B.K.S. Iyengar for the
chair (because he taught yoga as a craft with alignment precision and a
prop-based staged progression, and his method is where body-awareness and
safety posture are most explicit), Moshé Feldenkrais for somatic learning,
Jon Kabat-Zinn for clinical mindfulness, Joseph Pilates for Contrology,
Dōgen Zenji for Sōtō Zen, Yang Jwing-Ming for Chinese internal arts and
traditional martial scholarship, and Thich Nhat Hanh for engaged mindfulness
and pedagogy.

Mind-body is the largest department in the college by wing count — eight
wings covered by six skills. The 8-to-6 packing is deliberate: several skills
carry more than one wing, and the coverage is tracked explicitly in the
chipset configuration so no wing is orphaned.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/mind-body-department .claude/chipsets/mind-body-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query. Iyengar (the router agent) classifies the query along four
dimensions — practice tradition, user level, purpose, and safety risk — and
dispatches to the appropriate specialist agent. No explicit activation command
is needed; the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/mind-body-department/chipset.yaml', 'utf8')).name)"
# Expected output: mind-body-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring
judgment under ambiguity — classification, somatic diagnosis, clinical
translation), four on Sonnet (for framework-driven method-specific work).

| Name              | Historical Figure     | Role                                                                      | Model  | Tools                         |
|-------------------|-----------------------|---------------------------------------------------------------------------|--------|-------------------------------|
| iyengar           | B.K.S. Iyengar        | Department chair — classification, routing, synthesis, safety enforcement, Iyengar-lineage yoga voice | opus   | Read, Glob, Grep, Bash, Write |
| feldenkrais       | Moshé Feldenkrais     | Somatic learning specialist — ATM, FI, nervous-system-first learning     | opus   | Read, Grep, Write             |
| kabat-zinn        | Jon Kabat-Zinn        | Clinical mindfulness specialist — MBSR, secular translation, research-honest voice | opus   | Read, Grep, Write             |
| pilates           | Joseph Pilates        | Classical Pilates specialist — Contrology mat and apparatus, six principles | sonnet | Read, Grep, Write             |
| dogen             | Eihei Dōgen           | Sōtō Zen specialist — zazen, shikantaza, Fukanzazengi and Shōbōgenzō     | sonnet | Read, Grep, Write             |
| yang              | Yang Jwing-Ming       | Internal arts and martial scholar — tai chi, qigong, Chinese martial arts | sonnet | Read, Grep, Write             |
| thich-nhat-hanh   | Thich Nhat Hanh       | Engaged mindfulness and pedagogy — Plum Village voice, gathas, daily-life practice | sonnet | Read, Write                   |

Iyengar is the CAPCOM (single point of contact for the user). All other agents
receive dispatched subtasks and return results through Iyengar.

The chipset documentation on Thich Nhat Hanh is worth naming explicitly:
he was added as the pedagogy specialist in place of another modern
mindfulness teacher that was originally considered. Thich Nhat Hanh is the
stronger pick because his lineage is intact (a full Vietnamese Zen monastic
lineage with a living community at Plum Village), his teaching voice bridges
classical and accessible registers, and his work on engaged Buddhism gives
the department a real engagement with the ethical and socially-aware
dimension of practice. The decision to use him was made explicitly.

## 4. Skill Inventory

Six skills cover eight wings. Several skills cover more than one wing.

| Skill                                       | Wings Covered              | Trigger Patterns                                                         | Agent Affinity                                 |
|---------------------------------------------|----------------------------|--------------------------------------------------------------------------|------------------------------------------------|
| breath-and-meditation-foundations           | breath, meditation         | breath, pranayama, meditation, zazen, MBSR, mindfulness, sit              | kabat-zinn, dogen, thich-nhat-hanh, iyengar    |
| yoga-practice-and-alignment                 | yoga                       | yoga, asana, alignment, pose, Iyengar, Ashtanga, prop                     | iyengar, thich-nhat-hanh, kabat-zinn           |
| somatic-movement-pilates-feldenkrais        | pilates, somatics          | Pilates, Contrology, reformer, Feldenkrais, ATM, somatic, core, rehab    | pilates, feldenkrais, iyengar                  |
| internal-arts-tai-chi-qigong                | tai-chi, qigong            | tai chi, qigong, Ba Duan Jin, zhan zhuang, internal arts                  | yang, iyengar, feldenkrais                     |
| martial-arts-body-discipline                | martial-arts               | martial arts, judo, BJJ, karate, aikido, boxing, muay thai, kendo         | yang, feldenkrais, iyengar                     |
| contemplative-traditions-comparative        | all 8 (synthesis skill)    | comparative, tradition, lineage, secular vs religious, which practice    | dogen, thich-nhat-hanh, kabat-zinn, iyengar    |

## 5. Eight-Wing Coverage — Explicit Mapping

This department's most distinctive structural feature is the 8-to-6 wing-to-skill
packing. The coverage is enforced explicitly. No wing is orphaned.

| Wing           | Covered By                                                   | Lineage Root                                                                 |
|----------------|--------------------------------------------------------------|------------------------------------------------------------------------------|
| breath         | breath-and-meditation-foundations, contemplative-traditions-comparative | Patanjali's *Yoga Sutras* via Krishnamacharya and Iyengar                   |
| meditation     | breath-and-meditation-foundations, contemplative-traditions-comparative | Dōgen's *Fukanzazengi* (Sōtō) and Kabat-Zinn's MBSR                         |
| yoga           | yoga-practice-and-alignment, contemplative-traditions-comparative | Krishnamacharya → Iyengar with cross-lineage notes                         |
| pilates        | somatic-movement-pilates-feldenkrais, contemplative-traditions-comparative | Joseph Pilates's Contrology and the Elders                                 |
| martial arts   | martial-arts-body-discipline, contemplative-traditions-comparative | Kano judo, koryū jiu-jitsu, Shaolin internal and external, Western boxing and wrestling |
| tai chi        | internal-arts-tai-chi-qigong, contemplative-traditions-comparative | Chen village origin, Yang Luchan lineage, YMAA transmission                 |
| qigong         | internal-arts-tai-chi-qigong, contemplative-traditions-comparative | Daoist yangsheng, Buddhist Yi Jin Jing, Ba Duan Jin standardization         |
| somatics       | somatic-movement-pilates-feldenkrais, contemplative-traditions-comparative | Moshé Feldenkrais (primary), Alexander, Hanna, Body-Mind Centering          |

Each wing is covered by at least two skills — a primary specialist skill and
the comparative synthesis skill. The comparative skill is the "atlas" skill:
it provides landscape-level framing for users whose question spans more than
one tradition or who need routing help before any practice is prescribed.

## 6. Team Configurations

Three teams cover the three most common mind-body query shapes.

| Team                        | Agents                                                         | Use When                                                                |
|-----------------------------|----------------------------------------------------------------|-------------------------------------------------------------------------|
| mind-body-analysis-team     | iyengar, feldenkrais, kabat-zinn, pilates, dogen, yang, thich-nhat-hanh | Multi-tradition, multi-wing, comparative, or full-analysis requests     |
| mind-body-workshop-team     | iyengar, dogen, kabat-zinn, thich-nhat-hanh                    | Contemplative-depth questions — meditation, breath, presence, attention |
| mind-body-practice-team     | iyengar, feldenkrais, pilates, yang                            | Body-centered program design, form diagnosis, rehab-adjacent body work  |

**mind-body-analysis-team** is the full department — seven agents, all eight
wings. Used for multi-tradition comparative questions and full-analysis
requests.

**mind-body-workshop-team** is the contemplative-side four-agent team. It runs
the chair and the three principal contemplative voices (Sōtō classical,
MBSR clinical, Plum Village engaged) on a single focused question and produces
a multi-voice synthesis that preserves lineage distinctions.

**mind-body-practice-team** is the body-side four-agent team. Chair plus the
three body-method specialists (Feldenkrais, Pilates, Yang) in a pipeline
optimized for program design and form diagnosis.

## 7. Grove Record Types

All department work products are persisted as Grove records under the
`mind-body-department` namespace. Five record types are defined.

| Record Type          | Produced By                              | Key Fields                                                                          |
|----------------------|------------------------------------------|-------------------------------------------------------------------------------------|
| MindBodyAnalysis     | feldenkrais, pilates, yang, iyengar     | Somatic diagnosis, form diagnosis, tradition classification, safety triage          |
| MindBodyPractice     | all specialists                         | Method, lineage, session plan, contraindications, referrals, concept IDs            |
| MindBodyReview       | iyengar, thich-nhat-hanh                | Review of an existing practice plan, form, or program                              |
| MindBodyExplanation  | thich-nhat-hanh, kabat-zinn, iyengar   | Teaching artifact at specified audience level in specified tradition voice          |
| MindBodySession      | iyengar                                 | Session log, classification, safety notes, work product links, timestamps          |

Records are content-addressed and immutable once written. MindBodySession
records link all work products from a single interaction, providing an audit
trail from query to result — including the safety-triage path when a halt
occurred.

## 8. Lineage Respect and Non-Sectarian Framing

This department teaches practices from many living traditions. Some are
religious (Sōtō Zen, classical yoga, engaged Buddhism, Daoist internal
alchemy). Some are explicitly secular (MBSR, Pilates Contrology, modern
Feldenkrais somatic education). Some are martial traditions with complex
cultural histories (judo, BJJ, karate, aikido, Muay Thai, boxing). The
department's framing rule is:

- **Every practice the department teaches has a real lineage, which is named.**
  We do not present practices as free-floating techniques.
- **Every practice is presented inside a tradition-respectful voice.**
  Iyengar's asanas in the Iyengar voice. Dōgen's zazen in Dōgen's voice.
  MBSR in Kabat-Zinn's voice. Plum Village engaged mindfulness in Thich Nhat
  Hanh's voice. Tai chi in Yang Jwing-Ming's YMAA voice.
- **Users who arrive inside a tradition are served inside that tradition.**
  A practicing Christian is not given Buddhist vocabulary unless they ask.
  A Sōtō practitioner does not receive MBSR translation. A lineage-holder
  receives lineage-level response.
- **Users who arrive secular are not pushed into religious vocabulary.**
  MBSR and Plum Village's informal practice are the primary secular
  translation paths.
- **The metaphysical claims of each tradition are reported as that tradition's
  claim, not as the department's claim.** We do not teach that kundalini
  rises or that the Dao is ineffable as if these are departmental facts. We
  teach what each tradition teaches, in its own voice, inside its own frame.
- **Genuine disagreements between traditions are not flattened into pseudo-
  consensus.** The comparative skill exists to make the disagreements visible,
  not to erase them.
- **The department chipset is framed as pedagogical integration, not sectarian
  endorsement.** We teach many practices; we endorse none of them over the
  others.

This framing is what lets a single chipset serve a clinical psychiatrist, a
Sōtō monk, an Iyengar-lineage yoga teacher, an MBSR graduate, a Plum Village
practitioner, a Chen-lineage tai chi student, a BJJ black belt, and a
secular skeptic from the same set of agents without betraying any of them.

## 9. Safety Posture — The Non-Negotiable Rules

Mind-body practices have real injury risk. Unlike many academic departments,
a bad recommendation from the mind-body department can produce physical
injury, psychological harm, or delayed clinical care. The safety posture is
therefore non-negotiable and is enforced by Iyengar as the CAPCOM gate.

### 9.1 Main Injury Classes

- **Yoga injuries.** Low back from forward-folding wrong. Knees from forced
  lotus. Neck and cervical spine from unsupported shoulderstand and headstand.
  Shoulders and wrists from arm balances without preparation. Rare but
  documented stroke and vascular events from aggressive inversions.
- **Pilates injuries.** Spinal flexion loading in diagnosed osteoporosis.
  Neck strain from incorrect Hundred posture. Low back strain from
  unsupported Roll Up or Teaser.
- **Martial arts injuries.** Head impact in striking sports (boxing, Muay
  Thai). Joint injuries in grappling (judo, BJJ). Concussion cumulative risk.
- **Tai chi injuries.** Knee pain from bad stance alignment. Falls during
  weight-shifts in older users.
- **Breath practice injuries.** Blackout from unsupervised retention.
  Cardiovascular stress from kapalabhati and bhastrika in contraindicated
  populations. Hyperventilation and tingling from over-breathing.
- **Meditation injuries.** Trauma activation, panic, dissociation, "dark
  night" phenomenology mistaken for or triggering clinical depression. Not
  all meditation is appropriate for all people at all times.

### 9.2 Routing Rules

- Any user reporting acute injury → halt practice advice; medical referral.
- Any user reporting acute psychological distress, panic, or dissociation
  during practice → halt; trauma-informed clinical referral.
- Any user with diagnosed osteoporosis, uncontrolled hypertension, glaucoma,
  cardiovascular disease, epilepsy, recent surgery, or pregnancy past the
  first trimester → modified recommendations only, with appropriate specialist
  referral (prenatal yoga teacher, post-rehab Pilates specialist, etc.).
- Any user asking for a cure of a named medical or psychiatric condition →
  halt the cure claim; offer adjunctive framing only if safe; route to
  medical care.
- Any user reporting suspected abusive teacher or unhealthy lineage power
  dynamic → careful response with external accountability resources.
- Any user asking about "no-touch knockouts," "ki blasts," or similar
  mythology → honest correction, protecting the credibility of legitimate
  traditions.

### 9.3 Hard Refusals

The department will not:

- Promise any medical cure.
- Teach unsupervised breath retention past 1:2 ratio.
- Teach kapalabhati or bhastrika to contraindicated populations.
- Teach headstand or shoulderstand to beginners without trained teacher
  preparation.
- Position meditation as a substitute for trauma-informed clinical care.
- Endorse no-contact throws or similar staged demonstrations as real.
- Prescribe practices to users in acute psychiatric or medical crisis.
- Override a user's own clinical team.

These rules are encoded in the chipset's `safety_posture.hard_rules` list
and are checked by Iyengar at the classification step. A query that triggers
a rule routes to a safety response before any specialist is invoked.

## 10. College Integration

The chipset connects to the college mind-body department concept graph:

- **Concept graph read/write**: Agents read existing concept definitions and
  write new ones when a practice or lineage is encountered that the graph
  does not yet cover.
- **Try Session generation**: When a MindBodyExplanation is produced, the
  chipset can automatically generate a Try Session (interactive practice)
  based on the explanation content and the learner's current position.
- **Learning pathway updates**: Completed analyses, practices, and
  explanations update the learner's progress along college-defined pathways.
- **Eight wings** map to the college mind-body department structure:
  1. Breath Practice
  2. Seated Meditation
  3. Yoga (Asana, Pranayama, and the Eight-Limb Path)
  4. Pilates (Contrology and the Apparatus System)
  5. Martial Arts as Body Discipline
  6. Tai Chi Chuan (Internal Martial Art)
  7. Qigong (Cultivation Practice)
  8. Somatic Movement Education

Each skill and Grove record type aligns to one or more wings, so work
products are automatically filed into the correct part of the concept graph.

## 11. Architecture Notes

### Why router topology

The router topology places a single agent (Iyengar) as the entry point for
all queries. Three benefits:

1. **Classification**: Iyengar determines which tradition(s) a query touches
   before dispatching, preventing specialist mismatches and tradition
   collapse.
2. **Safety gating**: A single chokepoint is easier to enforce safety rules at
   than a distributed system. Iyengar halts queries that require clinical
   referral before any specialist is invoked.
3. **CAPCOM boundary**: The user interacts with exactly one agent, reducing
   cognitive load and providing a consistent communication style — critical
   in a department that handles sensitive topics like injury, mental health,
   and religious identity.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (iyengar, feldenkrais, kabat-zinn): These roles require
  judgment under ambiguity. Classification and synthesis (Iyengar),
  somatic diagnosis (Feldenkrais), and clinical translation (Kabat-Zinn)
  all involve multi-step reasoning where the cost of an error is high.
- **Sonnet agents** (pilates, dogen, yang, thich-nhat-hanh): These roles are
  more framework-driven. Classical Pilates curriculum, Sōtō posture and
  texts, tai chi form, and Plum Village pedagogy all benefit from fast
  turnaround once the method is in context.

### Why lineage-respectful synthesis, not consensus

The department deliberately refuses to flatten multi-tradition responses into
single-voice consensus. When several specialists address the same question,
Iyengar preserves their distinct voices in the synthesis. This is a design
decision: users at depth are better served by seeing three real answers next
to each other than by receiving one smoothed-over composite. A user inside
a tradition can recognize their own voice in the synthesis; a user between
traditions can see the landscape honestly; a scholar can engage with the
disagreements productively.

## 12. Customization Guide

The mind-body department is one instantiation of the department template
pattern. To create a department for another practice-based applied domain
(for example, music practice, art practice, craft traditions, sports
coaching), follow these steps:

1. Copy the chipset directory: `cp -r examples/chipsets/mind-body-department examples/chipsets/newdomain-department`
2. Rename agents: Select figures whose work maps to the specialist roles.
3. Replace skills with domain-appropriate content, keeping the wing-to-skill
   coverage rule if the department spans more wings than skills.
4. Define new Grove record types for the domain.
5. Map to the target college department.
6. **Preserve the safety posture.** The hard-rules structure is a reusable
   pattern; the specific rules depend on the domain.

The mind-body department adds one customization feature not present in math
or business: `safety_posture_overridable: false`. Forked departments can
remove individual safety rules if their domain does not need them, but the
*existence* of an enforced safety posture is part of the template pattern
for any department where harm is possible.

## 13. Relationship to Other Departments

The mind-body department complements several other departments:

- **Nature-studies department** handles ecology, species knowledge, and the
  outdoor context in which much mind-body practice happens.
- **Philosophy department** handles the philosophical frames of the
  contemplative traditions — Buddhism, Daoism, Vedanta, classical Greek and
  Hellenistic schools.
- **Psychology department** handles clinical mental health topics where
  mind-body practices are sometimes used as adjunctive care.
- **Medical department** handles clinical care that the mind-body department
  routes to when safety rules trigger.
- **Critical thinking department** handles the epistemic posture that mind-body
  research needs — distinguishing strong evidence from weak, holding the
  commercial wellness industry accountable without dismissing the traditions.

Future integration could formalize cross-department referrals via a dispatch
protocol so that, for example, a mind-body-analysis-team query could call
out to a psychology specialist for a trauma-informed consultation without
leaving the mind-body department's session context.
