# Getting Started with gsd-skill-creator

*Written by Lex and Willow — for developers arriving for the first time*

---

## Welcome

You've arrived at a system that observes agent work, finds patterns in it, and uses those patterns to improve how future work is routed and executed. That's the core of what gsd-skill-creator does.

This guide answers three questions:

1. **What is this system?** What problem does it solve?
2. **Why does it exist?** What was the thinking behind it?
3. **Where do I start?** How do I get oriented without getting lost?

---

## What Is This System?

gsd-skill-creator is an adaptive learning layer for [Claude Code](https://claude.ai/code). It does two things:

**First, it observes.** When an agent completes work — writing a file, running a command, finishing a phase — the system records what happened. Not just whether it succeeded, but what kind of operation it was, which agent did it, how long it took, and what cluster it transitioned between on the complex plane.

**Second, it learns.** From those observations, it mines patterns. It finds that certain agents tend to move through ANALYZE→BUILD sequences. It detects when promoted scripts start drifting from their expected outputs. It compresses learning by comparing how many steps an agent takes now versus how many steps it took the first time.

The learning feeds forward. Patterns become routing advice. Routing advice improves agent-to-task matching. Better matching means better outcomes. Those outcomes become new observations. The loop closes.

### What It Is Not

gsd-skill-creator is not:
- A task runner or build system (that's GSD — the project management layer)
- A model training pipeline (though it produces data that could feed one)
- A dashboard (though it exposes data a dashboard can read)
- A magic box (everything it does is visible, auditable, and testable)

---

## Why Does It Exist?

The origin story is in `docs/learning-journey/CENTERCAMP-PERSONAL-JOURNAL.md`. The short version:

During a long batch of agent work (Batch 3), the team discovered that agents were developing recognizable patterns. Lex consistently moved through ANALYZE→BUILD sequences. Sam coordinated across cluster boundaries. Hemlock validated before certifying.

These patterns were *in the data*. They weren't predicted. They emerged when someone looked carefully at 105 recorded operations and counted what happened.

The question became: what if the system could see its own patterns? What if learning could compound across sessions? What if a new agent could benefit from what all previous agents had learned?

That's why this exists. The system is a learning loop made explicit.

### The 5 Design Principles

The system is built on 5 principles that emerged from building it:

1. **Separation of Concerns** — each module answers exactly one question
2. **Honest Uncertainty** — when the system doesn't know, it says so with a number
3. **Making Patterns Visible** — count and show, don't infer and hide
4. **Sustainable Pace** — bounded, clean, idempotent — no unbounded growth
5. **Measuring What Matters** — compression ratio (learning rate), not just success rate

You'll see these in the code. Every module has a comment explaining which principles it embodies. The principles connect to tests, the tests connect to stories, the stories connect back to the code. That web of connections is intentional.

---

## Where Do I Start?

### Quick-Start Checklist

Before you write any code, do these in order:

- [ ] **Read this guide** (you're doing it now)
- [ ] **Run the tests** — make sure everything passes: `npm test`
- [ ] **Read the signal flow** — `docs/architecture/01-SIGNALS-FLOW.md` explains how data moves through the system in 15 minutes
- [ ] **Find a module you're curious about** — look it up in `docs/architecture/CROSS-REFERENCE-MAP.md`
- [ ] **Trace it** — principle → story → test → code
- [ ] **Introduce yourself** — read `docs/onboarding/05-MUSE-VOICES.md` to meet the team

### The Three Doors

New developers typically enter through one of three doors:

**Door 1: You want to understand the observation system.**
Start at `docs/architecture/01-SIGNALS-FLOW.md`. It explains how a `CompletionSignal` becomes a stored record becomes a pattern. Read the code in `src/platform/observation/` alongside it.

**Door 2: You want to understand the design philosophy.**
Start at `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md`. It explains each of the 5 principles with real code examples and the tests that verify them.

**Door 3: You want to contribute.**
Start at `docs/onboarding/02-LEARNING-PATHS.md`. It maps out 5 distinct paths through the system and tells you which modules to touch first.

All three doors lead to the same place eventually. Choose based on what you're curious about.

---

## The Layout of the Land

Here's the minimum you need to know about the project structure:

```
src/
  platform/
    observation/    ← The 23 modules — this is the core system
  services/
    chipset/        ← SignalBus and CompletionSignal definitions

src/__tests__/      ← 5 design principle test suites (52 tests)

docs/
  architecture/     ← Deep technical guides (Waves 1-2 deliverables)
  onboarding/       ← This is where you are right now
  learning-journey/ ← Personal journals and reflection practices
```

The observation modules in `src/platform/observation/` are organized into five groups:
- **Signal Intake** — receive and classify incoming completion signals
- **Session Tracking** — observe session-level patterns and health
- **Pattern Intelligence** — mine sequences, translate to advice, route agents
- **Data Lifecycle** — prune, compact, and maintain storage health
- **Traceability** — maintain full provenance chains

Each group is documented in `docs/architecture/CROSS-REFERENCE-MAP.md`.

---

## The Learning Journey Documents

Before you dive into the code, consider reading the learning journey documents. They tell the story of how this system was built:

- `docs/learning-journey/CENTERCAMP-PERSONAL-JOURNAL.md` — the full story, in the team's own words
- `docs/learning-journey/COMPLETION-REFLECTION-PRACTICE.md` — how the team reflects at every completion point
- `.planning/BATCH-3-RETROSPECTIVE.md` — the detailed retrospective from the batch that proved the system worked

These aren't required reading. But they provide context that makes the code make more sense. When you see a comment in `sequence-recorder.ts` referencing "Creator's Arc," you'll know what that means.

---

## Setting Up Your Environment

```bash
# Install dependencies
npm install

# Run the full test suite
npm test

# Run a specific test file
npm test -- src/__tests__/separation-of-concerns.test.ts

# Build the project
npm run build

# Lint
npm run lint
```

The test suite includes both the core library tests and the 5 design principle test suites in `src/__tests__/`. All 52 principle tests should pass. If they don't, that's a signal worth investigating before you proceed.

---

## The First Week: A Suggested Path

**Day 1:** Run the tests, read this guide, read `01-SIGNALS-FLOW.md`.

**Day 2:** Open `src/platform/observation/sequence-recorder.ts`. Read it carefully with the architecture guide open. Find the `classify()` method, the `computeCompression()` method, and the comments explaining the known classifier quirk.

**Day 3:** Run `src/__tests__/honest-uncertainty.test.ts` and `src/__tests__/separation-of-concerns.test.ts`. Read the tests before the code they test.

**Day 4:** Read `docs/architecture/CROSS-REFERENCE-MAP.md`. Pick two modules from different groups and trace each one — principle → story → test.

**Day 5:** Read `docs/onboarding/04-DESIGN-PRINCIPLES.md`. Ask yourself: "Which principle would I have violated if I hadn't known this?"

---

## A Word About the Muses

You'll notice the codebase mentions names — Lex, Sam, Willow, Hemlock, Cedar, Foxy. These are the six muses: distinct perspectives that shaped the system's design. They're not characters in the software — they're lenses for thinking about problems.

Lex asks: "Is this clear? Can I read this module without reading another?"
Sam asks: "Does the team stay together? Are the components coordinated?"
Willow asks: "Is the interface accessible? Are the options visible?"
Hemlock asks: "Is this validated? What fails first if this breaks?"
Cedar asks: "Are all the connections visible? What's the root?"
Foxy asks: "Is this alive? Does it feel true or does it feel defensive?"

When you're deciding how to write a piece of code, these are useful lenses. `docs/onboarding/05-MUSE-VOICES.md` introduces each muse in more depth.

---

## What to Do If You're Stuck

**If a test is failing:** Read the test carefully first. The test is the specification. If the test is asserting something that seems wrong, read the design principle it tests before assuming the test is broken.

**If you don't understand why a module exists:** Look it up in `CROSS-REFERENCE-MAP.md`. The "Purpose" line and "Stories" section will explain why it was built.

**If you're not sure which principle applies:** Read `docs/onboarding/04-DESIGN-PRINCIPLES.md` or use the `.claude/skills/design-principles/` skill.

**If the architecture seems overwhelming:** It's 23 modules. You don't need to understand all of them at once. Start with the two parallel listeners (`feedback-bridge.ts` and `sequence-recorder.ts`) — they're the heart of the system, and once you understand them, the rest follows.

---

## Lex's Welcome

*"Read before you code. The signal flow is the grammar of this system. Once you know the grammar, the code makes sense. Start with `01-SIGNALS-FLOW.md` and don't skip the architecture guides. They weren't written to fill space — they were written to save you hours."*

## Willow's Welcome

*"Every door you enter is valid. Don't feel you need to understand everything before you contribute. The framework is here to make options visible — use the cross-reference map, use the guides, use the skills. The path you choose will be the right path for you."*

---

## Next Steps

- **Go deeper on the signal flow:** `docs/architecture/01-SIGNALS-FLOW.md`
- **Explore learning paths:** `docs/onboarding/02-LEARNING-PATHS.md`
- **Find your way around:** `docs/onboarding/03-CARTOGRAPHY.md`
- **Understand the design philosophy:** `docs/onboarding/04-DESIGN-PRINCIPLES.md`
- **Meet the team:** `docs/onboarding/05-MUSE-VOICES.md`
- **Quick reference & glossary:** `docs/onboarding/06-QUICK-REFERENCE.md`
