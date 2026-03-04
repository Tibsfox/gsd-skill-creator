---
title: "Hardware Expansion Pack"
description: "Home lab infrastructure for the mesh architecture — from Raspberry Pi edge nodes to multi-GPU workstations and creative production gear"
template: essay
schema_type: Article
tags:
  - hardware
  - homelab
  - mesh-architecture
  - infrastructure
  - creative-production
nav_section: essays
nav_order: 4
agent_visible: true
agent_priority: high
author: Maple
date: "2026-03-03"
comments: true
---

# Hardware Expansion Pack: Home Lab Infrastructure for the Mesh Architecture

**Status:** Draft  
**Date:** March 3, 2026  
**Author:** Maple  
**Companion to:** `draft-proposal-skill-creator-mesh-architecture.md`, `proposed-changes-mesh-architecture.md`

---

## Executive Summary

The mesh architecture proposal identifies local LLMs on commodity hardware as Layer 2 nodes communicating back to claude.ai through Skill Creator's MCP server. This document is the physical layer — the hardware, networking, storage, and creative production infrastructure that makes the mesh real. It covers every pathway from a first Raspberry Pi running a 1B parameter model to a multi-GPU rack serving 70B models via vLLM, and extends into the creative production domain: streaming, audio/video editing, cinematography, and full studio design. Every section maps back to the mesh architecture's chipset philosophy — specialized, constrained components that compose intelligently.

---

## 1. The Hardware Tiers: Mapping Compute to Mesh Roles

The mesh architecture doesn't require uniform hardware. Different nodes serve different purposes, and the chipset philosophy applies to hardware just as it does to software agents. A Raspberry Pi can be a mesh node. So can a dual-GPU workstation. The key is that each node knows what it's good at and the mesh coordinator routes accordingly.

### Tier Overview

| Tier | Hardware Class | Model Capability | Mesh Role | Approx. Cost |
|---|---|---|---|---|
| **Edge** | Raspberry Pi 5, Orange Pi, Jetson Orin | 0.5B–4B quantized | Sensor processing, simple classification, IoT integration, always-on lightweight inference | $75–$500 |
| **Desktop Entry** | Office PC (Intel N100/i5, 16GB RAM, no discrete GPU) | 1B–7B quantized (CPU-only via llama.cpp) | General-purpose skill execution, document processing, low-concurrency inference | $400–$800 |
| **Desktop Mid** | Gaming rig (Ryzen 7/i7, 32GB RAM, RTX 3060–4070) | 7B–13B at good speed, 30B quantized feasible | Primary local inference node, skill benchmarking, development workstation | $1,200–$2,500 |
| **Desktop High** | Workstation (Ryzen 9/i9, 64GB RAM, RTX 4090/5090) | 30B–70B at usable speed, multiple concurrent models | Heavy inference, multi-model benchmarking, video/audio production, vLLM serving | $3,500–$8,000 |
| **Server** | Rack-mounted (dual Xeon/EPYC, 128GB+ RAM, multi-GPU) | 70B+ models, tensor parallelism, concurrent serving | Production mesh backbone, high-throughput inference, NAS, VM hosting | $5,000–$25,000+ |

Each tier maps to the `chipset.json` capability classes defined in the proposed changes document. The mesh coordinator uses these tiers to make routing decisions: extraction tasks to capable models, summarization to efficient ones, validation to whatever's free.

---

## 2. Edge Nodes: Raspberry Pi and Small Devices

### Why Edge Matters for the Mesh

Edge nodes are the always-on sentinels of the mesh. They don't need to run 70B models — they need to run small, fast, reliable models for specific tasks: classifying incoming data, preprocessing text, running lightweight skill validation, or acting as MCP relay points for the mesh discovery service.

### Hardware: Raspberry Pi 5

The Raspberry Pi 5 is the reference edge platform for the mesh. It runs a quad-core Arm Cortex-A76 with up to 8GB LPDDR4 RAM, and supports M.2 SSD storage via HAT. With 4-bit quantized models, it can run models up to approximately 4B parameters — slowly, but reliably.

**Recommended edge node configuration:**

