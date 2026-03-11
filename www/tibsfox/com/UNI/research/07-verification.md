# Unison Language Research — Verification Report
Date: 2026-03-08

---

## Executive Summary

**Overall: PARTIAL PASS — publication-ready with targeted fixes**

The research suite is substantively strong. All six modules demonstrate thorough technical analysis, balanced tone, rigorous source attribution, and genuine intellectual honesty about limitations. The safety gates pass. All 12 success criteria are met or substantially met.

However, verification identified **3 cross-reference errors**, **1 data inconsistency**, **5 missing metadata blocks**, and several minor gaps that should be addressed before final publication. None of these are structural problems — they are fixable in a single editing pass.

**Key findings:**
- Cross-references in Modules 1 and 2 swap the descriptions for Modules 3 and 4
- Module 3 incorrectly cross-references Module 1 for abilities (should be Module 2)
- Filename references to `01-language-foundations.md` are broken (actual file is `01-language-core.md`)
- Commit count differs between Module 1 (26,558) and Module 5 (20,030) — explained in Module 5 but not in Module 1
- Modules 1–5 lack the metadata blocks required by shared-schemas.md

---

## Safety Gate Results

### SC-SRC (Source quality): PASS

All citations are traceable to sources in the source index. Source quality ratings are appropriate:
- PRIMARY sources used for all core technical claims (UNI-DOCS, UNI-BIGIDEA, UNI-ABILITIES, UNI-LANGREF)
- INDEPENDENT sources used for corroboration and critical perspective (LWN-UNISON, SOFTWAREMILL series, ATHAYDES-UNISON)
- ACADEMIC sources used for theoretical grounding (FRANK-PAPER, DUNFIELD-BIDIR, PLOTKIN-POWER/PRETNAR)
- COMMUNITY sources used for sentiment only, never as sole source for claims

No blog-as-primary-source issues detected. The SoftwareMill series (INDEPENDENT) provides practitioner evaluation but all core claims are independently backed by PRIMARY sources. PragDave's abilities article (INDEPENDENT) is used for pedagogical examples, not as the sole authority on ability mechanics.

### SC-NUM (Numerical attribution): PASS

Every numerical claim has source attribution with date:
- Ecosystem metrics (139,811 definitions, 1,300 authors, 152,459 downloads): sourced to UNI-1-0, late 2025, marked `[VENDOR-CLAIM]`
- GitHub metrics (~6,500 stars, 122 contributors, 97 releases): sourced to GitHub, March 2026
- Funding ($9.75M): sourced to public reporting
- Collision resistance (~100 quadrillion years): sourced to UNI-BIGIDEA, marked `[VENDOR-CLAIM]`
- SQLite size reduction (~100x): sourced to UNI-1-0, marked `[VENDOR-CLAIM]`
- LOC reduction (10-100x): sourced and marked `[VENDOR-CLAIM]`

**Minor note:** Comparator language star counts in Module 5, Section 5.6 (Rust ~103K, Zig ~37K, Gleam ~18K, Roc ~4.5K) are presented without explicit source or access date. These are used for context, not as primary claims, but adding "(GitHub, March 2026)" would improve rigor.

### SC-ADV (No advocacy): PASS

The documents present Unison factually without advocating for or against adoption. Key evidence of balance:

- Module 1 explicitly lists limitations (no FFI, tooling constraints) alongside benefits
- Module 2 acknowledges the referential transparency trade-off: "Refactoring the code with abilities might require more brain activity than with monads"
- Module 4 includes a caveats section after the deployment comparison
- Module 5 identifies 7 adoption barriers rated High to Medium severity
- Module 6 states: "The gap between 'interesting and well-designed' and 'ready to bet your company on' remains wide"
- Module 6 identifies 6 evidence gaps with explicit "what we don't know" framing

Strong language like "This is not an incremental improvement on builds. It is the elimination of builds as a concept" (Module 1, Section 1.6) is factually supportable — the claim is technically accurate — and followed by a limitations section.

No promotional language, no unsupported superlatives, no advocacy detected.

### SC-VND (Vendor claims): PASS

Self-reported claims from Unison Computing are consistently annotated:
- `[VENDOR-CLAIM]` on ecosystem metrics (Module 1, 5, 6)
- `[VENDOR-CLAIM]` on collision resistance claim (Module 1, 6)
- `[VENDOR-CLAIM]` on 100x SQLite size reduction (Module 1)
- `[VENDOR-CLAIM]` on 10-100x LOC reduction (Module 4, 6)
- `[VENDOR-CLAIM]` on interpreter improvements (Module 5, 6)
- `[VENDOR-CLAIM]` on Volturno "exactly-once processing" (Module 4)
- Self-reported deployment speed explicitly marked: "[VENDOR-CLAIM — self-reported by Unison Computing]" (Module 4)

