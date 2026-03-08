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


# =============================================================================
# NVRTC — Runtime Compilation
# =============================================================================

_nvrtc = _load_lib("nvrtc")


def nvrtc_available() -> bool:
    """Check if NVRTC runtime compilation is available."""
    return _nvrtc is not None


def nvrtc_compile(source: str, options: list[str] | None = None) -> bytes | None:
    """Compile CUDA C source to PTX using NVRTC.

    Returns PTX bytes on success, None on failure.
    """
    if _nvrtc is None:
        return None

    prog = ctypes.c_void_p()
    src = source.encode("utf-8")
    err = _nvrtc.nvrtcCreateProgram(
        ctypes.byref(prog), src, b"eval_kernel.cu",
        0, None, None,
    )
    if err != 0:
        log.warning(f"nvrtcCreateProgram failed (error={err})")
        return None

    try:
        # Compile with options
        opts = options or ["--use_fast_math"]
        opt_bytes = [o.encode("utf-8") if isinstance(o, str) else o for o in opts]
        opt_arr = (ctypes.c_char_p * len(opt_bytes))(*opt_bytes)
        err = _nvrtc.nvrtcCompileProgram(prog, len(opt_bytes), opt_arr)
        if err != 0:
            # Try to get compilation log for debugging
            log_size = ctypes.c_size_t()
            _nvrtc.nvrtcGetProgramLogSize(prog, ctypes.byref(log_size))
            if log_size.value > 1:
                log_buf = (ctypes.c_char * log_size.value)()
                _nvrtc.nvrtcGetProgramLog(prog, log_buf)
                log.warning(f"NVRTC compile error: {bytes(log_buf).decode(errors='replace')}")
            return None

        # Get PTX size
        ptx_size = ctypes.c_size_t()
        _nvrtc.nvrtcGetPTXSize(prog, ctypes.byref(ptx_size))

        # Get PTX
        ptx = (ctypes.c_char * ptx_size.value)()
        _nvrtc.nvrtcGetPTX(prog, ptx)

        return bytes(ptx)
    finally:
        _nvrtc.nvrtcDestroyProgram(ctypes.byref(prog))


# =============================================================================
# CUDA Driver API — Module/Kernel Management
# =============================================================================

_cuda_driver = _load_lib("cuda")


def driver_available() -> bool:
    """Check if the CUDA driver API is available."""
    return _cuda_driver is not None


_driver_initialized = False


def _ensure_driver_init():
    """Initialize the CUDA driver API and ensure a context exists.

    The driver API requires an active CUDA context. We force the runtime
    API to create one by calling cudaFree(0), then cuInit for the driver.
    This ensures both APIs share the same context.
    """
    global _driver_initialized
    if _driver_initialized or _cuda_driver is None:
        return
    # Force the runtime API to create a context (lazy init)
    if _cudart is not None:
        _cudart.cudaFree(ctypes.c_void_p(0))
    _cuda_driver.cuInit(0)
    _driver_initialized = True


def cu_module_load(ptx: bytes) -> ctypes.c_void_p | None:
    """Load a PTX module via the CUDA driver API."""
    if _cuda_driver is None:
        return None
    _ensure_driver_init()
    module = ctypes.c_void_p()
    err = _cuda_driver.cuModuleLoadData(ctypes.byref(module), ptx)
    if err != 0:
        log.warning(f"cuModuleLoadData failed (error={err})")
        return None
    return module


def cu_module_get_function(module: ctypes.c_void_p, name: str) -> ctypes.c_void_p | None:
    """Get a kernel function from a loaded module."""
    if _cuda_driver is None:
        return None
    func = ctypes.c_void_p()
    err = _cuda_driver.cuModuleGetFunction(
        ctypes.byref(func), module, name.encode("utf-8"),
    )
    if err != 0:
        log.warning(f"cuModuleGetFunction failed for '{name}' (error={err})")
        return None
    return func


def cu_module_unload(module: ctypes.c_void_p):
    """Unload a CUDA module."""
    if _cuda_driver and module:
        _cuda_driver.cuModuleUnload(module)


def cu_launch_kernel(
    func: ctypes.c_void_p,
    grid_x: int, grid_y: int, grid_z: int,
    block_x: int, block_y: int, block_z: int,
    shared_mem: int,
    stream: ctypes.c_void_p | None,
    d_x: ctypes.c_void_p,
    d_out: ctypes.c_void_p,
    n: int,
) -> bool:
    """Launch eval_kernel(const T* x, T* out, int n) via the driver API."""
    if _cuda_driver is None:
        return False

    # Build kernel parameter array: pointers to each argument value
    arg_x = ctypes.c_void_p(d_x.value if isinstance(d_x, ctypes.c_void_p) else d_x)
    arg_out = ctypes.c_void_p(d_out.value if isinstance(d_out, ctypes.c_void_p) else d_out)
    arg_n = ctypes.c_int(n)

    args = (ctypes.c_void_p * 3)(
        ctypes.cast(ctypes.pointer(arg_x), ctypes.c_void_p),
        ctypes.cast(ctypes.pointer(arg_out), ctypes.c_void_p),
        ctypes.cast(ctypes.pointer(arg_n), ctypes.c_void_p),
    )

    err = _cuda_driver.cuLaunchKernel(
        func,
        ctypes.c_uint(grid_x), ctypes.c_uint(grid_y), ctypes.c_uint(grid_z),
        ctypes.c_uint(block_x), ctypes.c_uint(block_y), ctypes.c_uint(block_z),
        ctypes.c_uint(shared_mem),
        ctypes.c_void_p(stream) if stream else ctypes.c_void_p(0),
        args,
        None,
    )
    if err != 0:
        log.warning(f"cuLaunchKernel failed (error={err})")
        return False
    return True
