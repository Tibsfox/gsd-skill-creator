# Research Techniques

*The craft of finding things out — practical methods for the working researcher*

---

Research is not reading. Reading is a component of research the way bricks are a component of a cathedral — necessary but insufficient. Research is the disciplined process of converting ignorance into understanding, and it has techniques the way surgery has techniques. You can read casually for decades and never become a researcher. You can also learn these techniques in a semester and immediately become dangerous.

This document covers the practical methods: how to survey a field, how to synthesize evidence, how to take notes that compound over years, how to read a paper without wasting an afternoon, how to ask questions worth answering, how to manage the process, how to communicate results, and how to do all of this without committing fraud.

The distinction between an amateur and a professional is not intelligence. It is method.

---

## 1. The Literature Review — How to Actually Do One

A literature review is not a book report. It is a *map of a field* — it shows where the territory has been explored, where the boundaries are contested, and where the blank spaces remain. Doing it badly is the single most common failure mode of graduate students.

### 1.1 The Three Phases

**Phase 1: Broad survey.** Start with textbooks and review articles. If you are entering a field you do not know, the worst thing you can do is start reading primary research papers. You lack the vocabulary to parse them and the framework to organize what you find. Find the most recent textbook and read it. Then find review articles — survey papers in journals like *Annual Review of Psychology*, *Computing Surveys*, or *Nature Reviews*. Review articles are written by senior researchers who organize hundreds of papers into a coherent narrative. Let them do that work for you. Right now you need the map.

**Phase 2: Narrow to key authors and recent work.** By the end of Phase 1, certain names keep appearing. In any subfield, three to ten researchers define the current conversation. Find their most recent papers, their lab websites, their students' dissertations. Pay attention to where they disagree — the disagreements are where the live questions are.

**Phase 3: Expand via citation chains.** Take your best paper and follow its references in both directions. *Backward chaining* means reading the papers it cites — the intellectual ancestors. *Forward chaining* means finding every paper that has cited it since publication (Google Scholar's "Cited by" button). These are the intellectual descendants — papers that built on, challenged, or extended the work.

### 1.2 Snowball Sampling

The citation chain technique is formally called *snowball sampling*: depth-first search through the literature. Start with one seed paper, follow references backward and citations forward, repeat. The elegance is that it is self-correcting — if a paper matters, it appears repeatedly from multiple directions. Frequency of appearance is a rough proxy for importance.

### 1.3 Theoretical Saturation

When is the review done? The answer comes from qualitative methodology: *theoretical saturation*. You have reached it when new papers stop adding new concepts or perspectives. You are still finding papers, but they say things you have already encountered. For a well-defined question in an established field, saturation typically occurs between 50 and 150 papers. For narrow questions, 20 may suffice. The signal: you read an abstract and think, "I already know what this will say."

---

## 2. Systematic Reviews — The Gold Standard

A systematic review is a literature review conducted with the rigor of an experiment. The key insight, formalized by the Cochrane Collaboration in 1993: a review becomes *systematic* when you specify your methods *before* you begin searching, eliminating the most dangerous bias — the tendency to find what you are looking for.

A Cochrane-style review requires: (1) a **registered protocol** published before the search begins (often at PROSPERO), specifying databases, search terms, and inclusion/exclusion criteria; (2) **defined criteria** specific enough that two independent reviewers would agree on inclusion; (3) **comprehensive searching** across multiple databases plus grey literature — conference proceedings, dissertations, preprint servers; (4) **dual screening** where two reviewers independently evaluate every title and abstract; and (5) **data extraction and quality assessment** using validated instruments like the Cochrane Risk of Bias tool.

### 2.1 The PRISMA Flow Diagram

The PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) flow diagram traces the fate of every record: how many identified, how many duplicates removed, how many screened, how many excluded at each stage and why, how many included in the final synthesis. It is an accountability mechanism — a reader can immediately see whether the review was comprehensive and whether the attrition was reasonable.

### 2.2 Beyond Medicine

