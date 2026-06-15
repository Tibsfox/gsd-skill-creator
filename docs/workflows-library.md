# Workflows library (`tools/workflows/`)

**Canonical process doc for the committed Workflow-runtime skeleton library.**
**Shipped:** v1.49.1031 (audit §10 ship 5; AUDIT-2026-06-09 nasa-ops-machinery
lens, PROMOTE verdict). **Drift-guard:**
`tests/integration/workflows-library-discipline.test.ts`.

---

## What this is

`tools/workflows/` is the committed home for **generic, parametrized
Workflow-runtime scripts** — the same script genus as
`tools/ship-review/adversarial-ship-review.mjs`: executed by the Claude Code
Workflow tool via `Workflow({ scriptPath, args })`, using the injected globals
(`agent` / `parallel` / `pipeline` / `phase` / `log` / `args` / `budget`).
They are **not** standalone Node CLIs — they are not imported, typechecked
(tsconfig covers `src/` only), or unit-tested as modules; their structural
contract is pinned by the drift-guard integration test, which runs in the root
vitest project on every bare `npx vitest run`, pre-tag-gate step, and CI leg.

The library exists because the repo's proven QA machinery for the v988–v1026
NASA cadence (39 ships, 0 content-filter trips in runs 2–4) lived in **19
untracked clones** under gitignored `.planning/` that drifted: the ANCHOR-LEAK
guard existed in only 3 of 11 review clones and 3 of 6 build clones, the
rotation-vs-continuation prompt flip was one untracked handoff paragraph, and
mission auditors were not pinned read-only. Promotion mirrors the v968
(ship-review) and v983 (trip-vocab) precedents: **generic skeletons are
committed; per-mission instances, MISSION-BRIEFs, handoffs, and SESSION-RETROs
stay untracked** per the never-commit-mission-packages policy (double-enforced
by `.gitignore` and the git-add-blocker hook).

### Why — the evidence

The untracked ancestors of these skeletons caught defects no mechanical gate
could: a physics BLOCKER (v1013 CGRO burst-isotropy formula), a terminology
MAJOR (v1014 Swift Lyman-alpha vs Lyman-limit), and 2 MAJOR predecessor-anchor
leaks (v1023 Dawn — the catch that created the ANCHOR-LEAK guard, which then
held 3 consecutive clean ships at COBE/WMAP/GP-B). DECOMPOSE-build sustained
8/8 agents at ~350s total wall-clock against the ~290s single-sub-agent
ceiling, confirmed 6× (v1021–v1026). The audit harness topology ran the
2026-06-03 and 2026-06-09 core retrospectives.

---

## The three skeletons

### 1. `content-adversarial-review.mjs` — content review (4 auditors + judge)

Adversarial review of a clone-rewritten content deliverable set (NASA mission
pages or any content genus) **after a build, before pre-tag-gate**. For ship
DIFF review use the sibling `tools/ship-review/adversarial-ship-review.mjs` —
the two are siblings with different inputs; both stay.

