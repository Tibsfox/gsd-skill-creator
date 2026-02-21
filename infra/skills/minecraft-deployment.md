---
name: minecraft-deployment
description: "Deploys Minecraft Java Edition on Fabric mod loader with hardware-adaptive JVM tuning, systemd service management, and health checking. Use when deploying Minecraft servers, tuning JVM settings, or checking server health."
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - "minecraft.*deploy"
          - "fabric.*server"
          - "jvm.*tun"
          - "minecraft.*health"
          - "server.*deploy"
        files:
          - "infra/scripts/deploy-minecraft.sh"
          - "infra/scripts/check-minecraft-health.sh"
          - "infra/templates/minecraft/*.template"
        contexts:
          - "minecraft server setup"
          - "game server deployment"
        threshold: 0.7
      token_budget: "2%"
      version: 1
      enabled: true
      plan_origin: "02-minecraft-server"
      phase_origin: "173"
---

# Minecraft Deployment

## Purpose

Deploys Minecraft Java Edition on Fabric mod loader with hardware-adaptive JVM tuning based on resource budget tiers. Manages the full server lifecycle via systemd with auto-restart, supports both local and remote deployment modes, and provides health checking with associative array result tracking for structured output.

## Capabilities

- Fabric installer download and execution for Minecraft 1.21.4
- Hardware-adaptive JVM flags: ZGC for generous tier (heap >= 8GB), G1GC for comfortable/minimal
- Log4Shell mitigation unconditionally included (-Dlog4j2.formatMsgNoLookups=true)
- systemd service with security hardening (ProtectSystem=full, ProtectHome=true, PrivateTmp=true, NoNewPrivileges=true)
- Dual deployment modes: --local (on-VM) and --target-host (remote SSH)
- Health checking with associative arrays for both human-readable and JSON output
- Health check exit codes: 0=healthy, 1=unhealthy, 2=warnings (degraded), 3=usage error
- EULA acceptance conditional on minecraft_eula setting in local-values
- Nested YAML parser via awk for reading minecraft.jvm section

## Key Scripts

| Script | Purpose |
|--------|---------|
| `infra/scripts/deploy-minecraft.sh` | Main Minecraft server deployment with Fabric and JVM tuning |
| `infra/scripts/check-minecraft-health.sh` | Health check with structured result reporting |

## Dependencies

- Resource budget from `calculate-budget.sh` (resource-budgeting skill)
- Java 21 (OpenJDK) installed on target system
- Network access for Fabric installer download
- systemd for service management
- Templates in `infra/templates/minecraft/`

## Usage Examples

**Deploy Minecraft server locally:**
```bash
infra/scripts/deploy-minecraft.sh --local
# Installs Fabric, configures JVM, creates systemd service
```

**Deploy to remote host:**
```bash
infra/scripts/deploy-minecraft.sh --target-host mc-server.local
# SSH-based deployment to remote VM
```

**Check server health:**
```bash
infra/scripts/check-minecraft-health.sh
# Exit 0=healthy, 1=unhealthy, 2=degraded, 3=usage error
```

**Dry-run with specific tier:**
```bash
infra/scripts/deploy-minecraft.sh --dry-run
# Shows JVM flags, heap size, GC selection without deploying
```

## Test Cases

### Test 1: GC selection by tier
- **Input:** Run `deploy-minecraft.sh --dry-run` with comfortable-tier fixture (32GB host)
- **Expected:** G1GC selected (not ZGC, since heap < 8GB for comfortable tier)
- **Verify:** Dry-run output JVM_FLAGS line contains `-XX:+UseG1GC` and not `-XX:+UseZGC`

### Test 2: Log4Shell mitigation always present
- **Input:** Run deploy with any tier fixture
- **Expected:** JVM flags include Log4Shell mitigation
- **Verify:** `grep -c 'formatMsgNoLookups=true'` in rendered JVM flags returns 1

### Test 3: Health check structured output
- **Input:** Run `check-minecraft-health.sh` against a running server
- **Expected:** Output contains section results for each check (port, process, RCON)
- **Verify:** Exit code is 0, 1, or 2 (not 3 which indicates usage error)

## Token Budget Rationale

2% budget reflects deploy-minecraft.sh (~250 lines) with complex JVM tuning logic, hardware-adaptive GC selection, and systemd service generation, plus check-minecraft-health.sh (~150 lines) with associative array result tracking. The hardware-adaptive nature requires sufficient context to understand tier-based decision logic.
