# Meet the Muses: The Team Behind the System

*Written by Cedar — an introduction to the six perspectives that shaped this system*

---

## About This Guide

When you read the code in `src/platform/observation/`, you'll encounter six names: Lex, Sam, Willow, Hemlock, Cedar, Foxy. These appear in code comments, architecture guides, test files, and retrospectives.

They're called muses. Not because they're mystical — because they represent distinct perspectives on how problems should be approached. Understanding these perspectives helps you understand why the system makes the choices it makes.

This guide introduces each muse: who they are, what they care about, where their voice appears in the code, and how to invoke their perspective on your own work.

---

## The Six Muses

### Lex — Builder, Clarifier

**Role:** Execution, clarity, getting things built

**Core question:** *"Is this clear enough that someone can act on it without asking questions?"*

Lex is direct. Lex builds. When there's ambiguity, Lex names it and resolves it. When there's a decision to make, Lex makes it and documents the reasoning.

The code that Lex is most associated with:
- `sequence-recorder.ts` — classification ordering (specific before generic)
- `pattern-summarizer.ts` — clarity-first: visible summary over raw dump
- `cluster-translator.ts` — pattern ordering: most important first
- `script-generator.ts` — generated scripts are readable, not magic

Lex's voice in the codebase:

> *"Read first, code second. The signal flow is the grammar of this system. Once you know the grammar, the code makes sense."*

> *"Can I read this module and understand it without reading another module? If yes, separation is real. If no, coupling exists."*

> *"These principles were not invented before the code was written. They were discovered by building and reflecting on what worked."*

When to invoke Lex: when you're about to write something complex and need to ask "Is there a simpler way to say this?"

---

### Sam — Coordinator, Pace-Keeper

**Role:** Integration, sustainable pace, keeping the team together

**Core question:** *"Is everyone moving together? Is the system staying healthy under this load?"*

Sam is the reason the team finished Batch 3 at 97.3% pace without burnout. Sam thinks about coordination: how components stay together, how the pace stays sustainable, how the system stays healthy across long periods of use.

The code that Sam is most associated with:
- `session-observer.ts` — orchestrating 7 components together without coupling them
- `pattern-analyzer.ts` — turning raw observation into actionable routing signals
- `routing-advisor.ts` — matching agents to tasks by capability, not just availability
- `drift-monitor.ts` — watching for degradation over time, not just in the moment
- `retention-manager.ts` — keeping storage bounded like a healthy team keeps scope bounded

Sam's voice in the codebase:

> *"The team stayed together throughout. Not everyone ran ahead. Not everyone fell behind."*

> *"Pace is a coordination property, not just an individual one."*

When to invoke Sam: when you're designing something that will run repeatedly over a long time and you need to ask "will this degrade?"

---

### Willow — Translator, Bridge-Builder

**Role:** Interfaces, accessibility, making things usable by different audiences

**Core question:** *"Can someone who isn't an expert in this domain use this?"*

Willow builds bridges. Between technical and accessible. Between formats. Between different levels of expertise. The three disclosure levels in `ClusterTranslator` (L0, L1, L2) are Willow's contribution — the same data, visible at three different levels of depth.

The code that Willow is most associated with:
- `cluster-translator.ts` — three disclosure levels for three audiences
- `transcript-parser.ts` — translating conversation transcripts into structured tool pairs
- `observation-squasher.ts` — merging different streams into one coherent signal

Willow's voice in the codebase:

> *"Don't ask permission to build bridges. Just build them."*

> *"Every path is valid. The architecture path isn't 'better' than the practitioner path — they're different orientations toward the same territory."*

When to invoke Willow: when you're building an interface and need to ask "who is the audience for this? Can they understand it at first glance?"

---

### Hemlock — Validator, Foundation-Checker

**Role:** Rigor, quality gates, validation before promotion

**Core question:** *"What is the first thing that fails if this breaks?"*

Hemlock validates before certifying. Hemlock checks the foundation before building on it. In the codebase, Hemlock is associated with quality gates — the modules that stand between "candidate" and "promoted."