- **Topology (invariant across all 11 ancestors):** 2 fact-checkers split by
  claim cluster + 1 framing/**anchor-canonicality** auditor + 1
  structure/leak auditor → cross-cluster **synthesis judge** (dedupes,
  independently re-reads every cited file, applies the exception allow-list,
  rejects false positives aggressively, classifies with the 3-way verdict enum
  `real-fix-now` | `real-minor-optional` | `rejected-false-positive`).
- **The ANCHOR-LEAK guard is always on:** the framing auditor's first duty is
  anchor canonicality — only `args.canonicalAnchors` (+
  `args.cumulativeAnchors`) may be stamped "NEW LOCKED at `version`";
  predecessor anchors carried over from the cloned source are MAJOR findings,
  and research.html/research.md must stamp identical anchor sets.
- **`mode: 'rotation' | 'continuation'`** flips the predecessor-leak rule:
  rotation → ALL predecessor topical content is a leak except a single
  deliberate nav-prev/lineage note; continuation → the shared axis vocabulary
  (`args.sharedVocab`) is correct and only predecessor-specific items
  (`args.predecessor.leakVocab`) are leaks.
- **Payload via args, never hardcoded:** the committed file enumerates no
  mission vocabulary (#10406 positive-framing discipline). The MISSION-BRIEF
  is the authoritative fact source; every auditor reads it first.
- Required args: `{ mission, degree, version, dir, brief, mode,
  canonicalAnchors[], predecessor{ mission, degree, anchors?, leakVocab? } }`.
  Optional: `cumulativeAnchors`, `sharedVocab`, `readme`, `pages`,
  `factFocus{a,b}`, `structureNotes`, `exceptions`.
- Returns `{ rawCount, summary, fixNow, allConfirmed }`. The orchestrator
  applies every `fixNow` finding in the main context, then runs the
  mechanical gates. A dead judge fail-safes to all-raw-findings-are-fix-now —
  it never silently passes the review.

### 2. `decompose-build.mjs` — DECOMPOSE-build (parallel rewrite agents)

Rewrites a cloned content directory (predecessor clone → new mission) via a
**page + artifact-tree decomposition** — the 7 page tasks `index.html` /
`research` / `organism` / `math-sim` / `papers-curriculum` / `jsons` /
`pointers-shader`, plus the **artifact-tree tasks** `artifacts-story-audio` /
`artifacts-circuits` / `artifacts-sims` / `retro-forest`, plus the conditional
`readme` — each task one bounded sub-5-minute agent, beating the ~290s
sub-agent ceiling that killed single-dispatch builds.

The `artifacts-*` and `retro-forest` tasks (added 2026-06-15) close **W6
collapse debt**: the original 8 tasks rewrote only the track pages + JSONs +
shader, silently dropping the substrate-era artifact tree (story/circuits/
sims/audio), the retrospective chain, and the forest module — so every forward
degree shipped collapsed and needed a later W6 backfill. Forward degrees now
clone a post-backfill predecessor (1.220+, full NASA-1.150 shape) and rewrite
the **whole tree in place, keeping cloned filenames** (so `index.html`'s
artifact links stay valid with zero slug coordination), and `retro-forest`
re-runs `tools/nasa-forest-manifest-regen.mjs` so the new module loads. The
result passes `tools/nasa-consistency-audit.mjs` (a ship-gate BLOCKER as of
2026-06-15) on the artifact-count, forest-in-manifest, and retrospective-chain
invariants.

- **SHARED contract (invariant across all 6 ancestors):**
  clone-rewrite-preserve-STRUCTURE rule; "REQUIRED: first read `<brief>`";
  AXIS/ENGINE block; the **ANCHORS guard** ("use ONLY these; do NOT carry
  predecessor anchors") — a required arg here, where the ancestors had it in
  only the 3 newest clones; DISCIPLINE (a)–(e) (positive framing, <=200-word
  dedications, <=5x single-word repetition per paragraph, anchor tag-sentence
  house style, mode-scoped predecessor-vocab replacement); footer: "Do NOT
  commit/tag/push/FTP/bump-version", per-HTML-file
  `node tools/trip-vocab-check.mjs <file> --mode page` with VERDICT PASS, and
  a short 1–3 line confirmation return.
- **`mode` flips the topic-change note** exactly as in the review skeleton.
- Build agents **write files**, so they run `general-purpose` — this is the
  one skeleton whose agents are deliberately not Explore (the drift-guard pins
  the asymmetry both ways).
- Required args: `{ mission, degree, version, dir, brief, mode,
  predecessor{ mission, degree }, successorDegree, anchorsBlock, axisBlock,
  organismBlock, shaderBlock }`. Optional: `factsBlock`, `leakNote`, `nav`,
  `readme{ path, modelPath }`, `taskNotes{ label: extra }`, `tasks` (full
  roster override for non-NASA genera).
- Supersedes the #10408 single-dispatch rebuild template for catalog-clone
  rewrites (Lead A) — see
  [`nasa-mission-authoring-discipline.md`](nasa-mission-authoring-discipline.md).

### 3. `audit-harness.mjs` — retrospective-audit harness

The proven multi-wave audit topology: **Scout** (live counts at dispatch kill
hardcoded-count rot) → **Verify-Prior** (adversarial refuters over the prior
audit's load-bearing claims) + **Coverage** + **Surfaces** in one parallel
wave → **Lenses** (read wave-A notes) + **Verify-New** (refuters over this
run's fresh claims, lenses included — the 2026-06-03 run's unverified-lens gap
is closed structurally) → **Critic** (cross-note conflicts + self-contained
gap tasks) → budget-gated **Gap-fill** → **Synthesis** (draft doc +
results.json + run manifest written in-workflow, so a context reset cannot
strand the findings).

- Refuter verdict enum: `CONFIRMED | REFUTED | UNVERIFIABLE`.
- Audit scope arrives via args specs (`refuteSpecs` / `coverageSpecs` /
  `surfaceSpecs` / `lensSpecs`, each `{ label, file, task }`); the harness
  throws without them — a generic audit cannot invent its scope.
- All agents are read-only on the repo except their one assigned notes file
  under `args.auditDir`; the full test suite is off-limits (targeted
  single-file runs only).

---

## Isolation discipline (load-bearing)

- **Review and audit agents are read-only.** `content-adversarial-review.mjs`
  pins `agentType: 'Explore'` on all four auditors AND the judge (5 sites) —
  an upgrade over the untracked ancestors, which had no pinning and could in
  principle have mutated the pages under review. The audit harness states
  read-only rules in every prompt and pins Explore on the scout.
- **Build agents write by design** (`general-purpose`): rewriting files is the
  job. The boundary is the prompt contract: only assigned files, never
  commit/tag/push/FTP.
- **Worktree isolation is never used** (a fresh worktree lacks node_modules;
  probes fail there — same invariant as the committed sibling, same
  drift-guard pin).
- After any workflow whose agents can write, `git status` the tree before
  trusting it.

## The promotion boundary

Committed here: **generic skeletons only**. Still untracked, by policy
(never-commit-mission-packages, `.gitignore` + git-add-blocker): per-mission
script instances, MISSION-BRIEF.md files, handoffs, SESSION-RETROs. A
per-mission run is: author the brief (untracked) → invoke the committed
skeleton with per-mission args → outputs go to the gitignored `www/` tree and
the tracked `docs/release-notes/` README. The args payload is authored fresh
per mission from the brief; nothing mission-specific lands in git via these
tools.

## How to run

```
Workflow({ scriptPath: 'tools/workflows/decompose-build.mjs', args: { ... } })
Workflow({ scriptPath: 'tools/workflows/content-adversarial-review.mjs', args: { ... } })
Workflow({ scriptPath: 'tools/workflows/audit-harness.mjs', args: { ... } })
```

The Workflow runtime may deliver `args` as a JSON string on scriptPath
invocations; all three skeletons coerce object-or-string and fail loudly with
a usage message when required args are missing.

## Related

- [`adversarial-ship-review.md`](adversarial-ship-review.md) — the ship DIFF
  review sibling (T14 step P; gate-enforced attestation).
- [`nasa-mission-authoring-discipline.md`](nasa-mission-authoring-discipline.md)
  — the NASA campaign discipline doc; its resume-era machinery section is the
  per-mission usage guide for the two NASA-facing skeletons.
- [`T14-SHIP-SEQUENCE.md`](T14-SHIP-SEQUENCE.md) — the NASA T14 appendix
  references this library.
- `tests/integration/workflows-library-discipline.test.ts` — the drift-guard.
