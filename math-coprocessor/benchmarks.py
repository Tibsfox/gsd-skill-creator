"""Math Co-Processor Benchmark Runner.

Measures GPU vs CPU performance across all chips at multiple input sizes.

Run from project root:
    python math-coprocessor/benchmarks.py

Or with the venv:
    math-coprocessor/.venv/bin/python math-coprocessor/benchmarks.py

Outputs a markdown table comparing wall time and speedup ratios.
"""

import ctypes
import os
import sys
import time

import numpy as np
from scipy import linalg as la
from scipy import fft as sp_fft

# GPU detection — import gpu.py directly (no relative imports needed)
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _SCRIPT_DIR)
import gpu as _gpu  # noqa: E402

HAS_GPU = _gpu.cuda_available()

WARMUP_RUNS = 1
BENCH_RUNS = 3


# -- Timing utilities --

def _time_fn(fn, runs=BENCH_RUNS):
    """Time a function over multiple runs, return average wall time in ms."""
    for _ in range(WARMUP_RUNS):
        fn()
    times = []
    for _ in range(runs):
        t0 = time.perf_counter()
        fn()
        t1 = time.perf_counter()
        times.append((t1 - t0) * 1000)
    return sum(times) / len(times)


def _vram_delta_mb(fn):
    """Measure peak VRAM consumption during a function call (MB)."""
    if not HAS_GPU:
        return 0.0
    free_before, _ = _gpu.get_memory_info()
    fn()
    free_after, _ = _gpu.get_memory_info()
    delta = (free_before - free_after) / (1024 * 1024)
    return max(0.0, delta)


# -- GPU GEMM (inlined from chips/algebrus.py to avoid relative import chain) --

def _gpu_gemm(a_list, b_list, precision="fp64"):
    """Run GEMM on GPU via cuBLAS. Returns result dict or None."""
    if not HAS_GPU or _gpu._cublas is None:
        return None
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.ascontiguousarray(np.array(a_list, dtype=dtype))
    B = np.ascontiguousarray(np.array(b_list, dtype=dtype))
    m, k = A.shape
    _, n = B.shape
    C = np.zeros((m, n), dtype=dtype, order="C")
    elem = A.itemsize
    handle = _gpu.cublas_create()
    if handle is None:
        return None
    try:
        t = time.perf_counter()
        d_A = _gpu.cuda_malloc(m * k * elem)
        d_B = _gpu.cuda_malloc(k * n * elem)
        d_C = _gpu.cuda_malloc(m * n * elem)
        if not all([d_A, d_B, d_C]):
            for p in [d_A, d_B, d_C]:
                if p:
                    _gpu.cuda_free(p)
            return None
        At = np.ascontiguousarray(A.T)
        Bt = np.ascontiguousarray(B.T)
        Ct = np.ascontiguousarray(C.T)
        _gpu.cuda_memcpy_h2d(d_A, At.ctypes.data, At.nbytes)
        _gpu.cuda_memcpy_h2d(d_B, Bt.ctypes.data, Bt.nbytes)
        _gpu.cuda_memcpy_h2d(d_C, Ct.ctypes.data, Ct.nbytes)
        one = (ctypes.c_float if precision == "fp32" else ctypes.c_double)(1.0)
        zero = (ctypes.c_float if precision == "fp32" else ctypes.c_double)(0.0)
        gemm_fn = (_gpu._cublas.cublasSgemm_v2 if precision == "fp32"
                   else _gpu._cublas.cublasDgemm_v2)
        gemm_fn(handle, 0, 0, m, n, k,
                ctypes.byref(one), d_A, m, d_B, k,
                ctypes.byref(zero), d_C, m)
        _gpu.cuda_synchronize()
        _gpu.cuda_memcpy_d2h(Ct.ctypes.data, d_C, Ct.nbytes)
        elapsed = time.perf_counter() - t
        _gpu.cuda_free(d_A)
        _gpu.cuda_free(d_B)
        _gpu.cuda_free(d_C)
        return {"time_ms": elapsed * 1000}
    except Exception:
        return None
    finally:
        _gpu.cublas_destroy(handle)


# -- CPU operation functions (inline, same as fallback/cpu.py) --

def _cpu_gemm(a, b):
    A = np.array(a, dtype=np.float64)
    B = np.array(b, dtype=np.float64)
    return A @ B


def _cpu_solve(a, b):
    return la.solve(np.array(a, dtype=np.float64), np.array(b, dtype=np.float64))


def _cpu_svd(a):
    return la.svd(np.array(a, dtype=np.float64))


def _cpu_fft(data):
    return sp_fft.fft(np.array(data, dtype=np.float64))


def _cpu_monte_carlo(n_paths):
    rng = np.random.default_rng(42)
    x = rng.uniform(0, 6.28, size=n_paths)
    y = rng.uniform(0, 2, size=n_paths)
    z = rng.uniform(-1, 1, size=n_paths)
    return np.sin(x) * np.exp(-y) + z


def _cpu_describe(data):
    x = np.array(data, dtype=np.float64)
    return {
        "mean": float(np.mean(x)), "std": float(np.std(x)),
        "min": float(np.min(x)), "max": float(np.max(x)),
    }


def _cpu_gradient(field):
    return np.gradient(np.array(field, dtype=np.float64))


def _cpu_symbex_eval(values):
    x = np.array(values, dtype=np.float64)
    return np.sin(x) * np.cos(x) + np.exp(-x / 10)


# -- Benchmark definitions --

