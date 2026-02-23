RUNBOOK: RB-GENERAL-004 -- MariaDB/MySQL Database Maintenance
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the MariaDB host
2. Docker CLI available on the host
3. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
4. Knowledge of the symptoms (service connection errors, slow queries, replication lag, table corruption)
5. Backup of the database exists or can be created (see RB-GENERAL-002)

## PROCEDURE

Step 1: Check MariaDB container status
```bash
docker ps --filter name=mariadb
docker inspect --format '{{.State.Status}} (restarts: {{.RestartCount}})' mariadb
docker logs mariadb --tail 30 2>&1 | grep -i "error\|warning"
```
Expected: Container is running with low restart count and no critical errors
If not: If container is stopped, start it: `docker start mariadb`. If restarting, check logs for the root cause.

Step 2: Verify database connectivity
```bash
# Test connection from the host
docker exec mariadb mysql -e "SELECT 1 AS connection_test;"

# Check active connections
docker exec mariadb mysql -e "SHOW STATUS LIKE 'Threads_connected';"

# Check max connections vs current
docker exec mariadb mysql -e "SHOW VARIABLES LIKE 'max_connections'; SHOW STATUS LIKE 'Threads_connected';"
```
Expected: Connection succeeds; thread count is well below max_connections
If not: If connection refused, MariaDB may have crashed. Check container logs. If at max connections, services may need connection pooling or max_connections increase.

Step 3: Check Galera cluster status (if multi-node)
```bash
docker exec mariadb mysql -e "SHOW STATUS LIKE 'wsrep_%';" | grep -E "cluster_size|cluster_status|local_state|ready"
```
Expected: `wsrep_cluster_status: Primary`; `wsrep_local_state_comment: Synced`; `wsrep_ready: ON`; cluster_size matches expected node count
If not: If cluster is not primary or node is not synced, the node may need to rejoin the cluster. See Step 7.

Step 4: Check for slow queries
```bash
# Enable slow query log temporarily
docker exec mariadb mysql -e "SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 2;"

# Check for currently running long queries
docker exec mariadb mysql -e "SHOW FULL PROCESSLIST;" | grep -v Sleep | head -20

# Check slow query log
docker exec mariadb cat /var/log/mysql/mariadb-slow.log 2>/dev/null | tail -30
```
Expected: No queries running longer than expected; slow query log is empty or has few entries
If not: Identify the slow queries and the database/table involved. Common OpenStack slow queries involve nova.instances, neutron.ports, or keystone.token tables.

Step 5: Check table integrity
```bash
# Run table check on all databases (non-destructive)
docker exec mariadb mysqlcheck --all-databases --check

# For a specific OpenStack database
docker exec mariadb mysqlcheck keystone --check
docker exec mariadb mysqlcheck nova --check
docker exec mariadb mysqlcheck neutron --check
```
Expected: All tables report `OK`
If not: If tables are marked as `corrupt`, proceed to Step 6

Step 6: Repair corrupted tables
```bash
# IMPORTANT: Back up the database BEFORE repair
docker exec mariadb mysqldump --all-databases --single-transaction > /backup/pre-repair-dump.sql

# Repair specific table
docker exec mariadb mysqlcheck --repair <database> <table>

# Repair all databases
docker exec mariadb mysqlcheck --all-databases --repair

# If repair fails, try optimize
docker exec mariadb mysqlcheck --all-databases --optimize
```
Expected: Tables are repaired and return `OK` on subsequent check
If not: If repair fails, restore from backup (see RB-GENERAL-002)

Step 7: Recover Galera cluster node (multi-node only)
```bash
# If a node has fallen out of sync:
# 1. Stop the MariaDB container on the failed node
docker stop mariadb

# 2. Remove the grastate.dat to force full SST
docker exec mariadb rm /var/lib/mysql/grastate.dat 2>/dev/null

# 3. Start MariaDB -- it will rejoin via SST (State Snapshot Transfer)
docker start mariadb

# 4. Monitor sync progress
docker exec mariadb mysql -e "SHOW STATUS LIKE 'wsrep_local_state_comment';"
```
Expected: Node rejoins the cluster and syncs to `Synced` state
If not: Check network connectivity between cluster nodes; verify the donor node has enough resources for SST

Step 8: Check database disk usage
```bash
# Check disk usage per database
docker exec mariadb mysql -e "
SELECT table_schema AS database_name,
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
GROUP BY table_schema
ORDER BY size_mb DESC;
"

# Check overall disk space
df -h /var/lib/docker/volumes/
```
Expected: Database sizes are reasonable; disk space has adequate headroom (>20% free)
If not: Identify large tables and consider purging old data. Common targets: `nova.instance_actions`, `nova.instance_actions_events`, expired Keystone tokens (if using non-Fernet backend)

Step 9: Optimize database performance
```bash
# Optimize tables to reclaim space and rebuild indexes
docker exec mariadb mysqlcheck --all-databases --optimize

# Check and adjust key buffer and query cache
docker exec mariadb mysql -e "
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW STATUS LIKE 'Innodb_buffer_pool_reads';
SHOW STATUS LIKE 'Innodb_buffer_pool_read_requests';
"
```
Expected: Buffer pool hit ratio is >95% (read_requests >> reads); optimization completes without errors
If not: Consider increasing `innodb_buffer_pool_size` via Kolla-Ansible config override

Step 10: Verify all services can connect after maintenance
```bash
source /etc/kolla/admin-openrc.sh

# Test service connectivity
openstack token issue
openstack server list --limit 1
openstack network list --limit 1
openstack volume list --limit 1
openstack image list --limit 1
```
Expected: All services connect to MariaDB and return results
If not: Restart services that cannot connect: `docker restart <service_container>`

## VERIFICATION

1. `docker exec mariadb mysql -e "SELECT 1;"` succeeds (database is responsive)
2. `mysqlcheck --all-databases --check` reports all tables OK
3. Thread count is below max_connections: `SHOW STATUS LIKE 'Threads_connected'`
4. Disk usage has adequate headroom (>20% free)
5. All OpenStack services can connect and query the database
6. (If Galera) All cluster nodes show `Synced` state

## ROLLBACK

1. If table repair made things worse, restore from the pre-repair backup:
   ```bash
   docker exec -i mariadb mysql < /backup/pre-repair-dump.sql
   ```
2. If configuration changes were made, revert via Kolla-Ansible:
   ```bash
   kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags mariadb
   ```
3. If the database is unrecoverable, restore from the most recent full backup:
   ```bash
   # See RB-GENERAL-002 for full restore procedure
   ```

## RELATED RUNBOOKS

- RB-GENERAL-001: Full Cloud Daily Health Check -- includes database connectivity check
- RB-GENERAL-002: Full Cloud Backup and Restore -- for database backup before maintenance
- RB-GENERAL-003: RabbitMQ Message Queue Recovery -- the other critical infrastructure service
- RB-KOLLA-001: Container Service Recovery -- when MariaDB container keeps crashing
- RB-KOLLA-003: OpenStack Upgrade Procedure -- database migrations during upgrade
