# Integration Verification: PXE-to-Playing Pipeline

Complete documentation for verifying the end-to-end Minecraft server provisioning pipeline, including performance validation and troubleshooting guidance.

## 1. Overview

### Purpose

Verify the complete PXE boot to playable Minecraft server pipeline. The `verify-pipeline.sh` script automates validation across all pipeline stages, from infrastructure prerequisites through runtime performance measurement.

### Requirements Addressed

| Requirement | Description | Target | Verification Mode |
|-------------|-------------|--------|-------------------|
| MC-11 | PXE boot to running server | < 20 minutes | `--mode provision` |
| MC-12 | Syncmatica schematic sharing | < 30 seconds | `--mode performance` |
| MC-13 | Server TPS with 2 clients | >= 20 TPS | `--mode performance` |

### When to Run

- **After completing Phases 174-176** (Minecraft server mod stack, configuration, client setup)
- **Before starting Phase 186** (Knowledge World content creation)
- **After any infrastructure change** (PXE config, kickstart template, VM sizing, mod updates)
- **During initial deployment** to establish baseline measurements
- **Periodically** to detect performance regression

## 2. Prerequisites

### Hardware

- Host machine with hardware virtualization enabled (Intel VT-x or AMD-V)
- Minimum 16GB RAM (32GB+ recommended for comfortable VM hosting)
- At least 50GB free storage for VM disk image
- CPU with 4+ cores (8+ recommended)

### Infrastructure Phases

The following phases must be complete before running integration verification:

| Phase | Name | What It Provides |
|-------|------|------------------|
| 169 | Hardware Discovery | `hardware-capabilities.yaml`, `resource-budget.yaml` |
| 170 | PXE Boot Infrastructure | dnsmasq, TFTP root, boot menus |
| 171 | Base Image and Kickstart | Kickstart templates, first-boot framework |
| 172 | VM Provisioning Automation | `provision-vm.sh`, `vm-lifecycle.sh` |
| 173 | Minecraft Server Foundation | `deploy-minecraft.sh`, systemd service |
| 174 | Mod Stack Management | `deploy-mods.sh`, Fabric + Syncmatica |
| 175 | Server Configuration | `deploy-server-config.sh`, server.properties |
| 176 | Client Setup | Client mod pack, Prism Launcher profile |

### Software

| Tool | Required | Purpose |
|------|----------|---------|
| `bash` 4.0+ | Yes | Script execution |
| `ssh` | Yes (provision/performance) | VM access after provisioning |
| `mcrcon` | Recommended | RCON queries for TPS and memory |
| `python3` | Fallback | RCON queries if `mcrcon` unavailable |
| KVM/libvirt or VMware | Yes (provision) | Hypervisor for VM creation |

### Network

- Management network accessible from host (default: `virbr0` / 192.168.122.0/24)
- DHCP/PXE range configured (192.168.122.200-250)
- HTTP server for kickstart files (or kickstart rendered to accessible location)

## 3. Quick Start

```bash
# Validate prerequisites (safe, no side effects)
./infra/scripts/verify-pipeline.sh --mode dry-run

# Run full provisioning pipeline (creates and destroys a verification VM)
./infra/scripts/verify-pipeline.sh --mode provision --cleanup

# Test performance on an existing server
./infra/scripts/verify-pipeline.sh --mode performance \
    --server-ip 192.168.122.100 \
    --rcon-password SECRET

# Full end-to-end (provision + performance)
./infra/scripts/verify-pipeline.sh --mode full \
    --cleanup \
    --rcon-password SECRET

# Verbose output for debugging failures
./infra/scripts/verify-pipeline.sh --mode dry-run --verbose
```

### Command Reference

```
Usage: verify-pipeline.sh [--mode MODE] [options]

Modes:
  dry-run      Validate structure and prerequisites (default)
  provision    Run full PXE-to-running-server pipeline (MC-11)
  performance  Validate runtime performance (MC-12, MC-13)
  full         Run provision + performance back-to-back

Options:
  --mode MODE             dry-run | provision | performance | full
  --server-ip IP          Server IP for performance mode
  --server-name VM_NAME   Alternative to --server-ip
  --rcon-password PASS    RCON password for server queries
  --rcon-port PORT        RCON port (default: 25575)
  --cleanup               Destroy verification VM after provision mode
  --values PATH           Local-values file override
  --timeout SECONDS       Max wait for provisioning (default: 1200)
  --verbose               Show all command output
  --help                  Show help
```

