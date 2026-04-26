# Learnable-K_H References

Research anchors and convergent citations for the MD-5 per-(skill, task-type) learnable K_H heads.

---

## arXiv:2603.15055 — MMAF: Multi-Modal Adapter Fusion for LoRA-Guided Fine-Tuning

**Authors:** (2026)
**Title:** MMAF: Multi-Modal Adapter Fusion with Magnitude-Masked Attention for LoRA
**Anchor finding:** MMAF introduces magnitude-masked attention fusion (MMAF) to guide which LoRA adapter ranks are activated per input context. Low-magnitude adapters are suppressed (masked) to reduce interference; high-magnitude adapters are up-weighted proportionally. Convergence under MMAF is faster than uniform rank allocation by ~30% on held-out benchmarks, with reduced catastrophic forgetting across task types.
**Relevance to MD-5:** The MMAF mask weight schedule is directly analogous to the Lyapunov-gated gradient update in `head.ts`; both suppress updates whose contribution is below a noise threshold. A future `MMAFLoRA` adapter in `src/learnable-k_h/` could wrap the existing `LearnableKHHead` update path to apply magnitude-masked rank selection before the Lyapunov gate check.
**Absorbed in:** `src/learnable-k_h/mmaf-lora.ts` + `src/learnable-k_h/__tests__/mmaf-lora.test.ts` (JP-023, Wave 3, phase 841)
**Convergent with:** `src/learnable-k_h/head.ts` (MD-5 K_H heads), `src/lyapunov/` (MB-1 Lyapunov gate), `src/dead-zone/` (MB-5 noise-band suppression)

---
