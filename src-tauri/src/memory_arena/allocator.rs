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

use std::collections::HashMap;

use crate::memory_arena::error::{ArenaError, ArenaResult};

// ===== trait =========================================================

/// Common interface for arena allocators. Manages raw byte regions —
/// knows nothing about chunks, headers, checksums, or tiers.
pub(crate) trait ChunkAllocator: std::fmt::Debug {
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
pub(crate) struct FixedSlotAllocator {
    slot_size: usize,
    num_slots: usize,
    free_stack: Vec<usize>,
    /// offset → slot_index, for free() lookups.
    allocated: HashMap<usize, usize>,
}

impl FixedSlotAllocator {
    pub(crate) fn new(slot_size: usize, num_slots: usize) -> Self {
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

    /// Direct access to the free stack length — used by Arena for
    /// backward-compatible `free_slot_count()`.
    pub(crate) fn free_slot_count(&self) -> usize {
        self.free_stack.len()
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

// ===== SlabAllocator (placeholder) ===================================

/// Slab allocator — multiple size classes, each a mini fixed-slot arena.
#[derive(Debug)]
pub(crate) struct SlabAllocator {
    _placeholder: (),
}

impl ChunkAllocator for SlabAllocator {
    fn alloc(&mut self, _size: usize) -> ArenaResult<(usize, usize)> { todo!() }
    fn free(&mut self, _offset: usize) -> ArenaResult<()> { todo!() }
    fn capacity(&self) -> usize { todo!() }
    fn free_bytes(&self) -> usize { todo!() }
    fn allocated_bytes(&self) -> usize { todo!() }
    fn num_allocations(&self) -> usize { todo!() }
    fn fragmentation(&self) -> f64 { todo!() }
}

// ===== BuddyAllocator (placeholder) =================================

/// Buddy allocator — power-of-two splitting with coalescence.
#[derive(Debug)]
pub(crate) struct BuddyAllocator {
    _placeholder: (),
}

impl ChunkAllocator for BuddyAllocator {
    fn alloc(&mut self, _size: usize) -> ArenaResult<(usize, usize)> { todo!() }
    fn free(&mut self, _offset: usize) -> ArenaResult<()> { todo!() }
    fn capacity(&self) -> usize { todo!() }
    fn free_bytes(&self) -> usize { todo!() }
    fn allocated_bytes(&self) -> usize { todo!() }
    fn num_allocations(&self) -> usize { todo!() }
    fn fragmentation(&self) -> f64 { todo!() }
}

// ===== TlsfAllocator (placeholder) ===================================

/// TLSF allocator — two-level segregated fit with bitmap O(1) ops.
#[derive(Debug)]
pub(crate) struct TlsfAllocator {
    _placeholder: (),
}

impl ChunkAllocator for TlsfAllocator {
    fn alloc(&mut self, _size: usize) -> ArenaResult<(usize, usize)> { todo!() }
    fn free(&mut self, _offset: usize) -> ArenaResult<()> { todo!() }
    fn capacity(&self) -> usize { todo!() }
    fn free_bytes(&self) -> usize { todo!() }
    fn allocated_bytes(&self) -> usize { todo!() }
    fn num_allocations(&self) -> usize { todo!() }
    fn fragmentation(&self) -> f64 { todo!() }
}

// ===== AllocatorKind =================================================

/// Enum dispatch for zero-cost allocator selection on the hot path.
/// No vtable, no dyn — just a match.
#[derive(Debug)]
pub(crate) enum AllocatorKind {
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
