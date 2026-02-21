# Day-2 Runbook: Knowledge World Operations

## Overview

This runbook covers the daily, weekly, and as-needed procedures for maintaining the Minecraft Knowledge World server. These are routine operations -- no deep system knowledge is required beyond basic Linux command line skills and SSH access.

**Conventions used in this runbook:**

- `VM_IP` -- the IP address of the Minecraft VM (found via `vm-lifecycle.sh status --name minecraft-server`)
- All commands are run from the repository root directory unless otherwise noted
- Commands prefixed with `ssh gsd@VM_IP` run on the Minecraft VM
- Scripts are referenced by their relative path from the repository root
- Destructive operations are marked with **WARNING** blocks

---

## Daily Operations

### Morning Health Check

Run the 12-point health check to verify all server components are operational.

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

**Reading the output:**

| Status | Meaning | Action |
|--------|---------|--------|
| PASS | Check passed -- component healthy | No action needed |
| WARN | Degraded but operational | Investigate within 24 hours |
| FAIL | Component broken or unreachable | Investigate immediately |

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | All 12 checks pass (healthy) |
| 1 | One or more checks failed (unhealthy) |
| 2 | Mixed results -- warnings but no failures (degraded) |
| 3 | Usage error (bad arguments) |

**The 12 checks performed:**

1. `systemd` -- minecraft.service is active and enabled
2. `process` -- Java process running with correct JAR and user
3. `jvm_heap` -- JVM heap usage vs. configured maximum
4. `game_port` -- Port 25565 is listening
5. `rcon_port` -- Port 25575 is listening
6. `firewall` -- Game port is open in the firewall
7. `server_log` -- Server startup completed, no fatal errors
8. `disk_space` -- Disk usage on /opt/minecraft is acceptable
9. `node_exporter` -- Node exporter running on port 9100
10. `jmx_exporter` -- JMX exporter running on port 9404
11. `backup_freshness` -- Last backup is less than 2 hours old
12. `known_failures` -- No known failure patterns in recent logs (OOM, JAR missing, port binding, mod mismatch, stuck save-off, ConcurrentModificationException)

**For scripted monitoring or automation, use JSON output:**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP --json
```

This returns a structured JSON object with each check's name, status, and detail message -- suitable for parsing with `jq`.

**If any check fails:** See the [Incident Response Runbook](runbook-incident-response.md) for diagnosis and resolution procedures.

---

### Reviewing Server Logs

Check the Minecraft service logs for errors, warnings, or unusual activity.

```bash
ssh gsd@VM_IP journalctl -u minecraft.service --since today
```

**What to look for:**

| Log Pattern | Meaning | Action |
|-------------|---------|--------|
| `Done (X.XXXs)!` | Server started successfully | Normal -- no action |
| `UUID of player XXXX is ...` | Player connected | Normal activity |
| `XXXX left the game` | Player disconnected | Normal activity |
| `[WARN]` | Non-fatal warning | Investigate if recurring |
| `[ERROR]` | Error occurred | Check error details, may need restart |
| `OutOfMemoryError` | JVM ran out of heap | Increase heap or investigate leak |
| `FAILED TO BIND TO PORT` | Port conflict | Check for conflicting processes |
| `Unable to access jarfile` | Server JAR missing | Redeploy with deploy-minecraft.sh |

**To follow logs in real time (useful during maintenance):**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -f
```

**To check the last 100 lines:**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -n 100 --no-pager
```

---

### Checking Metrics

View current server performance metrics in human-readable format.

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

**Reading the output -- the 6 metric categories:**

| Metric | Normal Value | Concerning Value | Action if Concerning |
|--------|-------------|------------------|---------------------|
| TPS (ticks per second) | 20.0 | Below 18 | See Performance Degradation in incident runbook |
| Player count | 0 to max slots | N/A | Informational only |
| World size | Varies | Rapid growth | Check for automation or duplication bugs |
| Chunk count | Varies by exploration | Rapid growth | Consider world border or pre-generation |
| Entity regions | Varies | Very high count | Kill excess entities via RCON |
| Mod status | All mods present | Missing mods | Redeploy with deploy-mods.sh |

**For JSON output (useful for scripted monitoring):**

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output json
```

