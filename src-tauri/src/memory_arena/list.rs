//! Index-based intrusive doubly-linked list + LRU index.
//!
//! This is the pure-data-structure foundation for the LRU ordering that
//! `Arena::touch_chunk` wires into its hot path (Plan 03). It lands Deliverable
//! D2 of memory-arena-m1.
//!
//! # Hard rules from MISSION.md
//!
//! - **No `unsafe`.** Every pointer-like operation is an `Option<NodeIdx>`
//!   where `NodeIdx` wraps `usize`.
//! - **No raw pointers.** Nodes live in an append-only `Vec<Option<Node<T>>>`
//!   and freed slots are tracked via a `free: Vec<NodeIdx>` stack so long-
//!   running lists don't leak capacity.
//!
//! # Design
//!
//! `List<T>` is a doubly-linked list with O(1) `push_front`, `push_back`,
//! `pop_front`, `pop_back`, `unlink`, and `move_to_front`. The `unlink` path
//! frees the slot (moves it to the `free` stack); `move_to_front` does an
//! *in-place* detach+relink that does NOT touch the free stack — the hot path
//! for LRU ordering must not allocate.
//!
//! Double-insert into `LruIndex` of the same `ChunkId` is treated as `touch`
//! (move-to-front without creating a duplicate node). This matches the
//! "index is a set with an order" invariant callers expect.

use std::collections::HashMap;

use crate::memory_arena::types::ChunkId;

/// Index into a `List<T>`'s internal node arena. O(1) lookup.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct NodeIdx(pub usize);

#[derive(Debug, Clone)]
struct Node<T> {
    value: T,
    prev: Option<NodeIdx>,
    next: Option<NodeIdx>,
}

/// Index-based doubly-linked list. See module doc for design notes.
#[derive(Debug, Clone)]
pub struct List<T> {
    head: Option<NodeIdx>,
    tail: Option<NodeIdx>,
    nodes: Vec<Option<Node<T>>>,
    free: Vec<NodeIdx>,
    len: usize,
}

impl<T> List<T> {
    /// Construct an empty list.
    pub fn new() -> Self {
        Self {
            head: None,
            tail: None,
            nodes: Vec::new(),
            free: Vec::new(),
            len: 0,
        }
    }

    /// Number of live nodes.
    pub fn len(&self) -> usize {
        self.len
    }

    /// True if the list has zero live nodes.
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    /// Current head (front) index, or `None` if empty.
    pub fn head(&self) -> Option<NodeIdx> {
        self.head
    }

    /// Current tail (back) index, or `None` if empty.
    pub fn tail(&self) -> Option<NodeIdx> {
        self.tail
    }

    /// Borrow the value at the given index. Returns `None` if the slot is
    /// free or the index is out of bounds.
    pub fn get(&self, idx: NodeIdx) -> Option<&T> {
        self.nodes
            .get(idx.0)
            .and_then(|slot| slot.as_ref())
            .map(|node| &node.value)
    }

    /// Allocate a fresh slot (reusing from `free` if possible). Caller must
    /// fill in the node's prev/next before returning.
    fn alloc_slot(&mut self, value: T, prev: Option<NodeIdx>, next: Option<NodeIdx>) -> NodeIdx {
        let node = Node { value, prev, next };
        if let Some(idx) = self.free.pop() {
            self.nodes[idx.0] = Some(node);
            idx
        } else {
            let idx = NodeIdx(self.nodes.len());
            self.nodes.push(Some(node));
            idx
        }
    }

    /// Push a value to the front (head). Returns the index of the new node.
    pub fn push_front(&mut self, value: T) -> NodeIdx {
        let old_head = self.head;
        let new = self.alloc_slot(value, None, old_head);
        if let Some(old) = old_head {
            self.nodes[old.0].as_mut().unwrap().prev = Some(new);
        } else {
            // List was empty; new node is also the tail.
            self.tail = Some(new);
        }
        self.head = Some(new);
        self.len += 1;
        new
    }

    /// Push a value to the back (tail). Returns the index of the new node.
    pub fn push_back(&mut self, value: T) -> NodeIdx {
        let old_tail = self.tail;
        let new = self.alloc_slot(value, old_tail, None);
        if let Some(old) = old_tail {
            self.nodes[old.0].as_mut().unwrap().next = Some(new);
        } else {
            self.head = Some(new);
        }
        self.tail = Some(new);
        self.len += 1;
        new
    }

    /// Pop the front (head) value. Returns `None` if the list is empty.
    pub fn pop_front(&mut self) -> Option<T> {
        let head = self.head?;
        self.unlink(head)
    }

    /// Pop the back (tail) value. Returns `None` if the list is empty.
    pub fn pop_back(&mut self) -> Option<T> {
        let tail = self.tail?;
        self.unlink(tail)
    }

