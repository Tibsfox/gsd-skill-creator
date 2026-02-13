# Token Budget

Skills load within a configurable token budget to avoid context bloat:

| Setting | Default | Description |
|---------|---------|-------------|
| **Budget** | 2-5% | Percentage of context window reserved for skills |
| **Priority** | Specificity | More specific/relevant skills load first |
| **Caching** | Enabled | Recently used skills stay loaded |
| **Overflow** | Queued | Excess skills queue for next session |

**Check current status:**
```bash
skill-creator status
```

**Output example:**
```
Active Skills (3):
  - typescript-patterns (1,200 tokens)
  - testing-best-practices (800 tokens)
  - git-workflow (500 tokens)

Token Budget: 2,500 / 4,000 (62.5% used)
Remaining: 1,500 tokens
```

**Skills that cost more tokens than they save are flagged for review.**
