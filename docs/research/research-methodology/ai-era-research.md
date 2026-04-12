# Research in the AI Era

*When your research assistant can hallucinate — what do we preserve, what do we change?*

---

## 1. The AI-Assisted Literature Review

The traditional literature review is an act of patient labor. You choose a topic, search databases (PubMed, Web of Science, Scopus, Google Scholar), read abstracts, chase citations, read full papers, take notes, synthesize, and eventually produce a narrative that maps the state of knowledge in your field. It takes weeks or months. It requires domain expertise to evaluate quality, spot methodological weaknesses, and distinguish genuinely novel contributions from incremental repackaging. It is, by design, slow — because the slowness is the point. The time you spend reading is the time you spend thinking.

A new generation of AI-powered tools is compressing this process by orders of magnitude. They deserve serious examination, because they represent a genuine shift in how humans interact with the scientific literature — and because they introduce failure modes that the traditional process did not have.

**Semantic Scholar** (semanticscholar.org), developed by the Allen Institute for AI, indexes over 200 million academic papers with AI-extracted metadata: citation contexts, research topics, methodological classifications, influence scores. Its TLDR feature generates one-sentence summaries of papers. Its citation graph is among the most comprehensive available. It is, at its core, a search engine that understands what papers are *about* rather than merely which words they contain.

**Elicit** (elicit.com) goes further. It takes a natural-language research question — "Does intermittent fasting reduce inflammation markers in humans?" — and returns a table of relevant papers with extracted findings, sample sizes, methodologies, and effect sizes. It is, effectively, an automated systematic review assistant. For a researcher beginning work in an unfamiliar area, the time savings are extraordinary. What once required a trained research librarian and weeks of screening now takes minutes.

**Consensus** (consensus.app) specializes in synthesizing findings across studies to answer yes/no questions with confidence meters. **Connected Papers** generates visual graphs showing how papers relate to each other through citation and co-citation networks, revealing clusters of related work that keyword searches would miss. **ResearchRabbit** monitors your library and recommends new papers based on the structure of what you have already collected, functioning as a personalized research radar.

What these tools do well is *retrieval at scale*. They find papers across disciplinary boundaries that a human searcher would never encounter. A physicist studying network dynamics might never search the epidemiology literature, but Semantic Scholar will surface a relevant epidemiological model if the mathematical structure matches. This cross-pollination — finding relevant work in fields you do not know to search — is the genuine breakthrough.

What they do poorly is everything that requires judgment.

They cannot detect that a study's methodology is subtly flawed — that the control group was poorly matched, that the statistical test was inappropriate for the data distribution, that the effect size evaporates when you adjust for multiple comparisons. They cannot tell you that a paper's claims are undermined by a subsequent retraction of a key reference. They cannot feel the difference between a carefully reasoned argument and a confident-sounding assertion backed by circular citations. They do not understand *nuance*, because nuance requires understanding the thing being discussed, not merely the text describing it.

The risk is specific and measurable: **efficient retrieval of plausible-sounding but wrong claims**. A literature review assembled by AI is fast, comprehensive, and polished. It is also potentially contaminated by papers that should have been excluded — retracted studies, underpowered trials, predatory journal publications, papers whose conclusions have been superseded. The AI retrieves them because they match the query. A human researcher excludes them because they know better. When the human is removed from the loop, the filter vanishes.

---

## 2. AI-Generated Text in Research

In January 2023, the journal *Resources, Conservation and Recycling* published a paper containing the phrase "Certainly, here is a possible introduction for your topic." The authors had apparently pasted GPT-generated text directly into their manuscript without reading it. The paper was retracted. It was not the first, and it would not be the last.

The detection arms race began immediately. Institutions deployed AI-detection tools — GPTZero, Originality.ai, Turnitin's AI Writing Indicator — which attempted to identify AI-generated text through statistical analysis of token distribution, perplexity, and burstiness. The tools achieved moderate accuracy on unedited AI output and near-zero accuracy on AI text that had been lightly paraphrased by a human. This was always the inevitable outcome. Detection based on stylistic fingerprinting is a losing game because the styles converge as models improve, and because even minimal human editing destroys the statistical signal that detectors rely on.

