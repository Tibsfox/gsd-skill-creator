RUNBOOK: RB-HEAT-001 -- Stack Creation Failure Diagnosis
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed (`openstack`)
2. User credentials sourced with access to the project owning the stack
3. Heat API and engine containers are running (`docker ps --filter name=heat`)
4. The stack creation has been attempted and returned CREATE_FAILED status

## PROCEDURE

Step 1: Check the stack status and reason
```bash
openstack stack show <stack-name> -f json
```
Expected: Output shows `stack_status: CREATE_FAILED` with a `stack_status_reason` describing the failure
If not: If stack is still `CREATE_IN_PROGRESS`, wait for completion or check for timeout (see Step 6)

Step 2: List stack resources to find the failing resource
```bash
openstack stack resource list <stack-name> --nested-depth 2
```
Expected: One or more resources show `CREATE_FAILED` status. Note the `resource_name` and `resource_type` of failed resources.
If not: If all resources show `CREATE_COMPLETE` but stack is failed, check nested stack resources with `--nested-depth 3`

Step 3: Get detailed failure information for the failed resource
```bash
openstack stack resource show <stack-name> <failed-resource-name>
```
Expected: `resource_status_reason` provides specific error (e.g., "No valid host was found", "Quota exceeded", "Network not found")
If not: Check stack events for more context (Step 4)

Step 4: Review stack events timeline
```bash
openstack stack event list <stack-name> --sort-key event_time
```
Expected: Events show the progression of resource creation and pinpoint when and why the failure occurred
If not: If events are empty, the heat-engine may have failed before processing. Check engine logs (Step 5).

Step 5: Check heat-engine logs for detailed error
```bash
docker logs heat_engine --tail 100 2>&1 | grep -i "error\|exception\|traceback"
```
Expected: Engine logs show the specific error that caused the resource creation to fail
If not: Increase log verbosity in /etc/kolla/config/heat/heat.conf and reconfigure, then retry

Step 6: Diagnose common failure types

**If "No valid host was found" (compute failure):**
```bash
openstack hypervisor stats show
openstack hypervisor list
```
See RB-NOVA-001 for compute resource troubleshooting.

**If "Network not found" or "Subnet not found" (network failure):**
```bash
openstack network list
openstack subnet list
```
See RB-NEUTRON-001 for network troubleshooting.

**If "Quota exceeded":**
```bash
openstack quota show --default
openstack quota show <project-id>
```
Increase quota or reduce template resource counts.

**If "Resource type not found":**
```bash
openstack orchestration resource type list | grep <resource-type>
```
Verify the service providing the resource type is registered in the service catalog.

Step 7: Clean up the failed stack
```bash
openstack stack delete <stack-name>
# Wait for deletion
openstack stack list
```
Expected: Stack is removed; resources created before the failure are cleaned up
If not: If deletion fails, use `openstack stack delete <stack-name> --force` or manually clean up resources

Step 8: Fix the root cause and retry
```bash
# After resolving the underlying issue (quota, network, compute, template):
openstack stack create -t <template.yaml> -e <env.yaml> <stack-name>
openstack stack show <stack-name>
```
Expected: Stack creation completes with `CREATE_COMPLETE` status
If not: Return to Step 1 with the new failure

## VERIFICATION

1. `openstack stack show <stack-name>` returns `stack_status: CREATE_COMPLETE`
2. `openstack stack resource list <stack-name>` shows all resources in `CREATE_COMPLETE` state
3. Stack outputs are accessible: `openstack stack output list <stack-name>`
4. Resources created by the stack are functional (instances reachable, networks connected)

## ROLLBACK

1. Delete the failed stack to clean up partial resources:
   ```bash
   openstack stack delete <stack-name> --yes --wait
   ```
2. If stack deletion fails, manually identify and remove orphaned resources:
   ```bash
   openstack server list --name <stack-prefix>
   openstack network list --name <stack-prefix>
   ```
3. Verify no orphaned resources remain from the failed stack

## RELATED RUNBOOKS

- RB-NOVA-001: Instance Launch Failure -- when stack failure is caused by compute resource issues
- RB-NEUTRON-001: Network Connectivity Troubleshooting -- when stack failure is caused by network issues
- RB-HEAT-002: Template Validation and Debugging -- to validate the template before retrying
- RB-HEAT-003: Resource Dependency Resolution -- when failure is caused by dependency ordering
- RB-HEAT-004: Stack Update and Rollback Procedure -- for updating existing stacks
