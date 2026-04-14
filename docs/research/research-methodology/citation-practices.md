# Citation Practices

*The social contract of scholarship -- and the metrics that corrupted it*

---

## 1. Why We Cite

A citation is a debt paid. When a researcher writes "as shown by Euler (1736)" or appends a numbered reference to a claim, they are performing an act that is simultaneously intellectual, ethical, social, and legal. It is one of the oldest norms in scholarship, and it is so deeply embedded in academic practice that violating it -- plagiarism -- is treated as a career-ending offense, the scholarly equivalent of perjury.

But the reasons we cite are not singular. They layer on top of each other, each one load-bearing:

**Intellectual honesty.** The most fundamental reason. Ideas do not appear from nowhere. Every theorem builds on prior theorems. Every experiment builds on prior experiments. Every critique builds on the work being critiqued. Citing is the act of saying: *this part is mine, and this part is theirs, and here is where the boundary lies.* It is a map of intellectual territory. When Newton wrote "if I have seen further, it is by standing on the shoulders of giants," he was describing citation in its purest form -- even if the letter was almost certainly a barb directed at Robert Hooke's short stature.

**Verifiability.** A citation is a machine for checking claims. When a paper says "the melting point of gallium is 29.76 C (Lecoq de Boisbaudran, 1875)," it is not asking the reader to take the author's word for it. It is providing a pointer. Go look. Check the original measurement. See if the context matches. This is the mechanism by which science self-corrects. Without citations, every paper would be an island, and every claim would have to be accepted or rejected on authority alone -- which is precisely how pre-scientific knowledge worked, and precisely why it stagnated for centuries.

**Context.** Scholarship does not exist in isolation. Every paper is a node in a conversation that may span decades or centuries. Citations place a new contribution within that conversation. They say: *here is the problem as it was understood before this work. Here is what was known. Here is what was contested. Here is the gap this paper addresses.* A paper without citations is a paper without context -- a voice shouting into a room where nobody knows what came before.

**Authority.** This is the pragmatic dimension. Building on established foundations is not just intellectually honest; it is persuasive. A claim supported by citation to a well-regarded source carries more weight than an unsupported assertion. This is not mere appeal to authority (though it can degrade into that). It is the reasonable principle that claims consistent with a body of verified prior work are more likely to be correct than claims that contradict everything without explanation.

**The social contract.** Science is a cooperative enterprise conducted by people who mostly do not know each other, spread across institutions and countries and centuries. The social contract of citation is what makes this cooperation possible. I cite your work; you cite mine when relevant. We both benefit. The community benefits. The knowledge accumulates. Break this contract -- claim credit for work you did not do, or fail to credit work that informed your own -- and the cooperative structure frays. This is why plagiarism is punished so severely: it is not just dishonesty about a single paper. It is a defection from the cooperative game that makes science possible.

Isaac Newton's *Principia Mathematica* (1687) cites Kepler, Galileo, and Huygens. Darwin's *On the Origin of Species* (1859) cites Lyell, Malthus, and Wallace. Einstein's 1905 relativity paper is famously sparse in its citations -- it references only five works -- but those five are precisely chosen to establish the theoretical context. Even when citation practice was informal, the norm was present: *acknowledge your debts.*

---

## 2. The Invention of Citation Indexing

For most of history, citations existed only in the papers themselves. If you wanted to know who had cited a particular work, you had to read every subsequent paper and check. This was, for all practical purposes, impossible at scale.

**Eugene Garfield** changed that. Garfield was a chemist turned information scientist -- a man who thought about the structure of knowledge the way an architect thinks about the structure of buildings. In 1955, writing in *Science*, he proposed an audacious idea: what if you could index not just the content of scientific papers, but the *references* in those papers? What if you could build a map of which papers cite which other papers?

The insight was that citations form a **graph**. Not a hierarchy, not a list, but a directed graph -- papers pointing to other papers, forming clusters and chains and networks. If you could build that graph, you could answer questions that were previously unanswerable: Which papers are most cited? Which fields are growing? Which works are foundational? Which papers bridge between disciplines?

