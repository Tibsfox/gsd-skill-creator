# Bash 3.2 Compatibility Checklist

## Why This Matters

macOS ships Bash 3.2.57 (2014) due to Apple's refusal to adopt GPLv3-licensed software. Bash 4.0+ is licensed under GPLv3, so Apple will never update the system Bash. Every shell script in this project must work under `/bin/bash` on macOS — assuming Bash 4.0+ availability breaks macOS users silently.

## Features Unavailable in Bash 3.2

| Feature | Min Bash | POSIX Alternative | Example |
|---------|----------|-------------------|---------|
| `declare -A` (associative arrays) | 4.0 | Separate key/value arrays or temp files | `keys="a b c"; vals="1 2 3"` |
| `[[ ]]` extended test (regex `=~`) | 4.0 (regex features) | `[ ]` with proper quoting, or `grep -E` | `[ "$var" = "value" ]` |
| `${var,,}` lowercase | 4.0 | `echo "$var" \| tr '[:upper:]' '[:lower:]'` | |
| `${var^^}` uppercase | 4.0 | `echo "$var" \| tr '[:lower:]' '[:upper:]'` | |
| `readarray`/`mapfile` | 4.0 | `while IFS= read -r line; do arr+=("$line"); done` | |
| `\|&` pipe stderr | 4.0 | `2>&1 \|` | |
| `grep -P` (Perl regex) | N/A (GNU grep) | `grep -E` or `awk` | |
| `<()` process substitution | 3.0+ (but fragile) | Temp files | |
| Namerefs (`declare -n`) | 4.3 | Pass variable name, use `eval` carefully | |
| `coproc` | 4.0 | Named pipes (`mkfifo`) | |

## Quick Self-Check

Before committing any `.sh` file, verify:

1. No `declare -A` anywhere
2. No `${var,,}` or `${var^^}` parameter expansion
3. No `readarray` or `mapfile`
4. No `|&` pipe syntax
5. No `grep -P` flags
6. Run `shellcheck` if available
7. Test with `bash --posix` where practical
