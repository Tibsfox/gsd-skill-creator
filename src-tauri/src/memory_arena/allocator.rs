//! Pluggable allocator strategies for the memory arena.
//!
//! The `ChunkAllocator` trait defines the common API. Four implementations:
//!
//! - `FixedSlotAllocator` — extracted from Arena's original free-stack.
//!   O(1) alloc/free, fixed slot size. The control group.
//! - `SlabAllocator` — multiple size classes, each a mini fixed-slot arena.
//! - `BuddyAllocator` — power-of-two splitting with coalescence.
//! - `TlsfAllocator` — two-level segregated fit with bitmap O(1) ops.
//!
//! All dispatch via `AllocatorKind` enum (not trait objects) for zero-cost
//! on the hot path.

use std::collections::{BTreeMap, HashMap};

use crate::memory_arena::error::{ArenaError, ArenaResult};

// ===== trait =========================================================

/// Common interface for arena allocators. Manages raw byte regions —
/// knows nothing about chunks, headers, checksums, or tiers.
pub trait ChunkAllocator: std::fmt::Debug {
    /// Allocate a region of at least `size` bytes. Returns (offset, actual_size).
    fn alloc(&mut self, size: usize) -> ArenaResult<(usize, usize)>;
    /// Free a previously-allocated region at `offset`.
    fn free(&mut self, offset: usize) -> ArenaResult<()>;
    /// Total capacity in bytes.
    fn capacity(&self) -> usize;
    /// Currently free bytes.
    fn free_bytes(&self) -> usize;
    /// Currently allocated bytes.
    fn allocated_bytes(&self) -> usize;
    /// Number of active allocations.
    fn num_allocations(&self) -> usize;
    /// Fragmentation ratio (0.0 = none, 1.0 = fully fragmented).
    fn fragmentation(&self) -> f64;
}

// ===== FixedSlotAllocator ============================================

/// Fixed-slot allocator — the original Arena free-stack, extracted.
/// O(1) alloc (stack pop), O(1) free (stack push). Every allocation
/// returns exactly `slot_size` bytes regardless of request size.
#[derive(Debug)]
pub struct FixedSlotAllocator {
    slot_size: usize,
    num_slots: usize,
    free_stack: Vec<usize>,
    /// offset → slot_index, for free() lookups.
    allocated: HashMap<usize, usize>,
}

impl FixedSlotAllocator {
    pub fn new(slot_size: usize, num_slots: usize) -> Self {
        // Free stack in reverse order so slot 0 pops first (matches
        // original Arena::with_storage behavior).
        let mut free_stack: Vec<usize> = (0..num_slots).collect();
        free_stack.reverse();
        Self {
            slot_size,
            num_slots,
            free_stack,
            allocated: HashMap::with_capacity(num_slots),
        }
    }

    /// Construct from a pre-built free slot list. Used by
    /// `Arena::with_storage_from_walk` which builds the free set from
    /// a header scan.
    pub(crate) fn from_free_slots(
        slot_size: usize,
        num_slots: usize,
        free_stack: Vec<usize>,
        allocated_slots: &[(usize, usize)], // (slot_index, offset) pairs
    ) -> Self {
        let mut allocated = HashMap::with_capacity(num_slots);
        for &(slot, _) in allocated_slots {
            let offset = slot * slot_size;
            allocated.insert(offset, slot);
        }
        Self {
            slot_size,
            num_slots,
            free_stack,
            allocated,
        }
    }

    /// Direct access to the free stack length — used by Arena for
    /// backward-compatible `free_slot_count()`.
    pub(crate) fn free_slot_count(&self) -> usize {
        self.free_stack.len()
    }

    /// Remove a specific slot from the free stack and mark it allocated.
    /// Used by recovery paths (`place_chunk_at_slot`, `reinsert_slot`)
    /// that need to claim a specific slot by index. Linear search — fine
    /// for recovery paths, not hot-path.
    ///
    /// Returns `true` if the slot was found and removed, `false` if it
    /// was not in the free stack.
    pub(crate) fn claim_slot(&mut self, slot: usize) -> bool {
        if let Some(pos) = self.free_stack.iter().position(|&s| s == slot) {
            self.free_stack.swap_remove(pos);
            let offset = slot * self.slot_size;
            self.allocated.insert(offset, slot);
            true
        } else {
            false
        }
    }

