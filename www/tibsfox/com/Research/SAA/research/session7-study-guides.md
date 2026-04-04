# Session 7 Study Guides & DIY Try Sessions

**Date:** 2026-04-04 | **Sources:** 6 videos + 10 repos + forest sim experiments

---

## Study Guide 1: Coupled Oscillators and Collective Behavior

**Department:** Mathematics, Physics, Ecology
**Level:** 200-300
**Prerequisites:** Trigonometry, basic differential equations

### Core Concepts
1. **Kuramoto Model** — N oscillators with natural frequencies ω_i coupled through sin(θ_j - θ_i)
2. **Order Parameter r** — complex magnitude measuring collective synchronization (0 = chaos, 1 = perfect sync)
3. **Critical Coupling Kc** — threshold above which synchronization emerges: Kc = 2/(π·g(0)) where g(0) is the peak of the frequency distribution
4. **Adaptive Coupling** — coupling strength that depends on phase proximity (positive feedback → cluster formation)

### Key Equations
- Phase evolution: dθ_i/dt = ω_i + (K/N) Σ sin(θ_j - θ_i)
- Order parameter: r·e^(iψ) = (1/N) Σ e^(iθ_j)
- Critical threshold: Kc = 2/(π·g(0))

### Reading
- Strogatz (2003): "Sync: The Emerging Science of Spontaneous Order"
- p3nGu1nZz: "Self-Organizing Intelligence" — vibrational phase coupling
- OPEN Problem #12: Kuramoto coupling threshold on Tibsfox Research

### Exercises
1. Simulate 10 oscillators with random frequencies. Plot r vs K. Find where r jumps.
2. Add distance-dependent coupling. How does spatial arrangement affect Kc?
3. Compare constant vs adaptive coupling. Which synchronizes faster? Which forms more clusters?
4. Measure the forest sim firefly order parameter. Does it increase over the night?

---

## Study Guide 2: Zero Trust Architecture for AI Agents

**Department:** Cloud Systems, Philosophy
**Level:** 300
**Prerequisites:** Basic networking, authentication concepts

### Core Concepts
1. **Zero Trust Principle** — never trust, always verify. Every request is authenticated.
2. **Autonomous Trust** — zero trust extended to autonomous software (AI agents, not just humans)
3. **SPIFFE/SPIRE** — workload identity standard. Short-lived, cryptographically-signed, workload-bound.
4. **Agent Identity Token (AAT)** — per-agent credential with explicit tool permissions
5. **Lethal Trifecta** — three conditions for MCP data exfiltration: untrusted content + private data + external communication

### Four Pillars of Autonomous Trust
1. Every agent has a unique cryptographic identity
2. Every action must be authenticated
3. Every delegation must be traceable
4. Every interaction must be mutually verified

### Reading
- OWASP: "Trust No One — Building Zero Trust Through Machine Identity"
- AIP: agent-identity-protocol.io
- OWASP Agentic Top 10: ASI02 (tool misuse), ASI03 (identity abuse)

### Exercises
1. Diagram the trust boundaries in a 3-agent convoy (mayor, polecat, witness)
2. Design a tool allowlist for a polecat that should only read files and run tests
3. Write a YAML policy that blocks all tools by default, explicitly allows 3
4. Identify which of your tools would form a Lethal Trifecta if combined

---

## Study Guide 3: Context Engineering for LLMs

**Department:** Coding, Data Science
**Level:** 200-300
**Prerequisites:** Basic understanding of LLMs and token windows

### Core Concepts
1. **Ghost Tokens** — structural overhead (skills, configs, tool definitions) consuming budget before first message
2. **Context Rot** — quality degradation starting at ~25% fill, not at 100%
3. **Progressive Disclosure** — load tool/skill definitions only when needed (94% savings)
4. **Compaction** — summarize completed work to reclaim context
5. **Order of Operations** — tool definitions → system prompt → conversation → new input

### Key Numbers
| Metric | Value |
|--------|-------|
| Tool definitions overhead | 100K tokens (50% of 200K) |
| Context quality drop (256K fill) | 93% → 76% |
| Progressive loading savings | 94% |
| Compaction loss per event | 60-70% |
| Ghost token range | 50-70K before first message |
| Read deduplication savings | 8-30% |

### Reading
- Adam Jones (Anthropic): "Code Execution with MCP: Fix Tool Token Bloat"
- token-optimizer README: ghost token detection methodology
- AI Agent Handbook: "Context rot, compaction, system prompt assembly"

### Exercises
1. Count the tokens consumed by your CLAUDE.md + skills + MCP definitions
2. Implement a read-cache that blocks re-reading the same file hash
3. Build a progressive loader: stub → full → references (3 tiers)
4. Measure your compaction ratio: original tokens / compacted tokens

---

## DIY Try Session 1: Build a Kuramoto Firefly Simulation

**Department:** Mathematics, Coding
**Time:** 2-3 hours
**Materials:** Browser with p5.js, text editor

### What You'll Build
A visual simulation of fireflies that spontaneously synchronize their flashing through local coupling — no central coordinator.

