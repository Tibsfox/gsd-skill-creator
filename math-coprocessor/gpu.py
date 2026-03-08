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
    """Host to device. Wraps src as c_void_p to prevent 64-bit truncation."""
    if _cudart:
        _cudart.cudaMemcpy(dst, ctypes.c_void_p(src), ctypes.c_size_t(size), 1)


def cuda_memcpy_d2h(dst, src: ctypes.c_void_p, size: int):
    """Device to host. Wraps dst as c_void_p to prevent 64-bit truncation."""
    if _cudart:
        _cudart.cudaMemcpy(ctypes.c_void_p(dst), src, ctypes.c_size_t(size), 2)


def cuda_synchronize():
    if _cudart:
        _cudart.cudaDeviceSynchronize()


# cuFFT constants
CUFFT_C2C = 0x29
CUFFT_Z2Z = 0x69
CUFFT_FORWARD = -1
CUFFT_INVERSE = 1


# cuFFT plan management
def cufft_plan_1d(n: int, fft_type: int) -> cufftHandle | None:
    """Create a 1D FFT plan."""
    if _cufft is None:
        return None
    plan = cufftHandle()
    status = _cufft.cufftPlan1d(ctypes.byref(plan), n, fft_type, 1)
    return plan if status == 0 else None


def cufft_exec_z2z(plan: cufftHandle, d_in, d_out, direction: int) -> bool:
    if _cufft is None:
        return False
    return _cufft.cufftExecZ2Z(plan, d_in, d_out, direction) == 0


def cufft_exec_c2c(plan: cufftHandle, d_in, d_out, direction: int) -> bool:
    if _cufft is None:
        return False
    return _cufft.cufftExecC2C(plan, d_in, d_out, direction) == 0


def cufft_destroy(plan: cufftHandle):
    if _cufft and plan:
        _cufft.cufftDestroy(plan)


# cuRAND constants
CURAND_RNG_PSEUDO_DEFAULT = 100


# cuRAND generator management
def curand_create(rng_type: int = CURAND_RNG_PSEUDO_DEFAULT) -> curandGenerator_t | None:
    if _curand is None:
        return None
    gen = curandGenerator_t()
    status = _curand.curandCreateGenerator(ctypes.byref(gen), rng_type)
    return gen if status == 0 else None


def curand_set_seed(gen: curandGenerator_t, seed: int):
    if _curand and gen:
        _curand.curandSetPseudoRandomGeneratorSeed(gen, ctypes.c_ulonglong(seed))


def curand_generate_uniform_double(gen: curandGenerator_t, ptr: ctypes.c_void_p, n: int) -> bool:
    """Generate n uniform doubles on GPU. n must be even."""
    if _curand and gen:
        return _curand.curandGenerateUniformDouble(gen, ptr, ctypes.c_size_t(n)) == 0
    return False


def curand_generate_uniform(gen: curandGenerator_t, ptr: ctypes.c_void_p, n: int) -> bool:
    """Generate n uniform floats on GPU. n must be even."""
    if _curand and gen:
        return _curand.curandGenerateUniform(gen, ptr, ctypes.c_size_t(n)) == 0
    return False


def curand_destroy(gen: curandGenerator_t):
    if _curand and gen:
        _curand.curandDestroyGenerator(gen)