The methodology was developed for clinical medicine, but the principles are universal. Kitchenham's 2004 guidelines for systematic reviews in software engineering have been cited over 10,000 times. Education, criminology, environmental science, and economics all use the approach. The fundamental insight — that unstructured reviews are vulnerable to selection bias, confirmation bias, and narrative manipulation — applies everywhere.

---

## 3. Meta-Analysis — Combining Results Statistically

Where a systematic review says "these twelve studies found the intervention works, but disagree about how well," a meta-analysis says "the pooled effect size is d = 0.45, 95% CI [0.32, 0.58], p < 0.001."

### 3.1 Effect Sizes

The currency of meta-analysis is the **effect size** — a standardized magnitude comparable across studies using different measures. **Cohen's d** (difference between means divided by pooled SD) is standard for continuous outcomes; the conventions of 0.2/0.5/0.8 for small/medium/large are widely cited and widely misused — they were benchmarks for power analysis, not interpretive thresholds. **Odds ratios** serve binary outcomes (1.0 = no difference; multiplicative, not additive — an OR of 3.0 means "three times the odds," not "three times more likely"). **Pearson's r** serves associational studies and converts to d for pooling.

### 3.2 Forest Plots and Heterogeneity

The forest plot is meta-analysis's signature visualization: each study a horizontal line (confidence interval) with a square (point estimate, sized by weight), a vertical null line, and a diamond for the pooled estimate. When confidence intervals scatter widely, heterogeneity is high.

The **I² statistic** quantifies this: 0% means all variability is noise; 75% means three-quarters reflects true differences between studies. High I² means the pooled estimate is misleading — you are averaging over meaningfully different contexts. The response is subgroup analysis or meta-regression: splitting studies by characteristics that might explain the variation.

The danger is combining incomparable studies. A randomized trial in healthy adults pooled with an observational study in critically ill patients produces a number describing neither population. Garbage in, garbage out.

### 3.3 Publication Bias

Studies with significant results are more likely to be published. If your meta-analysis includes only published work, your pooled estimate is almost certainly inflated. The **funnel plot** diagnoses this: effect size plotted against precision should be symmetrical. Asymmetry — missing small studies with null results in the lower-left — signals bias. Egger's and Begg's tests formalize this, but the best defense is comprehensive searching and pre-registration of studies.

---

## 4. Note-Taking and Knowledge Management

Research produces knowledge, but knowledge that is not organized is knowledge that is lost.

### 4.1 The Zettelkasten Method

Niklas Luhmann published 70 books and nearly 400 articles over 30 years, building an increasingly sophisticated theoretical framework across sociology, law, biology, cybernetics, and systems theory. His secret was the *Zettelkasten* ("slip box"): roughly 90,000 index cards, each containing a single idea, each linked to others by numbered references. He called it a "communication partner" — not a filing system, but a thinking tool.

The principles: (1) **Atomic notes** — one idea per card, in your own words, forcing you to think rather than copy. (2) **Linking as thinking** — the value is in connections; adding a note means asking "what existing notes does this relate to?" Luhmann never started a book from a blank page; he followed chains of linked notes until structure emerged. (3) **Emergent structure** — no predetermined hierarchy; categories arise from the network. (4) **Permanent vs. fleeting notes** — fleeting captures are processed within days into fully articulated permanent notes. The conversion is where thinking happens.

### 4.2 Historical and Modern Equivalents

Scholars used *commonplace books* centuries before Luhmann — notebooks organized by topic, filled with quotations and reflections. Newton kept one. Locke published a method for indexing them. Walter Pauk's **Cornell method** (1950s) divides the page into cues, notes, and summary — the review process, not the initial capture, is where learning happens.

The digital renaissance arrived in the 2020s: **Obsidian** (plain Markdown, `[[wikilinks]]`, graph view, local-first), **Roam Research** (block-level references, daily notes), **Logseq** (Roam-style blocks with Obsidian-style local storage). All share the Zettelkasten philosophy: atomic notes, bidirectional links, emergent structure. The digital medium adds full-text search, tag filtering, and graph visualization, but the core insight remains Luhmann's: linking is thinking.

