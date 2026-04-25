# v1.49.575 — CS25–26 Sweep → GSD Integration

**Closed:** 2026-04-25 (on `dev`; human merge to `main` remains gated per
2026-04-22 directive)
**Phases:** Half A 10 (796 → 805) + Half B 7 substrate modules (806 → 812) +
closing wave (813)
**Waves:** 4 (W0 Foundation → W1 Tracks A+B+C parallel → W2 Synthesis →
W3 Publication+Verify) + Half B
**Papers:** 54 priority + 1 anchor = 55 ADRs across 6 modules
**Modules:** M1=4 / M2=10 / M3=8 / M4=11 / M5=8 / M6=14
**Requirements:** 19 (CS25-01..CS25-19)
**Tests:** 27,887 passing (vs v1.49.574 published baseline 27,556 → **+331
tests**, 4.1× over the ≥80 floor; 3.3× over the ≥100 stretch)
**Regressions:** 0 net new attributable to v1.49.575
**Pre-existing failures:** 2 (in
`src/mathematical-foundations/__tests__/integration.test.ts` — v1.49.572
baseline, NOT v1.49.575)
**CAPCOM HARD GATES:** 3 passed (HB-03 STD calibration, HB-04 W/E/E roles,
HB-07 AEL bandit)
**Half A PDF:** `docs/release-notes/v1.49.575/cs25_gsd_mission.pdf` —
129 pages, 3-pass XeLaTeX clean
**Bibliography:** `docs/release-notes/v1.49.575/cs25-26-sweep.bib` — 55
biblatex-clean entries

## The fox finds the trail by recognizing the seams the deer made walking it

> The lesson is not that we built it first. The lesson is that the
> patterns are recoverable from outside, by people who never spoke to us,
> who saw the same problem and named it the same way. The fox finds the
> trail by recognizing the seams the deer made walking it. The seams were
> always there. The fox just looks where the path is.

Where v1.49.574 asked "what does the kernel-design literature say about
the chipset metaphor?", v1.49.575 asks the more uncomfortable question:
**what does the published CS25–26 literature say about the architectural
decisions GSD has been making since v1.0?** The answer is the
convergent-discovery validation pattern continued for the third milestone
running:

- Four anchor papers from the CS25–26 sweep arrive at GSD's load-bearing
  primitives by independent paths. None cite the GSD ecosystem. None
  could have — the timing rules it out.
- The seven Half B substrate modules are *not* GSD reinventing what the
  literature already published. They are GSD adopting what GSD's own
  decisions look like when written down by someone else.

## Half A — Deep research deliverable

The supplied 4-wave plan executed verbatim:

| Wave | Shape | Output |
|---|---|---|
| W0 Foundation | sequential, ~80k tokens | ADR template + 55-entry bibliography skeleton + citation index |
| W1 Parallel research | 3 background subagent fleets, ~720k tokens | 55 ADRs across 6 modules (Track A: M1+M2 / Track B: M3+M4 / Track C: M5+M6) |
| W2 Synthesis | sequential, Opus-heavy, ~230k tokens | cross-module matrix (81 connections, 9 cross-cuts), convergent-discovery report (4 anchors, 4,558 words), GSD architectural impact analysis (4,329 words / 12 subsystems / 19 dispositions), 12 integration specs HB-01..HB-12 |
| W3 Publication + verification | sequential, ~210k tokens | 129-page mission PDF (3-pass clean), biblatex-clean bib, CLAUDE.md / SKILL.md draft diffs, safety harness updates doc, 57-row verification matrix, index landing page |

**Convergent-discovery anchors:**

| arXiv ID | Title | Mirrors GSD primitive |
|---|---|---|
| `2604.21910` | Skills-as-md | three-tier vision-to-mission / research-mission-generator / skill-creator pipeline |
| `2604.21744` | GROUNDINGmd | CLAUDE.md Hard Constraints + Convention Parameters / Safety Warden BLOCK |
| `2604.20874` | Root Theorem of Context Engineering | bounded-tape framing — formal foundation of CAPCOM gating, fresh-context verification, accumulate–compress–rewrite–shed milestone retrospective lifecycle |
| `2604.21003` | Last Harness | external description of skill-creator — Worker / Evaluator / Evolution role split adoptable as HB-04 |

## Half B — Tier-1 only, 7 ADOPT-decision modules

All modules default-off via `.claude/gsd-skill-creator.json` `cs25-26-sweep`
block. Activating any flag is a deliberate operator decision; HB-03,
HB-04, and HB-07 additionally require CAPCOM hard-preservation sign-off.

