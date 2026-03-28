<?php
// PNW Research Series — Sync Endpoint
// Receives data pushes from local dev environment
// POST /api/sync.php?action=<action> with Bearer token

require_once __DIR__ . '/config.php';
cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'POST required'], 405);
}

require_auth();

$action = $_GET['action'] ?? '';
$body = json_decode(file_get_contents('php://input'), true);
if (!$body) json_response(['error' => 'Invalid JSON body'], 400);

try {
    $db = get_db();
    match ($action) {
        'init'      => sync_init($db),
        'projects'  => sync_projects($db, $body),
        'clusters'  => sync_clusters($db, $body),
        'edges'     => sync_edges($db, $body),
        'modules'   => sync_modules($db, $body),
        'releases'  => sync_releases($db, $body),
        'search'    => sync_search($db, $body),
        'stats'     => sync_stats($db, $body),
        'full'      => sync_full($db, $body),
        default     => json_response(['error' => 'Unknown action'], 400),
    };
} catch (PDOException $e) {
    json_response(['error' => $e->getMessage()], 500);
}

function sync_init(PDO $db): never {
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $db->exec($schema);
    json_response(['status' => 'schema initialized']);
}

function sync_projects(PDO $db, array $body): never {
    $stmt = $db->prepare("INSERT INTO projects (id, name, path, cluster, cluster_color, modules, total_lines, version_added, title, subtitle, through_line) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), path=VALUES(path), cluster=VALUES(cluster), cluster_color=VALUES(cluster_color), modules=VALUES(modules), total_lines=VALUES(total_lines), version_added=VALUES(version_added), title=VALUES(title), subtitle=VALUES(subtitle), through_line=VALUES(through_line)");

    $count = 0;
    foreach ($body['projects'] ?? [] as $p) {
        $stmt->execute([
            $p['id'], $p['name'], $p['path'],
            $p['cluster'] ?? '', $p['cluster_color'] ?? '#999',
            $p['modules'] ?? 0, $p['total_lines'] ?? 0,
            $p['version_added'] ?? '', $p['title'] ?? '',
            $p['subtitle'] ?? null, $p['through_line'] ?? null,
        ]);
        $count++;
    }
    json_response(['synced' => $count]);
}

function sync_clusters(PDO $db, array $body): never {
    $stmt = $db->prepare("INSERT INTO clusters (name, color, hub_project, member_count, description) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE color=VALUES(color), hub_project=VALUES(hub_project), member_count=VALUES(member_count), description=VALUES(description)");

    $count = 0;
    foreach ($body['clusters'] ?? [] as $c) {
        $stmt->execute([
            $c['name'], $c['color'], $c['hub'] ?? null,
            $c['count'] ?? 0, $c['description'] ?? null,
        ]);
        $count++;
    }
    json_response(['synced' => $count]);
}

function sync_edges(PDO $db, array $body): never {
    // Clear and rebuild for clean sync
    $db->exec("TRUNCATE TABLE cross_refs");

    $stmt = $db->prepare("INSERT IGNORE INTO cross_refs (source_id, target_id, ref_type) VALUES (?, ?, ?)");
    $count = 0;
    foreach ($body['edges'] ?? [] as $e) {
        $stmt->execute([$e['source'], $e['target'], $e['type'] ?? 'cites']);
        $count++;
    }
    json_response(['synced' => $count]);
}

function sync_modules(PDO $db, array $body): never {
    $stmt = $db->prepare("INSERT INTO modules (project_id, filename, title, line_count, sort_order) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), line_count=VALUES(line_count), sort_order=VALUES(sort_order)");

    $count = 0;
    foreach ($body['modules'] ?? [] as $m) {
        $stmt->execute([
            $m['project_id'], $m['filename'],
            $m['title'] ?? '', $m['line_count'] ?? 0,
            $m['sort_order'] ?? 0,
        ]);
        $count++;
    }
    json_response(['synced' => $count]);
}

