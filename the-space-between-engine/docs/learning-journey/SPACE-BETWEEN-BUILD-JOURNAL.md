# The Space Between — Build Journal

## Mission Execution (2026-03-06)

### What Was Built
108 source files + 14 test files = 122 files total. React/TypeScript SPA with 8 Observatory Wings, Garden workshop (4 tools), Telescope unified view, Observatory Shell, Progression Engine, Wonder Warden safety system, and 354 tests passing.

### Execution Timeline

| Wave | Track | Agent | Tokens | Duration | Files |
|------|-------|-------|--------|----------|-------|
| 0 | Scaffold + Types | orchestrator | — | — | 5 |
| 1A | Core Engine | agent | — | — | 3 (89 tests) |
| 1B | Visualization | agent | — | — | 2 |
| 2C | Nature Sims + Garden | agent | 92K | ~11min | 15 |
| 2D.1 | Narrative | agent | — | — | 4 |
| 2D.2 | Bridge + Warden | agent | — | — | 4 |
| 2A | Wings 1-4 | agent | 148K | ~15min | 28 |
| 2B | Wings 5-8 | agent | 61K | ~22min | 28 |
| 3.1a | Telescope | agent | 58K | ~5min | 9 |
| 3.1b | Shell | agent | 76K | ~6min | 9 + 1 update |
| 3.3a | Core + Safety Tests | agent | 94K | ~5min | 5 (144 tests) |
| 3.3b | Integration + Edge Tests | agent | 155K | ~8min | 6 (121 tests) |

### What Landed Well

**Wing 5 Set Theory CreatePhase — the emotional center delivered.**
The 4-stage progression (write -> question -> paradox -> reflection) with three different paradox responses based on the learner's answer (yes/no/unsure) is the best component in the engine. The "unsure" path: "That uncertainty is not a failure -- it is the most honest answer." The spec asked for disproportionate care and got it.

**Wing 4 compass fox animation is a real simulation.**
The fox follows actual dipole field lines (B_x = 3xy/r^5), leaves a trail, and wraps when it exits the canvas. Not a sprite on a path — genuine physics.

**Wing 5 WonderPhase particle system.**
Particles slow down inside the boundary ("become part of the pattern") and speed through outside. The breathing ellipse boundary conveys "atoms change, pattern persists" without words.

**BeginAgain has the right restraint.**
3-second delay before coda appears, 4-second color fade, clickable but not auto-navigating. Two words: "Begin again." No elaboration. The spec said "a breath, not a transition" and the agent delivered exactly that.

**Progressive disclosure in Navigation is clean.**
`getWingVisibility()` handles all three learner states (first visit / returning / veteran) with a single function. Placeholder "..." buttons still navigate but gently suggest continuing.

**The Telescope compass fox is hand-drawn SVG.**
Ears, nose, eyes, tail, white chest — geometrically rendered, rotates to face selected foundation, glows during Begin Again. The agent could have used a placeholder; it chose craft.

**354 tests vs 166 target — 2x overshoot.**
Agents wrote more granular assertions than planned. More coverage is never a problem.

### Issues Found

**Theme color collision: Pythagorean and Information Theory both #b8860b.**
The spec said "Amber" and "Gold" — these should be different hex values. They'll be visually indistinguishable in the sidebar and Telescope. Needs fix.

**Inline styles everywhere — no CSS files.**
All agents used inline React styles. The `className` props (e.g., `phase--wonder`, `wonder__canvas`) reference BEM classes with no stylesheet backing them. The naming is decorative. This works functionally but means: no CSS hover states, no media queries in stylesheets, slightly larger bundle. Not how you'd ship production.

**No CSS file exists at all.**
The entire visual layer is inline styles + `theme.ts` constants. For a prototype/engine this is fine. For production, extract to CSS modules or a stylesheet.

### Lessons Learned

**1. Wave-based parallel agent execution works at scale.**
12 agents across 4 waves, zero file conflicts, all gates passed. The dependency graph (types -> core -> viz+narrative -> wings -> shell -> tests) held perfectly. Critical insight: agents writing to non-overlapping directories can safely run in parallel without worktrees.

**2. Spec quality directly determines agent output quality.**
The 32 fixes from the muse review rounds (versine formula, stale types, missing shelter actions, Hundred Voices chain swap) would have caused cascading failures across all 12 agents if unfixed. The investment in spec review paid for itself many times over.

