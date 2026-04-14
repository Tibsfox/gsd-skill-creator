---
name: rca-department
type: chipset
category: chipset
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-14
first_path: examples/chipsets/rca-department/README.md
description: >
  Coordinated root cause analysis department — five named agents, six
  methodology skills, three teams. Retroactively completes the Session 020
  RCA artifact suite by binding existing skills/agents/teams into the
  forkable department template pattern.
superseded_by: null
---

# RCA Department

## 1. What is the RCA Department?

The RCA Department chipset is a coordinated set of investigation agents,
methodology skills, and pre-composed teams that together provide disciplined
root cause analysis across classical techniques, systems-theoretic analysis,
quantitative causal inference, human-factors frameworks, distributed-systems
diagnostics, and blameless postmortem authoring. It targets reliability
engineers, SREs, safety analysts, and incident commanders who need RCA to
produce learning and accountability rather than theater.

It is a department in the structural sense: incoming incidents are classified
by a router agent (`rca-investigator`), dispatched to the specialist whose
methodology fits the incident shape, and all work products are persisted as
Grove records for later retrieval and cross-incident pattern detection. It
differs from `math-department` in one deliberate way: there is no college
concept graph binding. RCA is cross-cutting reliability infrastructure, not
an academic discipline — see §7.

## 2. Quick Start

Install the chipset into your gsd-skill-creator project:

```bash
# From the gsd-skill-creator root
cp -r examples/chipsets/rca-department .claude/chipsets/rca-department
```

The chipset is activated when any of the six skill trigger patterns match an
incoming query (phrases like "root cause", "5 whys", "STAMP", "causal graph",
"postmortem", etc.). `rca-investigator` (the router agent) classifies the
incident's causal structure, domain, evidence type, and severity, then
dispatches to the appropriate specialist. No explicit activation command is
needed — the skill-integration layer loads the chipset based on context.

To verify the chipset is recognized:

```bash
# Check that the YAML parses cleanly and lists the expected counts
node -e "const yaml=require('yaml');const fs=require('fs'); \
  const c=yaml.parse(fs.readFileSync('.claude/chipsets/rca-department/chipset.yaml','utf8')); \
  console.log(c.name, '| skills:', Object.keys(c.skills).length, \
  '| agents:', c.agents.agents.length, '| teams:', Object.keys(c.teams).length, \
  '| grove types:', c.grove.record_types.length)"
# Expected: rca-department-v1.0 | skills: 6 | agents: 5 | teams: 3 | grove types: 5
```

## 3. Agent Roster

Five agents form the department. Three run on Opus (for judgment-heavy
reasoning — classification, systems-theoretic analysis, quantitative causal
inference) and two on Sonnet (for structured facilitation and drafting
throughput).

| Name                  | Role                                                                         | Model  | Tools                              | CAPCOM? |
|-----------------------|------------------------------------------------------------------------------|--------|------------------------------------|---------|
| rca-investigator      | Department coordinator — classification, method selection, delegation, synthesis | opus   | Read, Glob, Grep, Bash, Write, WebFetch | yes     |
| stamp-stpa-analyst    | Systems-theoretic analyst — STPA hazard analysis and CAST retrospective investigation | opus   | Read, Write, Glob, Grep, Bash      | no      |
| causal-graph-builder  | Causal-inference specialist — Bayesian networks, DAG construction, counterfactual estimation | opus   | Read, Write, Bash, Grep, Glob      | no      |
| five-whys-facilitator | Classical RCA facilitator — branching 5 Whys with evidence gates and escalation guardrails | sonnet | Read, Grep, Write, Bash            | no      |
| postmortem-writer     | Blameless postmortem author — draft generation, blameless-language audit, action-item quality gate | sonnet | Read, Write, Glob, Grep, Bash      | no      |

The router topology places `rca-investigator` as the single point of contact.
It reads the incident description and evidence, classifies along four
dimensions (causal structure, domain, evidence type, severity/scope), picks
one or more methodologies using Doggett's tool-selection framework, and
dispatches to the specialists. Only `rca-investigator` is `is_capcom: true` —
all other agents communicate through it.

## 4. Skill Catalog

### rca-classical-methods

