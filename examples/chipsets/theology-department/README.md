---
name: theology-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/chipsets/theology-department/README.md
description: >
  Coordinated theology department — seven named agents, six knowledge
  skills, three teams. Forked from the department template pattern
  first instantiated by math-department. Scholarly-comparative posture,
  not devotional.
superseded_by: null
---

# Theology Department

## 1. What is the Theology Department?

The Theology Department chipset is a coordinated set of reasoning agents, domain skills, and pre-composed teams that together provide structured theological support across scripture, doctrine, philosophical theology, mysticism, ethics, and comparative religion. It is a direct instantiation of the "department template pattern" established by the math department: a router-topology architecture in which a single chair agent classifies incoming queries and dispatches them to named specialists whose work products are persisted as Grove records linked to the college concept graph.

Where the math department's specialists are named after historical mathematicians whose work maps to their roles (Euclid for proof, Gauss for computation, Noether for structure), the theology department is named after historical thinkers and teachers whose work maps to the specialist roles across several traditions: Augustine for the chair (the patristic Christian synthesist whose range across scripture, doctrine, and rhetoric fits the routing role), Aquinas for scholastic systematic theology, Maimonides for Jewish philosophical theology, Rumi for the Islamic and Sufi tradition, Zhuangzi for Daoist and classical Chinese material, Hildegard for Western Christian mysticism, and Huston Smith for comparative framing and pedagogy.

The department is a scholarly-comparative teaching configuration, not a devotional one. It describes what traditions hold and why, attributes claims to specific thinkers and texts, notes internal diversity and contested scholarship, and refuses requests for spiritual direction or the ranking of traditions against each other.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/theology-department .claude/chipsets/theology-department
```

The chipset is activated when any of the six skill trigger patterns match an incoming query. Augustine (the router agent) classifies the query along five dimensions — tradition, domain, complexity, type, and user level — and dispatches to the appropriate specialist agent. No explicit activation command is needed; the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
node -e "const yaml = require('yaml'); const fs = require('fs'); \
  console.log(yaml.parse(fs.readFileSync('.claude/chipsets/theology-department/chipset.yaml', 'utf8')).name)"
# Expected output: theology-department-v1.0
```

## 3. Agent Roster

Seven agents form the department. Three run on Opus (for tasks requiring judgment under ambiguity), four on Sonnet (for focused single-tradition or framing work).

| Name          | Historical Figure        | Role                                                                           | Model  | Tools                         |
|---------------|--------------------------|--------------------------------------------------------------------------------|--------|-------------------------------|
| augustine     | Augustine of Hippo       | Department chair — classification, routing, patristic Christian voice          | opus   | Read, Glob, Grep, Bash, Write |
| aquinas       | Thomas Aquinas           | Scholastic specialist — systematic and philosophical theology                  | opus   | Read, Glob, Grep              |
| maimonides    | Moses Maimonides         | Jewish philosophical specialist — scripture and medieval philosophy            | opus   | Read, Glob, Grep              |
| rumi          | Jalal al-Din Rumi        | Islamic specialist — Qur'an, Sufi tradition, classical *kalam*                 | sonnet | Read, Glob, Grep              |
| zhuangzi      | Zhuangzi (Zhuang Zhou)   | Daoist specialist — *Zhuangzi*, *Daodejing*, classical Chinese traditions      | sonnet | Read, Glob, Grep              |
| hildegard     | Hildegard of Bingen      | Christian mysticism specialist — Western contemplative tradition, visionary literature | sonnet | Read, Glob, Grep              |
| huston-smith  | Huston Smith             | Comparative pedagogue — cross-tradition framing, audience adaptation           | sonnet | Read, Glob, Grep, Write       |

Augustine is the CAPCOM (single point of contact for the user). All other agents receive dispatched subtasks and return results through Augustine.

