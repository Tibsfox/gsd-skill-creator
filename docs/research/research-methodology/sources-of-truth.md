# Sources of Truth

*Not all evidence is created equal -- a field guide to evaluating information*

---

Research is, at its core, the act of making claims and then defending them. The quality of a claim depends entirely on the quality of the evidence behind it. A fact cited from a randomized controlled trial carries different weight than a fact cited from a blog post, which carries different weight than a fact cited from a conversation overheard at a conference. Knowing the difference -- and knowing *why* there is a difference -- is the single most important skill a researcher can develop. It is more important than statistical literacy. It is more important than domain expertise. It is the meta-skill that makes all other skills trustworthy.

This document is a field guide to the landscape of information sources. It describes where knowledge lives, how it gets there, what gatekeeping mechanisms (if any) exist between raw claims and published assertions, and how a working researcher should navigate this landscape without either drowning in skepticism or being swept away by credulity.

---

## 1. The Hierarchy of Evidence

### Primary, Secondary, Tertiary

The oldest and most durable framework for classifying information sources is the three-tier hierarchy:

**Primary sources** are original. They are the thing itself, not a description of the thing. Experimental data. Court records. Patent filings. Census returns. A genome sequence deposited in GenBank. The text of a law. An interview transcript. A photograph taken at the scene. A dataset published in a data repository. Primary sources are raw material. They have not been interpreted, summarized, or filtered by anyone other than their creator. Their authority comes from proximity to the event or phenomenon they describe.

**Secondary sources** interpret, analyze, or synthesize primary sources. A journal article that reports experimental results is a secondary source -- the experiment is primary; the article is the author's interpretation of what the experiment showed. Review articles are secondary sources that synthesize dozens or hundreds of primary studies. Textbooks are secondary sources that organize and explain a field's accumulated knowledge. Biographies are secondary sources about a person's life. Secondary sources are where most researchers spend most of their time, because reading every primary source in a field is usually impossible.

**Tertiary sources** compile and index secondary sources. Encyclopedias, handbooks, almanacs, bibliographies, and databases like PubMed (which indexes journal articles but does not contain them) are tertiary sources. They are starting points, not destinations. A researcher who cites an encyclopedia entry as evidence for a scientific claim has committed a category error -- the encyclopedia is pointing *toward* evidence, not providing it.

### The Evidence Pyramid in Medicine

Nowhere has the hierarchy of evidence been more formally codified than in evidence-based medicine (EBM), which emerged in the early 1990s from the work of Gordon Guyatt, David Sackett, and their colleagues at McMaster University. The EBM evidence pyramid ranks study designs by their susceptibility to bias:

| Level | Study Design | Bias Risk |
|-------|-------------|-----------|
| 7 (lowest) | Expert opinion / editorials | Highest -- no systematic data |
| 6 | Case reports | Very high -- single observations, no controls |
| 5 | Case series | High -- aggregated observations, still no controls |
| 4 | Case-control studies | Moderate -- retrospective, selection bias |
| 3 | Cohort studies | Moderate -- prospective but non-randomized |
| 2 | Randomized controlled trials (RCTs) | Low -- randomization controls for confounders |
| 1 (highest) | Systematic reviews / meta-analyses | Lowest -- synthesize multiple RCTs with explicit methodology |

The pyramid is not a decree that lower-level evidence is worthless. A well-conducted case report of a novel disease (the original 1981 MMWR report describing five cases of *Pneumocystis carinii* pneumonia in previously healthy men -- the first published description of AIDS) can be more consequential than a thousand mediocre RCTs. The pyramid describes *average susceptibility to systematic error*, not absolute truth-value.

A critical nuance: the pyramid applies to questions of intervention ("Does drug X work?"). For questions of prognosis, diagnosis, etiology, or lived experience, different evidence hierarchies apply. Qualitative research -- interviews, ethnography, phenomenology -- is not "below" RCTs on any meaningful scale; it answers fundamentally different questions.

### The Replication Crisis and What It Taught Us

