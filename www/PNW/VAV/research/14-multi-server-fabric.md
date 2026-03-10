# M10: Multi-Server World Fabric and Data Sync

**Module 10 of the Voxel as Vessel research atlas.**
A sovereign world is not a single process. It is a fabric — a proxy that routes players, a master that arbitrates chunk ownership, and a sync layer that keeps player state coherent across server boundaries. This module specifies the full data flow from player login through chunk negotiation to cross-server inventory persistence. Every data type gets an owner. Every ownership transition gets a protocol.

---

## 1. Proxy Layer Comparison

### 1.1 Three Generations of Minecraft Proxies

The Minecraft server ecosystem has produced three proxy implementations across thirteen years. Each generation solved problems the previous one could not.

| Property | BungeeCord | Waterfall | Velocity |
|----------|-----------|-----------|----------|
| **Origin** | md_5, 2012 | PaperMC fork of Bungee | Andrew Steinborn, 2018 |
| **Maintenance** | Rarely updated | Active, tracks upstream Bungee | Active, ground-up rewrite |
| **Plugin API** | Events + YAML config | Same as Bungee (compatible) | Modern Java API, no Bungee compat |
| **Security model** | IP forwarding via `BungeeCord: true` in spigot.yml — trivially spoofable | Same as Bungee | Modern forwarding with HMAC key exchange — cryptographic proof of proxy identity |
| **Connection handling** | Thread-per-connection | Thread-per-connection | Netty event loop, non-blocking I/O |
| **Player info forwarding** | Legacy: injects login data into handshake packet | Legacy (same as Bungee) | Modern: HMAC-signed forwarding, resistant to spoofing |
| **Performance ceiling** | ~500 concurrent before thread contention | ~500 concurrent | Tested to 1000+ concurrent on modest hardware |
| **License** | Modified BSD (with restrictions) | MIT | GPLv3 |

> Source: EUGameHost. "BungeeCord, Waterfall, and Velocity Proxies Explained." eugamehost.com (August 2025).

### 1.2 Why Velocity for Sovereign Worlds

BungeeCord's security model relies on a gentleman's agreement: backend servers trust that the `BungeeCord: true` flag means the connection actually came from the proxy. Any client that forges the handshake packet can impersonate any player. This is not a theoretical attack — it is a documented, widely-exploited vulnerability in public server networks.

Velocity eliminates this class of attack entirely. Its modern forwarding mode uses a shared secret between proxy and backends. The proxy signs forwarding data with HMAC-SHA256; the backend verifies the signature before accepting the connection. No valid signature, no connection. The forwarding secret never leaves the local network.

For VAV sovereign worlds, the proxy is the border. It decides who enters, which backend handles them, and how their identity is verified. That border must be cryptographically sound. Velocity is the only option that meets this requirement.

### 1.3 Velocity Configuration Template

```toml
# velocity.toml — VAV sovereign world proxy configuration
# Place in the Velocity installation root directory.

# ─── Bind address ───────────────────────────────────────────────
bind = "0.0.0.0:25565"

# ─── MOTD shown in server list ──────────────────────────────────
motd = "<green>VAV Sovereign World Network</green>"

# ─── Player cap (per-proxy instance) ────────────────────────────
show-max-players = 100

# ─── Online mode ────────────────────────────────────────────────
# true = authenticate against Mojang session servers.
# For offline/self-hosted sovereign worlds, set to false and
# handle auth at a higher layer (e.g., mod-based token).
online-mode = true

# ─── Player forwarding mode ─────────────────────────────────────
# "modern" = HMAC-signed forwarding. Requires the same secret
# in paper-global.yml on every backend server.
# NEVER use "legacy" or "bungeeguard" for new deployments.
player-info-forwarding-mode = "modern"

# ─── Forwarding secret ─────────────────────────────────────────
# Auto-generated in forwarding.secret file on first run.
# Copy this file to each backend server's config.
# DO NOT commit this value to version control.
forwarding-secret-file = "forwarding.secret"

# ─── Connection throttle ───────────────────────────────────────
# Milliseconds between connection attempts from the same IP.
# Prevents reconnect flooding during server switches.
login-ratelimit = 3000

# ─── Backend servers ───────────────────────────────────────────
[servers]
  # Each server name maps to address:port.
  # MultiPaper backends all share the same world via Master.
  survival-1 = "10.0.1.10:25566"
  survival-2 = "10.0.1.11:25566"
  survival-3 = "10.0.1.12:25566"
  creative-1 = "10.0.1.20:25566"
  lobby      = "10.0.1.100:25566"

# ─── Try order ─────────────────────────────────────────────────
# Servers to try when a player first connects.
[servers]
  try = ["lobby"]

# ─── Forced hosts ──────────────────────────────────────────────
[forced-hosts]
  "survival.vav.local" = ["survival-1", "survival-2", "survival-3"]
  "creative.vav.local" = ["creative-1"]
```

