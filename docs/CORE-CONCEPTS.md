# Core Concepts

gsd-skill-creator is an adaptive learning layer for Claude Code that creates, validates, and manages skills, agents, teams, chipsets, and mission packs. What started as a skill management CLI has grown into a full platform — a desktop environment, a translation engine, a communication protocol, a college of explorable knowledge, and a creative ensemble of named agents. These are its core concepts, from the earliest foundations through v1.49.19.

---

## Skills

Skills are reusable knowledge files stored in `.claude/skills/`. Each skill is a Markdown file with YAML frontmatter that defines:

- **Triggers** - When the skill should activate (intent patterns, file patterns, context patterns)
- **Content** - The knowledge or instructions to inject into Claude's context
- **Metadata** - Name, description, version, enabled status, timestamps

Example skill structure:
```
.claude/skills/
  typescript-patterns/
    SKILL.md        # Main skill file (frontmatter + content)
    reference.md    # Optional reference material
    scripts/        # Optional automation scripts
```

**Key Properties:**
- Human-readable and editable as plain Markdown
- Portable (no project-specific paths or dependencies)
- Version-tracked through git history
- Can extend other skills via `extends:` frontmatter

## Skill Scopes

Skills can exist at two locations (scopes):

| Scope | Location | Purpose |
|-------|----------|---------|
| **User-level** | `~/.claude/skills/` | Shared across all projects. Default scope. |
| **Project-level** | `.claude/skills/` | Project-specific customizations. |

**Precedence Rule:** When the same skill name exists at both scopes, the project-level version takes precedence. This allows you to:
- Create portable user-level skills shared across projects
- Override specific skills per-project when needed

**Scope Commands:**

```bash
# Create at user-level (default)
skill-creator create

# Create at project-level
skill-creator create --project

# See which version of a skill is active
skill-creator resolve my-skill

# List skills filtered by scope
skill-creator list --scope=user
skill-creator list --scope=project

# Delete project-level version (user-level becomes active)
skill-creator delete my-skill --project
```

**Use Cases:**

- **User-level skills** - Personal preferences, coding standards you use everywhere, language-specific patterns
- **Project-level skills** - Project conventions, framework-specific patterns, team standards that override your personal defaults

## Observations

The system observes your Claude Code sessions and stores pattern summaries in `.planning/patterns/`. Observations are:

- **Token-efficient** - Stores summaries, not full transcripts
- **Bounded** - Configurable retention (default: 90 days / 1000 sessions)
- **Append-only** - JSONL format for safe concurrent writes

Observation data drives:
- Skill suggestions based on recurring workflows
- Co-activation tracking for agent composition
- Feedback-driven skill refinement

## Agents

When skills frequently activate together (5+ co-activations over 7+ days), the system suggests combining them into composite agents stored in `.claude/agents/`.

Agents:
- Bundle related expertise for common workflows
- Follow Claude Code's agent format
- Can specify model, tools, and included skills
- Are auto-generated from skill clusters

---

## Teams

*Introduced in v1.4*

Teams coordinate multiple agents working together on shared goals. Where agents bundle skills for individual workflows, teams bundle agents for collaborative workflows — dividing labor, sharing context, and synchronizing outputs.

A team is defined by a YAML schema specifying its topology, member roles, and coordination rules. Teams are stored in `.claude/teams/` and managed through the CLI.

**Three topologies:**

| Topology | Pattern | When to Use |
|----------|---------|-------------|
| **Leader-Worker** | One coordinator distributes work to specialists | Most common. Code review, milestone execution, feature development. |
| **Pipeline** | Agents pass output forward in a chain | Sequential transformations. Compile → test → deploy. |
| **Swarm** | Peers self-organize around available work | High-parallelism tasks. Documentation sweeps, test generation. |

**Key Properties:**
- Member capability declarations and role assignments
- GSD workflow templates for team-based execution
- `skill-creator team create/list/validate/run` CLI commands
- Teams can be spawned on-demand with unique agent names scoped to a milestone

**In practice**, the project uses teams extensively for milestone execution. The `sc-dev-team` team (lab-director, flight-ops, capcom, watchdog) handles development branch work. APT (Agent Performance Testing) sessions have run with up to 7 parallel agents, achieving ~7x token throughput compared to single-agent execution. Key lessons: single agent per milestone avoids file conflicts, unique agent names prevent state collisions, and 3 agents is optimal for documentation-only runs.

