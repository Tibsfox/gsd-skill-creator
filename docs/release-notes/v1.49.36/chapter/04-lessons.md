# Lessons — v1.49.36

8 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A painting is a design system.**
   Paintless Dog's fox watercolor from 2016 contained every color decision the brand needed. The palette wasn't designed — it was extracted. When the source is right, the system writes itself.
   _🤖 Status: `investigate` · lesson #454 · needs review_
   > LLM reasoning: Energy systems hub snippet has no visible connection to extracting design systems from source artwork.

2. **DRY applies to CSS too.**
   15 projects × ~175 lines of near-identical CSS = ~2,300 lines of pure duplication. The cascade eliminated all of it while giving each project more visual identity through focused overrides, not less.
   _⚙ Status: `investigate` · lesson #455_

3. **Dark mode is a design choice, not a requirement.**
   VAV's dark mode was intentional but created a maintenance island. Migrating it to the shared foundation with indigo/teal overrides preserved the identity while eliminating the isolation. The project looks different but belongs to the same family.
   _⚙ Status: `investigate` · lesson #456_

4. **Living systems research is one system.**
   AWF's causal pathways (pesticides→pollinators→food, deforestation→rainfall→agriculture) proved what the blockquote claims: each PNW project maps a different layer of the same place. The modules are not parallel — they are interconnected.
   _⚙ Status: `applied` (applied in `v1.49.37`) · lesson #457_

5. **The front door matters.**
   15 projects, 340+ files, 15+ MB of research content — and until this release, no root landing page. The index.html is not decoration. It is the map that makes the territory navigable.
   _⚙ Status: `investigate` · lesson #458_

6. **tibsfox.png is 3.7 MB.**
   The brand mark watercolor is shipped at original resolution. A production deployment should serve a resized version (200-300 KB). The full resolution should be preserved as source but not served to browsers.
   _⚙ Status: `investigate` · lesson #459_

7. **Review caught the AWF card gap.**
   The root landing page was committed with 14 project cards despite AWF being the 15th project in the same release. The review pass caught this — if it hadn't, the root page would have shipped inconsistent. Checklist item: always verify root page project count matches PNW hub project count.
   _⚙ Status: `investigate` · lesson #460_

8. **Model assignment creates consistency gaps.**
   AWF Track A (Sonnet-generated) was competent but generic. Track B (Opus-generated) had PNW depth and specificity. The improvement pass fixed this, but planning for model-specific review passes from the start would be more efficient.
   _⚙ Status: `investigate` · lesson #461_
