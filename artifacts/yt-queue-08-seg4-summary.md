# MCP Dev Summit -- Segment 4 Summary

**Source:** yt-queue-08.en.vtt, lines 27000-36000 (~02:20:00-03:00:00)

## Segment Structure

This segment contains two distinct parts: a roving hallway interview session on the expo floor, followed by the opening of Alex Salazar's talk on MCP gateway patterns.

## Part 1: Expo Floor Interviews -- "What's Your Favorite Skill?"

A host with a camera crew interviews ~15 attendees and exhibitors, asking each one their most-used or favorite coding agent skill. Key takeaways from the conversations:

**Skills people actually use:**
- **Apollo/GraphQL skill** -- uses GraphQL schema for API discovery and semantics
- **Anthropic's internal Rust skill** -- internal docs turned into a public skill, now the top-ranked Rust skill on skills.sh
- **Writing skill** (5-6 pages) -- teaches the model to write in the user's voice; dictated via SuperWhisper, then cleaned up with the skill
- **Front-end design skill** -- encapsulates component library and brand guidelines so AI-generated UI stays consistent
- **Spec-driven development skill** -- formats specs in a specific template (issue, who's impacted, why, what changes), then splits into child issues on GitHub
- **Commit message skill** -- generates detailed per-file change descriptions in a consistent format
- **Bug analysis / review agent skill** (CopilotKit) -- triages open-source GitHub issues and PRs automatically
- **Temporal skill** -- helps write code following Temporal's durable execution rules; reported turning week-long migrations into day-long tasks
- **MATLAB coding skill** (MathWorks) -- internal skill teaching agents to write idiomatic MATLAB, since LLMs lack sufficient MATLAB training data
- **"Grill me" skill** -- asks Claude to brutally critique your code and suggest improvements
- **"Doubt" skill** -- instructs the agent to maintain healthy skepticism and always verify

**Emerging pattern: teams replacing Linear/Jira with markdown-in-git.** One team moved all Linear tickets into a GitHub repo as structured markdown with front matter. Agents read tickets from Slack, work on them in the repo, and the code lives right next to the tickets. A read-only frontend was built so PMs can see status. The team stopped logging into Linear entirely.

## Part 2: Alex Salazar (Arcade.dev) -- Gateway Patterns for Enterprise MCP

**Speaker:** Alex Salazar, Founder/CEO of Arcade.dev (actions runtime for agents)

**Core thesis:** Agents have two fundamentally different layers -- the reasoning layer and the action layer -- and they require completely different security and governance models.

**MCP 2026 enterprise readiness priorities (four pillars):**
1. Gateway patterns
2. Audit trails
3. Config portability
4. Enterprise authorization (called out as a "major unsolved problem")

**Key announcements and details:**
- Authorization is the top unsolved problem in agentic systems. Service accounts / non-human identity approaches have "largely failed" because agents are workloads, not users. Giving an agent its own identity creates unscoped access (e.g., an HR intern using an agent that can see the CEO's compensation).
- Tool quality matters: agents must select the right tool AND predict the right parameters, or the blast radius is real.
- Observability is the third pillar: what did the agent actually do? Remediation requires knowing what happened.
- MCP is the bridge between reasoning and action layers -- it is "how the reasoning layer is designed to speak to the action layer."
- The bank robbery analogy: "The agent can hallucinate all it wants about robbing a bank. The only time anybody cares is when it pulls a gun." Enforcement must happen at the action layer, not just the reasoning layer.

## Also Mentioned: MCP Security Research

A security researcher (in a pirate costume) reported finding DNS rebinding vulnerabilities in top MCP servers that allowed malicious websites to make tool calls to local MCP servers. The top four SDKs (TypeScript, Python, Rust) were patched as a result. Anthropic paid a $1,500 bug bounty. His advice: make sure you are using a patched SDK.

## Connections to Our Architecture

- **Skills-as-markdown is exactly our pattern.** We have 34+ skills in `.claude/skills/`, and our GSD workflow uses `.planning/` markdown files as the single source of truth -- the same trajectory these teams discovered independently.
- **The "doubt" / verification skill** maps directly to our verifier agent pattern and the trust system's earned-not-given philosophy.
- **Spec-driven development with slash commands** mirrors our GSD command structure (`/gsd:plan-phase`, `/gsd:discuss-phase`).
- **Hooks for determinism** was explicitly discussed -- one attendee's multi-step orchestration skill failed because the model ignored instructions, and the host recommended hooks. We already use PreToolUse hooks for commit validation and phase boundaries.
- **Gateway patterns / action-layer enforcement** validates our security-hygiene skill and the trust-relationship system (Stage 1 complete, 95 tests). The reasoning/action separation Salazar describes is the same boundary our GUPP protocol enforces.
- **Authorization as unsolved problem** directly relevant to FoxFiber/FoxCompute trust architecture. Service accounts fail; user-scoped delegation is needed.
- **DNS rebinding on local MCP servers** is a concrete threat to our math-coprocessor MCP server. Verify we are on patched SDK versions.
