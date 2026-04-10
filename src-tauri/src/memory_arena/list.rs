//! Index-based intrusive doubly-linked list + LRU index.
//!
//! RED stub for memory-arena-m1 Plan 02. The GREEN commit in Task 2 replaces
//! every `todo!()` body with a real implementation.
//!
//! Hard rules from MISSION.md:
//! - No `unsafe` anywhere in this file
//! - No raw pointers; only `Option<NodeIdx>` where `NodeIdx` wraps `usize`
//! - Slot reuse via a free stack so long-running lists don't leak capacity

use std::collections::HashMap;

use crate::memory_arena::types::ChunkId;

/// Index into a `List<T>`'s internal node arena. O(1) lookup.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct NodeIdx(pub usize);

/// An index-based doubly-linked list. No raw pointers, no `unsafe`. The
/// `nodes` vector is append-only; freed slots are tracked via `free` and
/// reused on the next push so long-running lists do not leak capacity.
///
/// Hot paths (`push_front`, `push_back`, `pop_front`, `pop_back`, `unlink`,
/// `move_to_front`) are O(1). `iter_front_to_back` is O(len).
#[derive(Debug, Clone)]
pub struct List<T> {
    _head: Option<NodeIdx>,
    _tail: Option<NodeIdx>,
    _nodes: Vec<Option<Node<T>>>,
    _free: Vec<NodeIdx>,
    _len: usize,
}

#[derive(Debug, Clone)]
struct Node<T> {
    _value: T,
    _prev: Option<NodeIdx>,
    _next: Option<NodeIdx>,
}

impl<T> List<T> {
    pub fn new() -> Self {
        todo!("RED: List::new — implemented in Plan 02 Task 2")
    }

    pub fn len(&self) -> usize {
        todo!("RED: List::len — implemented in Plan 02 Task 2")
    }

    pub fn is_empty(&self) -> bool {
        todo!("RED: List::is_empty — implemented in Plan 02 Task 2")
    }

    pub fn head(&self) -> Option<NodeIdx> {
        todo!("RED: List::head — implemented in Plan 02 Task 2")
    }

    pub fn tail(&self) -> Option<NodeIdx> {
        todo!("RED: List::tail — implemented in Plan 02 Task 2")
    }

    pub fn get(&self, _idx: NodeIdx) -> Option<&T> {
        todo!("RED: List::get — implemented in Plan 02 Task 2")
    }

    pub fn push_front(&mut self, _value: T) -> NodeIdx {
        todo!("RED: List::push_front — implemented in Plan 02 Task 2")
    }

    pub fn push_back(&mut self, _value: T) -> NodeIdx {
        todo!("RED: List::push_back — implemented in Plan 02 Task 2")
    }

    pub fn pop_front(&mut self) -> Option<T> {
        todo!("RED: List::pop_front — implemented in Plan 02 Task 2")
    }

    pub fn pop_back(&mut self) -> Option<T> {
        todo!("RED: List::pop_back — implemented in Plan 02 Task 2")
    }

    pub fn unlink(&mut self, _idx: NodeIdx) -> Option<T> {
        todo!("RED: List::unlink — implemented in Plan 02 Task 2")
    }

    pub fn move_to_front(&mut self, _idx: NodeIdx) {
        todo!("RED: List::move_to_front — implemented in Plan 02 Task 2")
    }

    pub fn iter_front_to_back(&self) -> ListIter<'_, T> {
        todo!("RED: List::iter_front_to_back — implemented in Plan 02 Task 2")
    }
}

impl<T> Default for List<T> {
    fn default() -> Self {
        Self::new()
    }
}

/// Iterator from head to tail over the list's values.
pub struct ListIter<'a, T> {
    _list: &'a List<T>,
    _next: Option<NodeIdx>,
}

impl<'a, T> Iterator for ListIter<'a, T> {
    type Item = (NodeIdx, &'a T);
    fn next(&mut self) -> Option<Self::Item> {
        todo!("RED: ListIter::next — implemented in Plan 02 Task 2")
    }
}

/// LRU ordering over a set of `ChunkId`s. Insertion and touch run in O(1)
/// via a `HashMap<ChunkId, NodeIdx>` + `List<ChunkId>`. Evictions pick the
/// tail (oldest). Double-insert of the same id is treated as `touch`.
#[derive(Debug, Clone)]
pub struct LruIndex {
    _list: List<ChunkId>,
    _index: HashMap<ChunkId, NodeIdx>,
}

impl LruIndex {
    pub fn new() -> Self {
        todo!("RED: LruIndex::new — implemented in Plan 02 Task 2")
    }

    pub fn len(&self) -> usize {
        todo!("RED: LruIndex::len — implemented in Plan 02 Task 2")
    }

    pub fn is_empty(&self) -> bool {
        todo!("RED: LruIndex::is_empty — implemented in Plan 02 Task 2")
    }

    pub fn insert(&mut self, _id: ChunkId) {
        todo!("RED: LruIndex::insert — implemented in Plan 02 Task 2")
    }

    pub fn touch(&mut self, _id: ChunkId) -> bool {
        todo!("RED: LruIndex::touch — implemented in Plan 02 Task 2")
    }

    pub fn remove(&mut self, _id: ChunkId) -> bool {
        todo!("RED: LruIndex::remove — implemented in Plan 02 Task 2")
    }

    pub fn oldest(&self) -> Option<ChunkId> {
        todo!("RED: LruIndex::oldest — implemented in Plan 02 Task 2")
    }

    pub fn contains(&self, _id: ChunkId) -> bool {
        todo!("RED: LruIndex::contains — implemented in Plan 02 Task 2")
    }
}

impl Default for LruIndex {
    fn default() -> Self {
        Self::new()
    }
}
