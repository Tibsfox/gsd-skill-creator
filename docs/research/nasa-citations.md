# NASA Mission Series — Citations

**JP-040 anchor file** (originally Wave 3 / phase 843 of the JULIA-PARAMETER milestone).

These citations support content in the NASA mission series (multi-spacecraft constellation planning, formation flying, autonomous rendezvous and proximity operations). The file lives on-tree at `docs/research/nasa-citations.md` so CI and fresh checkouts can verify it; this replaces the original gitignored `.planning/missions/nasa/REFERENCES.md` location which was structurally unverifiable on CI.

---

## arXiv:2512.09111 — SAGES: Scalable Autonomous Guidance and Estimation for Spacecraft

Provides the scalable autonomous guidance architecture underpinning multi-spacecraft constellation planning in the NASA mission series. SAGES formalises the sensor-fusion + state-estimation pipeline for autonomous rendezvous and proximity operations, directly relevant to formation-flying mission designs (e.g., constellation mapping, multi-probe survey missions).

**Used in:** NASA mission series content involving multi-spacecraft autonomous operations, rendezvous, or proximity operations.

**Cross-reference:** `CLAUDE.md` § "External Citations (CS25–26 Sweep)" → arXiv:2604.21910 (Skills-as-md) carries a forward-citation amendment referencing SAGES (added via JP-011 during the v1.49.577 JULIA-PARAMETER mission).

---

## arXiv:2604.21024 — EEI Formation Flying: Energy-Efficient Interferometry via Distributed Spacecraft

Establishes energy-efficiency bounds and formation-geometry optimisation for distributed-aperture interferometry missions. The EEI framework informs mission architecture decisions where multiple spacecraft maintain precise relative positioning for science return — radio interferometry, gravitational-wave pathfinders, synthetic-aperture imaging.

**Used in:** NASA mission series content involving formation-flying interferometry or distributed-aperture science.

---

## Provenance

These two papers were carded during the v1.49.577 JULIA-PARAMETER mission (Wave 1 / Track A — DACP / Mesh / Verification track) and assigned to JP-040 in `m5/FINDINGS.md`. The original Wave 3 P843 agent attempted to assert their presence in `src/skill-promotion/__tests__/citations-presence.test.ts`, but the assertion targeted `.planning/missions/nasa/REFERENCES.md` (gitignored) and so was structurally broken on CI. The assertion was removed in commit `6598ac959` with the rationale that the long-term home was the `nasa` branch.

Per user direction 2026-04-26, the `nasa` branch was merged back into `dev` some time ago and is no longer active — all NASA-series work continues on `dev`/`main`. The on-tree relocation in v1.49.578 (this file) closes the original JP-040 deliverable on the active branch with a real CI-verifiable path.

## See also

- `CLAUDE.md` § "External Citations (CS25–26 Sweep)" — main canonical anchor surface
- `src/skill-promotion/REFERENCES.md` — JP-032 anchor file (deployment-horizon ROI; arXiv:2604.20897)
- `src/dead-zone/CITATION.md` — JP-033 anchor file (12-simulation floor; arXiv:2604.21101)
- `src/mathematical-foundations/lean-toolchain.md` — JP-001 Lean toolchain pin (arXiv:2510.04070)
