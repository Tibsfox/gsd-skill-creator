---
name: capacity-and-performance
description: Track resource trends with sar/sysstat, iostat, vmstat; rightsize CPU/memory/IO and forecast growth with historical data.
---

# capacity-and-performance

Own the "will this host still be OK next quarter" question. Collect
long-running time series, rightsize reservations, and justify
hardware or instance changes with numbers rather than intuition.

## Data sources

- **sar / sysstat** — the single best cheap source of weeks of
  history; `sar -q`, `sar -r`, `sar -u`, `sar -d`
- **node_exporter + Prometheus** — higher resolution, shorter window
- **pidstat -u -r -d** — per-process attribution
- **iostat -xz / vmstat** — short investigations

## Rightsizing rule of thumb

- CPU: target ≤70% sustained average, ≤90% p95
- Memory: leave ≥15% headroom; swap use ≥1% is a warning sign
- IO: device `%util` ≤70% sustained; `await` within device spec

## Forecasting

- Linear fit on the last 90 days of sar data is usually enough to
  identify which resource will hit the ceiling first
- Record the forecast and the assumptions in a `RunbookEntry` so a
  future sysadmin can revisit the decision