In **1960**, Garfield founded the **Institute for Scientific Information (ISI)** in Philadelphia. In **1964**, ISI published the first **Science Citation Index (SCI)**, covering 613 journals and indexing every reference in every paper. The initial database contained about 1.4 million citation links. It was, in effect, the first search engine for science -- not searching by keyword, but by intellectual connection.

The SCI was built by hand. Teams of indexers read papers, extracted references, and typed them into databases. It was labor-intensive, expensive, and revolutionary. For the first time, a researcher could look up a seminal paper and immediately see every subsequent paper that had cited it. You could trace the influence of an idea forward through time. You could find related work not by guessing at keywords, but by following the citation graph.

Garfield called this **"citation analysis"** and the broader field it spawned became known as **bibliometrics** -- the quantitative study of scholarly publication. Citation analysis revealed patterns that were invisible before: the exponential growth of scientific literature, the clustering of research into invisible colleges, the existence of "sleeping beauties" (papers that go uncited for years before suddenly becoming influential), and the power-law distribution of citations (most papers are rarely cited; a few are cited thousands of times).

ISI was acquired by **Thomson Scientific** in 1992, which merged with Reuters in 2008 to form **Thomson Reuters**. The citation indexing business was sold to **Onex and Baring Asia** in 2016 and rebranded as **Clarivate Analytics** (now simply **Clarivate**). Today, Clarivate's **Web of Science** -- the direct descendant of Garfield's 1964 Science Citation Index -- indexes over 21,000 journals and contains over 1.9 billion cited references. It remains one of the two dominant citation databases, alongside Elsevier's **Scopus** (launched 2004).

Garfield understood that his creation was a double-edged sword. He spent decades warning against the misuse of citation metrics -- against treating citation counts as a direct measure of quality, against confusing influence with importance, against the reductive quantification of something as complex as scholarly contribution. He was, in a sense, Dr. Frankenstein: brilliant enough to create the monster, prescient enough to warn against it, and powerless to stop others from misusing it.

He died in 2017 at the age of 91. By then, the metrics he had helped create had reshaped the entire incentive structure of global science -- mostly in ways he had explicitly warned against.

---

## 3. The Impact Factor

The **Journal Impact Factor (JIF)** is the most influential, most criticized, and most misused metric in the history of science. It was invented by Eugene Garfield and Irving Sher in 1963, and it measures a simple ratio: the number of citations received in a given year by articles published in that journal in the two preceding years, divided by the number of citable articles published in those two years.

The formula:

> **JIF (year N) = Citations in year N to items published in years N-1 and N-2 / Number of citable items published in years N-1 and N-2**

Garfield's original intent was modest. He wanted a tool to help librarians decide which journals to subscribe to. If a library could only afford 200 subscriptions out of 10,000 available journals, the impact factor could help identify which journals were most actively engaged with by the research community. It was a journal-selection tool, not a researcher-evaluation tool.

The corruption began when administrators discovered that the impact factor could be used as a proxy for researcher quality. The logic was seductive in its simplicity: if a researcher publishes in high-impact-factor journals, they must be doing high-quality work. Therefore, hiring decisions, tenure decisions, promotion decisions, and funding decisions could all be simplified by checking which journals a candidate had published in. No need to actually read the papers. No need to understand the field. Just check the number.

This created a **perverse incentive structure** that has distorted science for decades:

- **Researchers** chase publication in high-JIF journals rather than in the most appropriate venues for their work.
- **Journals** game their own impact factors through editorial decisions -- rejecting papers unlikely to be cited, publishing more review articles (which are cited more often), and manipulating the denominator (by classifying some content as "non-citable").
- **Fields** are compared unfairly. Cell biology journals have JIFs above 30; mathematics journals rarely exceed 5. This does not mean cell biologists do better work. It means cell biology papers cite more recent work, and there are more cell biologists.
- **Individual papers** are judged by the container they appear in, not by their own merit. A mediocre paper in *Nature* (JIF ~50) is treated as more valuable than a groundbreaking paper in a specialist journal (JIF ~3). This is statistically absurd: the distribution of citations within any journal is heavily skewed, with a small number of papers accounting for most of the journal's citations. The median paper in a high-JIF journal may be cited no more often than the median paper in a mid-tier journal.