The hierarchy of evidence assumed that published studies were, on average, correct. The replication crisis of the 2010s shattered that assumption. The Open Science Collaboration's landmark 2015 paper in *Science* attempted to replicate 100 psychology studies published in high-impact journals. Only 36% of replications produced statistically significant results consistent with the originals. Effect sizes in the replications were, on average, half the magnitude reported in the originals.

Similar crises emerged in preclinical cancer biology (the Reproducibility Project: Cancer Biology found that effect sizes were 85% smaller on average), economics, and political science. The message was stark: publication in a peer-reviewed journal is a necessary but *radically insufficient* condition for a claim to be true.

---

## 2. Peer-Reviewed Journals -- The Gold Standard and Its Cracks

### How Peer Review Works

The peer review process, formalized in the mid-20th century (the Royal Society's *Philosophical Transactions* adopted external review in 1832, but modern anonymous peer review became standard only in the 1960s and 1970s), works roughly as follows:

1. An author submits a manuscript to a journal.
2. An editor evaluates the manuscript for fit and basic quality. Many manuscripts are desk-rejected at this stage.
3. The editor sends the manuscript to 2-4 reviewers -- typically unpaid volunteers who are experts in the field.
4. Reviewers provide written evaluations and recommendations: accept, minor revision, major revision, or reject.
5. The editor makes a decision based on the reviews.
6. If revisions are requested, the author revises and resubmits, sometimes through multiple rounds.
7. If accepted, the paper is copyedited, typeset, and published.

This process typically takes 3-12 months. In fast-moving fields, a paper can be obsolete by the time it appears.

### Impact Factor Stratification

Not all journals are created equal, and the research community has developed (for better or worse) a stratification system based largely on the journal impact factor (JIF) -- the average number of citations received per paper published in the journal over the preceding two years. Eugene Garfield introduced the metric in 1955; it has been calculated annually by Clarivate Analytics (formerly Thomson Reuters) since 1975.

The rough tiers:

| Tier | Examples | 2024 JIF Range | What It Means |
|------|----------|---------------|---------------|
| Apex | *Nature*, *Science*, *Cell* | 40-70+ | Broad-audience, highest competition, ~5-8% acceptance rate |
| Elite field-specific | *JACS*, *Physical Review Letters*, *The Lancet*, *NEJM* | 15-100+ | Top of a discipline, high prestige |
| Strong field-specific | *Journal of Machine Learning Research*, *Bioinformatics*, *IEEE TPAMI* | 5-15 | Excellent work, well-regarded |
| Solid | Most established society journals | 1-5 | Peer-reviewed, legitimate, respectable |
| Marginal / predatory | Journals with no real review | 0-1 or fabricated | Caveat emptor |

The impact factor is a deeply flawed metric. It is skewed by a small number of highly cited papers (the distribution of citations within any journal is heavily right-tailed). It penalizes journals in small fields. It incentivizes editors to publish review articles (which are cited more) and to favor flashy results over careful replication studies. It has been gamed -- some journals engage in citation cartels, citing each other to inflate their metrics. The San Francisco Declaration on Research Assessment (DORA), signed in 2012 by hundreds of institutions, explicitly calls for an end to using the journal impact factor as a proxy for research quality.

And yet the stratification persists, because human institutions need heuristics, and "published in *Nature*" is a powerful one. The critical researcher's job is to understand what "published in *Nature*" actually means: the paper was reviewed by a small number of people who found it interesting and methodologically adequate at the time of review. It does not mean the paper is true. It does not mean the results will replicate. It means the paper cleared a particular bar at a particular moment.

### The Predatory Journal Problem

The term "predatory journal" was coined by Jeffrey Beall, a University of Colorado librarian, around 2010. Predatory journals charge authors publication fees (article processing charges, or APCs) while providing little or no actual peer review. They often have names designed to be confused with legitimate journals (*International Journal of Advanced Science and Technology* sounds legitimate; it is not). At their peak in the mid-2010s, Beall's list identified over 1,000 suspected predatory publishers. Estimates suggest that predatory journals publish over 400,000 articles per year.

Identifying predatory journals: check if the journal is indexed in established databases (PubMed, Scopus, Web of Science). Check if the publisher is a member of the Committee on Publication Ethics (COPE). Check if the journal has a verifiable editorial board with identifiable academics. If a journal promises peer review in two weeks and publication in four, it is almost certainly predatory.

---

## 3. Preprint Servers -- Speed Versus Scrutiny

### The arXiv Model

**arXiv** (pronounced "archive") was founded by Paul Ginsparg at Los Alamos National Laboratory in **August 1991** -- predating the World Wide Web's public launch by a year. It moved to Cornell University in 2001 and is now hosted by Cornell with funding from the Simons Foundation and member institutions. As of 2025, arXiv hosts over 2.5 million preprints in physics, mathematics, computer science, quantitative biology, quantitative finance, statistics, electrical engineering, systems science, and economics.

arXiv performs moderation, not peer review. Submissions are checked for basic scholarly content and appropriate categorization, but they are not reviewed for correctness. The moderation is performed by a network of volunteer moderators (roughly 200), most of them active researchers. The barrier to entry is intentionally low -- the goal is dissemination, not gatekeeping.

In physics and mathematics, arXiv has become the *de facto* venue of first publication. Researchers post to arXiv first, then submit to journals. The journal publication may come months or years later, or never -- some of the most important results in mathematics (Perelman's proof of the Poincare conjecture, posted to arXiv in 2002-2003 and never submitted to a journal) exist only as preprints.

### The Biomedical Preprint Servers

**bioRxiv** (launched 2013) and **medRxiv** (launched 2019) brought the preprint model to biology and medicine -- fields where the stakes of unreviewed claims are qualitatively different from those in mathematics. A wrong claim about a topological invariant does not kill anyone. A wrong claim about a drug's efficacy can.

The **COVID-19 pandemic** turned preprints from a niche concern into a public health issue. Between January and December 2020, over 30,000 COVID-related preprints were posted to bioRxiv, medRxiv, and other servers. Many were picked up by journalists and amplified on social media before peer review. The most consequential case: a preprint posted in March 2020 by Didier Raoult's group in Marseille claimed that hydroxychloroquine was effective against SARS-CoV-2. The study had 42 patients, no randomization, no blinding, and excluded patients who died or were transferred to intensive care from the analysis. The preprint was shared millions of times, influenced government policy in multiple countries, and triggered a global run on the drug that left lupus and rheumatoid arthritis patients unable to fill their prescriptions. Subsequent large-scale RCTs (RECOVERY, SOLIDARITY) found no benefit.

The lesson is not that preprints are bad. The lesson is that preprints are *unfinished*. They are drafts posted for community feedback. Reading a preprint requires the same critical apparatus that peer reviewers are supposed to apply -- and most non-specialist readers do not have that apparatus.

### Other Preprint Servers

**SSRN** (Social Science Research Network, founded 1994, acquired by Elsevier in 2016) serves economics, law, and social science. **ChemRxiv** (American Chemical Society, launched 2017) serves chemistry. **TechRxiv** (IEEE, launched 2020) serves engineering. **EarthArXiv** (launched 2017) serves earth science. The proliferation of preprint servers reflects a broad consensus that the traditional journal timeline is too slow for modern research, combined with an acknowledgment that different fields need different moderation standards.

---

## 4. Grey Literature -- The Unglamorous Gold

Grey literature is published material that exists outside of traditional commercial or academic publishing channels. It includes:

- **Technical reports** -- NASA Technical Reports Server (NTRS) alone contains over 500,000 documents dating to the NACA era (1917-1958). These reports often contain levels of engineering detail -- thermal analysis, structural testing data, failure mode investigations -- that would never survive the page limits of a journal article. A journal paper might report that a heat shield performed within specification; the NTRS technical report contains the thermocouple data from every test point.
- **Working papers** -- Preliminary versions of research distributed for feedback, common in economics (NBER working papers, Fed discussion papers).
- **Conference proceedings** -- In computer science, top conference papers (NeurIPS, ICML, SIGCOMM, OSDI) are often *more* prestigious than journal publications. The field's culture inverted the usual hierarchy: the rapid review cycle of conferences (3-6 months) better suits a field that moves fast.
- **Government documents** -- Congressional Research Service reports, GAO audits, USGS data publications, patent filings. These are primary sources of enormous value that researchers routinely overlook because they are not indexed in the databases researchers habitually search.
- **Dissertations and theses** -- Often the most thorough treatment of a narrow topic that exists anywhere, because a doctoral student spent 3-7 years on it and had to satisfy a committee of experts. ProQuest Dissertations & Theses Global indexes over 5 million works.
- **Patents** -- Contain highly specific technical descriptions that exist nowhere else, because patent law requires "enablement" -- enough detail that a person skilled in the art could reproduce the invention. Google Patents indexes over 120 million patent documents from 100+ patent offices.

Grey literature is frequently the most valuable source available because it has not been compressed to fit a journal's format. The information that journals trim -- the failed approaches, the implementation details, the raw data tables, the engineering drawings -- is often exactly what a practitioner needs.

---

## 5. Wikipedia's Reliability Model

### How Wikipedia Actually Works

Wikipedia is neither as unreliable as its detractors claim nor as authoritative as its most enthusiastic users treat it. Understanding why requires understanding the editorial model.

Wikipedia's core content policy is **Verifiability, Not Truth**. The policy page (WP:V) states explicitly: "The threshold for inclusion in Wikipedia is verifiability, not truth -- whether readers can check that material in Wikipedia has already been published by a reliable source, not whether editors think it is true." This is a profound and counterintuitive design decision. It means Wikipedia is, by construction, a *secondary* source -- it reports what reliable sources have said, ideally without adding original interpretation.

The **Reliable Sources** guideline (WP:RS) defines what counts as a reliable source for Wikipedia's purposes: "published sources with a reputation for fact-checking and accuracy." Academic journals, major newspapers, university press books, and government publications generally qualify. Self-published sources, blogs, press releases, and social media generally do not.

The **Talk page** functions as a form of continuous peer review. Contentious claims are debated, sometimes for years, by editors who cite sources, challenge each other's interpretations, and reach (or fail to reach) consensus. The Talk page for the "Evolution" article runs to hundreds of thousands of words. The Talk page for "Homeopathy" has been the site of edit wars so intense that the article has been under various forms of editorial restriction since 2005.

Jimmy Wales has stated repeatedly: "Wikipedia is not a primary source." He has also stated that Wikipedia should not be cited in academic papers, not because it is unreliable, but because it is an encyclopedia -- and encyclopedias are starting points for research, not endpoints.

### Where Wikipedia Excels and Fails

Wikipedia is excellent for:
- **Stable scientific topics** -- Articles on photosynthesis, general relativity, the Krebs cycle, and the history of the Roman Republic are generally accurate, well-sourced, and comprehensive. They have been reviewed by hundreds or thousands of editors over many years.
- **Factual reference data** -- Population figures, geographic coordinates, chemical properties, historical dates. This is the kind of information that is verifiable, uncontroversial, and benefits from crowd-sourced error correction.
- **Orientation in an unfamiliar field** -- Wikipedia is an outstanding first stop when you know nothing about a topic and need to know what the important concepts, people, and sources are.

Wikipedia is unreliable for:
- **Current events** -- Articles about events that happened last week are often incomplete, biased toward English-language sources, and subject to rapid edits that may introduce errors. There is a reason Wikipedia has a "Current event" template that warns readers.
- **Biographies of living persons** -- Subject to vandalism, score-settling, and promotional editing. Wikipedia has stringent Biographies of Living Persons (BLP) policies precisely because the risks are high.
- **Politically or ideologically contentious topics** -- Articles on Israel-Palestine, abortion, gun control, and similar topics are battlegrounds. The article text at any given moment reflects the current state of a tug-of-war, not a settled consensus.
- **Obscure topics with few editors** -- Articles about small towns, minor historical figures, or niche technical topics may have been written by a single editor and never reviewed by anyone else. These articles can contain errors that persist for years.

---

## 6. Databases and Indexes -- Where to Search

The database you search determines what you find. No single database covers all of scholarly literature, and the biases of each database are worth understanding:

| Database | Coverage | Strengths | Limitations |
|----------|----------|-----------|-------------|
| **PubMed / MEDLINE** | ~36 million citations, biomedical focus | Gold standard for medicine, free, curated MeSH terms | Limited coverage outside biomedicine |
| **Scopus** | ~90 million records, multidisciplinary | Broadest curated coverage, citation analysis tools | Subscription required, Elsevier-owned |
| **Web of Science** | ~90 million records, multidisciplinary | Longest citation history (back to 1900), impact metrics | Subscription required, Clarivate-owned |
| **Google Scholar** | Unknown size (estimated 400M+), everything | Broadest coverage by far, free, includes grey literature | No quality filter, inconsistent metadata, duplicate records, opaque ranking algorithm |
| **IEEE Xplore** | ~6 million documents, engineering | Authoritative for electrical/computer engineering | Subscription required, narrow scope |
| **ACM Digital Library** | ~3 million documents, computing | Authoritative for computer science | Subscription required, narrow scope |
| **DBLP** | ~7 million records, CS bibliography | Clean metadata, deduplication, free | Bibliography only -- no full text |
| **Semantic Scholar** | ~220 million papers, AI-powered | AI-generated summaries, citation context, TLDR | Newer, still maturing, coverage gaps |

A systematic literature review should search at least two databases to reduce the risk of missing relevant work. In practice, most researchers start with Google Scholar (broadest net) and then refine with a discipline-specific database (PubMed for medicine, IEEE Xplore for engineering, DBLP for CS) that provides higher-quality metadata and more precise search operators.

**Semantic Scholar**, developed by the Allen Institute for AI (launched 2015), deserves special mention. It uses machine learning to extract structured information from papers -- key citations, methodological contributions, results -- and presents AI-generated summaries (TLDR). It represents a different approach to indexing: instead of relying on human-assigned keywords (like PubMed's MeSH terms), it uses models to understand what papers are *about*. The approach is promising but imperfect; AI-generated summaries can mischaracterize nuanced work.

---

## 7. Books and Monographs -- When Depth Beats Speed

Journal papers are optimized for novelty. They report what is new. Books are optimized for understanding. They explain what is known.

There are categories of knowledge for which books remain irreplaceable:

**Foundational knowledge.** If you want to understand sorting algorithms, you do not read the original papers by Hoare (quicksort, 1962), Williams (heapsort, 1964), and Shell (shellsort, 1959). You read Knuth. Donald Knuth's *The Art of Computer Programming* (TAOCP) -- three volumes published between 1968 and 1973, with Volume 4 appearing in fascicles starting in 2005 -- is the gold standard of what a reference work can be. Knuth analyzed every known algorithm with a rigor and thoroughness that no journal paper, constrained by page limits and reviewer patience, could match. TAOCP is not a book you read cover to cover. It is a book you *consult*, the way a lawyer consults case law. It is the permanent record of a field's foundational knowledge, and it has been continuously maintained for over fifty years.

**Historical context.** Books can tell the story of how a field developed in a way that no paper can. Thomas Kuhn's *The Structure of Scientific Revolutions* (1962) did not report new experimental results; it synthesized the history and philosophy of science into a framework (paradigm shifts, normal science, anomalies) that reshaped how scientists understood their own enterprise. Steven Levy's *Hackers* (1984) documented the culture of early computing in a way that no ACM paper could.

**Pedagogical clarity.** The best textbooks are feats of explanation. Feynman's *Lectures on Physics* (1964). Sipser's *Introduction to the Theory of Computation* (1997). Bishop's *Pattern Recognition and Machine Learning* (2006). Cormen, Leiserson, Rivest, and Stein's *Introduction to Algorithms* (CLRS, 1990). These books succeed because their authors invested years in finding the clearest possible way to explain difficult ideas -- a kind of work that the incentive structure of academic publishing does not reward.

**Practitioner knowledge.** O'Reilly Media's animal books -- the Camel (Perl), the Pickaxe (Ruby), the Bat (Unix Power Tools), the Nutshell series -- represent a distinct genre: knowledge written by practitioners for practitioners. They are neither academic textbooks nor reference manuals. They occupy a middle ground that journals cannot reach and documentation rarely aspires to. Tim O'Reilly understood something important: that working engineers need knowledge organized around tasks, not theories, and that a well-written book about a tool is itself a form of research artifact.

---

## 8. Data Repositories -- The FAIR Principles

Research is increasingly data-intensive, and the question of where data lives -- and how it can be found, accessed, and reused -- has become as important as where papers live.

The **FAIR principles**, published by Mark Wilkinson and colleagues in *Scientific Data* in 2016, articulate four requirements for research data:

- **Findable** -- Data should have a persistent identifier (DOI), be described with rich metadata, and be registered in a searchable resource.
- **Accessible** -- Data should be retrievable by its identifier using a standardized protocol, with metadata remaining accessible even if the data itself is no longer available.
- **Interoperable** -- Data should use formal, shared vocabularies and reference other data where relevant.
- **Reusable** -- Data should have clear usage licenses, detailed provenance, and meet community standards for the domain.

The major data repositories:

**Zenodo** (launched 2013, operated by CERN and funded by the European Commission) is a general-purpose repository that accepts any research output -- datasets, software, presentations, reports. It assigns DOIs and supports versioning. Its generality is its strength: if no domain-specific repository exists for your data, Zenodo will take it.

**Figshare** (launched 2012, now part of Digital Science) is similar to Zenodo but with a stronger emphasis on visualization and embedding. Figshare items can be embedded in journal articles and blog posts, making them more visible.

**Dryad** (launched 2008) is focused on data underlying peer-reviewed publications. It charges a data publication fee and curates submissions for completeness.

**GitHub** has become a *de facto* research artifact repository, particularly in computer science and computational fields. Code is a research artifact. A machine learning paper without its training code and evaluation scripts is, increasingly, considered incomplete. The rise of "Papers with Code" (launched 2018 by Robert Stojnic) -- a platform that links papers to their code implementations -- reflects this shift. GitHub is not a proper data repository (it lacks DOIs, persistent archival guarantees, and formal metadata), but the combination of GitHub + Zenodo (which can archive GitHub releases with DOIs) has become a pragmatic standard.

**Data citation** is an evolving norm. The FORCE11 Joint Declaration of Data Citation Principles (2014) argues that data should be cited in reference lists with the same formality as papers. In practice, adoption has been slow -- most style guides still treat data citation as optional or idiosyncratic.

---

## 9. How to Evaluate a Source -- The CRAAP Test and Beyond

The CRAAP test was developed by Sarah Blakeslee and colleagues at the Meriam Library, California State University, Chico, in 2004. It provides a structured framework for evaluating any information source:

**Currency** -- When was the information published or last updated? Is it current enough for your topic? A 2005 paper on web security practices is historical, not instructional. A 1965 paper on group theory may be perfectly current.

**Relevance** -- Does the information relate to your question? Is it at the appropriate level of depth? A popular-press article about quantum computing is not relevant to a researcher investigating error correction codes, even if it mentions the same terms.

**Authority** -- Who is the author? What are their credentials? What institution are they affiliated with? A paper on vaccine safety authored by a virologist at the WHO carries different weight than one authored by a chiropractor with no immunology training. Check institutional affiliation. Check publication record. Check whether the author has published other work in the same field.

**Accuracy** -- Is the information supported by evidence? Can you verify the claims against other sources? Are there citations? Do the citations actually support the claims made? (This last check is surprisingly revealing -- a significant fraction of citations, when checked, do not actually say what the citing paper claims they say. Studies have found citation error rates of 20-40%.)

**Purpose** -- Why does this information exist? Is it intended to inform, teach, sell, entertain, or persuade? Pharmaceutical company-funded studies of their own drugs are not inherently wrong, but the funder has a financial interest in positive results, and meta-analyses consistently show that industry-funded studies report favorable outcomes more often than independently funded ones.

### Beyond the CRAAP Test

**Check for retractions.** Retraction Watch (founded 2010 by Ivan Oransky and Adam Marcus) maintains a database of over 45,000 retracted papers. Before citing any paper, especially one with surprising claims, check whether it has been retracted or corrected. Retracted papers continue to be cited -- sometimes for years after retraction -- because researchers do not check.

**Follow the citation chain backward.** When a paper makes a factual claim and cites a source, read the source. Then read the sources that *that* source cites. Citation chains often reveal a phenomenon called **"citation mutation"** or **"citation drift"**: a nuanced finding in the original study gets simplified in each successive citation until it bears little resemblance to the original. A 2014 study found that claims about the prevalence of scientific misconduct were traced through citation chains back to a single survey with significant methodological limitations -- but each successive citation had stripped away the caveats.

**Check funding sources.** Funding disclosures are now mandatory in most journals, but they are often buried in fine print. The sugar industry funded research in the 1960s that downplayed the link between sugar and heart disease, shifting blame to dietary fat (the JAMA Internal Medicine exposé by Kearns, Schmidt, and Glantz, 2016). The tobacco industry funded decades of research designed to manufacture doubt about the link between smoking and cancer (documented exhaustively by Naomi Oreskes and Erik Conway in *Merchants of Doubt*, 2010). Funding does not automatically invalidate research, but it is a signal that warrants closer scrutiny of methodology and conclusions.

---

## 10. Our Connection -- Discovery, Fidelity, Provenance

This is not an abstract concern for us. Our research infrastructure is built on the principle that every claim should be traceable to its source.

Our **discovery engine** (`discovery_engine.py`) scans four source classes on a 6-hour cadence: arXiv papers (keyword search across relevant categories), YouTube channels (31 tracked, filtered for substantive content over 5 minutes), Hacker News front page (filtered by research domain), and Google Scholar (citation alerts for key tracked papers). Discovered items are written to `RESEARCH-QUEUE.md` with DISCOVERED status, awaiting human promotion to QUEUED. The engine does not evaluate quality -- that is a human judgment. It ensures *coverage*, so that relevant new work does not slip past unnoticed.

Our **data-fidelity skill** (`.claude/skills/data-fidelity/SKILL.md`) implements a structured fact-checking workflow. When a research document is complete, 2-3 parallel fact-checker agents sweep the document in ranges, categorizing findings as ERROR (factually wrong, must fix), QUESTIONABLE (might be wrong, needs verification), or INCONSISTENCY (contradicts another document). A separate data-refresh pass updates market data, statistics, and other perishable facts. The workflow is a quality gate: no research document is published until it has been through the fidelity sweep.

Our **memory system** stores claims with provenance. When a fact enters our knowledge base, it carries metadata about where it came from -- the source URL, the retrieval date, the confidence level. We can trace any assertion back to its source hash. This is not just good practice; it is the architecture of accountability. A system that cannot explain where its facts came from cannot be trusted to provide facts.

The connection between this document and our tooling is direct: the hierarchy of evidence described in Section 1 informs the confidence levels we assign. A claim sourced from a peer-reviewed systematic review gets higher confidence than one sourced from a preprint, which gets higher confidence than one sourced from a Hacker News comment. The databases described in Section 6 are the pools our discovery engine fishes in. The evaluation framework described in Section 9 is what our data-fidelity skill operationalizes.

---

## Conclusion

Sources of truth are not binary. They exist on a spectrum from "almost certainly reliable" to "treat with extreme skepticism," and the same source can occupy different positions on that spectrum depending on the question being asked. *Nature* is a superb source for breakthrough science and a poor source for engineering implementation details. Stack Overflow is a poor source for theoretical claims and an excellent source for "how do I make this library work." A NASA technical report from 1967 is a primary source of unimpeachable provenance for questions about Apollo-era thermal analysis and completely useless for questions about modern composite materials.

The working researcher's job is not to find perfect sources. Perfect sources do not exist. The job is to understand the strengths, limitations, and biases of every source, to triangulate claims across multiple independent sources, and to maintain a clear chain of provenance so that when -- not if -- a source turns out to be wrong, the error can be traced, isolated, and corrected.

The most dangerous source of all is the one that is never questioned.
