"""GSD Math Co-Processor MCP Server.

Exposes the 5 math chips (ALGEBRUS, FOURIER, VECTORA, STATOS, SYMBEX)
as MCP tools accessible to Claude and local inference models.

Protocol: JSON-RPC over stdio (MCP standard)
Port: 8788 (when running as network server)

The 68881 Protocol:
1. Instruction encounter — Claude hits a math operation
2. F-line dispatch — tool call to this server
3. Concurrent execution — GPU computes while LLM continues
4. Result return — deterministic result with precision metadata
5. Graceful degradation — CPU fallback if GPU unavailable
"""

import asyncio
import json
import logging
import sys

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from .chips import algebrus, fourier, vectora, statos, symbex
from .config import load_config, MathCoprocessorConfig
from .streams import StreamManager
from .vram import VRAMManager
from . import gpu

logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")
log = logging.getLogger("math-coprocessor")

app = Server("gsd-math-coprocessor")
config = load_config()
vram = VRAMManager(budget_mb=config.vram_budget_mb)
streams = StreamManager(config=config.coexistence)

# --- Chip registry ---
CHIPS = {
    "algebrus": algebrus,
    "fourier": fourier,
    "vectora": vectora,
    "statos": statos,
    "symbex": symbex,
}


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        # ALGEBRUS
        Tool(
            name="algebrus.gemm",
            description="Matrix multiplication: D = alpha * A @ B + beta * C",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "array", "description": "Matrix A (2D array)"},
                    "b": {"type": "array", "description": "Matrix B (2D array)"},
                    "alpha": {"type": "number", "default": 1.0},
                    "beta": {"type": "number", "default": 0.0},
                    "c": {"type": "array", "description": "Matrix C (optional)"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="algebrus.solve",
            description="Solve linear system Ax = b",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "array", "description": "Coefficient matrix A"},
                    "b": {"type": "array", "description": "Right-hand side b"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="algebrus.svd",
            description="Singular value decomposition: A = U * S * Vt",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "array", "description": "Input matrix"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["a"],
            },
        ),
        Tool(
            name="algebrus.eigen",
            description="Eigendecomposition of a square matrix",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "array", "description": "Square matrix"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["a"],
            },
        ),
        Tool(
            name="algebrus.det",
            description="Matrix determinant",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "array", "description": "Square matrix"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["a"],
            },
        ),
        # FOURIER
        Tool(
            name="fourier.fft",
            description="Forward FFT (1D)",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {"type": "array", "description": "Input signal"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="fourier.ifft",
            description="Inverse FFT (1D)",
            inputSchema={
                "type": "object",
                "properties": {
                    "data_real": {"type": "array"},
                    "data_imag": {"type": "array"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["data_real", "data_imag"],
            },
        ),
        Tool(
            name="fourier.spectrum",
            description="Power spectral density estimation",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {"type": "array", "description": "Input signal"},
                    "sample_rate": {"type": "number", "default": 1.0},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["data"],
            },
        ),
        # VECTORA
        Tool(
            name="vectora.gradient",
            description="Gradient of a scalar field",
            inputSchema={
                "type": "object",
                "properties": {
                    "field": {"type": "array", "description": "Scalar field (1D or 2D)"},
                    "spacing": {"type": "number", "default": 1.0},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["field"],
            },
        ),
        Tool(
            name="vectora.transform",
            description="Apply transformation matrix to points",
            inputSchema={
                "type": "object",
                "properties": {
                    "points": {"type": "array", "description": "Points array (Nx2 or Nx3)"},
                    "matrix": {"type": "array", "description": "Transformation matrix"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["points", "matrix"],
            },
        ),
        Tool(
            name="vectora.batch_eval",
            description="Evaluate math expression across parameter values",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression (numpy syntax)"},
                    "param_name": {"type": "string", "description": "Variable name"},
                    "values": {"type": "array", "description": "Parameter values"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["expression", "param_name", "values"],
            },
        ),
        # STATOS
        Tool(
            name="statos.describe",
            description="Descriptive statistics (mean, median, std, var, quartiles)",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {"type": "array", "description": "Data values"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="statos.monte_carlo",
            description="Monte Carlo simulation over parameter space",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Expression to evaluate"},
                    "param_ranges": {"type": "object", "description": "Parameter name -> [min, max]"},
                    "n_paths": {"type": "integer", "default": 10000},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["expression", "param_ranges"],
            },
        ),
        Tool(
            name="statos.regression",
            description="Polynomial regression",
            inputSchema={
                "type": "object",
                "properties": {
                    "x": {"type": "array"}, "y": {"type": "array"},
                    "degree": {"type": "integer", "default": 1},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["x", "y"],
            },
        ),
        # SYMBEX
        Tool(
            name="symbex.eval",
            description="Evaluate expression across parameter space",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {"type": "string"},
                    "param_name": {"type": "string"},
                    "values": {"type": "array"},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["expression", "param_name", "values"],
            },
        ),
        Tool(
            name="symbex.verify",
            description="Verify a mathematical identity by evaluation",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {"type": "string"},
                    "param_name": {"type": "string"},
                    "values": {"type": "array"},
                    "expected": {"description": "Expected value(s)"},
                    "tolerance": {"type": "number", "default": 1e-10},
                    "precision": {"type": "string", "enum": ["fp32", "fp64"], "default": "fp64"},
                },
                "required": ["expression", "param_name", "values", "expected"],
            },
        ),
        # META
        Tool(
            name="math.capabilities",
            description="List available math chips and operations",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="math.vram",
            description="Current VRAM utilization",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="math.streams",
            description="CUDA stream isolation status",
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        result = _dispatch(name, arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        error = {"error": str(e), "operation": name, "backend": "error"}
        return [TextContent(type="text", text=json.dumps(error, indent=2))]


def _dispatch(name: str, args: dict) -> dict:
    """Route F-line instruction to the correct chip."""
    precision = args.pop("precision", None) or config.default_precision

    # Check chip enabled
    chip_name = name.split(".")[0] if "." in name else name
    if chip_name in CHIPS and not config.is_chip_enabled(chip_name):
        return {"error": f"Chip '{chip_name}' is disabled in config"}

    # Acquire stream slot for concurrency control
    if not streams.acquire():
        return {"error": "Max concurrent math operations reached", "limit": streams.config.max_concurrent_ops}

    try:
        result = _execute(name, args, precision)
        # Sync stream after operation if configured
        if streams.config.sync_after_op:
            streams.synchronize()
        return result
    finally:
        streams.release()


def _execute(name: str, args: dict, precision: str) -> dict:
    """Execute the actual chip operation."""
    match name:
        # ALGEBRUS
        case "algebrus.gemm":
            return algebrus.gemm(precision=precision, **args)
        case "algebrus.solve":
            return algebrus.solve(precision=precision, **args)
        case "algebrus.svd":
            return algebrus.svd(precision=precision, **args)
        case "algebrus.eigen":
            return algebrus.eigen(precision=precision, **args)
        case "algebrus.det":
            return algebrus.det(precision=precision, **args)

        # FOURIER
        case "fourier.fft":
            return fourier.fft(precision=precision, **args)
        case "fourier.ifft":
            return fourier.ifft(precision=precision, **args)
        case "fourier.spectrum":
            return fourier.spectrum(precision=precision, **args)

        # VECTORA
        case "vectora.gradient":
            return vectora.gradient(precision=precision, **args)
        case "vectora.transform":
            return vectora.transform(precision=precision, **args)
        case "vectora.batch_eval":
            return vectora.batch_eval(precision=precision, **args)

        # STATOS
        case "statos.describe":
            return statos.describe(precision=precision, **args)
        case "statos.monte_carlo":
            return statos.monte_carlo(precision=precision, **args)
        case "statos.regression":
            return statos.regression(precision=precision, **args)

        # SYMBEX
        case "symbex.eval":
            return symbex.eval_expr(precision=precision, **args)
        case "symbex.verify":
            return symbex.verify(precision=precision, **args)

        # META
        case "math.capabilities":
            return {
                "chips": {
                    cname: {
                        **chip.capabilities(),
                        "enabled": config.is_chip_enabled(cname),
                    }
                    for cname, chip in CHIPS.items()
                },
                "gpu": gpu.get_gpu_info().__dict__ if gpu.cuda_available() else {"available": False},
                "vram": vram.utilization,
                "streams": streams.status,
                "config": {
                    "default_precision": config.default_precision,
                    "thermal_limit_c": config.thermal_limit_c,
                },
            }
        case "math.vram":
            return vram.utilization

        case "math.streams":
            return streams.status

        case _:
            return {"error": f"Unknown operation: {name}"}


async def main():
    """Run the MCP server over stdio."""
    log.info("Starting GSD Math Co-Processor MCP Server")
    log.info(f"Config: {config.name} v{config.version} (budget={config.vram_budget_mb}MB)")

    gpu_info = gpu.get_gpu_info()
    if gpu_info.available:
        log.info(f"GPU: {gpu_info.name} ({gpu_info.free_memory_mb}MB free)")
        streams.initialize()
        if streams.has_dedicated_stream:
            log.info("CUDA stream isolation: active")
    else:
        log.info("No GPU — running in CPU fallback mode")

    enabled = [n for n in CHIPS if config.is_chip_enabled(n)]
    tools = await list_tools()
    log.info(f"Chips enabled: {', '.join(enabled)} ({len(tools)} tools)")

    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

    streams.destroy()


def run():
    asyncio.run(main())


if __name__ == "__main__":
    run()
