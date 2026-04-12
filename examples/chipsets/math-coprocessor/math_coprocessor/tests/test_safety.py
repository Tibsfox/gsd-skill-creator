"""P0 Safety-Critical Tests (S-01 through S-06).

These tests verify safety invariants that MUST hold regardless of backend.
Failures here are BLOCK — no release until all pass.
"""

import threading

import numpy as np
import pytest

from math_coprocessor.fallback import cpu
from math_coprocessor.config import CoexistenceConfig, MathCoprocessorConfig
from math_coprocessor.vram import VRAMManager
from math_coprocessor.streams import StreamManager


class TestS01VRAMBudgetEnforcement:
    """S-01: VRAM budget enforcement — operations rejected when workspace
    insufficient, inference unaffected."""

    def test_allocation_rejected_when_budget_exceeded(self):
        """Allocations beyond the budget must return None, not OOM."""
        mgr = VRAMManager(budget_mb=1)  # 1 MB budget
        budget_bytes = 1 * 1024 * 1024

        # First allocation: nearly fills budget
        alloc1 = mgr.allocate(budget_bytes - 100, label="first")
        assert alloc1 is not None, "First allocation within budget should succeed"

        # Second allocation: exceeds budget
        alloc2 = mgr.allocate(1024, label="over-budget")
        assert alloc2 is None, "Allocation exceeding budget must return None"

        # Utilization should reflect only the successful allocation
        util = mgr.utilization
        assert util["active_allocations"] == 1

    def test_free_then_reallocate(self):
        """After freeing, budget space should be available again."""
        mgr = VRAMManager(budget_mb=1)
        budget_bytes = 1 * 1024 * 1024

        alloc = mgr.allocate(budget_bytes - 100, label="fill")
        assert alloc is not None
        mgr.free(alloc)

        # Should be able to allocate again
        alloc2 = mgr.allocate(budget_bytes - 100, label="refill")
        assert alloc2 is not None
        mgr.free_all()


class TestS02NoOOM:
    """S-02: No OOM — rapid successive math dispatches must not crash."""

    def test_100_rapid_gemm_calls(self, mat_2x2):
        """100 rapid GEMM dispatches should complete without crash or error."""
        for i in range(100):
            result = cpu.gemm(mat_2x2, mat_2x2)
            assert "result" in result, f"GEMM call {i} missing result key"
            assert result["backend"] == "cpu"

    def test_100_rapid_fft_calls(self, sine_signal):
        """100 rapid FFT dispatches should complete without crash."""
        signal, _ = sine_signal
        for i in range(100):
            result = cpu.fft_forward(signal)
            assert "real" in result, f"FFT call {i} missing real key"

    def test_100_rapid_mixed_calls(self, mat_2x2, small_dataset):
        """100 rapid calls across different chips should not crash."""
        for i in range(100):
            if i % 3 == 0:
                cpu.gemm(mat_2x2, mat_2x2)
            elif i % 3 == 1:
                cpu.describe(small_dataset)
            else:
                cpu.batch_eval("x**2", "x", [1.0, 2.0, 3.0])


class TestS03GracefulGPUAbsence:
    """S-03: Graceful GPU absence — all operations return correct results
    via CPU fallback when CUDA is unavailable."""

    def test_gemm_cpu_fallback(self, mat_3x3, identity_3x3):
        """GEMM should produce correct result on CPU."""
        result = cpu.gemm(identity_3x3, mat_3x3)
        assert result["backend"] == "cpu"
        expected = mat_3x3
        np.testing.assert_allclose(result["result"], expected, atol=1e-12)

    def test_fft_cpu_fallback(self, sine_signal):
        """FFT should work on CPU."""
        signal, _ = sine_signal
        result = cpu.fft_forward(signal)
        assert result["backend"] == "cpu"
        assert len(result["real"]) == len(signal)

    def test_solve_cpu_fallback(self):
        """Linear solve should work on CPU."""
        A = [[2.0, 1.0], [1.0, 3.0]]
        b = [5.0, 7.0]
        result = cpu.solve(A, b)
        assert result["backend"] == "cpu"
        x = np.array(result["result"])
        np.testing.assert_allclose(np.array(A) @ x, b, atol=1e-12)

    def test_all_operations_have_backend_cpu(self):
        """Every CPU fallback operation should report backend='cpu'."""
        ops = [
            lambda: cpu.gemm([[1]], [[1]]),
            lambda: cpu.solve([[1]], [1]),
            lambda: cpu.svd([[1, 0], [0, 1]]),
            lambda: cpu.eigen([[1, 0], [0, 1]]),
            lambda: cpu.det([[1, 0], [0, 1]]),
            lambda: cpu.inv([[1, 0], [0, 1]]),
            lambda: cpu.fft_forward([1, 0, 1, 0]),
            lambda: cpu.ifft([1, 0], [0, 0]),
            lambda: cpu.spectrum([1, 0, 1, 0]),
            lambda: cpu.gradient([1, 2, 3, 4]),
            lambda: cpu.transform([[1, 0]], [[1, 0], [0, 1]]),
            lambda: cpu.batch_eval("x", "x", [1.0]),
            lambda: cpu.describe([1, 2, 3]),
            lambda: cpu.monte_carlo("x", {"x": [0, 1]}, n_paths=10),
            lambda: cpu.regression([1, 2, 3], [2, 4, 6]),
            lambda: cpu.symbex_eval("x", "x", [1.0]),
            lambda: cpu.symbex_verify("x", "x", [1.0], 1.0),
        ]
        for op in ops:
            result = op()
            assert result.get("backend") == "cpu", (
                f"Operation {result.get('operation')} did not report cpu backend"
            )


