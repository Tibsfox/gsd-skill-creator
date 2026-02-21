# Minecraft Knowledge World -- Performance Tuning Reference

This document maps hardware tiers to recommended Minecraft server settings, explains every server.properties value used in the Knowledge World configuration, documents JVM flags for garbage collection tuning, and provides an actionable manual tuning guide for operators.

## Overview

The GSD Minecraft Knowledge World uses a **tier-adaptive configuration system** where hardware capabilities determine server performance settings automatically. The pipeline works as follows:

1. **Hardware discovery** (`infra/scripts/discover-hardware.sh`) detects CPU, RAM, GPU, and network capabilities
2. **Resource budgeting** (`infra/scripts/calculate-budget.sh`) allocates RAM and cores to the Minecraft VM based on available hardware
3. **Local values generation** (`infra/scripts/generate-local-values.sh`) translates the resource budget into tier-adaptive settings including view distance, simulation distance, player count, and JVM heap sizing
4. **Configuration rendering** (`infra/scripts/deploy-server-config.sh`) reads local-values.yaml and renders server.properties from the template using the general-purpose template renderer (`infra/scripts/render-pxe-menu.sh`)

The complete configuration schema is documented in `infra/inventory/local-values.example.yaml`.

### Tier Classification

| Tier | Total Host RAM | Characteristics |
|------|---------------|-----------------|
| **Minimal** | 16 GB | Laptop or low-spec desktop. Conservative settings to keep the server responsive. |
| **Comfortable** | 32 GB | Mid-range workstation. Balanced settings for a good building experience. |
| **Generous** | 64 GB+ | High-end workstation. Maximum view distances and player counts. |

Tier classification happens in `calculate-budget.sh` based on total system RAM after reserving a non-negotiable 4 GB + 2 cores for the host OS.

---

## Tier Reference Table

All values are set automatically by `generate-local-values.sh` based on the detected hardware tier.

### JVM Settings

| Setting | Minimal (16 GB) | Comfortable (32 GB) | Generous (64 GB+) |
|---------|:----------------:|:--------------------:|:------------------:|
| JVM heap min | 1024 MB | 2048 MB | 4096 MB |
| JVM heap max | (ram * 1024) - 512 | (ram * 1024) - 512 | (ram * 1024) - 512 |
| GC type | G1GC | G1GC | ZGC (if heap >= 8 GB) |
| ParallelRefProcEnabled | Yes | Yes | Yes |
| DisableExplicitGC | Yes | Yes | Yes |
| AlwaysPreTouch | No | Yes | Yes |

**Heap max formula:** The Minecraft VM's allocated RAM (in GB) is multiplied by 1024 to convert to MB, then 512 MB is subtracted for OS overhead, JVM metaspace, and off-heap buffers. For example, a generous tier with 16 GB VM allocation yields a max heap of (16 * 1024) - 512 = 15,872 MB.

### server.properties Settings

| Setting | Minimal (16 GB) | Comfortable (32 GB) | Generous (64 GB+) |
|---------|:----------------:|:--------------------:|:------------------:|
| view-distance | 10 chunks | 16 chunks | 24 chunks |
| simulation-distance | 6 chunks | 10 chunks | 12 chunks |
| max-players | 5 | 10 | 20 |
| entity-broadcast-range-percentage | 50% | 100% | 150% |
| network-compression-threshold | 256 | 256 | 256 |

### Mod Settings

| Setting | Minimal (16 GB) | Comfortable (32 GB) | Generous (64 GB+) |
|---------|:----------------:|:--------------------:|:------------------:|
| Syncmatica max schematic size | 100 KB | 500 KB | 1 MB |

---

## server.properties Reference

Every property in `infra/templates/minecraft/server.properties.template` is documented below with its purpose, Knowledge World value, and whether it is tier-adaptive or fixed.

### Game Mode (Fixed)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `gamemode` | `creative` | No | Knowledge World is a creative/educational server. Survival mode is out of scope per PROJECT.md. |
| `force-gamemode` | `true` | No | Players joining are forced into creative mode even if they were in a different mode on another server. |
| `difficulty` | `peaceful` | No | No hostile mobs spawn. The world is safe for building and education. |
| `hardcore` | `false` | No | No permanent death. Players are not penalized for falling or other accidents. |
| `pvp` | `false` | No | Player-versus-player combat is disabled. This is a collaborative building environment. |

