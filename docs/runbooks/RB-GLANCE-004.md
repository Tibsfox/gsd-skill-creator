RUNBOOK: RB-GLANCE-004 -- Glance Backend Storage Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. Root SSH access to the node hosting the Glance API service
3. Understanding of the Glance backend type (file, swift, ceph)
4. Glance containers are running (`docker ps | grep glance`)

## PROCEDURE

Step 1: Verify Glance backend health

```bash
# Check Glance API can reach its backend
docker logs glance_api 2>&1 | grep -i "error\|storage\|backend" | tail -20

# For file backend: check filesystem
df -h /var/lib/docker/volumes/glance/_data/images/
ls -la /var/lib/docker/volumes/glance/_data/images/ | head -20
```

Expected: No storage errors in logs. Filesystem has available space and image files are accessible.
If not: Storage full, permission errors, or filesystem corruption -- proceed to specific recovery steps below.

Step 2: Check for corrupted image files

```bash
# List all Glance images
openstack image list --long -c ID -c Status -c Size

# Cross-check with backend files
ls -la /var/lib/docker/volumes/glance/_data/images/ | wc -l

# Check for size mismatches
for img_id in $(openstack image list -c ID -f value); do
  api_size=$(openstack image show $img_id -c size -f value)
  file_size=$(stat -c%s "/var/lib/docker/volumes/glance/_data/images/$img_id" 2>/dev/null || echo "MISSING")
  if [ "$file_size" != "$api_size" ] && [ "$file_size" != "MISSING" ]; then
    echo "MISMATCH: $img_id api=$api_size file=$file_size"
  elif [ "$file_size" = "MISSING" ]; then
    echo "MISSING FILE: $img_id"
  fi
done
```

Expected: All `active` images have matching backend files. Sizes match between Glance database and filesystem.
If not: Missing files or size mismatches indicate data corruption or incomplete uploads.

Step 3: Repair orphaned files (files without Glance records)

```bash
# Find orphaned files (exist on disk but not in Glance)
for file in /var/lib/docker/volumes/glance/_data/images/*; do
  img_id=$(basename $file)
  status=$(openstack image show $img_id -c status -f value 2>/dev/null || echo "NOT_FOUND")
  if [ "$status" = "NOT_FOUND" ]; then
    echo "ORPHAN: $file ($(du -h $file | cut -f1))"
  fi
done
```

Expected: No orphaned files. Every file on disk corresponds to a Glance image record.
If not: Orphaned files can be safely removed to reclaim space. Move them to a temporary location first as a safety measure:

```bash
mkdir -p /tmp/glance-orphans
mv /var/lib/docker/volumes/glance/_data/images/<orphan-id> /tmp/glance-orphans/
```

Step 4: Handle missing image files (Glance records without files)

```bash
# Set images with missing files to error state
for img_id in $(openstack image list --status active -c ID -f value); do
  if [ ! -f "/var/lib/docker/volumes/glance/_data/images/$img_id" ]; then
    echo "Missing file for active image: $img_id"
    openstack image set --status error $img_id
  fi
done
```

Expected: Images with missing backend files are marked as `error` so they are not served to Nova.
If not: If the command fails, check Glance API connectivity and permissions.

Step 5: Resolve storage quota exhaustion

```bash
# Check current usage
du -sh /var/lib/docker/volumes/glance/_data/images/

# Clean up soft-deleted images
docker exec glance_api glance-manage db purge --age_in_days 30 --max_rows 100 2>/dev/null

# Delete unused images to free space
openstack image list --status deactivated -c ID -f value | xargs -I{} openstack image delete {}
```

Expected: Space is reclaimed. Soft-deleted images are purged from the database and filesystem.
If not: Consider expanding the backend storage volume or migrating to a larger filesystem.

Step 6: Rebuild Glance image cache (if caching is enabled)

```bash
# Check cache status
docker exec glance_api ls -la /var/lib/glance/image-cache/ 2>/dev/null

# Clear the cache
docker exec glance_api rm -rf /var/lib/glance/image-cache/*

# Restart Glance to rebuild cache on demand
docker restart glance_api
```

Expected: Cache is cleared. Images will be re-cached on next access.
If not: Cache directory permissions may be wrong. Fix: `docker exec glance_api chown -R glance:glance /var/lib/glance/image-cache/`.

Step 7: Restore images from backup (if available)

```bash
# If images were backed up to an external location
# Copy the image file back to the backend
cp /backup/glance/<image-id> /var/lib/docker/volumes/glance/_data/images/<image-id>
chown 42415:42415 /var/lib/docker/volumes/glance/_data/images/<image-id>

# Reset image status from error to active
openstack image set --status active <image-id>

# Verify the image
openstack image show <image-id> -c status -c size
```

Expected: Image is restored and accessible. Status is `active` and size matches.
If not: Backup may be corrupted. Verify backup file integrity before restoring.

## VERIFICATION

1. All active images have backend files: run the cross-check from Step 2 with no mismatches.
2. Glance API is healthy: `openstack image list` returns without errors.
3. Backend storage has free space: `df -h /var/lib/docker/volumes/glance/_data/images/` shows available space.
4. Image upload works: `openstack image create --file <test-file> --disk-format qcow2 --container-format bare test-recovery` succeeds.

## ROLLBACK

1. If orphaned files were removed and later found to be needed, restore from `/tmp/glance-orphans/`.
2. If images were set to `error` state incorrectly, restore status: `openstack image set --status active <image-id>`.
3. If cache was cleared and performance degraded, the cache will rebuild automatically on subsequent image accesses.
4. If backend storage was expanded or migrated, the previous configuration can be restored by reverting Glance configuration and restarting.

## RELATED RUNBOOKS

- RB-GLANCE-001: Image Upload Failure Troubleshooting -- when uploads fail due to backend issues
- RB-GLANCE-002: Image Format Conversion -- when images need to be re-imported after recovery
- RB-GLANCE-003: Image Metadata and Visibility Management -- when metadata needs updating after recovery
