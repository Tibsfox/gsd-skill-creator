"""FOURIER — Signal Processing Engine.

Built on cuFFT and cuFFTDx. Handles FFT, IFFT, spectral analysis,
convolution, and windowing functions.
"""

import numpy as np
from ..fallback import cpu
from .. import gpu

CHIP_NAME = "FOURIER"
OPERATIONS = ["fft", "ifft", "spectrum"]


def _try_gpu_fft(data, precision):
    """Forward FFT via cuFFT Z2Z/C2C."""
    if not gpu.cuda_available() or gpu._cufft is None:
        return None

    import ctypes
    import time

    dtype = np.float64 if precision == "fp64" else np.float32
    cdtype = np.complex128 if precision == "fp64" else np.complex64
    x = np.array(data, dtype=dtype)
    n = len(x)
    if n == 0:
        return None

    # Convert real to complex (imag = 0)
    x_complex = np.zeros(n, dtype=cdtype)
    x_complex.real = x
    x_complex = np.ascontiguousarray(x_complex)

    elem_size = x_complex.itemsize  # 16 for complex128, 8 for complex64
    fft_type = gpu.CUFFT_Z2Z if precision == "fp64" else gpu.CUFFT_C2C

    plan = gpu.cufft_plan_1d(n, fft_type)
    if plan is None:
        return None

    d_in = d_out = None
    try:
        t = time.perf_counter()

        d_in = gpu.cuda_malloc(n * elem_size)
        d_out = gpu.cuda_malloc(n * elem_size)

        if not all([d_in, d_out]):
            return None

        gpu.cuda_memcpy_h2d(d_in, x_complex.ctypes.data, x_complex.nbytes)

        if precision == "fp64":
            ok = gpu.cufft_exec_z2z(plan, d_in, d_out, gpu.CUFFT_FORWARD)
        else:
            ok = gpu.cufft_exec_c2c(plan, d_in, d_out, gpu.CUFFT_FORWARD)

        if not ok:
            return None

        gpu.cuda_synchronize()

        result = np.empty(n, dtype=cdtype)
        gpu.cuda_memcpy_d2h(result.ctypes.data, d_out, result.nbytes)

        elapsed = time.perf_counter() - t

        return {
            "real": result.real.tolist(),
            "imag": result.imag.tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "fft",
        }
    except Exception:
        return None
    finally:
        for p in [d_in, d_out]:
            if p:
                gpu.cuda_free(p)
        gpu.cufft_destroy(plan)


def _try_gpu_ifft(data_real, data_imag, precision):
    """Inverse FFT via cuFFT Z2Z/C2C."""
    if not gpu.cuda_available() or gpu._cufft is None:
        return None

    import ctypes
    import time

    dtype = np.float64 if precision == "fp64" else np.float32
    cdtype = np.complex128 if precision == "fp64" else np.complex64

    x = np.array(data_real, dtype=dtype) + 1j * np.array(data_imag, dtype=dtype)
    x = np.ascontiguousarray(x.astype(cdtype))
    n = len(x)
    if n == 0:
        return None

    elem_size = x.itemsize
    fft_type = gpu.CUFFT_Z2Z if precision == "fp64" else gpu.CUFFT_C2C

    plan = gpu.cufft_plan_1d(n, fft_type)
    if plan is None:
        return None

    d_in = d_out = None
    try:
        t = time.perf_counter()

        d_in = gpu.cuda_malloc(n * elem_size)
        d_out = gpu.cuda_malloc(n * elem_size)

        if not all([d_in, d_out]):
            return None

        gpu.cuda_memcpy_h2d(d_in, x.ctypes.data, x.nbytes)

        if precision == "fp64":
            ok = gpu.cufft_exec_z2z(plan, d_in, d_out, gpu.CUFFT_INVERSE)
        else:
            ok = gpu.cufft_exec_c2c(plan, d_in, d_out, gpu.CUFFT_INVERSE)

        if not ok:
            return None

        gpu.cuda_synchronize()

        result = np.empty(n, dtype=cdtype)
        gpu.cuda_memcpy_d2h(result.ctypes.data, d_out, result.nbytes)

        # cuFFT inverse is unnormalized — divide by N
        result /= n

        elapsed = time.perf_counter() - t

        return {
            "real": result.real.tolist(),
            "imag": result.imag.tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(elapsed * 1000, 3),
            "operation": "ifft",
        }
    except Exception:
        return None
    finally:
        for p in [d_in, d_out]:
            if p:
                gpu.cuda_free(p)
        gpu.cufft_destroy(plan)


def fft(data: list, precision: str = "fp64") -> dict:
    result = _try_gpu_fft(data, precision)
    if result is not None:
        return result
    return cpu.fft_forward(data, precision)


def ifft(data_real: list, data_imag: list, precision: str = "fp64") -> dict:
    result = _try_gpu_ifft(data_real, data_imag, precision)
    if result is not None:
        return result
    return cpu.ifft(data_real, data_imag, precision)


def spectrum(data: list, sample_rate: float = 1.0,
             precision: str = "fp64") -> dict:
    # Use GPU FFT if available, then compute PSD on CPU
    fft_result = _try_gpu_fft(data, precision)
    if fft_result is not None:
        import time
        t = time.perf_counter()
        n = len(data)
        real = np.array(fft_result["real"])
        imag = np.array(fft_result["imag"])
        psd = (real ** 2 + imag ** 2) / n
        freqs = np.fft.fftfreq(n, d=1.0 / sample_rate)
        half = n // 2
        elapsed = time.perf_counter() - t
        return {
            "frequencies": freqs[:half].tolist(),
            "power": psd[:half].tolist(),
            "backend": "gpu",
            "precision": precision,
            "computation_time_ms": round(
                fft_result["computation_time_ms"] + elapsed * 1000, 3),
            "operation": "spectrum",
        }
    return cpu.spectrum(data, sample_rate, precision)


def capabilities() -> dict:
    gpu_ops = []
    if gpu.cuda_available() and gpu._cufft is not None:
        gpu_ops = OPERATIONS[:]
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": gpu_ops,
        "cpu_fallback": [op for op in OPERATIONS if op not in gpu_ops],
        "precision": ["fp32", "fp64"],
        "backend": "cuFFT" if gpu_ops else "scipy.fft",
    }