### Command Blocks (Fixed)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `enable-command-block` | `true` | No | Command blocks are required for educational builds, tutorials, and automated demonstrations. |
| `function-permission-level` | `2` | No | Functions run with gamemaster permissions (can use most commands but not operator-level). |
| `op-permission-level` | `4` | No | Operators have full control including `/stop`, `/kick`, and server management. |

### Access Control (Fixed + Tier-Adaptive)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `white-list` | `true` | No | Only whitelisted players can join. This is a controlled educational environment. |
| `enforce-whitelist` | `true` | No | Players removed from the whitelist while online are immediately disconnected. |
| `max-players` | 5 / 10 / 20 | **Yes** | Maximum concurrent players. Scales with available RAM and CPU. |
| `online-mode` | `true` | No | Authenticates players via Mojang servers. Prevents unauthorized access and UUID spoofing. |

### Network (Site-Specific)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `server-port` | 25565 (default) | No | TCP port clients connect to. Configurable via `network.game_port` in local-values.yaml. |
| `network-compression-threshold` | 256 | No | Packets larger than 256 bytes are compressed. Reduces bandwidth at minimal CPU cost. |

### RCON (Site-Specific)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `enable-rcon` | `true` | No | Remote console access for server management without SSH. |
| `rcon.port` | 25575 (default) | No | RCON listener port. Configurable via `network.rcon_port` in local-values.yaml. |
| `rcon.password` | (generated) | No | 24-character random alphanumeric password. Stored in gitignored `infra/local/minecraft-secrets.yaml`. |

### Performance (Tier-Adaptive)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `view-distance` | 10 / 16 / 24 | **Yes** | How many chunks around each player the server keeps loaded for rendering. Higher values use more RAM and CPU. |
| `simulation-distance` | 6 / 10 / 12 | **Yes** | How many chunks around each player have active game mechanics (redstone, mob AI, crop growth). |
| `entity-broadcast-range-percentage` | 50 / 100 / 150 | **Yes** | How far entities are visible to clients, as a percentage of the default (100%). |
| `max-tick-time` | 60000 | No | Server watchdog timeout in milliseconds. If a tick takes longer than 60 seconds, the server crashes with a watchdog report. |
| `spawn-protection` | 0 | No | Disabled. All players in creative mode can modify spawn area. |

### World Settings (Fixed)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `level-name` | `knowledge-world` | No | World save directory name. |
| `level-type` | `minecraft\:flat` | No | Flat world type. The Knowledge World is built intentionally, not procedurally generated. |
| `generate-structures` | `false` | No | No villages, temples, or other generated structures. All structures are player-built. |
| `allow-nether` | `false` | No | Nether dimension disabled. Knowledge World focuses on a single flat creative canvas. |
| `spawn-monsters` | `false` | No | No hostile mobs (redundant with peaceful difficulty but explicitly set). |
| `spawn-animals` | `false` | No | No passive mobs. The world is a clean building environment. |
| `spawn-npcs` | `false` | No | No villagers or wandering traders. |

### Server Identity (Fixed)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `motd` | `GSD Knowledge World - Creative/Educational` | No | Message displayed in the server browser. |
| `server-name` | `GSD Knowledge World` | No | Internal server name. |
| `enable-status` | `true` | No | Server responds to status ping requests (shows in server browser). |
| `enable-query` | `false` | No | GameSpy4 query protocol disabled. Not needed for a private server. |

### Miscellaneous (Fixed)

| Property | Value | Tier-Adaptive | Purpose |
|----------|-------|:-------------:|---------|
| `allow-flight` | `true` | No | Creative mode requires flight. This must be true. |
| `player-idle-timeout` | `0` | No | Players are never kicked for idling. Useful for AFK builders. |
| `max-world-size` | `10000` | No | World border at 10,000 blocks from center. Prevents excessive world generation. |

---

## JVM Flag Reference

JVM flags are set by `infra/scripts/deploy-minecraft.sh` using values from the JVM flags template (`infra/templates/minecraft/jvm-flags.conf.template`). The flags are read from `infra/local/local-values.yaml` in the `minecraft.jvm` section.

### G1GC Flags (Default for Minimal and Comfortable Tiers)