In **2012**, the scientific community pushed back. The **San Francisco Declaration on Research Assessment (DORA)** was drafted during the Annual Meeting of the American Society for Cell Biology. Its central recommendation is blunt:

> **"Do not use journal-based metrics, such as Journal Impact Factors, as a surrogate measure of the quality of individual research articles, to assess an individual scientist's contributions, or in hiring, promotion, or funding decisions."**

DORA has been signed by over 22,000 individuals and 3,000 organizations as of 2025. Its impact has been real but uneven. Some funding agencies (including the Netherlands Organisation for Scientific Research and the Wellcome Trust) have explicitly removed impact-factor requirements from their applications. Others continue to use JIF as a de facto filter. The cultural inertia is enormous. A generation of scientists built their careers optimizing for a number that was never designed to measure what it is used to measure.

Garfield himself was ambivalent. He defended the impact factor as a useful tool when properly understood, while condemning its misuse for individual evaluation. In a 2006 interview, he noted: "I expected it to be used constructively, to help people identify journals in which to publish or to find the best journals to read. I never expected it to be used to evaluate individuals."

---

## 4. The h-index

In **2005**, physicist **Jorge E. Hirsch** of the University of California, San Diego, published a paper in the *Proceedings of the National Academy of Sciences* proposing a new metric for evaluating individual researchers. He called it the **h-index**.

The definition is elegant: **a scientist has index h if h of their N papers have at least h citations each, and the other (N - h) papers have no more than h citations each.**

In practice: if you have published 50 papers, and 20 of them have been cited at least 20 times each, your h-index is 20. If your 21st most-cited paper has only 19 citations, your h-index stays at 20 regardless of how many thousands of citations your top papers have accumulated.

**Strengths:**

- **Combines productivity and impact.** You cannot have a high h-index by publishing one hugely influential paper and nothing else. You cannot have a high h-index by publishing hundreds of papers that nobody reads. You need both volume and impact.
- **Robust to outliers.** A single viral paper does not inflate the h-index the way it inflates total citation counts. Similarly, a large number of uncited papers does not drag it down the way it drags down mean citations per paper.
- **Easy to compute.** Any citation database can calculate it instantly.

**Weaknesses:**

- **Field-dependent.** A biomedical researcher and a mathematician with identical talent and productivity will have wildly different h-indices because biomedical papers cite more and are cited more. An h-index of 40 is exceptional in mathematics; it is merely good in molecular biology.
- **Career-stage biased.** The h-index can only increase over time (a paper, once cited, remains cited). This means senior researchers always have higher h-indices than junior researchers, even if the junior researcher's recent work is more impactful. It measures career accumulation, not current contribution.
- **Favors review articles.** Review articles are cited more often than original research because they serve as convenient general references. A researcher who writes many reviews will have a higher h-index than one who focuses on original contributions, all else being equal.
- **Cannot decrease.** This is both a strength and a weakness. A researcher who has not published in a decade retains their h-index. The metric has no mechanism for measuring decline or current activity.
- **Incentivizes salami-slicing.** Since the h-index rewards having many well-cited papers, there is an incentive to split work into the maximum number of publishable units rather than presenting findings as a single comprehensive paper.

Hirsch's original paper has itself been cited over 13,000 times -- making it one of the most influential papers in bibliometrics. The irony of using citation counts to validate a citation-based metric has not been lost on the field.

**Variants** have proliferated. The **g-index** (proposed by Leo Egghe in 2006) weights highly-cited papers more heavily: the g-index is the largest number g such that the top g papers have together received at least g-squared citations. The **i10-index** (used by Google Scholar) is simply the number of papers with at least 10 citations -- crude but intuitive. The **m-quotient** divides the h-index by the number of years since a researcher's first publication, attempting to correct for career stage. None of these variants has displaced the h-index in practice, partly because the h-index's simplicity is its greatest feature.

---

## 5. Citation Styles

The content of a citation -- pointing to a specific source -- matters far more than its format. But format has generated centuries of argument, entire style manuals, and a cottage industry of formatting tools.

