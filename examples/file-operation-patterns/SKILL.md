---
name: file-operation-patterns
description: Safe file system operation patterns for creating, copying, moving, and deleting files. Use when performing bulk file operations, managing directories, writing deployment scripts, or when user mentions 'file operations', 'copy files', 'move files', 'mkdir', 'cleanup'.
---

# File Operation Patterns

Best practices for safe, reliable file system operations in shell scripts and CLI workflows.

## Safe Patterns

### Directory Creation
```bash
# Always use -p to create parent directories
mkdir -p path/to/nested/dir

# Verify before operating
[ -d "target" ] || mkdir -p "target"
```

### Copying
```bash
# Preserve permissions and timestamps
cp -rp src/ dst/

# Use rsync for large or incremental copies
rsync -av --progress src/ dst/
```

### Moving / Renaming
```bash
# Atomic rename (same filesystem)
mv tmp-output.json output.json

# Cross-filesystem: copy then remove
cp -rp src/ dst/ && rm -rf src/
```

### Atomic Writes
```bash
# Write to temp, then rename — prevents partial reads
tmpfile=$(mktemp "${target}.XXXXXX")
echo "$content" > "$tmpfile"
mv "$tmpfile" "$target"
```

### Safe Deletion
```bash
# Dry run first
echo "Would delete:" && ls path/to/delete/

# Use trash instead of rm when available
trash-put old-files/ 2>/dev/null || rm -rf old-files/

# Never use rm -rf with variables without guards
[ -n "$DIR" ] && [ "$DIR" != "/" ] && rm -rf "$DIR"
```

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| `rm -rf $DIR` (unguarded variable) | Guard with `[ -n "$DIR" ]` check |
| `cp file dest` (no recursive flag for dirs) | `cp -r dir/ dest/` |
| Write directly to target file | Write to temp, then `mv` (atomic) |
| Assume directory exists | `mkdir -p` before writing |
| Ignore permissions after copy | Use `cp -p` or explicit `chmod` |

## Quick Reference

| Operation | Command | Notes |
|-----------|---------|-------|
| Create dir tree | `mkdir -p a/b/c` | Idempotent |
| Copy preserving attrs | `cp -rp src dst` | Recursive + permissions |
| Atomic file write | `mktemp` + `mv` | No partial reads |
| Safe bulk delete | `find . -name '*.tmp' -delete` | Targeted, no rm -rf |
| Sync directories | `rsync -av src/ dst/` | Incremental, resumable |
