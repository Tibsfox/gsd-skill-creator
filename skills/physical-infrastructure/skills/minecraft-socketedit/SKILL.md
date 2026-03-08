# SocketEdit: High-Performance Minecraft Block Engine

## Activation

Triggers when: user mentions Minecraft server, block editing, world building, video display in Minecraft, image-to-blocks, SocketEdit, or bulk block placement.

## Overview

SocketEdit is a complete pipeline for programmatic Minecraft world editing at extreme throughput. It consists of:

1. **Paper server** with a custom TCP plugin (Java) for direct NMS block writes
2. **C client library** (`libsocketedit.so`) for fast binary encoding
3. **Python orchestration layer** for image/video/procedural generation
4. **CUDA kernels** for GPU-accelerated block generation and video quantization
5. **JNI bridge** connecting CUDA to the Java plugin

Proven benchmarks (4 threads, parallel chunk writer):
- **Batch**: 3.7M blk/s (500K blocks)
- **Fill**: 59M blk/s (150^3+ volumes)
- **Pipeline**: 6.2M blk/s (10x100K overlapping I/O)

---

## Phase 1: Server Setup

### Prerequisites

- Java 21+ (compiled with 25)
- Paper 1.21.4 (build 232)
- 4GB+ RAM allocated to server
- Linux host with gcc, make

### Step-by-step

```bash
# 1. Create server directory
mkdir -p /path/to/server && cd /path/to/server

# 2. Download Paper
curl -o paper-1.21.4-232.jar \
  https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/232/downloads/paper-1.21.4-232.jar

# 3. Accept EULA
echo "eula=true" > eula.txt

# 4. Create start script
cat > start.sh << 'EOF'
#!/bin/bash
java -Xms4G -Xmx4G \
  -XX:+UseG1GC -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions \
  -XX:+DisableExplicitGC -XX:+AlwaysPreTouch \
  -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 \
  -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 \
  -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 \
  -XX:InitiatingHeapOccupancyPercent=15 \
  -XX:G1MixedGCLiveThresholdPercent=90 \
  -XX:G1RSetUpdatingPauseTimePercent=5 \
  -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem \
  -XX:MaxTenuringThreshold=1 \
  -jar paper-1.21.4-232.jar --nogui
EOF
chmod +x start.sh

# 5. First run to generate configs
./start.sh  # then stop it after configs generate
```

### Key server.properties settings

```properties
server-port=25565
enable-rcon=true
rcon.port=25575
rcon.password=minecraft123
gamemode=survival
view-distance=16
simulation-distance=10
enable-command-block=true
enforce-secure-profile=false
max-players=20
```

### Optional: Install WorldEdit + WorldGuard

Download plugin JARs into `plugins/` directory before starting:
- WorldEdit: https://dev.bukkit.org/projects/worldedit
- WorldGuard: https://dev.bukkit.org/projects/worldguard

Set WorldEdit `max-blocks-changed: -1` and `max-radius: -1` in `plugins/WorldEdit/config.yml` for unlimited operations.

---

## Phase 2: SocketEdit Plugin (Java)

### Architecture

```
TCP Client ──► SocketServer (port 9900, daemon thread)
                 └─► ClientHandler (per-connection thread)
                       └─► CommandQueue (ConcurrentLinkedQueue)
                             └─► BlockPlacer (main Bukkit thread, drained every tick)
                                   ├─► NMSBridge (direct chunk section writes)
                                   ├─► ParallelChunkWriter (multi-threaded sections)
                                   └─► NativeEngine (JNI → CUDA kernels)
```

### Wire Protocol

```
Frame:  [4B length (big-endian)] [1B opcode] [4B request_id] [payload...]
String: [2B length (big-endian)] [UTF-8 bytes]

Response: [4B length] [1B status] [4B request_id] [payload...]
  status: 0x00 = OK, 0x01 = ERROR
```

### Opcodes

