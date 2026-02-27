# v1.45 Lessons Learned — Agent-Ready Static Site

## LLIS-45-01: Agent Discovery as Build Artifact

**Category:** Architecture
**Impact:** High

AI agent discovery files (llms.txt, AGENTS.md, JSON-LD) should be generated as part of the build pipeline, not maintained manually. This ensures they stay synchronized with content and reduces maintenance burden.

**Recommendation:** Any site generator should include agent-discovery output formats alongside HTML.

## LLIS-45-02: Wave Parallelism Sweet Spot

**Category:** Execution
**Impact:** Medium

8 phases across 5 waves (with 3 parallel in Wave 1) achieved excellent throughput. This confirms the v1.35 observation that 5-7 waves is optimal for parallel execution.

**Recommendation:** When designing milestones with 6+ phases, target 4-5 waves with maximum parallelism in the middle waves.

## LLIS-45-03: Static Site Generator Scope

**Category:** Scope
**Impact:** Medium

A "simple" static site generator grew to 22 plans across 8 phases when including agent discovery, search, WordPress integration, and deployment. Feature scope compounds quickly.

**Recommendation:** For generator projects, start with core pipeline + one output format, then extend in later waves.
