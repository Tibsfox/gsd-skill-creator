---
name: cron-and-scheduling
description: Own scheduled work via crontab, systemd timers, at, and anacron with idempotency, locking, and failure notification.
---

# cron-and-scheduling

Own recurring work. Every scheduled job obeys three invariants:

1. **Idempotent** — a missed or doubled run must not corrupt state
2. **Locked** — `flock -n /var/lock/<job>.lock` or a systemd timer's
   built-in single-instance semantics
3. **Loud on failure** — mail, push to Alertmanager, or exit non-zero
   into a watched wrapper; never silent

## When to use which

- **systemd timer** — preferred for new work; integrates with the journal, supports `OnCalendar=` and accurate `RandomizedDelaySec`
- **cron** — legacy but ubiquitous; fine for simple single-user jobs
- **at** — single future-time execution (scheduled reboot, one-shot maintenance)
- **anacron** — laptops and other hosts that are not always on

## Debugging a silent cron failure

1. `grep CRON /var/log/syslog` (or `journalctl -u cron.service`)
2. Check mail: `mailx`, `/var/spool/mail/$USER`
3. Re-run by hand from a shell with `env -i` to reveal PATH assumptions
