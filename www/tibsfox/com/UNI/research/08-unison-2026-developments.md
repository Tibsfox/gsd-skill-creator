# Unison 2026: MCP Integration, BYOC, and the Co-op Compute Mesh

**Date:** April 3, 2026
**Status:** Active Research
**Depends on:** 01-language-core.md, 04-distributed-computing.md, 06-synthesis.md
**Context:** Unison has released several features since our initial research that directly enable our co-op architecture vision. This module tracks the 2026 developments and maps them to our systems.

---

## Major 2026 Developments

### 1. MCP Server in UCM

Unison's codebase manager (UCM) now includes a built-in MCP server, activated via `ucm mcp`. This is the bridge between AI coding agents (Claude Code, etc.) and Unison codebases.

**What this means for us:**
- Claude Code can directly interact with Unison code through MCP protocol
- Our existing MCP infrastructure (math coprocessor, 18 tools) can talk to Unison
- Skills written in Unison become accessible to any MCP-aware agent
- The Rosetta translation engine gains a typed, content-addressed language layer

**Technical:** The MCP server exposes UCM operations as MCP tools — browse definitions, search by type, read implementations, submit edits. All through the same protocol our math coprocessor uses.

### 2. BYOC (Bring Your Own Cloud) — GA

Unison Cloud's BYOC is now generally available. Any pool of machines becomes a distributed computing cluster with only S3-compatible storage required.

**What this means for us:**
- Each co-op node contributes machines to the pool
- FoxCompute is literally this: federated computing across the co-op mesh
- No AWS/GCP dependency — self-hosted, co-op-owned infrastructure
- The same content-addressed code runs anywhere in the pool
- S3-compatible storage = MinIO on co-op servers

**Architecture:**
```
Co-op Node A (Mukilteo)     Co-op Node B (Bellingham)     Co-op Node C (Portland)
  RTX 4060 Ti                  RTX 3070                      A100 (shared)
  MinIO storage                MinIO storage                  MinIO storage
       |                            |                              |
       +-------------- BYOC Federation ---------------------------+
                    Content-addressed code moves to data
                    GPU pools aggregate across nodes
```

### 3. GPU Pools and Model Inference

Unison Cloud now supports GPU pools for distributed computation. Multi-GPU work in a few lines of code.

**What this means for us:**
- Erdős prize problems distributed across the co-op GPU mesh
- Math coprocessor operations (eigenvalue, FFT, Monte Carlo) can scale beyond our single RTX 4060 Ti
- Model inference pools enable local AI without cloud API dependency
- The Physarum simulation, forest sim, Kuramoto model can run at unprecedented scale

**Code concept (Unison):**
```
gpu.pool.submit : '{GPU} a -> '{Remote} a
gpu.pool.submit computation =
  Remote.at gpuNode do
    GPU.run computation
```

### 4. Adaptive Service Graph Compression

Unison Cloud dynamically co-locates communicating services to reduce latency and cost. Services that talk to each other frequently are automatically moved closer together.

**What this means for us:**
- Agent-to-agent communication in the Gastown chipset could be optimized automatically
- Ravens that talk frequently get co-located — the mesh self-optimizes
- No manual placement decisions — the runtime observes communication patterns and adjusts
- This IS the Physarum shortest-path solver applied to service topology

### 5. Unison 1.0 Stability

Unison reached 1.0 in November 2025. The language, runtime, and developer workflow are stable. Key improvements:
- `diff.update` command for reviewing changes before applying
- `lib.install.local` for local project dependencies
- Improved thread fairness in the runtime
- Faster clone/pull via shallow clones

---

## Mapping to Our Architecture

| Unison Feature | Our System | Connection |
|---------------|-----------|------------|
| Content-addressed code | Git SHA commits | Provenance tracking, trust verification |
| Abilities (algebraic effects) | Agent contracts | Side-effect tracking, Cedar's trust bounds |
| MCP server in UCM | Math coprocessor MCP | Bridge between Claude Code and Unison |
| BYOC federation | FoxCompute | Co-op compute mesh, self-hosted |
| GPU pools | RTX 4060 Ti + network | Distributed math/science computation |
| Adaptive co-location | Gastown convoy model | Self-optimizing agent placement |
| Typed service calls | Agent message protocol | No serialization boilerplate |
| No build step | Skills auto-activation | Content-addressed = no dependency conflicts |

## Key Question: GSD Skills as Unison Functions?

The original action item from our Unison research: could GSD skills be Unison functions?

With the MCP server in UCM, this becomes concrete:
1. Write a skill as a Unison function with typed abilities
2. Hash it (automatic — Unison does this)
3. Share it through the co-op mesh (BYOC distributes it)
4. Any node can call it through MCP
5. The type system guarantees it can only do what its abilities declare
6. Cedar verifies the hash hasn't been tampered with

This is content-addressed, typed, distributable skill sharing. The Cedar root network for code.

## MCP Server Setup (Ready to Execute)

UCM includes a built-in MCP server. Available tools: `docs`, `get-current-project-context`, `lib-install`, `list-definition-dependencies`, `list-definition-dependents`, `list-library-definitions`, `list-local-projects`, `list-project-branches`, `list-project-definitions`, `list-project-libraries`, `search-by-type`, `search-definitions-by-name`, `share-project-readme`, `share-project-search`, `typecheck-code`, `view-definitions`.

**Install UCM (Linux apt):**
```bash
curl https://debian.unison-lang.org/public.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/unison-computing.gpg
echo 'deb [arch=amd64 signed-by=/etc/apt/trusted.gpg.d/unison-computing.gpg] https://debian.unison-lang.org/ trixie main' | sudo tee /etc/apt/sources.list.d/unison-computing.list
sudo apt update && sudo apt install unisonweb
```

**Claude Code MCP config** (add to settings.json):
```json
{
  "mcpServers": {
    "unison": {
      "command": "/usr/bin/ucm",
      "args": ["mcp"]
    }
  }
}
```

**Or HTTP connection:** `http://localhost:5858/codebase/mcp`

## Next Steps

- [ ] Install UCM (requires sudo — user approval needed)
- [ ] Configure MCP bridge in Claude Code settings.json
- [ ] Port a simple GSD skill to Unison as proof of concept
- [ ] Test BYOC with MinIO on local CEPH storage
- [ ] Explore GPU pool API for math coprocessor operations
- [ ] Build Unison MCP tools for browsing our codebase through typed queries
- [ ] Connect to CERN WLCG research (content-addressed distribution parallel)
- [ ] Map all 13 Rosetta clusters to potential Unison implementations

## Sources

- [unison-lang.org](https://www.unison-lang.org/) — Official site
- [unison.cloud](https://www.unison.cloud/) — Cloud platform
- [Where Unison is Headed](https://www.unison-lang.org/blog/where-unison-is-headed/) — Roadmap (June 2024)
- [BYOC Announcement](https://www.unison-lang.org/blog/cloud-byoc/) — Bring Your Own Cloud
- [GitHub: unisonweb/unison](https://github.com/unisonweb/unison) — Source, releases, MCP server

---

*Last updated: 2026-04-03 (sweep v1.3.14)*
