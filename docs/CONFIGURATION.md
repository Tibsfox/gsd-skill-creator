# Configuration

## Retention Settings

Pattern retention is bounded to prevent unbounded growth:

| Setting | Default | Description |
|---------|---------|-------------|
| `maxAgeDays` | 90 | Maximum age of observations |
| `maxSessions` | 1000 | Maximum number of sessions to retain |

## Trigger Thresholds

| Threshold | Value | Description |
|-----------|-------|-------------|
| **Skill suggestion** | 3+ occurrences | Minimum pattern repetitions |
| **Agent suggestion** | 5+ co-activations | Minimum skill pair activations |
| **Stability requirement** | 7+ days | Minimum pattern persistence |
| **Refinement eligibility** | 3+ corrections | Minimum feedback count |

## Validation Thresholds (v1.1+)

| Threshold | Default | Range | Description |
|-----------|---------|-------|-------------|
| **Conflict threshold** | 0.85 | 0.5-0.95 | Semantic similarity for conflict detection |
| **Activation threshold** | 0.75 | 0.5-0.95 | Confidence level for activation prediction |
| **Too-close-to-call** | <2% margin | - | Flags skills that are borderline competitors |

## Cluster Constraints

| Setting | Default | Description |
|---------|---------|-------------|
| `minClusterSize` | 2 | Minimum skills per cluster |
| `maxClusterSize` | 5 | Maximum skills per cluster |
| `minCoActivations` | 5 | Minimum co-activation count |
| `stabilityDays` | 7 | Minimum pattern stability |

## Refinement Bounds

| Setting | Default | Description |
|---------|---------|-------------|
| `minCorrections` | 3 | Corrections needed before refinement |
| `maxContentChangePercent` | 20 | Maximum change per refinement |
| `cooldownDays` | 7 | Days between refinements |
