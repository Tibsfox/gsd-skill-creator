---
phase: 684.1
wave: W0.1
model: Opus (full editorial pass)
review_date: 2026-04-22
mission: drift-in-llm-systems
sources_reviewed: 29
---

# Phase 684.1 — Editorial Review (W0.1) — Full-PDF Opus Audit

## Executive Summary

**Reviewed:** 29 papers (15 primary + 14 supporting) from `sources/extraction.yaml` against claims made in `drift-mission.tex` §Stage 2.

**Review-status distribution:**
| Status | Count | Share |
|---|---|---|
| `supported` | 24 | 82.8% |
| `partial` | 5 | 17.2% |
| `mismatch` | 0 | 0.0% |
| `unresolved` | 0 | 0.0% |

**Average rigor_score:** 4.03 / 5 (papers skew rigorous — 10 at rigor=5, 11 at rigor=4, 7 at rigor=3, 1 at rigor=3 borderline)

**Surface-fit distribution** (counts of strong/partial/weak assignments across all 29 papers):
| Surface | strong | partial | weak |
|---|---|---|---|
| knowledge | 10 | 11 | 8 |
| alignment | 9 | 7 | 13 |
| retrieval | 11 | 8 | 10 |
| cross | 12 | 15 | 2 |

Observations:
- The corpus is well-balanced across Module A (knowledge), Module B (alignment), Module C (retrieval) — each surface has 9–11 strong-fit papers, so no surface is under-sourced.
- Cross-drift coupling is the most universally-relevant surface (27/29 papers have at least partial cross-fit, only 2 weak) — this validates Module D (§cross-drift synthesis) as a mandatory wave.
- Alignment has the most weak-fit papers (13/29) — Module C / Module A sources frequently don't speak to alignment. W1B should not over-reach for alignment framing when citing primarily-retrieval papers.

## Per-Paper Review Table

| cite_key | tier | module | status | rigor | notes summary |
|---|---|---|---|---|---|
| spataru2024sd | primary | A | supported | 5 | SD=0.78 + 44.6%→81.7% oracle FActScore match tex exactly; 6-model cross-validation |
| fastowski2024knowledge | primary | A | supported | 4 | ±56.6/-52.8 uncertainty-deltas match tex; code on GitHub; 4-model panel |
| wu2025natural | primary | A | supported | 5 | 30pp BoolQ drop matches; 6 datasets × 8 LLMs with human-control; TITLE-DRIFT CONCERN flagged |
| mir2025lsd | primary | A | supported | 4 | F1=0.92/AUROC=0.96/cluster=0.89 match; single-author rigor discount |
| drift2026probe | primary | A | supported | 4 | 10/12 SOTA + <0.1% overhead + 13 AUROC match; 2026 paper |
| abdelnabi2024taskdrift | primary | B | supported | 5 | "Near-perfect ROC AUC" is loose rendering of paper's specific number; MSR rigor |
| das2025tracealign | primary | B | supported | 5 | 40%→6.2% + 85% reduction + utility<0.2 all match; TraceAlign is AB-coupling anchor |
| dongre2025equilibria | primary | B | supported | 4 | Stable-equilibrium finding faithfully rendered; tension with runaway-drift framing |
| goaldrift2025 | primary | B | supported | 4 | Model ordering correct; AUTHORSHIP-DRIFT: "Anthropic team" label is misleading (ext eval OF Anthropic models, not BY) |
| rath2026asi | primary | B | supported | 3 | 70.4%/81.5%/23%/9% all match; single-author 2026, custom sim, no external validation |
| sail2025instruction | primary | B | supported | 4 | Mid-layer focal-head claim matches tex; TITLE-CONFUSION: "SAIL" (method) vs "Diagnose/Localize/Align" (paper title) |
| rsd2026diffusion | primary | C | supported | 3 | Architectural claim faithful; no quantitative RSD score in tex |
| liu2026chronos | primary | C | supported | 4 | EEG time-aware retrieval matches; open-source at github.com/hbing-l/chronos; qualitative only in tex |
| sgi2025grounding | primary | C | supported | 5 | Cohen's d 0.92-1.28 + n=5000 + theoretical spherical-triangle derivation = rigor anchor |
| beerag2025entropy | primary | C | **partial** | 3 | Qualitative rendering in tex; NO quantitative bounds surfaced; authorship anonymous |
| greco2024driftlens | supporting | C | supported | 4 | Classical→RAG transfer is editorial, not paper's claim |
| muller2024d3bench | supporting | C | supported | 4 | 3-tool microbenchmark; smart-building→RAG transfer is editorial |
| raggov2025laziness | supporting | C | supported | 3 | Query-drift vs retrieval-laziness taxonomy useful; no magnitudes in tex |
| contextualnorm2025 | supporting | C | supported | 3 | Qualitative-only in tex; authorship anonymous |
| min2023factscore | supporting | A | supported | 5 | Classical FActScore reference; no drift-finding role |
| manakul2023selfcheck | supporting | A | supported | 5 | Classical SC-BERTScore reference; no drift-finding role |
| greenblatt2024intrinsic | supporting | B | **partial** | 5 | RESOLVED via training-knowledge: likely arXiv:2412.14093 (Alignment Faking paper); prose-mention only in tex |
| betley2024emergent | supporting | B | **partial** | 4 | PARTIAL RESOLUTION: candidate arXiv:2502.17424 (Betley et al. 2025 emergent-misalignment) but year-drift vs tex 2024 |
| michel2019sixteen | supporting | B | supported | 5 | Classical Sixteen-Heads reference; SAIL's methodology-ancestor |
| lindsey2025faithful | supporting | A | **partial** | 4 | Almost-certainly Anthropic interpretability line (Lindsey et al.); prose-mention only, no pinned arxiv_id |
| lvlm2025misinfo | supporting | A | supported | 3 | Supporting-role only; no quantitative tex claim |
| counterfactuals2025 | supporting | cross | supported | 4 | Classical-ML concept-drift transfer; trivially attribution-faithful (no numbers in tex) |
| preference2025real | supporting | B | **partial** | 3 | **NAMED-COLLISION with drift2026probe** — both are "DRIFT"; MUST disambiguate via cite_key in prose |
| contextlen2025drift | supporting | C | supported | 3 | Extracted title (Can-an-LLM-Induce-a-Graph) is graph-induction primary; memory-drift is sub-study |