Several notes on the roster. First, the historical figures are used for their depth and range as readers and teachers, not as an endorsement of every position they took. Augustine's polemical writing and his treatment of sexuality, Aquinas's thirteenth-century context including Dominican participation in early inquisitorial practice, and other complications are noted in the individual AGENT.md files rather than elided. The department is a teaching configuration that reads these figures honestly, including where they are difficult.

Second, the roster covers only a subset of the world's traditions. Jewish, Western Christian (patristic, scholastic, and mystical), Islamic (Sunni and Sufi), and classical Chinese (Daoist and Confucian at the comparative level) are the primary strengths. Major traditions without a dedicated specialist — Theravada and most Mahayana Buddhism, classical and contemporary Hinduism, Sikhism, Eastern Christian hesychasm, African traditional religions, indigenous traditions, contemporary new religious movements — are covered only at the introductory comparative-framing level Huston Smith can provide. When a query falls into these gaps, Augustine says so and suggests external resources rather than overreaching.

Third, the Huston Smith pedagogy seat is a substitution for the Feisal Abdul Rauf seat that appeared in an earlier session handoff. Huston Smith is a better fit for the pedagogical-comparative role — his professional work was as a comparative-religion teacher, and the framing of cross-tradition presentation is the specific thing he is famous for. The department's perennialist legacy is acknowledged and qualified in his AGENT.md.

## 4. Skill Inventory

Six skills provide domain knowledge that agents draw on during execution.

| Skill                          | Domain   | Trigger Patterns                                                         | Agent Affinity         |
|--------------------------------|----------|--------------------------------------------------------------------------|------------------------|
| scripture-and-interpretation   | theology | scripture, exegesis, hermeneutic, tafsir, midrash, peshat, canon          | augustine, maimonides  |
| systematic-theology            | theology | doctrine, systematic theology, creed, Trinity, Christology, kalam         | aquinas, augustine     |
| philosophical-theology         | theology | existence of God, natural theology, divine attributes, problem of evil    | aquinas, maimonides    |
| comparative-religion           | theology | comparative, world religions, cross-tradition, dimensions                 | huston-smith, rumi     |
| mysticism-and-contemplation    | theology | mysticism, contemplation, apophatic, fana, dark night, unknowing          | rumi, hildegard        |
| ethics-and-practice            | theology | religious ethics, moral theology, ritual, golden rule, virtue, halakhah   | augustine, zhuangzi    |

Agent affinity means the skill's content is preferentially loaded into the listed agent's context. Multiple affinities mean the skill is relevant to more than one specialist.

## 5. Team Configurations

Teams are pre-composed agent groups for common problem shapes.

| Team                     | Agents                                                  | Use When                                               |
|--------------------------|---------------------------------------------------------|--------------------------------------------------------|
| theology-analysis-team   | augustine, aquinas, maimonides, rumi, zhuangzi, hildegard, huston-smith | Multi-tradition, research-level, or full comparative requests |
| theology-workshop-team   | augustine, aquinas, maimonides, huston-smith            | Doctrinal argument, philosophical-theology analysis, medieval primary-source reading |
| theology-practice-team   | augustine, rumi, hildegard, zhuangzi, huston-smith      | Contemplative primary sources, cross-tradition mysticism reading, iterative reading programs |

**theology-analysis-team** is the full department. Use it for problems that span multiple traditions or require the broadest possible comparative coverage.

**theology-workshop-team** pairs the chair with the scholastic and Jewish philosophical specialists plus the comparative pedagogue. Use it when the primary goal is a thorough doctrinal or philosophical-theology treatment of one question rather than a multi-tradition scan.

**theology-practice-team** is the contemplative-reading pipeline. Rumi, Hildegard, and Zhuangzi work with contemplative primary sources; Huston Smith supplies comparative framing. Designed for iterative invocation when a user is reading through a contemplative text across sessions.

## 6. Grove Record Types

All department work products are persisted as Grove records under the `theology-department` namespace. Five record types are defined:

| Record Type          | Produced By                                   | Key Fields                                                                         |
|----------------------|-----------------------------------------------|------------------------------------------------------------------------------------|
| TheologyAnalysis     | aquinas, maimonides (primary), other specialists | Argument construction, doctrinal analysis, philosophical-theology evaluation, premises, objections |
| TheologyReading      | all specialists                                | Close reading of a primary source — scripture, doctrinal text, philosophical treatise, contemplative text |
| TheologyReview       | aquinas, maimonides                            | Review or critique of an argument, reading, or interpretive claim                  |
| TheologyExplanation  | huston-smith (primary), other specialists      | Teaching artifact at specified audience level — introductions, framings, adaptations |
| TheologySession      | augustine                                       | Session log, classification metadata, work product links, descriptive-posture flag |

Records are content-addressed and immutable once written. TheologySession records link all work products from a single interaction, providing an audit trail from query to result, and they explicitly carry a posture flag marking the department's descriptive-comparative stance.

## 7. College Integration

The chipset connects to the college theology department concept graph:

- **Concept graph read/write**: Agents can read existing concept definitions and write new ones when a topic is encountered that the graph does not yet cover.
- **Try Session generation**: When a TheologyExplanation is produced, the chipset can automatically generate a Try Session (interactive practice) based on the explanation content and the learner's current position.
- **Learning pathway updates**: Completed readings, analyses, and explanations update the learner's progress along college-defined pathways.
- **Five wings** map to the college theology department structure:
  1. Scripture and Hermeneutics
  2. Systematic and Philosophical Theology
  3. Comparative and Historical Traditions
  4. Mysticism and Contemplative Practice
  5. Religious Ethics and Social Teaching

Each skill and Grove record type aligns to one or more wings, so work products are automatically filed into the correct part of the concept graph.

## 8. Customization Guide

