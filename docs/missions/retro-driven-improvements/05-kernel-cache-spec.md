# SYMBEX Kernel Cache LRU Eviction — Component Specification

**Date:** 2026-03-09
**Milestone:** Retro-Driven Improvements
**Model Assignment:** Sonnet
**Dependencies:** None
**Target Files:** `math-coprocessor/jit.py`, `math-coprocessor/tests/test_jit.py`, `data/chipset/math-coprocessor.yaml`

---

## Problem

The SYMBEX JIT kernel cache is an unbounded Python dict that grows without limit. Each cached kernel holds a loaded CUDA module (`ctypes.c_void_p`) consuming VRAM. In long-running sessions with many unique expressions, the cache can exhaust the 750 MB VRAM budget. The only recourse is `clear_cache()` which discards everything. This was flagged in v1.49.23: "kernel cache grows unbounded; needs LRU eviction for long-running sessions."

## Current State

**File:** `math-coprocessor/jit.py`

```python
# Line 44: Cache structure
_kernel_cache: dict[tuple[str, str, str], CompiledKernel] = {}

# Line 175-178: Cache lookup
cache_key = (expression, param_name, precision)
if cache_key in _kernel_cache:
    return _kernel_cache[cache_key]

# Line 214: Cache insertion (no size check)
_kernel_cache[cache_key] = kernel

# Line 327-332: Clear all
def clear_cache():
    for kernel in _kernel_cache.values():
        gpu.cu_module_unload(kernel.module)
    _kernel_cache.clear()

# Line 335-343: Stats
def cache_stats():
    return {"cached_kernels": len(_kernel_cache), "entries": [...]}
```

**No eviction. No size limit. No access tracking. No VRAM awareness.**

## Solution

Replace the plain dict with an LRU cache that:
1. Tracks access order (most recent access moves entry to head)
2. Enforces a configurable maximum size
3. Evicts least-recently-used kernels when full
4. Properly unloads GPU modules on eviction
5. Reports eviction metrics in cache stats

### Implementation

Use Python's `collections.OrderedDict` as the foundation (available in stdlib, no new deps):

```python
from collections import OrderedDict
import time

# Configuration
_KERNEL_CACHE_MAX = 64  # Default, overridable via config

# Cache with LRU ordering
_kernel_cache: OrderedDict[tuple[str, str, str], CompiledKernel] = OrderedDict()
_cache_hits: int = 0
_cache_misses: int = 0
_cache_evictions: int = 0

def _cache_get(key: tuple[str, str, str]) -> CompiledKernel | None:
    """Get from cache, moving to most-recent position."""
    global _cache_hits, _cache_misses
    if key in _kernel_cache:
        _kernel_cache.move_to_end(key)  # Mark as recently used
        _cache_hits += 1
        return _kernel_cache[key]
    _cache_misses += 1
    return None

def _cache_put(key: tuple[str, str, str], kernel: CompiledKernel) -> None:
    """Insert into cache, evicting LRU if at capacity."""
    global _cache_evictions
    if key in _kernel_cache:
        _kernel_cache.move_to_end(key)
        _kernel_cache[key] = kernel
        return

    while len(_kernel_cache) >= _KERNEL_CACHE_MAX:
        # Evict least recently used (first item in OrderedDict)
        evict_key, evict_kernel = _kernel_cache.popitem(last=False)
        gpu.cu_module_unload(evict_kernel.module)
        _cache_evictions += 1
        log.debug(f"LRU evict: {evict_key[0]} ({evict_key[2]})")

    _kernel_cache[key] = kernel
```

### Modified `compile_kernel()` (lines 175-214)

Replace direct dict access:

```python
# Line 175-178: Cache lookup
cache_key = (expression, param_name, precision)
cached = _cache_get(cache_key)
if cached is not None:
    return cached

# ... compilation logic unchanged ...

# Line 214: Cache insertion
_cache_put(cache_key, kernel)
```

### Enhanced `cache_stats()`

```python
def cache_stats() -> dict:
    return {
        "cached_kernels": len(_kernel_cache),
        "max_kernels": _KERNEL_CACHE_MAX,
        "hits": _cache_hits,
        "misses": _cache_misses,
        "evictions": _cache_evictions,
        "hit_rate": round(_cache_hits / max(_cache_hits + _cache_misses, 1), 3),
        "entries": [
            {"expression": k[0], "param": k[1], "precision": k[2]}
            for k in _kernel_cache
        ]
    }
```

