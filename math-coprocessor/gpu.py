"""GPU backend — ctypes bindings to CUDA runtime and math libraries."""

import ctypes
import ctypes.util
import logging
from dataclasses import dataclass

log = logging.getLogger("math-coprocessor.gpu")

# CUDA types
cudaError_t = ctypes.c_int
cublasStatus_t = ctypes.c_int
cublasHandle_t = ctypes.c_void_p
cusolverDnHandle_t = ctypes.c_void_p
cufftHandle = ctypes.c_int
curandGenerator_t = ctypes.c_void_p


@dataclass
class GPUInfo:
    name: str
    compute_capability: tuple[int, int]
    total_memory_mb: int
    free_memory_mb: int
    available: bool


def _load_lib(name: str):
    """Try to load a CUDA shared library."""
    try:
        path = ctypes.util.find_library(name)
        if path:
            return ctypes.CDLL(path)
        # Try common paths directly
        for suffix in [".so", ".so.12", ".so.11"]:
            try:
                return ctypes.CDLL(f"lib{name}{suffix}")
            except OSError:
                continue
    except OSError:
        pass
    return None


# Load CUDA runtime
_cudart = _load_lib("cudart")
_cublas = _load_lib("cublas")
_cusolver = _load_lib("cusolver")
_cufft = _load_lib("cufft")
_curand = _load_lib("curand")


def cuda_available() -> bool:
    """Check if CUDA runtime is available and a device exists."""
    if _cudart is None:
        return False
    count = ctypes.c_int(0)
    err = _cudart.cudaGetDeviceCount(ctypes.byref(count))
    return err == 0 and count.value > 0


def get_gpu_info() -> GPUInfo:
    """Query GPU properties."""
    if not cuda_available():
        return GPUInfo("N/A", (0, 0), 0, 0, False)

    # Get device properties
    class cudaDeviceProp(ctypes.Structure):
        _fields_ = [("name", ctypes.c_char * 256)] + [
            (f"_pad{i}", ctypes.c_byte) for i in range(1024)
        ]

    prop = cudaDeviceProp()
    _cudart.cudaGetDeviceProperties(ctypes.byref(prop), 0)

    # Get memory info
    free = ctypes.c_size_t(0)
    total = ctypes.c_size_t(0)
    _cudart.cudaMemGetInfo(ctypes.byref(free), ctypes.byref(total))

    name = prop.name.decode("utf-8", errors="replace")

    # Get compute capability
    major = ctypes.c_int(0)
    minor = ctypes.c_int(0)
    _cudart.cudaDeviceGetAttribute(
        ctypes.byref(major), 75, 0  # cudaDevAttrComputeCapabilityMajor
    )
    _cudart.cudaDeviceGetAttribute(
        ctypes.byref(minor), 76, 0  # cudaDevAttrComputeCapabilityMinor
    )

    return GPUInfo(
        name=name,
        compute_capability=(major.value, minor.value),
        total_memory_mb=total.value // (1024 * 1024),
        free_memory_mb=free.value // (1024 * 1024),
        available=True,
    )


def get_memory_info() -> tuple[int, int]:
    """Return (free_bytes, total_bytes) of GPU memory."""
    if not cuda_available():
        return (0, 0)
    free = ctypes.c_size_t(0)
    total = ctypes.c_size_t(0)
    _cudart.cudaMemGetInfo(ctypes.byref(free), ctypes.byref(total))
    return (free.value, total.value)


# cuBLAS handle management
def cublas_create() -> cublasHandle_t | None:
    if _cublas is None:
        return None
    handle = cublasHandle_t()
    status = _cublas.cublasCreate_v2(ctypes.byref(handle))
    return handle if status == 0 else None


def cublas_destroy(handle: cublasHandle_t):
    if _cublas and handle:
        _cublas.cublasDestroy_v2(handle)


# cuSOLVER handle management
def cusolver_create() -> cusolverDnHandle_t | None:
    if _cusolver is None:
        return None
    handle = cusolverDnHandle_t()
    status = _cusolver.cusolverDnCreate(ctypes.byref(handle))
    return handle if status == 0 else None


def cusolver_destroy(handle: cusolverDnHandle_t):
    if _cusolver and handle:
        _cusolver.cusolverDnDestroy(handle)


# Device memory helpers
def cuda_malloc(size: int) -> ctypes.c_void_p | None:
    if _cudart is None:
        return None
    ptr = ctypes.c_void_p()
    err = _cudart.cudaMalloc(ctypes.byref(ptr), ctypes.c_size_t(size))
    return ptr if err == 0 else None


def cuda_free(ptr: ctypes.c_void_p):
    if _cudart and ptr:
        _cudart.cudaFree(ptr)


def cuda_memcpy_h2d(dst: ctypes.c_void_p, src, size: int):
    """Host to device."""
    if _cudart:
        _cudart.cudaMemcpy(dst, src, ctypes.c_size_t(size), 1)


def cuda_memcpy_d2h(dst, src: ctypes.c_void_p, size: int):
    """Device to host."""
    if _cudart:
        _cudart.cudaMemcpy(dst, src, ctypes.c_size_t(size), 2)


def cuda_synchronize():
    if _cudart:
        _cudart.cudaDeviceSynchronize()