The deeper problem is the **papermill**. Paper mills are commercial operations — overwhelmingly based in China, India, Russia, and Iran, though the customers are global — that produce fabricated research papers for sale. A researcher (or, more precisely, someone who needs publications for career advancement) pays a fee, and the mill produces a paper complete with fabricated data, manufactured figures, and fictional citations. Before GPT, paper mills employed teams of writers and figure fabricators. After GPT, they employ prompt engineers. Production costs have dropped by perhaps 90%. Output has scaled accordingly.

Estimates from organizations like the Committee on Publication Ethics (COPE) and investigations by science integrity sleuths like Elisabeth Bik, Guillaume Cabanac, and Alexander Magazinov suggest that **400,000 or more fraudulent papers** already exist in the published literature, with the rate accelerating. The contamination is not hypothetical. It is measurable, and it is being measured.

The **Matthew effect** — named for the Gospel of Matthew's observation that "unto every one that hath shall be given" — describes how advantages compound in science. Established researchers get more citations, more grants, more students, more publications, which earn them more citations, more grants, and so on. AI amplifies this dynamic. A senior researcher with a large lab, established datasets, and institutional subscriptions can use AI to draft papers, generate literature reviews, polish prose, and accelerate every stage of the publication pipeline. A junior researcher at an under-resourced institution cannot. The productivity gap widens. The rich get richer. The publication count inflates. The signal-to-noise ratio in the literature degrades.

---

## 3. The Trust Problem

If a language model can produce a paragraph that reads like a plausible research finding — complete with hedging, citations to real papers, and appropriate use of field-specific jargon — then **plausibility is no longer a useful signal of truth**. This is the central epistemic challenge of AI-era research: the cost of generating plausible text has dropped to near zero, while the cost of verifying a claim remains as high as it ever was.

The traditional model of scientific trust was built on a chain of assumptions: peer review catches errors, journals filter quality, citations indicate engagement with prior work, prose style reflects careful thought. Each link in this chain is weakened or broken when AI can generate text that mimics careful thought without performing it, when citations can be fabricated or hallucinated, and when peer review cannot reliably detect AI-generated content.

The answer is not better AI detection. The answer is a shift from **plausibility-based trust** to **verifiability-based trust**.

This means:

- **Reproducible code**: Every computational result should be accompanied by the code that produced it, in a form that another researcher can execute. Not pseudocode. Not a description of the algorithm. The actual code, with pinned dependencies, that produces the exact numbers in the paper.
- **Open data**: The datasets on which conclusions are based should be publicly available, with clear documentation of provenance, cleaning steps, and any exclusions.
- **Pre-registered hypotheses**: Before collecting data, register your hypotheses and analysis plan in a public repository (OSF, AsPredicted, ClinicalTrials.gov). This eliminates p-hacking — the practice of running many analyses and reporting only the ones that produce significant results — because the analysis plan is fixed before the data are seen.
- **The process matters more than the text**: A paper whose methods are transparent, whose data are open, and whose code runs is trustworthy regardless of whether the prose was drafted by a human or a machine. A paper whose prose is beautifully human-written but whose data are unavailable and whose methods are vague is untrustworthy regardless. The verification is in the artifacts, not the words.

The implications are uncomfortable for traditional academia, which has long evaluated research quality through proxy signals — journal prestige, prose quality, citation count, institutional affiliation — rather than through direct verification. Those proxies were never perfect, but they were efficient. AI has made them unreliable without making them obsolete: we still need heuristics for filtering the literature, but the old heuristics no longer work. New ones must be built on verifiability.

---

## 4. Computational Reproducibility

The "reproducibility crisis" predates AI by a decade. In 2012, C. Glenn Begley and Lee Ellis reported that scientists at Amgen could reproduce only **6 of 53** landmark cancer biology studies. In 2015, the Open Science Collaboration attempted to replicate 100 psychology studies and found that only **36%** produced results consistent with the originals. These failures had nothing to do with AI. They had everything to do with underspecified methods, unavailable data, and computational environments that existed only on one researcher's laptop.

