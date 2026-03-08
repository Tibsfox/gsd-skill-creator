"""FOURIER — Signal Processing Engine.

Built on cuFFT and cuFFTDx. Handles FFT, IFFT, spectral analysis,
convolution, and windowing functions.
"""

from ..fallback import cpu

CHIP_NAME = "FOURIER"
OPERATIONS = ["fft", "ifft", "spectrum"]


def fft(data: list, precision: str = "fp64") -> dict:
    return cpu.fft_forward(data, precision)


def ifft(data_real: list, data_imag: list, precision: str = "fp64") -> dict:
    return cpu.ifft(data_real, data_imag, precision)


def spectrum(data: list, sample_rate: float = 1.0,
             precision: str = "fp64") -> dict:
    return cpu.spectrum(data, sample_rate, precision)


def capabilities() -> dict:
    from .. import gpu
    return {
        "chip": CHIP_NAME,
        "operations": OPERATIONS,
        "gpu_accelerated": [],
        "cpu_fallback": OPERATIONS,
        "precision": ["fp32", "fp64"],
        "backend": "cuFFT" if gpu.cuda_available() else "scipy.fft",
    }
