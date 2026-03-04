# Shift Register Format Spec

## Purpose

The shift register is a sliding window of recent chain history displayed in STATE.md. It gives the agent immediate temporal context about score trends, delta patterns, and version characteristics without requiring the full chain history to be loaded into context.

By keeping the last 8 chain positions visible at the top of STATE.md, the agent can detect:
- Score drift (are we trending up or down?)
- Domain shifts (sudden score drops often signal a codebase domain change)
- Pattern deterioration (worsened/improved counts flag specific anti-pattern activity)
- Anomalies (unusually large deltas indicate something structurally changed)

## Format Specification

Each row in the shift register table represents one completed chain position:

```
Pos  Ver    Score  Delta  Commits  Files  Improved/Worsened
 NN  vX.YY  N.NN  +/-N.NN  NNN   NNN    N/N
```

Field definitions:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `Pos` | integer | 1-50 | Chain position (1 = v1.0 review, 50 = final) |
| `Ver` | string | vX.YY or BUILD | Version reviewed, or BUILD for non-review milestones |
| `Score` | float | 0.0-5.0 | Review score for that chain position |
| `Delta` | float | -5.0 to +5.0 | Change from prior position (signed) |
| `Commits` | integer | 0+ | Number of commits in the reviewed version |
| `Files` | integer | 0+ | Number of files changed, or `---` if not tracked |
| `Improved/Worsened` | N/N | 0+ | Pattern health: how many of the 14 tracked patterns improved vs worsened |

Example rows:

```
 27  v1.25  3.32   -0.38        —     —     —/—  ← floor
 28  v1.26  4.28   +0.96       94   104    8/0  ← largest recovery
 29  v1.28  4.15   -0.13      174   474    ?/?
 30  BUILD   ???    ???         —     —     —/—  ← YOU ARE HERE
```

## Window Size

The shift register shows the last 8 chain positions. Rationale:

- **8 entries** fit in ~10 lines of STATE.md, keeping context overhead minimal
- **8 samples** is sufficient for linear trend detection and 2-sigma anomaly detection
- **8 = byte width** — intentional DSP analogy: one byte of history, each bit a sample
- Anything older than 8 positions is archived to chain history files, not inline STATE.md

When the chain advances past 8 positions, the oldest entry is dropped from the visible window. Full history remains in chain journals.

## Summary Statistics Footer

The last line of the shift register block contains aggregate statistics:

```
rolling avg: N.NNN  |  chain avg: N.NNN  |  floor: N.NN  |  ceiling: N.NN
```

| Statistic | Description |
|-----------|-------------|
| `rolling avg` | Mean score across the current 8-entry visible window |
| `chain avg` | Mean score across ALL completed chain positions to date |
| `floor` | Lowest score in the entire chain (minimum) |
| `ceiling` | Highest score in the entire chain (maximum) |

Rolling average vs chain average divergence is diagnostic: if rolling avg is below chain avg, recent performance is declining; if above, the chain is recovering.

## Special Markers

Annotation suffixes appear after the `Improved/Worsened` column on any row:

| Marker | Meaning |
|--------|---------|
| `← YOU ARE HERE` | Current chain position (incomplete) |
| `← floor` | Lowest score in full chain history |
| `← ceiling` | Highest score in full chain history |
| `← domain shift (type)` | Codebase domain changed abruptly (e.g., bash/YAML, desktop) |
| `← trough start` | Beginning of a multi-position score decline |
| `← largest recovery` | Highest single-position positive delta in chain |
| `← build milestone` | Non-review BUILD milestone (no version reviewed) |

BUILD rows use `???` for Score and Delta fields until the milestone is scored.

## DSP Analogy

The shift register maps directly to digital signal processing concepts:

**Finite Impulse Response (FIR) filter:** The 8-entry window is a fixed-width observation kernel. Each new chain position shifts the register forward: the oldest sample falls off, the newest is appended. The window applies equal weight to all 8 samples (rectangular window function).

**Signal:** Chain review scores (0.0-5.0 sampled at each chain position)

**Noise:** Random score variation from domain shifts, codebase characteristics, reviewer variance

**Filter outputs:**
- **Trend detection:** Linear regression over 8 scores gives slope (positive = improving, negative = declining)
- **Anomaly detection:** Delta > 2 standard deviations of the rolling window flags unusual events
- **Pattern tracking:** Improved/Worsened counts are separate signal channels tracking 14 DSP-inspired code patterns

**Why FIR not IIR:** FIR (finite window) is stable and predictable. An IIR (exponential moving average) would never drop old samples, allowing early chain positions to permanently bias current assessment. The 8-entry window forgets appropriately.

## Update Protocol

When a new chain link completes:

1. **Complete the current row:** Fill in Score, Delta, Commits, Files, Improved/Worsened once review is scored
2. **Advance position:** Add `← YOU ARE HERE` to the new (empty) row for the next position
3. **Shift window if needed:** If the register exceeds 8 entries, drop the oldest row
4. **Recalculate statistics:** Update rolling avg (from visible window), chain avg (from all positions), floor and ceiling
5. **Archive old entry:** Oldest dropped row is preserved in the chain journal for that milestone

The STATE.md shift register is written by the agent at the end of each milestone's CLOSE task. The format is maintained manually — there is no automated updater. This is intentional: the agent reading STATE.md at the start of each session refreshes its own temporal context, not an external process.
