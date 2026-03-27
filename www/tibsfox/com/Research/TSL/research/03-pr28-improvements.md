# Five Skills, Sixty Points

> **Domain:** AI Agent Skills & Quality Infrastructure
> **Module:** 3 -- PR #28 Improvements
> **Through-line:** *The content was already good. The structure was invisible. Adding frontmatter, workflows, and triggers didn't change what the skills knew -- it changed whether anyone could find and use them.*

---

## Table of Contents

1. [PR #28 Overview](#1-pr-28-overview)
2. [The Score Table](#2-the-score-table)
3. [dacp-interpreter: The Worst Case](#3-dacp-interpreter-the-worst-case)
4. [mfe-synthesis: The Complete Picture](#4-mfe-synthesis-the-complete-picture)
5. [mfe-unification: Deep Symmetries](#5-mfe-unification-deep-symmetries)
6. [mfe-change: Calculus and Transformation](#6-mfe-change-calculus-and-transformation)
7. [mfe-emergence: Complex Systems](#7-mfe-emergence-complex-systems)
8. [The Pattern](#8-the-pattern)
9. [What the Numbers Mean](#9-what-the-numbers-mean)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. PR #28 Overview

PR #28 was opened on March 26, 2026, by rohan-tessl (from branch `rohan-tessl:improve/skill-review-optimization` targeting `dev`). It modifies 6 files: 5 SKILL.md files and 1 new GitHub Actions workflow. The PR is in DRAFT state [1].

The contributor's disclosure is worth quoting directly: "Honest disclosure -- I work at @tesslio where we build tooling around skills like these. Not a pitch -- just saw room for improvement and wanted to contribute." The transparency matters. The improvements are real regardless of the contributor's affiliation, but the disclosure means the reviewer can evaluate both the changes and the motivation without guessing.

The PR intentionally caps at five skills to keep the review manageable. The GitHub Action handles the remaining skills incrementally -- every future PR that touches a SKILL.md file gets automated feedback. The strategy is: fix five now, instrument everything going forward.

---

## 2. The Score Table

| Skill | Before | After | Delta | Primary Issues |
|-------|--------|-------|-------|----------------|
| dacp-interpreter | 0% | 85% | +85% | No frontmatter at all |
| mfe-synthesis | 11% | 63% | +52% | Redundant headers, no workflow, weak description |
| mfe-unification | 11% | 75% | +64% | Missing domain specifics, no workflow |
| mfe-change | 22% | 68% | +46% | Missing domain specifics, no workflow |
| mfe-emergence | 22% | 75% | +53% | Missing domain specifics, no workflow |

**Average improvement: +60 percentage points across 5 skills** [1].

The deltas range from +46% to +85%. The variation is instructive. The dacp-interpreter had the most dramatic improvement because it started from absolute zero -- no frontmatter at all. The mfe-domains skills had YAML frontmatter but with weak descriptions, so they started above zero but below the threshold of utility.

---

## 3. dacp-interpreter: The Worst Case

**0% to 85% -- the most dramatic improvement.**

The original file started with a bare markdown header `# DACP Interpreter` -- no YAML frontmatter at all [1]. Without frontmatter, the Tessl review scores it at 0% because the file doesn't conform to the Agent Skills Specification at the most basic structural level. It is a skill file that the agent's skill scanner cannot parse as a skill.

### 3.1 What Was Wrong

The dacp-interpreter was already a well-written skill in terms of content quality. The DACP (Distributed Agent Communication Protocol) pipeline was documented. Error handling existed. Safety invariants were specified (SAFE-01). The instructions were clear enough for a human reader to follow. It scored 0% purely because of missing structural metadata [1].

This is the most important lesson from the entire PR: **format compliance and content quality are orthogonal concerns**. A skill can be the best-documented, most carefully written instructions in the project and still score zero because the machine cannot find, parse, or activate it.

### 3.2 What Fixed It

Changes applied [1]:

1. Added YAML frontmatter with `name: dacp-interpreter` and a comprehensive `description` field including "Use when..." activation triggers
2. Restructured the body from numbered prose items into clear `## Workflow` sections with `### Step 1` through `### Step 6` headers
3. Added a dedicated `## Error Handling` section grouping "Invalid Bundles" and "Provenance Failures" guidance
4. Removed the redundant `## Summary` header that duplicated the description
5. Elevated the safety invariant (SAFE-01) to a prominent position at the top of the body

The content barely changed. The structure changed completely. The score went from 0% to 85%.

### 3.3 Why Not 100%?

At 85%, the skill still has room for improvement. Possible remaining issues include: description length optimization, additional "Use when..." trigger specificity, example inputs/outputs, or compatibility metadata. The review doesn't provide granular feedback at each point threshold, so the exact remaining deficiencies aren't documented. But 85% places the skill firmly in the "good skill with minor improvements needed" category -- a functional, activatable, well-structured skill.

---

## 4. mfe-synthesis: The Complete Picture

**11% to 63% (+52%)**

### 4.1 Before

Original description: "The complete picture. Meta-mathematical connections, cross-domain synthesis, and the Complex Plane itself as a navigational tool." [1]

This description is evocative but operationally empty. An agent reading it knows the skill is about "meta-mathematical connections" but cannot determine what operations the skill supports, when to activate it, or what specific mathematical domains it covers.

### 4.2 After

Improved description: "Meta-mathematical connections, cross-domain synthesis, and the Complex Plane as a navigational tool. Classifies problems by quadrant (Abstract/Embodied x Logic/Creativity), routes them to relevant domains, and traces dependency chains. Use when classifying mathematical problems across domains, navigating the Complex Plane of Experience, finding cross-domain connections, or building multi-domain solution strategies." [1]

The improved description names four specific operations (classify, route, navigate, trace) and includes a "Use when..." clause with four trigger conditions. An agent reading this description knows exactly what the skill does and when to activate it.

### 4.3 Structural Changes

The `## Summary` / `## Key Primitives` structure was replaced with a 5-step `## Workflow` (classify, activate domains, navigate, compose, trace dependencies). Redundant content duplication was removed [1].

---

## 5. mfe-unification: Deep Symmetries

**11% to 75% (+64%)**

### 5.1 Before

Original description: "Deep symmetries and unifying principles. Where separate mathematical threads converge into shared structure." [1]

### 5.2 After

Improved description: "Deep symmetries and unifying principles -- gauge theory, Lie groups, Noether's theorem, and the Standard Model. Constructs field theories from symmetry requirements, derives conservation laws, and traces force unification. Use when working with gauge symmetry, Lie groups (U(1), SU(2), SU(3)), conservation laws via Noether's theorem, the Higgs mechanism, or Standard Model structure." [1]

The transformation is clear: the before description is atmospheric ("where separate mathematical threads converge"); the after description is operational ("constructs field theories from symmetry requirements"). The mathematical objects are named: Lie groups, Noether's theorem, Higgs mechanism, Standard Model. The "Use when..." clause lists five specific activation triggers.

### 5.3 Structural Changes

Added 5-step workflow (identify symmetry group, gauge principle, Lagrangian, Noether, Higgs). Removed redundant summary [1].

---

## 6. mfe-change: Calculus and Transformation

**22% to 68% (+46%)**

### 6.1 Before

Original description: "Calculus and continuous transformation. Rates, accumulation, approximation -- the mathematics of motion and growth." [1]

### 6.2 After

Improved description: "Calculus and continuous transformation -- derivatives, integrals, ODEs, Taylor series, and optimization. Computes rates of change, accumulates quantities over intervals, solves differential equations, and classifies critical points. Use when computing derivatives or integrals, solving ordinary differential equations, performing Taylor series approximations, finding critical points, or analyzing continuous change and motion." [1]

The before description names zero specific operations. The after description names five mathematical concepts (derivatives, integrals, ODEs, Taylor series, optimization) and four specific operations (compute rates, accumulate quantities, solve equations, classify points).

### 6.3 Structural Changes

Added 5-step workflow (verify continuity, derivatives, critical points, integrate, solve ODEs). Removed redundant summary [1].

---

## 7. mfe-emergence: Complex Systems

**22% to 75% (+53%)**

### 7.1 Before

Original description: "Complex systems and emergent behavior. Chaos, networks, learning -- how simple rules generate unexpected complexity." [1]

### 7.2 After

Improved description: "Complex systems and emergent behavior -- chaos theory, fractals, neural networks, cellular automata, and computability. Analyzes dynamical systems for chaos via Lyapunov exponents, classifies bifurcations, measures fractal dimension, and models emergent phenomena. Use when analyzing chaotic systems, computing Lyapunov exponents, classifying bifurcations, measuring fractal dimension, modeling neural networks, or studying emergent behavior from simple rules." [1]

Again the pattern: the before description is thematic ("how simple rules generate unexpected complexity"); the after description is operational ("analyzes dynamical systems for chaos via Lyapunov exponents").

### 7.3 Structural Changes

Added 5-step workflow (identify system, Lyapunov, bifurcations, fractal dimension, prediction horizon). Removed redundant summary [1].

---

## 8. The Pattern

All five skills shared the same structural deficiencies [1]:

1. **Missing or weak descriptions** -- poetic/abstract rather than operational/specific
2. **No "Use when..." activation triggers** -- agents couldn't determine when to activate
3. **No structured workflows** -- concept lists instead of procedural steps
4. **Redundant content** -- `## Summary` sections duplicating the frontmatter description
5. **Missing error handling** -- dacp-interpreter had it but buried; the mfe skills had none

The fixes follow a consistent template:

1. Expand the description to name specific operations and include "Use when..." clauses
2. Replace `## Summary` / `## Key Primitives` with a numbered `## Workflow` section
3. Remove redundant content duplication
4. Add `## Error Handling` where applicable

The template nature of the fixes is itself significant. It means the improvements are reproducible. Any developer (or agent) can apply the same template to any skill. The self-service path the PR suggests -- "point your agent at this guide and ask it to optimize" -- works because the improvements follow a mechanical pattern [1].

---

## 9. What the Numbers Mean

The average +60% improvement from structural changes alone deserves emphasis. The content didn't change in any meaningful way. The mfe-domains skills still describe the same mathematical concepts. The dacp-interpreter still documents the same pipeline. What changed was:

- **Discoverability** -- agents can now find and evaluate these skills through their descriptions
- **Activatability** -- "Use when..." clauses provide clear activation signals
- **Executability** -- numbered workflows give agents procedural paths to follow
- **Maintainability** -- consistent structure makes future updates easier to apply

These are the four qualities that separate a skill from a document. A document informs a human reader. A skill informs, activates, and guides an agent. The structural improvements bridge the gap between documentation (which all five skills already were) and skill (which none of them fully were).

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [WAL](../WAL/index.html) | Transformation of existing content: the PR changed how the skills presented, not what they knew -- like parody revealing structure through transformation |
| [DDA](../DDA/index.html) | Surface vs. substance: the skills had substance (good content) but poor surface (bad structure) -- the improvement was all surface, revealing the substance |
| [ECO](../ECO/index.html) | Taxonomy: naming and organizing what already exists -- the mathematical objects were already in the skills, they just weren't named in the descriptions |

---

## 11. Sources

1. [PR #28 - gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator/pull/28)
2. [Agent Skills Specification](https://agentskills.io/specification)
3. [Review a skill against best practices | Tessl Docs](https://docs.tessl.io/evaluate/evaluating-skills)