**For Prometheus exposition format (used by textfile collector):**

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output prometheus
```

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | All metrics collected successfully |
| 1 | Partial collection -- some metrics unavailable (network, RCON down, etc.) |
| 2 | Usage error |

If exit code is 1, the output will still contain whatever metrics could be collected. Each category fails independently.

---

## Player Management

### Adding a Player to the Whitelist

Add a player by their Minecraft username. The script resolves the UUID automatically via the Mojang API.

```bash
./infra/scripts/manage-whitelist.sh add PLAYER_NAME --rcon-host VM_IP
```

**Expected output:** Player UUID resolved, added to whitelist.json, and server whitelist reloaded via RCON.

**Options:**

| Flag | Purpose |
|------|---------|
| `--rcon-host VM_IP` | Connect to the live server to reload whitelist |
| `--rcon-pass PASSWORD` | Explicit RCON password (or use --secrets below) |
| `--secrets PATH` | Path to minecraft-secrets.yaml containing RCON password |
| `--offline-uuid` | Generate offline-mode UUID instead of Mojang lookup |
| `--whitelist PATH` | Custom whitelist.json path (default: /opt/minecraft/server/whitelist.json) |

**If Mojang API is unavailable:** The script falls back to offline-mode UUID generation automatically. You can force this with `--offline-uuid`.

**If RCON is unavailable:** The player is added to whitelist.json on disk. You will need to reload the whitelist manually (see "Syncing Changes" below) or restart the server.

---

### Removing a Player from the Whitelist

```bash
./infra/scripts/manage-whitelist.sh remove PLAYER_NAME --rcon-host VM_IP
```

**Expected output:** Player removed from whitelist.json, server whitelist reloaded via RCON. The player will not be kicked immediately if already connected, but cannot reconnect.

---

### Listing Current Players on the Whitelist

```bash
./infra/scripts/manage-whitelist.sh list
```

**Expected output:** Table showing player names and UUIDs from whitelist.json.

To check the whitelist on a remote server:

```bash
./infra/scripts/manage-whitelist.sh list --whitelist /opt/minecraft/server/whitelist.json
```

Or directly via SSH:

```bash
ssh gsd@VM_IP cat /opt/minecraft/server/whitelist.json | python3 -m json.tool
```

---

### Syncing Whitelist Changes to the Live Server

If you modified whitelist.json directly (without RCON), reload it on the live server:

```bash
./infra/scripts/manage-whitelist.sh sync --rcon-host VM_IP
```

This sends the `whitelist reload` command via RCON to the running server.

---

### Checking Who Is Online

Use the metrics collector to see the current player count:

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

Look for the `minecraft_players_online` line in the output.

---

## Backup Management

### Verifying Backup Health

The health check includes a `backup_freshness` check that verifies the most recent backup is less than 2 hours old.

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

Look for the `backup_freshness` check in the output. A PASS means backups are running on schedule.

**To manually inspect backup files on the VM:**

```bash
ssh gsd@VM_IP ls -lah /opt/minecraft/backups/hourly/
ssh gsd@VM_IP ls -lah /opt/minecraft/backups/daily/
ssh gsd@VM_IP ls -lah /opt/minecraft/backups/weekly/
```

**Expected state:**

| Directory | Expected Count | Newest File |
|-----------|---------------|-------------|
| hourly/ | Up to 24 files | Less than 2 hours old |
| daily/ | Up to 7 files | Less than 48 hours old |
| weekly/ | Up to 4 files | Less than 8 days old |

---

### Running a Manual Backup

**When to run a manual backup:** Before any server changes, before updates, before maintenance windows, or before any potentially destructive operation.

```bash
./infra/scripts/backup-world.sh \
  --world-dir /opt/minecraft/server/world \
  --backup-dir /opt/minecraft/backups \
  --type hourly