| Code | Name | Payload |
|------|------|---------|
| 0x00 | PING | arbitrary echo data |
| 0x10 | AUTH | password string (must be first message) |
| 0x02 | SET_BLOCK | world:str, x:i32, y:i16, z:i32, blockdata:str |
| 0x03 | BATCH_SET_BLOCKS | world:str, palette_count:u16, palette:str[], block_count:u32, blocks:[idx:u16, x:i32, y:i16, z:i32]... |
| 0x04 | FILL | world:str, blockdata:str, x1:i32, y1:i16, z1:i32, x2:i32, y2:i16, z2:i32 |
| 0x05 | GET_BLOCK | world:str, x:i32, y:i16, z:i32 |
| 0x06 | EXEC_COMMAND | command:str |
| 0x07 | GET_HEIGHTMAP | world:str, x1:i32, z1:i32, x2:i32, z2:i32, minY:i16, maxY:i16 |
| 0x08 | NATIVE_BATCH | kernelType:i32, params:bytes, outputBuffer |

### Block data per entry: 12 bytes

```
[palette_idx: uint16] [x: int32] [y: int16] [z: int32]
```

All integers are big-endian.

### Plugin config.yml

```yaml
port: 9900
password: ""
blocks-per-tick: 50000
parallel-threads: 4
native-lib-path: ""
```

### Build

```bash
cd socketedit/
# build.gradle.kts uses Paper API 1.21.4-R0.1-SNAPSHOT
gradle build
# Output: SocketEdit-1.0.0.jar → ../plugins/
```

### Key Java classes

**9 source files** in `com.foxcraft.socketedit`:

| Class | Role |
|-------|------|
| `SocketEditPlugin` | Lifecycle: init components, schedule tick drain |
| `SocketServer` | TCP listener on port 9900, spawns ClientHandlers |
| `ClientHandler` | Per-connection: auth handshake, opcode dispatch |
| `Protocol` | Frame encoding/decoding, string I/O, response builders |
| `CommandQueue` | Thread-safe bridge: network threads → main thread |
| `BlockPlacer` | High-level operations: batch, fill, heightmap, GPU dispatch |
| `NMSBridge` | Direct NMS chunk section writes via MethodHandles |
| `ParallelChunkWriter` | Section-partitioned multi-threaded block placement |
| `NativeEngine` | JNI bridge to CUDA: allocate, generate, quantize, sort |

### NMSBridge — Direct Chunk Access

Bypasses Bukkit API entirely. Uses MethodHandle reflection resolved once at startup:

```
CraftWorld.getHandle() → ServerLevel
ServerLevel.getChunk(cx, cz) → LevelChunk
LevelChunk.getSections() → LevelChunkSection[]
LevelChunkSection.setBlockState(lx, ly, lz, state, lock) → direct palette write
CraftBlockData.getState() → NMS BlockState
LevelChunk.setUnsaved(true)
```

**Last-chunk cache**: tracks `(cx, cz)` to skip redundant lookups within a batch.

### ParallelChunkWriter — Section-Partitioned Parallelism

Thread safety model: no two threads touch the same `(chunk_x, chunk_z, section_y)`.

**5-phase batch write:**
1. **Parse** (main thread): ByteBuffer → coords + NMS states
2. **Pre-load** (main thread): collect unique chunks, load from ServerLevel
3. **Group** (main thread): organize blocks by section key
4. **Dispatch** (worker threads): `LevelChunkSection.setBlockState()` per section
5. **Sync** (main thread): await futures, mark chunks unsaved

**Section key packing** (collision-free across signed coords):
```java
sectionKey = ((cx + 0x100000) << 43) | ((cz + 0x100000) << 22) | (sy + 0x200000)
```

Thresholds: batch parallel at 10K+ blocks, fill parallel at 4K+ blocks.

### Chunk Visibility Fix (Critical)

Direct NMS writes bypass client notification. After placement:

1. Call `Heightmap.primeHeightmaps()` to recalculate `WORLD_SURFACE` / `OCEAN_FLOOR`
2. Build `ClientboundLevelChunkWithLightPacket` per affected chunk
3. Send packet to all players via `ServerPlayerConnection.send()`
4. Trigger `LevelLightEngine.checkBlock()` for light propagation

**Tick-batched sending**: for large operations (50+ chunks), spread packets across ticks (50 chunks/tick) to avoid client flooding and vertical stripe rendering gaps.

---

## Phase 3: C Client Library (`libsocketedit`)

### API (`socketedit.h`)

```c
// Connection
se_client* se_connect(const char* host, uint16_t port, const char* password);
void       se_disconnect(se_client* client);

// Single operations
int se_set_block(se_client*, const char* world, int x, short y, int z, const char* block);
int se_fill(se_client*, const char* world, const char* block, int x1, short y1, int z1, int x2, short y2, int z2);
int se_get_block(se_client*, const char* world, int x, short y, int z, char* out, int maxlen);
int se_exec_command(se_client*, const char* cmd);

// Batch builder (palette deduplication via FNV-1a hash)
se_batch* se_batch_create(const char* world);
int       se_batch_add(se_batch*, const char* block, int x, short y, int z);
int       se_batch_send(se_client*, se_batch*);

// High-performance raw send (for numpy/pre-indexed data)
int se_send_batch_raw(se_client*, const char* world,
                      const char** palette, int palette_count,
                      const int32_t* xs, const int16_t* ys, const int32_t* zs,
                      const uint16_t* indices, int block_count);
int se_send_batch_raw_async(se_client*, ...);  // fire-and-forget
int se_recv_response(se_client*);              // collect pipelined response

// Terrain
se_heightmap* se_get_heightmap(se_client*, const char* world, int x1, int z1, int x2, int z2, short minY, short maxY);
```

### Build

```bash
cd libsocketedit/
make  # produces libsocketedit.so
```

Compiler flags: `-O3 -march=native -fPIC`

---

## Phase 4: Python Orchestration

### socketedit_client.py — Pure Python Client

Pure-Python implementation of the binary protocol. Useful for small operations and debugging.

```python
from socketedit_client import SocketEditClient

client = SocketEditClient("localhost", 9900)
client.auth("")
client.set_block("world", 0, 64, 0, "minecraft:diamond_block")
client.fill("world", "minecraft:stone", 0, 0, 0, 100, 64, 100)
blocks = [("minecraft:gold_block", x, 100, 0) for x in range(1000)]
client.batch_set_blocks("world", blocks)
```

### socketedit_fast.py — C-Accelerated Client (50-200x faster)

ctypes wrapper around libsocketedit.so. Direct numpy array pointer passing (zero-copy).

```python
from socketedit_fast import FastClient
import numpy as np

client = FastClient("localhost", 9900)

# Numpy batch (the fast path)
xs = np.arange(1000, dtype=np.int32)
ys = np.full(1000, 100, dtype=np.int16)
zs = np.zeros(1000, dtype=np.int32)
indices = np.zeros(1000, dtype=np.uint16)
palette = ["minecraft:stone"]
client.batch_set_blocks_np("world", xs, ys, zs, indices, palette)

# Pipeline mode (async)
for i in range(10):
    client.batch_set_blocks_np("world", xs, ys, zs, indices, palette, async_mode=True)
for i in range(10):
    client.recv_response()  # collect all responses
```

**Benchmarking:**
```bash
python socketedit_fast.py --bench   # 1K → 1M blocks, throughput stats
python socketedit_fast.py --ping    # round-trip latency
python socketedit_fast.py --pipeline 10  # 10x100K async batches
```

### video_display.py — Video/Image to Minecraft Blocks

Renders video frames or images as blocks in the Minecraft world.

**Color quantization pipeline:**
1. sRGB → linear RGB (gamma correction)
2. Linear RGB → XYZ (D65 white point)
3. XYZ → CIELAB (perceptually uniform)
4. Nearest-neighbor match against 60-block palette

