"""Shared fixtures for Math Co-Processor test suite.

Provides sample matrices, signals, and datasets used across all test modules.
Handles the hyphenated package directory via importlib so that relative imports
within the package (e.g., ``from ..fallback import cpu``) resolve correctly.
"""

import importlib.util
import sys
from pathlib import Path

import numpy as np
import pytest

# ---------------------------------------------------------------------------
# Package bootstrap: make 'math_coprocessor' importable despite the hyphen
# in the directory name.  Every submodule that uses relative imports will
# resolve through this top-level module entry.
# ---------------------------------------------------------------------------

_pkg_dir = Path(__file__).resolve().parent.parent

# The package directory has a hyphen (math-coprocessor) which Python can't
# import directly. We use importlib to register it as 'math_coprocessor'.
# The pyproject.toml sets pythonpath=["."] and import_mode="importlib",
# so pytest runs from math-coprocessor/ as the root.

# Register the package as math_coprocessor so relative imports resolve
if "math_coprocessor" not in sys.modules:
    spec = importlib.util.spec_from_file_location(
        "math_coprocessor",
        str(_pkg_dir / "__init__.py"),
        submodule_search_locations=[str(_pkg_dir)],
    )
    _top = importlib.util.module_from_spec(spec)
    _top.__package__ = "math_coprocessor"
    sys.modules["math_coprocessor"] = _top
    spec.loader.exec_module(_top)

# Register subpackages with correct __package__ so relative imports work
for sub in ("fallback", "chips"):
    key = f"math_coprocessor.{sub}"
    if key not in sys.modules:
        sub_dir = _pkg_dir / sub
        sub_spec = importlib.util.spec_from_file_location(
            key,
            str(sub_dir / "__init__.py"),
            submodule_search_locations=[str(sub_dir)],
        )
        sub_mod = importlib.util.module_from_spec(sub_spec)
        sub_mod.__package__ = key
        sys.modules[key] = sub_mod
        sub_spec.loader.exec_module(sub_mod)

# Register individual modules
for mod_name in ("config", "gpu", "streams", "vram"):
    key = f"math_coprocessor.{mod_name}"
    if key not in sys.modules:
        mod_path = _pkg_dir / f"{mod_name}.py"
        if mod_path.exists():
            mod_spec = importlib.util.spec_from_file_location(key, str(mod_path))
            mod_obj = importlib.util.module_from_spec(mod_spec)
            mod_obj.__package__ = "math_coprocessor"
            sys.modules[key] = mod_obj
            mod_spec.loader.exec_module(mod_obj)

# Register chip modules
for chip_name in ("algebrus", "fourier", "vectora", "statos", "symbex"):
    key = f"math_coprocessor.chips.{chip_name}"
    if key not in sys.modules:
        chip_path = _pkg_dir / "chips" / f"{chip_name}.py"
        if chip_path.exists():
            chip_spec = importlib.util.spec_from_file_location(key, str(chip_path))
            chip_mod = importlib.util.module_from_spec(chip_spec)
            chip_mod.__package__ = "math_coprocessor.chips"
            sys.modules[key] = chip_mod
            chip_spec.loader.exec_module(chip_mod)

# Register fallback.cpu
_cpu_key = "math_coprocessor.fallback.cpu"
if _cpu_key not in sys.modules:
    _cpu_path = _pkg_dir / "fallback" / "cpu.py"
    _cpu_spec = importlib.util.spec_from_file_location(_cpu_key, str(_cpu_path))
    _cpu_mod = importlib.util.module_from_spec(_cpu_spec)
    _cpu_mod.__package__ = "math_coprocessor.fallback"
    sys.modules[_cpu_key] = _cpu_mod
    _cpu_spec.loader.exec_module(_cpu_mod)


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
