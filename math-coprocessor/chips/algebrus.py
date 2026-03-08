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


def _try_gpu_solve(a, b, precision):
    """Solve Ax=b via cuSOLVER LU factorization (getrf + getrs)."""
    if not gpu.cuda_available() or gpu._cusolver is None:
        return None

    import ctypes
    import time

    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    B = np.array(b, dtype=dtype)

    if A.ndim != 2 or A.shape[0] != A.shape[1]:
        return None

    n = A.shape[0]
    single_rhs = B.ndim == 1
    if single_rhs:
        B = B.reshape(-1, 1)
    nrhs = B.shape[1]
    elem_size = A.itemsize

    handle = gpu.cusolver_create()
    if handle is None:
        return None

    d_A = d_B = d_ipiv = d_info = d_work = None
    try:
        t = time.perf_counter()

        # cuSOLVER uses column-major
        Ac = np.ascontiguousarray(A.T.copy())
        Bc = np.ascontiguousarray(B.T.copy())

        d_A = gpu.cuda_malloc(n * n * elem_size)
        d_B = gpu.cuda_malloc(n * nrhs * elem_size)
        d_ipiv = gpu.cuda_malloc(n * ctypes.sizeof(ctypes.c_int))
        d_info = gpu.cuda_malloc(ctypes.sizeof(ctypes.c_int))

        if not all([d_A, d_B, d_ipiv, d_info]):
            return None

        gpu.cuda_memcpy_h2d(d_A, Ac.ctypes.data, Ac.nbytes)
        gpu.cuda_memcpy_h2d(d_B, Bc.ctypes.data, Bc.nbytes)

        # Get workspace size
        lwork = ctypes.c_int(0)
        if precision == "fp32":
            gpu._cusolver.cusolverDnSgetrf_bufferSize(
                handle, n, n, d_A, n, ctypes.byref(lwork))
        else:
            gpu._cusolver.cusolverDnDgetrf_bufferSize(
                handle, n, n, d_A, n, ctypes.byref(lwork))

        d_work = gpu.cuda_malloc(lwork.value * elem_size)
        if not d_work:
            return None

        # LU factorization
        if precision == "fp32":
            gpu._cusolver.cusolverDnSgetrf(
                handle, n, n, d_A, n, d_work, d_ipiv, d_info)
        else:
            gpu._cusolver.cusolverDnDgetrf(
                handle, n, n, d_A, n, d_work, d_ipiv, d_info)

        # Check for singular matrix
        info_val = ctypes.c_int(0)
        gpu.cuda_memcpy_d2h(
            ctypes.byref(info_val), d_info, ctypes.sizeof(ctypes.c_int))
        if info_val.value != 0:
            return None

        # Solve using LU factors
        if precision == "fp32":
            gpu._cusolver.cusolverDnSgetrs(
                handle, 0, n, nrhs, d_A, n, d_ipiv, d_B, n, d_info)
        else:
            gpu._cusolver.cusolverDnDgetrs(
                handle, 0, n, nrhs, d_A, n, d_ipiv, d_B, n, d_info)

        gpu.cuda_synchronize()

        # Copy result back (column-major → row-major)
        gpu.cuda_memcpy_d2h(Bc.ctypes.data, d_B, Bc.nbytes)
        result = Bc.T.copy()
        if single_rhs:
            result = result.ravel()

        elapsed = time.perf_counter() - t

        return {
            "result": result.tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "solve",
        }
    except Exception:
        return None
    finally:
        for p in [d_A, d_B, d_ipiv, d_info, d_work]:
            if p:
                gpu.cuda_free(p)
        gpu.cusolver_destroy(handle)


