# scripts/ -- Project automation

One-shot, long-running, and scheduled helpers that sit outside the TypeScript/Rust
build surface. Everything here is either a bash shell script, a Node ESM module,
or a Python 3 CLI. Nothing here is published to npm.

## Index

- `publish/` -- research-publication pipeline (carve -> build -> index); see
  `scripts/publish/README.md`.
- `erdos-refresh.py` -- refresh `ERDOS-TRACKER.md` AI-attempt fields from the
  teorth/erdosproblems wiki. Offline-first, idempotent, fixed-point safe.
- `sync-research-to-live.sh` -- FTP sync of `www/tibsfox/com/Research/` to the
  live tibsfox.com tree. Manual, not scheduled.
- `bump-version.mjs`, `postbuild.mjs`, `publish-release.sh` -- release pipeline.
- `nasa/`, `sweep/`, `python/`, `bash/`, `security/` -- domain-specific helpers.

## erdos-refresh.py

Refresh `ERDOS-TRACKER.md` AI-attempt fields (`ai_attempt_status`,
`ai_attempt_source`) by reading the teorth/erdosproblems wiki (online) or a
pinned JSON snapshot (offline).

```bash
# Dry run (prints a unified diff; no changes)
scripts/erdos-refresh.py --dry-run

# Apply changes in place
scripts/erdos-refresh.py

# Use live wiki (default is offline snapshot in scripts/data/)
scripts/erdos-refresh.py --online --dry-run
```

### Properties

- **Idempotent.** Re-running after apply produces an empty diff.
- **Fixed-point safe.** apply -> apply is a no-op.
- **Offline by default.** Reads `scripts/data/erdos-ai-contributions.json` unless
  `--online` is passed; even with `--online`, falls back to the snapshot on any
  network error so CI and sandboxed runs never fail.
- **Data-integrity rule.** Status fields are overwritten ONLY if the current
  tracker value does not already lead with the canonical status token, which
  preserves richer local context like `solved (variant; Lean)` when the wiki's
  canonical status (`solved`) is already implied. Source fields are overwritten
  ONLY if the current value starts with `none`.
- **Completes in <1 second** for the current ~400-line tracker.

### Cron / systemd timer example

Run weekly (Monday 03:00 local time) in online mode, apply changes, email the
maintainer when the tracker moves.

crontab entry:
```cron
0 3 * * 1 cd /path/to/gsd-skill-creator && scripts/erdos-refresh.py --online 2>&1 | mail -s "erdos-refresh" you@example.com
```

systemd service (`~/.config/systemd/user/erdos-refresh.service`):
```ini
[Unit]
Description=Refresh ERDOS-TRACKER.md from teorth/erdosproblems wiki

[Service]
Type=oneshot
WorkingDirectory=/path/to/gsd-skill-creator
ExecStart=%h/path/to/gsd-skill-creator/scripts/erdos-refresh.py --online
```

systemd timer (`~/.config/systemd/user/erdos-refresh.timer`):
```ini
[Unit]
Description=Weekly ERDOS-TRACKER refresh

[Timer]
OnCalendar=Mon 03:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable with: `systemctl --user enable --now erdos-refresh.timer`.
