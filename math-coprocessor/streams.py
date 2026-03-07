"""CUDA Stream Isolation for Inference Coexistence.

The Math Co-Processor must coexist with GPU-based inference (LoRA adapters,
llama.cpp, Ollama). This module provides dedicated CUDA streams for math
operations so they don't block or interfere with inference workloads.

The 68881 Protocol analogy: just as the 68881 had its own register file and
execution pipeline separate from the 68000, math operations execute on their
own CUDA stream while inference continues on the default stream.

Stream priority: inference runs at default priority (0), math operations run
at configurable lower priority (default 1 = lower than inference).
"""

import ctypes
import logging
import threading
from dataclasses import dataclass, field

from . import gpu
from .config import CoexistenceConfig

log = logging.getLogger("math-coprocessor.streams")

# CUDA stream types
cudaStream_t = ctypes.c_void_p


@dataclass
class StreamManager:
    """Manages dedicated CUDA streams for math co-processor operations.

    Creates an isolated stream on first use, tracks concurrent operations,
    and enforces the max_concurrent_ops limit by queuing excess requests.
    """

    config: CoexistenceConfig = field(default_factory=CoexistenceConfig)
    _stream: cudaStream_t | None = None
    _active_ops: int = 0
    _lock: threading.Lock = field(default_factory=threading.Lock)
    _initialized: bool = False

    def initialize(self) -> bool:
        """Create the dedicated CUDA stream. Returns True if GPU stream created."""
        if self._initialized:
            return self._stream is not None

        self._initialized = True

        if not self.config.dedicated_stream:
            log.info("Dedicated stream disabled, using default stream")
            return False

        if not gpu.cuda_available() or gpu._cudart is None:
            log.info("No CUDA runtime, stream isolation not available")
            return False

        try:
            stream = cudaStream_t()
            # cudaStreamCreateWithPriority(stream, flags, priority)
            # flags=1 = cudaStreamNonBlocking
            err = gpu._cudart.cudaStreamCreateWithPriority(
                ctypes.byref(stream),
                ctypes.c_uint(1),  # cudaStreamNonBlocking
                ctypes.c_int(self.config.stream_priority),
            )
            if err == 0:
                self._stream = stream
                log.info(
                    f"Created dedicated math stream (priority={self.config.stream_priority})"
                )
                return True
            else:
                # Fall back to basic stream creation without priority
                err = gpu._cudart.cudaStreamCreate(ctypes.byref(stream))
                if err == 0:
                    self._stream = stream
                    log.info("Created dedicated math stream (default priority)")
                    return True
                log.warning(f"Failed to create CUDA stream (error={err})")
                return False
        except Exception as e:
            log.warning(f"Stream creation failed: {e}")
            return False

    @property
    def stream(self) -> cudaStream_t | None:
        """The raw CUDA stream handle, or None for default stream."""
        if not self._initialized:
            self.initialize()
        return self._stream

    @property
    def has_dedicated_stream(self) -> bool:
        if not self._initialized:
            self.initialize()
        return self._stream is not None

    def acquire(self) -> bool:
        """Acquire a slot for a math operation. Returns False if at capacity."""
        with self._lock:
            if self._active_ops >= self.config.max_concurrent_ops:
                return False
            self._active_ops += 1
            return True

    def release(self):
        """Release a math operation slot."""
        with self._lock:
            self._active_ops = max(0, self._active_ops - 1)

    def synchronize(self):
        """Synchronize the math stream (wait for all math ops to complete)."""
        if self._stream is not None and gpu._cudart is not None:
            gpu._cudart.cudaStreamSynchronize(self._stream)

    def destroy(self):
        """Destroy the dedicated stream."""
        if self._stream is not None and gpu._cudart is not None:
            gpu._cudart.cudaStreamDestroy(self._stream)
            self._stream = None
            log.info("Destroyed dedicated math stream")
        self._initialized = False

    @property
    def status(self) -> dict:
        """Stream status report."""
        return {
            "dedicated_stream": self.has_dedicated_stream,
            "stream_priority": self.config.stream_priority,
            "active_ops": self._active_ops,
            "max_concurrent_ops": self.config.max_concurrent_ops,
            "sync_after_op": self.config.sync_after_op,
        }
