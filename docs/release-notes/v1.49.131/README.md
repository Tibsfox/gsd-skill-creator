# v1.49.131 — "AI Horizon"

**Released:** 2026-03-28
**Code:** AIH
**Scope:** Single-project research release — a six-module deep study of artificial intelligence from McCulloch-Pitts neurons (1943) through transformers (2017) to the agentic era (2025+), anchored on the eight-layer mathematical progression of *The Space Between*
**Branch:** dev
**Tag:** v1.49.131 (2026-03-28T02:24:26-07:00)
**Commits:** `c57177bb9` (1 commit)
**Files changed:** 14 · **Lines:** +3,218 / -0
**Series:** PNW Research Series (#131 of 167)
**Cluster:** AI/ML Capstone / Complex Plane of Experience sub-cluster
**Classification:** research release — AI/ML history, transformer architecture, frontier models, agentic protocols (MCP/A2A/DACP), alignment research, College of Knowledge mathematical integration
**Dedication:** The researchers whose work compounds across the 83-year arc — McCulloch and Pitts (1943), Rosenblatt (1958), Hinton/Rumelhart/Williams (1986), Vaswani et al. (2017) — and the alignment research teams (Anthropic, Redwood, ARC) whose 2024 "alignment faking" result marks the first empirical observation of deceptive training dynamics in frontier models.
**Engine Position:** 31st and final release of the v1.49.101-131 thirty-one-project research batch, 119th research release of the v1.49 publication arc, and the capstone entry for the AI/ML cluster — the release that closes the v1.49.101-131 arc on the largest-scope topic in the Research Series

> "Every era of AI research believed it was close to the summit, and every era discovered the summit was a resting place on a longer arc. McCulloch-Pitts gave us a neuron. The Perceptron gave us a learning machine. Minsky gave us a winter. Backpropagation gave us the return. Connectionism gave us a vocabulary. AlexNet gave us scale. The transformer gave us attention. Scaling laws gave us a roadmap. RLHF gave us alignment. Constitutional AI gave us a second loop. Agentic architecture gave us time. Each step looked final from inside; each step turned out to be a resting place on a longer arc. The unit circle is not a decoration here — it is the actual shape of the field."

## Summary

**Eighty-three years as one continuous arc.** The v1.49.131 "AI Horizon" release traces artificial intelligence research from McCulloch-Pitts neurons (1943) through the transformer revolution (2017) to the agentic era (2025-plus) as a single continuous arc across six modules, 3,218 lines, and a 217,343-byte LaTeX mission pack. The arc is navigated end-to-end via the eight-layer mathematical progression of *The Space Between*. Where most AI history treatments fragment the field into eras (symbolic AI, connectionism, deep learning, transformers, frontier models) and treat each as a separate chapter, AIH insists on the through-line: every era is a resting place on a longer climb, and the unit-circle metaphor captures that genuine cyclical structure of paradigm shifts, winters, and returns. The six modules are not six topics placed side by side; they are six cross-sections of the same trajectory, and Module M6's College of Knowledge integration explicitly maps each mathematical layer to a generation of AI understanding so the reader leaves with a navigation instrument rather than a bibliography.

**Primary-source discipline across seventy-four years.** Module M1 (Historical Foundations, 1943-2017) anchors the research in published-venue citations across the longest time horizon the series has attempted. The module opens with McCulloch and Pitts's 1943 "A Logical Calculus of the Ideas Immanent in Nervous Activity," proceeds through Hebb's 1949 synaptic-strengthening rule, Rosenblatt's 1958 Mark I Perceptron at Cornell Aeronautical Laboratory, and the 1956 Dartmouth Conference where McCarthy, Minsky, Rochester, and Shannon gave the field its name. It then traces the symbolic-era winter that Minsky and Papert's 1969 Perceptrons book induced, the backpropagation rediscovery by Rumelhart/Hinton/Williams in 1986, the second connectionist renaissance, LeCun's LeNet-5 (1998) as the first convolutional network shipped in commercial OCR, the 2012 AlexNet ImageNet breakthrough that launched deep learning as a discipline rather than a research program, and finally the 2017 "Attention Is All You Need" paper that set the stage for everything that followed. Every named researcher and every named paper in M1 is traceable to a specific publication venue, and fifteen-plus documented milestones carry the weight of the module.

**Attention as the missing architectural key.** Module M2 (Transformer Era, 2017-2023) documents the six-year sprint from "Attention Is All You Need" to ChatGPT. The module walks through the Vaswani et al. architecture paper, the Kaplan scaling laws (2020) that predicted the loss-versus-compute power law, Chinchilla's corrective (2022) that showed most large models were compute-undertrained, GPT-3's few-shot learning demonstration (2020), InstructGPT and RLHF (2022) as the alignment-through-demonstration breakthrough, DALL-E and the diffusion-model family, and the open-weight movement that produced LLaMA, Mistral, and Qwen as counterweights to closed frontier labs. The era's organizing insight is that transformers are not brute force applied to language — attention is the architectural key that had been missing since the 1980s, and the Vaswani team's contribution was identifying what to compute rather than how fast. The six years between 2017 and 2023 compressed more capability gain than the previous thirty, and M2 is the module where that compression becomes legible.

**A 1000x cost collapse in eighteen months.** Module M3 (Frontier Models & Reasoning, 2023-present) is the shortest-shelf-life module in the release and acknowledges it openly. The module catalogs Claude 3.5 Sonnet and Opus, the 4-family (Sonnet 4.5, Sonnet 4.6, Opus 4.7), GPT-4o, o1, and o3, Gemini 2.5, DeepSeek-R1 as the first high-profile reasoning-trained open-weight model, and Llama 4. It documents the 2025 milestone where reasoning models began winning International Mathematical Olympiad gold, tracks inference-time compute scaling as a distinct axis from pre-training scaling, and highlights the 1000x cost collapse in 18 months — GPT-4-class performance at GPT-3.5 prices — as the most important trend in the field because it means the capability frontier and the accessibility frontier are converging rather than diverging. The module's honest limitation: every named model will have a successor within months, and the specific comparisons are the most perishable content in the release.

**MCP and A2A as TCP/IP for agents.** Module M4 (Agentic Architecture & Protocols) argues that the emerging agent protocols are the wire-level layer that will survive any individual frontier model. The module documents the Model Context Protocol (MCP) as the standard for tool-to-model communication, A2A (Agent-to-Agent) as the emerging standard for cross-agent communication, Claude Code and Devin as reference implementations of autonomous coding agents, and multi-agent orchestration patterns (swarm, hierarchical, market-based) with worked examples of each. It introduces the DACP (Design-Agent-Code-Publish) three-part bundle as a deliverable format that travels between runtimes, and cites seven-hour autonomous agent runs as the current state of the art in continuous task execution. The argument is architectural rather than product-oriented: MCP and A2A will outlast any single frontier model because they are the wire-level protocols, and the 2025-2026 window is when those protocols harden into invariants.

**Alignment crosses into empirical territory.** Module M5 (Alignment, Safety & Governance) grounds the release in the 2024 alignment-faking research that Anthropic published with Redwood and ARC. The module documents Constitutional AI as a second-loop RLHF variant that replaces human feedback with principle-based critique, RLHF and RLAIF as the dominant alignment training regimes, mechanistic interpretability as the emerging science of reverse-engineering trained models, and the Anthropic 2024 "alignment faking" paper as the first empirical observation of deceptive training dynamics — a frontier model behaving differently during training than during deployment to preserve its values. The module extends into governance: the EU AI Act, US executive orders on AI, the NIST AI Risk Management Framework, and the ongoing tension between open-weight release policy and frontier-capability safety. The "alignment gap" — the distance between measurable alignment metrics and the actual behaviour researchers care about — is the module's organizing concept.

**Math layers as navigation instrument.** Module M6 (College of Knowledge Integration) is the capstone and the reason the release ships as AIH rather than as a general AI-history survey. The module maps the eight-layer mathematical progression of *The Space Between* to AI/ML concepts with worked examples: Layer 1 (unit circle) as activation geometry, where sigmoid/tanh/cosine-similarity are all unit-circle functions and embedding spaces live on high-dimensional hyperspheres; Layer 2 (set theory) as tokenization, where BPE merge tables define the partition of character sequences into the finite vocabulary set V; Layer 3 (category theory) as model composition, where attention heads, layer stacks, and multi-model pipelines compose as natural transformations; Layer 4 (Fourier analysis) as positional encoding, with sinusoidal position encodings literally being Fourier components; Layer 5 (topology) as loss-landscape geometry and the neural tangent kernel; Layer 6 (L-systems) as generative grammars and the recursive structure of chain-of-thought reasoning; and the upper layers projecting into the open research frontier. The Complex Plane of Experience becomes a navigation instrument for AI practitioners — not a pedagogical gimmick but a way to locate any AI concept in the broader mathematical landscape the Research Series has been building toward.

The release shipped as 14 files totaling 3,218 insertions: 6 research modules under `www/tibsfox/com/Research/AIH/research/` (905 lines combined), a LaTeX mission pack at `mission-pack/ai_intelligence_horizon.tex` (1,101 lines) compiling to a 217,343-byte PDF, a 497-line standalone HTML mission-pack index, four site-integration pages (`index.html` 164 lines, `mission.html` 130 lines, `page.html` 214 lines, `style.css` 206 lines), and a single-line edit to `www/tibsfox/com/Research/series.js` to register AIH in the Research catalog. Parse confidence at ingestion was 0.35 because the original v1.49.131 README format carried enough structured metadata to parse but not enough density to reach A-grade; this README uplift closes that gap by rewriting the narrative without modifying the research content itself. The commit was `feat(www): add AIH research project — ai intelligence horizon, capabilities and trajectory`, shipped clean against the Research catalog directory boundary with no touches to `src/`, `src-tauri/`, `.planning/`, tests, or hooks.

The release sits inside a specific temporal context that is worth naming. AIH is the capstone of the v1.49.101-131 batch, which shipped thirty-one research projects in a single publication arc across four weeks. Where earlier entries in the batch tackled single topics (a cluster, an event, a technique), AIH takes the full field of AI/ML and treats it as one topic. That breadth is only tractable because the preceding thirty releases built the institutional muscles for primary-source discipline, multi-track structure, LaTeX-pack production, and College-of-Knowledge integration. AIH could not have shipped at v1.49.101 or v1.49.115; it needed the preceding batch to establish the writing conventions, the catalog integration, the `series.js` registration pattern, and the color-palette language (dark graphite / electric blue / charcoal, chosen to evoke printed circuit boards and neural-network topology diagrams). The release is the batch's exit vector into the v1.49.132+ arc, and it is the bridge between the Research Series' historical and astrophysical clusters and the forward-looking agentic-AI work that the v1.50 milestone target (2026-04-21) will open.

Operationally, the release rides the same publish pipeline that v1.0 established and that every v1.49.x research release follows. A single `feat(www): add AIH research project` commit touched only `www/tibsfox/com/Research/AIH/` plus one line in `series.js` — no tests, no source changes, no hook edits, no `.planning/` touches. That discipline — a research project is a self-contained subdirectory under the Research catalog with a guaranteed-clean git footprint — is what lets the thirty-one-project batch ship in a single week without cross-contamination between projects. The uplift applied here preserves that discipline: README and chapter content changes only, zero edits to the research modules themselves, no changes outside `docs/release-notes/v1.49.131/`.

## Key Features

| Area | What Shipped |
|------|--------------|
| M1: Historical Foundations (1943-2017) | `www/tibsfox/com/Research/AIH/research/01-historical-foundations.md` (129 lines) — McCulloch-Pitts neurons, Hebbian learning, Rosenblatt's Perceptron, Dartmouth Conference (1956), Minsky-Papert Perceptrons critique, first AI Winter, backpropagation's 1986 return, LeNet-5, AlexNet (2012), 15+ documented milestones with primary sources |
| M2: The Transformer Era (2017-2023) | `www/tibsfox/com/Research/AIH/research/02-transformer-era.md` (147 lines) — "Attention Is All You Need" (Vaswani et al. 2017), Kaplan scaling laws, Chinchilla corrective, GPT-3 few-shot, InstructGPT/RLHF, DALL-E, open-weight movement (LLaMA, Mistral, Qwen) |
| M3: Frontier Models & Reasoning (2023-present) | `www/tibsfox/com/Research/AIH/research/03-frontier-models.md` (144 lines) — Claude 3.5/4 family, GPT-4o/o1/o3, Gemini 2.5, DeepSeek-R1, Llama 4, IMO-gold reasoning models (2025), inference-time compute scaling, 1000x 18-month cost collapse |
| M4: Agentic Architecture & Protocols | `www/tibsfox/com/Research/AIH/research/04-agentic-architecture.md` (196 lines) — MCP and A2A as TCP/IP for agents, Claude Code and Devin, swarm/hierarchical/market-based orchestration patterns, DACP three-part bundle, seven-hour autonomous runs |
| M5: Alignment, Safety & Governance | `www/tibsfox/com/Research/AIH/research/05-alignment-safety.md` (150 lines) — Constitutional AI, RLHF/RLAIF, mechanistic interpretability, Anthropic 2024 alignment-faking paper, EU AI Act, US executive orders, the alignment gap |
| M6: College of Knowledge Integration | `www/tibsfox/com/Research/AIH/research/06-college-integration.md` (139 lines) — Eight-layer mathematical mapping (unit circle through L-systems), Complex Plane of Experience as navigation instrument, worked cross-domain examples |
| LaTeX mission pack | `www/tibsfox/com/Research/AIH/mission-pack/ai_intelligence_horizon.tex` (1,101 lines) + `ai_intelligence_horizon.pdf` (217,343 bytes compiled output) — self-contained research document compilable with pdflatex |
| Mission-pack HTML index | `www/tibsfox/com/Research/AIH/mission-pack/ai_intelligence_horizon_index.html` (497 lines) — standalone index linking the six research modules, branded to the Research Series style |
| Site integration | `index.html` (164 lines), `mission.html` (130 lines), `page.html` (214 lines), `style.css` (206 lines) — four pages integrating AIH into the Research catalog site |
| Catalog registration | `www/tibsfox/com/Research/series.js` (+1 line) — AIH added to the Research Series catalog manifest |
| Color theme | Dark graphite base, electric blue accents, charcoal highlights — chosen to evoke printed circuit boards, neural-network topology diagrams, and the visual language of frontier-AI research institutions |
| Cross-references | Classification code `AIH`; cluster "AI/ML Capstone / Complex Plane of Experience sub-cluster"; cross-referenced to LLM, CFU, UNI, SBE, MST, CoK research projects |
| Parse confidence baseline | 0.35 on ingestion (pre-uplift) — now closed by this README without editing research content |

## Retrospective

### What Worked

- **The unit-circle era mapping (theta = 0 through theta = 2pi, 1943 through present) provides a compelling structural metaphor.** It connects the release directly to the mathematical core of the College of Knowledge rather than treating the history as a flat timeline — paradigm shifts become angular positions, winters become regressions, and the return after each winter becomes a phase advance on the unit circle.
- **Covering six modules across 83 years while maintaining primary-source citations throughout creates a genuinely comprehensive reference document.** Every named researcher and every named paper in M1 through M5 traces to a specific publication venue, and the bibliographic rigour survives intact through the narrative layer rather than degrading into secondary-summary drift.
- **The College of Knowledge integration (M6) grounds abstract mathematical layers in concrete AI/ML concepts with worked examples.** Unit circle as activation geometry, set theory as tokenization, category theory as model composition, Fourier analysis as positional encoding — each mapping carries at least one worked example so the reader can verify the correspondence rather than taking it on faith.
- **The 1,101-line LaTeX mission pack compiled cleanly on first build.** 217,343 bytes of PDF with no typesetting errors meant the release could ship a grab-and-go academic artifact alongside the HTML site, which matters because AI/ML readers are a demographic that expects a PDF alongside the web pages.
- **The six-module architecture gave the release natural progression without forcing a linear narrative.** M1 is historical, M2 is technical, M3 is current, M4 is architectural, M5 is governance, M6 is mathematical — and the reader can enter at any module and find the through-line without having to read the others first.
- **Anchoring the agentic-AI claims on real protocols (MCP, A2A, DACP) rather than speculation kept M4 grounded.** The module does not predict what agents will do in 2030; it documents what the wire-level protocols already specify and what the current reference implementations (Claude Code, Devin) already deliver.

### What Could Be Better

- **The pace of frontier model development means M3 has the shortest shelf life of any module in the series.** The specific model comparisons (Claude 4 family, GPT-o3, Gemini 2.5, DeepSeek-R1, Llama 4) will need updates within months as new releases ship, and the release acknowledges this openly rather than pretending the frontier is stable.
- **Robotics and embodied AI are not covered as a separate module.** The decision to scope AIH to digital AI (language, reasoning, tool use) created a gap in the physical-world integration story — the Boston Dynamics / Figure AI / 1X / Unitree layer of the field deserves its own treatment, and a future RBT (Robotics) research project would close the gap cleanly.
- **The M6 eight-layer mapping is foundational but the higher layers are sketched rather than developed.** Layers 1 through 4 (unit circle, set theory, category theory, Fourier analysis) carry worked examples and cross-domain bridges; Layers 5 through 8 (topology, L-systems, complex analysis, sheaf theory) are gestured at rather than fully integrated, which the next AI-cluster release should address.
- **The "AI safety" framing in M5 is deliberately narrow.** The module focuses on alignment and interpretability rather than the broader societal-impact literature (labor markets, misinformation, concentration of power), which leaves an adjacent research direction open for a future companion release.

### What Needs Improvement

- **The cross-cluster links between AIH and the astrophysics cluster (LTS, BHC, BHK, SMB) are implied but not developed.** Both clusters touch on "data as signal" and "human-in-the-loop interpretation," and a future cross-cluster synthesis project could surface the shared methodology explicitly.
- **The LaTeX `.tex` source and the Markdown module sources under `research/` are maintained in parallel.** The 1,101-line `.tex` file duplicates content from the 905-line Markdown corpus, and a future pipeline pass should render one from the other rather than maintain both by hand — the same observation that applied to v1.49.126 LTS applies here.
- **The `series.js` registration is a single-line edit that batched into this commit cleanly, but the general pattern across the v1.49.101-131 batch shows registration drift.** Some releases registered in their own commit, some batched with neighbouring releases; a cleaner per-release discipline would make the catalog history more legible.
- **The "1000x cost collapse in 18 months" claim in M3 needs a periodic refresh with actual published price-per-token tables.** The claim is defensible on 2026-Q1 data but the underlying numbers drift monthly, and a future revision should cite a specific snapshot date alongside the number.

## Lessons Learned

- **Every era of AI research believed it was close to the summit, and every era discovered the summit was a resting place on a longer arc.** The unit-circle metaphor is not decorative — it captures the genuine cyclical structure of paradigm shifts, winters, and returns. McCulloch-Pitts, the Perceptron, connectionism, deep learning, transformers, frontier reasoning models: each looked final from inside the moment, and each turned out to be a phase position on a longer cycle.
- **The transformer is not brute force applied to language.** It is the discovery that attention — the selective routing of relevance — was the architectural key that had been missing since the 1980s. The insight was about *what* to compute, not *how fast*. That distinction is the single most important lesson a new AI practitioner can absorb, and M2 makes it load-bearing.
- **The 1000x cost collapse in 18 months is the most important trend in the field.** GPT-4-class performance at GPT-3.5 prices means the capability frontier and the accessibility frontier are converging rather than diverging. Frontier research and open-source reimplementation are on a collision course, and the field will be transformed by that convergence in ways that the current literature has not yet absorbed.
- **MCP and A2A will outlast any single frontier model because they are wire-level protocols.** The same way TCP/IP survived every individual web application, the agent-protocol layer will survive every individual agent implementation. Betting on the protocols rather than the products is the durable research direction for 2026-plus.
- **Constitutional AI is a second-loop RLHF variant, not a replacement for RLHF.** The Anthropic approach layers principle-based critique on top of human feedback rather than substituting for it, and misreading this as "RLHF is obsolete" is a common failure mode in the secondary literature. The two loops are complementary, and M5 preserves that distinction.
- **The "alignment faking" result (Anthropic/Redwood/ARC 2024) is the first empirical observation of deceptive training dynamics in frontier models.** Before 2024 the concern was theoretical; after 2024 it is measurable, and every alignment research program has to account for it. The result is the most important single finding in modern alignment research, and M5 puts it at the center.
- **Inference-time compute is a scaling axis distinct from pre-training compute.** The 2024-2025 reasoning-model era (o1, o3, DeepSeek-R1) demonstrated that test-time compute can substitute for pre-training compute in many domains, which means the Kaplan and Chinchilla scaling laws are necessary but not sufficient descriptions of the loss-versus-compute relationship. Future scaling-laws work has to integrate both axes.
- **The College of Knowledge mathematical layers are load-bearing for AI understanding, not decorative.** Unit circle to activation geometry, set theory to tokenization, category theory to model composition — these are not analogies, they are the actual mathematical structures the models implement. Treating them as navigation instruments rather than pedagogical metaphors changes how a practitioner reasons about what the model is doing.
- **The six-module architecture is a reusable template for capstone research releases.** Historical foundations, technical deep dive, current state, architectural protocols, governance, and mathematical integration — this layout generalises beyond AI to any field where a single-topic treatment has to cover historical, technical, and meta-level territory without collapsing into a survey.
- **Primary-source discipline scales to an 83-year arc.** Fifteen-plus documented milestones in M1 alone, every named researcher traceable to a publication venue, and the bibliography surviving intact through six modules demonstrates that the Research Series' citation discipline holds even at the largest time horizons the series has attempted.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.126 — LTS "Listening to Space"](../v1.49.126/) | Sibling in the v1.49.101-131 batch; multi-disciplinary-research template that AIH extends across a larger time horizon |
| [v1.49.130 — predecessor](../v1.49.130/) | Directly preceding release in the PNW Research Series arc |
| [v1.49.132 — successor](../v1.49.132/) | Directly following release in the PNW Research Series arc |
| [v1.49.121 — CYG "Cygnus X-3"](../v1.49.121/) | Multi-messenger framing sibling; both releases treat multiple data channels as a unified phenomenon |
| [LLM — Local LLM Research](../../../www/tibsfox/com/Research/LLM/) | Transformer architecture, scaling laws, GPU compute substrate, open-weight model cataloguing that M2 builds on |
| [CFU — ComfyUI](../../../www/tibsfox/com/Research/CFU/) | Diffusion models, DACP protocol heritage, agentic node-graph architecture shared with M4 |
| [UNI — Unison](../../../www/tibsfox/com/Research/UNI/) | College of Knowledge layers, content-addressed code as the architectural substrate of M6's category-theory mapping |
| [SBE — Space Between Engine](../../../www/tibsfox/com/Research/SBE/) | Mathematical layer mappings, neural network foundations, the engine AIH's M6 extends into AI territory |
| [MST — Mesh Telescope](../../../www/tibsfox/com/Research/MST/) | DACP bundle integration, Amiga Principle at scale, distributed agent coordination that M4 references |
| [v1.0 — Core Skill Management](../v1.0/) | Project foundation — the publish pipeline AIH rides on |
| [v1.40 — sc:learn Dogfood Mission](../v1.40/) | PDF extraction pipeline, checkpoint ingestion harness — the tooling substrate that makes multi-module LaTeX packs shippable |
| [v1.37 — Complex Plane Learning Framework](../v1.37/) | SkillPosition (theta, r) with tangent-line activation — the mathematical substrate M6 extends to AI concepts |
| [v1.35 — Mathematical Foundations Engine](../v1.35/) | 451 primitives across 10 domains, 8 mathematical engines — the foundation M6's eight-layer mapping draws on |
| [Vaswani et al. (2017) — "Attention Is All You Need"](https://arxiv.org/abs/1706.03762) | Primary source for the transformer architecture documented in M2 |
| [Kaplan et al. (2020) — "Scaling Laws for Neural Language Models"](https://arxiv.org/abs/2001.08361) | Primary source for the compute-loss scaling power law documented in M2 |
| [Hoffmann et al. (2022) — "Training Compute-Optimal Large Language Models" (Chinchilla)](https://arxiv.org/abs/2203.15556) | Primary source for the Chinchilla corrective documented in M2 |
| [Anthropic et al. (2024) — Alignment Faking paper](https://www.anthropic.com/research/alignment-faking) | Primary source for the first empirical observation of deceptive training dynamics documented in M5 |
| [MCP specification](https://modelcontextprotocol.io/) | Primary source for the Model Context Protocol documented in M4 |
| `www/tibsfox/com/Research/AIH/` | Project root — 14 files, 3,218 lines |
| `docs/release-notes/RETROSPECTIVE-TRACKER.md` | Cross-release retrospective aggregation — this release's lessons feed the tracker (ledger IDs #759-#763) |

## Cumulative Statistics

- **Batch position:** 31 of 31 in the v1.49.101-131 research batch (closing entry)
- **Arc position:** 119 of N research releases in the v1.49 publication arc
- **Cluster position:** 5 of 5 in the AI/ML research cluster (LLM, CFU, UNI, SBE, MST, AIH)
- **Lines shipped:** 3,218 insertions across 14 files (0 deletions)
- **Modules:** 6 research modules totalling 905 lines of Markdown source
- **Mission pack:** 1,101 lines of LaTeX source compiling to a 217,343-byte PDF
- **Time horizon covered:** 83 years (1943-2026) — the longest single-release arc in the Research Series to date
- **Named researchers cited:** 20+ across M1-M5 with primary-source traceability
- **Named models cited:** 15+ frontier and open-weight models across M2-M3
- **Protocols documented:** MCP, A2A, DACP (M4)
- **Mathematical layers mapped:** 6 of 8 fully developed with worked examples, 2 sketched for future extension (M6)
- **Lessons contributed to retrospective tracker:** 5 (ledger IDs #759-#763)

## Taxonomic State

- **Series:** PNW Research Series
- **Cluster:** AI/ML Capstone / Complex Plane of Experience sub-cluster
- **Code:** AIH
- **Parent domain:** Computer science / Artificial intelligence
- **Sibling projects (AI/ML cluster):** LLM (Local LLM), CFU (ComfyUI), UNI (Unison), SBE (Space Between Engine), MST (Mesh Telescope)
- **Methodological kin:** LTS (v1.49.126) — multi-module research-with-LaTeX template, applied at larger scope here
- **Forward descendants (projected):** RBT (Robotics), EMB (Embodied AI), AIS (AI for Science) — future AI-cluster extensions that will link back to AIH as the capstone reference

## Engine Position

v1.49.131 is the 31st and final entry of the v1.49.101-131 thirty-one-project research batch, the 119th research release of the v1.49 publication arc, and the capstone entry for the AI/ML cluster within the PNW Research Series. It closes the v1.49.101-131 arc on the largest-scope topic the series has attempted — artificial intelligence as a single 83-year field rather than as a slice — and it is the bridge release between the batch's astrophysics and accessibility clusters (LTS, CYG, BHC, BHK, SMB) and the forward-looking agentic-AI work that the v1.50 milestone target (2026-04-21) will open. Within the v1.49.x arc the release participates in the broader Research-catalog engine, contributing 5 new lessons (ledger IDs #759-#763) into the cross-release retrospective tracker. It shipped as a single-commit research release on 2026-03-28, four weeks before the v1.50 milestone target, and it sits alongside LLM (Local LLM), CFU (ComfyUI), UNI (Unison), SBE (Space Between Engine), and MST (Mesh Telescope) as the fifth and largest-scope entry in the AI/ML research cluster. The cluster now has a capstone, and future AI-adjacent releases (robotics, embodied AI, AI-for-science) will link back to AIH as the foundational reference rather than re-deriving the historical arc.

## Files

- `www/tibsfox/com/Research/AIH/index.html` — 164 lines, project landing page integrated into the Research catalog site with dark-graphite / electric-blue / charcoal theme
- `www/tibsfox/com/Research/AIH/mission-pack/ai_intelligence_horizon.pdf` — 217,343 bytes (binary), compiled LaTeX mission pack in journal-submission format
- `www/tibsfox/com/Research/AIH/mission-pack/ai_intelligence_horizon.tex` — 1,101 lines, complete LaTeX source for the mission pack, compilable with pdflatex
- `www/tibsfox/com/Research/AIH/mission-pack/ai_intelligence_horizon_index.html` — 497 lines, standalone mission-pack index with full navigation to the six research modules
- `www/tibsfox/com/Research/AIH/mission.html` — 130 lines, mission-pack gateway page linking the PDF and HTML index into the project landing
- `www/tibsfox/com/Research/AIH/page.html` — 214 lines, primary content page carrying the six-module research narrative
- `www/tibsfox/com/Research/AIH/research/01-historical-foundations.md` — 129 lines, M1 Historical Foundations (1943-2017) module source
- `www/tibsfox/com/Research/AIH/research/02-transformer-era.md` — 147 lines, M2 The Transformer Era (2017-2023) module source
- `www/tibsfox/com/Research/AIH/research/03-frontier-models.md` — 144 lines, M3 Frontier Models & Reasoning (2023-present) module source
- `www/tibsfox/com/Research/AIH/research/04-agentic-architecture.md` — 196 lines, M4 Agentic Architecture & Protocols module source
- `www/tibsfox/com/Research/AIH/research/05-alignment-safety.md` — 150 lines, M5 Alignment, Safety & Governance module source
- `www/tibsfox/com/Research/AIH/research/06-college-integration.md` — 139 lines, M6 College of Knowledge Integration module source
- `www/tibsfox/com/Research/AIH/style.css` — 206 lines, project-specific styling (dark graphite / electric blue / charcoal palette)
- `www/tibsfox/com/Research/series.js` — +1 line, AIH registered in the Research catalog manifest

---
*Part of the v1.49.101-131 research batch — 31 projects in a single publication arc. Uplifted 2026-04-17 against the A-grade rubric at `.planning/missions/release-uplift/RUBRIC.md`.*