**Minor gaps (non-blocking):**
- Module 4: "any pool of machines into an easily-programmable distributed computing cluster" — attributed to "Unison Computing, 2025" but not tagged `[VENDOR-CLAIM]`
- Module 4: "BYOC supports all features of managed Unison Cloud" — vendor-sourced feature parity claim, not tagged
- Module 4: "ACID transactions" for OrderedTable — vendor-described capability, not tagged
- Module 4: Adaptive Service Graph Compression description — vendor-described feature, not tagged

These are attributed to their source by name, which provides sufficient transparency. Adding `[VENDOR-CLAIM]` tags would improve consistency with the schema.

### SC-OSS (Open source vs. proprietary): PASS

The open-source/proprietary boundary is clearly documented:
- Module 1, Section 1.5: "The Unison language, compiler, and runtime are MIT-licensed... Unison Cloud... is a proprietary commercial product"
- Module 2, Section 2.3: Remote ability noted as "part of Unison Cloud's proprietary platform, though the ability mechanism itself is open source"
- Module 4, Section 4.7: Full boundary table with License and Status columns
- Module 5, Section 5.4 (Barrier 3): Dedicated section "Unison Cloud Is Not Open Source"
- Module 6, Section S.2.5: Proprietary cloud explicitly marked `[PROPRIETARY]`
- 00-shared-schemas.md: Full OSS/proprietary gate table

**Minor gap:** Unison Share is marked `[PROPRIETARY]` in the shared schemas gate table but not consistently flagged in Module 5, Section 5.1 text. The section describes Share's functionality without explicitly noting its proprietary status in the body text (it's noted in the source index).

---

## Success Criteria Matrix

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Content-addressed architecture with hash scheme, canonicalization, ≥3 code examples | **PASS** | Module 1: SHA3-512 scheme (1.2), de Bruijn canonicalization (1.2), `funnyAdd`/`amusingAdd` same hash (1.1), `comicalAdd` different hash (1.1), `increment` canonicalization (1.2), `Pair`/`Duo` structural identity (Module 2, 2.1) |
| 2 | Build elimination vs ≥3 other languages | **PASS** | Module 1, Section 1.6: comparison matrix with Make, Cargo, Stack/Cabal, Gradle, Bazel (5 comparators across 7 dimensions) |
| 3 | All built-in abilities catalogued + ≥2 custom ability examples + handler mechanics | **PASS** | Module 2: 6 built-in abilities catalogued (IO, Exception, Abort, Stream, Store, Remote) in Section 2.3; 2 custom abilities (Log, Counter) in Section 2.4; handler mechanics in Section 2.2 (handle...with, Request type, continuation, pure case) |
| 4 | Comparison table: Unison abilities vs Haskell monads vs Koka effects vs traditional exceptions, ≥6 dimensions | **PASS** | Module 2, Section 2.6: 6 systems compared (Unison, Haskell, Koka, Eff/OCaml, Erlang/OTP, Traditional Exceptions) across 8 dimensions (effect tracking, composition, handler syntax, performance, readability, type safety, polymorphism, maturity) |
| 5 | UCM workflow documented end-to-end: scratch → typecheck → add → update → publish | **PASS** | Module 3, Section 3.6: 6-step pipeline (create scratch file → write code → save/typecheck → add → test → push) plus update cycle (edit → modify → save → update → refactor → test → push), with pipeline diagram |
| 6 | Distributed computing chain: content-addressed → code mobility → typed RPC → self-deployment, ≥1 deployment example | **PASS** | Module 4: code mobility traced from content-addressing (4.1), typed RPC (4.4), self-deployment via `deployHttp` (4.2), full deployment example with profile+email service (4.6) |
| 7 | BYOC architecture documented (requirements, setup, operational model) | **PASS** | Module 4, Section 4.3: requirements (S3, container launch, optional DynamoDB), setup (OpenTofu, ~20min), architecture (multi-tenant control plane), pricing table, BYOC vs managed comparison |
| 8 | Unison Share ecosystem assessed with library counts, community metrics, growth trajectory | **PASS** | Module 5: Share functionality and comparison (5.1), detailed community metrics tables (5.2), growth trajectory analysis with evidence, concerns, and comparative context (5.6) |
| 9 | ≥5 concrete adoption barriers with evidence and mitigations | **PASS** | Module 5, Section 5.4: 7 barriers (Small Ecosystem, Learning Curve, Proprietary Cloud, No FFI, Unfamiliar Workflow, Limited IDE Support, Performance), each with Evidence, Severity, Mitigations, and Trajectory |
| 10 | Cross-module synthesis connecting content-addressed core to abilities, tooling, distributed computing | **PASS** | Module 6, Section S.1: 7 cascades traced from single architectural decision, with "The Single Narrative" summary connecting all modules |
| 11 | All numerical claims attributed to specific sources | **PASS** | All numerical claims have source + date (see SC-NUM above). Minor note: comparator star counts lack explicit source attribution. |
| 12 | Document self-contained: readable without prior Unison knowledge | **PASS** | Module 1 explains content-addressing from first principles; abilities explained from scratch in Module 2; all acronyms expanded on first use (UCM, BYOC, MCP, LSP). Minor: "de Bruijn indices," "delimited continuations," and "higher-kinded polymorphism" assume PL theory background, but surrounding context provides enough for comprehension. |

