# Shared Schemas — Document Conventions & Cross-Reference Format

> Foundation document for the Unison Language Technical Reference.
> All research modules MUST conform to these conventions.

---

## 1. Section Header Format

All modules use a consistent three-level heading structure:

```markdown
## Module N: [Module Title]
### N.X [Section Title]
#### N.X.Y [Subsection Title] (optional)
```

- Module-level headers (`##`) appear only in the master document template.
- Section-level headers (`###`) are the primary unit of research.
- Subsection headers (`####`) are used sparingly for complex sections.
- Every section header is suffixed with its module-section number for unambiguous cross-referencing.

---

## 2. Citation Format

### 2.1 Inline Citations

Use bracketed source IDs referencing `00-source-index.md`:

```markdown
Content-addressed code eliminates the traditional build step entirely [UNI-BIGIDEA].
```

### 2.2 Source Quality Ratings

Every source in the index carries one of these quality ratings:

| Rating | Meaning | Usage |
|--------|---------|-------|
| `PRIMARY` | Official Unison project documentation or releases | Highest authority; use for all core claims |
| `INDEPENDENT` | Third-party analysis, reviews, evaluations | Corroboration and critical perspective |
| `ACADEMIC` | Peer-reviewed papers, formal foundations | Theoretical grounding and prior art |
| `COMMUNITY` | Blog posts, forum discussions, tutorials | Color and practitioner experience; never sole source for claims |

### 2.3 Multi-Source Citation

When a claim draws from multiple sources:

```markdown
The ability system is grounded in algebraic effects [UNI-ABILITIES][FRANK-PAPER].
```

---

## 3. Cross-Reference Format

### 3.1 Inter-Module References

```markdown
→ See Module 2, Section 2.2 for the ability system's formal semantics.
```

### 3.2 Intra-Module References

```markdown
→ See Section 1.3 above for codebase database structure.
```

### 3.3 Forward References (Stubs)

When referencing content that doesn't exist yet:

```markdown
→ [PENDING] Module 4, Section 4.1 — Code Mobility (Wave 1, Track B)
```

---

## 4. Code Example Format

### 4.1 Unison Code Blocks

All Unison code uses the `unison` language tag:

````markdown
```unison
structural ability Store v where
  get : v
  put : v -> ()

increment : '{Store Nat, IO} ()
increment = do
  current = Store.get
  Store.put (current + 1)
```
````

### 4.2 UCM Session Blocks

UCM (Unison Codebase Manager) interactions use the `ucm` tag:

````markdown
```ucm
.> project.create myproject
myproject/main> add
myproject/main> run main
```
````

### 4.3 Comparison Code Blocks

When comparing Unison with other languages, use adjacent fenced blocks with language labels:

````markdown
**Haskell (monadic IO):**
```haskell
main :: IO ()
main = do
  line <- getLine
  putStrLn line
```

**Unison (direct style with abilities):**
```unison
main : '{IO, Exception} ()
main = do
  line = console.getLine
  printLine line
```
````

---

## 5. Comparison Table Format

Language comparison tables use this standard structure:

```markdown
| Feature | Unison | Haskell | Scala 3 | Koka | Notes |
|---------|--------|---------|---------|------|-------|
| Feature name | Unison approach | Haskell approach | Scala approach | Koka approach | Key differentiator |
```

- Always include at least Haskell and one other comparator.
- The "Notes" column highlights what makes Unison's approach distinctive.
- Use `✓`, `✗`, `~` (partial) for boolean feature comparisons.

---

## 6. Claim Annotation Format

### 6.1 Vendor Claims

Any claim originating from Unison Computing (the company) or official Unison documentation that involves performance, adoption, or competitive positioning MUST be annotated:

```markdown
Unison Cloud provides "zero-configuration deployment" [VENDOR-CLAIM][UNI-CLOUD-APPROACH].
```

### 6.2 Verified Claims

Claims independently confirmed by third-party sources or reproducible demonstration:

```markdown
Content-addressed code does eliminate the traditional compilation step [VERIFIED][LWN-UNISON][SOFTWAREMILL-P1].
```

### 6.3 Unverified Claims

Claims from official sources that have not been independently confirmed:

```markdown
BYOC achieves "near-zero cold start times" [VENDOR-CLAIM][UNVERIFIED][UNI-BYOC].
```

---

## 7. Safety Gates

### 7.1 ANNOTATE Gate — Vendor Claims

All self-reported metrics, performance claims, and competitive positioning statements from Unison Computing MUST carry `[VENDOR-CLAIM]` annotation. This applies to:

- Performance benchmarks published by the Unison team
- Adoption or community size metrics from official sources
- Feature comparisons authored by Unison team members
- Cloud pricing or cost-saving claims

### 7.2 GATE — Open Source vs. Proprietary Distinction

The Unison ecosystem has a critical open-source/proprietary boundary:

| Component | License | Gate |
|-----------|---------|------|
| Unison language & runtime | Open Source (MIT) | `[OSS]` |
| UCM (Codebase Manager) | Open Source (MIT) | `[OSS]` |
| Unison Share | Proprietary service | `[PROPRIETARY]` |
| Unison Cloud | Proprietary service | `[PROPRIETARY]` |
| Unison Cloud BYOC | Proprietary (self-hosted) | `[PROPRIETARY]` |

Every discussion of cloud/share features MUST note the licensing boundary:

```markdown
Unison Cloud [PROPRIETARY] enables typed distributed computing, building on
the open-source language runtime [OSS] and content-addressed codebase format.
```

### 7.3 Maturity Gate

Given Unison reached 1.0 relatively recently (late 2025), claims about production readiness, ecosystem maturity, or enterprise adoption require extra scrutiny:

```markdown
While Unison has reached 1.0 [UNI-1-0], the ecosystem remains early-stage
with limited production deployment evidence [MATURITY-CAVEAT].
```

---

## 8. Document Metadata Block

Every research document begins with a metadata block:

```markdown
---
module: [Module Number]
title: [Module Title]
status: STUB | DRAFT | REVIEW | FINAL
wave: [Wave Number]
track: [Track Letter]
task: [Task ID, e.g., W1A.1]
sources: [Comma-separated source IDs]
last_updated: YYYY-MM-DD
---
```

---

## 9. Terminology Conventions

| Term | Usage |
|------|-------|
| Unison | The programming language (always capitalized) |
| UCM | Unison Codebase Manager (always abbreviated after first use) |
| ability | Unison's algebraic effect system (lowercase, Unison-specific term) |
| handler | An ability handler (lowercase) |
| codebase | The Unison codebase database (lowercase, one word) |
| content-addressed | Hyphenated when used as adjective |
| hash | Refers to the SHA-based content hash of a Unison definition |
| Unison Share | The package registry service (capitalized, two words) |
| Unison Cloud | The distributed computing platform (capitalized, two words) |
| BYOC | Bring Your Own Cloud (always abbreviated after first use) |

---

## 10. Quality Checklist

Before any module moves from DRAFT to REVIEW:

- [ ] All claims from official sources carry `[VENDOR-CLAIM]` where appropriate
- [ ] All proprietary components are marked `[PROPRIETARY]`
- [ ] All code examples compile (or are annotated `[ILLUSTRATIVE]` if simplified)
- [ ] Cross-references resolve to existing sections
- [ ] Source IDs match entries in `00-source-index.md`
- [ ] Metadata block is complete and accurate
- [ ] No unsupported superlatives ("best", "fastest", "only") without citation
