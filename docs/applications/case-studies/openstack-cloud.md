---
title: "OpenStack Cloud Platform Case Study"
layer: applications
path: "applications/case-studies/openstack-cloud.md"
summary: "How v1.33 applied NASA Systems Engineering methodology to build an OpenStack cloud platform with 19 skills, 31 agents, and complete educational documentation."
cross_references:
  - path: "applications/case-studies/index.md"
    relationship: "builds-on"
    description: "Part of case studies"
  - path: "applications/index.md"
    relationship: "builds-on"
    description: "Part of applications layer"
  - path: "templates/mission-retrospective.md"
    relationship: "extracted-from"
    description: "Mission retrospective template extracted from this case study"
  - path: "framework/features.md"
    relationship: "parallel"
    description: "Cloud operations features described in feature inventory"
  - path: "about.md"
    relationship: "parallel"
    description: "Design principles applied in this mission"
reading_levels:
  glance: "How v1.33 applied NASA Systems Engineering methodology to build an OpenStack cloud platform with 19 skills, 31 agents, and complete educational documentation."
  scan:
    - "Mission scope: full OpenStack deployment with GSD skill ecosystem and NASA SE documentation"
    - "Methodology: NPR 7123.1 compliance, 7-chapter sysadmin guide mapping SE phases"
    - "Deliverables: 19 skills, 31 agents, 3 crew configs, ASIC chipset, 44 runbooks"
    - "Execution: 14 phases, 33 plans, 6-wave parallel execution, 124 commits"
    - "Lessons: model assignment by content type, intake-first staging, dual-index runbooks"
created_by_phase: "v1.34-329"
last_verified: "2026-02-25"
---

# OpenStack Cloud Platform Case Study

The v1.33 milestone, "GSD OpenStack Cloud Platform (NASA SE Edition)," demonstrates GSD Skill
Creator applied to enterprise infrastructure at scale. Over 14 phases and 33 plans, the
mission produced a complete OpenStack cloud platform with 19 GSD skills, 31 agents, three crew
configurations, an ASIC chipset integrating the full operational environment, and comprehensive
educational documentation structured according to NASA Systems Engineering methodology.
This case study examines what was built, how GSD's methodology was applied, and what was
learned.


## Mission Scope

The v1.33 mission had three objectives: deploy a working OpenStack cloud environment, create a
GSD skill ecosystem for operating it, and produce educational documentation that teaches cloud
infrastructure through the lens of NASA Systems Engineering.

The scope was deliberately comprehensive. A cloud platform without operational documentation
is a liability. Operational documentation without a systematic methodology degrades into
tribal knowledge. The NASA SE structure provided the systematic methodology. GSD's workflow
discipline ensured the documentation was produced alongside the implementation, not as an
afterthought.

### What Was Built

**OpenStack Skills.** 19 GSD skills covering eight core OpenStack services (Keystone, Nova,
Neutron, Cinder, Glance, Swift, Heat, Horizon), six operations domains (monitoring, backup,
security, networking debug, capacity planning, kolla-ansible operations), four documentation
and methodology areas, and kolla-ansible deployment.

**Mission Crews.** Three crew configurations with 31 total agents. The deployment crew (12
roles) handles initial setup and service activation. The operations crew (eight roles) handles
day-to-day management, monitoring, and incident response. The documentation crew (eight roles)
produces and maintains operational documentation. Each crew supports Scout, Patrol, and
Squadron activation profiles that scale the number of active agents to match the work.

**ASIC Chipset.** A complete chipset YAML integrating the full operational environment: 19
skills, 31 agents, nine communication loops with priority-based bus arbitration, pre-deploy
and post-deploy evaluation gates, and budget enforcement. The chipset passed 118 out of 118
validation checks.

**NASA SE Documentation.** A seven-chapter sysadmin guide mapping NASA SE lifecycle phases to
OpenStack operations. An eight-service operations manual with 80 procedures. 44 runbooks with
dual indexes (task intent and failure symptom). A three-tier reference library with cross-cloud
translation tables mapping OpenStack concepts to AWS and GCP equivalents. A V&V plan with
NPR 7123.1 compliance matrix and 22 safety-critical test procedures.

**Cloud-Ops Modules.** TypeScript modules for dashboard integration, config staging pipeline,
deployment observation with sliding window sub-sequence detection, git commit rationale
formatting, and three-tier knowledge loading. 216 tests.


## Methodology Applied

The v1.33 mission applied GSD's standard lifecycle (discuss, plan, execute, verify) with two
methodology extensions specific to this mission's character.

### NASA Systems Engineering Integration

The documentation was structured around NASA's NPR 7123.1 Systems Engineering processes. The
seven-chapter sysadmin guide maps SE lifecycle phases (concept development, technology
development, preliminary design, final design, fabrication, integration, operations,
decommissioning) to OpenStack operational stages. This mapping is not decorative. It provides
a systematic framework for understanding when and why each OpenStack service matters in the
overall system lifecycle.