## 4. Performance Verification Checklist

Print this section and complete it during verification runs. Fill in measured values in the blank fields.

---

### MC-11: PXE Boot to Running Server < 20 Minutes

- [ ] PXE boot menu appears within 30 seconds of VM start
- [ ] Kickstart installation begins automatically (no manual interaction)
- [ ] CentOS Stream 9 installs to disk (base packages + Minecraft role)
- [ ] First-boot service runs (Java 21 verification, directory setup)
- [ ] Minecraft Fabric server starts via systemd
- [ ] Server log shows "Done" message (world generation complete)
- [ ] Total time from `provision-vm.sh --mode fresh` to server ready: _____ minutes
- [ ] **PASS: Total time < 20 minutes**

### MC-12: Syncmatica Schematic Sharing < 30 Seconds

- [ ] Client A connects with Fabric + Syncmatica installed
- [ ] Client B connects with Fabric + Syncmatica installed
- [ ] Client A creates or loads a test schematic in Litematica
- [ ] Client A uploads schematic to server via Syncmatica
- [ ] Client B sees schematic in Syncmatica shared list
- [ ] Client B downloads and places schematic in Litematica
- [ ] Time from upload to visible on Client B: _____ seconds
- [ ] **PASS: Sharing time < 30 seconds**

### MC-13: Server Maintains 20 TPS with 2 Clients

- [ ] Server TPS at baseline (no clients): _____ TPS
- [ ] Client A connects and moves around (loading chunks)
- [ ] Client B connects and moves around (loading chunks)
- [ ] Server TPS with 2 clients after 2 minutes: _____ TPS
- [ ] Memory usage with 2 clients: _____ MB / _____ MB allocated
- [ ] **PASS: TPS >= 20.0 with 2 clients**
- [ ] **PASS: Memory usage within allocated JVM heap**

### MC-BONUS: Memory Within JVM Heap

- [ ] JVM heap allocation matches hardware profile: _____ MB
- [ ] Observed max memory usage after 10 min with 2 clients: _____ MB
- [ ] **PASS: Max usage < allocated heap**

---

## 5. Pipeline Stage Reference

### Dry-Run Stages

| Stage | Description | What It Checks | Failure Action |
|-------|-------------|---------------|----------------|
| 1 | Required scripts | provision-vm.sh, vm-lifecycle.sh, deploy-pxe.sh, deploy-kickstart.sh exist and are accessible | Verify Phase 170-172 completion |
| 2 | Required templates | minecraft.ks.template, base.ks.template exist in templates/kickstart/ | Run Phase 171 plan |
| 3 | Local-values files | vm-provisioning.local-values or example file exists | Copy example and fill in values |
| 4 | Resource budget | resource-budget.yaml exists with minecraft_vm section | Run `calculate-budget.sh` |
| 5 | Hardware capabilities | hardware-capabilities.yaml has hypervisor support flags | Run `discover-all.sh` |
| 6 | PXE infrastructure | dnsmasq config template, boot menu templates present | Run Phase 170 plans |
| 7 | Kickstart deployment | minecraft.ks.template available for rendering | Run Phase 171 plans |

### Provision Stages (MC-11)

| Stage | Description | Requirement | Expected Time | Failure Remediation |
|-------|-------------|-------------|---------------|---------------------|
| 1 | Prerequisites | Baseline | < 5s | Same as dry-run stage checks |
| 2 | PXE infrastructure | MC-11 | < 5s | Check dnsmasq status, TFTP root |
| 3 | Kickstart deployment | MC-11 | < 5s | Render kickstart templates |
| 4 | VM provisioning | MC-11 | 5-10 min | Check hypervisor, storage, resource budget |
| 5 | VM boot + SSH | MC-11 | 2-5 min | Check network, DHCP, SSH key deployment |
| 6 | Minecraft service | MC-11 | < 30s | Check systemd service, Java, disk space |
| 7 | Fabric mod loader | MC-11 | < 5s | Check Fabric installer, mod JARs |
| 8 | Syncmatica mod | MC-11 | < 5s | Check Syncmatica JAR version compatibility |
| 9 | Server properties | MC-11 | < 5s | Re-run deploy-server-config.sh |
| 10 | Firewall rules | MC-11 | < 5s | Check firewall-cmd, port 25565/tcp |
| 11 | Pipeline timing | MC-11 | < 20 min total | Optimize VM sizing, storage speed, PXE config |

