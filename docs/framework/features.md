---
title: "Features and Capabilities"
layer: framework
path: "framework/features.md"
summary: "Complete inventory of GSD Skill Creator capabilities organized by domain, from pattern discovery to security hardening."
cross_references:
  - path: "framework/index.md"
    relationship: "builds-on"
    description: "Part of framework layer"
  - path: "framework/core-concepts.md"
    relationship: "parallel"
    description: "Conceptual foundation for these features"
  - path: "framework/architecture/index.md"
    relationship: "parallel"
    description: "How these features are architecturally connected"
  - path: "framework/getting-started.md"
    relationship: "parallel"
    description: "Hands-on introduction to key features"
reading_levels:
  glance: "Complete inventory of GSD Skill Creator capabilities organized by domain, from pattern discovery to security hardening."
  scan:
    - "Core learning: observation, pattern detection, skill suggestion, bounded refinement"
    - "Composition: agent generation, team topologies, orchestration"
    - "Token management: budget system, cache-aware ordering, research compression"
    - "Developer tools: dashboard, terminal, console, staging, design system"
    - "Educational packs: electronics, Minecraft, AGC, knowledge modules"
    - "Infrastructure: MCP integration, brainstorming, cloud operations, security hardening"
created_by_phase: "v1.34-329"
last_verified: "2026-02-25"
---

# Features and Capabilities

GSD Skill Creator has grown across 42 milestones from a skill management tool into a
comprehensive development ecosystem. This page inventories the framework's capabilities
organized by domain. Each domain groups related features and identifies the milestone version
that introduced them. For the conceptual foundation, see
[Core Concepts](framework/core-concepts.md). For how these features connect architecturally,
see the [Architecture Overview](framework/architecture/index.md).


## Core Learning

The learning domain covers the six-step flywheel: observe, detect, suggest, create, refine,
compose. These are the capabilities that make skill-creator adaptive.

**Session observation** records compact summaries of Claude Code sessions in JSONL format,
capturing commands, files, decisions, and skill activations. The observation system is bounded
by configurable retention (default 90 days / 1000 sessions) and uses append-only writes with
SHA-256 checksums for integrity.

**Pattern detection** scans observations for recurring sequences. It extracts command n-grams,
file access patterns, and workflow structures, then clusters them using DBSCAN with automatic
epsilon tuning. Patterns appearing three or more times become candidates.

**Skill suggestion** presents candidates with evidence (which sessions, which projects, which
files) and requires explicit user confirmation before creating any skill. The system never
auto-applies suggestions.

**Bounded learning** constrains refinement to prevent drift. Each refinement is limited to 20%
content change, requires three or more corrections as evidence, enforces a seven-day cooldown,
and tracks cumulative drift with a 60% threshold. Contradictory feedback is detected and
flagged before application.

**Agent composition** detects stable co-activation clusters (five or more co-activations over
seven or more days) and generates composite agents from frequently paired skills.

**Pattern discovery** provides a `discover` command that scans all projects under
`~/.claude/projects/`, extracts tool sequence n-grams, clusters similar prompts, and ranks
candidates by frequency, cross-project occurrence, recency, and consistency. It supports
incremental scanning, noise filtering, and stream parsing for large session files.


## Composition and Orchestration

These capabilities enable multi-agent coordination at increasing levels of complexity.

**Agent teams** support four topology patterns: leader-worker for heterogeneous task
delegation, pipeline for staged transformations, map-reduce for parallel processing, and swarm
for self-organizing work. Teams are validated for structural correctness including deadlock
detection.

**GSD orchestrator** is a master agent that routes user intent to GSD commands through a
five-stage classification pipeline: exact match, lifecycle filtering, Bayesian classification,
semantic fallback, and confidence resolution. It provides lifecycle coordination, verbosity
control, and human-in-the-loop gates.

**Skill workflows** chain skills into multi-step sequences with dependency tracking and crash
recovery. Each step in a workflow can depend on the output of previous steps.

**Skill roles** apply behavioral constraints and tool scoping to agent personas, limiting what
an agent can do based on its assigned role.

**Inter-skill events** enable causal activation chains where one skill's activation triggers
another through an emit/listen system.


## Token Management

Token efficiency is critical for AI-assisted development. These features ensure maximum value
per token consumed.

**Token budget system** allocates 2-5% of the context window to skills with three-tier
priority (critical, standard, optional). Different agent profiles can have different budgets.
The loading projection separates installed total from loadable total, so you always know what
will actually load.

