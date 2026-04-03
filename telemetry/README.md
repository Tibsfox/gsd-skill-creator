# Token Telemetry

Session-level tracking of AI token consumption, productivity metrics, and efficiency trends.

## Schema (sessions.jsonl)

| Field | Type | Description |
|-------|------|-------------|
| session_id | string | Unique identifier (branch-date) |
| date | string | ISO date |
| branch | string | Git branch |
| project | string | Project name |
| duration_hours | number | Session wall-clock hours |
| commits | number | Git commits in session |
| pages_created | number | New HTML pages created |
| pages_synced | number | Pages synced to tibsfox.com |
| sweeps | number | Sweep commits |
| agent_spawns | number | Background agents launched |
| web_searches | number | WebSearch tool calls |
| web_fetches | number | WebFetch tool calls |
| session_limit_hits | number | Times session hit usage limit |
| words_written | number | Estimated words of output |
| research_papers_analyzed | number | Papers deep-dived |
| notes | string | Session summary |

## Derived Metrics (computed)

| Metric | Formula | What it measures |
|--------|---------|-----------------|
| commits_per_hour | commits / duration_hours | Sustained productivity rate |
| pages_per_hour | pages_created / duration_hours | Content creation velocity |
| words_per_commit | words_written / commits | Output density per commit |
| limit_hits_per_hour | session_limit_hits / duration_hours | Token burn rate indicator |
| searches_per_page | web_searches / pages_created | Research efficiency |
| agents_per_page | agent_spawns / pages_created | Parallelization usage |

## Trend Targets

| Metric | Current | Target | Direction |
|--------|---------|--------|-----------|
| limit_hits_per_hour | 0.21 | <0.10 | down |
| pages_per_hour | 0.83 | 1.5+ | up |
| commits_per_hour | 3.8 | 4.0+ | stable |
| words_per_commit | 818 | 600-800 | stable (efficient) |

## Usage

Append one JSON line per session. Compute trends across sessions to identify:
- Are we hitting limits less often? (efficiency improving)
- Are we producing more per session? (productivity increasing)
- Are web fetches decreasing? (MCP servers replacing them)
- Are agent spawns increasing? (parallelization improving)

## Long-term Goals

1. **Baseline period** (April 2026): establish metrics across 10+ sessions
2. **First optimizations** (May 2026): Rust preprocessors, Go MCP servers
3. **Measure improvement** (June 2026): compare against baseline
4. **Mythos readiness** (Q3 2026): prove 8-10x efficiency before pricing changes
