# Source Index — Unison Language Technical Reference

> Validated source catalog for all research modules.
> Quality ratings follow the schema defined in `00-shared-schemas.md`, Section 2.2.
> Baseline verification date: 2026-03-07.

---

## Primary Sources (OFFICIAL)

These are first-party sources from Unison Computing or the Unison open-source project.

### UNI-DOCS
- **Title:** Unison Language Official Documentation
- **URL:** https://www.unison-lang.org/docs/
- **Rating:** PRIMARY
- **Coverage:** Complete language reference, tutorials, fundamentals, guides
- **Notes:** Canonical source for language semantics, syntax, and standard library
- **Verified:** 2026-03-07

### UNI-BIGIDEA
- **Title:** "The Big Idea" — Content-Addressed Code
- **URL:** https://www.unison-lang.org/docs/the-big-idea/
- **Rating:** PRIMARY
- **Coverage:** Core philosophy of content-addressing, motivation, design rationale
- **Notes:** Essential reading for Module 1; explains why Unison exists
- **Verified:** 2026-03-07

### UNI-GITHUB
- **Title:** Unison GitHub Repository
- **URL:** https://github.com/unisonweb/unison
- **Rating:** PRIMARY
- **Coverage:** Source code, issue tracker, release notes, contributor activity
- **Notes:** Ground truth for implementation details; useful for community metrics (stars, contributors, commit frequency)
- **Verified:** 2026-03-07

### UNI-1-0
- **Title:** "Announcing Unison 1.0"
- **URL:** https://www.unison-lang.org/unison-1-0/
- **Rating:** PRIMARY
- **Coverage:** 1.0 release announcement, feature summary, roadmap signals
- **Notes:** Key milestone document; contains forward-looking statements requiring `[VENDOR-CLAIM]` annotation
- **Verified:** 2026-03-07

### UNI-BYOC
- **Title:** Unison Cloud BYOC (Bring Your Own Cloud)
- **URL:** https://www.unison-lang.org/blog/cloud-byoc/
- **Rating:** PRIMARY
- **Coverage:** BYOC architecture, deployment model, self-hosted cloud
- **Notes:** Critical for Module 4; `[PROPRIETARY]` component
- **Verified:** 2026-03-07

### UNI-CLOUD-APPROACH
- **Title:** "Unison Cloud: Our Approach"
- **URL:** https://www.unison.cloud/our-approach/
- **Rating:** PRIMARY
- **Coverage:** Cloud platform philosophy, architecture overview, design goals
- **Notes:** High-level positioning; many claims require `[VENDOR-CLAIM]` annotation; `[PROPRIETARY]`
- **Verified:** 2026-03-07

### UNI-ABILITIES
- **Title:** Abilities and Ability Handlers — Language Reference
- **URL:** https://www.unison-lang.org/docs/language-reference/abilities-and-ability-handlers/
- **Rating:** PRIMARY
- **Coverage:** Formal ability syntax, handler patterns, type signatures, built-in abilities
- **Notes:** Canonical reference for Module 2; complements the tutorial-style fundamentals page
- **Verified:** 2026-03-07

### UNI-ABILITIES-MONADIC
- **Title:** "Abilities for the Monadically Inclined"
- **URL:** https://www.unison-lang.org/docs/fundamentals/abilities/for-monadically-inclined/
- **Rating:** PRIMARY
- **Coverage:** Ability system explained through monadic lens, comparison with Haskell approach
- **Notes:** Bridge document for Haskell-familiar readers; useful for Module 2 comparison tables
- **Verified:** 2026-03-07

### UNI-UCM-0545
- **Title:** UCM Desktop and MCP Updates (UCM 0.5.45)
- **URL:** https://www.unison-lang.org/blog/ucm0545/
- **Rating:** PRIMARY
- **Coverage:** UCM Desktop app, MCP server integration, AI-assisted development
- **Notes:** Key source for Module 3 (Sections 3.3, 3.4); demonstrates Unison's AI tooling direction
- **Verified:** 2026-03-07

### UNI-LANGREF
- **Title:** Unison Language Reference
- **URL:** https://www.unison-lang.org/docs/language-reference/
- **Rating:** PRIMARY
- **Coverage:** Complete language syntax, type system, pattern matching, documentation literals
- **Notes:** Detailed specification-level content for Module 1 and Module 2
- **Verified:** 2026-03-07

### UNI-SHARE
- **Title:** Unison Share
- **URL:** https://share.unison-lang.org/
- **Rating:** PRIMARY
- **Coverage:** Package registry, library discovery, public codebases
- **Notes:** `[PROPRIETARY]` service; primary source for Module 5 ecosystem analysis
- **Verified:** 2026-03-07

### UNI-BLOG
- **Title:** Unison Blog
- **URL:** https://www.unison-lang.org/blog/
- **Rating:** PRIMARY
- **Coverage:** Release announcements, feature deep-dives, roadmap updates
- **Notes:** Rolling source; individual posts may require `[VENDOR-CLAIM]` annotation
- **Verified:** 2026-03-07

---

## Independent Analysis (INDEPENDENT)

Third-party evaluations, reviews, and analyses from credible technology publications and practitioners.

