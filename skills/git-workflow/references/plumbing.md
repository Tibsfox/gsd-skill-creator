# Git Plumbing Commands Reference

Agents should prefer plumbing commands over porcelain for detection and inspection. Plumbing commands produce machine-parseable output and have stable interfaces across git versions.

## Plumbing vs Porcelain Table

| Operation | Porcelain (avoid) | Plumbing (use this) | Notes |
|---|---|---|---|
| Current branch | `git branch` | `git rev-parse --abbrev-ref HEAD` | Returns `HEAD` when detached |
| Is this a repo? | `git status` | `git rev-parse --git-dir` | Returns `.git` path or errors |
| File status | `git status` | `git status --porcelain=v2` | Machine-parseable, stable format |
| Remote URLs | `git remote -v` | `git remote get-url <name>` | One URL per call, no parsing needed |
| Ahead/behind | `git log` | `git rev-list --left-right --count HEAD...@{upstream}` | Returns `ahead\tbehind` |
| Commit exists? | `git log <sha>` | `git cat-file -t <sha>` | Returns `commit` or errors |
| Branch exists? | `git branch -l` | `git show-ref --verify refs/heads/<name>` | Exit 0 if exists, 1 if not |
| Default branch | `git remote show <name>` | `git symbolic-ref refs/remotes/<name>/HEAD` | Returns `refs/remotes/origin/main` |
| Merge base | `git log --graph` | `git merge-base <branch1> <branch2>` | Returns common ancestor SHA |
| Is ancestor? | (none) | `git merge-base --is-ancestor <commit> <branch>` | Exit 0 if yes, 1 if no |
| Object contents | `git show <ref>` | `git cat-file -p <ref>` | Raw object contents |
| Tree listing | `git ls-files` | `git ls-tree <ref>` | List tree entries |
| Ref value | (none) | `git rev-parse <ref>` | Resolve any ref to SHA |

## Porcelain v2 Status Format

The `git status --porcelain=v2` output uses these line prefixes:

| Prefix | Meaning | Fields |
|---|---|---|
| `1` | Ordinary tracked change | `1 XY sub mH mI mW hH hI path` |
| `2` | Rename or copy | `2 XY sub mH mI mW hH hI X## origPath\tpath` |
| `u` | Unmerged (conflict) | `u XY sub m1 m2 m3 mW h1 h2 h3 path` |
| `?` | Untracked file | `? path` |
| `!` | Ignored file | `! path` |

The `XY` field encodes index (X) and worktree (Y) status:
- `.` = unmodified
- `M` = modified
- `T` = type changed
- `A` = added
- `D` = deleted
- `R` = renamed
- `C` = copied

## Ref Manipulation

| Operation | Command | Notes |
|---|---|---|
| Update ref | `git update-ref refs/heads/<name> <sha>` | Direct ref update, no checkout |
| Delete ref | `git update-ref -d refs/heads/<name>` | Remove a branch ref |
| List refs | `git for-each-ref refs/heads/` | All local branch refs |
| Reflog | `git reflog show --format='%H %gD %gs'` | Formatted reflog entries |

## Object Inspection

| Operation | Command | Notes |
|---|---|---|
| Object type | `git cat-file -t <sha>` | Returns: commit, tree, blob, tag |
| Object size | `git cat-file -s <sha>` | Byte count |
| Object content | `git cat-file -p <sha>` | Pretty-printed content |
| Verify pack | `git verify-pack -v .git/objects/pack/<pack>.idx` | Pack integrity check |

---

*Reference document for git-workflow skill*
