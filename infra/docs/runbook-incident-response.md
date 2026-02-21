# Incident Response Runbook: Knowledge World Server

## Overview

This runbook covers four incident categories for the Minecraft Knowledge World server. For each category: how to detect the problem, how to diagnose the root cause using decision trees, and step-by-step resolution procedures.

**How to use this runbook:**

1. Run the general triage procedure (below) to identify which category applies
2. Navigate to the matching incident section
3. Follow the diagnosis tree to find the specific resolution
4. After resolution, complete the post-incident procedures

**Conventions:**

- `VM_IP` -- the IP address of the Minecraft VM
- All commands are run from the repository root directory unless otherwise noted
- Commands prefixed with `ssh gsd@VM_IP` run on the Minecraft VM
- Destructive operations are marked with **WARNING** blocks

---

## General Triage Procedure

Start here for any incident. This narrows down which category to investigate.

**Step 1: Run the health check**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP --json
```

**Step 2: Check which categories are FAIL vs WARN vs PASS**

| Check Result | Likely Category | Go To |
|-------------|-----------------|-------|
| `systemd` = FAIL | Server Unreachable | [Incident 1](#incident-1-server-unreachable) |
| `process` = FAIL | Server Unreachable | [Incident 1](#incident-1-server-unreachable) |
| `game_port` = FAIL | Server Unreachable | [Incident 1](#incident-1-server-unreachable) |
| `jvm_heap` = WARN/FAIL | Performance Degradation | [Incident 2](#incident-2-performance-degradation) |
| `known_failures` = FAIL (OOM) | Performance Degradation | [Incident 2](#incident-2-performance-degradation) |
| `known_failures` = FAIL (mod) | Mod Conflicts | [Incident 4](#incident-4-mod-conflicts) |
| `backup_freshness` = FAIL | Check backup system | [Day-2 Runbook: Backup Management](runbook-day-2-operations.md#backup-management) |
| Cannot run health check at all | VM may be down | [Incident 1: VM Down](#vm-down-resolution) |

**Step 3: If the health check itself fails to connect**, the VM may be completely unreachable. Skip directly to [Incident 1: VM Down](#vm-down-resolution).

---

## Severity Levels

| Level | Name | Description | Response Time |
|-------|------|-------------|---------------|
| P1 | Critical | Server unreachable, world corruption | Immediate -- begin resolution now |
| P2 | Warning | Performance degradation, mod conflicts | Within 1 hour |
| P3 | Informational | Stale metrics, minor warnings | Within 24 hours |

---

## Incident 1: Server Unreachable

### Detection

Any of the following:

- Alert fires: `MinecraftServerUnreachable` or `MinecraftServiceDown`
- Players report "Can't connect to server"
- Health check shows `game_port` or `rcon_port` as FAIL
- Health check shows `systemd` as FAIL
- SSH to VM fails

**Severity: P1 (Critical)**

### Diagnosis Tree

Follow this decision tree from top to bottom:

```
Is the VM running?
|
+-- NO --> [VM Down] Resolution
|
+-- YES --> Can you SSH to the VM?
    |
    +-- NO --> [Network Issue] Resolution
    |
    +-- YES --> Is minecraft.service active?
        |
        +-- NO --> [Service Crashed] Resolution
        |
        +-- YES --> Is port 25565 listening?
            |
            +-- NO --> [Port Issue] Resolution
            |
            +-- YES --> [Firewall Issue] Resolution
```

**How to answer each question:**

```bash
# Is the VM running?
./infra/scripts/vm-lifecycle.sh status --name minecraft-server

# Can you SSH to the VM?
ssh -o ConnectTimeout=5 gsd@VM_IP echo "SSH works"

# Is minecraft.service active?
ssh gsd@VM_IP systemctl is-active minecraft.service

