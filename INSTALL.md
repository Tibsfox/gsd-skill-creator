# Installation Guide

This guide covers installing the Dynamic Skill Creator for use with Claude Code.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Post-Installation Setup](#post-installation-setup)
- [Claude Code Integration](#claude-code-integration)
- [Verification](#verification)
- [Directory Reference](#directory-reference)
- [Troubleshooting](#troubleshooting)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [For Claude Code (AI Instructions)](#for-claude-code-ai-instructions)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Check Command |
|----------|-----------------|---------------|
| **Node.js** | 18.x or higher | `node --version` |
| **npm** | 8.x or higher | `npm --version` |
| **Git** | Any recent version | `git --version` |

### Verify Prerequisites

Run these commands to verify your system is ready:

```bash
# Check Node.js version (need 18+)
node --version
# Expected: v18.0.0 or higher

# Check npm version (need 8+)
npm --version
# Expected: 8.0.0 or higher

# Check Git is installed
git --version
# Expected: git version 2.x.x
```

### Install Prerequisites (if needed)

**Node.js & npm:**
```bash
# macOS (using Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows (using winget)
winget install OpenJS.NodeJS.LTS
```

**Git:**
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Windows
winget install Git.Git
```

---

## Installation Methods

### Method 1: Clone and Install (Recommended)

This is the recommended method for most users:

```bash
# 1. Clone the repository
git clone <repository-url> 
cd gsd-skill-creator

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Verify installation
npm test
```

**Expected test output:**
```
Test Files  15 passed (15)
Tests       202 passed (202)
```

### Method 2: Global Installation

After completing Method 1, link the CLI globally:

```bash
# Link globally to use 'skill-creator' command anywhere
npm link

# Verify global installation
skill-creator --help
```

**Benefits of global installation:**
- Run `skill-creator` from any directory
- No need to specify path to CLI
- Easier to use in multiple projects

### Method 3: Local Project Installation

To use as a dependency in a specific project:

```bash
# Option A: Install from local path
cd /path/to/your/project
npm install /path/to/gsd-skill-creator


# Option B: Add to package.json manually
{
  "dependencies": {
    "dynamic-skill-creator": "file:/path/to/gsd-skill-creator"
  }
}
# Then run: npm install

# Option C: Link for development
cd /path/to/gsd-skill-creator
npm link
cd /path/to/your/project
npm link dynamic-skill-creator
```

---

## Post-Installation Setup

### Step 1: Initialize Directory Structure

The tool automatically creates required directories on first use, but you can initialize manually:

```bash
# Create skill storage directory
mkdir -p .claude/skills

# Create pattern storage directory
mkdir -p .planning/patterns

# Create agents directory (for generated agents)
mkdir -p .claude/agents

# Create placeholder files for git tracking
touch .claude/skills/.gitkeep
touch .planning/patterns/.gitkeep
touch .claude/agents/.gitkeep
```

### Step 2: Configure Git Tracking (Recommended)

Skills benefit from git version control for rollback support:

```bash
# Ensure directories are tracked
git add .claude/skills/.gitkeep
git add .planning/patterns/.gitkeep
git add .claude/agents/.gitkeep

# Commit the structure
git commit -m "Initialize skill creator directories"
```

### Step 3: Add to .gitignore (Optional)

Customize what gets tracked:

```gitignore
# Option A: Track everything (recommended for teams)
# (no entries needed)

# Option B: Exclude large observation files
.planning/patterns/sessions.jsonl

# Option C: Exclude all patterns (skills only)
.planning/patterns/

# Always keep suggestions and feedback (smaller files)
!.planning/patterns/suggestions.json
!.planning/patterns/feedback.jsonl
!.planning/patterns/agent-suggestions.json
```

### Step 4: Configure Your Shell (Optional)

Add aliases for convenience:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias sc='skill-creator'
alias sc-suggest='skill-creator suggest'
alias sc-status='skill-creator status'
alias sc-list='skill-creator list'
```

---

## Claude Code Integration

### Setting Up Hooks (Optional)

To enable automatic session observation, configure Claude Code hooks:

**Create `.claude/settings.json`:**
```json
{
  "hooks": {
    "session_start": "node /path/to/gsd-skill-creator/dist/hooks/session-start.js",
    "session_end": "node /path/to/gsd-skill-creator/dist/hooks/session-end.js"
  }
}
```

> **Note:** Hook integration depends on Claude Code's hook system availability. Check Claude Code documentation for current hook support.

### Manual Usage (Recommended)

Without hooks, use the CLI directly. This is the most reliable method:

```bash
# After completing a coding session, analyze patterns
skill-creator suggest

# Periodically check for skill suggestions
skill-creator suggestions

# Review and create skills manually
skill-creator create

# Check what skills are active
skill-creator status

# Review agent suggestions
skill-creator agents suggest
```

### Recommended Workflow

1. **Daily:** Run `skill-creator suggest` at the end of your coding session
2. **Weekly:** Review `skill-creator suggestions` and create useful skills
3. **Monthly:** Run `skill-creator agents suggest` to find skill clusters
4. **As needed:** Use `skill-creator refine` when skills need updating

---

## Verification

### Step 1: Run Tests

```bash
# Run the full test suite (202 tests)
npm test

# Expected output:
# Test Files  15 passed (15)
# Tests       202 passed (202)
```

### Step 2: Verify CLI

```bash
# Show help (if globally linked)
skill-creator help

# Or if not linked globally
node dist/cli.js help

# Expected: Shows all available commands
```

### Step 3: Verify Build

```bash
# Check TypeScript compiles
npx tsc --noEmit

# Expected: No output (no errors)
```

### Step 4: Create a Test Skill

```bash
# Start the creation wizard
skill-creator create

# Follow the prompts:
# 1. Enter skill name: test-skill
# 2. Enter description: A test skill for verification
# 3. Add intent trigger: "testing"
# 4. Add file trigger: "*.test.ts"
# 5. Enter skill content: "This is a test skill."

# Verify it was created
skill-creator list

# Expected output:
# Skills (1):
#   - test-skill: A test skill for verification

# Clean up (optional)
rm -rf .claude/skills/test-skill
```

### Step 5: Verify CLI Commands

```bash
# Test each major command
skill-creator list              # Should show skills (or empty list)
skill-creator status            # Should show token budget
skill-creator suggestions       # Should show suggestion stats
skill-creator agents list       # Should show agent suggestions
```

---

## Directory Reference

After installation, your project structure should include:

```
your-project/
├── .claude/
│   ├── skills/                  # Skill storage
│   │   ├── .gitkeep            # Placeholder for git
│   │   └── <skill-name>/       # Created on first skill
│   │       ├── SKILL.md        # Main skill file
│   │       └── reference.md    # Optional reference
│   ├── agents/                  # Generated agents
│   │   ├── .gitkeep            # Placeholder for git
│   │   └── <agent-name>.md     # Created on first agent
│   └── settings.json           # Optional: Claude Code settings
│
├── .planning/
│   ├── patterns/                # Observation data
│   │   ├── .gitkeep            # Placeholder for git
│   │   ├── sessions.jsonl      # Session observations (created on use)
│   │   ├── suggestions.json    # Skill suggestions (created on use)
│   │   ├── feedback.jsonl      # User feedback (created on use)
│   │   └── agent-suggestions.json  # Agent suggestions (created on use)
│   └── ...                     # Other planning files
│
├── node_modules/
│   └── dynamic-skill-creator/   # If installed as dependency
│
└── gsd-skill-creator/                # If cloned locally
    ├── dist/                    # Compiled JavaScript
    │   └── cli.js              # CLI entry point
    ├── src/                     # TypeScript source
    └── package.json
```

---

## Troubleshooting

### Issue 1: "Command not found: skill-creator"

**Cause:** Global link not in PATH or not created.

**Solutions:**
```bash
# Check npm global bin directory
npm bin -g
# Example output: /usr/local/bin

# Verify it's in PATH
echo $PATH | grep -o '[^:]*npm[^:]*'

# If not in PATH, add to ~/.bashrc or ~/.zshrc:
export PATH="$PATH:$(npm bin -g)"

# Alternative: Use npx
npx skill-creator help

# Alternative: Run directly
node /path/to/gsd-skill-creator/dist/cli.js help
```

### Issue 2: "Cannot find module" Errors

**Cause:** Project not built or build is outdated.

**Solution:**
```bash
cd /path/to/gsd-skill-creator

# Ensure dependencies are installed
npm install

# Rebuild the project
npm run build

# Verify build exists
ls dist/cli.js
```

### Issue 3: Permission Errors

**Cause:** File permissions or npm global directory permissions.

**Solutions:**
```bash
# Make CLI executable (Unix)
chmod +x dist/cli.js

# Fix npm global permissions (if needed)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH="$PATH:$HOME/.npm-global/bin"' >> ~/.bashrc
source ~/.bashrc

# Re-link after fixing permissions
cd /path/to/gsd-skill-creator
npm unlink
npm link
```

### Issue 4: Git-Related Errors

**Cause:** Not in a git repository or git not configured.

**Solutions:**
```bash
# Check if in a git repository
git status

# If not, initialize git
git init

# Configure git user if not set
git config user.email "you@example.com"
git config user.name "Your Name"

# For rollback features, ensure skills are committed
git add .claude/skills/
git commit -m "Track skills"
```

### Issue 5: TypeScript Compilation Errors

**Cause:** Modified source or incompatible Node version.

**Solutions:**
```bash
# Check Node version
node --version
# Must be 18+

# Clean and rebuild
rm -rf dist/
rm -rf node_modules/
npm install
npm run build

# Check for type errors
npx tsc --noEmit
```

### Issue 6: Tests Failing

**Cause:** Environment issues or incomplete installation.

**Solutions:**
```bash
# Ensure clean state
rm -rf node_modules/
rm -rf dist/
npm cache clean --force

# Reinstall everything
npm install
npm run build

# Run tests with verbose output
npm test -- --reporter=verbose

# Check for specific failures
npm test -- --grep "failing test name"

# Ensure git is configured (some tests use git)
git config user.email "test@example.com"
git config user.name "Test User"
```

---

## Updating

To update to a newer version:

```bash
cd /path/to/gsd-skill-creator

# 1. Stash any local changes
git stash

# 2. Pull latest changes
git pull origin main

# 3. Reinstall dependencies (handles any new packages)
npm install

# 4. Rebuild
npm run build

# 5. Re-run tests to verify
npm test

# 6. Re-link if globally installed
npm unlink
npm link

# 7. Restore any local changes
git stash pop
```

### Checking Current Version

```bash
# Check package.json version
cat package.json | grep version

# Or via npm
npm list dynamic-skill-creator
```

---

## Uninstalling

### Remove Global Link

```bash
cd /path/to/gsd-skill-creator
npm unlink -g dynamic-skill-creator
# Or just: npm unlink
```

### Remove from Project

```bash
# If installed as dependency
npm uninstall dynamic-skill-creator

# Remove from package.json (if manually added)
# Edit package.json and remove the entry
```

### Remove Created Data (Optional)

```bash
# Remove skill storage
rm -rf .claude/skills

# Remove pattern data
rm -rf .planning/patterns

# Remove generated agents
rm -rf .claude/agents

# Remove entire .claude directory (if empty)
rmdir .claude 2>/dev/null

# Remove entire .planning directory (if empty)
rmdir .planning 2>/dev/null
```

### Complete Removal

```bash
# Remove the cloned repository
rm -rf /path/to/gsd-skill-creator

# Clean npm cache (optional)
npm cache clean --force
```

---

## For Claude Code (AI Instructions)

This section provides instructions for Claude Code to install and use this tool autonomously.

### Automated Installation

```bash
# 1. Define installation location
SKILL_CREATOR_PATH="$HOME/tools/gsd-skill-creator"

# 2. Clone repository
git clone <repository-url> "$SKILL_CREATOR_PATH"

# 3. Install and build
cd "$SKILL_CREATOR_PATH"
npm install
npm run build

# 4. Verify installation
npm test

# 5. Create alias for easy access
alias skill-creator="node $SKILL_CREATOR_PATH/dist/cli.js"
```

### Using in Any Project

```bash
# Set the path (adjust as needed)
SKILL_CREATOR="node $HOME/tools/gsd-skill-creator/dist/cli.js"

# Initialize project directories
mkdir -p .claude/skills .planning/patterns .claude/agents

# Run commands
$SKILL_CREATOR help
$SKILL_CREATOR list
$SKILL_CREATOR suggest
$SKILL_CREATOR create
$SKILL_CREATOR status
$SKILL_CREATOR agents list
```

### Creating a Skill Programmatically

```bash
# Create skill directory
mkdir -p .claude/skills/my-skill

# Write skill file
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: Description of what this skill does
triggers:
  intents:
    - "keyword1"
    - "keyword2"
  files:
    - "*.ts"
  contexts:
    - "context1"
  threshold: 0.5
enabled: true
---

## Skill Content

Instructions and knowledge for this skill...
EOF

# Verify
$SKILL_CREATOR list
```

### Checking for Suggestions

```bash
# Analyze patterns (non-interactive)
$SKILL_CREATOR suggestions

# Get pending count
$SKILL_CREATOR suggestions list

# Review interactively
$SKILL_CREATOR suggest
```

### Error Recovery

If installation fails:

```bash
# Clean and retry
cd "$SKILL_CREATOR_PATH"
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

## Support

If you encounter issues:

1. **Check this troubleshooting section** for common problems
2. **Run `npm test`** to verify installation integrity
3. **Check the [README.md](README.md)** for usage information
4. **Review error messages** carefully - they often indicate the solution
5. **Open an issue** on the repository with:
   - Your Node.js version (`node --version`)
   - Your npm version (`npm --version`)
   - Your operating system
   - The full error message
   - Steps to reproduce
