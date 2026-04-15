---
name: service-lifecycle
description: Drive systemd units, timers, and socket activation — enable, start, restart, reload, mask, and inspect.
---

# service-lifecycle

Own the running-service surface. Write unit files with correct
`[Unit]/[Service]/[Install]` sections, enable hardening directives
(`ProtectSystem`, `NoNewPrivileges`, `PrivateTmp`), and diagnose
failures through the journal.

## Daily commands

- `systemctl status / start / stop / restart / reload <unit>`
- `systemctl enable --now <unit>` (always pair enable with start unless the unit is timer-driven)
- `journalctl -u <unit> -f --since "10 min ago"`
- `systemd-analyze verify <unit>` before committing a new unit file

## Writing a new unit

Keep the unit idempotent, fail fast, and log to the journal — not a
bespoke logfile. Reserve `Restart=always` for services whose crash
loop is safer than downtime.
