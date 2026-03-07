"""P1 Correctness Tests — 20 tests verifying each chip operation against
known analytical results.

Failures here are BLOCK — mathematical correctness is non-negotiable.
"""

import numpy as np
import pytest

from math_coprocessor.fallback import cpu
from math_coprocessor.chips import algebrus, fourier, vectora, statos, symbex


# ===========================================================================
# ALGEBRUS (5 tests)
# ===========================================================================

class TestAlgebrusCorrectness:
    """Verify ALGEBRUS chip linear algebra operations."""

    def test_gemm_identity_multiplication(self, mat_3x3, identity_3x3):
        """GEMM: I @ A = A (identity multiplication preserves matrix)."""
        result = algebrus.gemm(identity_3x3, mat_3x3)
        np.testing.assert_allclose(result["result"], mat_3x3, atol=1e-12)

    def test_gemm_alpha_beta(self):
        """GEMM: D = alpha * A @ B + beta * C with known values.

        A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]]
        A @ B = [[19, 22], [43, 50]]
        C = [[1, 1], [1, 1]]
        D = 2.0 * A@B + 3.0 * C = [[41, 47], [89, 103]]
        """
        A = [[1.0, 2.0], [3.0, 4.0]]
        B = [[5.0, 6.0], [7.0, 8.0]]
        C = [[1.0, 1.0], [1.0, 1.0]]
        result = algebrus.gemm(A, B, alpha=2.0, beta=3.0, c=C)
        expected = [[41.0, 47.0], [89.0, 103.0]]
        np.testing.assert_allclose(result["result"], expected, atol=1e-12)

    def test_solve_known_system(self):
        """Solve: Ax = b for a known 3x3 system.

        A = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]
        b = [8, -11, -3]
        x = [2, 3, -1]
        """
        A = [[2.0, 1.0, -1.0], [-3.0, -1.0, 2.0], [-2.0, 1.0, 2.0]]
        b = [8.0, -11.0, -3.0]
        result = algebrus.solve(A, b)
        x = np.array(result["result"])
        expected = [2.0, 3.0, -1.0]
        np.testing.assert_allclose(x, expected, atol=1e-10)

    def test_svd_reconstruction(self, mat_3x3):
        """SVD: A = U @ diag(s) @ Vt within tolerance."""
        result = algebrus.svd(mat_3x3)
        U = np.array(result["U"])
        s = np.array(result["s"])
        Vt = np.array(result["Vt"])
        reconstructed = U @ np.diag(s) @ Vt
        np.testing.assert_allclose(reconstructed, mat_3x3, atol=1e-10)

    def test_eigendecomposition(self, mat_2x2):
        """Eigendecomposition: A @ v = lambda * v for each eigenpair."""
        result = algebrus.eigen(mat_2x2)
        vals = np.array(result["eigenvalues"])
        vecs = np.array(result["eigenvectors"])
        A = np.array(mat_2x2)

        for i in range(len(vals)):
            lam = vals[i]
            v = vecs[:, i]
            # A @ v should equal lambda * v
            lhs = A @ v
            rhs = lam * v
            np.testing.assert_allclose(lhs, rhs, atol=1e-10)


# ===========================================================================
# FOURIER (3 tests)
# ===========================================================================

