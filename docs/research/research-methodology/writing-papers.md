# Writing Research Papers

*The craft of scientific communication --- from blank page to published record*

---

## 1. The IMRaD Structure

Every research paper is, at its core, a story about what you did not know, how you tried to find out, what you found, and what it means. The modern research paper encodes this story in a structure so universal that its acronym has become a word: **IMRaD** --- Introduction, Methods, Results, and Discussion.

The structure did not arrive by committee. It evolved through more than a century of practice, from the discursive narratives of nineteenth-century science toward the standardized format that dominates peer-reviewed journals today. Louis Pasteur's 1876 paper *Etudes sur la biere* is often cited as an early exemplar of what would become IMRaD: Pasteur presented his problem, described his experimental procedures with enough detail to be replicated, reported his observations, and interpreted their meaning --- all in recognizably separate sections. But Pasteur was writing in a tradition that still permitted long digressions, personal asides, and rhetorical flourishes. The compression into rigid sections came later, driven by the explosive growth of scientific publication in the twentieth century. When journals went from publishing dozens of papers per year to thousands, editors needed a standard format that allowed rapid assessment. IMRaD was the solution: a structure optimized for both reading and reviewing.

The **International Committee of Medical Journal Editors (ICMJE)**, formed in 1978 as the Vancouver Group, formalized IMRaD in its *Uniform Requirements for Manuscripts Submitted to Biomedical Journals*. The recommendations --- now called the ICMJE Recommendations --- do not merely suggest IMRaD; they require it for submission to hundreds of biomedical journals worldwide. The structure has since spread far beyond medicine into psychology, ecology, engineering, and computer science. Fields that resist it --- history, literary criticism, certain branches of mathematics --- do so consciously, as a disciplinary identity marker.

What makes IMRaD work is that each section has a different **temporal orientation**, and this is not accidental:

- **Introduction** --- What is known. Past tense and present tense. The literature review establishes the state of knowledge *before* the current work.
- **Methods** --- What was done. Past tense. A record of actions already taken.
- **Results** --- What was found. Past tense. Data presented as observed fact.
- **Discussion** --- What it means. Present tense and future tense. Interpretation, speculation, and implications point forward.

This temporal progression mirrors the scientific method itself: question (what do we not know?), approach (how did we investigate?), findings (what did we observe?), meaning (what does it signify?). The structure is not arbitrary bureaucracy. It is epistemology rendered as document architecture.

---

## 2. Writing the Introduction: The Hourglass and the Niche

The introduction is the paper's invitation. It must accomplish four things in roughly two pages: establish that the topic matters, demonstrate that something about it remains unknown, explain what you did about that gap, and preview how the paper is organized. Miss any of these and the reader drifts away before the methods section.

The dominant rhetorical model for introductions is the **hourglass** (sometimes called the funnel). You begin broad --- the general field, the phenomenon, the problem's significance in the world. You narrow progressively toward the specific gap in current knowledge. At the narrowest point, you state your contribution: what this paper adds. Then you may widen slightly again with a roadmap paragraph that previews the paper's structure.

This pattern is so reliable that it has been formalized into a model that every graduate student in applied linguistics encounters: John Swales' **CARS model** (Create A Research Space), first published in 1990 and refined in 2004. CARS decomposes the introduction into three rhetorical "moves":

**Move 1: Establishing a territory.** You claim the importance of your general research area. You review prior work. You make generalizations about the field. The purpose is to show that the territory exists and that others have worked in it --- that you are joining a conversation, not shouting into a void. Typical language: "X has been extensively studied," "Y is a critical factor in," "Recent advances in Z have enabled."

**Move 2: Establishing a niche.** You identify what is missing, contested, or incomplete in the existing literature. This is the pivot of the entire paper. Without a niche, there is no reason for your paper to exist. Swales identified four strategies for establishing a niche: counter-claiming (previous work is wrong), indicating a gap (previous work is incomplete), question-raising (previous work leaves open questions), or continuing a tradition (previous work points naturally toward the next step). The gap strategy dominates in practice: "However, no study has examined," "Little is known about," "The relationship between X and Y remains unclear."

**Move 3: Occupying the niche.** You state what your paper does to fill the gap you just identified. You outline your purpose, your approach, and your principal findings. This is not the place for hedging. The last paragraph of the introduction must state the paper's contribution explicitly and without ambiguity: "In this paper, we present," "We demonstrate that," "Our results show." A reader who finishes the introduction without knowing exactly what the paper contributes has been failed by the author.