Classical root cause analysis techniques for quality improvement and
incident investigation — 5 Whys (with Card's 2017 critique and boundary
conditions), Ishikawa/fishbone diagrams, Fault Tree Analysis, FMEA, Cause
Mapping, and Doggett's method-selection framework.

- **Triggers:** `root cause`, `5 whys`, `five whys`, `fishbone`, `ishikawa`, `fault tree`, `FTA`, `FMEA`, `cause map`, `failure mode`
- **Affinity:** `five-whys-facilitator`
- **Source:** [`examples/skills/rca/rca-classical-methods/SKILL.md`](../../skills/rca/rca-classical-methods/SKILL.md)

### rca-systems-theoretic

Systems-theoretic approaches for complex socio-technical systems where
linear causal chains fail — Leveson's STAMP/STPA/CAST, Rasmussen's dynamic
safety model, Hollnagel's FRAM, and AcciMap.

- **Triggers:** `STAMP`, `STPA`, `CAST`, `control structure`, `unsafe control action`, `Leveson`, `Rasmussen`, `FRAM`, `AcciMap`, `socio-technical`, `systems-theoretic`
- **Affinity:** `stamp-stpa-analyst`
- **Source:** [`examples/skills/rca/rca-systems-theoretic/SKILL.md`](../../skills/rca/rca-systems-theoretic/SKILL.md)

### rca-causal-inference

Mathematical foundations of RCA using Judea Pearl's Structural Causal
Models, do-calculus, counterfactual reasoning, Bayesian networks for fault
diagnosis, backdoor/frontdoor criteria, and information-theoretic methods
like transfer entropy and Granger causality.

- **Triggers:** `causal graph`, `causal DAG`, `Pearl`, `do-calculus`, `counterfactual`, `Bayesian network`, `backdoor criterion`, `frontdoor criterion`, `causal inference`, `transfer entropy`, `Granger causality`
- **Affinity:** `causal-graph-builder`
- **Source:** [`examples/skills/rca/rca-causal-inference/SKILL.md`](../../skills/rca/rca-causal-inference/SKILL.md)

### rca-human-factors

Human-factors RCA for incidents involving operators, crews, clinicians, or
any human actors — James Reason's Swiss Cheese Model, HFACS, the Just
Culture algorithm (Marx/GAIN), Crew Resource Management, and
high-reliability organization principles.

- **Triggers:** `human error`, `human factors`, `Swiss cheese`, `HFACS`, `Just Culture`, `crew resource management`, `CRM`, `operator error`, `latent failure`, `active failure`
- **Affinity:** `rca-investigator`, `five-whys-facilitator`
- **Source:** [`examples/skills/rca/rca-human-factors/SKILL.md`](../../skills/rca/rca-human-factors/SKILL.md)

### rca-distributed-systems

RCA techniques for modern microservices and cloud infrastructure —
trace-based causality (OpenTelemetry, Jaeger, Tempo), service dependency
graphs, DynaCausal-style dynamic causality, Microsoft AgentRx for AI agent
failures, chaos-engineering-as-RCA, and causal-graph-based AIOps.

- **Triggers:** `distributed trace`, `OpenTelemetry`, `service graph`, `microservice failure`, `cascading failure`, `DynaCausal`, `AgentRx`, `AIOps`, `partial failure`, `distributed RCA`
- **Affinity:** `rca-investigator`, `causal-graph-builder`
- **Source:** [`examples/skills/rca/rca-distributed-systems/SKILL.md`](../../skills/rca/rca-distributed-systems/SKILL.md)

### blameless-postmortem

Google SRE-style blameless postmortem authoring — structure, timeline
construction, contributing-factor extraction, action-item discipline, and
the cultural practices that make postmortems produce learning rather than
theater.

- **Triggers:** `postmortem`, `blameless`, `Google SRE postmortem`, `lessons learned`, `action items`, `incident report`, `what went well`, `timeline reconstruction`
- **Affinity:** `postmortem-writer`
- **Source:** [`examples/skills/rca/blameless-postmortem/SKILL.md`](../../skills/rca/blameless-postmortem/SKILL.md)

## 5. Team Configurations

### rca-deep-team

