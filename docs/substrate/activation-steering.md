# Activation Steering Runtime

**Status:** canonical substrate documentation
**Implements:** UIP-15 (Phase 767, v1.49.573 W5 T1c)
**Module:** [`src/activation-steering/`](../../src/activation-steering/index.ts)
**CAPCOM Gate:** G11 (HARD preservation — `src/dacp/` byte-identical)
**Composes on top of:** v1.49.572 T1c semantic-channel formalism at
[`docs/substrate/semantic-channel.md`](semantic-channel.md)

---

## 1. Background

Inference-time activation steering is the practice of perturbing an
LLM's hidden-state activation vector toward a chosen direction at
runtime, with no change to the model's weights and no fine-tuning.
The technique is attractive because it is cheap, reversible, and — under
the right conditions — *predictable* in its effect on output.

The "right conditions" are characterised by Skifstad, Yang, and Chou in
*Local Linearity of LLMs* (arXiv:2604.19018). Their central empirical
claim is that, within a neighbourhood of a given operating point, the
forward map of a transformer block is well-approximated by an affine
function

```
x_{n+1} ≈ A x_n + B u_n .
```

This linearisation is precisely the regime in which classical
model-based linear optimal control applies: a proportional law of the
form

```
u_n = K (target − x_n),    K ∈ (0, 1] · I
```

is contractive toward the target, and a small step in the direction of
`(target − x_n)` is approximately additive in the model's output logit
space. The Activation Steering Runtime ships exactly this controller as
a default-OFF, advisory layer over the gsd-skill-creator agent surface.

## 2. Public API

```ts
import { steer, buildTarget, type CRAFTRole } from 'gsd-skill-creator/activation-steering';

const target = buildTarget('Forger', 'Sonnet', activation.length);
const result = steer(activation, 'Forger', target);
//   result.disabled  — true iff flag is off (passthrough)
//   result.vector    — output activation
//   result.delta     — control delta (zero if disabled)
//   result.deltaNorm — ‖delta‖₂
```

The `steer` function is **default-OFF**. With the opt-in flag absent or
false, the call is a pure passthrough: the result has `disabled: true`,
the input vector cloned, and a zero-vector delta. No DACP byte is read
or written.

## 3. CRAFT Role × Model Tier Mapping

The `craft-role-mapper` module maps the cross-product

```
{ Coordinator, Researcher, Architect, Forger, Tactician } × { Opus, Sonnet, Haiku }
```

to deterministic activation-space targets at the requested
dimensionality. There are 5 × 3 = 15 (role, tier) pairs; every pair
produces a target whose vector lives in `[-1, 1]^dim`.

The mapping is *direction-of-effect*, not a learned probe. Per role, a
distinct basis offset and harmonic period determine the spike location
and a low-frequency residual structure. Per tier, an amplitude scale is
applied: `Opus = 0.6`, `Sonnet = 0.8`, `Haiku = 1.0`. Smaller models
receive a slightly larger steering amplitude — they are more affected
by the perturbation per the local-linearity sensitivity analysis in
arXiv:2604.19018 §4.

This is enough structure to give the controller's `K (target − current)`
form a non-trivial, role-distinguishing delta on every call. The
mapping is *not* a fine-tuned activation probe; if a future phase wants
to upgrade to a learned probe, the `SteeringTarget` shape is stable —
only the `vector` field changes.

## 4. Local-Linearity Validator

The `local-linearity-validator` module fits a per-coordinate ordinary
least-squares model `y_i = a_i + b_i · x_i` over a sample of recent
`(current, next)` activation pairs and computes the normalised residual

```
normalisedResidual = (Σ_i ‖y_i − ŷ_i‖² / N) / (Var(y) + ε) .
```

When this scalar exceeds the configured threshold (default `0.1`) the
validator emits a `warning` field on its `LinearityFit` result. The
result is **advisory only**: the validator never throws and never
blocks downstream control flow. Callers may use the warning to:

- log a diagnostic that the controller delta is unreliable in the
  current regime;
- temporarily reduce gain `K` toward zero;
- defer to a more conservative selector.

Edge-case behaviour:

- zero samples → `withinThreshold: true`, warning `"no samples"`;
- one sample → `withinThreshold: true`, warning `"single sample"`;
- inconsistent sample dimensionality → throw (programmer error).

## 5. Composition with the T1c Semantic Channel

The activation-steering layer **composes on top of** the v1.49.572 T1c
semantic-channel formalism without modifying it. Specifically:

- `src/semantic-channel/` is **not** mutated by this phase. The
  semantic-channel module continues to provide the formal
  information-theoretic view of the DACP three-part bundle; see
  [`docs/substrate/semantic-channel.md`](semantic-channel.md) for the
  full Xu 2026 (arXiv:2604.16471 / arXiv:2604.15698) treatment.
