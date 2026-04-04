# MCP Dev Summit -- Segment 6 Summary

**Source:** yt-queue-08.en.vtt, lines 45000-54000 (~03:49:00 to ~05:56:00)

## Talk 1: Jupyter AI v3 and the ACP System -- Jake Diamond-Arivich

Jake Diamond-Arivich (Jupyter open-source governing board member, CEO of Maido) presented the tail end of his Jupyter AI v3 talk. Key points:

- **Jupyter AI v3** launched the day before the summit. Install via `pip install jupyter-ai` to get all features out of the box.
- The **ACP (Agent Communication Protocol)** system inside Jupyter AI allows users to access Claude, Gemini, Codex, and custom agents from within Jupyter Lab or Jupyter Hub.
- **Building custom agents** is straightforward: subclass a base persona, define a system prompt with personality and rules (e.g., "always use these graph colors"), register an entry point, pip-install, and the agent appears in Jupyter Chat's dropdown.
- A **Jupyter MCP server** is bundled with the package. The ACP layer uses it under the hood, but you can also connect Jupyter MCP directly from Claude Code, Cursor, or ChatGPT to edit notebooks externally.
- **Enterprise use case:** Financial institutions and universities prefer Jupyter over CLI-based coding agents because it can run fully locally with no data leaving the system, making it compliance-friendly.
- **Security and permissions:** The ACP protocol lets administrators define exactly which tools an AI agent can access -- write-only to chat, cell editing, cell execution -- enabling tutor personas that help students reason without writing code for them.

## Talk 2: MCP at the Edge -- Kiierra Dodson (Further, Director of AI Strategy)

Kiierra Dodson delivered a detailed technical talk on adapting MCP for edge AI deployments, using autonomous vehicle manufacturing (defect detection on production lines) as her running example.

**The Problem:** MCP's current design assumes high bandwidth, persistent connectivity, and generous compute budgets. These assumptions collapse on edge devices running small language models (Phi, Llama, Gemma) with 4-8K token context windows over unreliable wireless networks.

**Three Concrete Proposals:**

1. **Binary MCP (BMCP)** -- Replace JSON-RPC on the wire with Protocol Buffers. A typical MCP tool call of 2-5KB shrinks to ~200 bytes (10-25x reduction). Binary serialization is 10-50x faster than JSON parsing. Uses capability negotiation at connection setup for backwards compatibility. The LLM never sees the binary layer; it is purely a transport optimization.

2. **Semantic Tool Compression** -- Tool schemas consume too much of a small model's context window. Proposal: a "semantic compression" capability where tool discovery returns compressed summaries (name, required params, brief description) instead of full JSON schemas. Clients request full schemas on-demand only when needed. Additionally, allow clients to pass session context during tool discovery so servers return only relevant tools (e.g., 8 of 50), reducing hallucination risk and shrinking the attack surface against prompt injection.

3. **Resilient Transport via MQTT + Local Persistence** -- Replace SSE/stdio with MQTT message queues for intermittent connectivity. Tool call intents are written to a local SQLite outbox before touching the network. An MQTT broker acts as a persistent intermediary, holding messages in flight and managing delivery guarantees. Session continuity is achieved through session IDs and sequence numbers in MCP message headers, enabling servers to replay missed notifications on reconnect. A **content-addressable context** mechanism (inspired by HTTP ETags) lets clients skip redundant resource downloads by comparing hashes.

## Connection to Our Architecture

These proposals map directly to concerns in our system:

- **Binary MCP** aligns with our constrained-device thinking (weather stations, edge sensors in the Mukilteo convergence zone work).
- **Semantic tool compression** mirrors our own ToolSearch deferred-loading pattern -- we already expose tool names first and fetch full schemas on demand, which is exactly the lazy-loading pattern Dodson proposes for MCP.
- **MQTT store-and-forward** is the same durable-outbox pattern our Gastown chipset uses (beads-state, hook-persistence, mail-async) -- local persistence with async delivery when connectivity restores.
- **Session continuity with sequence numbers** parallels our nudge-sync and session-awareness skills for crash-recoverable agent state.