AI has elevated this problem from embarrassing to existential. When papers are produced faster, in greater volume, with less human oversight, the base rate of irreproducible work increases. And the infrastructure for reproducibility remains woefully inadequate.

**Docker containers** for analysis environments represent the gold standard. A Docker image captures the operating system, language runtime, library versions, and system dependencies required to run an analysis. If a Dockerfile is provided alongside a paper, any researcher can reconstruct the exact computational environment that produced the results. The image is a frozen snapshot of "my machine" — the "works on my machine" problem dissolved into a transferable artifact.

**Jupyter notebooks** serve as living documents that interleave code, prose, and output. They make the relationship between method and result explicit: the code is *right there*, adjacent to the figure it produces. When done well, a Jupyter notebook is a paper that runs. When done poorly, it is a tangle of out-of-order cell executions and hidden state that cannot be reliably re-run from top to bottom — but this is a tooling problem, not a conceptual one, and tools like Papermill and nbconvert address it.

The tension between reproducibility and practical constraints is real. Some analyses require proprietary data that cannot be shared. Some require hardware (GPU clusters, specialized sensors) that most researchers do not have access to. Some require months of computation time. Perfect reproducibility is, in these cases, either impossible or impractical. But partial reproducibility is still vastly better than none. Share the code even if you cannot share the data. Document the hardware even if others cannot replicate it. Provide the Docker image even if the computation takes a week. Each artifact reduces the gap between "trust me" and "verify it."

The computational reproducibility movement — championed by organizations like the Turing Way, the Software Sustainability Institute, and Code Ocean — is building the infrastructure that AI-era research desperately needs. It is not glamorous work. It is plumbing. But in an era when the plausibility of text has been decoupled from the truth of claims, the plumbing is what keeps the system honest.

---

## 5. The Preprint + AI Feedback Loop

Here is a scenario that is no longer hypothetical:

1. A language model generates a paper on a trending topic in machine learning.
2. The paper is posted to arXiv, which has no peer review barrier.
3. Other language models, trained on or given access to arXiv, encounter the paper.
4. These models cite it in their own generated outputs, treating it as a legitimate source.
5. Human researchers, using AI-assisted literature review tools, find the paper and its citations. The citation count makes it appear influential.
6. The paper enters the citation graph as if it were real research.

This is a **self-referential knowledge bubble**: AI-generated content citing AI-generated content, with the citation graph creating an illusion of consensus that maps to no underlying reality. The bubble is inflated by the same tools that researchers rely on to navigate the literature.

Breaking the loop requires three interventions:

**Ground truth anchoring** — Every chain of citations must eventually terminate at empirical observation, mathematical proof, or experimental data. If a claim cannot be traced back to a non-textual artifact — a dataset, a measurement, a derivation — it is not knowledge. It is text.

**Experimental validation** — The strongest antidote to AI-generated pseudoscience is the laboratory. A generated paper that claims a novel catalyst achieves 95% yield can be checked by synthesizing the catalyst and measuring the yield. The generated text is free; the experiment is expensive. This asymmetry is, paradoxically, what makes experimental science more trustworthy in the AI era, not less. The cost of verification is also the cost of fabrication.

**Human-in-the-loop verification** — At critical junctures — when a finding is cited as a basis for policy, when a result is incorporated into a meta-analysis, when a claim enters a textbook — a human with domain expertise must read the source material and evaluate it. Not summarize it. Not check it against a detection tool. Read it. Understand it. Judge it.

---

## 6. AI for Hypothesis Generation

Not all applications of AI to research are adversarial to knowledge. One of the most promising is **hypothesis generation** — using language models as brainstorming partners to identify novel conjectures, unexpected connections, and underexplored research directions.