```

**What happens during a backup:**

1. RCON `save-all flush` -- forces all pending writes to disk
2. RCON `save-off` -- disables auto-save (prevents writes during archive)
3. Creates a tar.gz archive of the world directory
4. Generates a SHA-256 checksum sidecar file (.sha256)
5. RCON `save-on` -- re-enables auto-save
6. Rotates old backups (keeps 24 hourly, 7 daily, 4 weekly)
7. Writes a status YAML file for monitoring

**Safety guarantee:** An ERR/EXIT trap ensures `save-on` is ALWAYS sent, even if the backup fails partway through. The server will never be left in save-off state.

**Dry run (preview without actually creating a backup):**

```bash
./infra/scripts/backup-world.sh \
  --world-dir /opt/minecraft/server/world \
  --backup-dir /opt/minecraft/backups \
  --type hourly \
  --dry-run
```

**If RCON is not available, skip the quiesce step:**

```bash
./infra/scripts/backup-world.sh \
  --world-dir /opt/minecraft/server/world \
  --backup-dir /opt/minecraft/backups \
  --type hourly \
  --no-quiesce
```

> **WARNING:** Using `--no-quiesce` may produce an inconsistent backup if the server is writing to disk during the archive. Only use this if the server is stopped or RCON is completely unavailable.

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Backup completed successfully |
| 1 | Backup failed |
| 2 | Usage error |

---

### Reviewing Backup Rotation

Verify that the automated rotation is keeping the correct number of backups.

```bash
# Count backups in each tier
ssh gsd@VM_IP "echo 'Hourly:' && ls /opt/minecraft/backups/hourly/ 2>/dev/null | wc -l"
ssh gsd@VM_IP "echo 'Daily:' && ls /opt/minecraft/backups/daily/ 2>/dev/null | wc -l"
ssh gsd@VM_IP "echo 'Weekly:' && ls /opt/minecraft/backups/weekly/ 2>/dev/null | wc -l"
```

The rotation retains exactly: 24 hourly, 7 daily, 4 weekly. Older backups are automatically deleted.

**Check the newest backup timestamp:**

```bash
ssh gsd@VM_IP ls -lt /opt/minecraft/backups/hourly/ | head -2
```

---

### Restoring from Backup

> **WARNING:** Restoring a backup stops the server, replaces the world directory, and restarts. ALL players will be disconnected. Any changes made since the backup was taken will be lost permanently.

**Pre-flight -- verify the backup is intact before restoring:**

```bash
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/world-YYYYMMDD-HHMMSS.tar.gz \
  --dry-run
```

This checks the archive integrity and SHA-256 checksum without modifying anything.

**Perform the restore:**

```bash
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/world-YYYYMMDD-HHMMSS.tar.gz \
  --force
```

The `--force` flag is required as a safety measure to prevent accidental overwrites.

**What happens during a restore:**

1. Verifies archive integrity (tar listing)
2. Verifies SHA-256 checksum (if sidecar file exists)
3. Creates a safety backup of the current world
4. Stops the Minecraft service gracefully (RCON then systemctl)
5. Extracts the backup archive to the world directory
6. Fixes file permissions (chown to minecraft user)
7. Starts the Minecraft service
8. Verifies the server comes back online

**Exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Restore completed successfully |
| 1 | Restore failed |
| 2 | Usage error |
| 3 | Integrity check failed (corrupted backup) |

If exit code 3: try a different backup file. The checksums do not match and the backup may be corrupted.

**After restoring:** Run a full health check to verify the server is healthy.

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

## Server Lifecycle

### Stopping the Server

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
```

> **WARNING:** All connected players will be disconnected immediately. Consider warning players first via RCON if possible:
>
> ```bash
> # If mcrcon is available:
> mcrcon -H VM_IP -P 25575 -p RCON_PASSWORD "say Server shutting down in 60 seconds"
> sleep 60
> ssh gsd@VM_IP sudo systemctl stop minecraft.service
> ```

**Verify the server has stopped:**

```bash
ssh gsd@VM_IP systemctl status minecraft.service
```

Expected output should show `inactive (dead)`.