### Steps
1. **Setup** (20 min): Create a p5.js sketch with 20 circles (fireflies), each with a random phase (0 to 2π) and random natural frequency
2. **Basic Flash** (20 min): Each firefly flashes when sin(phase) > 0.8. Advance phase by omega each frame.
3. **Add Coupling** (30 min): For each pair within 60px, adjust phases toward each other: `fi.phase += K * sin(fj.phase - fi.phase)`
4. **Measure Sync** (20 min): Compute order parameter r = |1/N Σ e^(iθ)|. Display it as a bar.
5. **Experiment with K** (30 min): Slider for coupling strength. Find the critical Kc where r jumps from ~0.2 to ~0.8.
6. **Enhance** (30 min): Add distance-dependent coupling, color variation, temperature-dependent rates.

### Success Criteria
- Fireflies start random, end synchronized
- Order parameter r increases from <0.3 to >0.7
- Changing K below Kc breaks synchronization

### Connection to Research
- This is the exact model running in the PNW Forest Simulation on tibsfox.com
- The critical coupling threshold is an open mathematical problem (OPEN #12)
- Real fireflies (Photinus carolinus) in Great Smoky Mountains do exactly this

---

## DIY Try Session 2: MCP Security Honeypot

**Department:** Cloud Systems, Coding
**Time:** 1-2 hours
**Materials:** Node.js, any MCP client (Claude Code, Cursor)

### What You'll Build
A decoy MCP tool that looks like a privileged admin operation but is actually a detection trap. Any invocation = security signal.

### Steps
1. **Create MCP Server** (20 min): Minimal Node.js server with 2 tools: `get_user_info` (real, benign) and `admin_reset_password` (decoy)
2. **Decoy Implementation** (20 min): The decoy tool logs: timestamp, caller info, arguments. Returns a realistic "processing..." response.
3. **Alert** (15 min): On decoy invocation, write to a canary log file and (optionally) send a webhook notification
4. **Test** (15 min): Connect to an MCP client. Ask it to "help manage user accounts." Does it call the decoy?
5. **Harden** (20 min): Add more decoys with tempting names: `dump_database`, `bypass_auth_check`, `export_all_secrets`

### Success Criteria
- Normal workflow never triggers decoy (zero false positives)
- Prompt injection payload does trigger the decoy
- Alert fires with full context (who, what, when)

### Connection to Research
- Based on OWASP MCP Deception Incubator (Indeed security team)
- Tool poisoning has a 70% success rate against real MCP servers
- This is exactly what the harness-integrity decoy tool allowlist gap addresses

---

## DIY Try Session 3: Context Budget Tracker

**Department:** Coding, Data Science
**Time:** 1-2 hours
**Materials:** TypeScript/Node.js or Python

### What You'll Build
A token budget tracker that measures ghost tokens, detects context rot, and triggers progressive compaction.

### Steps
1. **Token Counter** (20 min): Count approximate tokens in a string (words × 1.3). Build `estimateTokens(text)`.
2. **Budget State** (20 min): Track `{maxTokens, usedTokens, warningPercent}`. Implement `checkBudget()`.
3. **Progressive Thresholds** (30 min): Four-level system: snapshot (20%), light (35%), moderate (50%), full (60%). Each level has different discard rules.
4. **Classify Content** (20 min): Scan text lines for patterns: TASK/INSTRUCTION → instruction, DECISION → decision, ERROR → error, everything else → intermediate.
5. **Compact** (20 min): Given classified segments, discard based on level. Measure compression ratio.

### Success Criteria
- At 20% usage: snapshot checkpoint (keeps everything)
- At 35% usage: light compaction (removes duplicates)
- At 60% usage: full compaction (removes all intermediate content)
- Compression ratio: < 0.5 for full compaction

### Connection to Research
- This is the exact system in `transcript-compactor.ts` (38 tests passing)
- Research shows context quality degrades at 25%, not 100%
- Adam Jones (Anthropic) measured 100K tokens consumed by tool definitions alone

---

## DIY Try Session 4: Ecological Trust Zones in a 2D Simulation

**Department:** Ecology, Mathematics, Coding
**Time:** 2-3 hours
**Materials:** p5.js or any 2D graphics framework

### What You'll Build
A predator-prey simulation where organisms have trust zones (awareness radii) that follow zero-trust principles from security research.

### Steps
1. **Create Organisms** (20 min): 10 prey (green), 3 predators (red), each with position, velocity, energy
2. **Trust Zones** (20 min): Each organism has 3 zones: safe (inner), cautious (middle), danger (outer). Different behaviors per zone.
3. **Behavioral Rules** (30 min):
   - Safe zone: forage, socialize, rest
   - Cautious zone: heightened awareness, reduced foraging, watch neighbors
   - Danger zone: flee, alert nearby prey, sacrifice foraging for survival
4. **Energy Budget** (20 min): Each behavior costs energy. Fleeing is expensive. Foraging recovers energy. Trust verification has a cost.
5. **Adaptation** (30 min): Over generations, zone radii evolve. Prey with better calibrated zones survive longer.
6. **Metrics** (20 min): Track population, average zone sizes, energy efficiency, false alarm rate

### Success Criteria
- Prey populations stabilize (not all eaten, not all starving)
- Zone sizes naturally evolve to balance false alarm cost vs predation risk
- System reaches equilibrium without manual tuning

### Connection to Research
- Zero Trust → ecological awareness zones
- FAMILIARITY_TIERS (home/neighborhood/town/stranger) → trust distance rings
- The forest sim already has species with energy budgets and circadian rhythms
- This maps directly to our Gastown trust system: quarantine → provisional → trusted

---

## Total: 4 study guides + 4 DIY try sessions across 8 departments