**Block palette**: concrete (16 colors, flat), terracotta (16 colors, muted), wool (16 colors, textured), plus ore blocks for edge cases.

**Two quantization modes:**
- `quantize_frame_cpu()`: brute-force CIELAB distance (~10 fps)
- `quantize_frame_lut()`: pre-built 32^3 RGB lookup table (~100 fps)

**Video pipeline:**
```python
# Image
python video_display.py --image photo.jpg --width 200 --height 150 --y 319

# YouTube video
python video_display.py --youtube "https://youtube.com/watch?v=..." --width 160 --height 90 --fps 15

# Local video file
python video_display.py --video clip.mp4 --width 160 --height 90 --fps 20
```

**Frame rendering features:**
- Async batching: up to 3 pending frames, collect on 4th
- Frame differencing: loop 2+ only sends changed blocks (huge savings on static content)
- Dark-air mode: pixels with luminance < 25 become air (hologram effect)
- Coordinate arrays pre-computed once, reused across frames

**Video decoding** via FFmpeg subprocess:
```
ffmpeg -i {source} -vf scale={w}:{h}:flags=lanczos -r {fps} -f rawvideo -pix_fmt rgb24 pipe:1
```

YouTube streaming via yt-dlp URL resolution.

**Blockfilm format**: pre-rendered frames as compressed numpy `.npz` for instant playback.

### city_chipset.py — Procedural City Generator

7-layer architecture:
1. **Terrain**: heightmap scan + flattening
2. **Materials**: palette sets (MEDIEVAL, STONE_CASTLE, COTTAGE)
3. **Geometry**: primitives — box_shell, walls, floor, peaked_roof, columns, stripes
4. **Structures**: templates — house, tower, market_stall, well, lamp_post
5. **Layout**: grid planner, road generation, lot assignment
6. **NPC**: spawns villagers that "construct" (teleport + commands)
7. **CityBuilder**: orchestrator (survey → flatten → roads → structures)

### build-fox.py / build-fox-v2.py — Fox Statue Builders

Procedural fox statue (290-382 blocks tall) written via NBT region file editing:
- Ellipsoid cross-sections per Y layer
- 9 body parts: feet, legs, torso, arms, head, ears, tail
- v2: procedural noise textures, multiple orange shades

### rcon.py — RCON Protocol Client

Minimal RCON client for server console commands:
```python
python rcon.py "say Hello" "time set day" "tp @a 0 100 0"
```

### telemetry.py — Player Tracking Daemon

Polls player data every 5 seconds via RCON, logs JSON (position, rotation, health, food, dimension, XP) to `telemetry.log`.

---

## Phase 5: CUDA/GPU Acceleration

### CUDA Kernels (`cuda/`)

| Kernel | Purpose |
|--------|---------|
| `kernel_sdf_evaluate` | CSG tree evaluation for sparse sculpting |
| `kernel_box_fill` | Solid cuboid generation |
| `kernel_box_shell` | Hollow box surface |
| `kernel_walls` | Room walls |
| `kernel_floor` | Single Y-layer floor |
| `kernel_peaked_roof` | Triangular roof |
| `kernel_city_generate` | Procedural lot-based city |
| `kernel_video_quantize` | RGB→CIELAB palette match per pixel |

SDF primitives (`sdf.cuh`): sphere, ellipsoid, box, cylinder, union, subtract, intersect, smooth_union. Supports 64-node CSG trees evaluated iteratively on GPU.

Video quantization (`video.cu`): per-pixel thread parallelism (16x16 blocks), palette in constant memory, optional Bayer 4x4 dithering.

Chunk sorting (`sort.cu`): CUB radix sort by `(cx << 32) | cz` for optimal sequential NMS writes.

All kernels output 12-byte big-endian block format: `[palette_idx:u16][x:i32][y:i16][z:i32]`.

### Build

