# DMN Series Retrospective

*Data Mining research series — what the pipeline produced, what it missed, and where the seams show.*

**Date:** 2026-04-10
**Series:** DMN
**Documents:** 8
**Total words:** 23,666
**Agents used:** 8 parallel (general-purpose)

---

## What the series is

Eight scholarly documents covering data mining as a discipline — its history, its algorithms, its methodologies, its modern techniques, its applications, its tools, its ethics, and its open frontiers. The target was ~1,800 words per document; every document cleared that floor, and three exceeded 3,500 words.

## What went well

**Parallel dispatch was the right call.** Eight independent research agents running in background produced ~23K words in roughly two minutes of wall-clock time. Sequential writing would have taken an order of magnitude longer and burned far more orchestrator context.

**Scope boundaries held.** No two documents substantially overlapped. The history doc avoids algorithm details (handing those off to Doc 2); Doc 2 avoids discussing CRISP-DM (that's Doc 3); Doc 4 leaves privacy questions to Doc 7. The decomposition was clean because each brief named the adjacent docs and what they would cover.

**Evidence discipline was consistent.** Every agent was instructed to verify dates, names, and attributions via web search before writing. The resulting documents cite specific years, authors, and papers rather than vague "research has shown" filler. This matches the house style of the prior rng-research and research-methodology series.

**The "myth-busting" briefs paid off.** Doc 5 was specifically asked to fact-check the beer-and-diapers anecdote; Doc 7 was asked to trace the actual re-identification incidents. These are the kinds of pop-culture claims that get repeated unchecked, and the brief made the agents interrogate them.

## What's missing

**No original interviews or primary-source archival work.** Everything is synthesis from secondary sources. For a topic like CRISP-DM — where the original consortium is still partly alive — primary interviews would add depth. That's outside scope for a synthesis pipeline but worth noting.

**Limited quantitative benchmarks.** The tools document names platforms but does not benchmark them. The algorithms document explains k-means but does not plot convergence rates. A follow-up document on "Data Mining Benchmarks" would fill that gap, ideally with runnable code.

**The Asia/Europe lens is underweighted.** The narrative skews US-centric because the canonical histories do, but the discipline has strong non-US roots — SPSS origins in Norway, Weka in New Zealand, Yandex's CatBoost, Alibaba's streaming work. A follow-up doc on "Regional Histories of Data Mining" would balance this.

**No code.** Unlike the RNG series, which shipped working PCG implementations in TypeScript and Rust, this series is pure prose. Follow-up artifacts could include:
- A scikit-learn Jupyter notebook walking through the classical algorithms in Doc 2
- A CRISP-DM project template in `templates/`
- A small benchmark harness comparing XGBoost/LightGBM/CatBoost on a reference dataset

## Observations about the process

**The brief is the product.** The eight agents produced consistently well-structured docs because each brief was self-contained: goal, scope, format reference, minimum word count, fact-check requirement, and the exact file path to write. Agents that get vague briefs produce vague writing; agents that get scoped briefs produce scoped writing. This matches what the research-methodology series concluded about delegation.

**Background parallelism is under-used.** Running eight agents foreground in a single message works but wastes orchestrator context on the wait. Background mode with completion notifications kept this session's main-context footprint small — roughly the size of the eight task-completion notifications plus the aggregation work — while the agents themselves burned context in isolation.

**Word count was not the quality metric.** The longest document (history-origins at 4,042 words) is not meaningfully deeper than the shortest (modern-techniques at 2,331). Word count is a floor against shallow writing, not a measure of insight. Future series should keep the floor but not chase a ceiling.

**Consistent subtitle style emerged without explicit instruction.** Seven of eight documents ended up with a one-line italic subtitle set between em-dashes, matching the format reference in the brief. The one that didn't (foundational-algorithms) still used italic + em-dash but as a single prose line rather than a sentence fragment. This suggests format references in prompts work as intended.

## Open threads

- **Should DMN get a PDF/HTML build?** The rng-research series has build scripts producing branded PDFs. DMN does not yet. If this becomes a reference series, a build pipeline is warranted.
- **Should DMN feed the SYS codebase?** The modern-techniques doc covers graph mining and GNNs, which are directly relevant to the PNW/SYS data catalog. Cross-linking could be useful.
- **Is a DMN-2 warranted?** The frontiers doc names at least five follow-up threads (causality, mechanistic interpretability, tabular foundation models, machine unlearning, benchmark saturation). Any one of them could carry its own series.

## Metrics

| Metric | Value |
|--------|-------|
| Documents produced | 8 |
| Total words | 23,666 |
| Shortest document | 2,331 (modern-techniques) |
| Longest document | 4,042 (history-origins) |
| Mean per document | 2,958 |
| Parallel agents used | 8 |
| Wall-clock dispatch time | ~3 min (longest agent) |
| Failed agents | 0 |
| Revision rounds needed | 0 |
| Format consistency | 8/8 |

## Lessons for the next series

1. **Brief every doc as if it's the only doc.** Self-contained briefs with scope, format references, and adjacency information produce consistent output.
2. **Background parallelism > foreground parallelism** for >4 agents. Keeps orchestrator context clean.
3. **Fact-checking has to be in the brief.** If you don't explicitly tell agents to verify, they won't. "Use WebSearch to verify every incident and date" is the magic phrase.
4. **Word floors beat word targets.** "At least 1,800 words" outperforms "exactly 2,000 words" because it lets the material dictate length.
5. **Retrospectives should be written same-day.** Otherwise you lose the process observations and only keep the output.
