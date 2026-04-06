# M3: Docs-as-Code Pipeline

**Module:** M3  
**Title:** Docs-as-Code Pipeline  
**Type:** Procedure / Standard  
**Owner:** Documentation Engineering Lead  
**Lifecycle State:** Published  
**Review Cadence:** Annual  
**Audience:** Senior Engineers, Documentation Engineers, DevOps Engineers, Compliance Auditors  
**Framework Refs:** NIST SP 800-53 R5 (CM, SA, SI), ISO/IEC 27001:2022, NIST SP 800-100  
**Version:** 1.0  
**Last Reviewed:** 2026-04-05  
**Next Review:** 2027-04-05  

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [Core Principle: Documentation as Code](#3-core-principle-documentation-as-code)
4. [Business Impact and Justification](#4-business-impact-and-justification)
5. [Pipeline Architecture](#5-pipeline-architecture)
6. [Tooling Landscape](#6-tooling-landscape)
7. [CI/CD Implementation Templates](#7-cicd-implementation-templates)
8. [Drift Detection and Staleness Management](#8-drift-detection-and-staleness-management)
9. [Quality Metrics Dashboard](#9-quality-metrics-dashboard)
10. [Roles and Responsibilities](#10-roles-and-responsibilities)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Related Documents](#12-related-documents)
13. [Revision History](#13-revision-history)

---

## 1. Purpose

This module defines the docs-as-code pipeline: the methodology, architecture, tooling, and automation patterns that treat documentation with the same engineering rigor applied to production software. The pipeline enforces consistency, traceability, and quality through automated checks, version control, and continuous integration — reducing manual overhead while improving documentation accuracy and reliability.

This module applies to all technical documentation produced within the organization's information security, engineering, and compliance functions. It provides both the conceptual foundation and the operational implementation details required to adopt a docs-as-code workflow at enterprise scale.

---

## 2. Scope

This module covers:

- Version-controlled documentation stored in Git repositories
- All markdown-based, reStructuredText-based, and DITA-based documentation pipelines
- CI/CD automation for documentation linting, building, deploying, and drift checking
- Tooling selection, configuration, and integration patterns
- Quality gate enforcement and metrics collection

This module does not cover:

- Content strategy or information architecture (see M1)
- Document taxonomy and classification (see M2)
- Compliance framework mapping (see M4)

---

## 3. Core Principle: Documentation as Code

### 3.1 Conceptual Foundation

The docs-as-code methodology treats documentation as a first-class software artifact. Documentation lives in the same Git repository as the code it describes, follows the same branching and review workflows, and passes through the same CI/CD pipeline that validates software changes.

This approach emerged from a fundamental observation in high-performing engineering organizations: documentation maintained outside the codebase diverges from the implementation it describes. This divergence compounds over time. When a feature ships, the code is merged and deployed; the documentation update is filed as a follow-up task, deprioritized, and eventually forgotten. The result is documentation that describes a system that no longer exists — a liability rather than an asset.

The docs-as-code model eliminates this divergence by making documentation updates a required part of the definition of done. A pull request that changes an API cannot merge without updating the corresponding documentation. The CI pipeline enforces this requirement automatically, blocking merges when documentation drift is detected.

### 3.2 Foundational Properties

A mature docs-as-code implementation exhibits five foundational properties:

**Colocality.** Documentation lives adjacent to the code it describes. An API handler and its documentation reference live in the same directory. A procedure and the script it describes are committed together. Physical proximity enforces logical coupling.

**Version parity.** Documentation versions track code versions. When version 2.3.1 of a service is deployed, version 2.3.1 of its documentation is deployed simultaneously. Consumers always have access to the documentation that matches the running system.

**Review symmetry.** Documentation changes require the same review rigor as code changes. A rewrite of an authentication procedure requires sign-off from a security engineer, just as a change to the authentication code would. The review process is not lighter because the artifact is prose rather than code.

**Automated validation.** Quality checks that humans perform inconsistently are delegated to automated tools. Spelling, grammar, link validity, style guide compliance, and format correctness are checked by machines on every commit. Human reviewers focus on accuracy, completeness, and clarity.

**Continuous deployment.** Approved documentation publishes automatically. There is no manual publication step, no ticket to file, no waiting for a release window. Approved content reaches readers within minutes of merge.

### 3.3 Relationship to Information Security

The docs-as-code model has direct implications for information security governance. NIST SP 800-53 R5 control family CM (Configuration Management) requires that organizations maintain accurate and current documentation of system configurations, interconnections, and security controls. When documentation lives outside version control and is updated manually, satisfying CM requirements depends entirely on human discipline — an unreliable mechanism at scale.

Version-controlled documentation provides an audit trail. Every change to a security procedure is recorded with author identity, timestamp, diff, and review sign-off. This audit trail satisfies the evidentiary requirements of CM-3 (Configuration Change Control), CM-9 (Configuration Management Plan), and SA-5 (System Documentation). [nist-800-53]

NIST SP 800-100 explicitly addresses the need for current, accurate documentation of security controls and procedures, noting that documentation that does not reflect actual system behavior undermines the security program. The docs-as-code pipeline is the operational mechanism that keeps documentation synchronized with system reality. [nist-800-100]

---

## 4. Business Impact and Justification

### 4.1 Support Ticket Reduction

Organizations that implement structured, version-controlled documentation programs report substantial reductions in support volume. Paligo (2025) reports that organizations with effective technical documentation programs see support ticket reductions of 40–60% compared to organizations with ad-hoc documentation practices. The mechanism is straightforward: accurate, searchable, current documentation answers questions before they become support requests. [paligo-2025]

The 40–60% range reflects variation in implementation maturity. Organizations that implement docs-as-code with automated drift detection and quality gates achieve reductions toward the upper bound. Organizations that implement version control for documentation but retain manual publication and no drift detection achieve reductions toward the lower bound.

At a support organization handling 10,000 tickets per month at an average resolution cost of $25 per ticket, a 50% reduction yields $125,000 per month in direct cost avoidance — before accounting for engineer time diverted from product work to answer support questions.

### 4.2 Documentation Cycle Time Reduction

IBM (2026) reports that organizations using AI-augmented documentation pipelines — which layer on top of a docs-as-code foundation — achieve 59% reductions in documentation cycle time: the elapsed time from a feature being implemented to accurate documentation being available to readers. [ibm-2026]

The 59% reduction is not solely attributable to AI augmentation. The baseline reduction from moving documentation out of manual, out-of-band workflows into automated pipelines accounts for a significant portion. AI augmentation — automatic generation of first-draft documentation from code changes — accelerates the authoring phase, while CI/CD automation eliminates the publication delay.

A documentation cycle that previously took two weeks from feature completion to publication — waiting for a technical writer to be assigned, draft the content, send it for review, incorporate feedback, and manually publish — compresses to two to three days with a mature docs-as-code pipeline.

### 4.3 Compliance Cost Reduction

Organizations subject to NIST 800-53, ISO 27001, or CMMC audits face recurring costs to produce evidence that documentation is current and accurate. When documentation lives in version control, evidence production is a Git log query. When documentation lives in shared drives or wiki systems with no version history, evidence production requires manual attestation, email chains, and significant auditor time.

The Secure Controls Framework (SCF) estimates that organizations with mature documentation management programs spend 30–40% less time on audit preparation than organizations with ad-hoc documentation practices. [scf] Version control provides the evidence trail; automated quality gates provide the quality assurance evidence; deployment logs provide the publication evidence.

### 4.4 Engineer Satisfaction

Stack Overflow's 2025 Developer Survey identifies poor documentation as the top source of friction for software engineers — above slow CI/CD pipelines, legacy code, and inadequate tooling. [stackoverflow-2025] Organizations that improve documentation quality and currency report measurable improvements in developer satisfaction scores and reductions in new-hire time-to-productivity.

The docs-as-code model improves documentation quality by making it a shared engineering responsibility rather than a separate function. Engineers who write and review documentation as part of their normal workflow produce documentation that is more technically accurate and better aligned with how the system actually behaves.

---

## 5. Pipeline Architecture

### 5.1 Complete Pipeline Diagram

The docs-as-code pipeline consists of eleven stages, organized into four phases: authoring, validation, review, and publication. The following diagram represents the complete pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCS-AS-CODE PIPELINE                           │
└─────────────────────────────────────────────────────────────────────┘

  AUTHORING PHASE
  ───────────────
  ┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
  │  Author  │────▶│  Git Branch  │────▶│  Commit  │────▶│   Push   │
  │  writes  │     │  (feature/   │     │  (local  │     │  (to     │
  │  content │     │   docs/fix)  │     │   repo)  │     │  remote) │
  └──────────┘     └──────────────┘     └──────────┘     └──────────┘
                                                               │
                                                               ▼
  VALIDATION PHASE (CI/CD — runs on every push)
  ─────────────────────────────────────────────
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Lint /      │────▶│  Spell       │────▶│  Link        │
  │  Style Check │     │  Check       │     │  Check       │
  │  (Vale)      │     │  (cspell)    │     │  (lychee)    │
  └──────────────┘     └──────────────┘     └──────────────┘
         │                                         │
         ▼                                         ▼
  ┌──────────────┐                        ┌──────────────┐
  │  Build       │                        │  Drift       │
  │  (MkDocs /   │                        │  Check       │
  │   Hugo/Sphinx│                        │  (Swimm)     │
  └──────────────┘                        └──────────────┘
         │                                         │
         └─────────────────┬───────────────────────┘
                           ▼
                    All checks pass?
                   ┌──────┴──────┐
                   │ NO          │ YES
                   ▼             ▼
             Block PR     Open for Review
             (CI fail)
                           │
  REVIEW PHASE             ▼
  ────────────    ┌──────────────────┐
                  │  Pull Request    │
                  │  Review          │
                  │  (SME + owner)   │
                  └──────────────────┘
                           │
                    Approved?
                   ┌──────┴──────┐
                   │ NO          │ YES
                   ▼             ▼
             Return to      Merge to
             Author         main branch
                                │
  PUBLICATION PHASE             ▼
  ──────────────────   ┌──────────────────┐
                       │  Auto-Deploy     │
                       │  (GitHub Pages / │
                       │   S3 / CDN)      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Published       │
                       │  Documentation   │
                       │  (live to users) │
                       └──────────────────┘
```

### 5.2 Stage Definitions

**Stage 1: Author writes content.** The documentation author creates or modifies documentation files in their local development environment. Files are written in the target markup language (Markdown, reStructuredText, DITA). Authors use the same editor tooling — VS Code, JetBrains IDEs — that they use for code, with documentation linting extensions active locally.

**Stage 2: Git branch.** The author creates a feature branch following the repository's branching convention. Branch names follow the pattern `docs/<ticket-id>-<short-description>` or `fix/docs-<description>`. The branching strategy mirrors the organization's code branching strategy — typically a variation of GitFlow or trunk-based development with short-lived feature branches.

**Stage 3: Commit.** The author commits changes locally with descriptive commit messages following the repository's conventional commits standard. Documentation commits use the `docs:` prefix: `docs(api): update authentication endpoint parameters`. Commit granularity should be meaningful — one logical change per commit, not one file per commit.

**Stage 4: Push.** The author pushes the branch to the remote repository. This triggers the CI/CD pipeline automatically. The author does not manually initiate validation — the pipeline runs on every push.

**Stage 5: Lint and style check.** Vale — the primary style linting tool — checks all modified documentation files against the configured style guide (Microsoft Writing Style Guide, Google Developer Documentation Style Guide, or a custom organizational style). Vale reports style violations, passive voice overuse, heading capitalization errors, and terminology inconsistencies. The lint step fails if Vale reports errors above the configured severity threshold.

**Stage 6: Spell check.** cspell checks all modified documentation files against a configured dictionary that includes technical terminology, product names, and organizational vocabulary. The spell check step fails if unknown words are detected. Custom dictionaries are maintained in the repository and updated through the same PR process as documentation content.

**Stage 7: Link check.** lychee (or an equivalent link checker) validates all hyperlinks in modified and adjacent documentation files. Internal links are checked against the built documentation structure. External links are checked against live URLs. Links returning 404 or connection errors fail the build. Links returning redirects are flagged for review. The link check runs with a configurable timeout and retry policy to handle transient network failures.

**Stage 8: Build.** The documentation site is built from source using the configured static site generator (MkDocs, Hugo, Sphinx, or DITA-OT for enterprise multi-format output). Build failures — due to broken references, invalid frontmatter, or malformed markup — fail the pipeline. The build artifact is retained for deployment in the publication phase.

**Stage 9: Drift check.** Swimm (or equivalent) checks whether documentation references to code — function names, API endpoints, configuration keys, file paths — remain valid against the current codebase. A documentation file that references `authenticate_user()` fails drift detection if that function has been renamed to `verify_identity()` in the codebase. Drift detection is the automated enforcement mechanism that prevents documentation from describing a system that no longer exists.

**Stage 10: Pull request review.** After all automated checks pass, the pull request is opened (or updated) for human review. The review requires sign-off from the document owner and at least one subject matter expert (SME). For security-sensitive documentation, the review requires sign-off from the security team lead. The PR template prompts reviewers to verify accuracy, completeness, and audience appropriateness — not style, which the automated tools have already validated.

**Stage 11: Merge and auto-deploy.** After review approval, the pull request is merged to the main branch. The merge triggers a deployment pipeline that builds the final documentation artifact and publishes it to the configured hosting platform (GitHub Pages, Amazon S3 + CloudFront, or an internal documentation portal). Deployment is automatic and requires no manual intervention. The deployment completes within five minutes of merge for repositories under 10,000 documentation pages.

### 5.3 Branch Strategy for Documentation

The documentation branch strategy mirrors the code branch strategy. For organizations using trunk-based development:

- All documentation changes are made on short-lived feature branches
- Feature branches are merged to `main` after passing CI and review
- `main` is always in a deployable state
- Tags mark documentation releases aligned with software releases

For organizations using GitFlow:

- `main` contains the current production documentation
- `develop` contains documentation for the next release
- Feature branches (`docs/feature-name`) branch from and merge to `develop`
- Release branches carry documentation from `develop` to `main` alongside code

For organizations with multiple product versions requiring simultaneous documentation support, a version branching strategy is required:

- `docs/v2.3` contains documentation for product version 2.3
- `docs/v3.0` contains documentation for product version 3.0
- Changes that apply to multiple versions are backported using cherry-pick
- The documentation site displays a version selector to readers

### 5.4 Pre-Commit Hooks

Pre-commit hooks run locally before a commit is created, catching errors before they reach the remote pipeline. This reduces pipeline wait time and provides faster feedback to authors. The following pre-commit hooks are standard:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict

  - repo: https://github.com/streetsidesoftware/cspell
    rev: v8.6.0
    hooks:
      - id: cspell
        args: ["--config", ".cspell.json"]

  - repo: https://github.com/errata-ai/vale
    rev: v3.4.2
    hooks:
      - id: vale
        args: ["--config", ".vale.ini", "--minAlertLevel", "error"]
```

Pre-commit hooks enforce the same checks as the CI pipeline but provide sub-second feedback. Authors fix issues locally before pushing, reducing the number of pipeline runs that fail at the validation stage.

---

## 6. Tooling Landscape

### 6.1 Tooling Comparison Table

The following table compares documentation tooling across key dimensions. Tool selection depends on organizational context, technical stack, compliance requirements, and team expertise.

| Tool | Category | Primary Language | License | Key Strength | Compliance Features | Build Speed | Best For |
|------|----------|-----------------|---------|--------------|---------------------|-------------|----------|
| **GitBook** | Publishing platform | N/A (SaaS) | Commercial | SOC 2 + ISO 27001 certified | Audit logs, access controls, SSO | Fast (managed) | Enterprise teams needing compliance out of the box |
| **MkDocs Material** | Static site generator | Python | MIT | Search, navigation, versioning | None built-in; via CI integration | Fast | Python ecosystems; developer documentation |
| **Hugo** | Static site generator | Go | Apache 2.0 | Fastest builds (<1s for 10K pages) | None built-in; via CI integration | Fastest | Large documentation sites; polyglot teams |
| **Sphinx** | Static site generator | Python | BSD | Python docstring integration | None built-in; via CI integration | Moderate | Python library documentation; autodoc |
| **Mintlify** | AI-augmented platform | N/A (SaaS) | Commercial | AI-powered auto-update suggestions | SOC 2 Type II | Fast (managed) | API documentation; developer-facing products |
| **Vale** | Style linter | Go | Apache 2.0 | Configurable style rules; multi-style | None built-in | Near-instant | Any documentation pipeline needing style enforcement |
| **Swimm** | Drift detection | N/A (SaaS/self-hosted) | Commercial | Code-coupled documentation; auto-sync | Audit trail for doc updates | Near-instant | Teams where code and docs must stay synchronized |
| **DITA-OT** | Multi-format publishing | Java | Apache 2.0 | Enterprise multi-format (PDF, HTML, EPUB) | Supports regulated industry requirements | Slow (XML processing) | Regulated industries; hardware documentation; multi-format publishing |

### 6.2 GitBook

GitBook is a documentation platform that provides version control, branching, and review workflows through a web interface backed by Git storage. Its primary differentiator for compliance-conscious organizations is its SOC 2 Type II certification and ISO 27001 alignment, which means that the platform's own security controls have been independently audited.

GitBook supports integration with GitHub and GitLab, allowing documentation to be authored either in the GitBook web editor or in a local development environment with changes synchronized to the platform. CI/CD integration is available through GitHub Actions connectors.

GitBook is appropriate for organizations that need a managed platform with compliance certifications and do not have the DevOps capacity to self-host and maintain a documentation pipeline. Its primary limitations are cost (commercial licensing), reduced customization compared to self-hosted static site generators, and vendor dependency for the publication pipeline.

### 6.3 MkDocs Material

MkDocs Material is a theme and extension framework for MkDocs, the Python-based static site generator. It is the most widely adopted documentation framework in the Python and DevOps communities. MkDocs Material provides:

- Full-text search with client-side indexing
- Multi-version documentation using the `mike` versioning plugin
- Navigation tabs, section indexes, and collapsible navigation trees
- Dark and light mode
- Social cards for link previews
- Admonition blocks for notes, warnings, and tips

MkDocs Material integrates with GitHub Actions through official GitHub Actions published by the maintainer. The integration supports automated deployment to GitHub Pages with a single workflow file.

MkDocs Material is appropriate for organizations with Python-centric technology stacks, teams already using Python tooling, and organizations that want a highly configurable self-hosted pipeline. Its primary limitation is build speed at very large scale — sites with 50,000+ pages may experience build times of 10–15 minutes.

### 6.4 Hugo

Hugo is the fastest static site generator available, implemented in Go. Hugo sites with 10,000 pages build in under one second; sites with 100,000 pages build in under 10 seconds. This speed makes Hugo appropriate for very large documentation sites and for CI/CD pipelines where build time is a constraint.

Hugo uses Go templating, which has a steeper learning curve than MkDocs Material's Markdown-first approach. Theme selection is broader than MkDocs but theme customization requires Go template knowledge. Hugo supports multiple content formats (Markdown, AsciiDoc, reStructuredText) and has strong internationalization support.

Hugo is appropriate for organizations with very large documentation corpora, polyglot technology stacks, or teams with Go expertise. It is less appropriate for organizations where documentation authors — rather than engineers — are the primary contributors, due to the complexity of the Hugo content model.

### 6.5 Sphinx

Sphinx is the documentation tool of the Python ecosystem, used by the Python standard library, NumPy, Django, and thousands of open source Python projects. Sphinx's primary differentiator is autodoc: automatic extraction of documentation from Python docstrings. An API documented in source code is automatically published in the documentation site without requiring a separate documentation file.

Sphinx supports multiple output formats through its builder system: HTML, PDF (via LaTeX), EPUB, man pages, and Texinfo. This multi-format capability is useful for organizations that need to publish documentation in multiple formats from a single source.

Sphinx is appropriate for Python libraries, data science platforms, and organizations where API reference documentation is the primary documentation type. Its primary limitations are slower build times than Hugo or MkDocs, a more complex configuration model, and reduced visual design flexibility compared to MkDocs Material.

### 6.6 Mintlify

Mintlify is an AI-augmented documentation platform designed primarily for API documentation and developer-facing documentation. Its differentiating feature is AI-powered documentation maintenance: when code changes are merged, Mintlify can suggest documentation updates based on the diff, reducing the authoring burden for API documentation updates.

Mintlify supports OpenAPI specification rendering, interactive API explorers, and changelog generation from Git history. It is SOC 2 Type II certified.

Mintlify is appropriate for organizations with heavy API surface areas, developer-facing products where documentation quality directly affects developer adoption, and teams that want AI-assisted authoring integrated into the publication platform. Its primary limitations are cost, SaaS vendor dependency, and reduced applicability for procedural and policy documentation compared to API reference documentation.

### 6.7 Vale

Vale is an open source prose linter that enforces style guide compliance through a rule-based system. Vale ships with packages for common style guides — Microsoft Writing Style Guide, Google Developer Documentation Style Guide, write-good, and others — and supports custom rule authoring in YAML.

Vale integrates with CI/CD pipelines through its command-line interface and with editors through language server protocol (LSP) extensions for VS Code, JetBrains IDEs, and Neovim. This dual integration model means authors receive Vale feedback while writing and the pipeline enforces Vale compliance before merge.

Vale rules address:

- Passive voice detection and flagging
- Heading capitalization consistency
- Sentence length limits
- Banned term lists (legacy product names, deprecated terminology)
- Terminology consistency (ensuring "sign in" is used rather than "log in" throughout)
- Reading level assessment

Vale configuration is stored in `.vale.ini` at the repository root and in a `styles/` directory containing style packages. Both are committed to the repository and subject to the same review process as documentation content.

### 6.8 Swimm

Swimm is a documentation platform that creates explicit links between documentation and code. A Swimm document references specific functions, classes, files, and code paths. When referenced code changes, Swimm detects the change and flags the associated documentation as requiring update.

Swimm integrates with GitHub and GitLab through a CI check that runs on every pull request. The check compares documentation references against the current codebase state. If a referenced function has been renamed, moved, or deleted, the Swimm check fails and blocks the pull request from merging until the documentation is updated.

Swimm is particularly effective for:

- Architecture documentation that references specific implementation files
- Tutorial documentation that walks through specific code paths
- Runbook steps that reference configuration file locations or script paths

Swimm's primary limitation is that it requires authoring documentation within the Swimm platform or using Swimm's Markdown extensions, which creates some lock-in to the Swimm toolchain. Teams that want drift detection without platform dependency can implement a lighter-weight drift detection approach using custom CI scripts that scan for code references in documentation and validate them against the current codebase.

### 6.9 DITA-OT

The DITA Open Toolkit (DITA-OT) is the reference implementation for processing documents authored in the Darwin Information Typing Architecture (DITA) XML format. DITA is an OASIS standard [oasis-dita] designed for large-scale, reusable, multi-format documentation in regulated industries.

DITA's core concept is topic-based authoring: documentation is organized into discrete, reusable topic files (task, concept, reference) that are assembled into publications through map files. This separation of content from publication structure enables the same content to be published in multiple formats — web portal, PDF manual, contextual help system, chatbot knowledge base — from a single source.

DITA-OT produces output in HTML5, PDF (via XSL-FO), EPUB, and other formats through a plugin architecture. Organizations add custom plugins to produce organization-specific output formats.

DITA-OT is appropriate for:

- Hardware documentation required in both print and web formats
- Regulated industries (aerospace, medical devices, defense) with documentation requirements specified in contracts or regulations
- Organizations with large content reuse requirements across multiple products
- Documentation teams with dedicated technical writers familiar with XML authoring

DITA-OT is not appropriate for small-to-medium engineering organizations, developer-authored documentation, or organizations without dedicated XML tooling expertise. The complexity and tooling overhead of DITA significantly exceeds the needs of most software engineering documentation programs.

---

## 7. CI/CD Implementation Templates

### 7.1 GitHub Actions Workflow Structure

The documentation CI/CD pipeline is implemented as a GitHub Actions workflow. The following templates provide production-ready configurations for each pipeline stage.

### 7.2 Lint Job Template

```yaml
# .github/workflows/docs-lint.yml
name: Documentation Lint

on:
  pull_request:
    paths:
      - 'docs/**'
      - '.vale.ini'
      - 'styles/**'
      - '.cspell.json'
  push:
    branches:
      - main
    paths:
      - 'docs/**'

jobs:
  vale-lint:
    name: Vale Style Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Vale
        uses: errata-ai/vale-action@v2
        with:
          version: "3.4.2"
          files: docs/
          reporter: github-pr-review
          fail_on_error: true
          filter_mode: added
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  cspell-check:
    name: Spell Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install cspell
        run: npm install -g cspell@8

      - name: Run spell check
        run: |
          cspell \
            --config .cspell.json \
            --show-suggestions \
            --no-progress \
            "docs/**/*.md"

  link-check:
    name: Link Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install lychee
        uses: lycheeverse/lychee-action@v1
        with:
          args: >
            --verbose
            --no-progress
            --timeout 30
            --retry-wait-time 5
            --max-retries 3
            --exclude "^https://localhost"
            --exclude "^http://localhost"
            --exclude "^https://127\."
            docs/**/*.md
          fail: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 7.3 Build Job Template

```yaml
# .github/workflows/docs-build.yml
name: Documentation Build

on:
  pull_request:
    paths:
      - 'docs/**'
      - 'mkdocs.yml'
  push:
    branches:
      - main

jobs:
  build-mkdocs:
    name: Build Documentation Site
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for git-revision-date plugin

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r docs/requirements.txt

      - name: Build documentation
        run: |
          mkdocs build --strict --verbose
        env:
          DOCS_VERSION: ${{ github.sha }}

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: docs-site
          path: site/
          retention-days: 7

      - name: Check build output size
        run: |
          BUILD_SIZE=$(du -sm site/ | cut -f1)
          echo "Build size: ${BUILD_SIZE}MB"
          if [ "$BUILD_SIZE" -gt 500 ]; then
            echo "::warning::Documentation build exceeds 500MB. Consider image optimization."
          fi
```

### 7.4 Deploy Job Template

```yaml
# .github/workflows/docs-deploy.yml
name: Documentation Deploy

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
      - 'mkdocs.yml'

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r docs/requirements.txt

      - name: Build documentation
        run: mkdocs build --strict

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v4

      - name: Upload to GitHub Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: site/

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

      - name: Notify on deployment
        if: success()
        run: |
          echo "Documentation deployed successfully"
          echo "URL: ${{ steps.deployment.outputs.page_url }}"
          echo "Commit: ${{ github.sha }}"
          echo "Deployed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

### 7.5 Drift Check Job Template

```yaml
# .github/workflows/docs-drift.yml
name: Documentation Drift Check

on:
  pull_request:
    paths:
      - 'src/**'          # Trigger when code changes
      - 'api/**'
      - 'docs/**'
  schedule:
    - cron: '0 0 * * 1'  # Weekly drift audit every Monday at midnight

jobs:
  drift-check:
    name: Check Documentation Drift
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install drift checker
        run: pip install docs-drift-checker==1.0.0

      - name: Run drift detection
        id: drift
        run: |
          python scripts/check-drift.py \
            --docs-dir docs/ \
            --src-dir src/ \
            --threshold 90 \
            --output drift-report.json
        continue-on-error: true

      - name: Parse drift report
        id: parse
        run: |
          STALE_COUNT=$(python -c "
          import json
          with open('drift-report.json') as f:
              report = json.load(f)
          print(report.get('stale_count', 0))
          ")
          echo "stale_count=$STALE_COUNT" >> $GITHUB_OUTPUT

      - name: Upload drift report
        uses: actions/upload-artifact@v4
        with:
          name: drift-report
          path: drift-report.json

      - name: Comment on PR if drift detected
        if: github.event_name == 'pull_request' && steps.parse.outputs.stale_count != '0'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('drift-report.json', 'utf8'));
            const body = `## Documentation Drift Detected\n\n` +
              `**${report.stale_count} documentation file(s) may be out of date.**\n\n` +
              `Files flagged:\n` +
              report.stale_files.map(f => `- \`${f.path}\` (last updated: ${f.last_updated}, referenced symbol: \`${f.symbol}\`)`).join('\n') +
              `\n\nPlease update the documentation before merging.`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

      - name: Fail if drift detected on PR
        if: github.event_name == 'pull_request' && steps.parse.outputs.stale_count != '0'
        run: |
          echo "Documentation drift detected. See drift-report artifact for details."
          exit 1
```

### 7.6 Full Pipeline Orchestration Template

```yaml
# .github/workflows/docs-pipeline.yml
name: Documentation Pipeline

on:
  pull_request:
    paths:
      - 'docs/**'
      - 'src/**'
      - 'mkdocs.yml'
      - '.vale.ini'
  push:
    branches:
      - main

jobs:
  # Stage 1: Validation (parallel)
  lint:
    uses: ./.github/workflows/docs-lint.yml

  # Stage 2: Build (depends on lint)
  build:
    needs: lint
    uses: ./.github/workflows/docs-build.yml

  # Stage 3: Drift check (parallel with build)
  drift:
    needs: lint
    uses: ./.github/workflows/docs-drift.yml

  # Stage 4: Deploy (only on main, after build and drift pass)
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [build, drift]
    uses: ./.github/workflows/docs-deploy.yml
    permissions:
      contents: write
      pages: write
      id-token: write
```

### 7.7 Vale Configuration Template

```ini
# .vale.ini
StylesPath = styles

MinAlertLevel = warning

[*.md]
BasedOnStyles = Vale, Microsoft, Google

Vale.Avoid = YES
Vale.Repetition = YES
Vale.Spelling = NO  # Handled by cspell

Microsoft.Headings = YES
Microsoft.Passive = YES
Microsoft.Wordiness = YES
Microsoft.We = suggestion
Microsoft.FirstPerson = suggestion

Google.Headings = YES
Google.Latin = YES
Google.Passive = suggestion

# Organization-specific overrides
[docs/api/**/*.md]
BasedOnStyles = Vale, Google

[docs/procedures/**/*.md]
BasedOnStyles = Vale, Microsoft
Microsoft.Passive = error  # Procedures must use active voice
```

### 7.8 MkDocs Configuration Template

```yaml
# mkdocs.yml
site_name: Organization Documentation
site_url: https://docs.example.internal
repo_url: https://github.com/example-org/docs
repo_name: example-org/docs
edit_uri: edit/main/docs/

theme:
  name: material
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.indexes
    - navigation.top
    - search.highlight
    - search.suggest
    - content.code.copy
    - content.action.edit
    - content.action.view

plugins:
  - search:
      lang: en
  - git-revision-date-localized:
      enable_creation_date: true
      type: date
  - tags
  - minify:
      minify_html: true

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.highlight:
      anchor_linenums: true
  - attr_list
  - md_in_html
  - tables
  - footnotes

extra:
  version:
    provider: mike
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/example-org

validation:
  omitted_files: warn
  absolute_links: warn
  unrecognized_links: warn
```

---

## 8. Drift Detection and Staleness Management

### 8.1 The Documentation Drift Problem

Documentation drift is the progressive divergence between a documentation artifact and the system or process it describes. Drift is the natural state of documentation in organizations that do not actively prevent it. Code is refactored; documentation is not. APIs change; references in tutorials are not updated. Procedures reference configuration file paths that have been reorganized. The result is documentation that misleads readers — which is worse than no documentation, because readers who trust the documentation take incorrect actions.

Drift detection is the automated process of identifying documentation that has become inconsistent with the codebase, API, or process it describes. A mature drift detection implementation:

1. Identifies all code references within documentation (function names, class names, file paths, endpoint URLs, configuration keys)
2. Validates each reference against the current codebase state
3. Flags references that no longer resolve
4. Assigns staleness scores based on age since last update and number of invalid references
5. Blocks merges when drift is detected in high-priority documentation

### 8.2 Drift Detection Configuration

The following configuration defines the organization's drift detection policy. This configuration file is committed to the repository root and is the authoritative source for drift detection thresholds and behaviors.

```yaml
# .drift-config.yaml
version: 1

# Global settings
defaults:
  staleness_threshold_days: 90          # Documents older than 90 days are flagged for review
  code_reference_scan: true             # Scan for code references in all documentation
  merge_blocking: true                  # Block merges when drift is detected

# Document classification
document_classes:
  critical:
    paths:
      - "docs/procedures/**"
      - "docs/runbooks/**"
      - "docs/security/**"
    staleness_threshold_days: 30        # Critical docs reviewed every 30 days
    merge_blocking: true
    notification_channels:
      - "security-team@example.internal"
      - "operations@example.internal"

  standard:
    paths:
      - "docs/guides/**"
      - "docs/api/**"
    staleness_threshold_days: 90
    merge_blocking: true
    notification_channels:
      - "docs-team@example.internal"

  reference:
    paths:
      - "docs/reference/**"
    staleness_threshold_days: 180
    merge_blocking: false               # Reference docs flag but don't block
    notification_channels:
      - "docs-team@example.internal"

# Code reference detection patterns
reference_patterns:
  functions:
    - pattern: '`(\w+)\(\)`'           # Backtick-enclosed function calls
    - pattern: '\bdef (\w+)\('          # Python function definitions
    - pattern: '\bfunction (\w+)\('     # JavaScript function definitions
    - pattern: '\bfn (\w+)\('           # Rust function definitions

  files:
    - pattern: '`([\w/.-]+\.\w+)`'     # Backtick-enclosed file paths
    - pattern: '\bsee `([\w/.-]+)`'

  endpoints:
    - pattern: '(GET|POST|PUT|DELETE|PATCH)\s+`(/[\w/{}/.-]+)`'
    - pattern: '`(https?://[\w./-]+/api/[\w/{}/.-]+)`'

  config_keys:
    - pattern: '`(\w+[\._]\w+)`'        # dot or underscore separated config keys

# Staleness notification schedule
notifications:
  # Warn owners 14 days before threshold
  warning_lead_days: 14
  # Send daily reminders after threshold breach
  daily_reminder: true
  # Escalate to manager after 7 days past threshold
  escalation_days: 7

# Exemptions
exemptions:
  - path: "docs/archive/**"            # Archived docs not drift-checked
  - path: "docs/changelog/**"          # Changelogs are historical, not maintained
  - frontmatter_key: "drift_exempt"    # Per-document exemption flag
    frontmatter_value: true
```

### 8.3 Staleness Flagging Workflow

When a document reaches or exceeds the staleness threshold, the drift detection system initiates the staleness management workflow:

**Day 0 (threshold reached):** The document is flagged as stale in the drift detection database. The document owner receives an automated notification: "Your document `docs/procedures/deploy-production.md` has not been reviewed in 90 days. Please review and update by [date 14 days hence] to prevent merge blocking."

**Day 14 (warning deadline):** If the document has not been reviewed and re-marked as current, a second notification is sent to the document owner and the team lead. The drift detection check begins blocking pull requests that touch code referenced by the stale document.

**Day 21 (escalation):** If no review has occurred, the escalation notification is sent to the document owner's manager and the documentation program manager. The merge block remains in effect.

**Day 30 (critical violation):** If no review has occurred within 30 days of threshold breach, the document is automatically marked with a `[REVIEW REQUIRED]` banner in the published documentation. The banner remains until a review is completed and approved.

**Review completion:** The document owner reviews the document, makes necessary updates, and submits a pull request. The PR includes the updated `last_reviewed` frontmatter field and a review summary in the commit message. After CI passes and review is approved, the merge block is lifted and the staleness flag is cleared.

### 8.4 Owner Notification Template

```
Subject: Documentation Review Required — [DOCUMENT_TITLE]

Your document requires review:

  Document: [DOCUMENT_TITLE]
  Path: [DOCUMENT_PATH]
  Last Reviewed: [LAST_REVIEWED_DATE]
  Days Since Review: [DAYS_SINCE_REVIEW]
  Review Deadline: [DEADLINE_DATE]
  Threshold: [THRESHOLD_DAYS] days

Action Required:
  1. Review the document for accuracy against current system state
  2. Update any sections that are no longer accurate
  3. Update the `last_reviewed` field in the document frontmatter
  4. Submit a pull request with your changes (or a confirmation comment if no changes needed)

Consequences of Non-Action:
  - Pull requests touching related code will be blocked after [WARNING_DATE]
  - A [REVIEW REQUIRED] banner will appear on the published document after [CRITICAL_DATE]
  - Your manager will be notified on [ESCALATION_DATE]

Review the document: [DOCUMENT_URL]
Open a pull request: [EDIT_URL]

Documentation Program
[ORGANIZATION_NAME]
```

### 8.5 Merge Block Implementation

The merge block is implemented as a required status check in the repository settings. GitHub branch protection rules require the `docs-drift` CI job to pass before a pull request can be merged. The job fails when:

1. The pull request modifies code referenced by a stale documentation file
2. The pull request modifies a documentation file with unresolved code references
3. The pull request modifies a documentation file without updating the `last_reviewed` field

The merge block is intentionally conservative: it errs toward blocking rather than allowing potentially stale documentation to accompany code changes. Teams that find the block too aggressive can adjust the `document_classes` configuration to change the `merge_blocking` setting for specific documentation categories.

### 8.6 Drift Metrics

The drift detection system produces the following metrics, reported weekly to the documentation program manager:

| Metric | Description | Target |
|--------|-------------|--------|
| Stale document count | Documents past staleness threshold | < 5% of total |
| Average document age | Mean days since last review across all documents | < 60 days |
| Drift detection coverage | % of documents with code references tracked | > 90% |
| Merge blocks triggered | PR merges blocked by drift detection per week | < 3 per week |
| Mean time to review | Average days from stale flag to review completion | < 14 days |
| Owner notification response rate | % of notifications resulting in review within 14 days | > 80% |

---

## 9. Quality Metrics Dashboard

### 9.1 Dashboard Purpose and Audience

The documentation quality metrics dashboard provides a real-time view of documentation health across the organization's documentation corpus. Primary audiences are:

- **Documentation Program Manager:** Weekly review of overall documentation health
- **Team Leads:** View of their team's documentation health and outstanding obligations
- **Compliance Auditors:** Evidence that documentation is current, reviewed, and maintained

The dashboard is generated from CI/CD pipeline outputs, drift detection reports, and Git repository metadata. It does not require a separate data collection process — all inputs are produced by the pipeline operations described in earlier sections of this module.

### 9.2 Dashboard Specification

The dashboard consists of five panels:

**Panel 1: Corpus Health Summary**

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total documents | N | — | — |
| Documents current | N (%) | > 95% | Green/Yellow/Red |
| Documents stale (warned) | N (%) | < 4% | Green/Yellow/Red |
| Documents stale (blocked) | N (%) | < 1% | Green/Yellow/Red |
| Documents archived | N | — | — |
| Orphaned documents (no owner) | N | 0 | Green/Yellow/Red |

**Panel 2: Pipeline Health**

| Metric | Last 7 Days | Last 30 Days | Trend |
|--------|-------------|--------------|-------|
| PR lint pass rate | % | % | ↑/↓/→ |
| PR build pass rate | % | % | ↑/↓/→ |
| PR drift check pass rate | % | % | ↑/↓/→ |
| Mean lint fix time (hours) | N | N | ↑/↓/→ |
| Deployments succeeded | N | N | ↑/↓/→ |
| Deployments failed | N | N | ↑/↓/→ |
| Mean deploy time (minutes) | N | N | ↑/↓/→ |

**Panel 3: Team Documentation Health**

| Team | Documents Owned | Current (%) | Stale (%) | Avg Age (days) | Overdue Reviews |
|------|----------------|-------------|-----------|----------------|-----------------|
| [Team 1] | N | % | % | N | N |
| [Team 2] | N | % | % | N | N |
| ... | | | | | |

**Panel 4: Drift Detection Activity**

| Metric | Last 7 Days | Last 30 Days |
|--------|-------------|--------------|
| Drift checks run | N | N |
| Stale flags raised | N | N |
| Merge blocks triggered | N | N |
| Reviews completed (drift-driven) | N | N |
| Code-doc divergences detected | N | N |
| Mean time to resolve (days) | N | N |

**Panel 5: Quality Trend**

A time-series chart showing the following metrics over the trailing 90 days:

- Documentation current rate (%)
- Lint pass rate (%)
- Build pass rate (%)
- Mean document age (days)

A sustained improvement trend in all four metrics indicates a healthy documentation program. A declining trend in any metric triggers an alert to the Documentation Program Manager.

### 9.3 Dashboard Implementation

The dashboard is implemented as a static HTML page generated by a weekly scheduled CI job. The job:

1. Queries the Git repository for document metadata (last commit date, owner from CODEOWNERS)
2. Queries the drift detection database for staleness flags and merge block events
3. Queries the CI pipeline for lint, build, and deploy success rates
4. Generates a JSON data file from the collected metrics
5. Renders the dashboard HTML from the JSON data and a template
6. Publishes the dashboard to the documentation portal at `/docs-health`

The dashboard generation job runs every Sunday at 00:00 UTC and on demand through a manual workflow trigger. Dashboard data is never older than seven days for the weekly summary panels and is updated in near-real-time for pipeline health metrics through CI pipeline webhooks.

### 9.4 Quality Gate Thresholds

The following thresholds define the quality gate color coding used in the dashboard:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Documents current | > 95% | 85–95% | < 85% |
| Documents stale (blocked) | < 1% | 1–3% | > 3% |
| PR lint pass rate | > 90% | 75–90% | < 75% |
| PR build pass rate | > 95% | 85–95% | < 85% |
| Mean document age | < 60 days | 60–90 days | > 90 days |
| Orphaned documents | 0 | 1–5 | > 5 |

Yellow status triggers a recommendation in the weekly documentation health report. Red status triggers an immediate notification to the Documentation Program Manager and the relevant team leads.

---

## 10. Roles and Responsibilities

### 10.1 Documentation Author

The documentation author is the engineer, technical writer, or subject matter expert who creates or modifies documentation content. The author is responsible for:

- Creating documentation on a feature branch following the branching convention
- Ensuring documentation passes local pre-commit hooks before pushing
- Responding to CI pipeline failures within one business day
- Addressing review comments within three business days
- Updating the `last_reviewed` frontmatter field when reviewing existing documentation

### 10.2 Document Owner

The document owner is the team or individual responsible for the long-term accuracy of a documentation file. Ownership is declared in the repository's CODEOWNERS file. The document owner is responsible for:

- Responding to staleness notifications within the specified timeframe
- Conducting reviews of owned documents on the configured review cadence
- Designating a delegate when unavailable for extended periods
- Escalating resource conflicts that prevent timely documentation maintenance

### 10.3 Documentation Program Manager

The Documentation Program Manager owns the documentation pipeline and quality program. Responsibilities include:

- Maintaining pipeline configuration (GitHub Actions workflows, Vale styles, drift detection config)
- Reviewing the weekly quality metrics dashboard
- Investigating and resolving recurring pipeline failures
- Updating documentation standards in response to organizational changes
- Managing the documentation tooling budget and vendor relationships

### 10.4 Security Team Lead

The Security Team Lead is a required reviewer for documentation in the `docs/security/`, `docs/procedures/incident-response/`, and `docs/compliance/` directories. Responsibilities include:

- Reviewing security documentation changes for accuracy and completeness within three business days of PR creation
- Ensuring security documentation changes do not introduce sensitive information into public-facing documentation (per SC-02)
- Approving major revisions to incident response procedures and security policies

---

## 11. Implementation Roadmap

### 11.1 Phase 1: Foundation (Weeks 1–4)

**Objective:** Establish version control and basic CI validation for all documentation.

- Migrate existing documentation into a Git repository (or add documentation to the existing code repository)
- Configure `.gitignore`, `.vale.ini`, `.cspell.json`
- Install Vale style packages and configure organizational terminology lists
- Implement the lint job template (Section 7.2)
- Implement the build job template (Section 7.3)
- Train all documentation authors on the Git-based authoring workflow

**Success criteria:** All new documentation changes pass through CI lint and build before merging.

### 11.2 Phase 2: Automation (Weeks 5–8)

**Objective:** Automate deployment and add link validation.

- Implement the deploy job template (Section 7.4)
- Implement the link check in the lint job
- Configure branch protection rules requiring CI to pass
- Establish the CODEOWNERS file with document ownership assignments
- Configure Dependabot or Renovate for documentation tooling version management

**Success criteria:** Documentation deploys automatically on merge to main; broken links block merges.

### 11.3 Phase 3: Drift Detection (Weeks 9–14)

**Objective:** Implement automated drift detection and staleness management.

- Implement the drift check job template (Section 7.5)
- Configure `.drift-config.yaml` with organization-appropriate thresholds
- Implement the owner notification workflow
- Implement the merge block for stale documentation
- Establish the 90-day staleness threshold review cadence

**Success criteria:** Stale documentation is automatically detected and owners are notified; merge blocks prevent code changes from shipping with out-of-date documentation.

### 11.4 Phase 4: Metrics and Continuous Improvement (Weeks 15–20)

**Objective:** Implement the quality metrics dashboard and establish continuous improvement processes.

- Implement the dashboard generation job
- Establish weekly documentation health review process
- Define quality improvement targets for the following quarter
- Conduct retrospective on pipeline friction points and address the top three

**Success criteria:** Dashboard reports documentation corpus health weekly; documentation current rate exceeds 95%.

---

## 12. Related Documents

- M1: Documentation Strategy and Governance
- M2: Document Taxonomy and Classification
- M4: Compliance and Regulatory Frameworks
- M5: Tooling and Templates Reference
- Organization GitHub Actions Runbook
- Vale Style Configuration Guide
- Drift Detection Administration Guide

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-05 | Documentation Engineering | Initial publication |

---

## Sources

[paligo-2025] Paligo, "The Essential Guide to Effective Technical Documentation," October 2025.

[ibm-2026] IBM Think, "AI Code Documentation: Benefits and Top Tips," March 2026.

[nist-800-53] NIST SP 800-53 Revision 5, "Security and Privacy Controls for Information Systems and Organizations," September 2020.

[nist-800-100] NIST SP 800-100, "Information Security Handbook: A Guide for Managers," October 2006.

[stackoverflow-2025] Stack Overflow, "2025 Developer Survey," 2025.

[scf] Secure Controls Framework, "Policy vs Standard vs Procedure," Secure Controls Framework Council.

[oasis-dita] OASIS, "Darwin Information Typing Architecture (DITA) Version 1.3," 2015.

[kong-2025] Kong Inc., "What is Docs as Code?," April 2025.

[altexsoft-2024] AltexSoft, "Technical Documentation in Software Development: Types, Best Practices, and Tools," 2024.
