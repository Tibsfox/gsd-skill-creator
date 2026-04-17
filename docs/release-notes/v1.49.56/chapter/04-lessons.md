# Lessons — v1.49.56

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Mission packs are the unit of research.**
   The PMG mission pack is the most complete we've built — vision, research reference, and milestone spec in a single document. The execution was straightforward because the research was already done. The lesson: invest in the mission pack, and the research modules write themselves.
   _⚙ Status: `investigate` · lesson #514_

2. **The 20th Extension is a real integration target.**
   GSD-2's extension system is well-defined enough that the bridge architecture spec (Module 05) could be implemented directly. The observation pipeline, skill injection hooks, and state file integration are concrete TypeScript interfaces, not hand-waving. This research maps real territory.
   _⚙ Status: `investigate` · lesson #515_

3. **Upstream intelligence is a category of research.**
   PMG is the first project in the series that studies another software ecosystem rather than a domain (ecology, electronics, infrastructure). It works because the research methodology is the same: map the territory, catalog the components, document the interfaces, verify the findings. The method is domain-agnostic.
---
> *The spaces between the chips are where the power lives. Pi provides the runtime. GSD provides the workflow. Skill-creator provides the learning. None of them alone achieves what the three together can.*
>
> *This is what giving people their lives back looks like at the infrastructure level.
   _⚙ Status: `investigate` · lesson #516_

4. **Module 05 (Bridge Architecture) at 706 lines is 2x the target.**
   The mission pack specified 300-400 lines. The synthesis module earned its length — 13 sections with TypeScript interfaces, ASCII diagrams, and token budget analysis — but the overshoot signals that the bridge spec could be a standalone deliverable rather than a research module.
   _⚙ Status: `investigate` · lesson #517_

5. **No live repository fetching.**
   The research is sourced from the mission pack's pre-compiled findings, not from live GitHub API calls. Version numbers (v0.62.0, v1.28.0, v2.43.0) are frozen at mission pack date. A future upstream monitor would keep these current.
   _⚙ Status: `investigate` · lesson #518_