- **Purpose:** Multi-method parallel investigation for SEV1/SEV2 or
  high-uncertainty incidents. Runs classical, systems-theoretic, and
  causal-inference analyses concurrently — plus inline human-factors and
  distributed-systems passes by `rca-investigator` — and synthesizes the
  findings into a single unified report.
- **Members:** `rca-investigator`, `five-whys-facilitator`,
  `stamp-stpa-analyst`, `causal-graph-builder`, `postmortem-writer`
- **Use when:** SEV1/SEV2 incidents, recurring failures, conflicting
  hypotheses, safety-critical systems, post-incident legal or regulatory
  review.
- **Expected session length:** 10–30 minutes wall-clock; 350–550K tokens
  per incident. Justified only when a missed latent condition costs more
  than the analysis.

### rca-triage-team

- **Purpose:** Fast triage team for routine incidents. Classifies the
  incident, runs a single-method shallow analysis, and produces a short
  1–2 page postmortem. Escalates to `rca-deep-team` if classification
  confidence is low or the incident turns out to be multi-factor.
- **Members:** `rca-investigator`, `five-whys-facilitator`,
  `causal-graph-builder`, `postmortem-writer`
- **Use when:** SEV3/SEV4 incidents, daily incident review, first-pass
  classification, training mode. All Sonnet by default — no Opus.
- **Expected session length:** 3–5 minutes wall-clock; 30–60K tokens per
  incident. Supports bulk processing (10–20 routine incidents/day).

### postmortem-team

- **Purpose:** End-to-end blameless postmortem authoring and review
  pipeline — drafting, blameless-language audit, action-item quality gate,
  review meeting agenda generation, and asynchronous weekly tracking of
  open action items. Focuses on the delivery side of RCA; upstream
  investigation is handled by `rca-deep-team` or `rca-triage-team`.
- **Members:** `postmortem-writer` (used in author, auditor, and
  facilitator modes)
- **Use when:** after any SEV1/SEV2 incident, after triage escalates,
  postmortem backlog cleanup, cross-incident learning initiatives,
  regulated environments requiring strict format.
- **Expected session length:** ~5 minutes for draft + audit; ~30K tokens.
  Weekly tracker is a scheduled job, not interactive.

## 6. Grove Integration

All department work products are persisted as Grove records under the
`rca-department` namespace. Five record types are defined:

| Record Type       | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| RCAInvestigation  | An investigation session with scope, severity, classification, and method(s) selected |
| RCAFinding        | A single causal finding — proximate cause, contributing factor, or latent condition with evidence |
| RCACausalGraph    | A DAG or Bayesian network relating candidate causes to outcomes, with edge annotations and effect estimates |
| RCAPostmortem     | A blameless postmortem document with timeline, impact, causes, lessons, and action items |
| RCASession        | Session log linking all work products (investigations, findings, graphs, postmortems) to interaction context |

Records are content-addressed and immutable once written. A single
investigation persists as a linked record set: one `RCAInvestigation`
record, one or more `RCAFinding` and `RCACausalGraph` records produced by
the specialists, one `RCAPostmortem` record authored by the
`postmortem-writer`, and one `RCASession` record tying all of them back to
the originating interaction. This provides an audit trail from incident
evidence to final action items — useful for regulated environments and for
cross-incident pattern detection.

## 7. Why No College Integration

Math, physics, and writing map naturally onto academic departments in the
college concept graph. RCA does not. Root cause analysis is cross-cutting
reliability infrastructure — it applies to software systems, aviation,
healthcare, nuclear operations, financial clearing, autonomous systems, and
any other domain where incidents happen. There is no single "RCA
department" in the college that the chipset can bind to, and forcing a
binding would either mis-classify the methodologies (they are not a branch
of computer science) or bloat the college with a phantom department that
does not correspond to any learning pathway.

So this chipset deliberately opts out: `college.department: null`,
`concept_graph.read: false`, `concept_graph.write: false`, and no wings.

Forks that specialize the template to a specific applied domain — for
example, `aviation-safety-department`, `clinical-incident-department`, or
`financial-operations-department` — may choose to re-enable college
binding if the fork maps onto an actual college discipline. The department
template supports this: set `college.department` to the target, populate
the wings, and the skill-integration layer will load the concept graph
hooks. The baseline `rca-department` stays domain-neutral.

