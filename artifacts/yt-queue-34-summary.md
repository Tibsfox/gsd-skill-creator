# Research Summary: Context Engineering Is a Formula

**Source:** "Context Engineering Is a Formula" (21 min, YouTube ID: dLkVspcJ1m0)
**Speaker:** Chris (builder, Clip Cannon / OCR Provenance systems)
**Processed:** 2026-04-03 | Artemis II Research Queue #34

---

## 1. Core Thesis

Chris argues there is exactly **one correct way** to think about building AI systems, agents, or interacting with AI. It is a formula with fixed variables. The variables interact in defined ways, and understanding these interactions is the entire discipline of context engineering.

The formula reduces to:

```
Output = AI_Model(Context_Window(Start, End, Prompt, Memory))
```

Where:
- **Start** = current system state (where you are now)
- **End** = desired output state (where you want to get to)
- **Prompt** = the bridge description between start and end
- **AI Model** = the knowledge engine (all public human knowledge, simplified)
- **Memory** = external corpus accessible via RAG with provenance

---

## 2. Key Concepts

### 2.1 Epistemic Symmetry

The foundational theoretical claim. Traditionally: Question -> iterative exploration -> Answer. The hardest part was forming the right questions (Socratic method). LLMs invert this: given an answer/output, they can generate the questions that would have produced it with >90% semantic similarity to originals. Question and answer become **bidirectional** -- epistemically equivalent.

**Implication:** You can start from the output (what you want) and work backwards. This is why defining the end state clearly is more important than crafting the perfect question.

### 2.2 Start-End-Connection Model

The formula in practice has three phases:

1. **Define the Start** -- Load current system state into the context window. Chris uses 16 maintained documents describing his codebase, kept current, loaded into Claude's 1M context window at session start. "Read these documents and then stop. So you can understand the system."

2. **Define the End** -- Describe the desired output/feature state in the prompt as precisely as possible. The AI needs both anchors (start and end) to build a connection.

3. **Build the Connection** -- The AI applies "all the knowledge of all of humanity" to find the highest-probability path from start to end. This connection is the output.

### 2.3 Full State Verification (The Critical Step)

After the AI builds an initial connection, you must **stop and verify**. Chris calls this "full state verification" -- passing information through every function, every class, testing that each transformation produces expected outputs.

> "AI will get me most of the way there, but then I will need to do full state verification, manually testing of everything and fine-tuning at each step till I get everything perfectly just the way I want it before I move on to the next step."

The verification loop:
1. AI generates initial output (crude connection)
2. Human reads the spec/output, verifies correctness
3. Output feeds back into the prompt
4. AI refines with the verified output as new context
5. Repeat until each step is verified

**Key principle:** "Make sure you're building on good architectural building blocks." Never proceed to the next step until the current step is verified perfect.

### 2.4 Anti-Pattern: Parallel Agent Strategy

Chris explicitly argues **against** parallel agent architectures. His reasoning:

- Parallel agents create multiple crude start-end connections simultaneously
- This produces "five bad connections" that you then have to evaluate
- Better approach: make **one connection and optimize it** iteratively
- "Instead of making five bad connections and then being like 'let me look over them all and see which one's the best' -- that's stupid. You just make one and optimize it."

The optimization cycle: build initial connection -> verify -> tell AI to optimize (performance, accuracy, cost) -> verify -> iterate.

### 2.5 Context Window Degradation

Practical observation about Claude's 1M token window: as the window fills, the AI starts condensing older information. The context follows a sawtooth pattern -- fills up, prunes, drops back, fills again. Long sessions require:
- Awareness that older context gets compressed
- Occasional reminding of important earlier information
- Paying attention to when the AI starts to "drift"

Chris reports running a 16-hour Playwright session with Claude, noting this condensation behavior.

### 2.6 AI Memory as Infinite Context

AI memory (external RAG systems) unlocks **infinite context** beyond the window. The role of memory is to answer: "What in this huge corpus of data can I pull out to strengthen my start, strengthen my end, or figure out how to strengthen my connection?"

Memory doesn't replace the context window -- it feeds into it selectively based on the current task.

---

## 3. OCR Provenance System (Tool Demo)

Chris demoed his context engineering dashboard (OCR Provenance, an npm package):

- **Multiple siloed databases** -- e.g., 1,147 Alex Hormozi transcripts + 3 books for business knowledge
- **18 file type support** -- DOCX, PDF, images, Excel, with full data cleaning pipeline
- **10 OCR models** -- 9 lightweight + 1 vision language model, each specialized for different document types
- **Perfect chunking** -- tables fully preserved, images described by VLM for semantic search
- **Full provenance** -- every chunk links to original document location, so the AI can choose to read the full source
- **13 embedders** including 3 custom temporal embedders and a cause-effect embedder
- **Cause-effect embedding**: custom embedder where causes and effects are adjacent in the semantic space. Search for a cause, related effects surface. Search for an effect, the causes appear nearby.
- **Temporal embedders**: filter search results by time (e.g., "only results from the last day")
- **Agent access**: agents can be restricted to specific databases, or given freedom to adjust search across all 13 embedders to optimally answer a query