### 1.4 Velocity Plugin Ecosystem

Velocity supports two categories of plugins relevant to multi-server fabric:

| Plugin | Purpose | Integration Point |
|--------|---------|-------------------|
| **LuckPerms** | Permission management across servers | Velocity extension syncs groups via MySQL |
| **ViaVersion** | Protocol translation for mixed-version backends | Allows 1.20 and 1.21 servers behind one proxy |
| **SignedVelocity** | Passes signed chat messages through proxy | Required for 1.19.1+ chat reporting compliance |
| **MultiPaper** | Velocity plugin mode for Master coordination | Alternative to standalone Master process |

---

## 2. MultiPaper Chunk Ownership Protocol

### 2.1 Architecture Overview

MultiPaper is a Purpur fork that enables a single Minecraft world to run across multiple server instances simultaneously. The architecture consists of two component types:

- **MultiPaper-Master**: A standalone coordinator process (also available as a Velocity/BungeeCord plugin). Stores the canonical copy of all region files, level data, and player data. Arbitrates chunk ownership. Does NOT tick game logic.
- **MultiPaper-Backend**: Modified Purpur server instances that run actual game logic, tick entities, process redstone, handle player interactions. Each backend requests chunks from Master as needed.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MultiPaper Cluster                            │
│                                                                 │
│   ┌─────────────┐                                               │
│   │   Velocity   │  ← Players connect here                     │
│   │    Proxy     │                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│    ┌─────┼──────────────┬──────────────┐                        │
│    │     │              │              │                          │
│    ▼     ▼              ▼              ▼                          │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│ │Backend-A │  │Backend-B │  │Backend-C │   ← Game logic here   │
│ │(10 plyr) │  │(10 plyr) │  │(10 plyr) │                       │
│ └────┬─────┘  └────┬─────┘  └────┬─────┘                       │
│      │              │              │                              │
│      └──────────────┼──────────────┘                             │
│                     │                                             │
│                     ▼                                             │
│           ┌──────────────────┐                                   │
│           │  MultiPaper      │                                   │
│           │  Master          │  ← Canonical world data           │
│           │                  │     Chunk ownership table          │
│           │  Region files    │     Player data (if no HuskSync)  │
│           │  Level data      │                                   │
│           └──────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Chunk Ownership Semantics

MultiPaper enforces a **single-writer invariant** on chunks. At any given tick, exactly one backend server may write to a given chunk. This eliminates split-brain conflicts without requiring distributed locks or conflict resolution.

The ownership state machine has three states per chunk:

| State | Meaning | Transitions |
|-------|---------|-------------|
| **Unowned** | No backend is ticking this chunk. Data lives on Master only. | → Owned (on request) |
| **Owned(Server-X)** | Server-X has exclusive write access. Server-X ticks entities, processes redstone, handles block changes. | → Unowned (on release) or → Owned(Server-Y) (on transfer) |
| **Locked** | Transitional state during ownership transfer. No writes allowed. | → Owned(new server) |

### 2.3 Chunk Read Protocol

When a backend needs chunk data (player enters render distance, entity pathfinding crosses boundary):

