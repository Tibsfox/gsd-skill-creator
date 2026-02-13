# Pattern Discovery

The `discover` command scans your Claude Code session history to find recurring interaction patterns and generate draft skills from them.

## How It Works

1. **Scan** - Enumerates all projects under `~/.claude/projects/` and stream-parses JSONL session files
2. **Extract** - Identifies tool sequence n-grams (Read->Edit->Bash) and Bash command patterns (git workflows, build commands)
3. **Cluster** - Groups similar user prompts using DBSCAN with automatic epsilon tuning
4. **Rank** - Scores candidates using frequency, cross-project occurrence, recency, and consistency
5. **Present** - Shows ranked candidates with evidence (which sessions, which projects, examples)
6. **Draft** - Generates SKILL.md files with pre-filled workflow steps for selected candidates

## Key Features

| Feature | Description |
|---------|-------------|
| **Incremental scanning** | Only processes new/modified sessions on subsequent runs via watermarks |
| **Noise filtering** | Filters framework patterns appearing in 15+ projects (dual-threshold) |
| **Deduplication** | Skips patterns that match existing skills |
| **Semantic clustering** | Groups similar prompts using embeddings + DBSCAN |
| **Stream parsing** | Handles 23MB+ session files without loading into memory |
| **Subagent support** | Includes subagent session directories in analysis |

## Usage

```bash
# Discover patterns from all projects
skill-creator discover

# Exclude specific projects from scanning
skill-creator discover --exclude my-private-project

# Force full rescan (ignore previous watermarks)
skill-creator discover --rescan

# Preview what would be scanned (v1.10)
skill-creator discover --dry-run

# Explicitly allow a project (v1.10)
skill-creator discover --allow my-project
```

The command displays progress during scanning (project count, session count, patterns found) and presents an interactive selection UI for choosing which candidates to turn into skills.
