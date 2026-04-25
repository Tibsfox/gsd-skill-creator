# Predictive Skill Loader — UIP-18 T2b

> Phase 770, v1.49.573 Upstream Intelligence Pack v1.44.
> CAPCOM hard-preservation Gate G12.

`src/predictive-skill-loader/` is a default-OFF GNN link-formation prediction
layer for skill cache pre-warming. With the flag on, it consults the
College-of-Knowledge concept graph as a social-learning-network and predicts
which skills are most likely to fire next given the current activation
pattern. Predictions are submitted to the existing cache hook API for
non-blocking pre-warm.

## Architectural antecedents

The module instantiates the link-formation prediction methodology of:

- **Spatiotemporal Link Formation Prediction in Social Learning Networks**
  (Mohammadiasl et al., **arXiv:2604.18888**, EDM 2026). The paper models
  a social learning platform as a temporally-evolving graph where nodes
  are learners and edges are social-learning links; the prediction task
  is to forecast which edge will form next given the spatiotemporal
  pattern of recent activity.

The College-of-Knowledge concept graph (`.college/departments/*/concepts/*.ts`)
maps onto that abstraction directly:

| 2604.18888 abstraction | College-of-Knowledge equivalent              |
| ---------------------- | -------------------------------------------- |
| Learner node           | RosettaConcept (skill / concept)             |
| Social-learning edge   | RosettaConcept.relationships[].targetId      |
| Edge weight            | Relationship strength (default 1)            |
| Spatial neighborhood   | Department / domain co-membership            |
| Temporal pattern       | LoadContext.recentSkills (most recent first) |
| Link-formation event   | Skill activation transitioning current to v  |

This is a structural, not a learned, alignment. We do not train a parametric
GNN — instead, edge weights themselves carry the College-curated
co-activation signal, and the predictor uses a 1-channel message-passing
layer (gather + GRU-style update) to spread activation outward over
configurable hops.

## Public API

```ts
import {
  predictNextSkills,
  prewarmCache,
  loadCollegeGraph,
  buildLinkFormationModel,
} from 'gsd-skill-creator/predictive-skill-loader';

const predictions = await predictNextSkills('code-control-flow', {
  recentSkills: ['code-variables-data-types'],
});

await prewarmCache(predictions, hook);
```

## GNN message-passing scheme

Each call to `predictLinks(model, currentSkill, context, topK)`:

1. Initialise hidden state h_v(0):
   - 1.0 for the seed (`currentSkill`).
   - r(i) = 0.7^(i+1) for the i-th entry of `recentSkills` (recency decay).
   - 0 elsewhere.
2. For t = 1..hops:
   - m_v = sum over u in N_in(v) of edge(u,v) * h_u(t-1)
   - h_v(t) = (1 - decay) * h_v(t-1) + decay * sigma(m_v)
   - sigma(x) = x / (1 + |x|)  (rational soft-saturation).
3. Score(v) = h_v(hops). Drop seed + recent skills.
4. Sort by score desc, hopDepth asc, id asc. Return top-K.

The scheme is dependency-free (no PyTorch / no GNN library), deterministic,
and cheap (O(hops * |E|) per call).

## Hard preservation invariants (Gate G12)

1. `src/orchestration/` is byte-identical with the flag off, verified by
   `__tests__/orchestration-byte-identical.test.ts` (SHA-256 hash-tree of
   every file under `src/orchestration/` before vs after exercising the
   predictive-skill-loader surface).
2. The module imports nothing from `src/orchestration/` (verified by the
   structural import-grep test in the same file).
3. The module imports nothing from `src/dacp/` or `src/capcom/`.
4. The College tree (`.college/`) is read-only — the loader is text-based
   (regex over concept .ts source) and never invokes concept files at
   runtime, so concept side effects cannot run.
5. Default-off byte-identical: `predictNextSkills` short-circuits and
   returns `[]` with `disabled: true`; `prewarmCache` issues zero
   preload calls when the hook is null or disabled.

## Opt-in configuration

Add to `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "predictive-skill-loader": {
        "enabled": true,
        "topK": 5,
        "hops": 2,
        "decay": 0.5
      }
    }
  }
}
```

All settings have safe defaults; the flag itself is the only one that must
be present to turn the layer on.

## Files

```
src/predictive-skill-loader/
  index.ts               public API
  gnn-predictor.ts       message-passing predictor
  college-graph.ts       graph loader + multi-hop neighbor query
  cache-prewarmer.ts     PreWarmHook bridge (composes via Preloader-shape)
  settings.ts            opt-in flag reader
  types.ts               shared types
  __tests__/
    college-graph.test.ts
    gnn-predictor.test.ts
    cache-prewarmer.test.ts
    integration.test.ts
    orchestration-byte-identical.test.ts   (Gate G12)
```

## Integration target

The integration target is the **M5 cache pre-warming API**
(`src/cache/preload.ts`, `Preloader.preload + isEnabled`). The predictive
skill loader submits non-blocking pre-warm requests to that existing hook
surface; it does not modify `src/orchestration/` or any other orchestration
codepath. Gate G12 ensures `src/orchestration/` is byte-identical with the
flag off.

```typescript
import { predictNextSkills, prewarmCache } from 'gsd-skill-creator/predictive-skill-loader';
import { getPreWarmHook } from 'src/cache/preload.js';

const hook = getPreWarmHook();
const predictions = await predictNextSkills('code-control-flow', {
  recentSkills: ['code-variables-data-types'],
});
// Submit top-K predictions to cache as non-blocking pre-warms.
await prewarmCache(predictions, hook);
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-key

- **eess26_2604.18888** — Mohammadiasl et al., *Spatiotemporal Link Formation
  Prediction in Social Learning Networks*, EDM 2026

## References

- Mohammadiasl et al., *Spatiotemporal Link Formation Prediction in Social
  Learning Networks*, EDM 2026 (**arXiv:2604.18888**).
- M5 cache module: `src/cache/preload.ts` — the structural `Preloader.preload
  + isEnabled` surface that defines the `PreWarmHook` contract this layer
  composes against.
