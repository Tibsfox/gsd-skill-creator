# NRC AI Modernization: Turning AI Vision Into Action

**Catalog:** ENE-NRC | **Cluster:** Energy + AI & Computation + Infrastructure
**Date:** 2026-04-05 | **Source:** @NRCgovVideo (NRC Regulatory Information Conference, ~88 min)
**Panelists:** Scott Flanders (CIO/CAIO), Basha Saul (CDO), Nicholas Bugs (Chief EA), Rachel Davis (Data Scientist)
**College:** Mathematics, Mind-Body, Electronics, Ecology

## Abstract

The U.S. Nuclear Regulatory Commission built "Simplify," a home-grown generative AI tool with a custom persona encoding the agency's mission, five principles of good regulation, and explicit operational boundaries. The system uses RAG (Retrieval-Augmented Generation) grounded in curated NRC documents through a "companion" architecture -- persona-based, document-grounded AI assistants for specific roles. A pilot with 13 project managers demonstrated 2-3 hours saved per pre-application meeting and 3-4 hours per licensing action.

## Key Findings

### Simplify Architecture
- Document Intelligence + Cognitive Search (ADAMS repository) + GPT Models + Cosmos DB + React interface
- RAG pattern ensures responses reference curated NRC documents, not general model knowledge
- Built on existing Azure cloud tenant capabilities

### CRAB Prompt Engineering Framework
- **Context:** NRC mission and principles (not general-purpose)
- **Role:** AI assistant providing analysis (not a decision-maker)
- **Audience:** NRC experts across all programs (not general public)
- **Boundaries:** Reference regulations; no legal advice; no regulatory interpretations; flag sensitive data

### Companion System
- Persona-based AI assistants with curated document libraries and stored prompts
- Pre-validated prompt templates shared across teams for consistent outputs
- Access controls: creator manages permissions per need-to-know
- Ensures regulatory consistency by grounding in the same documents using the same language

### Enterprise AI Capability Mapping
- 12 types of AI evaluated against 30 NRC functions across 5 categories
- Knowledge Discovery + Content Generation = Generative AI as the winner
- 5 categories: Licensing, Oversight, Mission Support, Organizational Support, Research

### Data Foundation Timeline (5 Years)
- 2018-2019: Data warehouse expansion
- 2019-2021: Digitization of all legacy paper and microfiche
- 2023: Cognitive search introduced in ADAMS
- 2024: Use case analysis, Simplify development begins
- 2025: AI Strategic Plan released, Simplify pilots deployed

### Model Change = Trust Revocation
- When underlying GPT model updates, all prompts must be re-validated
- Consistent regulatory outputs cannot be guaranteed across model versions
- Identical to certificate expiration in PKI -- trust must be re-established

## Key Numbers

| Metric | Value |
|--------|-------|
| NRC functions mapped | 30 across 5 categories |
| AI types evaluated | 12 |
| Pilot participants | 13 project managers |
| Time saved per pre-app meeting | 2-3 hours |
| Time saved per licensing action | 3-4 hours |
| Daily AI users (poll) | 50% |
| Never-use AI (poll) | 13% |
| Digitization period | 2019-2021 |
| Basha Saul NRC tenure | Since 2007 (~18 years) |

## Rosetta Translation

| NRC/AI Concept | Software Engineering | Biology | Economics |
|---|---|---|---|
| Simplify companion | Containerized microservice (config + data + API) | Specialized cell type | Franchise model |
| CRAB framework | Interface contract (types, methods, visibility) | Ecological niche | Market positioning |
| Pre-validated prompts | Tested API contracts in shared library | Proven enzyme pathways | Standard operating procedures |
| Model change requiring re-validation | Breaking API change requiring regression testing | Environmental shift requiring re-adaptation | Regulatory change requiring compliance audit |
| Human-in-the-loop | Code review before merge to production | Immune system checkpoint | Audit committee approval |

## Cross-Cluster Connections

- **Trust System:** NRC responsible AI principles map 1:1 to trust-relationship verification stages. Validated prompts function like trust certificates. Model change = trust revocation.
- **Multi-Agent Systems:** NRC governance architecture mirrors agent stack: Executive Orders = system config, Strategic Plan = orchestration schema, Governance = trust pipeline, Persona = system prompt, Companion = specialized agent.
- **Fox Companies -- Fox CapComm:** CRAB framework could be adopted directly for multi-agent communication standards.
- **NASA:** AI-augmented licensing could accelerate regulatory review of space nuclear systems. "Human in the loop" maps to crew autonomy in deep space.
- **Nick Bugs' 8-Point Framework:** Know your limits, don't drink and drive, read the label, designated driver, peer pressure, legal age, never leave unattended, hydrate -- applies verbatim to multi-agent governance.

## Study Guide Topics (8)

1. RAG in regulated environments -- grounding AI in curated documents for consistency
2. AI governance frameworks for federal agencies -- EO 14479, Strategic Plans, intake processes
3. Prompt engineering as institutional knowledge management -- CRAB framework, validation workflows
4. Data readiness for AI -- NRC's 5-year journey from digitization to RAG-enabled tools
5. AI adoption lifecycle in conservative organizations -- training, change management
6. Model versioning and output validation -- re-validation resource implications
7. Enterprise Architecture as AI strategy tool -- capability maps, function taxonomies
8. Data-as-a-Service in government -- four-tier stewardship model

## DIY Try Sessions (2)

1. **Build a companion-style RAG system** -- Local RAG pipeline: document ingestion, vector embeddings, retrieval, LLM generation. Create companion with persona, curated docs, stored prompts. Test output consistency across 10 runs. Implement CRAB in system prompt. Tools: LangChain/LlamaIndex, ChromaDB/pgvector, local LLM.
2. **AI capability mapping exercise** -- List your organization's functions (15-30). Enumerate AI types (NRC's 12 as starting point). Rate applicability (0-3 scale). Identify top 3 by cross-functional score. Compare against actual adoption.