```bash
# Requires CUDA toolkit + GPU with compute capability matching your card
cd cuda/
make          # produces libblockengine.a (sm_89 for Ada GPUs)

cd ../jni/
make          # produces libsocketedit_jni.so (links libblockengine.a + cudart)
```

JNI bridge (`socketedit_jni.c`) exposes:
- `nInitCuda()` → device init
- `nAllocateBuffer(maxBlocks)` → pinned host memory → DirectByteBuffer
- `nGenerateBlocks(kernelType, params, output)` → kernel dispatch
- `nQuantizeFrame(rgb, w, h, output, sx, sy, sz)` → video frame to blocks
- `nSetVideoPalette(paletteData, count)` → CIELAB palette in constant memory
- `nSortByChunk(buffer, count)` → reorder for write locality

### Memory model

- **Pinned host memory**: zero-copy GPU → Java transfer
- **DirectByteBuffer**: wraps pinned buffer for safe Java access
- **Fallback**: heap allocation if CUDA unavailable

Set `native-lib-path` in SocketEdit `config.yml` to point to `libsocketedit_jni.so`.

---

## Phase 6: Performance Tuning

### Benchmark Results (Parallel Chunk Writer, 4 threads)

**Batch (numpy, warm JIT):**

| Size | Time | Throughput |
|------|------|-----------|
| 10K | 12.9ms | 778K blk/s |
| 50K | 20.4ms | 2.4M blk/s |
| 100K | 47.2ms | 2.1M blk/s |
| 300K | 100.8ms | 3.0M blk/s |
| 500K | 134.5ms | 3.7M blk/s |
| 1M | 278.6ms | 3.6M blk/s |

**Fill (parallel, huge wins at scale):**

| Size | Blocks | Time | Throughput |
|------|--------|------|-----------|
| 32^3 | 32K | 3.2ms | 10.1M blk/s |
| 64^3 | 262K | 47.7ms | 5.5M blk/s |
| 100^3 | 1M | 86.7ms | 11.5M blk/s |
| 150^3 | 3.4M | 56.5ms | 59.8M blk/s |
| 200^3 | 8M | 135.4ms | 59.1M blk/s |

**Pipeline:**

| Batches | Total | Time | Throughput |
|---------|-------|------|-----------|
| 5x100K | 500K | 84.8ms | 5.9M blk/s |
| 10x100K | 1M | 161.0ms | 6.2M blk/s |

### Key takeaways

- Fill hit ~59M blk/s at 150^3+ (2x over old 30M peak) thanks to parallel section dispatch
- Batch peaks at 3.7M blk/s (parallel parsing overhead offset by multi-thread gains)
- Pipeline 10x100K at 6.2M blk/s (overlapping I/O with server processing)
- 20x100K pipeline stalls at 10s (tick backlog from queueing; `blocks-per-tick: 50000` caps drain rate)
- The fill result is the standout: 59M blk/s means 8M blocks in 135ms

### Tuning knobs

| Parameter | Where | Default | Effect |
|-----------|-------|---------|--------|
| `blocks-per-tick` | config.yml | 50000 | Max blocks drained per server tick |
| `parallel-threads` | config.yml | 4 | Worker threads (0 = single-threaded) |
| `view-distance` | server.properties | 16 | Chunk render distance |
| `simulation-distance` | server.properties | 10 | Entity/redstone sim range |
| Batch parallel threshold | ParallelChunkWriter | 10000 | Min blocks for parallel batch |
| Fill parallel threshold | ParallelChunkWriter | 4096 | Min blocks for parallel fill |
| Chunk send batch size | NMSBridge | 50 | Chunks per tick for client updates |

---

## Known Issues & Solutions

### Blocks invisible after placement

**Cause**: Direct NMS writes bypass client chunk updates.
**Fix**: `sendChunkUpdates()` sends `ClientboundLevelChunkWithLightPacket` + heightmap priming + light engine triggers.
**Caveat**: 625+ chunks in one tick causes vertical stripe gaps. Use tick-batched sending (50 chunks/tick via `Bukkit.getScheduler().runTaskLater()`).

