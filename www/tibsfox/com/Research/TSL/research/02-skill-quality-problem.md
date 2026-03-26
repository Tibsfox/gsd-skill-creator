# What Makes a Good Skill?

> **Domain:** AI Agent Skills & Quality Infrastructure
> **Module:** 2 -- The Skill Quality Problem
> **Through-line:** *A skill without a workflow is a wish. A skill without a trigger is invisible. A skill without error handling is dangerous.*

---

## Table of Contents

1. [The Structural Requirements](#1-the-structural-requirements)
2. [Common Failure Modes](#2-common-failure-modes)
3. [The Five-Skill Case Study](#3-the-five-skill-case-study)
4. [Measuring Quality Objectively](#4-measuring-quality-objectively)
5. [The Skill Sprawl Problem](#5-the-skill-sprawl-problem)
6. [The Linting Evolution Parallel](#6-the-linting-evolution-parallel)
7. [Progressive Disclosure](#7-progressive-disclosure)
8. [Quality Gates](#8-quality-gates)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. The Structural Requirements

The Agent Skills Specification (agentskills.io) defines the structural requirements for a well-formed skill [1]. But structure is necessary, not sufficient. A good skill has:

1. **Valid frontmatter** -- YAML with `name` and `description` fields that parse correctly
2. **Actionable description** -- not just "Helps with PDFs" but "Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction."
3. **Clear activation triggers** -- "Use when..." clauses that tell the agent exactly when to activate the skill
4. **Structured workflow** -- numbered steps that provide a procedural path, not a wall of prose
5. **Error handling** -- what to do when things go wrong
6. **Progressive disclosure** -- metadata loaded at startup (~100 tokens), instructions loaded on activation (<5,000 tokens), resources loaded on demand
7. **Concrete examples** -- not abstract descriptions but specific inputs and expected outputs

Each requirement addresses a different consumer. Valid frontmatter serves the machine parser. Actionable descriptions serve the activation engine. Structured workflows serve the executing agent. Error handling serves the recovery path. Examples serve the developer reading the skill for the first time. A skill that satisfies all seven is a skill that works for every consumer in the chain.

---

## 2. Common Failure Modes

The five skills improved in PR #28 exemplify the most common failure modes that degrade skill quality across projects [2]:

### 2.1 Missing Frontmatter

The dacp-interpreter had no YAML frontmatter at all -- it started with a bare markdown header `# DACP Interpreter`. Without frontmatter, the skill has no machine-readable metadata, no structured description, and no activation trigger. An agent scanning available skills would have no way to decide whether to activate it. The Tessl review scored it at 0% -- not because the content was bad, but because the structural envelope was entirely absent [2].

This is the most severe failure mode because it is invisible to human readers. A developer opening the file sees well-written instructions. The agent scanning the file sees nothing usable.

### 2.2 Weak Descriptions

The mfe-domains skills had descriptions like "Calculus and continuous transformation. Rates, accumulation, approximation -- the mathematics of motion and growth." This is poetic but not actionable. An agent needs to know: what specific operations can this skill perform? When should I activate it? The description lacks "Use when..." clauses and doesn't name concrete operations (derivatives, integrals, ODEs) [2].

The description field operates under severe constraints -- it must be informative enough to trigger activation in ~100 tokens. Every word must earn its place. Poetry is a luxury; specificity is a requirement.

### 2.3 No Structured Workflow

All five skills lacked numbered step-by-step workflows. They had prose descriptions or bullet lists of concepts, but no procedural path an agent could follow [2]. The difference matters: a workflow tells the agent "do step 1, then step 2, then step 3." A concept list tells the agent "here are some things that exist." The former is executable; the latter is informational.

### 2.4 Missing Error Handling

Only the dacp-interpreter had any error handling guidance, and it was buried in prose rather than structured under a clear `## Error Handling` header [2]. The mfe-domains skills had none. An agent encountering an error while executing a skill without error handling guidance has two options: give up or improvise. Neither is reliable.

### 2.5 Redundant Structure

The mfe-domains skills had a `## Summary` section that largely duplicated the frontmatter description, plus a `## Key Primitives` header with no content beneath it [2]. Redundancy wastes context tokens -- every token spent on duplicated information is a token not available for useful instruction. Empty headers are worse: they signal structure but deliver nothing.

---

## 3. The Five-Skill Case Study

The before/after scores from PR #28 provide a quantitative demonstration of how structural improvements affect quality measurement [2]:

| Skill | Before | After | Delta | Primary Issue |
|-------|--------|-------|-------|---------------|
| dacp-interpreter | 0% | 85% | +85% | No frontmatter at all |
| mfe-synthesis | 11% | 63% | +52% | Redundant headers, no workflow, weak description |
| mfe-unification | 11% | 75% | +64% | Missing domain specifics, no workflow |
| mfe-change | 22% | 68% | +46% | Missing domain specifics, no workflow |
| mfe-emergence | 22% | 75% | +53% | Missing domain specifics, no workflow |

**Average improvement: +60 percentage points across 5 skills.**

The most striking feature of these numbers is what they reveal about the relationship between content and structure. The dacp-interpreter was already a well-written skill -- the pipeline was documented, error handling existed, the instructions were clear. It scored 0% purely because of missing structural metadata. Structure and content quality are orthogonal concerns. You can have excellent content in a structurally invisible wrapper, or structurally perfect formatting around useless instructions. A good skill needs both.

---

## 4. Measuring Quality Objectively

Before Tessl, skill quality was subjective -- "does it feel right?" or "does the agent seem to work better?" Tessl introduces three measurement layers that parallel the evolution of code quality tools [3][4]:

### 4.1 Structural Validation (Deterministic)

Does the file parse? Are required fields present? Is it under 500 lines? This is the equivalent of "does the code compile?" No judgment involved -- the frontmatter either parses as valid YAML or it doesn't. The name field either conforms to the 1--64 character lowercase-alphanumeric-plus-hyphens constraint or it doesn't.

### 4.2 Implementation Quality (LLM-Judged)

Are the instructions clear, concise, and actionable? This is the equivalent of code review. An LLM evaluates the skill body across four dimensions: conciseness, actionability, workflow clarity, and progressive disclosure. This layer catches problems that deterministic checks cannot -- a skill can be structurally valid and still have confusing, redundant, or unhelpful instructions.

### 4.3 Behavioral Impact (Empirical)

Does the agent actually perform better with this skill than without it? This is the equivalent of integration testing. Tessl's Task Evals and Repo Evals measure what matters most: does the skill work? A skill can score well on structure and implementation but fail to improve agent performance -- perhaps because the instructions are technically correct but not calibrated to how the agent actually processes them [4].

The combination of deterministic checks and LLM-as-a-judge scoring mirrors how code quality tools evolved: first linters checked syntax, then static analyzers checked patterns, then test suites checked behavior.

---

## 5. The Skill Sprawl Problem

Projects accumulate skills over time. The gsd-skill-creator project has 40+ skills across `.claude/skills/`, `skills/`, and various domain directories. Without quality gates, skills degrade through four mechanisms [2]:

- **Drift:** the codebase changes but the skill instructions don't update. A skill that was accurate six months ago may now reference deprecated APIs, removed features, or renamed functions.
- **Format divergence:** different authors write skills in different formats. One uses YAML frontmatter; another uses markdown headers. One writes numbered workflows; another writes prose paragraphs. The agent must parse all of them.
- **Activation conflicts:** overlapping descriptions cause the wrong skill to activate. If two skills both claim to "help with mathematical problems," the agent has no principled way to choose between them.
- **Context bloat:** skills grow beyond recommended limits, consuming tokens without proportional value. A 1,000-line skill uses twice the context window budget of a 500-line skill but rarely delivers twice the value.

The parallel to code quality is direct. Code linting caught on because individual developers couldn't maintain consistent style across thousands of files. Skill linting addresses the same problem for a different artifact type.

---

## 6. The Linting Evolution Parallel

The evolution from manual code review to automated linting to CI-integrated quality gates took roughly two decades [3]:

| Era | Code Quality | Skill Quality |
|-----|-------------|---------------|
| 1990s | Manual code review | Manual skill reading |
| 2000s | Standalone linters (JSLint) | Standalone skill checkers |
| 2010s | CI-integrated linting (ESLint + GitHub Actions) | CI-integrated skill review (Tessl + GitHub Actions) |
| 2020s | AI-assisted code review | AI-assisted skill optimization |

The trajectory is the same, compressed into a shorter timeline because the infrastructure already exists. Tessl didn't need to invent CI/CD, GitHub Actions, or LLM-based evaluation -- it assembled existing infrastructure around a new artifact type.

The key insight from code linting history: adoption happened when the tool became invisible. Developers didn't start linting because they were convinced it was important. They started linting because it ran automatically and only surfaced real problems. The same adoption curve applies to skill linting. Non-blocking by default. Informative when there's something to fix. Invisible otherwise.

---

## 7. Progressive Disclosure

The progressive disclosure model is the architectural principle that makes skill quality measurable [1]:

- **Summary** (~3,000 tokens, always loaded) -- the SKILL.md summary section is always in the agent's context. Every word must justify its presence.
- **Active** (loaded on trigger) -- the full skill body loads when the description triggers activation. This is where workflows, examples, and error handling live.

An agent with 100 skills loads all 100 descriptions (~100 tokens each = ~10,000 tokens) but only loads the full instructions (~5,000 tokens) for the skills it activates. This is why structured descriptions with activation triggers matter -- they are the gating mechanism. A skill with a weak description wastes its 100-token allocation on words that don't trigger activation. A skill with a strong description uses those 100 tokens as a precise activation key [1].

The token economics are stark. In a 100-skill project, 10,000 tokens go to description scanning. If 3 skills activate, 15,000 tokens go to instructions. The ratio of scanning cost to activation cost is roughly 2:3. Optimizing descriptions isn't cosmetic -- it's architectural.

---

## 8. Quality Gates

Three tiers of skill quality assurance, each catching a different class of issue [3]:

### 8.1 Automated Review

Tessl's GitHub Action runs on every PR that touches SKILL.md, posting scores and feedback. Non-blocking by default, optional fail-threshold for enforcement. Catches structural issues (missing frontmatter, weak descriptions, no workflows) automatically.

### 8.2 Manual Review

Human reviewers assess whether the skill's instructions actually match the domain they describe. An LLM can check structure; a human checks truth. A skill about calculus can be structurally perfect but mathematically wrong -- automated review won't catch that.

### 8.3 Peer Review

Other skill authors review for consistency with the broader skill library. Does this skill overlap with existing ones? Does it follow the project's conventions? Peer review catches ecosystem issues that neither automated nor manual review can detect in isolation.

The ideal pipeline combines all three: automated review catches structural issues, manual review catches semantic issues, peer review catches ecosystem issues.

---

## 9. Cross-References

| Project | Connection |
|---------|------------|
| [MPC](../MPC/index.html) | Precision measurement: Tessl's three scoring components as a precision measurement system for skills |
| [BPS](../BPS/index.html) | Signal quality: skill descriptions as signals that must exceed a noise threshold to trigger activation |
| [LED](../LED/index.html) | Signal-to-noise ratio: the progressive disclosure model as a way to maximize signal (useful instructions) and minimize noise (redundant content) |
| [BCM](../BCM/index.html) | Codes and standards: the Agent Skills Specification as a building code -- minimum structural requirements that all skills must meet |
| [ECO](../ECO/index.html) | Taxonomy: the skill quality problem as a classification problem -- organizing, naming, and structuring what already exists |

---

## 10. Sources

1. [Agent Skills Specification](https://agentskills.io/specification)
2. [PR #28 - gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator/pull/28)
3. [Review a skill against best practices | Tessl Docs](https://docs.tessl.io/evaluate/evaluating-skills)
4. [Three Context Eval Methodologies at Tessl](https://tessl.io/blog/three-context-eval-methodologies/)
5. [Improving your skills with Tessl evals](https://tessl.io/blog/improving-your-skills-with-tessl-evals/)
