# v1.49.1031 — Lessons

No new manifest lesson is promoted this ship. One existing lesson is
explicitly SUPERSEDED in scope (the ship's Lead A deliverable), and several
established lessons are applied.

## Superseded (scope-narrowed)

- **#10408 — PER-MISSION-SUB-AGENT-REBUILD-PATTERN: SUPERSEDED for
  catalog-clone rewrites** by the DECOMPOSE-build pattern, now committed at
  `tools/workflows/decompose-build.mjs` (8 bounded parallel rewrite agents
  vs one ~290s-ceiling-bound dispatch; ANCHORS guard built in; 6× confirmed
  v1021–v1026). #10408 remains valid for constrained harnesses (no Workflow
  tool) and non-clone rebuild work. Annotated at both homes
  (`docs/sub-agent-dispatch-discipline.md`,
  `docs/nasa-mission-authoring-discipline.md` §0.1). This closes audit
  Lead A — whose original #10233 target was a mis-target (absent from live
  disciplines.json; no action taken or needed).

## Applied (existing lessons)

- **#10406 (positive-framing / no forbidden-token enumeration)** — applied to
  the committed surface itself: the three skeletons carry zero mission
  vocabulary; leak payloads arrive via args and the MISSION-BRIEF stays
  authoritative.
- **#10461-class (gate-enforce every runnable surface + drift-guard
  pairing)** — applied at the PROCESS level: the new library lands WITH its
  root-project drift-guard in the same ship, mirroring the v968 precedent.
- **#10462 (describe a guarded literal, never quote it)** — the docs name
  vocabulary classes and guard semantics without reproducing scannable
  payload literals.
- **"First real parse is an audit" (obs#3 at v1030)** — generalized here as
  evidence-fleet-before-edit: the clone-consensus fleet read all 17 ancestors
  before any skeleton line was written, catching the framing-label evolution
  that a 2-clone sample would have missed.

## Process notes

- **Promotion-boundary recipe reaffirmed (3rd instance: v968, v983, v1031):**
  when working-tree machinery proves load-bearing, commit the generic
  skeleton + drift-guard + canonical doc; leave instances untracked; encode
  the guards the clone-chain kept losing as REQUIRED args or always-on
  prompt sections, not as optional payload.
- **Workflow-runtime scripts need a wrapper syntax check** — top-level
  `return` + injected globals make bare `node --check` fail by design
  (the committed sibling fails identically); validate by wrapping the body
  in an async function. Worth folding into a future tools-suite check if the
  library grows.
