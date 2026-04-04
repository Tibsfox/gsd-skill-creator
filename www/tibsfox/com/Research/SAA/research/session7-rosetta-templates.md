# Session 7 Rosetta Translation Templates

**Date:** 2026-04-04 | **Cluster:** AI & Computation → cross-domain translations
**Purpose:** Bridge Session 7 research findings to other Rosetta clusters via structural analogy

---

## Template 1: Agent Orchestration → Ecological Systems

**Source cluster:** AI & Computation
**Target cluster:** Ecology

| AI Concept | Ecological Analog | Structural Isomorphism |
|-----------|-------------------|----------------------|
| Mayor (coordinator) | Alpha/matriarch | Coordinates group, doesn't forage directly |
| Polecat (worker) | Forager/scout bee | Executes assigned work, reports back |
| Witness (observer) | Sentinel species | Monitors environment, alerts on anomalies |
| Refinery (merge gate) | Territorial gatekeeper | Controls access to shared resource (branch/nest) |
| Convoy | Migration flock | Temporary grouping for a specific journey |
| Sling-dispatch | Waggle dance | Communicates work location and priority |
| Mail (async) | Pheromone trail | Persistent, read by any passing agent |
| Nudge (sync) | Alarm call | Immediate, volatile, broadcast |
| Token budget | Energy budget | Finite resource constraining activity |
| Compaction | Hibernation/dormancy | Shed non-essential state to survive scarcity |
| Hook (work assignment) | Territorial marking | Claims a resource for exclusive use |
| Trust decay (inactivity) | Path evaporation (ant colony) | Unused trust/trails fade over time |

**Forest Sim Implementation Notes:**
- Vehicle steering behaviors already implement forager/flee patterns
- Pheromone trail system exists (spores array)
- Could add sentinel behavior: Spotted Owl watches, alerts smaller birds
- Energy budget already modeled per species

---

## Template 2: Cryptographic Identity → Chemical Identity

**Source cluster:** AI & Computation (MCP Security)
**Target cluster:** Science (Biochemistry)

| Security Concept | Biochemical Analog | How It Works |
|-----------------|-------------------|-------------|
| ECDSA signature | Enzyme-substrate specificity | Only the right key (enzyme) catalyzes the right reaction |
| Nonce (replay prevention) | One-time-use coenzyme | Each reaction consumes a unique cofactor (NAD+/NADH) |
| AAT (Agent Auth Token) | Ribosome reading frame | The token determines which proteins (tools) get built |
| Certificate chain | Signal transduction cascade | Trust propagates through verified intermediaries |
| Revocation | Ubiquitin tagging | Marks a protein (agent) for destruction by proteasome |
| Short-lived SVID | mRNA half-life | Credentials expire quickly; constant renewal required |
| DLP scanning | Membrane transport proteins | Selective about what crosses the boundary |
| Policy engine | Gene regulatory network | Rules that activate/suppress based on conditions |
| Allowlist | Immune system memory (T-cells) | Recognize and permit known-good, attack unknown |
| Decoy tool | Toll-like receptors | Pattern-recognition for known threats, trigger immune response |

**Educational Value:**
- Teaches security concepts through biochemistry metaphors
- Shows that nature solved these problems billions of years before computers
- Cross-department: cloud-systems + chemistry + science

---

## Template 3: Context Engineering → Information Theory

**Source cluster:** AI & Computation (Token Management)
**Target cluster:** Science (Information Theory)

| Context Concept | Information Theory Analog | Formal Relationship |
|----------------|--------------------------|-------------------|
| Token budget | Channel capacity (Shannon limit) | Max information per unit cost |
| Context rot | Noise accumulation in channel | SNR degrades with transmission length |
| Compaction | Source coding (Huffman, LZ77) | Remove redundancy to fit in channel |
| Progressive disclosure | Variable-rate coding | Use more bits only when detail needed |
| Ghost tokens | Overhead/framing bits | Structural cost that doesn't carry payload |
| Order parameter (Kuramoto r) | Mutual information | How much two signals share |
| Attention curve (U-shaped) | Primacy/recency effect | Information weight depends on position |
| Read deduplication | Entropy coding | Same symbol → same codeword, no repeat |
| Quality score | BER (Bit Error Rate) | Measure of transmission fidelity |
| Skill accumulation | Codebook learning | Efficient representations built over time |

**Mathematical connections:**
- Shannon entropy H = -Σ p_i log(p_i) measures information content
- Compaction ratio ≈ H(compressed) / H(original) → approaches entropy limit
- Context rot is noise-induced mutual information decay: I(X;Y) decreases with context length
- Progressive disclosure is variable-rate coding: R = H(X) when needed, 0 otherwise

---

## Template 4: MCP Protocol → Network Protocol Stack

**Source cluster:** AI & Computation
**Target cluster:** Electronics, Infrastructure

| MCP Layer | OSI Analog | Function |
|----------|-----------|---------|
| MCP Transport (HTTP/SSE/stdio) | Layer 4 (Transport) | Reliable delivery of messages |
| JSON-RPC 2.0 | Layer 5 (Session) | Request/response framing |
| Tool schemas | Layer 6 (Presentation) | Data format negotiation |
| Tool invocation | Layer 7 (Application) | Actual work being done |
| MCPS envelope (signed) | TLS (between L4-L5) | Authentication + integrity |
| AIP proxy | Firewall/WAF | Policy enforcement at boundary |
| Client ID Metadata | DNS + CA | Identity resolution + trust anchoring |
| MCP Tasks (async) | TCP window/flow control | Managing long-running operations |

**Electronics course connection:**
- Students who understand OSI can reason about MCP security by analogy
- The "where do you put the firewall" question is identical to "where do you put the AIP proxy"
- LED Evolution (castlepast) connects: solid-state physics → semiconductor → protocol hardware

---

## Template 5: Battery Evolution → Energy Storage Paradigms

**Source cluster:** Electronics, Energy
**Target cluster:** Ecology, Infrastructure, AI & Computation

| Battery Concept | Ecological Analog | AI/Computing Analog |
|----------------|-------------------|-------------------|
| Lead-acid (high capacity, heavy) | Fat stores (bears, whales) | Full model weights (large, slow to load) |
| Lithium-ion (high energy density) | Glycogen (muscles, liver) | Quantized model (fast access, limited) |
| Sodium-ion (abundant, cheap) | Starch (plants) | Open-source model (free, slightly less capable) |
| Battery management system (BMS) | Metabolic regulation | Token budget enforcement |
| Charge cycles / degradation | Aging / telomere shortening | Context compaction depth |
| Fast charging | Burst eating (raptor strike) | Prompt caching / KV cache |
| Grid-scale storage | Ecosystem carbon sinks | Training data corpus |
| Thermal runaway | Metabolic storm | Context window overflow |
| Cell balancing | Homeostasis | Load balancing across agents |
| Recycling | Decomposition / nutrient cycling | Knowledge distillation |

---

## Cross-Template Connections

These templates form a connected graph — findings from one domain illuminate others:

```
Security ←→ Ecology ←→ Energy
    ↕            ↕          ↕
Crypto  ←→ Biochem ←→ Battery
    ↕            ↕          ↕
Context ←→ InfoTheory ←→ Protocol
```

**Key insight:** The same structural patterns (trust boundaries, energy budgets, signal coupling, identity verification) appear in every domain. The Rosetta translation reveals that these are not analogies — they are the same mathematical structures instantiated in different substrates.

---

## Total: 5 translation templates, 50+ cross-domain mappings