---

### Starting the Server

```bash
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

**Watch the startup logs to confirm the server is ready:**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -f
```

Wait for the `Done (X.XXXs)!` message, which indicates the server is fully started and accepting connections. This typically takes 15-30 seconds.

**Verify the server is healthy after startup:**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

### Restarting the Server

```bash
ssh gsd@VM_IP sudo systemctl restart minecraft.service
```

**When to restart:**

- After configuration changes (server.properties, JVM flags)
- After mod updates (new JARs in mods/ directory)
- If the server is unresponsive but the process is still running
- After Java or OS updates

**After restarting:** Verify with the health check (see above).

---

### Checking Service Status

```bash
ssh gsd@VM_IP systemctl status minecraft.service
```

This shows whether the service is active, how long it has been running, and recent log lines.

---

## OS Updates

### Checking for Available Updates

Review what updates are available before applying.

```bash
ssh gsd@VM_IP sudo dnf check-update
```

**Pay special attention to:**

| Package | Risk Level | Notes |
|---------|-----------|-------|
| `java-21-openjdk*` | Medium | May affect Minecraft server startup |
| `kernel*` | Low (requires reboot) | Schedule reboot during maintenance window |
| Security updates | Apply promptly | Use `--security` flag for security-only |
| Other packages | Low | Generally safe to apply |

---

### Applying Security Updates

Apply security patches only (lowest risk).

```bash
ssh gsd@VM_IP sudo dnf update --security -y
```

**When to do this:** Weekly, during a low-activity period.

**Post-update procedure:**

1. Check if the Minecraft service is still running:

   ```bash
   ssh gsd@VM_IP systemctl status minecraft.service
   ```

2. Run a health check to verify nothing broke:

   ```bash
   ./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
   ```

3. If a kernel update was applied, schedule a reboot:

   ```bash
   # Check if reboot is needed
   ssh gsd@VM_IP "needs-restarting -r" 2>/dev/null || echo "Check manually"

   # If reboot needed:
   ssh gsd@VM_IP sudo reboot
   ```

   After reboot, wait 60-90 seconds for the VM and Minecraft service to come back up, then run the health check again.

---

### Applying All Updates

Apply all available updates (slightly higher risk than security-only).

```bash
ssh gsd@VM_IP sudo dnf update -y
```

**Best practice:** Always create a VM snapshot before applying all updates.

```bash
./infra/scripts/vm-lifecycle.sh snapshot --name minecraft-server \
  --snapshot pre-updates-$(date +%Y%m%d)
```

If something breaks after the update, revert to the snapshot (see VM Management below).

---

## VM Management

### Checking VM Status

```bash
./infra/scripts/vm-lifecycle.sh status --name minecraft-server
```

**Expected output:** VM state (running/stopped), IP address, resource allocation, and available snapshots.

---

### Creating a VM Snapshot

**When to create snapshots:** Before any risky operation (updates, config changes, mod updates, version upgrades).

```bash
./infra/scripts/vm-lifecycle.sh snapshot --name minecraft-server \
  --snapshot pre-maintenance-$(date +%Y%m%d)
```

**Naming convention:** `pre-{reason}-YYYYMMDD`

Examples:
- `pre-updates-20260218`
- `pre-mod-update-20260218`
- `pre-mc-upgrade-20260218`

---

### Listing Snapshots

```bash
./infra/scripts/vm-lifecycle.sh status --name minecraft-server
```

The status output includes a list of available snapshots.

---

### Reverting to a Snapshot

> **WARNING:** Reverting to a snapshot discards ALL changes since the snapshot was created. This includes world data, configuration changes, and OS updates. Any world data not in a backup will be lost permanently.

```bash
./infra/scripts/vm-lifecycle.sh clone --source minecraft-server \
  --snapshot SNAPSHOT_NAME --name minecraft-server
```

**After reverting:** Run the health check to verify the server is in the expected state.

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

### Checking Host Resources

If the VM is slow or unresponsive, check the host machine's resources.

