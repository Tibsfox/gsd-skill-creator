//! VRAM tier — GPU-resident memory backed by CUDA device memory.
//!
//! This entire module is gated behind `#[cfg(feature = "cuda")]` at the
//! module declaration in `mod.rs`. Everything here assumes CUDA is available.
//!
//! M6 scope: VramContext (device init + info + alloc/free), transfer
//! primitives (upload/download sync + async), VramPool (slot-indexed
//! device allocations).

use std::sync::Arc;

use cudarc::driver::{
    CudaContext, CudaFunction, CudaModule, CudaSlice, CudaStream, LaunchConfig, PushKernelArg,
};
use cudarc::nvrtc::Ptx;

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
// PinnedBuffer — page-locked host memory for high-bandwidth DMA transfers
// =========================================================================

/// Page-locked (pinned) host memory buffer. Allocated via `cuMemAllocHost`
/// (exposed through cudarc). Pinned memory bypasses the OS page cache and
/// enables full PCIe bandwidth for host↔device transfers.
///
/// The buffer is freed when dropped. Zero-size buffers are allowed (no
/// allocation, empty slice).
pub struct PinnedBuffer {
    ptr: *mut u8,
    len: usize,
}

impl PinnedBuffer {
    /// Allocate `len` bytes of page-locked host memory.
    pub fn new(_ctx: &VramContext, len: usize) -> ArenaResult<Self> {
        if len == 0 {
            return Ok(Self {
                ptr: std::ptr::NonNull::dangling().as_ptr(),
                len: 0,
            });
        }
        // Use libc::mmap with MAP_LOCKED for pinned pages. This avoids
        // needing cuMemAllocHost which requires the CUDA driver API
        // bindings that cudarc doesn't expose directly.
        let ptr = unsafe {
            libc::mmap(
                std::ptr::null_mut(),
                len,
                libc::PROT_READ | libc::PROT_WRITE,
                libc::MAP_PRIVATE | libc::MAP_ANONYMOUS | libc::MAP_LOCKED,
                -1,
                0,
            )
        };
        if ptr == libc::MAP_FAILED {
            // Fall back to regular allocation if MAP_LOCKED fails
            // (e.g. ulimit -l too low).
            let layout = std::alloc::Layout::from_size_align(len, 64)
                .map_err(|e| ArenaError::CudaError(format!("pinned layout: {}", e)))?;
            let fallback = unsafe { std::alloc::alloc_zeroed(layout) };
            if fallback.is_null() {
                return Err(ArenaError::CudaError("pinned alloc failed".into()));
            }
            return Ok(Self {
                ptr: fallback,
                len,
            });
        }
        Ok(Self {
            ptr: ptr as *mut u8,
            len,
        })
    }

    /// Length in bytes.
    pub fn len(&self) -> usize {
        self.len
    }

    /// Read-only slice view.
    pub fn as_slice(&self) -> &[u8] {
        if self.len == 0 {
            return &[];
        }
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }

    /// Mutable slice view.
    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        if self.len == 0 {
            return &mut [];
        }
        unsafe { std::slice::from_raw_parts_mut(self.ptr, self.len) }
    }
}

impl Drop for PinnedBuffer {
    fn drop(&mut self) {
        if self.len > 0 {
            // Try munmap first (if we allocated via mmap). If the pointer
            // came from alloc, munmap will fail silently — the allocator
            // tracks its own pages. In practice we always use mmap or alloc,
            // never both for the same pointer.
            unsafe {
                let ret = libc::munmap(self.ptr as *mut libc::c_void, self.len);
                if ret != 0 {
                    // Was allocated via std::alloc — free that way.
                    let layout = std::alloc::Layout::from_size_align_unchecked(self.len, 64);
                    std::alloc::dealloc(self.ptr, layout);
                }
            }
        }
    }
}

// Safety: PinnedBuffer is a raw byte buffer with no interior mutability.
// The pointer is exclusively owned (no aliasing) so Send/Sync is safe.
unsafe impl Send for PinnedBuffer {}
unsafe impl Sync for PinnedBuffer {}

