# Retrospective — v1.20

## What Worked

- **Wiring 13 orphaned components into the generator pipeline.** This release is pure integration -- no new features, just connecting what v1.12-v1.19 built. The fact that 13 components could be wired in with unified CSS and real data pipelines validates the design system from v1.18.
- **Data collectors as the bridge layer.** Topology, activity feed, budget-silicon, and staging queue collectors each transform domain-specific data into renderer-compatible formats. This collector pattern keeps renderers pure and data sources independent.
- **Design system token compliance.** Enforcing that all colors reference CSS custom properties (no hardcoded hex) across 18 component style modules means the design system is actually used, not just defined.

## What Could Be Better

- **110 tests across 12 plans is the lightest test count in the v1.12-v1.20 arc.** Integration wiring is harder to test than isolated features, but the data collectors especially need contract tests to verify they produce the shapes renderers expect.
- **Console as a 6th generated page adds maintenance burden.** Every change to the generator pipeline now affects 6 output pages. A template or component model would reduce duplication.

## Lessons Learned

1. **Assembly releases are essential after feature sprints.** v1.12-v1.19 built 13 independent components. Without this dedicated wiring release, they would remain orphaned demos. Planning for integration work as its own milestone prevents feature sprawl.
2. **Gray-matter parsing for SKILL.md files makes topology data real.** The topology collector reading actual skill/agent/team files means the dashboard shows real state, not mock data. This is the difference between a demo and a tool.
3. **Git commits as activity feed source is clever reuse.** The activity feed collector transforming git history into FeedEntry[] means the dashboard shows real project activity with zero additional instrumentation cost.

---
