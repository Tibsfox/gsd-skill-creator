# CUDA/GL Dashboard Architecture

> **Domain:** GPU Telemetry Visualization
> **Module:** 3 -- NVML Telemetry, WebGL Shader Pipeline, and the Denise Panel
> **Through-line:** *The Amiga's Denise chip had a register map. Every color palette entry, every bitplane pointer, every sprite position was a hardware address you could read and write. The system was fully observable because full observability was a design requirement, not a debugging afterthought.* GSD-OS's Denise panel follows the same principle: every NVML metric has a named register, updated at its declared poll rate, readable by any dashboard component. The GPU is not a black box. The register map is published.

---

## Table of Contents

1. [Telemetry Architecture Overview](#1-telemetry-architecture-overview)
2. [NVML Metrics and Polling](#2-nvml-metrics-and-polling)
3. [Rust NVML Integration](#3-rust-nvml-integration)
4. [Filesystem Event Bus Bridge](#4-filesystem-event-bus-bridge)
5. [WebGL Shader Pipeline](#5-webgl-shader-pipeline)
6. [VRAM Pressure Heat Map](#6-vram-pressure-heat-map)
7. [Stream Utilization Visualization](#7-stream-utilization-visualization)
8. [Adapter Activation Timeline](#8-adapter-activation-timeline)
9. [Thermal Monitoring and Alerts](#9-thermal-monitoring-and-alerts)
10. [Performance Budget](#10-performance-budget)
11. [GSD Integration Patterns](#11-gsd-integration-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Telemetry Architecture Overview

The dashboard telemetry pipeline has three stages: collection (NVML polling in the Tauri Rust backend), transport (filesystem event bus via JSONL), and rendering (WebGL shaders in the Denise panel). Each stage operates independently with its own timing -- the collector polls at 250ms intervals, the transport writes at the same rate, and the renderer updates at 4 Hz (250ms). This design reuses GSD-OS's existing file-watch architecture with zero new IPC mechanisms [1].

```
TELEMETRY PIPELINE ARCHITECTURE
================================================================

  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │   NVML POLLING   │     │  FILESYSTEM BUS  │     │  WEBGL RENDERER  │
  │                  │     │                  │     │                  │
  │  nvml-wrapper    │     │  silicon-usage    │     │  Denise Panel    │
  │  (Rust crate)    │────>│  .jsonl          │────>│  (WebGL canvas)  │
  │                  │     │                  │     │                  │
  │  Poll: 250ms     │     │  Tauri watcher   │     │  Refresh: 4 Hz   │
  │  Metrics: 7      │     │  emits events    │     │  CPU: < 2%       │
  └──────────────────┘     └──────────────────┘     └──────────────────┘
        RUST                      IPC                     WEBVIEW
  (Tauri backend)          (file watch events)      (WebGL + JS)
```

---

## 2. NVML Metrics and Polling

### Metric Catalog

NVIDIA Management Library (NVML) exposes GPU state through a C API with bindings available for Rust, Python, and Go. The following metrics are relevant to the Silicon Layer dashboard [2]:

| Metric | NVML Function | Poll Rate | Dashboard Use |
|---|---|---|---|
| VRAM used / total | `nvmlDeviceGetMemoryInfo_v2()` | 250ms | Pressure heat map; budget overlay |
| GPU utilization % | `nvmlDeviceGetUtilizationRates()` | 250ms | SM occupancy indicator |
| Memory bandwidth % | `nvmlDeviceGetUtilizationRates()` | 500ms | Bus saturation gauge |
| Temperature | `nvmlDeviceGetTemperature()` | 1s | Thermal throttle warning |
| Process VRAM map | `nvmlDeviceGetComputeRunningProcesses()` | 1s | Per-adapter VRAM breakdown |
| Power consumption | `nvmlDeviceGetPowerUsage()` | 1s | Budget-aware throttling signal |
| Clock speeds | `nvmlDeviceGetClockInfo()` | 1s | Boost/throttle indicator |

### Polling Strategy

Metrics are polled at three tiers to balance overhead against freshness:

- **250ms (Tier 1):** VRAM usage, GPU utilization -- the primary decision inputs for the orchestration layer
- **500ms (Tier 2):** Memory bandwidth -- secondary indicator, useful for identifying memory-bound workloads
- **1000ms (Tier 3):** Temperature, power, process map, clocks -- slow-changing metrics used for alerts and reporting

Total NVML API call overhead at these rates: approximately 0.3-0.5% CPU utilization on an i7-6700K, measured empirically [3].

---

## 3. Rust NVML Integration

### nvml-wrapper Crate

The `nvml-wrapper` Rust crate provides safe, idiomatic bindings to the NVML C library. It handles library loading, error codes, and memory management [4].

```rust
use nvml_wrapper::Nvml;
use nvml_wrapper::enum_wrappers::device::TemperatureSensor;

fn poll_gpu_metrics(nvml: &Nvml) -> GpuMetrics {
    let device = nvml.device_by_index(0).expect("GPU device 0");

    let memory = device.memory_info().expect("memory info");
    let utilization = device.utilization_rates().expect("utilization");
    let temperature = device.temperature(TemperatureSensor::Gpu).expect("temp");
    let power = device.power_usage().expect("power");
    let clock = device.clock_info(nvml_wrapper::enum_wrappers::device::Clock::Graphics)
        .expect("clock");

    GpuMetrics {
        vram_used_mb: memory.used / (1024 * 1024),
        vram_total_mb: memory.total / (1024 * 1024),
        gpu_utilization_pct: utilization.gpu,
        memory_bandwidth_pct: utilization.memory,
        temperature_c: temperature,
        power_draw_mw: power,
        clock_mhz: clock,
        timestamp: std::time::SystemTime::now(),
    }
}
```

### Thread Architecture

The NVML polling loop runs on a dedicated Rust thread in the Tauri backend, isolated from the main event loop. It writes to the JSONL event bus via a buffered writer with fsync on each 250ms cycle. The Tauri file watcher (separate thread) detects the write and emits an event to the WebView [1].

---

## 4. Filesystem Event Bus Bridge

### JSONL Format

Each NVML poll cycle produces a single JSON line in `silicon-usage.jsonl`:

```json
{
  "ts": "2026-03-26T14:22:00.250Z",
  "vram_used_mb": 5810,
  "vram_total_mb": 8192,
  "gpu_util_pct": 67,
  "mem_bw_pct": 45,
  "temp_c": 62,
  "power_mw": 85000,
  "clock_mhz": 2535,
  "active_adapters": ["frontend-patterns"],
  "stream_states": {
    "observe": "idle",
    "detect": "executing",
    "suggest": "idle",
    "apply": "executing",
    "learn": "idle",
    "compose": "idle"
  }
}
```

### File Rotation

The JSONL file is rotated every 10,000 lines (~42 minutes at 250ms intervals) to prevent unbounded growth. Rotated files are compressed with gzip and retained for 24 hours. The Tauri file watcher monitors the active file only [1].

### Tauri Event Emission

```rust
// Tauri file watcher bridges JSONL to WebView
use tauri::Manager;

fn emit_telemetry(app_handle: &tauri::AppHandle, metrics: &GpuMetrics) {
    app_handle
        .emit_all("silicon-telemetry", metrics)
        .expect("failed to emit telemetry");
}
```

The WebView receives these events via Tauri's event system, which is a lightweight JSON message bus between the Rust backend and the JavaScript frontend. No WebSocket, no HTTP -- direct IPC through Tauri's internal message channel [1].

---

## 5. WebGL Shader Pipeline

### Denise Panel Architecture

GSD-OS's Denise panel uses WebGL 2.0 for rendering. The existing infrastructure handles the CRT boot sequence and block rendering engine. The Silicon Layer dashboard adds three WebGL components to this pipeline: a VRAM pressure heat map, a stream utilization display, and an adapter activation timeline [5].

```
WEBGL SHADER PIPELINE
================================================================

  Tauri Event (silicon-telemetry)
      |
      v
  JavaScript Metrics Buffer
  (ring buffer, 120 frames = 30 seconds @ 4Hz)
      |
      +-----> Uniform Buffer Update
      |       (per-frame upload to GPU)
      |
      +-----> ┌─────────────────────┐
              │ VRAM Heat Map       │ Fragment shader
              │ (Section 6)         │ 128x64 texels
              └─────────────────────┘
              │ Stream Utilization  │ Vertex + Fragment
              │ (Section 7)         │ 6-lane bar chart
              └─────────────────────┘
              │ Adapter Timeline    │ Instanced rendering
              │ (Section 8)         │ Time-series ribbon
              └─────────────────────┘
```

### Uniform Buffer Layout

```glsl
// Dashboard telemetry uniform block
layout(std140) uniform TelemetryBlock {
    float vram_pressure;      // 0.0 - 1.0 (used/total)
    float gpu_utilization;    // 0.0 - 1.0
    float mem_bandwidth;      // 0.0 - 1.0
    float temperature;        // normalized to 0.0-1.0 (0C-100C)
    float power_fraction;     // current/TDP
    vec4  stream_states;      // 6 streams packed into 2 vec4s
    vec4  stream_states_2;
    float time;               // animation time
};
```

---

## 6. VRAM Pressure Heat Map

### Fragment Shader Design

The VRAM pressure heat map visualizes memory allocation as a grid where each cell represents a 64 MB region of VRAM. Color encodes occupancy using the OCS-era palette (green -> yellow -> red), matching GSD-OS's retro aesthetic [5].

```glsl
// vram_heatmap.frag
precision mediump float;

uniform sampler2D u_vram_map;    // 128x1 texture: occupancy per 64MB region
uniform float u_pressure;        // overall VRAM pressure 0.0-1.0
uniform float u_time;

varying vec2 v_uv;

vec3 pressureColor(float p) {
    // OCS-inspired palette: green -> amber -> red
    vec3 green  = vec3(0.106, 0.369, 0.125);  // #1B5E20
    vec3 amber  = vec3(0.902, 0.318, 0.000);  // #E65100
    vec3 red    = vec3(0.863, 0.078, 0.235);  // #DC1438

    if (p < 0.6) return mix(green, amber, p / 0.6);
    return mix(amber, red, (p - 0.6) / 0.4);
}

void main() {
    float occupancy = texture2D(u_vram_map, vec2(v_uv.x, 0.5)).r;
    vec3 color = pressureColor(occupancy);

    // Subtle pulse on high-pressure cells
    if (occupancy > 0.85) {
        float pulse = sin(u_time * 3.0) * 0.1 + 0.9;
        color *= pulse;
    }

    gl_FragColor = vec4(color, 1.0);
}
```

### VRAM Region Mapping

| Region (MB) | Typical Occupant | Color (Normal) |
|---|---|---|
| 0 - 256 | CUDA runtime, driver | Green |
| 256 - 4756 | Base model (Q4_K_M) | Green-Amber |
| 4756 - 5176 | Adapter 1 (420 MB) | Varies by pressure |
| 5176 - 5688 | KV cache (512 MB) | Varies by inference load |
| 5688 - 6000 | Budget headroom | Green (target free) |
| 6000 - 8192 | Overflow / training | Red (when active) |

---

## 7. Stream Utilization Visualization

### Six-Lane Pipeline Display

Stream utilization renders as a vertical bar chart with six lanes, one per pipeline stage. Each lane shows the stream's current state (idle, executing, waiting) with animated flow indicators when kernels are running [5].

```
STREAM UTILIZATION DISPLAY
================================================================

  Observe   Detect   Suggest   Apply   Learn   Compose
  ┌──┐     ┌──┐     ┌──┐     ┌──┐    ┌──┐    ┌──┐
  │  │     │▓▓│     │  │     │▓▓│    │░░│    │  │
  │  │     │▓▓│     │  │     │▓▓│    │░░│    │  │
  │  │     │▓▓│     │  │     │▓▓│    │░░│    │  │
  │░░│     │▓▓│     │  │     │▓▓│    │░░│    │  │
  │░░│     │▓▓│     │  │     │▓▓│    │░░│    │  │
  └──┘     └──┘     └──┘     └──┘    └──┘    └──┘
   6%       20%       0%      30%     25%      0%

  ▓▓ = high priority active   ░░ = low priority active
  (empty) = idle
```

### Animation Shader

The stream visualization uses instanced rendering with 6 quad instances. Each instance reads its stream state from the uniform buffer and adjusts height, color, and animation speed accordingly.

---

## 8. Adapter Activation Timeline

### Time-Series Ribbon

The adapter activation timeline displays which adapter was active over the last 30 seconds as a horizontal ribbon chart. Each adapter is assigned a color from the dashboard palette. Transitions (hot-swaps) are shown as vertical markers with latency annotations [5].

```
ADAPTER ACTIVATION TIMELINE (30 seconds)
================================================================

  frontend-patterns  ████████████████░░░░░░░░░░████████████
  test-gen           ░░░░░░░░░░░░░░░░██████████░░░░░░░░░░░░
  cloud API          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

  ─────────────────────────────────────────────────────────
  -30s              -20s              -10s              now

  Swap markers (vertical lines) show hot-swap latency:
    ↓ 112ms        ↓ 98ms           ↓ 125ms
```

---

## 9. Thermal Monitoring and Alerts

### Temperature Thresholds

| Threshold | Action | Dashboard Indicator |
|---|---|---|
| < 65 C | Normal operation | Green temperature badge |
| 65-72 C | Elevated; training active | Amber temperature badge |
| 72-78 C | Training pause recommended | Amber pulse animation |
| 78-83 C | Training paused automatically | Red badge + warning overlay |
| > 83 C | Thermal throttle active | Red pulse + clock speed display |

### PNW Summer Note

The RTX 4060 Ti operates in a PNW workstation environment where summer ambient temperatures can reach 30-35 C (compared to 20-22 C in climate-controlled data centers). This 10-15 C ambient difference translates directly to higher GPU temperatures under load. The dashboard's thermal warning thresholds are calibrated for PNW conditions, not data center conditions [3].

> **SAFETY WARNING:** Thermal throttling reduces GPU clock speeds unpredictably, extending training time and potentially causing timeout failures in the inference pipeline. The dashboard must surface thermal state prominently -- not buried in a metrics panel, but visible at all times. A throttling GPU is a degraded system.

---

## 10. Performance Budget

### Dashboard CPU Overhead

| Component | CPU Usage | GPU Usage | Memory |
|---|---|---|---|
| NVML polling (Rust) | 0.3-0.5% | 0% | 2 MB |
| JSONL writing | 0.1% | 0% | 1 MB |
| WebGL rendering (4 Hz) | 0.8-1.2% | 0.5% | 8 MB |
| **Total** | **1.2-1.8%** | **0.5%** | **11 MB** |

Target: total dashboard overhead < 2% CPU, < 1% GPU. Measured values are within budget on i7-6700K + RTX 4060 Ti [3].

### Rendering Frame Budget

At 4 Hz refresh, each frame has a 250ms budget. The actual WebGL render time for the three dashboard components is approximately 2-4ms per frame, leaving 246ms of idle time. This generous budget allows the dashboard to degrade gracefully under system load -- if a frame is delayed, the dashboard simply shows the previous state until the next cycle [5].

---

## 11. GSD Integration Patterns

### Amiga Denise Register Map Parallel

The Denise chip in the original Amiga exposed display state through hardware registers at documented memory addresses. Programmers could read VPOSR (vertical beam position), DMACONR (DMA control), and COLOR00-COLOR31 (palette) directly. GSD-OS's Denise panel follows this model: each NVML metric has a named "register" in the dashboard's state object [5].

```javascript
// Denise panel register map
const registers = {
    VRAM_USED:   { addr: 0x00, value: 0, unit: 'MB',  poll: 250 },
    VRAM_TOTAL:  { addr: 0x04, value: 0, unit: 'MB',  poll: 250 },
    GPU_UTIL:    { addr: 0x08, value: 0, unit: '%',   poll: 250 },
    MEM_BW:      { addr: 0x0C, value: 0, unit: '%',   poll: 500 },
    TEMP:        { addr: 0x10, value: 0, unit: 'C',   poll: 1000 },
    POWER:       { addr: 0x14, value: 0, unit: 'mW',  poll: 1000 },
    CLOCK:       { addr: 0x18, value: 0, unit: 'MHz', poll: 1000 },
    STREAM_0:    { addr: 0x20, value: 0, unit: 'state', poll: 250 },
    STREAM_1:    { addr: 0x24, value: 0, unit: 'state', poll: 250 },
    STREAM_2:    { addr: 0x28, value: 0, unit: 'state', poll: 250 },
    STREAM_3:    { addr: 0x2C, value: 0, unit: 'state', poll: 250 },
    STREAM_4:    { addr: 0x30, value: 0, unit: 'state', poll: 250 },
    STREAM_5:    { addr: 0x34, value: 0, unit: 'state', poll: 250 },
};
```

---

## 12. Cross-References

> **Related:** [CUDA Stream Orchestration](01-cuda-stream-orchestration.md) -- Stream state data that feeds the utilization visualization. [LoRA Adapter Pipeline](02-lora-adapter-pipeline.md) -- Adapter activation events displayed in the timeline. [Chipset Intent Router](04-chipset-intent-router.md) -- Routing decisions annotated on the adapter timeline with confidence scores.

**Cross-project references:**
- **SYS** (Systems Admin) -- Hardware monitoring patterns; SNMP/NVML parallels for infrastructure telemetry
- **GSD2** (GSD-2 Architecture) -- Dashboard panel system and event bus architecture
- **ACE** (Compute Engine) -- Prometheus/Grafana GPU metrics that complement the real-time Denise panel
- **SGL** (Signal & Light) -- WebGL shader patterns shared with LED/POV visualization
- **MCF** (Multi-Cluster Federation) -- Federated telemetry aggregation for multi-node GPU monitoring
- **OCN** (Open Compute) -- BMC/IPMI telemetry standards that parallel NVML for data center GPUs

---

## 13. Sources

1. GSD-OS Desktop specification, *gsd-os-desktop-vision.md*. Tauri IPC bridge and filesystem event bus.
2. NVIDIA, *NVML API Reference Guide* (2026). Available: docs.nvidia.com/deploy/nvml-api/
3. Measured on local workstation: i7-6700K, 60 GB RAM, RTX 4060 Ti 8GB. PNW ambient conditions.
4. nvml-wrapper Rust crate, *Documentation* (2026). Available: crates.io/crates/nvml-wrapper
5. GSD-OS Denise Panel specification. WebGL shader pipeline architecture and register map design.
6. NVIDIA, *Nsight Systems User Guide* (2025). Available: docs.nvidia.com/nsight-systems/
7. Khronos Group, *WebGL 2.0 Specification* (2023). Available: khronos.org/webgl/
8. Tauri Documentation, *Inter-Process Communication* (2026). Available: tauri.app/v2/concepts/inter-process-communication/
9. O'Reilly, *AI Systems Performance Engineering*, Ch. 6 (GPU Architecture), November 2025.
10. NVIDIA, *CUDA Programming Guide v12.x* (2026). Host callbacks and stream telemetry.
11. Original Amiga Hardware Reference Manual, *Denise Chip Register Map*. Commodore-Amiga Inc., 1985.
12. Mozilla Developer Network, *WebGL Uniform Buffer Objects* (2026). Available: developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/
13. NVIDIA, *Data Center GPU Manager (DCGM) Documentation* (2026). Enterprise telemetry alternative to direct NVML.
14. GSD-OS Filesystem Event Bus specification. JSONL format and rotation policy.
15. Valve Software, *Steam Deck GPU Telemetry* (2024). Consumer-grade GPU monitoring patterns.
