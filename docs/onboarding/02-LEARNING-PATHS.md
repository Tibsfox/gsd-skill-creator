# Your Learning Journey: Paths Through the System

*Written by Lex and Willow — for developers ready to go deeper*

---

## About This Guide

Not everyone arrives at gsd-skill-creator for the same reason. An architect needs to understand the design decisions. A practitioner needs to know which modules to touch. A contributor needs to know where to add code. A researcher wants to understand the data model. A teacher wants to explain the system to others.

This guide maps out five distinct paths. Each path has a clear starting point, 3-5 milestones, a time estimate, and a set of deliverables — things you'll understand or be able to do when you're done.

You don't have to choose one path and stay on it. These are orientations, not rules.

---

## How to Choose a Path

Answer these questions:

1. **What's your primary goal?** (understand / build / verify / research / teach)
2. **How much time do you have?** (1 day / 1 week / 1 month)
3. **What's your background?** (TypeScript / systems design / data analysis / pedagogy)
4. **What draws you?** (the philosophy / the code / the data / the community)

Use the decision tree below, then read the path that fits.

```
Are you primarily here to BUILD?
├── Yes → Path 2 (Practitioner) or Path 3 (Contributor)
│          └── Do you understand the architecture yet?
│              ├── No → Path 2 first, then Path 3
│              └── Yes → Path 3 directly
└── No → Are you here to UNDERSTAND?
         ├── Yes → Path 1 (Architect)
         └── No → Are you here to RESEARCH?
                  ├── Yes → Path 4 (Researcher)
                  └── No → Path 5 (Teacher)
```

---

## Path 1: The Architect

**Goal:** Understand the design decisions deeply enough to make new ones coherently.
**Time estimate:** 1-2 weeks
**Best for:** Technical leads, senior engineers, people who ask "why" before "how"

### Why This Path

Before you can add to a system wisely, you need to understand the principles that shaped it. The Architect path traces the design philosophy from idea to code to test. When you complete this path, you'll be able to look at any new feature request and say: "This honors Principle 3" or "This violates Principle 1 — here's why that matters."

### Milestones

**Milestone 1: Understand the two parallel listeners (2-3 hours)**

Read:
- `docs/architecture/01-SIGNALS-FLOW.md`
- `src/platform/observation/feedback-bridge.ts`
- `src/platform/observation/sequence-recorder.ts`

Run: `npm test -- src/__tests__/separation-of-concerns.test.ts`

You're done when you can explain in one sentence why FeedbackBridge and SequenceRecorder share a bus but never share state.

**Milestone 2: Understand honest uncertainty (2-3 hours)**

Read:
- `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md` (Principle 2 section)
- The `classify()` method in `sequence-recorder.ts`
- `src/__tests__/honest-uncertainty.test.ts`

You're done when you understand why `confidence: 0.3` is the right default and why hiding it behind a higher number would be wrong.

**Milestone 3: Understand the 5 principles together (4-6 hours)**

Read:
- `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md` (all sections)
- `docs/architecture/02-WHY-WE-MEASURE.md`
- Run all 5 principle test suites: `npm test -- src/__tests__/`

You're done when you can name a principle that each of the 23 modules primarily embodies.

**Milestone 4: Trace the full cross-reference map (3-4 hours)**

Read:
- `docs/architecture/CROSS-REFERENCE-MAP.md`
- Pick 5 modules. For each: trace principle → story → test.

You're done when you've found one connection in the map that surprised you.

**Milestone 5: Read the retrospective (2-3 hours)**

Read:
- `docs/learning-journey/CENTERCAMP-PERSONAL-JOURNAL.md`
- `.planning/BATCH-3-RETROSPECTIVE.md`

You're done when you understand what "Creator's Arc" means and why it wasn't predicted.

**Deliverables at completion:**
- You can explain any module's design rationale
- You know which principle to apply to any new code decision
- You understand why the system works the way it does

---

## Path 2: The Practitioner

**Goal:** Get productive quickly — know which modules to read, modify, or extend for common tasks.
**Time estimate:** 3-5 days
**Best for:** Developers who learn by building, contributors focused on specific features

### Why This Path

Practitioners need just enough understanding to work effectively. This path gives you the map and the key files, not the full philosophy. After completing it, you'll be able to navigate the codebase confidently and make changes without breaking things.

### Milestones

**Milestone 1: Get oriented (half day)**

Read:
- `docs/onboarding/01-FIRST-STEPS.md` (this is the prerequisite)
- `docs/onboarding/03-CARTOGRAPHY.md` (the file structure)
- Run: `npm test` (verify starting state)

You're done when all tests pass and you know which directory contains what.

**Milestone 2: Understand signal intake (1 day)**

Read:
- `docs/architecture/01-SIGNALS-FLOW.md`
- `src/platform/observation/sequence-recorder.ts`
- `src/platform/observation/feedback-bridge.ts`

