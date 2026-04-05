# Agent Security and Identity

> **Domain:** Agentic Infrastructure & Systems
> **Module:** AGT-02 -- Security Layer
> **Through-line:** *The lethal trifecta -- untrusted content, private data access, and external communication -- describes the exact conditions under which an AI agent becomes a data exfiltration vector. Understanding this framework is the first step toward building agents that are safe by design, not safe by accident.*

---

## Table of Contents

1. [The Lethal Trifecta Framework](#1-the-lethal-trifecta-framework)
2. [MCP Security Pitfalls](#2-mcp-security-pitfalls)
3. [Supply Chain Attacks on AI Tooling](#3-supply-chain-attacks-on-ai-tooling)
4. [Agent Identity Protocol (AIP)](#4-agent-identity-protocol-aip)
5. [Client ID Metadata Documents (CIMD)](#5-client-id-metadata-documents-cimd)
6. [OAuth and Centralized Management](#6-oauth-and-centralized-management)
7. [Defensive Architectures](#7-defensive-architectures)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The Lethal Trifecta Framework

Simon Willison's lethal trifecta describes three preconditions that, when simultaneously present in an agentic session, enable data leakage:

1. **Exposure to untrusted content**: The agent processes input that could contain prompt injection or other manipulation -- web pages, emails, user-submitted documents, tool responses from external services.

2. **Access to private data**: The agent can read sensitive information -- API keys, personal emails, database contents, source code, credentials stored in environment variables.

3. **Ability to externally communicate**: The agent can send data to endpoints outside the user's control -- HTTP requests, email sends, file uploads, webhook calls.

Any two of these three conditions are relatively safe. An agent that reads untrusted content and accesses private data but cannot communicate externally has no exfiltration channel. An agent that reads untrusted content and can communicate externally but has no private data access has nothing valuable to leak. The danger emerges specifically when all three converge in a single session.

The Edison.watch team (founder presenting from their DLP software company) built **Open Edison**, an open-source agentic firewall that operationalizes this framework. Open Edison acts as a unified MCP gateway, tracking agentic session runs and monitoring the context window. For each tool call, it classifies: Did this introduce untrusted content? Did this access private data? Did this attempt external communication? When all three conditions are detected within a session, the firewall can block the exfiltration attempt.

## 2. MCP Security Pitfalls

Haley Quash from IBM Research wrote what the show host described as "probably the best paper I've seen on MCP security." Her talk covers common pitfalls in MCP deployments and provides best practices for mitigation.

Key pitfall categories include:

- **Overprivileged tool access**: MCP servers that expose write operations (file deletion, database modification, API key rotation) alongside read operations, giving agents more capability than any single task requires
- **Missing input validation**: MCP servers that trust tool arguments without sanitization, enabling injection attacks through crafted parameters
- **Implicit trust chains**: Clients that assume all MCP server responses are trustworthy, without verifying provenance or integrity
- **Credential leakage in tool results**: Servers that include sensitive data (tokens, passwords, internal URLs) in tool response payloads
- **Missing rate limiting**: No controls on how frequently an agent can invoke tools, enabling resource exhaustion or brute-force attacks

The mitigation strategies follow a principle of least privilege applied to the agentic context: scope tool access to the minimum required for each task, validate all inputs at the server boundary, sanitize all outputs before returning them to the model, and monitor tool invocation patterns for anomalous behavior.

## 3. Supply Chain Attacks on AI Tooling

A security researcher from Checkmarks (4.5 years in supply chain security) presented findings on VS Code extension vulnerabilities. While not strictly about MCP, the findings are directly applicable to the MCP server ecosystem because the trust models are analogous.

Key findings:

- **Extensions run unsandboxed**: VS Code extensions execute with the full privileges of the running user. An administrator running VS Code gives every installed extension administrator access to the system.
- **Auto-update as attack vector**: A malicious actor can publish a legitimate, useful extension, build reputation and user base over months, then push a malicious update that auto-deploys to all installed instances.
- **Flimsy trust signals**: Marketplace badges, download counts, and publisher verification can be faked or gamed. Users cannot reliably distinguish trusted from malicious extensions using visible signals alone.
- **Hidden dependencies**: Extensions may pull in npm packages that themselves contain malicious code, amplifying the attack surface beyond what the extension's own code reveals.

The parallel to MCP servers is direct: MCP servers run with whatever permissions the host process provides, auto-update mechanisms exist in some deployment patterns, registry trust signals are still immature, and MCP servers can have arbitrary dependencies.

## 4. Agent Identity Protocol (AIP)

James Gow (CEO, Ironwood Cyber; founder, Moncow engineering consultancy) presented AIP, an open-source initiative to establish identity and authorization standards for AI agents.

AIP uses a two-layer architecture:

**Layer 1 -- Identity**: Establishes how an agent is identified as distinct from a human. At the core is a root registry that signs agent identities, creating a chain of trust similar to the TLS certificate authority model. The identity mechanism is intentionally flexible -- the community will decide the best approach -- but the architectural requirement is firm: there must be a verifiable way to determine that a given entity is an agent, which agent it is, and who created it.

**Layer 2 -- Policy Enforcement**: Once identity is established, this layer handles authorization decisions. Given that this agent has been identified and verified, what is it permitted to do? This could use RBAC (role-based access control), ABAC (attribute-based access control), or capability-based models.

AIP is being developed in coordination with IETF 125 (Shenzhen), where agentic authentication and authorization are now on the standards body's agenda. This is the same organization that standardized TCP/IP -- their involvement signals that agent identity is being treated as internet infrastructure, not just an application concern.

## 5. Client ID Metadata Documents (CIMD)

Max Gerber from Stitch (a developer platform for identity experiences covering humans, machines, and agents) presented CIMD -- a standard for attaching structured metadata to MCP client registrations.

Stitch handles the full identity stack: login/signup flows, credential management, SCIM (System for Cross-domain Identity Management), SSO, SAML, OIDC (OpenID Connect), fraud detection, and device intelligence. Their MCP authentication team developed CIMD to address the question: when an MCP client connects to a server, how does the server verify who the client is and what it is authorized to do?

CIMD provides a metadata document format that accompanies client registration, containing:
- Client identity and provenance information
- Capability declarations (what the client claims to need)
- Trust attestations (who vouches for this client)
- Usage constraints (rate limits, data access scopes)

## 6. OAuth and Centralized Management

Bill Maxwell (co-founder at Obot, 15-year colleague of the show host Shannon) presented the case for centralized OAuth management in MCP deployments.

The fundamental challenge: traditional OAuth assumes semi-permanent clients that register once and persist. AI agents are ephemeral -- they spin up, connect to MCP servers, do work, and terminate. New agents continuously appear. This lifecycle mismatch means static client registration is impractical.

MCP addresses this through **dynamic client registration** (RFC 7591), where clients can register programmatically at runtime without manual administrator intervention. Combined with CIMD metadata, this enables a flow where an agent starts, dynamically registers with an OAuth server, receives tokens, uses them to authenticate to MCP servers, and releases them when the session ends.

Centralized management means a platform or operations team handles: OAuth implementation standardization, token issuance and rotation, security policy enforcement, and audit logging. Individual MCP server developers do not implement OAuth themselves -- they delegate to the centralized system.

## 7. Defensive Architectures

Synthesizing across all five security transcripts, a layered defense model emerges:

1. **Identity layer** (AIP): Verify that the connecting entity is a known, authorized agent
2. **Registration layer** (CIMD + dynamic registration): Establish session credentials with metadata
3. **Authorization layer** (centralized OAuth): Issue scoped tokens for specific MCP server access
4. **Runtime monitoring layer** (Open Edison / agentic firewall): Track session behavior for lethal trifecta convergence
5. **Supply chain layer** (registry vetting, dependency audit): Ensure MCP servers and their dependencies are trustworthy

Each layer addresses a different attack surface. No single layer is sufficient -- the defense requires depth.

## 8. Cross-References

- [MCP Protocol and Orchestration](01-mcp-protocol-orchestration.md) -- Registry trust model
- [Stateful Agents](03-stateful-agents-token-management.md) -- Transactional safety for state management
- ACE cluster: `01-claude-code-agentic-architecture.md` -- Permission model and hooks system
- GSD security-hygiene skill: Context window monitoring
- Trust system: `src/chipset/trust-relationship.ts` -- Earned trust model

## 9. Sources

- The Context (Obot weekly show): Episodes featuring Haley Quash (IBM Research), Edison.watch founder, Checkmarks researcher, James Gow (Ironwood Cyber), Max Gerber (Stitch), Bill Maxwell (Obot)
- Simon Willison, "The lethal trifecta" framework
- Analysis: `artifacts/analysis-agentic-orphan-batch.md`

> **Related:** [MCP Protocol](01-mcp-protocol-orchestration.md), [Stateful Agents](03-stateful-agents-token-management.md), [Architecture Patterns](04-architecture-patterns.md)
