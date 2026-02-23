RUNBOOK: RB-GLANCE-001 -- Image Upload Failure Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the node hosting the Glance API service
3. The image file to upload is accessible locally
4. Glance containers are running (`docker ps | grep glance`)

## PROCEDURE

Step 1: Check Glance API service status

```bash
openstack service list | grep image
openstack endpoint list --service glance
docker ps | grep glance_api
```

Expected: Image service is registered in the catalog, endpoints are listed, and `glance_api` container is running.
If not: Container down -- restart: `docker restart glance_api`. If service missing from catalog, re-run `kolla-ansible -i inventory deploy --tags glance`.

Step 2: Check Glance API logs for upload errors

```bash
docker logs glance_api 2>&1 | tail -50
docker logs glance_api 2>&1 | grep -i "error\|fail\|413\|507" | tail -20
```

Expected: No recent errors. Upload requests show HTTP 201 (created) responses.
If not: Note the specific error. Common errors: 413 (request entity too large), 507 (insufficient storage), permission denied, or database connection errors.

Step 3: Check backend storage space

```bash
# For file backend
df -h /var/lib/docker/volumes/glance/_data/images/
du -sh /var/lib/docker/volumes/glance/_data/images/

# Check image size cap configuration
docker exec glance_api grep image_size_cap /etc/glance/glance-api.conf
```

Expected: Filesystem has free space greater than the image being uploaded. `image_size_cap` is 0 (unlimited) or larger than the image.
If not: Free space by removing unused images: `openstack image delete <old-image>`. Or increase `image_size_cap` in the Glance configuration.

Step 4: Verify image format before upload

```bash
qemu-img info <image-file>
```

Expected: Output shows a recognized format (`qcow2`, `raw`, `vmdk`, `vhd`, `iso`) and reports no errors.
If not: Image may be corrupted -- verify checksum against the source: `sha256sum <image-file>`. Re-download if corrupt.

Step 5: Check for hash mismatch errors

```bash
docker logs glance_api 2>&1 | grep -i "checksum\|hash\|mismatch" | tail -10
```

Expected: No hash mismatch errors.
If not: The image data was corrupted during transfer. Re-upload with explicit checksum verification:

```bash
# Calculate checksum
md5sum <image-file>

# Upload with checksum
openstack image create --file <image-file> \
  --disk-format qcow2 --container-format bare \
  --property os_hash_algo=sha512 \
  my-image
```

Step 6: Check for images stuck in queued state

```bash
openstack image list --status queued
openstack image list --status saving
```

Expected: No images stuck in `queued` or `saving` state.
If not: Delete stuck images and retry: `openstack image set --status error <image-id>` then `openstack image delete <image-id>`.

Step 7: Retry the upload

```bash
openstack image create --file <image-file> \
  --disk-format qcow2 --container-format bare \
  --min-disk 10 --min-ram 1024 \
  retry-image

openstack image show retry-image -c status
```

Expected: Image transitions from `queued` to `saving` to `active` within a few minutes (depending on image size).
If not: Repeat diagnosis from Step 2 with fresh logs.

## VERIFICATION

1. Image upload succeeds: `openstack image show <image-name> -c status` returns `active`.
2. Image file exists on backend: `docker exec glance_api ls -la /var/lib/glance/images/<image-id>`.
3. Image size matches: compare `openstack image show <image-name> -c size` with `ls -l <original-file>`.

## ROLLBACK

1. Delete partial uploads: `openstack image delete <image-id>` for images stuck in `queued` or `saving` state.
2. Clean up orphaned files on the backend: compare `openstack image list -f value -c ID` with files in `/var/lib/docker/volumes/glance/_data/images/`. Remove files with no matching image ID.
3. If Glance configuration was modified, restore the original: `docker restart glance_api` to pick up the original config.

## RELATED RUNBOOKS

- RB-GLANCE-002: Image Format Conversion -- when format issues prevent upload
- RB-GLANCE-003: Image Metadata and Visibility Management -- when metadata needs to be set after upload
- RB-GLANCE-004: Glance Backend Storage Recovery -- when storage backend is the root cause