**3. Emotional fidelity requires explicit spec language.**
Wing 5 delivered because the spec said "ALLOCATE DISPROPORTIONATE CARE" and described exactly what that meant. Generic specs produce generic output. The spec's specificity about the fox ("A fox tilts its head and feels the earth") produced a genuine simulation, not a placeholder.

**4. Agents overshoot test counts but undershoot styling.**
Test agents wrote 354 tests against a 166 target — they understood the domain deeply enough to add meaningful edge cases. But not one agent created a CSS file. The agents treated styling as secondary to logic, which is the right priority for an engine but wrong for a shippable product.

**5. Context compaction kills background agents.**
The previous session's 6 background agents were all lost when the context window compacted. Background agents must complete within the session or their work is lost. Plan wave boundaries around this.

**6. The TypeScript type system is the best agent coordinator.**
Zero type errors across 12 agents writing 122 files because they all imported from the same canonical `types/index.ts`. The type system enforced interface contracts better than any prompt could.

**7. Agent prompt length matters.**
The Wings 5-8 agent (61K tokens used, 22min) took longer than Wings 1-4 (148K tokens, 15min) despite producing the same file count. The Wings 5-8 prompt was longer (more emotional context for Wing 5), and the agent read more source files before writing. Longer prompts -> more reading -> better output but slower.

**8. The "Begin Again" two-state design was worth the spec complexity.**
Having distinct loop-closed (Wings 1+8) vs full-journey (all 8) states produced two genuinely different emotional moments. The loop-closed state is a quiet nod; the full journey is a breath. If the spec had said "animate when done," both states would have been identical.

### Architecture Decisions Made During Build

- **React.lazy for wing loading** — each wing is a separate chunk, loaded on navigation
- **useReducer over useState** — single reducer for all app state, immutable updates
- **localStorage for persistence** — serialize/deserialize via ProgressionEngine
- **SVG for Telescope** — circular layout with concentric chain rings, not canvas
- **Canvas for simulations** — requestAnimationFrame loops with proper cleanup
- **No router library** — NavigationState managed via reducer, no URL routing
- **No state library** — pure React state, ProgressionEngine as single source of truth
- **Tone.js lazy-loaded** — only imported in Wing 3 and Garden music tool

### File Inventory

```
src/
  types/index.ts                          # Canonical type system (275 lines)
  core/
    registry.ts                           # 8 foundations, all phase data (~800 lines)
    connections.ts                        # Connection graph, BFS, cross-domain nodes
    progression.ts                        # Immutable state engine, serialize/deserialize
  visualization/
    canvas.ts                             # CanvasManager, RAF loop, FPS tracking
    nature/
      framework.ts                        # NatureSimulation abstract class
      sims/ (10 files)                    # 9 simulations + barrel
  narrative/
    stories.ts                            # 8 wonder stories
    bridges.ts                            # 8 Hundred Voices bridges
    prompts.ts                            # 22 reflection prompts
    index.ts                              # Export contract
  integration/
    skill-bridge.ts                       # SkillCreatorBridge, versine, arc/chord
    calibration.ts                        # CalibrationMath, readiness computation
    warden.ts                             # WonderWarden, 4 modes, shelter
    index.ts                              # Barrel export
  observatory/
    wings/ (8 dirs x 7 files = 56 files)  # 8 wings, each with 6 phases + container
    garden/ (5 files)                     # ArtCanvas, MusicStudio, LSystemEditor, Journal
    telescope/ (9 files)                  # 4 chains, compass fox, Begin Again
  shell/ (9 files)                        # App, Layout, Navigation, WelcomeBack, theme
  main.tsx                                # Entry point

tests/
  core/ (3 files, 89 tests)
  safety/ (4 files, 120 tests)
  visualization/ (2 files, 40 tests)
  integration/ (4 files, 75 tests)
  edge/ (1 file, 30 tests)
```

### Known Gaps for Next Session
1. Fix Pythagorean/Information Theory color collision
2. Create proper CSS (extract from inline styles or add CSS modules)
3. No URL routing — deep links don't work
4. No service worker — could be useful for offline caching
5. Flock of Ravens (Wave 0.5) — deferred, ships independently
6. No actual Vite build test — `npm run build` not verified
7. Garden-Wing creation handoff not wired (the classes exist but Shell doesn't connect them)
