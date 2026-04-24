# Git hooks

Tracked pre-commit / pre-push guards for this repository.

## pre-commit — `www/tibsfox/com/` guard

Blocks any commit that stages paths under `www/tibsfox/com/`. That tree is
gitignored; content there is regenerable and synced to tibsfox.com via
`sync-research-to-live.sh`, not from the repo. Force-adds bypassing the
ignore rule have leaked content twice before (untracked 2026-04-17, history
scrubbed 2026-04-24).

### One-time install

From the repo root:

```bash
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Or, if you prefer a symlinked install that auto-updates when the tracked
script changes:

```bash
ln -sf ../../scripts/git-hooks/pre-commit .git/hooks/pre-commit
```

### Override (emergency)

If you genuinely need to commit something under `www/tibsfox/com/`:

```bash
ALLOW_WWW_COMMIT=1 git commit ...
```

Use sparingly; prefer extending the ignore rule or relocating the content.
