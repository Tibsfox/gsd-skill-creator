# Day-1 Runbook: Full Knowledge World Deployment

## Overview

This runbook walks you through deploying the complete Minecraft Knowledge World server from bare metal to a verified, running system. By the end, you will have:

- A CentOS Stream 9 VM provisioned via PXE boot
- A Minecraft Fabric server running as a systemd service
- Fabric API and Syncmatica mods installed
- Server configuration (creative mode, peaceful, whitelist enforced)
- Monitoring (node_exporter, JMX exporter, custom metrics, alerts)
- Automated hourly/daily/weekly backups with RCON quiesce
- A golden image for rapid rebuild (<5 minutes)
- Full health verification (12 checks passing)

**Estimated time:** 45-60 minutes

**Skill prerequisites:** Basic Linux command line, SSH access, understanding of systemd services

**Conventions used in this runbook:**

- `VM_IP` -- the IP address of the Minecraft VM (you will discover this during provisioning)
- All commands are run from the repository root directory unless otherwise noted
- Commands prefixed with `ssh gsd@VM_IP` run on the Minecraft VM
- All scripts are referenced by their relative path from the repository root

---

## Prerequisites

### Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 16 GB | 32 GB+ |
| CPU | VT-x or AMD-V enabled | 4+ cores |
| Storage | 100 GB free | 200 GB+ |
| Network | Ethernet (management network) | Dedicated PXE range |

### Software Requirements

- Linux host running a Tier 1 distribution:
  - CentOS Stream 9
  - Fedora 39+
  - Ubuntu 22.04+
- Git (to clone the repository)
- `curl`, `jq`, `tar`, `ssh`, `scp` installed
- Root or sudo access on the infrastructure host

### Network Requirements

- Management network accessible from the host
- DHCP range available for PXE provisioning (default: 192.168.122.200-250)
- No conflicting DHCP servers on the PXE network segment

### Repository Setup

```bash
git clone <repository-url> gsd-skill-creator
cd gsd-skill-creator
```

Verify the infra directory structure:

```bash
ls infra/scripts/
# Should show: discover-all.sh, calculate-budget.sh, deploy-pxe.sh, etc.
```

---

## Step 1: Hardware Discovery and Resource Budget

**Purpose:** Detect host hardware capabilities and calculate VM resource allocations.

### Run Hardware Discovery

```bash
./infra/scripts/discover-all.sh
```

**Expected output:**

- `infra/inventory/hardware-capabilities.yaml` (sanitized, safe for git)
- `infra/local/hardware-capabilities-local.yaml` (full values, gitignored)

The script discovers CPU, memory, storage, GPU, hypervisor, audio, network, USB, and distribution information. It validates YAML output if PyYAML is installed.

### Verify Discovery Results

```bash
# Check that virtualization is enabled
grep 'virtualization:' infra/inventory/hardware-capabilities.yaml
# Should show: virtualization: true

# Check minimum RAM (16 GB required)
grep 'total_gb:' infra/inventory/hardware-capabilities.yaml
# Should show: total_gb: 16 (or higher)

# Check that the system meets minimum requirements
grep 'meets_minimum:' infra/inventory/hardware-capabilities.yaml
# Should show: meets_minimum: true
```

### Calculate Resource Budget

```bash
./infra/scripts/calculate-budget.sh infra/local/hardware-capabilities-local.yaml
```

**Expected output:** `infra/local/resource-budget.yaml`

This script allocates resources according to these rules:
- Host OS reserved: 4 GB RAM + 2 CPU cores (non-negotiable floor)
- Minecraft VM: up to 50% of remaining resources, capped at 16 GB RAM and 8 cores
- Three tiers: minimal (16 GB), comfortable (32 GB), generous (64 GB+)

**What to verify:** The VM allocation leaves at least 4 GB RAM and 2 cores for the host.

```bash
grep 'host_reserved_ram_gb\|minecraft_ram_gb' infra/local/resource-budget.yaml
```

### Troubleshooting