**Skill pipeline** replaces monolithic skill loading with a composable six-stage architecture:
score, resolve, model-filter, cache-order, budget, load. Each stage is independently
configurable and testable.

**Cache-aware ordering** assigns cacheTier metadata (0-9) to ensure deterministic load order
across rapid sequential agent spawns. This maximizes prompt cache hits on Claude Code's
five-minute cache window.

**Research compression** distills reusable insights from large research documents (3,000-5,000
tokens) into compact skills (300-500 tokens), achieving 10-20x compression with staleness
detection.

**Parallelization advisor** analyzes plan dependencies and recommends wave-based parallel
execution, taking into account skill coverage, token history, and rate limit proximity.


## Developer Tools

The framework includes a suite of visual and operational tools for managing complex projects.

**Planning docs dashboard** generates a browsable HTML site from `.planning/` artifacts with
dark theme, JSON-LD structured data, Open Graph meta tags, and incremental builds using
SHA-256 content hashing. Six pages cover project overview, phases, plans, summaries, metrics,
and a live console.

**Live metrics dashboard** provides real-time session monitoring with ticking duration, commit
feed, heartbeat indicator, phase velocity analytics, planning quality scores, historical
trends, and CSS-only visualizations at configurable sample rates.

**Terminal integration** supports native PTY terminals through Tauri and xterm.js with
watermark-based flow control and tmux session binding.

**Console system** provides a filesystem message bus with Zod-validated JSON envelopes, an
interactive question system (five types: binary, choice, multi-select, text, confirmation),
drag-and-drop document upload, and hot-configurable settings.

**Staging layer** implements a five-state filesystem pipeline (inbox, checking, attention,
ready, aside) with an 11-pattern hygiene engine for detecting embedded instructions, hidden
content, and unsafe YAML. Trust-aware reporting uses familiarity tiers with trust decay.

**Information design system** provides CSS design tokens (six domain colors, four signal
colors, typography with Inter and JetBrains Mono, spacing scale), persistent gantry status
strip with agent topology, six SVG entity shapes with dual encoding, and a subway-map topology
renderer with bezier edges.


## Desktop Application

The GSD-OS desktop application provides a native development environment.

**Tauri shell** wraps the framework in a native desktop application with a Rust backend, Vite
webview frontend, bidirectional IPC (commands, events, channels), and capability-based ACL
security.

**WebGL CRT engine** renders multi-pass post-processing effects including scanlines, barrel
distortion, phosphor glow, chromatic aberration, and vignette, with CSS fallback for systems
without WebGL support.

**Indexed palette system** provides 32 colors with five retro-computing presets, OKLCH
generation, and copper list raster effects inspired by the Amiga's hardware palette system.

**Window manager** implements an Amiga Workbench-inspired interface with depth cycling,
drag/resize, taskbar, pixel-art icons, and system menu.

**Boot and calibration** includes a three-screen calibration wizard and an Amiga chipset boot
sequence animation with accessibility auto-detection.


## Educational Packs

The framework produces and manages domain-specific educational content.

**Electronics pack** provides MNA circuit simulation (seven component models, DC/AC/transient
analysis with Newton-Raphson), digital logic simulation (eight gate types, flip-flops, timing
diagrams), a safety warden (three modes, IEC 60449 classification, positive framing), learn
mode with three-level depth tied to *The Art of Electronics*, 15 modules across four tiers with
77 interactive labs, and five specialized engines for DSP, GPIO, PLC, solar, and PCB design.

**Apollo AGC simulator** implements the complete Block II CPU: 38 instructions, ones'
complement ALU, bank-switched memory, interrupt system, Executive/Waitlist/BAILOUT, DSKY
interface, Executive Monitor, and learn mode. Development tools include a yaYUL assembler,
step debugger, disassembler, and rope loader. An 11-chapter curriculum with exercises
culminates in a 1202 alarm capstone.

**Foundational knowledge packs** cover 35 subjects across core academic, applied, and
specialized domains with vision documents, module definitions, activities, assessments, and
resources. A GSD-OS dashboard provides browsing, search, detail views, skill trees, and
progress tracking.

**Minecraft Knowledge World** includes a Fabric server with Syncmatica mod stack, themed
districts, spawn tutorial, schematic library, and educational curriculum.

**Amiga emulation** supports FS-UAE with AROS ROM, application profiles for creative tools
(Deluxe Paint, OctaMED, ProTracker, PPaint), and format converters.


## MCP Integration

Model Context Protocol integration connects skill-creator to the broader AI tool ecosystem.

