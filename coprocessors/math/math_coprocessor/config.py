"""Configuration parser for the Math Co-Processor.

Reads math-coprocessor.yaml from the chipset data directory and provides
typed configuration objects. Falls back to sensible defaults if the config
file is missing or malformed.
"""

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path

log = logging.getLogger("math-coprocessor.config")

# Default config file location (relative to project root)
DEFAULT_CONFIG_PATHS = [
    "data/chipset/math-coprocessor.yaml",
    "../data/chipset/math-coprocessor.yaml",
]


@dataclass
class ChipConfig:
    """Configuration for a single math chip."""
    enabled: bool = True
    gpu_operations: list[str] = field(default_factory=list)
    cpu_fallback: list[str] = field(default_factory=list)


@dataclass
class CoexistenceConfig:
    """CUDA stream isolation settings for inference coexistence."""
    dedicated_stream: bool = True
    stream_priority: int = 1
    max_concurrent_ops: int = 4
    sync_after_op: bool = True


@dataclass
class MathCoprocessorConfig:
    """Top-level configuration for the Math Co-Processor."""
    name: str = "math-coprocessor-v1.0"
    version: str = "1.0.0"
    vram_budget_mb: int = 750
    default_precision: str = "fp64"
    thermal_limit_c: int = 85
    chips: dict[str, ChipConfig] = field(default_factory=lambda: {
        "algebrus": ChipConfig(
            gpu_operations=["gemm"],
            cpu_fallback=["solve", "svd", "eigen", "det", "inv"],
        ),
        "fourier": ChipConfig(cpu_fallback=["fft", "ifft", "spectrum"]),
        "vectora": ChipConfig(cpu_fallback=["gradient", "transform", "batch_eval"]),
        "statos": ChipConfig(cpu_fallback=["describe", "monte_carlo", "regression"]),
        "symbex": ChipConfig(cpu_fallback=["eval", "verify"]),
    })
    coexistence: CoexistenceConfig = field(default_factory=CoexistenceConfig)

    def is_chip_enabled(self, chip_name: str) -> bool:
        chip = self.chips.get(chip_name)
        return chip.enabled if chip else False

    def is_gpu_op(self, chip_name: str, operation: str) -> bool:
        chip = self.chips.get(chip_name)
        if not chip:
            return False
        return operation in chip.gpu_operations


def _find_config_file() -> Path | None:
    """Search for the config file in known locations."""
    # Check environment override first
    env_path = os.environ.get("MATH_COPROCESSOR_CONFIG")
    if env_path:
        p = Path(env_path)
        if p.exists():
            return p

    # Search relative to this file's location
    base = Path(__file__).parent
    for rel in DEFAULT_CONFIG_PATHS:
        p = (base / rel).resolve()
        if p.exists():
            return p

    # Search from cwd
    for rel in DEFAULT_CONFIG_PATHS:
        p = Path(rel).resolve()
        if p.exists():
            return p

    return None


def _parse_chip(data: dict) -> ChipConfig:
    return ChipConfig(
        enabled=data.get("enabled", True),
        gpu_operations=data.get("gpu_operations", []) or [],
        cpu_fallback=data.get("cpu_fallback", []) or [],
    )


def _parse_coexistence(data: dict) -> CoexistenceConfig:
    return CoexistenceConfig(
        dedicated_stream=data.get("dedicated_stream", True),
        stream_priority=data.get("stream_priority", 1),
        max_concurrent_ops=data.get("max_concurrent_ops", 4),
        sync_after_op=data.get("sync_after_op", True),
    )


def load_config() -> MathCoprocessorConfig:
    """Load configuration from YAML file, falling back to defaults."""
    path = _find_config_file()
    if path is None:
        log.info("No config file found, using defaults")
        return MathCoprocessorConfig()

    try:
        import yaml
    except ImportError:
        log.warning("PyYAML not installed, using defaults")
        return MathCoprocessorConfig()

    try:
        with open(path) as f:
            data = yaml.safe_load(f) or {}

        chips = {}
        for name, chip_data in (data.get("chips") or {}).items():
            chips[name] = _parse_chip(chip_data or {})

        coex_data = data.get("inference_coexistence") or {}

        config = MathCoprocessorConfig(
            name=data.get("name", "math-coprocessor-v1.0"),
            version=data.get("version", "1.0.0"),
            vram_budget_mb=data.get("vram_budget_mb", 750),
            default_precision=data.get("default_precision", "fp64"),
            thermal_limit_c=data.get("thermal_limit_c", 85),
            chips=chips if chips else MathCoprocessorConfig().chips,
            coexistence=_parse_coexistence(coex_data),
        )
        log.info(f"Loaded config from {path} (budget={config.vram_budget_mb}MB)")
        return config
    except Exception as e:
        log.warning(f"Failed to parse {path}: {e}, using defaults")
        return MathCoprocessorConfig()
