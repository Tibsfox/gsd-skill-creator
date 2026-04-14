"""Shared fixtures for Math Co-Processor test suite.

Provides sample matrices, signals, and datasets used across all test modules.
"""

import numpy as np
import pytest


# ---------------------------------------------------------------------------
# Fixtures — sample matrices
# ---------------------------------------------------------------------------

@pytest.fixture
def mat_2x2():
    """Simple 2x2 matrix with known eigenvalues."""
    return [[1.0, 2.0],
            [3.0, 4.0]]


@pytest.fixture
def mat_3x3():
    """3x3 matrix for general linear algebra tests."""
    return [[1.0, 2.0, 3.0],
            [4.0, 5.0, 6.0],
            [7.0, 8.0, 10.0]]  # non-singular (det != 0)


@pytest.fixture
def mat_5x5():
    """5x5 positive-definite symmetric matrix."""
    # Build from A^T @ A + I to guarantee positive-definite
    rng = np.random.default_rng(42)
    A = rng.standard_normal((5, 5))
    M = A.T @ A + np.eye(5)
    return M.tolist()


@pytest.fixture
def identity_3x3():
    """3x3 identity matrix."""
    return [[1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0]]


# ---------------------------------------------------------------------------
# Fixtures — sample signals
# ---------------------------------------------------------------------------

@pytest.fixture
def sine_signal():
    """Pure 10 Hz sine wave sampled at 100 Hz, 1 second duration."""
    t = np.linspace(0, 1, 100, endpoint=False)
    signal = np.sin(2 * np.pi * 10 * t)
    return signal.tolist(), 100.0  # (signal, sample_rate)


@pytest.fixture
def mixed_signal():
    """Combination of 5 Hz and 20 Hz sinusoids."""
    t = np.linspace(0, 1, 256, endpoint=False)
    signal = 3.0 * np.sin(2 * np.pi * 5 * t) + 1.5 * np.sin(2 * np.pi * 20 * t)
    return signal.tolist(), 256.0


# ---------------------------------------------------------------------------
# Fixtures — sample datasets
# ---------------------------------------------------------------------------

@pytest.fixture
def linear_dataset():
    """Perfect linear relationship y = 2x + 1."""
    x = np.linspace(0, 10, 50)
    y = 2.0 * x + 1.0
    return x.tolist(), y.tolist()


@pytest.fixture
def quadratic_dataset():
    """Quadratic relationship y = 3x^2 - 2x + 1."""
    x = np.linspace(-5, 5, 100)
    y = 3.0 * x**2 - 2.0 * x + 1.0
    return x.tolist(), y.tolist()


@pytest.fixture
def stats_dataset():
    """Known statistical dataset: [1, 2, 3, ..., 100]."""
    return list(range(1, 101))


@pytest.fixture
def small_dataset():
    """Small dataset for quick tests: [1, 2, 3, 4, 5]."""
    return [1.0, 2.0, 3.0, 4.0, 5.0]