The CARS model is not a rigid template. It is a description of what successful introductions actually do, derived from corpus analysis of thousands of published papers. It works because it mirrors how experts read: they want to know the territory (is this relevant to me?), the niche (is this novel?), and the contribution (is this worth my time?) --- in that order, quickly.

---

## 3. Writing Methods: The Reproducibility Imperative

The methods section serves a single purpose: to enable someone who has never spoken to you to repeat your work and obtain comparable results. This is the **reproducibility imperative**, and it is the ethical foundation of empirical science. A methods section that fails this test is not merely poorly written; it is a breach of the scientific contract.

The tension in methods writing is between **completeness and readability**. A methods section that describes every pipette volume, every software version, every ambient temperature is thorough but unreadable. A methods section that omits critical parameters in the name of brevity is readable but useless. The craft lies in judgment: what must be reported for replication, and what can be assumed or referenced?

The general principle is: **cite if published and unmodified, describe if novel or modified.** If you used a standard protocol --- the Bradford assay for protein quantification, the Kaplan-Meier estimator for survival curves, the Adam optimizer for neural network training --- cite the original publication and note your specific parameters. If you modified a standard protocol --- changed a temperature, added a step, used a different loss function --- describe the modification in detail, because the modification is the part no one can look up.

**Statistical methods** deserve their own subsection, and in many journals they require one. State the tests used, the software and version, the significance threshold, and the rationale for choosing a particular test. If the data violated assumptions (normality, homoscedasticity), say so and describe the alternative or correction applied. The era when "p < 0.05" was sufficient documentation is ending; modern reporting guidelines (CONSORT, STROBE, ARRIVE) demand specificity.

**Ethics statements** have moved from optional footnotes to mandatory sections. Human subjects research requires institutional review board (IRB) or ethics committee approval numbers. Animal research requires IACUC protocol numbers and adherence to guidelines (the 3Rs: Replacement, Reduction, Refinement). Data involving personal information requires statements about informed consent and data anonymization. These are not bureaucratic formalities; they are evidence that the research met the ethical standards the community has agreed upon.

The trend toward **supplementary methods** reflects the modern compromise between journal page limits and reproducibility demands. The main methods section provides enough detail for a reader to understand the approach; the supplementary material provides enough detail for a researcher to replicate it. This two-tier system works well when both tiers are peer-reviewed, but some journals review supplementary materials less rigorously, creating a gap between the paper's claims and the detail available to support them.

---

## 4. Writing Results: Let the Data Speak

The results section presents what you found. It does not explain why you found it --- that is the discussion's job. The discipline of separating observation from interpretation is one of the hardest skills in scientific writing, because the human mind resists it. You ran the experiment *because* you had a hypothesis, and every number you report either supports or contradicts that hypothesis. The temptation to interpret while reporting is constant and must be constantly resisted.

**State findings directly.** Avoid the construction "the results showed that X increased" --- this interposes the results as an agent between the reader and the finding. Instead: "X increased by 23% (95% CI: 18--28%, p < 0.001)." The finding is the subject of the sentence, not the results section.

**Figures and tables** are the load-bearing structures of the results section, and the choice between them is not arbitrary. Tables are for **exact numbers** that the reader may need to look up, compare, or use in calculations: parameter values, demographic breakdowns, model coefficients. Figures are for **patterns and trends** that emerge from data and are perceived visually: time series, dose-response curves, correlation scatterplots, survival curves. A table of 200 means and standard deviations is unreadable; a figure showing the same data as a heatmap or line plot reveals structure instantly. Conversely, a figure showing three numbers is a waste of graphical real estate that would be better served by a sentence.

Edward Tufte's principles of **graphical excellence**, articulated in *The Visual Display of Quantitative Information* (1983), remain the gold standard for figure design:

- **Maximize the data-ink ratio.** Every drop of ink on a figure should represent data. Remove gridlines, chartjunk, unnecessary borders, redundant labels, and decorative elements. A bar chart with a gradient fill, drop shadow, and 3D perspective is not more informative than a plain bar chart --- it is less informative, because the decorations compete with the data for the viewer's attention.
- **Show the data.** Plot individual data points when feasible, not just summary statistics. A bar chart showing two group means hides the distribution, the outliers, the overlap. A strip plot, violin plot, or beeswarm plot shows the same comparison while revealing the data's actual structure.
- **Avoid distortion.** Axes should start at zero for bar charts (truncated axes exaggerate differences). Aspect ratios should not mislead. Dual y-axes are almost always a bad idea --- they allow the author to manipulate the visual relationship between two variables by rescaling one axis.
- **Tell the truth.** The most powerful figure is the one that makes the result obvious at a glance, without requiring the legend to do interpretive work. If the reader must study the figure for a minute to understand it, the figure has failed.

**Descriptive statistics** --- means, medians, standard deviations, ranges, counts --- characterize the data. **Inferential statistics** --- p-values, confidence intervals, effect sizes --- characterize the evidence. Both matter, but the field has moved decisively toward requiring **effect sizes** alongside p-values. A p-value tells you the probability of observing your data (or more extreme data) under the null hypothesis; it says nothing about the magnitude of the effect. A statistically significant result can be trivially small, and a non-significant result can be practically meaningful in a small sample. Report both. Always.

---

## 5. Writing the Discussion: The Reverse Hourglass

If the introduction is an hourglass narrowing from broad context to specific contribution, the discussion is the **reverse hourglass** --- beginning with your specific findings and widening to their broader implications. The discussion answers the question the introduction posed, using the evidence the results section presented.

The first paragraph of the discussion should restate the main finding in plain language, without the statistical apparatus of the results section. Not "the interaction between treatment group and time was significant (F(2,147) = 4.82, p = 0.009)" --- that was in the results. Instead: "Participants in the intervention group showed sustained improvement over six months, while the control group returned to baseline by month three." The finding, stripped to its meaning.

The middle paragraphs **contextualize** the findings within the existing literature. How do your results compare to previous work? Do they confirm, extend, or contradict prior findings? If they contradict, what might explain the discrepancy --- different methods, different populations, different measures? This is where the conversation with the field happens. A discussion that ignores prior work is a monologue. A discussion that engages with it is a contribution.

The art of the discussion is **honesty without self-destruction**. Every study has limitations, and acknowledging them is not a sign of weakness --- it is a sign of intellectual maturity. Reviewers will identify the limitations whether you disclose them or not; the question is whether you demonstrate awareness. But the framing matters enormously. "A limitation of this study is the small sample size (n = 43), which may reduce statistical power for detecting interaction effects" is honest and measured. "Due to the small sample size, our results should be interpreted with extreme caution and may not be reliable" undermines the paper's own contribution. State the limitation, explain its potential impact, and move on. The reader will calibrate their confidence accordingly.

The difference between **"our results suggest"** and **"our results prove"** is the difference between science and salesmanship. Science does not prove; it accumulates evidence. Individual studies provide data points; the scientific consensus emerges from the convergence of many studies across many methods, many populations, and many laboratories. "Suggest," "indicate," "are consistent with," "support the hypothesis that" --- these are the verbs of scientific discussion. "Prove," "demonstrate conclusively," "confirm beyond doubt" --- these are overclaims that peer reviewers will flag and that careful readers will distrust.

The final paragraphs widen to **implications and future work**. What do these findings mean for the field? For practice? For policy? What should the next study investigate? The future work section should be specific enough to be useful --- "future studies should examine X using Y method in Z population" --- not so vague as to be content-free ("further research is warranted").

---

## 6. Abstracts and Titles: The Most-Read Words

For every person who reads your paper, a hundred will read the abstract, and a thousand will read the title. These are the most-read --- and therefore the most important --- parts of any paper. They are also, traditionally, the parts written last and revised least. This is a mistake.

**Abstracts** compress the entire paper into 150--300 words, depending on the journal. Structured abstracts, required by many biomedical journals, enforce IMRaD at the abstract level: separate headings for Background, Methods, Results, and Conclusions. Unstructured abstracts achieve the same coverage without headings, relying instead on a single flowing paragraph. Both formats serve the same function: enabling the reader to decide, within sixty seconds, whether the paper is worth reading in full.

The 250-word constraint is a powerful editorial force. Every word must earn its place. Methodology details that consume a page in the methods section must be reduced to a clause. Results that fill three tables must be summarized in two sentences. The abstract is not a teaser or a preview --- it is a self-contained summary that must include the purpose, the method, the key findings (with numbers, not vague allusions), and the main conclusion. An abstract that ends with "the implications are discussed" instead of stating the implication has wasted its last sentence.