G1GC (Garbage-First Garbage Collector) is the default for heaps under 8 GB. It provides predictable pause times suitable for game servers.

| Flag | Value | Purpose |
|------|-------|---------|
| `-XX:+UseG1GC` | (enabled) | Selects the G1 garbage collector. |
| `-XX:MaxGCPauseMillis=50` | 50 ms | Target maximum GC pause time. G1 adjusts region sizing to meet this target. Lower values reduce lag spikes but may increase GC frequency. |
| `-XX:G1HeapRegionSize=16M` | 16 MB | Size of each G1 heap region. Larger regions reduce overhead for large heaps but increase individual pause time. 16M is optimal for 4-16 GB heaps. |
| `-XX:G1NewSizePercent=30` | 30% | Minimum percentage of heap allocated to the young generation. Higher values improve throughput for allocation-heavy workloads like Minecraft chunk loading. |
| `-XX:G1MaxNewSizePercent=40` | 40% | Maximum percentage of heap allocated to the young generation. Caps young gen to prevent excessive tenuring. |

**Note:** Minimal tier omits `G1NewSizePercent`, `G1MaxNewSizePercent`, and `AlwaysPreTouch` to reduce memory overhead on constrained systems.

### ZGC Flags (Generous Tier with Heap >= 8 GB)

ZGC (Z Garbage Collector) is selected when the JVM heap is at least 8 GB (8192 MB). It provides sub-millisecond pause times regardless of heap size, eliminating GC-related lag spikes entirely.

| Flag | Value | Purpose |
|------|-------|---------|
| `-XX:+UseZGC` | (enabled) | Selects the Z garbage collector. |
| `-XX:+ZGenerational` | (enabled) | Enables generational mode (available since JDK 21). Generational ZGC separates young and old objects, reducing the amount of work per GC cycle and improving throughput by 10-20%. |

**Why 8 GB minimum:** ZGC reserves a significant portion of virtual address space and has higher baseline overhead than G1GC. Below 8 GB, G1GC provides better throughput with acceptable pause times.

### Common Flags (All Tiers)

