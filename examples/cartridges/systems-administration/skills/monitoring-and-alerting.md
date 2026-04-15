---
name: monitoring-and-alerting
description: Stand up node_exporter, Prometheus targets, Grafana dashboards, and cron health checks; tune alerts to reduce pager fatigue.
---

# monitoring-and-alerting

Own the metrics plane. Every host publishes node_exporter, every
service publishes at least liveness, and every alert rule answers
three questions before it ships:

1. **Is it actionable?** — if the on-call can't do anything, it is a dashboard, not an alert
2. **Is it unique?** — no two rules on the same symptom
3. **Is the threshold defensible?** — tied to SLO or capacity budget, not a gut feel

## Core stack

- `node_exporter` on every host
- `blackbox_exporter` for HTTP/TCP/ICMP probes
- Prometheus for scrape + rules
- Grafana for dashboards
- Alertmanager for routing
- A simple `cron` health check + mail as the fallback when the metrics plane itself is down

## The "monitoring of monitoring" rule

The health of Prometheus itself is checked by an independent
path — a cron job on the observer host that curls the rule-eval
endpoint and pages if it fails.