---

## Chipsets

*Amiga model introduced in v1.13, Gastown model introduced in v1.49.19*

A chipset is a declarative configuration that teaches Claude Code how to coordinate multiple agents using proven hardware-inspired patterns. The name is literal — just as a computer's chipset defines how CPU, memory, I/O, and graphics processors work together, a gsd-skill-creator chipset defines how AI agents coordinate through typed messages, shared buses, and scheduled execution.

Chipsets live in `data/chipset/` as YAML definitions with JSON schemas, TypeScript types, validators, and companion skills. Two chipset models exist, each drawn from a different hardware metaphor.

### Amiga Coprocessor Model (v1.13)

The original chipset, inspired by the Commodore Amiga's custom coprocessor architecture. Four specialized chips coordinate through message ports and a signal system, just as Agnus, Denise, Paula, and Gary divided labor in the Amiga's custom chipset.

| Chip | Domain | Hardware Analog |
|------|--------|-----------------|
| **Agnus** | Context management — STATE.md, observations, lifecycle | Memory controller (DMA) |
| **Denise** | Output rendering — dashboards, reports, visualizations | Graphics processor |
| **Paula** | I/O operations — git, file system, external tools | I/O controller |
| **Gary** | Glue logic — coordination, message routing, signal distribution | Bus controller |

The Amiga chipset includes:
- **Pipeline List Format** — WAIT/MOVE/SKIP instructions synced to GSD lifecycle events
- **Offload Engine** — Script promotion for deterministic operations with child process execution
- **Pipeline Executor** — Lifecycle sync bridge resolving WAIT instructions, dispatching activations in sprite (~200 tokens), full, blitter (offload), and async modes
- **Exec Kernel** — Prioritized round-robin scheduler with per-team token budgets and burst mode (BLITHOG)
- **Pipeline Learning** — Observation-to-list compiler with Jaccard feedback and versioned library

This chipset drives the boot sequence animation in the GSD-OS Desktop, where Agnus, Denise, Paula, and Gary initialize in sequence just as they did on a real Amiga powering on.

### Gastown Orchestration Model (v1.49.19)

