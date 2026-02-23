RUNBOOK: RB-HEAT-003 -- Resource Dependency Resolution
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed (`openstack`)
2. User credentials sourced with project access
3. Heat API and engine containers are running (`docker ps --filter name=heat`)
4. A HOT template is available that has dependency-related issues (circular references, ordering failures, or implicit dependency problems)

## PROCEDURE

Step 1: Identify the dependency error
```bash
# If stack creation failed with dependency error:
openstack stack show <stack-name> -c stack_status_reason -f value

# Common dependency error messages:
# "Circular reference found" -- circular depends_on chain
# "Resource <name> depends on unknown resource" -- typo in depends_on
# "Could not resolve resource" -- referencing non-existent resource
```
Expected: Error message identifies the specific dependency issue
If not: Check stack events for more detail: `openstack stack event list <stack-name>`

Step 2: Analyze template dependency graph

**Identify explicit dependencies (depends_on):**
```bash
grep -n "depends_on" <template.yaml>
```
Expected: Each `depends_on` entry references a resource defined in the same template
If not: Fix typos or remove references to non-existent resources

**Identify implicit dependencies (get_resource, get_attr):**
```bash
grep -n "get_resource\|get_attr" <template.yaml>
```
Expected: These create implicit dependencies. Heat automatically orders resources so that referenced resources are created first.
If not: If a resource uses `get_resource` to reference another resource, that reference creates an implicit dependency

Step 3: Check for circular dependency chains
```bash
# Map out the dependency chain:
# Resource A depends_on B (explicit)
# Resource B uses get_resource: C (implicit)
# Resource C depends_on A (explicit) -- CIRCULAR!

# Validate the template to let Heat detect the cycle
openstack orchestration template validate -t <template.yaml>
```
Expected: If circular, validation returns "Circular reference" error with the resource names involved
If not: The cycle may be indirect through nested templates or property references

Step 4: Resolve circular dependencies

**Option A: Remove unnecessary depends_on**
```yaml
# Before (circular):
resources:
  network:
    type: OS::Neutron::Net
    depends_on: [router]      # Remove this -- router depends on network, not vice versa
  subnet:
    type: OS::Neutron::Subnet
    properties:
      network_id: { get_resource: network }
  router:
    type: OS::Neutron::Router
```

**Option B: Use outputs instead of direct references**
```yaml
# Split into two templates to break the cycle
# Template 1 creates the base resources and outputs their IDs
# Template 2 takes IDs as parameters and creates dependent resources
```

**Option C: Use WaitCondition for external dependencies**
```yaml
# When a resource needs to wait for an external signal
# rather than depending on another template resource
resources:
  wait_handle:
    type: OS::Heat::WaitConditionHandle
  wait_condition:
    type: OS::Heat::WaitCondition
    properties:
      handle: { get_resource: wait_handle }
      timeout: 300
```
Expected: After restructuring, `openstack orchestration template validate` passes
If not: Continue simplifying the dependency graph until validation succeeds

Step 5: Verify ordering by reviewing implicit vs explicit dependencies
```bash
# Explicit depends_on should only be used when there is no implicit dependency
# through get_resource or get_attr. Redundant depends_on is harmless but confusing.

# Check if depends_on is redundant:
# If resource A already uses get_resource: B, then depends_on: [B] is unnecessary
```
Expected: Each depends_on entry adds a dependency not already implied by property references
If not: Remove redundant depends_on entries to simplify the graph

Step 6: Test the fixed template
```bash
# Validate first
openstack orchestration template validate -t <fixed-template.yaml>

# Dry-run to preview resource creation order
openstack stack create --dry-run -t <fixed-template.yaml> <test-stack>

# Create the stack
openstack stack create -t <fixed-template.yaml> <stack-name>
openstack stack event list <stack-name> --sort-key event_time
```
Expected: Stack creates successfully with resources created in correct dependency order
If not: Return to Step 1 with the new failure message

## VERIFICATION

1. `openstack orchestration template validate -t <template.yaml>` passes with no circular reference errors
2. `openstack stack create` completes with CREATE_COMPLETE status
3. `openstack stack event list <stack-name>` shows resources created in correct dependency order
4. All resources are functional and properly connected

## ROLLBACK

1. If the template was modified, revert to the previous working version:
   ```bash
   git checkout <previous-version> -- <template.yaml>
   ```
2. If a stack was created with the broken template, delete it:
   ```bash
   openstack stack delete <stack-name> --yes --wait
   ```
3. Simplify the dependency graph by splitting into multiple templates if needed

## RELATED RUNBOOKS

- RB-HEAT-001: Stack Creation Failure Diagnosis -- when dependency resolution is one of several failure causes
- RB-HEAT-002: Template Validation and Debugging -- for pre-deployment syntax and type validation
- RB-HEAT-004: Stack Update and Rollback Procedure -- when dependency changes affect stack updates