The major citation styles:

**APA (American Psychological Association).** Author-date format: `(Smith, 2023)` in text, with full references alphabetized at the end. Dominant in social sciences, psychology, education, and nursing. The 7th edition (2019) is current. APA style reflects the social sciences' emphasis on recency -- the date is in the in-text citation because readers in these fields need to quickly assess how current a source is.

**MLA (Modern Language Association).** Author-page format: `(Smith 42)` in text. No comma between author and page number. Dominant in humanities, literature, and cultural studies. MLA style reflects the humanities' emphasis on textual engagement -- the page number is in the in-text citation because readers need to locate the specific passage being discussed.

**Chicago/Turabian.** Two systems in one. Notes-bibliography (used in humanities): footnotes or endnotes with superscript numbers, plus a bibliography. Author-date (used in sciences): similar to APA. The *Chicago Manual of Style* is now in its 17th edition (2017) and is the most comprehensive English-language style guide, covering not just citations but every aspect of manuscript preparation. Turabian is the student-oriented abridgement.

**IEEE (Institute of Electrical and Electronics Engineers).** Numbered references in square brackets: `[1]`, `[2]`, `[3]`. References listed in order of first appearance, not alphabetically. Dominant in electrical engineering, computer science, and related fields. The numbered system is compact -- important when page counts are limited -- and avoids the visual disruption of author-date citations in technical prose dense with parenthetical expressions.

**Vancouver.** Also numbered, similar to IEEE but with its own formatting rules. Developed in 1978 when a group of medical journal editors met in Vancouver, Canada, and agreed on uniform requirements for manuscripts submitted to their journals. Now maintained by the International Committee of Medical Journal Editors (ICMJE). Dominant in biomedical sciences. Numbered references in medical papers serve a specific purpose: clinical readers scanning papers quickly need minimal interruption.

**Harvard.** Author-date, similar to APA but with subtle differences (e.g., ampersand usage, capitalization rules). There is no single authoritative "Harvard style" -- it is more a family of related conventions used across many institutions, particularly in the UK and Australia. The name derives from the style's early association with Harvard University, though Harvard itself does not enforce it.

**BibTeX.** Not a citation style per se, but a reference management system created by Oren Patashnik and Leslie Lamport in 1985 for use with LaTeX. BibTeX entries are stored in `.bib` files as structured records, and the citation style is determined by a separate `.bst` (bibliography style) file. This separation of content from presentation was revolutionary -- a single `.bib` database can be formatted in APA, IEEE, or any other style simply by changing the style file. BibTeX's descendants include **BibLaTeX** (more flexible, maintained by Philipp Lehman and then Philip Kime) and **CSL** (Citation Style Language, used by Zotero and Mendeley, with over 10,000 style definitions).

The evolution of citation format follows a clear arc: from **footnotes** (the oldest style, placing references at the bottom of the page), to **endnotes** (grouping them at the end of a chapter or book), to **numbered references** (compact, sequential), to **author-date** (providing immediate context). Each transition reflected a change in how scholarship was consumed: footnotes work well for close reading of physical books; author-date works well for scanning papers across a large literature.

The style matters less than the practice. A paper with consistent, complete citations in any recognized format has fulfilled its obligation. A paper with inconsistent, incomplete, or missing citations has failed, regardless of which style it claims to follow.

---

## 6. Citation Cartels and Manipulation

Where there are metrics, there is gaming. Citation metrics are no exception.

**Coercive citation** is the most common form of manipulation. It occurs when journal editors require authors to add citations to the journal's own recently published papers as a condition of acceptance. The request is rarely explicit -- it is usually framed as "the reviewers suggest you engage more fully with recent work in this area" -- but the intent is transparent: inflate the journal's citation count and, by extension, its impact factor.

A **2012 survey** published in *Science* by Allen Wilhite and Eric Fong found that 20% of respondents in business, economics, psychology, and sociology had experienced coercive citation demands. The practice was more common in lower-ranked journals (which have more to gain from impact factor inflation) and in fields where editorial power is concentrated in a few individuals.