class TestFourierCorrectness:
    """Verify FOURIER chip signal processing operations."""

    def test_fft_sinusoid_peak(self, sine_signal):
        """FFT of 10 Hz sine wave should peak at bin 10 (100 Hz sample rate)."""
        signal, sample_rate = sine_signal
        result = fourier.fft(signal)
        magnitudes = np.sqrt(
            np.array(result["real"])**2 + np.array(result["imag"])**2
        )
        n = len(signal)
        # Peak should be at frequency index 10 (10 Hz at 100 Hz sample rate)
        # Only check first half (positive frequencies)
        half = n // 2
        peak_idx = np.argmax(magnitudes[1:half]) + 1
        expected_idx = int(10 * n / sample_rate)
        assert peak_idx == expected_idx, (
            f"FFT peak at bin {peak_idx}, expected {expected_idx} (10 Hz)"
        )

    def test_ifft_roundtrip(self, sine_signal):
        """IFFT(FFT(x)) should recover original signal within tolerance."""
        signal, _ = sine_signal
        fft_result = fourier.fft(signal)
        ifft_result = fourier.ifft(fft_result["real"], fft_result["imag"])
        recovered = np.array(ifft_result["real"])
        np.testing.assert_allclose(recovered, signal, atol=1e-10)

    def test_spectrum_peak_frequency(self, sine_signal):
        """Spectrum PSD should peak at injected 10 Hz frequency."""
        signal, sample_rate = sine_signal
        result = fourier.spectrum(signal, sample_rate=sample_rate)
        freqs = np.array(result["frequencies"])
        power = np.array(result["power"])
        # Find the frequency with maximum power
        peak_freq = freqs[np.argmax(power)]
        assert abs(peak_freq - 10.0) < 1.5, (
            f"Spectrum peak at {peak_freq} Hz, expected ~10 Hz"
        )


# ===========================================================================
# VECTORA (3 tests)
# ===========================================================================

class TestVectoraCorrectness:
    """Verify VECTORA chip vector calculus operations."""

    def test_gradient_linear_field(self):
        """Gradient of linear field f(x) = 3x should be constant 3."""
        # f = [0, 3, 6, 9, 12] with spacing=1 -> gradient ~ 3
        field = [0.0, 3.0, 6.0, 9.0, 12.0]
        result = vectora.gradient(field, spacing=1.0)
        grad = np.array(result["result"])
        np.testing.assert_allclose(grad, 3.0, atol=1e-10)

    def test_transform_90_degree_rotation(self):
        """90-degree rotation: (1,0) -> (0,1), (0,1) -> (-1,0)."""
        points = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
        # 90-degree CCW rotation matrix
        theta = np.pi / 2
        rot = [[np.cos(theta), -np.sin(theta)],
               [np.sin(theta),  np.cos(theta)]]
        result = vectora.transform(points, rot)
        expected = [[0.0, 1.0], [-1.0, 0.0], [-1.0, 1.0]]
        np.testing.assert_allclose(result["result"], expected, atol=1e-10)

    def test_batch_eval_sin(self):
        """batch_eval of sin(x) at known points matches np.sin."""
        values = [0.0, np.pi/6, np.pi/4, np.pi/3, np.pi/2, np.pi]
        result = vectora.batch_eval("sin(x)", "x", values)
        expected = np.sin(values).tolist()
        np.testing.assert_allclose(result["result"], expected, atol=1e-12)


# ===========================================================================
# STATOS (4 tests)
# ===========================================================================

class TestStatosCorrectness:
    """Verify STATOS chip statistical operations."""

    def test_describe_known_dataset(self, stats_dataset):
        """Descriptive stats of [1..100] should match numpy reference."""
        result = statos.describe(stats_dataset)
        data = np.array(stats_dataset, dtype=np.float64)
        assert abs(result["mean"] - float(np.mean(data))) < 1e-10
        assert abs(result["std"] - float(np.std(data))) < 1e-10
        assert abs(result["q25"] - float(np.percentile(data, 25))) < 1e-10
        assert abs(result["q75"] - float(np.percentile(data, 75))) < 1e-10
        assert result["count"] == 100

    def test_monte_carlo_estimate_pi(self):
        """Monte Carlo: estimate pi via x^2 + y^2 < 1.

        Area of quarter circle = pi/4, so 4 * (fraction inside) ~ pi.
        Using expression: (x**2 + y**2 < 1) * 4.0
        """
        result = statos.monte_carlo(
            expression="(x**2 + y**2 < 1) * 4.0",
            param_ranges={"x": [0, 1], "y": [0, 1]},
            n_paths=100000,
        )
        pi_estimate = result["mean"]
        assert abs(pi_estimate - np.pi) < 0.1, (
            f"Pi estimate {pi_estimate} not within 0.1 of {np.pi}"
        )

    def test_regression_linear_fit(self, linear_dataset):
        """Linear regression of y=2x+1 should give coefficients [2, 1]."""
        x, y = linear_dataset
        result = statos.regression(x, y, degree=1)
        coeffs = result["coefficients"]
        # polyfit returns [highest_degree_first, ..., constant]
        # For degree=1: [slope, intercept]
        np.testing.assert_allclose(coeffs[0], 2.0, atol=1e-10)
        np.testing.assert_allclose(coeffs[1], 1.0, atol=1e-10)
        assert abs(result["r_squared"] - 1.0) < 1e-10

    def test_regression_quadratic_fit(self, quadratic_dataset):
        """Quadratic regression of y=3x^2-2x+1 should recover coefficients."""
        x, y = quadratic_dataset
        result = statos.regression(x, y, degree=2)
        coeffs = result["coefficients"]
        # polyfit returns [a2, a1, a0] for degree=2
        np.testing.assert_allclose(coeffs[0], 3.0, atol=1e-8)
        np.testing.assert_allclose(coeffs[1], -2.0, atol=1e-8)
        np.testing.assert_allclose(coeffs[2], 1.0, atol=1e-8)
        assert result["r_squared"] > 0.9999


