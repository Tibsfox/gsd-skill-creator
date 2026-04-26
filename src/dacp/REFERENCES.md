# References — DACP

**Module:** `src/dacp/`
**Phase:** 845 (JP-035, SAGES DACP-fidelity citation)

---

## JP-035 — SAGES DACP-Fidelity Citation (arXiv:2512.09111)

**Added:** Phase 845 (JP-035, MEDIUM).

### arXiv:2512.09111 — SAGES: Scalable Agentic Grounding and Execution System

SAGES formalizes the fidelity-threshold architecture for agentic systems operating under bounded context. The paper's core contribution relevant to `src/dacp/fidelity/` is the **grounding-fidelity score** `φ`: a scalar in [0, 1] that measures the degree to which an agent's current execution context faithfully reflects the ground-truth task specification.

Key definitions from SAGES §3:

- **Grounding fidelity `φ`** — `φ = 1` means the agent's working context is a lossless encoding of the task; `φ → 0` means the context has drifted to the point where the agent is effectively ungrounded.
- **Fidelity threshold `φ_min`** — below this threshold SAGES mandates a re-grounding step (context refresh from the authoritative specification). Operationally equivalent to the CAPCOM `CRITICAL` escalation in `src/dacp/fidelity/`.
- **Scalable execution** — SAGES achieves O(1) amortized grounding overhead per agent step by checkpointing fidelity at phase boundaries rather than every action.

### Mapping onto src/dacp/fidelity/

| SAGES concept | gsd-skill-creator / DACP construct |
|---|---|
| Grounding fidelity `φ` | `FidelityScore` in `src/dacp/fidelity/` — scalar measuring context faithfulness to the committed phase spec |
| Fidelity threshold `φ_min` | CAPCOM `WARN` / `CRITICAL` thresholds in the fidelity module |
| Re-grounding step | CAPCOM escalation → fresh-context subagent verification (C5 external-verification-gate, per arXiv:2604.20874 §C5) |
| Phase-boundary checkpointing | `src/dacp/` phase-boundary hooks — fidelity is measured at each phase commit, not every tool call |
| Scalable O(1) amortized overhead | CAPCOM gating on phase transitions, not on every action — the same amortization as SAGES §4.2 |

### Why SAGES complements arXiv:2604.20874

arXiv:2604.20874 (Root Theorem of Context Engineering, see `CLAUDE.md`) gives the formal bounded-tape axioms justifying *why* fidelity degrades monotonically. SAGES (arXiv:2512.09111) gives the *operational architecture* for measuring and recovering from that degradation in a scalable multi-agent system. Together they form the two-layer foundation for the DACP fidelity module:

1. **arXiv:2604.20874** — axioms C1–C5: fidelity decays independently of window size; re-grounding must be external.
2. **arXiv:2512.09111 (SAGES)** — operational realization: grounding-fidelity score, phase-boundary checkpointing, `φ_min`-triggered re-grounding.

**Citation:** *SAGES: Scalable Agentic Grounding and Execution System.* arXiv:2512.09111. (2025). §3 grounding fidelity, §4.2 phase-boundary checkpointing.

---

## Cross-references

- `src/dacp/fidelity/` — operational fidelity scorer and CAPCOM escalation thresholds
- `src/dacp/bus/` — DACP event bus carrying fidelity-score events to CAPCOM
- `src/dacp/retrospective/` — per-phase retrospective anchored on fidelity checkpoints
- `CLAUDE.md` §External Citations — arXiv:2604.20874 (Root Theorem; bounded-tape axioms C1–C5)
- `src/bounded-learning/CITATION.md` — KL bound formalizing the distributional consequence of fidelity loss
