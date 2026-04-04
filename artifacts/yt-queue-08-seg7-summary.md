# MCP Dev Summit Segment 7 Summary (~final hour)

## Talk 1: Building Better MCP Documentation Tools (Apollo GraphQL)

An Apollo GraphQL engineer presented their iterative approach to building MCP server tools for documentation retrieval. Their first-generation tools (search_docs and read_docs) suffered from excessive token usage -- agents would search, read entire pages section by section, search again, and read more, quickly burning 25,000+ tokens for a single answer.

Their second-generation "research docs" tool was designed interface-first with four goals: low token usage, fast responses, accurate answers, and single tool calls. The new tool accepts an array of questions plus a context parameter, returning exact content chunks rather than full pages.

**Key technical details of their RAG pipeline:**
- A 4-stage pipeline: chunk, store, retrieve, expose via MCP
- AI-generated question arrays at build time for each content chunk, mapping likely user questions to documentation answers for better semantic matching
- Embeddings of page abstracts, generated questions, and content chunks stored together
- Results scored and filtered to minimize token output

**End-to-end MCP testing pattern:** Two agents in a shared Docker sandbox -- an "executive agent" that uses the MCP server exactly as a real user would (same model, same tools, low temperature), and a "scoring agent" that reviews outputs against a static binary rubric. Tests run back-to-back (MCP-A vs MCP-B) to isolate variables from model drift. Results: 70% fewer tool calls, 50% fewer tokens, same output quality.

## Talk 2: MCP Server Security (Juan Antonio "Oz", Stacklok/ToolHive)

Oz, a security engineer and creator of the ToolHive project for running MCP servers, delivered a security-focused talk covering supply chain risks in the MCP ecosystem.

**Threat landscape:** The first malicious MCP server (Postmark MCP) appeared in the wild. CVE-2025-6514 was the first critical exploitable CVE. Worm-like attacks and supply chain compromises are accelerating, amplified by AI making exploits easier to create.

**Core security questions for MCP server operators:** What is in this thing? Who built it? How was it built? Is it vulnerable? Can I enforce policies?

**Recommended approach -- OCI container images as the distribution format:**
- Vendor-neutral, content-addressable, multi-architecture support
- Cryptographic hashing for integrity verification
- Attach SBOMs (software bill of materials) and attestations via the OCI Referrers API
- Sign containers using Sigstore (keyless signing with GitHub/Google identities, CI system identities)
- Build provenance via SLSA attestations from CI pipelines
- Enforce policies on what containers are allowed to run

**Live demo:** Built a Docker container for an MCP server, ran Grype (Anchore) for vulnerability scanning, and Syft for SBOM generation. Even the minimal Node 24 slim image showed high vulnerabilities in libc, dpkg, and ncurses.

**Limitations acknowledged:** OCI containers cannot protect against tool poisoning (malicious descriptions) or tool shadowing (impersonation). Those require trusted registries and runtime verification of signed tool descriptions.

**Closing recommendations:** Run a scanner, use cosign for signing, validate MCP server sources, establish policies, and stay informed. "Secure by default, not by suffering."

## Architecture Relevance

Both talks directly validate patterns in our system. The RAG pipeline (question-array chunking, build-time embedding, scored retrieval) mirrors our pgvector/artemis schema for dataset retrieval and intent classification. The A/B MCP testing pattern with executive and scoring agents parallels our verifier subagent architecture. The OCI security recommendations (SBOMs, Sigstore, container isolation) align with our security-hygiene skill and the Fox Companies supply chain thinking. The emphasis on defense-in-depth for MCP servers reinforces our trust system's earned-trust model.