The Collatz collaboration model (arXiv:2603.11066) offers a case study. The paper documents a structured interaction between a human mathematician and an AI system, where the AI proposes conjectures about the Collatz sequence (the infamous 3n+1 problem) and the human evaluates, refines, and attempts to prove them. The AI's strength was breadth: it could rapidly generate hundreds of candidate conjectures by pattern-matching across known results. The human's strength was depth: evaluating which conjectures were trivially true, which were trivially false, which were interesting, and which were provable.

This division of labor maps cleanly onto the historical distinction between **exploration** and **exploitation** in research. Exploration — generating new ideas, making unexpected connections, proposing novel framings — benefits from breadth, speed, and tolerance for failure. Exploitation — proving theorems, designing experiments, building rigorous arguments — benefits from depth, precision, and domain expertise. AI is naturally suited to exploration. Humans remain essential for exploitation.

The critical distinction is between **AI as brainstorming partner** and **AI as authority**. A brainstorming partner generates ideas that the human evaluates. An authority generates conclusions that the human accepts. The moment a researcher begins treating AI-generated hypotheses as findings rather than suggestions — the moment the "I wonder if..." becomes "it has been shown that..." without the intervening work — the tool has become a source of epistemic contamination rather than intellectual leverage.

The **human filter** is not optional. It is the mechanism that transforms AI's prolific but undisciplined generation into scientifically meaningful conjecture. Without it, you get quantity without quality — a thousand hypotheses, none of them tested, all of them plausible, most of them wrong.

---

## 7. Data Quality in the AI Era

Every language model is a distillation of its training data. If the training data is contaminated, the model is contaminated. This is not a theoretical concern. It is a demonstrated vulnerability with measured effects.

**Training data poisoning** refers to the deliberate or accidental inclusion of false, biased, or malicious content in training datasets. Because modern language models are trained on web-scraped corpora containing hundreds of billions of tokens, manual curation is impossible. Automated filtering catches obvious problems (pornography, spam, certain categories of toxicity) but misses subtle ones: outdated medical advice presented as current, superseded scientific claims presented as settled, propaganda presented as journalism.

The **model collapse** problem, documented by Shumailov et al. (2023), is more insidious. When a model is trained on data that includes the output of a previous model — which is increasingly inevitable as AI-generated content floods the web — the resulting model exhibits degraded performance. The distributions narrow. The tails thin. Rare but important patterns are lost. Each generation of model trained on the previous generation's output is slightly worse than the last. It is the AI equivalent of making photocopies of photocopies: the degradation is cumulative and irreversible.

This creates a **premium on human-generated, curated, verified data** that is historically unprecedented. For most of the digital era, data was abundant and curation was expensive, so the rational strategy was to collect everything and filter later. In the AI era, the calculus reverses. AI-generated data is abundant to the point of toxicity. Human-generated, expert-curated data — the kind that was once considered too expensive to produce at scale — is now the scarcest and most valuable resource in the machine learning ecosystem.

Datasets like The Pile, Common Crawl, and C4 were assembled under the assumption that more data is always better. That assumption is no longer safe. The next generation of training datasets will need provenance tracking, contamination testing, and explicit certification that their contents are human-authored and factually verified. This is expensive. It is also non-negotiable.

---

## 8. New Forms of Peer Review

Peer review has always been slow, inconsistent, and prone to bias. AI offers both relief and new complications.

**AI-assisted review** is already deployed at several major journals. Tools check statistical claims (Statcheck), detect image manipulation (Proofig), identify plagiarism and text recycling (iThenticate, Crossref Similarity Check), and flag missing citations to relevant prior work. These are genuine improvements. A human reviewer might miss that a reported p-value of 0.03 is inconsistent with the reported test statistic and sample size. Statcheck will not miss it. A human reviewer might not notice that Figure 3 has been spliced from two different experiments. Image forensics tools will notice it.

The ethics of using AI in review are actively debated. If a reviewer uses ChatGPT to help draft their review — to check their understanding, to phrase their criticisms more clearly, to identify related work they may have missed — is this acceptable? Most journal policies now explicitly address this question, and the consensus is cautiously permissive: AI may be used as an aid to the reviewer, but the reviewer remains responsible for the intellectual content of the review, and AI use must be disclosed.

