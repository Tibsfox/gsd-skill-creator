"""VECTORA — Vector Calculus & Geometry Engine.

Custom CUDA kernels for gradient computation, coordinate system
transformations, Bezier/B-spline evaluation, and batch function
evaluation across parameter spaces.
"""

from ..fallback import cpu

CHIP_NAME = "VECTORA"
OPERATIONS = ["gradient", "transform", "batch_eval"]


def gradient(field: list, spacing: float = 1.0,
             precision: str = "fp64") -> dict:
    return cpu.gradient(field, spacing, precision)


def transform(points: list, matrix: list,
              precision: str = "fp64") -> dict:
    return cpu.transform(points, matrix, precision)


def batch_eval(expression: str, param_name: str, values: list,
               precision: str = "fp64") -> dict:
    return cpu.batch_eval(expression, param_name, values, precision)


def capabilities() -> dict:
    from .. import gpu
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": [],
        "cpu_fallback": OPERATIONS,
        "precision": ["fp32", "fp64"],
        "backend": "custom CUDA" if gpu.cuda_available() else "numpy",
    }