---

## 5. Reading Papers Effectively

An experienced researcher does not read a paper from beginning to end. They use a multi-pass approach that extracts maximum value with minimum time.

**First pass (5 minutes).** Title, abstract, introduction (first and last paragraphs only), section headings, conclusions, figure captions. Can you answer: What is this about? What is the main claim? Is it relevant? Most papers are eliminated here. This is correct.

**Second pass (30 minutes).** The full paper, but without trying to understand every detail. Focus on figures (the compressed argument), the methods (what was actually done, which sometimes differs from the abstract), and whether the data support the conclusions. Note key unread references.

**Third pass (1-4 hours).** Full reconstruction, reserved for central papers. Read every sentence. Check the math. Examine statistical appropriateness. Think about what was *not* done — missing controls, unaddressed alternative explanations. Try to mentally re-derive the key results.

A critical discipline: **read methods before results.** The methods tell you what was measured and how. If you read results first, you accept them at face value. Reading methods first, you arrive with expectations and can evaluate whether results make sense. A p-value of 0.001 is less impressive when you discover the authors tested 200 hypotheses and reported one.

---

## 6. Asking Good Questions

The quality of a research project is determined by the quality of the question. A vague question produces vague results. Too broad cannot be answered. Too narrow is not interesting. The art is formulating questions that are both *interesting* and *answerable*.

### 6.1 The PICO Framework

In clinical research, PICO structures questions: **Population** (who?), **Intervention** (what treatment or practice?), **Comparison** (what alternative?), **Outcome** (what are you measuring?). A well-formed PICO question: "In adults over 65 with type 2 diabetes (P), does 30 minutes daily walking (I), compared to usual care (C), reduce HbA1c at 6 months (O)?" The principle — decompose into population, intervention, comparison, outcome — applies beyond medicine. A software engineering version: "In open-source Python projects with 100+ contributors (P), does mandatory code review (I) vs. optional (C) reduce post-release defects (O)?"

### 6.2 Types of Questions

**Descriptive** questions ask "what is happening?" — foundation-level, undervalued because "merely" observational, but you cannot explain what you have not first described. **Correlational** questions ask "what goes together?" — identifying relationships without establishing causation (exercise and depression correlate, but the direction and confounds are unclear). **Causal** questions ask "does X cause Y?" — requiring the most rigorous methods (RCTs, natural experiments, instrumental variables) because ruling out alternatives is profoundly difficult. Most of what we want to know is causal; most of what we can easily measure is correlational. The gap is where methodological sophistication lives.

---

## 7. Managing the Research Process

The romantic image of the lone genius struck by inspiration is a myth. Real research is systematic, incremental, and requires infrastructure.

**Reference management.** Use a tool — Zotero (free, open-source, captures from the web, generates citations in any format) or BibTeX for LaTeX users (plaintext, version-controllable, diffable). The best reference manager is the one you use. The worst is none.

**The research journal.** Write in it daily: what you did, what you found, what failed, what questions arose. It is memory prosthesis (you will not remember why you chose that parameter), debugging tool (retrace steps when results are wrong), and writing aid (raw material for the methods section). Lab notebooks in the physical sciences are bound, written in ink, never altered — only crossed out with a single line. Digital equivalents should preserve the same principle: append-only, timestamped, tamper-evident.

**Version control for manuscripts.** LaTeX + git: every revision preserved, every change diffable, branch to try restructuring without losing the original. Tag the submitted version, tag the revision. Combined with a `.bib` file, this is the most powerful manuscript preparation workflow available.

**The daily writing habit.** Robert Boice's research showed that academics who write in brief daily sessions (30-90 minutes) produce more and better work than binge writers who clear their schedules for eight-hour marathons. The daily writer maintains engagement; the binge writer spends the first two hours remembering where they were. Write every day. Especially when you do not feel like it.

---

## 8. Collaboration and Communication

Research that is not communicated is research that does not exist.

