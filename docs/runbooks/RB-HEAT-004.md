RUNBOOK: RB-HEAT-004 -- Stack Update and Rollback Procedure
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed (`openstack`)
2. User credentials sourced with access to the project owning the stack
3. Heat API and engine containers are running (`docker ps --filter name=heat`)
4. An existing stack in CREATE_COMPLETE or UPDATE_COMPLETE state
5. The updated template or parameters are prepared

## PROCEDURE

Step 1: Document the current stack state before update
```bash
# Record current stack details
openstack stack show <stack-name> -f json > /tmp/pre-update-stack.json

# Record current resource list
openstack stack resource list <stack-name> --nested-depth 2 > /tmp/pre-update-resources.txt

# Record current outputs
openstack stack output list <stack-name> > /tmp/pre-update-outputs.txt
```
Expected: Pre-update state is captured for comparison and potential rollback reference
If not: Ensure the stack exists and is in a COMPLETE state before proceeding

Step 2: Preview the update (dry-run)
```bash
openstack stack update --dry-run -t <updated-template.yaml> <stack-name>
```
Expected: Dry-run shows which resources will be updated in-place, which will be replaced, and which are unchanged
If not: If dry-run fails, fix the template issues before proceeding (see RB-HEAT-002)

Step 3: Evaluate replacement impact

**CRITICAL:** Resources marked for replacement will be deleted and recreated. For stateful resources, this means data loss.
```bash
# Check if any stateful resources (volumes, databases) will be replaced
# In dry-run output, look for "replacement" actions on:
# - OS::Cinder::Volume
# - OS::Nova::Server (if it has local data)
# - Any custom resource with persistent state
```
Expected: Only stateless resources or intentionally replaced resources are marked for replacement
If not: Modify the template to avoid replacing stateful resources, or back up data before proceeding

Step 4: Execute the stack update
```bash
openstack stack update -t <updated-template.yaml> -e <env.yaml> <stack-name>
```
Expected: Stack enters UPDATE_IN_PROGRESS state
If not: If update is rejected immediately, check the error and fix the template

Step 5: Monitor update progress
```bash
# Watch for completion
openstack stack show <stack-name> -c stack_status -c stack_status_reason -f value

# Monitor resource-level progress
openstack stack event list <stack-name> --sort-key event_time --follow
```
Expected: Stack transitions to UPDATE_COMPLETE; all resources reach their target state
If not: If stack enters UPDATE_FAILED, proceed to Step 6

Step 6: Handle UPDATE_FAILED state
```bash
# Check which resource caused the failure
openstack stack resource list <stack-name> | grep FAILED

# Get failure details
openstack stack resource show <stack-name> <failed-resource>
openstack stack show <stack-name> -c stack_status_reason -f value
```
Expected: Failure reason identifies the specific issue (quota, network, invalid property, etc.)
If not: Check heat-engine logs: `docker logs heat_engine --tail 100`

Step 7: Trigger rollback (if update failed)
```bash
# Cancel the in-progress update (triggers automatic rollback)
openstack stack cancel <stack-name>

# Wait for rollback to complete
openstack stack show <stack-name> -c stack_status -f value
# Should transition: UPDATE_FAILED -> ROLLBACK_IN_PROGRESS -> ROLLBACK_COMPLETE
```
Expected: Stack rolls back to the previous template state with ROLLBACK_COMPLETE status
If not: If rollback also fails (ROLLBACK_FAILED), manual intervention is required (Step 8)

Step 8: Recover from ROLLBACK_FAILED
```bash
# Check which resources are in an inconsistent state
openstack stack resource list <stack-name>

# Attempt to update to a known-good template to recover
openstack stack update -t <original-template.yaml> -e <original-env.yaml> <stack-name>

# If the stack is unrecoverable, abandon and re-adopt
openstack stack abandon <stack-name> > /tmp/abandoned-stack.json
# Manually clean up resources as needed
# Then recreate from the original template
openstack stack create -t <original-template.yaml> -e <original-env.yaml> <stack-name>
```
Expected: Stack is recovered to a working state
If not: Manual resource cleanup is required. List all resources created by the stack and delete/recreate individually.

## VERIFICATION

1. `openstack stack show <stack-name>` returns UPDATE_COMPLETE (or ROLLBACK_COMPLETE if rolled back)
2. `openstack stack resource list <stack-name>` shows all resources in COMPLETE state
3. Stack outputs reflect the updated configuration: `openstack stack output list <stack-name>`
4. Compare with pre-update state to confirm expected changes were applied
5. Functional verification: resources created/updated by the stack work as intended

## ROLLBACK

1. Heat provides automatic rollback on update failure. If automatic rollback succeeds:
   ```bash
   openstack stack show <stack-name>  # Should show ROLLBACK_COMPLETE
   ```
2. If automatic rollback fails, manually restore using the original template:
   ```bash
   openstack stack update -t <original-template.yaml> <stack-name>
   ```
3. Compare post-rollback state with pre-update snapshot:
   ```bash
   diff /tmp/pre-update-resources.txt <(openstack stack resource list <stack-name> --nested-depth 2)
   ```

## RELATED RUNBOOKS

- RB-HEAT-001: Stack Creation Failure Diagnosis -- for diagnosing resource-level failures
- RB-HEAT-002: Template Validation and Debugging -- to validate update templates before applying
- RB-HEAT-003: Resource Dependency Resolution -- when update introduces dependency issues
- RB-GENERAL-002: Full Cloud Backup and Restore -- for backing up before major stack updates
