# Troubleshooting

Centralized troubleshooting for common issues with skill-creator. Each issue follows the Symptom/Cause/Solution format for quick resolution.

**Navigation:** [Getting Started](GETTING-STARTED.md) | [CLI Reference](CLI.md) | [Workflows](WORKFLOWS.md)

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Skill Creation Issues](#skill-creation-issues)
- [Testing Issues](#testing-issues)
- [Conflict Detection Issues](#conflict-detection-issues)
- [Team Issues](#team-issues)
- [CI/CD Issues](#cicd-issues)
- [Still Stuck?](#still-stuck)

---

## Installation Issues

### Command not found: skill-creator

**Symptom:** Running `skill-creator` returns "command not found" or "not recognized".

**Cause:** Global link not in PATH or npm link not executed.

**Solution:**

1. Verify npm global bin is in PATH:
   ```bash
   npm bin -g
   # Note the path, e.g., /usr/local/bin

   echo $PATH | grep -o "$(npm bin -g)"
   # Should show the path
   ```

2. If not in PATH, add it:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$PATH:$(npm bin -g)"
   source ~/.bashrc  # or source ~/.zshrc
   ```

3. Re-run npm link:
   ```bash
   cd /path/to/gsd-skill-creator
   npm link
   ```

**Alternative:** Run directly without linking:
```bash
node /path/to/gsd-skill-creator/dist/cli.js help
```

For detailed installation steps, see [Installation Guide](../INSTALL.md#troubleshooting).

---

### Cannot find module errors

**Symptom:** Running any command returns "Cannot find module" or "MODULE_NOT_FOUND".

**Cause:** Project not built or build is outdated.

**Solution:**

```bash
cd /path/to/gsd-skill-creator
npm install
npm run build
```

Verify build exists:
```bash
ls dist/cli.js
```

---

### Permission errors during npm link

**Symptom:** `npm link` fails with EACCES or permission denied.

**Cause:** npm global directory has incorrect permissions.

**Solution:**

```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH="$PATH:$HOME/.npm-global/bin"' >> ~/.bashrc
source ~/.bashrc

# Re-link
cd /path/to/gsd-skill-creator
npm unlink 2>/dev/null
npm link
```

---

### Node version incompatibility

**Symptom:** Build fails with syntax errors or TypeScript compilation errors.

**Cause:** Node.js version below 18.

**Solution:**

Check your version:
```bash
node --version
```

If below v18, upgrade Node.js. See [Installation Guide](../INSTALL.md#prerequisites) for installation instructions.

---

## Skill Creation Issues

### Skill not activating

**Symptom:** Skill exists but doesn't activate when expected.

**Cause:** Description lacks activation triggers or is too generic.

**Solution:**

1. Check activation score:
   ```bash
   skill-creator score-activation my-skill --verbose
   ```

2. If score is below 70, improve the description:
   - Add "Use when..." pattern
   - Include specific keywords users mention
   - Add file patterns if applicable

   **Before:**
   ```
   Helps with git commits
   ```

   **After:**
   ```
   Generates conventional commit messages. Use when committing changes,
   writing commit messages, or when user mentions 'commit', 'conventional
   commits', or asks about commit message format.
   ```

3. Verify with simulation:
   ```bash
   skill-creator simulate "your test prompt" --verbose
   ```

---

### Validation failures

**Symptom:** `skill-creator validate` fails with errors.

**Cause:** Skill format doesn't match official specification.

**Solution by error type:**

| Error | Fix |
|-------|-----|
| Name must be lowercase | Rename to lowercase with hyphens: `my-skill` |
| Invalid characters in name | Use only lowercase letters, numbers, hyphens |
| Reserved name | Choose a different name (see [CLI: sync-reserved](CLI.md#sync-reserved)) |
| Directory structure invalid | Move `SKILL.md` to `skill-name/SKILL.md` subdirectory |
| Metadata schema invalid | Check YAML frontmatter for syntax errors |
| Directory/name mismatch | Ensure directory name matches `name:` in frontmatter |

Run validation with specific skill to see detailed errors:
```bash
skill-creator validate my-skill
```

---

### Reserved name conflict

**Symptom:** Validation fails with "Name is reserved".

**Cause:** Skill name conflicts with Claude Code built-in commands.

**Solution:**

1. Check reserved names:
   ```bash
   skill-creator sync-reserved
   ```

2. Choose a different name. Suggested alternatives are shown in the error message.

   **Reserved:** `init`, `help`, `config`, `clear`

   **Alternatives:** `my-init`, `project-init`, `custom-init`

---

## Testing Issues

### Tests not generating

**Symptom:** `skill-creator test generate` produces no tests or fails.

**Cause:** Missing skill description or API key issues.

**Solution:**

1. Ensure skill has a description:
   ```bash
   skill-creator list
   # Check that your skill shows a description
   ```

2. For LLM-powered generation, set API key:
   ```bash
   export ANTHROPIC_API_KEY=your-key
   ```

3. Use heuristic generation as fallback:
   ```bash
   skill-creator test generate my-skill --no-llm
   ```

---

### High false positive rate

**Symptom:** Skill activates for unrelated prompts.

**Cause:** Description too generic or overlapping with other skills.

**Solution:**

1. Check for conflicts:
   ```bash
   skill-creator detect-conflicts
   ```

2. Make description more specific:
   - Add unique keywords
   - Narrow the scope
   - Specify what it does NOT do

3. Add negative test cases:
   ```bash
   skill-creator test add my-skill \
     --prompt="unrelated prompt here" \
     --expected=negative \
     --reason="Not related to skill purpose"
   ```

---

### High false negative rate

**Symptom:** Skill doesn't activate when it should.

**Cause:** Activation threshold too high or description missing key triggers.

**Solution:**

1. Check current threshold:
   ```bash
   skill-creator calibrate --preview
   ```

2. Lower threshold if appropriate:
   ```bash
   skill-creator test run my-skill --threshold=0.70
   ```

3. Add activation triggers to description:
   - "Use when..."
   - "Activate when user mentions..."
   - Specific keywords and phrases

---

### Calibration data insufficient

**Symptom:** `skill-creator calibrate` fails with "insufficient data".

**Cause:** Fewer than 75 calibration events recorded.

**Solution:**

Continue using skills normally. Events are recorded automatically when:
- Skills activate and you continue working
- Skills activate and you correct the behavior

Check current event count:
```bash
skill-creator benchmark
# Shows "Data points: N"
```

---

## Conflict Detection Issues

### Embedding model fallback

**Symptom:** Conflict detection shows "Using heuristic (fallback)".

**Cause:** HuggingFace model failed to load (network or memory issues).

**Solution:**

1. Check embedding status:
   ```bash
   skill-creator reload-embeddings --verbose
   ```

2. Attempt to reload:
   ```bash
   skill-creator reload-embeddings
   ```

3. If still failing:
   - Check network connectivity
   - Ensure sufficient memory (~500MB for model)
   - Heuristic mode still works but may be less accurate

---

### High conflict scores for unrelated skills

**Symptom:** Skills flagged as conflicting but they're clearly different.

**Cause:** Threshold too sensitive or descriptions share common words.

**Solution:**

1. Increase threshold:
   ```bash
   skill-creator detect-conflicts --threshold=0.90
   ```

2. Check the overlapping terms in output - if they're common words like "use", "when", "help", consider making descriptions more specific.

3. Verify with verbose output:
   ```bash
   skill-creator detect-conflicts --verbose
   ```

---

## Team Issues

### Missing agent files after team creation

**Symptom:** `skill-creator team spawn` reports missing agent files, or `skill-creator team status` shows spawn readiness as "not ready".

**Cause:** Agent files were not generated during team creation, or were deleted/moved after creation.

**Solution:**

1. Check which files are missing:
   ```bash
   skill-creator team spawn my-team
   ```
   The output lists each missing agent file path.

2. Regenerate agent files:
   ```bash
   skill-creator team create --name=my-team --pattern=leader-worker
   ```
   Re-running creation with the same name regenerates agent files.

3. Verify files exist:
   ```bash
   skill-creator team status my-team
   ```
   Spawn readiness should now show "ready".

---

### Invalid topology errors during validation

**Symptom:** `skill-creator team validate` fails with topology-related errors such as "missing leader", "invalid pipeline order", or "cycle detected".

**Cause:** Team configuration does not satisfy the rules for the chosen topology pattern.

**Solution by topology:**

| Topology | Common Error | Fix |
|----------|-------------|-----|
| leader-worker | No leader agent | Ensure one member has `agentType: "orchestrator"` or `"coordinator"` |
| leader-worker | Multiple leaders | Only one member should be the leader; set others to `"worker"` |
| pipeline | Cycle detected | Remove circular `dependsOn` references between members |
| pipeline | Missing stage | Ensure all pipeline stages are defined with correct ordering |
| swarm | No coordinator | Swarm topologies still require one coordinating agent |

Review your team configuration:
```bash
skill-creator team status my-team
```

Fix the configuration and re-validate:
```bash
skill-creator team validate my-team
```

See [GSD Teams Guide](GSD-TEAMS.md) for topology selection guidance.

---

### Team not found

**Symptom:** `skill-creator team validate my-team` or `skill-creator team status my-team` returns "Team not found" or "No team with name my-team".

**Cause:** Team name misspelled, team created in a different scope (user vs project), or team configuration file missing.

**Solution:**

1. List all available teams:
   ```bash
   skill-creator team list
   ```
   Check that your team appears in the output.

2. Check both scopes:
   ```bash
   skill-creator team list
   ```
   Teams may exist at user level (`~/.claude/teams/`) or project level (`.claude/teams/`).

3. If the team is missing entirely, recreate it:
   ```bash
   skill-creator team create
   ```

4. Verify the team name matches exactly (lowercase, hyphens only):
   ```bash
   # Correct
   skill-creator team status my-research-team

   # Wrong (spaces, uppercase)
   skill-creator team status "My Research Team"
   ```

---

## CI/CD Issues

### JSON output not working

**Symptom:** Command outputs human-readable text instead of JSON.

**Cause:** Missing `--json` flag or `CI` environment variable.

**Solution:**

Explicitly enable JSON output:
```bash
skill-creator detect-conflicts --json
skill-creator test run --all --json
```

Or set CI environment:
```bash
export CI=true
skill-creator test run --all
# Auto-detects CI and outputs JSON
```

---

### Exit codes not propagating

**Symptom:** CI pipeline passes even when skills fail validation.

**Cause:** Command exit codes not checked.

**Solution:**

Use `set -e` in scripts or check exit codes explicitly:

```bash
set -e
skill-creator validate --all
skill-creator detect-conflicts
skill-creator test run --all --min-accuracy=90
```

Or check explicitly:
```bash
skill-creator validate --all || exit 1
```

---

### GitHub Actions setup issues

**Symptom:** GitHub Actions workflow fails to run skill-creator.

**Cause:** Missing Node.js setup or installation step.

**Solution:**

Ensure your workflow includes:

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'

  - name: Install skill-creator
    run: |
      cd path/to/gsd-skill-creator
      npm install
      npm run build
      npm link

  - name: Validate skills
    run: skill-creator validate --all
```

For a complete working example, see [CLI: CI Integration](CLI.md#ci-integration).

---

## Still Stuck?

### Check the documentation

1. [Installation Guide](../INSTALL.md) - Detailed installation and setup
2. [CLI Reference](CLI.md) - Complete command documentation
3. [API Reference](API.md) - Programmatic usage

### Run diagnostics

```bash
# Check versions
node --version
npm --version
skill-creator --version

# Verify installation
npm test  # in gsd-skill-creator directory

# Check skill status
skill-creator list
skill-creator status
```

### Report a bug

If you've tried the solutions above and still have issues:

1. Check [existing issues](https://github.com/anthropics/skill-creator/issues)

2. Create a new issue with:
   - **skill-creator version:** `skill-creator --version`
   - **Node.js version:** `node --version`
   - **Operating system:** (e.g., macOS 14, Ubuntu 22.04, Windows 11)
   - **Full error message:** Copy the complete error output
   - **Steps to reproduce:** Exact commands that trigger the issue
   - **Expected behavior:** What should happen
   - **Actual behavior:** What actually happens

### Community support

- Check the README for additional resources
- Review the [Architecture docs](architecture/README.md) for understanding system behavior
- Look at [example skills](../examples/) for working patterns

---

*Troubleshooting Guide for Dynamic Skill Creator*