Task: Trace a single `CompletionSignal` from emission to storage. Write out the path on paper or in a scratch file.

You're done when you can trace the signal path from memory.

**Milestone 3: Understand pattern intelligence (1 day)**

Read:
- `src/platform/observation/pattern-analyzer.ts`
- `src/platform/observation/cluster-translator.ts`
- `src/platform/observation/routing-advisor.ts`

Run: `npm test -- src/__tests__/pattern-visibility.test.ts`

You're done when you understand how `detectPatterns()` produces routing advice.

**Milestone 4: Understand the data lifecycle (half day)**

Read:
- `src/platform/observation/retention-manager.ts`
- `src/platform/observation/jsonl-compactor.ts`

Run: `npm test -- src/__tests__/sustainable-pace.test.ts`

You're done when you know why storage doesn't grow without bound.

**Milestone 5: Make a small contribution (1-2 days)**

Pick one of these:
- Add a test case to an existing test suite
- Add a JSDoc comment to an undocumented method
- Add an entry to `CROSS-REFERENCE-MAP.md` for a module that's sparse

Submit it as a PR. The review process is the last part of this milestone.

**Deliverables at completion:**
- You can navigate the codebase without a map
- You can add to existing modules with confidence
- You've made at least one contribution

---

## Path 3: The Contributor

**Goal:** Add a significant new feature or module while honoring the design principles.
**Time estimate:** 1-2 weeks (after completing Path 2)
**Best for:** Developers who want to extend the system

### Why This Path

Contributing to this system requires more than TypeScript proficiency. It requires understanding the principles well enough to apply them to new code. This path prepares you for that.

### Prerequisites

Complete Path 2, or demonstrate equivalent understanding.

### Milestones

**Milestone 1: Study the design principles deeply (1-2 days)**

Read:
- `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md`
- All 5 test suites in `src/__tests__/`

Task: For each principle, find one place in the codebase where violating it would cause a test to fail. Write out the connection.

You're done when you've found all 5 connections.

**Milestone 2: Understand the separation boundaries (half day)**

Read:
- `src/platform/observation/pattern-analyzer.ts`
- `src/platform/observation/pattern-store.ts`
- `src/platform/observation/cluster-translator.ts`

Task: Identify the input → transform → output chain for each module. What does it read? What does it produce? What does it not touch?

You're done when you can map the data flow for pattern intelligence.

**Milestone 3: Design a new feature (1-2 days)**

Pick one of these open items (or propose your own):
- `completeArc()` wiring at phase boundaries
- Extending `DEFAULT_CLUSTER_MAP` with more entries
- Cross-agent pattern sharing prototype

Write a design document answering these questions:
1. Which principle does this honor?
2. Which modules does this touch?
3. What new storage category (if any) does this need?
4. What test would verify it works?
5. What test would fail if it were removed?

**Milestone 4: Implement and test (2-3 days)**

Implement the feature following the design document. Write tests first (TDD):
1. RED: write the tests, watch them fail
2. GREEN: implement until tests pass
3. REFACTOR: clean up comments, verify principles

**Milestone 5: Document and submit (1 day)**

Add to `CROSS-REFERENCE-MAP.md`. Update any architecture guides that need updating. Submit PR with:
- What principle(s) this honors
- Which stories informed the design
- What the tests verify

**Deliverables at completion:**
- One significant feature added and merged
- CROSS-REFERENCE-MAP.md updated
- At least 8 new tests passing

---

## Path 4: The Researcher

**Goal:** Understand the data model, learning loop, and measurement methodology deeply enough to analyze or improve them.
**Time estimate:** 1-2 weeks
**Best for:** Data engineers, researchers interested in agent learning patterns, people who care about measurement validity

### Why This Path

This system is, at its core, a measurement instrument. It measures agent learning rates, operation patterns, and cluster transition probabilities. Researchers need to understand the measurement methodology — its assumptions, its limitations, and its potential extensions.

### Milestones

**Milestone 1: Understand the data schema (1 day)**

Read:
- `docs/architecture/02-WHY-WE-MEASURE.md`
- `src/platform/observation/sequence-recorder.ts` (record schema)
- `src/platform/observation/feedback-bridge.ts` (feedback schema)

Task: Draw the data schema for both storage categories. What fields exist? What types? What invariants?

You're done when you can reconstruct the JSONL schema from memory.

**Milestone 2: Understand the learning measurement (1 day)**

Read:
- Principle 5 section in `docs/architecture/03-PRINCIPLES-IN-PRACTICE.md`
- `computeCompression()` in `sequence-recorder.ts`
- `src/__tests__/learning-measurement.test.ts`

Task: Run the e2e mini-batch test and examine the output CSV. What does the compression ratio look like across 105 records?

You're done when you can explain why `ratio: 0.75` is a learning signal and `ratio: 2.0` is a regression signal.

**Milestone 3: Understand the classification system (1-2 days)**

