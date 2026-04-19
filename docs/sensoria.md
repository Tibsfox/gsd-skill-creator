# Sensoria — M6 Net-Shift Receptor Substrate

**Module:** M6  
**Register:** Substrate  
**Source:** Lanzara 2023, Appendix III (pending source-print verification); extension mission §1.4.2, §2.2  
**Path:** `src/sensoria/`  
**Opt-in flag:** `gsd-skill-creator.sensoria.enabled`

---

## What It Is

Sensoria is the net-shift receptor substrate for skill activation. It applies Richard G. Lanzara's two-state receptor binding model (Lanzara 2023, Appendix III) to compute how strongly a signal — a query, a file match, a trigger score — should pull a skill into the active state. Rather than a binary threshold that either loads a skill or ignores it, Sensoria produces a graded differential signal (ΔR_H) that captures Weber's law log-linear response, saturation at high signal strength, tachyphylaxis under repeated activation, and a silent-binder edge case where a strong signal produces no differential pull.

The net-shift equation at the centre of M6 is:

```
ΔR_H = [L] · R_T · (K_H − K_L) / ((1 + K_H·[L]) · (1 + K_L·[L]))
```

where `[L]` is the incoming signal strength (mapped from a relevance or trigger score), `R_T` is the total receptor count (configurable per skill), `K_H` is the high-affinity association constant, and `K_L` is the low-affinity association constant. The pure function is in `src/sensoria/netShift.ts`.

This document does not claim the system perceives or experiences signals. The receptor-kinetics frame is a technical analogy that contributes a precise, testable formula in place of an ad-hoc threshold. See `docs/foundations/theoretical-audit.md` §9 for the explicit disclaimer.

---

## Frontmatter Block

Skills may carry a `sensoria:` block in their YAML frontmatter to configure per-skill receptor parameters:

```yaml
---
name: my-skill
description: Example skill
sensoria:
  k_h: 2.4          # High-affinity constant (default: 2.4)
  k_l: 0.3          # Low-affinity constant (default: 0.3)
  r_t: 1.0          # Total receptor count, normalised (default: 1.0)
  tachyphylaxis: true   # Enable slow K_H decay under sustained activation (default: true)
---
```

### Default Values

| Parameter | Default | Effect when at default |
|-----------|---------|------------------------|
| `k_h` | `2.4` | Moderate high-affinity pull; mid-range saturation |
| `k_l` | `0.3` | Baseline low-affinity occupancy; sets noise floor |
| `r_t` | `1.0` | Normalised receptor pool; scale up for higher max ΔR_H |
| `tachyphylaxis` | `true` | K_H drifts toward K_L under 20 consecutive activations |

If the `sensoria:` block is absent the defaults above apply. This preserves byte-identical behaviour with v1.49.560 when the feature flag is off.

---

## Enabling Sensoria

Sensoria is **opt-in** and defaults to off. To enable it, add the flag to `.claude/settings.json`:

```json
{
  "gsd-skill-creator": {
    "sensoria": {
      "enabled": true
    }
  }
}
```

When `enabled` is `false` (the default), skill activation follows the existing v1.49.560 threshold logic unchanged. When `enabled` is `true`, every skill activation goes through `src/sensoria/applicator.ts`, which reads the `sensoria:` frontmatter block (or defaults), computes ΔR_H, and gates activation on whether ΔR_H exceeds `0.0`.

---

## CLI

```bash
# Compute and display the net-shift profile for a skill
skill-creator sensoria <skill-name>

# Example output:
# skill: test-generator
# k_h: 2.4  k_l: 0.3  r_t: 1.0
# signal [0.0 → 1.0]:
#   0.1  → ΔR_H: 0.211  (Weber log-linear regime)
#   0.5  → ΔR_H: 0.613  (mid-range)
#   0.9  → ΔR_H: 0.518  (approaching saturation)
#   1.0  → ΔR_H: 0.468  (saturation; K_H dominates)
# tachyphylaxis: active (activations since reset: 7)
```

The CLI reads the live skill file, applies current K_H (accounting for tachyphylaxis drift if enabled), and plots the ΔR_H curve across the signal range.

---

## Interpreting K_H / K_L / theta

**K_H (high-affinity constant):** Controls how quickly the skill reaches peak differential signal. High K_H means the skill responds strongly to even weak signals — useful for broad-context skills like `gsd-workflow`. Lower K_H suits precision skills that should only activate under strong relevance.

**K_L (low-affinity constant):** Sets the baseline noise-floor occupancy. The gap `(K_H − K_L)` is the numerator factor of ΔR_H; a narrow gap means the skill barely discriminates between signal strengths.

**theta (activation gate):** The minimum ΔR_H required for the applicator to load the skill. Defaults to `0.0` (any positive net-shift activates). Raise theta in `.claude/settings.json` under `gsd-skill-creator.sensoria.theta` to suppress marginal activations.

---

## The Silent Binder Edge Case

When `K_H = K_L`, the numerator factor `(K_H − K_L)` is zero regardless of signal strength or receptor count. The skill receives signal but produces no differential pull — it is a silent binder. This is intentional: a skill whose affinities are indistinguishable cannot be selected by the net-shift mechanism, and the applicator skips it cleanly rather than falling through to a threshold comparison.

If a skill is unexpectedly silent, check whether tachyphylaxis has driven K_H down to K_L after many consecutive activations. A tachyphylaxis reset is triggered by the `skill-creator sensoria --reset <skill-name>` CLI subcommand or by the 7-day cooldown (inherited from the bounded-learning invariant in `docs/BOUNDED-LEARNING.md`).

---

## Primary Sources

- Lanzara, R. G. (2023). *Origins of Life's Sensoria.* ISBN 978-1-7335981-1-8. Appendix III — net-shift equation derivation and tachyphylaxis mechanism. Page numbers pending source-print verification.
- Weber, E. H. (1834). *De Pulsu, Resorptione, Auditu et Tactu.* Leipzig: Koehler. Historical statement of the log-linear just-noticeable-difference law, which Lanzara 2023 Appendix III provides a mechanistic derivation for.

---

## See Also

- `docs/umwelt.md` — M7 Markov-blanket boundary layer
- `docs/memory-stack.md` — M1–M5 memory and orchestration substrate
- `docs/foundations/theoretical-audit.md` — Full theoretical audit with primary-source citations
- `docs/EXTENSIONS.md` — `gsd-skill-creator.sensoria` namespace documentation