### LWN-UNISON
- **Title:** "Programming in Unison" — LWN.net
- **URL:** https://lwn.net/Articles/978955/
- **Rating:** INDEPENDENT
- **Coverage:** Language overview, content-addressing analysis, ability system review, ecosystem assessment
- **Notes:** High-quality independent analysis from respected Linux/FOSS publication; useful for corroborating official claims
- **Verified:** 2026-03-07

### SOFTWAREMILL-P1
- **Title:** "Trying out Unison — Part 1: Code as Hashes" — SoftwareMill
- **URL:** https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/
- **Rating:** INDEPENDENT
- **Coverage:** Hands-on evaluation of content-addressing, developer experience, first impressions
- **Notes:** Part 1 of 4-part series; practical developer perspective
- **Verified:** 2026-03-07

### SOFTWAREMILL-P2
- **Title:** "Trying out Unison — Part 2: Abilities" — SoftwareMill
- **URL:** https://softwaremill.com/trying-out-unison-part-2-abilities/
- **Rating:** INDEPENDENT
- **Coverage:** Ability system evaluation, handler patterns, comparison with other effect systems
- **Notes:** Part 2 of 4-part series; key independent validation for Module 2
- **Verified:** 2026-03-07

### SOFTWAREMILL-P3
- **Title:** "Trying out Unison — Part 3: Distributed Computing" — SoftwareMill
- **URL:** https://softwaremill.com/trying-out-unison-part-3-distributed-computing/
- **Rating:** INDEPENDENT
- **Coverage:** Cloud platform evaluation, code mobility testing, distributed computing experience
- **Notes:** Part 3 of 4-part series; critical independent perspective on Module 4 claims
- **Verified:** 2026-03-07

### SOFTWAREMILL-P4
- **Title:** "Trying out Unison — Part 4: Summary" — SoftwareMill
- **URL:** https://softwaremill.com/trying-out-unison-part-4-summary/
- **Rating:** INDEPENDENT
- **Coverage:** Overall assessment, strengths/weaknesses, ecosystem maturity, adoption barriers
- **Notes:** Part 4 of 4-part series; comprehensive summary useful for Module 5
- **Verified:** 2026-03-07

### INFOWORLD-UNISON
- **Title:** "Futuristic Unison functional language debuts" — InfoWorld
- **URL:** (search: InfoWorld Unison functional language December 2025)
- **Rating:** INDEPENDENT
- **Coverage:** 1.0 launch coverage, positioning, industry context
- **Notes:** Mainstream tech press coverage; useful for adoption context in Module 5
- **Verified:** 2026-03-07 (URL requires search confirmation)

### ATHAYDES-UNISON
- **Title:** "A look at Unison: a revolutionary programming language" — Renato Athaydes
- **URL:** https://renato.athaydes.com/posts/a-look-at-unison.html
- **Rating:** INDEPENDENT
- **Coverage:** Language evaluation, content-addressing analysis, developer experience critique
- **Notes:** Experienced developer's perspective; includes critical observations useful for balance
- **Verified:** 2026-03-07

### PRAGDAVE-ABILITIES
- **Title:** "Abilities: a New Way to Inject Behavior and State" — Dave Thomas (pragdave)
- **URL:** https://pragdave.me/thoughts/active/2023-11-20-abilities.html
- **Rating:** INDEPENDENT
- **Coverage:** Ability system tutorial, comparison with dependency injection, practical examples
- **Notes:** From co-author of "The Pragmatic Programmer"; accessible explanation of abilities
- **Verified:** 2026-03-07

---

## Academic Foundations (ACADEMIC)

Peer-reviewed papers and formal research that underpin Unison's design.

### FRANK-PAPER
- **Title:** "Do Be Do Be Do" — Lindley, McBride, McLaughlin
- **URL:** https://arxiv.org/abs/1611.09259
- **Rating:** ACADEMIC
- **Coverage:** Frank language, algebraic effects with direct style, theoretical foundation for Unison's ability system
- **Notes:** Key theoretical ancestor; Frank's "do-be-do-be-do" pattern directly influenced Unison's direct-style abilities
- **Verified:** 2026-03-07

### DUNFIELD-BIDIR
- **Title:** "Complete and Easy Bidirectional Typechecking for Higher-Rank Polymorphism" — Dunfield, Krishnaswami
- **URL:** https://arxiv.org/abs/1306.6032
- **Rating:** ACADEMIC
- **Coverage:** Bidirectional type inference algorithm used in Unison's type checker
- **Notes:** Foundational paper for Unison's type inference implementation
- **Verified:** 2026-03-07

### EFFECTS-BIBLIO
- **Title:** Effects Bibliography
- **URL:** https://github.com/yallop/effects-bibliography
- **Rating:** ACADEMIC
- **Coverage:** Comprehensive bibliography of algebraic effects research
- **Notes:** Referenced by Unison documentation; provides academic context for ability system
- **Verified:** 2026-03-07

