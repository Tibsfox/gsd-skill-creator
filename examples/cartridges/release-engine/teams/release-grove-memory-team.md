# release-grove-memory-team

Maintain the grove memory substrate for the release pipeline. Capcom coordinates import/export, engineer applies migrations between arena snapshots, verifier cross-checks record integrity (content hash + signature + activity-log replay). Run whenever release grove state moves — new series, cross-series link, or arena upgrade.

**Roster:** `release-capcom`, `release-engineer`, `release-verifier`.

**Use when:** importing, migrating, or auditing release grove memory
