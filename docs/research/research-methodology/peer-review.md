# Peer Review

*The imperfect gatekeepers of science -- and why we still need them*

---

## 1. Origins: The Royal Society and the Invention of Scientific Editing

The history of peer review begins not with peer review at all, but with a man deciding what was worth printing.

**Henry Oldenburg** -- a German-born diplomat, polyglot, and Secretary of the Royal Society of London -- launched *Philosophical Transactions* on March 6, 1665. It was the world's first scientific journal, and Oldenburg was its sole editor, publisher, translator, and quality filter. There was no board of reviewers. There was no formal evaluation process. There was Oldenburg, reading submissions, selecting what he found credible or interesting, and publishing it under the Society's imprimatur. The journal was, in a real sense, his personal curation project -- one man's judgment about what counted as natural philosophy worth sharing.

This editorial model persisted for centuries. The Royal Society did not establish a formal committee-based review process until 1832, when it adopted a system requiring that papers be evaluated by members before acceptance. Even then, the process bore little resemblance to modern peer review. Papers were assessed by fellows who might or might not have expertise in the relevant domain. The question was less "is this methodologically sound?" and more "is this interesting enough for the Society?"

The shift toward **external expert review** -- sending manuscripts to specialists outside the editorial board -- developed unevenly across journals throughout the nineteenth and early twentieth centuries. Many journals relied on editorial judgment alone well into the mid-twentieth century. *Nature*, founded in 1869, did not adopt systematic external peer review until 1973. *The Lancet* followed its own idiosyncratic path. The process that scientists today treat as ancient and immutable is, in fact, younger than the transistor.

Perhaps the most telling anecdote comes from **Albert Einstein**. In 1936, Einstein submitted a paper to *Physical Review* arguing that gravitational waves do not exist (he was wrong, as LIGO would demonstrate eighty years later). The editor, John Tate, sent the manuscript to an anonymous reviewer -- the cosmologist Howard Percy Robertson -- who returned ten pages of critical comments identifying a mathematical error. Einstein was furious. He wrote back to Tate:

> "I see no reason to address the -- in any case erroneous -- comments of your anonymous expert. On the basis of this incident I prefer to publish the paper elsewhere."