```
Backend-A                    Master                     Backend-B
    │                          │                            │
    │  READ_CHUNK(x=4, z=7)   │                            │
    │ ─────────────────────►   │                            │
    │                          │                            │
    │                    ┌─────┤                            │
    │                    │Check│                            │
    │                    │owner│                            │
    │                    └─────┤                            │
    │                          │                            │
    │          [Case 1: Unowned — Master has latest copy]   │
    │  CHUNK_DATA(payload)     │                            │
    │ ◄─────────────────────   │                            │
    │                          │                            │
    │          [Case 2: Owned by Backend-B]                 │
    │                          │  GET_LATEST(x=4, z=7)     │
    │                          │ ──────────────────────►    │
    │                          │                            │
    │                          │  CHUNK_DATA(payload)       │
    │                          │ ◄──────────────────────    │
    │                          │                            │
    │  CHUNK_DATA(payload)     │                            │
    │ ◄─────────────────────   │                            │
    │                          │                            │
```

The read path guarantees freshness: if another server owns the chunk, Master fetches the live copy from that server rather than serving a potentially stale cached version. This is a **read-through** semantic — reads always reflect the latest committed state.

### 2.4 Chunk Ownership Request Protocol

When a backend needs to write to a chunk (player places/breaks a block, entity modifies terrain, redstone updates):

```
Backend-A                    Master                     Backend-B
    │                          │                            │
    │  REQUEST_OWNERSHIP       │                            │
    │  (x=4, z=7)             │                            │
    │ ─────────────────────►   │                            │
    │                          │                            │
    │          [Case 1: Chunk is unowned]                   │
    │  OWNERSHIP_GRANTED       │                            │
    │ ◄─────────────────────   │                            │
    │                          │                            │
    │          [Case 2: Chunk owned by Backend-B]           │
    │                          │  RELEASE_OWNERSHIP         │
    │                          │  (x=4, z=7)               │
    │                          │ ──────────────────────►    │
    │                          │                            │
    │                          │  OWNERSHIP_RELEASED        │
    │                          │  + final chunk state       │
    │                          │ ◄──────────────────────    │
    │                          │                            │
    │                    ┌─────┤                            │
    │                    │Store│                            │
    │                    │final│                            │
    │                    │state│                            │
    │                    └─────┤                            │
    │                          │                            │
    │  OWNERSHIP_GRANTED       │                            │
    │  + latest chunk data     │                            │
    │ ◄─────────────────────   │                            │
    │                          │                            │
```

The transfer is atomic from the chunk's perspective. During the Locked transitional state, no backend may write to the chunk. The Master holds the lock until the transfer completes.

### 2.5 Player Movement and Ownership Transition

When a player walks from a region served by Backend-A into chunks owned by Backend-B, the system does NOT transfer the player between servers. Instead:

1. Backend-A requests ownership of the chunks the player is entering.
2. Master initiates ownership transfer from Backend-B to Backend-A for those chunks.
3. Backend-B flushes its latest state for those chunks and releases ownership.
4. Backend-A receives the chunks and begins ticking them.
5. The player never disconnects. Their TCP connection to Backend-A remains open.

This is the critical insight: **chunks move to the player's server, not players to the chunk's server.** The player experience is seamless — no loading screens, no reconnection, no inventory desync. The ownership boundary is invisible.

However, when Velocity determines a player should be on a different backend (load balancing, explicit world change), a full server transfer occurs via Velocity's `connectToServer` API, and HuskSync handles data portability.

### 2.6 Scaling Properties

| Config | Players | Servers | Chunks/Server | TPS Headroom |
|--------|---------|---------|---------------|--------------|
| Single server | 100 | 1 | All | Poor (TPS < 15) |
| MultiPaper 3-node | 100 | 3 | ~1/3 each | Good (TPS 18-20) |
| MultiPaper 5-node | 200 | 5 | ~1/5 each | Good (TPS 18-20) |
| MultiPaper 10-node | 500 | 10 | ~1/10 each | Good (TPS 19-20) |