- Raspberry Pi 5 (8GB)
- M.2 NVMe SSD (256GB minimum — model weights don't fit comfortably on SD cards)
- Active cooling (the official active cooler or a Pimoroni equivalent)
- PoE+ HAT for single-cable power and network
- Case with airflow (avoid sealed enclosures)

**Cost: ~$120–$150 fully configured**

### Models That Work on Edge

Research and benchmarks from 2025 show that several model families run well on Raspberry Pi hardware. The sweet spot is 1B–3B parameters with 4-bit quantization:

- **Qwen3 4B** — the best general-purpose option; strong instruction following, tool calling support, runs at roughly 5–8 tokens/second on Pi 5
- **Gemma 2B** — Google's efficient model; fast inference, low memory footprint (~3GB RAM), good for classification tasks
- **EXAONE 4.0 1.2B** — LG's agentic model; supports tool calling and flexible reasoning depth in under 2GB
- **Ministral 3B** — Mistral's small multimodal model; handles both text and basic vision tasks
- **Phi-4 Mini 3.8B** — Microsoft's reasoning model; functional but slow (~2 tokens/second for complex reasoning)
- **Granite 4.0 Micro 1B** — IBM's business-focused model; 128K context window, Apache 2.0 licensed

**Runtime recommendation:** Use `llama.cpp` directly rather than Ollama on Pi hardware. Benchmarks show Llamafile achieves up to 4x higher throughput and 30–40% lower power usage compared to Ollama on SBCs. Ollama is easier to configure but its defaults (4096 token context window, overhead from Go runtime) penalize constrained hardware.

### Beyond Raspberry Pi

- **NVIDIA Jetson Orin Nano** (~$250) — adds GPU acceleration for edge inference; supports TensorRT-optimized models with FP16/INT8 inference. Peak throughput exceeds 100 TFLOPS for deep learning. Overkill for text-only tasks, but essential if the edge node handles vision or multimodal skills.
- **Orange Pi 5 Pro** — RISC-V alternative with 16GB RAM; higher power draw (~14W vs 10W for Pi 5) but better throughput for models in the 3B–7B range.
- **Google Coral TPU** — USB or M.2 accelerator for INT8 quantized models; excels at sub-10ms inference for small model blocks. Pairs well with Pi 5 via M.2 HAT.

### Edge Node Mesh Integration

Each edge node runs the Local LLM MCP Wrapper (section 3.2 of proposed changes) and registers with the mesh discovery service. The wrapper exposes `llm.chat`, `llm.health`, and `llm.capabilities` tools. The mesh coordinator sees:

```json
{
  "node_id": "pi5-kitchen",
  "type": "llamacpp",
  "models": [{
    "name": "qwen3-4b-q4_k_m",
    "context_window": 4096,
    "supports_tools": true,
    "supports_vision": false,
    "quantization": "Q4_K_M",
    "expected_tps": 6
  }],
  "hardware": {
    "device": "Raspberry Pi 5",
    "ram_gb": 8,
    "accelerator": "none"
  }
}
```

The mesh coordinator knows this node is slow but always available, and routes accordingly — background classification tasks, preprocessing pipelines, health monitoring checks.

---

## 3. Desktop Builds: From Office to Workstation

### 3.1 The Office Machine (Entry Tier)

**Purpose:** General-purpose mesh node, document processing, development environment. Runs Ollama with smaller models for everyday skill execution.

**Key components:**

- **CPU:** Intel N100/N305 or AMD Ryzen 5 — sufficient for CPU-only inference with quantized models up to 7B
- **RAM:** 16GB DDR5 minimum; 32GB preferred (models load into RAM when no GPU is present)
- **Storage:** 500GB NVMe SSD (boot + models) + optional HDD for data
- **GPU:** None (integrated graphics) — this is a CPU inference node
- **Case:** Mini-ITX or Micro-ATX; Topton N100/N305 boards are popular in the homelab community for their compact form factor and low power draw (~25W idle)
- **PSU:** 200–300W; efficiency matters more than headroom

**Software stack:** Ollama (easiest onboarding), models pulled from Ollama library or HuggingFace via `ollama run hf.co/<user>/<repo>`. The Ollama-HuggingFace integration allows running any GGUF model directly with a single command.

**Approximate cost: $400–$800**

This machine is the "just works" entry point. Install Ollama, pull a model, run skills. The mesh wrapper makes it a node automatically.

### 3.2 The Gaming Rig (Mid Tier)

**Purpose:** Primary local inference, skill development and benchmarking, gaming, light creative work. The workhorse of most home meshes.

**Key components:**

- **CPU:** AMD Ryzen 7 7800X3D or Intel Core i7-14700K
- **RAM:** 32GB DDR5-6000 (dual channel matters for memory bandwidth)
- **GPU:** NVIDIA RTX 4070 Ti (12GB VRAM) to RTX 4080 (16GB VRAM)
  - 12GB VRAM comfortably runs 7B–13B models at full speed
  - 16GB VRAM enables 30B quantized models at usable speed
- **Storage:** 1TB NVMe Gen4 (boot + active projects) + 2TB NVMe (model cache) + HDD array for media
- **Case:** Mid-tower ATX with good airflow (Fractal Design Meshify 2, be quiet! Pure Base 500DX)
- **PSU:** 850W 80+ Gold minimum; ATX 3.0 for future GPU upgrades
- **Cooling:** Tower air cooler (Noctua NH-D15) or 240mm AIO for the CPU; GPU cools itself

**Why the GPU matters for inference:**

vLLM benchmarks show NVIDIA GPUs serving via the OpenAI-compatible API achieve roughly 793 tokens/second compared to Ollama's 41 tokens/second at equivalent configurations. The difference is PagedAttention — vLLM's memory management eliminates 60–80% of KV cache waste. For a mesh node handling multiple concurrent skill evaluations, this throughput difference is the gap between useful and useless.

**Software stack:** Ollama for simple model management, vLLM for production serving when throughput matters. Both expose OpenAI-compatible endpoints, so the `OpenAICompatChip` in the model abstraction layer handles both identically.

**Approximate cost: $1,500–$2,500**

### 3.3 The Workstation (High Tier)

**Purpose:** Heavy inference, multi-model concurrent serving, video/audio production (DaVinci Resolve, Blender), vLLM production deployment. This is where the mesh gets serious.

**Key components:**

- **CPU:** AMD Ryzen 9 9950X or Intel Core i9-14900K
  - For video production workflows, the Ryzen 9 9950X's multi-threaded performance leads
  - For pure gaming + inference, the Ryzen 9 9800X3D's 3D V-Cache wins
- **RAM:** 64GB DDR5-6000 minimum; 128GB if running VMs alongside inference
- **GPU:** NVIDIA RTX 4090 (24GB GDDR6X) or RTX 5090 (32GB GDDR7)
  - RTX 4090: 24GB VRAM runs 70B quantized models; proven, available, lower power (450W TDP)
  - RTX 5090: 32GB GDDR7 with Blackwell architecture; 21,760 CUDA cores, 5th-gen Tensor Cores with FP4 support, DLSS 4. Approximately 27–35% faster than the 4090, but 575W TDP demands a 1000W+ PSU
  - For AI inference specifically, the RTX 5090's FP4 Tensor Cores provide up to 2x speedup over the 4090 for quantized model serving
- **Storage:** 2TB NVMe Gen4 (boot + active projects) + 4TB NVMe (model cache + media scratch) + NAS-mounted storage for archives
- **Case:** Full tower or open-air test bench (the RTX 5090 is physically large and thermally demanding)
- **PSU:** 1000W 80+ Platinum minimum for RTX 4090; 1200W for RTX 5090 builds. ATX 3.0 / PCIe 5.0 compliant
- **Cooling:** 360mm AIO or custom loop for CPU; GPU memory temps can hit 89–90°C under sustained inference loads on the 5090 — case airflow is critical

**Dual-GPU consideration:**

For vLLM with tensor parallelism across two GPUs, you need a motherboard with two PCIe 5.0 x16 slots running at full bandwidth (or x16/x8). AMD's X870E or Intel's Z790 platforms support this. Dual RTX 4090s in a single workstation can serve 70B models at production speed with tensor parallelism — the mesh coordinator routes the heaviest skills here.

**Approximate cost: $4,000–$8,000**

---

## 4. Inference Engine Management: Ollama vs. vLLM

The mesh architecture needs both. They serve different purposes and the `chipset.json` model abstraction layer treats them identically through the `OpenAICompatChip`.

### 4.1 Ollama: The On-Ramp

Ollama is the fastest path from zero to running a local model. Install with a single command, pull models from the Ollama library or HuggingFace, and start chatting. It wraps llama.cpp with a service layer that handles model management, API serving, and basic resource control.

**Installation:**

```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# macOS
brew install ollama

# Start the service
ollama serve
```

**Model management:**

```bash
# Pull from Ollama library
ollama pull llama3.1:8b
ollama pull codellama:7b
ollama pull mistral:7b

# Pull directly from HuggingFace (any GGUF)
ollama run hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF
ollama run hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M  # specific quantization

# List installed models
ollama list

# Remove models to free space
ollama rm mistral:7b
```

**HuggingFace integration details:**

Ollama can run any GGUF model from HuggingFace by prepending `hf.co/` to the model path. For private models, add your SSH key (`~/.ollama/id_ed25519.pub`) to your HuggingFace account settings. The integration auto-selects chat templates from the GGUF metadata; you can override with a `template` file in the HuggingFace repo.

**Current limitation:** Ollama does not support sharded GGUF files (models split across multiple .gguf files). If a HuggingFace repo contains sharded files, the pull will fail. Use single-file GGUF quantizations instead.

**Importing custom models from HuggingFace:**

For models not in the Ollama library:

1. Download the GGUF file from HuggingFace (Files & Versions tab)
2. Create a `Modelfile`:
   ```
   FROM ./model-name.Q4_K_M.gguf
   SYSTEM "You are a helpful assistant."
   TEMPLATE "{{ .System }}\n{{ .Prompt }}"
   ```
3. Build: `ollama create my-model -f Modelfile`
4. Run: `ollama run my-model`

**Quantization in Ollama:**

Ollama can quantize FP16/FP32 models locally:

```bash
ollama create --quantize q4_K_M my-model
```

Available quantization levels: `q4_0`, `q4_1`, `q4_K_S`, `q4_K_M`, `q5_0`, `q5_1`, `q5_K_S`, `q5_K_M`, `q8_0`. The `q4_K_M` level offers the best balance of speed and quality for most use cases.

**Environment tuning for mesh nodes:**

```bash
export OLLAMA_HOST=0.0.0.0:11434          # Listen on all interfaces (required for mesh)
export OLLAMA_MODELS=/path/to/models      # Custom model storage location
export OLLAMA_NUM_PARALLEL=4              # Concurrent request handling
export OLLAMA_MAX_LOADED_MODELS=3         # Models kept in memory
export OLLAMA_KEEP_ALIVE=5m              # Unload idle models after 5 minutes
export OLLAMA_CONTEXT_LENGTH=8192         # Override default 4096 context window
export CUDA_VISIBLE_DEVICES=0,1           # GPU selection for multi-GPU systems
```

**API endpoint (OpenAI-compatible):**

```
POST http://localhost:11434/v1/chat/completions
```

This is the endpoint the `OpenAICompatChip` connects to. The mesh wrapper wraps this with MCP tool definitions.

### 4.2 vLLM: The Production Engine

vLLM is what you deploy when Ollama's throughput isn't enough. It's a high-performance inference engine built around PagedAttention — a memory management technique that eliminates KV cache fragmentation and enables continuous batching of requests.

**When to use vLLM over Ollama:**

- Multiple concurrent users/skills hitting the same model
- Benchmarking requires consistent, high-throughput inference
- Serving models larger than 13B where memory efficiency matters
- Production mesh nodes that handle routing from multiple other nodes
- When you need speculative decoding, prefix caching, or structured outputs

**Installation:**

```bash
# Recommended: use uv for environment management
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install vllm --torch-backend=auto

# Or via Docker (simplest for production)
docker run --runtime nvidia --gpus all \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  --env "HUGGING_FACE_HUB_TOKEN=<your-token>" \
  -p 8000:8000 \
  --ipc=host \
  vllm/vllm-openai:latest \
  --model meta-llama/Llama-3.1-8B-Instruct
```

**Serving a model:**

```bash
vllm serve meta-llama/Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.90 \
  --dtype auto \
  --enable-prefix-caching
```

**Key vLLM features for the mesh:**

- **PagedAttention:** Dynamic memory allocation for KV cache; eliminates 60–80% of memory waste from fragmentation. This is why vLLM can serve 793 tokens/second where Ollama manages 41.
- **Continuous batching:** Processes requests at the iteration level rather than batch level; new requests enter the pipeline immediately without waiting for a batch to fill.
- **Prefix caching:** When multiple skill evaluations share common system prompts or context prefixes, vLLM caches the computed KV state and reuses it. Critical for the benchmark pipeline where every eval run starts with the same skill instructions.
- **Speculative decoding:** Uses a small draft model to predict multiple tokens, then validates with the main model. Provides 1.5–2x speedup for long generation tasks.
- **OpenAI-compatible API:** Drop-in replacement; the `OpenAICompatChip` works identically with Ollama and vLLM endpoints.
- **Structured outputs:** JSON mode and grammar-constrained generation ensure skill outputs conform to expected schemas. Essential for the grader agent's claim extraction.

**vLLM resource management:**

vLLM is heavy. A single instance serving Llama 3.1 70B via tensor parallelism across two RTX 4090s will saturate both GPUs and consume significant CPU and RAM for request scheduling. Management considerations:

- **GPU memory utilization:** The `--gpu-memory-utilization` flag (default 0.9) controls how much VRAM vLLM reserves. On a shared workstation, lower this to 0.7–0.8 to leave room for other applications.
- **Model loading:** Large models take 30–120 seconds to load. Use persistent storage (mount a volume with pre-downloaded weights) to avoid re-downloading.
- **Process isolation:** Run vLLM in a Docker container or systemd service with resource limits. On multi-GPU systems, use `CUDA_VISIBLE_DEVICES` to pin vLLM to specific GPUs.
- **Health monitoring:** vLLM exposes Prometheus metrics at `/metrics`. The mesh health monitor should scrape these for request queue depth, token throughput, and GPU utilization.

**Pulling models from HuggingFace for vLLM:**

vLLM loads models directly from HuggingFace by model ID. For gated models (Llama, Mistral), set the `HUGGING_FACE_HUB_TOKEN` environment variable. Models are cached to `~/.cache/huggingface/hub/` by default.

```bash
# Pre-download a model for faster startup
huggingface-cli download meta-llama/Llama-3.1-70B-Instruct

# Or use vLLM directly (downloads on first serve)
vllm serve meta-llama/Llama-3.1-70B-Instruct --tensor-parallel-size 2
```

For GGUF models (common with Ollama), vLLM has limited support — it prefers the original safetensors format. This is a practical consideration for the mesh: Ollama nodes run GGUF quantizations, vLLM nodes run safetensors with in-engine quantization. The `ChipRegistry` handles this transparently.

### 4.3 LM Studio: The Visual Middle Ground

LM Studio provides a GUI for model management and inference, with an OpenAI-compatible server mode. It's useful for users who want local inference without command-line setup. The server endpoint (`http://localhost:1234/v1/chat/completions`) plugs into the `OpenAICompatChip` identically to Ollama and vLLM.

**Use LM Studio when:** The mesh node operator prefers a GUI for model management, or when running on macOS/Windows where Docker setup for vLLM is less straightforward.

---

## 5. Pulling and Managing Models from HuggingFace

HuggingFace is the model warehouse. The mesh architecture's model abstraction layer needs to pull, store, and serve models from HuggingFace regardless of which inference engine runs them.

### 5.1 Model Format Landscape

| Format | Used By | Pros | Cons |
|---|---|---|---|
| **GGUF** | Ollama, llama.cpp, LM Studio | Single-file, self-contained (weights + tokenizer + metadata), quantization built-in | Limited to llama.cpp ecosystem, no tensor parallelism |
| **Safetensors** | vLLM, Transformers, TGI | Standard format for HuggingFace models, supports sharding, tensor parallelism | Requires separate tokenizer files, larger disk footprint |
| **ONNX** | ONNX Runtime, edge devices | Cross-platform, hardware-agnostic, INT8/FP16 acceleration | Conversion required, limited model support |

**Recommendation for the mesh:** Store both GGUF and safetensors versions of frequently-used models. Ollama nodes use GGUF; vLLM nodes use safetensors. The `manifest.json` in the `.skill` package specifies which format each tested model used.

### 5.2 HuggingFace CLI for Model Management

```bash
# Install the CLI
pip install huggingface_hub

# Login for gated/private models
huggingface-cli login

# Download a specific model
huggingface-cli download meta-llama/Llama-3.1-8B-Instruct

# Download only GGUF files from a quantized repo
huggingface-cli download bartowski/Llama-3.2-3B-Instruct-GGUF \
  --include "*.gguf" \
  --local-dir ./models/llama-3.2-3b

# Check cache usage
huggingface-cli cache info

# Clean unused cache entries
huggingface-cli cache purge
```

### 5.3 Model Storage Strategy

Models are large. A 70B model in safetensors is ~140GB; in GGUF Q4_K_M, it's ~40GB. The mesh needs a storage strategy:

- **Local NVMe:** Active models (currently loaded or frequently used). Fast loading, limited space.
- **NAS/NFS share:** Model archive. All downloaded models live here. Nodes mount the share and load on demand. Slower than local NVMe but shared across the mesh.
- **HuggingFace cache:** The `~/.cache/huggingface/hub/` directory. Point all nodes to the same NFS-mounted cache to avoid duplicate downloads.

```bash
# Point HuggingFace cache to NAS
export HF_HOME=/mnt/nas/huggingface
export TRANSFORMERS_CACHE=/mnt/nas/huggingface/hub
```

---

## 6. Server Infrastructure: Racks, VMs, and Storage

### 6.1 Rack Design and Layout

A home lab rack is the physical chassis of the mesh. It houses the server nodes, networking, storage, and power infrastructure.

**Starting point: 12U open-frame rack**

For most home labs, a 12U open-frame rack (such as the StarTech 12U or similar) provides enough space for a starter mesh while fitting in a closet or office corner. Open-frame designs prioritize airflow and accessibility over acoustic isolation.

**Recommended layout (bottom to top):**

| U Position | Component | Purpose |
|---|---|---|
| 1–2 | UPS (800–1500VA) | Power protection, graceful shutdown on outage |
| 3 | PDU (switched) | Remote power management per outlet |
| 4 | NAS / Storage server | TrueNAS, ZFS pools, model storage |
| 5–6 | Primary compute server | vLLM, VM host, heavy inference |
| 7 | Blank panel (airflow) | Thermal separation |
| 8 | Secondary compute / Dev server | Ollama, development environment |
| 9 | Raspberry Pi shelf | Edge nodes, Pi-hole, mesh discovery |
| 10 | Patch panel | Cable management |
| 11 | Network switch (managed, 2.5GbE+) | Core networking |
| 12 | Router / Firewall | OPNsense or pfSense |

**Key principles:**

- Heavy items at the bottom for stability
- Leave blank panels between heat-generating components
- Front-to-back airflow with exhaust fans at the rear
- Label every cable at both ends (use ultra fine-tip whiteboard markers on patch panel labels)
- Velcro straps over zip ties — you will reconfigure

**Expansion path:** Start with 12U, graduate to 18U or 25U as the mesh grows. Wall-mounted racks save floor space but limit depth and weight capacity.

### 6.2 Network Infrastructure

The mesh communicates over MCP, which runs over HTTP/HTTPS. Network bandwidth directly impacts mesh performance.

**Minimum: Gigabit Ethernet**
Sufficient for most mesh operations. DACP bundles are small (KB range). Model weight transfers are the bottleneck — loading a 40GB model from NAS over 1GbE takes ~5 minutes.

**Recommended: 2.5GbE or 10GbE**
2.5GbE switches are now affordable (~$100 for 8-port managed). The 2.5x bandwidth improvement meaningfully reduces model loading times and enables faster benchmark data transfer between nodes.

10GbE is ideal for the NAS-to-compute link. An SFP+ connection between the storage server and primary compute node eliminates storage as a bottleneck. 10GbE switches remain expensive ($300+) for full mesh coverage, but a point-to-point SFP+ link between two nodes is cheap ($30 per NIC).

**Network topology for the mesh:**

```
Internet
  │
  ├── Router/Firewall (OPNsense)
  │     │
  │     ├── Management VLAN (10.0.1.0/24) — SSH, IPMI, management interfaces
  │     ├── Mesh VLAN (10.0.2.0/24) — MCP traffic between nodes
  │     ├── Storage VLAN (10.0.3.0/24) — NFS/SMB to NAS, isolated for performance
  │     └── IoT/Edge VLAN (10.0.4.0/24) — Raspberry Pi nodes, isolated for security
  │
  └── Managed Switch (2.5GbE)
        ├── Compute Server 1 (10GbE uplink to NAS)
        ├── Compute Server 2
        ├── NAS (10GbE uplink)
        ├── Pi cluster
        └── Workstation
```

VLAN separation keeps mesh traffic isolated from general network use and prevents a misbehaving node from impacting household internet.

### 6.3 Storage: NAS and ZFS

The mesh needs centralized storage for models, benchmark data, skill packages, git repositories, and media assets.

**Recommended NAS approach: TrueNAS SCALE on dedicated hardware**

TrueNAS SCALE runs on Linux, supports Docker containers natively, and uses ZFS for enterprise-grade data protection. It can also serve as a mesh node itself — running Ollama in a Docker container on the NAS for lightweight inference.

**Hardware for a dedicated NAS:**

- **CPU:** Intel N100 or N305 — low power, sufficient for NAS duties and light containers
- **RAM:** 32GB DDR5 (ZFS wants 1GB per TB of storage as a rule of thumb, plus overhead)
- **Boot:** 128GB SATA SSD (TrueNAS boot drive is practically disposable — back up your config database)
- **Fast storage:** 2x 1TB NVMe in mirror — for VM images, Docker volumes, active model cache
- **Bulk storage:** 4–8x HDD in RAIDZ2 — for model archive, media, backups. Use CMR drives (not SMR). Seagate Exos or WD Ultrastar for reliability.
- **Network:** 10GbE SFP+ for the compute link, 2.5GbE for general access

**ZFS pool strategy:**

```
Tank (bulk):     4x 18TB Exos in RAIDZ2 → ~36TB usable
  └── datasets:  models/, skills/, media/, backups/, git/

Fast (NVMe):     2x 1TB NVMe in mirror → ~1TB usable
  └── datasets:  vms/, docker/, active-models/
```

RAIDZ2 tolerates two simultaneous drive failures. For the model archive, this is the right level of protection — re-downloading 140GB models over HuggingFace is slow and bandwidth-intensive.

**NFS exports for mesh nodes:**

```
/mnt/tank/models    → 10.0.3.0/24 (read-only for inference nodes)
/mnt/tank/skills    → 10.0.2.0/24 (read-write for skill development)
/mnt/tank/git       → 10.0.2.0/24 (read-write for worktree checkouts)
```

### 6.4 Virtualization: Proxmox and VMs

Proxmox VE on the primary compute server enables running multiple isolated environments: a vLLM instance, an Ollama instance, a development VM, and a monitoring stack, all on the same hardware with GPU passthrough.

**GPU passthrough for vLLM in a VM:**

Proxmox supports PCIe passthrough. Dedicate one GPU to vLLM (passed through to a VM or LXC container) and keep the other for the host or other VMs. This is the server-tier equivalent of the chipset philosophy — each GPU is a specialized coprocessor assigned to a specific workload.

**Container strategy:**

- **LXC containers** for lightweight services (mesh discovery, monitoring, Pi-hole)
- **VMs** for GPU-passthrough workloads (vLLM, DaVinci Resolve)
- **Docker** (inside TrueNAS or a VM) for Ollama, application services

---

## 7. Creative Production Infrastructure

The mesh architecture's hardware isn't just for inference — it powers creative production workflows that the Amiga's Video Toaster pioneered in the late 1980s. Modern equivalents are more capable but follow the same principle: specialized hardware composing with specialized software to produce professional output.

### 7.1 The Modern Video Toaster: OBS Studio + Hardware

The Amiga Video Toaster was a specialized video production chipset — real-time switching, effects, and CG on commodity hardware. OBS Studio is its spiritual descendant: a free, open-source production suite that turns any desktop into a live production studio.

**Streaming production stack:**

| Component | Purpose | Recommendation |
|---|---|---|
| **OBS Studio** | Scene composition, switching, encoding | Free, cross-platform, extensible via plugins |
| **Capture card** | HDMI/SDI input from cameras | Elgato HD60 X (HDMI), Blackmagic DeckLink Mini Recorder (SDI) |
| **Stream Deck** | Physical button panel for scene switching | Elgato Stream Deck MK.2 (15 keys) or Stream Deck XL (32 keys) |
| **Audio interface** | Professional mic input, monitoring | Focusrite Scarlett 2i2 (2-channel), MOTU M4 (4-channel) |
| **Microphone** | Voice capture | Shure SM7B (dynamic, broadcast), Rode NT1-A (condenser, studio) |
| **Camera** | Video source | Sony ZV-E10 II (mirrorless, clean HDMI out), Elgato Facecam Pro (4K webcam) |
| **Lighting** | Three-point lighting setup | Elgato Key Light (desk-mount), Viltrox LED panels (portable) |
| **Green screen** | Background replacement | Elgato Green Screen (collapsible, floor-standing) |

**OBS plugins for production:**

- **Soundboard Dock** — trigger sound effects during streams via buttons or hotkeys. Install by dropping `data` and `obs-plugins` folders into your OBS installation directory. Dock appears under Docks menu.
- **Source Record** — ISO-record individual sources (webcam, gameplay) separately from the main stream. Essential for post-editing — clean footage without overlays.
- **Audio Monitor** — route audio from any OBS source to any output device. Create custom monitor mixes without external tools like VoiceMeeter.
- **Aitum Multistreaming** — native multistream to Twitch, YouTube, and TikTok simultaneously from within OBS. No external services needed.
- **Move Transition** — animated scene transitions with per-source keyframing.
- **Vertical Video** — simultaneous horizontal and vertical output for TikTok/Shorts alongside main stream.

**Overlays and alerts:**

- Use Streamlabs or StreamElements for alert overlays (follows, subs, donations) added as Browser Sources in OBS
- Custom overlays designed in Figma, Canva, or Photoshop, exported as transparent PNGs or animated WebM
- Chat overlay via Streamlabs widget URL added as a Browser Source

**Touch Portal** as a free Stream Deck alternative — runs on a phone or tablet, sends hotkeys and OBS WebSocket commands for scene switching, sound effects, and source toggling.

### 7.2 Audio Production

**The signal chain:**

```
Microphone → Audio Interface (Scarlett/MOTU) → DAW / OBS
     ↓
  Acoustic Treatment (room)
     ↓
  Monitoring (studio monitors / headphones)
```

**DAW options:**

- **DaVinci Resolve Fairlight** — integrated audio post-production. The Fairlight page includes a full DAW with multi-track recording, mixing, Foley sampling, ADR tools, and immersive audio (Dolby Atmos) support. No additional software needed for audio-to-video workflows.
- **Reaper** — lightweight, affordable ($60 license), runs on Linux/Mac/Windows. Excellent for music production and podcast editing.
- **Audacity** — free, open-source, basic but capable for voice recording and simple editing.

**Audio interface selection by use case:**

| Use Case | Interface | Inputs | Key Feature |
|---|---|---|---|
| Solo streaming/podcasting | Focusrite Scarlett Solo | 1 mic + 1 instrument | Simplest setup, USB-C |
| Duo podcast / music | Focusrite Scarlett 2i2 | 2 mic/instrument | Low latency monitoring |
| Multi-source production | MOTU M4 | 4 inputs | ESS Sabre DAC, excellent metering |
| Full studio | Universal Audio Volt 476 | 4 inputs | Built-in compressor, vintage tone |

**Room acoustics matter more than gear.** A $100 microphone in a treated room sounds better than a $1000 microphone in an untreated room. Priorities: bass traps in corners, absorption panels at first reflection points, diffusion on the rear wall. DIY acoustic panels (rigid fiberglass or Rockwool wrapped in fabric) cost ~$30 each and dramatically improve recording quality.

### 7.3 Video Production and Cinematography

**DaVinci Resolve as the production hub:**

DaVinci Resolve 20 is the center of the video production workflow. It combines editing (Cut/Edit pages), color correction (Color page), visual effects and motion graphics (Fusion page), audio post-production (Fairlight page), and delivery — all in one application. The free version supports up to Ultra HD 60fps. The Studio version ($295, one-time) adds 32K resolution, 120fps, multi-GPU acceleration, AI Neural Engine tools, HDR delivery (Dolby Vision, HDR10+), and immersive audio.

**Hardware requirements for DaVinci Resolve:**

- **Minimum:** 16GB RAM, discrete GPU with 4GB VRAM, SSD storage
- **Recommended for 4K:** 32GB RAM, RTX 4070+ (12GB VRAM), NVMe storage for media
- **Optimal for 8K/HDR:** 64GB RAM, RTX 4090/5090, multi-GPU support, 10GbE NAS link for shared storage

DaVinci Resolve heavily uses GPU acceleration. The color page's real-time playback, Fusion's 3D compositing, and the Neural Engine's AI features all scale with GPU power. A workstation node running DaVinci Resolve can also serve as a vLLM node — the GPU is shared, but DaVinci Resolve releases GPU resources when not actively rendering.

**Camera fundamentals for home production:**

Understanding light and color is foundational to both cinematography and the color science DaVinci Resolve processes.

**The exposure triangle:**
- **Aperture** (f-stop) — controls depth of field. Lower numbers (f/1.4) = shallower focus, more light. Higher numbers (f/8) = deeper focus, less light.
- **Shutter speed** — for video, use the 180-degree rule: set shutter speed to double your frame rate (1/48 for 24fps, 1/60 for 30fps) for natural motion blur.
- **ISO** — sensor sensitivity. Lower is cleaner. Modern cameras (Sony a7 IV, Canon R6 II) produce clean footage up to ISO 6400.

**Color temperature and white balance:**
Light has color. Daylight is ~5600K (blue-ish). Tungsten is ~3200K (orange-ish). Match your white balance to your key light, and use DaVinci Resolve's color page to fine-tune in post. Shoot in a flat/log profile (S-Log3, C-Log3) to preserve dynamic range for grading.

**Three-point lighting:**
- **Key light** (45° to subject, slightly above) — primary illumination
- **Fill light** (opposite side, dimmer) — reduces shadows
- **Back light** (behind subject) — separates subject from background, adds depth

LED panels with adjustable color temperature (3200K–5600K) and brightness are the most versatile option for home studios. Softboxes or diffusion panels soften the light for flattering portraits.

**Camera recommendations by budget:**

| Budget | Camera | Key Feature |
|---|---|---|
| $300 | Sony ZV-1F | Compact, clean HDMI, good autofocus |
| $700 | Sony ZV-E10 II | Interchangeable lenses, 4K, excellent for streaming |
| $1,500 | Sony a6700 | APS-C, 4K 120fps, S-Log3, professional codec options |
| $2,500 | Sony a7 IV | Full-frame, 4K 60fps, 10-bit 4:2:2, dual card slots |
| $4,000 | Blackmagic Pocket Cinema Camera 6K Pro | Blackmagic RAW, built-in NDs, includes DaVinci Resolve Studio |

The Blackmagic cameras deserve special mention — they shoot in Blackmagic RAW, which is natively handled by DaVinci Resolve with full GPU-accelerated debayering. The camera includes a free DaVinci Resolve Studio license, making it the most cost-effective path to a professional production pipeline.

### 7.4 The Full Studio Layout

A home studio that integrates streaming, recording, and the AI mesh:

```
┌──────────────────────────────────────────────────────────────┐
│                        STUDIO ROOM                            │
│                                                               │
│  ┌─────────┐    ┌─────────────────────┐    ┌──────────────┐  │
│  │ Camera  │    │   DESK / WORKSTATION │    │ Server Rack  │  │
│  │ + Light │    │                      │    │              │  │
│  │         │◄───│  Monitors (3x)       │    │  NAS         │  │
│  │ Key     │    │  Stream Deck         │    │  Compute     │  │
│  │         │    │  Audio Interface     │    │  Switch      │  │
│  └─────────┘    │  Microphone          │    │  UPS         │  │
│                 │                      │    │  Pi Cluster  │  │
│  ┌─────────┐    │  Keyboard/Mouse      │    └──────────────┘  │
│  │ Fill    │    └─────────────────────┘                       │
│  │ Light   │                                                  │
│  └─────────┘    ┌─────────────────────┐                       │
│                 │  Green Screen        │                       │
│  ┌─────────┐    │  (behind chair,      │                       │
│  │ Back    │    │   retractable)       │                       │
│  │ Light   │    └─────────────────────┘                       │
│  └─────────┘                                                  │
│                                                               │
│  ┌────────────────────────────────────┐                       │
│  │ Acoustic Treatment:                │                       │
│  │  - Bass traps in corners           │                       │
│  │  - Absorption at first reflections │                       │
│  │  - Diffusion on rear wall          │                       │
│  └────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

**Monitor configuration:**

- Center monitor: Primary editing / DaVinci Resolve timeline
- Left monitor: OBS preview / chat / monitoring
- Right monitor: Reference monitor (color-calibrated for grading) or terminal for mesh management

For color-critical work, one monitor should be hardware-calibrated (Datacolor SpyderX or X-Rite i1Display) and set to the target color space (Rec. 709 for HD, DCI-P3 for cinema, Rec. 2020 for HDR). This monitor is where you make grading decisions; the others are utility displays.

---

## 8. Putting It All Together: Reference Builds

### Build 1: The Starter Mesh ($500)

**For:** Learning, experimentation, first skills

| Component | Spec | Cost |
|---|---|---|
| Raspberry Pi 5 (8GB) | Edge node | $80 |
| M.2 NVMe HAT + 256GB SSD | Model storage | $40 |
| Active cooler + case | Thermal management | $20 |
| Used office desktop (i5, 16GB) | Primary Ollama node | $200 |
| Network switch (Gigabit, 8-port) | Connectivity | $25 |
| Cables, power strips | Infrastructure | $35 |
| **External HDD (4TB)** | Model and data storage | $100 |

**Mesh capability:** Run 1B–7B quantized models. Execute skills, run evals (slowly), learn the workflow. The Pi handles lightweight always-on tasks; the desktop handles skill development.

### Build 2: The Creator's Mesh ($3,000)

**For:** Skill development, streaming, light video production

| Component | Spec | Cost |
|---|---|---|
| Desktop (Ryzen 7, 32GB, RTX 4070 Ti) | Primary compute + streaming | $1,800 |
| Raspberry Pi 5 (8GB) + accessories | Edge node | $140 |
| NAS (N100, 32GB, 2x 8TB HDD) | Shared storage | $600 |
| 2.5GbE managed switch (8-port) | Faster networking | $100 |
| Audio interface (Scarlett 2i2) + mic | Streaming audio | $250 |
| Elgato Stream Deck MK.2 | Production control | $110 |

**Mesh capability:** Run models up to 13B at good speed, 30B quantized feasible. Full skill development pipeline. Live streaming with overlays. Basic video editing in DaVinci Resolve (free version).

### Build 3: The Production Mesh ($10,000)

**For:** Multi-model benchmarking, high-throughput inference, professional video/audio production

| Component | Spec | Cost |
|---|---|---|
| Workstation (Ryzen 9, 64GB, RTX 4090) | vLLM serving + DaVinci Resolve | $4,500 |
| Secondary desktop (Ryzen 7, 32GB, RTX 4070) | Ollama + dev environment | $1,800 |
| 2x Raspberry Pi 5 (8GB) + accessories | Edge nodes | $280 |
| NAS (32GB, 4x 18TB Exos, 2x 1TB NVMe) | 36TB usable + fast tier | $1,800 |
| 12U open-frame rack + accessories | Physical infrastructure | $300 |
| 10GbE SFP+ NICs (2x) + DAC cable | NAS ↔ Workstation fast link | $80 |
| UPS (1500VA) + switched PDU | Power protection | $300 |
| Camera (Sony ZV-E10 II) + lighting | Video production | $900 |

**Mesh capability:** Run 70B models via vLLM with full throughput. Multi-model benchmarking across tiers. Professional video production in DaVinci Resolve Studio. Full streaming setup. The mesh coordinator routes extraction tasks to the workstation's 4090, summarization to the desktop's 4070, and classification to the Pi nodes.

---

## 9. Mesh Service Operations

### 9.1 Service Lifecycle Management

Each inference service (Ollama, vLLM, mesh discovery, MCP wrappers) needs lifecycle management. Use systemd on Linux:

```ini
# /etc/systemd/system/ollama-mesh.service
[Unit]
Description=Ollama Mesh Node
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ollama
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/mnt/nas/models/ollama"
Environment="OLLAMA_NUM_PARALLEL=4"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/vllm-mesh.service
[Unit]
Description=vLLM Mesh Node
After=network-online.target nvidia-persistenced.service
Requires=nvidia-persistenced.service

[Service]
Type=simple
User=vllm
Environment="CUDA_VISIBLE_DEVICES=0"
Environment="HUGGING_FACE_HUB_TOKEN=<token>"
ExecStart=/opt/vllm/venv/bin/vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --host 0.0.0.0 --port 8000 \
  --gpu-memory-utilization 0.85 \
  --enable-prefix-caching \
  --max-model-len 8192
Restart=on-failure
RestartSec=30
MemoryMax=48G
CPUQuota=400%

[Install]
WantedBy=multi-user.target
```

### 9.2 Monitoring

**Prometheus + Grafana** for mesh-wide monitoring:

- vLLM exports metrics at `/metrics` (request latency, queue depth, tokens/second, GPU utilization)
- Ollama health via the `/api/tags` endpoint and custom exporters
- Node Exporter for system metrics (CPU, RAM, disk, network)
- NVIDIA DCGM Exporter for GPU metrics (temperature, power draw, memory usage, SM utilization)

The mesh coordinator's health monitoring (section 3.3 of proposed changes) consumes these metrics to make routing decisions. A node running at 95% GPU utilization gets deprioritized for new tasks.

### 9.3 Backup Strategy

- **Model weights:** Don't back up — re-download from HuggingFace. Store the model list and download commands instead.
- **Skills:** Git repositories on NAS, mirrored to remote (friend's NAS, cloud, or GitHub).
- **Benchmarks:** Part of the skill git repo. Versioned and portable.
- **Configuration:** `chipset.json`, `thresholds.json`, `routing_policy.json`, systemd units — all in git.
- **TrueNAS config:** Regular automated export of the config database to a separate location.
- **Media assets:** RAIDZ2 on NAS + offsite backup (Backblaze B2, friend swap, or cold storage).

---

## 10. Information Pathways: Learning Tracks

This section maps the learning journey for each hardware tier, connecting physical build knowledge to mesh integration skills.

### Path 1: The Beginner (Edge → First Node)

1. Build a Raspberry Pi 5 with Ollama → run a 1B model → understand tokens, quantization, inference speed
2. Install the MCP wrapper → register as a mesh node → see your Pi appear in the discovery service
3. Pull a different model from HuggingFace → compare performance → understand model selection
4. Run a skill eval against your Pi node → see pass rates → understand why small models fail on complex tasks
5. **Hardware graduation:** Add a used desktop as a second node → see the mesh coordinator route between them

### Path 2: The Builder (Desktop → Workstation)

1. Build a gaming desktop with a discrete GPU → install Ollama + vLLM → compare throughput
2. Set up TrueNAS on a NAS → mount NFS shares → centralize model storage
3. Run multi-model benchmarks → see the `benchmark.json` matrix populate → understand model-aware optimization
4. Add streaming gear (OBS, mic, camera) → produce content while the mesh runs inference in the background
5. **Hardware graduation:** Upgrade to a rack setup → add a second compute node → deploy Proxmox for VM isolation

### Path 3: The Producer (Studio → Production)

1. Design a studio space → acoustic treatment, lighting, camera placement
2. Install DaVinci Resolve → learn the color page → understand color science and light
3. Build a workstation with GPU(s) that serve both Resolve and vLLM
4. Integrate OBS for live production → overlays, soundboards, multi-cam switching
5. **Mesh integration:** Use skills to automate production tasks — AI-powered transcript generation, automated chapter markers, smart thumbnail selection, content summarization for show notes

### Path 4: The Architect (Full Mesh)

1. Design the network topology → VLANs, 10GbE links, managed switching
2. Deploy the full rack → compute + storage + networking + power management
3. Configure Prometheus/Grafana → monitor the entire mesh → understand bottlenecks
4. Write custom skills that span the mesh → a VTM wave plan that routes video analysis to the GPU node, metadata extraction to a CPU node, and thumbnail generation to a different GPU
5. Package and share skills with embedded benchmarks across your mesh configuration

---

## 11. What Doesn't Change

The hardware expansion pack adds physical infrastructure, but the core principles from the mesh architecture proposal remain fixed:

- **The chipset philosophy extends to hardware.** Each node is a specialized coprocessor. A Raspberry Pi running Qwen3-4B for classification is a chip. An RTX 4090 running vLLM for extraction is a different chip. They compose through the mesh coordinator.
- **Skills are the portable unit.** Hardware varies; skills don't. A skill that works on Claude Opus should degrade gracefully on Llama 70B and have known behavior on Llama 8B. The `manifest.json` carries this information.
- **Context preservation crosses physical boundaries.** When a task executes on a remote mesh node and returns a DACP bundle with a compressed execution transcript, the local GSD instance ingests it without information loss. The hardware doesn't change this requirement — it adds latency and transport considerations that DACP's fidelity adaptation handles.
- **Claude is the ceiling, not the floor.** The mesh extends reach and reduces cost. Local hardware handles the volume; Claude handles the judgment. The grader is always Claude. The analyzer is always Claude. The executor can be anything.

---

*Draft — companion document to the mesh architecture proposal and proposed changes*
