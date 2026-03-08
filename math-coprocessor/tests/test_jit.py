"""Tests for the SYMBEX JIT compiler.

The expression translator tests run without GPU.
GPU execution tests are skipped if NVRTC/CUDA is unavailable.
"""

import math
import pytest
import numpy as np
from math_coprocessor.jit import (
    translate_expression,
    compile_kernel,
    eval_gpu,
    verify_gpu,
    jit_available,
    clear_cache,
    cache_stats,
    CudaTranslator,
)


# =============================================================================
# Expression Translator Tests (no GPU needed)
# =============================================================================

class TestCudaTranslator:
    """Unit tests for AST -> CUDA C translation."""

    def test_simple_variable(self):
        result = translate_expression("x", "x")
        assert result == "x[i]"

    def test_constant_pi(self):
        result = translate_expression("pi", "x")
        assert result == "M_PI"

    def test_constant_e(self):
        result = translate_expression("e", "x")
        assert result == "M_E"

    def test_addition(self):
        result = translate_expression("x + 1", "x")
        assert "x[i]" in result
        assert "+" in result
        assert "1.0" in result

    def test_subtraction(self):
        result = translate_expression("x - 2", "x")
        assert "-" in result

    def test_multiplication(self):
        result = translate_expression("x * 3", "x")
        assert "*" in result

    def test_division(self):
        result = translate_expression("x / 2", "x")
        assert "/" in result

    def test_power_fp64(self):
        result = translate_expression("x**2", "x", "fp64")
        assert "pow(x[i], 2.0)" == result

    def test_power_fp32(self):
        result = translate_expression("x**2", "x", "fp32")
        assert "powf" in result

    def test_sin_fp64(self):
        result = translate_expression("sin(x)", "x", "fp64")
        assert result == "sin(x[i])"

    def test_sin_fp32(self):
        result = translate_expression("sin(x)", "x", "fp32")
        assert result == "sinf(x[i])"

    def test_cos(self):
        result = translate_expression("cos(x)", "x")
        assert result == "cos(x[i])"

    def test_exp(self):
        result = translate_expression("exp(x)", "x")
        assert result == "exp(x[i])"

    def test_log(self):
        result = translate_expression("log(x)", "x")
        assert result == "log(x[i])"

    def test_sqrt(self):
        result = translate_expression("sqrt(x)", "x")
        assert result == "sqrt(x[i])"

    def test_abs_maps_to_fabs(self):
        result = translate_expression("abs(x)", "x")
        assert result == "fabs(x[i])"

    def test_abs_fp32_maps_to_fabsf(self):
        result = translate_expression("abs(x)", "x", "fp32")
        assert result == "fabsf(x[i])"

    def test_nested_expression(self):
        result = translate_expression("sin(x) + cos(x)", "x")
        assert "sin(x[i])" in result
        assert "cos(x[i])" in result
        assert "+" in result

    def test_complex_expression(self):
        result = translate_expression("sin(x)**2 + cos(x)**2", "x")
        assert "pow" in result
        assert "sin" in result
        assert "cos" in result

    def test_unary_negative(self):
        result = translate_expression("-x", "x")
        assert "(-x[i])" == result

    def test_np_prefix_stripped(self):
        """np.sin should be treated same as sin."""
        translator = CudaTranslator("x")
        result = translator.translate("np.sin(x)")
        assert result == "sin(x[i])"

    def test_different_param_name(self):
        result = translate_expression("t + 1", "t")
        assert "x[i]" in result
        assert "1.0" in result

    def test_integer_constant_fp64(self):
        result = translate_expression("42", "x", "fp64")
        assert "42.0" in result

    def test_float_constant_fp32(self):
        result = translate_expression("3.14", "x", "fp32")
        assert "f" in result

    def test_modulo(self):
        result = translate_expression("x % 2", "x")
        assert "%" in result

    def test_floor_div(self):
        result = translate_expression("x // 2", "x")
        assert "floor" in result

    def test_unknown_variable_raises(self):
        with pytest.raises(ValueError, match="Unknown variable"):
            translate_expression("y + 1", "x")

    def test_unsupported_function_raises(self):
        with pytest.raises(ValueError, match="Unsupported function"):
            translate_expression("foo(x)", "x")

    def test_trig_inverse_functions(self):
        assert "asin" in translate_expression("asin(x)", "x")
        assert "acos" in translate_expression("acos(x)", "x")
        assert "atan" in translate_expression("atan(x)", "x")

    def test_hyperbolic_functions(self):
        assert "sinh" in translate_expression("sinh(x)", "x")
        assert "cosh" in translate_expression("cosh(x)", "x")
        assert "tanh" in translate_expression("tanh(x)", "x")


# =============================================================================
# JIT Compilation Tests (require GPU)
# =============================================================================

needs_jit = pytest.mark.skipif(
    not jit_available(),
    reason="NVRTC JIT not available (no GPU or NVRTC library)",
)