The V&V plan implements verification at three levels. The requirements verification matrix
traces every requirement to its verification method and evidence. The NPR 7123.1 compliance
matrix maps GSD's workflow phases to NASA SE processes and confirms coverage. The 22
safety-critical tests verify behaviors that could cause data loss, service outage, or security
compromise if they fail.

### Six-Wave Parallel Execution

The 33 plans were organized into six execution waves with parallel tracks. This reduced wall
clock time from an estimated 135 minutes (sequential) to approximately 45 minutes. Wave
organization followed GSD's parallelization advisor recommendations: plans that modify the
same files must be sequential; independent plans can run in parallel within a wave.

Model assignment followed content type. Opus handled methodology, crew definitions, and
chipset design where judgment about structure and relationships mattered most. Sonnet handled
skills, operational documentation, and reference material where consistency and thoroughness
mattered more than creative judgment. Haiku handled the reference library where mechanical
compilation dominated.


## Key Decisions

Several decisions made during the v1.33 mission have implications beyond cloud operations.

### Dual-Index Runbook Discovery

Traditional runbooks are organized by service or subsystem. When an operator faces a problem,
they must first determine which service is involved, then find the relevant runbook. The v1.33
runbooks provide two indexes: a task intent index ("I want to expand storage capacity") and a
failure symptom index ("Cinder volume creation fails with 'no valid host'"). Operators find
the right runbook by either what they want to do or what went wrong, without needing to
diagnose the service boundary first.

### Intake-First Staging

The config staging pipeline does not block on validation failure. Documents are accepted into
the staging area immediately (intake first), then assessed for quality and correctness (assess
second). This prevents the pipeline from becoming a bottleneck when multiple plans produce
configuration artifacts simultaneously. Invalid documents are flagged for attention but do not
prevent other documents from proceeding.

### Pre-Deploy Gates Block, Post-Deploy Gates Split

Pre-deployment evaluation gates all use the "block" action: the host must meet hardware
minimums before any deployment attempt begins. Post-deployment gates split between "block" for
critical services (Keystone, Nova) and "warn" for optional services (Swift, Horizon). This
distinction recognizes that a cloud without identity management is nonfunctional, but a cloud
without object storage is merely incomplete.

### Reverse-Order Decommissioning

Service decommissioning follows the exact reverse of deployment order:
Heat, Horizon, Swift, Cinder, Neutron, Nova, Glance, Keystone. This ensures that
services are removed only after all services that depend on them have been shut down.
The ordering is not arbitrary. It reflects the dependency graph of OpenStack services.


## Execution Metrics

| Metric               | Value                |
|----------------------|----------------------|
| Phases               | 14                   |
| Plans                | 33                   |
| Commits              | 124                  |
| Requirements         | 55                   |
| Tests                | 216                  |
| Lines of code        | ~5,900 (TypeScript)  |
| Documentation files  | 113                  |
| Execution waves      | 6                    |
| Skills created       | 19                   |
| Agents defined       | 31                   |
| Crew configurations  | 3                    |
| Validation checks    | 118/118              |


## Lessons Learned

The v1.33 mission produced several lessons that have been captured in the project's LLIS
(Lessons Learned Information System) format and inform future missions.

**Model assignment by content type works.** Matching model capability to content type (Opus
for judgment-heavy work, Sonnet for consistency-heavy work, Haiku for compilation work)
produced better results than uniform model assignment while reducing cost.

**Wave-based execution compounds savings.** The 67% wall-clock reduction (135 minutes
sequential to 45 minutes parallel) demonstrates that GSD's parallelization advisor produces
genuine efficiency gains, not just theoretical ones.

**Documentation produced alongside implementation is higher quality.** The sysadmin guide and
operations manual reflect the actual system because they were written by agents that had
just finished building and configuring the services. Documentation written after the fact
relies on memory and often diverges from reality.

**Chipset YAML as single source of truth scales.** The ASIC chipset configuration containing
all 19 skills, 31 agents, and nine communication loops in a single validated YAML file proved
manageable even at this scale. The 118/118 validation check rate confirms that the declarative
approach catches errors that imperative configuration would miss.

**Dual-index discovery should be the default for operational documentation.** Every future
runbook set should provide both task-intent and failure-symptom indexes. The cognitive load
reduction for operators justifies the additional indexing effort.


## Relationship to the Ecosystem

The v1.33 mission connects to the broader tibsfox.com ecosystem in several ways.

The [mission retrospective template](templates/mission-retrospective.md) was extracted from
the LLIS format used in this mission's lessons-learned documentation. Future missions use this
template for consistent retrospective capture.

The NASA SE methodology demonstrated here is the most rigorous application of the
[fix or amend](about.md) design principle: every divergence between implementation and
specification was either fixed in code or amended in the specification with a documented paper
trail.

The cloud-ops TypeScript modules (dashboard, staging, observation, git, knowledge) are
production code integrated into the skill-creator framework, demonstrating that application
layer work feeds back into the framework layer. This is the improvement cycle in action.

The complete OpenStack documentation is available at
[tibsfox.com](https://tibsfox.com/Tibsfox/gsd-skill-creator/docs/specialized-systems/openstack-cloud/).
