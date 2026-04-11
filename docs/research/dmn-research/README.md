# Data Mining Research Series (DMN)

*A deep research series on data mining as a discipline — from Fisher's field trials to foundation models on tabular data.*

**Project code:** DMN
**Documents:** 8
**Total words:** ~23,666
**Status:** Complete
**Date:** 2026-04-10

---

## Reading order

The documents can be read in any order, but the numbered sequence below follows the natural arc from origins to open questions.

| # | Document | Words | Focus |
|---|----------|-------|-------|
| 1 | [History and Origins](history-origins.md) | 4,042 | Statistical roots → KDD → modern era |
| 2 | [Foundational Algorithms](foundational-algorithms.md) | 3,953 | Decision trees, clustering, Apriori, PCA, SVMs |
| 3 | [Process and Methodology](process-methodology.md) | 2,554 | KDD process, CRISP-DM, SEMMA, ASUM-DM, TDSP |
| 4 | [Modern Techniques](modern-techniques.md) | 2,331 | Boosting, graph mining, AutoML, causal, tabular FMs |
| 5 | [Applications Across Domains](applications-domains.md) | 2,518 | Retail, finance, healthcare, science, government |
| 6 | [Tools and Platforms](tools-platforms.md) | 2,637 | SAS/SPSS/Weka/R/sklearn/Spark/XGBoost/MLOps |
| 7 | [Privacy, Ethics, Regulation](privacy-ethics.md) | 2,898 | Re-identification, DP, GDPR, AI Act, fairness |
| 8 | [Frontiers and Open Problems](frontiers-open-problems.md) | 2,733 | LLMs-as-miners, causality, federated, unlearning |

## Structure

The series is organized around three overlapping concerns:

1. **What the discipline is** — its history, its canonical algorithms, and the processes that structure its work (Docs 1–3).
2. **How it is practiced** — the modern toolkit, the domains that fund it, and the software that makes it tractable (Docs 4–6).
3. **What it costs and where it's going** — the ethical and regulatory constraints, and the frontier questions that will reshape it (Docs 7–8).

## Cross-references

- **Origins → Algorithms:** the KDD framing in Doc 1 sets up the algorithm taxonomy in Doc 2.
- **Algorithms → Modern:** Doc 2's classical toolkit is the baseline Doc 4 builds on.
- **Process → Tools:** CRISP-DM in Doc 3 is the methodology implemented (imperfectly) by the tools in Doc 6.
- **Applications → Ethics:** the domain case studies in Doc 5 surface the re-identification and bias incidents discussed formally in Doc 7.
- **Modern → Frontiers:** Doc 4 ends where Doc 8 begins — the edge of what's stable vs. what's open.

## Key themes

- **The terminological quarrel:** "data mining" vs. "KDD" vs. "machine learning" vs. "AI" — the same techniques rebranded across decades, each rebrand carrying a shift in emphasis and funding source.
- **The 80% rule:** practitioners repeat the claim that data preparation consumes 80% of project time. Doc 3 examines whether this folklore holds up.
- **The beer-and-diapers myth:** the most famous data mining anecdote is mostly apocryphal. Doc 5 separates the story from the evidence.
- **The privacy impossibility:** k-anonymity, l-diversity, and differential privacy represent a chain of formal definitions, each responding to attacks on the last. Doc 7 traces this arc.
- **The dissolution question:** is data mining still a distinct discipline in 2026, or has it been absorbed into AI? Doc 8 argues both sides.

## Methodology

Each document was produced by a dedicated research agent with a scoped brief covering history, named contributors, paper citations, and contested claims. Agents used web search to verify dates, names, and attributions before writing. All documents were written to a ~1,800-word minimum floor with scholarly narrative style (no bullet-list dumps).

For the series methodology generally, see the companion [research-methodology](../research-methodology/) series.

## Files in this directory

```
dmn-research/
├── README.md                    ← this file
├── history-origins.md           ← Doc 1
├── foundational-algorithms.md   ← Doc 2
├── process-methodology.md       ← Doc 3
├── modern-techniques.md         ← Doc 4
├── applications-domains.md      ← Doc 5
├── tools-platforms.md           ← Doc 6
├── privacy-ethics.md            ← Doc 7
├── frontiers-open-problems.md   ← Doc 8
├── knowledge-nodes.json         ← cross-reference graph
└── retrospective.md             ← series retrospective
```
