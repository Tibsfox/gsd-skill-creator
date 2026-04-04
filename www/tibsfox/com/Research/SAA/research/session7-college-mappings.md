# Session 7 Research → College Mappings

**Date:** 2026-04-04 | **Sources:** 6 videos + 10 GitHub repos + FD3 briefing

## Video → Department → Topic Mappings

### MCP Security & Agent Identity (V1-V3, R1-R4)

| Source | Department | Topic | Level |
|--------|-----------|-------|-------|
| MCP Deception Incubator (V1) | cloud-systems | Honeypot Design for AI Agents | 300 |
| MCP Deception Incubator (V1) | cloud-systems | Behavioral Chain Detection | 300 |
| MCP Deception Incubator (V1) | coding | Canary Token Implementation | 200 |
| Zero Trust Machine Identity (V2) | cloud-systems | SPIFFE/SPIRE Workload Identity | 400 |
| Zero Trust Machine Identity (V2) | cloud-systems | JIT Credential Issuance | 300 |
| Zero Trust Machine Identity (V2) | philosophy | Trust Epistemology — Earned vs Given | 100 |
| Agent Identity Protocol (V3) | cloud-systems | Agent Authentication Tokens (AAT) | 300 |
| Agent Identity Protocol (V3) | coding | Policy-as-Code (YAML Allowlists) | 200 |
| Agent Identity Protocol (V3) | philosophy | Principle of Least Privilege | 200 |
| AIP Repo (R1) | coding | Go Proxy Architecture | 300 |
| MCPS Repo (R2) | mathematics | ECDSA P-256 Cryptographic Signing | 400 |
| MCPS Repo (R2) | mathematics | RFC 8785 Deterministic JSON Canonicalization | 300 |
| SEAL Repo (R3) | cloud-systems | Ed25519 Ephemeral Keypairs | 400 |
| SlowMist Checklist (R4) | cloud-systems | Supply Chain Integrity Verification | 300 |

### Token Engineering & Context Management (V4, R8-R10)

| Source | Department | Topic | Level |
|--------|-----------|-------|-------|
| Token Bloat — Adam Jones (V4) | coding | Progressive Tool Disclosure | 300 |
| Token Bloat — Adam Jones (V4) | coding | Code Execution in Sandboxed Containers | 300 |
| Token Bloat — Adam Jones (V4) | coding | Skill Accumulation Pattern | 200 |
| Token Optimizer (R8) | mathematics | Attention Curve Scoring (U-shaped) | 300 |
| Token Optimizer (R8) | coding | Ghost Token Detection | 200 |
| Token Optimizer (R8) | statistics | 7-Signal Quality Score | 300 |
| AI Agent Handbook (R9) | coding | Context Rot — Degradation at 25% Fill | 200 |
| AI Agent Handbook (R9) | coding | Progressive 3-Tier Loading (94% savings) | 300 |
| AI Agent Handbook (R9) | psychology | Decision Density as Health Metric | 200 |
| Context Mode (R10) | coding | FTS5/BM25 Session Continuity | 300 |
| Context Mode (R10) | data-science | 98% Compression via Output Sandboxing | 300 |

### MCP Protocol Evolution (V5-V6)

| Source | Department | Topic | Level |
|--------|-----------|-------|-------|
| Lethal Trifecta (V5) | cloud-systems | Data Flow Attack Taxonomy | 300 |
| Lethal Trifecta (V5) | cloud-systems | Session-Level Trifecta Detection | 400 |
| Lethal Trifecta (V5) | cloud-systems | RBAC Breakdown via Context Contamination | 300 |
| Next MCP Release (V6) | coding | MCP Tasks — Async/Long-Running Operations | 300 |
| Next MCP Release (V6) | coding | Client ID Metadata (replaces DCR) | 300 |
| Next MCP Release (V6) | coding | Extension Governance Model | 200 |

### Agent Orchestration (R5-R7)

