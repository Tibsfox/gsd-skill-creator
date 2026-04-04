# Lessons from 25 Trillion Tokens -- Scaling AI-Assisted Development at Kilo

**Source:** YouTube video, conference talk by Scott (co-founder and CEO, Kilo)

## Summary

Scott presents lessons learned from building Kilo, an "all-in-one agentic engineering platform" that has processed over 25 trillion tokens across 1.5 million developers since launching in May 2025. The core thesis: stop working like it is 2023 and start working like it is 2027.

### What They Learned Scaling AI-Assisted Development

**The developer role is fundamentally changing.** The old paradigm -- code monkey writing every line, doing boilerplate, sitting in alignment and review meetings, context switching between tasks -- is being replaced. Developers are becoming orchestrators: managing AI agents, guiding vision, and doing what humans are uniquely good at.

**Minimize collaboration, maximize ownership.** Kilo is "very anti-collaboration" (citing PostHog's blog post on the downside of collaboration). Every engineer owns a feature end-to-end: from conception to coding to deploying to working directly with end users. One engineer per feature, not one team per feature. They have one PM in the entire company. Each engineer is their own PM.

**The trust ladder is real and fragile.** Developer adoption follows a progression: autocomplete (gateway drug) -> chat (still in control) -> single agent (delegating one task) -> orchestration (hands-off, multiple agents). At Kilo, developers use 2-4 parallel agents at any given time. But trust can break at any rung. Slow suggestions, wrong file edits, or excessive permission prompts cause users to fall back down the ladder.

**Context is the unlock.** The deeper you go on the trust ladder, the more context agents need: autocomplete needs the file; chat needs the repo; agents need the ecosystem; orchestration needs all your repos. A data engineer (Pedro, "one-person army") built their entire DBT data model in 1-2 weeks (vs. 6 months traditionally) because he gave the agent access to both the data repo AND the application code repo -- the agent understood where the data came from.

**Right model for the right job.** They initially sent everything to the most expensive model ("Fuck yeah, let's send it to the most expensive model"). This was slow and costly -- "essentially heating your home with inference." The real gains come from combining models: state-of-the-art for architecture tasks, cost-effective models (Qwen/Minimax/GLM) for coding and debugging.

### Quality/Evaluation Metrics That Matter

- **Autocomplete acceptance rate** -- clearest signal, highest volume, the "scoreboard" to optimize for
- **Latency** -- 200ms threshold caused measurable usage drops; they obsess over making it faster
- **Chat copy/use rate** -- are users copying results or ignoring them? Less clear signal than autocomplete
- **Agent task completion** -- hardest to measure because results arrive minutes later; heavy investment in instrumentation
- **Trust as a measurable metric** -- not abstract, but observable through feature usage patterns and result adoption rates

### What Broke or Surprised Them

- **Latency kills trust instantly.** When autocomplete peaked at 200ms, usage dropped. Developers will turn off AI entirely after a few slow suggestions.
- **The cognitive shift is taxing.** Moving from 20% thinking / 80% coding to 80% thinking / 20% coding is mentally exhausting. New engineers joining Kilo need to "warm up their muscle to the brain." Supporting 200 hours/week of agent coding with 4 hours/week of architecture thinking is a fundamentally different kind of work.
- **Half of developers do not use AI every day.** Three-quarters are not using it for monitoring and deployment. 16% have their head in the sand entirely. This is the reality outside conference rooms.
- **Shipping velocity increased by an order of magnitude** -- from one feature every 2-3 weeks to 1-2 features per week, with ~15 engineers and no team growth.

### Companies, Tools, and Papers Cited

- **Kilo** -- the presenting company, agentic engineering platform
- **PostHog** -- cited for their blog post on the downside of collaboration
- **Anthropic (Opus)** -- called "a phenomenal model" for architecture tasks
- **Qwen (Kimmy), Minimax, GLM** -- cited as cost-effective models for coding/debugging
- **DBT** -- used for data modeling example

### Connection to Multi-Agent Pipelines (50+ Concurrent Projects)

This talk directly validates several patterns we use in GSD:

1. **End-to-end ownership** -- their "one engineer per feature" maps to our single-agent-per-milestone pattern. Collaboration overhead is a velocity killer at scale.
2. **Trust ladder = our trust system** -- their observation that trust is measurable and fragile aligns with our trust-relationship.ts work. Trust must be earned through consistent results, not assumed.
3. **Context depth scales with autonomy** -- their autocomplete->chat->agent->orchestrator progression mirrors our skill activation layers. At orchestration level, agents need cross-repo awareness, which is exactly what our mayor-coordinator and sling-dispatch provide.
4. **Right model for right task** -- matches our set-profile system (quality/balanced/budget/inherit). Using Opus for planning and cheaper models for execution is exactly what we do.
5. **Cognitive load shifting** -- their observation that 80% thinking / 20% coding is "quite taxing" explains why our wave-based planning (where planning IS the hard part) works: we front-load the thinking into structured plans so agents can execute autonomously.
6. **The work does not go away, it shifts** -- resonates with our experience running 50+ concurrent projects. The bottleneck moved from coding to orchestration, architecture, and quality gates.