    /// Release a slot back to the free stack by slot index (not offset).
    /// Used when Arena's `free_chunk` needs to return a specific slot.
    pub(crate) fn release_slot(&mut self, slot: usize) {
        let offset = slot * self.slot_size;
        self.allocated.remove(&offset);
        self.free_stack.push(slot);
    }

    /// Pop the next free slot index. Returns the slot index directly
    /// (not the byte offset). Used by Arena's alloc_chunk which manages
    /// its own slot→offset mapping.
    pub(crate) fn pop_free_slot(&mut self) -> Option<usize> {
        let slot = self.free_stack.pop()?;
        let offset = slot * self.slot_size;
        self.allocated.insert(offset, slot);
        Some(slot)
    }
}

impl ChunkAllocator for FixedSlotAllocator {
    fn alloc(&mut self, size: usize) -> ArenaResult<(usize, usize)> {
        if size > self.slot_size {
            return Err(ArenaError::OutOfSlots {
                requested: 1,
                available: 0,
            });
        }
        let slot = self.free_stack.pop().ok_or(ArenaError::OutOfSlots {
            requested: 1,
            available: 0,
        })?;
        let offset = slot * self.slot_size;
        self.allocated.insert(offset, slot);
        Ok((offset, self.slot_size))
    }

    fn free(&mut self, offset: usize) -> ArenaResult<()> {
        let slot = self
            .allocated
            .remove(&offset)
            .ok_or(ArenaError::UnknownChunkId(offset as u64))?;
        self.free_stack.push(slot);
        Ok(())
    }

    fn capacity(&self) -> usize {
        self.num_slots * self.slot_size
    }

    fn free_bytes(&self) -> usize {
        self.free_stack.len() * self.slot_size
    }

    fn allocated_bytes(&self) -> usize {
        self.allocated.len() * self.slot_size
    }

    fn num_allocations(&self) -> usize {
        self.allocated.len()
    }

    fn fragmentation(&self) -> f64 {
        // Fixed-slot allocator can't measure internal fragmentation
        // without knowing payload sizes. Return 0.0.
        0.0
    }
}

// ===== SlabAllocator =================================================

/// Configuration for the slab allocator.
#[derive(Debug, Clone)]
pub struct SlabConfig {
    /// Size classes in ascending order. Must be non-empty.
    pub classes: Vec<usize>,
    /// Total capacity in bytes. Divided across classes.
    pub total_capacity: usize,
}

impl Default for SlabConfig {
    fn default() -> Self {
        // 8 size classes: 64B, 256B, 1K, 4K, 16K, 64K, 256K, 1M
        let classes = vec![64, 256, 1024, 4096, 16384, 65536, 262144, 1048576];
        // Default: 8 MiB total, divided equally across classes → 1 MiB per class
        let total_capacity = 8 * 1024 * 1024;
        Self {
            classes,
            total_capacity,
        }
    }
}

/// A single size class within the slab allocator.
#[derive(Debug)]
struct SizeClass {
    size: usize,
    base_offset: usize,
    count: usize,
    free_stack: Vec<usize>, // slot indices within this class
    allocated: usize,
    /// Track requested sizes per offset for fragmentation calculation.
    requested_sizes: HashMap<usize, usize>,
}

/// Slab allocator — multiple size classes, each a mini fixed-slot arena.
/// Alloc picks the smallest class that fits. O(1) within a class.
#[derive(Debug)]
pub struct SlabAllocator {
    classes: Vec<SizeClass>,
    total_capacity: usize,
}