The scaling is near-linear for geographically distributed players. Hotspots (50 players in one chunk region) still saturate one backend, because chunk ownership is exclusive. MultiPaper solves the "many players spread across a large world" problem, not the "many players in one place" problem.

> Source: MultiPaper Contributors. *MultiPaper*. https://github.com/MultiPaper/MultiPaper

---

## 3. Player Data Sync — HuskSync

### 3.1 The Cross-Server Inventory Problem

When a player switches from Backend-A to Backend-B (via Velocity), their inventory, experience, health, potion effects, advancements, and statistics must transfer atomically. Vanilla Minecraft stores all of this in per-player `.dat` files within the world directory. MultiPaper can share these files via Master, but the latency and atomicity guarantees are insufficient for seamless transitions.

HuskSync solves this with a two-tier persistence model: Redis for low-latency cross-server transfer, and a relational database for durable persistence.

### 3.2 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     HuskSync Data Flow                        │
│                                                              │
│  Backend-A                Redis               Backend-B      │
│  ┌──────────┐        ┌──────────┐         ┌──────────┐     │
│  │ Player   │        │ Snapshot │         │ Player   │     │
│  │ leaves   │───────►│ stored   │────────►│ joins    │     │
│  │          │ SAVE   │ (key:    │  LOAD   │          │     │
│  │          │        │  UUID)   │         │          │     │
│  └──────────┘        └────┬─────┘         └──────────┘     │
│                           │                                  │
│                           │ Async persist                    │
│                           ▼                                  │
│                    ┌──────────────┐                          │
│                    │   MySQL /    │                          │
│                    │   MariaDB /  │                          │
│                    │   PostgreSQL │                          │
│                    │              │                          │
│                    │  Durable     │                          │
│                    │  player data │                          │
│                    └──────────────┘                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Sync Payload

HuskSync captures the complete player state as a serialized snapshot. The following table documents every data type and its sync characteristics:

| Data Type | Sync Method | Persistence Layer | Snapshot Size (typical) |
|-----------|-------------|-------------------|------------------------|
| Inventory (36 slots + offhand) | Redis snapshot on server switch | MySQL | 2-8 KB |
| Ender chest (27 slots) | Redis snapshot on server switch | MySQL | 1-4 KB |
| Experience / levels | Redis snapshot on server switch | MySQL | 16 bytes |
| Health / max health | Redis snapshot on server switch | MySQL | 8 bytes |
| Food level / saturation | Redis snapshot on server switch | MySQL | 8 bytes |
| Potion effects | Redis snapshot on server switch | MySQL | 0.1-2 KB |
| Advancements | Redis snapshot on server switch | MySQL | 2-10 KB |
| Statistics | Redis snapshot on server switch | MySQL | 5-20 KB |
| Game mode | Redis snapshot on server switch | MySQL | 4 bytes |
| Flight status | Redis snapshot on server switch | MySQL | 1 byte |
| Persistent data container | Redis snapshot on server switch | MySQL | Variable |

Total snapshot size per player: typically 15-50 KB. Redis handles this in sub-millisecond time.

### 3.4 Server Group Configuration

HuskSync supports **server groups** — logical clusters that share sync pools. A player's survival inventory is separate from their minigame loadout:

```yaml
# husksync/config.yml — server group example
synchronization:
  # Group name → list of server names (must match Velocity config)
  groups:
    survival:
      - survival-1
      - survival-2
      - survival-3
    creative:
      - creative-1
    minigames:
      - minigame-1
      - minigame-2

  # When a player moves between groups, their data is NOT synced.
  # Each group maintains independent snapshots.
  cross_group_sync: false
```

This prevents data leakage: a player's diamond armor earned in survival does not appear in minigame lobbies. Each group is a separate data domain. For VAV sovereign worlds, each sovereign world can be its own sync group — or multiple worlds can share a group if they represent the same logical space.

### 3.5 Redis Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Redis version | 5.0 | 7.0+ |
| Memory per player snapshot | 50 KB | 50 KB |
| Memory for 500 players | 25 MB | 25 MB |
| Persistence | RDB snapshots | AOF + RDB |
| High availability | Single instance | Redis Sentinel or Cluster |

