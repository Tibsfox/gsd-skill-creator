# Server Update Procedure: Minecraft, Fabric, and Mods

## Overview

This runbook documents the procedure for updating the Minecraft Knowledge World server components: Minecraft server version, Fabric loader, Fabric API, and Syncmatica. Each update type has its own procedure with pre-update checklist, step-by-step commands, verification, and rollback plan.

**Update types covered (ordered by risk):**

| Type | Risk | Downtime | Components Changed |
|------|------|----------|--------------------|
| [Mod-Only Update](#procedure-1-mod-only-update-fabric-api-or-syncmatica) | Low | 2-5 minutes | Fabric API and/or Syncmatica JARs |
| [Fabric Loader Update](#procedure-2-fabric-loader-update) | Medium | 5-10 minutes | Fabric loader JAR |
| [Minecraft Version Upgrade](#procedure-3-minecraft-version-upgrade) | High | 15-30+ minutes | Everything (world format may change) |

**Key principle:** Every update follows the same safety pattern:

```
Backup --> Snapshot --> Update --> Verify --> Golden Image
   ^                                |
   |         Rollback <-------------+  (if verify fails)
```

**Conventions:**

- `VM_IP` -- the IP address of the Minecraft VM
- All commands are run from the repository root directory unless otherwise noted
- Commands prefixed with `ssh gsd@VM_IP` run on the Minecraft VM

---

## When to Update

| Trigger | Urgency | Recommended Action |
|---------|---------|-------------------|
| Security patch for Minecraft or Java | High | Apply within 24 hours |
| New Fabric loader with bug fixes | Medium | Apply during next maintenance window |
| Mod update with desired features | Low | Test compatibility first, then apply |
| Mod update for compatibility fix | Medium | Required if current version has issues |
| Minecraft version upgrade (major) | Low | Plan carefully, full compatibility check |

---

## Pre-Update Checklist

Complete this checklist before performing ANY update. Do not skip steps.

- [ ] **Check current versions:**

  ```bash
  ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
  ```

- [ ] **Check available updates:**

  ```bash
  ./infra/scripts/check-mod-updates.sh --manifest /opt/minecraft/server/mod-manifest.yaml
  ```

  Exit code 0 = all up to date. Exit code 2 = updates available.

- [ ] **Verify mod compatibility:** Check Modrinth project pages for each mod to confirm the new version supports the current Minecraft + Fabric version. Look for the "Game Versions" and "Loaders" tags on each release.

- [ ] **Record current baseline performance:**

  ```bash
  ./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
  ```

  Note the TPS value -- this is your baseline for comparison after the update.

- [ ] **Create a world backup:**

  ```bash
  ./infra/scripts/backup-world.sh \
    --world-dir /opt/minecraft/server/world \
    --backup-dir /opt/minecraft/backups \
    --type hourly
  ```

- [ ] **Create a VM snapshot:**

  ```bash
  ./infra/scripts/vm-lifecycle.sh snapshot --name minecraft-server \
    --snapshot pre-update-$(date +%Y%m%d)
  ```

- [ ] **Notify players:** If players are online, warn them of the upcoming maintenance window and expected downtime.

- [ ] **Run a health check to confirm the server is currently healthy:**

  ```bash
  ./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
  ```

  Do not proceed with updates if the server is already unhealthy. Fix existing issues first.

---

## Procedure 1: Mod-Only Update (Fabric API or Syncmatica)

**Risk: Low** -- No server or loader version change. Only mod JARs are replaced.

**Estimated downtime:** 2-5 minutes

### Prerequisites

- Pre-update checklist complete (all items checked above)
- New mod version confirmed compatible with current Minecraft + Fabric versions

### Method A: Using deploy-mods.sh (Recommended)

This method uses the deployment script for a clean, repeatable update.

**Step 1: Update local-values.yaml with the new mod versions**

Edit `infra/local/local-values.yaml` and update the mod version numbers and checksums.

**Step 2: Stop the server**

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
```

**Step 3: Deploy updated mods**

```bash
./infra/scripts/deploy-mods.sh --target-host gsd@VM_IP
```

The script downloads the specified mod versions from Modrinth, verifies SHA-256 checksums, and installs them to the mods/ directory.

**Step 4: Start the server**

```bash
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

**Step 5: Verify the update**

```bash
# Check server logs for mod loading
ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -iE "loading fabric|syncmatica"

# Run health check
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP

# Check TPS is at baseline
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

**Step 6: Update the golden image**

```bash
./infra/scripts/golden-image.sh create --source minecraft-server
```

### Method B: Manual JAR Replacement

Use this if deploy-mods.sh is unavailable or you need to update a single mod quickly.

**Step 1: Stop the server**

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
```

**Step 2: Download the new mod JAR**

Get the download URL from Modrinth or from the output of `check-mod-updates.sh`:

```bash
ssh gsd@VM_IP "curl -L -o /opt/minecraft/server/mods/fabric-api-NEW_VERSION.jar 'MODRINTH_DOWNLOAD_URL'"
```

**Step 3: Remove the old JAR**

```bash
ssh gsd@VM_IP rm /opt/minecraft/server/mods/fabric-api-OLD_VERSION.jar
```

**Step 4: Update the mod manifest**

```bash
ssh gsd@VM_IP vi /opt/minecraft/server/mod-manifest.yaml
```

Update the version number and SHA-256 checksum for the updated mod.

**Step 5: Start the server**

```bash
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

**Step 6: Verify (same as Method A, Step 5)**

### Rollback

If the update causes problems:

**Option 1: Revert to pre-update snapshot (fastest)**

```bash
./infra/scripts/vm-lifecycle.sh clone --source minecraft-server \
  --snapshot pre-update-YYYYMMDD --name minecraft-server
```

> **WARNING:** This reverts ALL changes since the snapshot, including any world changes made between the snapshot and the update.

**Option 2: Restore mods from backup**

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
# Restore the old mod JARs from your backup
ssh gsd@VM_IP "cd /opt/minecraft/server/mods && ls"
# Replace new JARs with old versions (download from Modrinth or extract from backup)
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

**After rollback:** Verify the server is healthy:

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

## Procedure 2: Fabric Loader Update

**Risk: Medium** -- The loader version change may affect mod loading behavior.

**Estimated downtime:** 5-10 minutes

### Prerequisites

- Pre-update checklist complete
- New Fabric loader version confirmed compatible with current Minecraft version (check fabricmc.net)
- Both mods (Fabric API, Syncmatica) confirmed compatible with the new loader version

### Steps

**Step 1: Verify compatibility**

Check fabricmc.net/use/server to confirm the new Fabric loader version supports your Minecraft version:

```
Minecraft version: X.Y.Z
Fabric loader: NEW_LOADER_VERSION
```

**Step 2: Stop the server**

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
```

**Step 3: Download the new Fabric server JAR**

```bash
ssh gsd@VM_IP "curl -OJL 'https://meta.fabricmc.net/v2/versions/loader/MC_VERSION/NEW_LOADER_VERSION/JAVA_VERSION/server/jar'"
```

Replace `MC_VERSION` with your Minecraft version (e.g., `1.21.4`), `NEW_LOADER_VERSION` with the target loader version, and `JAVA_VERSION` with the Java version (e.g., `21`).

**Step 4: Replace the server JAR**

```bash
# Backup the old JAR first
ssh gsd@VM_IP "cp /opt/minecraft/server/fabric-server-launch.jar /opt/minecraft/server/fabric-server-launch.jar.bak"

# Replace with the new JAR
ssh gsd@VM_IP "mv fabric-server-*.jar /opt/minecraft/server/fabric-server-launch.jar"
```

**Step 5: Update local-values.yaml**

Edit `infra/local/local-values.yaml` and update the `fabric_loader_version` field to match the new version.

**Step 6: Start the server**

```bash
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

**Step 7: Verify the update**

```bash
# Check logs for the new loader version
ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -i "fabric loader"

# Verify both mods loaded
ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -iE "loading fabric api|syncmatica"

# Run health check
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP

# Check TPS
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human
```

**Step 8: Update the golden image**

```bash
./infra/scripts/golden-image.sh create --source minecraft-server
```

### Rollback

Same as Procedure 1 -- revert to the pre-update snapshot:

```bash
./infra/scripts/vm-lifecycle.sh clone --source minecraft-server \
  --snapshot pre-update-YYYYMMDD --name minecraft-server
```

Or restore the backed-up JAR:

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
ssh gsd@VM_IP "mv /opt/minecraft/server/fabric-server-launch.jar.bak /opt/minecraft/server/fabric-server-launch.jar"
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

After rollback, verify:

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

---

## Procedure 3: Minecraft Version Upgrade

**Risk: High** -- World format may change. ALL mods must be compatible with the new version. Once the world format is upgraded by Minecraft, you CANNOT downgrade the world. The only way back is a full snapshot restore.

**Estimated downtime:** 15-30+ minutes (longer for large worlds due to format conversion)

### Pre-Upgrade Compatibility Matrix

Before starting, verify ALL components have versions available for the target Minecraft version:

| Component | Must Match MC Version? | Where to Check |
|-----------|----------------------|----------------|
| Fabric Loader | Yes (download for target MC version) | fabricmc.net/use/server |
| Fabric API | Yes (version-specific releases) | modrinth.com/mod/fabric-api/versions |
| Syncmatica | Yes (version-specific releases) | modrinth.com/mod/syncmatica/versions |
| World format | Usually forward-compatible | minecraft.wiki changelog for target version |
| Java version | Check requirements | minecraft.wiki system requirements |

> **WARNING:** If ANY component does not have a version for the target Minecraft version, do NOT proceed. Wait until all components are available.

### Steps

**Step 1: Create a FULL backup including server JARs (not just world)**

```bash
ssh gsd@VM_IP "tar czf /opt/minecraft/backups/full-server-$(date +%Y%m%d).tar.gz /opt/minecraft/server/"
```

This preserves the complete server state -- JARs, configs, mods, and world.

**Step 2: Create a VM snapshot**

```bash
./infra/scripts/vm-lifecycle.sh snapshot --name minecraft-server \
  --snapshot pre-mc-upgrade-$(date +%Y%m%d)
```

This is your fastest rollback path.

**Step 3: Verify all components have compatible versions**

Confirm you have download URLs for:
- New Fabric server JAR (for target MC version)
- New Fabric API (for target MC version)
- New Syncmatica (for target MC version)

**Step 4: Stop the server**

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
```

**Step 5: Deploy new Minecraft + Fabric**

Update `infra/local/local-values.yaml` with:
- New `minecraft_version`
- New `fabric_loader_version`
- New mod versions and checksums

Then deploy:

```bash
./infra/scripts/deploy-minecraft.sh --target-host gsd@VM_IP
```

**Step 6: Deploy new mods**

```bash
./infra/scripts/deploy-mods.sh --target-host gsd@VM_IP
```

**Step 7: Start the server**

```bash
ssh gsd@VM_IP sudo systemctl start minecraft.service
```

> **CRITICAL:** Monitor the first startup carefully. Minecraft will upgrade the world format automatically, which can be slow for large worlds. Do NOT interrupt this process.

**Step 8: Monitor the startup**

```bash
ssh gsd@VM_IP journalctl -u minecraft.service -f
```

Watch for:
- World conversion messages (normal -- may take several minutes for large worlds)
- `Done (X.XXXs)!` message (startup complete)
- Errors or crashes (if these occur, proceed to rollback)

**Step 9: Verify the update**

```bash
# Health check
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP

# Check mod versions in logs
ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -iE "fabric loader|fabric api|syncmatica"

# Check TPS (should be at baseline)
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human

# Verify mod manifest matches installed versions
ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
```

**Step 10: Walk through the Knowledge World**

Connect with a client running the matching new versions. Visit key areas of the Knowledge World to verify:
- Builds are intact (no missing blocks or terrain glitches)
- Signs are readable
- Redstone mechanisms work (if any)
- Schematic placements are correct

**Step 11: Create a new golden image**

```bash
./infra/scripts/golden-image.sh create --source minecraft-server
```

**Step 12: Update version history**

Record the upgrade in the [Version History](#version-history) table at the bottom of this document.

### Rollback

> **WARNING:** Once Minecraft upgrades the world format, you CANNOT downgrade the world by simply reverting to an older Minecraft version. The snapshot restore is the ONLY safe way to roll back a Minecraft version upgrade.

**Step 1: Stop the server**

```bash
ssh gsd@VM_IP sudo systemctl stop minecraft.service
```

**Step 2: Revert to the pre-upgrade snapshot**

```bash
./infra/scripts/vm-lifecycle.sh clone --source minecraft-server \
  --snapshot pre-mc-upgrade-YYYYMMDD --name minecraft-server
```

**Step 3: Verify the old version runs correctly**

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

**Step 4: Investigate why the upgrade failed**

Check the logs from the failed upgrade attempt (if they were captured before the snapshot revert). Common causes:
- Mod incompatibility with new MC version
- World format conversion failure
- Java version incompatibility

---

## Test Procedure: Verifying This Update Process Works

This section satisfies requirement **OPS-13** by documenting how to verify the update procedure itself on a real version bump.

### Test: Mod Version Bump

This is the lowest-risk test of the update process.

**Step 1: Check if a mod update is available:**

```bash
./infra/scripts/check-mod-updates.sh --manifest /opt/minecraft/server/mod-manifest.yaml
```

**Step 2a: If an update IS available (exit code 2)**

Perform [Procedure 1: Mod-Only Update](#procedure-1-mod-only-update-fabric-api-or-syncmatica) using the available update. This tests the real update workflow end-to-end.

**Step 2b: If NO update is available (exit code 0)**

Simulate an update cycle by redeploying the current mods:

1. Complete the pre-update checklist (backup + snapshot)

2. Stop the server:

   ```bash
   ssh gsd@VM_IP sudo systemctl stop minecraft.service
   ```

3. Remove the current Fabric API JAR:

   ```bash
   ssh gsd@VM_IP rm /opt/minecraft/server/mods/fabric-api-*.jar
   ```

4. Redeploy using deploy-mods.sh:

   ```bash
   ./infra/scripts/deploy-mods.sh --target-host gsd@VM_IP
   ```

5. Start the server:

   ```bash
   ssh gsd@VM_IP sudo systemctl start minecraft.service
   ```

6. Verify the mod was reinstalled and the server is healthy:

   ```bash
   ssh gsd@VM_IP journalctl -u minecraft.service -n 50 --no-pager | grep -i "fabric api"
   ./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
   ```

### Test: Verification Commands

After any update (real or simulated), ALL of the following must succeed:

```bash
# Health check passes (exit code 0)
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
echo "Health check exit code: $?"

# TPS is at or near 20
./infra/scripts/collect-minecraft-metrics.sh --target-host gsd@VM_IP --output human

# Server log shows all mods loaded
ssh gsd@VM_IP journalctl -u minecraft.service -n 100 --no-pager | grep -iE "loading fabric|syncmatica"

# Mod manifest matches what is actually installed
ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
ssh gsd@VM_IP ls -la /opt/minecraft/server/mods/
```

If any of these checks fail, the update should be rolled back using the appropriate rollback procedure.

### Test: Rollback Verification

To verify the rollback process works:

1. After a successful test update, deliberately trigger a rollback:

   ```bash
   ./infra/scripts/vm-lifecycle.sh clone --source minecraft-server \
     --snapshot pre-update-YYYYMMDD --name minecraft-server
   ```

2. Verify the server is back to the pre-update state:

   ```bash
   ./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
   ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml
   ```

3. Re-apply the update to leave the server on the latest versions.

---

## Emergency: Update Goes Wrong

If an update causes problems and the normal rollback procedure fails (snapshot corrupt, VM issues):

**Option 1: Rebuild from golden image + latest backup (under 5 minutes)**

```bash
./infra/scripts/rapid-rebuild.sh --mode clone --name minecraft-server
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/LATEST_BACKUP.tar.gz --force
```

> **NOTE:** The golden image contains the PRE-update server. After rebuilding, you will be on the old versions. This is expected -- it is a rollback.

**Option 2: Full scratch rebuild (under 20 minutes)**

```bash
./infra/scripts/rapid-rebuild.sh --mode scratch --name minecraft-server
./infra/scripts/restore-world.sh /opt/minecraft/backups/hourly/LATEST_BACKUP.tar.gz --force
```

This performs a complete PXE boot installation and server deployment from scratch.

**After emergency recovery:**

```bash
# Verify
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP

# Create a new golden image from the recovered state
./infra/scripts/golden-image.sh create --source minecraft-server
```

---

## Version History

Track all updates applied to the Knowledge World server. Update this table after each successful version change.

| Date | Component | From Version | To Version | Procedure | Result | Notes |
|------|-----------|-------------|------------|-----------|--------|-------|
| YYYY-MM-DD | Fabric API | 0.97.0 | (new) | Mod-Only | (result) | (notes) |
| YYYY-MM-DD | Syncmatica | 0.3.11 | (new) | Mod-Only | (result) | (notes) |
| YYYY-MM-DD | Fabric Loader | 0.16.9 | (new) | Loader | (result) | (notes) |
| YYYY-MM-DD | Minecraft | 1.21.4 | (new) | MC Upgrade | (result) | (notes) |

---

## Related Runbooks

- [Day-1 Deployment Runbook](runbook-day-1-deployment.md) -- Full deployment from scratch
- [Day-2 Operations Runbook](runbook-day-2-operations.md) -- Daily maintenance procedures
- [Incident Response Runbook](runbook-incident-response.md) -- Troubleshooting and resolution