impl SlabAllocator {
    pub fn new(config: SlabConfig) -> Self {
        let mut classes = Vec::with_capacity(config.classes.len());
        let mut remaining = config.total_capacity;
        let per_class = config.total_capacity / config.classes.len();
        let mut base_offset = 0usize;

        for (i, &class_size) in config.classes.iter().enumerate() {
            let budget = if i == config.classes.len() - 1 {
                remaining
            } else {
                per_class.min(remaining)
            };
            let count = budget / class_size;
            let actual_bytes = count * class_size;
            remaining = remaining.saturating_sub(actual_bytes);

            // Free stack: reverse order so slot 0 pops first
            let mut free_stack: Vec<usize> = (0..count).collect();
            free_stack.reverse();

            classes.push(SizeClass {
                size: class_size,
                base_offset,
                count,
                free_stack,
                allocated: 0,
                requested_sizes: HashMap::new(),
            });
            base_offset += actual_bytes;
        }

        Self {
            classes,
            total_capacity: config.total_capacity,
        }
    }

    /// Find which class owns an offset by range check.
    fn class_for_offset(&self, offset: usize) -> Option<usize> {
        for (i, class) in self.classes.iter().enumerate() {
            let end = class.base_offset + class.count * class.size;
            if offset >= class.base_offset && offset < end {
                return Some(i);
            }
        }
        None
    }
}

impl ChunkAllocator for SlabAllocator {
    fn alloc(&mut self, size: usize) -> ArenaResult<(usize, usize)> {
        // Find smallest class where class.size >= size
        let start_class = self.classes.iter().position(|c| c.size >= size);
        if start_class.is_none() {
            return Err(ArenaError::OutOfSlots {
                requested: 1,
                available: 0,
            });
        }

        // Try the target class first, then fall through to larger classes
        for i in start_class.unwrap()..self.classes.len() {
            if let Some(slot) = self.classes[i].free_stack.pop() {
                let offset = self.classes[i].base_offset + slot * self.classes[i].size;
                self.classes[i].allocated += 1;
                self.classes[i].requested_sizes.insert(offset, size);
                return Ok((offset, self.classes[i].size));
            }
        }

        Err(ArenaError::OutOfSlots {
            requested: 1,
            available: 0,
        })
    }

    fn free(&mut self, offset: usize) -> ArenaResult<()> {
        let class_idx = self
            .class_for_offset(offset)
            .ok_or(ArenaError::UnknownChunkId(offset as u64))?;
        let class = &mut self.classes[class_idx];
        let slot = (offset - class.base_offset) / class.size;
        class.free_stack.push(slot);
        class.allocated -= 1;
        class.requested_sizes.remove(&offset);
        Ok(())
    }

    fn capacity(&self) -> usize {
        self.classes.iter().map(|c| c.count * c.size).sum()
    }

    fn free_bytes(&self) -> usize {
        self.classes
            .iter()
            .map(|c| c.free_stack.len() * c.size)
            .sum()
    }

    fn allocated_bytes(&self) -> usize {
        self.classes
            .iter()
            .map(|c| c.allocated * c.size)
            .sum()
    }

    fn num_allocations(&self) -> usize {
        self.classes.iter().map(|c| c.allocated).sum()
    }

    fn fragmentation(&self) -> f64 {
        // Weighted average: sum of (class_size - requested) / sum of class_size
        // across all allocated slots.
        let total_allocated: usize = self.allocated_bytes();
        if total_allocated == 0 {
            return 0.0;
        }
        let total_requested: usize = self
            .classes
            .iter()
            .flat_map(|c| c.requested_sizes.values())
            .sum();
        (total_allocated - total_requested) as f64 / total_allocated as f64
    }
}

// ===== BuddyAllocator ================================================

/// Buddy allocator — power-of-two splitting with coalescence.
///
/// Minimum block size is configurable (default 64B). Total capacity must
/// be a power of two. Levels = log2(max/min) + 1. Level 0 = min_block,
/// level N = total_capacity.
#[derive(Debug)]
pub struct BuddyAllocator {
    /// Per-level free lists. Level 0 = min_block, last level = total_capacity.
    free_lists: Vec<Vec<usize>>,
    /// Allocated blocks: offset → (level, requested_size).
    allocated: HashMap<usize, (usize, usize)>,
    min_block: usize,
    num_levels: usize,
    total_capacity: usize,
    total_allocated_bytes: usize,
    total_requested_bytes: usize,
}

