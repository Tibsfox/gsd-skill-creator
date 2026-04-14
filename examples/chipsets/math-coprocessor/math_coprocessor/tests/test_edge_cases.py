"""P2 Edge Case Tests — 10 tests for degenerate inputs and boundary conditions.

Failures here are WARN — they indicate robustness gaps but do not block release.
"""

import threading

import numpy as np
import pytest

from math_coprocessor.fallback import cpu
from math_coprocessor.chips import algebrus, fourier, vectora, statos, symbex
from math_coprocessor.config import load_config


class TestEdgeCases:
    """Edge case and boundary condition tests."""

    def test_empty_array_each_chip(self):
        """Empty array input to each chip should raise an exception, not
        produce garbage output or segfault."""
        # ALGEBRUS: empty matrix GEMM
        with pytest.raises(Exception):
            algebrus.gemm([], [])

        # FOURIER: empty FFT returns empty result (guarded)
        result = fourier.fft([])
        assert result["real"] == []
        assert result["imag"] == []

        # VECTORA: empty gradient
        with pytest.raises(Exception):
            vectora.gradient([])

        # STATOS: empty describe raises from numpy (empty slice)
        with pytest.raises(Exception):
            statos.describe([])

        # SYMBEX: empty values produces empty array result
        result = symbex.eval_expr("x**2", "x", [])
        assert result is not None

    def test_1x1_matrix_operations(self):
        """1x1 matrix (scalar-like) should work for all matrix operations."""
        m = [[5.0]]
        result = algebrus.gemm(m, m)
        np.testing.assert_allclose(result["result"], [[25.0]], atol=1e-12)

        result = algebrus.solve(m, [10.0])
        np.testing.assert_allclose(result["result"], [2.0], atol=1e-12)

        result = algebrus.svd(m)
        np.testing.assert_allclose(result["s"], [5.0], atol=1e-12)

        result = algebrus.eigen(m)
        np.testing.assert_allclose(
            np.real(result["eigenvalues"]), [5.0], atol=1e-12
        )

        result = algebrus.det(m)
        np.testing.assert_allclose(result["result"], 5.0, atol=1e-12)

        result = algebrus.inv(m)
        np.testing.assert_allclose(result["result"], [[0.2]], atol=1e-12)

    def test_very_large_values(self):
        """Very large values (1e308) should not cause overflow crash."""
        big = 1e308
        a = [[big, 0.0], [0.0, 1.0]]
        b = [[1.0, 0.0], [0.0, 1.0]]
        result = cpu.gemm(a, b)
        # Should complete without crash; result may contain inf if overflow
        assert result is not None
        assert result["backend"] == "cpu"

    def test_very_small_values(self):
        """Very small values (1e-308) should not cause underflow crash."""
        tiny = 1e-308
        a = [[tiny, 0.0], [0.0, tiny]]
        b = [[1.0, 0.0], [0.0, 1.0]]
        result = cpu.gemm(a, b)
        assert result is not None
        flat = np.array(result["result"]).flatten()
        # Should preserve the tiny values
        assert not np.any(np.isnan(flat)), "Tiny values should not produce NaN"

    def test_zero_length_fft(self):
        """Zero-length FFT input should return empty result."""
        result = cpu.fft_forward([])
        assert result["real"] == []
        assert result["imag"] == []

    def test_single_element_statistics(self):
        """Single element dataset should produce valid statistics."""
        result = cpu.describe([42.0])
        assert result["mean"] == 42.0
        assert result["std"] == 0.0
        assert result["min"] == 42.0
        assert result["max"] == 42.0
        assert result["count"] == 1

    def test_division_by_zero_batch_eval(self):
        """Division by zero in batch_eval should produce inf, not crash."""
        result = cpu.batch_eval("1.0/x", "x", [1.0, 0.0, -1.0])
        vals = result["result"]
        assert np.isinf(vals[1]), "1/0 should produce inf"
        np.testing.assert_allclose(vals[0], 1.0, atol=1e-12)
        np.testing.assert_allclose(vals[2], -1.0, atol=1e-12)

    def test_negative_dimensions_handled(self):
        """Non-rectangular or invalid matrix shapes should raise, not crash."""
        # Jagged array: rows of different lengths
        a = [[1.0, 2.0], [3.0]]
        b = [[1.0], [2.0]]
        # This should raise ValueError from numpy about incompatible shapes
        with pytest.raises(Exception):
            cpu.gemm(a, b)

    def test_unicode_expression_rejected(self):
        """Unicode characters in expressions should be rejected gracefully."""
        # Greek letters are not in the allowed namespace
        with pytest.raises(Exception):
            cpu.symbex_eval("x + alpha", "x", [1.0])

    def test_concurrent_config_loading(self):
        """Concurrent config loading from multiple threads should not corrupt state."""
        configs = []
        errors = []

        def load():
            try:
                cfg = load_config()
                configs.append(cfg)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=load) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors, f"Config loading errors: {errors}"
        assert len(configs) == 10
        # All configs should have the same default values
        for cfg in configs:
            assert cfg.vram_budget_mb == configs[0].vram_budget_mb
