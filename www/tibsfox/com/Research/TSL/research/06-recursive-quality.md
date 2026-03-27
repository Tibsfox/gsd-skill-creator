# The Skill Creator's Skills Get Reviewed

> **Domain:** AI Agent Skills & Quality Infrastructure
> **Module:** 6 -- Recursive Quality
> **Through-line:** *A skill creator that fixes what the review finds has a learning system. A skill creator whose skills can't pass a skill review has a credibility problem.*

---

## Table of Contents

1. [The Recursive Loop](#1-the-recursive-loop)
2. [What "Recursive" Means Here](#2-what-recursive-means-here)
3. [The Adaptive Learning Layer](#3-the-adaptive-learning-layer)
4. [The Doc-Linter Parallel](#4-the-doc-linter-parallel)
5. [The Rosetta Stone Connection](#5-the-rosetta-stone-connection)
6. [Quality Across Artifact Types](#6-quality-across-artifact-types)
7. [The Closed Feedback Loop](#7-the-closed-feedback-loop)
8. [The Credibility Problem](#8-the-credibility-problem)
9. [The Multi-Layer Quality Pipeline](#9-the-multi-layer-quality-pipeline)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Recursive Loop

The gsd-skill-creator is a tool for creating, validating, and managing AI agent skills. PR #28 targets this project's own skill infrastructure [1]. The tool vendor's tool is reviewing the skill creator's skills.

This creates an interesting feedback loop:

```
gsd-skill-creator (creates skills)
    |
    v
Tessl (reviews skills)
    |
    v
PR #28 (improves gsd-skill-creator's skills)
    |
    v
gsd-skill-creator (creates better skills)
```

The project that manages skill quality is receiving automated quality feedback on its own skills. If the feedback is good, it validates the concept that automated skill review adds value. If the feedback reveals problems -- and it did, with scores ranging from 0% to 22% -- it identifies gaps in the project's own quality processes [1].

The recursion is not coincidental. A skill creation tool that doesn't practice skill quality is like a code linting company that doesn't lint its own code. The external review forces an honest accounting of internal quality.

---

## 2. What "Recursive" Means Here

The recursion operates at three levels:

### 2.1 Artifact Recursion

The project creates skills. An external tool reviews those skills. The review findings improve the skills. The improved skills inform how the project creates skills in the future. The artifact type being created is the same artifact type being reviewed.

### 2.2 Process Recursion

The project has a quality process for creating skills (documentation standards, testing, review). An external quality process (Tessl's review) evaluates the output of the internal process. The external process reveals gaps in the internal process. The internal process improves. The recursive loop tightens the process at each iteration.

### 2.3 Institutional Recursion

The project positions itself as infrastructure for skill management. A tool that reviews skills reports that the project's own skills have quality issues. This creates institutional pressure to improve -- not because the skills don't work, but because the project's credibility as a skill management system depends on the quality of its own skills.

---

## 3. The Adaptive Learning Layer

The project's self-description is "adaptive learning layer for Claude Code" [2]. The key word is *adaptive* -- the system is designed to learn from experience and improve over time.

PR #28 is the adaptive learning layer receiving external feedback and adapting. The feedback is:

- "Your dacp-interpreter skill scores 0%. It has no frontmatter."
- "Your mfe-domains skills average 16.5%. Their descriptions are abstract, they lack workflows, and they have redundant structure."

The adaptation is:

- Add frontmatter to the dacp-interpreter (+85%)
- Expand descriptions, add workflows, remove redundancy from mfe-domains skills (+46% to +64%)

This is not a crisis. This is the system working as designed. An adaptive system that never receives negative feedback is not adaptive -- it is stagnant. The value of the Tessl review is not that it found perfection but that it found specific, actionable improvements that the internal process missed [1].

### 3.1 Why Internal Process Missed It

The internal quality process for skills focuses on content accuracy and domain coverage. Does the calculus skill correctly describe derivatives? Does the DACP interpreter correctly document the pipeline? These are the questions the project's maintainers ask when reviewing skills [2].

What the internal process did not systematically check:

- Does the skill have valid YAML frontmatter?
- Does the description include "Use when..." activation triggers?
- Is there a numbered workflow?
- Is there dedicated error handling?

These are structural concerns, not content concerns. The internal process evaluated content; the external process evaluated structure. Both evaluations are necessary. Neither is sufficient alone.

---

## 4. The Doc-Linter Parallel

The v1.49.39 milestone used automated doc-linter review agents to assess documentation quality [3]. Tessl's skill review performs the same function for a different artifact type. Both follow the pattern:

1. Define quality criteria (what makes a good document / what makes a good skill)
2. Automate the review (doc-linter agents / Tessl CLI)
3. Surface issues in the PR workflow (PR comments with findings / PR comments with scores)
4. Fix incrementally (improve docs as they're touched / improve skills as they're touched)

The parallel is not just structural -- it's historical. The project has already demonstrated that automated quality review works for documentation. PR #28 extends the same pattern to skills. The methodology is proven; the artifact type is new.

### 4.1 The Quality Stack

The project now has automated quality review for:

| Layer | Tool | What It Catches |
|-------|------|----------------|
| Code syntax | TypeScript compiler | Type errors, syntax errors |
| Code style | ESLint | Style violations, pattern antipatterns |
| Tests | Vitest | Behavioral regressions |
| Commits | Pre-commit hook | Commit message format violations |
| Documentation | Doc-linter agents | Documentation quality issues |
| Skills | Tessl review action | Skill structure and quality issues |

Each layer catches a different class of quality issue. Together they form a multi-layer quality pipeline. No single layer is comprehensive -- the TypeScript compiler doesn't check documentation quality, and the doc-linter doesn't check skill structure. The coverage comes from layering.

---

## 5. The Rosetta Stone Connection

The skill quality measurement parallels the project's broader theme of translation layers [4]. The Rosetta Stone framework (developed in the WAL research module) describes how cross-domain translation works: taking concepts from one domain and mapping them faithfully to another.

Tessl's skill review is a translation layer. It translates between:

- **Developer intent** (what the skill author wanted the skill to do)
- **Machine activation** (what the agent actually understands from the skill file)

The review score is a measure of translation fidelity. A skill with a 0% score is untranslatable -- the agent cannot parse the author's intent from the file structure. A skill with 85% score has high-fidelity translation -- the description maps clearly to activation triggers, the workflow maps clearly to execution steps [1].

### 5.1 The Translation Failure Modes

| Score Range | Translation Quality | Agent Experience |
|-------------|-------------------|-----------------|
| 0% | Untranslatable | Agent cannot find or activate the skill |
| 1--30% | Garbled | Agent may activate but cannot follow instructions |
| 31--69% | Partial | Agent activates and follows some steps but misses context |
| 70--89% | Faithful | Agent activates correctly and follows workflow |
| 90%+ | Precise | Agent activates correctly, handles errors, follows progressive disclosure |

The dacp-interpreter at 0% was a perfect example of untranslatable quality: the content was good, but the translation layer (frontmatter, structure) was entirely missing. The agent could not find the skill at all. Adding the structural layer restored translation fidelity to 85%.

---

## 6. Quality Across Artifact Types

The recursive quality question extends beyond skills to all artifact types the project produces [2][3]:

### 6.1 Code Quality

Measured by: compiler checks, linting, test coverage, code review. Tooling is mature (decades of evolution). Quality standards are well-understood.

### 6.2 Documentation Quality

Measured by: doc-linter agents, manual review, completeness checks. Tooling is emerging (LLM-based review). Quality standards are less formal than code.

### 6.3 Skill Quality

Measured by: Tessl review, structural validation, behavioral evaluation. Tooling is nascent (Tessl launched 2026). Quality standards are being defined (Agent Skills Specification).

### 6.4 Research Quality

Measured by: source verification, cross-link audits, verification matrices (this module series). Tooling is manual. Quality standards are project-specific.

The progression from code to documentation to skills to research represents increasing semantic complexity and decreasing tooling maturity. Code quality has decades of tooling. Research quality is still largely manual. The project's contribution to this progression is demonstrating that automated quality review can extend beyond code to documentation, skills, and potentially research artifacts.

---

## 7. The Closed Feedback Loop

The ideal skill lifecycle is a closed loop:

```
Create skill -> Review skill -> Improve skill -> Create better next time
```

Each iteration through the loop produces better skills, not just because the individual skill improves but because the creator learns what "better" means. The feedback is:

1. **Explicit** -- scores, not feelings. "Your skill scores 22%" is actionable. "Your skill doesn't feel right" is not.
2. **Specific** -- "missing frontmatter, weak description, no workflow" tells the creator exactly what to fix.
3. **Automated** -- the review runs on every PR without manual intervention. The creator doesn't have to remember to check quality; the system checks for them.
4. **Incremental** -- each PR improves one or a few skills. The improvement is continuous, not batched.

The closed feedback loop is what makes the system adaptive. Without feedback, the creation process is static -- it produces skills at whatever quality level the creator's current understanding supports. With feedback, the creation process evolves -- each cycle through the loop raises the quality floor.

---

## 8. The Credibility Problem

A skill creator whose skills score 0% on a standard skill review has a credibility problem [1]. Not because 0% means the skills are useless -- the dacp-interpreter at 0% was actually a well-written skill. The credibility problem is about consistency: if the project advocates for structured, well-documented, machine-readable skills (which it does, by building the infrastructure to create them), then its own skills should demonstrate those qualities.

PR #28 resolves the credibility problem for five skills. The GitHub Action addresses it systemically for all future skills. The recursive loop closes: the project that creates skills now also reviews them, improving both the skills and the creation process.

### 8.1 The Cobbler's Children

The pattern has a name: the cobbler's children go barefoot. The locksmith's house is never secured. The developer tool company's internal tools are held together with scripts. The skill creator's skills have no frontmatter.

Every craft tradition has this pattern because the practitioner's attention is outward -- toward the customer, the project, the product. Internal artifacts receive less scrutiny because they "work" in the informal sense (the maintainer knows what they do even without proper structure). External review breaks this pattern by applying the same standards to internal artifacts that the project would apply to someone else's.

---

## 9. The Multi-Layer Quality Pipeline

After PR #28, the project has quality review at every artifact layer [2][3]:

1. **TypeScript compiler** -- catches type errors
2. **ESLint** -- catches style and pattern issues
3. **Vitest** -- catches behavioral regressions
4. **Pre-commit hooks** -- catches commit message format violations
5. **Doc-linter agents** -- catches documentation quality issues
6. **Tessl skill review** -- catches skill structure and quality issues

Each layer operates independently. The TypeScript compiler runs regardless of whether ESLint passes. The skill review runs regardless of whether tests pass. This independence means a failure at one layer doesn't block feedback at other layers.

The pipeline has a clear direction: from most formalized (compiler checks) to least formalized (skill quality review). Over time, each layer matures: what starts as optional feedback becomes standard practice becomes enforced requirement. Code compilation started as optional (interpreted languages), became standard (compiled languages), and is now enforced (CI/CD). Skill review is at the beginning of that arc.

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [WAL](../WAL/index.html) | The Rosetta Stone framework: skill quality as translation fidelity between developer intent and agent execution |
| [GSD2](../GSD2/index.html) | Systematic methodology: the closed feedback loop as a refinement cycle for the orchestration process |
| [SYS](../SYS/index.html) | Multi-layer quality: the quality pipeline parallels defense-in-depth security architecture |
| [ECO](../ECO/index.html) | Adaptive systems: the feedback loop as an ecological adaptation cycle -- sense environment, respond, evolve |

---

## 11. Sources

1. [PR #28 - gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator/pull/28)
2. [gsd-skill-creator README](https://github.com/Tibsfox/gsd-skill-creator)
3. [v1.49.39 Release Notes](../../docs/release-notes/)
4. [WAL Module 06: The Rosetta Stone Framework](../WAL/page.html?doc=06-rosetta-stone-framework)