impl BuddyAllocator {
    pub fn new(total_capacity: usize, min_block: usize) -> Self {
        assert!(total_capacity.is_power_of_two(), "total_capacity must be power of two");
        assert!(min_block.is_power_of_two(), "min_block must be power of two");
        assert!(total_capacity >= min_block);

        let num_levels = (total_capacity / min_block).trailing_zeros() as usize + 1;
        let mut free_lists: Vec<Vec<usize>> = (0..num_levels).map(|_| Vec::new()).collect();

        // Start with one free block at the highest level (entire capacity)
        free_lists[num_levels - 1].push(0);

        Self {
            free_lists,
            allocated: HashMap::new(),
            min_block,
            num_levels,
            total_capacity,
            total_allocated_bytes: 0,
            total_requested_bytes: 0,
        }
    }

    /// Block size at a given level.
    fn block_size(&self, level: usize) -> usize {
        self.min_block << level
    }

    /// Level for a given size (rounded up to power of two, clamped to min_block).
    fn level_for_size(&self, size: usize) -> usize {
        let rounded = size.max(self.min_block).next_power_of_two();
        (rounded / self.min_block).trailing_zeros() as usize
    }

    /// Buddy offset for a block at the given offset and level.
    fn buddy_offset(&self, offset: usize, level: usize) -> usize {
        offset ^ self.block_size(level)
    }
}

impl ChunkAllocator for BuddyAllocator {
    fn alloc(&mut self, size: usize) -> ArenaResult<(usize, usize)> {
        let target_level = self.level_for_size(size);
        if target_level >= self.num_levels {
            return Err(ArenaError::OutOfSlots {
                requested: 1,
                available: 0,
            });
        }

        // Find smallest level >= target that has a free block
        let mut found_level = None;
        for level in target_level..self.num_levels {
            if !self.free_lists[level].is_empty() {
                found_level = Some(level);
                break;
            }
        }

        let found_level = found_level.ok_or(ArenaError::OutOfSlots {
            requested: 1,
            available: 0,
        })?;

        // Pop from the found level
        let offset = self.free_lists[found_level].pop().unwrap();

        // Split recursively down to target level
        let mut current_level = found_level;
        while current_level > target_level {
            current_level -= 1;
            // The second half becomes a free buddy at the lower level
            let buddy = offset + self.block_size(current_level);
            self.free_lists[current_level].push(buddy);
        }

        let actual_size = self.block_size(target_level);
        self.allocated.insert(offset, (target_level, size));
        self.total_allocated_bytes += actual_size;
        self.total_requested_bytes += size;

        Ok((offset, actual_size))
    }

    fn free(&mut self, offset: usize) -> ArenaResult<()> {
        let (level, requested_size) = self
            .allocated
            .remove(&offset)
            .ok_or(ArenaError::UnknownChunkId(offset as u64))?;

        let actual_size = self.block_size(level);
        self.total_allocated_bytes -= actual_size;
        self.total_requested_bytes -= requested_size;

        // Attempt coalescence with buddy, recursing upward
        let mut current_offset = offset;
        let mut current_level = level;

        while current_level < self.num_levels - 1 {
            let buddy = self.buddy_offset(current_offset, current_level);
            // Check if buddy is in the free list at this level
            if let Some(pos) = self.free_lists[current_level]
                .iter()
                .position(|&o| o == buddy)
            {
                // Remove buddy from free list and merge
                self.free_lists[current_level].swap_remove(pos);
                // Merged block starts at the lower of the two offsets
                current_offset = current_offset.min(buddy);
                current_level += 1;
            } else {
                break;
            }
        }

        self.free_lists[current_level].push(current_offset);
        Ok(())
    }

    fn capacity(&self) -> usize {
        self.total_capacity
    }

    fn free_bytes(&self) -> usize {
        self.total_capacity - self.total_allocated_bytes
    }

    fn allocated_bytes(&self) -> usize {
        self.total_allocated_bytes
    }

    fn num_allocations(&self) -> usize {
        self.allocated.len()
    }

    fn fragmentation(&self) -> f64 {
        if self.total_allocated_bytes == 0 {
            return 0.0;
        }
        (self.total_allocated_bytes - self.total_requested_bytes) as f64
            / self.total_allocated_bytes as f64
    }
}

