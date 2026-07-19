# v1.49.1129 — Lessons

This ship promotes no new manifest lesson; it applies and reinforces several
existing ones, and records reusable process observations from the campaign.

## Applied (existing lessons)

- **No-fabrication discipline for the knowledge base.** Every number added in
  refinement had to trace to a cached abstract, a verified WebFetch, or the
  review's already-grounded refinement note. Two fabrications that had survived
  authoring were deleted rather than supported — a knowledge base earns trust
  by re-verification, not assertion.
- **Opt-in and inert by default in a self-modifying system.** The Claude-backed
  distill / claim / enrichment cores, the SessionEnd hook, the concept-skill
  suggester, and the two ML scaffolds all ship disabled. The machine proposes
  only when explicitly turned on.
- **Never stage `.planning/`; no co-author trailers.** All six refinement waves
  and the infrastructure follow-ups kept clean commit hygiene under the
  hook-enforced rules.

## Process notes

- **Author for coverage, then refine for fidelity — as separate passes.** A
  single combined pass drops headline numbers under coverage pressure; a
  dedicated source-grounded review pass is what restores them.
- **WebFetch reaches arXiv and is the decisive fidelity check** for concepts
  whose source abstract was never cached — it catches fabrications the
  abstract-grounded pass structurally cannot.
- **Resolution-test registries are the cross-link trap.** An intra-department
  edge A→B fails unless B is imported into A's test's resolvable-id set; adding
  cross-links safely means a propose → apply → reconcile pipeline that patches
  those registries, not hand-editing edges.
- **A frontier-saturation signal (zero new T1 across a dig) is the stop cue.**
  Once monthly scanning stops yielding T1 concepts, refine what exists rather
  than keep scanning a picked-over month.
