# MCP Dev Summit -- Segment 3 Summary (~1:40:00 to 2:03:00)

## Talks in This Segment

### 1. Zayn Malik (Workado) -- "7 Factors for Reliable Agentic Systems"

Zayn and a co-speaker presented seven architectural principles for building production-ready agent systems. This was framed as a living document (available at workado.com/7factors) with an open-source reference app called "Dewey Resort."

**Seven Factors discussed:**

1. **Deterministic mutations** -- The control plane (deterministic layer) should own all creates, writes, and deletes. The reasoning/probabilistic layer should never have direct access to mutable state.

2. **Intent-based communication** -- Tools should expose intent (what gets done), not implementation details. This keeps context windows lean and reduces exfiltration surface. The LLM should not know it is calling 17 underlying APIs.

3. **Bounded access** -- Principle of least privilege applied to agentic systems. Gateway-level filtering and restricting MCP server tools to minimize blast radius from prompt-injected agents. They called it the "lethal trifecta" -- when a prompt-injected agent has too much access.

4. **Safe retries** -- Probabilistic callers do not know if they are calling for the first or second time. Idempotency keys behave differently. Deduplication layers may break. Backend systems must be rebuilt for this new retry pattern.

5. **Recovery contracts** -- Error handling must change because a reasoning caller interprets a 400 vs 500 as "what should I do next" rather than branching deterministically. Explicit retry-safe signals should be sent to the reasoning layer.

6. **Structural observability** -- Observability by design, not just developer-added logs. Track what happened, what was the intent, what system was called and why. LLMs are black boxes -- even if asked what they did, truthful answers are not guaranteed, so observability must be enforced from the deterministic layer.

7. (Implicit) The seventh factor was referenced but enumerated earlier in the talk before this segment began.

### 2. Diamond Bishop (Datadog) -- "From Single MCP Prototype to Enterprise Scale"

Diamond Bishop, Director of Engineering and AI at Datadog, shared lessons from building their first ~100 production agents. He previously worked on Cortana, Alexa, and other conversational AI systems (15+ years).

**Datadog's three agent categories:**
- **Bits AI SR** -- Automated SRE agent that autonomously investigates alerts so on-call engineers are not woken at 2am
- **Bits AI Dev** -- Code generation agent that finds errors, latency issues, and proposes fixes directly in Datadog
- **Security Analyst** -- Automates security investigation checklists and alert triage

**Key lessons from scaling agents:**
- **Code and agent first** -- Design all interfaces to be agent-friendly. Publish llm.txt files. UX teams must design for agent users, not just humans. He referenced the "Bezos API mandate" as a parallel -- a new version of this mandate exists for agents.
- **Proactive over reactive** -- The winning agents run in the background for hours, event-driven, not requiring babysitting. Use durable execution frameworks (Temporal recommended). Run agents in containers/sandboxes, not local machines.
- **Eval, eval, eval** -- Never launch an agent without offline eval, online eval, and a living eval system. Make eval tooling available through MCP servers so agents can self-improve.
- **The "bitter lesson" for agents** -- Keep agent harnesses simple. Build them to rewrite them. Models change constantly. Stay model-agnostic and framework-agnostic. Good memory systems let you preserve learnings across model swaps.
- **Multiplayer** -- Not just human-to-human anymore. It is human-and-human, human-and-agent, agent-and-agent. Build communication patterns for all three.
- **Dispatch Agents AI** -- New Datadog product encoding these learnings.

**Looking ahead:** More on-the-job learning, longer-running independent agents, multimodal agents with "eyes" (computer use becoming practical).

### 3. Nick Aldridge (Mousecat / MCP Core Maintainer) -- "Primitives for Agent Interactions" (beginning)

Nick Aldridge, formerly a principal engineer at AWS, MCP core maintainer, and now CEO of Mousecat (YC grad, fighting AI-enabled fraud), began a talk on agent integration modalities.

**Historical arc of agent tooling:**
- Early GPTs good at chatting led to RAG applications
- Langchain/Langraph enabled workflow automation
- Models got good enough for reliable tool/function calling
- Everybody built the same tools (Google, Salesforce, Confluence integrations) -- MCP emerged to share tools via a standard protocol

**Three integration primitives compared:**
- **CLIs** -- Context-efficient (code is dense), composable (pipe outputs), same interface for humans and machines. Downsides: requires remote code execution, integration/installation overhead, dependency bloat.
- **MCP** -- Bidirectional, has elicitation semantics for human interaction, easy to integrate (one client talks to any server), standard authorization, more secure (curated tool sets vs arbitrary code execution). Downsides: context bloat from tool listings, not composable (cannot pipe two MCP tool outputs), and requires writing/maintaining MCP servers.
- **Skills** -- Emerged as a way to dynamically provide context and instructions to agents. A skill can orchestrate many tool calls and API calls behind a single intent (e.g., "book a hotel").

Nick framed skills as the higher-level abstraction above tools -- they provide context about *how* to accomplish composite operations.

## Connection to Our Architecture

This segment validates several patterns we already use:

- **Deterministic control plane** -- Our hook system (PreToolUse, PostToolUse) and the beads-state/hook-persistence chipset are exactly the "deterministic mutation layer" Zayn described. The polecat-worker never coordinates, the mayor-coordinator never executes. This separation is the first factor.

- **Skills as first-class primitives** -- Nick Aldridge's description of skills (context + instructions that orchestrate multiple tool calls) maps directly to our `.claude/skills/` system. We already have 34+ skills that activate contextually.

- **Eval and observability** -- Diamond Bishop's emphasis on eval systems available through MCP servers aligns with our math-coprocessor MCP and the witness-observer patrol pattern.

- **Agent-first interfaces** -- The "Bezos API mandate for agents" matches our GUPP protocol and sling-dispatch pipeline where agents are first-class consumers of work items.

- **Model agnosticism and memory** -- The bitter lesson advice (stay model/framework agnostic, use memory systems) validates our runtime-hal skill and the memory architecture in `.claude/` that persists across sessions regardless of model.

- **Background durable agents** -- Bishop's call for event-driven, long-running agents in containers matches our Gastown convoy model with worktree isolation.