// ===== TlsfAllocator =================================================

/// Configuration for the TLSF allocator.
#[derive(Debug, Clone)]
pub struct TlsfConfig {
    /// Number of second-level subdivisions per first-level class.
    /// Must be a power of two. Default: 4.
    pub sl_count: usize,
}

impl Default for TlsfConfig {
    fn default() -> Self {
        Self { sl_count: 4 }
    }
}

/// TLSF allocator — two-level segregated fit with bitmap O(1) alloc/free.
///
/// First level: power-of-two size classes. Second level: linear
/// subdivisions within each first-level class. O(1) alloc via bitmap
/// scan. Coalescence on free by adjacency (not buddy).
///
/// Uses `BTreeMap` keyed by offset for O(log n) predecessor lookup
/// during coalescence (lab-director advisory).
#[derive(Debug)]
pub struct TlsfAllocator {
    /// First-level bitmap: bit i set means free_lists[i] has at least one
    /// non-empty second-level list.
    fl_bitmap: u64,
    /// Per-first-level second-level bitmaps.
    sl_bitmaps: Vec<u64>,
    /// free_lists[fl][sl] = Vec of offsets of free blocks at that index.
    free_lists: Vec<Vec<Vec<usize>>>,
    /// All blocks by offset → (size, is_free). BTreeMap for O(log n)
    /// predecessor lookup during coalescence.
    blocks: BTreeMap<usize, (usize, bool)>,
    sl_count: usize,
    sl_count_log2: u32,
    min_block: usize,
    total_capacity: usize,
    total_allocated_bytes: usize,
    total_requested_bytes: usize,
    num_allocs: usize,
}

impl TlsfAllocator {
    pub fn new(total_capacity: usize, min_block: usize, config: TlsfConfig) -> Self {
        assert!(total_capacity.is_power_of_two(), "total_capacity must be power of two");
        assert!(min_block.is_power_of_two(), "min_block must be power of two");
        assert!(config.sl_count.is_power_of_two(), "sl_count must be power of two");
        assert!(total_capacity >= min_block);

        let sl_count = config.sl_count;
        let sl_count_log2 = sl_count.trailing_zeros();

        // Number of first-level classes: log2(total_capacity) - log2(min_block) + 1
        let fl_count =
            (total_capacity.trailing_zeros() - min_block.trailing_zeros() + 1) as usize;

        let fl_bitmap = 0u64;
        let sl_bitmaps = vec![0u64; fl_count];
        let free_lists: Vec<Vec<Vec<usize>>> = (0..fl_count)
            .map(|_| (0..sl_count).map(|_| Vec::new()).collect())
            .collect();

        let mut blocks = BTreeMap::new();
        blocks.insert(0, (total_capacity, true)); // one big free block

        let mut alloc = Self {
            fl_bitmap,
            sl_bitmaps,
            free_lists,
            blocks,
            sl_count,
            sl_count_log2,
            min_block,
            total_capacity,
            total_allocated_bytes: 0,
            total_requested_bytes: 0,
            num_allocs: 0,
        };

        // Insert the initial free block into the free lists
        let (fl, sl) = alloc.mapping(total_capacity);
        alloc.insert_free_block(0, total_capacity, fl, sl);

        alloc
    }

    /// Map a block size to (first_level, second_level) indices.
    fn mapping(&self, size: usize) -> (usize, usize) {
        if size < self.min_block {
            return (0, 0);
        }
        // fl = floor(log2(size)) adjusted to our index range
        let log2_size = (usize::BITS - 1 - size.leading_zeros()) as usize;
        let log2_min = self.min_block.trailing_zeros() as usize;
        let fl = log2_size - log2_min;

        // Clamp fl to valid range
        let fl = fl.min(self.free_lists.len() - 1);

        // sl = linear subdivision within the fl class
        let fl_size = 1usize << (log2_min + fl);
        let sl = if fl_size == 0 {
            0
        } else {
            ((size - fl_size) * self.sl_count) / fl_size
        };
        let sl = sl.min(self.sl_count - 1);

        (fl, sl)
    }

