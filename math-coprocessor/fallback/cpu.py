"""CPU fallback implementations using NumPy/SciPy.

When GPU is unavailable, the Math Co-Processor falls back to these
implementations. Results are correct but slower for large inputs.
This mirrors the 68881's F-line trap: if no FPU is present, the OS
emulates the instruction in software.
"""

import time
import numpy as np
from scipy import linalg as la
from scipy import fft as sp_fft
from scipy import stats as sp_stats


def _result(data, precision: str, computation_time: float, op: str):
    """Standard result envelope with precision metadata."""
    return {
        "result": data.tolist() if isinstance(data, np.ndarray) else data,
        "backend": "cpu",
        "precision": precision,
        "computation_time_ms": round(computation_time * 1000, 3),
        "operation": op,
    }


# --- ALGEBRUS operations ---

def gemm(a: list, b: list, alpha: float = 1.0, beta: float = 0.0,
         c: list | None = None, precision: str = "fp64") -> dict:
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    B = np.array(b, dtype=dtype)
    C = np.array(c, dtype=dtype) if c else np.zeros((A.shape[0], B.shape[1]), dtype=dtype)
    t = time.perf_counter()
    result = alpha * (A @ B) + beta * C
    return _result(result, precision, time.perf_counter() - t, "gemm")


def solve(a: list, b: list, precision: str = "fp64") -> dict:
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    B = np.array(b, dtype=dtype)
    t = time.perf_counter()
    x = la.solve(A, B)
    return _result(x, precision, time.perf_counter() - t, "solve")


def svd(a: list, precision: str = "fp64") -> dict:
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    t = time.perf_counter()
    U, s, Vt = la.svd(A)
    elapsed = time.perf_counter() - t
    return {
        "U": U.tolist(), "s": s.tolist(), "Vt": Vt.tolist(),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "svd",
    }


def eigen(a: list, precision: str = "fp64") -> dict:
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    t = time.perf_counter()
    vals, vecs = la.eig(A)
    elapsed = time.perf_counter() - t
    return {
        "eigenvalues": vals.tolist(), "eigenvectors": vecs.tolist(),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "eigen",
    }


def det(a: list, precision: str = "fp64") -> dict:
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    t = time.perf_counter()
    d = la.det(A)
    return _result(float(d), precision, time.perf_counter() - t, "det")


def inv(a: list, precision: str = "fp64") -> dict:
    dtype = np.float32 if precision == "fp32" else np.float64
    A = np.array(a, dtype=dtype)
    t = time.perf_counter()
    result = la.inv(A)
    return _result(result, precision, time.perf_counter() - t, "inv")


# --- FOURIER operations ---

