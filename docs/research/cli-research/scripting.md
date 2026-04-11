# Shell Scripting: The Art and Craft of Writing Shell Scripts

> PNW Research Series | CLI Systems | tibsfox.com
> April 2026

Shell scripting is the connective tissue of Unix. It is not a language designed by committee or birthed from academic theory. It grew from operators who needed to automate their work, from the same impulse that produces jigs in a woodshop or macros on a factory floor. The Bourne shell appeared in 1979. Nearly fifty years later, the fundamental model has not changed: read a line, parse it, execute it, read the next line. Every CI pipeline, every container entrypoint, every `configure` script -- they all speak this language or a dialect of it.

This document covers shell scripting as practiced on modern Unix systems (Linux, macOS, BSDs), with emphasis on Bash 5.x and POSIX sh. It is not a tutorial for beginners. It is a reference for practitioners who want to understand the machinery beneath the surface.

---

## 1. Execution Model

### The Shebang

The first two bytes `#!` tell the kernel which interpreter to use. The kernel reads the rest of the first line as a path:

```bash
#!/bin/bash              # absolute path
#!/usr/bin/env bash      # searches $PATH -- more portable
```

The `env` form accommodates systems where bash lives in `/usr/local/bin` (FreeBSD, older macOS). But on some systems `env` does not support multiple arguments, so `#!/usr/bin/env bash -e` may fail. The shebang is processed by the kernel's `binfmt` handler, not by the shell itself.

### fork/exec

Every external command runs through the fork/exec cycle: the shell calls `fork()` to create a child, the child calls `execve()` to replace itself with the new program, and the parent calls `waitpid()` to block until the child exits. Built-in commands (`cd`, `echo`, `read`, `export`, `test`) skip this entirely -- they run inside the shell process. Commands like `cd` *must* be builtins because they modify the shell's own state.

### Subshells

Parentheses create a subshell -- a forked copy of the current shell:

```bash
x=hello
(x=world; echo "$x")   # prints "world"
echo "$x"               # prints "hello" -- parent unchanged
```

Subshells inherit everything but changes do not propagate back. This is the single most common source of confusion. Pipelines create subshells too:

```bash
count=0
cat file.txt | while read -r line; do ((count++)); done
echo "$count"   # prints 0 in bash < 4.2 -- the while loop ran in a subshell
```

Fix with `shopt -s lastpipe` (Bash 4.2+), or avoid the pipe: `while read -r line; do ... done < file.txt`.

### source vs execution

`source script.sh` (or `. script.sh` in POSIX) runs the script in the current shell -- no fork, variables persist. This is how `.bashrc` and virtualenv `activate` work. Executing a script (`./script.sh`) runs it in a new process. Only exported environment variables cross the boundary.

### $SHELL vs /bin/sh

`$SHELL` is the user's login shell from `/etc/passwd`. It has nothing to do with which shell interprets the current script. A script with `#!/bin/sh` runs under whatever `/bin/sh` points to:

| System | /bin/sh | Notes |
|--------|---------|-------|
| Debian/Ubuntu | dash | Since 2006, for speed |
| RHEL/Fedora | bash | |
| macOS | bash 3.2 | Frozen at GPLv2 version |
| Alpine | busybox ash | Minimal POSIX |
| FreeBSD | ash derivative | |

---

## 2. Variables

Shell variables exist in two scopes. **Shell variables** are visible only to the current process. **Environment variables** (marked with `export`) are inherited by children via `execve()`. `readonly` prevents reassignment for the life of the shell.

**Indexed arrays** (Bash only, not POSIX):

```bash
fruits=(apple banana cherry)
echo "${fruits[0]}"       # apple
echo "${#fruits[@]}"      # 3 (count)
fruits+=(date)            # append
```

**Associative arrays** (Bash 4+): must be declared with `declare -A` before use. Forgetting this is a common bug -- Bash silently treats it as an indexed array.

```bash
declare -A colors
colors[sky]=blue
echo "${!colors[@]}"      # keys: sky
```

### Special Variables

| Variable | Meaning |
|----------|---------|
| `$?` | Exit status of last command (0-255) |
| `$$` | PID of current shell |
| `$!` | PID of last background job |
| `$@` | All positional parameters (individually quoted) |
| `$*` | All positional parameters (as one word when quoted) |
| `$#` | Number of positional parameters |
| `$0` | Name of the script |
| `$IFS` | Internal Field Separator (default: space, tab, newline) |
| `$LINENO` | Current line number |
| `$PIPESTATUS` | Array of exit statuses from last pipeline (Bash) |