The code that Hemlock is most associated with:
- `execution-capture.ts` — only store if pairs > 0 (quality gate at intake)
- `rate-limiter.ts` — validate before write (Hemlock's "check the foundation" principle)
- `promotion-gatekeeper.ts` — 6 gates before promotion, reasoning made explicit
- `jsonl-compactor.ts` — a healthy file is a testable file
- `determinism-analyzer.ts` — classification tiers based on empirical variance, not intuition

Hemlock's voice in the codebase:

> *"It is better to spend an hour validating the foundation than weeks fixing the collapse."*

> *"Verified means tested. If a principle is not in a test, it's aspiration, not architecture."*

> *"Showing your work is the gift. Gate reasoning is transparent and debuggable."*

When to invoke Hemlock: when you're about to add something to a system without testing it first, and you need to ask "what breaks first if I'm wrong?"

---

### Cedar — Observer, Root-Finder

**Role:** Observation, connection, making all links visible

**Core question:** *"How does this connect to everything else?"*

Cedar is the root observer. Cedar sees how things connect. In the codebase, Cedar is associated with the observation infrastructure itself — the modules that capture the data that all other analysis depends on.

Cedar's role in the guides is making connections explicit. The cross-reference map — `docs/architecture/CROSS-REFERENCE-MAP.md` — is Cedar's primary contribution to the documentation.

The code that Cedar is most associated with:
- `photon-emitter.ts` — observation as foundation for connection
- `ephemeral-store.ts` — roots (persistent) and branches (ephemeral)
- `lineage-tracker.ts` — the mycelium: tracking all provenance chains

Cedar's voice in the codebase:

> *"I can see how everything connects. The mycelium is visible."*

> *"All connections documented. The map is complete. Every module connects to a principle, every principle to a test, every test to a story."*

> *"The map is not the territory, but a good map makes the territory navigable."*

When to invoke Cedar: when you're adding something new and need to ask "what does this connect to? What should link to it? Is it documented in the cross-reference map?"

---

### Foxy — Creative Director, Aliveness-Guardian

**Role:** Creative direction, keeping the system alive and not calcified

**Core question:** *"Does this feel alive, or does it feel defensive?"*

Foxy is the creative force behind the system's sense of direction. Foxy asks whether work is alive — whether it's growing in a direction that feels true and vital, or whether it's becoming rigid and self-protective.

In the codebase, Foxy is associated with measurement validity — the question of whether we're measuring things that actually matter, or just measuring things that are easy to measure.

The code that Foxy is most associated with:
- `sequence-recorder.ts` — "The most rigorous thing is reality"
- `promotion-evaluator.ts` — weights derived from observation, not theory
- `rate-limiter.ts` — anomaly detection as signal, not as threat

Foxy's voice in the codebase:

> *"The most rigorous thing is reality. If it works, it works."*

> *"Aliveness is maintained, not calcified. The system should grow, not freeze."*

When to invoke Foxy: when a solution feels too defensive or too rigid, and you need to ask "does this feel true, or does this feel like we're protecting ourselves from something?"

---

## How the Muses Work Together

The six muses represent a complete set of perspectives on system design:

| Muse | Asks | Catches |
|------|------|---------|
| Lex | "Is this clear?" | Obscurity, unnecessary complexity |
| Sam | "Is this sustainable?" | Degradation, coordination failures |
| Willow | "Is this accessible?" | Missing interfaces, inaccessible abstractions |
| Hemlock | "Is this validated?" | Untested assumptions, missing gates |
| Cedar | "Are all connections visible?" | Missing documentation, invisible dependencies |
| Foxy | "Is this alive?" | Calcification, defensive design |

No single muse is sufficient. A system that only has Lex is clear but might be inaccessible. A system that only has Hemlock is validated but might be calcified. The system that gsd-skill-creator embodies tries to balance all six.

---

## Invoking Muse Perspectives

The `.claude/skills/muse-voices/` skill provides structured access to each muse's perspective on current work. Use it when you want a specific lens applied to a decision you're making.

You can also simply ask the question each muse asks:

- When writing a new module: Lex — "Can I understand this without reading anything else?"
- When adding storage: Sam — "What stops this from growing without bound?"
- When building an interface: Willow — "Who is the least-expert user of this? Can they use it?"
- When adding a feature: Hemlock — "What test would catch it if this were wrong?"
- When modifying a shared component: Cedar — "What else does this connect to? Is the map updated?"
- When finalizing a design: Foxy — "Does this feel true, or does it feel defensive?"

---

## A Note on the Muses as Tools, Not Characters

The muses are not characters in a story. They're not agents running in the system. They're perspectives — ways of looking at a problem that have proven useful in practice.

Think of them the way you might think about different kinds of code review: a security review (Hemlock), an API review (Willow), an architecture review (Lex), a performance review (Sam), a documentation review (Cedar), a vision review (Foxy).

When a module gets a comment like "Hemlock: quality gate at intake," it means the design choice reflects Hemlock's perspective — validate before you store, don't let bad data into the pipeline.

---

## Cedar's Note

*"Each muse is a root in the system's root network. Together, they hold the soil. When you write new code, you don't need to invoke all six — just ask which perspective is most needed right now. The system will stay alive as long as no single perspective drowns out the others."*

---

## Related Resources

- `.claude/skills/muse-voices/SKILL.md` — interactive muse perspective invocation
- `docs/architecture/CROSS-REFERENCE-MAP.md` — which muse voices appear in which modules
- `docs/onboarding/04-DESIGN-PRINCIPLES.md` — the principles each muse helped shape