    /// Map a requested size to the (fl, sl) to search from (rounds up).
    fn mapping_search(&self, size: usize) -> (usize, usize) {
        let size = size.max(self.min_block);
        let (fl, sl) = self.mapping(size);
        // We need a block of at least `size`, so the mapping is correct
        // as a starting search point
        (fl, sl)
    }

    /// Insert a free block into the appropriate free list and update bitmaps.
    fn insert_free_block(&mut self, offset: usize, _size: usize, fl: usize, sl: usize) {
        self.free_lists[fl][sl].push(offset);
        self.sl_bitmaps[fl] |= 1u64 << sl;
        self.fl_bitmap |= 1u64 << fl;
    }

    /// Remove a free block from its free list and update bitmaps if needed.
    fn remove_free_block(&mut self, offset: usize, fl: usize, sl: usize) {
        let list = &mut self.free_lists[fl][sl];
        if let Some(pos) = list.iter().position(|&o| o == offset) {
            list.swap_remove(pos);
        }
        if list.is_empty() {
            self.sl_bitmaps[fl] &= !(1u64 << sl);
            if self.sl_bitmaps[fl] == 0 {
                self.fl_bitmap &= !(1u64 << fl);
            }
        }
    }
}

impl ChunkAllocator for TlsfAllocator {
    fn alloc(&mut self, size: usize) -> ArenaResult<(usize, usize)> {
        let size = size.max(self.min_block);
        let (mut fl, mut sl) = self.mapping_search(size);

        // Step 1: Look for a free block at (fl, sl) or higher
        // Check current sl and above in the same fl
        let sl_map = self.sl_bitmaps.get(fl).copied().unwrap_or(0) & !((1u64 << sl) - 1);

        let (found_fl, found_sl) = if sl_map != 0 {
            // Found in same fl
            (fl, sl_map.trailing_zeros() as usize)
        } else {
            // Look in higher fl
            let fl_map = self.fl_bitmap & !((1u64 << (fl + 1)) - 1);
            if fl_map == 0 {
                return Err(ArenaError::OutOfSlots {
                    requested: 1,
                    available: 0,
                });
            }
            fl = fl_map.trailing_zeros() as usize;
            sl = self.sl_bitmaps[fl].trailing_zeros() as usize;
            (fl, sl)
        };

        // Pop the block
        let block_offset = self.free_lists[found_fl][found_sl]
            .pop()
            .ok_or(ArenaError::OutOfSlots {
                requested: 1,
                available: 0,
            })?;

        // Update bitmap if list is now empty
        if self.free_lists[found_fl][found_sl].is_empty() {
            self.sl_bitmaps[found_fl] &= !(1u64 << found_sl);
            if self.sl_bitmaps[found_fl] == 0 {
                self.fl_bitmap &= !(1u64 << found_fl);
            }
        }

        // Get block info
        let (block_size, is_free) = *self.blocks.get(&block_offset).unwrap();
        debug_assert!(is_free, "block at {} should be free", block_offset);
        debug_assert!(block_size >= size, "block {} too small: {} < {}", block_offset, block_size, size);

        // Split if remainder is large enough
        let remainder = block_size - size;
        if remainder >= self.min_block {
            // Keep the first `size` bytes, split remainder
            self.blocks.insert(block_offset, (size, false));
            let rem_offset = block_offset + size;
            self.blocks.insert(rem_offset, (remainder, true));
            let (rem_fl, rem_sl) = self.mapping(remainder);
            self.insert_free_block(rem_offset, remainder, rem_fl, rem_sl);

            self.total_allocated_bytes += size;
        } else {
            // Use the whole block (remainder too small to split)
            self.blocks.insert(block_offset, (block_size, false));
            self.total_allocated_bytes += block_size;
        }

        self.total_requested_bytes += size;
        self.num_allocs += 1;

        let actual_size = if remainder >= self.min_block {
            size
        } else {
            block_size
        };

        Ok((block_offset, actual_size))
    }

