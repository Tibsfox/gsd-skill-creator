# Retrospective — v1.49.36

## What Worked

- **Brand-first, then cascade.** Building the design system as a standalone artifact (brand.css) before touching any project file meant every migration was mechanical: add the link, add the class, strip the duplicates. No design decisions during the migration pass — they were all made upfront.
- **Paintless Dog as source of truth.** Deriving the entire palette from a single painting gave the brand visual coherence that arbitrary color picks could not. The fox orange, parchment, and ink tiers are not branding choices — they are what the painting already is. Eight years of distance confirmed the palette still works.
- **AWF three-pass editorial.** Content → review → improvement. The review found 3 systemic issues (PNW specificity gaps in Track A, citation gaps in Module 05, hub not updated). The improvement run closed them in one focused pass before commit. Ship quality was materially higher than first-draft quality.
- **VAV migration last.** Saving the dark-mode outlier for a separate commit after the 13-project cascade proved cleaner. The pattern was established and proven before applying it to the edge case.
- **Root landing page as integration test.** Building the root index.html forced a review of every project card, gradient, and tag — effectively a visual integration test for the brand system.

## What Could Be Better

- **tibsfox.png is 3.7 MB.** The brand mark watercolor is shipped at original resolution. A production deployment should serve a resized version (200-300 KB). The full resolution should be preserved as source but not served to browsers.
- **Review caught the AWF card gap.** The root landing page was committed with 14 project cards despite AWF being the 15th project in the same release. The review pass caught this — if it hadn't, the root page would have shipped inconsistent. Checklist item: always verify root page project count matches PNW hub project count.
- **Model assignment creates consistency gaps.** AWF Track A (Sonnet-generated) was competent but generic. Track B (Opus-generated) had PNW depth and specificity. The improvement pass fixed this, but planning for model-specific review passes from the start would be more efficient.

## Lessons Learned

1. **A painting is a design system.** Paintless Dog's fox watercolor from 2016 contained every color decision the brand needed. The palette wasn't designed — it was extracted. When the source is right, the system writes itself.
2. **DRY applies to CSS too.** 15 projects × ~175 lines of near-identical CSS = ~2,300 lines of pure duplication. The cascade eliminated all of it while giving each project more visual identity through focused overrides, not less.
3. **Dark mode is a design choice, not a requirement.** VAV's dark mode was intentional but created a maintenance island. Migrating it to the shared foundation with indigo/teal overrides preserved the identity while eliminating the isolation. The project looks different but belongs to the same family.
4. **Living systems research is one system.** AWF's causal pathways (pesticides→pollinators→food, deforestation→rainfall→agriculture) proved what the blockquote claims: each PNW project maps a different layer of the same place. The modules are not parallel — they are interconnected.
5. **The front door matters.** 15 projects, 340+ files, 15+ MB of research content — and until this release, no root landing page. The index.html is not decoration. It is the map that makes the territory navigable.