### Performance Stages (MC-12, MC-13)

| Stage | Description | Requirement | Expected | Failure Remediation |
|-------|-------------|-------------|----------|---------------------|
| 1 | Server reachable | Baseline | TCP connect < 5s | Check VM IP, firewall, port 25565 |
| 2 | TPS query via RCON | MC-13 | RCON responds | Check RCON port, password, mcrcon install |
| 3 | TPS >= 20.0 baseline | MC-13 | 20.0 TPS | Tune JVM flags, view-distance |
| 4 | Memory usage | Bonus | Within heap | Adjust JVM heap allocation |
| 5 | 2 clients connected | MC-13 | Manual confirm | Connect clients with Fabric + Syncmatica |
| 6 | TPS >= 20 with 2 clients | MC-13 | 20.0 TPS | Reduce simulation-distance, tune GC |
| 7 | Syncmatica sharing | MC-12 | < 30s | Check mod versions, network speed |
| 8 | Performance summary | Report | N/A | Review measurements |

## 6. Troubleshooting Guide

### 1. PXE Boot Not Starting

**Symptoms:** VM starts but no PXE boot menu appears, drops to shell or BIOS.

**Checks:**
```bash
# Verify dnsmasq is running
systemctl status dnsmasq

# Check TFTP port is listening
ss -tulnp | grep :69

# Verify DHCP range covers VM network
grep dhcp-range /etc/dnsmasq.d/pxe-boot.conf

# Check boot files exist
ls -la /var/lib/tftpboot/pxelinux.0
ls -la /var/lib/tftpboot/centos-stream-9/vmlinuz
```

**Fix:** Re-run `deploy-pxe.sh` with correct local-values. Verify the VM is on the same network as the DHCP/TFTP server.

### 2. Kickstart Installation Hangs

**Symptoms:** PXE boots but kickstart never starts, or installation freezes mid-way.

**Checks:**
```bash
# Verify kickstart file is HTTP-accessible
curl -s http://192.168.122.1:8080/kickstart/minecraft.ks | head -5

# Check for unresolved template variables in rendered kickstart
grep '${' /path/to/rendered/minecraft.ks

# Verify network connectivity from VM to kickstart server
# (check from host if VM has console access)
```

**Fix:** Re-render kickstart with `deploy-kickstart.sh`. Ensure HTTP server is running and accessible from VM network.

### 3. Minecraft Server Not Starting

**Symptoms:** VM is provisioned but Minecraft systemd service is not running.

**Checks:**
```bash
# Check service status
ssh admin@VM_IP "systemctl status minecraft.service"

# Check Java 21 is installed
ssh admin@VM_IP "java -version"

# Check disk space
ssh admin@VM_IP "df -h /opt/minecraft"

# Check server logs
ssh admin@VM_IP "cat /opt/minecraft/server/logs/latest.log"
```

**Fix:** Verify Java 21 is in the kickstart package list. Check JVM flags in the systemd service file. Ensure EULA is accepted.

### 4. Low TPS (Below 20)

**Symptoms:** Server TPS drops below 20.0, especially with connected clients.

**Checks:**
```bash
# Query TPS via RCON
mcrcon -H VM_IP -P 25575 -p PASSWORD -c "forge tps"

# Check JVM memory
mcrcon -H VM_IP -P 25575 -p PASSWORD -c "mem"

# Check entity count
ssh admin@VM_IP "grep entity /opt/minecraft/server/logs/latest.log | tail -5"
```

**Fix:**
- **GC selection:** Use ZGC for heaps >= 8GB, G1GC for smaller heaps
- **View distance:** Reduce `view-distance` in server.properties (try 10, then 8)
- **Simulation distance:** Reduce `simulation-distance` (try 10, then 8)
- **Entity cleanup:** Check for excessive mobs or item drops