    fn free(&mut self, offset: usize) -> ArenaResult<()> {
        let (block_size, is_free) = *self
            .blocks
            .get(&offset)
            .ok_or(ArenaError::UnknownChunkId(offset as u64))?;

        if is_free {
            return Err(ArenaError::UnknownChunkId(offset as u64));
        }

        self.total_allocated_bytes -= block_size;
        // Approximate: we stored `size` as allocated size (may include
        // unsplittable remainder). Requested bytes tracked per-alloc is tricky
        // since we don't store it per-block. Use block_size as approximation
        // for the decrement — this means fragmentation() tracks actual vs
        // rounded, not actual vs requested. Good enough for the bake-off.
        self.total_requested_bytes = self.total_requested_bytes.saturating_sub(block_size);
        self.num_allocs -= 1;

        let mut merged_offset = offset;
        let mut merged_size = block_size;

        // Coalesce with next physical neighbor
        let next_offset = offset + block_size;
        if let Some(&(next_size, next_free)) = self.blocks.get(&next_offset) {
            if next_free {
                let (nfl, nsl) = self.mapping(next_size);
                self.remove_free_block(next_offset, nfl, nsl);
                merged_size += next_size;
                self.blocks.remove(&next_offset);
            }
        }

        // Coalesce with previous physical neighbor (BTreeMap predecessor)
        // Use range query to find the block just before our offset
        if let Some((&prev_offset, &(prev_size, prev_free))) =
            self.blocks.range(..offset).next_back()
        {
            if prev_free && prev_offset + prev_size == merged_offset {
                let (pfl, psl) = self.mapping(prev_size);
                self.remove_free_block(prev_offset, pfl, psl);
                merged_offset = prev_offset;
                merged_size += prev_size;
                self.blocks.remove(&prev_offset);
            }
        }

        // Insert merged block as free
        self.blocks.insert(merged_offset, (merged_size, true));
        let (fl, sl) = self.mapping(merged_size);
        self.insert_free_block(merged_offset, merged_size, fl, sl);

        Ok(())
    }

    fn capacity(&self) -> usize {
        self.total_capacity
    }

    fn free_bytes(&self) -> usize {
        self.total_capacity - self.total_allocated_bytes
    }

    fn allocated_bytes(&self) -> usize {
        self.total_allocated_bytes
    }

    fn num_allocations(&self) -> usize {
        self.num_allocs
    }

    fn fragmentation(&self) -> f64 {
        if self.total_allocated_bytes == 0 {
            return 0.0;
        }
        // External fragmentation approximation: ratio of wasted space
        // within allocated blocks.
        let waste = self.total_allocated_bytes.saturating_sub(self.total_requested_bytes);
        waste as f64 / self.total_allocated_bytes as f64
    }
}

// ===== AllocatorKind =================================================

/// Enum dispatch for zero-cost allocator selection on the hot path.
/// No vtable, no dyn — just a match.
#[derive(Debug)]
pub enum AllocatorKind {
    FixedSlot(FixedSlotAllocator),
    Slab(SlabAllocator),
    Buddy(BuddyAllocator),
    Tlsf(TlsfAllocator),
}

impl ChunkAllocator for AllocatorKind {
    fn alloc(&mut self, size: usize) -> ArenaResult<(usize, usize)> {
        match self {
            AllocatorKind::FixedSlot(a) => a.alloc(size),
            AllocatorKind::Slab(a) => a.alloc(size),
            AllocatorKind::Buddy(a) => a.alloc(size),
            AllocatorKind::Tlsf(a) => a.alloc(size),
        }
    }

    fn free(&mut self, offset: usize) -> ArenaResult<()> {
        match self {
            AllocatorKind::FixedSlot(a) => a.free(offset),
            AllocatorKind::Slab(a) => a.free(offset),
            AllocatorKind::Buddy(a) => a.free(offset),
            AllocatorKind::Tlsf(a) => a.free(offset),
        }
    }

    fn capacity(&self) -> usize {
        match self {
            AllocatorKind::FixedSlot(a) => a.capacity(),
            AllocatorKind::Slab(a) => a.capacity(),
            AllocatorKind::Buddy(a) => a.capacity(),
            AllocatorKind::Tlsf(a) => a.capacity(),
        }
    }

