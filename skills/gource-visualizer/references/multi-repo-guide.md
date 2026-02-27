# Multi-Repository Visualization Guide

Combine history from multiple repositories into a single Gource visualization. Each repo appears as a top-level directory in the file tree, creating a monorepo-like view of your entire organization or project ecosystem.

## Overview

Why combine repositories:
- **Organization history** -- see how multiple related projects evolved together
- **Monorepo-like view** -- visualize microservices, frontend/backend, or library ecosystems as one tree
- **Team activity** -- show contributions across projects in a single timeline
- **Project retrospectives** -- celebrate milestone work that spanned multiple repos

## Quick Start

Three steps: generate individual logs, merge them, render the combined log.

```bash
# Step 1: Generate individual logs
bash scripts/generate-log.sh /path/to/frontend frontend.log
bash scripts/generate-log.sh /path/to/backend backend.log
bash scripts/generate-log.sh /path/to/shared-lib shared-lib.log

# Step 2: Merge with namespace prefixing and color coding
bash scripts/merge-repos.sh --color --output combined.log \
  /path/to/frontend /path/to/backend /path/to/shared-lib

# Step 3: Render the combined log
bash scripts/render-video.sh --repo combined.log --preset cinematic \
  --title "Our Ecosystem"
```

Or as a one-liner using merge-repos.sh (which calls generate-log.sh internally):

```bash
bash scripts/merge-repos.sh --color --output combined.log \
  /path/to/repo-a /path/to/repo-b && \
bash scripts/render-video.sh --repo combined.log --preset standard
```

## Namespace Prefixing

When `merge-repos.sh` processes each repository, it prepends the repo's directory basename to every file path. This creates a virtual directory structure:

**Before merge (repo-a):**
```
1609459200|alice|A|/src/index.ts
1609459200|alice|A|/package.json
```

**After merge:**
```
1609459200|alice|A|/repo-a/src/index.ts
1609459200|alice|A|/repo-a/package.json
```

In the Gource visualization, each repo appears as a top-level directory branching from the root. Files from different repos are visually separated as distinct subtrees.

### Custom Prefixes

To use custom names instead of directory basenames, rename or symlink the repo directories before merging:

```bash
ln -s /path/to/my-long-repo-name /tmp/frontend
ln -s /path/to/another-repo /tmp/api
bash scripts/merge-repos.sh --output combined.log /tmp/frontend /tmp/api
```

## Color Coding

The `--color` flag assigns each repository a distinct color from an 8-color palette:

| Index | Color | Hex |
|-------|-------|-----|
| 1 | Coral Red | FF6B6B |
| 2 | Teal | 4ECDC4 |
| 3 | Sky Blue | 45B7D1 |
| 4 | Sage Green | 96CEB4 |
| 5 | Warm Yellow | FFEAA7 |
| 6 | Soft Purple | DDA0DD |
| 7 | Mint | 98D8C8 |
| 8 | Gold | F7DC6F |

Colors cycle for repos beyond 8. The color is appended as the 5th field in the Gource log format:

```
1609459200|alice|A|/repo-a/src/index.ts|FF6B6B
```

Gource uses this color for the file node, making it easy to see which repo each file belongs to.

## Chronological Sorting

The merged log is sorted by timestamp (field 1, numeric ascending). This ensures events from all repositories play back in true chronological order, interleaving commits from different repos as they actually happened.

This means you will see the actual development timeline: "repo-a had a burst of activity in January, then repo-b picked up in February" rather than all of repo-a followed by all of repo-b.

## Tips

### Keep Repo Count Under 5

More than 5 repositories makes the visualization cluttered. The tree becomes too dense and individual repos are hard to distinguish. For larger ecosystems, group related repos:

```bash
# Instead of 12 individual repos, merge related ones first
bash scripts/merge-repos.sh --output frontend.log \
  /path/to/web /path/to/mobile /path/to/ui-lib

bash scripts/merge-repos.sh --output backend.log \
  /path/to/api /path/to/workers /path/to/db

bash scripts/merge-repos.sh --color --output ecosystem.log \
  # ... use the .log files as input via render-video.sh
```

### Use Cinematic Preset for Multi-Repo

The cinematic preset's larger fonts and enhanced bloom make it easier to read directory labels across multiple subtrees. The longer target duration (4 min) also gives the visualization more time to show the interleaved timeline.

```bash
bash scripts/render-video.sh --repo combined.log --preset cinematic \
  --title "Engineering Team 2024"
```

### Date Filtering for Mismatched Lifespans

When combining a 10-year-old repo with a 6-month-old one, the older repo dominates the timeline. Use date filtering to focus on a shared time period:

```bash
bash scripts/render-video.sh --repo combined.log --preset standard \
  --start-date "2024-01-01" --stop-date "2024-12-31"
```

### Add Captions for Context

Use `generate-captions.sh` on each repo to create caption files, then manually merge the caption timestamps:

```bash
bash scripts/generate-captions.sh /path/to/repo-a > captions-a.txt
bash scripts/generate-captions.sh /path/to/repo-b > captions-b.txt
cat captions-a.txt captions-b.txt | sort -t'|' -k1,1n > captions.txt

bash scripts/render-video.sh --repo combined.log --preset cinematic \
  --caption-file captions.txt
```

### User Avatar Directories

When multiple repos share contributors, place all avatars in a single directory. Gource matches avatars by username:

```bash
bash scripts/resolve-avatars.sh /path/to/repo-a --output avatars/
bash scripts/resolve-avatars.sh /path/to/repo-b --output avatars/

bash scripts/render-video.sh --repo combined.log --preset standard \
  --avatar-dir avatars/
```

## Troubleshooting

### Files Overlap Between Repos

Files appear in wrong repos or paths collide. This happens when namespace prefixing was not applied.

**Fix:** Ensure you use `merge-repos.sh` (which auto-namespaces) rather than manually concatenating log files.

### One Repo Dominates the Visualization

A repo with 10x more commits or files will visually overwhelm smaller repos.

**Options:**
1. Filter by date range: `--start-date "2024-01-01"`
2. Filter files: `--file-filter "node_modules|vendor"` (reduce noise from the large repo)
3. Use a slower `--seconds-per-day` to give the smaller repo more screen time

### Video is Too Fast or Too Slow

`render-video.sh` calculates timing from the combined log's date range. For merged repos, the date range can be very large.

**Fix:** Override the auto-calculated timing:

```bash
# Slower (more detail)
bash scripts/render-video.sh --repo combined.log --preset standard \
  --seconds-per-day 0.5

# Faster (overview)
bash scripts/render-video.sh --repo combined.log --preset standard \
  --seconds-per-day 0.01
```

### Merge Output is Empty

`merge-repos.sh` exits with code 4 if the combined log is empty.

**Check:**
1. Do the repos have commits? `git -C /path/to/repo rev-list --count HEAD`
2. Does `generate-log.sh` produce output? `bash scripts/generate-log.sh /path/to/repo`
3. Are the repo paths correct? `ls -d /path/to/repo/.git`
