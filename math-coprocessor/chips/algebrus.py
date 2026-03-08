"""ALGEBRUS — Linear Algebra Engine.

Built on cuBLAS, cuSOLVER, and cuSPARSE. Handles GEMM, decomposition,
system solving, determinants, and matrix inversion.

Falls back to NumPy/SciPy when GPU is unavailable.
"""

import numpy as np
from ..fallback import cpu
from .. import gpu

CHIP_NAME = "ALGEBRUS"
OPERATIONS = ["gemm", "solve", "svd", "eigen", "det", "inv"]


def _try_gpu_gemm(a, b, alpha, beta, c, precision):
    """Attempt GPU GEMM via cuBLAS. Returns None if GPU unavailable."""
    if not gpu.cuda_available() or gpu._cublas is None:
        return None

    import ctypes
    import time

    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.ascontiguousarray(np.array(a, dtype=dtype))
    B = np.ascontiguousarray(np.array(b, dtype=dtype))
    m, k = A.shape
    k2, n = B.shape
    if k != k2:
        return None

    C = np.ascontiguousarray(
        np.array(c, dtype=dtype) if c else np.zeros((m, n), dtype=dtype)
    )
    elem_size = 4 if precision == "fp32" else 8

    handle = gpu.cublas_create()
    if handle is None:
        return None

    try:
        t = time.perf_counter()
        # Allocate device memory
        d_A = gpu.cuda_malloc(m * k * elem_size)
        d_B = gpu.cuda_malloc(k * n * elem_size)
        d_C = gpu.cuda_malloc(m * n * elem_size)
        if not all([d_A, d_B, d_C]):
            for p in [d_A, d_B, d_C]:
                if p:
                    gpu.cuda_free(p)
            return None

        # Copy to device (cuBLAS uses column-major, so transpose)
        At = np.ascontiguousarray(A.T)
        Bt = np.ascontiguousarray(B.T)
        Ct = np.ascontiguousarray(C.T)
        gpu.cuda_memcpy_h2d(d_A, At.ctypes.data, At.nbytes)
        gpu.cuda_memcpy_h2d(d_B, Bt.ctypes.data, Bt.nbytes)
        gpu.cuda_memcpy_h2d(d_C, Ct.ctypes.data, Ct.nbytes)

        alpha_p = (ctypes.c_float if precision == "fp32" else ctypes.c_double)(alpha)
        beta_p = (ctypes.c_float if precision == "fp32" else ctypes.c_double)(beta)

        if precision == "fp32":
            gpu._cublas.cublasSgemm_v2(
                handle, 0, 0,  # CUBLAS_OP_N, CUBLAS_OP_N
                m, n, k,
                ctypes.byref(alpha_p),
                d_A, m,
                d_B, k,
                ctypes.byref(beta_p),
                d_C, m,
            )
        else:
            gpu._cublas.cublasDgemm_v2(
                handle, 0, 0,
                m, n, k,
                ctypes.byref(alpha_p),
                d_A, m,
                d_B, k,
                ctypes.byref(beta_p),
                d_C, m,
            )

        gpu.cuda_synchronize()

        # Copy result back
        gpu.cuda_memcpy_d2h(Ct.ctypes.data, d_C, Ct.nbytes)
        result = Ct.T.copy()

        elapsed = time.perf_counter() - t

        gpu.cuda_free(d_A)
        gpu.cuda_free(d_B)
        gpu.cuda_free(d_C)

        return {
            "result": result.tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "gemm",
        }
    finally:
        gpu.cublas_destroy(handle)


def gemm(a: list, b: list, alpha: float = 1.0, beta: float = 0.0,
         c: list | None = None, precision: str = "fp64") -> dict:
    result = _try_gpu_gemm(a, b, alpha, beta, c, precision)
    if result is not None:
        return result
    return cpu.gemm(a, b, alpha, beta, c, precision)


def solve(a: list, b: list, precision: str = "fp64") -> dict:
    # GPU solve via cuSOLVER would go here
    return cpu.solve(a, b, precision)


def svd(a: list, precision: str = "fp64") -> dict:
    return cpu.svd(a, precision)


def eigen(a: list, precision: str = "fp64") -> dict:
    return cpu.eigen(a, precision)


def det(a: list, precision: str = "fp64") -> dict:
    return cpu.det(a, precision)


def inv(a: list, precision: str = "fp64") -> dict:
    return cpu.inv(a, precision)


def capabilities() -> dict:
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": ["gemm"],
        "cpu_fallback": ["solve", "svd", "eigen", "det", "inv"],
        "precision": ["fp32", "fp64"],
        "backend": "cuBLAS/cuSOLVER" if gpu.cuda_available() else "numpy/scipy",
    }
