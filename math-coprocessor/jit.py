"""SYMBEX JIT Compiler — NVRTC-based GPU kernel compilation.

Translates Python math expressions to CUDA C kernels, compiles them
via NVRTC, and caches the compiled modules for reuse.

The JIT pipeline:
1. Parse expression with Python's ast module
2. Walk AST to generate CUDA C expression string
3. Insert into kernel template
4. Compile with NVRTC to PTX
5. Load PTX module via CUDA driver API
6. Cache compiled kernel for reuse
7. Launch kernel with input data on GPU
"""

import ast
import ctypes
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass

import numpy as np

from . import gpu

log = logging.getLogger("math-coprocessor.jit")


def jit_available() -> bool:
    """Check if NVRTC JIT compilation is available."""
    return gpu.nvrtc_available() and gpu.driver_available() and gpu.cuda_available()


@dataclass
class CompiledKernel:
    """A compiled CUDA kernel ready for execution."""
    module: ctypes.c_void_p
    function: ctypes.c_void_p
    expression: str
    precision: str


# Kernel cache: LRU eviction via OrderedDict (most-recent at end).
# Each cached kernel holds a loaded CUDA module consuming VRAM.
_KERNEL_CACHE_MAX: int = 64  # Default, overridable via chipset config
_kernel_cache: OrderedDict[tuple[str, str, str], CompiledKernel] = OrderedDict()
_cache_hits: int = 0
_cache_misses: int = 0
_cache_evictions: int = 0


def set_cache_max(max_entries: int) -> None:
    """Set the maximum number of cached kernels (from config)."""
    global _KERNEL_CACHE_MAX
    _KERNEL_CACHE_MAX = max(1, max_entries)


def _cache_get(key: tuple[str, str, str]) -> CompiledKernel | None:
    """Get from cache, moving to most-recent position."""
    global _cache_hits, _cache_misses
    if key in _kernel_cache:
        _kernel_cache.move_to_end(key)
        _cache_hits += 1
        return _kernel_cache[key]
    _cache_misses += 1
    return None


def _cache_put(key: tuple[str, str, str], kernel: CompiledKernel) -> None:
    """Insert into cache, evicting LRU if at capacity."""
    global _cache_evictions
    if key in _kernel_cache:
        _kernel_cache.move_to_end(key)
        _kernel_cache[key] = kernel
        return
    while len(_kernel_cache) >= _KERNEL_CACHE_MAX:
        evict_key, evict_kernel = _kernel_cache.popitem(last=False)
        gpu.cu_module_unload(evict_kernel.module)
        _cache_evictions += 1
        log.debug(f"LRU evict: {evict_key[0]} ({evict_key[2]})")
    _kernel_cache[key] = kernel


KERNEL_TEMPLATE = '''extern "C" __global__
void eval_kernel(const {dtype}* __restrict__ x, {dtype}* __restrict__ out, int n) {{
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {{
        out[i] = {expression};
    }}
}}
'''


# =============================================================================
# AST-based Expression Translator
# =============================================================================