# Is port 25565 listening?
ssh gsd@VM_IP ss -tlnp | grep 25565
```

---

### VM Down Resolution

The VM is not running. This could be caused by a host reboot, hypervisor issue, or resource exhaustion.

**Step 1: Check VM status**

```bash
./infra/scripts/vm-lifecycle.sh status --name minecraft-server
```

**Step 2: If the VM exists but is stopped, start it:**

```bash
./infra/scripts/vm-lifecycle.sh start --name minecraft-server
```

Wait 60 seconds for the VM and Minecraft service to come up, then verify:

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

**Step 3: If the VM does not exist (was destroyed or never created):**

Rebuild from golden image (fastest -- under 5 minutes):

```bash
./infra/scripts/rapid-rebuild.sh --mode clone --name minecraft-server
```

If no golden image exists, rebuild from scratch (under 20 minutes):

```bash
./infra/scripts/rapid-rebuild.sh --mode scratch --name minecraft-server
```

After rebuild, restore the latest world backup:

```bash
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/LATEST_BACKUP.tar.gz --force
```

**Step 4: If the hypervisor itself is having issues:**

Check host resources:

```bash
free -m          # Host memory (must have >= 4GB free for host)
df -h            # Host disk space
virsh list --all # All VMs and their states (KVM)
```

If the host is out of memory, you may need to stop other VMs or increase host RAM.

**Step 5: After VM is running, verify everything:**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

All 12 checks should pass. If not, continue to the relevant section below.

---

### Network Issue Resolution

The VM is running but you cannot SSH to it. This is a network configuration or bridge issue.

**Step 1: Get the VM's IP address from the hypervisor:**

```bash
./infra/scripts/vm-lifecycle.sh status --name minecraft-server
```

Look for the IP address in the output. If no IP is shown, the VM may not have DHCP or the network bridge is down.

**Step 2: Check the host network bridge:**

```bash
ip addr show virbr0
```

If the bridge does not exist or has no IP, restart the libvirt networking:

```bash
sudo systemctl restart libvirtd
sudo virsh net-start default 2>/dev/null || echo "Network may already be active"
```

**Step 3: Check host-level firewall:**

```bash
# Check if the game port (25565) is allowed through the host firewall
./infra/scripts/fw-abstraction.sh query 25565
```

If blocked, open it:

```bash
./infra/scripts/fw-abstraction.sh open 25565
```

**Step 4: Ping the VM from the host:**

```bash
ping -c 3 VM_IP
```

If ping fails, the VM may need a network interface restart:

```bash
# Access via console (virsh console for KVM)
sudo virsh console minecraft-server
# Then inside the VM:
sudo nmcli networking off && sudo nmcli networking on
```

**Step 5: Verify connectivity is restored:**

```bash
ssh -o ConnectTimeout=10 gsd@VM_IP echo "SSH restored"
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

### Service Crashed Resolution

SSH works, but minecraft.service is not running. The server has crashed.

**Step 1: Check the service status and recent logs:**

```bash
ssh gsd@VM_IP systemctl status minecraft.service
ssh gsd@VM_IP journalctl -u minecraft.service --since "1 hour ago" -n 100 --no-pager
```

**Step 2: Identify the crash reason from the logs:**

