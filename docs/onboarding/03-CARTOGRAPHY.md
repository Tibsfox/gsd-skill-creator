# Cartography: How Things Are Organized

*Written by Cedar — for developers who need to find things*

---

## About This Guide

Cedar's role is to make connections visible. This guide does that for the file system. It's a map of the project — what lives where, why it's organized that way, and how to navigate from one place to another.

You don't need to read this end to end. Use it as a reference when you're looking for something and don't know where it is.

---

## The Top-Level Map

```
gsd-skill-creator/
├── src/                    ← TypeScript library and CLI
├── src-tauri/              ← Rust backend (Tauri desktop app)
├── desktop/                ← Vite webview frontend
├── docs/                   ← Documentation (158+ files)
├── .claude/                ← Claude Code configuration
│   ├── skills/             ← Auto-activating skills
│   ├── agents/             ← Subagent definitions
│   ├── hooks/              ← Deterministic hooks
│   └── commands/           ← GSD command definitions
├── .planning/              ← GSD project management (local only, gitignored)
├── scripts/                ← Utility scripts
└── project-claude/         ← Source for Claude config (install with node project-claude/install.cjs)
```

The most important directory for new developers is `src/platform/observation/`. That's where the learning system lives.

---

## The `src/` Directory

The TypeScript library is organized into 6 domain groups:

```
src/
├── core/           ← Infrastructure: types, utils, fs, events, hooks, storage, validation, safety, security
├── packs/          ← Educational packs: agc, citations, dogfood, electronics-pack, engines, holomorphic, knowledge, plane
├── tools/          ← CLI and dev tools: catalog, cli, commands, git, interpreter, learn, mcp, vtm
├── platform/       ← Platform services: calibration, console, dashboard, observation, retro, staging, terminal
├── services/       ← Agent orchestration: agents, brainstorm, chipset, detection, discovery, orchestrator, teams, workflows
└── integrations/   ← External integrations: amiga, aminet, cloud-ops, dacp, den, site, upstream
```

### The Boundary Rule

`src/` never imports from `desktop/@tauri-apps/api`. `desktop/` never imports Node.js modules. This boundary is enforced by convention, not by a linter (yet).

---

## The Observation System: A Closer Look

The 23 observation modules live in `src/platform/observation/`. They're organized into 5 functional groups:

### Signal Intake Group

These modules receive incoming `CompletionSignal` events from the `SignalBus`:

| File | Purpose |
|------|---------|
| `sequence-recorder.ts` | Classify and record workflow sequences. The primary learner. |
| `feedback-bridge.ts` | Capture operation outcomes (did it work?). |
| `sequence-recorder-listener.ts` | Wire SequenceRecorder into the application. Factory only — no logic. |
| `photon-emitter.ts` | Emit baseline measurements for promoted scripts. |
| `transcript-parser.ts` | Parse conversation transcripts into tool call pairs. |
| `execution-capture.ts` | 4-stage pipeline: transcript → pairs → validate → store. |

### Session Tracking Group

These modules observe session-level patterns:

| File | Purpose |
|------|---------|
| `session-observer.ts` | Orchestrate 7 components for session lifecycle observation. |
| `pattern-summarizer.ts` | Compress session patterns into token-efficient summaries. |
| `ephemeral-store.ts` | Two-tier storage (ephemeral → promoted persistent). |
| `observation-squasher.ts` | Merge multiple session records into one combined record. |
| `retention-manager.ts` | Prune JSONL files by age and count. |
| `rate-limiter.ts` | Cap observation writes per session and per hour. |
| `promotion-evaluator.ts` | Score sessions on 5 dimensions for promotion eligibility. |

### Pattern Intelligence Group

These modules analyze stored patterns and produce routing advice:

| File | Purpose |
|------|---------|
| `pattern-analyzer.ts` | Detect frequent operation subsequences (bigrams and trigrams). |
| `cluster-translator.ts` | Convert cluster transition data to human-readable guidance. |
| `routing-advisor.ts` | Recommend agent-to-task routing using 6D capability vectors. |
| `determinism-analyzer.ts` | Score operation determinism for promotion eligibility. |
| `promotion-detector.ts` | Identify operations that are candidates for promotion. |
| `promotion-gatekeeper.ts` | Evaluate candidates against 6 quality gates before promotion. |

### Data Lifecycle Group

These modules maintain storage health:

| File | Purpose |
|------|---------|
| `script-generator.ts` | Generate automation scripts for promoted operations. |
| `drift-monitor.ts` | Detect when promoted scripts produce inconsistent output. |
| `jsonl-compactor.ts` | Remove expired, malformed, and tampered JSONL entries. |

### Traceability Group

| File | Purpose |
|------|---------|
| `lineage-tracker.ts` | Maintain full provenance chain across the 6-stage promotion pipeline. |

---

## The `docs/` Directory

```
docs/
├── architecture/           ← Technical architecture guides (Wave 1-2 deliverables)
│   ├── 01-SIGNALS-FLOW.md           ← How CompletionSignals flow through the system
│   ├── 02-WHY-WE-MEASURE.md         ← Why the system measures what it measures
│   ├── 03-PRINCIPLES-IN-PRACTICE.md ← 5 principles with code examples
│   └── CROSS-REFERENCE-MAP.md       ← All 23 modules mapped
├── onboarding/             ← This directory — developer onboarding guides
├── learning-journey/       ← Personal journals, reflection practices
│   ├── CENTERCAMP-PERSONAL-JOURNAL.md  ← Full project story
│   ├── COMPLETION-REFLECTION-PRACTICE.md  ← Reflection methodology
│   └── README.md
├── foundations/            ← Core concepts and principles
├── principles/             ← Design principles documentation
├── reference/              ← API and technical reference
├── tutorials/              ← Step-by-step tutorials
├── community/              ← Community guides
└── [many more]             ← 158+ total files
```