Redis memory footprint is trivial. Even with 10,000 cached player snapshots, memory usage stays under 500 MB. The bottleneck is never Redis — it is the serialization/deserialization time on the backend servers, which HuskSync handles asynchronously.

> Source: William278. *HuskSync*. https://github.com/WilIiam278/HuskSync

### 3.6 IOSync — The Simple Alternative

For deployments that cannot run Redis, **IOSync** provides basic cross-server player data transfer by copying `.dat` files to a shared filesystem:

| Property | IOSync | HuskSync |
|----------|--------|----------|
| **Mechanism** | File copy to shared NFS/CIFS directory | Redis snapshot + MySQL persistence |
| **Latency** | 100-500ms (filesystem-dependent) | < 5ms (Redis) |
| **Atomicity** | Weak — race conditions on concurrent read/write | Strong — Redis SET/GET is atomic |
| **Data scope** | Full playerdata `.dat` file | Granular per-field snapshots |
| **Dependencies** | Shared filesystem only | Redis + MySQL |
| **Failure mode** | Stale data if copy fails silently | Explicit error, fallback to MySQL |

IOSync is adequate for small networks (2-3 servers, < 20 players) where simplicity outweighs reliability. For VAV sovereign worlds with Ceph-backed storage, HuskSync's Redis tier is the correct choice — Redis can itself be backed by persistent storage, and the atomicity guarantees align with the single-writer semantics of MultiPaper.

---

## 4. Full Data Flow — Login to Gameplay

### 4.1 Connection Sequence

The complete data flow from player connection to active gameplay involves nine discrete steps across four system layers:

```
Step  Layer          Action
────  ─────          ──────
 1    Network        Player client opens TCP to Velocity proxy (port 25565)
 2    Velocity       Proxy performs Mojang session authentication (online-mode)
                     or accepts connection (offline-mode)
 3    Velocity       Proxy consults routing rules:
                       - Forced host? → route to matching server group
                       - Default? → route to "try" list (lobby)
                       - Plugin override? → custom routing logic
 4    Backend        Selected backend receives forwarded connection
                     Backend verifies HMAC-signed forwarding data
 5    HuskSync       Backend requests player snapshot from Redis
                       - Cache hit → deserialize and apply
                       - Cache miss → fall back to MySQL query
 6    MultiPaper     Backend requests chunks within player's render distance
                     from MultiPaper-Master
 7    Master         For each requested chunk:
                       - Unowned → send from Master's canonical store
                       - Owned by another server → fetch live copy, forward
                     Backend requests ownership for chunks near player
 8    Backend        Backend generates terrain, spawns entities, sends
                     chunk data packets to player client
 9    Client         Player sees the world. Gameplay begins.
```

### 4.2 Server Switch Sequence

When a player changes servers (portal, command, load balance):

```
Step  Layer          Action
────  ─────          ──────
 1    Backend-A      Player triggers server switch (portal, /server, kick)
 2    HuskSync       Backend-A serializes full player snapshot → Redis
 3    Backend-A      Releases chunk ownership for chunks ONLY this player
                     was keeping loaded (no other players in range)
 4    Velocity       Proxy initiates connection to Backend-B
                     Backend-B verifies HMAC forwarding data
 5    HuskSync       Backend-B loads player snapshot from Redis
                     Applies inventory, XP, health, effects, advancements
 6    MultiPaper     Backend-B requests chunks for player's new position
                     Ownership negotiation proceeds as in §2.4
 7    Client         Player sees new server's world. No loading screen
                     if both servers share the same MultiPaper world.
```

### 4.3 Disconnect and Reconnect

```
Step  Layer          Action
────  ─────          ──────
 1    Backend        Player disconnects (timeout, quit, crash)
 2    HuskSync       Backend saves snapshot → Redis AND MySQL
 3    MultiPaper     Backend releases chunk ownership if no other
                     players need those chunks
 4    [time passes]
 5    Network        Player reconnects to Velocity
 6    Velocity       Routes to appropriate backend
 7    HuskSync       Loads from Redis (if recent) or MySQL (if expired)
 8    MultiPaper     Chunk loading as normal
```