# ===========================================================================
# SYMBEX (3 tests)
# ===========================================================================

class TestSymbexCorrectness:
    """Verify SYMBEX chip symbolic expression operations."""

    def test_eval_polynomial(self):
        """Eval x^2 + 1 at [0, 1, 2, 3] should give [1, 2, 5, 10]."""
        result = symbex.eval_expr("x**2 + 1", "x", [0, 1, 2, 3])
        np.testing.assert_allclose(result["result"], [1, 2, 5, 10], atol=1e-12)

    def test_verify_pythagorean_identity(self):
        """Verify sin(x)^2 + cos(x)^2 = 1 (Pythagorean identity)."""
        x_vals = np.linspace(0, 2 * np.pi, 1000).tolist()
        result = symbex.verify(
            expression="sin(x)**2 + cos(x)**2",
            param_name="x",
            values=x_vals,
            expected=1.0,
            tolerance=1e-15,
        )
        assert result["verified"] is True, (
            f"Pythagorean identity failed with max_error={result['max_error']}"
        )
        assert result["max_error"] < 1e-15

    def test_verify_failure_case(self):
        """Verify that sin(x) != cos(x) at most points (should fail)."""
        x_vals = np.linspace(0.1, 2 * np.pi, 100).tolist()
        result = symbex.verify(
            expression="sin(x)",
            param_name="x",
            values=x_vals,
            expected=0.0,  # sin(x) != 0 at most of these points
            tolerance=1e-10,
        )
        assert result["verified"] is False, (
            "sin(x) = 0 should fail verification at non-zero points"
        )


# ===========================================================================
# Precision (2 tests)
# ===========================================================================

class TestPrecision:
    """Verify FP32 vs FP64 precision behavior."""

    def test_fp32_vs_fp64_error_magnitude(self):
        """FP32 GEMM should have larger numerical error than FP64."""
        # Use a matrix that amplifies floating-point error
        A = [[1.0, 1e-7], [1e-7, 1.0]]
        B = [[1.0, 2.0], [3.0, 4.0]]

        result_32 = cpu.gemm(A, B, precision="fp32")
        result_64 = cpu.gemm(A, B, precision="fp64")

        # Reference: computed in fp64 numpy
        ref = (np.array(A, dtype=np.float64) @ np.array(B, dtype=np.float64))

        err_32 = np.max(np.abs(np.array(result_32["result"]) - ref))
        err_64 = np.max(np.abs(np.array(result_64["result"]) - ref))

        # FP32 error should be >= FP64 error
        assert err_32 >= err_64, (
            f"FP32 error ({err_32}) should be >= FP64 error ({err_64})"
        )

    def test_fp64_matches_numpy_default(self, mat_3x3):
        """FP64 GEMM result should match numpy default precision within 1e-12."""
        A = np.array(mat_3x3)
        ref = (A @ A).tolist()
        result = cpu.gemm(mat_3x3, mat_3x3, precision="fp64")
        np.testing.assert_allclose(result["result"], ref, atol=1e-12)
