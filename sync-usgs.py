#!/usr/bin/env python3
"""Sync USGS pages to tibsfox.com/Research/USGS/ via FTP TLS."""
import ftplib
import os
import sys

# Load credentials
ENV_FILE = "/path/to/projectGSD/dev-tools/gsd-skill-creator-nasa/.env"
env = {}
for line in open(ENV_FILE):
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        env[k] = v

LOCAL_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "www", "tibsfox", "com", "Research")

# Directories to sync
SYNC_DIRS = [
    "USGS",
    "USGS/boulder-creek",
    "USGS/puget-sound",
    "USGS/cascadia",
    "USGS/preparedness",
    "MUK",  # updated boulder-creek-quake.html
    "NASA/artemis-ii",  # status.json, ai-coverage.html, papers.html
    "OPEN",  # updated problem cards
    "OPEN/problems",  # individual problem deep-dives
    "forest",  # slime mold simulation
    "ECO",  # slime mold research page
    "PNW-NEWS",  # daily news
    "CERN",  # CERN research knowledge base
    "DRP",  # Disaster Recovery & Protective Systems
    "MUS",  # Music Theory & Performance
    "MUS/nodes",  # Knowledge node deep-dive pages
    "CSP",  # Computer Science & Programming
    "LIVE",  # Real-time monitoring dashboards
]

dry_run = "--dry-run" in sys.argv

print(f"=== FTP Sync to tibsfox.com ===")
print(f"{'DRY RUN' if dry_run else 'LIVE SYNC'}")
print()

try:
    ftp = ftplib.FTP_TLS(env["FTP_HOST"])
    ftp.auth()
    ftp.prot_p()
    ftp.login(env["FTP_USER"], env["FTP_PASS"])
    print(f"Connected to {env['FTP_HOST']}")

    uploaded = 0

    for sync_dir in SYNC_DIRS:
        local_dir = os.path.join(LOCAL_BASE, sync_dir)
        if not os.path.isdir(local_dir):
            continue

        # Ensure remote directory exists
        remote_dir = "/" + sync_dir
        parts = remote_dir.split("/")
        for i in range(1, len(parts) + 1):
            d = "/".join(parts[:i])
            if not d:
                continue
            try:
                ftp.mkd(d)
                print(f"  mkdir {d}")
            except ftplib.error_perm:
                pass  # already exists

        # Upload files in this directory
        for fname in os.listdir(local_dir):
            fpath = os.path.join(local_dir, fname)
            if not os.path.isfile(fpath):
                continue
            if fname.startswith("."):
                continue

            remote_path = "/" + sync_dir + "/" + fname
            size = os.path.getsize(fpath)

            if dry_run:
                print(f"  [dry] {remote_path} ({size:,} bytes)")
            else:
                with open(fpath, "rb") as f:
                    ftp.storbinary(f"STOR {remote_path}", f)
                print(f"  PUT {remote_path} ({size:,} bytes)")
            uploaded += 1

    ftp.quit()
    print()
    print(f"=== {'Would upload' if dry_run else 'Uploaded'} {uploaded} files ===")
    print(f"https://tibsfox.com/Research/USGS/")
    print(f"https://tibsfox.com/Research/USGS/boulder-creek/")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