**Titles** fall into three broad categories:

- **Descriptive** --- "A Study of Water Quality in the Columbia River Basin." Safe, informative, but uninspiring. The reader knows the topic but not the finding.
- **Declarative** --- "Urbanization Degrades Water Quality in the Columbia River Basin." Bold, attention-getting, and informative. The reader knows the main finding from the title alone. Some journals discourage this style, considering it premature conclusion.
- **Interrogative** --- "Does Urbanization Degrade Water Quality in the Columbia River Basin?" Engaging, invites curiosity, but reveals nothing about the answer. Useful for controversial or surprising findings where the question itself is compelling.

Modern discoverability adds a pragmatic consideration: **search engine optimization**. A title that uses the specific technical terms a researcher would search for will appear in more literature searches than a clever but vague title. "Machine Learning for Protein Structure Prediction" will be found by more searches than "Teaching Computers to Fold." This is not a call to abandon elegance --- it is a reminder that the title is also a search query, and the first audience is an algorithm.

---

## 7. The Writing Process: From Zero Draft to Finished Paper

The blank page is the universal enemy. Every writer faces it, and every experienced writer has developed strategies for defeating it. The strategies that work for scientific papers are not the same ones that work for fiction, because scientific writing has a structural advantage that fiction lacks: you already know the story. The experiments are done. The data exist. The figures are plotted. The task is not invention but organization and articulation.

The most productive approach, supported by decades of writing research, is the **zero draft** --- a deliberately terrible first version whose only purpose is to get ideas onto the page in any form. Anne Lamott calls these **"shitty first drafts"** in her 1994 book *Bird by Bird*:

> "All good writers write them. This is how they end up with good second drafts and terrific third drafts."

The zero draft gives you material to revise. Revision is where the real writing happens. The zero draft is clay; revision is sculpture. Write the zero draft fast, without stopping to fix sentences, check references, or agonize over word choice. Get the structure and arguments down. Fix everything later.

**Experienced researchers rarely write in linear order.** The most common sequence is:

1. **Methods** first --- because you did these things and can describe them from memory.
2. **Results** next --- because the figures and tables are already made, and the text is largely narration of what they show.
3. **Discussion** --- because now you know what the results are and can interpret them.
4. **Introduction** --- last, because only now do you know what the paper actually says, and the introduction must promise exactly what the paper delivers. Writing the introduction first and the paper second is like writing the table of contents before the book --- you will rewrite it anyway.
5. **Abstract and title** --- dead last, because these summarize the finished product.

Robert Boice's research on academic writing productivity, spanning two decades and summarized in *Professors as Writers* (1990) and *Advice for New Faculty Members* (2000), produced a finding that upends the romantic image of the writer who waits for inspiration and then writes in a frenzy: **daily writers are three to four times more productive than binge writers.** Boice studied faculty across disciplines and found that those who wrote for 30--90 minutes daily --- regardless of mood, regardless of inspiration, regardless of whether they "felt like it" --- produced significantly more pages per week, more publications per year, and reported less anxiety about writing than those who waited for large blocks of time and then tried to produce entire sections in marathon sessions. The binge writers produced less, enjoyed it less, and experienced more writer's block. The daily habit works because it keeps the material active in working memory, reduces the activation energy of starting, and distributes the cognitive load of a complex document across many sessions.

**Letting a draft cool** is the cheapest editorial intervention available. A sentence that seemed brilliant at 2 AM reveals itself as bloated at 10 AM. A paragraph that felt essential turns out to be a tangent. Distance from the text --- a day, a weekend, ideally a week --- restores the reader's perspective that the writer loses during composition. The best editors are cold readers, and the cheapest way to get a cold read is to become one yourself through the passage of time.

---

## 8. LaTeX and Typesetting

Most serious research is typeset in **LaTeX**, the document preparation system created by Leslie Lamport in 1983 as a set of macros on top of Donald Knuth's TeX typesetting engine (1978). LaTeX dominates academic publishing in mathematics, physics, computer science, and engineering for reasons that compound over a career:

- **Mathematical notation.** LaTeX renders equations with a precision and beauty that no word processor matches. The expression `$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$` produces publication-quality typography automatically. In a field where equations are arguments --- where a misplaced subscript can change a proof --- the typographic precision is not cosmetic. It is functional.
- **Bibliography management.** BibTeX (and its successor BibLaTeX) manage references as a database. You cite with `\cite{knuth1984}`, and the bibliography is generated automatically, formatted to any journal's style, with consistent ordering, punctuation, and capitalization. When a journal changes its reference format requirements, you change one style file, not 87 individual references.
- **Journal templates.** Most journals provide LaTeX class files that enforce their formatting requirements: margins, font sizes, heading styles, figure placement. The author writes content; the template handles layout. Switching from one journal's format to another after a rejection is a five-minute operation, not a day-long reformatting exercise.
- **Version control compatibility.** LaTeX files are plain text. They work with Git. They produce meaningful diffs. Two coauthors can merge changes to the same document using standard version control tools. A Word document, by contrast, is a binary format whose change tracking is proprietary, fragile, and produces diffs that are gibberish to version control systems.

**Overleaf** has become the dominant collaborative platform for LaTeX --- a browser-based editor with real-time collaboration, integrated compilation, and Git integration. It is to LaTeX what Google Docs is to Word: a shared workspace that eliminates the "which version is current?" problem. Overleaf's free tier is sufficient for most papers; its institutional licenses are widespread at universities.

The **arXiv** preprint server (arxiv.org), operated by Cornell University, accepts LaTeX source directly. Authors upload their `.tex` files and BibTeX databases, arXiv compiles the document, and the resulting PDF is available to the world within hours. This pipeline --- write in LaTeX, compile locally, upload source to arXiv, submit compiled PDF to a journal --- is the standard workflow in physics, mathematics, and computer science. The arXiv paper appears first; the journal publication, months later, provides peer-review validation.

For computation-adjacent fields --- data science, bioinformatics, certain branches of statistics --- an alternative pipeline has gained traction: **Markdown + Pandoc**. John MacFarlane's Pandoc is a universal document converter that can transform Markdown into LaTeX, HTML, PDF, DOCX, and dozens of other formats. The appeal is lower friction: Markdown syntax is simpler than LaTeX for documents that are mostly prose with occasional equations and code blocks. The tradeoff is less typographic control and weaker handling of complex mathematical notation. For documents where the mathematics is secondary to the narrative, Markdown + Pandoc is increasingly the pragmatic choice.

Our own research pipeline uses both. The `template.tex` files in each research project directory define the typographic identity --- fonts, colors, heading styles, page geometry. The `build.sh` script automates the Pandoc pipeline, converting Markdown research documents to both standalone HTML (for web publication) and PDF (via XeLaTeX, for archival and print). The researcher writes in Markdown; the build system produces publication-quality output in two formats from a single source. This is the principle at work: separate content from presentation, automate the transformation, and never format a document by hand.

---

## 9. The Submission and Revision Cycle

Writing the paper is half the work. Getting it published is the other half, and it requires a different set of skills: strategic thinking, diplomatic writing, emotional resilience, and a thick skin.

**Choosing a journal** is the first strategic decision, and it should be made before the paper is finished, because the target journal's scope, word limits, and formatting requirements shape the writing. The selection factors are:

- **Scope.** Does the journal publish papers on this topic? A paper on machine learning applied to ecology belongs in an ecology journal if the contribution is ecological, or a machine learning journal if the contribution is methodological. Submitting to the wrong scope is the fastest route to a desk rejection.
- **Impact.** Impact factor is a flawed but inescapable metric. Higher-impact journals have lower acceptance rates, longer review times, and more demanding reviewers. The tradeoff is visibility: a paper in *Nature* will be read by a hundred times more people than the same paper in a specialty journal. But a paper in a specialty journal will be read by the *right* people --- the experts in the subfield who will actually use and cite the work.
- **Turnaround.** Review times vary from weeks (some open-access journals) to months (prestigious journals with overworked editors and volunteer reviewers). For time-sensitive results --- emerging pandemics, breaking astronomical events, rapidly moving fields --- turnaround time may be the decisive factor.
- **Open access.** The open access movement has transformed journal economics. Traditional journals charge readers (via subscriptions); open access journals charge authors (via article processing charges, or APCs, typically $1,000--$5,000). Funders increasingly mandate open access, and many researchers prefer it on principle: public money funded the research, so the public should be able to read the results without paying a publisher.