    /// Detach the node at `idx` and free its slot. Returns the owned value,
    /// or `None` if the slot is already free or out of bounds.
    pub fn unlink(&mut self, idx: NodeIdx) -> Option<T> {
        let node = self.nodes.get_mut(idx.0)?.take()?;
        // Fix neighbor pointers.
        match node.prev {
            Some(p) => self.nodes[p.0].as_mut().unwrap().next = node.next,
            None => self.head = node.next,
        }
        match node.next {
            Some(n) => self.nodes[n.0].as_mut().unwrap().prev = node.prev,
            None => self.tail = node.prev,
        }
        self.free.push(idx);
        self.len -= 1;
        Some(node.value)
    }

    /// Move the node at `idx` to the front. O(1). Does NOT touch the free
    /// stack — the slot stays live throughout. No-op if `idx` is already
    /// head, or if the slot is free / out of bounds.
    pub fn move_to_front(&mut self, idx: NodeIdx) {
        // Bail if already head.
        if self.head == Some(idx) {
            return;
        }
        // Read the node's current neighbors.
        let (prev, next) = match self.nodes.get(idx.0).and_then(|s| s.as_ref()) {
            Some(node) => (node.prev, node.next),
            None => return, // free slot or OOB
        };
        // Detach from current position.
        match prev {
            Some(p) => self.nodes[p.0].as_mut().unwrap().next = next,
            None => self.head = next,
        }
        match next {
            Some(n) => self.nodes[n.0].as_mut().unwrap().prev = prev,
            None => self.tail = prev,
        }
        // Relink at head.
        let old_head = self.head;
        {
            let node = self.nodes[idx.0].as_mut().unwrap();
            node.prev = None;
            node.next = old_head;
        }
        if let Some(old) = old_head {
            self.nodes[old.0].as_mut().unwrap().prev = Some(idx);
        } else {
            // List had only one other node which we just detached — tail is now idx.
            self.tail = Some(idx);
        }
        self.head = Some(idx);
    }

    /// Iterate over (NodeIdx, &T) pairs from head to tail.
    pub fn iter_front_to_back(&self) -> ListIter<'_, T> {
        ListIter {
            list: self,
            next: self.head,
        }
    }
}

impl<T> Default for List<T> {
    fn default() -> Self {
        Self::new()
    }
}

/// Iterator from head to tail over the list's (NodeIdx, &T) pairs.
pub struct ListIter<'a, T> {
    list: &'a List<T>,
    next: Option<NodeIdx>,
}

impl<'a, T> Iterator for ListIter<'a, T> {
    type Item = (NodeIdx, &'a T);
    fn next(&mut self) -> Option<Self::Item> {
        let idx = self.next?;
        let node = self.list.nodes[idx.0].as_ref()?;
        self.next = node.next;
        Some((idx, &node.value))
    }
}

/// LRU ordering over a set of `ChunkId`s. Insertion and touch run in O(1)
/// via a `HashMap<ChunkId, NodeIdx>` + `List<ChunkId>`. Evictions pick the
/// tail (oldest). Double-insert of the same id is treated as `touch`.
#[derive(Debug, Clone)]
pub struct LruIndex {
    list: List<ChunkId>,
    index: HashMap<ChunkId, NodeIdx>,
}

impl LruIndex {
    pub fn new() -> Self {
        Self {
            list: List::new(),
            index: HashMap::new(),
        }
    }

    pub fn len(&self) -> usize {
        self.list.len()
    }

    pub fn is_empty(&self) -> bool {
        self.list.is_empty()
    }

    /// Insert or re-touch an id. If the id is already present, this behaves
    /// exactly like `touch` — moves it to the front without duplicating the
    /// node.
    pub fn insert(&mut self, id: ChunkId) {
        if let Some(&existing) = self.index.get(&id) {
            self.list.move_to_front(existing);
            return;
        }
        let idx = self.list.push_front(id);
        self.index.insert(id, idx);
    }

    /// Move `id` to the front. Returns `false` if the id is not present.
    pub fn touch(&mut self, id: ChunkId) -> bool {
        match self.index.get(&id) {
            Some(&idx) => {
                self.list.move_to_front(idx);
                true
            }
            None => false,
        }
    }

    /// Remove `id`. Returns `false` if the id is not present.
    pub fn remove(&mut self, id: ChunkId) -> bool {
        match self.index.remove(&id) {
            Some(idx) => {
                self.list.unlink(idx);
                true
            }
            None => false,
        }
    }

    /// Oldest id (tail), or `None` if empty.
    pub fn oldest(&self) -> Option<ChunkId> {
        self.list.tail().and_then(|idx| self.list.get(idx).copied())
    }

    /// Does the index currently hold this id?
    pub fn contains(&self, id: ChunkId) -> bool {
        self.index.contains_key(&id)
    }
}

impl Default for LruIndex {
    fn default() -> Self {
        Self::new()
    }
}