- **"minimum requirements not met" (exit 1):** Your system has less than 16 GB RAM or virtualization is disabled. Enable VT-x/AMD-V in BIOS and ensure sufficient RAM.
- **No VT-x detected:** Check BIOS settings. On Intel systems, look for "Intel Virtualization Technology." On AMD, look for "SVM Mode."

---

## Step 2: Generate Local Values

**Purpose:** Create a unified configuration file that all downstream scripts consume.

```bash
./infra/scripts/generate-local-values.sh
```

**Expected output:** `infra/local/local-values.yaml`

This file contains 10 configuration sections: system, resources, minecraft, network, gpu, audio, hypervisor, distro, and capabilities. All downstream scripts (deploy-minecraft.sh, deploy-server-config.sh, etc.) read from this file.

### Verify the Output

```bash
# Check that all major sections exist
grep -c '^[a-z]' infra/local/local-values.yaml
# Should show 9-10 top-level sections

# Verify minecraft section has JVM settings
grep -A5 '^minecraft:' infra/local/local-values.yaml

# Verify network section
grep -A5 '^network:' infra/local/local-values.yaml
```

### Security Check

```bash
# Verify infra/local/ is gitignored (contains machine-specific data)
git check-ignore infra/local/local-values.yaml
# Should show the file path (meaning it is gitignored)
```

### Troubleshooting

- **Missing capabilities file:** Run `./infra/scripts/discover-all.sh` first.
- **Missing budget file:** The script auto-runs `calculate-budget.sh` if needed.

---

## Step 3: PXE Boot Infrastructure

**Purpose:** Set up the network boot environment for automated VM provisioning.

### Download CentOS Boot Media

```bash
./infra/scripts/download-centos-boot-media.sh
```

This downloads the CentOS Stream 9 kernel and initrd images needed for PXE booting.

### Set Up TFTP Root

```bash
./infra/scripts/setup-tftp-root.sh
```

This creates the TFTP directory structure and copies boot files into place.

### Deploy PXE Configuration

```bash
./infra/scripts/deploy-pxe.sh
```

**Expected output:** dnsmasq configured and running, TFTP serving boot files.

### Verify PXE Infrastructure

```bash
# Check dnsmasq is running
systemctl status dnsmasq

# Verify DHCP range is scoped correctly (default: 192.168.122.200-250)
grep 'dhcp-range' /etc/dnsmasq.d/gsd-pxe.conf 2>/dev/null || echo "Check dnsmasq configuration"

# Verify TFTP is serving files
ls /var/lib/tftpboot/pxelinux/ 2>/dev/null || echo "Check TFTP root"
```

### Troubleshooting

- **Port 69 (TFTP) already in use:** Another TFTP server is running. Stop it with `systemctl stop tftp` or reconfigure.
- **DHCP conflict:** If another DHCP server exists on the same network, PXE clients may get leases from the wrong server. Scope the PXE DHCP range to an unused subnet or use `bind-interfaces` with a specific interface.

---

## Step 4: Kickstart Preparation

**Purpose:** Render automated installation scripts for unattended CentOS installation.

```bash
./infra/scripts/deploy-kickstart.sh
```

**Expected output:** Rendered kickstart files from templates with all configuration values substituted.

### Verify Kickstart Files

```bash
# Check for unresolved template variables
grep -r '${' infra/output/kickstart/ 2>/dev/null || echo "No unresolved variables (good)"
```

If any `${VARIABLE}` patterns remain, a values file is missing or incomplete. Re-run `generate-local-values.sh` and then `deploy-kickstart.sh`.

### Troubleshooting

- **Unresolved variables:** Verify `infra/local/local-values.yaml` exists and contains all required sections.

---

## Step 5: VM Provisioning

**Purpose:** Create and install a CentOS Stream 9 VM via PXE boot.

```bash
./infra/scripts/provision-vm.sh --mode fresh --name minecraft-server
```

To use a custom values file:

```bash
./infra/scripts/provision-vm.sh --mode fresh --name minecraft-server --values infra/local/local-values.yaml
```

