# v1.49.129 "ComfyUI"

**Released:** 2026-03-28
**Code:** CFU
**Series:** PNW Research Series (#129 of 167)

## Summary

ComfyUI Integration maps the architecture, pipelines, and security boundaries for wiring a local DAG-based image and video generation engine directly into the skill-creator ecosystem via structured DACP bundles. This is a sovereign production layer -- no cloud fees, no prompt logging, no external content filters -- where the ComfyUI directed acyclic graph engine handles partial re-execution and node-level data flow while skill-creator provides orchestration, pattern detection, and a learning feedback loop. The research covers the complete stack from REST/WebSocket API mapping through FLUX.1/SDXL/LTX-2.3 model pipelines to Docker sandboxing and custom node security audits.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 5 |
| Total Lines | ~4,330 |
| Safety-Critical Tests | 5 |
| Parallel Tracks | 2 |
| Est. Tokens | ~349K |
| Color Theme | Steel graphite / electric blue / dark graphite |

### Research Modules

1. **M1: ComfyUI API Bridge** -- Complete REST and WebSocket API mapping, workflow JSON schema (nodes, links, execution order), queue management via /prompt endpoint, Python client with async dispatch and artifact retrieval
2. **M2: Image Production Pipeline** -- Model landscape (FLUX.1 Dev/Schnell FP8, SDXL, SD 3.5), VRAM tier routing for 8/12/16/24GB GPUs, ControlNet integration (pose, depth, edge), batch generation with consistent seed management
3. **M3: Video Production Pipeline** -- Video model survey (LTX-2.3, Wan 2.2, CogVideoX, HunyuanVideo, AnimateDiff), text-to-video and image-to-video workflows, frame interpolation, VRAM requirements and quantization strategies
4. **M4: Skill-Creator Integration** -- DACP three-part bundle structure (intent, workflow JSON, trigger), MCP bridge specification, registry feedback loop where recurring prompts become reusable templates, model auto-discovery via /object_info
5. **M5: Security & Sandboxing** -- Docker isolation (mount-only /models, /input, /output), custom node audit (eval/exec scanning, runtime-pip detection), audited allowlist of 10+ nodes, cryptominer and credential stealer detection

### Cross-References

- **LLM** (Local LLM) -- VRAM tier management, DACP bundle protocol, Docker sandboxing
- **AIH** (Intelligence Horizon) -- Model quantization (FP8/FP16), agentic architecture, ControlNet
- **TCP** (TCP/IP Protocol) -- WebSocket real-time events, REST API design
- **MST** (Mesh Telescope) -- DACP bundle integration, MCP bridge pattern
- **K8S** (Kubernetes) -- Docker sandboxing, container security

## Retrospective

### What Worked
- The 14-deliverable matrix with specific acceptance criteria (e.g., "FLUX FP8 round-trip <90s on 16GB GPU") makes this one of the most precisely testable mission packages in the series
- Separating image and video pipelines into parallel Track B modules allows independent development while sharing the common API bridge from Track A
- The security module addresses a real and under-documented risk: ComfyUI custom nodes can contain arbitrary Python code including eval/exec calls and runtime pip installs

### What Could Be Better
- Audio generation models (e.g., Stable Audio, MusicGen) are not covered -- adding a third media pipeline would complete the multimedia production stack
- The MCP bridge specification is a design document rather than a working implementation, leaving integration validation for a future build phase

## Lessons Learned

- ComfyUI's DAG execution model (partial re-execution, node-level caching) is architecturally identical to build systems like Bazel or Nx -- the insight that "image generation is a build graph problem" unlocks an entire tooling ecosystem for optimization.
- Custom node security is the critical unsolved problem in the ComfyUI ecosystem: any node can execute arbitrary Python, install packages at runtime, and access the host filesystem unless explicitly sandboxed via Docker.
- The DACP three-part bundle (human intent, workflow JSON, executable trigger) maps cleanly to the separation of concerns in any generation pipeline: what you want, how to get it, and when to start.

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
