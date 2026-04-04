# MCP Dev Summit Day 1 — Segment 1 Summary (~First Hour)

**Event:** 3rd MCP Dev Summit, New York City, hosted by the Agentic AI Foundation (Linux Foundation)

## Speakers and Talks

**Shannon Williams** (President, Obot AI) — Emcee/welcome. Introduced the summit as the third MCP Dev Summit, noting rapid growth from a small San Francisco event to this large New York gathering. The Agentic AI Foundation was formed with donations from Anthropic, OpenAI, and Block.

**Jim Zemlin** (Executive Director, Linux Foundation) — Announced the MCP Dev Summit is expanding to a global event series across seven cities (Bangalore, Mumbai, Seoul, Shanghai, Tokyo, Toronto, Nairobi). New marquee events: Agent Con and MCPcon in Europe (Sept 17-18) and North America (Oct 22-23). Announced his retirement as interim AAF director, handing off to Mazin Gilbert (PhD in neural networks, MBA from Wharton, five years building AI at Google). Called MCP "the Linux of agents."

**Dave Nally** (Governing Board Chair, AAF; Director of Developer Experience, AWS) — Foundation status update. The AAF has 170 members in under four months (2x what CNCF had in its first six months). Seven working groups stood up with 500+ participants. Governance structures established: governing board, technical steering committee, working groups, and project lifecycle charters.

**David Soria Parra** (Member of Technical Staff, Anthropic; co-creator of MCP) — Main keynote. Covered MCP's trajectory and roadmap.

## Key Protocol Details and Announcements

- **Scale:** ~110 million SDK downloads per month. MCP reached this in 16 months; React took three years to hit the same number. OpenAI Agents SDK, LangChain, Pydantic AI all pull MCP as a dependency.
- **Evolution from local to remote:** MCP moved from stdio-only local servers to supporting remote servers with streamable HTTP transport.
- **New primitives added:** Elicitations (server-to-client interactive queries), structured outputs (enables code mode), tasks (long-running agentic communication), and extensions (experimental feature space outside core protocol).
- **MCP Apps:** New extension allowing MCP servers to provide interactive UI patterns that clients can render — enabling rich visual interactions within agent/chat systems.
- **SDK tiering:** New system helping developers understand SDK stability guarantees, spec compliance, and update cadence.
- **June 2026 specification release:** Major revision targeting transport evolution, tasks, and enterprise readiness. Google and Microsoft are actively collaborating on this.

## Roadmap (Next Two Months to June Spec)

1. **Transport evolution:** Current streamable HTTP works for most cases but struggles at hyperscaler scale due to stateful session handling. New approach: enable the full spec in a stateless way so servers scale like traditional web services.
2. **Tasks (long-running agentic work):** Experimental prototype since November. Enables autonomous long-running operations as model capabilities increase.
3. **Enterprise auth improvements:** Current OAuth/authorization spec is good but needs polish. "Cross-app access" will let MCP servers authenticate seamlessly via existing identity providers — no separate OAuth flow needed if user is already logged in at work.

## Horizon Features

- **Triggers:** Webhooks for MCP — servers can proactively notify clients of new data or request interactions.
- **Native streaming:** MCP deliberately avoided streaming early due to complexity. Now planning incremental tool results support.
- **Skills over MCP:** Serving skills (bundled prompt+tool packages) via MCP servers, landing as an extension in the coming weeks.

## Relevance to Our MCP Usage

- **Math coprocessor MCP server:** The transport evolution toward stateless HTTP directly affects how we deploy and scale our MCP servers. The current streamable HTTP transport works fine for our local use, but the June spec changes could simplify remote deployment.
- **Tasks primitive:** Our agentic workflows (multi-agent orchestration via Gastown chipset, long-running GSD phases) align exactly with what "tasks" enables — long-running autonomous work that reports progress.
- **Triggers/webhooks:** Would enable our MCP servers to proactively notify Claude Code of new data (e.g., computation complete, new research results) rather than polling.
- **Skills over MCP:** We already have 34+ skills in `.claude/skills/`. The ability to serve skills via MCP servers could let us distribute skills to other agents or workstations.
- **SDK tiering:** Relevant for understanding which MCP SDK features we can rely on in production.
- **Extensions mechanism:** Our math coprocessor already uses custom MCP tool patterns; extensions provide a formal path for experimental capabilities.