**Expected output:** A running VM with CentOS Stream 9 installed, SSH accessible.

**Timing target:** Approximately 10-12 minutes for fresh PXE install.

### Verify the VM

```bash
# Check VM status
./infra/scripts/vm-lifecycle.sh status --name minecraft-server

# Verify SSH access (replace VM_IP with actual IP)
ssh gsd@VM_IP "hostname && cat /etc/centos-release"
```

### Troubleshooting

- **VM not booting:** Check that PXE infrastructure is running (`systemctl status dnsmasq`).
- **SSH not accessible:** Wait 1-2 minutes after installation completes. The first-boot hook needs time to configure networking.
- **Wrong OS version:** Verify the kickstart points to CentOS Stream 9 repositories.

---

## Step 6: Minecraft Server Deployment

**Purpose:** Install the Fabric Minecraft server as a systemd service.

```bash
./infra/scripts/deploy-minecraft.sh --target-host gsd@VM_IP
```

To use custom configuration:

```bash
./infra/scripts/deploy-minecraft.sh --target-host gsd@VM_IP --values infra/local/local-values.yaml
```

**Expected output:** Fabric server downloaded, JVM flags configured, systemd service installed and started.

The script performs 10 steps:
1. Validate prerequisites (Java 21, SSH, templates)
2. Load configuration from local-values
3. Download Fabric installer
4. Render JVM flags from template (heap, GC type)
5. Render systemd service from template
6. Deploy server files to target
7. Install JVM flags and systemd service
8. Open firewall ports (25565/tcp game, 25575/tcp RCON)
9. Start server and verify
10. Print deployment summary

### Verify Minecraft Server

```bash
# Check systemd service status
ssh gsd@VM_IP systemctl status minecraft.service

# Check server logs for "Done" message (server fully started)
ssh gsd@VM_IP journalctl -u minecraft.service --no-pager -n 20 | grep -i "done"
```

### Troubleshooting

- **Java not found:** The kickstart should install `java-21-openjdk-headless`. If missing: `ssh gsd@VM_IP sudo dnf install -y java-21-openjdk-headless`
- **Fabric download fails:** Check internet connectivity from the VM. The script downloads from `meta.fabricmc.net`.
- **Server fails to start:** Check logs with `ssh gsd@VM_IP journalctl -u minecraft.service -n 100`. Common issues: EULA not accepted, wrong Java version, port already in use.

---

## Step 7: Mod Stack Installation

**Purpose:** Install Fabric API and Syncmatica mods with version-pinned checksums.

```bash
./infra/scripts/deploy-mods.sh --local-values infra/local/syncmatica.local-values --server-dir /opt/minecraft/server
```

If deploying remotely, copy the local-values to the VM first, or run with `--server-dir` pointing to the correct directory.

**Expected output:**
- Fabric API and Syncmatica JARs installed in `/opt/minecraft/server/mods/`
- `mod-manifest.yaml` created at `/opt/minecraft/server/mod-manifest.yaml`
- Syncmatica config at `/opt/minecraft/server/config/syncmatica/syncmatica-server.properties`

### Verify Mod Installation

```bash
# Check mod JAR files exist
ssh gsd@VM_IP ls -la /opt/minecraft/server/mods/

# Check mod manifest
ssh gsd@VM_IP cat /opt/minecraft/server/mod-manifest.yaml

# Restart server to load mods
ssh gsd@VM_IP sudo systemctl restart minecraft.service

# Verify mods loaded in server log
ssh gsd@VM_IP journalctl -u minecraft.service --no-pager -n 50 | grep -i "fabric\|syncmatica"
```

### Troubleshooting

- **Modrinth API failure:** Check internet connectivity. The script queries `api.modrinth.com` for mod downloads.
- **Checksum mismatch:** The SHA-256 in your local-values may be outdated. Run `./infra/scripts/check-mod-updates.sh` to find current versions.

---

## Step 8: Server Configuration

