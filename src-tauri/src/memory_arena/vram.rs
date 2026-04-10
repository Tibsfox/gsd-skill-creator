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

    // =====================================================================
    // Synchronous transfers
    // =====================================================================

    /// Copy host bytes to device memory (host→device). Synchronizes on the
    /// default stream after the copy completes.
    pub fn upload(&self, host_data: &[u8], alloc: &mut VramAllocation) -> ArenaResult<()> {
        if alloc.size == 0 && host_data.is_empty() {
            return Ok(());
        }
        if host_data.len() != alloc.size {
            return Err(ArenaError::BufferTooSmall {
                need: alloc.size,
                got: host_data.len(),
            });
        }
        self.stream.memcpy_htod(host_data, &mut alloc.slice)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        self.stream.synchronize()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(())
    }

    /// Copy device bytes to host buffer (device→host). Synchronizes on the
    /// default stream after the copy completes.
    pub fn download(&self, alloc: &VramAllocation, host_buf: &mut [u8]) -> ArenaResult<()> {
        if alloc.size == 0 && host_buf.is_empty() {
            return Ok(());
        }
        if host_buf.len() != alloc.size {
            return Err(ArenaError::BufferTooSmall {
                need: alloc.size,
                got: host_buf.len(),
            });
        }
        self.stream.memcpy_dtoh(&alloc.slice, host_buf)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        self.stream.synchronize()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(())
    }

    // =====================================================================
    // Async transfers
    // =====================================================================

    /// Async host→device copy on a dedicated stream. Returns a handle
    /// that the caller can `wait()` on.
    pub fn upload_async(
        &self,
        host_data: &[u8],
        alloc: &mut VramAllocation,
    ) -> ArenaResult<VramTransferHandle> {
        if alloc.size == 0 && host_data.is_empty() {
            return Ok(VramTransferHandle {
                stream: self.stream.clone(),
                download_buf: None,
            });
        }
        if host_data.len() != alloc.size {
            return Err(ArenaError::BufferTooSmall {
                need: alloc.size,
                got: host_data.len(),
            });
        }
        let async_stream = self.ctx.new_stream()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        async_stream.memcpy_htod(host_data, &mut alloc.slice)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(VramTransferHandle {
            stream: async_stream,
            download_buf: None,
        })
    }

    /// Async device→host copy on a dedicated stream. Returns a handle
    /// whose `wait_into()` returns the downloaded bytes.
    pub fn download_async(
        &self,
        alloc: &VramAllocation,
        size: usize,
    ) -> ArenaResult<VramTransferHandle> {
        if size == 0 {
            return Ok(VramTransferHandle {
                stream: self.stream.clone(),
                download_buf: Some(Vec::new()),
            });
        }
        if size != alloc.size {
            return Err(ArenaError::BufferTooSmall {
                need: alloc.size,
                got: size,
            });
        }
        let async_stream = self.ctx.new_stream()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        let mut buf = vec![0u8; size];
        async_stream.memcpy_dtoh(&alloc.slice, &mut buf)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(VramTransferHandle {
            stream: async_stream,
            download_buf: Some(buf),
        })
    }
}

// =========================================================================
// VramTransferHandle
// =========================================================================

/// Handle for an in-flight async VRAM transfer. Owns the CUDA stream
/// so it stays alive until the caller synchronizes.
pub struct VramTransferHandle {
    stream: Arc<CudaStream>,
    /// For download_async: the host buffer that will contain the data
    /// after synchronization. None for upload-only handles.
    download_buf: Option<Vec<u8>>,
}

impl VramTransferHandle {
    /// Wait for an upload transfer to complete.
    pub fn wait(self) -> ArenaResult<()> {
        self.stream.synchronize()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(())
    }

    /// Wait for a download transfer to complete and return the bytes.
    pub fn wait_into(self) -> ArenaResult<Vec<u8>> {
        self.stream.synchronize()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        Ok(self.download_buf.unwrap_or_default())
    }
}