| Log Pattern | Root Cause | Go To |
|-------------|-----------|-------|
| `OutOfMemoryError` | JVM ran out of heap memory | Step 3a |
| `Unable to access jarfile` | Server JAR file missing or moved | Step 3b |
| `FAILED TO BIND TO PORT` | Port 25565 already in use | Step 3c |
| `ConcurrentModificationException` | Internal server error | Step 3d |
| `Mismatch` or `incompatible` | Mod version conflict | [Incident 4](#incident-4-mod-conflicts) |
| No obvious error | Unknown crash | Step 3d |

**Step 3a: OutOfMemoryError**

The JVM has run out of heap memory. Options:

1. Check current heap allocation:

   ```bash
   ssh gsd@VM_IP cat /opt/minecraft/server/jvm-flags.conf | grep -E 'Xmx|Xms'
   ```

2. Increase heap by editing the JVM flags file (if host resources allow):

   ```bash
   ssh gsd@VM_IP sudo vi /opt/minecraft/server/jvm-flags.conf
   # Change -Xmx value (e.g., -Xmx8G to -Xmx12G)
   ```

3. Restart the server:

   ```bash
   ssh gsd@VM_IP sudo systemctl restart minecraft.service
   ```

4. If OOM recurs: investigate entity accumulation, world size growth, or memory leaks.

**Step 3b: Missing JAR File**

The Minecraft server JAR has been deleted or moved.

1. Check if the JAR exists:

   ```bash
   ssh gsd@VM_IP ls -la /opt/minecraft/server/fabric-server-launch.jar
   ```

2. If missing, redeploy:

   ```bash
   ./infra/scripts/deploy-minecraft.sh --target-host gsd@VM_IP
   ```

3. Start the server:

   ```bash
   ssh gsd@VM_IP sudo systemctl start minecraft.service
   ```

**Step 3c: Port Conflict**

Another process is using port 25565.

1. Find the conflicting process:

   ```bash
   ssh gsd@VM_IP ss -tlnp | grep 25565
   ```

2. Kill the conflicting process (if it is not critical):

   ```bash
   ssh gsd@VM_IP sudo kill PID
   ```

3. Start the Minecraft server:

   ```bash
   ssh gsd@VM_IP sudo systemctl start minecraft.service
   ```

**Step 3d: Unknown Crash / ConcurrentModificationException**

1. Try a simple restart first:

   ```bash
   ssh gsd@VM_IP sudo systemctl restart minecraft.service
   ```

2. If the crash recurs within 5 minutes, the issue is persistent. Create a backup:

   ```bash
   ./infra/scripts/backup-world.sh --world-dir /opt/minecraft/server/world --backup-dir /opt/minecraft/backups --type hourly
   ```

3. If repeated crashes continue, rebuild from golden image:

   ```bash
   ./infra/scripts/rapid-rebuild.sh --mode clone --name minecraft-server
   ./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/LATEST.tar.gz --force
   ```

4. Verify:

   ```bash
   ./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
   ```

---

### Port Issue Resolution

The Minecraft service is running, but port 25565 is not listening.

**Step 1: Check what ports Java is listening on:**

```bash
ssh gsd@VM_IP ss -tlnp | grep java
```

**Step 2: Check server.properties for the correct port:**

```bash
ssh gsd@VM_IP grep server-port /opt/minecraft/server/server.properties
```

If the port is different from 25565, either update server.properties or connect using the correct port.

**Step 3: If the server started but is still loading (no port yet):**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -f
```

Wait for the `Done (X.XXXs)!` message. Large worlds take longer to load.

**Step 4: If the port should be 25565 but is not listening after startup completes:**

Restart the server:

```bash
ssh gsd@VM_IP sudo systemctl restart minecraft.service
```

---

### Firewall Issue Resolution

The port is listening but connections are being blocked by a firewall.

**Step 1: Check VM firewall rules:**

```bash
ssh gsd@VM_IP sudo firewall-cmd --list-ports
```

**Step 2: If 25565/tcp is not listed, add it:**

```bash
ssh gsd@VM_IP sudo firewall-cmd --add-port=25565/tcp --permanent
ssh gsd@VM_IP sudo firewall-cmd --add-port=25575/tcp --permanent
ssh gsd@VM_IP sudo firewall-cmd --reload
```

**Step 3: Check SELinux (should be Enforcing but not blocking Minecraft):**

```bash
ssh gsd@VM_IP getenforce
```

If SELinux is blocking Java, check the audit log:

```bash
ssh gsd@VM_IP sudo ausearch -m avc --start recent
```

If SELinux is the cause, create a policy exception (consult SELinux documentation) or set it to permissive temporarily:

```bash
ssh gsd@VM_IP sudo setenforce 0   # Temporary -- resets on reboot
```

> **WARNING:** Setting SELinux to permissive reduces security. This should be temporary while you create a proper policy exception.

**Step 4: Verify connectivity:**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

## Incident 2: Performance Degradation

### Detection

Any of the following:

- Alert fires: `MinecraftTPSDegraded` (TPS < 18) or `MinecraftTPSCritical` (TPS < 15)
- Alert fires: `MinecraftMemoryPressure` (JVM heap > 90%)
- Players report lag, rubber-banding, or slow block breaking
- Metrics show TPS below 20.0

**Severity: P2 (Warning) -- escalate to P1 if TPS drops below 10**

### Current Metrics

First, gather the current state:

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

Note the TPS value, player count, world size, and entity count.

### Diagnosis Tree

```
What is the current TPS?
|
+-- Below 15 --> [Severe Lag] Resolution
|
+-- 15 to 18 --> [Moderate Lag] Resolution
|
+-- 18 or above --> [Intermittent Lag] Monitoring
```

---

### Severe Lag Resolution (TPS Below 15)

This indicates a serious performance problem -- likely GC pressure, entity accumulation, or resource exhaustion.

**Step 1: Check JVM memory and GC pressure**

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

Look at the JVM heap metrics. If heap usage is consistently above 90%, the server is under memory pressure.

**Step 2: Check host and VM memory**

```bash
ssh gsd@VM_IP free -m
```

If total available memory is low, the VM may need more RAM allocated.

**Step 3: Check entity count**

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

Look for the entity count metric. A very high entity count causes severe lag.

If entities are excessive, kill them via RCON:

```bash
# If mcrcon is available:
mcrcon -H VM_IP -P 25575 -p RCON_PASSWORD "kill @e[type=!player]"
```

> **WARNING:** This kills ALL non-player entities (animals, item frames, armor stands, etc.). Player-placed entities will be lost.

**Step 4: Check world size and chunk count**

If the world is very large with many loaded chunks, it consumes more memory and CPU.

**Step 5: Create a backup before any intervention**

```bash
./infra/scripts/backup-world.sh --world-dir /opt/minecraft/server/world --backup-dir /opt/minecraft/backups --type hourly
```

**Step 6: Restart the server**

A restart clears accumulated state and may resolve transient issues.

```bash
ssh gsd@VM_IP sudo systemctl restart minecraft.service
```

Wait for `Done` in the logs, then check TPS again.

**Step 7: If no improvement after restart -- rebuild from golden image**

This is the nuclear option. It restores the server to a known-good state.

```bash
./infra/scripts/rapid-rebuild.sh --mode clone --name minecraft-server
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/LATEST.tar.gz --force
```

Verify:

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

### Moderate Lag Resolution (TPS 15-18)

This is a noticeable but not critical performance issue. Usually caused by disk I/O, chunk generation, or temporary load spikes.

**Step 1: Check disk I/O**

```bash
ssh gsd@VM_IP iostat -x 1 3
```

Look for disk utilization above 80%. If the disk is saturated, check if a backup cron job is running simultaneously.

**Step 2: Check if correlated with backup schedule**

Backups run hourly and cause an I/O spike during the archive creation. If TPS dips coincide with backup times, consider:

- Adjusting backup cron timing to a low-activity period
- Using `--no-quiesce` during off-peak backups (saves I/O from save-all flush)

**Step 3: Check chunk loading**

```bash
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

If chunk count is growing rapidly, players may be exploring new territory. Consider setting a world border to limit exploration area.

**Step 4: Schedule a maintenance restart**

If TPS is between 15-18 and not degrading further, schedule a restart during a low-activity period:

```bash
ssh gsd@VM_IP sudo systemctl restart minecraft.service
```

---

### Intermittent Lag Monitoring

TPS is at or above 18, but occasional dips are observed.

**Step 1: Set up continuous monitoring**

```bash
# Run metrics collection every 30 seconds for 10 minutes
for i in $(seq 1 20); do
  ./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human 2>/dev/null | grep -i tps
  sleep 30
done
```

**Step 2: Correlate with activity**

- More players = more chunk loading = brief TPS dips (normal)
- Dips every hour at :15 = backup I/O (expected)
- Random dips = GC pauses (check JVM GC configuration)

**Step 3: If dips are correlated with backup schedule**

Adjust the backup cron timing or ensure backups run during off-peak hours.

**Step 4: If dips are GC-related**

Check the GC algorithm in use:

```bash
ssh gsd@VM_IP cat /opt/minecraft/server/jvm-flags.conf | grep -E 'UseG1GC|UseShenandoahGC|UseZGC'
```

If the heap is >= 8GB, ZGC provides lower pause times. Consult the JVM tuning documentation.

---

## Incident 3: World Corruption

### Detection

Any of the following:

- Server log shows: "Chunk corrupted", "Unable to load level.dat", region file errors
- Players report missing builds, invisible blocks, or terrain glitches
- Health check `known_failures` reports chunk-related errors
- Server fails to start after a crash or power loss

**Severity: P1 (Critical)**

### Severity Assessment

Answer these questions to determine the scope:

```bash
# Can the server start?
ssh gsd@VM_IP sudo systemctl start minecraft.service
ssh gsd@VM_IP systemctl is-active minecraft.service
```

| Question | Answer | Scope |
|----------|--------|-------|
| Can the server start? | Yes | Localized corruption -- some areas affected |
| Can the server start? | No | Critical corruption -- world data damaged |

**Check logs for corruption indicators:**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service --since "1 hour ago" --no-pager | grep -iE "corrupt|error|fail|region|chunk|level.dat"
```

---

### Resolution: Localized Corruption (Server Starts, Some Areas Broken)

The server starts, but some areas have missing blocks, duplicated terrain, or glitched chunks.

**Step 1: IMMEDIATELY create a backup of the current state (preserve evidence)**

```bash
./infra/scripts/backup-world.sh --world-dir /opt/minecraft/server/world --backup-dir /opt/minecraft/backups --type hourly --no-quiesce
```

**Step 2: Identify the affected region files from the server logs**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service --since "1 hour ago" --no-pager | grep -i "region\|chunk\|r\."
```

Region files are named `r.X.Z.mca` where X and Z are region coordinates.

**Step 3: Choose a repair strategy**

**Option A: Delete corrupted region files (chunks will regenerate as new terrain)**

> **WARNING:** Any player builds in the deleted chunks are lost permanently. Only use this if the affected chunks contain no important builds.

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
ssh gsd@VM_IP rm /opt/minecraft/server/world/region/r.X.Z.mca
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

**Option B: Restore individual region files from a backup**

1. Identify the latest good backup:

   ```bash
   ssh gsd@VM_IP ls -lt /opt/minecraft/backups/hourly/ | head -5
   ```

2. Extract only the needed region files:

   ```bash
   ssh gsd@VM_IP "cd /tmp && tar xzf /opt/minecraft/backups/hourly/world-YYYYMMDD-HHMMSS.tar.gz world/region/r.X.Z.mca"
   ssh gsd@VM_IP sudo systemctl stop minecraft.service
   ssh gsd@VM_IP sudo cp /tmp/world/region/r.X.Z.mca /opt/minecraft/server/world/region/r.X.Z.mca
   ssh gsd@VM_IP sudo chown minecraft:minecraft /opt/minecraft/server/world/region/r.X.Z.mca
   ssh gsd@VM_IP sudo systemctl start minecraft.service
   ```

3. Clean up:

   ```bash
   ssh gsd@VM_IP rm -rf /tmp/world/
   ```

**Step 4: Verify the repair**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

Connect to the server and visit the affected areas to confirm they are usable.

---

### Resolution: Critical Corruption (Server Will Not Start)

The world data is too damaged for the server to load. This requires a full restore from backup.

**Step 1: Do NOT delete or modify anything yet**

Preserve the corrupted state for investigation.

**Step 2: Create a compressed archive of the corrupted world**

```bash
ssh gsd@VM_IP "tar czf /tmp/corrupted-world-$(date +%Y%m%d-%H%M%S).tar.gz /opt/minecraft/server/world/"
```

This preserves evidence in case you need to extract specific files later.

**Step 3: Restore from the latest backup**

```bash
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/LATEST_BACKUP.tar.gz \
  --force
```

The restore script will:
1. Verify the backup archive integrity (SHA-256 checksum)
2. Stop the Minecraft service
3. Create a safety backup of the current (corrupted) world
4. Extract the backup to the world directory
5. Fix file permissions
6. Start the Minecraft service

**Step 4: If the latest backup is also corrupted (exit code 3)**

Try older backups in order of freshness:

```bash
# List daily backups
ssh gsd@VM_IP ls -lt /opt/minecraft/backups/daily/

# Try a daily backup
./infra/scripts/restore-world.sh /opt/minecraft/backups/daily/world-YYYYMMDD-HHMMSS.tar.gz --force

# If daily backups also fail, try weekly
ssh gsd@VM_IP ls -lt /opt/minecraft/backups/weekly/
./infra/scripts/restore-world.sh /opt/minecraft/backups/weekly/world-YYYYMMDD-HHMMSS.tar.gz --force
```

**Step 5: Nuclear option -- full rebuild from golden image + backup**

If no backup restores successfully:

```bash
./infra/scripts/rapid-rebuild.sh --mode clone --name minecraft-server
```

Then restore from the oldest known-good backup:

```bash
./infra/scripts/restore-world.sh /opt/minecraft/backups/weekly/OLDEST_GOOD_BACKUP.tar.gz --force
```

**Step 6: Verify recovery**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

All 12 checks should pass.

**Step 7: Post-incident investigation**

Check if save-off was stuck (a `save-off` without a matching `save-on` can cause corruption on crash):

```bash
ssh gsd@VM_IP journalctl -u minecraft.service --since "24 hours ago" --no-pager | grep -i "save-off\|save-on"
```

Every `save-off` should have a matching `save-on`. If not, the backup script's ERR/EXIT trap may have failed.

### Prevention

- Verify backup cron is running: `check-minecraft-health.sh` includes a `backup_freshness` check
- **Never** use `kill -9` on the Minecraft process -- always use `systemctl stop` which allows graceful save
- Ensure the ERR/EXIT trap in `backup-world.sh` always sends `save-on` after `save-off`
- Create VM snapshots before any risky operation: `vm-lifecycle.sh snapshot --name minecraft-server --snapshot pre-REASON-$(date +%Y%m%d)`
- Monitor disk space: corruption is more likely when the disk is nearly full

---

## Incident 4: Mod Conflicts

### Detection

Any of the following:

- Server log shows: "Mismatch", "incompatible", "failed to load mod"
- Server crashes on startup after a mod update
- Players report "Incompatible mod set" when trying to connect
- Health check `known_failures` reports mod-related warnings

**Severity: P2 (Warning) -- escalate to P1 if server cannot start**

### Diagnosis

**Step 1: Check current mod versions**

```bash
ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
```

This shows the currently installed mods, their versions, and checksums.

**Step 2: Check for available updates**

```bash
./infra/scripts/check-mod-updates.sh --manifest /opt/minecraft/server/mod-manifest.yaml
```

Exit code 0 = all up to date. Exit code 2 = updates available.

**Step 3: Check server logs for the specific error**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -n 200 --no-pager | grep -iE "mod|fabric|mismatch|incompatible|conflict|version"
```

**Step 4: Determine the conflict type**

| Error Pattern | Type | Go To |
|--------------|------|-------|
| "failed to load mod" on startup | Server-Side Mod Conflict | [Server-Side Resolution](#resolution-server-side-mod-conflict) |
| Server starts but players get "incompatible" | Client-Server Mismatch | [Client-Server Resolution](#resolution-client-server-mod-mismatch) |
| "Mismatch" in mod dependencies | Server-Side Mod Conflict | [Server-Side Resolution](#resolution-server-side-mod-conflict) |

---

### Resolution: Server-Side Mod Conflict

A mod failed to load due to version incompatibility with the Minecraft server, Fabric loader, or another mod.

**Step 1: Create a backup before any changes**

```bash
./infra/scripts/backup-world.sh --world-dir /opt/minecraft/server/world --backup-dir /opt/minecraft/backups --type hourly
```

**Step 2: Create a VM snapshot (quick rollback point)**

```bash
./infra/scripts/vm-lifecycle.sh snapshot --name minecraft-server --snapshot pre-mod-fix-$(date +%Y%m%d)
```

**Step 3: If the problem was caused by a recent mod update -- rollback**

1. Check the mod manifest for the previous version:

   ```bash
   ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
   ```

2. Download the previous version from Modrinth:

   ```bash
   # Use the Modrinth project page to find the previous version URL
   # Download to the VM
   ssh gsd@VM_IP "curl -L -o /opt/minecraft/server/mods/MOD_FILE.jar 'MODRINTH_DOWNLOAD_URL'"
   ```

3. Remove the problematic new version:

   ```bash
   ssh gsd@VM_IP rm /opt/minecraft/server/mods/NEW_MOD_FILE.jar
   ```

4. Update `mod-manifest.yaml` to reflect the rollback:

   ```bash
   ssh gsd@VM_IP vi /opt/minecraft/server/mod-manifest.yaml
   ```

5. Restart the server:

   ```bash
   ssh gsd@VM_IP sudo systemctl restart minecraft.service
   ```

**Step 4: If this is a fresh install issue**

1. Verify the Fabric loader version matches the Minecraft server version:

   ```bash
   ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -i "fabric loader"
   ```

2. Verify each mod version is compatible with the current Minecraft + Fabric version. Check the Modrinth project page for each mod's supported versions.

3. If versions are mismatched, redeploy with corrected versions:

   ```bash
   # Update local-values.yaml with correct mod versions
   # Then redeploy
   ./infra/scripts/deploy-mods.sh --target-host gsd@VM_IP
   ```

**Step 5: Verify the fix**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -iE "loading fabric|syncmatica"
```

Both mods should appear as loaded with their correct versions.

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

### Resolution: Client-Server Mod Mismatch

Players can connect to the server but get an "incompatible mod set" or similar error. The server is running fine -- the issue is on the client side.

**Step 1: Identify the version mismatch**

Check server mod versions:

```bash
ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
```

The player's client must match the server for:

| Component | Must Match Exactly? |
|-----------|-------------------|
| Minecraft version | Yes |
| Fabric loader version | Yes (major/minor) |
| Syncmatica version | Yes (exact) |
| Fabric API version | Usually client >= server works |

**Step 2: Provide the correct versions to the player**

Share the exact versions from the server's mod-manifest.yaml. The player needs to:

1. Install Fabric loader matching the server version
2. Install the exact same Syncmatica version
3. Install a compatible Fabric API version (same or newer)

**Step 3: If using Prism Launcher**

If a Prism Launcher profile exists for the Knowledge World, update it to match the current server versions and redistribute to players. See the client setup documentation in `infra/docs/`.

**Step 4: Verify the client can connect**

After the player updates their mods, have them attempt to connect. Check the server log for successful connection:

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -f | grep -i "joined\|connected\|UUID"
```

---

## Post-Incident Procedures

Complete these steps after every incident, regardless of category.

**Step 1: Verify full health**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

All 12 checks must pass.

**Step 2: If significant changes were made during resolution, create a fresh golden image**

```bash
./infra/scripts/golden-image.sh create --source minecraft-server
```

This ensures the golden image reflects the current known-good state.

**Step 3: Verify golden image was created**

```bash
./infra/scripts/golden-image.sh list
```

**Step 4: Document the incident**

Record the following for future reference:

- What was detected (alerts, player reports, health check output)
- What the root cause was
- What steps were taken to resolve it
- How long the server was down or degraded
- What could prevent this in the future

**Step 5: Update this runbook if a new failure pattern was discovered**

If the incident involved a failure pattern not covered here, add it to the appropriate section.

---

## Escalation Path Summary

All four incident categories share the same final escalation path if all other resolution steps fail:

```
1. Create backup: backup-world.sh (preserve current state)
2. Rebuild from golden image: rapid-rebuild.sh --mode clone (under 5 minutes)
3. Restore world from backup: restore-world.sh LATEST_BACKUP --force
4. Verify: check-minecraft-health.sh (all 12 checks pass)
5. Create fresh golden image: golden-image.sh create (update known-good state)
```

If golden image rebuild fails, fall back to scratch rebuild:

```
rapid-rebuild.sh --mode scratch --name minecraft-server
```

This performs a full PXE boot installation in under 20 minutes.

---

## Related Runbooks

- [Day-1 Deployment Runbook](runbook-day-1-deployment.md) -- Full deployment from scratch
- [Day-2 Operations Runbook](runbook-day-2-operations.md) -- Daily maintenance procedures
- [Server Update Procedure](runbook-server-update.md) -- Minecraft, Fabric, and mod updates