| Source | Department | Topic | Level |
|--------|-----------|-------|-------|
| Overstory (R5) | coding | SQLite WAL-Mode Agent Messaging | 300 |
| Overstory (R5) | coding | 3-Tier Watchdog Health Monitoring | 300 |
| Overstory (R5) | economics | Per-Agent Token Cost Tracking | 200 |
| Composio AO (R6) | coding | Event-Driven Reaction System | 300 |
| Composio AO (R6) | coding | 7-Interface Plugin Architecture | 300 |
| Composio AO (R6) | engineering | PR-as-Coordination-Medium | 200 |
| Metaswarm (R7) | coding | Adversarial Review Loop | 300 |
| Metaswarm (R7) | coding | Selective Knowledge Priming | 300 |
| Metaswarm (R7) | psychology | Conversation Introspection (Self-Reflect) | 300 |

### Artemis II FD3 Briefing

| Source | Department | Topic | Level |
|--------|-----------|-------|-------|
| FD3 Briefing | engineering | Helium Pressurization Redundancy Design | 200 |
| FD3 Briefing | engineering | Blowdown Mode — Propulsion Without Regulation | 300 |
| FD3 Briefing | astronomy | Free-Return Trajectory — Gravity Assist | 200 |
| FD3 Briefing | physics | Radiation Environment Beyond Magnetosphere | 300 |
| FD3 Briefing | engineering | Caution & Warning System Calibration (First Crewed Test) | 200 |

---

## Rosetta Cluster Assignments

| Source | Cluster | Justification |
|--------|---------|---------------|
| V1-V3 (MCP Security) | AI & Computation | Agent security is core AI infrastructure |
| V4 (Token Bloat) | AI & Computation | Context engineering for LLMs |
| V5-V6 (MCP Protocol) | AI & Computation | Protocol design and evolution |
| R1-R4 (Security Repos) | AI & Computation | Cryptographic identity for AI agents |
| R5-R7 (Orchestration) | AI & Computation | Multi-agent coordination patterns |
| R8-R10 (Token/Context) | AI & Computation | Context management engineering |
| FD3 Briefing | Space | Artemis II mission operations |
| LED Evolution | Electronics | Solid state lighting history |
| Battery Evolution | Electronics, Energy | Electrochemistry, grid storage |
| Power Electronics AI | Energy, Infrastructure | AI energy demands, power grid |

---

## New Rosetta Translation Templates

### Template: Security Pattern → Ecological Analog

| Security Concept | Ecological Translation | Forest Sim Expression |
|-----------------|----------------------|---------------------|
| Zero Trust | Every organism verifies neighbors | Awareness radius check before interaction |
| Honeypot/Decoy | Orchid mimicry, Batesian mimicry | Decoy food sources that flag predator presence |
| DLP (Data Loss Prevention) | Mycorrhizal network filtering | Nutrient sharing with toxin filtering |
| Replay Protection (nonce) | Unique pheromone signatures | Each organism emits unique chemical ID |
| Tool Allowlist | Species-specific diet | Organisms can only eat compatible food |
| Behavioral Chain Detection | Predator stalking detection | Prey detects approach-stalk-chase sequence |
| Progressive Trust | Symbiosis development over time | Mutualism strengthens with repeated encounters |

### Template: Context Engineering → Forest Dynamics

| Context Concept | Ecological Translation | Forest Sim Expression |
|----------------|----------------------|---------------------|
| Context Rot (25% onset) | Habitat degradation threshold | Ecosystem quality drops when resources below 25% |
| Progressive Disclosure | Seasonal phenology | Information (flowers, fruit) revealed seasonally |
| Ghost Tokens (hidden overhead) | Metabolic baseline cost | Energy spent just staying alive before any action |
| Compaction | Winter dormancy | Organisms shed non-essential state for survival |
| Skill Accumulation | Learned behaviors | Older organisms more efficient at foraging |
| Order Parameter (Kuramoto r) | Flock/school coherence | How synchronized a group behaves collectively |

---

## Total: 46 new topic mappings across 14 departments
