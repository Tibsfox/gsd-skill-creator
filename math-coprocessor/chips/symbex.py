"""SYMBEX — Symbolic Expression Evaluator.

Compile-time expression tree engine that represents mathematical
expressions as structures, compiles them into optimized evaluation,
and evaluates across parameter spaces. Bridges symbolic math with
GPU execution.

GPU path: NVRTC JIT compilation to CUDA kernels.
CPU fallback: NumPy vectorized evaluation.
"""

from ..fallback import cpu
from .. import gpu

CHIP_NAME = "SYMBEX"
OPERATIONS = ["eval", "verify"]


def _try_gpu_eval(expression: str, param_name: str, values: list,
                  precision: str = "fp64") -> dict | None:
    """Attempt GPU evaluation via NVRTC JIT. Returns None if unavailable."""
    from .. import jit

    if not jit.jit_available():
        return None

    kernel = jit.compile_kernel(expression, param_name, precision)
    if kernel is None:
        return None

    result = jit.eval_gpu(kernel, values, precision)
    if "error" in result:
        return None
    return result


def _try_gpu_verify(expression: str, param_name: str, values: list,
                    expected: float | list, tolerance: float,
                    precision: str = "fp64") -> dict | None:
    """Attempt GPU verification via NVRTC JIT. Returns None if unavailable."""
    from .. import jit

    if not jit.jit_available():
        return None

    kernel = jit.compile_kernel(expression, param_name, precision)
    if kernel is None:
        return None

    result = jit.verify_gpu(kernel, values, expected, tolerance, precision)
    if "error" in result:
        return None
    return result


def eval_expr(expression: str, param_name: str, values: list,
              precision: str = "fp64") -> dict:
    result = _try_gpu_eval(expression, param_name, values, precision)
    if result is not None:
        return result
    return cpu.symbex_eval(expression, param_name, values, precision)


def verify(expression: str, param_name: str, values: list,
           expected: float | list, tolerance: float = 1e-10,
           precision: str = "fp64") -> dict:
    result = _try_gpu_verify(
        expression, param_name, values, expected, tolerance, precision
    )
    if result is not None:
        return result
    return cpu.symbex_verify(
        expression, param_name, values, expected, tolerance, precision
    )


def capabilities() -> dict:
    from .. import jit

    has_jit = jit.jit_available()
    cache = jit.cache_stats()
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": OPERATIONS if has_jit else [],
        "cpu_fallback": [] if has_jit else OPERATIONS,
        "precision": ["fp32", "fp64"],
        "backend": "NVRTC JIT" if has_jit else "numpy eval",
        "jit_available": has_jit,
        "jit_cache": cache,
    }