```bash
# Check host memory
free -m

# Check host disk space
df -h

# Check host CPU usage
top -b -n 1 | head -20

# Check VM resource allocation
./infra/scripts/vm-lifecycle.sh status --name minecraft-server
```

The Minecraft VM is capped at 16GB RAM and 8 cores. The host reserves at least 4GB RAM and 2 cores for itself.

---

## Weekly Procedures Checklist

Perform these tasks once per week during a scheduled maintenance window.

- [ ] **Full health check:** `./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP`
- [ ] **Verify backup rotation:**
  - Hourly: up to 24 files, newest < 2 hours old
  - Daily: up to 7 files, newest < 48 hours old
  - Weekly: up to 4 files, newest < 8 days old
- [ ] **Check for mod updates:** `./infra/scripts/check-mod-updates.sh --manifest /opt/minecraft/server/mod-manifest.yaml`
  - Exit code 0 = all up to date
  - Exit code 2 = updates available (review before applying -- see Server Update Procedure)
- [ ] **Apply OS security updates:** `ssh gsd@VM_IP sudo dnf update --security -y`
- [ ] **Review disk usage trend:**
  ```bash
  ssh gsd@VM_IP df -h /opt/minecraft
  ```
  If usage exceeds 80%, investigate world size growth or log accumulation.
- [ ] **Review server logs for recurring warnings:**
  ```bash
  ssh gsd@VM_IP journalctl -u minecraft.service --since "1 week ago" -p warning --no-pager
  ```
- [ ] **Verify monitoring is working:**
  ```bash
  curl -sf http://VM_IP:9100/metrics | head -5
  ```
  If this fails, re-run `./infra/monitoring/exporters/deploy-exporters.sh --target-host gsd@VM_IP`

---

## Quick Reference Card

Common tasks and the exact commands to run.

| Task | Command |
|------|---------|
| Health check | `./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP` |
| Health check (JSON) | `./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP --json` |
| Server metrics | `./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human` |
| Server logs (today) | `ssh gsd@VM_IP journalctl -u minecraft.service --since today` |
| Server logs (follow) | `ssh gsd@VM_IP journalctl -u minecraft.service -f` |
| Add player | `./infra/scripts/manage-whitelist.sh add PLAYER_NAME --rcon-host VM_IP` |
| Remove player | `./infra/scripts/manage-whitelist.sh remove PLAYER_NAME --rcon-host VM_IP` |
| List whitelist | `./infra/scripts/manage-whitelist.sh list` |
| Sync whitelist | `./infra/scripts/manage-whitelist.sh sync --rcon-host VM_IP` |
| Manual backup | `./infra/scripts/backup-world.sh --world-dir /opt/minecraft/server/world --backup-dir /opt/minecraft/backups --type hourly` |
| Restore backup | `./infra/scripts/restore-world.sh BACKUP_FILE --force` |
| Check mod updates | `./infra/scripts/check-mod-updates.sh --manifest /opt/minecraft/server/mod-manifest.yaml` |
| Stop server | `ssh gsd@VM_IP sudo systemctl stop minecraft.service` |
| Start server | `ssh gsd@VM_IP sudo systemctl start minecraft.service` |
| Restart server | `ssh gsd@VM_IP sudo systemctl restart minecraft.service` |
| Service status | `ssh gsd@VM_IP systemctl status minecraft.service` |
| VM status | `./infra/scripts/vm-lifecycle.sh status --name minecraft-server` |
| Create snapshot | `./infra/scripts/vm-lifecycle.sh snapshot --name minecraft-server --snapshot NAME` |
| OS security updates | `ssh gsd@VM_IP sudo dnf update --security -y` |
| Disk usage | `ssh gsd@VM_IP df -h /opt/minecraft` |

---

## Related Runbooks

- [Day-1 Deployment Runbook](runbook-day-1-deployment.md) -- Full deployment from scratch
- [Incident Response Runbook](runbook-incident-response.md) -- Troubleshooting and resolution
- [Server Update Procedure](runbook-server-update.md) -- Minecraft, Fabric, and mod updates