Einstein withdrew the paper and sent it to the *Journal of the Franklin Institute*, which published it without review. He later corrected the mathematical error (Robertson's criticism had been right), reversed his conclusion, and published a corrected version acknowledging that gravitational waves do exist. But he never submitted to *Physical Review* again. The notion that a journal would show his work to unnamed "specialists" before publication struck him as an insult. He had not authorized it. He did not accept it.

Einstein's reaction reveals something important: the idea that scientific work should be evaluated by anonymous peers before publication was not, even in 1936, a universally accepted norm. It was a practice some journals used and others did not. The consensus that peer review is the **standard mechanism** for validating scientific work is a post-World War II development, consolidating in the 1960s and 1970s as research funding expanded, journal counts multiplied, and institutions needed a scalable way to distinguish credible work from the growing flood of submissions.

---

## 2. The Modern System: How Peer Review Actually Works

The mechanics of modern peer review are deceptively simple.

An author submits a manuscript to a journal. The **editor** -- or an associate editor handling a subdomain -- performs a desk screening: Is this within the journal's scope? Is it complete? Is it obviously flawed or trivial? Many manuscripts are desk-rejected at this stage without external review, a fact that surprises researchers who have never served as editors.

If the manuscript passes desk screening, the editor selects **two to four reviewers** with relevant expertise. In most fields, reviewers are identified through a combination of the editor's professional network, the manuscript's reference list, and increasingly, algorithmic matching tools. Reviewers are invited, not assigned -- they can decline, and many do. Finding willing reviewers is one of the most time-consuming parts of an editor's job. A 2020 survey by *Publons* (now part of Clarivate) found that the median time to find two willing reviewers for a manuscript was 17 days.

Reviewers assess the manuscript along several dimensions: **originality**, **methodological soundness**, **clarity of presentation**, **appropriate citation** of prior work, and **significance of contribution**. They produce a written report recommending one of four outcomes: accept, minor revisions, major revisions, or reject. The editor synthesizes reviewer reports and makes a decision, which may or may not align with any individual reviewer's recommendation.

If revisions are requested, the author revises and resubmits, often with a point-by-point response to each reviewer comment. The revised manuscript may go back to the original reviewers or may be evaluated by the editor alone. This cycle can repeat multiple times.

**Turnaround time** varies enormously. In mathematics, review cycles of twelve to eighteen months are not unusual. In biomedical sciences, many journals aim for initial decisions within six to eight weeks, though delays of three to six months are common. In computer science, the primary peer review mechanism is conference proceedings rather than journals, with review cycles of two to four months tied to submission deadlines.

The entire system runs on **unpaid labor**. Reviewers are volunteers. They receive no compensation from journals. They are motivated by professional obligation, intellectual curiosity, the desire to stay current in their field, and -- less charitably -- the opportunity to see competitors' work before publication. A 2018 study published in *Research Integrity and Peer Review* estimated that the global value of unpaid reviewer labor exceeds $1.5 billion annually.

The reviewing burden is not evenly distributed. A 2017 analysis by Kovanis et al. found that approximately **10% of active researchers** produce roughly **50% of all reviews**. These are the "super-reviewers" -- often mid-career scientists who cannot easily refuse requests from editors at journals where they hope to publish. Senior researchers can be more selective about which invitations they accept. Junior researchers are often not asked at all. The result is a system where quality control depends on the goodwill and stamina of a relatively small cohort of overburdened volunteers.

---

## 3. Models: The Spectrum from Blind to Open

Peer review is not one system. It is a family of systems with different assumptions about transparency, accountability, and bias.

### Single-Blind Review

The **default model** in most scientific journals. Reviewers know the authors' identities; authors do not know who reviewed their work. The rationale is that knowledge of the author's identity helps reviewers contextualize the work -- is this coming from a lab with the right equipment? Does this group have a track record in this area? -- while anonymity protects reviewers from retaliation by authors who receive negative reviews.

The problem is obvious: knowing the author's identity introduces bias. A submission from a Nobel laureate at Harvard receives a different first impression than an identical submission from an unknown researcher at a regional university in a developing country. The **Matthew effect**, named by sociologist Robert K. Merton after the Gospel of Matthew ("For to every one who has will more be given"), describes this phenomenon precisely: established researchers receive disproportionately favorable treatment because they are already established.

### Double-Blind Review

Both the authors' and reviewers' identities are concealed. Widely used in social sciences, economics, and some computer science venues. The goal is to eliminate bias by forcing evaluation of the work on its own merits.

In practice, double-blinding is imperfect. In specialized subfields, writing style, methodology choices, dataset access, and self-citations often make author identity guessable. A 2017 study by Tomkins, Zhang, and Heavlin, analyzing double-blind review at a major computer science conference (WSDM), found that reviewers could correctly identify authors approximately **25-40% of the time** when they tried. The mask leaks. But even a leaky mask reduces bias: the same study found that single-blind reviewers gave significantly higher scores to papers from top institutions and famous authors compared to double-blind reviewers evaluating the same papers.

### Open Peer Review

Everyone knows everyone. Authors know their reviewers. Reviewers know they will be identified. Some implementations publish the reviews alongside the paper. **The BMJ** (British Medical Journal) adopted open peer review in 1999. *F1000Research* publishes all reviews with full attribution. *eLife* moved in 2023 to a model where all submitted manuscripts that pass desk screening are published as preprints with the full editorial assessment and public reviews, effectively making the review process itself a published document.

The argument for open review is accountability: named reviewers write more constructive, more careful reviews because their reputations are attached. The argument against is that junior reviewers may self-censor when reviewing work by powerful senior figures in their field -- the very dynamic that anonymity was designed to prevent.

### Post-Publication Peer Review

Publish first, review after. This model inverts the traditional sequence. The work is made public -- typically as a preprint -- and evaluation happens afterward through community response, formal commentary, or structured platforms like **PubPeer**. The COVID-19 pandemic dramatically accelerated adoption of this model, as preprints on *medRxiv* and *bioRxiv* became the primary vehicle for disseminating urgent research before traditional peer review could complete.

The advantage is speed. The risk is that unreviewed work enters public discourse and informs policy before its flaws are identified -- a dynamic that played out repeatedly during the pandemic, when preprints with serious methodological problems were amplified by media outlets and used to justify public health decisions.

### Community Review

A hybrid model exemplified by **PLoS ONE**, launched in 2006. PLoS ONE asks reviewers to assess only **methodological soundness**, not perceived significance or novelty. If the methods are valid, the paper is published. The community then decides its importance through citations, commentary, and replication. This model decouples the question "is this correct?" from the question "is this important?" -- arguing that the latter is not a question peer reviewers can reliably answer at the time of publication, and that history is full of papers initially dismissed as trivial that later proved foundational.

---

## 4. What Peer Review Catches -- and What It Doesn't

Peer review is good at catching certain categories of problems. It catches **methodological errors** that are visible in the manuscript: inappropriate statistical tests, missing control conditions, conclusions that do not follow from the data as presented, logical gaps in theoretical arguments. It catches **missing citations** -- reviewers are often selected because they are experts in exactly the area the paper addresses, and they know when relevant prior work has been ignored. It catches **clarity problems** -- unclear writing, ambiguous figures, missing details needed for reproducibility. These are genuine and valuable contributions to scientific quality.

What peer review does not reliably catch is **fraud**.

The reason is structural. Peer reviewers evaluate the manuscript as a document. They do not have access to raw data. They do not visit the laboratory. They do not rerun experiments. They do not audit statistical code. They assess the plausibility of what is written, not the fidelity of what was done. A reviewer can identify that an analysis is described incorrectly. A reviewer cannot identify that the data underlying a correctly described analysis was fabricated.

**Subtle statistical manipulation** is particularly difficult to detect. P-hacking -- running multiple analyses and reporting only those that produce significant results -- leaves no obvious trace in a finished manuscript. HARKing (Hypothesizing After Results are Known) -- formulating hypotheses to match observed results and presenting them as if they were predicted in advance -- is invisible to reviewers who were not present during the research design phase. Selective outcome reporting -- measuring ten variables and reporting only the two that showed effects -- is detectable only if the reviewer knows the full protocol, which they typically do not.

Peer review validates **plausibility**, not **truth**. It asks: given what is described, are the methods appropriate and the conclusions logical? It does not ask: did the described events actually occur? This distinction is the root of most misunderstandings about what "peer-reviewed" means.

---

## 5. Famous Failures

### The Sokal Affair (1996)

**Alan Sokal**, a physicist at New York University, submitted an article titled "Transgressing the Boundaries: Towards a Transformative Hermeneutics of Quantum Gravity" to *Social Text*, a postmodernist cultural studies journal. The paper was a deliberate hoax -- a tissue of scientific-sounding nonsense, meaningless jargon, and absurd claims (including the assertion that physical reality is a social construct) larded with approving citations of the journal's editorial board. *Social Text* published it without peer review in their Spring/Summer 1996 "Science Wars" issue. Sokal revealed the hoax on the day of publication in *Lingua Franca*.

The Sokal affair is often cited as a failure of peer review, but *Social Text* did not use peer review at the time -- it was an editorial-selection journal. What the affair actually demonstrated was the danger of **authority-mediated acceptance**: the editors accepted a paper from a physicist because a physicist lending support to their theoretical framework was flattering, and they lacked the scientific expertise to evaluate the content. The lesson is about competence boundaries, not peer review per se.

### The Bogdanov Affair (2002)

**Igor and Grichka Bogdanov**, French television personalities with physics PhDs, published a series of papers on quantum cosmology and topological field theory in peer-reviewed physics journals including *Annals of Physics*, *Classical and Quantum Gravity*, and *Czechoslovak Journal of Physics*. The papers were dense with mathematical formalism but, according to many physicists who examined them, contained little or no meaningful physical content. The debate over whether the papers were intentional hoaxes, sincere but incompetent research, or something in between was never fully resolved.

What is clear is that the peer review system at multiple journals failed to identify the papers as problematic. The Bogdanov affair exposed the difficulty of reviewing work at the boundaries of established fields, where exotic formalism can obscure a lack of substance. When the mathematics is sufficiently complex and the topic sufficiently esoteric, even specialist reviewers may be reluctant to declare a paper nonsensical.

### Diederik Stapel (2011)

**Diederik Stapel**, a prominent Dutch social psychologist and dean of the School of Social and Behavioral Sciences at Tilburg University, fabricated data in at least **58 published papers** over a period of nearly two decades. His work was influential and widely cited -- he published on topics like how messy environments promote discrimination and how meat-eating makes people less social. None of it was real. He invented participants, fabricated datasets, and produced results that consistently confirmed appealing hypotheses.

Every one of those 58 papers passed peer review. The fabricated data was clean, the statistical analyses were correctly performed (on nonexistent data), and the conclusions followed logically from the invented results. Peer review cannot catch fraud this sophisticated because the manuscripts were, as documents, impeccable. Stapel was caught not by reviewers but by three junior researchers in his own department who noticed statistical irregularities in data they had been given.

### Jan Hendrik Schon (2002)

**Jan Hendrik Schon**, a physicist at Bell Labs, published a series of extraordinary papers in *Science* and *Nature* claiming breakthroughs in organic semiconductors and superconductors. At his peak he was publishing a paper every eight days. His results, if true, would have represented multiple Nobel-caliber discoveries. They were not true. Schon fabricated data wholesale, in some cases reusing identical graphs with different axis labels in different papers.

The fraud was uncovered not by peer reviewers but by external physicists who noticed that figures in different papers -- purportedly showing results from different experiments on different materials -- contained identical noise patterns. The probability of two independent experiments producing identical random noise is effectively zero. Bell Labs convened an independent committee chaired by Malcolm Beasley of Stanford, which confirmed fabrication in at least 16 papers. Schon's PhD was revoked by the University of Konstanz in 2004.

---

## 6. The Replication Crisis Connection

Beginning around 2011, a series of large-scale replication projects revealed that many published, peer-reviewed findings could not be reproduced.

The **Open Science Collaboration** (2015) attempted to replicate 100 studies from three high-profile psychology journals. Only **36%** produced statistically significant results in the same direction as the original. Effect sizes in successful replications were, on average, half the magnitude of the originals. The **Reproducibility Project: Cancer Biology** (2021) attempted to replicate 50 high-impact preclinical cancer biology studies; only 46% of effects were successfully replicated.

These results do not mean that 64% of psychology research or 54% of cancer biology research is wrong. Replication failure has many causes: different populations, different conditions, insufficient statistical power in either the original or the replication. But the scale of the problem makes clear that **peer review approved a great deal of work that does not hold up under scrutiny**.

The replication crisis revealed the gap between what the public believes "peer-reviewed" means and what it actually means. To a lay reader, "this study was peer-reviewed" sounds like "this study has been verified." To a scientist, it means "two or three people read the manuscript and found no obvious problems." These are very different claims. Peer review is a filter for gross error and methodological incompetence. It is not a guarantee of truth. It was never designed to be one. But the language surrounding it -- "peer-reviewed research," deployed as a rhetorical trump card -- implies a level of validation that the system does not and cannot provide.

The gap between "peer-reviewed" and "true" is wider than the public believes. Closing that gap requires not better peer review but complementary mechanisms: preregistration, open data, replication incentives, and a cultural shift away from treating publication in a peer-reviewed journal as the end of the validation process rather than the beginning.

---

## 7. Bias in Peer Review

Peer review is performed by humans, and humans carry biases. The literature on bias in peer review is extensive and troubling.

**Bias against negative results.** Journals and reviewers preferentially accept studies that report positive findings -- statistically significant effects, confirmed hypotheses, novel discoveries. Studies that report null results or failed replications are systematically harder to publish, even when they are methodologically superior to the positive-result studies they contradict. This creates a **publication bias** that distorts the scientific literature, making effects appear larger and more consistent than they actually are.

**Institutional and geographic bias.** Studies have documented that reviewers rate manuscripts more favorably when they come from prestigious institutions and wealthy countries. A 2007 study by Tomkins et al. using data from computer science conferences found that papers from top-25 institutions received significantly higher scores than equivalent papers from other institutions, even under double-blind conditions. Ross et al. (2006) found similar effects in medical journal peer review.

**Gender bias.** In a landmark 1997 study, Wennerström found that female applicants to the Swedish Medical Research Council needed to be 2.5 times more productive than male applicants to receive the same peer review scores. More recent studies have produced mixed results -- some finding persistent bias, others finding no significant effect -- but the question remains open and the methodological challenges of studying it are substantial. What is clear is that the composition of reviewer pools is not representative: women, early-career researchers, and scholars from the Global South are underrepresented among reviewers, meaning the system's biases are shaped by the demographics of those who do the reviewing.

**The Matthew effect.** Merton's concept applies directly: established researchers benefit from a halo effect. Their work is assumed to be important because their prior work was important. Their methodological choices are given the benefit of the doubt. Their papers are reviewed by colleagues who know them professionally. None of this is corruption -- it is human cognition operating as human cognition operates. But it means the system is not the meritocratic filter it claims to be.

**Bias against unfamiliar methods.** Reviewers tend to be skeptical of methodologies they do not use themselves. Qualitative researchers reviewing quantitative work (and vice versa), frequentists reviewing Bayesian analyses, experimentalists reviewing observational studies -- in each case, unfamiliarity breeds suspicion. This conservatism can protect the literature from genuinely flawed methods, but it also retards the adoption of valid innovations.

---

## 8. Alternatives and Reforms

The peer review system is under more pressure for reform than at any point in its history.

### Registered Reports

Introduced by Chris Chambers and adopted by over 300 journals, **Registered Reports** split peer review into two stages. In Stage 1, authors submit their research question, hypotheses, and methodology *before collecting data*. Reviewers evaluate the design. If the design is sound, the journal commits to publishing the results regardless of outcome. In Stage 2, after data collection, reviewers verify that the protocol was followed. This model eliminates publication bias by decoupling the publication decision from the results. It also eliminates HARKing, p-hacking, and selective reporting, because the hypotheses and analysis plan are locked before the data exists.

### Preprint Servers

**arXiv** (launched 1991 by Paul Ginsparg at Los Alamos) demonstrated that rapid, open dissemination of research is possible without traditional peer review. arXiv does not perform peer review -- it screens for basic quality and topical relevance -- but it has become the primary venue for initial dissemination in physics, mathematics, and computer science. **bioRxiv** (2013) and **medRxiv** (2019) extended the model to biology and medicine. Preprints do not replace peer review, but they decouple dissemination from evaluation, allowing the community to engage with work months or years before formal publication.

### Overlay Journals

A radical simplification: an **overlay journal** is a journal with no content of its own. It provides peer review for preprints already posted on a preprint server. If a preprint passes review, the overlay journal "publishes" it by linking to the existing preprint with an editorial endorsement. This model eliminates the cost of hosting and formatting while preserving the curation function of peer review. *Discrete Analysis*, a mathematics journal launched by Fields Medalist Timothy Gowers in 2016, is the most prominent example.

### Post-Publication Review: PubPeer

**PubPeer**, launched in 2012, allows anonymous commentary on published papers. It has become a primary mechanism for identifying image manipulation, statistical anomalies, and other problems in published work. PubPeer comments have led to hundreds of retractions. The platform demonstrates that meaningful quality control can occur after publication, driven by community engagement rather than editorial assignment.

### AI-Assisted Review

Machine learning tools are increasingly used to assist peer review -- detecting plagiarism, checking statistical reporting, identifying potential image manipulation, and even generating preliminary assessments of manuscript quality. These tools supplement rather than replace human review. The danger is over-reliance on automated screening that catches surface problems while missing substantive flaws, and the risk that authors will optimize their manuscripts to pass automated checks rather than to be genuinely sound.

### eLife's 2023 Model Change

In January 2023, the journal **eLife** eliminated accept/reject decisions entirely. Under the new model, all manuscripts that pass desk screening are published as "Reviewed Preprints" on the eLife platform, accompanied by the editors' public assessment and the full reviews. Authors can revise in response to reviews, and revised versions are published alongside the originals. The model treats peer review as a service to authors and readers -- providing expert assessment -- rather than as a gatekeeping function that determines what is and is not published. It is the most radical departure from traditional peer review attempted by a major journal, and its long-term effects are still unfolding.

---

## 9. Our Connection: Peer Review in Code

The same dynamics that shape scientific peer review shape code review.

GSD's `/gsd:review` and `adversarial-pr-review` skills implement peer review for software: one agent writes code, another evaluates it. The reviewing agent assesses correctness, clarity, and adherence to project standards -- the same dimensions a journal reviewer assesses for manuscripts. And the same biases apply.

**Confirmation bias** is the most dangerous. A reviewer who expects code to work will find reasons it works. A reviewer who wrote the specification will read the implementation through the lens of what they intended, not what was actually written. This is why adversarial review -- review by an agent specifically tasked with finding problems -- is more effective than collegial review. The Sokal affair teaches us that uncritical acceptance is the default when the work aligns with the reviewer's priors.

**Authority bias** operates in code review as in journal review. Code written by a senior engineer receives less scrutiny. Suggestions from junior reviewers are more easily dismissed. The Matthew effect is alive in every pull request thread where a principal engineer's "LGTM" ends discussion that a junior developer's identical approval would not.

**Bias against unfamiliar methods** appears when reviewers encounter patterns or paradigms outside their experience. A reviewer steeped in object-oriented design may flag functional patterns as suspicious. A reviewer who has never used property-based testing may reject it in favor of example-based tests they understand.

The lesson of peer review's history is not that it fails -- it is that it fails in predictable ways. Knowing the failure modes makes it possible to compensate for them. We guard against confirming what we expect. We look for what we do not expect. We treat review as a necessary imperfection, not a certification of correctness.

Science built peer review not because it is perfect, but because every alternative tried so far is worse. The same logic applies to code review. The gatekeepers are imperfect. We still need them. The work is to make them less imperfect, one review at a time.

---

## 10. Addendum: The 2025 AI peer-review crisis

This section was added in April 2026 as part of a catalog-wide enrichment
pass. The body above treats peer review as a mature institution with
predictable failure modes. The 2024–2025 AI-research literature has put
that framing under concrete stress: the volume of AI conference
submissions has grown faster than the reviewer pool can absorb, and
LLMs have created a new failure mode the body does not cover —
LLM-generated reviews. Both are worth recording.

### The submission volume crisis

**ICML submissions rose 48% year-on-year** from 6,538 in 2023 to
9,653 in 2024, and continued climbing through the 2025 cycle. NeurIPS
and ICLR showed similar growth. The exponential curve has outpaced
the reviewer pool, which grows roughly linearly with the tenure-track
PhD pipeline. The result is reviewer fatigue, reviewer underqualification
(reviewers assigned to papers far from their area because the queue
must be cleared), and reviews of declining depth.

ICML 2025's own position papers — notably "The AI Conference Peer
Review Crisis Demands Author Feedback and Reviewer Rewards" and
"The Current AI Conference Model is Unsustainable!" — argue that
the model of centralized mega-conferences with one-way review
feedback is not structurally sustainable at the current submission
growth rate. The proposed reforms include **bidirectional feedback
loops** (authors evaluate review quality), **formal reviewer
accreditation**, **reviewer rewards** tied to visible quality
metrics, and in some proposals **distributed or federated venue
models** to redistribute load away from the top-three-conference
bottleneck.

**Sources:** [Position: The AI Conference Peer Review Crisis Demands Author Feedback and Reviewer Rewards — ICML 2025 poster / arXiv 2505.04966](https://arxiv.org/html/2505.04966v1) · [Position: The Current AI Conference Model is Unsustainable! — arXiv 2508.04586](https://arxiv.org/html/2508.04586v1) · [ICML 2025 Call for Papers — icml.cc](https://icml.cc/Conferences/2025/CallForPapers) · [ICML 2025 Position Paper: Why AI Peer Review Is Crumbling — CSPaper Forum](https://forum.cspaper.org/topic/75/icml-2025-position-paper-why-ai-peer-review-is-crumbling-and-what-we-can-do-about-it)

### LLM-generated reviews as a new failure mode

The more insidious development is **LLM-generated reviews**: reviewers
using LLMs to draft or produce complete reviews of papers they have
not fully read. The APA philosophy blog's November 2025 piece "LLM
Usage and Manipulation in Peer Review" and related 2025 writing
converge on a set of observations:

1. **LLMs can't understand novel computer science papers.** As of
   2025, frontier LLMs produce output that looks like a review — has
   the right structure, mentions things from the paper, ends with a
   plausible accept/reject verdict — but cannot actually assess
   novelty, correctness, or significance for work that is by
   definition outside the pretraining corpus.
2. **The outputs are detectable in aggregate but not per-review.**
   Reviewer identity is confidential; individual LLM-drafted reviews
   are hard to call out; but the aggregate pattern (reviews that
   hallucinate citations, reviews that miss obvious issues, reviews
   that use characteristic LLM phrasing) is visible.
3. **Conferences are responding with explicit policies.** **CVPR
   2025** introduced strict rules prohibiting any use of LLMs in
   review writing or translation; violators risk desk rejections of
   their own submissions. **ICLR 2025** requires authors to disclose
   LLM usage in the writing process, as a transparency measure that
   parallels the CoI disclosures peer review already had.
4. **Positive applications exist.** A randomized study of 20,000
   reviews at **ICLR 2025** found that 27% of reviewers who received
   AI *feedback on their own reviews* updated them, and that the
   updated reviews were on average **80 words longer** and more
   informative. The pattern that seems to work is "LLM helps the
   reviewer write a better review," not "LLM generates the review."

**Sources:** [The AI Imperative: Scaling High-Quality Peer Review in Machine Learning — arXiv 2506.08134](https://arxiv.org/html/2506.08134v1) · [LLM Usage and Manipulation in Peer Review — APA Blog, November 13, 2025](https://blog.apaonline.org/2025/11/13/llm-usage-and-manipulation-in-peer-review/) · [What Happens When Reviewers Receive AI Feedback in Their Reviews? — arXiv 2602.13817](https://arxiv.org/html/2602.13817v1) · [Can LLM feedback enhance review quality? A randomized study of 20K reviews at ICLR 2025 — ResearchGate](https://www.researchgate.net/publication/390773344_Can_LLM_feedback_enhance_review_quality_A_randomized_study_of_20K_reviews_at_ICLR_2025)

### What this means for section 9's code-review framing

The body's Section 9 maps peer review onto code review, and argues
that the same bias patterns (confirmation, authority, unfamiliarity)
operate in both contexts. The 2025 AI-peer-review data confirms the
mapping and adds two new ones:

- **Volume pressure + AI assistance** is a pattern that code review
  is already experiencing. Open-source projects are seeing
  LLM-generated pull requests in volumes that their maintainer pools
  cannot absorb, and AI-assisted code reviews are being piloted in
  most major platforms. The dynamics look identical to the AI
  conference peer-review crisis one architectural layer down.
- **LLM-generated reviews** are a code-review failure mode too. An
  LLM-generated code review can produce plausible-looking commentary
  that missed the actual subtle bug, for exactly the reason an
  LLM-generated paper review can produce plausible-looking feedback
  that missed the actual contribution.

The practical response — "LLM helps the reviewer write a better
review, not LLM generates the review" — should be adopted as
standing guidance for code review as well. Adversarial review
remains more effective than collegial review; AI-assisted review
is more effective than AI-generated review; and the reviewer's
understanding of the work is non-delegable.

---

*Further reading: Biagioli, M. "From Book Censorship to Academic Peer Review" (2002). Baldwin, M. "Making Nature: The History of a Scientific Journal" (2015). Csiszar, A. "The Scientific Journal: Authorship and the Politics of Knowledge in the Nineteenth Century" (2018). Lee, C.J. et al. "Bias in Peer Review" in JASIST (2013). Chambers, C. "The Seven Deadly Sins of Psychology" (2017).*

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**critical-thinking**](../../../.college/departments/critical-thinking/DEPARTMENT.md)
  — Research methodology is applied critical thinking, and the
  peer-review bias analysis is a canonical critical-thinking
  exercise.
- [**writing**](../../../.college/departments/writing/DEPARTMENT.md)
  — The companion `writing-papers.md` file in this bucket is
  squarely in the writing department's scope.
- [**digital-literacy**](../../../.college/departments/digital-literacy/DEPARTMENT.md)
  — Source evaluation, citation practice, and bias recognition are
  foundational digital-literacy topics.
- [**philosophy**](../../../.college/departments/philosophy/DEPARTMENT.md)
  — Epistemology of research, the scientific method, and the
  AI-era questions about what counts as knowledge are
  philosophy-department topics.

---

*Section 10 (The 2025 AI peer-review crisis) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*