def _try_gpu_svd(a, precision):
    """SVD via cuSOLVER gesvd."""
    if not gpu.cuda_available() or gpu._cusolver is None:
        return None

    import ctypes
    import time

    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)

    if A.ndim != 2:
        return None

    m, n = A.shape
    min_mn = min(m, n)
    elem_size = A.itemsize

    handle = gpu.cusolver_create()
    if handle is None:
        return None

    d_A = d_S = d_U = d_VT = d_work = d_info = None
    try:
        t = time.perf_counter()

        # cuSOLVER uses column-major
        Ac = np.ascontiguousarray(A.T.copy())

        d_A = gpu.cuda_malloc(m * n * elem_size)
        d_S = gpu.cuda_malloc(min_mn * elem_size)
        d_U = gpu.cuda_malloc(m * m * elem_size)
        d_VT = gpu.cuda_malloc(n * n * elem_size)
        d_info = gpu.cuda_malloc(ctypes.sizeof(ctypes.c_int))

        if not all([d_A, d_S, d_U, d_VT, d_info]):
            return None

        gpu.cuda_memcpy_h2d(d_A, Ac.ctypes.data, Ac.nbytes)

        # Get workspace size
        lwork = ctypes.c_int(0)
        if precision == "fp32":
            gpu._cusolver.cusolverDnSgesvd_bufferSize(
                handle, m, n, ctypes.byref(lwork))
        else:
            gpu._cusolver.cusolverDnDgesvd_bufferSize(
                handle, m, n, ctypes.byref(lwork))

        d_work = gpu.cuda_malloc(lwork.value * elem_size)
        if not d_work:
            return None

        # Compute SVD: jobu='A', jobvt='A' (full U and VT)
        jobu = ord('A')
        jobvt = ord('A')

        if precision == "fp32":
            gpu._cusolver.cusolverDnSgesvd(
                handle, jobu, jobvt, m, n,
                d_A, m, d_S, d_U, m, d_VT, n,
                d_work, lwork.value, None, d_info)
        else:
            gpu._cusolver.cusolverDnDgesvd(
                handle, jobu, jobvt, m, n,
                d_A, m, d_S, d_U, m, d_VT, n,
                d_work, lwork.value, None, d_info)

        gpu.cuda_synchronize()

        # Check convergence
        info_val = ctypes.c_int(0)
        gpu.cuda_memcpy_d2h(
            ctypes.byref(info_val), d_info, ctypes.sizeof(ctypes.c_int))
        if info_val.value != 0:
            return None

        # Copy results back
        S = np.empty(min_mn, dtype=dtype)
        U_buf = np.empty(m * m, dtype=dtype)
        VT_buf = np.empty(n * n, dtype=dtype)

        gpu.cuda_memcpy_d2h(S.ctypes.data, d_S, S.nbytes)
        gpu.cuda_memcpy_d2h(U_buf.ctypes.data, d_U, U_buf.nbytes)
        gpu.cuda_memcpy_d2h(VT_buf.ctypes.data, d_VT, VT_buf.nbytes)

        # Column-major to row-major
        U = U_buf.reshape(m, m, order='F')
        VT = VT_buf.reshape(n, n, order='F')

        elapsed = time.perf_counter() - t

        return {
            "U": U.tolist(),
            "s": S.tolist(),
            "Vt": VT.tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "svd",
        }
    except Exception:
        return None
    finally:
        for p in [d_A, d_S, d_U, d_VT, d_work, d_info]:
            if p:
                gpu.cuda_free(p)
        gpu.cusolver_destroy(handle)


def solve(a: list, b: list, precision: str = "fp64") -> dict:
    result = _try_gpu_solve(a, b, precision)
    if result is not None:
        return result
    return cpu.solve(a, b, precision)


def svd(a: list, precision: str = "fp64") -> dict:
    result = _try_gpu_svd(a, precision)
    if result is not None:
        return result
    return cpu.svd(a, precision)


def eigen(a: list, precision: str = "fp64") -> dict:
    return cpu.eigen(a, precision)


def det(a: list, precision: str = "fp64") -> dict:
    return cpu.det(a, precision)


def inv(a: list, precision: str = "fp64") -> dict:
    return cpu.inv(a, precision)


def capabilities() -> dict:
    gpu_ops = ["gemm"]
    cpu_ops = ["eigen", "det", "inv"]
    if gpu.cuda_available() and gpu._cusolver is not None:
        gpu_ops.extend(["solve", "svd"])
    else:
        cpu_ops = ["solve", "svd"] + cpu_ops
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": gpu_ops,
        "cpu_fallback": cpu_ops,
        "precision": ["fp32", "fp64"],
        "backend": "cuBLAS/cuSOLVER" if gpu.cuda_available() else "numpy/scipy",
    }
