"""SYMBEX — Symbolic Expression Evaluator.

Compile-time expression tree engine that represents mathematical
expressions as structures, compiles them into optimized evaluation,
and evaluates across parameter spaces. Bridges symbolic math with
GPU execution.

CPU fallback uses NumPy vectorized evaluation.
JIT compilation to CUDA kernels via NVRTC is a future enhancement.
"""

from ..fallback import cpu

CHIP_NAME = "SYMBEX"
OPERATIONS = ["eval", "verify"]


def eval_expr(expression: str, param_name: str, values: list,
              precision: str = "fp64") -> dict:
    return cpu.symbex_eval(expression, param_name, values, precision)


def verify(expression: str, param_name: str, values: list,
           expected: float | list, tolerance: float = 1e-10,
           precision: str = "fp64") -> dict:
    return cpu.symbex_verify(
        expression, param_name, values, expected, tolerance, precision
    )


def capabilities() -> dict:
    from .. import gpu
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": [],
        "cpu_fallback": OPERATIONS,
        "precision": ["fp32", "fp64"],
        "backend": "NVRTC JIT" if gpu.cuda_available() else "numpy eval",
        "jit_cache": False,  # Not yet implemented
    }
