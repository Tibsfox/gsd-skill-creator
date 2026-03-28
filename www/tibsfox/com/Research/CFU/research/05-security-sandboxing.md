# Security and Sandboxing

## Overview

ComfyUI's custom node ecosystem has been compromised by malicious nodes carrying cryptominers and credential stealers. This module specifies the Docker isolation strategy, custom node security audit process, and the audited node allowlist that protects the GSD ecosystem.

## Threat Landscape

### Documented Incidents

The ComfyUI custom node ecosystem has experienced multiple security incidents:

- **Cryptominer nodes**: Custom nodes that install cryptocurrency mining software alongside their advertised functionality, consuming GPU cycles without user consent
- **Credential stealers**: Nodes that exfiltrate environment variables, API keys, or browser cookies during installation or execution
- **Supply chain attacks**: Legitimate nodes with malicious code injected into dependencies or post-install scripts

### Attack Vectors

| Vector | Mechanism | Severity |
|--------|-----------|----------|
| `eval()` / `exec()` in node code | Arbitrary code execution during graph evaluation | Critical |
| `subprocess.Popen()` | Shell command execution from node code | Critical |
| `pip install` in `__init__.py` | Arbitrary package installation at import time | High |
| Network access from nodes | Data exfiltration or C2 communication | High |
| File system access | Read/write outside intended directories | Medium |
| GPU memory inspection | Extract data from shared VRAM | Low |

## Docker Isolation Strategy

### Container Architecture

```
HOST SYSTEM
  |
  |-- /models/          (read-only mount)
  |-- /input/           (read-write mount)
  |-- /output/          (read-write mount)
  |
  ===== DOCKER BOUNDARY =====
  |
  COMFYUI CONTAINER
    |-- /app/ComfyUI/    (application code)
    |-- /models/          (mounted, read-only)
    |-- /input/           (mounted, read-write)
    |-- /output/          (mounted, read-write)
    |-- NO access to host filesystem
    |-- NO access to host network (except port 8188)
    |-- NO access to host GPU memory (isolated CUDA context)
```

### Docker Compose Specification

```yaml
version: '3.8'
services:
  comfyui:
    image: comfyui-gsd:latest
    build:
      context: .
      dockerfile: Dockerfile.comfyui
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=0
      - NVIDIA_DRIVER_CAPABILITIES=compute,utility
    volumes:
      - ./models:/models:ro
      - ./input:/input:rw
      - ./output:/output:rw
    ports:
      - "127.0.0.1:8188:8188"
    networks:
      - comfyui-internal
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:size=2G
    deploy:
      resources:
        limits:
          memory: 32G

networks:
  comfyui-internal:
    driver: bridge
    internal: true
```

### Key Security Properties

1. **Mount-only filesystem access**: Container can only read models and read/write input/output directories. No access to host home directory, SSH keys, or environment files.
2. **Localhost-only port binding**: `127.0.0.1:8188` ensures the API is not accessible from the network.
3. **Read-only root filesystem**: Application code cannot be modified at runtime. Temporary files go to tmpfs.
4. **No-new-privileges**: Container processes cannot gain additional capabilities.
5. **Internal network**: Container cannot initiate outbound network connections.

## Custom Node Security Audit

### Audit Process

Every custom node must pass the following checks before addition to the allowlist:

**Stage 1: Static Analysis**
- Scan all `.py` files for `eval()`, `exec()`, `compile()`, `__import__()` calls
- Scan for `subprocess`, `os.system`, `os.popen` usage
- Scan for `pip install`, `pip.main()`, or `importlib` dynamic imports
- Scan for network access: `socket`, `urllib`, `requests`, `httpx` imports
- Check `__init__.py` for install-time side effects

**Stage 2: Dependency Audit**
- Lock all dependencies to specific versions (no `>=` or `*` version specs)
- Cross-reference dependencies against known-vulnerable package lists
- Verify no dependency pulls in network-capable packages unnecessarily

**Stage 3: Runtime Monitoring**
- Install in isolated test container
- Monitor system calls via `strace` during import and execution
- Verify no unexpected network connections, file accesses, or process spawns
- Run with sample workflow and confirm only expected outputs produced

### Audit Checklist Template

```
Node: [name]
Repository: [URL]
Version: [commit hash]
Audit Date: [date]
Auditor: [identifier]

[ ] No eval/exec/compile calls
[ ] No subprocess/os.system calls
[ ] No runtime pip install
[ ] No network imports (or justified)
[ ] Dependencies pinned to specific versions
[ ] No known-vulnerable dependencies
[ ] strace clean during import
[ ] strace clean during execution
[ ] Expected outputs only
[ ] License compatible (Apache 2.0 / MIT / BSD)

Status: [ ] APPROVED  [ ] REJECTED  [ ] CONDITIONAL
Notes: [...]
```

## Audited Node Allowlist

### Approved Nodes (v1.0)

| Node Package | Purpose | Audit Status | Version |
|-------------|---------|-------------|---------|
| ComfyUI core | Base functionality | Approved | latest stable |
| ComfyUI-Manager | Node management | Approved (with restrictions) | 2.x |
| ComfyUI-GGUF | GGUF model loading | Approved | 1.x |
| ComfyUI-VideoHelperSuite | Video I/O + RIFE | Approved | 1.x |
| ComfyUI-LTX-Video | LTX video generation | Approved | latest |
| ComfyUI-WanVideo | Wan 2.2 integration | Approved | latest |
| comfyui_controlnet_aux | ControlNet preprocessors | Approved | 1.x |
| ComfyUI-Impact-Pack | Face detection, SAM | Conditional (network disabled) | 6.x |
| ComfyUI-KJNodes | Utility nodes | Approved | latest |
| efficiency-nodes-comfyui | Batch efficiency tools | Approved | latest |

### Restricted Patterns

Nodes with the following characteristics are automatically rejected:

- Any node requiring internet access during execution (not installation)
- Any node that modifies the ComfyUI installation directory
- Any node that reads environment variables beyond CUDA/GPU configuration
- Any node with obfuscated Python code
- Any node without a clear open-source license

## Network Policy

### Container Network Rules

```
ALLOW: comfyui -> localhost:8188 (API serving)
ALLOW: host -> comfyui:8188 (API access)
DENY:  comfyui -> * (all outbound blocked)
DENY:  * -> comfyui (no inbound except host)
```

### Model Download Procedure

Models are downloaded on the host system, verified against published checksums, and placed in the read-only `/models` mount. The container never downloads models directly -- it can only use what the host provides.

> **SAFETY: The Docker isolation strategy is defense-in-depth. Even if a malicious node passes the audit (zero-day), the container boundary prevents access to host filesystem, network, and credentials. The combination of audit + isolation + network policy creates a multi-layer defense.**

## Summary

Security for ComfyUI integration follows the GSD ecosystem's safety-by-structure philosophy: Docker isolation limits the blast radius, the custom node audit catches known attack patterns, and the network policy prevents data exfiltration. The audited allowlist starts with 10 verified node packages covering the core generation pipeline. New nodes are added only after passing the three-stage audit process.