### Lighting incorrect after bulk placement

**Cause**: Heightmaps not recalculated after section writes.
**Fix**: Call `Heightmap.primeHeightmaps(chunk, WORLD_SURFACE, OCEAN_FLOOR)` before sending chunk packets, then `LevelLightEngine.checkBlock()` at section center points.

### Pipeline stalls at high batch counts

**Cause**: `blocks-per-tick` caps drain rate; queue backs up.
**Fix**: Increase `blocks-per-tick` (up to ~100K) or reduce batch frequency. Monitor TPS.

### Image colors look wrong

**Cause**: RGB-space quantization produces poor perceptual matches.
**Fix**: Always use CIELAB color space for nearest-neighbor matching. The LUT path (`quantize_frame_lut`) is both fast and accurate.

---

## Quick Reference: End-to-End Workflow

```bash
# 1. Start server
cd /path/to/server && ./start.sh

# 2. Build plugin (if not already built)
cd socketedit && gradle build  # JAR copies to ../plugins/

# 3. Build C client
cd ../libsocketedit && make

# 4. (Optional) Build CUDA + JNI
cd ../cuda && make
cd ../jni && make

# 5. Test connection
python socketedit_fast.py --ping

# 6. Run benchmarks
python socketedit_fast.py --bench

# 7. Place an image
python video_display.py --image photo.jpg --width 200 --height 150 --y 319

# 8. Stream YouTube video into the world
python video_display.py --youtube "https://youtube.com/watch?v=..." --width 160 --height 90 --fps 15

# 9. Build a procedural city
python city_chipset.py --size 8 --style medieval --center 0 64 0
```

---

## File Inventory

```
server/
  paper-1.21.4-232.jar          # Server JAR
  start.sh                       # Launch script (4GB, Aikar flags)
  server.properties              # RCON, view-distance, etc.
  spigot.yml, bukkit.yml         # Server tuning
  config/
    paper-global.yml             # Paper-specific config
    paper-world-defaults.yml     # World defaults
  socketedit/                    # Java plugin source
    build.gradle.kts
    src/main/java/com/foxcraft/socketedit/
      SocketEditPlugin.java      # Plugin lifecycle
      SocketServer.java          # TCP listener
      ClientHandler.java         # Per-connection handler
      Protocol.java              # Wire format
      CommandQueue.java          # Thread bridge
      BlockPlacer.java           # Block operations
      NMSBridge.java             # Direct NMS access
      ParallelChunkWriter.java   # Multi-threaded sections
      NativeEngine.java          # JNI/CUDA bridge
    src/main/resources/
      plugin.yml, config.yml
  libsocketedit/                 # C client library
    socketedit.h                 # Public API
    socketedit.c                 # Implementation
    Makefile
  cuda/                          # GPU kernels
    kernels.cu                   # Block generation kernels
    video.cu                     # Frame quantization
    sort.cu                      # Chunk-key sorting
    sdf.cuh                      # SDF primitives
    kernels.h                    # Shared header
    Makefile
  jni/                           # Java ↔ CUDA bridge
    socketedit_jni.c
    Makefile
  plugins/                       # Built plugin JARs
    SocketEdit-1.0.0.jar
    WorldEdit, WorldGuard
  socketedit_client.py           # Pure Python client
  socketedit_fast.py             # C-accelerated client (numpy)
  video_display.py               # Video/image renderer
  city_chipset.py                # Procedural city generator
  build-fox.py, build-fox-v2.py  # Fox statue builders
  build-spawn.py                 # Spawn area builder (RCON)
  build-spawn-direct.py          # Spawn builder (direct NBT)
  rcon.py                        # RCON CLI tool
  telemetry.py                   # Player tracking daemon
  world/, world_nether/, world_the_end/  # World data
```