The **cover letter** accompanies the submission and is addressed to the editor-in-chief. It should be brief (one page), state why the paper fits the journal's scope, summarize the main finding in two sentences, confirm that the paper is not under consideration elsewhere, and disclose any potential conflicts of interest. Editors read cover letters as screening tools: a well-written cover letter suggests a well-written paper. A cover letter that does not explain why the paper belongs in *this* journal, as opposed to any other journal in the field, misses its primary purpose.

**Peer review** is the crucible. The editor sends the paper to two or three experts (reviewers, also called referees) who read it critically and submit reports. The possible outcomes are: accept (rare on first submission), minor revisions, major revisions, or reject. Most papers that are eventually published go through at least one round of major revisions.

The **rebuttal letter** (or response to reviewers) is a genre unto itself. Its principles are simple and its execution is difficult:

- **Respond point by point.** Number each reviewer comment and provide a numbered response. Do not summarize or group --- this frustrates reviewers who want to see their specific concerns addressed.
- **Be respectful.** Even when a reviewer has misunderstood the paper, respond as if the misunderstanding is your failure to communicate clearly, not the reviewer's failure to read carefully. "We appreciate this observation and have clarified the text" is better than "The reviewer clearly did not read Section 3."
- **Show the changes.** Quote the revised text in the rebuttal letter so the reviewer can see the fix without hunting through the manuscript.
- **Know when to fight and when to concede.** If a reviewer requests an analysis that would strengthen the paper, do it. If a reviewer requests a change that would weaken the paper --- an incorrect statistical method, an unsupported interpretation --- push back politely, with evidence. Most reviewers are reasonable experts offering honest assessment. Occasional reviewers are adversarial, uninformed, or conflicted. The editor mediates.

**Rejection** is normal. Even excellent papers are rejected: the wrong journal, the wrong timing, a reviewer having a bad day. The professional response is to read the reviews carefully, revise the paper to address legitimate criticisms, and submit to the next journal on your list. The emotional response --- disappointment, frustration, self-doubt --- is also normal, and every productive scientist has learned to experience it, acknowledge it, and then get back to work.

---

## 10. Authorship and Collaboration

Who deserves to be listed as an author? This question generates more conflict, resentment, and ethical complaints than any other aspect of scientific publishing. The answer is codified in the **ICMJE criteria** (the Vancouver criteria), which require that every author meet all four conditions:

1. **Substantial contributions** to the conception or design of the work, or the acquisition, analysis, or interpretation of data.
2. **Drafting the work** or revising it critically for important intellectual content.
3. **Final approval** of the version to be published.
4. **Agreement to be accountable** for all aspects of the work, ensuring that questions related to accuracy or integrity are appropriately investigated and resolved.

All four conditions must be met. Funding alone is not sufficient. Providing laboratory space is not sufficient. Supervising a department is not sufficient. The criteria are deliberately strict to prevent the two most common abuses: **gift authorship** (listing someone who did not contribute, typically a senior colleague or department chair, as a political courtesy) and **ghost authorship** (omitting someone who did contribute, typically a junior researcher or a professional writer, to enhance the apparent authorship of the remaining names).

**Author ordering** conventions vary by discipline and carry implicit meaning:

- **First author** --- did the most work, typically the person who designed and conducted the experiments and wrote the first draft. In many fields, this is a graduate student or postdoctoral researcher.
- **Last author** --- supervised the work, provided funding and intellectual direction, and is typically the principal investigator (PI) of the laboratory. In biomedical sciences, the last position is the most prestigious for senior researchers.
- **Middle authors** --- contributed to specific aspects (data collection, statistical analysis, reagent provision) but were not the primary drivers of the work.
- **Corresponding author** --- handles communication with the journal and readers post-publication. Often the last author, sometimes the first author, occasionally both.

These conventions are not universal. In mathematics and theoretical physics, authors are listed alphabetically by convention, and no positional inference is drawn. In high-energy physics, collaborations of thousands of physicists list all members alphabetically, and authorship reflects membership in the collaboration rather than individual contribution to a specific paper.

