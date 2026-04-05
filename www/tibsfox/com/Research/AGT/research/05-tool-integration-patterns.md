# Tool Integration Patterns

> **Domain:** Agentic Infrastructure & Systems
> **Module:** AGT-05 -- Integration Layer
> **Through-line:** *MCP transforms every API, every design tool, every database, and every SaaS product into a tool an AI agent can use. But the challenge is not making tools available -- it is making them discoverable, composable, secure, and efficient. The patterns that emerge from early MCP integrations echo the same lessons the web services industry learned over two decades, compressed into months.*

---

## Table of Contents

1. [MCP Tool Registration and Discovery](#1-mcp-tool-registration-and-discovery)
2. [Figma MCP: Design-to-Code Bridge](#2-figma-mcp-design-to-code-bridge)
3. [Framework-Specific Knowledge Servers](#3-framework-specific-knowledge-servers)
4. [MCP Analytics and Observability](#4-mcp-analytics-and-observability)
5. [Tool Composition and Chaining](#5-tool-composition-and-chaining)
6. [OAuth and Permission Models](#6-oauth-and-permission-models)
7. [Plugin Ecosystems and Supply Chain](#7-plugin-ecosystems-and-supply-chain)
8. [Production Deployment: MCP Cloud](#8-production-deployment-mcp-cloud)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. MCP Tool Registration and Discovery

The MCP registry, co-maintained by GitHub's Toby and Obot's Adam as part of the MCP steering committee, serves as the central discovery mechanism for MCP servers. Its role is analogous to npm for Node packages, Docker Hub for container images, or PyPI for Python libraries: a searchable catalog where developers can discover, evaluate, and connect to MCP servers.

The registry addresses three fundamental questions:
- **Discovery**: What MCP servers exist for the task I need to accomplish?
- **Evaluation**: Is this server trustworthy, well-maintained, and compatible with my client?
- **Connection**: How do I configure my agent to connect to this server?

The registration model follows a pattern familiar from package registries:

```
Developer                Registry                 Consumer
    |                       |                        |
    |-- publish(server) --->|                        |
    |                       |-- index, validate      |
    |                       |                        |
    |                       |<--- search(query) -----|
    |                       |---- results[] -------->|
    |                       |                        |
    |                       |<--- metadata(id) ------|
    |                       |---- server_info ------>|
    |                       |                        |
    |                       |              connect to server
```

GitHub's approach to MCP adoption is significant: they have "gone all in," with the GitHub MCP server becoming one of the most popular in the ecosystem. MCP was "in every conversation" at GitHub Universe. The enterprise governance layer -- allow-list policies for which MCP servers an organization's developers can use -- recognizes that unrestricted tool access creates security and compliance risks.

The governance tension is real: MCP's open protocol ethos (celebrated by Shinszo, who came from the blockchain world and saw MCP as similarly decentralized and community-driven) creates the same openness-versus-security challenge that package registries face. npm learned this lesson through incidents like event-stream; the MCP registry is building governance proactively rather than reactively.

## 2. Figma MCP: Design-to-Code Bridge

Anton Tishinka, CTO of XDST (a web development company working with NextJS, React, Astro, and Svelte), built an open-source Figma MCP server as a side product of their agency work.

The problem the Figma MCP solves: designers create components, layouts, and design systems in Figma. Developers implement them in code. The translation between design and code is manual, error-prone, and time-consuming. AI coding tools can generate code from descriptions, but they lack direct access to the design specifications -- colors, spacing, typography, component hierarchy.

The Figma MCP wraps Figma's REST API as MCP tools:

```
Figma API                    MCP Server                    Agent
    |                            |                           |
    |                            |<-- tools/list ------------|
    |                            |--- tool definitions ----->|
    |                            |                           |
    |                            |<-- get_design_tokens -----|
    |<-- GET /files/:key/styles  |                           |
    |--- style definitions ----->|                           |
    |                            |--- tokens: {colors,       |
    |                            |    spacing, typography} ->|
    |                            |                           |
    |                            |<-- get_component(:id) ----|
    |<-- GET /files/:key/nodes   |                           |
    |--- component tree -------->|                           |
    |                            |--- component spec ------->|
```

The MCP server provides structured access to:
- **Design tokens**: Colors, spacing scales, typography definitions, shadow values
- **Component specifications**: Component hierarchy, properties, constraints, auto-layout rules
- **Layout information**: Frame dimensions, padding, alignment, responsive breakpoints
- **Asset references**: Image fills, icon components, exportable assets

XDST's experience with niche CMS products (Contentful, Strapi, Optimizely, Sanity, Sitecore) informed the approach: LLMs have strong knowledge of mainstream technologies but are "not quite good" with niche tools. Rather than trying to train better models or engineer better prompts, build an MCP server that provides the missing knowledge as structured tool access.

This is a general pattern: **bridge the knowledge gap through tools, not training.** When an LLM lacks domain expertise, the most cost-effective solution is an MCP server that exposes the domain's API as structured tools, not fine-tuning or prompt engineering.

## 3. Framework-Specific Knowledge Servers

Paulo Bruti (Paris, second appearance on The Context) built a Svelte MCP server that exemplifies the framework-specific knowledge pattern. LLMs trained on internet-scale data have deep knowledge of React and Vue (heavily represented in training data) but struggle with niche frameworks like Svelte, Solid, or Qwik.

The Svelte MCP server provides:
- **API documentation**: Svelte 5 runes, component lifecycle, store contracts
- **Component patterns**: Recommended patterns for common UI elements in Svelte idiom
- **Migration guidance**: Svelte 4 to Svelte 5 migration patterns (runes replacing stores)
- **Build configuration**: SvelteKit routing, adapter configuration, deployment patterns

The show host noted this was a framework "you care deeply about -- this is obviously your baby." The emotional investment reflects a broader pattern: framework-specific MCP servers are often built by framework enthusiasts who see AI tools as force multipliers for their preferred technology.

The auto-fixer pattern Paulo described was called "the right way to build every MCP server": the MCP server does not just provide documentation but includes a tool that takes broken code, runs the framework's compiler, extracts error messages, and suggests fixes. This creates a compiler-in-the-loop feedback cycle where the agent iterates toward correct code with the compiler as its oracle.

```
Agent writes code
     |
     v
MCP auto-fixer tool
     |
     v
Framework compiler
     |
     +-- Errors? --> Extract error messages --> Return to agent
     |
     +-- Clean? --> Return success
```

This pattern is applicable beyond Svelte: any technology with a fast compiler or type checker can provide this feedback loop. TypeScript's `tsc`, Rust's `cargo check`, Go's `go vet` -- each can serve as an oracle that guides agent code generation toward correctness.

## 4. MCP Analytics and Observability

Shinszo, a developer with five years of blockchain experience, built MCP analytics tools motivated by the parallels between blockchain's decentralized protocol ethos and MCP's open architecture.

The analytics MCP server provides observability into MCP server usage patterns:
- **Invocation metrics**: Which tools are called, how frequently, by which clients
- **Latency tracking**: Response times per tool, per server, over time
- **Error rates**: Tool failures, timeout patterns, degradation trends
- **Usage patterns**: Sequences of tool calls that indicate common workflows

The blockchain parallel is instructive: blockchain networks track every transaction on a public ledger, enabling analytics, auditing, and anomaly detection. MCP does not have a built-in ledger, but analytics MCP servers can provide equivalent visibility by instrumenting the tool call layer.

For production deployments, MCP analytics serves the same role as application performance monitoring (APM) tools like Datadog or New Relic: it makes the agent's tool usage visible, measurable, and debuggable. Without analytics, an MCP deployment is a black box -- you know what the agent produced but not how it got there.

## 5. Tool Composition and Chaining

MCP tools are atomic operations: get a file, query a database, send a message. Real workflows require composing multiple atomic operations into higher-level behaviors. The composition patterns:

**Sequential chaining:** Tool A's output feeds Tool B's input.
```
get_user(id) -> user_data -> get_orders(user_data.email) -> orders
```

**Parallel fan-out:** Multiple tools invoked simultaneously, results aggregated.
```
[get_weather(SEA), get_weather(PDX), get_weather(SFO)] -> compare_weather(results)
```

**Conditional branching:** Tool selection depends on previous tool results.
```
check_inventory(sku) -> if in_stock: create_order() else: add_to_waitlist()
```

**Iterative refinement:** A tool is called repeatedly with modified parameters until a condition is met.
```
search(query) -> not_enough_results -> search(refined_query) -> sufficient
```

**Cross-server composition:** Tools from different MCP servers are combined in a single workflow.
```
figma.get_component(id) -> tokens -> github.create_file(component.tsx, generated_code)
```

The composition layer is where agent intelligence matters most. Individual tool calls are deterministic (given the same input, the same output). The agent's contribution is deciding which tools to call, in what order, with what parameters, and how to handle the results. This is the "reasoning" that differentiates a capable agent from a simple automation.

The code execution approach from the token management research (AGT-03) has implications for composition: when the agent writes code rather than making individual tool calls, composition becomes explicit in the code structure. Loops, conditionals, error handling, and data transformation are expressed in a programming language rather than inferred by the model from tool descriptions.

## 6. OAuth and Permission Models

Bill Maxwell (co-founder at Obot, 15-year colleague of the show host Shannon) presented the centralized OAuth management model for MCP deployments.

The fundamental challenge: agents are ephemeral. Traditional OAuth 2.0 assumes semi-permanent clients -- a web application registers once, receives client credentials, and uses them for months or years. AI agents spin up, connect to MCP servers, do work, and terminate. New agents continuously appear. This lifecycle mismatch breaks static client registration.

**Dynamic Client Registration (RFC 7591)** addresses this:

```
Agent starts
    |
    v
Register with OAuth server (DCR)
    |-- client_id, client_secret (ephemeral)
    |
    v
Request access token for MCP Server X
    |-- scope: [tool_a, tool_b]
    |
    v
Call MCP Server X with bearer token
    |
    v
MCP Server X validates token with OAuth server
    |-- Is the token valid?
    |-- Does the scope include the requested tool?
    |-- Is the client within rate limits?
    |
    v
Tool execution proceeds (or is rejected)
```

**Centralized management** means a platform team handles:
- **Token issuance**: Standard OAuth flows (client credentials, authorization code)
- **Token rotation**: Automatic refresh before expiration, revocation on compromise
- **Policy enforcement**: Scope restrictions, rate limits, time-based access
- **Audit logging**: Who requested what token, when, for what purpose

Individual MCP server developers do not implement OAuth themselves. They delegate authentication to the centralized system and focus on tool logic. This separation of concerns mirrors the evolution of web services: early APIs handled authentication inline, then API gateways (Kong, Apigee) centralized the concern.

**Permission granularity** for MCP tools follows a hierarchy:
1. **Server-level**: Can this agent access this MCP server at all?
2. **Tool-level**: Which tools within the server can this agent invoke?
3. **Parameter-level**: What parameter values are permitted? (e.g., can this agent query any database, or only the analytics database?)
4. **Data-level**: What data can be returned? (e.g., PII fields may be redacted for some agents)

The CIMD (Client ID Metadata Documents) integration provides the initial trust signal: when an agent dynamically registers, it presents its CIMD, which the OAuth server evaluates against its trust policy before issuing tokens.

## 7. Plugin Ecosystems and Supply Chain

The Checkmarks security researcher's findings on VS Code extensions apply directly to MCP server ecosystems. The parallels:

| VS Code Extensions | MCP Servers |
|-------------------|-------------|
| Run with user privileges | Run with host process privileges |
| Auto-update mechanism | Some deployment patterns auto-update |
| Marketplace with trust badges | Registry with metadata and ratings |
| Hidden npm dependencies | Arbitrary dependency trees |
| Single publisher can push malicious update | Server author can modify behavior |

**Supply chain defense layers for MCP:**

1. **Registry vetting**: Automated scanning of submitted MCP servers for known vulnerabilities, malicious patterns, and excessive permission requests
2. **Dependency auditing**: Recursive analysis of MCP server dependencies (npm packages, system libraries) for known CVEs
3. **Privilege sandboxing**: Running MCP servers with minimal necessary permissions (read-only filesystem, restricted network, limited CPU/memory)
4. **Update verification**: Cryptographic signing of MCP server releases, with client-side verification before loading updates
5. **Behavioral monitoring**: Runtime analysis of MCP server behavior for anomalous patterns (unexpected network connections, file access outside declared scope, resource consumption spikes)

The "lethal trifecta" from AGT-02 is the ultimate risk: a compromised MCP server that introduces untrusted content into the agent's context, accesses private data through other tools, and can communicate externally through its own capabilities. Each supply chain defense layer reduces the probability of this convergence.

## 8. Production Deployment: MCP Cloud

Vali and Alex from MCP Cloud AI presented the platform they built to bridge the gap between local MCP development and production deployment.

The problem: developing MCP servers locally is straightforward. They run as processes on the developer's machine, communicate over stdio or local HTTP, and connect to local tools. But delivering MCP capabilities to customers requires internet-reachable endpoints with TLS, authentication, scaling, monitoring, and reliability guarantees.

MCP Cloud provides a proxy platform:

```
Local MCP Server                MCP Cloud Proxy              Client
       |                             |                          |
       |-- register(server) -------->|                          |
       |                             |-- provision endpoint     |
       |                             |-- configure TLS          |
       |                             |-- setup auth             |
       |                             |                          |
       |                             |<--- connect(token) ------|
       |                             |---- validate token       |
       |<--- forward(tool_call) -----|                          |
       |---- result ----------------->|                          |
       |                             |---- result ------------->|
```

The platform is approaching 1,000 hosted MCP servers. Key capabilities:
- **Cloud hosting**: MCP servers run in managed infrastructure, accessible via public endpoints
- **Authentication**: OAuth integration, API key management, token validation
- **Scaling**: Automatic scaling based on request volume
- **Monitoring**: Request logging, error tracking, latency measurement

The MCP Cloud model is analogous to API management platforms (Apigee, Kong, AWS API Gateway): it wraps existing services with production infrastructure without modifying the service itself. The MCP server developer writes tool logic; the platform handles everything else.

For our deployment patterns, MCP Cloud represents the "hosted" option on a spectrum:
- **Local**: MCP server runs on the user's machine (development, personal use)
- **Self-hosted**: MCP server runs on user's infrastructure (on-premise, private cloud)
- **Cloud-hosted**: MCP server runs on MCP Cloud (SaaS, public API)

The FTP sync pattern we use for tibsfox.com (deploy static files to a hosted server) is the simplest version of this spectrum. MCP Cloud is the fully managed version.

## 9. Cross-References

- [MCP Protocol and Orchestration](01-mcp-protocol-orchestration.md) -- Registry architecture and framework MCP servers
- [Agent Security and Identity](02-agent-security-identity.md) -- OAuth, CIMD, supply chain security
- [Stateful Agents and Token Management](03-stateful-agents-token-management.md) -- Token budget impact of tool registration
- [Agent Architecture Patterns](04-agent-architecture-patterns.md) -- Tool composition across agent boundaries
- Gastown chipset: `src/chipset/gastown/` -- Our tool dispatch model
- Security-hygiene skill: Context window monitoring for suspicious tool behavior
- FTP sync: `memory/ftp-sync-setup.md` -- Our deployment pattern

## 10. Sources

- The Context (Obot weekly show): Episodes featuring Anton Tishinka (XDST/Figma MCP), Paulo Bruti (Svelte MCP), Shinszo (MCP Analytics), Bill Maxwell (Obot/OAuth), Checkmarks researcher (supply chain), Vali & Alex (MCP Cloud)
- Analysis: `artifacts/analysis-agentic-orphan-batch.md`, Clusters D and E
- RFC 7591: OAuth 2.0 Dynamic Client Registration Protocol
- MCP specification: tools/list, tool definitions, transport protocols

> **Related:** [MCP Protocol](01-mcp-protocol-orchestration.md), [Agent Security](02-agent-security-identity.md), [Stateful Agents](03-stateful-agents-token-management.md), [Architecture Patterns](04-agent-architecture-patterns.md)