def bench_gemm(n):
    """ALGEBRUS GEMM: NxN matrix multiply."""
    a = np.random.randn(n, n).tolist()
    b = np.random.randn(n, n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_gemm(a, b))
    gpu_ms = None
    vram = 0.0
    if HAS_GPU:
        vram = _vram_delta_mb(lambda: _gpu_gemm(a, b))
        gpu_ms = _time_fn(lambda: _gpu_gemm(a, b))
    return cpu_ms, gpu_ms, vram


def bench_solve(n):
    """ALGEBRUS solve: NxN linear system."""
    a = np.random.randn(n, n).tolist()
    b = np.random.randn(n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_solve(a, b))
    return cpu_ms, None, 0.0


def bench_svd(n):
    """ALGEBRUS SVD: NxN decomposition."""
    a = np.random.randn(n, n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_svd(a))
    return cpu_ms, None, 0.0


def bench_fft(n):
    """FOURIER FFT: N-point forward transform."""
    data = np.random.randn(n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_fft(data))
    return cpu_ms, None, 0.0


def bench_monte_carlo(n_paths):
    """STATOS Monte Carlo: simulate n_paths."""
    cpu_ms = _time_fn(lambda: _cpu_monte_carlo(n_paths))
    return cpu_ms, None, 0.0


def bench_describe(n):
    """STATOS describe: descriptive stats on N points."""
    data = np.random.randn(n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_describe(data))
    return cpu_ms, None, 0.0


def bench_gradient(n):
    """VECTORA gradient: NxN scalar field."""
    field = np.random.randn(n, n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_gradient(field))
    return cpu_ms, None, 0.0


def bench_symbex_eval(n):
    """SYMBEX eval: evaluate expression at N points."""
    values = np.linspace(0, 10, n).tolist()
    cpu_ms = _time_fn(lambda: _cpu_symbex_eval(values))
    return cpu_ms, None, 0.0


# -- Benchmark matrix --

BENCHMARKS = [
    ("ALGEBRUS", "GEMM", "32x32", 32, bench_gemm),
    ("ALGEBRUS", "GEMM", "128x128", 128, bench_gemm),
    ("ALGEBRUS", "GEMM", "512x512", 512, bench_gemm),
    ("ALGEBRUS", "GEMM", "1024x1024", 1024, bench_gemm),
    ("ALGEBRUS", "solve", "32x32", 32, bench_solve),
    ("ALGEBRUS", "solve", "128x128", 128, bench_solve),
    ("ALGEBRUS", "solve", "512x512", 512, bench_solve),
    ("ALGEBRUS", "SVD", "32x32", 32, bench_svd),
    ("ALGEBRUS", "SVD", "128x128", 128, bench_svd),
    ("FOURIER", "FFT", "1024 pts", 1024, bench_fft),
    ("FOURIER", "FFT", "8192 pts", 8192, bench_fft),
    ("FOURIER", "FFT", "65536 pts", 65536, bench_fft),
    ("FOURIER", "FFT", "262144 pts", 262144, bench_fft),
    ("STATOS", "Monte Carlo", "1K paths", 1000, bench_monte_carlo),
    ("STATOS", "Monte Carlo", "10K paths", 10000, bench_monte_carlo),
    ("STATOS", "Monte Carlo", "100K paths", 100000, bench_monte_carlo),
    ("STATOS", "describe", "10K pts", 10000, bench_describe),
    ("STATOS", "describe", "100K pts", 100000, bench_describe),
    ("STATOS", "describe", "1M pts", 1000000, bench_describe),
    ("VECTORA", "gradient", "100x100", 100, bench_gradient),
    ("VECTORA", "gradient", "500x500", 500, bench_gradient),
    ("SYMBEX", "eval", "1K pts", 1000, bench_symbex_eval),
    ("SYMBEX", "eval", "10K pts", 10000, bench_symbex_eval),
    ("SYMBEX", "eval", "100K pts", 100000, bench_symbex_eval),
]


def run_benchmarks():
    """Run all benchmarks and print results as a markdown table."""
    gpu_info = _gpu.get_gpu_info() if HAS_GPU else None

    print("# Math Co-Processor Benchmark Results")
    print()
    if gpu_info and gpu_info.available:
        print(f"**GPU:** {gpu_info.name}")
    else:
        print("**GPU:** Not available (CPU-only mode)")
    print(f"**Runs per benchmark:** {BENCH_RUNS} (+ {WARMUP_RUNS} warmup)")
    print(f"**NumPy:** {np.__version__}")
    print()
    print("| Chip | Operation | Size | CPU (ms) | GPU (ms) | Speedup | VRAM (MB) |")
    print("|------|-----------|------|----------|----------|---------|-----------|")

    total_start = time.perf_counter()

    for chip, operation, size_label, size_param, bench_fn in BENCHMARKS:
        sys.stdout.flush()
        try:
            cpu_ms, gpu_ms, vram_mb = bench_fn(size_param)
            cpu_str = f"{cpu_ms:.3f}"

            if gpu_ms is not None:
                gpu_str = f"{gpu_ms:.3f}"
                speedup = cpu_ms / gpu_ms if gpu_ms > 0 else float("inf")
                speedup_str = f"{speedup:.2f}x"
            else:
                gpu_str = "---"
                speedup_str = "---"

            vram_str = f"{vram_mb:.1f}" if vram_mb > 0 else "---"

            print(
                f"| {chip} | {operation} | {size_label} "
                f"| {cpu_str} | {gpu_str} | {speedup_str} | {vram_str} |"
            )
        except Exception as e:
            print(
                f"| {chip} | {operation} | {size_label} "
                f"| ERROR | --- | --- | --- |"
            )
            print(f"<!-- Error: {e} -->", file=sys.stderr)

    total_elapsed = time.perf_counter() - total_start
    print()
    print(f"**Total benchmark time:** {total_elapsed:.1f}s")


if __name__ == "__main__":
    run_benchmarks()