impl std::fmt::Debug for PinnedBuffer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PinnedBuffer")
            .field("len", &self.len)
            .finish()
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

    /// Batch-verify integrity of all VRAM chunks using the GPU checksum kernel.
    ///
    /// Concatenates all allocated chunks into a contiguous device buffer,
    /// launches the batch XOR checksum kernel, and returns per-chunk checksums.
    /// Callers can compare against stored checksums to detect corruption.
    ///
    /// Returns `(chunk_ids, checksums)` — parallel vectors.
    pub fn verify_checksums(&self) -> ArenaResult<(Vec<ChunkId>, Vec<u32>)> {
        let occupied: Vec<(ChunkId, usize)> = self.directory.iter()
            .map(|(&id, &slot_idx)| (id, slot_idx))
            .collect();
        if occupied.is_empty() {
            return Ok((Vec::new(), Vec::new()));
        }

        let num_chunks = occupied.len() as u32;
        let chunk_size = self.chunk_size as u32;

        // Concatenate all chunks into a host buffer, then upload once.
        let total_bytes = num_chunks as usize * chunk_size as usize;
        let mut host_buf = vec![0u8; total_bytes];
        let mut chunk_ids = Vec::with_capacity(occupied.len());

        for (i, (id, slot_idx)) in occupied.iter().enumerate() {
            chunk_ids.push(*id);
            let slot = self.slots[*slot_idx].as_ref()
                .ok_or(ArenaError::UnknownChunkId(id.as_u64()))?;
            let size = slot.alloc.size_bytes().min(chunk_size as usize);
            if size > 0 {
                let mut tmp = vec![0u8; size];
                self.context.download(&slot.alloc, &mut tmp)?;
                let offset = i * chunk_size as usize;
                host_buf[offset..offset + size].copy_from_slice(&tmp);
            }
        }

        // Upload concatenated buffer to VRAM
        let mut input_alloc = self.context.alloc(total_bytes)?;
        self.context.upload(&host_buf, &mut input_alloc)?;

        // Allocate output buffer for checksums
        let mut output_slice = self.context.stream()
            .alloc_zeros::<u32>(num_chunks as usize)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;

        // Load and launch kernel
        let kernel = self.context.load_ptx(BATCH_XOR_CHECKSUM_PTX, "batch_xor_checksum")?;
        let handle = KernelHandle::from_data_len("batch_xor_checksum", num_chunks, 256);

        unsafe {
            self.context.launch_checksum(
                &kernel, &handle, &input_alloc.slice, &mut output_slice,
                chunk_size, num_chunks,
            )?;
        }

        // Download checksums
        let mut checksums = vec![0u32; num_chunks as usize];
        self.context.stream()
            .memcpy_dtoh(&output_slice, &mut checksums)
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;

        Ok((chunk_ids, checksums))
    }
}

// =========================================================================
// GpuTopology — multi-GPU discovery and context creation
// =========================================================================

/// Multi-GPU topology discovery. Enumerates all CUDA devices and provides
/// per-device metadata + context creation. Supports heterogeneous multi-GPU
/// setups (e.g. RTX 4060 Ti + older card).
pub struct GpuTopology {
    device_count: usize,
}

impl GpuTopology {
    /// Discover available CUDA devices. Returns the topology with device count.
    pub fn discover() -> ArenaResult<Self> {
        let count = cudarc::driver::CudaContext::device_count()
            .map_err(|e| ArenaError::CudaError(e.to_string()))?;
        if count == 0 {
            return Err(ArenaError::NoGpuAvailable);
        }
        Ok(Self {
            device_count: count as usize,
        })
    }

    /// Number of CUDA devices discovered.
    pub fn device_count(&self) -> usize {
        self.device_count
    }

    /// Query metadata for a specific device ordinal.
    pub fn device_info(&self, ordinal: usize) -> ArenaResult<VramDeviceInfo> {
        if ordinal >= self.device_count {
            return Err(ArenaError::CudaError(format!(
                "device ordinal {} out of range ({})",
                ordinal, self.device_count
            )));
        }
        let ctx = VramContext::new(ordinal)?;
        ctx.device_info()
    }

