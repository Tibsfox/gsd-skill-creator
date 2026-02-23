RUNBOOK: RB-SWIFT-004 -- Object Expiration and Lifecycle Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed (`openstack`, `swift`)
2. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
3. Swift object-expirer service is running (`docker ps --filter name=swift_object_expirer`)
4. Knowledge of the affected container, object name, and expected expiration behavior

## PROCEDURE

Step 1: Verify the object's expiration metadata
```bash
swift stat <container-name> <object-name>
```
Expected: Output includes `X-Delete-At` (Unix timestamp) or `X-Delete-After` (seconds from upload) headers indicating when the object should expire
If not: The object has no expiration set. If expiration was expected, it may not have been applied at upload time. Set it now with Step 4.

Step 2: Check if the object-expirer service is running and processing
```bash
docker ps --filter name=swift_object_expirer
docker logs swift_object_expirer --tail 50
```
Expected: Container is running; logs show regular processing cycles with entries like `Pass completed in X seconds; Y objects expired`
If not: If container is stopped, start it: `docker restart swift_object_expirer`. If logs show errors, proceed to Step 3.

Step 3: Check the expiration queue
```bash
# The object-expirer uses a hidden container (.expiring_objects) to track pending expirations
swift list .expiring_objects 2>/dev/null
```
Expected: Listing shows pending expiration entries (timestamps as container names). Entries older than current time should have been processed.
If not: If the queue is empty but objects still have X-Delete-At headers, the expirer may have a configuration issue. Check Step 5.

Step 4: Set or correct expiration on an object
```bash
# Set expiration by relative time (seconds from now)
swift post <container-name> <object-name> -H "X-Delete-After: 86400"   # 24 hours

# Set expiration by absolute timestamp
swift post <container-name> <object-name> -H "X-Delete-At: 1771900000"

# Remove expiration (prevent deletion)
swift post <container-name> <object-name> -H "X-Remove-Delete-At:"
```
Expected: `swift stat <container> <object>` reflects the updated expiration header
If not: Check for permission errors -- only the container owner or users with write ACL can modify object metadata

Step 5: Verify object-expirer configuration
```bash
docker exec swift_object_expirer cat /etc/swift/object-expirer.conf
```
Expected: Configuration includes `[object-expirer]` section with `interval` (default 300 seconds) and correct `[pipeline:main]` configuration
If not: Fix the configuration via Kolla-Ansible config override and reconfigure

Step 6: Manually trigger expiration processing (if objects are stuck)
```bash
# Restart the expirer to force a processing cycle
docker restart swift_object_expirer

# Monitor for processing activity
docker logs swift_object_expirer --follow --tail 10
```
Expected: Expirer processes pending expirations within one interval cycle (default 5 minutes)
If not: Check for connectivity issues between the expirer and the account/container/object servers

Step 7: Re-upload expired objects from backup (if objects were incorrectly expired)
```bash
# If objects were accidentally expired, restore from backup
swift upload <container-name> <local-file> --object-name <object-name>

# Verify the restored object
swift stat <container-name> <object-name>
```
Expected: Object is restored with no expiration header (unless explicitly set)
If not: Check container quotas (RB-SWIFT-003) or storage space

## VERIFICATION

1. Objects with X-Delete-At in the past are actually deleted (listing does not include them)
2. Objects with X-Delete-At in the future are still accessible
3. Object-expirer logs show successful processing: `docker logs swift_object_expirer --tail 20` shows recent pass completion
4. New objects uploaded with X-Delete-After headers show correct X-Delete-At timestamp in metadata

## ROLLBACK

1. If expiration was incorrectly set, remove it:
   ```bash
   swift post <container-name> <object-name> -H "X-Remove-Delete-At:"
   ```
2. If objects were incorrectly expired, re-upload from backup:
   ```bash
   swift upload <container-name> <backup-file> --object-name <object-name>
   ```
3. If the expirer configuration was changed, revert and reconfigure:
   ```bash
   kolla-ansible -i inventory reconfigure --tags swift
   ```

## RELATED RUNBOOKS

- RB-SWIFT-002: Replication Status Verification -- when replication issues delay expiration processing
- RB-SWIFT-003: Quota and Rate Limit Management -- when quota settings interact with object lifecycle
- RB-GENERAL-002: Full Cloud Backup and Restore -- for restoring expired objects from cloud backups
