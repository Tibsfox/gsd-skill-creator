# Layout Patterns — Artemis II / tibsfox.com

## Telemetry Grid

6 equal cells, 1px gap, dark panel background. Each cell: label (uppercase, dim) → value (large, bright) → unit (small, dim). Used for mission telemetry dashboard.

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ LABEL    │ LABEL    │ LABEL    │ LABEL    │ LABEL    │ LABEL    │
│ VALUE    │ VALUE    │ VALUE    │ VALUE    │ VALUE    │ VALUE    │
│ unit     │ unit     │ unit     │ unit     │ unit     │ unit     │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

Responsive: 3 columns at 768px, 2 at 480px.

## Feed Cards

Auto-fit grid, minmax(250px, 1fr). Each card: header with status dot (live/standby/offline) → key-value rows. Used for weather, DSN, moon, data source displays.

## Info Cards

Auto-fit grid, minmax(280px, 1fr). Each card: section header → stat rows (label + value). Used for crew, vehicle, mission profile, science payloads.

## Canvas Visualization

Full-width, no padding. Height = width × 0.38. DPR-aware rendering. Background #04060c. All elements rendered with monospace labels at ghost opacity.

## Timeline

Max-width 900px centered. Left border with dot markers (complete=green, active=gold+glow, future=dim). Time label (monospace, 80px min-width) + description.

## Principle

Dense but not crowded. 1px gaps between panels (not borders — the gap IS the border). No rounded corners on telemetry — this is instrument panel aesthetic. Rounded corners on cards in the research/narrative context. Full-width canvases break the grid to signal "this is a visualization, not a data cell."
