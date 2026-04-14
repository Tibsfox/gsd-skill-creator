# GSD Math Co-Processor & Vector Engine

GPU-accelerated mathematical computation for Claude and local inference models.
The modern 68881 — deterministic math at CUDA speed, exposed as MCP tools.

## Architecture

The GPU is not one coprocessor — it is a **chipset** of mathematical engines:

| Chip | Domain | GPU Library | CPU Fallback |
|------|--------|-------------|--------------|
| **ALGEBRUS** | Linear algebra | cuBLAS, cuSOLVER | NumPy, SciPy |
| **FOURIER** | Signal processing | cuFFT | SciPy FFT |
| **VECTORA** | Vector calculus & geometry | Custom CUDA | NumPy |
| **STATOS** | Statistics | cuRAND + custom | NumPy, SciPy |
| **SYMBEX** | Symbolic expressions | NVRTC JIT | NumPy eval |

### The 68881 Protocol

1. **Instruction encounter** — Claude hits a math operation
2. **F-line dispatch** — tool call to this server
3. **Concurrent execution** — GPU computes while LLM continues
4. **Result return** — deterministic result with precision metadata
5. **Graceful degradation** — CPU fallback if GPU unavailable

## Quick Start

### Requirements

- Python 3.10+
- NumPy, SciPy, PyYAML
- `mcp` Python package
- Optional: NVIDIA GPU with CUDA 12.x for GPU acceleration

### Install dependencies

```bash
cd examples/chipsets/math-coprocessor
python -m venv .venv
source .venv/bin/activate
pip install numpy scipy pyyaml mcp
```

### Run the MCP server

```bash
python -m math_coprocessor
```

### Configure Claude Code

Add to your Claude MCP settings (`.claude/settings.json` or project settings):

```json
{
  "mcpServers": {
    "gsd-math-coprocessor": {
      "command": "python",
      "args": ["-m", "math_coprocessor"],
      "cwd": "/path/to/gsd-skill-creator/examples/chipsets/math-coprocessor"
    }
  }
}
```

## API Reference — 18 Tools

### ALGEBRUS — Linear Algebra

| Tool | Description | Required Args |
|------|-------------|---------------|
| `algebrus.gemm` | D = alpha * A @ B + beta * C | `a`, `b` |
| `algebrus.solve` | Solve linear system Ax = b | `a`, `b` |
| `algebrus.svd` | Singular value decomposition | `a` |
| `algebrus.eigen` | Eigendecomposition | `a` |
| `algebrus.det` | Matrix determinant | `a` |

### FOURIER — Signal Processing

| Tool | Description | Required Args |
|------|-------------|---------------|
| `fourier.fft` | Forward FFT (1D) | `data` |
| `fourier.ifft` | Inverse FFT (1D) | `data_real`, `data_imag` |
| `fourier.spectrum` | Power spectral density | `data` |

### VECTORA — Vector Calculus & Geometry

| Tool | Description | Required Args |
|------|-------------|---------------|
| `vectora.gradient` | Gradient of scalar field | `field` |
| `vectora.transform` | Apply transformation matrix | `points`, `matrix` |
| `vectora.batch_eval` | Evaluate expression across values | `expression`, `param_name`, `values` |

### STATOS — Statistics

| Tool | Description | Required Args |
|------|-------------|---------------|
| `statos.describe` | Descriptive statistics | `data` |
| `statos.monte_carlo` | Monte Carlo simulation | `expression`, `param_ranges` |
| `statos.regression` | Polynomial regression | `x`, `y` |

### SYMBEX — Symbolic Expressions

| Tool | Description | Required Args |
|------|-------------|---------------|
| `symbex.eval` | Evaluate expression across parameter space | `expression`, `param_name`, `values` |
| `symbex.verify` | Verify mathematical identity | `expression`, `param_name`, `values`, `expected` |

### META

| Tool | Description |
|------|-------------|
| `math.capabilities` | List all chips, operations, GPU status |
| `math.vram` | Current VRAM utilization |
| `math.streams` | CUDA stream isolation status |