The **CRediT taxonomy** (Contributor Roles Taxonomy), developed by CASRAI and adopted by an increasing number of journals, provides a more granular alternative. CRediT defines 14 contributor roles: Conceptualization, Data curation, Formal analysis, Funding acquisition, Investigation, Methodology, Project administration, Resources, Software, Supervision, Validation, Visualization, Writing (original draft), and Writing (review and editing). Each contributor is listed with their specific roles, replacing the ambiguous signal of author ordering with explicit attribution. A paper's CRediT statement might read: "A.B.: Conceptualization, Methodology, Writing (original draft). C.D.: Investigation, Data curation. E.F.: Formal analysis, Visualization. G.H.: Supervision, Funding acquisition, Writing (review and editing)." This transparency does not eliminate authorship disputes, but it makes the nature of each person's contribution visible.

---

## 11. Our Connection

Our research pipeline is itself a paper factory, and understanding the craft of scientific writing illuminates why the pipeline is structured the way it is.

The **research-mission-generator** skill produces structured documents following a five-stage pipeline: decompose the topic into researchable sub-questions, conduct parallel research across those sub-questions, aggregate findings into a coherent body of evidence, structure the document according to an appropriate format (IMRaD for empirical work, thematic for surveys, chronological for histories), and build the output through the Pandoc pipeline to HTML and PDF. Each stage mirrors a step in the traditional paper-writing process: the decomposition is the literature review and gap analysis, the parallel research is the investigation, the aggregation is the synthesis, the structuring is the drafting, and the build is the typesetting.

Our **LaTeX template** (`template.tex`) enforces consistent formatting across all research projects --- fonts, colors, heading styles, page geometry, table formatting, and bibliography styling. This is the same principle that journal class files embody: separate content from presentation, enforce consistency mechanically rather than manually, and ensure that every research document produced by the system meets a baseline typographic standard. The template uses XeLaTeX for modern font handling and defines a brand-consistent color palette derived from each project's visual identity.

Our **build script** (`build.sh`) automates the Pandoc pipeline, converting Markdown research documents to both standalone HTML and PDF from a single source file. The researcher writes content in Markdown; the build system handles the transformation. This dual-output approach reflects the reality of modern research dissemination: HTML for web publication and discoverability, PDF for archival and citation.

The gsd-skill-creator system has produced over **190 research projects**, each following a structured methodology, each producing documents that adhere to the principles described in this paper. The research methodology series itself --- of which this document is a part --- is an exercise in the craft it describes: structured, cited, revised, and built through the same pipeline it documents. The system is recursive. The tools that produce research are themselves subjects of research, and the research they produce improves the tools that produced it.

---

## References

1. Pasteur, L. *Etudes sur la biere.* Gauthier-Villars, 1876.
2. International Committee of Medical Journal Editors. "Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work in Medical Journals." ICMJE, 2023. https://www.icmje.org/recommendations/
3. Swales, J.M. *Genre Analysis: English in Academic and Research Settings.* Cambridge University Press, 1990.
4. Swales, J.M. *Research Genres: Explorations and Applications.* Cambridge University Press, 2004.
5. Tufte, E.R. *The Visual Display of Quantitative Information.* 2nd ed. Graphics Press, 2001 (originally 1983).
6. Lamott, A. *Bird by Bird: Some Instructions on Writing and Life.* Anchor Books, 1994.
7. Boice, R. *Professors as Writers: A Self-Help Guide to Productive Writing.* New Forums Press, 1990.
8. Boice, R. *Advice for New Faculty Members: Nihil Nimus.* Allyn & Bacon, 2000.
9. Lamport, L. *LaTeX: A Document Preparation System.* 2nd ed. Addison-Wesley, 1994.
10. Knuth, D.E. *The TeXbook.* Addison-Wesley, 1984.
11. MacFarlane, J. "Pandoc: A Universal Document Converter." https://pandoc.org/
12. Brand, A., et al. "Beyond authorship: attribution, contribution, collaboration, and credit." *Learned Publishing* 28.2 (2015): 151--155.
13. CASRAI. "CRediT --- Contributor Roles Taxonomy." https://credit.niso.org/
14. Day, R.A. "The Origins of the Scientific Paper: The IMRaD Format." *AMWA Journal* 4.2 (1989): 16--18.
15. Schulz, K.F., et al. "CONSORT 2010 Statement: Updated guidelines for reporting parallel group randomised trials." *BMJ* 340 (2010): c332.

---

*Part of the Research Methodology series. See also other documents in `docs/research/research-methodology/`.*
