"""P2 Performance Tests — 8 tests verifying operations complete within
reasonable time bounds.

These are NOT GPU benchmarks. They verify that CPU fallback implementations
complete within wall-clock limits acceptable for interactive use.

Failures here are WARN.
"""

import time

import numpy as np
import pytest

from math_coprocessor.fallback import cpu
from math_coprocessor.chips import algebrus, fourier, vectora, statos, symbex


class TestPerformance:
    """Verify operations complete within reasonable time bounds."""

    def test_gemm_100x100_under_1s(self):
        """GEMM of 100x100 matrices should complete in < 1 second."""
        rng = np.random.default_rng(42)
        a = rng.standard_normal((100, 100)).tolist()
        b = rng.standard_normal((100, 100)).tolist()

        start = time.perf_counter()
        result = algebrus.gemm(a, b)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"GEMM 100x100 took {elapsed:.3f}s (limit: 1s)"
        assert "result" in result

    def test_fft_10000_points_under_1s(self):
        """FFT of 10000-point signal should complete in < 1 second."""
        rng = np.random.default_rng(42)
        signal = rng.standard_normal(10000).tolist()

        start = time.perf_counter()
        result = fourier.fft(signal)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"FFT 10000 points took {elapsed:.3f}s (limit: 1s)"
        assert len(result["real"]) == 10000

    def test_monte_carlo_10000_paths_under_2s(self):
        """Monte Carlo with 10000 paths should complete in < 2 seconds."""
        start = time.perf_counter()
        result = statos.monte_carlo(
            expression="x**2 + y**2",
            param_ranges={"x": [-1, 1], "y": [-1, 1]},
            n_paths=10000,
        )
        elapsed = time.perf_counter() - start

        assert elapsed < 2.0, f"Monte Carlo 10k took {elapsed:.3f}s (limit: 2s)"
        assert "mean" in result

    def test_svd_50x50_under_1s(self):
        """SVD of 50x50 matrix should complete in < 1 second."""
        rng = np.random.default_rng(42)
        a = rng.standard_normal((50, 50)).tolist()

        start = time.perf_counter()
        result = algebrus.svd(a)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"SVD 50x50 took {elapsed:.3f}s (limit: 1s)"
        assert "s" in result

    def test_batch_eval_10000_points_under_1s(self):
        """Batch eval of 10000 points should complete in < 1 second."""
        values = np.linspace(0, 100, 10000).tolist()

        start = time.perf_counter()
        result = vectora.batch_eval("sin(x) * exp(-x/50)", "x", values)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"Batch eval 10k took {elapsed:.3f}s (limit: 1s)"
        assert len(result["result"]) == 10000

    def test_describe_100000_points_under_1s(self):
        """Descriptive stats of 100000 points should complete in < 1 second."""
        rng = np.random.default_rng(42)
        data = rng.standard_normal(100000).tolist()

        start = time.perf_counter()
        result = statos.describe(data)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"Describe 100k took {elapsed:.3f}s (limit: 1s)"
        assert result["count"] == 100000

    def test_regression_degree5_1000_points_under_1s(self):
        """Polynomial regression (degree=5) on 1000 points in < 1 second."""
        rng = np.random.default_rng(42)
        x = np.linspace(0, 10, 1000)
        y = (3 * x**5 - 2 * x**3 + x + rng.standard_normal(1000) * 0.1)

        start = time.perf_counter()
        result = statos.regression(x.tolist(), y.tolist(), degree=5)
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"Regression deg5 1k took {elapsed:.3f}s (limit: 1s)"
        assert len(result["coefficients"]) == 6  # degree 5 = 6 coefficients

    def test_verify_10000_points_under_1s(self):
        """Expression verify on 10000 points should complete in < 1 second."""
        values = np.linspace(0, 2 * np.pi, 10000).tolist()

        start = time.perf_counter()
        result = symbex.verify(
            expression="sin(x)**2 + cos(x)**2",
            param_name="x",
            values=values,
            expected=1.0,
            tolerance=1e-10,
        )
        elapsed = time.perf_counter() - start

        assert elapsed < 1.0, f"Verify 10k took {elapsed:.3f}s (limit: 1s)"
        assert result["verified"] is True