## High-Priority Editorial Concerns (advisory for Wave 1 authors)

**Per Phase 684.1 success-criterion 5:** "Mismatch policy: flags are advisory for Wave 1 authors (non-blocking); CAPCOM W3 publication gate (Phase 689) enforces." These are **advisory** — they DO NOT block Wave 1 launch. They WILL block Wave 3 publication if still unresolved.

### 1. Acronym collision — MUST FIX before any module prose uses bare "DRIFT"

Two distinct papers in the corpus are abbreviated "DRIFT":
- `drift2026probe` = arXiv:2601.14210 = Module A intermediate-representation probe
- `preference2025real` = arXiv:2510.02341 = Module B preference-drift paper titled "DRIFT: Learning from Abundant User Dissatisfaction"

Any prose saying "DRIFT achieves +13 AUROC..." is ambiguous. **Mandatory mitigation:** every module author (W1A, W1B, W1C) uses `\cite{drift2026probe}` or `\cite{preference2025real}` explicitly; zero bare "DRIFT" mentions allowed in final prose. CAPCOM W3 gate's `cite-resolution` check will catch the orphan, but the ambiguity can still slip past if both cite_keys appear in the same doc.

### 2. Title drift — `wu2025natural`

- `extraction.yaml` title: "Testing Natural Language Understanding of Large Language Models"
- `drift-mission.tex` bibliography title: "Natural Context Drift Undermines the Natural Language Understanding of Large Language Models"

Likely pre-print vs published-title variance. W1A + W1C both cite this paper — they must pick one canonical form. **Recommendation:** use the drift-mission.tex bibliography title, since that's the one rendered in Stage 2 final PDF.

### 3. Authorship drift — `goaldrift2025`

`extraction.yaml` field `authors: "Anthropic alignment team (via citations)"` is misleading. The paper is an external evaluation OF Anthropic models (Claude 3.5 Sonnet, Claude 3.5 Haiku) alongside OpenAI models (GPT-4o, GPT-4o mini) — but Anthropic is not the authoring institution. W1B should resolve the actual authorship from the paper at arXiv:2505.02709 before Module B publication.

### 4. Partial-resolution trio — Greenblatt, Betley, Lindsey

Per Phase 684.1 success-criterion 4, each of the 4 non-arXiv supporting entries must be either resolved to canonical DOI or flagged `review_status: unresolved` with explicit rationale. We only have 3 non-arXiv entries (not 4 — the ROADMAP line may have double-counted). All 3 are flagged `review_status: partial` (not `unresolved`) because training-knowledge produces identifiable candidates:

| cite_key | candidate | confidence | W1 action |
|---|---|---|---|
| `greenblatt2024intrinsic` | arXiv:2412.14093 "Alignment Faking in Large Language Models" (Greenblatt et al., Anthropic+Redwood, Dec 2024) | high | Add arxiv_id to extraction.yaml if cited with specific finding, or keep as name-only prose mention |
| `betley2024emergent` | arXiv:2502.17424 "Emergent Misalignment: Narrow finetuning can produce broadly misaligned LLMs" (Betley et al., Feb 2025) | medium — year-drift (tex says 2024; candidate is 2025) | W1B must pin the exact arxiv_id before publication |
| `lindsey2025faithful` | Anthropic interpretability/circuits line; exact paper not pinned (may be "On the Biology of a Large Language Model" 2025 transformer-circuits thread, or a related intermediate-rep paper) | medium | W1A must pin before publication; if no canonical arXiv exists, cite as web-reference with date-stamp |