---

## Source Attribution Audit

### Statistics

| Module | Attributed Claims | Unattributed Claims | Vendor-Marked Claims |
|--------|------------------|--------------------|--------------------|
| 00-source-index | N/A (reference doc) | N/A | N/A |
| 00-shared-schemas | N/A (convention doc) | N/A | N/A |
| 01-language-core | 18 | 0 | 4 |
| 02-type-system-abilities | 14 | 0 | 1 |
| 03-tooling-workflow | 8 | 1 | 0 |
| 04-distributed-computing | 12 | 2 | 4 |
| 05-ecosystem-adoption | 22 | 1 | 0 |
| 06-synthesis | 24 | 0 | 6 |
| **Total** | **98** | **4** | **15** |

### Unattributed Claims (details)

1. **Module 3, Section 3.5:** "LSP support exists since August 2022" — date provided but no source citation for when LSP was introduced.
2. **Module 4, Section 4.2:** Adaptive Service Graph Compression — described as a capability but no source cited for the specific mechanism.
3. **Module 4, Section 4.3:** "any pool of machines into an easily-programmable distributed computing cluster" — attributed to "Unison Computing, 2025" by name but without a source ID or `[VENDOR-CLAIM]` tag.
4. **Module 5, Section 5.2:** "Discord — active community server" and conference dates (2022, 2024) — no source citation (could reference UNI-BLOG or community pages).

### Source ID Usage

Modules 1–5 use inline URL citations rather than the source ID format defined in shared-schemas.md (e.g., `[UNI-BIGIDEA]`). Module 6 uses source IDs consistently. This is a style inconsistency — the inline URLs are traceable but don't follow the convention established in the schemas.

### PragDave Source URL Discrepancy

The source index lists PragDave's URL as `https://pragdave.me/thoughts/active/2023-11-20-abilities.html` while Module 2's source table references `https://pragdave.me/discover/unison/2023-03-11-abilities/`. These appear to be different URLs — possibly a redirect or an updated path. Should be verified and standardized.

---

## Cross-Reference Integrity

### Errors Found: 3

**Error 1: Module 1 and 2 cross-reference descriptions are swapped**

Module 1 bottom cross-references:
```
→ Module 3: Distribution & Cloud — How content-addressing enables code mobility...
→ Module 4: Developer Experience — The UCM workflow, scratch files, and tooling...
```

Actual titles: Module 3 is "Tooling & Developer Workflow" and Module 4 is "Distributed Computing & Unison Cloud." The descriptions are **reversed** — Module 3's description matches Module 4's content and vice versa.

Module 2 has the identical error in its cross-reference section.

**Error 2: Module 3 incorrect ability cross-reference**

Module 3, Section 3.1 (Watch Expressions paragraph): "Watch expressions cannot run code with unhandled abilities (→ See Module 1 for abilities)"

Abilities are covered in **Module 2**, not Module 1. Module 1 is Language Core (content-addressing). This should read "→ See Module 2 for abilities."

**Error 3: Broken filename references**

Modules 3, 4, and 5 reference `01-language-foundations.md` in their top-of-file cross-reference links. The actual filename is `01-language-core.md`. These links would be broken in any renderer.

- Module 3: `→ See [Module 1](01-language-foundations.md)` — broken
- Module 4: `→ See [Module 1](01-language-foundations.md)` — broken
- Module 5: `→ See [Module 1](01-language-foundations.md)` — broken