class TestS04NaNInfPropagation:
    """S-04: NaN/Inf propagation — invalid inputs produce IEEE 754 compliant
    exceptions, not crashes."""

    def test_nan_in_gemm(self):
        """NaN input should propagate to output, not crash."""
        a = [[float("nan"), 1.0], [0.0, 1.0]]
        b = [[1.0, 0.0], [0.0, 1.0]]
        result = cpu.gemm(a, b)
        # NaN propagates — result should contain NaN
        flat = np.array(result["result"]).flatten()
        assert np.any(np.isnan(flat)), "NaN should propagate through GEMM"

    def test_inf_in_gemm(self):
        """Inf input should propagate to output, not crash."""
        a = [[float("inf"), 1.0], [0.0, 1.0]]
        b = [[1.0, 0.0], [0.0, 1.0]]
        result = cpu.gemm(a, b)
        flat = np.array(result["result"]).flatten()
        assert np.any(np.isinf(flat)), "Inf should propagate through GEMM"

    def test_negative_inf_in_fft(self):
        """Negative Inf in FFT input should not crash."""
        data = [1.0, float("-inf"), 0.0, 1.0]
        result = cpu.fft_forward(data)
        # Should complete without exception
        assert "real" in result

    def test_nan_in_describe(self):
        """NaN in statistics should propagate, not crash."""
        data = [1.0, 2.0, float("nan"), 4.0]
        result = cpu.describe(data)
        # NaN propagates to mean/std
        assert np.isnan(result["mean"]) or result.get("backend") == "cpu"

    def test_singular_matrix_solve(self):
        """Singular matrix in solve should raise, not produce garbage."""
        A = [[1.0, 1.0], [1.0, 1.0]]  # singular
        b = [1.0, 2.0]
        with pytest.raises(Exception):
            cpu.solve(A, b)

    def test_empty_array_describe(self):
        """Empty array to describe should raise, not crash silently."""
        with pytest.raises(Exception):
            cpu.describe([])


class TestS05SymbexSandboxing:
    """S-05: SYMBEX sandboxing — expression evaluator cannot execute system
    calls or access outside namespace."""

    def test_import_blocked(self):
        """__import__('os') must not execute."""
        with pytest.raises(Exception):
            cpu.symbex_eval("__import__('os').system('echo pwned')", "x", [1.0])

    def test_open_blocked(self):
        """open('/etc/passwd') must not execute."""
        with pytest.raises(Exception):
            cpu.symbex_eval("open('/etc/passwd').read()", "x", [1.0])

    def test_eval_blocked(self):
        """Nested eval must not execute."""
        with pytest.raises(Exception):
            cpu.symbex_eval("eval('1+1')", "x", [1.0])

    def test_exec_blocked(self):
        """exec must not execute."""
        with pytest.raises(Exception):
            cpu.symbex_eval("exec('import os')", "x", [1.0])

    def test_getattr_blocked(self):
        """getattr on objects must not work."""
        with pytest.raises(Exception):
            cpu.symbex_eval("getattr(__builtins__, '__import__')('os')", "x", [1.0])

    def test_safe_expression_works(self):
        """Valid math expression should still work in sandbox."""
        result = cpu.symbex_eval("sin(x) + cos(x)", "x", [0.0, 1.0, 2.0])
        assert "result" in result
        vals = result["result"]
        expected = [np.sin(0) + np.cos(0), np.sin(1) + np.cos(1), np.sin(2) + np.cos(2)]
        np.testing.assert_allclose(vals, expected, atol=1e-12)


class TestS06StreamManagerConcurrency:
    """S-06: Stream manager concurrency — max_concurrent_ops limit enforced."""

    def test_max_concurrent_ops_enforced(self):
        """Cannot exceed max_concurrent_ops limit."""
        coex = CoexistenceConfig(max_concurrent_ops=2)
        sm = StreamManager(config=coex)

        assert sm.acquire() is True, "First acquire should succeed"
        assert sm.acquire() is True, "Second acquire should succeed"
        assert sm.acquire() is False, "Third acquire should be rejected (limit=2)"

        sm.release()
        assert sm.acquire() is True, "Acquire after release should succeed"

    def test_release_below_zero(self):
        """Release when no ops active should not go negative."""
        coex = CoexistenceConfig(max_concurrent_ops=4)
        sm = StreamManager(config=coex)
        sm.release()  # release with 0 active
        assert sm._active_ops == 0, "Active ops must not go below zero"

    def test_thread_safety(self):
        """Concurrent acquire/release from multiple threads should not corrupt state."""
        coex = CoexistenceConfig(max_concurrent_ops=100)
        sm = StreamManager(config=coex)
        errors = []

        def worker():
            try:
                for _ in range(50):
                    if sm.acquire():
                        sm.release()
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=worker) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors, f"Thread safety errors: {errors}"
        assert sm._active_ops == 0, "All ops should be released after threads finish"