**Key distinction from standard RAG:** Normal RAG returns a chunk with no context. Provenance-based RAG returns a chunk + the original document location, so the AI can navigate to full context when needed.

---

## 4. Connections to Our Architecture

### 4.1 CLAUDE.md as Start State

Chris's "16 documents loaded at session start" maps directly to our CLAUDE.md + MEMORY.md pattern. Our CLAUDE.md defines the system state (tech stack, file locations, conventions, build commands). MEMORY.md carries the hot/warm context. This is his "Start" variable -- defining where we are.

**Validation:** We're already doing this correctly. The combination of CLAUDE.md (project instructions), MEMORY.md (session state), and .planning/ (roadmap, state) provides exactly the "read these documents and stop so you can understand the system" pattern he describes.

### 4.2 GSD Planning as End State

GSD's vision-to-mission pipeline (REQUIREMENTS.md -> ROADMAP.md -> PLAN.md) is exactly his "End" variable. Each phase plan defines the desired output state. The discuss-phase -> plan-phase -> execute-phase flow is the start-end-connection-verify cycle.

### 4.3 Skill Activation as Connection Optimization

Our auto-activating skills (.claude/skills/) are connection optimizers. When a skill activates based on context, it's doing what Chris describes: pulling relevant knowledge from a domain-specific corpus to strengthen the connection between current state and desired output.

### 4.4 Full State Verification = GSD Verification

His "full state verification" maps to our verify-work, test-generator, and the TDD RED-GREEN cycle. His insistence on "never move to the next step until the current step is verified" mirrors our wave-based execution with verification between waves.

### 4.5 Anti-Parallel Nuance

Chris's anti-parallel stance is nuanced against our architecture. We use parallel agents successfully (4 Opus agents for synthesis, convoy model at 50+ project scale). The key difference: our parallel agents operate on **independent work items** with independent start-end pairs. Chris's critique targets parallel agents working on the **same** start-end connection -- generating competing solutions to the same problem. Our model generates one solution per work item per agent, which aligns with his "make one and optimize it" principle.

### 4.6 Provenance and pgvector

His provenance-based RAG with 13 embedders directly relates to our pgvector setup (maple@tibsfox, schema artemis, 1,087 pages loaded). Our embedding work should follow his pattern: chunks must carry provenance back to source documents. The cause-effect embedder concept is particularly relevant for our research series -- connecting research findings to their implications.

### 4.7 Epistemic Symmetry and Spec-First Development

His "start with the output" maps to our spec-first approach. GSD's REQUIREMENTS.md defines the output before any code is written. The AI generates the path (PLAN.md -> implementation) from the spec, which is exactly his formula: define the end, let the AI build the connection.

---

## 5. Actionable Takeaways

1. **Context window discipline** -- Be aware of degradation in long sessions. Restate critical context when the window gets deep. Our hooks and skills already inject context; this validates the approach.

2. **One-and-optimize over many-and-pick** -- For any single feature/problem, generate one solution and iteratively refine rather than generating multiple competing approaches.

3. **Provenance in RAG is non-negotiable** -- Every chunk must link back to its source. When we expand our pgvector system, ensure document_location is always preserved.

4. **Cause-effect embeddings** -- Consider specialized embedders for our research corpus. A cause-effect embedder would surface "if X research finding, then Y implication" connections automatically.

5. **Verification as the bottleneck, not generation** -- The AI gets you "most of the way there." The real engineering work is in verification loops. This validates our heavy investment in test infrastructure (21,298 tests).

---

## 6. Speaker Credibility Assessment

Chris demonstrates hands-on builder credibility: working system with live demo, enterprise deployment (5 call centers), 16-hour autonomous session with Playwright, custom embedders, npm package. The theoretical framing (epistemic symmetry) is presented as established rather than novel -- he references it as a proven study field. His anti-parallel stance is strongly opinionated but well-reasoned for the single-problem case. The OCR Provenance system shows genuine depth in the RAG/memory space.

**Limitation:** The presentation is informal (live stream with MS Paint diagrams), and some claims are not attributed to specific papers or benchmarks. The >90% semantic similarity claim for epistemic symmetry is stated without citation.

---

*Processed from auto-generated captions. Speaker identified as "Chris" from audience interaction. Some tool/product names may be approximate due to transcription quality (e.g., "OCR Providence" vs "OCR Provenance").*