### Valid Cross-References

All cross-references in Module 6 are correct — both module titles and section numbers verified against actual content. Module 6 consistently uses proper module titles ("Tooling & Developer Workflow," "Distributed Computing & Unison Cloud").

All inline section cross-references within modules (e.g., "→ See Section 1.3 above") resolve correctly.

---

## Self-Containment Review

### Overall: PASS

The documents are well-structured for progressive reading by a reader with general programming knowledge but no prior Unison experience.

### Terms Adequately Defined
- "Content-addressed" — explained from first principles in Module 1
- "Abilities" / "algebraic effects" — introduced with examples in Module 2
- "UCM" — expanded and explained in Module 3
- "BYOC" — expanded in Module 4
- "MCP" — expanded as "Model Context Protocol" in Module 3
- "LSP" — expanded as "Language Server Protocol" in Module 3
- "Thunk" / "force" — explained with syntax in Module 2

### Terms That Assume Background Knowledge (minor)
- **"de Bruijn indices"** (Module 1, Section 1.2): Explained as "positional indices" but the formal name may confuse readers without PL theory background. The surrounding explanation is sufficient for comprehension.
- **"Delimited continuations"** (Module 2, Section 2.2): "abilities use delimited continuations rather than monadic bind" — assumes familiarity with both concepts. The handler examples that follow provide practical understanding.
- **"Higher-kinded polymorphism"** (Module 2, Section 2.6 comparison table): Used in the Haskell column without definition. A reader unfamiliar with Haskell's type system would not understand this row.
- **"Row-typed effects"** (Module 2, Section 2.6): Used for Koka without definition beyond the term itself.
- **"RPC"** (Module 4): Used throughout without expansion. Should be expanded as "Remote Procedure Call" on first use.
- **"ACID"** (Module 4, Section 4.2): Used without expansion. Should be expanded as "Atomicity, Consistency, Isolation, Durability" or at minimum "ACID (transactional guarantees)."
- **"AST"** (throughout): Used without expansion. Common enough for the target audience but technically jargon.

### Reading Order
The documents work well read in order (1 → 2 → 3 → 4 → 5 → 6). Each module builds on concepts from earlier modules with appropriate forward/backward references. Module 6 provides synthesis that ties everything together. A reader could also read any individual module (1–5) in isolation with reasonable comprehension, as core concepts are briefly re-explained where needed.

---

## Consistency Check

### Terminology Conventions (00-shared-schemas.md compliance)

| Convention | Status | Notes |
|------------|--------|-------|
| "Unison" capitalized | PASS | Consistent across all modules |
| "UCM" abbreviated after first use | PASS | Expanded on first use in each module |
| "ability" lowercase | PASS | Consistent |
| "handler" lowercase | PASS | Consistent |
| "codebase" lowercase, one word | PASS | Consistent |
| "content-addressed" hyphenated as adjective | PASS | Consistent |
| "hash" lowercase | PASS | Consistent |
| "Unison Share" capitalized, two words | PASS | Consistent |
| "Unison Cloud" capitalized, two words | PASS | Consistent |
| "BYOC" abbreviated after first use | PASS | Consistent |

### Data Inconsistency: Commit Count

**Module 1** (Section 1.5, Ecosystem Scale): "Repository commits: 26,558+"
**Module 5** (Section 5.2): "Total commits: 20,030"

Module 5 adds a clarifying note: "26,558 commits cited in 1.0 announcement (may include all branches/repos in the organization)." This explains the discrepancy, but Module 1 presents the 26,558 figure without this caveat. A reader encountering both numbers would find a ~6,500 commit difference confusing.

**Fix:** Module 1 should either use the GitHub-sourced 20,030 figure or add a parenthetical note indicating the 1.0 announcement figure may include organization-wide activity.

### SoftwareMill Publication Date

Module 1 cites "SoftwareMill... 2023" for Part 1. Module 3 cites "SoftwareMill, 2024." The source index lists verification date 2026-03-07 but not publication dates. The SoftwareMill 4-part series may have been published across 2023-2024. Not a contradiction, but the inconsistent year references could confuse a reader checking sources.

### Metadata Blocks

Per shared-schemas.md Section 8, every research document should begin with a metadata block. Only Module 6 has one. Modules 1–5 lack metadata blocks entirely.