**Transparency requirements** are emerging as the primary governance mechanism. Rather than attempting to police whether AI was used in writing or reviewing a paper — which is increasingly impossible to determine — journals and funders are requiring disclosure. "Was AI used in the preparation of this manuscript? If so, how?" The assumption is shifting from "AI must not be used" to "AI use must be visible." This is pragmatic. It is also the only enforceable standard.

The deeper question is whether peer review as currently practiced — two or three anonymous reviewers reading a paper over a few weeks and providing uncompensated feedback — can survive in a world where AI can generate papers faster than humans can review them. The bottleneck has always been reviewer attention. If the volume of submissions doubles while the pool of qualified reviewers remains constant, the system breaks. AI-assisted review is not just a convenience. It may be a structural necessity.

---

## 9. The Democratization Argument

The optimistic case for AI in research is powerful and deserves to be stated plainly.

AI **lowers the barrier to research participation**. A motivated undergraduate at a small liberal arts college can now use Elicit to conduct a literature review that previously required access to institutional database subscriptions and a trained librarian. A citizen scientist in rural Kenya can use a language model to analyze data and draft findings in English — a language they may speak but not write academically — that reach the global research community. A retired engineer can contribute to open-source scientific computing without needing to be affiliated with a university.

AI **enables citizen science at scale**. Projects like Galaxy Zoo (classifying galaxy morphologies), Foldit (protein folding), and eBird (bird observation) demonstrated that non-professionals can make meaningful contributions to research when given appropriate tools and frameworks. AI multiplies this potential by automating the most tedious parts of data collection and analysis while preserving the human observations that make citizen science valuable.

AI **translates across languages**. The global research literature is overwhelmingly published in English, which excludes researchers whose strongest language is Mandarin, Spanish, Arabic, Portuguese, or any of the other languages spoken by the majority of the world's scientists. Translation tools — imperfect but improving — reduce this barrier. A paper written in Japanese can be read, if not perfectly, by a researcher in Brazil. This is not a small thing. It is a structural change in who can participate in the conversation.

But AI also **enables low-quality flooding**. The same tools that help a careful researcher work more efficiently help a careless one produce more noise. The same platforms that accept citizen science contributions accept AI-generated spam. The same preprint servers that democratize access to the literature accept papers that no human has read.

The net effect is genuinely unclear. It depends on whether the filtering mechanisms — peer review, community norms, institutional quality standards, replication efforts — can scale as fast as the production. History suggests they cannot. Filtering has always lagged production. But history also suggests that the research ecosystem is more resilient than its critics fear: the scientific literature has survived previous floods (the post-WWII expansion, the post-internet expansion) and emerged larger, noisier, but still functional.

The honest assessment is that AI democratizes access to the *tools* of research without democratizing access to the *judgment* that makes research valuable. The tools are necessary but not sufficient. The judgment comes from training, experience, and the kind of deep engagement with a subject that no amount of AI assistance can shortcut.

---

## 10. Our Approach — gsd-skill-creator as a Case Study

This project — gsd-skill-creator, with its memory arena, grove format, trust system, and adaptive learning layer — is itself an experiment in AI-era research practices. Every design decision reflects a position on the problems described above. Here is how.

**The discovery engine** (`discovery_engine.py`) automates the scanning of codebases, documentation, and external repositories to identify skills, patterns, and capabilities. It does not automate curation. The engine finds; a human decides what to keep, what to discard, and what to investigate further. This is the literature review model applied to code: comprehensive retrieval paired with human judgment. The machine's breadth multiplied by the human's depth.

**The data-fidelity skill** enforces a simple rule: every factual claim must be verified against a primary source. Not paraphrased. Not summarized. Verified. When the system generates a claim about a library's API, it checks the API documentation. When it generates a statistic, it traces the statistic to its origin. This is the verifiability-over-plausibility principle rendered as executable policy.