**Citation rings** (or citation cartels) are agreements between journals, editors, or groups of researchers to cite each other's work preferentially. In 2013, Thomson Reuters (then the JIF publisher) suspended the impact factors of several journals for "anomalous citation patterns" -- a euphemism for organized mutual citation. The Brazilian journal *Genetics and Molecular Research* and several Egyptian journals were flagged. In some cases, the patterns were blatant: two journals would each publish review articles citing dozens of papers from the other journal, inflating both impact factors simultaneously.

**Self-citation gaming** is the individual-level version. A researcher who systematically cites their own prior work -- even when it is not the most relevant source -- inflates their own citation counts and h-index. Some self-citation is legitimate and necessary: if your current paper builds directly on your prior results, you should cite them. The gray area is wide. The line between "my prior work is genuinely relevant" and "I am padding my numbers" is often a matter of degree rather than kind.

The **2019 Ioannidis study** (published in *PLOS Biology* by John Ioannidis, Jeroen Baas, Richard Klavans, and Kevin Boyack) analyzed self-citation patterns across 100,000 scientists. They found that the vast majority of researchers had self-citation rates between 10% and 25% -- a normal range reflecting the fact that researchers tend to work on related problems over time. But a small fraction had self-citation rates above 50%, and some above 70%. At those levels, it is difficult to argue that every self-citation is intellectually necessary.

**Citation manipulation has real consequences.** When impact factors are inflated, the journals that benefit attract more submissions (because researchers want to publish in "high-impact" venues), which gives them more papers to choose from, which allows them to be more selective, which further increases their impact factor. It is a flywheel -- but one built on distorted inputs. The journals that are genuinely most useful to a field may be displaced by those that are most effective at gaming the metric.

---

## 7. Predatory Journals

The open-access movement was born from a noble idea: publicly funded research should be publicly available. The traditional model -- in which publishers charge readers (usually university libraries) for access to papers written by researchers who received no payment from the publisher -- was increasingly seen as a market failure. The internet made distribution essentially free, yet subscription prices continued to rise.

The alternative was **author-pays open access**: the researcher (or their institution or funder) pays a processing charge, and the paper is freely available to everyone. This model worked well for legitimate open-access publishers like the Public Library of Science (PLOS, founded 2001) and BioMed Central (founded 1998).

But it also created a business model ripe for exploitation. If publishers make money by publishing papers, and the payer is the author (who wants to be published), then there is an incentive to accept as many papers as possible, regardless of quality. Peer review costs money and slows publication; eliminating it increases both throughput and profit margin.

**Jeffrey Beall**, a librarian at the University of Colorado Denver, began documenting these exploitative publishers in 2008 on his blog *Scholarly Open Access*. He coined the term **"predatory journals"** and maintained a list -- known as **Beall's List** -- of publishers and journals that met his criteria for predatory behavior. The list was controversial (some argued it was too aggressive, others that it was not aggressive enough), and Beall shut it down in January 2017, reportedly under pressure from his university, though he never confirmed the reason. The list has been preserved and updated by others, and the term "predatory journal" has entered the scholarly lexicon permanently.

**Hallmarks of predatory publishing:**

- **Unsolicited emails.** "Dear Esteemed Professor, we invite you to submit your valuable research to our prestigious journal..." These mass emails are the spam of the academic world. Legitimate journals do not cold-email potential authors with flattering invitations.
- **Fake or non-functional editorial boards.** Names listed without permission, deceased scholars, or people with no expertise in the journal's claimed scope.
- **No meaningful peer review.** Papers accepted within days of submission -- sometimes within hours. Legitimate peer review typically takes weeks to months.
- **Rapid acceptance with guaranteed publication.** The business model depends on accepting papers, not rejecting them.
- **Misleading journal names.** Chosen to be confusingly similar to established journals. The *International Journal of [Important-Sounding Field]* multiplied across dozens of predatory publishers.
- **Fabricated or inflated metrics.** Claiming an "impact factor" from a non-standard indexing service, or simply inventing one.

