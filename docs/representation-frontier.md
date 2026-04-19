# Representation Frontier — Living Sensoria (v1.49.561)

**Wave:** Continuation — Bundle 5 (phases 667–669)
**Parent:** Living Sensoria continuation wave — Bundles 3 and 4 (phases 661–666)
**Branch:** dev
**Date:** 2026-04-19
**Status:** shipped — MD-1, MD-5, MD-6 committed and tested

---

## The Problem This Solves

M6's net-shift model uses a single global K_H (high-affinity receptor constant) that governs activation sensitivity for every skill equally. The refinement wave lets MB-1 adapt K_H over time under a Lyapunov-stable law. But a single global K_H is still a blunt instrument: a skill used for precise structured tasks has different activation requirements than a skill used for exploratory, low-tractability tasks — and neither has the same requirements in a research session versus a coding session.

The representation-frontier bundle introduces the embedding substrate and per-(skill, task-type) parameter specialisation that make K_H truly compositional. MD-1 builds a shallow skip-gram embedding model over the skill-use history, providing a compact geometric representation of which skills co-occur and which substitute for each other. MD-5 reads those embeddings as features to train a per-(skill, task-type) learnable head that outputs a K_H scalar specific to the current context. MD-6 audits the embedding space continuously for representation collapse — the failure mode where the embedding matrix converges to a low-rank subspace, making MD-5's predictions degenerate. The bundle follows the architectural posture of Mikolov et al. 2013: shallow embeddings with negative sampling, kept within single-machine compute budget, preserving compositional structure.

---

## Through-Line

```
MD-1 Learned embeddings trains over skill co-occurrence history:
  extractCoOccurrencePairs() builds (skill, context) pairs from session log
  skip-gram trainer with negative sampling learns embeddings matrix W ∈ R^{n×d}
  buildStore() + saveStore() persist the embedding to disk
  EmbeddingService falls back to HeuristicEmbedder (TF-IDF) when model unavailable

MD-5 Learnable K_H reads MD-1 embeddings as input features:
  resolveKH(skill, taskType) → R (K_H scalar for this context)
  forward() applies a single linear head over the embedding row
  train() updates the head via MB-1 Lyapunov-composed gradient step
  store (LearnableKHStore) persists one head per (skill, task-type) key

MD-6 Representation audit monitors MD-1 embedding health:
  effectiveRank() measures rank of the activation matrix
  separability() measures community silhouette score
  detectCollapse() combines both into AuditStatus ∈ {healthy, degraded, critical}
  runAndCacheAudit() runs on a configurable schedule; results cached
  skill-creator representation-audit CLI surfaces the current status
```

MD-5's training path is gated by MB-1's Lyapunov composer (`lyapunov-composer.ts` in `src/learnable-k_h/`) which verifies that each head update preserves the Lyapunov descent certificate before committing the weight change.

---

## What Each Component Adds

**MD-1 Shallow learned embeddings** (`src/embeddings/`) extends the pre-existing embedding infrastructure (HuggingFace integration, cosine similarity, TF-IDF fallback) with a native skip-gram training loop that runs entirely on-machine without external model dependencies. `skip-gram.ts` implements the word2vec skip-gram objective: for each (target, context) pair, maximise log σ(v_c · v_t) and minimise log σ(v_n · v_t) for `k` negative samples drawn from the unigram^(3/4) frequency distribution. `trainer.ts` wraps the skip-gram step with co-occurrence pair extraction, negative-table construction, and rmsDrift monitoring (early-stop when drift < threshold). `persist.ts` serialises the trained `LearnableEmbeddingStore` to disk with format-version stamping. The pre-existing `EmbeddingService` is unchanged; MD-1 adds a parallel store under `api.ts` with its own `md1CosineSimilarity` export to avoid collision. When the flag is off, no training loop runs and no MD-1 store is read (SC-MD1-01). Flag: `gsd-skill-creator.embeddings.enabled`.

**MD-5 Per-(skill, task-type) learnable K_H** (`src/learnable-k_h/`) maintains a separate linear head for each `(skill, task-type)` key, each mapping from the MD-1 embedding vector to a single K_H scalar via sigmoid-bounded output. `head.ts` defines `LearnableKHHead` (embedding dimension, weight vector, bias, bounds); `forward.ts` computes the sigmoid-activated dot product; `gradient.ts` computes the scalar gradient for a single (K_H_target, K_H_predicted) pair. `trainer.ts` chains gradient → Lyapunov check (`verifyHeadPreservesDescent`) → projection (`projectKH`) → weight update in place, refusing to commit any step that fails the Lyapunov gate. `store.ts` (`LearnableKHStore`) maps `(skill, task-type)` keys to heads with `getOrCreate` defaulting to K_H = K_H_base on first access. `resolveKH` and `resolveKHScalar` are the read APIs consumed by M6 at net-shift computation time. When the flag is off, `resolveKHScalar` returns the scalar K_H from the skill's `sensoria:` frontmatter unchanged, bit-exactly (SC-MD5-01). Flag: `gsd-skill-creator.learnable_k_h.enabled`.