### 5. Syncmatica Not Syncing

**Symptoms:** Schematics uploaded by one client do not appear for another.

**Checks:**
```bash
# Verify Syncmatica mod is loaded on server
ssh admin@VM_IP "grep -i syncmatica /opt/minecraft/server/logs/latest.log"

# Check client mod versions match server
# Both clients must have the same Syncmatica version as the server
```

**Fix:** Ensure Syncmatica mod version matches between server and all clients. Check that Litematica is also installed on clients. Verify the Syncmatica config allows sharing.

### 6. RCON Connection Refused

**Symptoms:** `mcrcon` or RCON queries fail with connection refused.

**Checks:**
```bash
# Verify RCON is enabled in server.properties
ssh admin@VM_IP "grep rcon /opt/minecraft/server/server.properties"

# Check RCON port is open
ssh admin@VM_IP "ss -tlnp | grep 25575"

# Check firewall allows RCON
ssh admin@VM_IP "sudo firewall-cmd --list-ports | grep 25575"
```

**Fix:** Enable RCON in server.properties (`enable-rcon=true`, `rcon.port=25575`). Add the port to the firewall. Re-run `deploy-server-config.sh`.

### 7. VM Provisioning Timeout

**Symptoms:** `provision-vm.sh --mode fresh` exceeds the timeout without completion.

**Checks:**
```bash
# Check hypervisor resource availability
virsh nodeinfo

# Check storage I/O
iostat -x 1 5

# Check VM is getting DHCP and PXE booting
virsh console minecraft-verify-XXXX
```

**Fix:** Increase timeout with `--timeout 1800`. Check that host has sufficient free RAM and CPU. Verify PXE/DHCP network path. Use SSD storage for faster disk provisioning.

### 8. SSH Not Accessible After Provisioning

**Symptoms:** VM appears running but SSH connections fail or time out.

**Checks:**
```bash
# Get VM IP address
virsh domifaddr minecraft-verify-XXXX

# Check from host
ping VM_IP
ssh -vvv admin@VM_IP

# Check inside VM (via virsh console)
virsh console minecraft-verify-XXXX
# Then: systemctl status sshd
# Then: ip addr show
```

**Fix:** Verify the kickstart deploys the correct SSH public key. Check that `sshd` is enabled. Check firewall allows SSH (port 22). Verify SELinux is not blocking SSH.

### 9. Memory Pressure

**Symptoms:** Server slow, OOM kills, swap usage high on host.

**Checks:**
```bash
# Check host memory
free -h

# Check VM memory allocation
virsh dominfo minecraft-verify-XXXX | grep "Used memory"

# Check JVM heap inside VM
ssh admin@VM_IP "ps aux | grep java"
```

**Fix:** Review `resource-budget.yaml` allocation. Ensure the host has at least 4GB reserved. Reduce VM allocation if necessary. Check that JVM heap does not exceed VM RAM minus 1GB overhead.

### 10. Mod Load Failure

**Symptoms:** Fabric loads but specific mods (Syncmatica, Litematica) fail to initialize.

**Checks:**
```bash
# Check Fabric mod loading
ssh admin@VM_IP "grep -i 'loading.*mod' /opt/minecraft/server/logs/latest.log"

# Check for version incompatibilities
ssh admin@VM_IP "grep -i 'error\|exception\|incompatible' /opt/minecraft/server/logs/latest.log"

# Verify mod JAR checksums
ssh admin@VM_IP "sha256sum /opt/minecraft/server/mods/*.jar"
```

**Fix:** Verify Fabric API version matches the Minecraft version (1.21.4). Check that all mod JARs are present and not corrupted. Verify the mod manifest checksums.

## 7. Performance Tuning Reference

### JVM Flags by Hardware Tier

**Minimal (16GB host, 4-6GB heap):**
```
-Xms4G -Xmx6G
-XX:+UseG1GC
-XX:MaxGCPauseMillis=50
-XX:G1HeapRegionSize=16M
-XX:+ParallelRefProcEnabled
```

**Comfortable (32GB host, 8-12GB heap):**
```
-Xms8G -Xmx12G
-XX:+UseZGC
-XX:+ZGenerational
-XX:SoftMaxHeapSize=10G
```