### Common Parameters

All chip tools accept an optional `precision` parameter:
- `"fp64"` (default) — 64-bit double precision
- `"fp32"` — 32-bit single precision (faster, less accurate)

### Response Envelope

Every tool returns a JSON object with:

```json
{
  "result": "<computed value>",
  "backend": "gpu" | "cpu",
  "precision": "fp64" | "fp32",
  "computation_time_ms": 0.123,
  "operation": "gemm"
}
```

## Configuration

The server reads `data/chipset/math-coprocessor.yaml` at startup.

Key settings:
- `vram_budget_mb` — hard ceiling for GPU memory (default: 750MB)
- `default_precision` — fp32 or fp64 (default: fp64)
- `thermal_limit_c` — reduce throughput above this GPU temp (default: 85)
- `chips.<name>.enabled` — enable/disable individual chips
- `inference_coexistence.dedicated_stream` — CUDA stream isolation
- `inference_coexistence.max_concurrent_ops` — concurrency limit

Override config path via environment variable:
```bash
MATH_COPROCESSOR_CONFIG=/path/to/config.yaml python -m math_coprocessor
```

## Inference Coexistence

The Math Co-Processor uses dedicated CUDA streams to avoid interfering with
GPU-based inference (LoRA adapters, llama.cpp, Ollama). Math operations run at
lower stream priority than inference by default.

Settings in `math-coprocessor.yaml`:
```yaml
inference_coexistence:
  dedicated_stream: true
  stream_priority: 1      # lower priority than inference (0)
  max_concurrent_ops: 4   # queue excess requests
  sync_after_op: true     # synchronize after each operation
```

## Testing

```bash
cd examples/chipsets/math-coprocessor
python -m pytest math_coprocessor/tests/ -v
```

Test categories:
- **Safety-critical** (6 tests) — VRAM budget, no OOM, graceful degradation, NaN handling, sandbox
- **Correctness** (20 tests) — each operation vs analytical reference values
- **Integration** (6 tests) — MCP wiring, config loading, dispatch routing
- **Edge cases** (10 tests) — empty inputs, degenerate matrices, overflow/underflow
- **Performance** (8 tests) — operations complete within time bounds

## Benchmarks

```bash
cd examples/chipsets/math-coprocessor
python -m math_coprocessor.benchmarks
```

Outputs a markdown table comparing GPU vs CPU timing across operation sizes.

## File Structure

```
examples/chipsets/math-coprocessor/
  chipset.yaml           # Chipset manifest (sibling of the python package)
  README.md              # Chipset catalog stub
  PACKAGE.md             # This file — full package API docs
  pyproject.toml         # pytest config (testpaths = math_coprocessor/tests)
  mcp-config.json        # MCP server config snippet for Claude
  math_coprocessor/      # Python package (underscore, so it imports)
    __init__.py          # Package entry, version
    __main__.py          # python -m math_coprocessor
    server.py            # MCP server (JSON-RPC over stdio)
    config.py            # chipset.yaml parser
    gpu.py               # CUDA runtime ctypes bindings
    vram.py              # VRAM workspace allocator
    streams.py           # CUDA stream isolation
    jit.py               # NVRTC JIT kernel cache
    benchmarks.py        # Performance benchmark runner
    chips/
      __init__.py
      algebrus.py        # Linear algebra (cuBLAS GPU path)
      fourier.py         # Signal processing
      vectora.py         # Vector calculus & geometry
      statos.py          # Statistics
      symbex.py          # Symbolic expressions
    fallback/
      __init__.py
      cpu.py             # NumPy/SciPy CPU implementations
    tests/
      conftest.py         # Shared fixtures
      test_safety.py      # S-01 through S-06
      test_correctness.py # 20 correctness tests
      test_integration.py # 6 integration tests
      test_edge_cases.py  # 10 edge case tests
      test_performance.py # 8 performance tests
      test_jit.py         # JIT kernel cache tests
```