**MCP Host Manager** (Rust) manages server lifecycles with stdio transport, crash detection,
exponential backoff, tool routing, capability caching, and trace emission.

**Gateway MCP Server** exposes 19 tools across six groups, four resource providers, and three
prompt templates over Streamable HTTP with bearer authentication and per-tool scope
enforcement.

**MCP templates** generate complete, buildable TypeScript projects for server, host, and
client scenarios.

**Agent bridge** enables SCOUT and VERIFY agents as MCP servers and EXEC as an MCP client,
with staging gates and context isolation for inter-agent communication.

**MCP security pipeline** enforces hash verification, trust lifecycle with 30-day decay,
invocation validation, rate limiting, and audit logging. Staging gates apply to all paths
with no bypass mechanism.


## Brainstorming Support

AI-facilitated brainstorming with structured methodology.

**Eight specialized agents** cover facilitation (Facilitator with assessment, transitions, and
energy management), ideation (Ideator), questioning (Questioner), analysis (Analyst with
SCAMPER and Six Hats), mapping (Mapper), perspective-taking (Persona with constructive
historical figures), evaluation (Critic, active only during Converge phase), and recording
(Scribe, always-on capture).

**16 brainstorming techniques** span four categories: individual (freewriting, mind mapping,
rapid ideation, question brainstorming), collaborative (brainwriting 6-3-5, round robin,
brain-netting, rolestorming, figure storming), analytical (SCAMPER, Six Hats, starbursting,
Five Whys), and visual (storyboarding, affinity mapping, lotus blossom).

**Osborn's rules** are enforced architecturally, not by policy. The Critic agent is blocked at
instantiation level during non-Converge phases, with two-stage evaluative detection achieving
less than 5% false positive rate.


## Cloud Operations

Enterprise cloud platform management with NASA Systems Engineering methodology.

**OpenStack skills** cover 19 GSD skills spanning eight core services, six operations domains,
four documentation and methodology areas, and kolla-ansible deployment.

**Mission crews** define three crew configurations (31 agents total) for deployment (12 roles),
operations (eight roles), and documentation (eight roles) with Scout, Patrol, and Squadron
activation profiles.

**ASIC chipset** integrates the full operational environment: 19 skills, 31 agents, nine
communication loops, pre/post-deploy evaluation gates, and budget enforcement with 118
validation checks.


## Infrastructure and Security

System-level capabilities for reliability and safety.

**Security hardening** prevents path traversal, enforces YAML safe deserialization, validates
JSONL integrity with checksums, implements secret redaction, and maintains a dangerous command
deny list.

**Data integrity** includes SHA-256 checksums on observation entries, schema validation,
observation rate limiting, anomaly detection, and compaction with purge.

**Learning safety** tracks cumulative drift with a 60% threshold, detects contradictory
feedback, and provides a skill audit CLI.

**Access control** monitors file integrity, logs operations for audit, limits inheritance
depth, analyzes impact of changes, and manages concurrency locks with operation cooldowns.

**Den operations** provide a filesystem message bus with eight priority levels and ISA encoding,
a 10-position staff topology organized in five operational divisions, four auto-selected
topology profiles (Scout, Patrol, Squadron, Fleet), and a HALT/CLEAR emergency protocol with
a nine-type recovery matrix.


## Vision-to-Mission Pipeline

Automated transformation from project vision to executable mission plans.

**Vision document parser** extracts sections via regex, classifies archetypes (Educational,
Infrastructure, Organizational, Creative), and checks document quality.

**Wave planner** detects parallel tracks via graph coloring, builds dependency graphs with
critical path analysis, and calculates sequential savings.

**Model assignment engine** scores signals for Opus, Sonnet, and Haiku assignment with
budget validation and downgrade-only auto-rebalance.

**Pipeline orchestrator** runs the complete vision-to-mission transformation with stage
skipping, template rendering, enrichment, and structured error handling. Failures at the
vision stage are unrecoverable; research and mission failures produce partial output.


## Ecosystem Integration

Cross-component coordination and specification.

**Ecosystem dependency DAG** maps 20 nodes and 48 edges with critical path analysis and
five-milestone build sequencing.

**EventDispatcher specification** defines a single-instance inotify watcher with subscriber
fan-out, reducing watch pressure compared to per-consumer watchers.

**Conformance audit** provides a 336-checkpoint matrix against 18 vision documents with
four-tier verification (T0/T1/T2/T3), achieving zero undocumented divergences.

**Platform portability** abstracts hardware discovery, distribution packages (dnf, apt,
pacman), multi-hypervisor VM operations, and container fallback across supported platforms.