**Generous (64GB+ host, 16GB+ heap):**
```
-Xms16G -Xmx16G
-XX:+UseZGC
-XX:+ZGenerational
-XX:SoftMaxHeapSize=14G
-XX:ConcGCThreads=4
```

### Garbage Collector Selection

| Heap Size | Recommended GC | Rationale |
|-----------|---------------|-----------|
| < 8GB | G1GC | Lower overhead, well-tuned for small heaps |
| >= 8GB | ZGC | Sub-millisecond pause times, generational mode |
| Any | Avoid CMS | Deprecated, removed in Java 21 |

ZGC is selected only when heap >= 8GB because ZGC needs sufficient headroom for its concurrent collection. Below 8GB, G1GC provides better overall throughput.

### View Distance and Simulation Distance

| Setting | Default | Recommended (2 players) | Aggressive |
|---------|---------|------------------------|------------|
| `view-distance` | 10 | 12 | 8 |
| `simulation-distance` | 10 | 10 | 8 |
| `entity-broadcast-range-percentage` | 100 | 100 | 75 |

Reducing view distance has the largest impact on TPS because each chunk load triggers terrain generation and entity processing. For a Knowledge World with 2 players, 12 chunks provides comfortable visibility while maintaining 20 TPS.

### Network Buffer Tuning for Syncmatica

Syncmatica schematic transfers use Minecraft's mod networking channel. For large schematics (> 1MB):

- Ensure `network-compression-threshold` in server.properties is set to 256 (default)
- Client and server should be on the same LAN for < 30s transfers
- If schematics exceed 5MB, consider pre-distributing via the mod pack rather than live sync

### Host Kernel Parameters (Optional)

For best VM networking performance:

```bash
# Increase network buffer sizes
sysctl -w net.core.rmem_max=16777216
sysctl -w net.core.wmem_max=16777216

# Enable KSM for memory deduplication (helps with multiple VMs)
echo 1 > /sys/kernel/mm/ksm/run
```

## 8. Requirement Traceability

### MC Requirements to Verification Stages

| Requirement | verify-pipeline.sh Mode | Stages | Measurement |
|-------------|------------------------|--------|-------------|
| MC-11 | `--mode provision` | Stages 1-11 | Total elapsed time from provision start to server ready |
| MC-12 | `--mode performance` | Stage 7 | Operator-measured time from schematic upload to visibility |
| MC-13 | `--mode performance` | Stages 2-3, 5-6 | RCON-queried TPS at baseline and with 2 clients |

### Verification Stages to Implementation Phases

| Stage | Description | Implementing Phase | Key Script |
|-------|-------------|-------------------|------------|
| Prerequisites | Script/template existence | 170-172 | All infrastructure scripts |
| PXE infrastructure | dnsmasq, TFTP, boot menus | 170 | `deploy-pxe.sh` |
| Kickstart deployment | Template rendering | 171 | `deploy-kickstart.sh` |
| VM provisioning | VM creation via hypervisor | 172 | `provision-vm.sh` |
| VM boot + SSH | Network, DHCP, SSH | 170-172 | `vm-lifecycle.sh` |
| Minecraft service | Server deployment | 173 | `deploy-minecraft.sh` |
| Fabric mod loader | Mod framework | 174 | `deploy-mods.sh` |
| Syncmatica mod | Schematic sharing | 174 | `deploy-mods.sh` |
| Server properties | Configuration | 175 | `deploy-server-config.sh` |
| Firewall rules | Network security | 171 (kickstart) | Kickstart template |
| Pipeline timing | End-to-end | All above | `verify-pipeline.sh` |

### Cross-Reference to ROADMAP.md Success Criteria

| ROADMAP Criterion | MC Requirement | verify-pipeline.sh |
|-------------------|---------------|---------------------|
| "PXE boot to running server < 20 min" | MC-11 | `--mode provision` Stage 11 |
| "Syncmatica sharing < 30s" | MC-12 | `--mode performance` Stage 7 |
| "20 TPS with 2 clients" | MC-13 | `--mode performance` Stages 3, 6 |
| "JVM heap within allocation" | MC-BONUS | `--mode performance` Stage 4 |
