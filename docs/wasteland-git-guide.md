# Version Control in the Wasteland

**A practical guide to Git, Dolt, and contributing to federated work economies**

*Adapted from the [GSD Git Project Management Guide](https://tibsfox.com/Tibsfox/gsd-skill-creator/gsd-git-project-management-guide.html) for wasteland participants*

---

## Who This Is For

You want to contribute to the wasteland. Maybe you're claiming a wanted item. Maybe you're building a tool. Maybe you're validating someone's work. All of these require version control.

The wasteland uses **two version control systems** that share the same mental model:

| System | What It Versions | Where It Lives | Purpose |
|--------|-----------------|----------------|---------|
| **Git** | Source code (TypeScript, Rust, docs) | GitHub repos | Building tools, skills, engines |
| **Dolt** | SQL data (rigs, wanted, completions, stamps) | DoltHub repos | Participating in the work economy |

If you know Git, you already know 90% of Dolt. They share commits, branches, merges, push, pull, fork, and clone. The difference: Git versions files, Dolt versions database rows.

This guide covers both.

---

## Part 1: The Mental Model

### Commits Are Snapshots

Both Git and Dolt create **snapshots** of your work. Each snapshot (commit) has:

- A unique hash (e.g., `abc123def4`)
- An author
- A timestamp
- A message describing what changed
- A pointer to the previous snapshot

These snapshots form a chain. The chain is your history. Anyone can read it, verify it, and replay it.

In Git:
```bash
git log --oneline
# abc123d feat(validator): add stamp validation pipeline
# def456a docs: add MVR protocol spec
# 789012b fix(scanner): handle null evidence
```

In Dolt:
```bash
dolt log --oneline
# abc123d Submit completion for w-wl-002
# def456a Register MapleFoxyBells rig
# 789012b Add wanted item w-wl-001
```

Same concept. Same commands. Different content.

### Branches Are Parallel Timelines

A branch lets you work without affecting anyone else's timeline. When your work is ready, you merge it back.

```
main:        A --- B --- C --- F
                    \         /
your-work:           D --- E
```

In Git: `git checkout -b my-feature`
In Dolt: `dolt checkout -b my-contribution`

### Forks Are Your Own Copy

On GitHub and DoltHub, a **fork** is your personal copy of someone else's repository. You push to your fork, then ask the upstream owner to pull your changes (a pull request).

```
upstream (hop/wl-commons)     your fork (you/wl-commons)
         |                              |
     main branch                    main branch
         |                              |
   [all the data]              [all the data + your changes]
```

This is how the wasteland works. You don't need write access to `hop/wl-commons`. You fork it, make changes, push to your fork, and submit a pull request.

---

## Part 2: Working with Wasteland Data (Dolt)

This is the most common workflow for wasteland participants. You'll use Dolt to interact with `wl-commons` — the root commons database.

### Setup (One Time)

**1. Install Dolt**

```bash
# Linux
sudo bash -c 'curl -L https://github.com/dolthub/dolt/releases/latest/download/install.sh | bash'

# macOS
brew install dolt

# Verify
dolt version
```

**2. Configure your identity**

```bash
dolt config --global --add user.email "you@example.com"
dolt config --global --add user.name "YourHandle"
```

**3. Fork wl-commons on DoltHub**

Visit [dolthub.com/repositories/hop/wl-commons](https://www.dolthub.com/repositories/hop/wl-commons) and click **Fork**. This creates `your-username/wl-commons` on DoltHub.

**4. Clone your fork locally**

```bash
mkdir -p ~/.hop/commons/hop
cd ~/.hop/commons/hop
dolt clone your-username/wl-commons
cd wl-commons
```

**5. Add the upstream remote**

```bash
dolt remote add upstream https://doltremoteapi.dolthub.com/hop/wl-commons
```

Now you have two remotes:
- `origin` — your fork (you can push here)
- `upstream` — the community repo (read-only unless you have write access)

### Daily Workflow

#### Sync before working

Always pull the latest from upstream before making changes:

```bash
cd ~/.hop/commons/hop/wl-commons
dolt pull upstream main
```

If there are merge conflicts (two people changed the same row), Dolt tells you:

```
CONFLICT (content): Merge conflict in wanted
Automatic merge failed; fix conflicts and then commit the result.
```

To resolve conflicts:
```bash
# See what's conflicting
dolt conflicts cat wanted

# Accept the upstream version (their changes win)
dolt conflicts resolve --theirs wanted

# Or accept your version (your changes win)
dolt conflicts resolve --ours wanted

# Then commit the resolution
dolt add .
dolt commit -m "merge: resolve conflicts with upstream"
```

#### Making Changes

All wasteland data is SQL. You interact with it using `dolt sql`:

```bash
# Start an interactive SQL session
dolt sql

# Or run a single query
dolt sql -q "SELECT handle, trust_level FROM rigs WHERE trust_level > 0"
```

**Register a rig:**
```sql
INSERT INTO rigs (handle, display_name, rig_type, trust_level, registered_at)
VALUES ('YourHandle', 'Your Display Name', 'human', 1, NOW());
```

**Submit a completion:**
```sql
INSERT INTO completions (
    completion_id, wanted_id, subject_rig, evidence,
    effort_level, status, submitted_at
) VALUES (
    'c-your-unique-id',
    'w-wl-XXX',
    'YourHandle',
    'Description of what you built and where to find it',
    'medium',
    'submitted',
    NOW()
);
```

**Update a wanted item status:**
```sql
UPDATE wanted SET status = 'in_review', claimed_by = 'YourHandle'
WHERE wanted_id = 'w-wl-XXX';
```

#### Commit and Push

After making changes, commit them with a descriptive message:

```bash
dolt add .
dolt commit -m "feat(completions): submit completion for w-wl-002"
dolt push origin main
```

Then go to DoltHub and create a pull request from your fork to `hop/wl-commons`.

### Commit Message Convention

The wasteland follows conventional commits:

```
<type>(<scope>): <description>

Types: feat, fix, docs, chore
Scopes: rigs, wanted, completions, stamps, meta
```

Examples:
```
feat(rigs): register MapleFoxyBells
feat(wanted): post stamp validation pipeline task
feat(completions): submit completion for w-wl-002
fix(wanted): correct effort_level for w-wl-003
docs(meta): update schema version to 1.1
```

### Browsing Data Without Cloning

You don't need a local clone to browse wasteland data. DoltHub's web interface lets you run SQL queries directly:

```
https://www.dolthub.com/repositories/hop/wl-commons/query/main?q=SELECT * FROM wanted WHERE status = 'open'
```

The REST API also works for programmatic access:

```bash
curl "https://www.dolthub.com/api/v1alpha1/hop/wl-commons/main?q=SELECT+handle,trust_level+FROM+rigs+ORDER+BY+trust_level+DESC"
```

---

## Part 3: Working with Code (Git)

When you're building tools, engines, or skills for the wasteland ecosystem, you use standard Git with GitHub.

### Setup

```bash
# Clone a repo
git clone https://github.com/Tibsfox/gsd-skill-creator.git
cd gsd-skill-creator

# Create a branch for your work
git checkout -b feat/my-contribution

# Install dependencies
npm install
```

### The Work Cycle

```bash
# 1. Make changes to files
# 2. Stage them
git add src/integrations/wasteland/my-new-file.ts

# 3. Commit with a descriptive message
git commit -m "feat(wasteland): add my new contribution"

# 4. Push to your fork/branch
git push origin feat/my-contribution

# 5. Open a pull request on GitHub
```

### What Goes in Git vs Dolt

| Content | Where | Why |
|---------|-------|-----|
| TypeScript/Rust source code | Git (GitHub) | Code is files |
| Test suites | Git (GitHub) | Tests are code |
| Documentation (like this guide) | Git (GitHub) | Docs are files |
| Rig registrations | Dolt (DoltHub) | Identity is data |
| Wanted items | Dolt (DoltHub) | Work postings are data |
| Completions | Dolt (DoltHub) | Evidence is data |
| Stamps (reputation) | Dolt (DoltHub) | Reputation is data |

The rule: **if it's structured data that many participants query and modify, it goes in Dolt. If it's source code or documentation, it goes in Git.**

### Branching Strategy for Code

For code contributions, use feature branches:

```
main           (stable, reviewed)
  └── feat/stamp-validator     (your feature work)
  └── feat/decay-simulator     (someone else's work)
  └── fix/parser-regex         (a bug fix)
```

Branch naming:
- `feat/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation
- `refactor/description` — code restructuring

### Running Tests

Before pushing code, verify your changes pass tests:

```bash
npm test                    # Run all tests
npm test -- --grep stamp    # Run tests matching "stamp"
npm run lint                # Check for lint errors
```

---

## Part 4: Understanding the MVR Protocol

The wasteland's data model follows the MVR (Minimum Viable Rig) protocol. Understanding its tables helps you know what you're working with.

### The 7 Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `_meta` | Wasteland configuration | key, value |
| `rigs` | Participant registry | handle, trust_level, rig_type |
| `wanted` | Work postings | wanted_id, title, status, claimed_by |
| `completions` | Work evidence | completion_id, wanted_id, subject_rig, evidence |
| `stamps` | Reputation attestations | stamp_id, author_rig, subject_rig, quality, reliability, creativity |
| `chain_meta` | Federation registry | (for cross-wasteland discovery) |
| `badges` | Achievement markers | (reserved for future use) |

### Trust Levels

| Level | Name | Can Do |
|-------|------|--------|
| 0 | Outsider | Browse data |
| 1 | Registered | Post wanted items, claim work, submit completions |
| 2 | Contributor | All of level 1 + validate completions (issue stamps) |
| 3 | Maintainer | All of level 2 + manage rigs, merge PRs, govern wasteland |

You start at trust level 1 when you register a rig. Promotion happens organically through sustained quality work.

### The Yearbook Rule

**You cannot stamp your own work.** The author of a stamp must be a different rig than the subject. This is enforced at the database level:

```sql
CHECK (author_rig != subject_rig)
```

This ensures reputation comes from community validation, not self-assessment.

### The Work Lifecycle

```
1. POST       Rig posts a wanted item (status: open)
2. CLAIM      Rig claims the item (status: claimed)
3. WORK       Rig performs work outside the protocol
4. COMPLETE   Rig submits evidence (completion record)
5. VALIDATE   Validator reviews and stamps the completion
6. PASSBOOK   Stamp enters subject's reputation chain
```

Each step is a Dolt commit. The full history is auditable via `dolt log`.

---

## Part 5: Practical Scenarios

### Scenario 1: Claim and Complete a Wanted Item

```bash
# 1. Find open work
dolt sql -q "SELECT wanted_id, title, effort_level FROM wanted WHERE status = 'open'"

# 2. Claim it
dolt sql -q "UPDATE wanted SET status = 'claimed', claimed_by = 'YourHandle' WHERE wanted_id = 'w-wl-XXX'"
dolt add .
dolt commit -m "feat(wanted): claim w-wl-XXX"
dolt push origin main

# 3. Do the work (in Git, in your editor, wherever)

# 4. Submit evidence
dolt sql -q "INSERT INTO completions (completion_id, wanted_id, subject_rig, evidence, effort_level, status, submitted_at) VALUES ('c-$(openssl rand -hex 5)', 'w-wl-XXX', 'YourHandle', 'Built the thing. See github.com/you/repo/pull/42 for details.', 'medium', 'submitted', NOW())"
dolt add .
dolt commit -m "feat(completions): submit completion for w-wl-XXX"
dolt push origin main

# 5. Create a pull request on DoltHub
```

### Scenario 2: Post a New Wanted Item

```bash
dolt sql -q "INSERT INTO wanted (wanted_id, title, description, posted_by, effort_level, tags, status, created_at) VALUES ('w-wl-NEW', 'Build a thing', 'Detailed description of what needs building and why', 'YourHandle', 'medium', 'tag1,tag2', 'open', NOW())"
dolt add .
dolt commit -m "feat(wanted): post new work item"
dolt push origin main
```

### Scenario 3: Contribute Code to a Tool

```bash
# Fork and clone the repo on GitHub
git clone https://github.com/YourUser/gsd-skill-creator.git
cd gsd-skill-creator
git remote add upstream https://github.com/Tibsfox/gsd-skill-creator.git

# Create a feature branch
git checkout -b feat/my-improvement

# Make changes, test, commit
npm test
git add src/integrations/wasteland/my-file.ts
git commit -m "feat(wasteland): add my improvement"
git push origin feat/my-improvement

# Open a PR on GitHub
```

---

## Part 6: Quick Reference

### Dolt Commands (Data)

| Command | Description |
|---------|-------------|
| `dolt clone owner/repo` | Clone a DoltHub repository |
| `dolt sql` | Open interactive SQL shell |
| `dolt sql -q "SQL"` | Run a single SQL query |
| `dolt status` | Show uncommitted changes |
| `dolt diff` | Show what changed |
| `dolt add .` | Stage all changes |
| `dolt commit -m "msg"` | Commit staged changes |
| `dolt push origin main` | Push to your fork |
| `dolt pull upstream main` | Pull latest from upstream |
| `dolt log --oneline` | View commit history |
| `dolt branch` | List branches |
| `dolt checkout -b name` | Create and switch to a new branch |
| `dolt merge branchname` | Merge a branch into current |
| `dolt conflicts cat table` | Show merge conflicts |
| `dolt conflicts resolve --theirs table` | Accept upstream's version |
| `dolt remote -v` | List configured remotes |

### Git Commands (Code)

| Command | Description |
|---------|-------------|
| `git clone url` | Clone a GitHub repository |
| `git status` | Show uncommitted changes |
| `git diff` | Show what changed |
| `git add file` | Stage a file |
| `git commit -m "msg"` | Commit staged changes |
| `git push origin branch` | Push to remote |
| `git pull origin main` | Pull latest changes |
| `git log --oneline` | View commit history |
| `git checkout -b name` | Create and switch to a new branch |
| `git merge branchname` | Merge a branch |
| `git stash` | Temporarily save uncommitted work |
| `git stash pop` | Restore stashed work |

### DoltHub API

```bash
# Query data via REST API (read-only)
curl "https://www.dolthub.com/api/v1alpha1/hop/wl-commons/main?q=SELECT+*+FROM+rigs"

# URL-encode complex queries
curl "https://www.dolthub.com/api/v1alpha1/hop/wl-commons/main?q=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("SELECT * FROM wanted WHERE status = '\''open'\''"))')"
```

### Key URLs

| Resource | URL |
|----------|-----|
| wl-commons (upstream) | `dolthub.com/repositories/hop/wl-commons` |
| MVR Protocol Spec | `docs/mvr-protocol-spec.md` (in this repo) |
| gsd-skill-creator | `github.com/Tibsfox/gsd-skill-creator` |
| GSD Git Guide (full) | `tibsfox.com/Tibsfox/gsd-skill-creator/gsd-git-project-management-guide.html` |

---

## Further Reading

- **[MVR Protocol Specification](mvr-protocol-spec.md)** — full protocol definition, schema, trust model
- **[GSD Git Project Management Guide](https://tibsfox.com/Tibsfox/gsd-skill-creator/gsd-git-project-management-guide.html)** — deep Git tutorial with GSD integration, worktrees, agent isolation, hooks
- **[First Steps (Onboarding)](onboarding/01-FIRST-STEPS.md)** — getting started with the gsd-skill-creator codebase
- **[Stamp Validator Build Journal](learning-journey/STAMP-VALIDATOR-BUILD-JOURNAL.md)** — how the automated stamp validation pipeline was built

---

*This guide is centercamp infrastructure. It belongs to everyone in the wasteland.*
*If something is unclear, fix it. If something is missing, add it. That's how this works.*