- `src/activation-steering/` adds an **additional metadata channel**
  alongside the `(intent, data, code)` triad. The activation vector is
  not part of the DACP wire format and never enters the `intent` /
  `data` / `code` payloads; it travels alongside as agent-internal
  state.
- The semantic-channel preservation property — fidelity tier never
  weakens across the channel — is unaffected. The activation-steering
  controller cannot weaken any tier because it never touches the
  bundle.

This separation is what makes Phase 767 a **HARD** preservation phase:
two independent layers (semantic channel + activation steering) sit on
top of the same DACP substrate, and neither modifies the other or the
substrate.

## 6. CAPCOM Gate G11 — Hard Preservation Invariants

Gate G11 enforces five invariants:

1. **`src/dacp/` byte-identical with flag off.** Every file under
   `src/dacp/` is hashed with SHA-256 before and after running
   `npx vitest run src/activation-steering`. The hash maps must be
   identical. Implemented in
   [`__tests__/dacp-byte-identical.test.ts`](../../src/activation-steering/__tests__/dacp-byte-identical.test.ts).
2. **No DACP wire-format mutation.** The steering layer does not modify
   the DACP three-part-bundle structure. The activation vector is an
   additional metadata channel, not a wire-format change.
3. **Default-off byte-identical.** With the opt-in flag false,
   `steer()` returns `{ disabled: true, vector: input }` with a
   zero-vector delta and zero side effects.
4. **No imports from CAPCOM / orchestrator paths.** Verified by
   `grep -rE "src/(orchestration|capcom)" src/activation-steering/`
   returning zero matches. Importing FROM `src/dacp/` for type-only
   purposes is permitted via `import type {...}` but currently the
   module imports zero DACP types — the controller works on raw
   `number[]` activation vectors.
5. **CAPCOM source-regex sweep.** Same regex sweep above; required to
   return zero matches before close.

## 7. Opt-in Mechanism

The module is **default-OFF**. Opt in via
`.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "activation-steering": {
        "enabled": true,
        "gain": 0.5,
        "linearityThreshold": 0.1
      }
    }
  }
}
```

With the flag absent or false:

- `isActivationSteeringEnabled()` returns `false`;
- `steer(...)` returns a passthrough result;
- importing the module performs zero I/O beyond resolving its own
  source files (the `fs.readFileSync` performed by the settings reader
  fires only when a caller actually invokes a function that needs it).

Settings semantics are **fail-closed**: missing file, malformed JSON,
missing block, or `enabled` field of any non-boolean type all return
disabled.

## 8. Citations

- **Skifstad, Yang, Chou (2026).** *Local Linearity of LLMs.* arXiv:2604.19018.
  The empirical and theoretical basis for the affine-approximation regime
  in which the controller operates.
- **Xu, J. (2026a).** *Semantic Channel Theory: Deductive Compression and
  Structural Fidelity for Multi-Agent Communication.* arXiv:2604.16471.
  The formal foundation for the T1c semantic-channel layer this module
  composes on top of.
- **Xu, J. (2026b).** *Rate-Distortion for Deductive Sources.*
  arXiv:2604.15698. Companion to the above; defines the
  rate-distortion function for the channel.
- **v1.49.572 T1c semantic-channel formalism.** See
  [`docs/substrate/semantic-channel.md`](semantic-channel.md) and the
  module at [`src/semantic-channel/`](../../src/semantic-channel/index.ts).

## 9. Non-Goals

The activation-steering module, by design, **does not**:

- modify any file under `src/dacp/` (preservation gate G11);
- modify `src/semantic-channel/` (independent layer composition);
- modify or import from CAPCOM / orchestrator code paths;
- alter the DACP wire format, Zod schemas, or `DACP_VERSION` constant;
- bypass CAPCOM handoff — no gate-bypass / gate-override actions;
- mutate the skill library or any other persistent state;
- perform fine-tuning, gradient updates, or any model-weight change;
- require any runtime I/O unless a caller explicitly invokes the API
  with the flag on.

---

## eess26 cite-keys

- **eess26_2604.19018** — Skifstad, Yang, Chou, *Local Linearity of LLMs*, 2026
- Xu (2026a/b) are cited via math-arxiv convention in v1.49.572 docs; use
  `eess26_2604.16471` and `eess26_2604.15698` when citing from v1.49.573 context.

---

*Part of v1.49.573 W5 T1c Activation Steering Runtime. See ROADMAP
Phase 767 for the build history and `.planning/REQUIREMENTS.md`
UIP-15 for the requirement.*
