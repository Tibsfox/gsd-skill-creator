# Automated Quality Gates

> **Domain:** AI Agent Skills & Quality Infrastructure
> **Module:** 4 -- GitHub Actions Workflow
> **Through-line:** *The best quality gates are the ones that run without being asked. The workflow doesn't block -- it informs. The decision stays with the developer.*

---

## Table of Contents

1. [The tesslio/skill-review Action](#1-the-tesslioskill-review-action)
2. [The Workflow File](#2-the-workflow-file)
3. [How It Works](#3-how-it-works)
4. [Configuration](#4-configuration)
5. [Non-Blocking by Default](#5-non-blocking-by-default)
6. [Zero External Accounts](#6-zero-external-accounts)
7. [The tesslio/skill-review-and-optimize Action](#7-the-tesslioskill-review-and-optimize-action)
8. [The Incremental Improvement Model](#8-the-incremental-improvement-model)
9. [Comparison with Other CI Quality Tools](#9-comparison-with-other-ci-quality-tools)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The tesslio/skill-review Action

The `tesslio/skill-review` GitHub Action automates skill quality review in the PR workflow [1]. It is a lightweight action that requires no external authentication beyond the default `GITHUB_TOKEN`. No Tessl account. No API key. No secrets to configure. The barrier to adoption is as low as it can be for a CI action: add a YAML file, push, done.

The action's design reflects a principle that successful developer tools share: **start with the lowest possible friction**. Requiring accounts, tokens, or configuration files would filter out the casual evaluation that produces the most value. A developer who installs the action in five minutes and gets feedback on their next PR is more valuable than one who spends thirty minutes configuring credentials and never gets around to it.

---

## 2. The Workflow File

The workflow added by PR #28 (`skill-review.yml`) [2]:

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

The entire workflow is 14 lines. It triggers on PRs that modify any `**/SKILL.md` file, targeting the `dev` branch -- matching the project's contribution flow per CONTRIBUTING.md [2]. The permissions are minimal: `pull-requests: write` (to post the review comment) and `contents: read` (to access the changed files).

### 2.1 Branch Targeting

The workflow targets `dev`, not `main`. This is a detail that matters: the contributor read the project's contribution guidelines and configured the action accordingly. PRs flow to `dev` first, then to `main` after human review. The action reviews skills at the `dev` PR stage, providing feedback before the merge to `dev`, not after [2].

### 2.2 Path Filtering

The `paths: ["**/SKILL.md"]` filter ensures the action only runs when skill files change. A PR that modifies only TypeScript source code, Rust backend code, or documentation won't trigger the review. This respects CI budget -- no wasted compute on irrelevant changes.

---

## 3. How It Works

The action performs a five-step pipeline [1][3]:

1. **Trigger** -- a PR is opened or updated that modifies any `**/SKILL.md` file
2. **Install** -- the Tessl CLI is installed in the GitHub Actions runner
3. **Review** -- `tessl skill review` runs on each changed SKILL.md file
4. **Comment** -- ONE comment is posted on the PR with scores and recommendations
5. **Update** -- on subsequent pushes to the same PR, the same comment is updated (no comment spam)

The single-comment pattern is important. Many CI tools post a new comment on every push, creating long comment threads that bury useful feedback. Tessl updates the existing comment, keeping the PR clean. The developer always sees the current state of the review, not the history of every intermediate state.

---

## 4. Configuration

| Input | Purpose | Default |
|-------|---------|---------|
| `path` | Directory to search for SKILL.md files | `.` |
| `comment` | Post results as PR comment | `true` |
| `fail-threshold` | Minimum passing score (0--100) | `0` |

The configuration is deliberately minimal. Three inputs, all optional, all with sensible defaults. The `path` input allows scoping the review to a specific directory (useful for monorepos). The `comment` input can disable PR comments entirely (useful for consuming results via the API instead). The `fail-threshold` input controls enforcement [1].

---

## 5. Non-Blocking by Default

With `fail-threshold: 0` (the default), the action provides feedback only. The check passes regardless of score. The PR can be merged even if every skill scores 0%. This is deliberate [1].

The design choice mirrors how successful linting tools were adopted:

1. **Phase 1: Feedback only.** Install the tool, see the output, learn what it catches. No enforcement.
2. **Phase 2: Soft enforcement.** Set a low threshold (e.g., `fail-threshold: 50`). Catch the worst offenders.
3. **Phase 3: Hard enforcement.** Set a high threshold (e.g., `fail-threshold: 70`). Require quality standards for all merged skills.

Most projects never reach Phase 3, and that's fine. The value is in Phase 1 -- making quality visible. A developer who sees "Your skill scores 22%" on every PR will eventually fix the skill, even without enforcement. Visibility drives improvement more effectively than blocking.

### 5.1 The Psychology of Non-Blocking

A blocking check creates an adversarial relationship: the developer is trying to merge, the check is preventing it. A non-blocking check creates an informational relationship: the developer is informed, the decision is theirs. The former generates workarounds (disabling checks, suppressing warnings). The latter generates gradual improvement. The developer's autonomy is preserved, and the tool earns trust by being right more often than not.

---

## 6. Zero External Accounts

Contributors do not need a Tessl account [1]. The action uses only `GITHUB_TOKEN` for posting comments. This removes friction for open-source contributors who would otherwise need to create an account, generate an API key, add it as a repository secret, and reference it in the workflow.

The zero-auth design also addresses a common concern with third-party CI tools: data flow. The GITHUB_TOKEN is scoped to the repository and the PR. The action cannot access other repositories, organization data, or user profiles. The skill files are already public (they're in the PR diff). No new data exposure occurs.

---

## 7. The tesslio/skill-review-and-optimize Action

A more advanced variant that adds AI-powered optimization [1]:

- **Review mode** (default): Same as skill-review, no auth required
- **Optimize mode**: Runs AI-powered optimization and posts suggested improved SKILL.md content in the PR comment
- **Apply mode**: A `/apply-optimize` comment command extracts optimized content and commits it to the PR branch

Additional inputs: `optimize` (boolean), `optimize-iterations` (1--10, default 3), `tessl-token` (required for optimization) [1].

The tiered approach is strategic: the review action requires nothing. The optimize action requires a token. The review builds trust; the optimization builds dependency. A project that adopts the review action for free may later adopt the optimization action for value. This is the Snyk model: scan for free, fix for a fee.

---

## 8. The Incremental Improvement Model

The PR #28 approach is strategic: improve 5 skills now, install the workflow to improve all future skills automatically [2]. Every subsequent PR that touches a SKILL.md file gets automated feedback. The library improves incrementally without requiring a dedicated "fix all skills" initiative.

This mirrors how code linting was adopted: you don't reformat 10,000 files on day one. You install the linter and fix files as you touch them. Over time, the entire codebase converges on the standard. The process is:

1. Install the tool
2. Fix the files you're already touching
3. New files are created correctly from the start
4. Old files get fixed when they're next modified
5. Eventually, all files conform

This is cheaper, less disruptive, and more sustainable than a single reformatting pass. It also avoids the common problem with large reformatting PRs: they create merge conflicts with every in-progress branch.

### 8.1 The Compound Effect

Consider a project with 40 skills. PR #28 improves 5. Over the next six months, 20 more skills are touched in various PRs. Each gets automated feedback. The developer fixes issues while they're already working on the file. After six months, 25 of 40 skills have been reviewed and improved. No dedicated effort required -- just the compound effect of automated feedback on routine work.

---

## 9. Comparison with Other CI Quality Tools

| Tool | Artifact | Deterministic | LLM-Judged | Non-Blocking | Zero Auth |
|------|----------|---------------|------------|--------------|-----------|
| ESLint | JavaScript code | Yes | No | Configurable | Yes |
| Prettier | Code formatting | Yes | No | Configurable | Yes |
| SonarQube | Code quality | Yes | No | Configurable | Requires account |
| Snyk | Dependencies | Yes | No | Configurable | Requires account |
| Tessl Skill Review | SKILL.md files | Yes | Yes | Default | Yes |

Tessl's distinguishing feature is the combination of deterministic validation and LLM-as-a-judge quality scoring [3]. ESLint can check syntax but cannot evaluate whether code is "well-written." Tessl checks both structure (deterministic) and quality (LLM-judged). This is possible because SKILL.md files are small, structured, natural-language documents -- the ideal input for LLM evaluation.

The zero-auth default also distinguishes Tessl from tools like SonarQube and Snyk, which require account creation before use. For open-source projects where contributors are transient, zero-auth is a significant advantage.

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | CI/CD infrastructure: GitHub Actions as operational infrastructure for automated quality |
| [CMH](../CMH/index.html) | Automated systems: the workflow as a mesh node that processes skill files and reports quality |
| [GSD2](../GSD2/index.html) | Orchestration patterns: the incremental improvement model parallels GSD's phased execution |
| [WAL](../WAL/index.html) | The Rosetta Stone framework: automated translation between developer intent and quality score |

---

## 11. Sources

1. [Review and publish with GitHub Actions | Tessl Docs](https://docs.tessl.io/distribute/review-and-publish-with-github-actions)
2. [PR #28 - gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator/pull/28)
3. [Review a skill against best practices | Tessl Docs](https://docs.tessl.io/evaluate/evaluating-skills)
4. [tesslio/skill-review GitHub Action](https://github.com/tesslio/skill-review)
5. [tesslio/skill-review-and-optimize GitHub Action](https://github.com/tesslio/skill-review-and-optimize)