For new developers, the most important `docs/` subdirectories are `architecture/`, `onboarding/`, and `learning-journey/`.

---

## The `.claude/` Directory

This directory contains Claude Code configuration:

```
.claude/
├── skills/                 ← Auto-activating skills
│   ├── gsd-workflow/       ← GSD project management routing
│   ├── skill-integration/  ← Skill loading and observation protocol
│   ├── security-hygiene/   ← Security guidelines
│   ├── completion-reflection/  ← Phase completion reflection (Wave 3)
│   ├── design-principles/  ← Design principle lookup (Wave 3)
│   ├── muse-voices/        ← Muse perspective invocation (Wave 3)
│   ├── code-archaeology/   ← Code → principle → story tracing (Wave 3)
│   └── [others]
├── agents/                 ← GSD executor, verifier, planner subagents
├── hooks/                  ← Deterministic hooks
│   ├── validate-commit.sh      ← Blocks sensitive files in commits
│   ├── branch-guard.sh         ← Warns on branch safety violations
│   └── agent-lifecycle.sh      ← PostToolUse event logging
└── commands/gsd/           ← GSD command definitions
```

Skills in `.claude/skills/` auto-activate based on context. You don't invoke them manually — they load when relevant.

---

## The Test Structure

```
src/__tests__/              ← Design principle test suites (52 tests)
├── separation-of-concerns.test.ts    ← P1: Two listeners, independent storage
├── honest-uncertainty.test.ts        ← P2: 0.3 confidence = honest default
├── pattern-visibility.test.ts        ← P3: Creator's Arc visible after 2 arcs
├── sustainable-pace.test.ts          ← P4: Bounded, clean, idempotent
└── learning-measurement.test.ts      ← P5: Compression ratio = learning

src/platform/observation/__tests__/  ← Unit tests for each module
├── e2e-mini-batch.test.ts            ← End-to-end: 14 tests, 105 signals
├── sequence-recorder.test.ts
├── feedback-bridge.test.ts
└── [one test file per module]
```

The `src/__tests__/` suites are the executive summary of the system's principles. Read them before reading the code.

---

## The `.planning/` Directory (Local Only)

`.planning/` is gitignored. It contains project management files that are local to your machine:

```
.planning/
├── STATE.md                ← Current project state
├── ROADMAP.md              ← Project roadmap
├── REQUIREMENTS.md         ← Requirements
├── config.json             ← GSD configuration (yolo mode, etc.)
├── phases/                 ← Phase plans and summaries
│   └── 06/                 ← Phase 6: Encode Learning
├── patterns/               ← Pattern data (sessions.jsonl, etc.)
└── [retrospectives, journals, etc.]
```

Never commit `.planning/` files. A PreToolUse hook blocks this automatically, but don't attempt it.

---

## Cross-Reference: Principle → Module → Test → Story

The most powerful navigation tool is `docs/architecture/CROSS-REFERENCE-MAP.md`. It maps every module to:
- Its primary principle
- The stories that motivated its design
- The tests that verify it
- The muse voices it embodies

Use it like an index. Find a module name, find its connections.

---

## Where to Find Specific Things

| What you're looking for | Where it is |
|------------------------|-------------|
| How signals flow | `docs/architecture/01-SIGNALS-FLOW.md` |
| What a module does | `docs/architecture/CROSS-REFERENCE-MAP.md` |
| Why a design decision was made | In-code comments, story references in modules |
| Tests for a principle | `src/__tests__/[principle-name].test.ts` |
| The full project story | `docs/learning-journey/CENTERCAMP-PERSONAL-JOURNAL.md` |
| Glossary and FAQs | `docs/onboarding/06-QUICK-REFERENCE.md` |
| How to contribute | `docs/onboarding/02-LEARNING-PATHS.md` (Path 3) |
| Configuration | `.planning/config.json` (local) |
| Skill definitions | `.claude/skills/[skill-name]/SKILL.md` |
| Agent definitions | `.claude/agents/` |

---

## The Visual Map

```
┌─────────────────────────────────────────────────────────┐
│                    CompletionSignal                      │
│                (fired when work completes)               │
└───────────────────────┬─────────────────────────────────┘
                        │
                   SignalBus
                        │
           ┌────────────┴────────────┐
           │                         │
    FeedbackBridge            SequenceRecorder
    "Did it work?"            "What did it do?"
           │                         │
    PatternStore              PatternStore
    'feedback'                'workflows'
           │                         │
    DriftMonitor              PatternAnalyzer
    (drift alerts)            (pattern mining)
           │                         │
           └────────────┬────────────┘
                        │
                ClusterTranslator
                (L0 / L1 / L2 advice)
                        │
                 RoutingAdvisor
                (agent → task matching)
```

This is the core data flow. Everything else supports or extends it.

---

## Cedar's Navigation Principle

*"The map is not the territory, but a good map makes the territory navigable. If you're lost, start with the cross-reference map. If a connection is missing from the map, that's a contribution opportunity — add it."*

---

## Related Guides

- `docs/onboarding/01-FIRST-STEPS.md` — orientation for complete newcomers
- `docs/onboarding/04-DESIGN-PRINCIPLES.md` — why the system is organized this way
- `docs/architecture/CROSS-REFERENCE-MAP.md` — the living index of all connections