## 8. Forking This Chipset

The RCA Department follows the department template pattern. To create a
specialized department for an adjacent reliability domain:

### Step 1: Copy the chipset directory

```bash
cp -r examples/chipsets/rca-department examples/chipsets/aviation-safety-department
```

### Step 2: Rename in the YAML

Edit `chipset.yaml` and update `name:` (e.g., `aviation-safety-department-v1.0`)
and `description:`. Rename agents if the specialist roster changes (for
aviation you might add a `crew-resource-management-analyst` and drop the
distributed-systems affinity from the existing agents). Keep the router
topology and `is_capcom: true` as invariants.

### Step 3: Replace skills with domain-appropriate content

Swap or augment the six baseline skills with domain-specific ones. For a
clinical-incident department you might add `rca-medication-safety` and
`rca-diagnostic-error` alongside the existing human-factors and
systems-theoretic skills. Each new skill needs `domain`, `description`,
`triggers`, and `agent_affinity`.

### Step 4: Define new Grove record types

The five baseline RCA record types are deliberately generic. Forks may
add domain-specific types (e.g., `AviationSafetyHazardLog`,
`ClinicalRootCauseAnalysis`) under a new Grove namespace like
`aviation-safety-department`.

### Step 5: Remap college binding (if applicable)

If the fork targets a domain that has a college department, update the
`college:` section — set `department`, enable `concept_graph.read/write`,
and list the wings. If the fork is still cross-cutting, keep the opt-out
from the baseline.

### Step 6: Keep the evaluation gates

The five pre-deploy gates (descriptions, roles, Grove types, router CAPCOM,
methodology coverage) should be preserved. Update `benchmark.domains_covered`
to reflect the fork's methodology list. Add domain-specific gates as
needed (e.g., for healthcare you might add a gate requiring all agents
to declare HIPAA-awareness).

## 9. Verification

Unlike `math-department` (which ships only `chipset.yaml` + `README.md` and
leaves the evaluation gates declarative), this chipset ships an implementing
test at `src/chipset/rca-department.test.ts` and a trigger-benchmark fixture
at `examples/chipsets/rca-department/benchmark/test-cases.yaml`. The test
enforces every gate listed in `chipset.yaml:evaluation.gates.pre_deploy`:

- `all_skills_have_descriptions` — every skill has a non-empty description
- `all_agents_have_roles` — every agent has a non-empty role
- `grove_record_types_defined` — the 5 named RCA record types are present
- `router_agent_is_capcom` — `rca-investigator` is the sole CAPCOM
- `all_methodologies_covered` — the 5 RCA methodology skills are present

Plus referential integrity checks (skill affinities and team members resolve
to real agents; the college opt-out is explicit) and the trigger benchmark
(the 30-case fixture is run against the skill trigger patterns and the
aggregate accuracy is asserted against `trigger_accuracy_threshold: 0.85`).

The `rca-department` Grove namespace is a new, user-chosen string. Grove's
namespace layer (`src/mesh/grove-namespace.ts`) is a generic name → hash
binding store with no pre-registered namespace list, so namespaces are
chosen per chipset and collision-avoided by convention (pattern:
`<chipset-name>`). This matches how `math-department` chose its namespace.

## 10. Provenance

This chipset was added on **2026-04-14** to retroactively complete the
Session 020 RCA artifact suite. Session 020 (2026-04-11, artemis-ii
branch) delivered the six skills, five agents, and three teams in response
to this prompt:

> "Use our local research as a guide and your own knowledge on the
> subjects to craft a new set of skills, agents, and teams for root cause
> analysis using current best practices and industry standards."

The original Session 020 commits are `df7731df5`, `f0c7358e1`, and
`59d271e90`. Research grounding for the skills lives at
`docs/research/rca-deep/` (3,397 lines across six enrichment documents).

What Session 020 did not produce — and what every subsequent domain bundle
from Session 021 onward included as standard — was a chipset binding the
artifacts into a forkable department unit. RCA predated the department
template pattern. This chipset adds the missing binding without modifying
any of the existing skill, agent, or team files, so the original
investigation work remains intact and the department-template contract is
now satisfied.