function sync_releases(PDO $db, array $body): never {
    $stmt = $db->prepare("INSERT INTO releases (tag, title, code, released_at, summary, dedicated_to, project_count, total_lines) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), code=VALUES(code), released_at=VALUES(released_at), summary=VALUES(summary), dedicated_to=VALUES(dedicated_to), project_count=VALUES(project_count), total_lines=VALUES(total_lines)");

    $count = 0;
    foreach ($body['releases'] ?? [] as $r) {
        $stmt->execute([
            $r['tag'], $r['title'] ?? '', $r['code'] ?? null,
            $r['released_at'] ?? null, $r['summary'] ?? null,
            $r['dedicated_to'] ?? null, $r['project_count'] ?? 0,
            $r['total_lines'] ?? 0,
        ]);
        $count++;
    }
    json_response(['synced' => $count]);
}

function sync_search(PDO $db, array $body): never {
    $db->exec("TRUNCATE TABLE search_index");

    $stmt = $db->prepare("INSERT INTO search_index (project_id, content_type, content) VALUES (?, ?, ?)");
    $count = 0;
    foreach ($body['entries'] ?? [] as $e) {
        $stmt->execute([$e['project_id'], $e['type'], $e['content']]);
        $count++;
    }
    json_response(['synced' => $count]);
}

function sync_stats(PDO $db, array $body): never {
    $stmt = $db->prepare("UPDATE stats SET total_projects=?, total_clusters=?, total_edges=?, total_modules=?, total_lines=?, total_releases=?, last_sync=NOW() WHERE id=1");
    $stmt->execute([
        $body['total_projects'] ?? 0,
        $body['total_clusters'] ?? 0,
        $body['total_edges'] ?? 0,
        $body['total_modules'] ?? 0,
        $body['total_lines'] ?? 0,
        $body['total_releases'] ?? 0,
    ]);
    json_response(['status' => 'stats updated']);
}

function sync_full(PDO $db, array $body): never {
    // Full sync — init schema then push all data
    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $db->exec($schema);

    $results = [];

    if (!empty($body['projects'])) {
        sync_projects_internal($db, $body['projects']);
        $results['projects'] = count($body['projects']);
    }
    if (!empty($body['clusters'])) {
        sync_clusters_internal($db, $body['clusters']);
        $results['clusters'] = count($body['clusters']);
    }
    if (!empty($body['edges'])) {
        $db->exec("TRUNCATE TABLE cross_refs");
        $stmt = $db->prepare("INSERT IGNORE INTO cross_refs (source_id, target_id, ref_type) VALUES (?, ?, ?)");
        foreach ($body['edges'] as $e) {
            $stmt->execute([$e['source'], $e['target'], $e['type'] ?? 'cites']);
        }
        $results['edges'] = count($body['edges']);
    }

    json_response(['status' => 'full sync complete', 'synced' => $results]);
}

function sync_projects_internal(PDO $db, array $projects): void {
    $stmt = $db->prepare("INSERT INTO projects (id, name, path, cluster, cluster_color, modules, total_lines, version_added, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), path=VALUES(path), cluster=VALUES(cluster), cluster_color=VALUES(cluster_color), modules=VALUES(modules), total_lines=VALUES(total_lines), version_added=VALUES(version_added), title=VALUES(title)");
    foreach ($projects as $p) {
        $stmt->execute([$p['id'], $p['name'], $p['path'], $p['cluster'] ?? '', $p['cluster_color'] ?? '#999', $p['modules'] ?? 0, $p['total_lines'] ?? 0, $p['version_added'] ?? '', $p['title'] ?? '']);
    }
}

function sync_clusters_internal(PDO $db, array $clusters): void {
    $stmt = $db->prepare("INSERT INTO clusters (name, color, hub_project, member_count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE color=VALUES(color), hub_project=VALUES(hub_project), member_count=VALUES(member_count)");
    foreach ($clusters as $c) {
        $stmt->execute([$c['name'], $c['color'], $c['hub'] ?? null, $c['count'] ?? 0]);
    }
}
