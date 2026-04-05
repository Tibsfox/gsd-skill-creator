# Tool Integration Patterns

> **Domain:** Agentic Infrastructure & Systems
> **Module:** AGT-05 -- Integration Layer
> **Through-line:** *The MCP ecosystem's real power is not any single server but the composition of many -- a Figma server feeding a code generator, an OAuth server guarding a database server, a framework server filling an LLM's knowledge gaps. Tool integration patterns determine whether this composition is coherent or chaotic.*

---

## Table of Contents

1. [The Integration Challenge](#1-the-integration-challenge)
2. [API Wrappers as Knowledge Bridges](#2-api-wrappers-as-knowledge-bridges)
3. [Figma MCP: Design-to-Code Pipeline](#3-figma-mcp-design-to-code-pipeline)
4. [Framework-Specific MCP Servers](#4-framework-specific-mcp-servers)
5. [Centralized OAuth for MCP](#5-centralized-oauth-for-mcp)
6. [Dynamic Client Registration](#6-dynamic-client-registration)
7. [Composition Patterns](#7-composition-patterns)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Integration Challenge

Connecting a single MCP server to an AI agent is simple. Connecting five or ten servers and having them work together coherently is hard. The integration challenge is not about individual tool calls but about tool composition -- how the output of one tool becomes the input of another, how authentication flows across server boundaries, and how the agent reasons about multi-tool workflows.

The 17 agentic transcripts reveal two integration patterns that address different aspects of this challenge: API wrapper servers that bridge knowledge gaps between LLMs and niche tools, and centralized OAuth management that provides a unified authentication layer across all connected servers.

## 2. API Wrappers as Knowledge Bridges

LLMs have asymmetric knowledge. They are deeply trained on popular frameworks, languages, and tools (React, Python, PostgreSQL) but have shallow or outdated knowledge of niche tools (Contentful, Sanity, Sitecore, Optimizely). This asymmetry creates a practical problem: an AI coding assistant that cannot work with the specific tools a team uses is significantly less valuable.

MCP servers solve this by providing structured tool access to the niche tool's API. Instead of trying to prompt-engineer the LLM into knowing about Contentful's content model or Sanity's GROQ query language, a developer builds an MCP server that wraps the tool's API and exposes its operations as tools with clear descriptions, typed parameters, and documented return values.

The pattern:

```
Niche Tool API (e.g., Figma, Contentful, Strapi)
    |
    v
MCP Server (wraps API, exposes as tools)
    |-- Tool: get_components() -> list of design components
    |-- Tool: get_styles() -> design tokens and style definitions
    |-- Tool: export_assets() -> image/SVG exports
    |-- Tool: get_layout() -> page structure and hierarchy
    |
    v
AI Agent (calls tools through MCP protocol)
    |-- Receives structured data about the niche tool
    |-- Can reason about it and generate code accordingly
```

This is a pragmatic alternative to fine-tuning. Fine-tuning an LLM on Figma documentation would be expensive, slow to update, and limited to one model provider. An MCP server works with any MCP-compatible client, can be updated independently, and costs nothing beyond development time.

## 3. Figma MCP: Design-to-Code Pipeline

Anton Tishinka, CTO of XDST (a web development company working with NextJS, React, Astro, and Svelte), built an open-source community Figma MCP server as a side product of their agency work. XDST also works with niche CMS products -- Contentful, Strapi, Optimizely, Sanity, Sitecore -- where LLMs are "not quite good."

The Figma MCP server wraps Figma's REST API to provide design-to-code capabilities:

**Design token extraction**: The server reads Figma's design system and extracts color palettes, typography scales, spacing values, border radii, and shadow definitions. These are returned as structured data that an AI coding agent can use to generate CSS variables, Tailwind configurations, or styled-components themes.

**Component listing and structure**: The server enumerates Figma components (buttons, cards, headers, navigation elements) with their properties, variants, and nesting structure. An AI agent can use this to generate React/Svelte component skeletons that match the design system.

**Layout and hierarchy**: The server reads Figma frames and auto-layout settings to determine page structure -- how elements are arranged, what flexbox or grid properties they use, what responsive breakpoints are defined. This enables AI-generated HTML/CSS that matches the designer's intended layout.

**Asset export**: The server can trigger Figma's export API to generate PNG, SVG, or PDF renditions of specific layers or components.

The open-source decision was deliberate. XDST built the MCP server for their own workflow efficiency (translating client Figma designs into code is a core agency activity) and published it because the broader community has the same need. The community benefit model -- build what you need, share what others need -- is a recurring pattern in the MCP ecosystem.

## 4. Framework-Specific MCP Servers

Paulo Bruti (Paris, second appearance on The Context) built a dedicated MCP server for the Svelte framework. The motivation: LLMs trained primarily on React and Vue documentation produce Svelte code that uses React-like patterns (explicit state management, manual reactivity) instead of idiomatic Svelte patterns (reactive declarations, built-in stores, compile-time reactivity).

A framework-specific MCP server addresses this by providing:

- **Current documentation**: The server exposes up-to-date Svelte API documentation as tool responses, preventing the LLM from using deprecated patterns or outdated syntax
- **Idiomatic patterns**: The server provides curated examples of idiomatic Svelte code for common tasks (routing, state management, component composition, transitions)
- **Component library awareness**: The server knows about popular Svelte component libraries and their APIs
- **Migration guidance**: For developers moving from React or Vue to Svelte, the server provides pattern-translation guidance

The host of The Context noted Paulo's passion: "You care deeply about Svelte. This is obviously your baby." This personal investment is a feature of the MCP ecosystem -- individual developers who care deeply about a specific technology are the ones building its MCP server, bringing domain expertise that no general-purpose server could match.

The pattern generalizes beyond frontend frameworks. Any technology where the LLM's training data is sparse, outdated, or biased toward a competing technology benefits from a dedicated MCP server: niche databases, specialized build tools, industry-specific platforms, regional APIs.

## 5. Centralized OAuth for MCP

Bill Maxwell, co-founder at Obot (and a 15-year colleague of show host Shannon), presented the case for centralized OAuth management in MCP deployments.

The fundamental problem: traditional OAuth assumes semi-permanent clients. A web application registers with an OAuth provider once, receives a client ID and secret, and uses them for months or years. Tokens expire and refresh, but the client identity persists.

AI agents break this assumption. They are ephemeral -- an agent spins up, connects to MCP servers, performs work, and terminates. Another agent spins up minutes later. In a multi-agent system, dozens of agents may be created and destroyed per hour. Static client registration is impractical at this lifecycle velocity.

Without centralized management, each MCP server developer implements their own OAuth flow:

```
MCP Server A: Custom OAuth with Google
MCP Server B: Custom OAuth with GitHub  
MCP Server C: Custom API key validation
MCP Server D: No authentication (!)
```

This creates inconsistency, security gaps, and duplicated effort. Server D's missing authentication is a security hole. Server A's custom implementation may have bugs that Server B's does not. Every server developer reinvents the same authentication wheel.

Centralized OAuth management consolidates these concerns:

```
Central OAuth Platform
    |-- Standardized token implementation
    |-- Token issuance, rotation, and revocation
    |-- Security policy enforcement (scope limits, rate limits)
    |-- Audit logging (who authenticated, when, for what)
    |
    |-- MCP Server A: trusts central platform
    |-- MCP Server B: trusts central platform
    |-- MCP Server C: trusts central platform
    |-- MCP Server D: trusts central platform
```

Individual MCP server developers do not implement OAuth themselves. They delegate to the central platform, which handles the complexity, and trust the platform's token validation. This is the same pattern used by API gateway products in traditional web services.

## 6. Dynamic Client Registration

MCP addresses the ephemeral-agent problem through **dynamic client registration** (RFC 7591), where clients can register programmatically at runtime without manual administrator intervention.

The flow:

1. **Agent starts**: A new agent instance begins execution
2. **Registration**: The agent sends a registration request to the OAuth server, including CIMD metadata (Client ID Metadata Document -- see [Agent Security](02-agent-security-identity.md))
3. **Credential issuance**: The OAuth server validates the metadata, creates a client record, and issues credentials (client ID, client secret, initial access token)
4. **MCP server access**: The agent uses the issued token to authenticate to MCP servers
5. **Token lifecycle**: The central platform handles token refresh, rotation, and expiration
6. **Termination**: When the agent's work is complete, the session credentials are revoked

Dynamic registration combined with CIMD metadata creates a trust chain:

- The CIMD document attests to who built the agent, what it claims to need, and who vouches for it
- The OAuth server evaluates these attestations against its security policy
- The issued token carries scopes that match the policy evaluation
- MCP servers trust the token because they trust the OAuth platform

This chain enables fine-grained authorization without per-server configuration. A data analysis agent receives tokens scoped to read-only database access. A deployment agent receives tokens scoped to CI/CD operations. A customer service agent receives tokens scoped to CRM read/write. The scoping is determined by policy, not by manual configuration.

Bill Maxwell emphasized the institutional maturity behind this: he and Shannon have worked together for 15 years on identity systems. The patterns they are applying to MCP (dynamic registration, centralized token management, policy-driven scoping) are proven at scale in traditional web services. The innovation is applying them to the specific lifecycle challenges of AI agents.

## 7. Composition Patterns

Synthesizing across the integration transcripts, several composition patterns emerge:

**Pipeline composition**: The output of one MCP server feeds the input of another. Figma MCP exports design tokens, which a code-generation agent uses to create CSS, which a framework MCP server validates against framework-specific patterns. This is a linear pipeline with each step adding value.

**Gateway composition**: A centralized OAuth or proxy server mediates access to all downstream MCP servers. Every tool call flows through the gateway, which handles authentication, rate limiting, and logging. This is a star topology with the gateway at the center.

**Enrichment composition**: A framework-specific MCP server enriches the agent's context alongside a general-purpose tool. The Svelte MCP does not replace the agent's general coding capabilities; it augments them with Svelte-specific knowledge. This is additive composition where multiple servers contribute to a richer context.

**Validation composition**: An MCP server acts as a validator for another server's output. A type-checking MCP server validates the code generated by a code-writing agent. A schema validation MCP server checks the data structures produced by a data transformation tool. This is quality-gate composition.

Each pattern has different implications for token consumption (see [Stateful Agents](03-stateful-agents-token-management.md)), security (see [Agent Security](02-agent-security-identity.md)), and deployment (see [Architecture Patterns](04-agent-architecture-patterns.md)).

## 8. Cross-References

- [MCP Protocol and Orchestration](01-mcp-protocol-orchestration.md) -- Framework-specific servers as MCP extension pattern
- [Agent Security and Identity](02-agent-security-identity.md) -- CIMD, OAuth, and trust chains
- [Stateful Agents and Token Management](03-stateful-agents-token-management.md) -- Token bloat from tool composition
- [Agent Architecture Patterns](04-agent-architecture-patterns.md) -- Proxy layer for tool integration
- ACE cluster: `01-claude-code-agentic-architecture.md` -- Tool dispatch model
- Trust system: `src/chipset/trust-relationship.ts` -- Earned trust parallels OAuth trust delegation

## 9. Sources

- The Context (Obot weekly show): Episodes featuring Anton Tishinka (XDST, Figma MCP), Paulo Bruti (Svelte MCP), Bill Maxwell (Obot, OAuth management)
- Analysis: `artifacts/analysis-agentic-orphan-batch.md`, Clusters A and E
- RFC 7591: OAuth 2.0 Dynamic Client Registration Protocol
- Figma REST API documentation

> **Related:** [MCP Protocol](01-mcp-protocol-orchestration.md), [Agent Security](02-agent-security-identity.md), [Architecture Patterns](04-agent-architecture-patterns.md)
