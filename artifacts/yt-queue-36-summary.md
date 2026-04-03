# Research Summary: AmpGPT Across the Organization

**Source:** "AmpGPT across the organization" (1h21m, YouTube ID: Uq5TzSilBp0)
**Speaker:** Al Shalloway (Net Objectives, Amplio)
**Processed:** 2026-04-03 | Artemis II Research Queue #36

---

## Context

Al Shalloway presents the evolution of AmpGPT -- a specially trained ChatGPT instance built on his Amplio framework -- from a personal knowledge companion into an organizational deployment model. Recorded approximately 17 days after AmpGPT's initial release, this session captures the rapid capability discovery phase and the pivot from individual to enterprise thinking.

## Speaker Background

- Developer turned coach/consultant (1996), founded Net Objectives (1999)
- Deep roots in agile, lean, Theory of Constraints, systems thinking
- ~500-700 hours training AmpGPT over one year prior to release
- Conference circuit veteran: estimated 10,000+ practitioners spoken with across ~8 conferences/year (2001-2018)
- Influenced by Fernando Flores, Christopher Alexander's pattern work, Goldrat (Theory of Constraints)
- Degrees spanning mathematics, engineering, computer science, and psychology

---

## Key Claims and Technical Details

### 1. The "10-20% Capability" Thesis

Shalloway's core belief: organizations operate at 10-20% of their actual capability. Not a political statement -- purely about value creation efficiency. This frames everything he builds. The bottleneck is not talent but how organizations learn, communicate, and make decisions.

**GSD connection:** This directly parallels our thesis that developer tooling captures perhaps 10-20% of what developers know and can do. GSD aims to raise that ceiling by making planning, execution, and knowledge explicit.

### 2. Four Dynamics Model (The "LEFT" Acronym)

Amplio is built on four interconnected dynamics:

| Dynamic | Focus | Maps to |
|---------|-------|---------|
| **System Dynamics** | How teams fit into larger value delivery systems | Physics of flow, delays, feedback |
| **Cognitive Dynamics** | How people react, resist, and process change | Cognitive dissonance, emotional decision-making |
| **Learning Dynamics** | How people absorb, retain, and change | Rate limits on learning, stepwise migration |
| **Physics of Flow** | Governing dynamics of work movement | WIP limits, feedback loops, cycle time |

The "LEFT" acronym = Lean, EVO (Tom Gilb), Flow, Theory of Constraints. "Shift left" -- all four tell you how to get information earlier.

**Key insight:** Most frameworks (SAFe, Scrum, LeSS) address system dynamics but ignore cognitive and learning dynamics almost entirely. Certification workshops are "the antithesis of how you learn."

### 3. How AmpGPT Was Built (And Why It's Different)

The training process was NOT primarily about uploading documents. Three layers of training, in order of importance:

1. **Axioms and first principles** -- the thought process itself, not predefined practices
2. **Conversations** -- interactive refinement over hundreds of hours
3. **Uploaded materials** -- books, frameworks, reference material (least important)

**Critical distinction:** AmpGPT is built on axioms and governing dynamics, not predefined practices. This is what makes it different from a typical custom GPT loaded with documents. The system can reason from principles to novel situations rather than pattern-matching against uploaded content.

**GSD connection:** This mirrors our skill-creator architecture. Skills are not predefined scripts -- they're capability patterns that adapt to context. The axiom-based approach is exactly what makes gsd-skill-creator different from template-based tooling.

### 4. LLM Capability Boundaries (Deduction vs. Creation)

Shalloway identifies specific LLM limitations from his 500+ hours of interaction:

- **Strong:** Deduction and synthesis within existing connections. If A and B are connected, it can extend those connections.
- **Weak:** Connecting A and B when you haven't explicitly shown the relationship. It won't discover connections on its own.
- **Cannot do:** Create genuinely new concepts (C that didn't exist before). "I've never seen it do that in my hours of conversations."
- **Hidden capability:** LLMs can do things they won't volunteer. "Hey, can you do this?" is one of the most powerful prompts.

**Quote:** "Knowledge is knowing a tomato is a fruit. Wisdom is not putting it in a fruit salad."

### 5. The Drift Problem

When adapting AmpGPT for organizational use, the primary risk is **drift** -- divergence from the foundational axioms as context-specific content gets layered on.

- If you build ON TOP of the axiom base, the system stays coherent
- If you pick and choose, injecting context-specific practices without the foundational reasoning, drift occurs
- Drift detection is a built-in capability: ask AmpGPT to check for inconsistencies between the organizational layer and the foundational layer

**GSD connection:** This is directly relevant to our skill ecosystem. Skills built on top of GSD's core workflow stay coherent. Skills that cherry-pick patterns without the underlying planning/execution model drift. Our `.claude/skills/` auto-activation model is the mechanism that prevents drift -- skills inherit context from the planning layer.

---

## Organizational Deployment Model

### Three-Layer Architecture

```
+------------------------------------------+
|  PRACTICES (fully adaptable, team-level)  |
+------------------------------------------+
|  CAPABILITIES (context-dependent, guided) |
+------------------------------------------+
|  OBJECTIVES (global consistency, non-neg) |
+------------------------------------------+
|         AmpGPT / Amplio Foundation        |
+------------------------------------------+
```

1. **Objectives** (top, non-negotiable): Stakeholder-aligned value, feedback loops, cadence. Requires systems thinking + physics of flow.
2. **Capabilities** (middle, guided): What teams need to be able to do. Requires all four dynamics. Context-dependent but not reinvented.
3. **Practices** (bottom, fully adaptable): How teams actually work. Fully team-determined within the capability framework.

**Key principle:** "We're not standardizing practices. We're standardizing the thinking and decision-making."

**GSD connection:** This maps directly to our architecture:
- Objectives = `.planning/ROADMAP.md` + `REQUIREMENTS.md` (non-negotiable project intent)
- Capabilities = `.claude/skills/` + `.claude/agents/` (guided, context-aware)
- Practices = Individual phase execution, team-specific workflows (fully adaptable)

### Deployment Mechanism

1. A trained transition agent sets up the organizational GPT instance
2. Core AmpGPT reasoning is preserved as the foundation
3. Organization-specific content layered on top: security policies, glossaries, protocols, governance rules
4. Users invoke with a trigger phrase (e.g., "engage as [CompanyName] AmpGPT")
5. The system enforces consistency through continuous interaction, not control

### What the Organizational Layer Enables

- **Onboarding:** New employees interact with the system to learn company processes, can ask "why" about any rule
- **Stepwise migration:** "I can't do that right now -- help me create a migration plan with budget"
- **Real-time governance updates:** Change a policy, it ripples through all interactions
- **Role-play and coaching:** Practice difficult conversations, test understanding
- **Budget justification:** "Write a post to my manager explaining why I need resources for this transition"

---

## Interaction-Driven Learning (IDL)

This is the pedagogical model Shalloway is most excited about. Key properties:

1. **Not lecture-based:** Small bits, during the work day, in context
2. **Bidirectional:** The learner's explicit knowledge grows, which raises their tacit knowledge ceiling
3. **Adaptive:** System adjusts to where the learner actually is, not where a curriculum assumes they are
4. **Multi-modal:** Ask questions, get guidance, practice coaching, role-play conversations, get certified
5. **Book-integrated:** Reading a chapter, don't understand something? Ask AmpGPT, which has read the book and knows the Amplio context

**The calculator vs. slide rule warning:** Shalloway noticed himself getting lazy -- giving outlines and having AmpGPT write brilliant output. The risk is atrophy of deep thinking when the tool is too capable. He's "getting careful about that."

**GSD connection:** This maps to our learning journey vision. The skill-creator as adaptive learning layer is exactly this pattern. Skills don't just execute -- they teach by exposing reasoning. Our muse team model (13+1) operates as interaction-driven learning peers.

---

## Novel Insights and Actionable Findings

### 1. Axiom-Based AI Training > Document-Based Training

The most actionable finding: uploading documents to a custom GPT is the least important part of training it. What matters is encoding the REASONING PROCESS -- axioms, principles, and the connections between them. This takes hundreds of hours of interactive conversation, not bulk uploads.

**Action for us:** Our skill-creator should prioritize capturing reasoning patterns (why decisions were made) over capturing outputs (what was decided). The `.planning/` directory already does this implicitly -- STATE.md, ROADMAP.md capture intent, not just status.

### 2. The "Hey, Can You Do This?" Discovery Pattern

Every capability of AmpGPT was discovered by asking "can you do this?" -- not by planning it in advance. The capability discovery cycle: idea -> ask -> (80% yes, 15% "not that way but this way", 5% no) -> integrate -> repeat.

**Action for us:** This is how we should extend gsd-skill-creator capabilities. Rather than pre-planning every skill, discover them through interaction. The research queue itself is this pattern in action.

### 3. Consistency Through Interaction, Not Control

The organizational model replaces top-down process enforcement with continuous AI-mediated interaction. People follow the framework because the AI helps them understand WHY at the moment they need it, not because a mandate says they must.

**Action for us:** This validates our hook/skill auto-activation model. Skills activate based on context, not explicit invocation. The PreToolUse hook that enforces commit conventions is exactly this -- consistency through interaction, not control.

### 4. Agentic Extensions (Emerging)

Shalloway and his colleague Casey are beginning to explore agentic AI -- connecting AmpGPT to tools like Confluence to analyze organizational repositories and provide Amplio-based recommendations. This was described as a "just occurred to me" moment during the session.

**Action for us:** Our MCP server architecture and agent orchestration (mayor-coordinator, polecat-worker, sling-dispatch) are already ahead of where Shalloway is imagining. The insight is that the axiom-based foundation makes agentic extensions coherent -- agents that share the reasoning framework don't drift.

### 5. The 95% Cost Reduction Claim

Shalloway estimates the AmpGPT organizational model reduces the cost of full organizational transformation by 90-95% while getting better results. The mechanism: only a few key people need deep training; the AI handles the mass distribution of capability.

**Relevant framing:** This maps to our multi-agent model where a single coordinator (mayor) can dispatch work to many workers (polecats) because they share the GSD planning substrate. The planning is the expensive part; execution through agents is cheap.

---

## Connections to Our Architecture

| AmpGPT Concept | GSD Equivalent | Status |
|----------------|----------------|--------|
| Axiom-based foundation | `.planning/` + GSD core workflow | Active |
| Organizational GPT layer | `.claude/skills/` per-project | Active |
| Drift detection | Security-hygiene skill + hooks | Active |
| Interaction-driven learning | Skill auto-activation + context | Active |
| Three-layer objectives/capabilities/practices | ROADMAP -> Skills -> Phase execution | Active |
| Stepwise migration | GSD phases with wave-based execution | Active |
| Agentic extensions | MCP servers + Gastown chipset | Active |
| "Hey, can you do this?" discovery | Research queue pattern | Active |
| Calculator vs. slide rule risk | Standing rule: autonomous but verify | Active |

---

## Limitations of This Source

1. **Self-promotional context:** This is Shalloway presenting his own product to his ACE (training program) participants. Claims about AmpGPT's uniqueness should be weighed accordingly.
2. **Small audience:** Only 3-4 participants visible (Thomas, Tony, Susan, Casey absent). Limited pushback.
3. **No quantitative evidence:** The "10-20% capability" and "90-95% cost reduction" claims are estimates, not measured.
4. **ChatGPT-specific:** The entire approach is built on ChatGPT's custom GPT infrastructure. Portability to other LLMs is discussed but untested.
5. **Early stage:** 17 days post-release. Many capabilities are theoretical or just discovered. No organizational deployment has been completed.

---

## Summary

Shalloway's core contribution here is the insight that **axiom-based AI training creates a reasoning system, not just a knowledge base**, and that this reasoning system can be layered with organizational context to create scalable, consistent-but-adaptive transformation. The three-layer model (objectives/capabilities/practices) with AI mediating between layers is a genuinely useful architecture for thinking about enterprise AI deployment.

For our work, the strongest validation is that our architecture -- GSD planning as axiom layer, skills as capability layer, phase execution as practice layer -- independently arrived at the same structural conclusions. The main gap in Shalloway's model that we've already addressed is the agentic layer: multi-agent orchestration with shared planning substrate.