Read:
- `CLASSIFY_PATTERNS` in `sequence-recorder.ts`
- The classifier quirk documentation in `honest-uncertainty.test.ts`
- `src/platform/observation/determinism-analyzer.ts`

Task: Examine the confidence tiers and classification patterns. What are the assumptions? What would a more robust classifier require?

You're done when you can propose one improvement to the classifier with a testable hypothesis.

**Milestone 4: Run the full pipeline (1 day)**

Look at the e2e mini-batch test (`src/platform/observation/__tests__/e2e-mini-batch.test.ts`). Run it, examine the output. Trace: signals → records → patterns → routing advice.

Task: Find one pattern in the 105-record dataset that the current system doesn't detect but could.

**Milestone 5: Document findings (1 day)**

Write a brief research note (500-1000 words) covering:
- What you found
- What the measurement system does well
- What it misses or gets wrong
- One concrete improvement proposal

**Deliverables at completion:**
- Deep understanding of the data model and measurement methodology
- Documented research findings
- At least one concrete improvement proposal

---

## Path 5: The Teacher

**Goal:** Understand the system well enough to explain it to others — through guides, talks, or onboarding sessions.
**Time estimate:** 2-3 weeks
**Best for:** Documentation writers, community educators, people building onboarding programs

### Why This Path

Teaching something forces you to understand it. This path is structured around creating explanations, not consuming them. By the end, you'll have both deep understanding and concrete teaching artifacts.

### Milestones

**Milestone 1: Read all the onboarding guides (half day)**

Read:
- All 6 guides in `docs/onboarding/`

Task: Note one thing in each guide that's unclear, incomplete, or could be explained better.

**Milestone 2: Understand the core story (1-2 days)**

Read:
- `docs/learning-journey/CENTERCAMP-PERSONAL-JOURNAL.md`
- `docs/learning-journey/COMPLETION-REFLECTION-PRACTICE.md`
- `.planning/BATCH-3-RETROSPECTIVE.md`

Task: Write a 200-word summary of the system's origin story in your own words. What was the problem? What was discovered? What does the system now do?

**Milestone 3: Explain one module (1-2 days)**

Pick any module from `src/platform/observation/`. Create a teaching artifact for it:
- A diagram of its inputs and outputs
- A plain-English explanation of its purpose
- An example of what it does with a real signal
- The principle it embodies

**Milestone 4: Teach it to someone (1 day)**

Actually explain the system to someone who doesn't know it. Use your teaching artifact. Note where they get confused.

Task: Update your teaching artifact based on what confused them.

**Milestone 5: Contribute a guide improvement (2-3 days)**

Take the notes from Milestone 1. Pick one unclear or incomplete section. Improve it. Submit a PR.

**Deliverables at completion:**
- Teaching artifact for at least one module
- One guide improvement contributed
- Ability to explain the system's core concept to a new developer in 10 minutes

---

## Time Estimates by Path

| Path | Minimum | Comfortable | Deep |
|------|---------|-------------|------|
| 1. Architect | 1 week | 2 weeks | 1 month |
| 2. Practitioner | 3 days | 1 week | 2 weeks |
| 3. Contributor | 1 week | 2 weeks | ongoing |
| 4. Researcher | 1 week | 2 weeks | ongoing |
| 5. Teacher | 1 week | 2-3 weeks | ongoing |

"Minimum" means you've completed all milestones but haven't gone deep.
"Comfortable" means you've explored beyond the milestones.
"Deep" means you're contributing regularly to the path you've chosen.

---

## Switching Paths

These paths are not exclusive. Many contributors follow more than one:

- **Architect + Practitioner:** The most common pairing. Understand deeply, then build.
- **Researcher + Architect:** For people who want to improve the measurement system.
- **Teacher + any path:** Teaching is enhanced by deep knowledge of any area.

If you're not sure, start with Path 2 (Practitioner). It's the most broadly applicable.

---

## Willow's Note on Paths

*"Every path is valid. The architecture path isn't 'better' than the practitioner path — they're different orientations toward the same territory. What matters is that you find the path that matches what you're genuinely curious about. Forced learning is slow learning. Let your curiosity lead."*

## Lex's Note on Starting

*"Start with what you don't understand. Not the easy parts — those will come on their own. Start with the classifier quirk, or the two-listener architecture, or the compression ratio. Those are the load-bearing ideas. Everything else is detail."*

---

## Resources for All Paths

- **Architecture guides:** `docs/architecture/` — deep technical documentation
- **Cross-reference map:** `docs/architecture/CROSS-REFERENCE-MAP.md` — module → principle → story → test
- **Test suites:** `src/__tests__/` — executable specifications of the 5 principles
- **Skill support:** `.claude/skills/` — code-archaeology, design-principles, muse-voices, completion-reflection
- **Quick reference:** `docs/onboarding/06-QUICK-REFERENCE.md` — glossary and FAQs