**Purpose:** Render and deploy server.properties with creative mode, peaceful difficulty, whitelist enforcement, and RCON.

```bash
./infra/scripts/deploy-server-config.sh --values infra/local/local-values.yaml
```

**Expected output:**
- `infra/output/minecraft/server.properties` rendered from template
- `infra/output/minecraft/whitelist.json` initial empty whitelist
- RCON password generated (or read) from `infra/local/minecraft-secrets.yaml`

Deploy the rendered files to the VM:

```bash
scp infra/output/minecraft/server.properties gsd@VM_IP:/opt/minecraft/server/
scp infra/output/minecraft/whitelist.json gsd@VM_IP:/opt/minecraft/server/
ssh gsd@VM_IP sudo chown minecraft:minecraft /opt/minecraft/server/server.properties /opt/minecraft/server/whitelist.json
ssh gsd@VM_IP sudo systemctl restart minecraft.service
```

### Verify Server Configuration

```bash
# Check game mode and difficulty
ssh gsd@VM_IP grep -E 'gamemode|difficulty|white-list|enable-rcon' /opt/minecraft/server/server.properties
# Expected:
#   gamemode=creative
#   difficulty=peaceful
#   white-list=true
#   enforce-whitelist=true
#   enable-rcon=true
```

### Troubleshooting

- **Missing template:** Verify `infra/templates/minecraft/server.properties.template` exists.
- **Missing local-values:** Run `./infra/scripts/generate-local-values.sh` first.

---

## Step 9: Monitoring Setup

**Purpose:** Install exporters for Prometheus metrics and deploy alert rules.

### Deploy Exporters

```bash
./infra/monitoring/exporters/deploy-exporters.sh --target-host gsd@VM_IP
```

This installs:
- **node_exporter** on port 9100 (system metrics: CPU, memory, disk, network)
- **JMX exporter** on port 9404 as a Java agent (JVM metrics: heap, GC, threads)

The JMX exporter attaches to the Minecraft JVM and activates on the next `minecraft.service` restart.

### Deploy Custom Metrics Collector

Set up the custom Minecraft metrics collector for TPS, player count, world size, chunks, entities, and mod status:

```bash
# Test the collector manually first
ssh gsd@VM_IP ./infra/scripts/collect-minecraft-metrics.sh --local --output human

# Set up cron job for continuous collection via textfile collector
ssh gsd@VM_IP "echo '* * * * * minecraft /opt/minecraft/scripts/collect-minecraft-metrics.sh --local --textfile-dir /var/lib/node_exporter/textfile_collector/' | sudo tee /etc/cron.d/minecraft-metrics"
```

### Deploy Alert Rules

```bash
./infra/monitoring/alerts/deploy-alerts.sh --target-host gsd@VM_IP
```

This deploys Prometheus alerting rules for:
- TPS degradation (< 18 warning, < 15 critical)
- Memory pressure (> 90% heap usage)
- Disk space low
- Backup staleness (> 2 hours since last backup)
- Server unreachable

### Verify Monitoring

```bash
# Check node_exporter is running
ssh gsd@VM_IP "curl -s http://localhost:9100/metrics | head -5"
# Should return Prometheus metric lines

# Check JMX exporter (after minecraft.service restart)
ssh gsd@VM_IP sudo systemctl restart minecraft.service
sleep 30
ssh gsd@VM_IP "curl -s http://localhost:9404/metrics | head -5"
# Should return JVM metric lines
```

### Troubleshooting

- **Port 9100 not listening:** Check `systemctl status node_exporter` on the VM.
- **Port 9404 not listening:** JMX exporter activates only after `minecraft.service` restart. Restart the service and wait 30 seconds.

---

## Step 10: Backup Configuration

**Purpose:** Set up automated world backups with RCON quiesce and rotation.

### Render and Install Backup Cron

The backup system uses `backup-world.sh` with RCON-based server quiesce (save-all flush, save-off / save-on), SHA-256 checksum verification, and time-based rotation (24 hourly, 7 daily, 4 weekly).