### Configuration

Add to `data/chipset/math-coprocessor.yaml`:

```yaml
symbex:
  kernel_cache:
    max_entries: 64
    log_evictions: true
```

Load this config value into `_KERNEL_CACHE_MAX` during chip initialization. Default to 64 if not specified.

**Why 64?** The math co-processor typically sees 10-30 unique expressions per session (5 chips, ~5-6 expressions each). 64 provides 2x headroom for heavy sessions while bounding VRAM usage. Each kernel module is ~1-4 MB of VRAM, so 64 kernels ≈ 64-256 MB — within the 750 MB budget alongside other allocations.

### Modified `clear_cache()`

No change needed — existing implementation iterates all entries and unloads modules. Works correctly with OrderedDict.

## Acceptance Criteria

1. Cache enforces `max_entries` limit (default 64)
2. Least recently used kernels are evicted first when cache is full
3. Evicted kernels have `gpu.cu_module_unload()` called before removal
4. Cache hit moves entry to most-recent position (LRU refresh)
5. `cache_stats()` includes `max_kernels`, `hits`, `misses`, `evictions`, `hit_rate`
6. `clear_cache()` continues to work (clears all, resets counters)
7. Config value `kernel_cache.max_entries` in YAML is respected
8. Default of 64 used when config is absent

## Test Specifications

Add to `math-coprocessor/tests/test_jit.py`:

```python
def test_cache_lru_eviction():
    """Verify LRU eviction when cache exceeds max size."""
    # Set small max for testing
    jit._KERNEL_CACHE_MAX = 3
    jit.clear_cache()

    # Insert 4 kernels (should evict first)
    for i in range(4):
        jit._cache_put((f"expr_{i}", "x", "float32"), mock_kernel(i))

    assert len(jit._kernel_cache) == 3
    assert ("expr_0", "x", "float32") not in jit._kernel_cache  # Evicted
    assert ("expr_3", "x", "float32") in jit._kernel_cache      # Most recent

def test_cache_lru_refresh():
    """Verify accessing a cached kernel refreshes its LRU position."""
    jit._KERNEL_CACHE_MAX = 3
    jit.clear_cache()

    for i in range(3):
        jit._cache_put((f"expr_{i}", "x", "float32"), mock_kernel(i))

    # Access expr_0 (moves it to most-recent)
    jit._cache_get(("expr_0", "x", "float32"))

    # Insert expr_3 (should evict expr_1, not expr_0)
    jit._cache_put(("expr_3", "x", "float32"), mock_kernel(3))

    assert ("expr_0", "x", "float32") in jit._kernel_cache      # Refreshed
    assert ("expr_1", "x", "float32") not in jit._kernel_cache   # Evicted

def test_cache_eviction_unloads_module():
    """Verify GPU module is unloaded when kernel is evicted."""
    jit._KERNEL_CACHE_MAX = 1
    jit.clear_cache()

    kernel_0 = mock_kernel(0)
    jit._cache_put(("expr_0", "x", "float32"), kernel_0)
    jit._cache_put(("expr_1", "x", "float32"), mock_kernel(1))

    # Verify module unload was called for evicted kernel
    gpu.cu_module_unload.assert_called_with(kernel_0.module)

def test_cache_stats_includes_metrics():
    """Verify cache stats include eviction metrics."""
    jit.clear_cache()
    stats = jit.cache_stats()
    assert "max_kernels" in stats
    assert "hits" in stats
    assert "misses" in stats
    assert "evictions" in stats
    assert "hit_rate" in stats
```

## Technical Notes

- `OrderedDict.move_to_end(key)` is O(1) — no performance regression on cache hits
- `OrderedDict.popitem(last=False)` removes the first (oldest) item — O(1) eviction
- The `while` loop in `_cache_put` handles edge cases where `_KERNEL_CACHE_MAX` is reduced at runtime
- Module counters (`_cache_hits`, etc.) use globals for simplicity — thread safety is not needed since the math co-processor has a concurrency limit of 4 (enforced externally)

---

*Component spec for Retro-Driven Improvements milestone. Self-contained — no external references needed for implementation.*
