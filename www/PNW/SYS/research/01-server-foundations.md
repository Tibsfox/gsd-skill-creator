# Server Foundations

> **Module ID:** SRV-FOUND
> **Domain:** Server & Operating System
> **Through-line:** *Infrastructure already exists.* The pipes are laid, the wires are run, the rails are graded. The server is not magic — it is a machine with a filesystem, a process table, and a set of services. The sysadmin understands every layer because every layer can fail, and the fix is always in the details.

---

## Table of Contents

1. [Linux as Infrastructure](#1-linux-as-infrastructure)
2. [Process Management](#2-process-management)
3. [Systemd](#3-systemd)
4. [Users, Groups, Permissions](#4-users-groups-permissions)
5. [Filesystems & Storage](#5-filesystems--storage)
6. [Package Management](#6-package-management)
7. [The Server's Day](#7-the-servers-day)
8. [Cross-Reference](#8-cross-reference)
9. [Sources](#9-sources)

---

## 1. Linux as Infrastructure

### 1.1 Why Linux Runs Most of the World's Servers

Linux runs the vast majority of the internet's servers — all of the top 500 supercomputers, most of the cloud, nearly every Android phone, and the infrastructure behind every major web service you use daily. This is not an accident of marketing. It happened because Linux is free (as in freedom and cost), auditable (the source code is public), and modifiable (anyone can build a kernel tuned to their hardware). [SRC-KERN]

The practical result: when something breaks on a Linux server, you can read the source code of the component that broke. When a vulnerability is found, the patch is public and verifiable. When you need to understand what the kernel is doing with your disk, your network, or your memory, `/proc` and `/sys` expose it in real time. No phone call to a vendor, no waiting for a service pack. The knowledge is there if you know where to look.

This matters because a server is infrastructure. It is not a consumer product. Consumer products hide complexity behind interfaces. Infrastructure exposes complexity because the people who maintain it need to see it. A water treatment plant does not have a "just works" mode — every pump, every valve, every sensor has a gauge and a manual override. A Linux server is the same. The admin sees everything because the admin is responsible for everything.

### 1.2 The Filesystem Hierarchy

Every Linux system follows a standard directory layout. This is not convention — it is a specification (the Filesystem Hierarchy Standard, FHS) that ensures programs and administrators can find things in predictable locations. [SRC-FHS]

| Directory | Purpose | What the Admin Cares About |
|-----------|---------|---------------------------|
| `/` | Root of the entire filesystem tree | Everything hangs from here. A full root filesystem means nothing works. |
| `/etc` | System configuration files | Every service reads its config from here. `/etc/nginx/nginx.conf`, `/etc/ssh/sshd_config`, `/etc/fstab`. When you change how something behaves, you edit a file in `/etc`. |
| `/var` | Variable data — things that change at runtime | `/var/log` holds logs. `/var/lib` holds service state (databases, package manager data). `/var/spool` holds queued work (mail, print jobs). This directory grows. Monitor it. |
| `/var/log` | System and service logs | The single most important directory for diagnosis. `syslog`, `auth.log`, `kern.log`, application logs. If something happened, it is recorded here. |
| `/home` | User home directories | Each user gets `/home/username`. Personal files, SSH keys (~/.ssh), shell config (~/.bashrc). Quotas can limit how much space each user consumes. |
| `/tmp` | Temporary files | Cleared on reboot (usually). Any user can write here. Do not store anything important in `/tmp`. Some distributions mount it as tmpfs (RAM-backed) for performance. |
| `/proc` | Virtual filesystem exposing kernel and process state | Not on disk — generated dynamically by the kernel. `/proc/cpuinfo`, `/proc/meminfo`, `/proc/<pid>/` for every running process. This is how tools like `top` and `ps` get their data. [SRC-PROC] |
| `/sys` | Virtual filesystem exposing hardware and kernel configuration | Device information, power management, kernel parameters. `/sys/class/net/` lists network interfaces. `/sys/block/` lists storage devices. |
| `/usr` | User programs and libraries (read-only in normal operation) | `/usr/bin` has most commands. `/usr/lib` has shared libraries. `/usr/share` has documentation and architecture-independent data. |
| `/opt` | Optional third-party software | Software that does not follow the standard package layout goes here. Some commercial tools install to `/opt/vendorname/`. |
| `/boot` | Kernel and bootloader files | `vmlinuz` (the kernel image), `initrd` or `initramfs` (initial RAM disk), GRUB config. Touch carefully — a broken `/boot` means the machine does not start. |
| `/dev` | Device files | Block devices (`/dev/sda`), character devices (`/dev/tty`), pseudo-devices (`/dev/null`, `/dev/random`). Created and managed by udev. |

**The key insight:** configuration lives in `/etc`, variable data lives in `/var`, the kernel exposes itself through `/proc` and `/sys`, and programs live in `/usr`. Everything else follows from these four facts.

### 1.3 Everything Is a File

This is the foundational Unix abstraction. Files, directories, devices, network sockets, pipes, processes — they all appear as entries in the filesystem or can be manipulated with file operations (open, read, write, close). [SRC-KERN]

```bash
# A regular file
cat /etc/hostname

# A device — writing to /dev/null discards data
echo "gone" > /dev/null

# A virtual file exposing kernel state
cat /proc/uptime
# Output: 86400.53 172456.12
# First number: seconds since boot. Second: cumulative idle time across all CPUs.

# A network socket is a file descriptor
ls -l /proc/$(pidof sshd)/fd/
# Shows file descriptors including TCP sockets

# Even a running process's memory is accessible as a file
ls /proc/$$/maps
# Shows memory mappings of the current shell process
```

Why does this matter? Because it means a single set of tools — `cat`, `grep`, `awk`, `echo`, redirection — can interact with almost everything on the system. You do not need a special API to read CPU temperature; you `cat /sys/class/thermal/thermal_zone0/temp`. You do not need a special tool to see what a process has open; you `ls /proc/<pid>/fd/`. The abstraction is consistent, which makes the system learnable.

### 1.4 The Kernel and Userspace

The kernel is the only software that talks directly to hardware. Every program you run — your shell, your web server, your database — runs in userspace and must ask the kernel for any hardware access through system calls (syscalls). [SRC-KERN]

```
+---------------------------+
|       User Programs       |  Userspace (unprivileged)
|  bash, nginx, postgres    |
+---------------------------+
|      System Libraries     |  glibc wraps syscalls
|     (glibc, libpthread)   |  into C function calls
+---------------------------+
|    System Call Interface   |  The boundary
+---------------------------+
|         Kernel            |  Ring 0 (privileged)
|  Process scheduler        |
|  Memory manager           |
|  Filesystem layer (VFS)   |
|  Network stack            |
|  Device drivers           |
+---------------------------+
|        Hardware           |  CPU, RAM, disk, NIC
+---------------------------+
```

When `nginx` wants to send a response to a client, it calls `write()` on a socket file descriptor. `glibc` translates this into a `sys_write` syscall. The kernel validates the file descriptor, copies data from userspace into the kernel's network buffer, passes it to the TCP stack, and the NIC driver sends it out the wire. Nginx never touches the hardware. The kernel mediates every interaction.

This separation is security. A bug in nginx cannot corrupt the kernel's memory (unless there is a kernel bug too). A misbehaving process cannot read another process's memory. The kernel enforces isolation. This is why a single server can run hundreds of services for different users without them interfering with each other — the kernel is the referee.

---

## 2. Process Management

### 2.1 What a Process Is

A process is an instance of a running program. When you type `ls`, the shell creates a new process that runs the `ls` binary. That process has its own memory space, its own file descriptors, its own environment variables, and a unique Process ID (PID). When `ls` finishes, the process terminates and its PID is recycled. [SRC-PROC]

Every process has:

| Attribute | Description | Where to See It |
|-----------|-------------|-----------------|
| **PID** | Unique integer identifier | `ps -p <pid>`, `/proc/<pid>/` |
| **PPID** | Parent Process ID — who created this process | `ps -o ppid= -p <pid>` |
| **UID/GID** | User and group the process runs as | `ps -o uid,gid -p <pid>` |
| **State** | Running, sleeping, stopped, zombie, etc. | `ps -o stat -p <pid>` |
| **Memory** | Virtual and resident set size | `ps -o vsz,rss -p <pid>` |
| **File descriptors** | Open files, sockets, pipes | `ls /proc/<pid>/fd/` |
| **Environment** | Inherited environment variables | `cat /proc/<pid>/environ` |
| **CWD** | Current working directory | `ls -l /proc/<pid>/cwd` |

### 2.2 Fork and Exec

Every process in Linux (except PID 1) is created by an existing process using the `fork()` system call. `fork()` creates an exact copy of the calling process — same code, same data, same file descriptors. The copy gets a new PID. Then, typically, the child process calls `exec()` to replace its memory with a new program. [SRC-KERN]

```
Parent (bash, PID 100)
  |
  |-- fork() --> Child (copy of bash, PID 101)
                   |
                   |-- exec("/usr/bin/ls") --> Child is now ls, PID 101
                   |
                   |-- ls runs, outputs files, exits
                   |
Parent calls wait() --> collects child's exit status
```

This two-step process (fork then exec) is how every command you type in a shell gets executed. The shell forks itself, the child exec's the requested program, the parent waits for the child to finish. This is why environment variables, current directory, and file descriptors are inherited — the child starts as a copy of the parent.

**Why this matters for sysadmins:** When a service starts, it inherits the environment of whatever started it. If systemd starts nginx, nginx inherits systemd's environment (which is controlled and minimal). If you start nginx from your shell, it inherits your shell's environment (which may include sensitive variables). This is why services should be managed by init systems, not started manually.

### 2.3 Process States

A process is always in one of several states. Understanding these states is how you diagnose performance problems. [SRC-PROC]

| State | Code | Meaning | What It Tells You |
|-------|------|---------|-------------------|
| **Running** | R | Actively using CPU or waiting in the run queue | Normal. If many processes are R, the CPU is contended. |
| **Sleeping (Interruptible)** | S | Waiting for an event (I/O, signal, timer) | Normal. Most processes are sleeping most of the time. A web server sleeps until a request arrives. |
| **Sleeping (Uninterruptible)** | D | Waiting for I/O that cannot be interrupted | Usually disk I/O. A few D-state processes is normal. Many D-state processes means the storage subsystem is slow or hung. This state cannot be killed — not even with SIGKILL. |
| **Stopped** | T | Paused by a signal (SIGSTOP or Ctrl+Z) | The process is not running but is not dead. `fg` or SIGCONT resumes it. |
| **Zombie** | Z | Finished executing but parent has not read its exit status | The process table entry exists but no resources are consumed. A few zombies are harmless. Hundreds of zombies mean the parent process is not calling `wait()` — fix the parent, not the zombies. |

```bash
# See all processes with their states
ps aux
# The STAT column shows state codes
# R = running, S = sleeping, D = uninterruptible sleep
# Z = zombie, T = stopped
# Additional characters: s = session leader, l = multi-threaded,
# + = foreground process group, < = high priority, N = low priority

# Count processes by state
ps -eo stat --no-headers | cut -c1 | sort | uniq -c | sort -rn
```

### 2.4 Zombie Processes and Orphans

A **zombie** is a process that has finished executing but still occupies a slot in the process table because its parent has not called `wait()` to read the exit status. The zombie consumes no CPU or memory — only a PID. But PIDs are a finite resource (default max 32768, configurable via `/proc/sys/kernel/pid_max`), so a runaway zombie accumulation can eventually prevent new processes from starting. [SRC-PROC]

```bash
# Find zombie processes
ps aux | awk '$8 ~ /Z/'

# Find the parent of a zombie
ps -o ppid= -p <zombie_pid>
# Then investigate why the parent isn't reaping children
```

An **orphan** is a process whose parent has exited. The kernel reparents orphans to PID 1 (init/systemd), which is designed to reap them. Orphans are not a problem — the system handles them automatically.

The distinction matters: zombies indicate a bug in the parent (not reaping children). Orphans are normal lifecycle events (parent exits before child).

### 2.5 Signals

Signals are the kernel's mechanism for asynchronous notifications to processes. They are how you tell a process to stop, reload, or die. [SRC-SIGNAL]

| Signal | Number | Default Action | Use |
|--------|--------|---------------|-----|
| `SIGHUP` | 1 | Terminate | Convention: reload configuration. Many daemons catch this and re-read their config files. |
| `SIGINT` | 2 | Terminate | Ctrl+C from terminal. Polite "please stop." |
| `SIGQUIT` | 3 | Core dump | Ctrl+\\. "Stop and leave a crash dump for debugging." |
| `SIGKILL` | 9 | Terminate (cannot be caught) | Last resort. Process gets no chance to clean up. Data may be lost. |
| `SIGTERM` | 15 | Terminate | The standard "please shut down gracefully." This is what `kill <pid>` sends by default. |
| `SIGSTOP` | 19 | Stop (cannot be caught) | Freeze the process. Cannot be ignored or handled. |
| `SIGCONT` | 18 | Continue | Resume a stopped process. |
| `SIGUSR1` | 10 | Terminate | User-defined. Applications use this for custom actions (e.g., nginx reopens log files). |

```bash
# Graceful shutdown (SIGTERM)
kill 1234

# Force kill (SIGKILL) — only when SIGTERM fails
kill -9 1234

# Reload config (SIGHUP)
kill -HUP $(pidof nginx)

# Same as above, using systemctl (preferred)
systemctl reload nginx
```

**The escalation sequence:** Always try SIGTERM first. Give the process a few seconds to clean up (flush buffers, close connections, write state). If it does not respond, then SIGKILL. Sending SIGKILL as the first option is like pulling the power cord — it works, but you may lose data.

### 2.6 Monitoring Tools

```bash
# ps — snapshot of current processes
ps aux                        # All processes, full format
ps -ef                        # POSIX format, shows PPID
ps -eo pid,ppid,user,%cpu,%mem,stat,cmd --sort=-%cpu | head -20
                              # Top 20 processes by CPU usage

# top — real-time process viewer (press q to quit)
top -b -n 1 | head -30       # Batch mode, one iteration

# htop — interactive, colorful, tree view
htop                          # (install: apt install htop)
# F5 for tree view (shows parent-child relationships)
# F6 to sort by column
# F9 to send signals to processes

# pgrep/pkill — find or signal processes by name
pgrep -la nginx               # List all nginx processes with full command
pkill -HUP nginx              # Send SIGHUP to all nginx processes
```

---

## 3. Systemd

### 3.1 What Systemd Does

Systemd is the init system and service manager on most modern Linux distributions (Debian, Ubuntu, Fedora, RHEL, Arch, SUSE). It is PID 1 — the first process the kernel starts after boot. Everything else on the system is a descendant of systemd. [SRC-SYSD]

Systemd does more than start services. It manages:

- **Service lifecycle** — start, stop, restart, reload, enable, disable
- **Dependencies** — this service requires that service; start them in order
- **Resource limits** — CPU, memory, I/O limits per service via cgroups
- **Logging** — journald captures stdout/stderr of every service
- **Timers** — scheduled tasks (replacement for cron)
- **Socket activation** — listen on a port, start the service only when a connection arrives
- **Targets** — groups of services that define system states (like runlevels)

### 3.2 Units

Everything systemd manages is a "unit." Units are defined by configuration files, typically in `/etc/systemd/system/` (admin overrides) or `/usr/lib/systemd/system/` (package defaults). [SRC-SYSD]

| Unit Type | Extension | Purpose |
|-----------|-----------|---------|
| Service | `.service` | A daemon or one-shot process |
| Socket | `.socket` | A network or IPC socket that activates a service |
| Timer | `.timer` | A scheduled trigger (like cron) |
| Target | `.target` | A group of units (defines a system state) |
| Mount | `.mount` | A filesystem mount point |
| Path | `.path` | Watches a filesystem path for changes |
| Slice | `.slice` | A cgroup resource boundary |

### 3.3 Service Management

These are the commands you will use daily:

```bash
# Status — the most informative command
systemctl status nginx
# Shows: loaded/enabled, active/running, PID, memory usage,
# cgroup, and the last few log lines from journald

# Start and stop
systemctl start nginx          # Start now
systemctl stop nginx           # Stop now
systemctl restart nginx        # Stop then start
systemctl reload nginx         # Reload config without dropping connections

# Enable and disable (controls boot behavior)
systemctl enable nginx         # Start automatically on boot
systemctl disable nginx        # Do not start on boot
systemctl enable --now nginx   # Enable AND start immediately

# List all running services
systemctl list-units --type=service --state=running

# List all failed services
systemctl list-units --type=service --state=failed

# Show what a unit file contains
systemctl cat nginx.service

# Check if a service is enabled/active
systemctl is-enabled nginx
systemctl is-active nginx
```

### 3.4 Writing a Service Unit File

When you write your own service (a custom application, a monitoring script, a backup job), you write a unit file:

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application Server
Documentation=https://example.com/docs
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/server --config /etc/myapp/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/myapp /var/log/myapp
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Key fields explained:**

| Field | Purpose |
|-------|---------|
| `After=` | Start this service after the named units. Ordering only — does not create a dependency. |
| `Requires=` | This service needs the named units. If they fail, this service stops. |
| `Type=simple` | The process started by ExecStart IS the main process. Systemd tracks its PID. |
| `User=/Group=` | Run as this user, not root. Least privilege. |
| `Restart=on-failure` | If the process exits with a non-zero status, restart it. |
| `RestartSec=5` | Wait 5 seconds before restarting (prevents thrashing). |
| `NoNewPrivileges=true` | The process cannot gain new privileges via setuid/setgid. |
| `ProtectSystem=strict` | The entire filesystem is read-only except paths listed in ReadWritePaths. |
| `PrivateTmp=true` | The service gets its own /tmp, isolated from other services. |

```bash
# After creating or modifying a unit file
systemctl daemon-reload        # Tell systemd to re-read unit files
systemctl start myapp          # Start the service
systemctl status myapp         # Verify it's running
journalctl -u myapp -f         # Follow the logs in real time
```

### 3.5 Targets — System States

Targets replace the old concept of runlevels. A target is a group of units that together define a system state. [SRC-SYSD]

| Target | Old Runlevel | Purpose |
|--------|-------------|---------|
| `poweroff.target` | 0 | System is off |
| `rescue.target` | 1 | Single-user, minimal services (recovery mode) |
| `multi-user.target` | 3 | Full multi-user, no GUI. This is what most servers boot to. |
| `graphical.target` | 5 | Multi-user with GUI (desktop systems) |
| `reboot.target` | 6 | System is rebooting |

```bash
# Check current target
systemctl get-default

# Set default boot target (most servers)
systemctl set-default multi-user.target

# Switch target at runtime (emergency maintenance)
systemctl isolate rescue.target
```

### 3.6 Timers — Scheduled Jobs

Systemd timers are the modern replacement for cron. They have better logging (journald), dependency management, and resource control.

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily backup timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Daily backup job

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
User=backup
```

`Persistent=true` means if the system was off when the timer should have fired, it fires on the next boot. `RandomizedDelaySec=300` adds up to 5 minutes of random delay to avoid thundering herd if many machines have the same timer.

```bash
# List all active timers
systemctl list-timers

# Start a timer
systemctl enable --now backup.timer
```

### 3.7 Journalctl — Reading Logs

Journald captures the output of every service managed by systemd. `journalctl` is how you read it. [SRC-SYSD]

```bash
# All logs from the current boot
journalctl -b

# Logs from a specific service
journalctl -u nginx

# Follow logs in real time (like tail -f)
journalctl -u nginx -f

# Logs since a specific time
journalctl --since "2026-03-09 14:00" --until "2026-03-09 15:00"

# Show only errors and above
journalctl -p err

# Kernel messages (equivalent to dmesg)
journalctl -k

# Disk usage of the journal
journalctl --disk-usage

# Limit journal size
# Edit /etc/systemd/journald.conf:
# SystemMaxUse=500M
```

Cross-reference: [The Logs](03-the-logs.md) covers log analysis in depth. This section covers journalctl as a systemd component.

---

## 4. Users, Groups, Permissions

### 4.1 Users and the Identity Model

Every process runs as a user. Every file is owned by a user. The kernel uses numeric UIDs (User IDs) internally — usernames are just labels mapped by `/etc/passwd`. [SRC-PASSWD]

```bash
# /etc/passwd format (one line per user):
# username:x:UID:GID:comment:home_directory:shell
root:x:0:0:root:/root:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
foxy:x:1000:1000:Foxy:/home/foxy:/bin/bash
```

| Field | Purpose |
|-------|---------|
| `username` | Human-readable name |
| `x` | Password is in `/etc/shadow` (not here — that would be a security disaster) |
| `UID` | Numeric user ID. 0 = root. 1-999 = system accounts. 1000+ = regular users. |
| `GID` | Primary group ID |
| `comment` | Usually full name or description |
| `home_directory` | Where the user lands on login |
| `shell` | Login shell. `/usr/sbin/nologin` means this user cannot log in interactively. |

**System accounts** (UID < 1000) exist to run services. `www-data` runs the web server. `postgres` runs the database. `nobody` runs processes that need minimal privilege. These accounts have `/usr/sbin/nologin` as their shell — they exist for process ownership, not human login.

### 4.2 Groups

Groups allow multiple users to share access to files and resources. Every user has a primary group (set in `/etc/passwd`) and can belong to supplementary groups (listed in `/etc/group`). [SRC-PASSWD]

```bash
# /etc/group format:
# groupname:x:GID:member_list
sudo:x:27:foxy
docker:x:998:foxy,deploy
www-data:x:33:

# See what groups a user belongs to
groups foxy
# Output: foxy sudo docker

# Add a user to a group
usermod -aG docker foxy
# -a = append (without -a, it REPLACES all supplementary groups)
# -G = supplementary groups
```

**Common administrative groups:**

| Group | Purpose |
|-------|---------|
| `sudo` (Debian) / `wheel` (RHEL) | Can use sudo to run commands as root |
| `docker` | Can use Docker without sudo |
| `adm` | Can read log files in /var/log |
| `systemd-journal` | Can read journald logs |
| `www-data` | Web server group — shared access to web content |

### 4.3 File Permissions

Every file and directory on a Linux system has three sets of permissions: owner, group, and other. Each set specifies read (r), write (w), and execute (x) access. [SRC-CHMOD]

```
-rwxr-xr-- 1 foxy developers 4096 Mar  9 14:00 deploy.sh
│├─┤├─┤├─┤
│ │   │  │
│ │   │  └── Other: r-- (read only)
│ │   └───── Group: r-x (read and execute)
│ └───────── Owner: rwx (read, write, execute)
└─────────── Type: - (regular file), d (directory), l (symlink)
```

**Octal notation** is the compact form. Each permission bit has a numeric value:

| Permission | Bit Value |
|-----------|-----------|
| Read (r) | 4 |
| Write (w) | 2 |
| Execute (x) | 1 |

Add the values for each set: `rwx` = 4+2+1 = 7, `r-x` = 4+0+1 = 5, `r--` = 4+0+0 = 4.

So `rwxr-xr--` = 754.

```bash
# Common permission patterns
chmod 755 script.sh        # Owner: rwx, Group: r-x, Other: r-x
                            # Standard for scripts and executables

chmod 644 config.toml      # Owner: rw-, Group: r--, Other: r--
                            # Standard for config files (readable but not writable by others)

chmod 600 ~/.ssh/id_rsa    # Owner: rw-, Group: ---, Other: ---
                            # Private keys — owner only, no exceptions

chmod 700 ~/.ssh           # Owner: rwx, Group: ---, Other: ---
                            # SSH directory — owner only

# Change ownership
chown www-data:www-data /var/www/html/index.html
chown -R deploy:deploy /opt/myapp/    # Recursive
```

**For directories**, the meaning of permissions changes:

| Permission | On Files | On Directories |
|-----------|----------|----------------|
| Read (r) | Can read file contents | Can list directory contents (`ls`) |
| Write (w) | Can modify file contents | Can create, rename, delete files in the directory |
| Execute (x) | Can execute the file | Can enter the directory (`cd`) and access files within |

A directory with `r--` permission lets you list filenames but not `cd` into it or read any file inside. A directory with `--x` permission lets you access files if you know their names, but you cannot list what is there. The standard directory permission is 755 — owner can do everything, others can list and traverse.

### 4.4 Special Permission Bits

Three additional permission bits handle specific scenarios:

| Bit | Octal | Effect on Files | Effect on Directories |
|-----|-------|----------------|----------------------|
| **Setuid** | 4000 | Process runs as the file owner, not the executing user | (no standard effect) |
| **Setgid** | 2000 | Process runs as the file's group | New files inherit the directory's group (not the creator's primary group) |
| **Sticky** | 1000 | (no standard effect) | Only file owner (or root) can delete files, even if directory is writable by others |

```bash
# /tmp has the sticky bit — anyone can write, but you can only delete your own files
ls -ld /tmp
# drwxrwxrwt  <-- the 't' at the end is the sticky bit

# /usr/bin/passwd has setuid — runs as root to modify /etc/shadow
ls -l /usr/bin/passwd
# -rwsr-xr-x  <-- the 's' in owner execute position is setuid

# Set setgid on a shared project directory
chmod 2775 /opt/project/
# New files will belong to the directory's group, not the creator's
```

### 4.5 Sudo and the Root Question

The root account (UID 0) bypasses all permission checks. Root can read any file, kill any process, modify any configuration. This is power without guardrails. [SRC-SUDO]

The principle of least privilege says: do not run as root. Use `sudo` to elevate privileges for specific commands, then drop back to your normal user.

```bash
# Run a single command as root
sudo systemctl restart nginx

# Edit a system file (uses your $EDITOR)
sudo -e /etc/nginx/nginx.conf

# Start a root shell (use sparingly)
sudo -i

# See what sudo commands are allowed for your user
sudo -l
```

**Sudo configuration** lives in `/etc/sudoers` (edited ONLY with `visudo`, which validates syntax before saving — a typo in sudoers can lock you out of root access):

```bash
# Allow 'deploy' user to restart specific services without a password
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp, /usr/bin/systemctl reload myapp
```

**Why not just log in as root?** Because root mistakes are permanent. `rm -rf /var/log/` as your normal user fails (permission denied). As root, it succeeds silently and you have destroyed all your logs. The sudo barrier is not bureaucracy — it is a moment of "are you sure?" before every privileged action. That moment prevents disasters.

---

## 5. Filesystems & Storage

### 5.1 What a Filesystem Is

A filesystem is the structure that organizes data on a storage device. The raw disk is just a sequence of blocks (typically 512 bytes or 4096 bytes). The filesystem gives those blocks meaning — files, directories, metadata, free space tracking. Without a filesystem, a disk is a very expensive paperweight. [SRC-FS]

### 5.2 Common Linux Filesystems

| Filesystem | Journal | Snapshots | Max File Size | Best For |
|-----------|---------|-----------|---------------|----------|
| **ext4** | Yes | No | 16 TiB | General purpose. Default on most distributions. Mature, well-understood, excellent tooling. |
| **XFS** | Yes | No | 8 EiB | Large files, high throughput. Default on RHEL/Rocky. Excellent at parallel I/O. Cannot shrink — only grow. |
| **Btrfs** | CoW | Yes | 16 EiB | Snapshots, compression, checksums. Default on openSUSE and Fedora Workstation. Still maturing for some RAID configs. |
| **ZFS** | CoW | Yes | 16 EiB | Enterprise storage. Checksums, snapshots, compression, RAID-Z. Not in the mainline kernel (license incompatibility). Available via OpenZFS. |

**ext4** is the safe default. It has decades of production use, excellent recovery tools (`e2fsck`), and no surprises. If you do not have a specific reason to use something else, use ext4. [SRC-FS]

**XFS** excels at handling large files and parallel workloads. If your server writes many large log files, database files, or media files concurrently, XFS will outperform ext4. The tradeoff: you cannot shrink an XFS filesystem, only grow it.

**Btrfs** and **ZFS** are copy-on-write filesystems. When you modify a file, they write the new data to a new location and update the pointer. This means every write is atomic (no half-written files after a crash) and snapshots are essentially free (just preserving old pointers). The tradeoff: they are more complex to manage and Btrfs in particular is still evolving.

### 5.3 Inodes

An inode is a data structure that stores everything about a file except its name and its content. Each inode contains: permissions, owner, group, timestamps (access, modify, change), size, and pointers to the data blocks. [SRC-FS]

```bash
# See inode information for a file
stat /etc/hostname
#   File: /etc/hostname
#   Size: 12          Blocks: 8          IO Block: 4096   regular file
# Device: 802h/2050d  Inode: 131074      Links: 1
# Access: (0644/-rw-r--r--)  Uid: (  0/  root)   Gid: (  0/  root)
# Access: 2026-03-09 14:00:00.000000000 -0700
# Modify: 2026-01-15 10:30:00.000000000 -0800
# Change: 2026-01-15 10:30:00.000000000 -0800

# Count inodes used and available
df -i
```

Directory entries map filenames to inode numbers. This is why:
- Renaming a file is nearly instant (just update the directory entry, not the data)
- Hard links are possible (two filenames pointing to the same inode)
- Deleting a file is actually "unlinking" — removing the directory entry. The inode and data are freed only when the link count reaches zero AND no process has the file open
- You can run out of inodes before running out of space (many tiny files)

### 5.4 Mount Points and fstab

A mount point is a directory where a filesystem is attached to the directory tree. The root filesystem is mounted at `/`. Additional filesystems mount at directories within that tree. [SRC-FS]

```bash
# See all currently mounted filesystems
mount | column -t
# or more readably:
findmnt --real

# Mount a filesystem manually
mount /dev/sdb1 /mnt/data

# Unmount
umount /mnt/data
```

Persistent mounts are defined in `/etc/fstab`:

```
# /etc/fstab
# <device>              <mount point>  <type>  <options>           <dump> <pass>
UUID=a1b2c3d4-...       /              ext4    errors=remount-ro   0      1
UUID=e5f6g7h8-...       /home          ext4    defaults            0      2
UUID=i9j0k1l2-...       /var/log       xfs     defaults,noatime    0      2
tmpfs                   /tmp           tmpfs   defaults,noexec,nosuid,size=2G  0  0
```

**Using UUIDs instead of device names** (`/dev/sda1`) is essential. Device names can change if disks are reordered or hot-plugged. UUIDs are permanent identifiers burned into the filesystem at creation time. A `fstab` entry with the wrong device name mounts the wrong disk. A `fstab` entry with a UUID either mounts the right disk or fails safely.

`noatime` disables access time updates on reads — reduces write I/O on busy filesystems. `noexec` on `/tmp` prevents execution of files in temp directories — a basic security measure.

### 5.5 Disk Health Monitoring

Disks fail. Mechanical disks (HDDs) have moving parts that wear out. Solid-state drives (SSDs) have a finite number of write cycles per cell. Both types report health status through SMART (Self-Monitoring, Analysis, and Reporting Technology). [SRC-SMART]

```bash
# Install smartmontools
apt install smartmontools    # Debian/Ubuntu
dnf install smartmontools    # Fedora/RHEL

# Check disk health
smartctl -a /dev/sda

# Key SMART attributes to monitor:
# Reallocated_Sector_Ct — bad sectors the drive has already remapped. Rising = failing drive.
# Current_Pending_Sector — sectors waiting to be remapped. Non-zero = trouble.
# Offline_Uncorrectable — sectors that could not be read or corrected. Non-zero = replace soon.
# Wear_Leveling_Count (SSD) — remaining write endurance as a percentage.
# Temperature_Celsius — drives fail faster when hot. Keep below 45C.

# Run a short self-test
smartctl -t short /dev/sda
# Check results after a few minutes
smartctl -l selftest /dev/sda

# Enable automatic monitoring daemon
systemctl enable --now smartd
```

**The anti-waste principle applies:** a drive showing early SMART warnings is telling you it is going to fail. Replace it proactively. The cost of a replacement drive is trivial compared to the cost of data loss or unplanned downtime. The sysadmin reads the signals and acts before the failure.

### 5.6 LVM — Logical Volume Management

LVM adds a layer of abstraction between physical disks and filesystems. Instead of creating a filesystem directly on a partition, you create physical volumes (PVs) from disks, combine them into volume groups (VGs), and carve logical volumes (LVs) from the pool. [SRC-LVM]

```
Physical Disks         Physical Volumes     Volume Group      Logical Volumes
+-----------+          +----------+
| /dev/sda1 | -------> | PV sda1  |---+
+-----------+          +----------+   |     +----------+     +-----------+
                                      +---->|  VG main |---->| LV root   | --> /
+-----------+          +----------+   |     |          |---->| LV home   | --> /home
| /dev/sdb1 | -------> | PV sdb1  |---+     |          |---->| LV logs   | --> /var/log
+-----------+          +----------+         +----------+     +-----------+
```

**Why LVM?**
- **Resize on the fly:** Grow a filesystem without unmounting (ext4 and XFS support online grow). Shrink ext4 filesystems when space is overprovisioned.
- **Add disks without restructuring:** New disk becomes a PV, joins the VG, and existing LVs can be extended into the new space.
- **Snapshots:** Create point-in-time copies of a volume for backups or testing.

```bash
# Create a physical volume
pvcreate /dev/sdb1

# Create a volume group
vgcreate datavg /dev/sdb1

# Create a logical volume (50 GB)
lvcreate -L 50G -n appdata datavg

# Create a filesystem on it
mkfs.ext4 /dev/datavg/appdata

# Mount it
mount /dev/datavg/appdata /opt/appdata

# Later — grow the volume and filesystem online
lvextend -L +20G /dev/datavg/appdata
resize2fs /dev/datavg/appdata
```

### 5.7 The Difference Between Storage and Filesystem

Storage is the physical medium — spinning platters, flash cells, NVMe chips. It has a capacity (measured in bytes), a speed (measured in IOPS and MB/s), and a failure rate (measured in MTBF or DWPD).

A filesystem is the *logic* on top of that storage — how bytes are organized into files, how metadata is tracked, how consistency is maintained. You can put different filesystems on the same storage device and get different reliability, performance, and feature characteristics.

The sysadmin must understand both layers because problems in either manifest as the same symptom to the application: "I/O error." Knowing whether the error is a bad sector (storage layer) or a corrupted inode (filesystem layer) determines the fix. `smartctl` checks the storage. `fsck` checks the filesystem. Different tools, different layers, different answers.

---

## 6. Package Management

### 6.1 What Package Managers Do

A package manager installs, updates, and removes software while tracking dependencies. Without one, you would download source code, install build tools, resolve library dependencies by hand, compile, copy binaries to the right directories, and hope nothing conflicts. Package managers automate all of this. [SRC-APT, SRC-DNF]

### 6.2 The Major Package Managers

| Distribution Family | Package Manager | Package Format | Config Location |
|--------------------|----------------|----------------|-----------------|
| Debian, Ubuntu, Mint | `apt` (frontend) / `dpkg` (backend) | `.deb` | `/etc/apt/sources.list`, `/etc/apt/sources.list.d/` |
| Fedora, RHEL, Rocky, Alma | `dnf` (frontend) / `rpm` (backend) | `.rpm` | `/etc/yum.repos.d/` |
| Arch, Manjaro | `pacman` | `.pkg.tar.zst` | `/etc/pacman.conf`, `/etc/pacman.d/` |

### 6.3 APT (Debian/Ubuntu)

```bash
# Update the package index (metadata about available packages)
apt update
# This does NOT install anything — it refreshes the catalog

# Upgrade all installed packages to their latest versions
apt upgrade

# Install a package
apt install nginx

# Remove a package (keeps config files)
apt remove nginx

# Remove a package AND its config files
apt purge nginx

# Search for packages
apt search "web server"

# Show package details
apt show nginx

# List installed packages
apt list --installed

# Clean up downloaded package files (free disk space)
apt clean

# Show what would be upgraded without doing it
apt upgrade --dry-run
```

### 6.4 DNF (Fedora/RHEL)

```bash
# Update package metadata and upgrade all packages
dnf upgrade

# Install a package
dnf install nginx

# Remove a package
dnf remove nginx

# Search
dnf search "web server"

# Show package info
dnf info nginx

# List installed packages
dnf list --installed

# Check for security updates specifically
dnf updateinfo list --security
```

### 6.5 Pacman (Arch)

```bash
# Sync package database and upgrade all packages
pacman -Syu

# Install a package
pacman -S nginx

# Remove a package and its unneeded dependencies
pacman -Rns nginx

# Search for packages
pacman -Ss "web server"

# Show package info
pacman -Si nginx

# List explicitly installed packages
pacman -Qe
```

### 6.6 Repositories and GPG Signing

Packages come from repositories — servers that host `.deb` or `.rpm` files along with metadata. The package manager downloads the metadata, resolves dependencies, downloads the packages, verifies their signatures, and installs them. [SRC-APT, SRC-DNF]

**GPG signing** is how you know the package has not been tampered with. The repository maintainer signs each package (and the metadata) with a private key. Your system has the corresponding public key. The package manager verifies the signature before installing. If the signature does not match, the installation is refused.

```bash
# List trusted GPG keys (Debian/Ubuntu)
apt-key list    # Deprecated but still shows keys
# Modern approach: keys in /etc/apt/trusted.gpg.d/

# Verify a package signature manually (rpm)
rpm -K package.rpm
```

This is the chain of trust for software installation. You trust the repository maintainers. They sign the packages. Your system verifies the signatures. If any link breaks — an unsigned package, a revoked key, a compromised mirror — the system refuses to install. This is not paranoia; it is supply chain security.

### 6.7 Why Updates Matter

Updates are not about features. Updates are about security patches. When a vulnerability is discovered in a package you have installed, the fix is distributed as an update. Every day you delay that update, your system remains vulnerable to a known, publicly documented attack. [SRC-CVE]

```bash
# Debian/Ubuntu: list only security updates
apt list --upgradable 2>/dev/null | grep -i security

# RHEL/Rocky: list security advisories
dnf updateinfo list --security

# Apply security updates only
# Debian/Ubuntu:
apt upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
# RHEL/Rocky:
dnf upgrade --security
```

**Automatic security updates** (unattended-upgrades on Debian/Ubuntu, dnf-automatic on RHEL) apply security patches without manual intervention. For servers that must stay patched but cannot afford unexpected reboots, configure automatic security updates with notification but manual reboot scheduling.

The anti-waste principle: a compromised server does not serve its purpose. It serves the attacker's purpose. An unpatched vulnerability is wasted security — the fix exists, it is free, and not applying it is neglect.

---

## 7. The Server's Day

### 7.1 From Power-On to Serving Requests

Every time a server starts — whether from a cold boot, a reboot, or a power restoration — it follows a precise sequence. The sysadmin understands every step because any step can fail, and the failure mode of each step is different. [SRC-KERN, SRC-SYSD]

### 7.2 The Boot Sequence

```
Phase 1: Firmware
+------------------+
| BIOS / UEFI      |  Hardware initialization: CPU, RAM test, storage detection
| POST              |  Power-On Self-Test: does the hardware work?
| Boot device       |  Find the bootloader on disk (MBR or EFI System Partition)
+------------------+
        |
Phase 2: Bootloader
+------------------+
| GRUB2             |  Loads the kernel and initramfs from /boot
|                   |  Presents menu if multiple kernels are available
|                   |  Passes kernel parameters (root=, quiet, single, etc.)
+------------------+
        |
Phase 3: Kernel
+------------------+
| Linux kernel      |  Decompresses into memory
|                   |  Initializes core subsystems: memory manager, scheduler, VFS
|                   |  Loads initramfs — a minimal root filesystem in RAM
|                   |  initramfs loads storage drivers, finds the real root filesystem
|                   |  Mounts the real root filesystem
|                   |  Starts /sbin/init (PID 1 — usually systemd)
+------------------+
        |
Phase 4: Init (systemd)
+------------------+
| systemd (PID 1)  |  Reads unit files, builds dependency graph
|                   |  Mounts filesystems from /etc/fstab
|                   |  Starts services in parallel (respecting dependencies)
|                   |  Activates the default target (multi-user.target)
+------------------+
        |
Phase 5: Services
+------------------+
| sshd              |  Remote access
| nginx             |  Web server
| postgresql        |  Database
| your app          |  Application server
| chronyd/ntpd      |  Time synchronization
+------------------+
        |
Phase 6: Ready
+------------------+
| System ready      |  All services running
| Accepting traffic |  The server is serving its purpose
+------------------+
```

### 7.3 What Can Fail at Each Phase

| Phase | Failure Mode | Symptoms | Recovery |
|-------|-------------|----------|----------|
| **Firmware** | Bad RAM, dead disk, failed POST | No video output, beep codes, stuck at vendor logo | Hardware replacement. Check cables, reseat RAM, swap disks. |
| **Bootloader** | Corrupted GRUB, wrong boot device, missing kernel | "GRUB rescue>" prompt, "No bootable device" | Boot from rescue media, reinstall GRUB, fix boot order in BIOS. |
| **Kernel** | Missing driver, corrupted initramfs, kernel panic | "Kernel panic - not syncing", freeze during boot | Boot older kernel from GRUB menu, rebuild initramfs. |
| **Systemd** | Failed mount (bad fstab), dependency loop | "A start job is running for...", emergency mode prompt | Fix /etc/fstab from rescue shell, check `systemctl --failed`. |
| **Services** | Config error, port conflict, missing dependency | Service status "failed", application not responding | `journalctl -u servicename`, fix config, restart. |

```bash
# After a failed boot, check what went wrong:
systemctl --failed           # List failed services
journalctl -b -p err         # All errors from the current boot
journalctl -b -1             # Logs from the previous boot (if retained)
dmesg | tail -50             # Kernel ring buffer — hardware and driver messages
```

### 7.4 The Admin's Boot Checklist

After every boot (especially unexpected reboots), a responsible sysadmin verifies:

```bash
# 1. System came up correctly
uptime                        # When did it boot? Was the reboot expected?
who -b                        # Last system boot time

# 2. All services are running
systemctl --failed            # Any failed services?
systemctl is-active nginx postgresql myapp
                              # Are critical services active?

# 3. Filesystems are healthy
df -h                         # Disk space — any filesystem full?
mount | grep -v cgroup        # Everything mounted correctly?

# 4. Network is up
ip addr show                  # Do interfaces have addresses?
ip route show                 # Is the default gateway set?
ping -c 3 8.8.8.8            # Can we reach the internet?
dig example.com               # Is DNS working?

# 5. Time is correct
timedatectl                   # Is NTP synchronized?
                              # Incorrect time breaks TLS, log correlation,
                              # scheduled jobs, and authentication tokens

# 6. Check logs for anything unusual
journalctl -b -p warning --no-pager | tail -50
                              # Warnings and above from this boot
```

This is stewardship. The server is infrastructure. Infrastructure does not take care of itself. The sysadmin reads the trail — the logs, the metrics, the status of every service — and confirms that the machine is doing what it is supposed to do. Not what it was supposed to do yesterday, but what it is doing right now.

---

## 8. Cross-Reference

| Topic | This Module | Related Module | Connection |
|-------|------------|----------------|------------|
| Network configuration | Section 1 (infrastructure context) | [The Network](02-the-network.md) | IP, DNS, routing configuration on servers |
| Log analysis | Section 3.7 (journalctl basics) | [The Logs](03-the-logs.md) | Deep dive into log formats, aggregation, alerting |
| Process forensics | Section 2 (process basics) | [Process Forensics](04-process-forensics.md) | strace, lsof, debugging live processes |
| System hardening | Section 4.5 (least privilege) | [Security Operations](07-security-operations.md) | Full hardening checklist, CIS benchmarks |
| Service dependencies | Section 3.4 (unit files) | [Process Forensics](04-process-forensics.md) | Diagnosing dependency failures |
| Filesystem integrity | Section 5.3 (inodes) | [Data Provenance](05-data-provenance.md) | Checksums, change tracking, audit trails |
| Access control | Section 4.3 (permissions) | [Access & Bandwidth](06-access-bandwidth.md) | Trust levels, bandwidth allocation |

---

## 9. Sources

| ID | Source | Description |
|----|--------|-------------|
| SRC-KERN | [kernel.org Documentation](https://www.kernel.org/doc/html/latest/) | Official Linux kernel documentation — process management, virtual filesystem, memory management, syscall interface |
| SRC-FHS | [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html) | Linux Foundation specification for directory structure and file placement |
| SRC-PROC | [proc(5) man page](https://man7.org/linux/man-pages/man5/proc.5.html) | Documentation for the /proc virtual filesystem — process state, kernel parameters, system information |
| SRC-SYSD | [systemd Documentation](https://www.freedesktop.org/software/systemd/man/) | Official systemd man pages — systemctl, journalctl, unit file format, service management |
| SRC-SIGNAL | [signal(7) man page](https://man7.org/linux/man-pages/man7/signal.7.html) | POSIX signal overview — signal types, default actions, handler registration |
| SRC-PASSWD | [passwd(5) man page](https://man7.org/linux/man-pages/man5/passwd.5.html) | Format of /etc/passwd, /etc/shadow, /etc/group — user and group identity model |
| SRC-CHMOD | [chmod(1) man page](https://man7.org/linux/man-pages/man1/chmod.1.html) | File permission modification — octal notation, symbolic notation, special bits |
| SRC-SUDO | [sudo(8) man page](https://www.sudo.ws/docs/man/sudo.man/) | Privilege escalation — sudoers configuration, security policies, audit logging |
| SRC-FS | [filesystems(5) man page](https://man7.org/linux/man-pages/man5/filesystems.5.html) | Linux filesystem types — ext4, XFS, Btrfs features and mount options |
| SRC-LVM | [LVM2 Documentation](https://sourceware.org/lvm2/) | Logical Volume Manager — PV/VG/LV concepts, online resize, snapshots |
| SRC-SMART | [smartmontools](https://www.smartmontools.org/) | SMART disk health monitoring — attribute interpretation, self-tests, failure prediction |
| SRC-APT | [Debian APT Documentation](https://wiki.debian.org/Apt) | APT package manager — repository configuration, package operations, security |
| SRC-DNF | [DNF Documentation](https://dnf.readthedocs.io/) | DNF package manager — transaction management, repository handling, plugin system |
| SRC-CVE | [NIST National Vulnerability Database](https://nvd.nist.gov/) | CVE tracking — vulnerability severity scoring, affected package identification |
| SRC-POSIX | [POSIX.1-2017 / IEEE Std 1003.1](https://pubs.opengroup.org/onlinepubs/9699919799/) | POSIX standard — portable operating system interface, syscall specifications, utility conventions |

---

## The Through-Line

A server is not a black box. It is a stack of systems, each with a purpose, each leaving a trail. The filesystem hierarchy tells you where to look. The process table tells you what is running. Systemd tells you what should be running. The permission model tells you who can do what. The package manager tells you what is installed and whether it is current. The boot sequence tells you the order of operations and where failures hide.

The sysadmin does not need to memorize all of this. The sysadmin needs to know that these layers exist, that each layer is inspectable, and that the truth is always available if you know which file to read, which command to run, which log to check. Infrastructure already exists — the admin's job is to understand it, maintain it, and steward it so that every service running on that machine earns its place.

Nothing runs that does not have a reason. Nothing is installed that is not needed. Every permission is intentional. Every service has a unit file. Every boot is verified. That is stewardship.