**Content-addressed storage** via the grove format means that every record — every skill, agent, team, and chipset — is identified by the cryptographic hash of its contents. If the contents change, the hash changes. If the hash matches, the contents are guaranteed identical. This is **immutability with provenance**: you cannot silently alter a record, because the hash will not match. This is the reproducibility principle applied to knowledge artifacts: the artifact *is* its identity, and that identity is verifiable.

**The triple store** links facts to source hashes. A fact is not a free-floating assertion; it is a relationship between entities grounded in a specific, identifiable source. "Library X supports feature Y" is not stored as a string. It is stored as a triple — (Library X, supports, Feature Y) — linked to the hash of the source document from which the fact was extracted. The fact is **verifiable, not just plausible**, because you can follow the link to the source and check.

**The cross-reference graph** makes relationships explicit rather than inferred. When two skills are related, the relationship is recorded as a typed edge in a graph, not inferred by a language model at query time. This means the relationships are stable, auditable, and independent of whatever model happens to be running. The graph is structure, not text. Structure does not hallucinate.

**The "trust no one" principle**, embodied by Cedar as the filter and ledger of the muse team, is not nihilism. It is operational hygiene. Every claim, every generated artifact, every automated output passes through a verification layer before it is accepted. Trust is earned through verification, not granted through plausibility. This is the same principle that makes cryptographic systems work: do not trust the message; verify the signature.

**Pre-indexed embeddings** allow semantic search — finding skills by meaning rather than by keyword — while storing the underlying data structurally. The embedding is an *index*, not the *source of truth*. You can search semantically, but the results you retrieve are structurally stored records with explicit provenance, not generated text. The semantic layer finds; the structural layer verifies. This is the dual architecture that AI-era research requires: the speed of inference paired with the rigor of structure.

**The Erdos program** is perhaps the purest expression of this philosophy. Mathematical claims are either proved or not proved. There is no "plausible" middle ground. A conjecture is either resolved with a valid proof — checkable, step by step, by any competent mathematician — or it remains open. The 105 prize-eligible problems tracked in `ERDOS-TRACKER.md` do not admit AI-generated hand-waving. You cannot hallucinate a proof of the Riemann Hypothesis. You can hallucinate *text that looks like* a proof, but the verification is absolute: either each step follows from the preceding ones by valid logical inference, or it does not. Mathematics is the ground truth anchor that the rest of research aspires to.

---

## Conclusion: What We Preserve, What We Change

What we preserve is the **epistemic core**: the commitment to truth over plausibility, to verification over assertion, to evidence over eloquence. The scientific method is not a set of tools. It is a set of constraints — hypothesis, experiment, observation, replication, peer scrutiny — that force our beliefs to track reality rather than our preferences. These constraints are not obsolete. They are more important than ever, precisely because the cost of generating plausible-sounding nonsense has dropped to zero.

What we change is the **infrastructure of trust**. The old infrastructure — journal prestige, institutional affiliation, prose quality, citation count — relied on proxy signals that AI has undermined. The new infrastructure must be built on direct verification: reproducible code, open data, content-addressed storage, pre-registered hypotheses, provenance-tracked facts, cryptographic integrity. These are harder to game because they are grounded in artifacts, not text. You can generate a plausible-sounding abstract. You cannot generate a Docker image that reproduces the results, because the results either reproduce or they do not.

The researchers who thrive in the AI era will not be those who use AI most aggressively. They will be those who verify most rigorously. Speed without verification is noise. Verification without speed is merely slow. The combination — fast generation, rigorous verification, structural storage, human judgment at the critical junctures — is what the new research methodology looks like.

The research assistant can hallucinate. So we do not trust the assistant. We trust the process. And we build the process into the tools, so that trust is not a decision made once but a constraint enforced always.

## Study Guide — Research in the AI Era

Key practice: AI drafts, human verifies. Always check
citations. Always run the code.

## DIY — Use an LLM to draft a literature review; verify every citation

Pick a narrow topic. Ask an LLM for 10 citations.
Verify each one exists and says what it claims. Note
your hallucination rate.

## TRY — Pre-register a hypothesis

Before running an experiment, post the hypothesis on
OSF. This is the simplest way to honor the epistemic
commitment the AI era makes harder.
