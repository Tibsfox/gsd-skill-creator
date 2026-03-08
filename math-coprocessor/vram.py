"""VRAM Manager — workspace allocator with budget limits.

The Math Co-Processor workspace is transient — allocated when an F-line
instruction arrives, freed when the result is returned. This mirrors the
68881 pattern: the coprocessor has its own registers, not permanent memory.

Budget is configurable via silicon.yaml math_coprocessor section.
"""

import logging
import threading
from dataclasses import dataclass, field

from . import gpu

log = logging.getLogger("math-coprocessor.vram")

DEFAULT_BUDGET_MB = 750  # From PRD VRAM budget table


@dataclass
class VRAMAllocation:
    ptr: object  # ctypes.c_void_p or None for CPU
    size_bytes: int
    label: str
    backend: str  # "gpu" or "cpu"


@dataclass
class VRAMManager:
    """Manages Math Co-Processor VRAM workspace within declared budget."""

    budget_mb: int = DEFAULT_BUDGET_MB
    _allocated: int = 0
    _allocations: dict[int, VRAMAllocation] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)
    _next_id: int = 0
    _gpu_available: bool = False
    _warn_on_fallback: bool = True

    def __post_init__(self):
        self._gpu_available = gpu.cuda_available()
        if self._gpu_available:
            info = gpu.get_gpu_info()
            log.info(
                f"GPU: {info.name}, {info.free_memory_mb}MB free, "
                f"budget: {self.budget_mb}MB"
            )
        else:
            log.warning("No GPU available — all operations will use CPU fallback")

    def allocate(self, size_bytes: int, label: str = "") -> VRAMAllocation | None:
        """Allocate workspace. Returns None if budget exceeded (no OOM)."""
        with self._lock:
            budget_bytes = self.budget_mb * 1024 * 1024
            if self._allocated + size_bytes > budget_bytes:
                log.warning(
                    f"VRAM budget exceeded: {self._allocated + size_bytes} > "
                    f"{budget_bytes} for '{label}'"
                )
                return None

            if self._gpu_available:
                ptr = gpu.cuda_malloc(size_bytes)
                if ptr is not None:
                    alloc = VRAMAllocation(ptr, size_bytes, label, "gpu")
                    self._allocated += size_bytes
                    self._next_id += 1
                    self._allocations[self._next_id] = alloc
                    return alloc
                elif self._warn_on_fallback:
                    log.warning(f"GPU malloc failed for '{label}', using CPU")

            # CPU fallback — track in budget but use host memory
            import numpy as np

            buf = np.empty(size_bytes, dtype=np.uint8)
            alloc = VRAMAllocation(buf, size_bytes, label, "cpu")
            self._allocated += size_bytes
            self._next_id += 1
            self._allocations[self._next_id] = alloc
            return alloc

    def free(self, alloc: VRAMAllocation):
        """Free a workspace allocation. No-ops silently if already freed."""
        with self._lock:
            # Find the allocation in tracking first — guards against double-free
            key_to_delete = None
            for k, v in self._allocations.items():
                if v is alloc:
                    key_to_delete = k
                    break
            if key_to_delete is None:
                log.warning(
                    f"free() called on untracked allocation '{alloc.label}' -- ignoring"
                )
                return
            # Safe to free now
            if alloc.backend == "gpu" and alloc.ptr is not None:
                gpu.cuda_free(alloc.ptr)
            self._allocated -= alloc.size_bytes
            del self._allocations[key_to_delete]

    def free_all(self):
        """Free all allocations."""
        with self._lock:
            for alloc in list(self._allocations.values()):
                if alloc.backend == "gpu" and alloc.ptr is not None:
                    gpu.cuda_free(alloc.ptr)
            self._allocations.clear()
            self._allocated = 0

    @property
    def utilization(self) -> dict:
        """Current VRAM utilization report."""
        budget_bytes = self.budget_mb * 1024 * 1024
        gpu_info = gpu.get_gpu_info() if self._gpu_available else None
        return {
            "budget_mb": self.budget_mb,
            "allocated_mb": round(self._allocated / (1024 * 1024), 2),
            "utilization_pct": round(
                (self._allocated / budget_bytes * 100) if budget_bytes else 0, 1
            ),
            "active_allocations": len(self._allocations),
            "backend": "gpu" if self._gpu_available else "cpu",
            "gpu_name": gpu_info.name if gpu_info else "N/A",
            "gpu_free_mb": gpu_info.free_memory_mb if gpu_info else 0,
            "gpu_total_mb": gpu_info.total_memory_mb if gpu_info else 0,
        }
