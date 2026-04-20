"""STATOS — Statistical Engine.

Custom CUDA kernels for statistics, probability distributions,
Monte Carlo simulation via cuRAND, and regression.
"""

import numpy as np
from ..fallback import cpu
from .. import gpu

CHIP_NAME = "STATOS"
OPERATIONS = ["describe", "monte_carlo", "regression"]


def _try_gpu_monte_carlo(expression, param_ranges, n_paths, precision):
    """Monte Carlo with GPU-accelerated RNG via cuRAND."""
    if not gpu.cuda_available() or gpu._curand is None:
        return None

    import time

    dtype = np.float64 if precision == "fp64" else np.float32
    elem_size = 8 if precision == "fp64" else 4

    gen = gpu.curand_create()
    if gen is None:
        return None

    n_params = len(param_ranges)
    # cuRAND requires even count
    alloc_per_param = n_paths + (n_paths % 2)
    total_alloc = n_params * alloc_per_param

    d_rand = None
    try:
        t = time.perf_counter()

        gpu.curand_set_seed(gen, int(time.perf_counter() * 1e9) & 0xFFFFFFFFFFFFFFFF)

        d_rand = gpu.cuda_malloc(total_alloc * elem_size)
        if not d_rand:
            return None

        # Generate uniform [0,1) on GPU
        if precision == "fp64":
            ok = gpu.curand_generate_uniform_double(gen, d_rand, total_alloc)
        else:
            ok = gpu.curand_generate_uniform(gen, d_rand, total_alloc)

        if not ok:
            return None

        gpu.cuda_synchronize()

        # Transfer back to CPU
        rand_host = np.empty(total_alloc, dtype=dtype)
        gpu.cuda_memcpy_d2h(rand_host.ctypes.data, d_rand, rand_host.nbytes)

        # Scale to parameter ranges and evaluate expression on CPU
        namespace = {
            "np": np, "sin": np.sin, "cos": np.cos, "exp": np.exp,
            "log": np.log, "sqrt": np.sqrt, "pi": np.pi, "e": np.e,
        }
        for i, (name, (lo, hi)) in enumerate(param_ranges.items()):
            offset = i * alloc_per_param
            uniform = rand_host[offset:offset + n_paths]
            namespace[name] = lo + (hi - lo) * uniform

        results = eval(expression, {"__builtins__": {}}, namespace)  # noqa: S307

        if isinstance(results, np.ndarray):
            stats = {
                "mean": float(np.mean(results)),
                "std": float(np.std(results)),
                "min": float(np.min(results)),
                "max": float(np.max(results)),
                "q05": float(np.percentile(results, 5)),
                "q95": float(np.percentile(results, 95)),
            }
        else:
            stats = {"value": float(results)}

        elapsed = time.perf_counter() - t
        stats.update({
            "n_paths": n_paths,
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "monte_carlo",
        })
        return stats
    except Exception:
        return None
    finally:
        if d_rand:
            gpu.cuda_free(d_rand)
        gpu.curand_destroy(gen)


def describe(data: list, precision: str = "fp64") -> dict:
    return cpu.describe(data, precision)


def monte_carlo(expression: str, param_ranges: dict,
                n_paths: int = 10000, precision: str = "fp64") -> dict:
    result = _try_gpu_monte_carlo(expression, param_ranges, n_paths, precision)
    if result is not None:
        return result
    return cpu.monte_carlo(expression, param_ranges, n_paths, precision)


def regression(x: list, y: list, degree: int = 1,
               precision: str = "fp64") -> dict:
    return cpu.regression(x, y, degree, precision)


def capabilities() -> dict:
    gpu_ops = []
    if gpu.cuda_available() and gpu._curand is not None:
        gpu_ops = ["monte_carlo"]
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": gpu_ops,
        "cpu_fallback": [op for op in OPERATIONS if op not in gpu_ops],
        "precision": ["fp32", "fp64"],
        "backend": "cuRAND+custom" if gpu_ops else "numpy/scipy",
    }