```bash
# Deploy the backup cron template
# Hourly backups at minute 15
ssh gsd@VM_IP "echo '15 * * * * root /opt/minecraft/scripts/backup-world.sh --type hourly --secrets /opt/minecraft/secrets.yaml' | sudo tee /etc/cron.d/minecraft-backup-hourly"

# Daily backup at 03:00
ssh gsd@VM_IP "echo '0 3 * * * root /opt/minecraft/scripts/backup-world.sh --type daily --secrets /opt/minecraft/secrets.yaml' | sudo tee /etc/cron.d/minecraft-backup-daily"

# Weekly backup on Sunday at 04:00
ssh gsd@VM_IP "echo '0 4 * * 0 root /opt/minecraft/scripts/backup-world.sh --type weekly --secrets /opt/minecraft/secrets.yaml' | sudo tee /etc/cron.d/minecraft-backup-weekly"
```

### Run a Test Backup

```bash
# Dry run first to see what would happen
ssh gsd@VM_IP /opt/minecraft/scripts/backup-world.sh --dry-run --type hourly

# Run an actual backup
ssh gsd@VM_IP /opt/minecraft/scripts/backup-world.sh --type hourly --secrets /opt/minecraft/secrets.yaml
```

**Expected output:** A tar.gz archive in `/opt/minecraft/backups/hourly/` with a `.sha256` checksum sidecar and `last-backup-status.yaml` updated.

### Verify Backup

```bash
# Check backup files exist
ssh gsd@VM_IP ls -la /opt/minecraft/backups/hourly/

# Check backup status
ssh gsd@VM_IP cat /opt/minecraft/backups/last-backup-status.yaml
```

### Troubleshooting

- **RCON not available:** Backup proceeds without quiesce (data may be inconsistent). Ensure RCON is enabled in server.properties and the secrets file exists.
- **World directory empty:** The server must have started at least once to generate world data.

---

## Step 11: Golden Image Creation

**Purpose:** Create a versioned snapshot for rapid rebuild (<5 minutes).

```bash
./infra/scripts/golden-image.sh create --source minecraft-server --target-host gsd@VM_IP
```

**Expected output:**
- Golden snapshot created (named `golden-YYYYMMDD-HHMMSS`)
- Version manifest saved to `infra/local/golden-images/`
- Latest manifest symlink updated

The script:
1. Validates source VM exists
2. Gathers version information (CentOS, kernel, Java, Fabric, Minecraft, mods)
3. Checks backup state
4. Runs health check on source VM
5. Stops VM, creates snapshot, restarts VM
6. Renders version manifest
7. Reports summary

### Verify Golden Image

```bash
# List available golden images
./infra/scripts/golden-image.sh list --source minecraft-server

# Show manifest details
./infra/scripts/golden-image.sh info
```

### Troubleshooting

- **Health check fails:** Use `--force` to create the image anyway, or fix the health issues first.
- **Snapshot fails:** Ensure the hypervisor supports snapshots and the VM has enough disk space.

---

## Step 12: Verification

**Purpose:** Run comprehensive verification to confirm everything works.

### Full Pipeline Verification

```bash
./infra/scripts/verify-pipeline.sh --mode full
```

This validates the complete PXE-to-playing pipeline against requirements:
- MC-11: PXE boot to running server in under 20 minutes
- MC-12: Syncmatica schematic sharing
- MC-13: Server maintains 20 TPS