| Flag | Tier | Purpose |
|------|------|---------|
| `-XX:+ParallelRefProcEnabled` | All | Parallelizes reference processing during GC. Reduces pause times when many soft/weak references exist (common in Minecraft's chunk and entity caches). |
| `-XX:+DisableExplicitGC` | All | Ignores `System.gc()` calls from application code. Prevents mods from triggering unnecessary full GC cycles. |
| `-XX:+AlwaysPreTouch` | Comfortable + Generous | Pre-touches all heap pages at JVM startup. Eliminates page faults during gameplay at the cost of slower startup (1-3 seconds). |
| `-Dlog4j2.formatMsgNoLookups=true` | All | **Log4Shell mitigation.** Disables JNDI lookups in Log4j2 message formatting. Unconditionally included regardless of Minecraft version as a defense-in-depth measure. |

---

## Manual Tuning Guide

These guidelines are for operators who want to adjust settings beyond the tier defaults. Always change one setting at a time and measure the impact.

### Measuring Server Performance

The primary metric is **TPS (Ticks Per Second)**. A healthy Minecraft server maintains 20 TPS. Anything below 18 TPS indicates performance issues.

To check TPS on a running server:
- RCON: `mspt` command (if Fabric with Carpet mod) or `/forge tps`
- Console: press F3 on the client and look at "mspt" (milliseconds per tick)
- Target: < 50 mspt (milliseconds per tick) = 20 TPS

### If TPS Drops Below 18

**Check in order:**

1. **Reduce `view-distance`** (most impactful setting)
   - Each chunk reduction saves significant CPU and RAM
   - Minimum recommended: 6 chunks
   - Try reducing by 2 at a time: 24 -> 22 -> 20 -> ...

2. **Reduce `simulation-distance`**
   - Controls how many chunks have active game mechanics
   - Reducing this offloads redstone, hoppers, and entity AI
   - Minimum recommended: 4 chunks

3. **Reduce `entity-broadcast-range-percentage`**
   - Lower values reduce network traffic and client-side rendering load
   - Minimum recommended: 25%

4. **Check `max-players`**
   - Each connected player generates chunk loading and entity tracking load
   - Reduce if most players are spread across the world (not co-located)

### If Players Experience Lag (High Ping or Rubber-banding)

1. **Check `network-compression-threshold`**
   - If on a fast local network (1 Gbps+), try increasing to 512 or disabling (-1)
   - If on a slow/remote connection, keep at 256 or lower to 128

2. **Check `simulation-distance`**
   - Client-perceived lag often comes from chunk loading delays
   - Reducing simulation distance reduces the server-side work per player

3. **Check client-side settings**
   - Client render distance should not exceed server view-distance
   - Optifine/Sodium can significantly improve client FPS

### If World Loads Slowly

1. **Check `view-distance`**
   - World loading speed is directly proportional to view distance squared
   - 24 chunks loads 4x more chunks than 12 chunks

2. **Check disk I/O**
   - Minecraft writes chunk data frequently
   - SSD storage significantly improves world load times
   - Check with: `iostat -x 1` on the server

3. **Pre-generate chunks**
   - Use Fabric's Chunky mod to pre-generate the world within the desired radius
   - Eliminates generation lag during gameplay

### If GC Pauses Are Noticeable

GC pauses manifest as periodic lag spikes (server briefly freezes every few seconds/minutes).

1. **Check heap sizing**
   - If heap is frequently over 80% full, increase `heap_max_mb`
   - Monitor with: `-verbose:gc` JVM flag (logs GC activity)

2. **Switch GC type**
   - If using G1GC with heap >= 8 GB, switch to ZGC (sub-millisecond pauses)
   - If using ZGC with heap < 8 GB, switch to G1GC (better throughput)
   - Edit `gc_type` and `gc_flags` in local-values.yaml or minecraft.local-values

3. **Tune G1GC pause target**
   - Reduce `MaxGCPauseMillis` from 50 to 30 (shorter pauses, more frequent GC)
   - Increase `G1HeapRegionSize` to 32M if heap is very large (> 16 GB)

4. **Enable AlwaysPreTouch**
   - If not already enabled, add `-XX:+AlwaysPreTouch` to extra flags
   - Eliminates page faults during gameplay

### If Memory Usage Grows Unbounded

1. **Check for chunk loading leaks**
   - Force-loaded chunks (via `/forceload`) consume RAM permanently
   - Review with: `/forceload query` on the server

2. **Check entity counts**
   - Large numbers of item entities (dropped items) consume memory
   - Use `/kill @e[type=item]` to clean up if needed

3. **Verify heap_min is not too low**
   - If heap_min is much lower than heap_max, the JVM oscillates between growing and shrinking the heap
   - Set heap_min to at least 50% of heap_max for stability

---

## Monitoring Integration

Phase 196 (Monitoring and Alerting) will provide runtime metrics for informed tuning decisions:

- **TPS monitoring** with alerting when TPS drops below threshold
- **JVM heap usage** graphs and GC pause time tracking
- **Player count** and entity count over time
- **Chunk loading** rates and disk I/O metrics
- **Network throughput** per player

Until Phase 196 is complete, use these manual monitoring commands:

```bash
# Check server status
systemctl status minecraft.service

# Watch server logs in real-time
journalctl -u minecraft.service -f

# Check JVM memory usage
jcmd $(pgrep -f fabric-server) VM.info 2>/dev/null | grep -i heap

# Monitor system resources
top -p $(pgrep -f fabric-server)
```

---

## File Reference

| File | Phase | Purpose |
|------|-------|---------|
| `infra/scripts/generate-local-values.sh` | 169 | Produces local-values.yaml with tier-adaptive settings |
| `infra/scripts/deploy-server-config.sh` | 175 | Renders server.properties from template + local-values |
| `infra/scripts/deploy-minecraft.sh` | 173 | Deploys Fabric server, JVM flags, systemd service |
| `infra/scripts/manage-whitelist.sh` | 175 | Whitelist management (add/remove/list/sync) |
| `infra/templates/minecraft/server.properties.template` | 175 | server.properties template with variable placeholders |
| `infra/templates/minecraft/jvm-flags.conf.template` | 173 | JVM flags template for systemd EnvironmentFile |
| `infra/inventory/local-values.example.yaml` | 169 | Complete local-values schema with all sections documented |
| `infra/local/local-values.yaml` | (generated) | Actual tier-adaptive values for your machine |
| `infra/local/minecraft-secrets.yaml` | (generated) | RCON password (gitignored) |