class CudaTranslator(ast.NodeVisitor):
    """Translate a Python math expression AST to a CUDA C expression string.

    Handles:
    - Arithmetic: +, -, *, /, **, %
    - Functions: sin, cos, tan, exp, log, sqrt, abs
    - Constants: pi, e
    - The parameter variable (mapped to x[i])
    """

    # Map Python function names to CUDA math functions
    FUNC_MAP = {
        "sin": "sin", "cos": "cos", "tan": "tan",
        "exp": "exp", "log": "log", "sqrt": "sqrt",
        "abs": "fabs", "fabs": "fabs",
        "asin": "asin", "acos": "acos", "atan": "atan",
        "sinh": "sinh", "cosh": "cosh", "tanh": "tanh",
        "ceil": "ceil", "floor": "floor",
    }

    OP_MAP = {
        ast.Add: "+", ast.Sub: "-", ast.Mult: "*",
        ast.Div: "/", ast.Mod: "%",
    }

    def __init__(self, param_name: str, precision: str = "fp64"):
        self.param_name = param_name
        self.fp32 = precision == "fp32"

    def translate(self, expression: str) -> str:
        """Parse and translate a Python math expression to CUDA C."""
        tree = ast.parse(expression, mode="eval")
        return self.visit(tree.body)

    def visit_BinOp(self, node: ast.BinOp) -> str:
        left = self.visit(node.left)
        right = self.visit(node.right)
        if isinstance(node.op, ast.Pow):
            fn = "powf" if self.fp32 else "pow"
            return f"{fn}({left}, {right})"
        if isinstance(node.op, ast.FloorDiv):
            fn = "floorf" if self.fp32 else "floor"
            return f"{fn}(({left}) / ({right}))"
        op = self.OP_MAP.get(type(node.op))
        if op is None:
            raise ValueError(f"Unsupported binary operator: {type(node.op).__name__}")
        return f"({left} {op} {right})"

    def visit_UnaryOp(self, node: ast.UnaryOp) -> str:
        operand = self.visit(node.operand)
        if isinstance(node.op, ast.USub):
            return f"(-{operand})"
        if isinstance(node.op, ast.UAdd):
            return operand
        raise ValueError(f"Unsupported unary operator: {type(node.op).__name__}")

    def visit_Call(self, node: ast.Call) -> str:
        name = self._func_name(node.func)
        args = ", ".join(self.visit(a) for a in node.args)
        cuda_name = self.FUNC_MAP.get(name)
        if cuda_name is None:
            raise ValueError(f"Unsupported function: {name}")
        if self.fp32:
            cuda_name += "f"
        return f"{cuda_name}({args})"

    def visit_Name(self, node: ast.Name) -> str:
        if node.id == self.param_name:
            return "x[i]"
        if node.id == "pi":
            return "M_PI"
        if node.id == "e":
            return "M_E"
        raise ValueError(f"Unknown variable: {node.id}")

    def visit_Constant(self, node: ast.Constant) -> str:
        v = node.value
        if isinstance(v, float):
            return f"{v}f" if self.fp32 else repr(v)
        if isinstance(v, int):
            if self.fp32:
                return f"{float(v)}f"
            return f"{float(v)}"
        raise ValueError(f"Unsupported constant type: {type(v).__name__}")

    def _func_name(self, node: ast.expr) -> str:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            # Handle np.sin, np.cos, etc.
            return node.attr
        raise ValueError(f"Cannot resolve function name from {type(node).__name__}")


def translate_expression(expression: str, param_name: str, precision: str = "fp64") -> str:
    """Translate a Python math expression to CUDA C.

    Public API for the expression translator. Used by compile_kernel
    and directly testable without GPU.
    """
    translator = CudaTranslator(param_name, precision)
    return translator.translate(expression)


# =============================================================================
# Kernel Compilation & Caching
# =============================================================================

def compile_kernel(expression: str, param_name: str, precision: str = "fp64") -> CompiledKernel | None:
    """Compile a math expression to a CUDA kernel.

    Returns a cached kernel if available, otherwise compiles and caches.
    Returns None if JIT is unavailable or compilation fails.
    """
    cache_key = (expression, param_name, precision)
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    if not jit_available():
        return None

    try:
        # Translate expression to CUDA C
        cuda_expr = translate_expression(expression, param_name, precision)
        dtype = "float" if precision == "fp32" else "double"

        # Generate kernel source
        source = KERNEL_TEMPLATE.format(dtype=dtype, expression=cuda_expr)

        # Compile with NVRTC
        ptx = gpu.nvrtc_compile(source)
        if ptx is None:
            log.warning(f"NVRTC compilation failed for: {expression}")
            return None

        # Load module
        module = gpu.cu_module_load(ptx)
        if module is None:
            log.warning("Failed to load compiled PTX module")
            return None

        # Get kernel function
        function = gpu.cu_module_get_function(module, "eval_kernel")
        if function is None:
            gpu.cu_module_unload(module)
            log.warning("Failed to get kernel function from module")
            return None

        kernel = CompiledKernel(
            module=module, function=function,
            expression=expression, precision=precision,
        )
        _cache_put(cache_key, kernel)
        log.info(f"JIT compiled: {expression} ({precision})")
        return kernel

    except Exception as e:
        log.warning(f"JIT compilation error: {e}")
        return None


