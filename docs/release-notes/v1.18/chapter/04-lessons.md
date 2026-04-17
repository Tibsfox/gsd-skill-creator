# Lessons — v1.18

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Domain-prefixed identifiers (F-1, B-1.api, T-1:rcp) solve the naming collision problem.**
   When skills, agents, and teams coexist in the same namespace, prefix encoding makes type immediately visible from the ID alone. Backward compatibility with integer IDs preserves existing references.
   _🤖 Status: `deferred` · lesson #94 · needs review_
   > LLM reasoning: v1.42 git skill doesn't touch the domain-prefixed ID system; no later work visibly extends it.

2. **Three-speed information layering is the right abstraction for dashboards.**
   Not every user needs every detail. The gantry gives glance-level status, the activity feed gives recent context, and the topology view gives structural understanding. Each serves a different cognitive need.
   _⚙ Status: `investigate` · lesson #95_

3. **An entity legend is essential for visual systems.**
   The collapsible legend panel with all 6 entity types prevents the "what does the hexagon mean?" question. Self-documenting UIs reduce support burden.
---
   _🤖 Status: `investigate` · lesson #96 · needs review_
   > LLM reasoning: v1.43 Gource pack is a separate visualization concern, not entity legend UI.

4. **515 tests is adequate but the SVG rendering logic is hard to unit test.**
   Topology view, entity shapes, and budget gauges produce SVG output that's structurally verifiable but visually unverifiable without screenshot comparison.
   _🤖 Status: `investigate` · lesson #97 · needs review_
   > LLM reasoning: v1.46 upstream intelligence adds Zod schemas but doesn't address SVG visual testing gap.

5. **8-cell gantry maximum may be limiting.**
   With 10 agents defined in later releases, the overflow indicator will be exercised frequently. The gantry should probably scale to the actual agent count.
   _⚙ Status: `investigate` · lesson #98_