def fft_forward(data: list, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    x = np.array(data, dtype=dtype)
    t = time.perf_counter()
    result = sp_fft.fft(x)
    elapsed = time.perf_counter() - t
    return {
        "real": result.real.tolist(), "imag": result.imag.tolist(),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "fft",
    }


def ifft(data_real: list, data_imag: list, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    x = np.array(data_real, dtype=dtype) + 1j * np.array(data_imag, dtype=dtype)
    t = time.perf_counter()
    result = sp_fft.ifft(x)
    elapsed = time.perf_counter() - t
    return {
        "real": result.real.tolist(), "imag": result.imag.tolist(),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "ifft",
    }


def spectrum(data: list, sample_rate: float = 1.0, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    x = np.array(data, dtype=dtype)
    t = time.perf_counter()
    freqs = sp_fft.fftfreq(len(x), d=1.0 / sample_rate)
    fft_vals = sp_fft.fft(x)
    psd = np.abs(fft_vals) ** 2 / len(x)
    elapsed = time.perf_counter() - t
    # Return only positive frequencies
    n = len(x) // 2
    return {
        "frequencies": freqs[:n].tolist(),
        "power": psd[:n].tolist(),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "spectrum",
    }


# --- VECTORA operations ---

def gradient(field: list, spacing: float = 1.0, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    f = np.array(field, dtype=dtype)
    t = time.perf_counter()
    grads = np.gradient(f, spacing)
    elapsed = time.perf_counter() - t
    if isinstance(grads, list):
        result = [g.tolist() for g in grads]
    else:
        result = grads.tolist()
    return {
        "result": result, "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "gradient",
    }


def transform(points: list, matrix: list, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    P = np.array(points, dtype=dtype)
    M = np.array(matrix, dtype=dtype)
    t = time.perf_counter()
    result = (M @ P.T).T
    return _result(result, precision, time.perf_counter() - t, "transform")


def batch_eval(expression: str, param_name: str, values: list,
               precision: str = "fp64") -> dict:
    """Evaluate a math expression across parameter values."""
    dtype = np.float64 if precision == "fp64" else np.float32
    x = np.array(values, dtype=dtype)
    t = time.perf_counter()
    # Safe evaluation with numpy functions
    namespace = {
        "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan,
        "exp": np.exp, "log": np.log, "sqrt": np.sqrt, "abs": np.abs,
        "pi": np.pi, "e": np.e, param_name: x,
    }
    result = eval(expression, {"__builtins__": {}}, namespace)  # noqa: S307
    elapsed = time.perf_counter() - t
    if isinstance(result, np.ndarray):
        result = result.tolist()
    return {
        "result": result, "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "batch_eval",
    }


# --- STATOS operations ---

def describe(data: list, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    x = np.array(data, dtype=dtype)
    t = time.perf_counter()
    result = {
        "mean": float(np.mean(x)), "median": float(np.median(x)),
        "std": float(np.std(x)), "var": float(np.var(x)),
        "min": float(np.min(x)), "max": float(np.max(x)),
        "count": len(x),
        "q25": float(np.percentile(x, 25)),
        "q75": float(np.percentile(x, 75)),
    }
    elapsed = time.perf_counter() - t
    result.update({
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "describe",
    })
    return result


def monte_carlo(expression: str, param_ranges: dict, n_paths: int = 10000,
                precision: str = "fp64") -> dict:
    """Monte Carlo simulation over parameter space."""
    dtype = np.float64 if precision == "fp64" else np.float32
    t = time.perf_counter()
    rng = np.random.default_rng()
    namespace = {
        "np": np, "sin": np.sin, "cos": np.cos, "exp": np.exp,
        "log": np.log, "sqrt": np.sqrt, "pi": np.pi, "e": np.e,
    }
    for name, (lo, hi) in param_ranges.items():
        namespace[name] = rng.uniform(lo, hi, size=n_paths).astype(dtype)
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
        "n_paths": n_paths, "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "monte_carlo",
    })
    return stats


def regression(x: list, y: list, degree: int = 1, precision: str = "fp64") -> dict:
    dtype = np.float64 if precision == "fp64" else np.float32
    xv = np.array(x, dtype=dtype)
    yv = np.array(y, dtype=dtype)
    t = time.perf_counter()
    coeffs = np.polyfit(xv, yv, degree)
    predicted = np.polyval(coeffs, xv)
    ss_res = np.sum((yv - predicted) ** 2)
    ss_tot = np.sum((yv - np.mean(yv)) ** 2)
    r_squared = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0
    elapsed = time.perf_counter() - t
    return {
        "coefficients": coeffs.tolist(), "r_squared": float(r_squared),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "regression",
    }


# --- SYMBEX operations ---

def symbex_eval(expression: str, param_name: str, values: list,
                precision: str = "fp64") -> dict:
    """Evaluate symbolic expression across parameter space.

    This is the CPU fallback for SYMBEX — no JIT compilation,
    just NumPy vectorized evaluation.
    """
    return batch_eval(expression, param_name, values, precision)


def symbex_verify(expression: str, param_name: str, values: list,
                  expected: float | list, tolerance: float = 1e-10,
                  precision: str = "fp64") -> dict:
    """Verify a mathematical identity by evaluation."""
    dtype = np.float64 if precision == "fp64" else np.float32
    x = np.array(values, dtype=dtype)
    t = time.perf_counter()
    namespace = {
        "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan,
        "exp": np.exp, "log": np.log, "sqrt": np.sqrt, "abs": np.abs,
        "pi": np.pi, "e": np.e, param_name: x,
    }
    result = eval(expression, {"__builtins__": {}}, namespace)  # noqa: S307
    if isinstance(result, np.ndarray):
        result_arr = result
    else:
        result_arr = np.full_like(x, result)
    expected_arr = np.full_like(x, expected) if isinstance(expected, (int, float)) else np.array(expected, dtype=dtype)
    max_error = float(np.max(np.abs(result_arr - expected_arr)))
    verified = max_error <= tolerance
    elapsed = time.perf_counter() - t
    return {
        "verified": verified, "max_error": max_error,
        "tolerance": tolerance, "n_points": len(values),
        "backend": "cpu", "precision": precision,
        "computation_time_ms": round(elapsed * 1000, 3), "operation": "verify",
    }