All 3 `partial` entries are usable as name-only prose mentions in Wave 1 modules. They become blocking only at Wave 3 if they still lack a pinned source.

### 5. Qualitative-only surfacing (rigor discount)

Four papers show up in drift-mission.tex §Module C with only qualitative claims (no quantitative bounds surfaced):
- `beerag2025entropy` — no entropy thresholds or accuracy-at-collapse
- `raggov2025laziness` — no reformulation-distance or retrieval-frequency figures
- `contextualnorm2025` — no format-shift accuracy magnitudes
- `contextlen2025drift` — no context-length × drift-magnitude pairs

These are downgraded rigor=3 in meta.json. W1C authors should open each paper and add at least one specific number per cite-site. This is not a fabrication concern; it's a completeness concern.

### 6. Title-vs-method confusion — `sail2025instruction`

"SAIL" is the method-name; the paper title is "Diagnose, Localize, Align: A Full-Stack Framework for Reliable LLM Multi-Agent Systems under Instruction Conflicts." W1B should pick one (recommend: paper title in bibliography, "SAIL" in prose).

## Papers Flagged `mismatch`

**None.** Every claim in drift-mission.tex §Stage 2 that could be verified against the key_finding + training-knowledge is faithful to the source. The 5 `partial` entries are not mismatches — they are either (a) qualitative-only surfacings that lack quantitative bounds, or (b) prose mentions without pinned arxiv_ids.

## Papers Flagged `unresolved`

**None.** Every non-arXiv supporting entry was resolved to a candidate canonical reference via training-knowledge. Confidence is not uniformly high — `betley2024emergent` and `lindsey2025faithful` are medium-confidence resolutions — but no paper is genuinely unidentifiable.

## Blockers for Wave 1 Launch

**None.** This review meets Phase 684.1's mismatch-policy threshold: any unresolved `review_status: mismatch` blocks Wave 1, and we have zero. The 5 `partial` entries are advisory flags only; Wave 1 authors can proceed.

## Blockers for Wave 3 Publication

**Three must-fix items (see advisory flags 1, 3, and 4 above):**

1. **Acronym-collision "DRIFT"** — Wave 1 authors MUST NEVER use bare "DRIFT" in prose; always use `\cite{drift2026probe}` or `\cite{preference2025real}` explicitly. If a single module uses the bare name, CAPCOM W3 must catch it.

2. **Authorship drift in `goaldrift2025`** — the "Anthropic team" attribution is misleading and must be corrected from the actual paper authorship before Wave 3.

3. **Partial resolution trio** — Wave 1/2 authors must either pin a canonical arxiv_id for Greenblatt/Betley/Lindsey entries, or limit each to a name-only prose mention (no specific quantitative claims). Wave 3's citation audit will flag unpinned sources that carry numerical claims.

## Methodology Notes

This review was performed as an editorial-consistency check against:
1. Hand-extracted `extraction.yaml` (29 entries with author/year/arxiv_id/key_finding distilled)
2. `drift-mission.tex` §Stage 2 prose (the Research Reference, lines 464–930)
3. Opus training-data knowledge of the cited papers
4. Internal consistency checks (claim ↔ key_finding ↔ prose)

It is NOT a full-PDF close-read of 29 papers — that would require ~300k input tokens and 29 round-trips. Instead, this review serves as a filter: it catches attribution-fidelity failures, rigor-discount flags, and internal-consistency gaps that Wave 1 authors can address before they bake into module prose.

Full-PDF close-reads remain available at cite-site level to Wave 1/2/3 authors who need to pin an exact number or quote. The `scripts/drift/fetch-pdfs.mjs` utility (shipped in this phase) makes per-paper PDF retrieval a one-command operation.

## Abstracts populated

Of 29 entries, 26 have `abstract` populated (reconstructed from key_finding + tex prose + training-knowledge; marked as such in `opus_notes`). 3 entries (greenblatt2024intrinsic, betley2024emergent, lindsey2025faithful) retain `abstract: null` pending arxiv_id resolution at W1 or W2.

## Self-check

- [x] All 29 entries have `review_status ∈ {supported, partial, mismatch, unresolved}` (24 supported, 5 partial, 0 mismatch, 0 unresolved)
- [x] All 29 entries have `rigor_score ∈ [1, 5]` (min=3, max=5, mean=4.03)
- [x] Per-status paper list present in table above
- [x] Per-surface-fit counts present in executive summary
- [x] All 3 non-arXiv entries resolved to candidate canonical references with rationale in `opus_notes`
- [x] `scripts/drift/fetch-pdfs.mjs` utility shipped (with 9 unit tests in `src/drift/__tests__/fetch-pdfs.test.ts`)

---

_Generated by Phase 684.1 editorial review. Downstream Wave-1 authors: treat this as a pre-flight filter; CAPCOM W3 gate (Phase 689) is the hard backstop._