@needs_jit
class TestJITCompilation:
    """Tests for NVRTC kernel compilation."""

    def setup_method(self):
        clear_cache()

    def test_compile_simple_expression(self):
        kernel = compile_kernel("x + 1", "x", "fp64")
        assert kernel is not None
        assert kernel.expression == "x + 1"
        assert kernel.precision == "fp64"

    def test_compile_caches_kernel(self):
        k1 = compile_kernel("x * 2", "x", "fp64")
        k2 = compile_kernel("x * 2", "x", "fp64")
        assert k1 is k2  # Same object from cache

    def test_different_precision_different_cache(self):
        k1 = compile_kernel("sin(x)", "x", "fp64")
        k2 = compile_kernel("sin(x)", "x", "fp32")
        assert k1 is not k2

    def test_cache_stats(self):
        compile_kernel("x + 1", "x", "fp64")
        stats = cache_stats()
        assert stats["cached_kernels"] >= 1

    def test_clear_cache(self):
        compile_kernel("x + 1", "x", "fp64")
        clear_cache()
        assert cache_stats()["cached_kernels"] == 0


@needs_jit
class TestGPUEval:
    """Tests for GPU kernel execution."""

    def setup_method(self):
        clear_cache()

    def test_eval_linear(self):
        kernel = compile_kernel("x + 1", "x", "fp64")
        result = eval_gpu(kernel, [0, 1, 2, 3], "fp64")
        assert result["backend"] == "gpu"
        np.testing.assert_allclose(result["result"], [1, 2, 3, 4], atol=1e-12)

    def test_eval_quadratic(self):
        kernel = compile_kernel("x**2", "x", "fp64")
        result = eval_gpu(kernel, [0, 1, 2, 3, 4], "fp64")
        np.testing.assert_allclose(result["result"], [0, 1, 4, 9, 16], atol=1e-12)

    def test_eval_sin(self):
        kernel = compile_kernel("sin(x)", "x", "fp64")
        values = [0, math.pi / 6, math.pi / 4, math.pi / 2, math.pi]
        result = eval_gpu(kernel, values, "fp64")
        expected = [math.sin(v) for v in values]
        np.testing.assert_allclose(result["result"], expected, atol=1e-12)

    def test_eval_fp32_precision(self):
        kernel = compile_kernel("x + 1", "x", "fp32")
        result = eval_gpu(kernel, [0, 1, 2, 3], "fp32")
        assert result["precision"] == "fp32"
        np.testing.assert_allclose(result["result"], [1, 2, 3, 4], atol=1e-6)

    def test_eval_complex_expression(self):
        kernel = compile_kernel("sin(x)**2 + cos(x)**2", "x", "fp64")
        values = [0.1, 0.5, 1.0, 2.0, 3.0]
        result = eval_gpu(kernel, values, "fp64")
        # sin^2 + cos^2 = 1 for all x
        np.testing.assert_allclose(result["result"], [1.0] * 5, atol=1e-12)

    def test_eval_large_array(self):
        kernel = compile_kernel("x * 2", "x", "fp64")
        values = list(range(10000))
        result = eval_gpu(kernel, values, "fp64")
        expected = [v * 2 for v in values]
        np.testing.assert_allclose(result["result"], expected, atol=1e-10)

    def test_eval_returns_timing(self):
        kernel = compile_kernel("x + 1", "x", "fp64")
        result = eval_gpu(kernel, [1, 2, 3], "fp64")
        assert "computation_time_ms" in result
        assert result["computation_time_ms"] >= 0


@needs_jit
class TestGPUVerify:
    """Tests for GPU verification."""

    def setup_method(self):
        clear_cache()

    def test_verify_identity(self):
        kernel = compile_kernel("sin(x)**2 + cos(x)**2", "x", "fp64")
        result = verify_gpu(kernel, [0.1, 0.5, 1.0], 1.0, 1e-10, "fp64")
        assert result["verified"] is True
        assert result["backend"] == "gpu"
        assert result["max_error"] < 1e-10

    def test_verify_failure(self):
        kernel = compile_kernel("x + 1", "x", "fp64")
        result = verify_gpu(kernel, [0, 1, 2], 0.0, 1e-10, "fp64")
        assert result["verified"] is False

    def test_verify_with_tolerance(self):
        kernel = compile_kernel("x + 1.0001", "x", "fp64")
        result = verify_gpu(kernel, [0.0], 1.0, 0.001, "fp64")
        assert result["verified"] is True


# =============================================================================
# Integration: symbex chip GPU path
# =============================================================================

@needs_jit
class TestSymbexChipGPUPath:
    """Integration tests: symbex chip using GPU when available."""

    def test_eval_uses_gpu_backend(self):
        from math_coprocessor.chips import symbex
        result = symbex.eval_expr("x + 1", "x", [0, 1, 2, 3])
        assert result["backend"] == "gpu"
        np.testing.assert_allclose(result["result"], [1, 2, 3, 4], atol=1e-12)

    def test_verify_uses_gpu_backend(self):
        from math_coprocessor.chips import symbex
        result = symbex.verify(
            "sin(x)**2 + cos(x)**2", "x", [0.1, 0.5, 1.0],
            expected=1.0, tolerance=1e-10,
        )
        assert result["backend"] == "gpu"
        assert result["verified"] is True

    def test_capabilities_reports_jit(self):
        from math_coprocessor.chips import symbex
        caps = symbex.capabilities()
        assert caps["jit_available"] is True
        assert "eval" in caps["gpu_accelerated"]
        assert "verify" in caps["gpu_accelerated"]
