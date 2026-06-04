# Category Taxonomy

The `examples/` library organizes skills, agents, and teams into categories. The
taxonomy has two tiers:

1. **Workflow & infrastructure categories** — the original cross-cutting buckets
   (`gsd`, `dev`, `ops`, `patterns`, …) that separate concerns for the
   skill-creator's own tooling and craft.
2. **College / department domains** — one category per academic domain (`math`,
   `physics`, `music`, `philosophy`, … 40+ in all). Each domain spans all three
   artifact types: a set of **skills**, a department of named **agents** (a
   department chair + specialists), and a small set of **teams**. These mirror
   the `chipsets/<domain>-department/` bundles.

**The tooling discovers categories structurally from disk — not from a hardcoded
allowlist.** A directory under `examples/<type>/` is a category if it holds
artifact sub-directories; adding `examples/skills/astronomy/` needs no code
change. (Before v1.49.970 each tool carried its own frozen 10/8/5 allowlist and
silently served only a fraction of the library.) The **authoritative per-category
description** is the auto-generated `README.md` in each category dir; the tables
below are a high-level map.

## Tier 1 — Workflow & infrastructure categories

### Skill categories

| Category | Purpose |
|----------|---------|
| `gsd/` | Get-Shit-Done workflow skills — onboarding, preflight, migration, trace, cartridge-forge |
| `gsd-meta/` | GSD meta-skills for the skill-creator workflow itself — batch rewrites, checkpoint/resume, schema generation, session observation, decision-framework invocation |
| `research/` | Research pipelines and research-adjacent craft — research-engine, vision-to-mission, data-fidelity |
| `media/` | Media production — audio engineering, AV studio, ffmpeg, latex authoring, publishing |
| `dev/` | Developer productivity — beautiful-commits, code-review, test-generator, language patterns |
| `ops/` | Operations and reliability — SRE, incident response, monitoring, release management, chaos engineering |
| `workflow/` | General workflow meta-skills — session awareness, context handoff, issue triage, merge refinery, ecosystem alignment |
| `patterns/` | Pattern catalogs — SQL, API design, Docker, accessibility, CI/CD, infrastructure-as-code, Kubernetes, and more |
| `orchestration/` | Agent orchestration — fleet mission, mayor coordinator, sling dispatch, GUPP propulsion, runtime HAL, witness observer |
| `state/` | State and persistence — beads-state, hook-persistence, nudge-sync, mail-async, token-budget, done-retirement |
| `deprecated/` | Artifacts superseded by newer work. Preserved for reference. Not installed by default. |

### Agent categories

| Category | Purpose |
|----------|---------|
| `gsd/` | GSD workflow agents — planner, executor, verifier, phase researcher, code reviewer, debugger, roadmapper |
| `gsd-meta/` | GSD meta-agents for the release-history pipeline itself — pipeline reconciler, quality-drift watcher |
| `research/` | Research agents — project researcher, fact checker, market researcher, document builder, research fleet commander |
| `media/` | Media production agents — audio engineer, video editor, podcast producer, stream producer, ffmpeg processor |
| `dev/` | Developer-facing agents — test orchestrator, security reviewer, issue fixer, changelog generator |
| `ops/` | Operations agents — incident analyzer, deployment validator, SLO monitor, capacity planner, drift detector |
| `ui/` | UI-facing agents — UI researcher, UI checker, UI auditor |
| `audit/` | Audit and analysis agents — compliance, infrastructure, pipeline, performance, dependency health, doc linting, vulnerability triage |
| `deprecated/` | Superseded agents. Preserved for reference. |

### Team categories

| Category | Purpose |
|----------|---------|
| `code/` | Code review and security audit teams |
| `coding/` | Software-craft teams — architecture, code review, learning-lab |
| `ops/` | DevOps pipeline, SRE operations, incident response teams |
| `infra/` | Infrastructure review, release management, platform onboarding teams |
| `migration/` | Migration and documentation generation teams |
| `deprecated/` | Superseded teams. Preserved for reference. |

## Tier 2 — College / department domains

Each domain below has its own skills, a department of named agents, and a set of
teams (analysis / practice / workshop, or a domain-specific variant). See the
`README.md` in each `examples/<type>/<domain>/` for the full artifact listing.

