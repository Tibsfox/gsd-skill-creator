RUNBOOK: RB-KEYSTONE-004 -- TLS Certificate Renewal
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with sudo privileges
  2. Access to the certificate authority (CA) or certificate generation tooling
  3. Kolla-Ansible inventory file and globals.yml configured with TLS enabled
  4. Knowledge of which certificates are expiring or have expired

PROCEDURE
  Step 1: Check current certificate expiration dates
    $ openssl x509 -enddate -noout -in /etc/kolla/certificates/haproxy.pem
    Expected: notAfter date is in the future (more than 30 days out)
    $ openssl x509 -enddate -noout -in /etc/kolla/certificates/haproxy-internal.pem
    Expected: notAfter date is in the future
    If not: Certificate is expiring or expired. Continue to Step 2

  Step 2: Verify the full certificate chain
    $ openssl verify -CAfile /etc/kolla/certificates/ca/root.crt \
        /etc/kolla/certificates/haproxy.pem
    Expected: "haproxy.pem: OK"
    If not: Chain validation failure. Check intermediate CA:
            $ openssl x509 -in /etc/kolla/certificates/haproxy.pem -text -noout | \
                grep -A2 "Issuer"
            Ensure the issuer CA is included in the trust chain

  Step 3: Generate new certificates
    Using Kolla-Ansible certificate generation (self-signed):
    $ kolla-ansible -i inventory certificates
    Expected: New certificates generated in /etc/kolla/certificates/
    If using external CA:
    $ openssl req -new -key /etc/kolla/certificates/haproxy-key.pem \
        -out /tmp/haproxy.csr -subj "/CN=controller/O=OpenStack"
    Submit CSR to CA and place signed certificate at:
    /etc/kolla/certificates/haproxy.pem

  Step 4: Verify new certificate properties
    $ openssl x509 -in /etc/kolla/certificates/haproxy.pem -text -noout | \
        grep -E "Not Before|Not After|Subject:|Issuer:"
    Expected: Valid date range, correct subject and issuer
    $ openssl x509 -in /etc/kolla/certificates/haproxy.pem -noout -checkend 2592000
    Expected: "Certificate will not expire" (valid for at least 30 days)
    If not: Regenerate with longer validity period

  Step 5: Deploy updated certificates
    $ kolla-ansible -i inventory reconfigure
    Expected: Certificates distributed to all services, services restarted
    If not: Check Kolla-Ansible output for errors.
            For targeted deployment:
            $ kolla-ansible -i inventory reconfigure --tags haproxy

  Step 6: Verify all services accept the new certificates
    $ openstack token issue
    Expected: Token issued without TLS errors
    $ openssl s_client -connect controller:5000 -showcerts </dev/null 2>/dev/null | \
        openssl x509 -noout -dates
    Expected: Shows the new certificate dates
    If not: Service may be using cached old certificate. Restart:
            $ docker restart haproxy

  Step 7: Verify internal service-to-service TLS
    $ docker exec nova_api python3 -c \
        "import requests; r = requests.get('https://controller:5000/v3'); print(r.status_code)"
    Expected: Returns 200 (no SSL verification errors)
    If not: Internal CA certificate may need updating in containers:
            $ kolla-ansible -i inventory reconfigure --tags common

VERIFICATION
  1. All API endpoints respond over HTTPS:
     $ for port in 5000 8774 9696 9292 8776; do
         echo -n "Port $port: "
         openssl s_client -connect controller:$port </dev/null 2>/dev/null | \
           grep "Verify return code"
       done
     Expected: All show "Verify return code: 0 (ok)"
  2. Certificate expiration is acceptable:
     $ openssl x509 -enddate -noout -in /etc/kolla/certificates/haproxy.pem
     Expected: At least 30 days until expiration
  3. Service-to-service communication works:
     $ openstack server list
     Expected: Returns results without SSL errors

ROLLBACK
  1. Restore previous certificate set:
     $ cp /etc/kolla/certificates/haproxy.pem.bak /etc/kolla/certificates/haproxy.pem
     $ cp /etc/kolla/certificates/haproxy-internal.pem.bak \
         /etc/kolla/certificates/haproxy-internal.pem
  2. Redeploy with old certificates:
     $ kolla-ansible -i inventory reconfigure --tags haproxy
  3. Verify rollback:
     $ openstack token issue
     $ openssl s_client -connect controller:5000 </dev/null 2>/dev/null | \
         openssl x509 -noout -dates

RELATED RUNBOOKS
  - RB-KEYSTONE-001: Token Issuance Failure -- If cert renewal causes auth failures
  - RB-KEYSTONE-002: Service Catalog Endpoint Repair -- If endpoints need URL scheme change (http/https)
  - RB-KEYSTONE-005: Fernet Key Rotation -- Often combined with cert renewal in maintenance window
