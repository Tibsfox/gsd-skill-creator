# Gource Custom Log Format

## Overview

Gource can auto-detect version control history from Git, Mercurial, Bazaar, and SVN repositories. When you need more control -- merging multiple repos, filtering contributors, applying custom colors, or visualizing non-VCS data -- use the **custom log format** instead.

The custom log format is a plain-text file where each line represents a single file-system event. Pass it to Gource with:

```bash
gource --log-format custom <logfile>
```

Or pipe via stdin:

```bash
cat combined.log | gource --log-format custom -
```

## Format Specification

Each line is pipe-delimited with 4 required fields and 1 optional field:

```
timestamp|username|type|filepath|color
```

| Field       | Required | Description                                          |
|-------------|----------|------------------------------------------------------|
| `timestamp` | Yes      | Unix epoch (integer seconds since 1970-01-01 UTC)    |
| `username`  | Yes      | Contributor name displayed in the visualization      |
| `type`      | Yes      | One of `A` (add), `M` (modify), `D` (delete)        |
| `filepath`  | Yes      | Path relative to repo root, using `/` separators     |
| `color`     | No       | Hex color code without `#` prefix (e.g., `FF0000`)   |

### Field Details

**timestamp** -- Must be a positive integer. Gource sorts events by this value to determine animation order. Use `git log --format='%at'` or `date +%s` to obtain epoch timestamps.

**username** -- Free-text string. Gource renders each unique username as a separate avatar node. Consistent naming across repos ensures a single avatar per contributor.

**type** -- Single uppercase character:
- `A` -- File added (appears as new node in tree)
- `M` -- File modified (pulses the existing node)
- `D` -- File deleted (node fades and disappears)

**filepath** -- Forward-slash separated path. The directory structure determines the tree layout. Leading `/` is optional but recommended for consistency.

**color** -- Six-character hex string (RGB). When omitted, Gource assigns colors automatically based on file extension. When provided, overrides the automatic color for that event.

## Examples

```
1275543595|Andrew Caudwell|A|/src/main.cpp|
1275543595|Andrew Caudwell|A|/src/gource.h|
1275543595|Andrew Caudwell|M|/README|
1275543600|John Smith|D|/obsolete/old.h|FF0000
1275543600|John Smith|A|/src/new-module.cpp|00FF00
1275543700|Jane Doe|M|/docs/api.md|4488FF
1275543700|Jane Doe|A|/tests/test_api.py|4488FF
1275543800|Andrew Caudwell|M|/src/main.cpp|
```

Note: Lines with an empty color field (trailing `|` or no fifth field) use Gource's automatic coloring. Lines with a color value override it for that specific event.

## Multi-Repo Merging

To visualize multiple repositories in a single Gource animation:

### Namespace Prefixing

Prepend a repository identifier to each filepath to keep directory trees separate:

```
1275543595|Alice|A|/frontend/src/App.tsx|
1275543595|Bob|A|/backend/src/main.rs|
1275543600|Alice|M|/frontend/src/App.tsx|
1275543600|Bob|M|/backend/Cargo.toml|
```

The `/frontend` and `/backend` prefixes create visually distinct branches in the tree.

### Per-Repo Color Coding

Assign a consistent color per repository to make repo boundaries visually obvious:

```
1275543595|Alice|A|/frontend/src/App.tsx|3498DB
1275543595|Bob|A|/backend/src/main.rs|E74C3C
1275543600|Alice|M|/frontend/src/App.tsx|3498DB
1275543600|Bob|M|/backend/Cargo.toml|E74C3C
```

This makes frontend files blue and backend files red regardless of file extension.

### Merging Procedure

1. Generate a custom log for each repository (with namespace prefix and optional color)
2. Concatenate all logs into a single file
3. Sort by timestamp (required -- Gource expects chronological order)

```bash
cat repo-a.log repo-b.log repo-c.log | sort -t'|' -k1,1n > combined.log
gource --log-format custom combined.log
```

## Auto-Timing Formula

The preset configuration files include a default `seconds-per-day` value, but the render script overrides it dynamically based on repository metrics to hit a target video duration:

```
target_seconds = {quick: 30, standard: 180, cinematic: 240}
date_range_days = (latest_commit_epoch - earliest_commit_epoch) / 86400
calculated_spd = target_seconds / date_range_days
final_spd = max(calculated_spd, 0.01)
```

The `max(..., 0.01)` floor prevents a zero or negative value when the date range is very large. The calculated value is passed as a command-line argument which takes precedence over the `.conf` file value.

**Example:** A repo spanning 365 days targeting a 3-minute (180s) standard video:

```
calculated_spd = 180 / 365 = 0.493
```

Gource will advance roughly half a day per second of video.

## Sorting Requirement

Merged custom logs **must** be sorted by the timestamp field (first field, numeric ascending). Gource processes events sequentially and will produce incorrect animations if events are out of order.

```bash
sort -t'|' -k1,1n unsorted.log > sorted.log
```

The `-t'|'` flag sets the pipe as field delimiter. The `-k1,1n` flag sorts numerically on the first field only.

## Usage with Gource

### From File

```bash
gource --log-format custom combined.log
```

### From Stdin

```bash
generate-log.sh | gource --log-format custom -
```

### With Preset Config

```bash
gource --load-config preset-standard.conf --log-format custom combined.log
```

Command-line arguments (like `--seconds-per-day`) override values in the `.conf` file, allowing the render script to dynamically tune playback speed while using preset visual settings.
