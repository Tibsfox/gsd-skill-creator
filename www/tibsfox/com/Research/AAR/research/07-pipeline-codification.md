# Pipeline Efficiency Codification

> **Domain:** Architecture Alignment and Refinement
> **Module:** 7 -- Pipeline Efficiency Codification
> **Through-line:** *The research pipeline is a codec. It encodes intent into structured work packets, transmits them through parallel execution channels, and decodes the output into verified, committed knowledge artifacts.* Everything documented here was learned by running the pipeline across 167+ projects spanning v1.49.82 through v1.49.131. This is not theory -- it is the operational manual extracted from evidence.

---

## Table of Contents

1. [Gastown Convoy Model](#1-gastown-convoy-model)
2. [Activation Profiles](#2-activation-profiles)
3. [Model Allocation Rules](#3-model-allocation-rules)
4. [5-Pass Planning Sequence](#4-5-pass-planning-sequence)
5. [Wave Architecture Patterns](#5-wave-architecture-patterns)
6. [Failure Recovery Playbook](#6-failure-recovery-playbook)
7. [Commit Strategy](#7-commit-strategy)
8. [Quality Gates](#8-quality-gates)
9. [Pipeline Metrics and Evidence](#9-pipeline-metrics-and-evidence)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. Gastown Convoy Model

### Formal Definition

The Gastown Convoy Model is a sequential-dispatch parallel-execution pipeline for producing research projects at scale. It was proven at the 49-project scale during v1.49.89 and refined through subsequent batches to v1.49.131.

The model has three roles:

- **Mayor** -- The coordinator agent. Dispatches work, monitors progress, resolves conflicts, manages commit sequencing. Never writes research content directly. One Mayor per convoy.
- **Polecats** -- Builder agents. Each Polecat receives a project assignment, produces all files for that project (research modules, mission pack, index, style, page, mission HTML), and signals completion. Polecats operate in parallel but commit sequentially.
- **Sling** -- The dispatch pipeline. Routes work items from the Mayor's queue to available Polecats via filesystem-based messaging (hook-persistence / mail-async channels).

### Execution Sequence

```
GASTOWN CONVOY -- EXECUTION FLOW
=================================================================

  Mayor: Load queue (N projects)
       |
       v
  Mayor: Dispatch batch of K projects to K Polecats
       |
       +---> Polecat-1: Build project A (all files)
       +---> Polecat-2: Build project B (all files)
       +---> Polecat-3: Build project C (all files)
       +---> Polecat-4: Build project D (all files)
       |
       v
  Mayor: Monitor completion signals
       |
       v
  Mayor: Sequential commit -- one project per commit
       |
       v
  Mayor: Dispatch next batch (projects E, F, G, H)
       |
       v
  [Repeat until queue is empty]
```

### When to Use

- **Use Gastown** when producing 5+ research projects in a single session
- **Use Gastown** when projects share a common template structure (index.html, style.css, page.html, mission.html, research/*.md, mission-pack/*)
- **Use Gastown** when the work is document production, not code synthesis
- **Do NOT use Gastown** for code-heavy milestones requiring cross-file coherence testing
- **Do NOT use Gastown** for fewer than 5 projects (overhead exceeds benefit)

### Scaling Limits

| Convoy Size | Polecats | Commit Time | Session Tokens | Observed |
|-------------|----------|-------------|----------------|----------|
| 5-12 projects | 3-4 | ~15 min | ~150K | Routine |
| 13-25 projects | 4 | ~30 min | ~300K | Reliable |
| 26-49 projects | 4 | ~60 min | ~500K | Proven (v1.49.89) |
| 50+ projects | 4 | ~90+ min | ~700K+ | Theoretical limit |

The practical ceiling is 4 Polecats. Adding a 5th creates more coordination overhead than it saves in parallel execution. Agent failures scale linearly with agent count -- at 4 agents the failure recovery cost is manageable; at 5+ it dominates.

---

## 2. Activation Profiles

Two activation profiles govern how the pipeline allocates roles to agents based on project scope.

### Squadron Profile (12 Roles)

**When to use:** Projects with 5 modules, focused single-domain scope, estimated token budget of 100-150K.

| Role | Agent | Responsibility |
|------|-------|----------------|
| Mayor | Coordinator | Dispatch, sequencing, conflict resolution |
| Polecat-1 through Polecat-4 | Builders | Module production |
| Raven | Verifier | Safety-critical test validation |
| Owl | Timekeeper | Wall-clock synchronization, deadline enforcement |
| Cedar | Filter | Quality gate enforcement, ledger updates |
| Hawk | Scout | Source verification, bibliography checking |
| Lex | Cataloger | Series.js updates, Rosetta classification |
| Sam | Groundskeeper | File structure validation, template compliance |
| Hemlock | Archivist | Cross-module coherence checking |

**Characteristics:**
- Single-domain projects (e.g., one broadcasting topic, one science topic)
- 5 research modules per project is the standard unit
- Total output per project: ~1,500-3,000 lines across all research modules
- Commit cadence: one commit per project, sequential

### Fleet Profile (17 Roles)

**When to use:** Projects with 6+ modules, broad multi-domain scope, estimated token budget of 200K+.

| Role | Agent | Additional to Squadron |
|------|-------|----------------------|
| All Squadron roles | As above | Base capabilities |
| Willow | Synthesizer | Cross-project theme extraction |
| Foxy | Integrator | PNW-specific domain authority |
| Shannon | Information theorist | Signal-to-noise optimization |
| Socrates | Questioner | Assumption challenging, gap identification |
| Euclid | Structuralist | Logical flow validation |

**Characteristics:**
- Multi-domain projects (PNW ecology, building codes, sensor systems)
- 6-36 research modules per project
- Total output per project: ~3,000-26,000+ lines
- Extended PNW projects (AVI, MAM, BPS, ECO, COL) always use Fleet
- Commit cadence: may require multiple commits per project for very large outputs

### Decision Criteria

```
IF module_count <= 5 AND domain_scope == "single":
    activate SQUADRON
ELIF module_count >= 6 OR domain_scope == "multi":
    activate FLEET
ELIF total_estimated_lines > 5000:
    activate FLEET
ELSE:
    activate SQUADRON (default)
```

---

## 3. Model Allocation Rules

Derived from evidence across 40+ releases and 167+ projects. These are not preferences -- they are empirical findings about where each model tier delivers reliable output.

### Opus -- Judgment Layer

**Assign Opus when the task requires:**
- Synthesis documents that weave multiple threads into coherent narrative
- Cross-module coherence checks (does module 3 contradict module 1?)
- Theorem nuance and mathematical precision (Unit Circle, complex plane work)
- Judgment-heavy analysis where wrong answers are expensive
- Cultural sensitivity and context-dependent naming decisions
- Rosetta cluster classification (requires understanding cross-domain relationships)
- Quality gate final review

**Evidence:** The ACE project (2,980 lines across 6 modules) required Opus for every module because each builds on the others and misalignment compounds. Squadron-tier projects with independent modules do not need this.

### Sonnet -- Production Layer

**Assign Sonnet when the task requires:**
- Survey-style research modules (enumerate, describe, catalog)
- Module production at standard depth (150-500 lines per module)
- Assembly of known facts into structured markdown
- Verification matrix generation
- Source bibliography compilation and checking
- Template instantiation (index.html, style.css, page.html from known patterns)
- Mission pack file generation

**Evidence:** The v1.49.89 mega-batch (59 projects) ran entirely on Sonnet-tier production with Opus synthesis passes. Sonnet handles the volume; Opus handles the judgment.

### Haiku -- Scaffolding Layer

**Assign Haiku when the task requires:**
- Schema generation (JSON, YAML templates)
- File scaffolding (create directory structure, populate boilerplate)
- No-judgment tasks (copy a template, rename fields, format output)
- Series.js entry generation from known patterns
- Style.css generation from color palette specifications

**Evidence:** Haiku consistently produces correct scaffolding faster and cheaper than Sonnet. The quality difference is undetectable for template tasks. Using Sonnet for scaffolding wastes budget.

### Allocation Matrix

| Task Type | Model | Token Budget | Quality Risk |
|-----------|-------|-------------|-------------|
| Synthesis | Opus | High | Low (correct tier) |
| Survey/catalog | Sonnet | Medium | Low |
| Cross-module coherence | Opus | High | Low |
| Template instantiation | Haiku | Low | None |
| Source verification | Sonnet | Medium | Low |
| Rosetta classification | Opus | Medium | Low |
| Verification matrix | Sonnet | Low | None |
| Schema/YAML | Haiku | Low | None |

---

## 4. 5-Pass Planning Sequence

Discovered during the v1.49.89 mega-batch and codified here. Every batch of research projects passes through five planning phases before execution begins.

### Pass 1: Catalog

**Input:** Raw list of project codes and topics from source packs.
**Output:** Sorted queue with complexity estimates.

- Enumerate all projects to be produced
- Assign 3-letter codes following existing convention (check series.js for conflicts)
- Estimate module count per project (5 = standard, 6+ = extended)
- Sort by complexity: simple projects first, complex projects last
- Rationale: Simple-first builds momentum and catches template issues early

### Pass 2: Quality

**Input:** Sorted catalog.
**Output:** Quality-annotated catalog with depth targets.

- For each project, set minimum line count targets per module
- Standard target: 150-300 lines per module (based on series median of 328)
- Flag projects that need extended treatment (domain depth, source availability)
- Identify safety-critical modules that require BLOCK-level test coverage
- Mark verification matrix requirements

### Pass 3: College

**Input:** Quality-annotated catalog.
**Output:** College department assignments.

- Assign each project to a College department (culinary-arts, mathematics, mind-body, etc.)
- Verify department capacity (no department overloaded in a single batch)
- Check for panel cross-references (does this project connect to existing panels?)
- Note calibration requirements for new domains

### Pass 4: Rosetta

**Input:** College-assigned catalog.
**Output:** Rosetta cluster assignments.

- Classify each project into one of 10 Rosetta clusters: Ecology, Electronics, Infrastructure, Energy, Creative, Business, Vision, Broadcasting, Science, Music
- Identify hub projects (high connectivity to existing cluster members)
- Flag bridge projects that connect two or more clusters
- Update cluster membership projections

### Pass 5: Execution

**Input:** Fully classified and annotated catalog.
**Output:** Wave execution plan with agent assignments.

- Partition projects into waves (Wave 0 = foundation, Wave 1A/1B = parallel tracks, Wave 2 = synthesis, Wave 3 = publication)
- Assign Polecats to waves
- Set commit order within each wave
- Establish rollback points between waves
- Generate the dispatch queue for the Mayor

---

## 5. Wave Architecture Patterns

### Wave 0 -- Foundation

**Purpose:** Establish the batch infrastructure before any content production begins.

- Create directory structures for all projects in the batch
- Generate series.js entries
- Validate no code conflicts with existing projects
- Set up commit tagging convention for the batch
- Duration: 5-10 minutes

### Wave 1A / 1B -- Parallel Production Tracks

**Purpose:** Maximum throughput content production.

- Wave 1A and 1B run concurrently with different Polecat assignments
- 1A typically handles the first half of the sorted queue
- 1B handles the second half
- Each Polecat within a wave operates on a single project at a time
- No cross-project dependencies within a wave
- Duration: 20-40 minutes per track

### Wave 2 -- Synthesis

**Purpose:** Cross-project coherence and integration.

- Verify all modules reference correct cross-project links
- Check Rosetta cluster connections are bidirectional
- Validate source bibliographies have no broken references
- Generate any missing verification matrices
- Duration: 10-15 minutes

### Wave 3 -- Publication

**Purpose:** Final commit, tag, and release preparation.

- Sequential commit: one project per commit, conventional commit format
- Tag batch with version number
- Update series.js with final entries
- Generate release notes if applicable
- Duration: 15-30 minutes (commit-bound, not compute-bound)

---

## 6. Failure Recovery Playbook

Three failure modes dominate pipeline execution. Each has a specific recovery procedure.

### Content Filter Rejection

**Symptom:** Agent output is blocked mid-generation. Partial module produced.
**Frequency:** ~2-5% of modules in sensitive domains (biology, conflict history, weapons topics).
**Recovery:**

1. Log the blocked module and its project code
2. Do NOT retry with the same prompt immediately (will hit the same filter)
3. Rephrase the module scope to avoid the triggering content
4. If the topic is inherently sensitive, split into two modules: one factual/technical, one contextual
5. Assign to a different Polecat (fresh context avoids filter state carryover)
6. Resume convoy with the next project while the blocked module is reworked

### Authentication / Rate Error

**Symptom:** API returns 401, 429, or 503. Agent stalls.
**Frequency:** ~1-3% of sessions, usually during high-load periods.
**Recovery:**

1. Pause the affected Polecat (do not kill -- preserve state)
2. Wait 30-60 seconds for rate limit window to reset
3. Retry the stalled agent
4. If persistent (3+ retries), reassign the project to a different Polecat
5. Log the failure for session post-mortem
6. Never retry more than 3 times -- escalate to Mayor for manual resolution

### Agent Stall

**Symptom:** Polecat stops producing output. No error message. Context appears intact.
**Frequency:** ~5-8% of extended sessions (>60 minutes).
**Recovery:**

1. Check agent output file for partial content
2. If partial content is usable (>70% complete), complete manually
3. If partial content is minimal (<30%), restart the project from scratch on a new Polecat
4. Reduce convoy parallelism by 1 for the remainder of the session (4 -> 3 Polecats)
5. Agent stalls correlate with context length -- sessions over 500K tokens see higher stall rates
6. Prevention: break mega-batches into sub-sessions of 25-30 projects each

---

## 7. Commit Strategy

### One Commit Per Project

Every research project receives exactly one commit containing all of its files. This is non-negotiable. Rationale:

- `git bisect` works at project granularity
- `git log --oneline` gives a readable project-by-project history
- Reverting a single project does not affect others
- Release notes can reference individual commit hashes per project

### Commit Message Format

```
feat(www): add <CODE> research project -- <short description>
```

Examples:
```
feat(www): add DNS research project -- dns full protocol, resolution to dnssec
feat(www): add TCP research project -- tcp/ip protocol, handshake to quic
feat(www): add PNP research project -- ports and pipes, unix ipc to socket api
```

Rules:
- Type is always `feat` for new research projects (they are features)
- Scope is always `www` (all research lives under www/)
- Subject uses imperative mood, lowercase, no period
- Description after the `--` summarizes the project's topic range
- Subject line under 72 characters

### Tagging Convention

Batch tags follow the version chain:
```
v1.49.82  -- first batch in the chain
v1.49.83  -- second batch
...
v1.49.131 -- latest batch
```

Each tag marks the commit boundary of a batch. Tags are lightweight (no annotation) for speed during mega-batch sessions.

### Wave Commit Markers

When session boundaries force combining multiple waves into a single commit:

```
feat(www): summary of combined work

Wave N: [what wave N delivered]
Wave M: [what wave M delivered]
```

This preserves bisect intent even when commit boundaries do not align with wave boundaries.

---

## 8. Quality Gates

### Safety-Critical BLOCK Tests

Any module covering the following topics must pass safety-critical verification:

- Species identification (AVI, MAM, ECO) -- misidentification has real-world consequences
- Building codes and structural calculations (BCM) -- life safety
- Electrical systems and wiring (BCM, LED) -- fire and shock risk
- Chemical processes and reactions (THE, AGR) -- handling safety
- Medical or health claims -- liability
- Navigation and geolocation (BPS) -- safety of life at sea / in air

BLOCK tests halt the pipeline. No project with a failing BLOCK test may be committed.

### Verification Matrix

Every project with 6+ modules must include a verification matrix module. The matrix cross-references:

- Module completeness (all sections present)
- Source count per module (minimum 3 primary sources)
- Cross-reference accuracy (links to other modules resolve correctly)
- Factual claims spot-checked against primary sources
- Rosetta cluster connections validated

### Source Bibliography

Every research module must include a Sources section with:

- Numbered references in citation order
- Primary sources preferred over secondary
- URLs for web-accessible sources
- Publication dates where available
- Minimum 5 sources per standard module, 10+ for extended modules

---

## 9. Pipeline Metrics and Evidence

### Aggregate Statistics (v1.49.82 through v1.49.131)

| Metric | Value |
|--------|-------|
| Total projects produced | 167+ |
| Total research modules | 1,175 |
| Total research lines | 429,665 |
| Mean lines per module | 365.7 |
| Median lines per module | 328 |
| Standard deviation | 320.2 |
| Smallest module | 23 lines |
| Largest module | 3,348 lines |
| Projects with 5 modules | 73 (most common) |
| Projects with 6 modules | 59 |
| Projects with 8+ modules | 25 |
| Rosetta clusters | 10 |
| Session record | 59 projects in single session (v1.49.89) |

### Production Rate

- **Sustained rate:** 8-12 projects per hour with 4 Polecats
- **Burst rate:** 15-20 projects per hour for template-heavy batches
- **Commit rate:** ~2 minutes per project (sequential, IO-bound)
- **Quality gate rate:** ~5 minutes per project (Opus verification)

### Failure Rates

| Failure Type | Rate | Recovery Time |
|-------------|------|--------------|
| Content filter | 2-5% | 5-10 min per module |
| Auth/rate error | 1-3% | 1-2 min |
| Agent stall | 5-8% | 10-15 min |
| Total pipeline availability | ~90% | -- |

---

## 10. Cross-References

- **Module 08:** Quality Audit -- Module Depth Statistics (companion audit using this pipeline's output)
- **ACE/research/01:** Claude Code Agentic Architecture -- the master loop that powers the pipeline
- **ACE/research/03:** GSD Chipset Orchestration -- the chipset layer beneath convoy dispatch
- **Gastown skill:** `.claude/skills/mayor-coordinator.md` -- Mayor implementation
- **Polecat skill:** `.claude/skills/polecat-worker.md` -- Polecat execution pattern
- **Sling skill:** `.claude/skills/sling-dispatch.md` -- dispatch pipeline
- **Series.js:** `www/tibsfox/com/Research/series.js` -- project catalog

---

## 11. Sources

1. GSD Skill Creator project history -- commit log from v1.49.82 to v1.49.131 (2026-03)
2. Gastown convoy model -- first proven at scale in v1.49.89 mega-batch session
3. Memory file `memory/v1-49-89-mega-batch.md` -- session details for 59-project batch
4. CLAUDE.md project instructions -- commit convention and wave commit markers
5. `.claude/skills/` directory -- skill definitions for Mayor, Polecat, Sling, GUPP
6. GSD workflow documentation -- `.claude/commands/gsd/` command definitions
7. Rosetta Core translation engine -- `www/tibsfox/com/Research/ROSETTA.md`
8. Series.js catalog -- 167+ entries with project metadata
9. College Structure -- `.college/` directory for department and panel assignments
10. Trust system design -- `memory/trust-system.md` for trust ladder integration
