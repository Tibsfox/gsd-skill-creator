# ComfyUI API Bridge

## Overview

ComfyUI exposes a complete REST and WebSocket API for workflow execution, queue management, and real-time progress tracking. This module documents the API surface, workflow JSON schema, and the Python client architecture that bridges skill-creator to ComfyUI.

## Server Architecture

ComfyUI runs as a Python server (default port 8188) with two communication channels:

- **REST API**: Synchronous request/response for workflow submission, queue management, model enumeration, and artifact retrieval
- **WebSocket**: Asynchronous event stream for execution progress, node completion events, and preview images

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/prompt` | POST | Submit a workflow for execution; returns prompt_id |
| `/queue` | GET | List currently queued and running prompts |
| `/queue` | POST | Delete items from the queue |
| `/history` | GET | Retrieve execution history with outputs |
| `/history/{prompt_id}` | GET | Get specific prompt execution results |
| `/object_info` | GET | Enumerate all available nodes with input/output schemas |
| `/view` | GET | Retrieve generated images/videos by filename |
| `/upload/image` | POST | Upload input images for img2img, ControlNet, etc. |
| `/system_stats` | GET | GPU memory usage, queue depth, system info |

### /object_info -- Model Auto-Discovery

The `/object_info` endpoint is critical for auto-discovery. It returns a JSON object describing every installed node, including:

- Node class name and display name
- Input parameters with types, defaults, and constraints
- Output types and names
- Category (sampling, conditioning, latent, image, etc.)

Parsing this at startup enables the skill-creator to dynamically discover which models, samplers, and processing nodes are available on the target ComfyUI instance.

## Workflow JSON Schema

ComfyUI workflows are JSON objects where each node has a unique ID and specifies its class type, inputs (which may reference other nodes' outputs), and metadata.

```
{
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0],
      "seed": 42,
      "steps": 20,
      "cfg": 7.5,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1.0
    }
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "flux1-dev-fp8.safetensors"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "width": 1024,
      "height": 1024,
      "batch_size": 1
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "a serene mountain lake at sunset",
      "clip": ["4", 1]
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "blurry, low quality",
      "clip": ["4", 1]
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "images": ["8", 0],
      "filename_prefix": "gtm_output"
    }
  }
}
```

### Node Connection Syntax

Inputs that reference other nodes use the format `["node_id", output_index]`. This creates the directed acyclic graph (DAG) that ComfyUI traverses during execution. The execution engine:

1. Topologically sorts the graph
2. Executes nodes in dependency order
3. Caches intermediate results
4. Re-executes only nodes whose inputs changed (partial re-execution)

## WebSocket Progress Tracking

### Connection

Connect to `ws://localhost:8188/ws?clientId={uuid}` to receive real-time execution events.

### Event Types

| Event | Payload | Meaning |
|-------|---------|---------|
| `status` | `{status: {exec_info: {queue_remaining: N}}}` | Queue status update |
| `execution_start` | `{prompt_id: "..."}` | Workflow execution begun |
| `executing` | `{node: "3", prompt_id: "..."}` | Specific node executing |
| `executed` | `{node: "9", output: {images: [...]}}` | Node completed with output |
| `execution_cached` | `{nodes: ["4", "5"]}` | Nodes skipped (cache hit) |
| `progress` | `{value: 15, max: 20}` | Sampling step progress |
| `execution_complete` | `{prompt_id: "..."}` | Full workflow complete |
| `execution_error` | `{prompt_id: "...", error: "..."}` | Execution failed |

### Progress Bar Mapping

The `progress` event maps directly to a sampling progress bar: `value/max` gives the percentage completion of the current KSampler node. For multi-node workflows, total progress requires tracking node completion events and weighting by estimated execution time.

## Python Client Architecture

### Class Hierarchy

```
ComfyUIClient (base)
  |-- dispatch(workflow_json) -> prompt_id
  |-- wait_for_completion(prompt_id) -> outputs
  |-- get_artifacts(prompt_id) -> [file_paths]
  |
  |-- WSMonitor (WebSocket handler)
  |     |-- on_progress(callback)
  |     |-- on_node_complete(callback)
  |     |-- on_error(callback)
  |
  |-- ArtifactRetriever
        |-- download(filename) -> bytes
        |-- save_to(filename, path) -> path
```

### Async Dispatch Pattern

```python
import aiohttp
import json
import uuid

class ComfyUIClient:
    def __init__(self, host="localhost", port=8188):
        self.base_url = f"http://{host}:{port}"
        self.ws_url = f"ws://{host}:{port}/ws"
        self.client_id = str(uuid.uuid4())

    async def dispatch(self, workflow: dict) -> str:
        payload = {
            "prompt": workflow,
            "client_id": self.client_id
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/prompt",
                json=payload
            ) as resp:
                result = await resp.json()
                return result["prompt_id"]
```

### Error Handling

Common failure modes and their handling:

| Error | Cause | Recovery |
|-------|-------|----------|
| `prompt_outputs_failed_validation` | Invalid node inputs | Validate workflow against /object_info before submission |
| `CUDA out of memory` | VRAM exhaustion | Reduce resolution, enable tiling, or queue retry after cooldown |
| `Model not found` | Missing checkpoint | Re-run model discovery; suggest download |
| WebSocket disconnect | Server restart or timeout | Auto-reconnect with exponential backoff |

> **Related:** See [04-skill-integration](04-skill-integration.md) for how the Python client integrates with the DACP bundle system and [05-security-sandboxing](05-security-sandboxing.md) for Docker isolation of the ComfyUI instance.

## Summary

The ComfyUI API provides a complete programmatic interface for workflow submission, real-time progress monitoring, and artifact retrieval. The REST endpoints handle synchronous operations while WebSocket events enable reactive progress tracking. The Python client wraps both channels into an async dispatch pattern suitable for integration with skill-creator's agent execution model.