The `$@` vs `$*` distinction only matters inside double quotes: `"$@"` preserves argument boundaries, `"$*"` joins them into one string.

---

## 3. Quoting

**Single quotes** preserve everything literally. No expansion, no escaping, no exceptions. You cannot embed a single quote inside single quotes -- use the `'\''` idiom (end string, escaped quote, start new string).

**Double quotes** allow `$variable`, `$(command)`, and `\` escapes for `$`, `` ` ``, `"`, `\`, and newline. Critically, they suppress word splitting and globbing:

```bash
file="my document.txt"
cat $file        # WRONG: tries to cat "my" and "document.txt"
cat "$file"      # correct
```

**$'...'** (ANSI-C quoting) interprets backslash escapes: `$'\t'` is a tab, `$'\n'` is a newline, `$'\x41'` is "A".

### Word Splitting and Globbing

After expansion, unquoted results undergo word splitting (on `$IFS` characters) then pathname expansion (`*`, `?`, `[...]`). Both are suppressed inside double quotes. This yields the single most important rule in shell scripting:

> **Always double-quote variable expansions unless you specifically need word splitting or globbing.**

### The eval Trap

`eval` re-parses its arguments as a shell command. It is the `goto` of shell scripting:

```bash
var="hello; rm -rf /"
eval echo "$var"        # executes: echo hello; rm -rf /
```

Modern Bash provides `declare -n` (namerefs, 4.3+) which eliminates most legitimate uses of eval.

---

## 4. Expansion Order

The shell processes each command through a fixed expansion sequence:

1. **Brace expansion:** `{a,b,c}` and `{1..10}`
2. **Tilde expansion:** `~` to `$HOME`
3. **Parameter/variable expansion:** `$var`, `${var:-default}`
4. **Command substitution:** `$(command)`
5. **Arithmetic expansion:** `$((expression))`
6. **Process substitution:** `<(command)`, `>(command)` (Bash)
7. **Word splitting:** on unquoted results of steps 3-5
8. **Pathname expansion (globbing)**
9. **Quote removal**

Key implication: brace expansion happens before variable expansion, so `{1..$n}` does not work. Command substitution results undergo word splitting unless quoted.

### Parameter Expansion Reference

```bash
file="/path/to/document.tar.gz"
${file##*/}        # document.tar.gz   (strip longest prefix matching */)
${file#*/}         # path/to/document.tar.gz   (strip shortest prefix)
${file%%.*}        # /path/to/document   (strip longest suffix)
${file%.*}         # /path/to/document.tar   (strip shortest suffix)
${file/tar/zip}    # first match substitution
${file//o/0}       # all matches
${name^}           # capitalize first char (Bash 4+)
${name^^}          # uppercase all
${name,,}          # lowercase all
${#name}           # string length
${name:0:5}        # substring
${var:-default}    # default if unset/empty
${var:=default}    # set AND default if unset/empty
${var:+alternate}  # alternate if set/non-empty
${var:?error msg}  # exit with error if unset/empty
```

Mnemonic for `#` vs `%`: on a US keyboard, `#` is left of `$` (strip from left), `%` is right (strip from right).

---

## 5. Redirections

Every process has three standard file descriptors: 0 (stdin), 1 (stdout), 2 (stderr).

```bash
command > file       # stdout to file (truncate)
command >> file      # stdout to file (append)
command < file       # stdin from file
command 2> file      # stderr to file
command > file 2>&1  # both to file (POSIX, order matters)
command &> file      # both to file (Bash shorthand)
```

**Order matters.** `2>&1 > file` sends stderr to the terminal and stdout to the file. `> file 2>&1` sends both to the file. The difference: redirections are processed left to right, and `2>&1` duplicates wherever fd 1 points *at that moment*.

### Arbitrary File Descriptors

```bash
exec 3> /tmp/logfile          # open fd 3 for writing
echo "logged" >&3
exec 3>&-                     # close fd 3
```

### Heredocs and Herestrings

```bash
cat <<EOF                     # heredoc: expansions happen
Hello, $USER. Today is $(date).
EOF

cat <<'EOF'                   # quoted delimiter: no expansion
Literal $USER and $(date)
EOF

cat <<-EOF                    # dash strips leading tabs
	indented
	EOF

read -r first rest <<< "hello world"   # herestring (Bash only)
```

### Process Substitution

Process substitution creates a temporary path connected to a command's I/O:

```bash
diff <(sort file1) <(sort file2)
tee >(gzip > archive.gz) >(wc -l > count.txt) < input.txt
```

Not POSIX -- available in Bash and Zsh only.

### /dev/tcp

Bash pseudo-devices for network connections (not actual filesystem entries):

```bash
(echo > /dev/tcp/localhost/8080) 2>/dev/null && echo "open" || echo "closed"
```

---

## 6. Pipes

### Pipeline Mechanics

All stages of a pipeline run concurrently. The kernel creates all pipe file descriptors and forks all processes before any start executing. `sort file | head -1` does not wait for sort to finish -- head reads as sort writes, and when head exits, sort receives SIGPIPE.

### Exit Status and pipefail

By default, a pipeline's exit status is the last command's. This hides failures:

```bash
false | true; echo $?    # 0 -- the failure is invisible
```

`PIPESTATUS` (Bash array) captures every stage. `set -o pipefail` makes the pipeline return the rightmost non-zero exit.

### Named Pipes (FIFOs)

```bash
mkfifo /tmp/myfifo
echo "hello" > /tmp/myfifo &     # blocks until reader opens
cat /tmp/myfifo                   # reads "hello"
rm /tmp/myfifo
```

FIFOs enable inter-process communication without temporary files.

---

## 7. Control Flow

### test, [, and [[

| Syntax | Type | Quoting | Glob/Regex | Portability |
|--------|------|---------|------------|-------------|
| `test expr` | External/builtin | Required | No | POSIX |
| `[ expr ]` | Alias for test | Required | No | POSIX |
| `[[ expr ]]` | Bash keyword | Optional | Yes (`==` glob, `=~` regex) | Bash/Zsh |

`[[` is a keyword, not a command -- no word splitting inside, `&&`/`||` work directly, and `=~` enables regex matching.

### Conditionals

```bash
if [[ -f "$file" ]]; then
    echo "regular file"
elif [[ -d "$file" ]]; then
    echo "directory"
fi

# Short-circuit (WARNING: not equivalent to if/else)
[[ -f "$file" ]] && echo "exists" || echo "missing"
```

### case

```bash
case "$answer" in
    [Yy]|[Yy]es) echo "Confirmed" ;;
    [Nn]|[Nn]o)  echo "Declined" ;;
    *)            echo "Invalid" ;;
esac
```

Bash 4.0 added `;;&` (fall-through with test) and `;&` (unconditional fall-through).

### Loops

```bash
for ((i=0; i<10; i++)); do echo "$i"; done          # C-style (Bash)
for file in *.txt; do process "$file"; done           # list
while IFS= read -r line; do echo "$line"; done < f   # line-by-line
until ping -c1 server &>/dev/null; do sleep 5; done  # retry

# select -- generates numbered menu
PS3="Choose: "
select item in apple banana quit; do
    [[ "$item" == quit ]] && break
    echo "You chose $item"
done
```

### Arithmetic

`(( ))` evaluates arithmetic. Variables inside do not need `$`:

```bash
((x += 5))
if ((x > 12)); then echo "big"; fi
```

Gotcha: `(( ))` returns exit status 1 when the expression is 0, which triggers `set -e`. Use `((x++)) || true` as a workaround.

---

## 8. Functions

### Declaration and Scope

```bash
myfunc() {          # POSIX form -- preferred
    local x=10      # dynamic scoping: visible to callees too
    echo "$x"
    return 0        # return exits function; exit kills the script
}
```

Bash has dynamic scoping, not lexical. A `local` variable is visible to any function called from within.

### trap and Signal Handling

```bash
trap 'rm -rf "$tmpdir"' EXIT      # cleanup on any exit
trap 'echo "Interrupted"; exit 130' INT    # handle Ctrl+C
trap '' HUP                        # ignore hangup
trap - INT                         # reset to default
```

The `EXIT` trap fires regardless of how the script exits -- normal, error, or signal. It is the single most important pattern for resource cleanup:

```bash
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
```

Key signals: INT (2, Ctrl+C), TERM (15, default kill), HUP (1, terminal hangup), PIPE (13, broken pipe), QUIT (3, Ctrl+\\). SIGKILL (9) and SIGSTOP (19) cannot be trapped.

---

## 9. Job Control

```bash
long_command &          # run in background
echo "PID: $!"          # last background PID
wait "$!"               # wait for specific job
wait                    # wait for all background jobs
wait -n                 # wait for any one job (Bash 4.3+)

jobs                    # list background jobs
fg %1                   # bring job 1 to foreground
bg %1                   # resume stopped job 1 in background
```

**nohup** runs a command immune to hangup signals. **disown** retroactively detaches a running job from the shell's job table. **setsid** creates a new session, fully detaching from the terminal -- the proper way to daemonize.

---

## 10. Process Management

### Lock Files with flock

The standard way to ensure single-instance execution:

```bash
exec 9>/var/lock/myscript.lock
if ! flock -n 9; then
    echo "Another instance is running"; exit 1
fi
# Lock auto-releases when the process exits (even on crash)
```

### PID Files

Traditional daemon tracking. Always verify with `kill -0 "$pid"` before trusting a PID file -- PIDs can be recycled.

### Parallel Execution

```bash
# xargs -P: simple parallelism
find . -name "*.jpg" -print0 | xargs -0 -P4 -I{} convert {} {}.png

# GNU Parallel: sophisticated job control
parallel -j4 --bar convert {} {.}.png ::: *.jpg

# Worker pool with wait -n
max_jobs=4
for file in *.dat; do
    while (( $(jobs -r | wc -l) >= max_jobs )); do wait -n; done
    process "$file" &
done
wait
```

---

## 11. Error Handling

### set -euo pipefail

The foundation of defensive scripting:

| Flag | Effect |
|------|--------|
| `-e` (errexit) | Exit on any command failure |
| `-u` (nounset) | Error on unset variable reference |
| `-o pipefail` | Pipeline fails if any stage fails |

**Gotchas with -e:** Commands in `if` conditions, `||`/`&&` chains, and negated commands (`!`) do not trigger errexit. The most insidious trap:

```bash
set -e
myfunc() {
    local result=$(failing_command)   # local succeeds, masking the failure
    echo "still running"             # this executes
}
# Fix: separate declaration and assignment
myfunc() {
    local result
    result=$(failing_command)         # now the failure is visible
}
```

### trap ERR

```bash
trap 'echo "Error on line $LINENO: $BASH_COMMAND exited $?" >&2' ERR
```

### ShellCheck

The essential static analyzer. Common warnings:

| Code | Issue |
|------|-------|
| SC2086 | Double quote to prevent globbing/splitting |
| SC2046 | Quote this to prevent word splitting |
| SC2155 | Declare and assign separately to avoid masking return status |
| SC2006 | Use `$(...)` instead of backticks |

### Defensive Patterns

```bash
tmpdir=$(mktemp -d) || exit 1
trap 'rm -rf "$tmpdir"' EXIT

[[ $# -ge 1 ]] || { echo "Usage: $0 <file>" >&2; exit 1; }
[[ -f "$1" ]]   || { echo "Error: $1 not found" >&2; exit 1; }

: "${TIMEOUT:=30}"                    # default value
rm -f "${file:?variable is empty}"    # refuse if empty
```

---

## 12. Text Processing in Shell

### printf

More reliable than `echo` for formatted output:

```bash
printf "Name: %-20s Age: %3d\n" "Alice" 30
printf -v result "%.2f" 3.14159     # store in variable, no subshell
printf '%s\n' "${array[@]}"         # print array, one per line
printf '%q ' rm "file with spaces"  # shell-escaped output
```

### read

```bash
IFS=: read -r user _ uid gid _ home shell < <(getent passwd root)
IFS=, read -ra fields <<< "one,two,three"
read -rp "Continue? [y/N] " -t 10 answer
read -rs -p "Password: " password; echo
```

### mapfile / readarray

Reads lines into an array without a loop (Bash 4+):

```bash
mapfile -t lines < file.txt
echo "Line count: ${#lines[@]}"
mapfile -t pids < <(pgrep -f myprocess)
```

---

## 13. Portability

### POSIX vs Bashisms

| Feature | Bash | POSIX sh |
|---------|------|----------|
| `[[ ]]` | Yes | No |
| Arrays | Yes | No |
| `<<<` herestring | Yes | No |
| `<()` process sub | Yes | No |
| `=~` regex | Yes | No |
| `${var,,}` case | Yes | No |
| `pipefail` | Yes | Not required |
| `local` | Yes | Not guaranteed |
| `function f { }` | Yes | No -- use `f() { }` |
| `source` | Yes | No -- use `.` |

**The rule:** if your shebang says `/bin/sh`, write POSIX. If you need Bash, say `#!/bin/bash`.

### Portable Alternatives

```bash
# Bashism: [[ "$str" == *.txt ]]
# POSIX:
case "$str" in *.txt) true ;; *) false ;; esac

# Bashism: arrays
# POSIX: positional parameters (limited to one "array")
set -- *.txt

# Bashism: $'\t'
# POSIX:
printf '\t'
```

### BusyBox

The default shell in Alpine containers and embedded systems. Roughly POSIX-compliant ash, but many utilities have reduced options versus GNU coreutils (no long options, limited `sed -i`, limited `find -exec`).

### Autoconf / configure

Generated configure scripts target the lowest common denominator of Bourne shells. They avoid even `$()` substitution, using backticks. They are unreadable by design -- generated, not hand-written. If you need maximally portable shell, the Autoconf manual's "Portable Shell Programming" chapter catalogs every shell incompatibility discovered over 30 years.

---

## 14. Security

### Command Injection

The most dangerous pattern:

```bash
filename="$1"
eval "cat $filename"        # if $1 is "; rm -rf /" -- disaster
cat -- "$filename"          # safe: -- ends options, quotes prevent splitting
```

Any time user input reaches `eval`, backticks, `$(...)`, or unquoted expansion, you have a command injection vulnerability.

### PATH Manipulation

```bash
export PATH="/usr/local/bin:/usr/bin:/bin"   # known-safe PATH
```

Without this, an attacker who controls a directory early in PATH can substitute malicious versions of commands.

### Tainted Input

Never trust command-line arguments, environment variables, file contents, or filenames. Filenames can contain spaces, newlines, glob characters, and leading dashes:

```bash
# WRONG: breaks on spaces, *, or leading -
for f in $(ls); do rm $f; done

# RIGHT:
for f in ./*; do [[ -f "$f" ]] && rm -- "$f"; done

# For find:
find . -name "*.tmp" -print0 | xargs -0 rm --
```

The leading-dash hazard: a file named `-rf` causes `rm *` to expand to `rm -rf (other files)`. Using `./*` or `--` prevents this.

### SUID Scripts

Most kernels ignore SUID on interpreted scripts due to a TOCTOU race between the kernel reading the shebang and the interpreter opening the file. Use a compiled wrapper or sudo instead.

### Restricted Shells

`rbash` disables `cd`, PATH modification, output redirection, commands with `/`, and `exec`. It is a containment mechanism, not a security boundary -- escape techniques exist. Use real sandboxing (containers, seccomp) for isolation.

---

## 15. Performance

### When Shell is Fast Enough

Shell is appropriate when you are orchestrating other programs, processing hundreds to low thousands of lines, or when the bottleneck is I/O. It is too slow for millions of lines in pure shell, math-heavy computation, or tight loops spawning external commands.

### Avoiding Subshells

Every `$(...)` forks a process. In a loop, this is devastating:

```bash
# SLOW: forks wc per file
for f in *.txt; do lines=$(wc -l < "$f"); echo "$f: $lines"; done

# FAST: one awk call
awk '{c[FILENAME]++} END {for(f in c) print f": "c[f]}' *.txt
```

### Use Builtins

```bash
# External (fork):              Builtin (no fork):
result=$(basename "$path")      result="${path##*/}"
result=$(dirname "$path")       result="${path%/*}"
length=$(echo -n "$s" | wc -c)  length=${#s}
echo "$s" | tr A-Z a-z          echo "${s,,}"
```

### Batch Operations

```bash
# SLOW: N spawns             FAST: 1 spawn
for f in *.txt; do           grep -l "pat" *.txt
  grep -l "pat" "$f"
done
```

---

## 16. The One-Liner Tradition

The Unix one-liner is shell scripting distilled to its purest form: a single pipeline composed at the terminal, solving a problem in one shot.

### Pipes as Composition

```bash
# Unique HTTP status codes from access log, ranked by frequency:
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# Top 10 largest files:
find . -type f -exec stat --format='%s %n' {} + | sort -rn | head -10

# Replace across files:
grep -rl 'old' src/ | xargs sed -i 's/old/new/g'

# Git: most-edited files
git log --name-only --pretty=format: | sed '/^$/d' | sort | uniq -c | sort -rn | head -10
```

### AWK One-Liners

AWK is the secret weapon of the one-liner tradition:

```bash
awk '{sum += $3} END {print sum}' data.txt           # sum a column
awk '$2 > 100' data.txt                               # filter rows
awk '{s[$1]+=$2} END {for(k in s) print k,s[k]}' f   # group-by sum
awk '!seen[$0]++' file.txt                             # deduplicate, preserving order
```

The `!seen[$0]++` idiom: `seen[$0]` starts at 0 (falsy). The `++` is post-increment, so the first occurrence returns 0, negated to true (print). Subsequent occurrences return positive, negated to false (skip).

### Perl One-Liners

```bash
perl -pi.bak -e 's/foo/bar/g' file.txt                # in-place replace
perl -nle 'print $1 while /href="(https?:\/\/[^"]+)"/g' page.html  # extract URLs
```

### sed Essentials

```bash
sed '/^$/d' file.txt                   # delete blank lines
sed -n '/START/,/END/p' file.txt       # print between patterns
sed '/context/s/old/new/g' file.txt    # replace only on matching lines
```

### Shell Golf

Impractical but educational -- minimizing character count:

```bash
# FizzBuzz:
for i in {1..100};do((i%15==0))&&echo FizzBuzz||((i%3==0))&&echo Fizz||((i%5==0))&&echo Buzz||echo $i;done

# File extension statistics:
find . -type f | rev | cut -d. -f1 | rev | sort | uniq -c | sort -rn | head
```

### Buffering in Pipelines

When composing long pipelines for log monitoring, buffering becomes critical:

```bash
tail -F /var/log/app.log | \
    grep --line-buffered 'ERROR' | \
    awk '!seen[$2]++ {print; fflush()}' | \
    while IFS= read -r line; do notify-send "Error" "$line"; done
```

The `--line-buffered` on grep and `fflush()` in awk prevent stdio from buffering 4KB before forwarding data through the pipe. Without them, your "real-time" monitor has multi-second delays.

---

## Appendix: Production Script Template

```bash
#!/bin/bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
VERBOSE=0

TMPDIR=$(mktemp -d "${TMPDIR:-/tmp}/${SCRIPT_NAME}.XXXXXX")
trap 'rm -rf "$TMPDIR"' EXIT

usage() { cat <<EOF
Usage: $SCRIPT_NAME [options] <argument>
  -v, --verbose    Increase verbosity
  -n, --dry-run    Show what would be done
  -h, --help       Show this help
EOF
}

log() {
    local level="$1"; shift
    [[ "$level" == "DEBUG" && "$VERBOSE" -eq 0 ]] && return
    printf '[%s] [%s] %s\n' "$(date +%H:%M:%S)" "$level" "$*" >&2
}

die() { log ERROR "$@"; exit 1; }

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -v|--verbose) VERBOSE=1 ;;
            -n|--dry-run) DRY_RUN=1 ;;
            -h|--help) usage; exit 0 ;;
            --) shift; break ;;
            -*) die "Unknown option: $1" ;;
            *) break ;;
        esac
        shift
    done
    [[ $# -ge 1 ]] || { usage; die "Missing required argument"; }
    readonly TARGET="$1"
}

main() {
    parse_args "$@"
    log INFO "Starting $SCRIPT_NAME with target: $TARGET"
    # ... work ...
    log INFO "Done"
}

main "$@"
```

---

## Further Reading

- **Greg's Wiki** (mywiki.wooledge.org) -- BashFAQ, BashPitfalls, BashGuide. The highest-quality community resource.
- **ShellCheck** (shellcheck.net) -- static analysis. Integrate into CI and editors.
- **POSIX Shell Command Language** -- the normative standard.
- **The Unix Programming Environment** by Kernighan and Pike (1984) -- the original philosophy.
- **Classic Shell Scripting** by Robbins and Beebe (O'Reilly) -- the pragmatist's reference.

---

*Shell scripting is not glamorous work. It does not get conference talks or venture capital. But it is the substrate on which everything else runs. Every Docker container starts with a shell script. Every CI pipeline is a shell script wearing a YAML costume. Every system administrator's muscle memory is shell. The craft deserves respect, and respect means understanding the machinery -- not just copying Stack Overflow answers until the tests pass.*
