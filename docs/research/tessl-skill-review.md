# Tessl and the AI Skill Quality Problem

Research document covering the Tessl platform, the Agent Skills Specification, PR #28 skill improvements, and the broader implications for AI skill lifecycle management.

**Date:** 2026-03-25
**Context:** PR #28 by rohan-tessl -- 5 skill improvements + Tessl review workflow
**Status:** Open research -- findings verified against public sources

---

## 1. Tessl -- The Company and Platform

### What Is Tessl?

Tessl is an agent enablement platform that treats AI agent skills and context as software with a complete lifecycle: build, evaluate, distribute, and optimize. Founded in 2024 by Guy Podjarny, the company is headquartered in London, UK. Podjarny previously founded Snyk (scaled to an $8B developer security company) and Blaze (acquired by Akamai, where he served as CTO). The pattern is consistent: identify a category of developer artifact that lacks professional tooling, then build the lifecycle management layer.

Tessl raised a $25M seed round from GV (formerly Google Ventures) and boldstart, followed by a $100M+ Series A led by Index Ventures, reaching a reported $500-750M valuation as of late 2024. The company launched on Product Hunt on 2026-02-26, reaching #5 daily rank with 270 points and 324 followers.

### Leadership Team

| Role | Person | Background |
|------|--------|------------|
| Founder & CEO | Guy Podjarny | Founded Snyk ($8B), Blaze (acq. Akamai), CTO at Akamai, angel investor |
| Head of Product | Dru Knox | Built major developer platforms including Android and the web |
| Head of Engineering | Maurilio Cometto | 25+ years in Silicon Valley startups, products acquired by Cisco, Microsoft, Google |
| General Counsel & Head of Operations | Stephanie Dominy | 25+ years in-house counsel, previously at Snyk, Travelport, Staffbase |
| Head of DevRel | Simon Maple | 25+ years in DevRel and engineering at Snyk, ZeroTurnaround, IBM; co-hosts AI Native Dev podcast |

The team composition signals a Snyk reunion with developer-tooling DNA. Podjarny's playbook at Snyk -- embed security into the developer workflow rather than bolt it on after -- maps directly to Tessl's thesis: embed skill quality management into the development workflow rather than treating skills as static markdown files.

### What Tessl Does

The platform has four integrated components:

1. **Registry** -- A package manager for agent skills. The registry indexes over 3,000 skills and hosts documentation for 10,000+ open-source packages. Skills are discoverable, versioned, and evaluated. Installation is captured in a `tessl.json` manifest, similar to `package.json` for npm.

2. **Evaluation Framework** -- Three distinct evaluation methodologies:
   - **Skill Review** -- structural assessment of SKILL.md files against the Agent Skills Specification (deterministic validation + LLM-as-a-judge quality scoring)
   - **Task Evals** -- behavioral impact testing that runs agents through scenarios with and without the skill, measuring actual performance difference
   - **Repo Evals** (beta) -- tests context effectiveness against realistic code changes derived from actual repository commits

3. **CLI** -- Full command-line interface (`npm i -g @tessl/cli`) with commands for skill management (`skill new`, `skill import`, `skill lint`, `skill review`, `skill publish`), workspace management, evaluation, and diagnostics.

4. **GitHub Actions** -- Automated review and optimization actions that integrate into PR workflows.

### The `tessl skill review` Command

The core evaluation command performs a comprehensive conformance review against the Agent Skills Specification:

```bash
tessl skill review [--json] [--optimize] [--max-iterations <count>]
                   [--skill <name>] [--yes] [<path-or-url>]
```

**Key flags:**
- `--optimize` -- automatically improves the skill file and applies changes iteratively
- `--max-iterations` -- sets improvement loops (1-10, default: 3)
- `--json` -- returns results in JSON format for CI integration
- `--skill` -- targets a specific skill from multi-skill repositories
- `--yes` / `-y` -- auto-applies improvements without confirmation

The command accepts SKILL.md file paths, skill directories, or GitHub URLs. It defaults to the current directory.

### Review Score Components

The review produces a 0-100% score as a weighted average of three sub-components:

**Validation Score** -- Deterministic grading on structural criteria:
- SKILL.md line count (max 500 lines)
- YAML frontmatter validity and parsing
- Required fields present (`name`, `description`)
- Description voice (third person)
- Optional fields (metadata, license, compatibility)
- Body presence with examples and step-by-step structure

**Implementation Score** -- LLM-as-a-judge review of the SKILL.md body:
- Conciseness
- Actionability
- Workflow clarity
- Progressive disclosure

**Activation Score** -- LLM-as-a-judge review of the description field:
- Specificity (does the description name concrete operations?)
- Completeness (does it cover all the skill's capabilities?)
- Trigger Term Quality (does it include "Use when..." clauses?)
- Distinctiveness / Conflict Risk (could it be confused with another skill?)

**Score interpretation:**
- 90%+ -- conforms well to best practices
- 70-89% -- good skill with minor improvements needed
- Below 70% -- needs work before deployment

### Where Tessl Fits in the Ecosystem

Tessl occupies a new category: the skill quality and lifecycle layer. It sits between skill authoring (done by developers) and skill consumption (done by agents). The closest analogy is ESLint for code quality or Snyk for security scanning -- a tool that reviews artifacts against best practices and surfaces issues before they reach production.

The platform is agent-agnostic. Skills managed through Tessl work with Claude Code, Cursor, Gemini, Copilot, and other agent implementations. This positions Tessl as infrastructure rather than being tied to any single agent vendor.

---

## 2. The Skill Quality Problem

### What Makes a Good Skill?

The Agent Skills Specification (agentskills.io) defines the structural requirements. But structure is necessary, not sufficient. A good skill has:

1. **Valid frontmatter** -- YAML with `name` and `description` fields that parse correctly
2. **Actionable description** -- not just "Helps with PDFs" but "Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction."
3. **Clear activation triggers** -- "Use when..." clauses that tell the agent exactly when to activate the skill
4. **Structured workflow** -- numbered steps that provide a procedural path, not a wall of prose
5. **Error handling** -- what to do when things go wrong
6. **Progressive disclosure** -- metadata loaded at startup (~100 tokens), instructions loaded on activation (<5000 tokens), resources loaded on demand
7. **Concrete examples** -- not abstract descriptions but specific inputs and expected outputs

### Common Quality Issues

The five skills improved in PR #28 exemplify the most common failure modes:

**Missing frontmatter:** The dacp-interpreter had no YAML frontmatter at all -- it started with a markdown header. Without frontmatter, the skill has no machine-readable metadata, no structured description, and no activation trigger. An agent scanning available skills would have no way to decide whether to activate it. Score: 0%.

**Weak descriptions:** The mfe-domains skills had descriptions like "Calculus and continuous transformation. Rates, accumulation, approximation -- the mathematics of motion and growth." This is poetic but not actionable. An agent needs to know: what specific operations can this skill perform? When should I activate it? The description lacks "Use when..." clauses and doesn't name concrete operations (derivatives, integrals, ODEs).

**No structured workflow:** All five skills lacked numbered step-by-step workflows. They had prose descriptions or bullet lists of concepts, but no procedural path an agent could follow. The difference matters: a workflow tells the agent "do step 1, then step 2, then step 3." A concept list tells the agent "here are some things that exist."

**Missing error handling:** Only the dacp-interpreter had any error handling guidance, and it was buried in prose rather than structured under a clear `## Error Handling` header.

**Redundant structure:** The mfe-domains skills had a `## Summary` section that largely duplicated the frontmatter description, plus a `## Key Primitives` header with no content beneath it. Redundancy wastes context tokens and confuses priority.

### How Do You Measure Skill Quality Objectively?

This is the core problem Tessl addresses. Before Tessl, skill quality was subjective -- "does it feel right?" or "does the agent seem to work better?" Tessl introduces three measurement layers:

1. **Structural validation** (deterministic) -- does the file parse? Are required fields present? Is it under 500 lines? This is the equivalent of "does the code compile?"

2. **Implementation quality** (LLM-judged) -- are the instructions clear, concise, and actionable? This is the equivalent of code review.

3. **Behavioral impact** (empirical) -- does the agent actually perform better with this skill than without it? This is the equivalent of integration testing.

The combination of deterministic checks and LLM-as-a-judge scoring mirrors how code quality tools evolved: first linters checked syntax, then static analyzers checked patterns, then test suites checked behavior.

### Skill Sprawl

Projects accumulate skills over time. This project has 40+ skills across `.claude/skills/`, `skills/`, and various domain directories. Without quality gates, skills degrade through:

- **Drift:** the codebase changes but the skill instructions don't update
- **Format divergence:** different authors write skills in different formats
- **Activation conflicts:** overlapping descriptions cause the wrong skill to activate
- **Context bloat:** skills grow beyond recommended limits, consuming tokens without proportional value

The parallel to code quality is direct. Code linting caught on because individual developers couldn't maintain consistent style across thousands of files. Skill linting addresses the same problem for a different artifact type.

### Quality Gates

Three tiers of skill quality assurance:

1. **Automated review** -- Tessl's GitHub Action runs on every PR that touches SKILL.md, posting scores and feedback. Non-blocking by default, optional fail-threshold for enforcement.

2. **Manual review** -- human reviewers assess whether the skill's instructions actually match the domain they describe. An LLM can check structure; a human checks truth.

3. **Peer review** -- other skill authors review for consistency with the broader skill library. Does this skill overlap with existing ones? Does it follow the project's conventions?

The ideal pipeline combines all three: automated review catches structural issues, manual review catches semantic issues, peer review catches ecosystem issues.

---

## 3. PR #28 -- The Specific Improvements

### Overview

PR #28 was opened on 2026-03-26 by rohan-tessl (from branch `rohan-tessl:improve/skill-review-optimization` targeting `dev`). It modifies 6 files: 5 SKILL.md files and 1 new GitHub Actions workflow. The PR is currently in DRAFT state.

### Score Improvements

| Skill | Before | After | Delta | Primary Issues |
|-------|--------|-------|-------|----------------|
| dacp-interpreter | 0% | 85% | +85% | No frontmatter at all |
| mfe-synthesis | 11% | 63% | +52% | Redundant headers, no workflow, weak description |
| mfe-unification | 11% | 75% | +64% | Missing domain specifics, no workflow |
| mfe-change | 22% | 68% | +46% | Missing domain specifics, no workflow |
| mfe-emergence | 22% | 75% | +53% | Missing domain specifics, no workflow |

Average improvement: +60 percentage points across 5 skills.

### What Was Wrong and What Fixed It

**dacp-interpreter (0% -> 85%)**

The most dramatic improvement. The original file started with a bare markdown header `# DACP Interpreter` -- no YAML frontmatter at all. Without frontmatter, the Tessl review scores it at 0% because the file doesn't conform to the Agent Skills Specification at the most basic structural level.

Changes applied:
- Added YAML frontmatter with `name: dacp-interpreter` and a comprehensive `description` field including "Use when..." activation triggers
- Restructured the body from numbered prose items into clear `## Workflow` sections with `### Step 1` through `### Step 6` headers
- Added a dedicated `## Error Handling` section grouping "Invalid Bundles" and "Provenance Failures" guidance
- Removed the redundant `## Summary` header that duplicated the description
- Elevated the safety invariant (SAFE-01) to a prominent position at the top of the body

The dacp-interpreter is notable because it was already a well-written skill in terms of content quality -- the instructions were clear, the pipeline was documented, error handling existed. It scored 0% purely because of missing structural metadata. This illustrates how format compliance and content quality are orthogonal concerns.

**mfe-synthesis (11% -> 63%)**

Original description: "The complete picture. Meta-mathematical connections, cross-domain synthesis, and the Complex Plane itself as a navigational tool."

Improved description: "Meta-mathematical connections, cross-domain synthesis, and the Complex Plane as a navigational tool. Classifies problems by quadrant (Abstract/Embodied x Logic/Creativity), routes them to relevant domains, and traces dependency chains. Use when classifying mathematical problems across domains, navigating the Complex Plane of Experience, finding cross-domain connections, or building multi-domain solution strategies."

Changes: expanded description with specific operations and "Use when..." clause, replaced the `## Summary` / `## Key Primitives` structure with a 5-step `## Workflow` (classify -> activate domains -> navigate -> compose -> trace dependencies), removed redundant content duplication.

**mfe-unification (11% -> 75%)**

Original description: "Deep symmetries and unifying principles. Where separate mathematical threads converge into shared structure."

Improved description: "Deep symmetries and unifying principles -- gauge theory, Lie groups, Noether's theorem, and the Standard Model. Constructs field theories from symmetry requirements, derives conservation laws, and traces force unification. Use when working with gauge symmetry, Lie groups (U(1), SU(2), SU(3)), conservation laws via Noether's theorem, the Higgs mechanism, or Standard Model structure."

Changes: description now names the actual mathematical objects the skill covers, added 5-step workflow (identify symmetry group -> gauge principle -> Lagrangian -> Noether -> Higgs), removed redundant summary.

**mfe-change (22% -> 68%)**

Original description: "Calculus and continuous transformation. Rates, accumulation, approximation -- the mathematics of motion and growth."

Improved description: "Calculus and continuous transformation -- derivatives, integrals, ODEs, Taylor series, and optimization. Computes rates of change, accumulates quantities over intervals, solves differential equations, and classifies critical points. Use when computing derivatives or integrals, solving ordinary differential equations, performing Taylor series approximations, finding critical points, or analyzing continuous change and motion."

Changes: description now lists concrete operations, added 5-step workflow (verify continuity -> derivatives -> critical points -> integrate -> solve ODEs), removed redundant summary.

**mfe-emergence (22% -> 75%)**

Original description: "Complex systems and emergent behavior. Chaos, networks, learning -- how simple rules generate unexpected complexity."

Improved description: "Complex systems and emergent behavior -- chaos theory, fractals, neural networks, cellular automata, and computability. Analyzes dynamical systems for chaos via Lyapunov exponents, classifies bifurcations, measures fractal dimension, and models emergent phenomena. Use when analyzing chaotic systems, computing Lyapunov exponents, classifying bifurcations, measuring fractal dimension, modeling neural networks, or studying emergent behavior from simple rules."

Changes: description now names specific analytical techniques, added 5-step workflow (identify system -> Lyapunov -> bifurcations -> fractal dimension -> prediction horizon), removed redundant summary.

### The Pattern

All five skills shared the same structural deficiencies:

1. **Missing or weak descriptions** -- poetic/abstract rather than operational/specific
2. **No "Use when..." activation triggers** -- agents couldn't determine when to activate
3. **No structured workflows** -- concept lists instead of procedural steps
4. **Redundant content** -- `## Summary` sections duplicating the frontmatter description
5. **Missing error handling** (dacp-interpreter had it but it wasn't structured; the mfe skills had none)

The fixes follow a consistent template:
1. Expand the description to name specific operations and include "Use when..." clauses
2. Replace `## Summary` / `## Key Primitives` with a numbered `## Workflow` section
3. Remove redundant content duplication
4. Add `## Error Handling` where applicable

---

## 4. Skill Architecture Best Practices

### The Agent Skills Specification

The Agent Skills Specification (agentskills.io/specification) defines the canonical format for SKILL.md files. Key requirements:

**Directory structure:**
```
skill-name/
  SKILL.md          # Required: metadata + instructions
  scripts/          # Optional: executable code
  references/       # Optional: documentation
  assets/           # Optional: templates, resources
```

**YAML frontmatter (required fields):**

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | 1-64 chars, lowercase alphanumeric + hyphens, must match parent directory |
| `description` | Yes | 1-1024 chars, non-empty, no XML tags |
| `license` | No | License name or reference to bundled file |
| `compatibility` | No | Max 500 chars, environment requirements |
| `metadata` | No | Arbitrary key-value mapping |
| `allowed-tools` | No | Space-delimited list of pre-approved tools (experimental) |

**Name field rules:**
- Lowercase only (no `PDF-Processing`, only `pdf-processing`)
- No leading/trailing hyphens
- No consecutive hyphens (`pdf--processing` is invalid)
- Must match the parent directory name

**Description field best practices:**
- Describe both what the skill does AND when to use it
- Include specific keywords that help agents identify relevant tasks
- Use "Use when..." clauses for explicit activation triggers
- Bad: "Helps with PDFs."
- Good: "Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction."

### Progressive Disclosure

The specification defines a three-tier loading model:

1. **Metadata** (~100 tokens) -- `name` and `description` loaded at startup for ALL skills
2. **Instructions** (<5000 tokens recommended) -- full SKILL.md body loaded when skill activates
3. **Resources** (as needed) -- files in `scripts/`, `references/`, `assets/` loaded on demand

This is why the description field is so critical: it is the ONLY information the agent has when deciding whether to activate a skill. A weak description means the skill never activates, regardless of how good the instructions are.

### Skill vs. System Prompt

A skill is NOT a system prompt. Key differences:

| Aspect | System Prompt | Skill |
|--------|--------------|-------|
| Loading | Always loaded | Loaded on activation |
| Scope | Global behavior | Specific task |
| Format | Free-form text | Structured YAML + markdown |
| Discovery | N/A (always present) | Via description matching |
| Size | Can be large | Should be under 500 lines / 5000 tokens |
| Versioning | Usually unversioned | Versioned via registry |

Skills are designed for selective activation. An agent with 100 skills loads all 100 descriptions (~100 tokens each = ~10K tokens) but only loads the full instructions (~5K tokens) for the skills it activates. This is why structured descriptions with activation triggers matter -- they are the gating mechanism.

### What Gets Measured

Tessl's review scoring breaks down into:

**Validation (deterministic):**
- Does the frontmatter parse as valid YAML?
- Are `name` and `description` present and conformant?
- Is the SKILL.md under 500 lines?
- Is the description in third person?
- Does it include a "Use when..." trigger hint?
- Are optional fields (license, metadata) present?
- Does the body contain examples and step-by-step structure?

**Implementation quality (LLM-judged):**
- Conciseness -- is the skill free of redundant content?
- Actionability -- can an agent follow these instructions to produce output?
- Workflow clarity -- is there a clear procedural path?
- Progressive disclosure -- does the skill layer information appropriately?

**Activation quality (LLM-judged):**
- Specificity -- does the description name concrete operations?
- Completeness -- does it cover all the skill's capabilities?
- Trigger term quality -- are the "Use when..." clauses precise?
- Distinctiveness -- could this description be confused with another skill?

---

## 5. GitHub Actions for Skill Quality

### The tesslio/skill-review Action

The `tesslio/skill-review` GitHub Action automates skill quality review in the PR workflow. It is a lightweight action that requires no external authentication beyond the default `GITHUB_TOKEN`.

**Workflow file** (`.github/workflows/skill-review.yml`):
```yaml
name: Tessl Skill Review
on:
  pull_request:
    branches: [dev]
    paths:
      - "**/SKILL.md"

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: tesslio/skill-review@main
```

**How it works:**
1. Triggers on PRs that modify any `**/SKILL.md` file
2. Installs the Tessl CLI
3. Runs `tessl skill review` on each changed SKILL.md
4. Posts ONE comment on the PR with scores and recommendations
5. Updates the same comment on subsequent pushes (no comment spam)

**Configuration inputs:**

| Input | Purpose | Default |
|-------|---------|---------|
| `path` | Directory to search for SKILL.md files | `.` |
| `comment` | Post results as PR comment | `true` |
| `fail-threshold` | Minimum passing score (0-100) | `0` |

**Non-blocking by default:** With `fail-threshold: 0` (the default), the action provides feedback only. The check passes regardless of score. This is deliberate -- it lowers the barrier to adoption. Teams can add enforcement later with `fail-threshold: 70`.

**Zero external accounts:** Contributors do not need a Tessl account. The action uses only `GITHUB_TOKEN` for posting comments. This removes friction for open-source contributors.

### The tesslio/skill-review-and-optimize Action

A more advanced variant that adds AI-powered optimization:

- **Review mode** (default): Same as skill-review, no auth required
- **Optimize mode**: Runs AI-powered optimization and posts suggested improved SKILL.md content in the PR comment
- **Apply mode**: A `/apply-optimize` comment command extracts optimized content and commits it to the PR branch

Additional inputs: `optimize` (boolean), `optimize-iterations` (1-10, default 3), `tessl-token` (required for optimization).

### The Incremental Improvement Model

The PR #28 approach is strategic: improve 5 skills now, install the workflow to improve all future skills automatically. Every subsequent PR that touches a SKILL.md file gets automated feedback. The library improves incrementally without requiring a dedicated "fix all skills" initiative.

This mirrors how code linting was adopted: you don't reformat 10,000 files on day one. You install the linter and fix files as you touch them. Over time, the entire codebase converges on the standard.

---

## 6. The Open Source Contribution Pattern

### PR #28 as a Model Contribution

The PR demonstrates several patterns worth noting:

**Honest disclosure.** The PR body states: "Honest disclosure -- I work at @tesslio where we build tooling around skills like these. Not a pitch -- just saw room for improvement and wanted to contribute." This is the right way for tool vendors to engage with open-source projects: transparent about affiliation, contributing genuine improvements, not just marketing.

**Small and reviewable.** Five skills, not fifty. The PR body explains: "This PR intentionally caps at five skills to keep the review manageable." This respects the maintainer's time and makes review tractable. The GitHub Action handles the remaining skills incrementally.

**Genuine value.** The improvements are substantive. The dacp-interpreter went from 0% to 85% -- not because the content was bad, but because it lacked structural metadata. The mfe-domains skills gained concrete workflows where they previously had only concept lists. These are real improvements to real files.

**Non-invasive tooling.** The GitHub Action is non-blocking by default, uses only `GITHUB_TOKEN` (no new accounts or secrets), and targets the `dev` branch to match the project's contribution flow per CONTRIBUTING.md. The contributor read the project conventions and respected them.

**Self-service path.** The PR includes a pointer to the optimization guide: "Want to self-improve your skills? Just point your agent at this Tessl guide and ask it to optimize your skill." This empowers the project maintainer rather than creating dependency on the contributor.

### The Tool Vendor / OSS Relationship

There is an inherent tension when someone from a tool company contributes to an open-source project. The contribution advertises the tool. But this tension resolves when:

1. The improvements stand on their own -- would you merge them if they came from a stranger with no corporate affiliation?
2. The tooling is optional -- removing the GitHub Action doesn't break anything
3. The disclosure is upfront -- no hidden agenda
4. The contribution follows project conventions -- commit format, branch targeting, PR structure

PR #28 passes all four checks. The skill improvements would be valuable regardless of their origin. The GitHub Action is additive infrastructure that can be removed at any time.

### The `good-oss-citizen` Pattern

Tessl maintains a `tesslio/good-oss-citizen` repository that provides rules, skills, and scripts teaching AI agents how to contribute to open-source projects properly. The tool reportedly raises compliance from 15% to 99% on OSS contribution processes. It addresses the gap where "AI agents write working code but ignore everything around it: contribution guidelines, AI policies, prior rejected PRs, claimed issues, DCO requirements, changelog updates."

PR #28 appears to embody the principles from this tile: it respects contribution guidelines, targets the correct branch, provides honest disclosure, and keeps the scope manageable.

---

## 7. Connection to This Project

### Skill Creator Reviewing Its Own Skills

There is a recursive quality to this PR. The gsd-skill-creator is itself a skill management system -- it creates, validates, and manages skills, agents, teams, and chipsets. PR #28 targets the project's own skill infrastructure. The tool vendor's tool is reviewing the skill creator's skills.

This creates an interesting feedback loop: the project that manages skill quality is receiving automated quality feedback on its own skills. If the feedback is good, it validates the concept that automated skill review adds value. If the feedback is bad, it identifies gaps in the project's own quality processes.

### The Five Improved Skills

The five skills targeted in PR #28 are part of the project's operational infrastructure:

- **dacp-interpreter** -- core DACP bundle processing, used in agent-to-agent handoffs
- **mfe-synthesis** -- meta-mathematical synthesis, part of the Mathematical Field Equations domain library
- **mfe-unification** -- gauge theory and symmetry, part of the MFE domain library
- **mfe-change** -- calculus and continuous transformation, part of the MFE domain library
- **mfe-emergence** -- complex systems and chaos theory, part of the MFE domain library

The MFE skills are part of the project's mathematical co-processor framework. They provide structured mathematical knowledge that agents can activate when working on problems involving calculus, symmetry, complexity theory, or cross-domain synthesis. Improving their activation descriptions and workflows makes them more reliably activated and more actionable when loaded.

### Automated Quality Review for Future Skills

Installing the `tesslio/skill-review` GitHub Action means every future PR that touches a SKILL.md file gets automated feedback. For a project with 40+ skills, this is meaningful infrastructure. It catches format regressions, missing frontmatter, weak descriptions, and structural issues before they merge.

### Connection to the Rosetta Stone Framework

The skill quality measurement parallels the project's broader theme of translation layers. The Rosetta Stone framework translates between different representation systems. Tessl's skill review translates between human intent (what the skill author wanted to express) and machine activation (what the agent actually understands). The score is a measure of translation fidelity.

A skill with a 0% score is untranslatable -- the agent cannot parse the author's intent from the file structure. A skill with 85% score has high-fidelity translation -- the description maps clearly to activation triggers, the workflow maps clearly to execution steps.

### Connection to Doc-Linter Review Agents

The v1.49.39 milestone used automated doc-linter review agents to assess documentation quality. Tessl's skill review performs the same function for a different artifact type. Both follow the pattern: define quality criteria, automate the review, surface issues in the PR workflow, fix incrementally.

The project now has automated quality review for:
- Code (TypeScript compiler, ESLint)
- Tests (Vitest)
- Commits (pre-commit hook enforcing conventional commits)
- Documentation (doc-linter agents)
- Skills (Tessl review action, if merged)

Each layer catches a different class of quality issue. Together they form a multi-layer quality pipeline.

### The Adaptive Learning Layer

The project's self-description is "adaptive learning layer for Claude Code." Tessl's skill review adds a feedback signal to that learning layer: not just "can we create skills?" but "are the skills we create any good?" The review scores provide a measurable quality signal that can inform the skill creation process itself.

If the skill creator generates skills that consistently score below 70%, the creation process needs improvement. If skills score above 90%, the process is working. The scores close the feedback loop between creation and evaluation.

---

## Sources

- [Tessl - Agent Enablement Platform](https://tessl.io/)
- [What is Tessl? | Tessl Docs](https://docs.tessl.io)
- [Review a skill against best practices | Tessl Docs](https://docs.tessl.io/evaluate/evaluating-skills)
- [CLI commands | Tessl Docs](https://docs.tessl.io/reference/cli-commands)
- [Three Context Eval Methodologies at Tessl](https://tessl.io/blog/three-context-eval-methodologies/)
- [Announcing skills on Tessl: the package manager for agent skills](https://tessl.io/blog/skills-are-software-and-they-need-a-lifecycle-introducing-skills-on-tessl/)
- [Improving your skills with Tessl evals](https://tessl.io/blog/improving-your-skills-with-tessl-evals/)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Review and publish with GitHub Actions | Tessl Docs](https://docs.tessl.io/distribute/review-and-publish-with-github-actions)
- [Tessl About Page](https://tessl.io/about/)
- [Announcing Tessl, the AI Native Development Startup](https://tessl.io/blog/announcing-tessl-the-ai-native-development-startup/)
- [Tessl raises $125M at $500M+ valuation | TechCrunch](https://techcrunch.com/2024/11/14/tessl-raises-125m-at-at-500m-valuation-to-build-ai-that-writes-and-maintains-code/)
- [Tessl | Index Ventures](https://www.indexventures.com/companies/tesslio/)
- [Tessl | Product Hunt](https://www.producthunt.com/products/tessl)
- [Guy Podjarny | Crunchbase](https://www.crunchbase.com/person/guy-podjarny)
- [tesslio GitHub Organization](https://github.com/tesslio)
- [tesslio/skill-review GitHub Action](https://github.com/tesslio/skill-review)
- [tesslio/skill-review-and-optimize GitHub Action](https://github.com/tesslio/skill-review-and-optimize)
- [tesslio/good-oss-citizen](https://github.com/tesslio/good-oss-citizen)
- [PR #28 - gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator/pull/28)