| Module | Metadata Block | Status |
|--------|---------------|--------|
| 00-shared-schemas | N/A (convention doc) | OK |
| 00-source-index | N/A (reference doc) | OK |
| 01-language-core | Missing | FAIL |
| 02-type-system-abilities | Missing | FAIL |
| 03-tooling-workflow | Missing | FAIL |
| 04-distributed-computing | Missing | FAIL |
| 05-ecosystem-adoption | Missing | FAIL |
| 06-synthesis | Present | PASS |

### Source Citation Format

Modules 1–5 use inline URL citations rather than the bracketed source ID format (`[UNI-BIGIDEA]`) defined in shared-schemas.md Section 2.1. Module 6 uses source IDs. This is a style inconsistency — both formats are traceable, but the convention calls for source IDs.

### Tone

Consistent across all modules: analytical, factual, balanced. No shifts in voice or register. Vendor claims consistently marked. Limitations consistently acknowledged alongside benefits.

### Code Example Annotations

Per shared-schemas.md Section 10 (Quality Checklist): "All code examples compile (or are annotated `[ILLUSTRATIVE]` if simplified)." The deployment example in Module 4, Section 4.6 uses illustrative API syntax (e.g., `Route.parse`, `Json.decode`, `Json.encode`) that may not match the exact current Unison Cloud API. This example is not annotated `[ILLUSTRATIVE]`.

Similarly, several code examples throughout Modules 2–4 are pedagogical illustrations rather than verbatim-compilable code. None carry `[ILLUSTRATIVE]` annotations.

---

## Recommendations

### Must Fix (before publication)

1. **Fix cross-reference descriptions in Modules 1 and 2.** Swap the Module 3/Module 4 descriptions in the Cross-References sections of both modules to match actual content:
   - Module 3 → "Tooling & Developer Workflow"
   - Module 4 → "Distributed Computing & Unison Cloud"

2. **Fix Module 3 ability cross-reference.** Section 3.1 (Watch Expressions): change "→ See Module 1 for abilities" to "→ See Module 2 for abilities."

3. **Fix broken filename references.** In Modules 3, 4, and 5, change `01-language-foundations.md` to `01-language-core.md` in the top-of-file cross-reference links.

4. **Resolve commit count inconsistency.** Either standardize on 20,030 (GitHub, direct count) in Module 1, or add a caveat to Module 1's 26,558 figure noting it may include organization-wide activity.

### Should Fix (improve quality)

5. **Add metadata blocks to Modules 1–5** per shared-schemas.md Section 8 format.

6. **Expand acronyms on first use.** Add expansions for RPC ("Remote Procedure Call") and ACID ("Atomicity, Consistency, Isolation, Durability") in Module 4, and AST ("Abstract Syntax Tree") in Module 1.

7. **Standardize PragDave source URL.** The source index and Module 2's source table list different URLs for the same article. Verify which is canonical and standardize.

8. **Add `[ILLUSTRATIVE]` annotations** to code examples that are pedagogical rather than verbatim-compilable, particularly the deployment example in Module 4, Section 4.6.

9. **Tag remaining vendor claims in Module 4.** Add `[VENDOR-CLAIM]` to: "any pool of machines..." quote (Section 4.3), "BYOC supports all features" (Section 4.3), and Adaptive Service Graph Compression description (Section 4.2).

### Nice to Have (polish)

10. Add "(GitHub, March 2026)" source attribution to comparator language star counts in Module 5, Section 5.6.

11. Add `[PROPRIETARY]` tag to Unison Share references in Module 5, Section 5.1 body text.

12. Standardize citation format: consider migrating Modules 1–5 from inline URLs to source IDs for consistency with Module 6 and the shared-schemas convention.

13. Add a brief gloss for "de Bruijn indices" and "delimited continuations" where they first appear, for readers without PL theory background.

---

## Verification Checklist Summary

| Check | Result |
|-------|--------|
| Safety Gate: SC-SRC | PASS |
| Safety Gate: SC-NUM | PASS |
| Safety Gate: SC-ADV | PASS |
| Safety Gate: SC-VND | PASS |
| Safety Gate: SC-OSS | PASS |
| Success Criteria (12/12) | 12 PASS |
| Source Attribution | 98 attributed / 4 minor gaps |
| Cross-Reference Integrity | 3 errors found |
| Self-Containment | PASS (minor terminology notes) |
| Consistency | 1 data inconsistency, 5 missing metadata blocks |
| Overall | **PARTIAL PASS — 4 must-fixes, 5 should-fixes, 4 nice-to-haves** |

---

*Verification performed against: 00-shared-schemas.md conventions, 00-source-index.md catalog, and mission pack success criteria. All 8 documents read in full.*