The **IMRaD structure** (Introduction, Methods, Results, Discussion) is now standard across empirical sciences, formalized by the ICMJE in the 1970s. Its logic is rhetorical: Introduction = what is the question and why does it matter; Methods = what did you do; Results = what did you find (without interpretation); Discussion = what does it mean. The separation of Results and Discussion is crucial — facts vs. interpretation must remain distinguishable.

**Conference talks** are not papers read aloud. One idea per slide, minimum 24pt fonts, one slide per minute. Start with the problem, show the key result early, save caveats for Q&A.

**Rebuttal letters** address every reviewer point, explain changes made, and — when you disagree — respond with evidence, not emotion. The golden rule: never be defensive. Even when reviewers are wrong, they are telling you your writing was not clear enough to prevent the misunderstanding.

---

## 9. Research Ethics

Do not fabricate. Do not falsify. Do not plagiarize. These three — the **FFP trinity** — are the bright-line violations.

**Fabrication** is inventing data (Diederik Stapel fabricated data in 55+ papers; his data were suspiciously clean — no outliers, implausibly consistent effect sizes). **Falsification** is altering or selectively reporting data — excluding inconvenient points, choosing the test with the best p-value, reporting only experiments that "worked." More insidious than fabrication because it starts with real data. **Plagiarism** ranges from copying paragraphs to mosaic plagiarism (rearranging sentences, substituting synonyms). The remedy: use your own words, cite your sources.

The **Vancouver criteria** (ICMJE) require that every author contributed to conception/data, drafting/revision, final approval, and accountability. This prevents **gift authorship** (listing non-contributors, typically department heads) and **ghost authorship** (omitting contributors, typically junior researchers or industry writers). Both distort the scientific record.

Research involving human participants requires **ethics review** (IRB or equivalent), governed by the Belmont Report's three principles: respect for persons (informed consent), beneficence (minimize harm), and justice (fair distribution of research burdens — the principle exists because of Tuskegee and Guatemala).

---

## 10. Our Connection — These Techniques in Practice

The methodology in this document is not abstract to this project. It is the substrate we build on.

Our `discovery_engine.py` is automated literature scanning operationalized — checking four sources on a six-hour cadence (YouTube, arXiv, Hacker News, Google Scholar), writing discovered items to a research queue as DISCOVERED status. This is the broad-survey phase of the literature review running continuously, mechanically, without the researcher needing to remember to check.

Our sweep process — `sweep.py` on a cron cadence, updating 35+ live pages hourly — is a systematic review cadence applied to a living corpus. Every pass applies inclusion and exclusion criteria. The PRISMA logic is there, even if the flow diagram is not.

Our Grove format is a digital Zettelkasten. Every record is atomic (one skill, one agent, one research artifact per record). Every record is content-addressed (identified by SHA-256, not by filename). Records link by hash reference, forming the kind of emergent network Luhmann built with 90,000 cards — except ours is cryptographically verifiable and machine-traversable. The specification's insistence that a record written in 2026 must be readable in 2046 is the same durability commitment that paper cards provided by accident.

Our triple store captures relationships — subject, predicate, object — the linking-as-thinking principle formalized into a data structure. When we store `(RiemannHypothesis, relates_to, MontgomeryDysonConjecture)`, we are doing what Luhmann did when he cross-referenced card 21/3g with card 57/12a: making a connection that did not exist until someone noticed it.

The literature review, the systematic review, the Zettelkasten, the three-pass reading method, the daily writing habit, the PICO question, the IMRaD structure, the forest plot — these are not relics of an older era. They are the accumulated wisdom of centuries of people who took finding things out seriously. We inherit them, we implement them in code, and we build on them.

The method is the message.

---

*Further reading: Booth, Papaioannou, and Sutton, "Systematic Approaches to a Successful Literature Review" (2016). Higgins and Thomas, "Cochrane Handbook for Systematic Reviews of Interventions" (2019). Ahrens, "How to Take Smart Notes" (2017). Keshav, "How to Read a Paper" (ACM SIGCOMM, 2007). Boice, "Professors as Writers" (1990). Committee on Publication Ethics (COPE), guidelines at publicationethics.org.*
