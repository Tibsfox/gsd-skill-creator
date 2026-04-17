# Lessons — v1.49.39

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **AWF mission-pack mapping was wrong.**
   The staging script mapped files(26) (pnw-aquatic-taxonomy) to AWF because "aquatic" seemed like a match for "Clean Air, Water & Food." But AWF's research content is about air purification and forest conservation, not aquatic taxonomy. The aquatic brief is from the predecessor CAW project. Caught in review, not during staging. A smarter mapping step would have checked existing research content, not just directory codes.
   _⚙ Status: `investigate` · lesson #467_

2. **5 orphaned sources in WAL verification matrix.**
   The WAL agent declared 34 sources and marked them all as "cited" in the verification matrix. The review found 5 sources in the registry but never inline-cited in body text. Self-assessment overstated coverage. Future research agents should run a source-usage audit before claiming PASS.
   _⚙ Status: `investigate` · lesson #468_

3. **Cross-reference matrix not expanded.**
   The Research hub's cross-reference matrix still covers only the original 13 PNW projects (missing AWF, THE, VAV columns, let alone the 21 new projects). This will need its own focused update as the interactive table grows.
   _⚙ Status: `investigate` · lesson #469_

4. **Eat It fleet module depth varies.**
   Alpha and Bravo (Opus) produced deeper, more cross-referenced modules than Charlie and Delta (Sonnet). The BRC and GSD2 projects (Charlie) are strong because of rich source material, but ROF (346 TeX lines → 4 modules) and some Sonnet-generated modules have less depth. The model assignment lesson from the v1.49 chain retro holds: Opus produces materially better research for judgment-heavy content.
   _⚙ Status: `investigate` · lesson #470_

5. **Hub page is getting long.**
   With 36 project cards, the Research hub is now 1,200+ lines. A future update should add cluster-based filtering or tabs.
   _⚙ Status: `investigate` · lesson #471_