| Domain | Coverage |
|--------|----------|
| `art/` | drawing & observation, color theory, creative process, art history, sculpture, digital art |
| `astronomy/` | observation, celestial coordinates, orbital mechanics, spectroscopy, the distance ladder, cosmology |
| `business/` | strategy, entrepreneurship, corporate finance, operations & lean, business law, ethics & governance |
| `chemistry/` | atomic structure, bonding, organic chemistry, reactions & stoichiometry, analytical methods, materials |
| `cloud-systems/` | service architecture, distributed storage & consensus, cloud identity, networking, reliability engineering |
| `coding/` | programming fundamentals, algorithms & data structures, software design, debugging & testing, systems programming |
| `communication/` | public speaking, rhetoric, active listening, interpersonal communication, conflict resolution, media literacy |
| `critical-thinking/` | logical reasoning, argument evaluation, evidence assessment, cognitive biases, decision-making |
| `data-science/` | data wrangling & visualization, statistical modeling, ML foundations, experimental design, ethics |
| `digital-literacy/` | information evaluation, digital citizenship, data privacy, media creation, algorithmic awareness |
| `economics/` | micro- & macroeconomics, behavioral & development economics, international trade, public policy |
| `electronics/` | circuit analysis, digital logic, semiconductor physics, firmware, signal processing, test & measurement |
| `engineering/` | design process, systems engineering, structural analysis, prototyping, technical communication, ethics |
| `environmental/` | climate science, ecosystem dynamics, biogeochemical cycles, impact assessment, sustainability, justice |
| `geography/` | physical & human geography, cartography & GIS, geopolitics, fieldwork methods |
| `history/` | source analysis, historiography, causation, continuity & change, oral history, perspective-taking |
| `home-economics/` | meal planning & food technique, budgeting, household systems, time-and-motion, sustainable pedagogy |
| `languages/` | grammar & syntax, phonetics, pragmatics, vocabulary, translation, learning strategies |
| `learning/` | deliberate practice, mastery, scaffolding & ZPD, constructivism, mindset, prepared environments |
| `logic/` | propositional, predicate & modal logic, mathematical proof, informal fallacies, argumentation |
| `materials/` | iron/steel & nonferrous processes, characterization & selection, failure analysis, nanomaterials |
| `math/` | proof technique, algebraic reasoning, geometric intuition, numerical analysis, modeling |
| `mind-body/` | yoga & alignment, breath & meditation, somatic movement, internal arts, contemplative traditions |
| `music/` | harmony, counterpoint, rhythm & meter, form analysis, orchestration, ear training |
| `nature-studies/` | field identification, nature journaling, ecosystem mapping, species observation, taxonomy |
| `nutrition/` | nutrition-science foundations, metabolism, dietary assessment, feeding pedagogy, food policy |
| `philosophy/` | formal logic, epistemology, metaphysics, ethics, political philosophy, critical thinking |
| `physical-education/` | movement fundamentals, cardiovascular fitness, strength & conditioning, coaching, inclusive PE |
| `physics/` | classical mechanics, electromagnetism, thermodynamics, quantum mechanics, relativity, experimental methods |
| `problem-solving/` | problem comprehension, strategy selection, metacognition, design thinking, collaboration |
| `project-management/` | agile methods, estimation & planning, risk management, stakeholder communication, QA, retrospectives |
| `psychology/` | cognitive, developmental, social & clinical foundations, behavioral neuroscience, research methods |
| `rca/` | classical methods, causal inference, systems-theoretic analysis (STAMP/STPA), human factors, postmortems |
| `reading/` | phonics & decoding, comprehension, literary & critical analysis, vocabulary, information literacy |
| `science/` | scientific method, experimental design, data analysis, earth & life systems, science communication |
| `spatial-computing/` | spatial reasoning, 3D interaction design, immersive environments, embodied computing, AR tracking |
| `statistics/` | descriptive & inferential statistics, probability, regression, Bayesian methods, statistical computing |
| `technology/` | digital systems, human-computer interaction, emerging tech, cybersecurity, responsible innovation |
| `theology/` | scripture & interpretation, systematic & philosophical theology, comparative religion, mysticism |
| `trades/` | workshop practice, tool & machine use, measurement & tolerance, materials & fit, apprenticeship |
| `writing/` | narrative craft, expository & research writing, poetry, voice & style, revision & editing |

## Chipset organization

Chipsets are not subcategorized. Each lives in its own directory at
`chipsets/<name>/` with a `chipset.yaml` and a `README.md`. The college/department
domains above each ship a `chipsets/<domain>-department/` bundle. Deprecated
chipsets move to `chipsets/deprecated/`.

## Growth rules

- Categories are discovered from disk by the tooling — to add one, create the
  directory with at least one artifact and run `node tools/catalog-gen.mjs` and
  `node tools/generate-category-readmes.mjs`.
- Add a domain-level description for a new college/department category in
  `DOMAIN_DESCRIPTIONS` (in `tools/generate-category-readmes.mjs`); workflow/infra
  categories get a curated entry in `CATEGORY_DESCRIPTIONS`.
- Prefer moving an artifact between categories over creating a new one.
- `deprecated/` is never installed by default.
