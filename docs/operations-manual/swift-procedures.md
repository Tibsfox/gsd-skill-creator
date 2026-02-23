# Swift Object Storage -- Operations Procedures

**Service:** OpenStack Swift (Distributed Object Storage)
**SE Phase:** Phase E (Operations & Sustainment)
**NPR Reference:** NPR 7123.1 SS 3.2 Process 9 (Product Transition)
**Document Standard:** NASA-STD-3001 (adapted for cloud operations)

This document contains all operational procedures for the OpenStack Swift object storage service. Swift provides distributed, eventually consistent object storage with an HTTP-accessible API. It supports S3-compatible access via the s3api middleware, container-level ACLs, time-limited tempURLs, large object segmentation (SLO/DLO), object versioning, and ring-based data placement. Each procedure follows NASA procedure format with verification commands that can be validated against the running system.

---

## Table of Contents

- [OPS-SWIFT-001: Service Health Check (Daily)](#ops-swift-001-service-health-check-daily)
- [OPS-SWIFT-002: Container Management](#ops-swift-002-container-management)
- [OPS-SWIFT-003: Object Lifecycle Management](#ops-swift-003-object-lifecycle-management)
- [OPS-SWIFT-004: ACL Management](#ops-swift-004-acl-management)
- [OPS-SWIFT-005: Ring Management](#ops-swift-005-ring-management)
- [OPS-SWIFT-006: TempURL Configuration and Usage](#ops-swift-006-tempurl-configuration-and-usage)
- [OPS-SWIFT-007: Large Object Handling (SLO/DLO)](#ops-swift-007-large-object-handling-slodlo)
- [OPS-SWIFT-008: Backup and Restore](#ops-swift-008-backup-and-restore)
- [OPS-SWIFT-009: S3 API Configuration and Usage](#ops-swift-009-s3-api-configuration-and-usage)
- [OPS-SWIFT-010: Quota and Capacity Management](#ops-swift-010-quota-and-capacity-management)

---

## OPS-SWIFT-001: Service Health Check (Daily)

```
PROCEDURE ID: OPS-SWIFT-001
TITLE: Swift Object Storage Daily Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Verify that all Swift object storage services are running, the proxy API responds, rings are valid, and storage devices are healthy. Execute daily or after any infrastructure change to confirm object storage services remain operational. A failing Swift service prevents object uploads, container operations, and any service using Swift as a backend (Glance, Cinder backup).

### PRECONDITIONS

1. SSH access to the controller/storage node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Docker daemon running on the host
4. Network connectivity to the Swift proxy endpoint (port 8080)
5. Keystone authentication working (verify with OPS-KEYSTONE-001)

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any configuration or data
- Object listing operations on very large containers may take time but do not affect service
- No service disruption expected from any step in this procedure

### PROCEDURE

Step 1: Verify Swift containers are running.

```bash
docker ps --format '{{.Names}}' | grep swift
```

Expected result: The following containers are listed:
```
swift_proxy_server
swift_account_server
swift_container_server
swift_object_server
swift_account_reaper
swift_object_expirer
swift_rsyncd
```

If unexpected: If any container is missing, check its status with `docker ps -a --filter name=swift`. If the container exited, inspect logs with `docker logs <container_name> 2>&1 | tail -50`. Restart the container with `docker restart <container_name>`.

Step 2: Source admin credentials.

```bash
source /etc/kolla/admin-openrc.sh
```

Expected result: No output. The shell environment contains OpenStack authentication variables.

If unexpected: If the file does not exist, regenerate with `kolla-ansible -i inventory post-deploy`.

Step 3: Verify the Swift service is registered in the Keystone catalog.

```bash
openstack service list | grep object-store
openstack endpoint list --service swift -f table
```

Expected result: The object-store service is listed with three endpoints (public, internal, admin) in RegionOne.

```
+------+--------+-----------+-----------+---------+-----------+---------------------------------------+
| ID   | Region | Service   | Service   | Enabled | Interface | URL                                   |
|      | Name   | Name      | Type      |         |           |                                       |
+------+--------+-----------+-----------+---------+-----------+---------------------------------------+
| ...  | Regio  | swift     | object-   | True    | public    | http://controller:8080/v1/AUTH_%(...)  |
| ...  | Regio  | swift     | object-   | True    | internal  | http://controller:8080/v1/AUTH_%(...)  |
| ...  | Regio  | swift     | object-   | True    | admin     | http://controller:8080/v1/AUTH_%(...)  |
+------+--------+-----------+-----------+---------+-----------+---------------------------------------+
```

If unexpected: If endpoints are missing, use OPS-KEYSTONE-009 to add the missing endpoints for the object-store service.

Step 4: Check the Swift account to confirm the API responds.

```bash
openstack object store account show
```

Expected result: Account information showing container count, object count, and bytes used.

```
+------------+---------------------------------------+
| Field      | Value                                 |
+------------+---------------------------------------+
| Account    | AUTH_a1b2c3d4e5f6...                  |
| Bytes      | 12345678                              |
| Containers | 3                                     |
| Objects    | 42                                    |
+------------+---------------------------------------+
```

If unexpected: If the command returns an error, check `docker logs swift_proxy_server 2>&1 | tail -50` for authentication or connection errors.

Step 5: Verify ring files are present and valid.

```bash
docker exec swift_proxy_server ls -la /etc/swift/*.ring.gz
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder 2>&1 | head -5
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder 2>&1 | head -5
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder 2>&1 | head -5
```

Expected result: Three ring files exist (account.ring.gz, container.ring.gz, object.ring.gz). Ring builder output shows partition power, replicas, and device count for each ring.

If unexpected: If ring files are missing or corrupted, rings must be rebuilt. Refer to OPS-SWIFT-005 for ring management.

Step 6: Verify storage device health.

```bash
docker exec swift_object_server swift-recon --diskusage 2>/dev/null || \
  df -h /srv/node/ 2>/dev/null || \
  df -h | grep swift
```

Expected result: Storage devices show usage statistics with available space. Usage should be below 80%.

If unexpected: If disk usage exceeds 90%, initiate capacity planning. If a device is offline, check `dmesg | tail -20` for hardware errors.

Step 7: Check Swift proxy logs for errors.

```bash
docker logs swift_proxy_server 2>&1 | grep -iE "ERROR|CRITICAL" | tail -20
```

Expected result: No output or only benign entries. Zero ERROR or CRITICAL messages in recent logs.

If unexpected: Record error messages and correlate with timestamps. Frequent 503 errors indicate backend storage issues. Frequent 401 errors indicate authentication configuration problems.

Step 8: Perform a basic upload and download test.

```bash
echo "health-check-$(date +%s)" | openstack object create health-test health-check.txt
openstack object show health-test health-check.txt -c content_length
openstack object delete health-test health-check.txt
openstack container delete health-test 2>/dev/null
```

Expected result: Object creates, shows valid content length, and deletes without errors.

If unexpected: If the upload fails, check storage device availability and proxy logs. If the download fails but upload succeeded, check eventual consistency timing -- wait 10 seconds and retry.

### VERIFICATION

1. Confirm all Swift containers are in "Up" state: `docker ps --filter name=swift --format '{{.Names}}: {{.Status}}'`
2. Confirm API responds: `openstack object store account show` returns without error
3. Confirm rings are valid: all three ring builders report valid configuration
4. Confirm storage devices have space: usage below 80%
5. Confirm zero ERROR/CRITICAL log entries in recent logs

### ROLLBACK

This is a read-only health check procedure. No rollback is required.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (authentication prerequisite)
- OPS-SWIFT-005: Ring Management (ring troubleshooting)
- OPS-SWIFT-010: Quota and Capacity Management (storage capacity)
- https://docs.openstack.org/swift/2024.2/admin/
- https://docs.openstack.org/swift/2024.2/ops_runbook/index.html
- SP-6105 SS 5.4 (Operations Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-002: Container Management

```
PROCEDURE ID: OPS-SWIFT-002
TITLE: Swift Container Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create, configure, list, and delete Swift containers (the equivalent of S3 buckets). Execute when setting up storage for new applications, organizing objects into logical groupings, configuring container-level features (versioning, expiry), or cleaning up unused containers.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with OpenStack CLI installed
2. Admin or project member credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Swift service healthy (verify with OPS-SWIFT-001)
4. `python-swiftclient` installed for advanced container operations

### SAFETY CONSIDERATIONS

- Creating containers is non-destructive
- Deleting a container requires the container to be empty -- all objects must be deleted first
- Container metadata changes take effect immediately
- Enabling versioning after objects already exist does not version the existing objects retroactively
- Container names cannot be changed after creation -- delete and recreate to rename

### PROCEDURE

Step 1: List existing containers.

```bash
openstack container list
swift list
```

Expected result: A list of container names in the current project.

If unexpected: If no containers appear, verify project credentials are correct with `openstack token issue`.

Step 2: Create a new container.

```bash
openstack container create <container-name>
```

Expected result: Container created. Output confirms the container name.

```
+-----------+------------------+
| account   | AUTH_a1b2c3d4... |
| container | my-container     |
+-----------+------------------+
```

If unexpected: If creation fails with a quota error, check project quotas with `swift stat` and request a quota increase if needed.

Step 3: View container details and metadata.

```bash
swift stat <container-name>
```

Expected result: Container statistics showing object count, bytes used, read/write ACLs, and any custom metadata.

```
               Account: AUTH_a1b2c3d4...
             Container: my-container
               Objects: 0
                 Bytes: 0
              Read ACL:
             Write ACL:
               Sync To:
              Sync Key:
         Accept-Ranges: bytes
      X-Storage-Policy: standard
         Last-Modified: Sun, 22 Feb 2026 12:00:00 GMT
           X-Timestamp: 1771900000.00000
```

If unexpected: If the container is not found, verify the container name and project scope.

Step 4: Set container metadata.

```bash
swift post <container-name> \
  --header "X-Container-Meta-Description: Application logs storage" \
  --header "X-Container-Meta-Owner: ops-team"
```

Expected result: No output on success. Metadata is attached to the container.

If unexpected: If the post fails, check authentication and container ownership.

Step 5: Enable object versioning on a container.

```bash
# Create the versions container first
openstack container create <container-name>-versions

# Enable versioning on the primary container
swift post <container-name> -H "X-Versions-Location: <container-name>-versions"
```

Expected result: Versioning is enabled. Subsequent overwrites of objects in the container will store previous versions in the versions container.

If unexpected: If the versions container cannot be created, check project quota for container count.

Step 6: Delete all objects in a container.

```bash
swift delete <container-name> --prefix "" 2>&1 | tail -5
```

Expected result: All objects in the container are deleted. Output shows deletion progress.

If unexpected: If objects cannot be deleted due to permissions, check container write ACLs (OPS-SWIFT-004).

Step 7: Delete an empty container.

```bash
openstack container delete <container-name>
```

Expected result: Container deleted. No output on success.

If unexpected: If deletion fails with "Conflict (409)," the container is not empty. Run Step 6 first to delete all objects, then retry.

### VERIFICATION

1. Confirm container created: `openstack container show <container-name>` returns container details
2. Confirm metadata set: `swift stat <container-name>` shows expected metadata headers
3. Confirm versioning enabled: `swift stat <container-name>` shows `X-Versions-Location` header
4. Confirm container deleted: `openstack container show <container-name>` returns "Not Found"

### ROLLBACK

1. If a container was accidentally deleted: recreate with `openstack container create <container-name>` -- object data is lost permanently
2. If metadata was incorrectly set: override with correct values using `swift post <container-name> --header "X-Container-Meta-Key: correct-value"`
3. If versioning was enabled unintentionally: remove with `swift post <container-name> -H "X-Remove-Versions-Location: true"`

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-003: Object Lifecycle Management (object operations within containers)
- OPS-SWIFT-004: ACL Management (container access control)
- https://docs.openstack.org/swift/2024.2/api/container_operations.html
- https://docs.openstack.org/swift/2024.2/overview_object_versioning.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-003: Object Lifecycle Management

```
PROCEDURE ID: OPS-SWIFT-003
TITLE: Object Lifecycle Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Manage object lifecycle operations including upload, download, metadata tagging, expiry configuration, and deletion. Execute when storing application data, implementing data retention policies, configuring automatic object expiration, or performing bulk object operations.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with OpenStack/Swift CLI installed
2. Project member credentials sourced
3. Target container exists (create with OPS-SWIFT-002 if needed)
4. Swift service healthy (verify with OPS-SWIFT-001)

### SAFETY CONSIDERATIONS

- Object uploads overwrite existing objects with the same name without warning (unless versioning is enabled)
- Object deletion is permanent unless the container has versioning enabled
- Setting `X-Delete-After` or `X-Delete-At` schedules automatic, irreversible deletion
- Bulk delete operations cannot be undone -- verify the object list before proceeding

### PROCEDURE

Step 1: Upload an object to a container.

```bash
openstack object create <container-name> /path/to/local-file.txt
```

Expected result: Object created in the container. Output confirms the object name.

If unexpected: If the upload fails with 413 (Request Entity Too Large), the object exceeds the single-object size limit (default 5 GB). Use OPS-SWIFT-007 for large object handling.

Step 2: Upload an object with custom metadata.

```bash
swift upload <container-name> local-file.txt \
  --header "X-Object-Meta-Author: admin" \
  --header "X-Object-Meta-Department: engineering" \
  --header "Content-Type: text/plain"
```

Expected result: Object uploaded with custom metadata headers attached.

If unexpected: If metadata headers are rejected, check for special characters in header values.

Step 3: List objects in a container.

```bash
openstack object list <container-name>
swift list <container-name> --long
```

Expected result: A list of objects showing names, sizes, content types, and last-modified dates.

If unexpected: If the listing is empty but objects were uploaded recently, wait 10-30 seconds for eventual consistency to propagate, then retry.

Step 4: Download an object.

```bash
openstack object save <container-name> remote-file.txt --file /path/to/local-copy.txt
```

Expected result: Object downloaded to the specified local path.

If unexpected: If the download fails with 404, verify the object name with `openstack object list <container-name>`.

Step 5: View object metadata.

```bash
swift stat <container-name> <object-name>
```

Expected result: Object statistics including content length, content type, ETag (MD5 hash), last modified date, and custom metadata.

If unexpected: If the object is not found, check the container name and object name.

Step 6: Set an object to expire after a duration.

```bash
swift post <container-name> <object-name> -H "X-Delete-After: 86400"
```

Expected result: No output on success. The object will be automatically deleted after 86400 seconds (24 hours).

If unexpected: If the header is rejected, verify the `object_expirer` service is running: `docker ps --filter name=swift_object_expirer`.

Step 7: Set an object to expire at a specific time.

```bash
# Calculate Unix timestamp for a specific date
EXPIRE_AT=$(date -d "2026-03-01 00:00:00 UTC" +%s)
swift post <container-name> <object-name> -H "X-Delete-At: ${EXPIRE_AT}"
```

Expected result: No output on success. The object will be deleted at the specified Unix timestamp.

If unexpected: If the timestamp is in the past, the object will be deleted on the next expirer pass.

Step 8: Delete a single object.

```bash
openstack object delete <container-name> <object-name>
```

Expected result: Object deleted. No output on success.

If unexpected: If deletion fails with 403, check container write ACLs (OPS-SWIFT-004).

Step 9: Bulk delete objects by prefix.

```bash
swift delete <container-name> --prefix "logs/2025/"
```

Expected result: All objects with the specified prefix are deleted. Output shows deletion count.

If unexpected: If some objects fail to delete, check for large objects with manifests that need separate cleanup.

### VERIFICATION

1. Confirm object uploaded: `openstack object show <container-name> <object-name>` returns object details
2. Confirm metadata set: `swift stat <container-name> <object-name>` shows custom headers
3. Confirm expiry set: `swift stat <container-name> <object-name>` shows `X-Delete-At` header
4. Confirm object deleted: `openstack object show <container-name> <object-name>` returns "Not Found"
5. Confirm data integrity: compare downloaded file hash with original: `md5sum /path/to/local-file.txt`

### ROLLBACK

1. If an object was accidentally deleted (without versioning): re-upload from source
2. If an object was accidentally deleted (with versioning): the previous version is automatically restored
3. If expiry was set incorrectly: remove with `swift post <container-name> <object-name> -H "X-Remove-Delete-At: true"`
4. If metadata was set incorrectly: overwrite with `swift post <container-name> <object-name> -H "X-Object-Meta-Key: correct-value"`

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-002: Container Management (container setup)
- OPS-SWIFT-007: Large Object Handling (objects >5 GB)
- https://docs.openstack.org/swift/2024.2/api/object_operations.html
- https://docs.openstack.org/swift/2024.2/overview_expiring_objects.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-004: ACL Management

```
PROCEDURE ID: OPS-SWIFT-004
TITLE: Swift Container ACL Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Configure container-level access control lists (ACLs) to share containers between projects, grant public read access, or restrict write access. Execute when sharing data between teams, publishing static content, or implementing cross-project storage access patterns.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with Swift CLI installed
2. Container owner credentials sourced (admin or project owner)
3. Target container exists (create with OPS-SWIFT-002 if needed)
4. Target project IDs or user IDs known for cross-project sharing
5. Swift service healthy (verify with OPS-SWIFT-001)

### SAFETY CONSIDERATIONS

- Public read ACL (`.r:*`) makes all objects in the container accessible to anyone with the URL -- no authentication required
- Write ACL grants the ability to upload, overwrite, and delete objects -- grant with caution
- ACL changes take effect immediately
- Incorrect ACLs can expose sensitive data or allow unauthorized modifications
- Container listing (`.rlistings`) combined with public read allows directory enumeration

### PROCEDURE

Step 1: View current ACLs on a container.

```bash
swift stat <container-name>
```

Expected result: Output shows `Read ACL` and `Write ACL` fields. Empty fields mean only the owner project has access.

If unexpected: If the container is not found, verify the container name and project scope.

Step 2: Grant public read access (anonymous access).

```bash
swift post <container-name> --read-acl ".r:*,.rlistings"
```

Expected result: No output on success. Any unauthenticated user can now read objects and list the container contents.

If unexpected: If the post fails, check that the user has ownership of the container.

Step 3: Grant read access to a specific project.

```bash
swift post <container-name> --read-acl "<target-project-id>:*"
```

Expected result: No output on success. All users in the target project can read objects in this container.

If unexpected: Verify the target project ID with `openstack project show <project-name> -c id`.

Step 4: Grant write access to a specific project.

```bash
swift post <container-name> --write-acl "<target-project-id>:*"
```

Expected result: No output on success. All users in the target project can upload, overwrite, and delete objects.

If unexpected: If the write ACL does not take effect, check that the target user has the `member` or `swiftoperator` role in their project.

Step 5: Grant read access to a specific user in a project.

```bash
swift post <container-name> --read-acl "<project-id>:<user-id>"
```

Expected result: No output on success. Only the specified user in the specified project can read objects.

If unexpected: Verify the user ID with `openstack user show <username> -c id`.

Step 6: Combine multiple ACL rules.

```bash
swift post <container-name> --read-acl "<project-a-id>:*,<project-b-id>:<user-id>"
```

Expected result: No output on success. Project A gets full read access; the specific user in Project B also gets read access.

If unexpected: Ensure ACL entries are comma-separated without spaces after commas.

Step 7: Remove all ACLs (restore owner-only access).

```bash
swift post <container-name> --read-acl "" --write-acl ""
```

Expected result: No output on success. Only the container owner project can access the container.

If unexpected: If the ACLs are not cleared, verify with `swift stat <container-name>`.

Step 8: Verify ACL changes.

```bash
swift stat <container-name>
```

Expected result: `Read ACL` and `Write ACL` fields reflect the configured ACL rules.

If unexpected: If the ACLs are not as expected, reapply the correct ACLs from the appropriate step above.

### VERIFICATION

1. Confirm ACL set: `swift stat <container-name>` shows expected `Read ACL` and `Write ACL` values
2. Confirm public access (if set): `curl -s http://<swift-proxy>:8080/v1/AUTH_<account>/<container>/<object>` returns object data
3. Confirm project access (if set): switch to target project credentials and run `swift list <container-name>`
4. Confirm access revoked (after removal): target project credentials return "403 Forbidden"

### ROLLBACK

1. Remove public access: `swift post <container-name> --read-acl ""`
2. Remove project access: `swift post <container-name> --read-acl ""` to clear, then re-add only authorized entries
3. Remove write access: `swift post <container-name> --write-acl ""`
4. Verify ACLs reverted: `swift stat <container-name>` shows expected state

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-002: Container Management (container setup)
- OPS-SWIFT-006: TempURL Configuration (time-limited access alternative)
- https://docs.openstack.org/swift/2024.2/overview_acl.html
- https://docs.openstack.org/swift/2024.2/api/container_operations.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-005: Ring Management

```
PROCEDURE ID: OPS-SWIFT-005
TITLE: Swift Ring Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Inspect, validate, and rebalance Swift rings. Rings control how Swift maps objects to physical storage devices. Execute when adding or removing storage devices, investigating data placement issues, or performing capacity changes. Ring management is critical for maintaining data availability and balanced storage utilization.

### PRECONDITIONS

1. SSH access to the controller/storage node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to Swift ring builder files (`.builder` files)
4. Understanding of the ring architecture: partition power, replicas, min-part-hours
5. Swift service healthy (verify with OPS-SWIFT-001)

### SAFETY CONSIDERATIONS

- Ring rebalancing redistributes data partitions across devices -- this triggers background data movement
- During rebalancing, some requests may temporarily return 404 as data migrates (eventual consistency)
- The `min_part_hours` setting prevents overly frequent rebalancing (default: 1 hour between rebalances)
- Ring builder files (`.builder`) must be preserved -- they are the source of truth for ring state
- Losing a `.builder` file requires rebuilding the ring from scratch, which can cause data unavailability
- After any ring change, updated `.ring.gz` files must be distributed to all Swift nodes

### PROCEDURE

Step 1: Inspect current ring state for all three rings.

```bash
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder
```

Expected result: Each ring builder shows partition power, replicas, min-part-hours, device count, and balance.

```
account.builder, build version N, id ...
1024 partitions, 1.000000 replicas, 1 regions, 1 zones, 1 devices, 0.00 balance, 0.00 dispersion
The minimum number of hours before a partition can be reassigned is 1
...
```

If unexpected: If a builder file is missing, the ring must be rebuilt. Refer to Step 7 for ring initialization.

Step 2: List devices in each ring.

```bash
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder search --region 1
```

Expected result: Device listing showing region, zone, IP, port, device name, weight, and partition count.

If unexpected: If no devices are listed, devices have not been added to the ring. Proceed to Step 3.

Step 3: Add a new device to a ring.

```bash
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder add \
  --region 1 --zone 1 --ip <device-ip> --port 6202 --device <device-name> --weight 100

docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder add \
  --region 1 --zone 1 --ip <device-ip> --port 6201 --device <device-name> --weight 100

docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder add \
  --region 1 --zone 1 --ip <device-ip> --port 6200 --device <device-name> --weight 100
```

Expected result: Device added to each ring builder. Output confirms the device addition.

If unexpected: If the device IP is already in the ring, the add fails. Use `swift-ring-builder <ring>.builder search` to verify.

Step 4: Rebalance the rings.

```bash
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder rebalance
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder rebalance
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder rebalance
```

Expected result: Each ring rebalances and reports the new partition distribution and balance factor.

If unexpected: If rebalancing is refused due to `min_part_hours`, wait for the cooldown period to elapse and retry. The output will indicate the remaining wait time.

Step 5: Distribute updated ring files.

```bash
# For Kolla-Ansible deployments, reconfigure distributes rings
kolla-ansible -i inventory reconfigure --tags swift
```

Expected result: Ring files distributed to all Swift nodes. Swift services pick up the new rings.

If unexpected: If Kolla-Ansible reconfigure fails, manually copy `.ring.gz` files to each node's `/etc/swift/` directory.

Step 6: Remove a device from a ring (drain first by setting weight to 0).

```bash
# Set weight to 0 to drain partitions off the device
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder set_weight \
  --ip <device-ip> --device <device-name> 0

# Rebalance to move partitions away
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder rebalance

# After data migration completes, remove the device
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder remove \
  --ip <device-ip> --device <device-name>

# Final rebalance
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder rebalance
```

Expected result: Device drained and removed from the ring. Data migrated to remaining devices.

If unexpected: Monitor the replicator process to confirm data migration: `docker logs swift_object_server 2>&1 | grep replicat | tail -20`.

Step 7: Initialize a new ring (disaster recovery only).

```bash
# Create new ring builders
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder create 10 1 1
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder create 10 1 1
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder create 10 1 1

# Add devices (repeat for each device)
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder add \
  --region 1 --zone 1 --ip <ip> --port 6202 --device <dev> --weight 100
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder add \
  --region 1 --zone 1 --ip <ip> --port 6201 --device <dev> --weight 100
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder add \
  --region 1 --zone 1 --ip <ip> --port 6200 --device <dev> --weight 100

# Rebalance all rings
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder rebalance
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder rebalance
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder rebalance
```

Expected result: New rings created and balanced. Swift can locate data on existing devices if the partition power and device configuration match the previous ring.

If unexpected: If the partition power differs from the original ring, data placement will not match existing data on disk. Data will be inaccessible until the replicator relocates it.

### VERIFICATION

1. Confirm ring builder shows correct device count: `swift-ring-builder <ring>.builder` lists all expected devices
2. Confirm balance factor is acceptable: balance < 1.0 is ideal; < 5.0 is acceptable
3. Confirm ring files exist: `docker exec swift_proxy_server ls -la /etc/swift/*.ring.gz`
4. Confirm API responds after changes: `openstack object store account show`
5. Run OPS-SWIFT-001 for a complete health check

### ROLLBACK

1. If a device was incorrectly added: remove it with `swift-ring-builder <ring>.builder remove` and rebalance
2. If rebalancing caused issues: restore the previous `.builder` and `.ring.gz` files from backup
3. If rings are completely broken: reinitialize with Step 7 and redistribute via Kolla-Ansible
4. Backup ring builder files before any changes: `cp /etc/swift/*.builder /opt/backups/swift/`

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-008: Backup and Restore (ring file backup)
- https://docs.openstack.org/swift/2024.2/admin/ring.html
- https://docs.openstack.org/swift/2024.2/admin/ring_builder.html
- https://docs.openstack.org/swift/2024.2/ops_runbook/ring.html
- SP-6105 SS 5.4 (Operations -- Storage Architecture)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-006: TempURL Configuration and Usage

```
PROCEDURE ID: OPS-SWIFT-006
TITLE: TempURL Configuration and Usage
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Configure and generate time-limited, unauthenticated URLs for Swift objects. TempURLs allow sharing objects with external users or applications that cannot perform Keystone authentication. Execute when generating download links for external stakeholders, providing temporary access to application data, or integrating with systems that require direct HTTP access.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with Swift CLI installed
2. Project member credentials sourced
3. The `tempurl` middleware is enabled in the Swift proxy pipeline
4. Target container and object exist
5. Swift service healthy (verify with OPS-SWIFT-001)

### SAFETY CONSIDERATIONS

- TempURLs bypass Keystone authentication -- anyone with the URL can access the object
- URLs are time-limited but cannot be revoked once generated (except by changing the secret key)
- Changing the account-level secret key invalidates ALL previously generated TempURLs
- Use HTTPS endpoints when generating TempURLs for sensitive data
- Limit TempURL duration to the minimum required access window

### PROCEDURE

Step 1: Verify tempurl middleware is enabled.

```bash
docker exec swift_proxy_server grep tempurl /etc/swift/proxy-server.conf
```

Expected result: `tempurl` appears in the proxy pipeline configuration.

If unexpected: If tempurl is not in the pipeline, enable it via Kolla-Ansible configuration override and reconfigure: `kolla-ansible -i inventory reconfigure --tags swift`.

Step 2: Set the TempURL secret key on the account.

```bash
swift post -m "Temp-URL-Key: $(openssl rand -hex 32)"
```

Expected result: No output on success. The secret key is stored in the account metadata.

If unexpected: If the post fails with 403, verify the user has the `swiftoperator` or `admin` role.

Step 3: Verify the secret key is set.

```bash
swift stat | grep -i "temp-url-key"
```

Expected result: `Temp-URL-Key` appears in the account metadata (the key value is displayed).

If unexpected: If no key is found, retry Step 2.

Step 4: Set a secondary TempURL key (optional, for rotation).

```bash
swift post -m "Temp-URL-Key-2: $(openssl rand -hex 32)"
```

Expected result: No output on success. Both keys are valid for TempURL generation. This allows key rotation without immediately invalidating existing URLs.

If unexpected: Non-critical. A single key is sufficient.

Step 5: Generate a TempURL for an object.

```bash
# GET URL valid for 3600 seconds (1 hour)
swift tempurl GET 3600 /v1/AUTH_$(openstack project show -f value -c id $(openstack token issue -f value -c project_id))/<container-name>/<object-name> "$(swift stat -m | grep -i 'temp-url-key:' | head -1 | awk '{print $2}')"
```

Expected result: A URL path is returned that includes the signature and expiry parameters:
```
/v1/AUTH_a1b2c3d4.../<container>/<object>?temp_url_sig=abc123...&temp_url_expires=1771903600
```

If unexpected: If the command fails, verify the account has a TempURL key set (Step 3).

Step 6: Construct the full TempURL.

```bash
SWIFT_ENDPOINT="http://controller:8080"
TEMP_PATH=$(swift tempurl GET 3600 /v1/AUTH_<account-id>/<container>/<object> "<secret-key>")
echo "${SWIFT_ENDPOINT}${TEMP_PATH}"
```

Expected result: A complete HTTP URL that can be used by unauthenticated clients.

If unexpected: Verify the Swift proxy endpoint is correct: `openstack endpoint list --service swift -c URL -f value | head -1`.

Step 7: Test the generated TempURL.

```bash
curl -s -o /dev/null -w "%{http_code}" "${SWIFT_ENDPOINT}${TEMP_PATH}"
```

Expected result: HTTP status code `200` indicating successful access.

If unexpected: If the response is `401`, the signature is invalid -- verify the secret key matches. If `403`, the URL has expired. If `404`, the object does not exist.

Step 8: Generate a TempURL for upload (PUT method).

```bash
swift tempurl PUT 3600 /v1/AUTH_<account-id>/<container>/<object-name> "<secret-key>"
```

Expected result: A URL path for uploading an object via PUT.

If unexpected: PUT TempURLs require write access to the container. Verify container permissions.

Step 9: Rotate the TempURL secret key.

```bash
# Set the new key as Key-2 first (both keys are valid during transition)
swift post -m "Temp-URL-Key-2: $(openssl rand -hex 32)"

# After existing TempURLs expire, move Key-2 to Key
swift post -m "Temp-URL-Key: $(swift stat -m | grep -i 'temp-url-key-2' | awk '{print $2}')"
```

Expected result: Key rotation complete. New TempURLs use the new key; old TempURLs remain valid until their expiry.

If unexpected: If old URLs need immediate invalidation, replace Key without using Key-2 transition. All outstanding TempURLs will become invalid.

### VERIFICATION

1. Confirm secret key is set: `swift stat | grep -i "Temp-URL-Key"` shows a key value
2. Confirm TempURL is generated: output includes `temp_url_sig` and `temp_url_expires` parameters
3. Confirm URL is accessible: `curl -s -o /dev/null -w "%{http_code}" <tempurl>` returns 200
4. Confirm URL expires: wait beyond expiry time, curl returns 401

### ROLLBACK

1. If a TempURL was shared prematurely: the URL cannot be individually revoked -- wait for expiry or rotate the secret key (Step 9) to invalidate all TempURLs
2. If the secret key was accidentally deleted: set a new key with Step 2 (old TempURLs are already invalid)
3. If the wrong object was shared: wait for URL expiry or rotate keys to invalidate

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-004: ACL Management (alternative access control)
- https://docs.openstack.org/swift/2024.2/api/temporary_url_middleware.html
- https://docs.openstack.org/swift/2024.2/overview_tempurl.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-007: Large Object Handling (SLO/DLO)

```
PROCEDURE ID: OPS-SWIFT-007
TITLE: Large Object Handling (SLO and DLO)
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Upload, manage, and download objects larger than Swift's single-object size limit (5 GB) using segmented upload strategies. Static Large Objects (SLO) use an immutable manifest; Dynamic Large Objects (DLO) use a prefix-based manifest. Execute when storing large files such as disk images, backups, media files, or database dumps.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with Swift CLI installed
2. Project member credentials sourced
3. Target container exists (create with OPS-SWIFT-002 if needed)
4. Sufficient storage capacity for the large object and its segments
5. Swift service healthy (verify with OPS-SWIFT-001)
6. `slo` and `dlo` middleware enabled in the Swift proxy pipeline

### SAFETY CONSIDERATIONS

- Segmented uploads create multiple segment objects in addition to the manifest -- all must be present for the large object to be readable
- Deleting an SLO manifest with `?multipart-manifest=delete` also deletes all segments
- Deleting an SLO manifest without the query parameter deletes only the manifest, orphaning segments
- DLO segments can be modified independently -- ensure segment naming consistency
- Segment size should be between 100 MB and 5 GB for optimal performance
- Interrupted uploads leave partial segments that must be cleaned up manually

### PROCEDURE

**Method A: SLO (Static Large Object) -- Recommended**

Step 1: Upload the large file using the Swift CLI with automatic segmentation.

```bash
swift upload <container-name> /path/to/large-file.iso \
  --segment-size 1073741824 \
  --segment-container <container-name>_segments
```

Expected result: The file is split into segments of 1 GB each. Segments are uploaded to `<container-name>_segments/`, and a manifest is created in `<container-name>/`.

```
large-file.iso segment 1
large-file.iso segment 2
large-file.iso segment 3
large-file.iso
```

If unexpected: If the upload is interrupted, partial segments remain. Clean up with `swift delete <container-name>_segments --prefix "large-file.iso/"`.

Step 2: Verify the SLO manifest.

```bash
swift stat <container-name> large-file.iso
```

Expected result: The object metadata shows the total content length (sum of all segments) and the manifest header `X-Static-Large-Object: True`.

If unexpected: If the manifest is missing, the upload may have been interrupted before the manifest was created. Re-run the upload command.

Step 3: Verify all segments exist.

```bash
swift list <container-name>_segments --prefix "large-file.iso"
```

Expected result: All segment files are listed in sequential order.

If unexpected: If segments are missing, the SLO will return errors on download. Re-upload the missing segments or re-run the entire upload.

Step 4: Download the large object.

```bash
swift download <container-name> large-file.iso -o /path/to/downloaded-file.iso
```

Expected result: Swift transparently reassembles all segments into a single downloaded file.

If unexpected: If the download fails with a 409 or 500 error, one or more segments are missing or corrupted. Verify segments with Step 3.

Step 5: Delete the SLO (manifest and all segments).

```bash
swift delete <container-name> large-file.iso --leave-segments  # Delete manifest only
# OR
swift delete <container-name> large-file.iso  # Delete manifest + segments
```

Expected result: The manifest and optionally all segments are deleted.

If unexpected: If orphaned segments remain, clean them up: `swift delete <container-name>_segments --prefix "large-file.iso/"`.

**Method B: DLO (Dynamic Large Object)**

Step 6: Upload segments with a common naming prefix.

```bash
# Split the file into segments
split -b 1073741824 -d /path/to/large-file.iso /tmp/segment-

# Upload each segment
for seg in /tmp/segment-*; do
  swift upload <container-name>_segments "$seg"
done
```

Expected result: Segments uploaded to the segments container with sequential names.

If unexpected: If any segment upload fails, retry the individual segment. DLO does not require all segments to be uploaded in order.

Step 7: Create the DLO manifest.

```bash
swift upload <container-name> --object-name large-file.iso /dev/null \
  --header "X-Object-Manifest: <container-name>_segments/segment-"
```

Expected result: A zero-byte manifest object created with the `X-Object-Manifest` header pointing to the segment prefix.

If unexpected: If the manifest creation fails, verify the prefix matches the segment naming pattern.

Step 8: Verify the DLO.

```bash
swift stat <container-name> large-file.iso
```

Expected result: The `X-Object-Manifest` header shows the segment prefix. Content length reflects the total size of all matching segments.

If unexpected: If content length is 0, no segments match the prefix. Verify the prefix and segment names.

### VERIFICATION

1. Confirm SLO/DLO manifest exists: `swift stat <container-name> large-file.iso` shows manifest headers
2. Confirm total size is correct: content length matches the original file size
3. Confirm segments are present: `swift list <container-name>_segments` shows expected segment count
4. Confirm download works: download the file and compare checksums: `md5sum /path/to/original /path/to/downloaded`

### ROLLBACK

1. If an SLO was created incorrectly: delete with `swift delete <container-name> large-file.iso` (deletes manifest and segments)
2. If a DLO was created incorrectly: delete the manifest and segments separately
3. If segments were orphaned: `swift delete <container-name>_segments --prefix "<object-prefix>"`
4. Clean up temporary split files: `rm -f /tmp/segment-*`

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-002: Container Management (container setup)
- OPS-SWIFT-003: Object Lifecycle Management (standard object operations)
- https://docs.openstack.org/swift/2024.2/overview_large_objects.html
- https://docs.openstack.org/swift/2024.2/api/large_objects.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-008: Backup and Restore

```
PROCEDURE ID: OPS-SWIFT-008
TITLE: Swift Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of Swift configuration, ring files, and account/container databases. Execute before ring changes, major upgrades, or as part of a scheduled backup rotation. Note that Swift object data backup is typically handled through ring replication rather than file-level backup due to the distributed nature of the storage.

### PRECONDITIONS

1. SSH access to the controller/storage node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Sufficient backup storage for ring files, configuration, and account/container databases
4. All Swift services running (verify with OPS-SWIFT-001)

### SAFETY CONSIDERATIONS

- Configuration and ring backup is non-destructive and does not affect running services
- Ring builder files (`.builder`) are critical -- losing them requires a full ring rebuild
- Restoring rings requires restarting all Swift services
- Account/container database restore may cause temporary inconsistency as replicators re-converge
- Object data is protected by ring replication -- per-object backup is only needed for non-replicated data

### PROCEDURE

**Part A: Backup**

Step 1: Create a timestamped backup directory.

```bash
BACKUP_DIR="/opt/backups/swift/$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}"
```

Expected result: Directory created at `/opt/backups/swift/YYYYMMDD-HHMMSS/`.

If unexpected: If the parent directory does not exist, create with `sudo mkdir -p /opt/backups && sudo chown $(whoami) /opt/backups`.

Step 2: Backup Swift ring files (critical).

```bash
docker cp swift_proxy_server:/etc/swift/account.builder "${BACKUP_DIR}/"
docker cp swift_proxy_server:/etc/swift/container.builder "${BACKUP_DIR}/"
docker cp swift_proxy_server:/etc/swift/object.builder "${BACKUP_DIR}/"
docker cp swift_proxy_server:/etc/swift/account.ring.gz "${BACKUP_DIR}/"
docker cp swift_proxy_server:/etc/swift/container.ring.gz "${BACKUP_DIR}/"
docker cp swift_proxy_server:/etc/swift/object.ring.gz "${BACKUP_DIR}/"
```

Expected result: Six ring files (three `.builder` and three `.ring.gz`) copied to the backup directory.

If unexpected: If copy fails, check that `swift_proxy_server` container is running.

Step 3: Backup Swift configuration files.

```bash
docker cp swift_proxy_server:/etc/swift/swift.conf "${BACKUP_DIR}/"
docker cp swift_proxy_server:/etc/swift/proxy-server.conf "${BACKUP_DIR}/"
docker cp swift_account_server:/etc/swift/account-server.conf "${BACKUP_DIR}/" 2>/dev/null
docker cp swift_container_server:/etc/swift/container-server.conf "${BACKUP_DIR}/" 2>/dev/null
docker cp swift_object_server:/etc/swift/object-server.conf "${BACKUP_DIR}/" 2>/dev/null
```

Expected result: Configuration files for all Swift components copied to the backup directory.

If unexpected: If some containers are not running, copy from whichever containers are available.

Step 4: Export account and container listings.

```bash
openstack object store account show -f json > "${BACKUP_DIR}/account-state.json"
openstack container list -f json > "${BACKUP_DIR}/container-list.json"
for container in $(openstack container list -f value -c Name); do
  openstack object list "${container}" -f json > "${BACKUP_DIR}/objects-${container}.json" 2>/dev/null
done
```

Expected result: JSON exports of account state, container listings, and per-container object listings.

If unexpected: If API calls fail, check Swift service health with OPS-SWIFT-001.

Step 5: Backup Kolla-Ansible Swift configuration.

```bash
cp -r /etc/kolla/config/swift/ "${BACKUP_DIR}/kolla-config/" 2>/dev/null || echo "No Kolla Swift overrides"
grep -E "^enable_swift|^swift_" /etc/kolla/globals.yml > "${BACKUP_DIR}/globals-swift.txt" 2>/dev/null
grep swift /etc/kolla/passwords.yml > "${BACKUP_DIR}/passwords-swift.txt" 2>/dev/null
```

Expected result: Kolla-Ansible configuration related to Swift saved to the backup directory.

If unexpected: If no overrides exist, proceed -- the default configuration is in Kolla-Ansible itself.

Step 6: Record backup metadata.

```bash
echo "Backup timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${BACKUP_DIR}/backup-metadata.txt"
echo "Account: $(openstack object store account show -f value -c Account)" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Containers: $(openstack container list -f value | wc -l)" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Ring files:" >> "${BACKUP_DIR}/backup-metadata.txt"
ls -la "${BACKUP_DIR}"/*.builder "${BACKUP_DIR}"/*.ring.gz >> "${BACKUP_DIR}/backup-metadata.txt"
```

Expected result: Metadata file recording the backup state.

If unexpected: Non-critical. Proceed if metadata recording fails.

**Part B: Restore**

Step 7: Stop Swift services.

```bash
docker stop swift_proxy_server swift_account_server swift_container_server swift_object_server
docker stop swift_account_reaper swift_object_expirer swift_rsyncd 2>/dev/null
```

Expected result: All Swift containers stopped.

If unexpected: If containers do not stop within 30 seconds, force stop with `docker kill`.

Step 8: Restore ring files.

```bash
docker cp "${BACKUP_DIR}/account.builder" swift_proxy_server:/etc/swift/
docker cp "${BACKUP_DIR}/container.builder" swift_proxy_server:/etc/swift/
docker cp "${BACKUP_DIR}/object.builder" swift_proxy_server:/etc/swift/
docker cp "${BACKUP_DIR}/account.ring.gz" swift_proxy_server:/etc/swift/
docker cp "${BACKUP_DIR}/container.ring.gz" swift_proxy_server:/etc/swift/
docker cp "${BACKUP_DIR}/object.ring.gz" swift_proxy_server:/etc/swift/
```

Expected result: Ring files restored to the Swift proxy container.

If unexpected: If the container filesystem is ephemeral, restore files to the host path that is volume-mounted into the container.

Step 9: Restore configuration files.

```bash
docker cp "${BACKUP_DIR}/swift.conf" swift_proxy_server:/etc/swift/
docker cp "${BACKUP_DIR}/proxy-server.conf" swift_proxy_server:/etc/swift/
```

Expected result: Configuration files restored.

If unexpected: If configuration restore causes compatibility issues, run `kolla-ansible -i inventory reconfigure --tags swift` to regenerate configuration from Kolla-Ansible state.

Step 10: Start Swift services.

```bash
docker start swift_proxy_server
sleep 5
docker start swift_account_server swift_container_server swift_object_server
docker start swift_account_reaper swift_object_expirer swift_rsyncd 2>/dev/null
```

Expected result: All Swift containers start and reach "Up" status.

If unexpected: Check container logs with `docker logs swift_proxy_server 2>&1 | tail -50` for startup errors.

### VERIFICATION

1. Run `openstack object store account show` and confirm the account responds
2. Run `openstack container list` and confirm containers match the backup state
3. Verify ring files: `docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder` shows expected configuration
4. Upload and download a test object to confirm end-to-end functionality
5. Run OPS-SWIFT-001 for a complete health check

### ROLLBACK

If the restore fails and leaves Swift in an inconsistent state:
1. Run `kolla-ansible -i inventory deploy --tags swift` to redeploy from Kolla-Ansible state
2. Rebuild rings if builder files are corrupted (OPS-SWIFT-005 Step 7)
3. Verify with OPS-SWIFT-001

### REFERENCES

- OPS-SWIFT-001: Service Health Check
- OPS-SWIFT-005: Ring Management (ring rebuild if needed)
- OPS-KEYSTONE-003: Keystone Backup and Restore (auth dependency)
- https://docs.openstack.org/swift/2024.2/ops_runbook/procedures.html
- https://docs.openstack.org/swift/2024.2/admin/ring.html
- SP-6105 SS 5.5 (Product Transition -- Backup and Recovery)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-009: S3 API Configuration and Usage

```
PROCEDURE ID: OPS-SWIFT-009
TITLE: S3 API Configuration and Usage
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Configure and use the S3-compatible API provided by Swift's s3api middleware. Execute when integrating S3-compatible applications with Swift, creating EC2 credentials for S3 access, or troubleshooting S3 API compatibility issues. Swift's s3api middleware makes Swift a drop-in replacement for AWS S3 in many applications.

### PRECONDITIONS

1. SSH access to the controller node or a workstation with OpenStack CLI installed
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Swift proxy server running with `s3api` and `s3token` middleware in the pipeline
4. AWS CLI or s3cmd installed for S3 API testing
5. Swift service healthy (verify with OPS-SWIFT-001)

### SAFETY CONSIDERATIONS

- EC2 credentials provide full S3 access to the user's project -- treat as sensitive credentials
- S3 operations bypass Swift ACLs -- access is controlled through Keystone authentication
- Not all S3 operations are supported (bucket policies, object lock, some multipart options are not available)
- S3 bucket names map to Swift container names -- naming conflicts are possible
- Deleting EC2 credentials immediately revokes S3 access for any application using those credentials

### PROCEDURE

Step 1: Verify s3api middleware is enabled.

```bash
docker exec swift_proxy_server grep -E "s3api|s3token" /etc/swift/proxy-server.conf
```

Expected result: `s3api` and `s3token` appear in the proxy pipeline.

If unexpected: If s3api is not enabled, add it via Kolla-Ansible configuration override and reconfigure:
```bash
# /etc/kolla/config/swift/proxy-server.conf override
# Ensure s3api and s3token are in the pipeline
kolla-ansible -i inventory reconfigure --tags swift
```

Step 2: Create EC2 credentials for S3 access.

```bash
openstack ec2 credentials create
```

Expected result: EC2 access key and secret key are generated.

```
+------------+----------------------------------------------+
| Field      | Value                                        |
+------------+----------------------------------------------+
| access     | a1b2c3d4e5f6a7b8c9d0...                     |
| links      | ...                                          |
| project_id | e5f6a7b8-c9d0-...                            |
| secret     | AbCdEfGh1234567890...                        |
| trust_id   | None                                         |
| user_id    | d4c3b2a1-f6e5-...                            |
+------------+----------------------------------------------+
```

If unexpected: If credential creation fails, verify the user has a valid project assignment.

Step 3: List existing EC2 credentials.

```bash
openstack ec2 credentials list
```

Expected result: All EC2 credential pairs for the current user are listed.

If unexpected: If no credentials appear, create them with Step 2.

Step 4: Configure the AWS CLI for Swift S3 access.

```bash
aws configure --profile swift-s3
# AWS Access Key ID: <access-key-from-step-2>
# AWS Secret Access Key: <secret-key-from-step-2>
# Default region name: RegionOne
# Default output format: json
```

Expected result: AWS CLI profile configured. Credentials stored in `~/.aws/credentials`.

If unexpected: If `aws` CLI is not installed, install with `pip install awscli`.

Step 5: Test S3 API access -- list buckets.

```bash
aws --profile swift-s3 --endpoint-url http://controller:8080 s3 ls
```

Expected result: List of existing Swift containers displayed as S3 buckets.

If unexpected: If authentication fails, verify:
- The endpoint URL matches the Swift proxy address and port
- EC2 credentials are valid: `openstack ec2 credentials list`
- Signature version: try adding `--signature-version s3v4` (Swift supports both V2 and V4)

Step 6: Create an S3 bucket (Swift container).

```bash
aws --profile swift-s3 --endpoint-url http://controller:8080 s3 mb s3://my-s3-bucket
```

Expected result: `make_bucket: my-s3-bucket`

If unexpected: If the bucket name contains dots or uppercase letters, S3 naming rules may reject it. Use lowercase letters, numbers, and hyphens only.

Step 7: Upload an object via S3 API.

```bash
aws --profile swift-s3 --endpoint-url http://controller:8080 s3 cp /path/to/file.txt s3://my-s3-bucket/file.txt
```

Expected result: `upload: ./file.txt to s3://my-s3-bucket/file.txt`

If unexpected: If the upload fails with a signature error, check the AWS CLI signature version configuration.

Step 8: Download an object via S3 API.

```bash
aws --profile swift-s3 --endpoint-url http://controller:8080 s3 cp s3://my-s3-bucket/file.txt /path/to/downloaded-file.txt
```

Expected result: `download: s3://my-s3-bucket/file.txt to ./downloaded-file.txt`

If unexpected: If the object is not found, verify the object name with Step 5.

Step 9: Verify cross-API compatibility (same object accessible via both APIs).

```bash
# Verify via Swift native API
openstack object list my-s3-bucket
openstack object show my-s3-bucket file.txt
```

Expected result: Objects uploaded via S3 API are visible through the native Swift API and vice versa.

If unexpected: If objects are not visible across APIs, check the Swift account prefix. S3 API uses the same `AUTH_<project-id>` account mapping.

Step 10: Delete EC2 credentials (when revoking S3 access).

```bash
openstack ec2 credentials delete <access-key>
```

Expected result: Credentials deleted. All S3 clients using these credentials will receive authentication errors.

If unexpected: If deletion fails, verify the access key with `openstack ec2 credentials list`.

### VERIFICATION

1. Confirm s3api middleware active: proxy pipeline includes `s3api` and `s3token`
2. Confirm EC2 credentials exist: `openstack ec2 credentials list` shows at least one credential pair
3. Confirm S3 access works: `aws --endpoint-url http://controller:8080 s3 ls` returns bucket list
4. Confirm cross-API access: objects visible through both S3 and native Swift APIs

### ROLLBACK

1. If EC2 credentials were compromised: delete immediately with `openstack ec2 credentials delete <access-key>` and create new credentials
2. If S3 buckets were created incorrectly: delete via `aws s3 rb s3://bucket-name --force` (deletes bucket and all objects)
3. If s3api middleware was misconfigured: restore `proxy-server.conf` and restart Swift

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-002: Container Management (container equivalents)
- OPS-SWIFT-004: ACL Management (access control context)
- https://docs.openstack.org/swift/2024.2/middleware.html#s3api
- https://docs.openstack.org/swift/2024.2/s3_compat.html
- https://docs.openstack.org/keystone/latest/user/application-credentials.html
- SP-6105 SS 5.4-5.5 (Operations and Sustainment)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-SWIFT-010: Quota and Capacity Management

```
PROCEDURE ID: OPS-SWIFT-010
TITLE: Swift Quota and Capacity Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-22 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Monitor storage capacity, configure per-account and per-container quotas, and plan for capacity expansion. Execute weekly as part of capacity monitoring, when setting up quotas for new projects, or when storage utilization approaches thresholds. Proactive capacity management prevents storage exhaustion and service degradation.

### PRECONDITIONS

1. SSH access to the controller/storage node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Swift service healthy (verify with OPS-SWIFT-001)
4. Understanding of organizational storage allocation policies

### SAFETY CONSIDERATIONS

- Setting account quotas too low may prevent users from uploading objects
- Container quotas are enforced per container, not across the entire project
- Quota changes take effect immediately for new operations but do not delete existing objects that exceed the quota
- Storage capacity monitoring involves read-only operations
- Capacity expansion (adding devices) requires ring rebalancing (OPS-SWIFT-005)

### PROCEDURE

Step 1: Check overall Swift cluster storage usage.

```bash
docker exec swift_object_server swift-recon --diskusage 2>/dev/null || \
  df -h /srv/node/ 2>/dev/null || \
  df -h | grep -E "swift|srv"
```

Expected result: Storage device utilization statistics. Usage should be below 75% for comfortable capacity.

```
Distribution Graph:
 10%    1 *
 20%    0
 30%    0
 40%    0
Disk usage: space used: X of Y (Z% usage)
```

If unexpected: If any device exceeds 85%, plan capacity expansion. If any device exceeds 95%, immediate action is required.

Step 2: Check per-account storage usage.

```bash
openstack object store account show
```

Expected result: Account statistics showing container count, object count, and total bytes used.

If unexpected: If the account command fails, verify authentication and Swift proxy health.

Step 3: Check per-container storage usage.

```bash
for container in $(openstack container list -f value -c Name); do
  swift stat "${container}" 2>/dev/null | grep -E "Container:|Objects:|Bytes:" | tr '\n' ' '
  echo ""
done
```

Expected result: Per-container statistics showing object count and bytes used for each container.

If unexpected: If containers are not accessible, check Swift service health.

Step 4: Set an account-level storage quota.

```bash
# Set account quota to 100 GB
swift post -m "Quota-Bytes: 107374182400"
```

Expected result: No output on success. The account is now limited to 100 GB of object storage.

If unexpected: If the post fails, verify the user has the `ResellerAdmin` role or that the `account_quotas` middleware is in the proxy pipeline.

Step 5: Set a container-level storage quota.

```bash
swift post <container-name> -m "Quota-Bytes: 10737418240"
```

Expected result: No output on success. The container is limited to 10 GB.

If unexpected: If the quota is not enforced, verify the `container_quotas` middleware is in the proxy pipeline: `docker exec swift_proxy_server grep container_quotas /etc/swift/proxy-server.conf`.

Step 6: Set a container-level object count quota.

```bash
swift post <container-name> -m "Quota-Count: 10000"
```

Expected result: No output on success. The container is limited to 10,000 objects.

If unexpected: If the quota metadata is not applied, check middleware configuration.

Step 7: Verify quota settings.

```bash
swift stat
swift stat <container-name>
```

Expected result: Account and container statistics show the quota metadata headers.

If unexpected: If quotas are not visible, the middleware may not be processing them. Check proxy pipeline configuration.

Step 8: Test quota enforcement.

```bash
# Attempt to exceed the quota (if testing is safe)
dd if=/dev/zero bs=1M count=1 | openstack object create <container-name> test-quota-object
```

Expected result: If the container is within quota, the upload succeeds. If the upload would exceed the quota, Swift returns `413 Request Entity Too Large`.

If unexpected: If the upload succeeds despite exceeding the quota, the quota middleware may not be active.

Step 9: Remove quotas.

```bash
# Remove account quota
swift post -m "Quota-Bytes:"

# Remove container quota
swift post <container-name> -m "Quota-Bytes:" -m "Quota-Count:"
```

Expected result: No output on success. Quotas are removed and no longer enforced.

If unexpected: If quota removal fails, set the quota to a very high value as a workaround.

Step 10: Plan capacity expansion.

```bash
# Review current ring device utilization
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder

# Estimate growth rate
echo "Current usage:"
openstack object store account show -c Bytes -f value
echo ""
echo "Review historical growth by checking backup metadata files:"
ls -la /opt/backups/swift/*/backup-metadata.txt 2>/dev/null
```

Expected result: Current device utilization and growth trends visible for capacity planning.

If unexpected: If historical data is not available, start recording daily snapshots as part of OPS-SWIFT-001.

### VERIFICATION

1. Confirm cluster usage is within thresholds: device usage below 75%
2. Confirm account quota set: `swift stat | grep Quota` shows expected value
3. Confirm container quota set: `swift stat <container-name> | grep Quota` shows expected value
4. Confirm quota enforcement: upload exceeding quota returns 413
5. Run OPS-SWIFT-001 for overall service health confirmation

### ROLLBACK

1. If quota was set too restrictively: increase with `swift post -m "Quota-Bytes: <higher-value>"`
2. If quota was accidentally removed: re-set with Step 4 or Step 5
3. If capacity is critically low: add storage devices and rebalance rings (OPS-SWIFT-005)

### REFERENCES

- OPS-SWIFT-001: Service Health Check (prerequisite)
- OPS-SWIFT-005: Ring Management (capacity expansion)
- OPS-SWIFT-008: Backup and Restore (historical growth data)
- https://docs.openstack.org/swift/2024.2/admin/account_quotas.html
- https://docs.openstack.org/swift/2024.2/admin/container_quotas.html
- https://docs.openstack.org/swift/2024.2/ops_runbook/procedures.html
- SP-6105 SS 5.4 (Operations -- Capacity Management)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)
