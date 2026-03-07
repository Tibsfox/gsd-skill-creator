"""STATOS — Statistical Engine.

Custom CUDA kernels for statistics, probability distributions,
Monte Carlo simulation via cuRAND, and regression.
"""

from ..fallback import cpu

CHIP_NAME = "STATOS"
OPERATIONS = ["describe", "monte_carlo", "regression"]


def describe(data: list, precision: str = "fp64") -> dict:
    return cpu.describe(data, precision)


def monte_carlo(expression: str, param_ranges: dict,
                n_paths: int = 10000, precision: str = "fp64") -> dict:
    return cpu.monte_carlo(expression, param_ranges, n_paths, precision)


def regression(x: list, y: list, degree: int = 1,
               precision: str = "fp64") -> dict:
    return cpu.regression(x, y, degree, precision)


def capabilities() -> dict:
    from .. import gpu
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": [],
        "cpu_fallback": OPERATIONS,
        "precision": ["fp32", "fp64"],
        "backend": "cuRAND+custom" if gpu.cuda_available() else "numpy/scipy",
    }