| ID | Path | Tests | Source | CAPCOM HARD |
|---|---|---|---|---|
| HB-01 Tool Attention | `src/orchestration/tool-attention/` | 49 | `2604.21816` | — |
| HB-02 AgentDoG schema | `src/safety/agentdog/` | 48 | `2601.18491` | — |
| HB-03 STD calibration | `src/safety/std-calibration/` | 44 | `2604.20911` | **YES** |
| HB-04 W/E/E roles | `src/skill-creator/roles/` | 47 | `2604.21003` | **YES** |
| HB-05 Five-Principle linter | `src/cartridge/linter/structural-completeness.ts` | 47 | `2604.21090` | — |
| HB-06 Ambiguity linter | `src/cartridge/linter/ambiguity.ts` | 25 | `2604.21505` | — |
| HB-07 AEL bandit | `src/skill-creator/auto-load/` | 47 | `2604.21725` | **YES** |
| Phase 813 integration | `src/__tests__/cs25-26-sweep-integration/` | 24 (+1 todo) | this milestone | — |

User guides for each Half B module live under
`docs/release-notes/v1.49.575/user-guides/`.

## Backlog deferred (HB-08..HB-12 — v1.49.576+)

- **HB-08** AGS/RPS chipset divergence metrics — `2604.21255`
- **HB-09** DryRUN test-synthesis path for skill validation — `2604.21598`
- **HB-10** IRAP 5-round elicitation cap for vision-to-mission — `2604.21380`
- **HB-11** Black-Box Skill Stealing threat model for DoltHub federated economy — `2604.21829`
- **HB-12** FSFM 4-class forgetting taxonomy for bounded-learning policy — `2604.20300`

The tier-split discipline (T1 / T2 / T3) preserves milestone deliverability
while keeping every reviewed paper visible as a candidate. Promotion to T1
in a future milestone requires either a workflow-blocking gap that the
deferred module would close or an external dependency that brings the
ADOPT decision forward.

## Convergent-discovery validation

Four independent peer-reviewed works arrive at GSD's load-bearing patterns
from four problem domains. The signal is at the **design-discipline
level**, not at the theorem level — the published derivations and GSD's
field-grown conventions are not formally equivalent. They share a
discipline of identifying the minimum coordinating primitive a system
needs and replacing the cluster of approximate mechanisms with one
carefully-chosen one.

The pattern is now the keystone narrative across three consecutive
milestones:

- **v1.49.573** — seven convergent-discovery anchors across heterogeneous
  prior work.
- **v1.49.574** — SIGReg ↔ counter-based megakernel rhyme.
- **v1.49.575** — four CS25–26 anchors arriving at the same Skills-as-md /
  GROUNDINGmd / Root-Theorem / Last-Harness primitives.

## Dedications

This milestone closes with thanks to:

- **Anthropic Claude Opus 4.7** — the sweep reviewer that filtered 930
  CS25–26 candidate papers down to the 54 priority works that became this
  mission.
- **Garner et al.** — *Skills-as-md* authors (`2604.21910`); the published
  derivation of the three-tier authoring pipeline.
- **GROUNDINGmd authors** (`2604.21744`) — for naming the Hard
  Constraints / Convention Parameters split that the CLAUDE.md + Safety
  Warden BLOCK pattern had been doing without a name.
- **Root Theorem author** (`2604.20874`) — for the formal foundation that
  turned bounded-tape framing from an empirical convention into a derived
  consequence of two axioms.
- **Last Harness authors** (`2604.21003`) — for the external description
  of skill-creator, including the Worker / Evaluator / Evolution role
  split that HB-04 ships.
- **Tool Attention authors** (`2604.21816`) — for quantifying the MCP Tax
  at 10k–60k tokens per turn and giving HB-01 its measured baseline.
- **AgentDoG authors** (`2601.18491`) — for the where / how / what
  diagnostic taxonomy that HB-02 adopts.

## Branch state

- `dev` working branch: tip after milestone-close commit.
- `main`: at v1.49.571 merge tip; v1.49.572 + v1.49.573 + v1.49.574 +
  v1.49.575 queue together for human-authorized merge.
- `v1.50` branch: deferred per 2026-04-13 directive.

## Links

- Mission PDF: `docs/release-notes/v1.49.575/cs25_gsd_mission.pdf` (129 pages)
- Bibliography: `docs/release-notes/v1.49.575/cs25-26-sweep.bib` (55 entries)
- Integration specs: `.planning/missions/cs25-26-sweep/work/synthesis/specs/`
  (HB-01 .. HB-12 + README)
- ADRs: `.planning/missions/cs25-26-sweep/work/modules/{M1..M6}/`
- Convergent-discovery report:
  `.planning/missions/cs25-26-sweep/work/synthesis/convergent-discovery.md`
- Architectural impact analysis:
  `.planning/missions/cs25-26-sweep/work/synthesis/impact.md`
- Verification matrix: `docs/release-notes/v1.49.575/verification-matrix.{md,csv}`
- Regression report: `docs/release-notes/v1.49.575/REGRESSION.md`
- Retrospective: `docs/release-notes/v1.49.575/RETROSPECTIVE.md`
- User guides: `docs/release-notes/v1.49.575/user-guides/`