The theology department is one instantiation of the department template pattern. To create a department for another humanities domain (literature, history, classics, etc.), follow these steps:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/theology-department examples/chipsets/newdomain-department
```

### Step 2: Rename agents

Edit `chipset.yaml` and replace agent names, roles, and historical figure references. Select figures whose contributions map to the specialist roles and whose work teaches tradition history. Diversity of tradition, era, and voice matters more in humanities domains than in technical ones.

### Step 3: Replace skills with domain-appropriate content

Swap the six theology skills for domain equivalents. Each skill needs a domain value, a description, a triggers list, and agent affinity mapping. For humanities domains, keep in mind that trigger words should be specific enough to avoid false positives — "text" or "read" alone would fire on everything.

### Step 4: Define new Grove record types

Replace the five `TheologyX` record types with domain-appropriate types. The minimum is an analysis type, a reading type, a review type, an explanation type, and a session type.

### Step 5: Map to the target college department

Update the `college` section — set department, wings, and read/write permissions.

### Step 6: Update evaluation gates

Review the `evaluation.gates` section. The default gates plus the `descriptive_posture_maintained` warning gate are a good starting point for any humanities teaching department. Update `benchmark.domains_covered` for the new domain areas.

## 9. Architecture Notes

### Why router topology

The router topology places a single agent (Augustine) as the entry point for all queries. Three benefits:

1. **Tradition classification**: Augustine determines which tradition(s) a query touches before dispatching, preventing wasted work by non-relevant specialists and catching category mismatches early (e.g., a Christian doctrinal question should not be routed to the Daoist specialist).
2. **Posture enforcement**: Augustine is responsible for maintaining the descriptive-comparative posture across all responses. A single point of control makes this enforceable — the chair refuses devotional requests, refuses to rank traditions, and keeps the voice consistent.
3. **CAPCOM boundary**: The user interacts with exactly one agent, reducing cognitive load and providing a consistent communication style. Specialists never speak to the user directly.

### Why 3 Opus / 4 Sonnet

Model assignment follows the reasoning depth required by each role:

- **Opus agents** (augustine, aquinas, maimonides): These roles require judgment under ambiguity. Classification and synthesis (Augustine), scholastic argument analysis (Aquinas), and Jewish philosophical analysis (Maimonides) all involve multi-step reasoning where errors compound.
- **Sonnet agents** (rumi, zhuangzi, hildegard, huston-smith): These roles are more focused. Single-tradition text reading, contemplative-source explication, and cross-tradition framing all benefit from fast turnaround over deeper reasoning.

This 3/4 split matches the math and business departments' ratios, which is the reference point.

### Why this team structure

The three teams cover the three most common theology query shapes:

- **Full comparative analysis**: needs every lens (all 7 agents) for multi-tradition questions.
- **Doctrinal or philosophical workshop**: needs the scholastic-philosophical core (4 agents) for a focused argument.
- **Contemplative-reading practice**: needs the contemplative specialists (5 agents, pipeline) for iterative primary-source work.

Teams are not exclusive. Augustine can assemble ad-hoc groups for queries that do not fit any pre-composed team.

### CAPCOM boundary

The CAPCOM (Capsule Communicator) pattern means only Augustine speaks to the user. Other agents communicate through Augustine via internal dispatch. This is enforced by the `is_capcom: true` flag on Augustine in `chipset.yaml` — only one agent in the chipset may carry this flag. It is the structural guarantee of posture consistency.

## 10. Historical Transparency

The theology department uses historical names for mnemonic and educational value. Several of the figures have legacies that require transparent handling. The general principle is that the agent is the historical evidence, not a hero, and that the complications are acknowledged rather than elided.

- **Augustine of Hippo**'s contributions to Western Christian thought are enormous. His polemical writing against the Donatists helped establish the church's use of coercion; his treatment of the Jews is mostly late-ancient supersessionism; his account of sexuality has shaped restrictive Western attitudes for sixteen centuries. The chair role is given for his range as reader and organizer of theological problems, not as endorsement.
- **Thomas Aquinas**'s scholastic synthesis is the high point of medieval Western theology. His historical context includes the Dominican role in the Albigensian crusade and in early inquisitorial practice; his writing on heresy should be read critically rather than passed over.
- **Maimonides** worked inside Jewish tradition and was controversial in his own time. His *Guide* was banned by some communities during the "Maimonidean controversy" of the early thirteenth century. The agent notes this reception history.
- **Rumi** is widely misrepresented in popular English-language contexts, where his Islamic scholarly frame is often stripped. The Rumi agent is the scholarly Rumi, not the Barks-paraphrase Rumi.
- **Huston Smith**'s framing is perennialist, a view that has been substantially questioned by subsequent scholarship. The Huston Smith agent inherits his pedagogical strengths without the perennialist confidence.

We include these figures because their contributions are valuable and teaching theological history honestly requires not pretending that the figures in it were uncomplicated. Users who prefer different names can rename the agents — the template pattern supports this.

## 11. Relationship to Other Departments

The theology department complements several other departments:

- **Philosophy department** handles general logic, epistemology, metaphysics, and ethics as secular disciplines. Theology borrows its argument-analysis standards and contributes religious-philosophy case material.
- **History department** handles the documentary and institutional history that theological claims rest on. Theology does some of this history in-house (history of doctrine, formation of canons) but leans on the history department for the wider background.
- **Critical thinking department** handles argumentation infrastructure that philosophical theology and religious ethics both rely on.
- **Anthropology department** handles the social-scientific study of religion (Durkheim, Weber, Geertz, Asad) that complements the scholarly-theological posture of this department.

Future integration could formalize cross-department referrals via a dispatch protocol so that, for example, a theology-analysis-team could call out to a history specialist for the documentary background of a conciliar debate, or to an anthropology specialist for the social-scientific reading of a ritual, without leaving the theology department's session context.
