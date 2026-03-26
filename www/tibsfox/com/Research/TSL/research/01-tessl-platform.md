# The Skill Review Engine

> **Domain:** AI Agent Skills & Quality Infrastructure
> **Module:** 1 -- The Tessl Platform
> **Through-line:** *The same pattern as linting for code -- automated quality gates that catch structural problems before humans have to.*

---

## Table of Contents

1. [What Is Tessl?](#1-what-is-tessl)
2. [The Founding Team](#2-the-founding-team)
3. [The Four Components](#3-the-four-components)
4. [The `tessl skill review` Command](#4-the-tessl-skill-review-command)
5. [The Three Scoring Components](#5-the-three-scoring-components)
6. [The Agent Skills Specification](#6-the-agent-skills-specification)
7. [Where Tessl Fits in the Ecosystem](#7-where-tessl-fits-in-the-ecosystem)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. What Is Tessl?

Tessl is an agent enablement platform that treats AI agent skills and context as software with a complete lifecycle: build, evaluate, distribute, and optimize. Founded in 2024 by Guy Podjarny, the company is headquartered in London, UK [1][2].

Podjarny's background is the pattern. He previously founded Snyk, which he scaled to an $8 billion developer security company, and before that founded Blaze, which was acquired by Akamai, where he served as CTO [1][2][3]. The throughline is consistent: identify a category of developer artifact that lacks professional tooling, then build the lifecycle management layer. At Snyk, the artifact was dependency vulnerability data. At Tessl, the artifact is the AI agent skill.

### 1.1 Funding and Scale

Tessl raised a $25 million seed round from GV (formerly Google Ventures) and boldstart, followed by a $100 million+ Series A led by Index Ventures, reaching a reported $500--750 million valuation as of late 2024 [3][4]. The company launched on Product Hunt on February 26, 2026, reaching #5 daily rank with 270 points and 324 followers [5].

These numbers matter not for their magnitude but for what they signal: institutional investors -- GV, Index Ventures -- believe that agent skill lifecycle management is a category worth funding at scale. The bet is that skills are the new packages, and they need the same infrastructure that npm, PyPI, and crates.io provide for code packages [2][6].

### 1.2 The Snyk Playbook

Podjarny's playbook at Snyk -- embed security into the developer workflow rather than bolt it on after -- maps directly to Tessl's thesis: embed skill quality management into the development workflow rather than treating skills as static markdown files that no one reviews [1][2]. The operational principle is the same: developers will not adopt quality tools that interrupt their workflow. The tool must be invisible when things are fine and informative when they are not. Snyk runs in CI/CD and surfaces vulnerabilities in the PR. Tessl runs in CI/CD and surfaces skill quality issues in the PR. Same architecture, different artifact type.

---

## 2. The Founding Team

| Role | Person | Background |
|------|--------|------------|
| Founder & CEO | Guy Podjarny | Founded Snyk ($8B), Blaze (acq. Akamai), CTO at Akamai, angel investor |
| Head of Product | Dru Knox | Built major developer platforms including Android and the web |
| Head of Engineering | Maurilio Cometto | 25+ years in Silicon Valley startups, products acquired by Cisco, Microsoft, Google |
| General Counsel & Head of Ops | Stephanie Dominy | 25+ years in-house counsel, previously at Snyk, Travelport, Staffbase |
| Head of DevRel | Simon Maple | 25+ years in DevRel and engineering at Snyk, ZeroTurnaround, IBM |

The team composition signals a Snyk reunion with developer-tooling DNA [1]. Three of five leadership roles come from Snyk alumni. This is not a pivot or an experiment -- it is a team that has built and scaled a developer tools company before, applying the same methodology to a new artifact class.

---

## 3. The Four Components

Tessl's platform has four integrated components that together provide the complete lifecycle for agent skills [2][7]:

### 3.1 Registry

A package manager for agent skills. The registry indexes over 3,000 skills and hosts documentation for 10,000+ open-source packages [6]. Skills are discoverable, versioned, and evaluated. Installation is captured in a `tessl.json` manifest, similar to `package.json` for npm. The registry is the discovery layer -- it answers the question "what skills exist and how good are they?"

### 3.2 Evaluation Framework

Three distinct evaluation methodologies [8]:

- **Skill Review** -- structural assessment of SKILL.md files against the Agent Skills Specification. Combines deterministic validation (does the frontmatter parse?) with LLM-as-a-judge quality scoring (is the workflow clear?).
- **Task Evals** -- behavioral impact testing that runs agents through scenarios with and without the skill, measuring actual performance difference. This is the integration test -- not "is the skill well-written?" but "does the agent perform better with it?"
- **Repo Evals** (beta) -- tests context effectiveness against realistic code changes derived from actual repository commits. Takes the evaluation from synthetic scenarios to real-world conditions.

### 3.3 CLI

Full command-line interface (`npm i -g @tessl/cli`) with commands for skill management: `skill new`, `skill import`, `skill lint`, `skill review`, `skill publish` [9]. Also includes workspace management, evaluation commands, and diagnostics. The CLI is the developer's primary interface -- it brings skill operations to the terminal where developers already work.

### 3.4 GitHub Actions

Automated review and optimization actions that integrate into PR workflows [10]. Two actions available: `tesslio/skill-review` for review-only (no auth required), and `tesslio/skill-review-and-optimize` for review plus AI-powered optimization (requires Tessl token for optimization mode). The actions make skill quality a CI concern rather than a manual process.

---

## 4. The `tessl skill review` Command

The core evaluation command performs a comprehensive conformance review against the Agent Skills Specification [9]:

```bash
tessl skill review [--json] [--optimize] [--max-iterations <count>]
                   [--skill <name>] [--yes] [<path-or-url>]
```

**Key flags:**
- `--optimize` -- automatically improves the skill file and applies changes iteratively
- `--max-iterations` -- sets improvement loops (1--10, default: 3)
- `--json` -- returns results in JSON format for CI integration
- `--skill` -- targets a specific skill from multi-skill repositories
- `--yes` / `-y` -- auto-applies improvements without confirmation

The command accepts SKILL.md file paths, skill directories, or GitHub URLs [9]. It defaults to the current directory. This flexibility matters -- a developer can review a local skill, a colleague's skill on GitHub, or an entire repository of skills with a single command.

---

## 5. The Three Scoring Components

The review produces a 0--100% score as a weighted average of three sub-components [7][8]:

### 5.1 Validation Score (Deterministic)

Structural criteria that can be checked programmatically without judgment:

- SKILL.md line count (maximum 500 lines)
- YAML frontmatter validity and parsing
- Required fields present (`name`, `description`)
- Description voice (third person)
- Optional fields (metadata, license, compatibility)
- Body presence with examples and step-by-step structure

This is the equivalent of "does the code compile?" A skill can score well on validation and still be useless, but a skill that fails validation is structurally broken.

### 5.2 Implementation Score (LLM-as-a-Judge)

Quality assessment of the SKILL.md body content:

- **Conciseness** -- is the skill free of redundant content?
- **Actionability** -- can an agent follow these instructions to produce output?
- **Workflow clarity** -- is there a clear procedural path?
- **Progressive disclosure** -- does the skill layer information appropriately?

This is the equivalent of code review. An LLM reads the skill body and evaluates whether the instructions are clear, actionable, and well-structured.

### 5.3 Activation Score (LLM-as-a-Judge)

Quality assessment of the description field -- the only part of the skill that agents see when deciding whether to activate:

- **Specificity** -- does the description name concrete operations?
- **Completeness** -- does it cover all the skill's capabilities?
- **Trigger Term Quality** -- does it include "Use when..." clauses?
- **Distinctiveness** -- could this description be confused with another skill?

This is the most critical score. A skill with a perfect implementation but a weak activation description will never be activated by the agent. The description is the gating mechanism.

### 5.4 Score Interpretation

- **90%+** -- conforms well to best practices
- **70--89%** -- good skill with minor improvements needed
- **Below 70%** -- needs work before deployment

---

## 6. The Agent Skills Specification

The Agent Skills Specification at agentskills.io defines the canonical format for SKILL.md files [11]. It is an open standard, not proprietary to Tessl, though Tessl's tooling is built to evaluate against it.

### 6.1 Directory Structure

```
skill-name/
  SKILL.md          # Required: metadata + instructions
  scripts/          # Optional: executable code
  references/       # Optional: documentation
  assets/           # Optional: templates, resources
```

### 6.2 Required YAML Frontmatter

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | 1--64 chars, lowercase alphanumeric + hyphens |
| `description` | Yes | 1--1024 chars, non-empty, no XML tags |
| `license` | No | License name or reference to bundled file |
| `compatibility` | No | Max 500 chars, environment requirements |
| `metadata` | No | Arbitrary key-value mapping |

### 6.3 Progressive Disclosure Model

The specification defines a three-tier loading model [11]:

1. **Metadata** (~100 tokens) -- `name` and `description` loaded at startup for ALL skills
2. **Instructions** (<5,000 tokens recommended) -- full SKILL.md body loaded when skill activates
3. **Resources** (as needed) -- files in `scripts/`, `references/`, `assets/` loaded on demand

This is why the description field is so critical: it is the ONLY information the agent has when deciding whether to activate a skill. A weak description means the skill never activates, regardless of how good the instructions are. The description is not marketing copy -- it is the activation trigger.

---

## 7. Where Tessl Fits in the Ecosystem

Tessl occupies a new category: the skill quality and lifecycle layer [2]. It sits between skill authoring (done by developers) and skill consumption (done by agents). The closest analogy is ESLint for code quality or Snyk for security scanning -- a tool that reviews artifacts against best practices and surfaces issues before they reach production.

The platform is agent-agnostic [2]. Skills managed through Tessl work with Claude Code, Cursor, Gemini, Copilot, and other agent implementations. This positions Tessl as infrastructure rather than being tied to any single agent vendor. The same skill, reviewed and optimized through Tessl, works across all agent implementations that support the Agent Skills Specification.

The category is nascent. As of early 2026, most skill management is informal -- developers write SKILL.md files by hand, review them by reading, and distribute them by committing to repositories. Tessl bets that this informality will not scale. As projects accumulate dozens or hundreds of skills, the need for automated quality review, versioned distribution, and behavioral evaluation will become as obvious as the need for code linting was in 2010.

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [GSD2](../GSD2/index.html) | Orchestration architecture: Tessl's skill lifecycle parallels GSD's skill-creator architecture |
| [SYS](../SYS/index.html) | Infrastructure automation: CI/CD integration, GitHub Actions as operational infrastructure |
| [WAL](../WAL/index.html) | Systematic methodology: Tessl's review process mirrors the Rosetta Stone framework's quality assessment |
| [OCN](../OCN/index.html) | Package management: Tessl's registry as a skill package manager parallels container image registries |
| [BCM](../BCM/index.html) | Codes and standards: the Agent Skills Specification as a building code for skills |

---

## 9. Sources

1. [Tessl About Page](https://tessl.io/about/)
2. [What is Tessl? | Tessl Docs](https://docs.tessl.io)
3. [Tessl raises $125M at $500M+ valuation | TechCrunch](https://techcrunch.com/2024/11/14/tessl-raises-125m-at-at-500m-valuation-to-build-ai-that-writes-and-maintains-code/)
4. [Tessl | Index Ventures](https://www.indexventures.com/companies/tesslio/)
5. [Tessl | Product Hunt](https://www.producthunt.com/products/tessl)
6. [Announcing skills on Tessl: the package manager for agent skills](https://tessl.io/blog/skills-are-software-and-they-need-a-lifecycle-introducing-skills-on-tessl/)
7. [Review a skill against best practices | Tessl Docs](https://docs.tessl.io/evaluate/evaluating-skills)
8. [Three Context Eval Methodologies at Tessl](https://tessl.io/blog/three-context-eval-methodologies/)
9. [CLI commands | Tessl Docs](https://docs.tessl.io/reference/cli-commands)
10. [Review and publish with GitHub Actions | Tessl Docs](https://docs.tessl.io/distribute/review-and-publish-with-github-actions)
11. [Agent Skills Specification](https://agentskills.io/specification)
