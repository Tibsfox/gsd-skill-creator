# 01 — Architecture Overview

## Two Projects, One Goal, Different Approaches

**gsd-skill-creator** and **Gastown** are both multi-agent orchestration systems for AI coding assistants. They solve the same fundamental problem — coordinating multiple AI agents working on a software project — but approach it from opposite directions.

| Dimension | gsd-skill-creator | Gastown |
|-----------|-------------------|---------|
| **Language** | TypeScript + Skills (markdown) | Go (75,000+ lines) |
| **Runtime** | Claude Code (primary), extensible | Claude Code, Codex, Gemini, Cursor |
| **State** | `.planning/` (GSD phases, plans) | Dolt SQL database + filesystem |
| **Communication** | Filesystem (JSON) | Mail, nudge, hook, handoff (Dolt + filesystem) |
| **Work units** | GSD phases → plans → commits | Beads → convoys → molecules |
| **Orchestration** | Skill-based (SKILL.md files) | Binary CLI (`gt` commands) |
| **Agent model** | GSD agents (`.claude/agents/`) | Mayor/Polecat/Witness/Refinery |
| **Philosophy** | "The plan is the code" | "GUPP: if it's on your hook, run it" |
| **Scale** | 1-7 parallel agents | 20-30+ concurrent agents |
| **Federation** | Single workspace | Wasteland (cross-town via DoltHub) |

### How They Connect: The Chipset Model

Rather than porting Gastown's Go code into TypeScript, gsd-skill-creator **absorbs Gastown's patterns** as a chipset definition. A chipset is:

1. **A YAML declaration** (`gastown-orchestration.yaml`) defining agent topology, communication channels, dispatch rules, and evaluation gates
2. **A set of skills** (12 SKILL.md files in `.claude/skills/`) that teach Claude Code the Gastown coordination patterns
3. **A TypeScript type system** (`src/chipset/gastown/types.ts`) providing compile-time guarantees
4. **A validator** (`src/chipset/gastown/validate-chipset.ts`) enforcing configuration correctness
5. **A state manager** (`src/chipset/gastown/state-manager.ts`) providing crash-recoverable persistence

The chipset is **not a wrapper around Gastown**. It is an independent implementation of Gastown's coordination patterns, expressed in gsd-skill-creator's native formats. If Gastown disappeared tomorrow, the chipset would continue to work.

### The Hardware Metaphor

Gastown uses a CPU hardware metaphor that maps directly to agent roles:

```
┌─────────────────────────────────────────────────────────┐
│                    CPU (Gastown Town)                     │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  Northbridge  │    │     PMU      │                   │
│  │   (Mayor)     │    │  (Witness)   │                   │
│  │  Coordinates  │    │  Monitors    │                   │
│  │  Never builds │    │  Never acts  │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                    │                           │
│  ┌──────┴────────────────────┴───────┐                  │
│  │           System Bus              │                   │
│  │  Mail (PCIe)  Nudge (SMI)        │                   │
│  │  Hook (MMIO)  Handoff (Reset)    │                   │
│  └──────┬────────────────────┬──────┘                   │
│         │                    │                           │
│  ┌──────┴───────┐    ┌──────┴───────┐                   │
│  │    DMA        │    │   ALU Pool   │                   │
│  │  (Refinery)   │    │  (Polecats)  │                   │
│  │  Merge queue  │    │  Execute     │                   │
│  │  Sequential   │    │  1-30 agents │                   │
│  └──────────────┘    └──────────────┘                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Fetch-Decode-Dispatch         Retirement Unit    │   │
│  │  (Sling)                       (Done)             │   │
│  │  7-stage pipeline              7-stage pipeline    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Where gsd-skill-creator Adds Value

Gastown is a powerful standalone system. gsd-skill-creator adds:

1. **GSD project management** — Phases, plans, milestones, and verification on top of Gastown's work dispatch. GSD answers "what should we build and in what order?" Gastown answers "how do we coordinate the agents building it?"

2. **Skill Creator pipeline** — Skills can be drafted, tested, graded, and optimized through the eval loop. Gastown's patterns become continuously improvable.

3. **Upstream intelligence** — Track changes to Gastown's repository and safely absorb relevant improvements into the chipset, with validation gates preventing untrusted code from entering your workspace.

4. **Multi-chipset orchestration** — Run multiple Gastown instances (one per project/rig) coordinated by a single gsd-skill-creator instance. GSD becomes the orchestrator of orchestrators.

5. **Trust boundary enforcement** — gsd-skill-creator treats Gastown as an external system. All data crossing the boundary is validated. Personal information, API keys, and planning artifacts never leak outward.

### File Locations

| Component | Path |
|-----------|------|
| Chipset YAML | `data/chipset/gastown-orchestration/gastown-orchestration.yaml` |
| JSON Schema | `data/chipset/schema/gastown-chipset-schema.json` |
| TypeScript types | `src/chipset/gastown/types.ts` |
| Validator | `src/chipset/gastown/validate-chipset.ts` |
| State Manager | `src/chipset/gastown/state-manager.ts` |
| Barrel export | `src/chipset/gastown/index.ts` |
| 12 Skills | `.claude/skills/{skill-name}/SKILL.md` |
| Chipset README | `data/chipset/gastown-orchestration/README.md` |
| User Guide | `data/chipset/gastown-orchestration/docs/user-guide.md` |
| Glossary | `data/chipset/gastown-orchestration/docs/glossary.md` |
| ADRs | `data/chipset/gastown-orchestration/docs/adr/` |
| Tests | `src/chipset/gastown/*.test.ts` (7 files, 108 tests) |