The second chipset, absorbing patterns from [steveyegge/gastown](https://github.com/steveyegge/gastown) — a Go-based multi-agent workspace orchestration system. Where the Amiga model coordinates 4 specialized processors, the Gastown model coordinates an entire town of agents through a CPU hardware metaphor. Each Gastown "rig" is a complete autonomous coordination instance with its own Mayor (per-rig agent), Polecats (workers), Witness (observer), and Refinery (merge queue). A user's project can run multiple rigs in parallel — different teams working on different subsystems, each with their own mayor coordinating independently. Skill Creator's agent chipset can wire up and manage multiple rigs from a unified mission control dashboard, simplifying the complexity of the wiring harness that connects the dashboard control surface to distributed rig management features.

| Component | Role | Hardware Analog |
|-----------|------|-----------------|
| **Mayor** (Northbridge) | Per-rig coordinator. Never builds. Manages a single rig's workflow. | CPU coordinator |
| **Polecats** (ALU Pool) | Execute work items. 1-30 ephemeral agents per rig. | Arithmetic Logic Units |
| **Witness** (PMU) | Monitors agent health within a rig. Never acts on code. | Performance Monitoring Unit |
| **Refinery** (DMA) | Sequential merge queue for deterministic integration per rig. | Direct Memory Access |

**Communication channels** map to hardware bus types:

| Channel | Analog | Pattern | Use |
|---------|--------|---------|-----|
| **Mail** | PCIe | Durable async messaging | Task assignments, status reports |
| **Nudge** | SMI (System Management Interrupt) | Synchronous immediate signal | "Look at this now" |
| **Hook** | MMIO (Memory-Mapped I/O) | Pull-based work queue | GUPP propulsion — "if it's on your hook, run it" |
| **Handoff** | Reset | Context transfer between agents | Shift changes, continuation |

**Two pipelines** handle work lifecycle:
- **Sling** (Fetch-Decode-Dispatch) — 7-stage pipeline routing work items to the right Polecat
- **Done** (Retirement) — 7-stage pipeline verifying, merging, and closing completed work

The Gastown chipset ships as:
- A complete YAML definition (`data/chipset/gastown-orchestration/gastown-orchestration.yaml`)
- 12 skills teaching Claude Code the coordination patterns (Mayor, Polecat, Witness, Refinery, Mail, Nudge, Hook, Sling, Done, Runtime HAL, GUPP, Beads)
- TypeScript types, a 4-stage validator, and a crash-recoverable StateManager
- 108 tests across 7 test files

### What Lives Where

The two chipsets are complementary layers, not alternatives. Amiga manages resources within a single agent context — memory, output, I/O, lifecycle. Gastown coordinates between multiple agents — who works on what, how they communicate, when work is done. A system can use both: Amiga governs what happens inside each agent, Gastown governs what happens between them.

| Concern | Amiga Chipset | Gastown Chipset |
|---------|---------------|-----------------|
| Context/memory management | Agnus | — |
| Code generation/output | Denise | — |
| File I/O, API calls | Paula | — |
| Routing, lifecycle | Gary | — |
| Agent dispatch | — | Sling |
| Agent retirement | — | Done |
| Multi-agent coordination | — | Mayor |
| Task execution | — | Polecat |
| Health monitoring | — | Witness |
| Merge queue processing | — | Refinery |
| Async messaging | — | Mail |
| Sync signaling | — | Nudge |
| Work assignment | — | Hook |

**Gastown is not a dependency.** The chipset is an independent implementation of Gastown's coordination patterns expressed in gsd-skill-creator's native formats. If Gastown disappeared tomorrow, the chipset would continue to work. But if you run Gastown alongside gsd-skill-creator, the 10-document integration guide in `docs/gastown-integration/` explains how they interoperate and where the trust boundaries lie.

> **See also:** [Gastown Integration Guide](gastown-integration/README.md) — architecture overview, concept mapping, trust boundary model, setup instructions, agent topology, communication channels, dispatch/retirement pipelines, upstream intelligence, multi-instance operation, and GSD milestone workflow.

---

## DACP — Deterministic Agent Communication Protocol

*Introduced in v1.49*

DACP replaces markdown-only agent handoffs with structured three-part bundles: human intent (markdown) + structured data (JSON) + executable code (scripts). It is the communication protocol that makes multi-agent coordination reliable — reducing the ambiguity that causes agents to drift from the original intent.

**The core problem:** When Agent A tells Agent B what to do in free-form prose, Agent B interprets it differently than intended. Small misinterpretations compound across handoff chains. DACP solves this by encoding intent at the right level of structure.

### Adaptive Fidelity Model

Not every handoff needs the same level of scaffolding. DACP's fidelity model decides how much structure each handoff requires:

| Level | Name | What Ships | When Used |
|-------|------|------------|-----------|
| **L0** | Prose | Just the `.msg` file | Simple, low-risk handoffs between familiar agents |
| **L1** | Annotated | `.msg` + structured data references | Moderate complexity, some data to pass |
| **L2** | Structured | Full bundle with manifest, intent, data | Complex handoffs, historical drift detected |
| **L3** | Executable | Full bundle + validated scripts | Safety-critical or highly complex handoffs |

Fidelity changes are bounded to max 1 level per cycle (you can't jump from L0 to L3 in one step), with cooldown enforcement: 7 days before promoting, 14 days before demoting.

### Bundle Format

A DACP bundle is a directory containing:
```
my-handoff.bundle/
  manifest.json     # Schema, fidelity level, provenance
  intent.md         # Human-readable intent description
  data/             # Structured JSON payloads (max 50KB)
  code/             # Validated scripts (max 10KB each)
  .complete         # Atomic marker — bundle is ready
```

Every bundle has a mandatory `.msg` fallback for backward compatibility. If an agent doesn't understand bundles, it can always fall back to reading the plain message.

### Retrospective Analyzer

DACP closes the feedback loop. The retrospective analyzer measures drift between intent and outcome, detects recurring patterns, and promotes or demotes fidelity levels accordingly. Drift is scored as a composite: intent alignment (35%), rework rate (25%), verification pass rate (25%), and modification count (15%). This means the protocol gets better over time — handoffs that work well get simpler scaffolding, handoffs that drift get more structure.

### Safety Architecture

Eight safety requirements enforced by mandatory-pass tests:
- Scripts are never auto-executed (Object.freeze on references)
- No unprovenanced data enters the system
- Graceful degradation when bundles are malformed or missing
- Size limits preventing resource exhaustion
- Provenance chain enforcement — scripts without valid source are rejected

DACP shipped with 263 verification tests, 95% fidelity accuracy across 20 test scenarios, and full backward compatibility across all fidelity levels.

---

## College Structure

*Introduced in v1.49.8, expansion architecture defined in v1.49.10*

The College is a knowledge organization system where code IS curriculum. Instead of documenting knowledge in static reference files, the College encodes knowledge as explorable TypeScript source code organized into departments, wings, and concepts. Exploring the source code teaches the subject matter — the implementation is the lesson.

### Three Architectural Pillars

The College rests on three pillars that emerged together in v1.49.8:

**1. Rosetta Core (Translation Engine)**
The identity of skill-creator. Rosetta Core translates between domains — turning numbers into pictures, waves into feeling, machine representations into human understanding. It currently hosts 9 language panels spanning systems (Python, C++, Java), heritage (Perl, ALGOL, Lisp, Pascal, Fortran), and frontier (Unison) families. Each panel teaches something unique about programming paradigms. Panel-to-engine routing flows through the chipset adapter.

**2. College Structure (Knowledge Organization)**
A progressive disclosure hierarchy:

| Tier | Token Budget | Content |
|------|-------------|---------|
| **Summary** | <3K tokens (always loaded) | What the department covers, key concepts |
| **Active** | <12K tokens (on demand) | Working knowledge for the current task |
| **Deep** | 50K+ tokens (on request) | Full reference material, citations, try-sessions |

Departments contain wings, wings contain concepts, and concepts include try-sessions for hands-on exploration and cross-reference resolution for connecting ideas across departments.

**3. Calibration Engine (Feedback Loop)**
A universal Observe → Compare → Adjust → Record feedback loop. Domain-pluggable models with bounded 20% adjustment per step prevent runaway calibration. Delta persistence tracks changes over time, and profile synthesis produces tuned configurations.

### Departments

Three departments shipped as proof of concept:

- **Culinary Arts** — 7 wings (Food Science, Thermodynamics, Nutrition, Technique, Baking Science, Food Safety, Home Economics) with 30+ concepts grounded in peer-reviewed science. Includes a Safety Warden with absolute temperature floors that calibration cannot override (poultry 165°F, ground meat 160°F, whole cuts 145°F).
- **Mathematics** — Seeded from "The Space Between" with 7 concepts positioned on the Complex Plane of Experience.
- **Mind-Body** — Wellness and embodied cognition concepts.

The expansion architecture (v1.49.10) defined how to scale from 3 to 41 departments using **flat atoms** (each subject as a flat directory, no nested hierarchies) and **dynamic mappings** (virtual departments as user-owned JSON mappings, not hardcoded structure). The architecture was shipped; building all 41 departments proceeds incrementally as vision-to-mission packages arrive.

All College source lives in `.college/` — Rosetta Core, panels, departments, and calibration.

---

## Muse Architecture

*Foundation in v1.49.16, operational in v1.49.19*

The Muse is a creative ensemble of named AI agents, each with a distinct personality and role, positioned on the complex plane of experience. Where teams coordinate work execution, Muses coordinate creative insight — pattern recognition across domains, metaphor generation, and the kind of lateral thinking that turns a stuck problem into an obvious solution.

### The Ensemble (9 Muses)

Three families:

**Trees** — Long-lived, deep-rooted perspectives:
- **Cedar** — The primary creative insight engine. Observes patterns across domains and surfaces connections. The Muse.
- **Hemlock** — Structural integrity. Ensures creative output is grounded in real architecture.
- **Willow** — Flexibility and adaptation. Finds alternate paths when the obvious route is blocked.

**Animals** — Active, responsive agents:
- **Foxy** — The user's avatar in the system. Curious, exploratory, trail-finding.
- **Sam** — Steady execution. Reliable, consistent, gets the work done.
- **Raven** — Pattern detection at scale. Sees what others miss in large datasets.
- **Hawk** — High-altitude perspective. Sees the big picture, spots threats early.
- **Owl** — Deep knowledge. The reference librarian of the ensemble.

**The Law:**
- **Lex** — Governance and boundaries. Ensures the ensemble operates within safety constraints.

### How They Coordinate

Muses are not just personas — they're positioned on the complex plane where the real axis represents technical rigor and the imaginary axis represents creative insight. Different tasks activate different regions of the plane. The chipset assigns Muses per task: Lex + Hemlock + Sam + Ravens for structured work, Cedar for creative breakthroughs.

The relay chain (Hawk → Cedar → Sam → Ravens) ensures observations flow from high-altitude scanning through creative synthesis to pattern detection to distributed execution. Center camp is the communal campfire — the shared context where all Muses can read what others have observed.

The Muse schema shipped with 6 system definitions, a Zod validator, and integration into the chipset barrel exports. Muse definitions live in `data/chipset/muses/` as YAML files.

---

## Cartridge Format

*Introduced in v1.49.17*

A cartridge is a composable package of educational content — discrete knowledge domains that can be loaded, validated, and bridged into a unified surface. The metaphor is drawn from audio engineering: the way a DJ layers four tracks in a single crossfade and the listener hears one continuous field of sound, a cartridge layers multiple knowledge packs into a single explorable experience.

### What's in a Cartridge

A cartridge bundles:
- **Packs** — Domain-specific knowledge collections (audio engineering, hardware infrastructure, mathematics)
- **Concepts** — Individual knowledge units within packs, with citations and cross-references
- **Enrichments** — College department extensions that integrate pack knowledge into the educational structure
- **Vocabulary** — Cross-domain concept bridging entries that connect ideas between packs
- **Integration tests** — Validation that composition and cross-references resolve correctly

### The First Cartridge: The Space Between

Named for the essay that became its philosophical spine — *The Space Between: A Muse for the Mesh* — this cartridge traces the structural correspondence between audio engineering, hardware architecture, and the mesh's design principles.

It ships with:
- **Audio Engineering Pack** — 36 concepts across 6 domains (synthesis, physics of sound, consoles & mixing, DJ culture, MIDI & protocols, production) with 32 citations from foundational literature
- **Hardware Infrastructure Pack** — 5 hardware tiers (edge, desktop, workstation, server, cloud) with node profiles and type system, mapping directly to the mesh architecture's heterogeneous compute model
- **Muse Vocabulary** — 122-entry foundation vocabulary with cross-domain concept bridging
- **31 integrated concepts** bridging audio, hardware, and mathematics

The cartridge format is the first composition mechanism in gsd-skill-creator — treating knowledge packs as tracks in a mix, not siloed reference documents. Cartridge infrastructure includes types, a loader, validator, registry, and packer/unpacker.

---

## Mission Packs

*Proven in v1.49.19 (Gastown Integration)*

A mission pack is the end-to-end pipeline for absorbing an external system's patterns into gsd-skill-creator. It is not a copy-paste operation — it is a structured process that produces understanding, not commitment. "Built and tested" (main branch) is different from "operationally proven" (experimental branch).

### The Absorption Pipeline

```
Study → Map → Define → Build → Test → Document → Ship
```

| Stage | What Happens | Output |
|-------|-------------|--------|
| **Study** | Read the external system's source, docs, and design decisions | Mental model |
| **Map** | Create a concept mapping table: their terms → our terms | Translation table |
| **Define** | Write the chipset YAML, schemas, and type definitions | Declarative spec |
| **Build** | Implement skills, validators, state managers in native formats | Working code |
| **Test** | Verify correctness, safety boundaries, crash recovery | Test suite |
| **Document** | Write integration guides, glossaries, ADRs, user guides | Reference docs |
| **Ship** | Atomic delivery with wave execution and per-task commits | Tagged release |

The Gastown integration was the first complete mission pack: 25 commits, 108 tests, 12 skills, 10 integration documents, ~40 minutes wall time across 5 execution waves. The pipeline is now proven and ready for future mission packs from any external system whose coordination patterns are worth absorbing.

**Key principle:** A mission pack produces an independent implementation. The external system is studied, not imported. If the upstream project disappeared, the chipset continues to work.

---

## Wave Execution

*Used throughout the project, formalized from v1.49 onward*

Wave execution is the parallel phase execution model that allows multiple independent plans to run simultaneously within a milestone, ordered by dependency. Instead of executing 24 plans sequentially (which would take hours), wave execution groups them into dependency-ordered waves and runs each wave's plans in parallel.

### How It Works

```
Wave 0 (sequential):  Plan A → Plan B          # Foundation, must be serial
Wave 1 (parallel):    Plan C | Plan D           # Independent, run simultaneously
Wave 2 (parallel):    Plan E+F | Plan G+H       # Can group related plans per agent
Wave 3 (parallel):    Plan I | Plan J | Plan K   # Maximum parallelism
Wave 4 (sequential):  Plan L                     # Final verification, must be serial
```

Each wave completes before the next begins. Within a wave, independent plans execute on separate agents with no file conflicts. The GSD orchestrator spawns executor agents, assigns plans, and collects results.

### In Practice

| Milestone | Waves | Parallel Tracks | Wall Time | Plans |
|-----------|-------|-----------------|-----------|-------|
| v1.49 (DACP) | 5 | up to 4 | ~2 hours | 24 |
| v1.49.8 (College) | 5 | up to 3 | ~2 hours | 45 |
| v1.49.19 (Gastown) | 5 | up to 10 | ~40 min | 10 |

Wave execution turns hours of sequential work into minutes of parallel work. The constraint is dependency order — plans that depend on earlier plans must wait — but within each wave, everything that can run simultaneously does.

---

## GSD-OS Desktop

*Introduced in v1.21*

GSD-OS is the Tauri desktop application that gives gsd-skill-creator a visual interface. It is an Amiga Workbench-inspired desktop environment with a WebGL 8-bit graphics engine, a native terminal, and a first-boot calibration wizard. The desktop is not a web app — it is a native application with a Rust backend and a Vite webview frontend.

### Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Rust (Tauri v2) | PTY management, file watching, IPC, system access |
| **Frontend** | TypeScript + Vite | Webview UI, WebGL rendering, terminal emulation |
| **Graphics** | WebGL2 + GLSL shaders | CRT post-processing pipeline |
| **Terminal** | xterm.js + portable-pty | Full ANSI terminal with tmux session binding |

### The Amiga Aesthetic

The desktop deliberately evokes the Commodore Amiga experience:

- **Workbench window manager** with depth cycling (click to front/back), drag/resize, snap-to-edge
- **32-color indexed palette** with 5 retro presets: Amiga Kickstart 1.3, Workbench 2.0, Workbench 3.1, Commodore 64, and custom
- **WebGL CRT engine** with scanlines, barrel distortion, phosphor glow, chromatic aberration, and vignette
- **Copper list raster effects** for per-scanline color manipulation (gradient fills, sky effects)
- **Pixel-art icon set** for file types, applications, and system functions
- **Boot sequence animation** where Agnus, Denise, Paula, and Gary initialize in sequence

### Accessibility

The desktop auto-detects system preferences: CRT effects disable on `prefers-reduced-motion`, high-contrast palette activates on `prefers-contrast`. The boot sequence is skippable with a click or keypress. OKLCH-based palette generation ensures perceptually uniform color interpolation across all presets.

The desktop source lives in `desktop/` (Vite webview frontend), `src-tauri/` (Rust backend), and shader files for the WebGL pipeline. A strict boundary is enforced: `src/` never imports `desktop/@tauri-apps/api`; `desktop/` never imports Node.js modules.

---

## Cross-References

These concepts interconnect deeply. Some key relationships:

- **Skills → Agents → Teams → Chipsets**: Progressive composition. Skills combine into agents, agents combine into teams, and chipsets define how teams coordinate.
- **Chipsets → Muses**: The chipset assigns Muses per task. The Gastown chipset's Mayor role maps to Cedar's coordination function.
- **DACP → Teams**: DACP bundles are the communication protocol that teams use for reliable handoffs between agents.
- **College → Cartridges**: Cartridges extend College departments with enrichments. The Space Between cartridge adds concepts to mathematics, music, and physics departments.
- **Mission Packs → Chipsets**: A mission pack's output is a chipset. The absorption pipeline produces the declarative configuration that teaches Claude Code new coordination patterns.
- **Wave Execution → GSD Workflow**: Wave execution is how GSD phases run. Every milestone since v1.49 uses wave-based parallel execution.
- **GSD-OS Desktop → Amiga Chipset**: The boot sequence animates the Amiga chipset initialization. The palette system and CRT engine bring the hardware metaphor to life.
- **Observations → Calibration Engine**: Session observations feed the calibration engine's Observe → Compare → Adjust → Record loop, closing the learning feedback cycle.

For detailed integration documentation, see:
- [Gastown Integration Guide](gastown-integration/README.md) — 10 documents covering architecture, security, setup, and workflow
- [Release Notes](release-notes/) — per-version detailed history of every concept's evolution