---

## 5. Ownership Semantics Table

### 5.1 Comprehensive Data Ownership

Every piece of mutable state in the system has exactly one authoritative owner at any given time. The following table formalizes the ownership model:

| Data Type | Authoritative Owner | Sync Mechanism | Conflict Policy | Durability |
|-----------|-------------------|----------------|-----------------|------------|
| Chunk blocks | Backend with ownership lease | MultiPaper Master (write-through) | Single-writer — no conflicts possible | Master region files |
| Chunk entities | Backend with chunk ownership | MultiPaper Master | Single-writer follows chunk | Master entity store |
| Redstone state | Backend with chunk ownership | MultiPaper Master tick sync | Single-writer — redstone ticks on owning server only | Master region files |
| Tile entities (chests, signs) | Backend with chunk ownership | MultiPaper Master | Single-writer follows chunk | Master region files |
| Player inventory | Last server the player visited | HuskSync (Redis → MySQL) | Timestamp-based, latest snapshot wins | MySQL |
| Player position | Current backend server | Velocity routing table | Proxy is authoritative — resolves by current connection | Velocity state |
| Player health/food | Current backend server | HuskSync snapshot on switch | Latest snapshot wins | MySQL |
| Player advancements | Current backend server | HuskSync snapshot on switch | Latest snapshot wins (merge on rare conflict) | MySQL |
| Player statistics | Current backend server | HuskSync snapshot on switch | Additive merge — counters only increase | MySQL |
| Scoreboard objectives | Defined on all servers | HuskSync or plugin sync | Last-write-wins or plugin-specific merge | MySQL or plugin store |
| World time / weather | MultiPaper Master | Broadcast to all backends | Master-authoritative, no conflict | Master level.dat |
| World border | MultiPaper Master | Broadcast to all backends | Master-authoritative | Master level.dat |

### 5.2 Ownership Lease Semantics

Chunk ownership in MultiPaper is a **lease**, not a permanent assignment. The lease is held as long as:

1. At least one player on the owning server has the chunk in render distance, OR
2. The chunk has pending tick operations (falling blocks, scheduled ticks, entity AI), OR
3. The chunk is within the server's configured `keep-alive` radius of an owned chunk.

When none of these conditions hold, the backend releases ownership back to Master. This prevents servers from accumulating ownership of abandoned chunks and ensures ownership follows player activity.

---

## 6. VAV Integration — Sovereignty Implications

### 6.1 Storage Layer Integration

The multi-server fabric connects to the VAV storage architecture (M1/M2) at the Master level:

```
┌───────────────────────────────────────────────────────┐
│              VAV Sovereign World Stack                  │
│                                                       │
│  Players ──► Velocity ──► Backends (MultiPaper)       │
│                               │                       │
│                               ▼                       │
│                        MultiPaper Master              │
│                               │                       │
│                               ▼                       │
│                    ┌─────────────────────┐            │
│                    │  Ceph RBD / RADOS   │            │
│                    │                     │            │
│                    │  vav-regions pool   │ ← M1 pool  │
│                    │  vav-meta pool      │   design   │
│                    │  vav-cache pool     │            │
│                    └─────────────────────┘            │
│                                                       │
│  HuskSync ──► Redis ──► MySQL/PostgreSQL              │
│                           │                           │
│                           ▼                           │
│                    Ceph RBD or Cinder volume           │
│                    (durable player data)               │
│                                                       │
└───────────────────────────────────────────────────────┘
```

MultiPaper-Master's region file storage path can be pointed at a FUSE-mounted CephFS directory or, for higher performance, can use a custom storage backend that writes directly to RADOS via librados. The Master becomes a thin coordination layer between game servers and the Ceph cluster.

### 6.2 Sovereign World Isolation

Each sovereign world operates its own independent stack:

- **Own Velocity proxy** — controls who may enter. The proxy IS the border. Allowlists, denylists, authentication plugins all live here.
- **Own MultiPaper Master** — stores its own region files in its own Ceph pool or pool namespace. No world can read another world's chunks.
- **Own HuskSync Redis instance** — player data for this world is separate from all other worlds. A player's inventory in World-A has no relationship to their inventory in World-B.
- **Own backend servers** — scaled independently based on population.

This isolation is not optional decoration. It is the sovereignty guarantee: a world's operator has full authority over their storage, their access control, their player data, and their compute resources. No shared Master means no shared failure domain.

### 6.3 Portal Gateways — Foreshadowing M12

Velocity's plugin API supports programmatic server switching. A portal gateway is a Velocity plugin that:

1. Listens for a player interaction event (stepping on a portal block, running a command).
2. Authenticates the player against the destination world's access policy.
3. Triggers HuskSync save on the origin server.
4. Connects the player to the destination world's backend via Velocity.
5. Triggers HuskSync load on the destination server (potentially from a DIFFERENT Redis/MySQL instance).

The portal gateway is the mechanism by which sovereign worlds form a network while maintaining sovereignty. Each world decides independently whether to accept incoming travelers. The proxy layer is the enforcement point.

This architecture will be fully specified in M12 (Portal Gateway Protocol). For now, the key insight is: the multi-server fabric makes cross-world travel possible WITHOUT shared infrastructure. Each world is a complete, independent stack. The portal is a negotiated handshake between two sovereign systems.

### 6.4 Scaling a Sovereign World

A sovereign world operator scales by adding backends to their MultiPaper cluster:

| Growth Phase | Backends | Players | Infrastructure |
|-------------|----------|---------|----------------|
| Launch | 1 backend + Master | 1-20 | Single machine, Master as process |
| Growth | 3 backends + Master | 20-60 | 2-3 machines, dedicated Master |
| Maturity | 5-10 backends + Master | 60-200 | Kubernetes pods, Ceph cluster, Redis Sentinel |
| Federation | 10+ backends + Master | 200+ | Full stack, portal gateways to allied worlds |

The architecture scales horizontally at every layer. Velocity proxies can be load-balanced. Backends are stateless (all state lives in Master/Redis/MySQL). Masters coordinate but do not compute. Ceph scales by adding OSDs.

---

## 7. Sources

1. MultiPaper Contributors. *MultiPaper*. https://github.com/MultiPaper/MultiPaper
2. William278. *HuskSync*. https://github.com/WilIiam278/HuskSync
3. Velocity Contributors. *Velocity — The Modern Minecraft Proxy*. https://velocitypowered.com
4. EUGameHost. "BungeeCord, Waterfall, and Velocity Proxies Explained." eugamehost.com (August 2025).
5. PaperMC. *Paper Documentation — Velocity Modern Forwarding*. https://docs.papermc.io/velocity
6. SpigotMC. *BungeeCord*. https://www.spigotmc.org/wiki/bungeecord/
7. PaperMC. *Waterfall*. https://github.com/PaperMC/Waterfall (archived)
8. William278. *HuskSync Documentation*. https://william278.net/docs/husksync/

---

## Cross-Reference

| Module | Connection |
|--------|------------|
| M1 (Ceph/RADOS) | Master's region files are RADOS objects in `vav-regions` pool; Ceph RBD backs MySQL and Redis persistence |
| M2 (RAG Pipeline) | Embeddings stored in chunks are served through MultiPaper's chunk read protocol — retrieval inherits ownership semantics |
| M3 (Integration Architecture) | The block-token isomorphism is preserved across server boundaries; chunk ownership does not affect encoding |
| M4 (Anvil/NBT Format) | MultiPaper Master stores and serves standard Anvil `.mca` files — no format modification required |
| M5 (PoC Plan) | Multi-server deployment is a Phase 2 concern; PoC runs single-server first |
| M6 (Spatial Embedding) | Spatial queries cross chunk ownership boundaries transparently — Master handles routing |
| M12 (Portal Gateway) | Portal protocol depends on Velocity's server switch API and HuskSync's cross-instance sync (future module) |