# =============================================================================
# GPU Kernel Execution
# =============================================================================

BLOCK_SIZE = 256


def eval_gpu(kernel: CompiledKernel, values: list, precision: str = "fp64") -> dict:
    """Evaluate a compiled kernel on GPU.

    Allocates device memory, copies input, launches kernel, copies result back.
    """
    dtype = np.float32 if precision == "fp32" else np.float64
    x = np.ascontiguousarray(np.array(values, dtype=dtype))
    n = len(x)
    nbytes = x.nbytes

    t = time.perf_counter()

    # Allocate device memory
    d_x = gpu.cuda_malloc(nbytes)
    d_out = gpu.cuda_malloc(nbytes)
    if d_x is None or d_out is None:
        if d_x:
            gpu.cuda_free(d_x)
        if d_out:
            gpu.cuda_free(d_out)
        return {"error": "GPU memory allocation failed", "backend": "error"}

    try:
        # Copy input to device
        gpu.cuda_memcpy_h2d(d_x, x.ctypes.data, nbytes)

        # Launch kernel
        grid_size = (n + BLOCK_SIZE - 1) // BLOCK_SIZE

        success = gpu.cu_launch_kernel(
            kernel.function,
            grid_size, 1, 1,
            BLOCK_SIZE, 1, 1,
            0, None,
            d_x, d_out, n,
        )

        if not success:
            return {"error": "Kernel launch failed", "backend": "error"}

        gpu.cuda_synchronize()

        # Copy result back
        out = np.empty(n, dtype=dtype)
        gpu.cuda_memcpy_d2h(out.ctypes.data, d_out, nbytes)

        elapsed = time.perf_counter() - t

        return {
            "result": out.tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "eval",
            "jit_cached": True,
        }
    finally:
        gpu.cuda_free(d_x)
        gpu.cuda_free(d_out)


def verify_gpu(
    kernel: CompiledKernel, values: list, expected: float | list,
    tolerance: float, precision: str = "fp64",
) -> dict:
    """Evaluate expression on GPU and verify against expected values."""
    result = eval_gpu(kernel, values, precision)
    if "error" in result:
        return result

    dtype = np.float32 if precision == "fp32" else np.float64
    computed = np.array(result["result"], dtype=dtype)
    expected_arr = (
        np.full_like(computed, expected)
        if isinstance(expected, (int, float))
        else np.array(expected, dtype=dtype)
    )
    max_error = float(np.max(np.abs(computed - expected_arr)))
    verified = max_error <= tolerance

    return {
        "verified": verified,
        "max_error": max_error,
        "tolerance": tolerance,
        "n_points": len(values),
        "backend": "gpu",
        "precision": precision,
        "computation_time_ms": result["computation_time_ms"],
        "operation": "verify",
        "jit_cached": True,
    }


# =============================================================================
# Cache Management
# =============================================================================

def clear_cache():
    """Release all cached kernels and free GPU modules. Resets counters."""
    global _cache_hits, _cache_misses, _cache_evictions
    for kernel in _kernel_cache.values():
        gpu.cu_module_unload(kernel.module)
    _kernel_cache.clear()
    _cache_hits = 0
    _cache_misses = 0
    _cache_evictions = 0
    log.info("JIT kernel cache cleared")


def cache_stats() -> dict:
    """Return cache statistics including LRU metrics."""
    return {
        "cached_kernels": len(_kernel_cache),
        "max_kernels": _KERNEL_CACHE_MAX,
        "hits": _cache_hits,
        "misses": _cache_misses,
        "evictions": _cache_evictions,
        "hit_rate": round(_cache_hits / max(_cache_hits + _cache_misses, 1), 3),
        "entries": [
            {"expression": k[0], "param": k[1], "precision": k[2]}
            for k in _kernel_cache
        ],
    }