### Health Check

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP
```

**Expected output:** All 12 health checks pass (exit code 0).

The health check validates:
1. **systemd service** -- minecraft.service active + enabled
2. **Java process** -- Running as minecraft user with correct JAR
3. **JVM heap** -- Actual usage vs configured maximum
4. **Game port** -- 25565/tcp listening
5. **RCON port** -- 25575/tcp listening
6. **Firewall** -- Game port open in firewall
7. **Server log** -- "Done" message present, no fatal errors
8. **Disk space** -- Sufficient free space on /opt/minecraft
9. **Node exporter** -- Port 9100 responding with metrics
10. **JMX exporter** -- Port 9404 responding (WARN if not yet attached)
11. **Backup freshness** -- Last backup within 2 hours
12. **Known failures** -- No OOM, missing JAR, port binding, or mod mismatch patterns

For JSON output (useful for scripting):

```bash
./infra/scripts/check-minecraft-health.sh --target-host gsd@VM_IP --json
```

### Troubleshooting

- **FAIL on any check:** The health check output explains what failed. Address each failure and re-run.
- **WARN on JMX exporter:** This is normal before the first `minecraft.service` restart after exporter deployment.

---

## Post-Deployment Checklist

Use this checklist to confirm all steps are complete:

- [ ] Hardware discovery completed (`infra/inventory/hardware-capabilities.yaml` exists)
- [ ] Resource budget calculated (`infra/local/resource-budget.yaml` exists)
- [ ] Local values generated (`infra/local/local-values.yaml` exists)
- [ ] PXE infrastructure running (`systemctl status dnsmasq` shows active)
- [ ] Kickstart files rendered (no unresolved `${` variables)
- [ ] VM provisioned and SSH accessible (`ssh gsd@VM_IP` works)
- [ ] Minecraft server running (`systemctl status minecraft.service` shows active)
- [ ] Mods installed (`mod-manifest.yaml` lists Fabric API + Syncmatica)
- [ ] Server config deployed (creative mode, peaceful, whitelist enforced, RCON enabled)
- [ ] node_exporter running (port 9100 responding)
- [ ] JMX exporter attached (port 9404 responding after restart)
- [ ] Alert rules deployed
- [ ] Backup cron jobs installed
- [ ] First manual backup completed successfully
- [ ] Golden image created
- [ ] Full health check passes (all 12 checks: exit code 0)
- [ ] Pipeline verification passes (`verify-pipeline.sh --mode full`)

---

## Quick Reference: Script Locations

| Script | Path | Purpose |
|--------|------|---------|
| discover-all.sh | `./infra/scripts/discover-all.sh` | Unified hardware discovery |
| calculate-budget.sh | `./infra/scripts/calculate-budget.sh` | Resource budget calculator |
| generate-local-values.sh | `./infra/scripts/generate-local-values.sh` | Adaptive configuration generator |
| deploy-pxe.sh | `./infra/scripts/deploy-pxe.sh` | PXE boot infrastructure |
| deploy-kickstart.sh | `./infra/scripts/deploy-kickstart.sh` | Kickstart file renderer |
| render-pxe-menu.sh | `./infra/scripts/render-pxe-menu.sh` | General-purpose template renderer |
| provision-vm.sh | `./infra/scripts/provision-vm.sh` | VM provisioning orchestrator |
| vm-lifecycle.sh | `./infra/scripts/vm-lifecycle.sh` | VM lifecycle manager (start/stop/snapshot/clone) |
| deploy-minecraft.sh | `./infra/scripts/deploy-minecraft.sh` | Fabric server deployment |
| deploy-mods.sh | `./infra/scripts/deploy-mods.sh` | Mod deployment (Fabric API + Syncmatica) |
| deploy-server-config.sh | `./infra/scripts/deploy-server-config.sh` | Server configuration renderer |
| manage-whitelist.sh | `./infra/scripts/manage-whitelist.sh` | Whitelist management (add/remove/list/sync) |
| backup-world.sh | `./infra/scripts/backup-world.sh` | World backup with RCON quiesce |
| restore-world.sh | `./infra/scripts/restore-world.sh` | World restore from backup |
| check-minecraft-health.sh | `./infra/scripts/check-minecraft-health.sh` | 12-check health validator |
| check-mod-updates.sh | `./infra/scripts/check-mod-updates.sh` | Read-only mod version checker |
| collect-minecraft-metrics.sh | `./infra/scripts/collect-minecraft-metrics.sh` | Custom Minecraft metrics collector |
| golden-image.sh | `./infra/scripts/golden-image.sh` | Golden image lifecycle manager |
| rapid-rebuild.sh | `./infra/scripts/rapid-rebuild.sh` | Rapid server rebuild orchestrator |
| verify-pipeline.sh | `./infra/scripts/verify-pipeline.sh` | End-to-end pipeline verification |
| deploy-exporters.sh | `./infra/monitoring/exporters/deploy-exporters.sh` | Prometheus exporter deployment |
| deploy-alerts.sh | `./infra/monitoring/alerts/deploy-alerts.sh` | Alert rules deployment |

---

## Architecture Diagram

```
 Infrastructure Host
 +--------------------------------------------------+
 |                                                    |
 |  PXE/TFTP (dnsmasq)     Prometheus (optional)     |
 |  192.168.122.1           localhost:9090            |
 |       |                       |                    |
 +-------|-------+               |                    |
         |       |               |                    |
    PXE Boot     |  Scrape Metrics                    |
         |       |     :9100 :9404                    |
         v       |         |                          |
 +-------|-------|---------|--------------------------+
 | Minecraft VM (minecraft-server)                    |
 |                                                    |
 |  CentOS Stream 9                                   |
 |  Java 21 (OpenJDK)                                 |
 |                                                    |
 |  +----------------------------------------------+  |
 |  | minecraft.service (systemd)                  |  |
 |  |                                              |  |
 |  |  Fabric Server (fabric-server-launch.jar)    |  |
 |  |    +- Fabric API                             |  |
 |  |    +- Syncmatica                             |  |
 |  |                                              |  |
 |  |  Ports:                                      |  |
 |  |    25565/tcp  Game (player connections)       |  |
 |  |    25575/tcp  RCON (remote management)        |  |
 |  +----------------------------------------------+  |
 |                                                    |
 |  /opt/minecraft/                                   |
 |    server/          Server JARs, configs, world    |
 |      world/         Minecraft world data           |
 |      mods/          Fabric API + Syncmatica JARs   |
 |      mod-manifest.yaml  Installed mod versions     |
 |      jvm-flags.conf     JVM heap + GC settings     |
 |    backups/         Automated backup archives      |
 |      hourly/        24 retained                    |
 |      daily/         7 retained                     |
 |      weekly/        4 retained                     |
 |                                                    |
 |  Monitoring:                                       |
 |    node_exporter      :9100 (system metrics)       |
 |    JMX exporter       :9404 (JVM metrics)          |
 |    textfile collector  Custom Minecraft metrics     |
 |                                                    |
 |  Golden Images:                                    |
 |    VM snapshots for <5 minute rebuild              |
 |    Manifests in infra/local/golden-images/         |
 +----------------------------------------------------+

 Backup Flow:
   cron -> backup-world.sh -> RCON save-all/save-off
        -> tar world/ -> SHA-256 checksum
        -> RCON save-on -> rotate old backups

 Rebuild Paths:
   Clone:   golden-image.sh clone  -> <5 minutes  (OPS-08)
   Scratch: rapid-rebuild.sh       -> <20 minutes (OPS-09)
```

---

## Quick Recovery

If something goes wrong partway through deployment, you have two options:

### Option A: Continue from where you left off

Each step is idempotent. Re-run the failed step's command and continue from there.

### Option B: Start over completely

```bash
# Destroy the existing VM
./infra/scripts/vm-lifecycle.sh destroy --name minecraft-server --force

# Re-provision from scratch
./infra/scripts/rapid-rebuild.sh --mode scratch --name minecraft-server
```

The scratch rebuild path runs the full PXE provisioning, Minecraft deployment, mod installation, and health verification in a single command (target: under 20 minutes).

### Option C: Rebuild from golden image (if one exists)

```bash
./infra/scripts/rapid-rebuild.sh --mode clone --name minecraft-server \
  --restore-backup /opt/minecraft/backups/hourly/LATEST_BACKUP.tar.gz
```

This clones from the golden image and restores the latest world backup (target: under 5 minutes).
