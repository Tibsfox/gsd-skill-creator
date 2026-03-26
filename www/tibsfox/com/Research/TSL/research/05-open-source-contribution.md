# The Good-OSS-Citizen Pattern

> **Domain:** AI Agent Skills & Quality Infrastructure
> **Module:** 5 -- Open Source Contribution
> **Through-line:** *The best vendor contributions are the ones that make the project better whether you adopt the vendor's product or not. The improvements stand on their own.*

---

## Table of Contents

1. [PR #28 as a Model Contribution](#1-pr-28-as-a-model-contribution)
2. [Honest Disclosure](#2-honest-disclosure)
3. [Small and Reviewable](#3-small-and-reviewable)
4. [Genuine Value](#4-genuine-value)
5. [Non-Invasive Tooling](#5-non-invasive-tooling)
6. [The Self-Service Path](#6-the-self-service-path)
7. [The Tool Vendor and OSS Relationship](#7-the-tool-vendor-and-oss-relationship)
8. [The good-oss-citizen Repository](#8-the-good-oss-citizen-repository)
9. [Trust Through Transparency](#9-trust-through-transparency)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. PR #28 as a Model Contribution

PR #28 demonstrates several patterns that distinguish a good open-source contribution from a vendor marketing exercise disguised as one [1]. The patterns are worth documenting because the line between genuine contribution and promotional intrusion is thin, consequential, and frequently crossed.

The PR modifies 6 files: 5 SKILL.md files and 1 new GitHub Actions workflow. It targets the `dev` branch per the project's CONTRIBUTING.md. It uses conventional commit format. It includes a thorough description with before/after scores, a clear explanation of the methodology, and an explicit disclosure of the contributor's employer [1].

Each of these details matters. Collectively, they form a pattern that other tool vendors could follow -- and that maintainers can use as a benchmark when evaluating vendor-submitted PRs.

---

## 2. Honest Disclosure

The PR body states: "Honest disclosure -- I work at @tesslio where we build tooling around skills like these. Not a pitch -- just saw room for improvement and wanted to contribute." [1]

This is the right way for tool vendors to engage with open-source projects. The alternative -- submitting improvements without disclosing affiliation and hoping the maintainer doesn't notice -- is both dishonest and counterproductive. Maintainers who discover undisclosed affiliations after merging lose trust in the contributor and, by extension, in the tool. Maintainers who see upfront disclosure gain trust, because the contributor is saying: "I have a commercial interest, and I'm telling you about it, because the improvements should be evaluated on their merits regardless."

### 2.1 The Disclosure Spectrum

| Level | Example | Trust Impact |
|-------|---------|-------------|
| No disclosure | PR from `user123` with no bio or affiliation | Neutral (unknown) |
| Hidden affiliation | PR from `user123` who works at the tool vendor but doesn't mention it | Negative (if discovered) |
| Boilerplate disclosure | "Disclaimer: I work at ToolCorp" buried at the bottom | Minimal (technically honest, practically invisible) |
| Honest disclosure | "I work at @tesslio where we build this tooling. Not a pitch -- saw room for improvement." | Positive (transparent, respectful) |

PR #28 operates at the highest trust level. The disclosure is in the PR body, not hidden in the contributor's GitHub profile. It explicitly states the relationship and explicitly disclaims promotional intent [1].

---

## 3. Small and Reviewable

The PR body explains: "This PR intentionally caps at five skills to keep the review manageable." [1]

Five skills, not fifty. The project has 40+ skills. A PR that touched all of them would be essentially unreviewable -- the maintainer would either rubber-stamp it (dangerous) or reject it as too large (wasteful of the contributor's effort). By limiting scope to five skills, the PR becomes something a maintainer can review in a single session: read each diff, verify the before/after scores, check that the changes are accurate for the domain.

### 3.1 The Reviewability Principle

A good PR is one the maintainer can hold in their head. The five-file limit isn't arbitrary -- it's calibrated to reviewer cognition. A reviewer can meaningfully evaluate 5 file diffs in 30 minutes. 50 file diffs would take hours and produce review fatigue, which is where errors slip through.

The scope limit also makes the PR reversible. If one of the five improvements turns out to damage the skill's domain accuracy, the maintainer can revert a single file without unwinding a massive change. Surgical PRs enable surgical reverts.

---

## 4. Genuine Value

The improvements are substantive. The dacp-interpreter went from 0% to 85% -- not because the content was bad, but because it lacked structural metadata. The mfe-domains skills gained concrete workflows where they previously had only concept lists [1]. These are real improvements to real files.

### 4.1 The Independence Test

The strongest test of a vendor contribution is: **would you merge this if it came from a stranger with no corporate affiliation?** For PR #28, the answer is yes. The skill improvements follow documented best practices (the Agent Skills Specification). The structural changes are mechanically verifiable. The before/after scores provide quantitative evidence of improvement. None of these things require trust in Tessl as a company -- they stand on their own merits [1].

### 4.2 The Removal Test

A second test: **does removing the vendor's tooling break the improvements?** For PR #28, the answer is no. The five skill improvements are permanent changes to SKILL.md files. They don't depend on the Tessl CLI, the GitHub Action, or any Tessl infrastructure. If the project later decides to remove the GitHub Action, the improved skills remain improved. The tooling is additive; the improvements are independent.

---

## 5. Non-Invasive Tooling

The GitHub Action is non-blocking by default, uses only `GITHUB_TOKEN` (no new accounts or secrets), and targets the `dev` branch to match the project's contribution flow [1][2]. It does not:

- Require a Tessl account
- Add new secrets to the repository
- Modify the build process
- Block PRs from merging
- Write to any files in the repository
- Send data to external services beyond what's needed for the review

The action reads SKILL.md files (already public in the PR diff), evaluates them, and posts a comment. The data flow is: repository files in, PR comment out. No telemetry, no analytics, no usage tracking that the maintainer hasn't consented to by installing the action.

### 5.1 The Supply Chain Consideration

The one legitimate concern is the unpinned action reference: `tesslio/skill-review@main`. This means the action could change behavior at any time without the project's knowledge -- a standard supply-chain risk with GitHub Actions. The mitigation is to pin to a specific commit hash rather than `@main`, which the project can do at merge time [2]. This is a standard practice for security-conscious repositories and doesn't require any change from the contributor.

---

## 6. The Self-Service Path

The PR includes a pointer to the optimization guide: "Want to self-improve your skills? Just point your agent at this Tessl guide and ask it to optimize your skill." [1]

This is the empowerment model: rather than creating dependency on the contributor (or on Tessl), the PR teaches the project how to do it themselves. The contributor fixed five skills as a demonstration. The guide enables the project to fix the remaining 35 independently. The contribution is both a gift (five improved skills) and a tool (the method to improve the rest).

### 6.1 Agent-Native Self-Service

The self-service path is designed for agent execution, not human execution. "Point your agent at this guide" means the optimization process itself can be automated. A developer can run `tessl skill review --optimize` and let the tool iterate through improvements automatically [3]. This is the meta-pattern: a tool that reviews skills, recommended by a contribution that improved skills, documented in a guide that agents can follow to improve more skills. Each layer is automated.

---

## 7. The Tool Vendor and OSS Relationship

There is an inherent tension when someone from a tool company contributes to an open-source project. The contribution advertises the tool. But this tension resolves when four conditions are met [1]:

1. **The improvements stand on their own** -- would you merge them if they came from a stranger with no corporate affiliation?
2. **The tooling is optional** -- removing the GitHub Action doesn't break anything
3. **The disclosure is upfront** -- no hidden agenda
4. **The contribution follows project conventions** -- commit format, branch targeting, PR structure

PR #28 passes all four checks. The skill improvements would be valuable regardless of their origin. The GitHub Action is additive infrastructure that can be removed at any time. The affiliation is disclosed in the first paragraph. The PR targets `dev`, uses conventional commits, and respects the project's contribution guidelines [1].

### 7.1 When the Pattern Breaks

The pattern breaks when any of the four conditions fails:

- **Improvements depend on the vendor's product** -- the PR adds code that only works with the vendor's platform, creating lock-in
- **Tooling is invasive** -- the PR modifies build scripts, adds mandatory dependencies, or requires account creation
- **Disclosure is absent or misleading** -- the contributor hides their affiliation or misrepresents their motivation
- **Conventions are ignored** -- the PR targets the wrong branch, uses incorrect commit format, or doesn't follow the project's code of conduct

When any condition fails, the contribution shifts from "genuine improvement with transparent commercial context" to "marketing disguised as contribution." Maintainers should evaluate vendor PRs against all four conditions before merging.

---

## 8. The good-oss-citizen Repository

Tessl maintains a `tesslio/good-oss-citizen` repository that provides rules, skills, and scripts teaching AI agents how to contribute to open-source projects properly [4]. The tool reportedly raises compliance from 15% to 99% on OSS contribution processes. It addresses the gap where "AI agents write working code but ignore everything around it: contribution guidelines, AI policies, prior rejected PRs, claimed issues, DCO requirements, changelog updates."

PR #28 appears to embody the principles from this repository: it respects contribution guidelines, targets the correct branch, provides honest disclosure, and keeps the scope manageable [1][4]. Whether the contributor used the tool themselves or simply practiced what it preaches, the result is the same: a contribution that respects the project's norms.

### 8.1 The Meta-Pattern

A company that builds a tool for good OSS contributions, uses that tool (or its principles) to make good OSS contributions, is practicing what it preaches. This is the recursive quality loop: the tool vendor's own contributions demonstrate the quality that the tool is designed to enforce. If the contributions were bad, the tool would lose credibility. The fact that PR #28 is well-structured is evidence -- not proof, but evidence -- that the tool works.

---

## 9. Trust Through Transparency

The deepest lesson from PR #28 is about trust architecture. Trust is not built by hiding commercial interests -- it's built by disclosing them and demonstrating that the work has value independent of those interests [1].

The disclosure model works because it aligns incentives: the contributor benefits from the PR being merged (it demonstrates Tessl's value), and the project benefits from the improvements (better skills, automated review). Both parties win, and both know it. Hidden agendas create asymmetric information; transparent disclosure creates aligned incentives.

This is the same trust principle that operates throughout the project's broader architecture: trust relationships are explicit, not inferred. You know who you're dealing with because they told you.

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [BRC](../BRC/index.html) | Community contribution patterns: PR #28 as a gift to the commons, paralleling Burning Man's gifting principle |
| [WAL](../WAL/index.html) | The permission ethic: respect through transparency, disclosure as the foundation of trust |
| [WYR](../WYR/index.html) | Corporate-community relationships: Weyerhaeuser's "working forest" claim vs. Tessl's "genuine improvement" claim -- both require evidence beyond words |
| [SYS](../SYS/index.html) | Trust-based access control: disclosure as an access credential in the trust model |

---

## 11. Sources

1. [PR #28 - gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator/pull/28)
2. [tesslio/skill-review GitHub Action](https://github.com/tesslio/skill-review)
3. [CLI commands | Tessl Docs](https://docs.tessl.io/reference/cli-commands)
4. [tesslio/good-oss-citizen](https://github.com/tesslio/good-oss-citizen)