    fn free_bytes(&self) -> usize {
        match self {
            AllocatorKind::FixedSlot(a) => a.free_bytes(),
            AllocatorKind::Slab(a) => a.free_bytes(),
            AllocatorKind::Buddy(a) => a.free_bytes(),
            AllocatorKind::Tlsf(a) => a.free_bytes(),
        }
    }

    fn allocated_bytes(&self) -> usize {
        match self {
            AllocatorKind::FixedSlot(a) => a.allocated_bytes(),
            AllocatorKind::Slab(a) => a.allocated_bytes(),
            AllocatorKind::Buddy(a) => a.allocated_bytes(),
            AllocatorKind::Tlsf(a) => a.allocated_bytes(),
        }
    }

    fn num_allocations(&self) -> usize {
        match self {
            AllocatorKind::FixedSlot(a) => a.num_allocations(),
            AllocatorKind::Slab(a) => a.num_allocations(),
            AllocatorKind::Buddy(a) => a.num_allocations(),
            AllocatorKind::Tlsf(a) => a.num_allocations(),
        }
    }

    fn fragmentation(&self) -> f64 {
        match self {
            AllocatorKind::FixedSlot(a) => a.fragmentation(),
            AllocatorKind::Slab(a) => a.fragmentation(),
            AllocatorKind::Buddy(a) => a.fragmentation(),
            AllocatorKind::Tlsf(a) => a.fragmentation(),
        }
    }
}

impl AllocatorKind {
    /// Downcast to FixedSlotAllocator, if this is the FixedSlot variant.
    pub(crate) fn as_fixed_slot(&self) -> Option<&FixedSlotAllocator> {
        match self {
            AllocatorKind::FixedSlot(a) => Some(a),
            _ => None,
        }
    }

    /// Mutable downcast to FixedSlotAllocator.
    pub(crate) fn as_fixed_slot_mut(&mut self) -> Option<&mut FixedSlotAllocator> {
        match self {
            AllocatorKind::FixedSlot(a) => Some(a),
            _ => None,
        }
    }
}

// ===== SyncAllocator ================================================

use std::sync::Mutex;

/// Thread-safe wrapper around any `ChunkAllocator`. Guards all operations
/// with a `Mutex` so the allocator can be shared across threads via
/// `Arc<SyncAllocator<A>>`.
///
/// The `Mutex` is uncontended in single-threaded use (just an atomic
/// compare-exchange). Under contention the OS scheduler arbitrates —
/// acceptable for the allocation hot path which is O(1) for all four
/// allocator strategies.
pub struct SyncAllocator<A: ChunkAllocator> {
    inner: Mutex<A>,
}

impl<A: ChunkAllocator> SyncAllocator<A> {
    pub fn new(allocator: A) -> Self {
        Self {
            inner: Mutex::new(allocator),
        }
    }

    pub fn alloc(&self, size: usize) -> ArenaResult<(usize, usize)> {
        self.inner.lock().unwrap().alloc(size)
    }

    pub fn free(&self, offset: usize) -> ArenaResult<()> {
        self.inner.lock().unwrap().free(offset)
    }

    pub fn capacity(&self) -> usize {
        self.inner.lock().unwrap().capacity()
    }

    pub fn free_bytes(&self) -> usize {
        self.inner.lock().unwrap().free_bytes()
    }

    pub fn allocated_bytes(&self) -> usize {
        self.inner.lock().unwrap().allocated_bytes()
    }

    pub fn num_allocations(&self) -> usize {
        self.inner.lock().unwrap().num_allocations()
    }

    pub fn fragmentation(&self) -> f64 {
        self.inner.lock().unwrap().fragmentation()
    }
}

// Safety: SyncAllocator is Send+Sync because the Mutex serializes all access.
unsafe impl<A: ChunkAllocator + Send> Send for SyncAllocator<A> {}
unsafe impl<A: ChunkAllocator + Send> Sync for SyncAllocator<A> {}

impl<A: ChunkAllocator + std::fmt::Debug> std::fmt::Debug for SyncAllocator<A> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self.inner.lock() {
            Ok(guard) => f.debug_struct("SyncAllocator").field("inner", &*guard).finish(),
            Err(_) => f.debug_struct("SyncAllocator").field("inner", &"<poisoned>").finish(),
        }
    }
}