In **2013**, journalist **John Bohannon** conducted a sting for *Science* magazine. He created a deliberately flawed paper -- a chemistry study with obvious errors in methodology, analysis, and conclusions -- and submitted it under a fictitious name from a fictitious institution to **304 open-access journals**. Of the 304, **157 accepted the paper** (52%). Of the 106 journals that provided substantive peer review, 70% recommended acceptance despite the glaring flaws. The study, published as *"Who's Afraid of Peer Review?"*, sent shockwaves through the scholarly publishing community.

The damage to open access's reputation was real and lasting. Critics of open access seized on the Bohannon sting as evidence that author-pays publishing was inherently corrupt. This was unfair -- Bohannon's sting included journals from Beall's predatory list alongside legitimate publishers, and many legitimate open-access journals correctly rejected the paper. But the headline numbers were devastating, and the perception stuck: open access became associated with low quality in the minds of many researchers and administrators, setting back a movement that was, at its core, trying to make science more accessible.

The predatory journal problem has not been solved. Estimates suggest there are now over **15,000 predatory journals** actively publishing, producing hundreds of thousands of papers per year. These papers pollute citation databases, contaminate systematic reviews, and create noise that makes it harder to find legitimate research. The victims are often early-career researchers in developing countries, who pay publication fees they can ill afford for papers that will not advance their careers.

---

## 8. Modern Citation Tools

The mechanics of citation have been transformed by software. Where researchers once maintained index cards or typed references by hand, a constellation of tools now manages the entire workflow.

**Zotero** (launched 2006, George Mason University). Free, open-source, community-governed. Started as a Firefox extension, now a standalone application. Its browser connector automatically extracts bibliographic data from journal websites, library catalogs, and even Amazon. Stores PDFs, generates citations in any style (via CSL), and syncs across devices. Zotero's open-source model has made it the default recommendation for researchers who want full control over their data. Over 12 million registered users as of 2024.

**Mendeley** (launched 2008, acquired by Elsevier 2013). Combines reference management with a social network for researchers. Its PDF reader extracts metadata automatically. The Elsevier acquisition was controversial -- many users viewed it as a data-harvesting move by the world's largest academic publisher, and the subsequent deprecation of Mendeley's open API confirmed their fears. Still widely used, particularly in Europe.

**EndNote** (first released 1988 by Niles Software, now Clarivate). The oldest commercial reference manager. Tightly integrated with Microsoft Word. Dominant in biomedical research, where its integration with PubMed and Web of Science gives it a workflow advantage. Expensive (both in license fees and in the cognitive cost of its complex interface), but entrenched.

**Paperpile** (launched 2012). Browser-based, Google Workspace-integrated. Positions itself as the modern, lightweight alternative to EndNote and Mendeley. Strong PDF annotation. Growing quickly among researchers who work primarily in Google Docs.

**The DOI system** (launched 2000 by the International DOI Foundation). The **Digital Object Identifier** is a persistent identifier for digital objects -- primarily scholarly articles, but also datasets, software, and other research outputs. A DOI like `10.1038/nature12373` resolves to a URL via the DOI resolver (doi.org), and the publisher is responsible for keeping that URL current. DOIs solved the "link rot" problem that plagued early online scholarship: URLs change, but DOIs persist. Over 300 million DOIs have been registered.

**CrossRef** (founded 2000). The registration agency for DOIs in scholarly publishing. CrossRef maintains the metadata infrastructure that connects DOIs to their resources. Its **Cited-by** service tracks citation links between DOI-registered works, enabling publishers and databases to build citation graphs without manual indexing. Over 150 million records.

**ORCID** (launched 2012). The **Open Researcher and Contributor ID** is a persistent identifier for researchers -- solving the name ambiguity problem. Is "J. Smith" the botanist at Oxford or the physicist at MIT? ORCID assigns each researcher a unique 16-digit identifier (e.g., 0000-0002-1825-0097) that connects to their publications regardless of name changes, transliterations, or institutional moves. Over 20 million registrations. Many funders and publishers now require ORCID for submissions.

**Connected Papers** (launched 2020). A visual tool that builds a graph of papers related to a seed paper -- not based on direct citations, but on co-citation and bibliographic coupling (papers that cite similar sources tend to be related). The resulting graph reveals the intellectual neighborhood of a paper in a way that linear reference lists cannot.

