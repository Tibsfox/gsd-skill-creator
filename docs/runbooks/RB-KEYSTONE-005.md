RUNBOOK: RB-KEYSTONE-005 -- Fernet Key Rotation
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: automated

PRECONDITIONS
  1. Admin access to the OpenStack controller node with sudo privileges
  2. Keystone API is operational and issuing tokens
  3. Kolla-Ansible inventory file available for managed rotation
  4. For emergency rotation: knowledge of whether key compromise has occurred

PROCEDURE -- SCHEDULED ROTATION
  Step 1: Verify current key state before rotation
    $ docker exec keystone_api ls -la /etc/kolla/keystone/fernet-keys/
    Expected: Key files numbered sequentially (0, 1, 2, etc.)
              Highest-numbered key is the current primary (used for encryption)
              Key 0 is the staging key (used for decryption only)
    $ docker exec keystone_api ls /etc/kolla/keystone/fernet-keys/ | wc -l
    Expected: Number of keys matches max_active_keys setting (default 3)

  Step 2: Issue a test token before rotation
    $ source /etc/kolla/admin-openrc.sh
    $ openstack token issue -c id -c expires -f table
    Expected: Token issued with future expiration. Save this token for Step 5

  Step 3: Perform key rotation via Kolla-Ansible
    $ kolla-ansible -i inventory keystone_fernet_rotate
    Expected: Rotation completes without errors, keys distributed to all nodes
    If not: For manual rotation on single node:
            $ docker exec keystone_api keystone-manage fernet_rotate \
                --keystone-user keystone --keystone-group keystone

  Step 4: Verify new key state after rotation
    $ docker exec keystone_api ls -la /etc/kolla/keystone/fernet-keys/
    Expected: New highest-numbered key (primary key index incremented by 1)
              Key 0 still exists (staging key)
              Old primary demoted to secondary key
    If not: Rotation may have failed. Check Kolla-Ansible output for errors

  Step 5: Verify existing tokens still validate
    $ openstack token issue
    Expected: New token issued successfully
    Test the pre-rotation token saved in Step 2:
    $ openstack --os-token <saved-token-id> catalog list
    Expected: Catalog returned (old token still valid via secondary key)
    If not: Key distribution may have failed on some nodes. Rerun:
            $ kolla-ansible -i inventory keystone_fernet_rotate

  Step 6: Verify key distribution across nodes (multi-node only)
    $ for node in controller1 controller2 controller3; do
        echo "=== $node ==="
        ssh $node "docker exec keystone_api ls -la /etc/kolla/keystone/fernet-keys/"
      done
    Expected: Identical key files on all Keystone nodes
    If not: Sync keys manually:
            $ docker cp keystone_api:/etc/kolla/keystone/fernet-keys/ /tmp/fernet-sync/
            $ scp -r /tmp/fernet-sync/ controller2:/tmp/
            $ ssh controller2 "docker cp /tmp/fernet-sync/ keystone_api:/etc/kolla/keystone/fernet-keys/"

PROCEDURE -- EMERGENCY ROTATION (KEY COMPROMISE)
  Step 1: Immediately rotate twice to invalidate compromised key
    $ kolla-ansible -i inventory keystone_fernet_rotate
    $ kolla-ansible -i inventory keystone_fernet_rotate
    Expected: Compromised key is now beyond max_active_keys and pruned
    If not: Manually remove the compromised key file and restart Keystone

  Step 2: Force re-authentication of all sessions
    $ docker restart memcached
    Expected: All cached tokens cleared, forcing re-authentication
    Note: This causes a brief service interruption (all users must re-authenticate)

  Step 3: Verify no tokens from compromised key can validate
    $ openstack token issue
    Expected: New token using new primary key validates correctly
    Attempt to use any previously captured token:
    Expected: 401 Unauthorized (old tokens invalidated)

  Step 4: Audit and investigate the compromise
    Review Keystone access logs for unauthorized token usage:
    $ docker logs keystone_api 2>&1 | grep -i "token\|auth" | tail -200
    Review system access logs:
    $ journalctl --since "1 hour ago" | grep -i "keystone\|ssh\|sudo"

VERIFICATION
  1. New tokens are issued using the new primary key:
     $ openstack token issue -f value -c id
     Expected: Valid token returned
  2. Service-to-service authentication works:
     $ openstack compute service list
     $ openstack network agent list
     Expected: Both return results without auth errors
  3. Key count matches configuration:
     $ docker exec keystone_api ls /etc/kolla/keystone/fernet-keys/ | wc -l
     Expected: Matches max_active_keys (default 3)

ROLLBACK
  1. Restore previous key repository from backup:
     $ docker cp ./fernet-keys-backup/ keystone_api:/etc/kolla/keystone/fernet-keys/
     $ docker restart keystone_api keystone_fernet
  2. For multi-node, restore on all Keystone nodes:
     $ for node in controller1 controller2 controller3; do
         scp -r ./fernet-keys-backup/ $node:/tmp/
         ssh $node "docker cp /tmp/fernet-keys-backup/ keystone_api:/etc/kolla/keystone/fernet-keys/"
         ssh $node "docker restart keystone_api keystone_fernet"
       done
  3. Verify rollback:
     $ openstack token issue

RELATED RUNBOOKS
  - RB-KEYSTONE-001: Token Issuance Failure -- If rotation causes token failures
  - RB-KEYSTONE-004: TLS Certificate Renewal -- Often performed in same maintenance window
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If auth failure cascades to compute after rotation
