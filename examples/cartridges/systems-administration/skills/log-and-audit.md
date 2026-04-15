---
name: log-and-audit
description: Inspect and retain logs via journald, rsyslog, logrotate, and auditd; enforce retention for debugging and compliance.
---

# log-and-audit

Own the observability-from-text surface: system logs, service logs,
and security audit trails. Make logs fast to query during an
incident and cheap to retain for audit.

## Journal queries

- `journalctl -u <unit> -f` — live tail
- `journalctl --since "1 hour ago" --grep "<pattern>"` — window + grep
- `journalctl -k --since today` — kernel messages
- `journalctl -p err -b` — errors this boot
- `journalctl --disk-usage`, `journalctl --vacuum-time=30d` — retention control

## Audit

- `auditctl -l`, `auditctl -w <path> -p wa -k <key>`
- `ausearch -k <key>`, `aureport`
- Audit rules live in `/etc/audit/rules.d/` under version control

## Rotation

- `/etc/logrotate.d/` for file-based logs
- Journald size caps via `SystemMaxUse` in `journald.conf`
- Retention policy lives in a `RunbookEntry`, not in sysadmin memory
