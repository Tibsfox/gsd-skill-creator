# GPU Observability and GSD-OS Monitoring

> **Domain:** GPU Metrics, Telemetry, and Dashboard Engineering
> **Module:** 6 -- NVML, DCGM Exporter, OpenTelemetry, Prometheus 3.0, Grafana Alloy, and GSD-OS Monitoring Dashboards
> **Through-line:** *Paula listened to everything. Four DMA channels of audio, disk I/O, serial port, parallel port -- all flowing through one chip that never missed a beat. The observability stack is Paula for GSD-OS: it monitors GPU temperature, shader occupancy, memory pressure, and skill-creator throughput without interrupting the workloads it measures. The system that watches must never slow down the system it watches.*

---

## Table of Contents

1. [GPU Metrics Landscape](#1-gpu-metrics-landscape)
2. [NVML: NVIDIA Management Library](#2-nvml-nvidia-management-library)
3. [DCGM Exporter](#3-dcgm-exporter)
4. [OpenTelemetry for GPU Workloads](#4-opentelemetry-for-gpu-workloads)
5. [Prometheus 3.0 and Resource Attributes](#5-prometheus-30-and-resource-attributes)
6. [Grafana Alloy Pipeline](#6-grafana-alloy-pipeline)
7. [Raspberry Pi SoC Observability](#7-raspberry-pi-soc-observability)
8. [GSD-OS Dashboard Specifications](#8-gsd-os-dashboard-specifications)
9. [Alert Engineering](#9-alert-engineering)
10. [The Observability Pipeline End-to-End](#10-the-observability-pipeline-end-to-end)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. GPU Metrics Landscape

GPU observability operates at four layers [1]:

```
GPU OBSERVABILITY STACK
================================================================

  Layer 4: Application Metrics
    - Shader compile time, draw calls/frame, frame time
    - GSD skill-creator: wave completion, context window usage
    - Custom OTel SDK instrumentation

  Layer 3: Driver/Runtime Metrics
    - NVML: utilization, clock speeds, throttle reasons
    - Vulkan: pipeline statistics queries
    - OpenGL: GL_ARB_timer_query, GL_ARB_pipeline_statistics_query

  Layer 2: Hardware Counters
    - NVIDIA: SM active warps, L2 cache hit rate, DRAM bandwidth
    - AMD: shader engine utilization, texture unit activity
    - Accessible via NSight, GPU Profiler, or vendor SDKs

  Layer 1: Physical Sensors
    - Temperature (GPU die, memory, hotspot)
    - Power draw (board power, TDP percentage)
    - Fan speed (RPM, percentage)
    - Accessible via NVML, sysfs, IPMI
```

### Key Metrics Taxonomy

| Metric | Unit | Source | Why It Matters |
|---|---|---|---|
| GPU Utilization | % | NVML | Overall GPU busy percentage |
| Memory Utilization | % | NVML | VRAM bandwidth usage |
| GPU Temperature | Celsius | NVML/sysfs | Thermal throttling threshold |
| Power Draw | Watts | NVML | Thermal envelope compliance |
| Clock Speed | MHz | NVML | Boost clock vs. thermal throttle |
| Fan Speed | RPM/% | NVML | Cooling system health |
| PCIe Bandwidth | GB/s | NVML | CPU-GPU transfer bottleneck |
| ECC Errors | Count | NVML | Memory reliability (data center) |
| Frame Time | ms | Application | Rendering performance |
| Shader Occupancy | % | Profiler | SIMD utilization |

---

## 2. NVML: NVIDIA Management Library

NVML (NVIDIA Management Library) is the C API underlying `nvidia-smi` and all NVIDIA GPU monitoring tools [2]:

```
NVML API HIERARCHY
================================================================

  nvmlInit_v2()
       |
       v
  nvmlDeviceGetHandleByIndex(0, &device)
       |
       +---> nvmlDeviceGetTemperature(device, NVML_TEMPERATURE_GPU, &temp)
       +---> nvmlDeviceGetUtilizationRates(device, &utilization)
       |         utilization.gpu  (0-100%)
       |         utilization.memory (0-100%)
       +---> nvmlDeviceGetPowerUsage(device, &power)    // milliwatts
       +---> nvmlDeviceGetClockInfo(device, NVML_CLOCK_GRAPHICS, &clock)
       +---> nvmlDeviceGetMemoryInfo(device, &memInfo)
       |         memInfo.total    (bytes)
       |         memInfo.used     (bytes)
       |         memInfo.free     (bytes)
       +---> nvmlDeviceGetFanSpeed(device, &speed)      // percentage
       +---> nvmlDeviceGetPcieThroughput(device, NVML_PCIE_UTIL_TX_BYTES, &tx)
       |
       v
  nvmlShutdown()
```

### Sampling Rates

NVML updates internal counters at approximately 1-second intervals. Querying faster than 1Hz returns the same values. For thermal monitoring, 5-15 second intervals are standard. For utilization tracking, 1-second intervals provide adequate resolution [2].

### Throttle Reason Bitfield

```
nvmlDeviceGetCurrentClocksThrottleReasons(device, &reasons)

Bit flags:
  nvmlClocksThrottleReasonGpuIdle              = 0x0001
  nvmlClocksThrottleReasonApplicationsClocksSetting = 0x0002
  nvmlClocksThrottleReasonSwPowerCap           = 0x0004
  nvmlClocksThrottleReasonHwSlowdown           = 0x0008  // THERMAL
  nvmlClocksThrottleReasonSyncBoost            = 0x0010
  nvmlClocksThrottleReasonSwThermalSlowdown    = 0x0020
  nvmlClocksThrottleReasonHwThermalSlowdown    = 0x0040
  nvmlClocksThrottleReasonHwPowerBrakeSlowdown = 0x0080
```

> **SAFETY WARNING:** GPU temperatures exceeding 90C trigger hardware thermal throttling on most NVIDIA GPUs. Sustained operation above 83C reduces boost clock speeds. The RTX 4060 Ti has a maximum operating temperature of 90C (NVIDIA specification [3]). Monitoring must alert at 80C (warning) and 85C (critical) to prevent throttling-induced performance degradation.

---

## 3. DCGM Exporter

NVIDIA's Data Center GPU Manager (DCGM) suite provides a Prometheus-format metrics exporter for GPU monitoring [4]:

### Key DCGM Metrics

| DCGM Field ID | Prometheus Metric | Description |
|---|---|---|
| DCGM_FI_DEV_GPU_UTIL | `DCGM_FI_DEV_GPU_UTIL` | GPU utilization (%) |
| DCGM_FI_DEV_GPU_TEMP | `DCGM_FI_DEV_GPU_TEMP` | GPU temperature (C) |
| DCGM_FI_DEV_POWER_USAGE | `DCGM_FI_DEV_POWER_USAGE` | Power draw (W) |
| DCGM_FI_DEV_MEM_COPY_UTIL | `DCGM_FI_DEV_MEM_COPY_UTIL` | Memory bandwidth util (%) |
| DCGM_FI_DEV_FB_USED | `DCGM_FI_DEV_FB_USED` | Framebuffer memory used (MB) |
| DCGM_FI_DEV_FB_FREE | `DCGM_FI_DEV_FB_FREE` | Framebuffer memory free (MB) |
| DCGM_FI_DEV_PCIE_TX_THROUGHPUT | `DCGM_FI_DEV_PCIE_TX_THROUGHPUT` | PCIe TX (KB/s) |
| DCGM_FI_DEV_PCIE_RX_THROUGHPUT | `DCGM_FI_DEV_PCIE_RX_THROUGHPUT` | PCIe RX (KB/s) |
| DCGM_FI_DEV_SM_CLOCK | `DCGM_FI_DEV_SM_CLOCK` | SM clock (MHz) |
| DCGM_FI_DEV_CLOCK_THROTTLE_REASONS | `DCGM_FI_DEV_CLOCK_THROTTLE_REASONS` | Throttle bitfield |

### Deployment

```
DCGM EXPORTER DEPLOYMENT
================================================================

  Option A: Container (recommended)
    docker run --gpus all -p 9400:9400 \
      nvcr.io/nvidia/k8s/dcgm-exporter:3.3.0-3.2.0-ubuntu22.04

  Option B: Systemd service
    dcgm-exporter -f /etc/dcgm-exporter/custom-counters.csv \
                  -d 15000 \    # 15-second collection interval
                  -r localhost:9400

  Verify: curl localhost:9400/metrics
    # TYPE DCGM_FI_DEV_GPU_UTIL gauge
    DCGM_FI_DEV_GPU_UTIL{gpu="0",UUID="GPU-..."} 45
```

### Custom Counter Selection

The default DCGM counter set includes approximately 40 metrics. For GSD-OS desktop monitoring, a reduced set of 10-12 metrics minimizes scrape overhead while covering all alerting needs [4].

---

## 4. OpenTelemetry for GPU Workloads

OpenTelemetry (OTel) reached GA for all three signal types (traces, metrics, logs) in 2025 [5]. Instrumenting GPU workloads requires bridging hardware metrics into the OTel pipeline:

```
OTEL GPU INSTRUMENTATION ARCHITECTURE
================================================================

  GPU Hardware Sensors
       |
       v
  NVML / DCGM Exporter (Prometheus format)
       |
       v
  OTel Collector (Grafana Alloy)
       |
       +---> Prometheus receiver: scrapes DCGM endpoint
       +---> OTLP receiver: accepts OTel SDK spans/metrics
       |
       v
  Processor pipeline
       |
       +---> batch: aggregates for efficient export
       +---> resource: adds gsd.environment, host.name
       +---> filter: drops low-value metrics
       |
       v
  Exporters
       |
       +---> Prometheus remote write (self-hosted)
       +---> OTLP/HTTP to Grafana Cloud
       +---> File exporter (debug/audit)
```

### GSD Skill-Creator OTel SDK Instrumentation

The skill-creator instruments custom metrics via the OTel SDK [5]:

```typescript
// GSD-OS OTel SDK instrumentation points
const meter = opentelemetry.metrics.getMeter('gsd-skill-creator');

// Gauge: active context window utilization
const contextUtil = meter.createObservableGauge('gsd.context.utilization', {
    description: 'Percentage of context window consumed',
    unit: '%'
});

// Counter: completed wave count
const wavesCompleted = meter.createCounter('gsd.waves.completed', {
    description: 'Total waves completed across all missions'
});

// Histogram: wave execution time
const waveLatency = meter.createHistogram('gsd.wave.duration', {
    description: 'Wave execution duration',
    unit: 'ms',
    boundaries: [1000, 5000, 15000, 30000, 60000, 120000]
});
```

---

## 5. Prometheus 3.0 and Resource Attributes

Prometheus 3.0 introduced native OTLP ingestion and resource attribute promotion [6]:

### Resource Attribute Promotion

Previously, OTel resource attributes (service.name, service.instance.id) were stored in a separate `target_info` metric, requiring complex PromQL joins to correlate with data metrics. Prometheus 3.0 promotes resource attributes directly as metric labels [6]:

```
# Before (Prometheus 2.x with OTel):
DCGM_FI_DEV_GPU_TEMP{gpu="0"} 72
target_info{service_name="dcgm-exporter", instance="gpu-host:9400"} 1

# After (Prometheus 3.0):
DCGM_FI_DEV_GPU_TEMP{gpu="0", service_name="dcgm-exporter"} 72
```

This eliminates the join overhead and makes GPU metrics directly queryable by service identity.

### PromQL for GPU Monitoring

Key queries for GSD-OS GPU dashboards:

```promql
# GPU temperature over time
DCGM_FI_DEV_GPU_TEMP{gpu="0"}

# 5-minute rate of change (detect thermal ramp)
deriv(DCGM_FI_DEV_GPU_TEMP{gpu="0"}[5m])

# GPU utilization average (1-minute window)
avg_over_time(DCGM_FI_DEV_GPU_UTIL{gpu="0"}[1m])

# Memory pressure: used / total
DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) * 100

# PCIe bandwidth utilization
(DCGM_FI_DEV_PCIE_TX_THROUGHPUT + DCGM_FI_DEV_PCIE_RX_THROUGHPUT)
  / 1024 / 1024  # Convert KB/s to GB/s

# Throttling detection (any throttle reason active)
DCGM_FI_DEV_CLOCK_THROTTLE_REASONS > 0
```

---

## 6. Grafana Alloy Pipeline

Grafana Alloy (successor to Grafana Agent, announced GrafanaCON 2024, Agent EOL November 2025) is the recommended OTel Collector for the Grafana ecosystem [7]:

### Complete GSD-OS Alloy Configuration

```yaml
# grafana-alloy-config.yaml — GSD-OS GPU Observability Pipeline

receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: 'dcgm-gpu-metrics'
          scrape_interval: 15s
          static_configs:
            - targets: ['localhost:9400']
          metric_relabel_configs:
            - source_labels: [__name__]
              regex: 'DCGM_FI_DEV_(GPU_UTIL|GPU_TEMP|POWER_USAGE|MEM_COPY_UTIL|FB_USED|FB_FREE|SM_CLOCK|PCIE_TX_THROUGHPUT|PCIE_RX_THROUGHPUT|CLOCK_THROTTLE_REASONS)'
              action: keep

        - job_name: 'node-exporter'
          scrape_interval: 30s
          static_configs:
            - targets: ['localhost:9100']

        - job_name: 'gsd-skill-creator'
          scrape_interval: 10s
          static_configs:
            - targets: ['localhost:8888']

  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024
  resource:
    attributes:
      - action: insert
        key: gsd.environment
        value: gsd-os-desktop
      - action: insert
        key: gsd.version
        value: "1.49"
  filter:
    metrics:
      exclude:
        match_type: regexp
        metric_names:
          - "go_.*"
          - "promhttp_.*"

exporters:
  prometheusremotewrite:
    endpoint: "http://localhost:9090/api/v1/write"
    resource_to_telemetry_conversion:
      enabled: true

service:
  pipelines:
    metrics:
      receivers: [prometheus, otlp]
      processors: [batch, resource, filter]
      exporters: [prometheusremotewrite]
```

> **SAFETY WARNING:** OTel configuration files must never contain literal API keys or cloud tokens. All credentials must be referenced via environment variables (`${GRAFANA_CLOUD_TOKEN}`). The GSD-OS configuration above uses only localhost endpoints. Cloud export configurations should reference secrets from a credential store, not from YAML files committed to version control [7].

---

## 7. Raspberry Pi SoC Observability

The Raspberry Pi 5 (BCM2712) exposes hardware metrics via the Linux sysfs interface [8]:

### Temperature Sensors

```bash
# GPU temperature (VideoCore VII)
cat /sys/class/thermal/thermal_zone0/temp
# Returns millidegrees Celsius (e.g., 52000 = 52.0 C)

# CPU temperature (Cortex-A76 cluster)
cat /sys/class/thermal/thermal_zone1/temp
```

### VideoCore Utilization

The VideoCore VII does not expose utilization directly via sysfs. Custom monitoring requires:
- `vcgencmd measure_temp` -- GPU temperature
- `vcgencmd measure_clock arm` -- CPU clock
- `vcgencmd measure_clock core` -- GPU core clock
- `vcgencmd measure_volts` -- Voltage
- `vcgencmd get_throttled` -- Throttle flags (bit field)

### Throttle Flag Interpretation

```
vcgencmd get_throttled
# Returns: throttled=0x50005

Bit 0:  Under-voltage detected
Bit 1:  Arm frequency capped
Bit 2:  Currently throttled
Bit 3:  Soft temperature limit active
Bit 16: Under-voltage has occurred
Bit 17: Arm frequency capping has occurred
Bit 18: Throttling has occurred
Bit 19: Soft temperature limit has occurred
```

The Pi 5 throttles at 85C. The default active cooling (official fan case) keeps temperatures below 65C under sustained Vulkan compute workloads [8].

### node_exporter for Pi Metrics

The standard Prometheus `node_exporter` collects CPU, memory, disk, and network metrics. For GPU-specific Pi metrics, a custom collector script writes to the `textfile` collector directory:

```bash
#!/bin/bash
# /etc/node_exporter/pi_gpu_metrics.sh
TEMP=$(cat /sys/class/thermal/thermal_zone0/temp)
THROTTLE=$(vcgencmd get_throttled | cut -d= -f2)
CLOCK=$(vcgencmd measure_clock core | cut -d= -f2)

cat << EOF > /var/lib/node_exporter/textfile_collector/pi_gpu.prom
# HELP pi_gpu_temp_celsius VideoCore GPU temperature
# TYPE pi_gpu_temp_celsius gauge
pi_gpu_temp_celsius ${TEMP%???}.${TEMP: -3:1}
# HELP pi_gpu_throttled Throttle status bitfield
# TYPE pi_gpu_throttled gauge
pi_gpu_throttled $((THROTTLE))
# HELP pi_gpu_clock_hz VideoCore core clock
# TYPE pi_gpu_clock_hz gauge
pi_gpu_clock_hz ${CLOCK}
EOF
```

---

## 8. GSD-OS Dashboard Specifications

Five pre-built Grafana dashboards for GSD-OS GPU monitoring:

### Dashboard 1: GPU Health

| Panel | Query | Visualization |
|---|---|---|
| Temperature | `DCGM_FI_DEV_GPU_TEMP` | Time series with 80C/85C thresholds |
| Utilization | `DCGM_FI_DEV_GPU_UTIL` | Gauge (0-100%) |
| Memory Usage | `DCGM_FI_DEV_FB_USED / (FB_USED + FB_FREE) * 100` | Bar gauge |
| Power Draw | `DCGM_FI_DEV_POWER_USAGE` | Time series with TDP line |
| Clock Speed | `DCGM_FI_DEV_SM_CLOCK` | Stat with boost/base reference |
| Throttle Status | `DCGM_FI_DEV_CLOCK_THROTTLE_REASONS > 0` | Status map |
| PCIe Bandwidth | `DCGM_FI_DEV_PCIE_TX + RX` | Time series (GB/s) |

### Dashboard 2: Raspberry Pi SoC

| Panel | Query | Visualization |
|---|---|---|
| CPU Temperature | `node_thermal_zone_temp{zone="0"}` | Gauge with color thresholds |
| GPU Temperature | `pi_gpu_temp_celsius` | Gauge |
| CPU Utilization | `1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m]))` | Time series |
| Memory Usage | `node_memory_MemTotal - node_memory_MemAvailable` | Bar gauge |
| Throttle Events | `pi_gpu_throttled` | Status map with bit decode |
| Disk I/O | `rate(node_disk_read_bytes_total[1m])` | Time series |
| Network | `rate(node_network_receive_bytes_total[1m])` | Time series |

### Dashboard 3: GSD Skill Metrics

| Panel | Query | Visualization |
|---|---|---|
| Context Utilization | `gsd_context_utilization` | Gauge (0-100%) |
| Waves Completed | `gsd_waves_completed` | Counter stat |
| Wave Duration | `histogram_quantile(0.95, gsd_wave_duration)` | Histogram heatmap |
| Active Skills | `gsd_skills_loaded` | Stat |
| Token Throughput | `rate(gsd_tokens_processed[5m])` | Time series |
| Error Rate | `rate(gsd_errors_total[5m])` | Time series with alert threshold |

### Dashboard 4: Audio DSP Latency

| Panel | Query | Visualization |
|---|---|---|
| Round-Trip Latency | `audio_roundtrip_latency_ms` | Gauge with <10ms target |
| Buffer Underruns | `rate(audio_xrun_total[1m])` | Counter |
| DSP CPU Load | `audio_dsp_cpu_percent` | Time series |
| Sample Rate | `audio_sample_rate_hz` | Stat |
| Channel Count | `audio_active_channels` | Stat |

### Dashboard 5: Pipeline Health

| Panel | Query | Visualization |
|---|---|---|
| OTel Collector Up | `up{job="otel-collector"}` | Status indicator |
| Scrape Duration | `scrape_duration_seconds` | Time series per target |
| Metrics Ingested | `rate(otelcol_receiver_accepted_metric_points[1m])` | Time series |
| Export Errors | `rate(otelcol_exporter_send_failed_metric_points[1m])` | Time series |
| Queue Depth | `otelcol_exporter_queue_size` | Gauge |
| Prometheus Write Latency | `prometheus_remote_storage_sent_batch_duration_seconds` | Histogram |

---

## 9. Alert Engineering

### Alert Rules

```yaml
# GSD-OS GPU Alert Rules (Prometheus alerting rules)
groups:
  - name: gpu_health
    rules:
      - alert: GPUTemperatureWarning
        expr: DCGM_FI_DEV_GPU_TEMP > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "GPU temperature {{ $value }}C exceeds 80C"

      - alert: GPUTemperatureCritical
        expr: DCGM_FI_DEV_GPU_TEMP > 85
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "GPU temperature {{ $value }}C approaching thermal limit"

      - alert: GPUMemoryPressure
        expr: DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "GPU VRAM usage exceeds 90%"

      - alert: GPUThrottling
        expr: DCGM_FI_DEV_CLOCK_THROTTLE_REASONS > 0
        for: 30s
        labels:
          severity: warning
        annotations:
          summary: "GPU throttling detected: reason {{ $value }}"

  - name: pi_soc_health
    rules:
      - alert: PiOverheating
        expr: pi_gpu_temp_celsius > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Pi 5 temperature {{ $value }}C approaching throttle threshold"

  - name: gsd_health
    rules:
      - alert: GSDHighErrorRate
        expr: rate(gsd_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "GSD skill-creator error rate elevated"
```

---

## 10. The Observability Pipeline End-to-End

```
COMPLETE GSD-OS OBSERVABILITY PIPELINE
================================================================

  HARDWARE LAYER
  +------------------+    +------------------+
  | NVIDIA RTX GPU   |    | Raspberry Pi 5   |
  | NVML sensors     |    | sysfs / vcgencmd |
  +--------+---------+    +--------+---------+
           |                        |
  COLLECTION LAYER
  +--------v---------+    +--------v---------+
  | DCGM Exporter    |    | node_exporter +  |
  | :9400/metrics     |    | textfile coll.  |
  +--------+---------+    | :9100/metrics    |
           |               +--------+---------+
           |                        |
  +--------v------------------------v---------+
  |         Grafana Alloy (OTel Collector)     |
  |  Prometheus receiver  |  OTLP receiver     |
  |  batch + resource processors               |
  +--------+-----------------------------------+
           |
  STORAGE LAYER
  +--------v---------+
  | Prometheus 3.0   |    (or Grafana Cloud Mimir)
  | TSDB storage     |
  | 15-day retention |
  +--------+---------+
           |
  VISUALIZATION LAYER
  +--------v---------+
  | Grafana          |
  | 5 Dashboards     |
  | Alert Manager    |
  +------------------+
           |
  ACTION LAYER
  +--------v---------+
  | GSD-OS Desktop   |
  | Tauri event bus  |
  | Skill-creator    |
  | Auto-scaling     |
  +------------------+
```

The pipeline achieves end-to-end latency of approximately 15-30 seconds from hardware sensor reading to Grafana dashboard display (15s scrape interval + batch + write + query). For the GSD-OS desktop use case, this latency is acceptable -- GPU thermal events develop over minutes, not milliseconds [1].

---

## 11. Cross-References

> **Related:** [GPU Graphics Pipeline](01-gpu-graphics-pipeline.md) -- the workloads being monitored. [Vulkan and Modern APIs](02-vulkan-modern-apis.md) -- Vulkan pipeline statistics queries. [Shader Programming](05-shader-programming.md) -- shader profiling via GPU counters.

**Series cross-references:**
- **GPO (GPU Orchestration):** Observability feeds orchestration decisions (scale up/down, thermal throttle)
- **SYS (Systems Admin):** System monitoring extends GPU monitoring to full-stack
- **K8S (Kubernetes):** GPU device plugin metrics in containerized workloads
- **ACE (Compute Engine):** Cloud GPU monitoring via DCGM in remote instances
- **SGL (Signal & Light):** Audio DSP latency monitoring (Dashboard 4)
- **GSD2 (GSD-2 Architecture):** Paula chip role formalized as observability coprocessor
- **CMH (Computational Mesh):** Mesh processing GPU utilization tracking
- **MPC (Math Co-Processor):** Math stream VRAM monitoring via NVML

---

## 12. Sources

1. NVIDIA. "NVIDIA Data Center GPU Manager (DCGM) Documentation." docs.nvidia.com/datacenter/dcgm, 2024.
2. NVIDIA. "NVIDIA Management Library (NVML) API Reference." docs.nvidia.com/deploy/nvml-api, 2024.
3. NVIDIA. "GeForce RTX 4060 Ti Specifications." nvidia.com/en-us/geforce, 2023.
4. NVIDIA. "DCGM Exporter." github.com/NVIDIA/dcgm-exporter, 2024.
5. OpenTelemetry. "OpenTelemetry Specification." opentelemetry.io/docs, 2025.
6. Grafana Labs. "Prometheus 3.0: Native OTel Support and Resource Attribute Promotion." grafana.com/blog, 2025.
7. Grafana Labs. "Grafana Alloy Documentation." grafana.com/docs/alloy, 2024.
8. Raspberry Pi Foundation. "Raspberry Pi 5 Documentation: Hardware." raspberrypi.com/documentation, 2024.
9. Grafana Labs. "Grafana AI Observability with GPU Monitoring." grafana.com/whats-new, February 2025.
10. Grafana Labs. "2024 Observability Survey." grafana.com/observability-survey, 2024.
11. Prometheus Authors. "Prometheus 3.0 Release Notes." prometheus.io/blog, 2025.
12. NVIDIA. "NVIDIA GPU Monitoring in Kubernetes." docs.nvidia.com/datacenter/cloud-native, 2024.
13. Grafana Labs. "Grafana Alloy: Migrating from Grafana Agent." grafana.com/docs/alloy/latest/get-started/migrating-from-agent, 2025.
14. OpenTelemetry. "OpenTelemetry Collector Contrib: Prometheus Receiver." github.com/open-telemetry/opentelemetry-collector-contrib, 2024.
15. Prometheus Authors. "Alerting Rules." prometheus.io/docs/prometheus/latest/configuration/alerting_rules, 2024.
16. Raspberry Pi Foundation. "vcgencmd Documentation." raspberrypi.com/documentation/computers/os.html, 2024.

---

*GPU Ecosystem -- Module 6: GPU Observability and GSD-OS Monitoring. Paula never missed a beat. The observability stack should not either.*
