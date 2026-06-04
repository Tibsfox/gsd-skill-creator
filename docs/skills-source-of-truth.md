# Skills source-of-truth + research-skill disposition

**Ship 2.2 (v1.49.974).** Closes the clean-install reproducibility gap: skills that
existed only in the installed `.claude/skills/` tree (gitignored) but not in the
`project-claude/skills/` source-of-truth, so `node project-claude/install.cjs` on a
fresh checkout would not reproduce them.

Skills in `project-claude/skills/<name>/SKILL.md` are installed by `install.cjs`
via the `manifest.json` schema-v2 `autoDiscover` pattern `*/SKILL.md` (single-file
skills need no explicit manifest entry; multi-file skills are listed in
`files.skills[]`). `node project-claude/install.cjs --dry-run` reporting 0 new/0
updated for these skills means source-of-truth == installed tree.

## Promoted to source-of-truth (Ship 2.2)

Seven skills moved from `.claude/skills/` (local-only) into `project-claude/skills/`:

| Skill | Kind |
|---|---|
| `adversarial-pr-review` | keeper — spec-compliance PR review |
| `image-to-mission` | keeper — backed by `src/vtm/image-to-mission` |
| `token-budget` | keeper — Gastown convoy budget primitive |
| `execution-grounded-selection` | arxiv research (Semantic Voting) — wired |
| `intent-router` | arxiv research (Pre-Route / MemFlow) — wired |
| `skill-counterfactual-audit` | arxiv research (CTA) — wired |
| `spectral-topology-preflight` | arxiv research (Parks & Alharthi) — wired |

## KEEP-LOCAL (intentionally not promoted)

| Skill | Reason |
|---|---|
| `uc-observatory` | Coupled to the **parked v1.50 / Unit-Circle work** (decision-gate **D1**: keep v1.50 fully parked, untouched). It spawns the 9 UC-lab agents that are shared with `team-control`'s UC mode; promoting it would imply the parked substrate is a live install target. Resume only on explicit v1.50 reactivation (operator-only). Drift-guard pins this exclusion so it is a decision, not drift. |

## Research-skill wires (Ship 2.2 — "wire all 4")

Each arxiv research skill was wired into its semantically-correct documented consumer
so it has a real caller (the audit's "wired or has a verdict" bar):

| Research skill | Consumer (source-of-truth) | Wire |
|---|---|---|
| `skill-counterfactual-audit` | `skill-integration` skill | Audit gate when a skill is created / modified / proposed for retirement (NOT the Gastown `done-retirement` work-item pipeline, which the skill's own doc mis-named) |
| `spectral-topology-preflight` | `team-control` skill | Team pre-flight topology check before launching the four-agent team |
| `intent-router` | `wrap:execute` + `wrap:verify` commands | First step in handler dispatch — classify the information-need before skill loading |
| `execution-grounded-selection` | `wrap:verify` command | Disambiguate multiple candidate fixes by behavioural fingerprint instead of output-majority voting |

All wires are advisory / best-effort: a missing companion skill never blocks the host command.

## Skills-tier adoption answer (and the follow-on)

The committed inventory above + the `tests/integration/skills-source-of-truth.test.ts`
drift-guard are the source-of-truth answer for "which skills are reproducible, which
are local-only by design, and which research skills are wired where." A richer
**per-skill activation counter** (runtime) would extend `src/storage/skill-index.ts`
(which manages the gitignored `.claude/skills/.skill-index.json`) — that is a scoped
follow-on, sibling of the `tools/adoption-scan.mjs` src/ adoption telemetry and the
agent-adoption scan (audit Ship 2.3), and is intentionally out of scope here per the
lightest-disposition discipline.