impl std::fmt::Debug for VramContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VramContext").finish()
    }
}

// =========================================================================
// VramPool
// =========================================================================

use std::collections::HashMap;
use crate::memory_arena::types::{ChunkId, TierKind, TierPolicy};

/// A VRAM slot holding an active device allocation and its chunk id.
struct VramSlot {
    alloc: VramAllocation,
    id: ChunkId,
}

/// Device-side pool managing a fixed number of VRAM allocations. Each slot
/// holds one chunk uploaded to the GPU. NOT a `TierPool` — VramPool has its
/// own simpler contract (no mmap, no checksum headers, no LRU index).
pub struct VramPool {
    context: Arc<VramContext>,
    tier: TierKind,
    chunk_size: u64,
    policy: TierPolicy,
    slots: Vec<Option<VramSlot>>,
    directory: HashMap<ChunkId, usize>,
    next_id: u64,
}

impl VramPool {
    /// Create a new VramPool with `num_slots` capacity.
    pub fn new(
        context: Arc<VramContext>,
        tier: TierKind,
        chunk_size: u64,
        num_slots: usize,
        policy: TierPolicy,
    ) -> ArenaResult<Self> {
        let mut slots = Vec::with_capacity(num_slots);
        for _ in 0..num_slots {
            slots.push(None);
        }
        Ok(Self {
            context,
            tier,
            chunk_size,
            policy,
            slots,
            directory: HashMap::new(),
            next_id: 1,
        })
    }

    /// Tier kind accessor.
    pub fn tier(&self) -> TierKind {
        self.tier
    }

    /// Policy accessor.
    pub fn policy(&self) -> &TierPolicy {
        &self.policy
    }

    /// Number of currently allocated chunks.
    pub fn len(&self) -> usize {
        self.directory.len()
    }

    /// True if no chunks are allocated.
    pub fn is_empty(&self) -> bool {
        self.directory.is_empty()
    }

    /// Check if a chunk id is present.
    pub fn contains(&self, id: ChunkId) -> bool {
        self.directory.contains_key(&id)
    }

    /// Find a free slot index, or None if all slots are occupied.
    fn find_free_slot(&self) -> Option<usize> {
        self.slots.iter().position(|s| s.is_none())
    }

    /// Allocate a chunk: find a free slot, allocate VRAM, upload payload.
    pub fn alloc(&mut self, payload: &[u8]) -> ArenaResult<ChunkId> {
        let slot_idx = self.find_free_slot().ok_or(ArenaError::PoolFull {
            tier: self.tier,
            max_chunks: self.slots.len() as u32,
        })?;

        let size = payload.len();
        let mut vram_alloc = self.context.alloc(size)?;
        if !payload.is_empty() {
            self.context.upload(payload, &mut vram_alloc)?;
        }

        let id = ChunkId::new(self.next_id);
        self.next_id += 1;

        self.slots[slot_idx] = Some(VramSlot {
            alloc: vram_alloc,
            id,
        });
        self.directory.insert(id, slot_idx);

        Ok(id)
    }

    /// Download chunk data from VRAM.
    pub fn get(&self, id: ChunkId) -> ArenaResult<Vec<u8>> {
        let &slot_idx = self.directory.get(&id).ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let slot = self.slots[slot_idx]
            .as_ref()
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        let size = slot.alloc.size_bytes();
        if size == 0 {
            return Ok(Vec::new());
        }
        let mut buf = vec![0u8; size];
        self.context.download(&slot.alloc, &mut buf)?;
        Ok(buf)
    }

    /// Free a VRAM slot. The device allocation is dropped immediately.
    pub fn free(&mut self, id: ChunkId) -> ArenaResult<()> {
        let slot_idx = self.directory.remove(&id)
            .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
        self.slots[slot_idx] = None;
        Ok(())
    }
}