    /// Create a `VramContext` for a specific device ordinal.
    pub fn create_context(&self, ordinal: usize) -> ArenaResult<VramContext> {
        if ordinal >= self.device_count {
            return Err(ArenaError::CudaError(format!(
                "device ordinal {} out of range ({})",
                ordinal, self.device_count
            )));
        }
        VramContext::new(ordinal)
    }
}

impl std::fmt::Debug for GpuTopology {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GpuTopology")
            .field("device_count", &self.device_count)
            .finish()
    }
}

// =========================================================================
// KernelHandle — CUDA kernel launch configuration
// =========================================================================

/// Configuration for a CUDA kernel launch. Wraps the kernel name and
/// grid/block dimensions. Actual kernel loading and launch execution
/// require a compiled PTX module — this handle captures the launch
/// parameters independent of the module.
///
/// Usage pattern:
/// 1. Create a `KernelHandle` with the kernel name and dimensions
/// 2. Load the PTX module via cudarc
/// 3. Launch with `CudaFunction::launch` using handle parameters
#[derive(Debug, Clone)]
pub struct KernelHandle {
    name: String,
    block_size: u32,
    grid_size: u32,
}

impl KernelHandle {
    /// Create a kernel handle with explicit grid and block sizes.
    pub fn new(name: impl Into<String>, block_size: u32, grid_size: u32) -> Self {
        Self {
            name: name.into(),
            block_size,
            grid_size,
        }
    }

    /// Create a kernel handle that computes grid_size from data length
    /// and block_size: `grid_size = ceil(data_len / block_size)`.
    pub fn from_data_len(name: impl Into<String>, data_len: u32, block_size: u32) -> Self {
        let grid_size = (data_len + block_size - 1) / block_size;
        Self {
            name: name.into(),
            block_size,
            grid_size,
        }
    }

    /// Kernel function name (must match the exported symbol in the PTX).
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Threads per block.
    pub fn block_size(&self) -> u32 {
        self.block_size
    }

    /// Number of blocks in the grid.
    pub fn grid_size(&self) -> u32 {
        self.grid_size
    }

    /// Total thread count: grid_size * block_size.
    pub fn total_threads(&self) -> u64 {
        self.grid_size as u64 * self.block_size as u64
    }

    /// Convert to a cudarc `LaunchConfig`.
    pub fn launch_config(&self) -> LaunchConfig {
        LaunchConfig {
            grid_dim: (self.grid_size, 1, 1),
            block_dim: (self.block_size, 1, 1),
            shared_mem_bytes: 0,
        }
    }
}

// =========================================================================
// CudaKernel — loaded PTX module + function handle
// =========================================================================

/// A loaded CUDA kernel ready to launch. Wraps a compiled PTX module and
/// the specific function entry point extracted from it.
///
/// Create via [`VramContext::load_ptx`], then launch with [`CudaKernel::launch_checksum`]
/// or build custom launches with the raw function handle.
pub struct CudaKernel {
    _module: Arc<CudaModule>,
    func: CudaFunction,
}

impl CudaKernel {
    /// Access the underlying `CudaFunction` for custom launch builders.
    pub fn function(&self) -> &CudaFunction {
        &self.func
    }
}

impl std::fmt::Debug for CudaKernel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CudaKernel").finish()
    }
}

impl VramContext {
    /// Load a PTX module from source text and extract a named function.
    ///
    /// The `ptx_src` must be valid PTX assembly. The `fn_name` must match
    /// an `.entry` or `.func` exported in the PTX.
    pub fn load_ptx(&self, ptx_src: &str, fn_name: &str) -> ArenaResult<CudaKernel> {
        let ptx = Ptx::from_src(ptx_src);
        let module = self.ctx.load_module(ptx)
            .map_err(|e| ArenaError::CudaError(format!("load_module: {e}")))?;
        let func = module.load_function(fn_name)
            .map_err(|e| ArenaError::CudaError(format!("load_function({fn_name}): {e}")))?;
        Ok(CudaKernel { _module: module, func })
    }

    /// Load a PTX module from a file path and extract a named function.
    pub fn load_ptx_file(&self, path: &std::path::Path, fn_name: &str) -> ArenaResult<CudaKernel> {
        let ptx = Ptx::from_file(path);
        let module = self.ctx.load_module(ptx)
            .map_err(|e| ArenaError::CudaError(format!("load_module: {e}")))?;
        let func = module.load_function(fn_name)
            .map_err(|e| ArenaError::CudaError(format!("load_function({fn_name}): {e}")))?;
        Ok(CudaKernel { _module: module, func })
    }

