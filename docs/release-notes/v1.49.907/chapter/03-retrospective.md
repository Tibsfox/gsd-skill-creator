# Retrospective — v1.49.907

## What Worked

**v902's class-multi-method consolidated-gate generalized cleanly to M public methods.** v902 had 1 public method orchestrating internals. v907 has 5 public methods, each orchestrating internals. The wire mechanics are identical — public method hoists gate-on-scope, private methods inherit. The count of public methods is not a structural variable.

**Scope-gated audit (`this.memoryDir`) over file-path-gated audit was the right design.** Each public read method touches multiple files inside `this.memoryDir`. Auditing at the scope level (1 audit per public call) gives operators "what directory was accessed" granularity, which matches the threat model (allow/deny per directory). File-path-level auditing would have been noisier and harder to allow-list.

**Test for "get() doesn't include write-side" was clean.** `get()` calls `store()` internally to update access metadata — a read-then-write method like v904's `consume`. The test exercises this by storing first (write-side, 0 audits), then calling 4 read methods after a sink.clear() (4 audits expected, 4 received). The 5th method `get()` was excluded from the audit-count test because it ALSO calls store(), which would add 0 extra audits — including it didn't change the count but did clarify the wire's behavior.

## What Could Have Been Better

**`get()` is a hidden read-then-write method.** It reads the record, then immediately calls `store()` to persist updated access metadata. Per #10457, the store() write is out-of-scope — but the audit log won't show that `get()` mutated the file. Operators inspecting audits might miss the implicit write. Carry-forward: documenting "get() is a read-then-write method" in the file's docstring would close this gap, but it's not blocking.

## Lessons Learned

See [04-lessons.md](04-lessons.md). v902's class-multi-method consolidated-gate sub-variant promoted to 2-instance via v907 — one more instance promotes it to ESTABLISHED.