**Semantic Scholar** (launched 2015, Allen Institute for AI). An AI-powered search engine that uses natural language processing to extract key claims from papers, identify influential citations (distinguishing between perfunctory citations and substantive ones), and build knowledge graphs across the literature. Its **TLDR** feature generates one-sentence summaries of papers. Over 200 million papers indexed.

**Google Scholar** (launched 2004). The most widely used academic search engine, despite (or because of) its simplicity. Indexes papers from across the web -- journals, preprint servers, institutional repositories, even personal websites. Its coverage is broader than Web of Science or Scopus, but its metadata quality is lower. Google Scholar's citation counts are generally higher than those from curated databases, because it catches citations from sources that the curated databases do not index. Its h-index calculator democratized bibliometric analysis -- any researcher could check their own metrics instantly, for free.

---

## 9. Preprints and the Changing Landscape

The preprint is older than the term. Researchers have circulated draft manuscripts before formal publication for centuries -- Newton sent drafts to Leibniz, Darwin sent chapters to Hooker and Lyell. But the modern preprint server began with a specific person, a specific date, and a specific frustration.

In **August 1991**, **Paul Ginsparg**, a physicist at Los Alamos National Laboratory, set up an email server that would accept and distribute electronic preprints in high-energy physics. He called it the **xxx.lanl.gov e-Print archive** -- later renamed **arXiv** (pronounced "archive," the X being the Greek chi). The motivation was simple: physics moved too fast for journals. By the time a paper was peer-reviewed and published, the results were already six months to a year old, and everyone in the field had already seen a preprint version circulated by email or fax.

ArXiv formalized this practice. Instead of emailing preprints to a personal mailing list, physicists could upload them to arXiv, where anyone could access them instantly. The server grew to cover mathematics, computer science, quantitative biology, quantitative finance, statistics, and electrical engineering. As of 2025, arXiv hosts over 2.5 million preprints and receives over 20,000 new submissions per month. It is operated by Cornell University and funded by a consortium of institutions and the Simons Foundation.

ArXiv transformed physics. In high-energy physics and mathematics, the preprint is now effectively the publication of record. Peer review and journal publication still happen, but they are confirmatory rather than constitutive. A result is "known" when it appears on arXiv, not when it appears in a journal. The most important mathematics paper of the 21st century -- Grigori Perelman's proof of the Poincare conjecture (2002-2003) -- was posted to arXiv and never submitted to a journal. Perelman did not need a journal. ArXiv was sufficient.

**BioRxiv** (launched 2013, Cold Spring Harbor Laboratory) brought the preprint model to biology, where it faced more resistance. Biology's culture was more journal-centric than physics', and there were legitimate concerns about releasing unreviewed medical or public health claims. BioRxiv grew slowly at first, then explosively during the **COVID-19 pandemic** (2020-2022), when the speed advantage of preprints over journal publication became a matter of urgent public health need. COVID-related preprints appeared on bioRxiv and its medical sibling **medRxiv** (launched 2019) weeks or months before their journal-published versions.

The pandemic also revealed the risks. Several high-profile preprints made claims -- about ivermectin, about lab-leak hypotheses, about mask efficacy -- that were amplified by media and social media before peer review could assess them. Some were later retracted or substantially revised. The tension between speed and validation is real, and preprints do not resolve it -- they simply shift the responsibility for evaluation from journal editors and reviewers to the reader.

The broader shift is from a **"journal of record"** model to a **"preprint of record"** model. In the journal-of-record model, a paper does not exist until a journal publishes it. The journal's brand and peer-review process confer legitimacy. In the preprint-of-record model, a paper exists as soon as its authors post it. Legitimacy comes from community response -- citations, replications, commentary -- not from a journal's imprimatur. This shift is incomplete and uneven across disciplines, but the direction is clear.

This transition maps directly onto a larger question in information science: **where does authority reside?** In institutions (journals, publishers, editorial boards) or in networks (citation graphs, community response, replication)? The preprint movement answers: in networks. The metrics establishment answers: in institutions. The tension between these two answers drives much of the current upheaval in scholarly communication.

