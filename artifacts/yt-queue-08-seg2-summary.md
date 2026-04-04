# MCP Dev Summit -- Segment 2 Summary (lines 9000-18000, ~00:51:00-01:20:00)

## Speakers and Talks

### 1. James (AWS) -- Concluding Remarks on Agent Configuration Registries (~00:51-00:53)

James wrapped up his talk on Amazon's agent configuration registry approach. Key points:

- **"MCP is not dead."** It is a central part of AWS's AI strategy. MCP and skills are not either/or -- Amazon bundles them as complementary capabilities within agent configurations.
- **Context bloat is solvable.** The context window problem is not inherent to MCP but rather how MCP clients currently use it. Amazon is experimenting with progressive disclosure of skills and wrapping MCP tools behind CLIs with minimal context hints, letting agents explore on demand.
- Vendors can declare in their agent configuration which tools should inject directly into context vs. which should surface as CLI-available tools with just a brief description -- saving tokens and improving performance.
- Security: Using Simon Willison's "lethal trifecta" framework (private data + untrusted content + external communication = exfiltration risk), Amazon scans agent configurations to flag risky tool combinations.

### 2. Magna and Rush (Uber) -- MCP at Massive Scale (~00:53-01:08)

Magna (Agentic AI Lead) and Rush (Head of Engineering, Agentic AI Platform) presented Uber's journey deploying MCP across 5,000+ engineers and 10,000+ services.

**Scale:** 90% of engineers use AI monthly. 500+ active agents internally, 60,000+ agent executions per week. This is no longer a pilot -- it is the standard.

**Three classes of problems encountered:**
1. **Development lifecycle** -- No standard way to develop/deploy MCP servers. Teams built custom integrations in silos with non-reusable code.
2. **Security and governance** -- Agents amplify blast radius vs. humans. Needed complete visibility into call patterns, data access, and third-party MCP data handling.
3. **Discovery and quality** -- How do agents find the right MCP? Bad tools degrade agent performance.

**Solution: MCP Gateway and Registry** -- a control plane for all MCP interactions at Uber:
- Config-driven approach: automatically translates 10,000+ service IDL (proto/thrift) into MCP tool definitions using LLMs to generate descriptions.
- Service owners retain control over which tools get exposed and fine-tune descriptions.
- Separate security tiers for third-party vs. internal MCPs (more gating/scanning for external).
- Central authorization service integration, PII redaction, periodic code scanning, guardrails blocking mutable endpoints, full observability (logging, metrics, tracing).
- Three consumption surfaces: Uber Agent Builder (no-code), Uber Agent SDK (code-first, powers grocery assistant/care/customer support agents), and Coding Agents (Claude Code, Cursor, plus "Minions" background agents producing 1,800 code changes/week).
- Tool-level selection and parameter overrides to reduce LLM decision-making and improve reliability.

**Roadmap:** Evaluation metrics in registry (SLAs, reliability tiers), tool search for on-demand discovery (reduces context bloat), skills as shareable "recipes" for MCP usage, and A/B testing of skills.

### 3. Shang Leang (Obot, CEO) -- Enterprise MCP Adoption and the Evolving Gateway (~01:09-01:19)

Shang, co-founder of the MCP Dev Summit, spoke about enterprise MCP adoption patterns from Obot's perspective serving financial institutions and smaller companies.

**Key message:** Every enterprise starting with agents needs two things -- an MCP gateway and an MCP registry. This is the consensus pattern.

**How agent development is changing:**
- Agents used to be RAG chatbots, then workflow agents. Now they look like skills -- markdown files plus generated code, with the MCP layer replacing traditional SDK/framework patterns.
- The "runtime" concept is emerging: agents as running entities accessed via standard protocols like MCP, plus CLIs, agentic browsers, skills libraries.

**Security and governance evolution:**
- Software supply chain attacks are a major concern for MCP servers and skills libraries.
- Access control and policy are being **elevated out of the application/agent layer into the gateway layer** -- a fundamental architectural shift from traditional SaaS where apps managed their own access control.
- Enterprise agents need secure isolated runtimes (not desktop-bound), identity-aware execution (knowing who the agent acts on behalf of), and approval workflows for sensitive actions.
- The MCP gateway now encompasses supply chain filtering, LLM gateway visibility, and secrets management.

## Connection to Our Architecture

Several patterns discussed directly validate or inform our system:

- **Progressive disclosure of skills** -- We already do this with deferred tools and auto-activating skills. Amazon's approach of CLI-wrapping MCP tools with minimal context hints mirrors our ToolSearch pattern exactly.
- **Agent configuration registry** -- Our `.claude/skills/` auto-activation system and agent definitions in `.claude/agents/` are a local implementation of the same concept Amazon and Uber described.
- **Skills as recipes for MCP usage** -- Uber's roadmap item aligns with our skill-creator architecture: skills that bundle tool configurations, conventions, and evaluation criteria.
- **Gateway pattern for security** -- Our security-hygiene skill and hook-based guardrails (PreToolUse, commit validation) are the local equivalent of Uber's gateway guardrails.
- **Tool-level selection and parameter overrides** -- We do this via skill descriptions and system prompts constraining tool usage.
- **Evaluation and A/B testing of skills** -- Uber's planned evaluations for skill quality/correctness map to a gap in our system worth addressing.
- **Software supply chain concerns** -- Directly relevant to our MCP server configurations and skill installation pipeline.
