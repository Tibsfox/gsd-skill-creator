# MCP Dev Summit Segment 5 Summary (~02:55-03:38)

## Speaker

**Alex Salazar**, Founder and CEO of Arcade.dev -- an "actions runtime" company that provides MCP gateway and governance infrastructure for enterprise agent deployments. Former VP of Products at Okta.

## Talk: MCP Gateway Patterns and Enterprise Agent Security

Salazar's talk addressed the critical gap between agent reasoning and agent action, arguing that the industry has focused heavily on the reasoning layer (context, workflows, inference) while under-investing in the action layer -- how agents securely connect to business systems and take actions on behalf of users.

## Key Protocol and Architecture Details

**The core authorization question for agents:** "Can this agent, on behalf of this user, perform this action on this resource?" This requires an AND-gate intersection of agent permissions and user permissions evaluated on every single request. This is not a new model -- it maps to OAuth 2.1 and existing enterprise identity infrastructure.

**Why agents break traditional trust models:** Unlike SaaS applications (where you can trust Salesforce to enforce its own rules), agents are non-deterministic and probabilistic. They will disable tests they don't like, replace their own guardrails, and choose correcting failure over adhering to safety. Anthropic's own research confirms this. You cannot trust an agent to enforce its own policies.

**The three-layer architecture Salazar proposed:**
1. **Tool Layer (MCP servers/tools):** Raw agentic connectors, optimized for LLM consumption -- not API wrappers. Organization-blessed, security-scanned, spec-compliant.
2. **Skills Layer:** Procedural knowledge and workflows that tell agents how to compose tools. Skills do not replace MCP -- they build on top of it. MCP tools are the building blocks; skills are the orchestration. Active MCP working group conversations on making skills a first-class primitive.
3. **Agent Layer:** Bespoke experiences (Claude, Cursor, custom agents) that stand atop shared tools and skills, centrally managed and configured.

**MCP Gateway as enterprise control plane:** The gateway provides identity separation (agent vs. user), tool curation, per-request authorization enforcement, and audit trails. Each agent gets scoped access -- coding agents don't need SAP, sales agents don't need Jira. Workspaces partition MCP server visibility by team/function.

**Checklist for evaluating MCP gateway solutions:** Identity separation, tool curation (quality + spec adherence), authorization depth (downstream system-aware), multi-user support, observability (who did what, when, which agent, which user, which service, what context), and governance/compliance (SOC 2, Sarbanes-Oxley).

**Live demo:** Showed Claude connected to Arcade as its MCP gateway, reading Gmail with a trinary token (agent + user + downstream service), checking scopes and claims at runtime.

## Connection to Our Architecture

This talk directly validates several patterns in our system:

- **Skills as procedural knowledge over MCP tools** -- this is exactly what `.claude/skills/` implements. Salazar explicitly said skills are workflows over building blocks, not replacements for MCP.
- **Trust enforcement at the action boundary** -- aligns with our trust system design (trust-relationship.ts, 95 tests passing). The AND-gate intersection model maps to our earned-trust philosophy.
- **Tool curation and quality** -- Arcade's toolbench.arcade.dev concept (ranked/reviewed MCP servers) parallels our tool quality approach in the math co-processor.
- **Agent identity separation** -- relevant to our multi-agent orchestration (mayor-coordinator, polecat-worker, GUPP). Each agent having distinct identity and scoped access is the enterprise version of our agent isolation patterns.
- **Observability as first line of defense** -- our hook system (PreToolUse, session state) and audit patterns serve the same purpose at a smaller scale.