---

## 10. Our Connection

Our grove namespace is a citation system.

This is not a metaphor. The grove format maps **names to hashes to records**, with provenance chains that track where each piece of content came from. When we write a grove record that references another record by hash, we are performing a citation act -- creating a directed edge in a graph that connects two pieces of knowledge with a verifiable pointer.

Our cross-reference graph -- **739 edges, 177 nodes** -- IS a citation graph. Each edge represents one document's acknowledgment that another document exists and is relevant. The nodes are our research projects, our simulations, our problem statements. The edges are the intellectual connections between them. When we look at this graph, we see the same structures that Garfield saw in his Science Citation Index: clusters of related work, bridge papers that connect disciplines, foundational nodes that anchor entire subgraphs.

Every sweep that adds a new cross-reference is a citation act. When `sweep.py` processes a research page and discovers a connection to another page -- a shared mathematical concept, a common data source, a methodological parallel -- and adds a link, it is doing what every researcher does when they add a reference to their bibliography. It is saying: *this work is related to that work, and here is the connection.*

The content-addressed nature of our grove records makes our citation system stronger than traditional academic citation in one specific way: **immutability**. A traditional citation points to a journal article that can be retracted, corrected, or (in the worst case) altered after publication. A hash-addressed grove record cannot be changed without changing its hash, which would break every reference to it. Our citations point to specific, immutable versions of content. If the content changes, it gets a new hash and a new identity. The old version remains addressable. This is citation with version control built in -- something that academic publishing has struggled with for decades.

The DOI system attempts something similar but relies on publisher cooperation to maintain resolution. Our hashes are self-verifying. The content IS the address. No registry required. No publisher required. No trust in third parties required.

Garfield built a graph of science by indexing references. We are building a graph of knowledge by content-addressing records. The tools are different. The principle is identical. Every node in our graph is a contribution. Every edge is an acknowledgment. Every sweep is a literature review. The social contract of scholarship -- credit your sources, enable verification, place work in context -- operates at the architectural level of our system, not just at the social level.

The metrics that corrupted academic citation -- impact factors, h-indices, journal rankings -- are absent from our system by design. We have no prestige hierarchy among records. A grove record is valuable because it contains knowledge that other records reference, not because it appears in a high-status container. Our citation graph measures influence directly, through the structure of connections, rather than through proxy metrics that can be gamed.

This is not accidental. It is what happens when you build a knowledge system from first principles rather than inheriting one from the printing press era.

---

## Sources and Further Reading

- Garfield, E. (1955). Citation Indexes for Science. *Science*, 122(3159), 108-111.
- Garfield, E. (2006). The History and Meaning of the Journal Impact Factor. *JAMA*, 295(1), 90-93.
- Hirsch, J. E. (2005). An index to quantify an individual's scientific research output. *PNAS*, 102(46), 16569-16572.
- San Francisco Declaration on Research Assessment (DORA). (2012). https://sfdora.org
- Wilhite, A. W., & Fong, E. A. (2012). Coercive Citation in Academic Publishing. *Science*, 335(6068), 542-543.
- Bohannon, J. (2013). Who's Afraid of Peer Review? *Science*, 342(6154), 60-65.
- Ioannidis, J. P. A., Baas, J., Klavans, R., & Boyack, K. W. (2019). A standardized citation metrics author database. *PLOS Biology*, 17(8), e3000384.
- Ginsparg, P. (2011). ArXiv at 20. *Nature*, 476, 145-147.
- Egghe, L. (2006). Theory and practise of the g-index. *Scientometrics*, 69(1), 131-152.

## Study Guide — Citation Practices

Styles: APA, MLA, Chicago, IEEE, numerical vs author-date.
Tools: Zotero, BibTeX, CSL styles.

## DIY — Set up Zotero

Import 50 papers. Use Better BibTeX to export `.bib` for
LaTeX. Best in class for free.

## TRY — Trace one paper's citation tree

Pick a classic paper. Follow forward and backward
citations one hop. Count how many citations check
out. Surprising results await.