### PLOTKIN-POWER
- **Title:** "Algebraic Operations and Generic Effects" — Plotkin, Power
- **URL:** (Applied Categorical Structures, 2003)
- **Rating:** ACADEMIC
- **Coverage:** Original algebraic effects formalism
- **Notes:** Foundational work; Unison's abilities are a practical realization of this theory
- **Verified:** 2026-03-07

### PLOTKIN-PRETNAR
- **Title:** "Handlers of Algebraic Effects" — Plotkin, Pretnar
- **URL:** https://homepages.inf.ed.ac.uk/gdp/publications/Effect_Handlers.pdf
- **Rating:** ACADEMIC
- **Coverage:** Effect handlers formalism, the handler pattern used by Unison
- **Notes:** Introduces the handler abstraction that Unison implements as ability handlers
- **Verified:** 2026-03-07

---

## Community Sources (COMMUNITY)

Blog posts, discussions, and tutorials from the Unison community. These provide practitioner perspective but should never be the sole source for technical claims.

### UNISON-DISCOURSE
- **Title:** Unison Discourse Forum
- **URL:** https://discourse.unison-lang.org/
- **Rating:** COMMUNITY
- **Coverage:** Community discussions, Q&A, feature requests, bug reports
- **Notes:** Useful for adoption sentiment and pain points; not authoritative for technical claims
- **Verified:** 2026-03-07

### UNISON-SLACK
- **Title:** Unison Community Slack
- **URL:** (invite via unison-lang.org)
- **Rating:** COMMUNITY
- **Coverage:** Real-time community discussion, developer support
- **Notes:** Not directly citable; useful for sentiment and ecosystem health assessment
- **Verified:** 2026-03-07

### UNISON-YOUTUBE
- **Title:** Unison Computing YouTube Channel
- **URL:** https://www.youtube.com/@unisonlanguage
- **Rating:** COMMUNITY
- **Coverage:** Conference talks, tutorials, demos, meetup recordings
- **Notes:** Mix of official and community content; video sources require timestamp citations
- **Verified:** 2026-03-07

---

## Comparator Language Sources

Sources for languages compared against Unison in cross-cutting analysis.

### KOKA-LANG
- **Title:** Koka Language
- **URL:** https://koka-lang.github.io/
- **Rating:** PRIMARY (for Koka)
- **Coverage:** Koka's effect system, Perceus reference counting, evidence passing
- **Notes:** Primary comparator for effect system analysis in Module 2
- **Verified:** 2026-03-07

### SCALA3-EFFECTS
- **Title:** Scala 3 — Scalable Component Abstractions / Capabilities
- **URL:** https://docs.scala-lang.org/scala3/
- **Rating:** PRIMARY (for Scala)
- **Coverage:** Scala 3's context functions, capability-based effects
- **Notes:** Comparator for Module 2 effect system comparison table
- **Verified:** 2026-03-07

### HASKELL-EFFECTS
- **Title:** Haskell Effect Systems (polysemy, effectful, etc.)
- **URL:** https://hackage.haskell.org/
- **Rating:** PRIMARY (for Haskell)
- **Coverage:** Haskell's library-level effect systems
- **Notes:** Key comparator; Unison explicitly positions against Haskell's monadic approach
- **Verified:** 2026-03-07

---

## Source Coverage Matrix

| Source ID | M1 | M2 | M3 | M4 | M5 | Synth |
|-----------|----|----|----|----|----|----|
| UNI-DOCS | ✓ | ✓ | ✓ | | | |
| UNI-BIGIDEA | ✓ | | | | | ✓ |
| UNI-GITHUB | ✓ | | ✓ | | ✓ | |
| UNI-1-0 | ✓ | | | | ✓ | ✓ |
| UNI-BYOC | | | | ✓ | | |
| UNI-CLOUD-APPROACH | | | | ✓ | | ✓ |
| UNI-ABILITIES | | ✓ | | | | |
| UNI-ABILITIES-MONADIC | | ✓ | | | | |
| UNI-UCM-0545 | | | ✓ | | | |
| UNI-LANGREF | ✓ | ✓ | | | | |
| UNI-SHARE | | | | | ✓ | |
| UNI-BLOG | | | ✓ | ✓ | ✓ | |
| LWN-UNISON | ✓ | ✓ | | | ✓ | ✓ |
| SOFTWAREMILL-P1 | ✓ | | | | | |
| SOFTWAREMILL-P2 | | ✓ | | | | |
| SOFTWAREMILL-P3 | | | | ✓ | | |
| SOFTWAREMILL-P4 | | | | | ✓ | ✓ |
| INFOWORLD-UNISON | | | | | ✓ | |
| ATHAYDES-UNISON | ✓ | ✓ | | | | |
| PRAGDAVE-ABILITIES | | ✓ | | | | |
| FRANK-PAPER | | ✓ | | | | ✓ |
| DUNFIELD-BIDIR | | ✓ | | | | |
| EFFECTS-BIBLIO | | ✓ | | | | |
| PLOTKIN-POWER | | ✓ | | | | |
| PLOTKIN-PRETNAR | | ✓ | | | | |
| KOKA-LANG | | ✓ | | | | ✓ |
| SCALA3-EFFECTS | | ✓ | | | | |
| HASKELL-EFFECTS | | ✓ | | | | |
