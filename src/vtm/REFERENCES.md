# VTM References

Research anchors and convergent citations for the Vision-to-Mission pipeline.

---

## arXiv:2512.09111 — SAGES: Safe Trajectory Generation via Language-Conditioned Skill Embedding

**Authors:** (2025)
**Title:** SAGES: Language-Conditioned Safe Trajectory Generation via Skill Embedding
**Anchor finding:** Three-stage pipeline (intent extraction → deterministic planning → knowledge grounding) achieves >90% semantic-behavioral consistency when NL intent is structurally preserved across all stages.
**Absorbed in:** `src/vtm/__tests__/sages-consistency.test.ts` (JP-008, Wave 2, phase 833)
**Convergent with:** arXiv:2604.21910 (Skills-as-md three-tier pipeline — vision-to-mission, research-mission-generator, skill-creator)

---

## arXiv:2604.21910 — Skills-as-Markdown: A Three-Tier Pipeline for Scalable Skill Authoring

**Title:** Skills-as-Markdown
**Anchor finding:** Three-tier pipeline (semantic layer: LLM intent extraction → deterministic layer: identical-intent → identical-output → knowledge layer: markdown skills). LLM non-determinism is confined to intent extraction; the deterministic layer is the gate-able surface.
**Role in VTM:** Foundation for the vision-parser (semantic) → mission-assembler (deterministic) → MissionPackage (knowledge) architecture.

---
