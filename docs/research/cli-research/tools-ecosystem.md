# The Unix Command-Line Toolkit

**PNW Research Series -- tibsfox.com**
*A deep reference on the tools that make the CLI the most powerful interface ever built.*

---

## Table of Contents

1. [The Core Philosophy](#the-core-philosophy)
2. [Composition: Pipes, Filters, and Streams](#composition-pipes-filters-and-streams)
3. [grep -- Pattern Matching](#grep--pattern-matching)
4. [sed -- The Stream Editor](#sed--the-stream-editor)
5. [awk -- Pattern-Action Processing](#awk--pattern-action-processing)
6. [find -- Filesystem Traversal](#find--filesystem-traversal)
7. [Text Field Tools: sort, uniq, cut, tr, paste, join](#text-field-tools)
8. [xargs -- Building Commands from stdin](#xargs--building-commands-from-stdin)
9. [diff and patch -- Change Management](#diff-and-patch--change-management)
10. [Archives and Compression](#archives-and-compression)
11. [curl and wget -- HTTP from the Terminal](#curl-and-wget--http-from-the-terminal)
12. [Process Management: ps, top, kill](#process-management)
13. [Debugging and Introspection: lsof, strace, ltrace](#debugging-and-introspection)
14. [Network Diagnostics: ss, dig, nslookup](#network-diagnostics)
15. [Scheduling: cron, at, systemd timers](#scheduling)
16. [The Rust Rewrite Wave](#the-rust-rewrite-wave)
17. [jq and yq -- Structured Data on the CLI](#jq-and-yq--structured-data-on-the-cli)
18. [fzf -- Fuzzy Finding](#fzf--fuzzy-finding)
19. [tmux and screen -- Terminal Multiplexing](#tmux-and-screen--terminal-multiplexing)
20. [Real-World Pipeline Examples](#real-world-pipeline-examples)
21. [When Pipes Break Down](#when-pipes-break-down)

---

## The Core Philosophy

### "Do One Thing Well"

The Unix philosophy was never written as a formal doctrine. It emerged from practice
at Bell Labs in the 1970s, crystallized by the people who built the system. Doug
McIlroy, the inventor of Unix pipes, summarized it most concisely:

> This is the Unix philosophy: Write programs that do one thing and do it well.
> Write programs to work together. Write programs to handle text streams, because
> that is a universal interface.

Three sentences. Fifty years of software design compressed into three sentences.

The key insight is that **text is the universal interface**. When every program
reads text from stdin and writes text to stdout, any program can talk to any other
program. No shared libraries. No API versioning. No serialization frameworks. Just
lines of text flowing through pipes.

This is why a tool written in 1975 can interoperate with a tool written in 2025.
`grep` does not care whether the text it receives was produced by `cat`, `curl`,
a Python script, or a Rust binary. Text is text. Lines are lines. Fields are fields.

### The Small Tools Model

Each classic Unix tool is small enough to fit in your head:

- `cat` concatenates files
- `head` shows the first N lines
- `tail` shows the last N lines
- `wc` counts lines, words, and bytes
- `tee` duplicates a stream
- `yes` prints a string forever

None of these are impressive alone. Their power comes from composition. A pipeline
of five trivial tools can accomplish what would take hundreds of lines of code in
a general-purpose language. And the pipeline is readable, testable, and modifiable
without a compiler.

### Ken Thompson's Corollary

Ken Thompson, co-creator of Unix, added a pragmatic edge:

> When in doubt, use brute force.

This is not anti-intellectual. It means: a pipeline that processes a 2 GB log file
line by line in 30 seconds is better than an elegant solution that takes a week to
write and runs in 3 seconds. The tools are fast enough. The human's time is the
bottleneck.

---

## Composition: Pipes, Filters, and Streams

### The Pipe Operator

The `|` character is the most important operator in the shell. It connects the
stdout of one process to the stdin of the next:

```bash
# Count unique IP addresses in an access log
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

Each stage does one thing:
1. `cat` reads the file (or you could redirect: `< access.log`)
2. `awk` extracts the first field (the IP address)
3. `sort` orders the IPs alphabetically (required for `uniq`)
4. `uniq -c` collapses duplicates and prefixes each line with a count
5. `sort -rn` sorts numerically in reverse (highest count first)
6. `head -20` shows only the top 20

Six tools. One line. No temporary files.

### Filters

A **filter** is any program that reads from stdin and writes to stdout. Most Unix
tools are filters by default. This is a design pattern, not a language feature:

```bash
# A filter in any language works the same way
python3 -c "import sys; [print(line.upper(), end='') for line in sys.stdin]"
```

That one-liner is a valid Unix filter. Pipe text in, get text out.

### tee -- Stream Duplication

`tee` writes its input to both stdout and one or more files. It lets you inspect
a pipeline mid-stream without breaking it:

```bash
# Save intermediate results while the pipeline continues
cat server.log | grep "ERROR" | tee errors.txt | wc -l
```

This prints the count of error lines to the terminal while simultaneously saving
all matching lines to `errors.txt`. The `-a` flag appends instead of overwriting:

```bash
cat server.log | grep "WARN" | tee -a warnings.txt | tail -5
```

### Process Substitution

Bash extends pipes with process substitution, which presents a command's output
as a file descriptor:

```bash
# Compare the output of two commands as if they were files
diff <(sort file1.txt) <(sort file2.txt)
```

This is invaluable when a tool expects filenames but you want to feed it
dynamically generated content.

### Here Documents and Here Strings

```bash
# Here document: multi-line input to a command
cat <<'EOF'
This text is passed to cat's stdin.
Variables are NOT expanded because of the quotes around EOF.
EOF

# Here string: single-line input
grep "pattern" <<< "search this string"
```

### Why Text Streams Beat APIs

APIs require:
- Shared libraries or SDKs
- Versioned schemas
- Network protocols
- Authentication
- Serialization/deserialization

Text streams require:
- Lines
- Fields separated by whitespace (or a delimiter)

That is why, decades into the API era, sysadmins still reach for pipes first.

---

## grep -- Pattern Matching

`grep` (Global Regular Expression Print) searches text for lines matching a
pattern. It is likely the most frequently used Unix tool after `cd` and `ls`.

### Basic Usage

```bash
# Search for a string in a file
grep "error" /var/log/syslog

# Case-insensitive search
grep -i "error" /var/log/syslog

# Show line numbers
grep -n "error" /var/log/syslog

# Show N lines of context around each match
grep -C 3 "error" /var/log/syslog     # 3 lines before and after
grep -B 2 "error" /var/log/syslog     # 2 lines before
grep -A 5 "error" /var/log/syslog     # 5 lines after
```

### Recursive Search

```bash
# Search all files under a directory
grep -r "TODO" src/

# Same, but only in .py files
grep -r --include="*.py" "TODO" src/

# Exclude directories
grep -r --exclude-dir=node_modules "import" .

# Show only filenames, not matching lines
grep -rl "deprecated" lib/
```

### Inversion and Counting

```bash
# Show lines that do NOT match
grep -v "DEBUG" application.log

# Count matching lines (don't print them)
grep -c "ERROR" application.log

# Count non-matching lines
grep -vc "200 OK" access.log
```

### Regular Expressions

Basic grep uses BRE (Basic Regular Expressions). Extended grep (`grep -E` or
`egrep`) uses ERE. Perl-compatible mode (`grep -P`) gives full PCRE:

```bash
# BRE: match lines starting with a date
grep "^2026-04" server.log

# ERE: match either "error" or "fatal"
grep -E "error|fatal" server.log

# ERE: match an IP address pattern
grep -E "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" access.log

# PCRE: lookahead -- lines containing "error" NOT followed by "handled"
grep -P "error(?!.*handled)" app.log

# PCRE: named capture groups (useful for extraction)
grep -oP "user=(?P<user>\w+)" auth.log
```

### Fixed Strings

When your search pattern contains special characters and you want a literal match:

```bash
# fgrep (or grep -F) treats the pattern as a fixed string
grep -F "user.name[0]" config.json
```

### Modern Alternatives

| Tool | Language | Key Advantage |
|------|----------|---------------|
| ripgrep (`rg`) | Rust | Fastest recursive search, respects .gitignore |
| The Silver Searcher (`ag`) | C | Fast, respects .gitignore, preceded ripgrep |
| ugrep (`ug`) | C++ | Drop-in grep replacement, structured output |

```bash
# ripgrep: search respecting .gitignore, colored output, smart case
rg "TODO" src/

# ripgrep: search only TypeScript files
rg -t ts "interface" src/

# ripgrep: search with PCRE2 (lookahead/lookbehind)
rg -P "(?<=fn )\w+" src/   # extract function names after "fn "

# ag: similar interface
ag "TODO" src/
ag --python "import os"    # search only Python files
```

Ripgrep is the default search engine inside VS Code. It consistently benchmarks
2-5x faster than GNU grep on large codebases because it parallelizes across
cores, skips binary files, and respects ignore rules by default.

---

## sed -- The Stream Editor

`sed` processes text line by line, applying transformations without opening a
text editor. It is the workhorse for automated text manipulation.

### Substitution

The `s` command is what most people know:

```bash
# Replace first occurrence on each line
sed 's/old/new/' file.txt

# Replace ALL occurrences on each line (global flag)
sed 's/old/new/g' file.txt

# Case-insensitive replacement (GNU extension)
sed 's/error/WARNING/gi' log.txt

# Use a different delimiter when the pattern contains slashes
sed 's|/usr/local/bin|/opt/bin|g' config.txt
```

### In-Place Editing

```bash
# Edit file in place (GNU sed)
sed -i 's/foo/bar/g' file.txt

# Edit in place with backup (works on both GNU and BSD/macOS sed)
sed -i.bak 's/foo/bar/g' file.txt
```

The `-i` flag is one of the most commonly used sed features, but be aware that
GNU sed and BSD sed handle it differently. GNU sed allows `-i` with no argument;
BSD sed requires `-i ''` for no backup.

### Addresses

Sed commands can be restricted to specific lines or patterns:

```bash
# Only line 5
sed '5s/old/new/' file.txt

# Lines 10 through 20
sed '10,20s/old/new/' file.txt

# Lines matching a pattern
sed '/^#/d' file.txt              # Delete comment lines
sed '/START/,/END/d' file.txt     # Delete between START and END (inclusive)

# From a pattern to end of file
sed '/BEGIN/,$s/old/new/g' file.txt
```

### Deletion, Insertion, and Append

```bash
# Delete lines 1 through 10
sed '1,10d' file.txt

# Delete blank lines
sed '/^$/d' file.txt

# Insert a line BEFORE line 3
sed '3i\This line is inserted before line 3' file.txt

# Append a line AFTER lines matching a pattern
sed '/\[section\]/a\key = value' config.ini
```

### The Hold Space

Sed has two buffers: the **pattern space** (current line) and the **hold space**
(scratch buffer). Commands that use the hold space enable multi-line operations:

| Command | Action |
|---------|--------|
| `h` | Copy pattern space to hold space |
| `H` | Append pattern space to hold space |
| `g` | Copy hold space to pattern space |
| `G` | Append hold space to pattern space |
| `x` | Exchange pattern and hold spaces |

```bash
# Reverse the order of lines in a file (classic sed trick)
sed -n '1!G;h;$p' file.txt

# Join every pair of lines
sed 'N;s/\n/ /' file.txt
```

### Practical One-Liners

```bash
# Remove trailing whitespace
sed 's/[[:space:]]*$//' file.txt

# Remove leading whitespace
sed 's/^[[:space:]]*//' file.txt

# Extract text between XML tags
sed -n 's/.*<title>\(.*\)<\/title>.*/\1/p' page.html

# Add line numbers (mimics nl)
sed = file.txt | sed 'N; s/\n/\t/'

# Convert DOS line endings to Unix
sed 's/\r$//' file.txt

# Print only lines between two markers (exclusive)
sed -n '/START/{n; :loop; /END/q; p; n; b loop}' file.txt
```

---

## awk -- Pattern-Action Processing

`awk` is a pattern-scanning and processing language. Where `sed` operates on
characters within a line, `awk` operates on **fields** -- it sees each line as a
record divided into columns.

### The Basics

```bash
# Print the second field of each line (default delimiter: whitespace)
awk '{print $2}' file.txt

# Print the last field
awk '{print $NF}' file.txt

# Print lines where field 3 is greater than 100
awk '$3 > 100' data.txt

# Print lines matching a pattern
awk '/error/' log.txt

# Custom field separator
awk -F: '{print $1, $3}' /etc/passwd
```

### Built-In Variables

| Variable | Meaning |
|----------|---------|
| `$0` | The entire current line |
| `$1..$N` | Individual fields |
| `NF` | Number of fields in current line |
| `NR` | Current line number (across all files) |
| `FNR` | Current line number in current file |
| `FS` | Input field separator |
| `OFS` | Output field separator |
| `RS` | Input record separator |
| `ORS` | Output record separator |
| `FILENAME` | Current input filename |

### BEGIN and END Blocks

```bash
# Sum a column of numbers
awk '{sum += $3} END {print "Total:", sum}' sales.csv

# Print a header, process lines, print a footer
awk 'BEGIN {print "Name\tScore"} {print $1, $2} END {print "---\nDone"}' data.txt

# Set field separator in BEGIN (equivalent to -F)
awk 'BEGIN {FS=","} {print $2}' data.csv
```

### Associative Arrays

One of awk's most powerful features. Arrays are indexed by strings, not integers:

```bash
# Count occurrences of each value in column 1
awk '{count[$1]++} END {for (k in count) print k, count[k]}' access.log

# Sum values grouped by a key
awk -F, '{total[$1] += $3} END {for (k in total) print k, total[k]}' sales.csv

# Find the most frequent value
awk '{count[$1]++}
     END {
       max = 0
       for (k in count)
         if (count[k] > max) { max = count[k]; winner = k }
       print winner, max
     }' data.txt
```

### Printf for Formatted Output

```bash
# Right-aligned table
awk '{printf "%-20s %10.2f\n", $1, $2}' prices.txt

# Convert bytes to human-readable
awk '{
  if ($5 > 1073741824) printf "%s\t%.1f GB\n", $9, $5/1073741824
  else if ($5 > 1048576) printf "%s\t%.1f MB\n", $9, $5/1048576
  else printf "%s\t%.1f KB\n", $9, $5/1024
}' <(ls -l /usr/bin/)
```

### Awk as a Programming Language

Awk has conditionals, loops, functions, and string operations. It is Turing-complete:

```bash
# Fibonacci sequence
awk 'BEGIN {
  a = 0; b = 1
  for (i = 0; i < 20; i++) {
    print a
    temp = a + b; a = b; b = temp
  }
}'

# Built-in string functions
awk '{
  print length($0)          # string length
  print substr($0, 1, 10)   # substring
  print toupper($1)         # uppercase
  print tolower($2)         # lowercase
  gsub(/old/, "new", $0)    # global substitution
  print $0
}' file.txt
```

### Gawk Extensions

GNU awk (`gawk`) adds features beyond POSIX awk:

```bash
# PCRE-style regex with gawk
gawk 'match($0, /user=([a-z]+)/, arr) {print arr[1]}' auth.log

# Coprocess: two-way communication with an external command
gawk 'BEGIN {
  cmd = "sort"
  print "banana" |& cmd
  print "apple" |& cmd
  close(cmd, "to")
  while ((cmd |& getline line) > 0) print line
  close(cmd)
}'

# Network: gawk can open TCP connections
gawk 'BEGIN {
  server = "/inet/tcp/0/www.example.com/80"
  print "GET / HTTP/1.0\r\n" |& server
  while ((server |& getline line) > 0) print line
  close(server)
}'
```

---

## find -- Filesystem Traversal

`find` walks a directory tree and matches files by name, type, size, time,
permissions, and arbitrary predicates. It is the Swiss Army knife of file discovery.

### Basic Patterns

```bash
# Find by name (case-sensitive)
find /var/log -name "*.log"

# Find by name (case-insensitive)
find . -iname "readme*"

# Find by type
find . -type f    # regular files only
find . -type d    # directories only
find . -type l    # symbolic links only

# Find by size
find . -size +100M          # larger than 100 MB
find . -size -1k            # smaller than 1 KB
find . -size +1G -type f    # files larger than 1 GB
```

### Time-Based Queries

```bash
# Modified in the last 7 days
find . -mtime -7

# Modified more than 30 days ago
find . -mtime +30

# Modified in the last 60 minutes
find . -mmin -60

# Newer than a reference file
find . -newer reference.txt
```

### Permissions

```bash
# Find world-writable files
find / -perm -o=w -type f 2>/dev/null

# Find setuid executables
find / -perm -4000 -type f 2>/dev/null

# Find files owned by a specific user
find /home -user deployer -type f
```

### Executing Commands

```bash
# Delete all .tmp files (asks find to invoke rm for each match)
find . -name "*.tmp" -exec rm {} \;

# Same, but batched (more efficient -- passes multiple files per rm invocation)
find . -name "*.tmp" -exec rm {} +

# Print with null delimiters for safe piping
find . -name "*.txt" -print0 | xargs -0 wc -l

# Prune: skip directories entirely
find . -path ./node_modules -prune -o -name "*.js" -print
find . \( -path ./.git -o -path ./vendor \) -prune -o -type f -print
```

### Modern Alternative: fd

`fd` (written in Rust) is a simpler, faster alternative to `find`:

```bash
# Find files matching a pattern (regex by default)
fd "\.rs$"

# Find by extension
fd -e py

# Find and execute (parallel by default)
fd -e log -x gzip {}

# Include hidden and ignored files
fd -HI "config"

# Exclude patterns
fd -E node_modules -E target "\.ts$"
```

| Feature | find | fd |
|---------|------|----|
| Default behavior | Lists everything | Filters .gitignore |
| Pattern syntax | Glob | Regex |
| Speed | Single-threaded | Multi-threaded |
| Hidden files | Included | Excluded by default |
| Color output | No | Yes |
| Parallel exec | No (GNU find has `-exec +`) | Yes (`-x` and `-X`) |

---

## Text Field Tools

These tools form the backbone of text data pipelines. They are deceptively simple
individually, but when combined they can replace entire ETL systems.

### sort

```bash
# Alphabetical sort
sort names.txt

# Numeric sort
sort -n scores.txt

# Reverse sort
sort -r names.txt

# Sort by field (e.g., second column, numerically)
sort -t, -k2 -n data.csv

# Sort by multiple keys
sort -t: -k4,4n -k1,1 /etc/passwd     # by GID (numeric), then by name

# Remove duplicates while sorting
sort -u names.txt

# Human-readable numeric sort (1K, 2M, 3G)
sort -h sizes.txt

# Stable sort (preserve original order for equal elements)
sort -s -k2,2 data.txt
```

### uniq

`uniq` removes **adjacent** duplicate lines. This is why `sort | uniq` is the
canonical pairing:

```bash
# Remove duplicates (input must be sorted)
sort data.txt | uniq

# Count occurrences
sort data.txt | uniq -c

# Show only duplicated lines
sort data.txt | uniq -d

# Show only unique (non-duplicated) lines
sort data.txt | uniq -u

# Ignore first N fields when comparing
sort data.txt | uniq -f 2

# Ignore first N characters when comparing
sort data.txt | uniq -s 5
```

### cut

```bash
# Extract fields by delimiter
cut -d: -f1,3 /etc/passwd           # fields 1 and 3, colon-delimited

# Extract character positions
cut -c1-10 file.txt                  # first 10 characters of each line

# Extract byte ranges
cut -b1-16 binary_header.dat

# Multiple field ranges
cut -d, -f1,3-5,8 data.csv          # fields 1, 3 through 5, and 8

# Use tab as delimiter (default)
cut -f2 tsv_file.txt

# Complement: everything EXCEPT the specified fields
cut -d: --complement -f2 /etc/passwd
```

### tr

`tr` translates or deletes characters. It works on characters, not strings:

```bash
# Convert lowercase to uppercase
echo "hello world" | tr 'a-z' 'A-Z'

# Delete specific characters
echo "hello 123 world" | tr -d '0-9'

# Squeeze repeated characters
echo "too    many     spaces" | tr -s ' '

# Replace newlines with spaces (join lines)
tr '\n' ' ' < file.txt

# Delete non-printable characters
tr -cd '[:print:]\n' < messy.txt

# ROT13 cipher
echo "secret message" | tr 'A-Za-z' 'N-ZA-Mn-za-m'

# Convert Windows line endings
tr -d '\r' < windows.txt > unix.txt
```

### paste

`paste` merges lines from multiple files side by side:

```bash
# Merge two files column by column (tab-delimited)
paste names.txt scores.txt

# Custom delimiter
paste -d, names.txt scores.txt

# Convert a single column into rows
paste -s -d, column.txt
# Output: value1,value2,value3,...

# Merge every 3 lines into one
paste -d'\t' - - - < data.txt
```

### join

`join` performs a relational join on two sorted files, like a SQL JOIN:

```bash
# Inner join on first field (files must be sorted on the join field)
join users.txt orders.txt

# Join on specific fields
join -1 2 -2 1 employees.txt departments.txt
# -1 2 = file 1, field 2
# -2 1 = file 2, field 1

# Left outer join (show unmatched lines from file 1)
join -a 1 users.txt orders.txt

# Custom field separator
join -t, users.csv orders.csv

# Full outer join
join -a 1 -a 2 file1.txt file2.txt
```

### A Combined Example

```bash
# From a CSV of sales data, find the top 5 products by total revenue
cut -d, -f2,4 sales.csv |        # extract product name and amount
  tail -n +2 |                     # skip header line
  sort -t, -k1,1 |                # sort by product name
  awk -F, '{sum[$1]+=$2}
       END {for(p in sum) print p","sum[p]}' |  # sum per product
  sort -t, -k2 -rn |              # sort by total descending
  head -5                          # top 5
```

---

## xargs -- Building Commands from Stdin

`xargs` reads items from stdin and passes them as arguments to a command. It
bridges the gap between tools that produce output and tools that expect arguments.

### Basic Usage

```bash
# Pass filenames to rm
find /tmp -name "*.bak" -print0 | xargs -0 rm

# The -0 flag handles filenames with spaces and special characters
# -print0 (find) uses null delimiters; -0 (xargs) reads them
```

### Placeholder Substitution

```bash
# Use {} as a placeholder for each input item
find . -name "*.jpg" | xargs -I{} convert {} {}.png

# Rename files
ls *.txt | xargs -I{} mv {} /archive/{}

# Multiple uses of the placeholder
cat urls.txt | xargs -I{} sh -c 'curl -s {} > $(basename {}).html'
```

### Parallel Execution

```bash
# Run 4 processes in parallel
find . -name "*.gz" -print0 | xargs -0 -P4 gunzip

# Parallel with batching: 10 files per invocation, 4 parallel workers
find . -name "*.log" | xargs -n10 -P4 gzip

# Convert all images using 8 parallel processes
find photos/ -name "*.raw" | xargs -P8 -I{} convert {} {}.jpg
```

### Batching

```bash
# Pass 5 arguments at a time
seq 20 | xargs -n5 echo
# Output:
# 1 2 3 4 5
# 6 7 8 9 10
# 11 12 13 14 15
# 16 17 18 19 20

# Pass 1 argument at a time (execute once per input line)
cat hosts.txt | xargs -n1 ping -c1
```

### Safety

```bash
# Prompt before each execution
find . -name "*.tmp" | xargs -p rm

# Print commands without executing (dry run with echo)
find . -name "*.bak" | xargs echo rm

# Handle the "argument list too long" problem
find . -name "*.o" | xargs rm    # xargs automatically batches to avoid ARG_MAX
```

---

## diff and patch -- Change Management

### diff

```bash
# Unified diff format (most common, used by git)
diff -u old.txt new.txt

# Context diff (older format)
diff -c old.txt new.txt

# Recursive directory comparison
diff -r dir1/ dir2/

# Ignore whitespace differences
diff -w old.txt new.txt

# Ignore blank lines
diff -B old.txt new.txt

# Brief output (just report which files differ)
diff -rq dir1/ dir2/

# Side-by-side comparison
diff -y --width=120 old.txt new.txt

# Color diff (GNU diff 3.4+)
diff --color=auto -u old.txt new.txt
```

### Reading Unified Diff Output

```
--- old.txt     2026-04-01 12:00:00
+++ new.txt     2026-04-09 14:30:00
@@ -10,7 +10,8 @@
 unchanged line
-removed line
+added line
+another added line
 unchanged line
```

- Lines beginning with `-` were removed
- Lines beginning with `+` were added
- Lines beginning with ` ` (space) are context
- `@@ -10,7 +10,8 @@` means: starting at line 10 in the old file (7 lines shown),
  starting at line 10 in the new file (8 lines shown)

### patch

```bash
# Apply a patch
patch < changes.patch

# Apply with a strip level (remove N leading path components)
patch -p1 < changes.patch

# Dry run (check if patch applies cleanly)
patch --dry-run -p1 < changes.patch

# Reverse a patch
patch -R -p1 < changes.patch

# Create a patch file
diff -ruN original/ modified/ > changes.patch
```

### Three-Way Merge

```bash
# diff3 compares three files: mine, original, yours
diff3 mine.txt original.txt yours.txt

# Merge with conflict markers
diff3 -m mine.txt original.txt yours.txt > merged.txt
```

---

## Archives and Compression

### tar

`tar` (Tape Archive) creates and extracts archive files. It does not compress
by itself, but integrates with compression tools via flags:

```bash
# Create a gzip-compressed archive
tar czf archive.tar.gz directory/

# Create a bzip2-compressed archive
tar cjf archive.tar.bz2 directory/

# Create an xz-compressed archive (best compression ratio)
tar cJf archive.tar.xz directory/

# Create a zstd-compressed archive (best speed/ratio balance)
tar --zstd -cf archive.tar.zst directory/

# Extract
tar xzf archive.tar.gz
tar xjf archive.tar.bz2
tar xJf archive.tar.xz
tar --zstd -xf archive.tar.zst

# Extract to a specific directory
tar xzf archive.tar.gz -C /opt/

# List contents without extracting
tar tzf archive.tar.gz

# Extract a single file
tar xzf archive.tar.gz path/to/specific/file.txt

# Exclude patterns
tar czf backup.tar.gz --exclude='*.log' --exclude='.git' project/
```

### The Compression Landscape

| Tool | Extension | Algorithm | Speed | Ratio | Year |
|------|-----------|-----------|-------|-------|------|
| gzip | .gz | DEFLATE | Fast | Good | 1992 |
| bzip2 | .bz2 | Burrows-Wheeler | Slow | Better | 1996 |
| xz | .xz | LZMA2 | Very slow | Best | 2009 |
| zstd | .zst | Zstandard | Very fast | Very good | 2016 |
| lz4 | .lz4 | LZ4 | Fastest | Adequate | 2011 |

```bash
# Compress/decompress individually
gzip file.txt         # creates file.txt.gz, removes original
gunzip file.txt.gz    # restores file.txt

bzip2 file.txt        # creates file.txt.bz2
bunzip2 file.txt.bz2

xz file.txt           # creates file.txt.xz
unxz file.txt.xz

zstd file.txt         # creates file.txt.zst (keeps original by default)
zstd -d file.txt.zst

# Keep original file
gzip -k file.txt
xz -k file.txt

# Set compression level (1=fastest, 9=best for gzip/bzip2/xz; 1-19 for zstd)
gzip -9 file.txt
zstd -19 file.txt

# Zstd with trained dictionary (great for many similar small files)
zstd --train training_samples/* -o dictionary
zstd -D dictionary file.txt
```

**Sysadmin tip:** For log rotation and backups, `zstd` has largely replaced `gzip`
in modern deployments. It compresses as well as `gzip -9` at speeds matching
`gzip -1`, and its threaded mode (`zstd -T0`) saturates all available cores.

---

## curl and wget -- HTTP from the Terminal

### curl

`curl` transfers data with URL syntax. It supports HTTP, HTTPS, FTP, SCP, SFTP,
and dozens of other protocols:

```bash
# Simple GET request
curl https://api.example.com/data

# Save to a file
curl -o output.html https://example.com
curl -O https://example.com/file.tar.gz    # use remote filename

# Follow redirects
curl -L https://example.com/redirect

# POST JSON data
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'

# POST form data
curl -X POST https://example.com/login \
  -d "username=admin&password=secret"

# Upload a file
curl -X PUT -T file.bin https://storage.example.com/uploads/

# Authentication
curl -u username:password https://api.example.com/private
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/data

# Show response headers
curl -I https://example.com        # HEAD request (headers only)
curl -i https://example.com        # headers + body

# Verbose output (debugging)
curl -v https://example.com

# Send cookies
curl -b "session=abc123" https://example.com
curl -c cookies.txt -b cookies.txt https://example.com   # save and send cookies

# Limit download speed
curl --limit-rate 1M -O https://example.com/large.iso

# Resume a broken download
curl -C - -O https://example.com/large.iso

# Silent mode (suppress progress meter, show errors)
curl -sS https://api.example.com/health | jq .
```

### wget

`wget` is designed for downloading. It handles recursive downloads, mirroring,
and broken connections gracefully:

```bash
# Simple download
wget https://example.com/file.tar.gz

# Download to a specific filename
wget -O output.html https://example.com

# Recursive download (mirror a website)
wget -r -l 3 https://example.com/docs/
#   -r  recursive
#   -l  depth limit (3 levels deep)

# Mirror a site for offline browsing
wget --mirror --convert-links --page-requisites https://example.com

# Download a list of URLs
wget -i urls.txt

# Continue a broken download
wget -c https://example.com/large.iso

# Background download with logging
wget -b -o download.log https://example.com/large.iso

# Rate limiting
wget --limit-rate=500k https://example.com/file.iso

# Ignore SSL errors (development only)
wget --no-check-certificate https://self-signed.example.com
```

| Feature | curl | wget |
|---------|------|------|
| Protocols | 25+ (HTTP, FTP, SCP, SFTP, MQTT...) | HTTP, HTTPS, FTP |
| API testing | Excellent (methods, headers, JSON) | Limited |
| Recursive download | No (use wget) | Yes |
| Resume | Yes (`-C -`) | Yes (`-c`) |
| Mirroring | No | Yes (`--mirror`) |
| Library | libcurl (used everywhere) | N/A |
| Piping | Designed for it | Designed for files |

---

## Process Management

### ps

```bash
# Show all processes (BSD syntax)
ps aux

# Show all processes (System V syntax)
ps -ef

# Show process tree
ps auxf
ps -ejH

# Show specific columns
ps -eo pid,ppid,user,%cpu,%mem,vsz,rss,comm

# Find a process by name
ps aux | grep nginx
# Better: use pgrep
pgrep -a nginx

# Show threads
ps -eLf
```

### top and htop

```bash
# top: built-in process monitor
top
# Inside top:
#   P = sort by CPU
#   M = sort by memory
#   k = kill a process
#   1 = show individual CPU cores
#   q = quit

# top in batch mode (useful for scripting)
top -bn1 | head -20

# htop: interactive, colorful, easier to use
htop
# Inside htop:
#   F5 = tree view
#   F6 = sort by column
#   F9 = kill
#   F2 = setup (customize meters)
#   / = search
#   t = toggle tree view
```

### kill and signal management

```bash
# Send SIGTERM (graceful shutdown, signal 15)
kill 12345
kill -TERM 12345

# Send SIGKILL (force kill, signal 9 -- last resort)
kill -9 12345
kill -KILL 12345

# Send SIGHUP (often used to reload configuration)
kill -HUP $(pgrep nginx)

# Kill by name
pkill firefox
killall firefox

# Send signal to a process group
kill -TERM -$(pgrep -o nginx)    # the negative PID targets the group
```

**Common signals:**

| Signal | Number | Default Action | Common Use |
|--------|--------|---------------|------------|
| SIGHUP | 1 | Terminate | Reload config |
| SIGINT | 2 | Terminate | Ctrl-C |
| SIGQUIT | 3 | Core dump | Ctrl-\\ |
| SIGKILL | 9 | Terminate (uncatchable) | Force kill |
| SIGTERM | 15 | Terminate | Graceful shutdown |
| SIGSTOP | 19 | Stop (uncatchable) | Pause process |
| SIGCONT | 18 | Continue | Resume paused process |
| SIGUSR1 | 10 | User-defined | App-specific (log rotation, etc.) |

---

## Debugging and Introspection

### lsof

`lsof` (List Open Files) shows which files are opened by which processes. On Unix,
everything is a file -- including network sockets, pipes, and devices:

```bash
# List all open files (warning: large output)
lsof | head -50

# Files opened by a specific process
lsof -p 12345

# Who has a specific file open?
lsof /var/log/syslog

# List all network connections
lsof -i

# Find what is listening on a specific port
lsof -i :8080
lsof -i TCP:443

# Find all files opened by a user
lsof -u deploy

# Find deleted files still held open (common disk space mystery)
lsof +L1
```

### strace

`strace` traces system calls made by a process. It is the single most useful
debugging tool for understanding what a program is actually doing at the OS level:

```bash
# Trace a command from start
strace ls /tmp

# Trace a running process
strace -p 12345

# Trace only specific system calls
strace -e trace=open,read,write ls /tmp
strace -e trace=network curl https://example.com

# Trace with timestamps
strace -t ls /tmp       # wall clock
strace -T ls /tmp       # time spent in each syscall
strace -r ls /tmp       # relative timestamp (time since last syscall)

# Follow child processes (forks)
strace -f bash -c "echo hello | cat"

# Count syscalls (summary mode)
strace -c ls /tmp
# Output:
# % time     seconds  usecs/call     calls    errors syscall
# ------ ----------- ----------- --------- --------- --------
#  33.33    0.000010           5         2           openat
#  ...

# Save trace to a file
strace -o trace.log ls /tmp

# Trace file access only
strace -e trace=file ls /tmp
```

### ltrace

`ltrace` traces library calls (shared library function calls) rather than
system calls:

```bash
# Trace library calls
ltrace ls /tmp

# Show string arguments (truncated by default)
ltrace -s 200 ./my_program

# Count library calls
ltrace -c ./my_program
```

**When to use which:**
- `strace` -- program fails to open a file, connect to a network, or has
  permission issues. Answers: "what is the kernel doing?"
- `ltrace` -- program uses a library incorrectly. Answers: "what library
  functions are being called?"
- `lsof` -- disk space mystery, port conflict, file locking issue. Answers:
  "who has what open?"

---

## Network Diagnostics

### ss (Socket Statistics)

`ss` replaced `netstat` as the standard tool for examining network connections.
It is faster and provides more information:

```bash
# Show all TCP connections
ss -t

# Show all listening sockets
ss -tln

# Show all TCP and UDP sockets with process info
ss -tulnp

# Show connections to a specific port
ss -tn dst :443

# Show connections from a specific IP
ss -tn src 192.168.1.100

# Show socket memory usage
ss -tm

# Show timer information
ss -to

# Filter by state
ss -t state established
ss -t state time-wait
ss -t state listening
```

### netstat (Legacy)

```bash
# Equivalent to ss -tulnp (still useful on older systems)
netstat -tulnp

# Show routing table
netstat -rn

# Show interface statistics
netstat -i
```

### DNS Tools

```bash
# dig: detailed DNS lookup
dig example.com
dig example.com MX                    # query specific record type
dig @8.8.8.8 example.com             # use a specific DNS server
dig +short example.com                # just the answer
dig +trace example.com                # trace delegation chain
dig -x 93.184.216.34                  # reverse DNS lookup

# nslookup: simpler DNS lookup
nslookup example.com
nslookup -type=MX example.com
nslookup example.com 8.8.8.8         # use a specific DNS server

# host: simplest DNS lookup
host example.com
host -t AAAA example.com             # query IPv6 records
```

### Other Network Tools

```bash
# Test connectivity
ping -c 4 example.com

# Trace the route to a host
traceroute example.com
traceroute -n example.com             # numeric only (skip DNS)
mtr example.com                       # combines ping + traceroute, live

# Test a specific TCP port
nc -zv example.com 443                # netcat port check
# or
timeout 3 bash -c 'echo > /dev/tcp/example.com/443' && echo "Open" || echo "Closed"
```

---

## Scheduling

### cron

The cron daemon runs commands on a schedule defined in crontab files:

```bash
# Edit your crontab
crontab -e

# List your crontab
crontab -l

# Crontab format:
# minute hour day-of-month month day-of-week command
# *      *    *             *     *

# Run at 2:30 AM every day
30 2 * * * /opt/scripts/backup.sh

# Run every 15 minutes
*/15 * * * * /opt/scripts/check-health.sh

# Run at 6 AM on weekdays only (Monday-Friday)
0 6 * * 1-5 /opt/scripts/morning-report.sh

# Run on the 1st and 15th of each month
0 0 1,15 * * /opt/scripts/bimonthly.sh

# Run every Sunday at midnight
0 0 * * 0 /opt/scripts/weekly-cleanup.sh

# Important: redirect output to avoid cron mail
*/5 * * * * /opt/scripts/task.sh >> /var/log/task.log 2>&1

# Use environment variables
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=admin@example.com
```

**Common cron pitfalls:**
- The PATH in cron is minimal. Always use full paths or set PATH explicitly.
- cron does not load your `.bashrc` or `.profile`.
- If a cron job takes longer than its interval, overlapping instances will stack.
  Use `flock` to prevent this:

```bash
*/5 * * * * flock -n /tmp/task.lock /opt/scripts/task.sh
```

### at

`at` runs a command once at a specific time:

```bash
# Run a command at a specific time
echo "/opt/scripts/deploy.sh" | at 3:00 AM

# Run in 2 hours
echo "backup.sh" | at now + 2 hours

# Run tomorrow at noon
echo "report.sh" | at noon tomorrow

# List pending jobs
atq

# Remove a job
atrm 42
```

### systemd Timers

Modern Linux distributions use systemd timers as an alternative to cron. They
offer better logging, dependency management, and transient timers:

```bash
# List active timers
systemctl list-timers --all

# Create a transient timer (runs once, 30 minutes from now)
systemd-run --on-active="30m" /opt/scripts/task.sh

# Create a transient timer (runs daily)
systemd-run --on-calendar="daily" /opt/scripts/backup.sh
```

A persistent systemd timer requires two unit files:

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Daily backup

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup daily at 2 AM

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
systemctl enable --now backup.timer
journalctl -u backup.service        # view logs (better than grepping /var/log)
```

| Feature | cron | systemd timers |
|---------|------|----------------|
| Setup complexity | One line | Two unit files |
| Logging | Manual (redirect to file) | journald (built-in) |
| Missed runs | Skipped silently | `Persistent=true` catches up |
| Dependencies | None | Full systemd dependency graph |
| Resource limits | None | CPUQuota, MemoryMax, etc. |
| Monitoring | `crontab -l` | `systemctl list-timers` |

---

## The Rust Rewrite Wave

A generation of developers has been rewriting classic Unix tools in Rust, bringing
modern defaults, better ergonomics, color output, and often significant speed
improvements. This is not about Rust worship -- it is about the fact that 50 years
of accumulated UX debt can be paid down by starting fresh.

### The Replacement Landscape

| Classic | Modern (Rust) | Key Improvements |
|---------|---------------|------------------|
| grep | **ripgrep** (`rg`) | 2-5x faster, respects .gitignore, Unicode, PCRE2 |
| find | **fd** | Simpler syntax, regex default, parallel, .gitignore |
| cat | **bat** | Syntax highlighting, line numbers, git diff markers |
| ls | **eza** (was exa) | Color by default, git status, tree view, icons |
| sed | **sd** | Simpler syntax (no escaping nightmare), string literals |
| du | **dust** | Visual tree, sorted by size, color |
| ps | **procs** | Color, tree, sortable columns, searchable |
| top | **bottom** (`btm`) | GPU monitoring, disk I/O, network, beautiful TUI |
| cd | **zoxide** | Frecency-based directory jumping (learns your habits) |
| cut | **choose** | Simpler field selection, negative indexing |
| diff | **delta** | Syntax highlighting, line numbers, side-by-side, git integration |
| wc | **tokei** | Lines of code counter, understands 200+ languages |
| prompt | **starship** | Cross-shell, fast, informative, customizable |

### Detailed Examples

```bash
# bat: cat with wings
bat src/main.rs                        # syntax-highlighted, line numbers
bat -A file.txt                        # show non-printable characters
bat --diff file.txt                    # show git changes inline
bat -l json <<< '{"key": "value"}'    # explicit language

# eza: modern ls
eza -la                                # long listing with all files
eza --tree --level=2                   # tree view, 2 levels deep
eza -la --git                          # show git status per file
eza --icons                            # file type icons

# sd: simpler sed
sd 'before' 'after' file.txt          # no delimiters, no escaping
sd '\bword\b' 'replacement' file.txt  # regex still works
sd -F 'literal.string' 'new' file.txt # fixed string mode (like fgrep)

# dust: visual du
dust                                   # current directory, visual tree
dust -r                                # reverse (smallest first)
dust -n 20                             # top 20 entries

# zoxide: smart cd
z projects                             # jump to most-used "projects" dir
zi                                     # interactive selection with fzf
z foo bar                              # matches directory containing both "foo" and "bar"

# procs: modern ps
procs                                  # colored, formatted process list
procs --tree                           # process tree
procs rust                             # search for "rust" in any column

# delta: beautiful diffs
git diff | delta                       # or configure git to use delta by default
delta file1.txt file2.txt              # standalone diff
# In ~/.gitconfig:
# [core]
#     pager = delta
# [delta]
#     navigate = true
#     side-by-side = true
```

### Should You Switch?

The modern tools are generally **additive**, not replacements. They are installed
alongside the classics, not instead of them. Scripts should continue to use POSIX
tools for portability. Interactive use benefits from the modern alternatives.

A sensible approach:
- Write scripts with `grep`, `sed`, `awk`, `find` (portable, universal)
- Use `rg`, `fd`, `bat`, `eza` interactively (faster, more readable output)
- Alias the modern tools in your shell profile if you prefer them as defaults

```bash
# In ~/.bashrc or ~/.zshrc
alias ls='eza'
alias cat='bat --paging=never'
alias grep='rg'
alias find='fd'
alias du='dust'
alias diff='delta'
alias top='btm'
alias ps='procs'
```

---

## jq and yq -- Structured Data on the CLI

### jq: JSON Processing

`jq` is a command-line JSON processor. It fills the gap that the Unix text tools
cannot: structured, nested data.

```bash
# Pretty-print JSON
curl -s https://api.example.com/data | jq .

# Extract a field
echo '{"name": "Alice", "age": 30}' | jq '.name'
# Output: "Alice"

# Raw output (no quotes)
echo '{"name": "Alice"}' | jq -r '.name'
# Output: Alice

# Array operations
echo '[1,2,3,4,5]' | jq '.[]'          # iterate over array
echo '[1,2,3,4,5]' | jq '.[2]'         # index into array (0-based)
echo '[1,2,3,4,5]' | jq '.[1:3]'       # slice

# Object construction
echo '{"first": "Alice", "last": "Smith", "age": 30}' | \
  jq '{full_name: (.first + " " + .last), age}'

# Filter arrays
echo '[{"name":"A","score":85},{"name":"B","score":92}]' | \
  jq '.[] | select(.score > 90)'

# Map over arrays
echo '[1,2,3,4,5]' | jq '[.[] | . * 2]'
# Output: [2,4,6,8,10]

# Group and aggregate
cat data.json | jq 'group_by(.category) |
  map({category: .[0].category, count: length, total: map(.amount) | add})'

# Flatten nested structures
cat nested.json | jq '[.. | .name? // empty]'

# Create JSON from raw data
echo -e "Alice\nBob\nCharlie" | jq -R -s 'split("\n") | map(select(. != ""))'

# Modify JSON in place
jq '.version = "2.0.0"' package.json > tmp.json && mv tmp.json package.json
```

### Common jq Patterns for API Work

```bash
# GitHub API: list repo names
curl -s "https://api.github.com/users/octocat/repos" | \
  jq -r '.[].name'

# AWS CLI output processing
aws ec2 describe-instances | \
  jq -r '.Reservations[].Instances[] |
    [.InstanceId, .State.Name, .InstanceType, (.Tags[]? | select(.Key=="Name") | .Value)] |
    @tsv'

# Kubernetes: list pod names and statuses
kubectl get pods -o json | \
  jq -r '.items[] | [.metadata.name, .status.phase] | @tsv'
```

### yq: YAML Processing

`yq` does for YAML what `jq` does for JSON. There are two implementations;
the Go version by Mike Farah is the most actively maintained:

```bash
# Read a field from a YAML file
yq '.metadata.name' deployment.yaml

# Update a field
yq -i '.spec.replicas = 3' deployment.yaml

# Convert YAML to JSON
yq -o=json '.' config.yaml

# Convert JSON to YAML
yq -P '.' data.json

# Merge YAML files
yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' base.yaml overlay.yaml

# Process multiple documents in a single YAML file
yq eval '.' -s '"doc_" + $index' multi-doc.yaml
```

---

## fzf -- Fuzzy Finding

`fzf` is a general-purpose fuzzy finder. It reads lines from stdin, lets you
interactively filter them, and writes the selection to stdout. It transforms
any list into an interactive menu.

### Basic Usage

```bash
# Fuzzy-find a file
find . -type f | fzf

# Fuzzy-find and open in vim
vim $(fzf)

# Preview files while selecting
fzf --preview 'bat --color=always {}'

# Multi-select with Tab
fzf --multi

# Start with a query
fzf --query "test"
```

### Shell Integration

fzf provides keybindings that replace default shell behavior:

- **Ctrl-R**: Fuzzy search command history (replaces the default reverse-search)
- **Ctrl-T**: Fuzzy-find a file and insert its path at the cursor
- **Alt-C**: Fuzzy-find a directory and `cd` into it

These three bindings alone justify installing fzf. The Ctrl-R replacement is
transformative -- instead of pressing Ctrl-R and hoping your partial match is
close enough, you get a live-filtering view of your entire history.

### Integration with Other Tools

```bash
# Git: checkout a branch interactively
git branch | fzf | xargs git checkout

# Git: interactive log browser
git log --oneline | fzf --preview 'git show --color=always {1}'

# Kill a process interactively
ps aux | fzf | awk '{print $2}' | xargs kill

# SSH to a host from your config
grep "^Host " ~/.ssh/config | awk '{print $2}' | fzf | xargs ssh

# Docker: attach to a container
docker ps --format "{{.Names}}" | fzf | xargs -I{} docker exec -it {} bash

# Navigate to any project directory
fd -t d --max-depth 3 . ~/projects | fzf | read dir && cd "$dir"
```

### Configuration

```bash
# In ~/.bashrc or ~/.zshrc
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_DEFAULT_OPTS='
  --height 40%
  --layout=reverse
  --border
  --preview "bat --color=always --style=numbers --line-range=:500 {}"
'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
```

---

## tmux and screen -- Terminal Multiplexing

### tmux

`tmux` (Terminal Multiplexer) lets you run multiple terminal sessions inside a
single window, detach from them, and reattach later. It is essential for remote
work, long-running processes, and pair programming.

### Core Concepts

- **Session**: A collection of windows. Persists after you detach.
- **Window**: A single screen within a session (like a tab).
- **Pane**: A subdivision of a window (split screen).

The **prefix key** is `Ctrl-b` by default (many users rebind it to `Ctrl-a`).

### Session Management

```bash
# Start a new named session
tmux new -s work

# Detach from current session
# Press: Ctrl-b d

# List sessions
tmux ls

# Reattach to a session
tmux attach -t work

# Kill a session
tmux kill-session -t work

# Create a session in the background
tmux new -d -s build "make -j8 && notify-send 'Build done'"
```

### Window and Pane Commands

```
Ctrl-b c        Create a new window
Ctrl-b ,        Rename the current window
Ctrl-b n        Next window
Ctrl-b p        Previous window
Ctrl-b 0-9      Switch to window by number

Ctrl-b %        Split pane vertically (left/right)
Ctrl-b "        Split pane horizontally (top/bottom)
Ctrl-b o        Cycle through panes
Ctrl-b x        Kill current pane
Ctrl-b z        Zoom pane (toggle fullscreen)
Ctrl-b {        Move pane left
Ctrl-b }        Move pane right
Ctrl-b Space    Cycle through pane layouts
```

### Copy Mode

tmux has a built-in copy mode for scrolling and selecting text:

```
Ctrl-b [        Enter copy mode
q               Exit copy mode
Space           Start selection (in copy mode)
Enter           Copy selection and exit copy mode
Ctrl-b ]        Paste the buffer
```

### Configuration (~/.tmux.conf)

```bash
# Rebind prefix to Ctrl-a (screen compatibility)
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Enable mouse support
set -g mouse on

# Start window numbering at 1
set -g base-index 1
setw -g pane-base-index 1

# Increase scrollback buffer
set -g history-limit 50000

# Use vi keybindings in copy mode
setw -g mode-keys vi

# Split panes using | and -
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# Reload config
bind r source-file ~/.tmux.conf \; display "Config reloaded"

# Quick pane switching with Alt-arrow
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D
```

### screen (Legacy)

GNU Screen predates tmux and is still available on nearly every Unix system. It
is worth knowing because you may encounter it on systems where tmux is not
installed:

```bash
screen                    # start a new session
screen -S name            # start a named session
screen -ls                # list sessions
screen -r name            # reattach
Ctrl-a d                  # detach
Ctrl-a c                  # new window
Ctrl-a n                  # next window
Ctrl-a p                  # previous window
Ctrl-a "                  # window list
Ctrl-a |                  # vertical split (requires patch)
Ctrl-a S                  # horizontal split
Ctrl-a Tab                # switch between splits
```

| Feature | tmux | screen |
|---------|------|--------|
| Pane splitting | Built-in, intuitive | Limited (requires patches for vertical) |
| Configuration | Powerful, readable | Cryptic |
| Scripting | Full command mode | Limited |
| Unicode | Good | Spotty |
| Mouse support | Built-in | Partial |
| Plugin ecosystem | tpm (tmux plugin manager) | Minimal |
| Default on servers | Often not installed | Almost always available |

---

## Real-World Pipeline Examples

### Log Analysis: Top Error Sources in the Last Hour

```bash
# Find the most common error messages in the last hour of logs
journalctl --since "1 hour ago" --priority=err --no-pager |
  sed 's/^.*]: //' |                  # strip timestamp and service prefix
  sort |                               # group identical messages
  uniq -c |                            # count occurrences
  sort -rn |                           # most frequent first
  head -20                             # top 20
```

### Data Extraction: Parse CSV and Compute Statistics

```bash
# From a CSV of response times, compute min/max/avg/p95
tail -n +2 responses.csv |             # skip header
  cut -d, -f3 |                        # extract response_time column
  sort -n |                            # sort numerically
  awk '
    {a[NR] = $1; sum += $1}
    END {
      n = NR
      print "Count:", n
      print "Min:", a[1]
      print "Max:", a[n]
      print "Avg:", sum/n
      print "P50:", a[int(n*0.50)]
      print "P95:", a[int(n*0.95)]
      print "P99:", a[int(n*0.99)]
    }
  '
```

### System Monitoring: Disk Space Alert

```bash
# Check disk usage, alert if any filesystem is above 85%
df -h |
  awk 'NR>1 {
    gsub(/%/, "", $5)
    if ($5+0 > 85) printf "ALERT: %s is %s%% full (%s)\n", $6, $5, $1
  }'
```

### Deployment: Find and Replace Across a Codebase

```bash
# Replace an old API endpoint across all Python files
find src/ -name "*.py" -print0 |
  xargs -0 grep -l "api.old.example.com" |
  xargs -I{} sed -i 's|api.old.example.com|api.new.example.com|g' {}
```

### Security: Find Recently Modified Files

```bash
# Find files modified in the last 24 hours, excluding known paths
find / -mtime -1 -type f \
  -not -path "/proc/*" \
  -not -path "/sys/*" \
  -not -path "/tmp/*" \
  -not -path "/var/log/*" \
  -not -path "/run/*" \
  2>/dev/null |
  xargs -r ls -la |
  sort -k6,7
```

### Network: Monitor Active Connections by Country

```bash
# Requires geoiplookup (geoip-bin package)
ss -tn state established |
  awk 'NR>1 {split($5, a, ":"); print a[1]}' |
  sort -u |
  while read ip; do
    country=$(geoiplookup "$ip" 2>/dev/null | head -1 | cut -d: -f2)
    printf "%-15s %s\n" "$ip" "$country"
  done |
  sort -t' ' -k2
```

### Build Pipeline: Parallel Compilation with Progress

```bash
# Find all .c files, compile them in parallel, report progress
find src/ -name "*.c" -print0 |
  xargs -0 -P$(nproc) -I{} sh -c '
    obj=$(echo {} | sed "s|src/|build/|;s|\.c$|.o|")
    mkdir -p $(dirname "$obj")
    gcc -O2 -c {} -o "$obj" && echo "OK: {}" || echo "FAIL: {}"
  ' 2>&1 |
  tee build.log |
  awk '/^FAIL/ {fail++} /^OK/ {ok++} END {print ok, "succeeded,", fail+0, "failed"}'
```

### Data Pipeline: Merge and Analyze

```bash
# Join user data with order data, compute per-user totals
sort -t, -k1,1 users.csv > /tmp/users_sorted.csv
sort -t, -k1,1 orders.csv > /tmp/orders_sorted.csv

join -t, /tmp/users_sorted.csv /tmp/orders_sorted.csv |
  awk -F, '{total[$2] += $NF}
    END {
      for (name in total)
        printf "%-20s $%0.2f\n", name, total[name]
    }' |
  sort -t'$' -k2 -rn
```

---

## When Pipes Break Down

The Unix pipeline model is remarkably powerful, but it has real limitations.
Understanding where it breaks down is as important as knowing how to use it.

### Binary Data

Pipes carry byte streams, but most text tools assume line-oriented UTF-8 text.
Binary data -- images, compressed files, protocol buffers -- will corrupt or
confuse text-processing tools. Solutions:

- Use `xxd` or `hexdump` to convert binary to hex for inspection
- Use format-specific tools (`ffprobe` for media, `readelf` for ELF binaries)
- Use `base64` for safe transport through text-oriented channels

```bash
# Inspect binary data as hex
xxd binary.dat | head -20

# Extract a specific byte range
dd if=binary.dat bs=1 skip=100 count=16 2>/dev/null | xxd
```

### Structured Data

When data has nesting (JSON, XML, YAML), line-oriented tools struggle. A JSON
object split across 20 lines cannot be meaningfully processed by `grep` or `awk`.
This is exactly why `jq` and `yq` exist -- they understand structure.

```bash
# This will fail to extract nested data correctly:
grep "name" data.json    # matches too many lines, no context

# This works:
jq '.users[].name' data.json
```

The general rule: if your data has depth, use a tool that understands depth.

### Error Handling Across Pipe Stages

By default, a pipeline's exit code is the exit code of the **last** command.
If an earlier stage fails, the pipeline may appear to succeed:

```bash
# This "succeeds" even if curl fails (wc succeeds on empty input)
curl -s https://bad.url/data | wc -l
echo $?    # 0 (misleading)
```

Bash provides `set -o pipefail` to propagate failures:

```bash
set -o pipefail
curl -s https://bad.url/data | wc -l
echo $?    # non-zero (curl's error propagates)
```

The `PIPESTATUS` array provides per-stage exit codes:

```bash
false | true | false
echo "${PIPESTATUS[@]}"    # 1 0 1
```

### Buffering

When piped, most programs switch from line buffering to block buffering (typically
4KB or 64KB blocks). This means output may not appear immediately in downstream
stages. For interactive or real-time pipelines, this matters:

```bash
# Force line buffering with stdbuf
stdbuf -oL command1 | command2

# GNU coreutils: --line-buffered flag on grep
tail -f /var/log/syslog | grep --line-buffered "error" | tee errors.txt

# Python: unbuffered output
python3 -u script.py | next_stage
```

### Ordering and Parallelism

Pipes guarantee that data arrives in order, but they do not guarantee timing.
If you need synchronization between stages, pipes are the wrong abstraction.
Use temporary files, named pipes (FIFOs), or explicit coordination:

```bash
# Named pipe for explicit IPC
mkfifo /tmp/fifo
producer > /tmp/fifo &
consumer < /tmp/fifo
rm /tmp/fifo
```

### The Escape Hatches

When pipes are not enough, the Unix tradition provides escalation paths:

1. **Temporary files**: When stages need random access, not sequential streaming
2. **Named pipes (FIFOs)**: When you need pipe semantics but with filesystem naming
3. **Process substitution**: `<(cmd)` and `>(cmd)` for commands that expect filenames
4. **Here documents**: For inline data that would be awkward to pipe
5. **Full scripting languages**: When awk is no longer sufficient, graduate to
   Python, Perl, or Ruby -- all of which interoperate perfectly with Unix pipes

The key insight is that pipes are the **default** composition mechanism, not the
**only** one. A skilled practitioner knows when to reach for something more
structured.

---

## Closing Thoughts

The Unix command-line toolkit is not a curated product. It is an ecosystem that
evolved over fifty years, shaped by the needs of people who had real work to do.
Each tool exists because someone needed it. Each flag was added because someone
asked for it. The result is not elegant in the way a designed API is elegant. It
is elegant in the way a workshop is elegant -- every tool within reach, every tool
sharp, and the craftsperson's hands know exactly where to find them.

The investment in learning these tools pays compound interest. A pipeline you
write today will work on a server provisioned ten years from now. The tools will
still be there. The text will still flow through pipes. And the philosophy --
small tools, composed freely, with text as the universal interface -- will still
be the fastest way to get from question to answer when you are sitting at a
terminal.

---

*PNW Research Series -- tibsfox.com*
*Written 2026-04-09*

---

## Study Guide — Unix Toolkit

### Why read this

The Unix command line is a massive toolkit that rewards
memorization of idioms more than memorization of flags. Reading
this file once gives you the map; using the tools every day
gives you the territory.

### Prerequisites

- Linux or macOS terminal. WSL2 also works.
- Curiosity and willingness to read man pages.

### Reading order

1. Text filters: `grep`, `sed`, `awk`, `sort`, `uniq`, `cut`,
   `tr`, `paste`, `join`, `comm`.
2. File tools: `find`, `xargs`, `tar`, `rsync`.
3. Process tools: `ps`, `top`, `kill`, `nice`, `nohup`,
   `timeout`, `time`.
4. Network tools: `curl`, `wget`, `ssh`, `nc`, `dig`, `host`.
5. Modern replacements: `rg` (ripgrep), `fd`, `bat`, `exa`,
   `delta`, `fzf`, `jq`.

### Key idioms

- `find ... -print0 | xargs -0 ...` — safe batch processing.
- `grep -rIn 'pattern' .` — recursive search with line numbers.
- `awk '{sum += $1} END {print sum}'` — sum a column.
- `sort | uniq -c | sort -rn` — frequency count.
- `jq '.items[] | select(.active) | .id'` — filter JSON.

---

## Programming Examples

### Example 1 — Find the 10 most-modified files in a git repo

```bash
git log --pretty=format: --name-only \
  | sort | uniq -c | sort -rn | head
```

### Example 2 — HTTP response codes from an access log

```bash
awk '{print $9}' access.log | sort | uniq -c | sort -rn
```

### Example 3 — Extract JSON field with jq

```bash
curl -s https://api.github.com/repos/torvalds/linux \
  | jq -r '.stargazers_count'
```

---

## DIY & TRY

### DIY 1 — Build a log analyzer

Given a webserver access log, extract: total requests, top 10
URLs, top 10 IPs, and response code distribution. Do it all
in a single pipeline of standard Unix tools, no scripting
language.

### DIY 2 — Replace `find`, `grep`, and `cat` with modern tools

Install `fd`, `rg`, and `bat`. Use each for a week. Keep notes
on what you miss from the originals and what you prefer.

### DIY 3 — Master fzf

`fzf` is a fuzzy finder that integrates with shells. Install
it, enable the shell integration, learn `^R` for history
search and `^T` for file completion. These two keys, alone,
justify the install.

### TRY — Build your own pipeline dashboard

Write a shell pipeline that produces a live-updating terminal
dashboard (`watch`, `tput`, or `gum`) of some metric you care
about (git branch, disk usage, network stats). Ten lines of
shell, zero dependencies beyond the standard toolkit.

---

## Related College Departments (Unix toolkit)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)
  — the toolkit is the canonical case study in "small tools,
  composed freely."
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md)
  — Unix tool composition is the shape of a lot of
  infrastructure engineering.