**MD-6 Representation audit** (`src/representation-audit/`) provides a continuous health monitor for the MD-1 embedding matrix. `effectiveRank` computes the participation ratio of the singular-value spectrum (Roy & Vetterli 2007): erank = exp(H(σ²/‖σ‖²)) where H is entropy; low erank signals rank collapse. `separability` computes the average silhouette score of skill-community cluster centroids in embedding space (using the M1 community structure from `src/graph/`); low separability signals that the embedding has lost discriminative structure. `detectCollapse` combines both metrics against thresholds in `AuditSettings` and returns `AuditStatus ∈ {healthy, degraded, critical}`. `runAndCacheAudit` writes the result to a JSON cache file with a TTL; the CLI (`skill-creator representation-audit`) surfaces the latest cached result. When flagged off, `runAndCacheAudit` returns `DISABLED` (SC-MD6-01). Flag: `gsd-skill-creator.representation_audit.enabled`.

---

## Grove-Posture Summary

All three representation-frontier components are NEW-LAYER. Zero REWRITEs were executed.

| Component | Grove decision | Parent modules unchanged |
|-----------|---------------|--------------------------|
| MD-1 Embeddings | NEW-LAYER (alongside existing HF infra in `src/embeddings/`) | Pre-existing embedding infrastructure untouched |
| MD-5 Learnable K_H | NEW-LAYER (`src/learnable-k_h/`) | M6 sensoria + MB-1 lyapunov untouched |
| MD-6 Representation audit | NEW-LAYER (`src/representation-audit/`) | MD-1 embeddings untouched |

---

## Activation Sequence

All representation-frontier flags default off. The recommended activation sequence:

1. **`gsd-skill-creator.embeddings.enabled: true`** — enables MD-1. On first enable, run `skill-creator embeddings train --sessions 50` to build an initial embedding from the existing session log. Check `rmsDrift` in the trainer output; if drift is still high after 50 sessions, extend the training window. The embedding is saved to the path configured in `DEFAULT_EMBEDDINGS_PATH` (default `.planning/embeddings/learned.json`).
2. **`gsd-skill-creator.representation_audit.enabled: true`** — enables MD-6. Run `skill-creator representation-audit` immediately after the first training pass to confirm `AuditStatus: healthy` before enabling MD-5. An initial `degraded` result is normal if the training window is short; `critical` is a signal to train on more data.
3. **`gsd-skill-creator.learnable_k_h.enabled: true`** — enables MD-5. Requires MD-1 (for embeddings) and MB-1 (`gsd-skill-creator.lyapunov.enabled: true`) for the Lyapunov gate. On first access for any `(skill, task-type)` key, `getOrCreate` initialises the head from the skill's `sensoria:` frontmatter K_H value; the first training step requires at least one reinforcement observation.

```json
{
  "gsd-skill-creator": {
    "embeddings":           { "enabled": false },
    "learnable_k_h":        { "enabled": false },
    "representation_audit": { "enabled": false, "ttl_minutes": 60 }
  }
}
```

---

## Primary Sources

- Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). "Efficient Estimation of Word Representations in Vector Space." *International Conference on Learning Representations (ICLR 2013)*. arXiv:1301.3781. — Introduces the word2vec skip-gram architecture with negative sampling. MD-1 adopts the shallow-embedding posture explicitly: a single hidden layer of dimension d, trained to maximise co-occurrence likelihood with negative sampling, keeping training cost within a single-machine budget while preserving compositional structure in the representation.
- Roy, O., & Vetterli, M. (2007). "The Effective Rank: A Measure of Effective Dimensionality." *15th European Signal Processing Conference (EUSIPCO 2007)*. — Defines effective rank as exp(H(normalised singular values)), the basis for MD-6's rank-collapse metric.

---

## See Also

- `docs/stability-rails.md` — Bundle 3: MB-1 Lyapunov composes with MD-5 head training
- `docs/exploration-harness.md` — Bundle 4: MD-4 temperature schedule influences MD-1 training heat indirectly via the exploration-rate signal
- `docs/refinement-wave.md` — ME-1 tractability classifier gates MD-5 training (tractable skills receive Lyapunov gain 1.0; coin-flip skills 0.3)
- `CHANGELOG.md` — `[v1.49.561]` → Continuation wave subsection
- `docs/release-notes/v1.49.561/README.md` — per-phase commit table (phases 667–669)
- `docs/release-notes/v1.49.561/regression-report-continuation.md` — test counts and acceptance-criterion coverage for LS-37..LS-39
