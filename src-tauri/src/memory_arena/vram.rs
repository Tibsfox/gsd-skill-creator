//! VRAM tier — GPU-resident memory backed by CUDA device memory.
//!
//! This entire module is gated behind `#[cfg(feature = "cuda")]` at the
//! module declaration in `mod.rs`. Everything here assumes CUDA is available.
//!
//! M6 scope: VramContext (device init + info + alloc/free), transfer
//! primitives (upload/download sync + async), VramPool (slot-indexed
//! device allocations).

use std::sync::Arc;

use cudarc::driver::{CudaContext, CudaSlice, CudaStream};

use crate::memory_arena::error::{ArenaError, ArenaResult};

// =========================================================================
// VramDeviceInfo
// =========================================================================

/// Device metadata returned by `VramContext::device_info()`.
#[derive(Debug, Clone)]
pub struct VramDeviceInfo {
    pub name: String,
    pub total_bytes: usize,
    pub free_bytes: usize,
    pub compute_major: u32,
    pub compute_minor: u32,
}

// =========================================================================
// VramAllocation
// =========================================================================

/// A single device-memory allocation. Wraps a `CudaSlice<u8>` with its
/// size tracked explicitly for ergonomic access.
pub struct VramAllocation {
    pub(crate) slice: CudaSlice<u8>,
    size: usize,
}

impl VramAllocation {
    /// Size of this allocation in bytes.
    pub fn size_bytes(&self) -> usize {
        self.size
    }
}

impl std::fmt::Debug for VramAllocation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VramAllocation")
            .field("size", &self.size)
            .finish()
    }
}

// =========================================================================
// VramContext
// =========================================================================

/// CUDA device context. Initialized once per arena lifetime. Wraps an
/// `Arc<CudaContext>` + default `Arc<CudaStream>` for synchronous ops.
pub struct VramContext {
    ctx: Arc<CudaContext>,
    stream: Arc<CudaStream>,
}

impl VramContext {
    /// Initialize a CUDA context on the given device ordinal.
    pub fn new(device_ordinal: usize) -> ArenaResult<Self> {
        let ctx = CudaContext::new(device_ordinal)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        let stream = ctx.default_stream();
        Ok(Self { ctx, stream })
    }

    /// Query device metadata.
    pub fn device_info(&self) -> ArenaResult<VramDeviceInfo> {
        let name = self.ctx.name()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;

        let (free, total) = self.ctx.mem_get_info()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;

        let (major, minor) = self.ctx.compute_capability()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;

        Ok(VramDeviceInfo {
            name,
            total_bytes: total,
            free_bytes: free,
            compute_major: major as u32,
            compute_minor: minor as u32,
        })
    }

    /// Access the inner CUDA context handle.
    pub fn context(&self) -> &Arc<CudaContext> {
        &self.ctx
    }

    /// Access the default stream.
    pub fn stream(&self) -> &Arc<CudaStream> {
        &self.stream
    }

    /// Allocate `size_bytes` of device memory, zero-initialized.
    pub fn alloc(&self, size_bytes: usize) -> ArenaResult<VramAllocation> {
        if size_bytes == 0 {
            // cudarc doesn't support zero-size allocs; allocate 1 byte
            // but track size=0 for the caller.
            let slice: CudaSlice<u8> = self.stream.alloc_zeros(1)
                .map_err(|e| ArenaError::CudaError(e.to_string()))?;
            return Ok(VramAllocation { slice, size: 0 });
        }
        let slice: CudaSlice<u8> = self.stream.alloc_zeros(size_bytes)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(VramAllocation { slice, size: size_bytes })
    }
}

impl std::fmt::Debug for VramContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VramContext").finish()
    }
}
