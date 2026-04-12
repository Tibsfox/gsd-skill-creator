# Category Taxonomy

The `examples/` library organizes skills, agents, and teams into a small set of categories. The taxonomy is deliberately moderate — enough to separate concerns, not so many that browsing breaks down. A category that crosses ~15 artifacts may be subdivided in the future.

## Skill categories

| Category | Purpose |
|----------|---------|
| `gsd/` | Get-Shit-Done workflow skills — plan-phase, execute-phase, verify-work, discussions, handoffs |
| `research/` | Research pipelines and research-adjacent craft — research-engine, vision-to-mission, data-fidelity |
| `media/` | Media production — audio engineering, video editing, av studio, ffmpeg, latex authoring, publishing |
| `dev/` | Developer productivity — beautiful-commits, code-review, test-generator, language patterns |
| `ops/` | Operations and reliability — SRE, incident response, monitoring, release management |
| `workflow/` | General workflow meta-skills — loops, schedules, session awareness, context handoff |
| `patterns/` | Pattern catalogs — SQL, API design, Docker, accessibility, CI/CD, infrastructure-as-code |
| `orchestration/` | Agent orchestration — fleet mission, mayor coordinator, sling dispatch, GUPP propulsion, runtime HAL |
| `state/` | State and persistence — beads-state, hook-persistence, nudge-sync, mail-async, token-budget |
| `math/` | Mathematics domain knowledge — proof techniques, algebraic reasoning, geometric intuition, numerical analysis, pattern recognition, mathematical modeling |
| `music/` | Music domain knowledge — harmony analysis, counterpoint, rhythm and meter, form analysis, orchestration, ear training |
| `physics/` | Physics domain knowledge — classical mechanics, electromagnetism, thermodynamics, quantum mechanics, relativity and astrophysics, experimental methods |
| `philosophy/` | Philosophy domain knowledge — formal logic, ethics, epistemology, metaphysics, political philosophy, critical thinking |
| `deprecated/` | Artifacts superseded by newer work. Preserved for reference. Not installed by default. |

## Agent categories

| Category | Purpose |
|----------|---------|
| `gsd/` | GSD workflow agents — planner, executor, verifier, phase researcher, code reviewer, debugger, roadmapper |
| `research/` | Research agents — project researcher, fact checker, market researcher, document builder, research fleet commander |
| `media/` | Media production agents — audio engineer, video editor, podcast producer, stream producer, ffmpeg processor |
| `dev/` | Developer-facing agents — code reviewer, code fixer, test orchestrator, security reviewer |
| `ops/` | Operations agents — incident analyzer, deployment validator, SLO monitor, capacity planner, drift detector |
| `ui/` | UI-facing agents — UI researcher, UI checker, UI auditor |
| `audit/` | Audit and analysis agents — compliance auditor, infrastructure auditor, pipeline analyzer, performance profiler |
| `math/` | Mathematics department agents — department chair (Hypatia), proof engineer (Euclid), number theorist (Gauss), analyst (Euler), algebraist (Noether), conjecture engine (Ramanujan), pedagogy guide (Polya) |
| `music/` | Music department agents — department chair (Bach), harmony theorist (Rameau), performer (Clara Schumann), composer (Messiaen), improviser (Coltrane), ethnomusicologist (Bartok), pedagogy guide (Kodaly) |
| `physics/` | Physics department agents — department chair (Curie), classical mechanics (Newton), electromagnetism (Maxwell), thermodynamics (Boltzmann), quantum mechanics (Feynman), astrophysics (Chandrasekhar), pedagogy (Faraday) |
| `philosophy/` | Philosophy department agents — department chair (Socrates), logician (Aristotle), ethicist (Kant), existentialist (Beauvoir), political philosopher (Confucius), metaphysician (Nagarjuna), pedagogy (Dewey) |
| `deprecated/` | Superseded agents. Preserved for reference. |

## Team categories

| Category | Purpose |
|----------|---------|
| `code/` | Code review and security audit teams |
| `ops/` | DevOps pipeline, SRE operations, incident response teams |
| `infra/` | Infrastructure review, release management, platform onboarding teams |
| `migration/` | Migration and documentation generation teams |
| `math/` | Mathematics teams — full investigation, proof workshop, discovery pipeline |
| `music/` | Music teams — full analysis, composition workshop, performance preparation |
| `physics/` | Physics teams — full analysis, problem solving, experimental design |
| `philosophy/` | Philosophy teams — full seminar, ethics committee, dialectic |
| `deprecated/` | Superseded teams. Preserved for reference. |

## Chipset organization

Chipsets are not subcategorized. Each lives in its own directory at `chipsets/<name>/` with a `chipset.yaml` and a `README.md`. Deprecated chipsets move to `chipsets/deprecated/`.

## Growth rules

- Add a new category only when at least 5 artifacts clearly belong in it
- Subdivide an existing category only when it crosses ~15 artifacts
- Prefer moving an artifact between categories over creating a new one
- `deprecated/` is always the last category alphabetically and is never installed by default