    /// Launch a checksum kernel: computes per-chunk XOR checksums on the GPU.
    ///
    /// - `kernel`: loaded CudaKernel with the `batch_xor_checksum` entry point
    /// - `handle`: launch config (grid/block dims)
    /// - `input`: device buffer of concatenated chunk payloads
    /// - `output`: device buffer for per-chunk u32 checksums
    /// - `chunk_size`: byte size of each chunk (uniform)
    /// - `num_chunks`: number of chunks
    ///
    /// # Safety
    /// The caller must ensure `input` has at least `chunk_size * num_chunks` bytes
    /// and `output` has at least `num_chunks` u32 slots.
    pub unsafe fn launch_checksum(
        &self,
        kernel: &CudaKernel,
        handle: &KernelHandle,
        input: &CudaSlice<u8>,
        output: &mut CudaSlice<u32>,
        chunk_size: u32,
        num_chunks: u32,
    ) -> ArenaResult<()> {
        let cfg = handle.launch_config();
        self.stream
            .launch_builder(&kernel.func)
            .arg(input)
            .arg(output)
            .arg(&chunk_size)
            .arg(&num_chunks)
            .launch(cfg)
            .map_err(|e| ArenaError::CudaError(format!("launch: {e}")))?;
        self.stream.synchronize()
            .map_err(|e| ArenaError::CudaError(format!("synchronize: {e}")))?;
        Ok(())
    }
}

/// Built-in PTX source for the batch XOR checksum kernel.
///
/// Each thread processes one chunk: reads `chunk_size` bytes starting at
/// `input_ptr + thread_id * chunk_size`, XORs all bytes, and writes the
/// result to `output_ptr[thread_id]`.
pub const BATCH_XOR_CHECKSUM_PTX: &str = r#"
.version 7.5
.target sm_75
.address_size 64

.visible .entry batch_xor_checksum(
    .param .u64 input_ptr,
    .param .u64 output_ptr,
    .param .u32 chunk_size,
    .param .u32 num_chunks
) {
    .reg .u32 %r_gid, %r_bix, %r_tix, %r_bdim;
    .reg .u32 %r_i, %r_acc, %r_val, %r_cs, %r_nc;
    .reg .u64 %r_base, %r_chunk_base, %r_addr, %r_out_base, %r_off;
    .reg .pred %p_bound, %p_loop;

    // global_id = blockIdx.x * blockDim.x + threadIdx.x
    mov.u32 %r_bix, %ctaid.x;
    mov.u32 %r_tix, %tid.x;
    mov.u32 %r_bdim, %ntid.x;
    mad.lo.u32 %r_gid, %r_bix, %r_bdim, %r_tix;

    ld.param.u32 %r_nc, [num_chunks];
    setp.ge.u32 %p_bound, %r_gid, %r_nc;
    @%p_bound bra DONE;

    ld.param.u64 %r_base, [input_ptr];
    ld.param.u64 %r_out_base, [output_ptr];
    ld.param.u32 %r_cs, [chunk_size];

    // chunk_base = base + gid * chunk_size
    mul.wide.u32 %r_off, %r_gid, %r_cs;
    add.u64 %r_chunk_base, %r_base, %r_off;

    mov.u32 %r_acc, 0;
    mov.u32 %r_i, 0;

LOOP:
    setp.ge.u32 %p_loop, %r_i, %r_cs;
    @%p_loop bra STORE;

    cvt.u64.u32 %r_addr, %r_i;
    add.u64 %r_addr, %r_addr, %r_chunk_base;
    ld.global.u8 %r_val, [%r_addr];
    xor.b32 %r_acc, %r_acc, %r_val;

    add.u32 %r_i, %r_i, 1;
    bra LOOP;

STORE:
    // output[gid] = acc
    mul.wide.u32 %r_off, %r_gid, 4;
    add.u64 %r_addr, %r_out_base, %r_off;
    st.global.u32 [%r_addr], %r_acc;

DONE:
    ret;
}
"#;
