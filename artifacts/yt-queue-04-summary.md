# Deep Dive into Coding Agents like Claude Code (Claude 101)

**Source:** YouTube research queue item 04

## Summary

The presenter, a data scientist with 10+ years experience, traces the evolution from ChatGPT (2022) through GitHub Copilot and agent frameworks like LangGraph/CrewAI (2024) to Claude Code (2025), arguing that coding agents represent a step change in knowledge work comparable to the printing press.

### How Claude Code Works Internally

Claude Code is an agentic loop with three phases: context gathering, action execution, and result verification. The loop is powered by two components -- models that reason and tools that act. The core tools are Bash (shell command execution), Read/Edit/Write (file manipulation), and a search/grep tool for agentic file exploration. The Bash tool is the most consequential: it gives the agent access to thousands of existing CLI utilities (ffmpeg, BigQuery CLI, GitHub CLI, etc.) without requiring custom tool definitions. The model's training data includes documentation for these tools, so it knows how to compose them. Context is managed through a memory hierarchy: user-level memory (~/.claude), project-level memory (CLAUDE.md), and auto-memory. Sessions can be resumed with full context restoration.

### Key Architectural Patterns

**V1 agents vs coding agents:** V1 frameworks (LangGraph, CrewAI) require developers to define custom tools and bind them to models. Coding agents ship with predefined general-purpose tools, making them immediately capable without custom tooling. The Bash tool alone replaces dozens of bespoke integrations.

**Skills as loadable expertise:** Skills are markdown files with YAML front matter that inject domain-specific instructions on demand -- either triggered automatically by the model or invoked explicitly. The presenter compares this to the Matrix helicopter scene: expertise loaded just-in-time. Skills can include scripts and reference files, and a meta-skill (skill-creator) can generate and evaluate new skills using background agents.

**Plan mode:** For complex tasks, Claude Code separates planning from execution. The model builds a plan collaboratively with the user, iterates on feedback, and only implements after agreement.

**Multi-instance parallelism:** Multiple Claude Code sessions can run simultaneously in separate terminals, enabling parallel workstreams.

### What Makes Coding Agents Effective vs Ineffective

Effective patterns: (1) Give Claude something to verify against -- unit tests, screenshots, baseline models. (2) Be specific about what success looks like. (3) Use plan mode for complex tasks to align before execution. (4) Use skills to encode domain expertise rather than relying on raw model knowledge. (5) Edit CLAUDE.md whenever you see Claude doing something wrong, building a persistent steering layer. (6) Treat it as a conversation -- start generic, then refine.

Ineffective patterns: Using bare prompts without skills for specialized tasks, expecting perfect output from a single prompt on complex work, not providing verification criteria.

### Connection to Our Work

This video validates the architectural direction of gsd-skill-creator at every level. Our custom skills (.claude/skills/) are exactly the loadable expertise pattern described. Our GSD workflow commands (.claude/commands/gsd/) are the skill-chaining pattern the presenter highlights in the compound engineering plugin. Our multi-agent orchestration (mayor-coordinator, polecat-worker, sling-dispatch) extends the multi-instance parallelism he demonstrates with 3-5 terminals into a coordinated system with work assignment, health monitoring, and merge queues. Our CLAUDE.md and memory hierarchy mirror the context management architecture described. The presenter's observation that "you're only limited by your imagination" is essentially the thesis behind our adaptive learning layer -- we are building the skills, agents, and chipsets that make that imagination executable.
