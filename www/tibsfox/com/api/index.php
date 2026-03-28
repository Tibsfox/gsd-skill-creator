<?php
// PNW Research Series — REST API
// Routes: GET /api/?q=endpoint&params...

require_once __DIR__ . '/config.php';
cors_headers();

$q = $_GET['q'] ?? 'status';

try {
    match ($q) {
        'status'      => api_status(),
        'projects'    => api_projects(),
        'project'     => api_project(),
        'clusters'    => api_clusters(),
        'cluster'     => api_cluster(),
        'graph'       => api_graph(),
        'search'      => api_search(),
        'releases'    => api_releases(),
        'stats'       => api_stats(),
        default       => json_response(['error' => 'Unknown endpoint', 'available' => [
            'status', 'projects', 'project', 'clusters', 'cluster', 'graph', 'search', 'releases', 'stats'
        ]], 404),
    };
} catch (PDOException $e) {
    json_response(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}

// --- Endpoints ---

function api_status(): never {
    $db = get_db();
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    json_response([
        'status' => 'ok',
        'database' => DB_NAME,
        'tables' => $tables,
        'php' => PHP_VERSION,
        'time' => date('c'),
    ]);
}

function api_stats(): never {
    $db = get_db();
    $row = $db->query("SELECT * FROM stats WHERE id = 1")->fetch();
    json_response($row ?: ['error' => 'No stats yet']);
}

function api_projects(): never {
    $db = get_db();
    $cluster = $_GET['cluster'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 200), 500);
    $offset = max((int)($_GET['offset'] ?? 0), 0);

    if ($cluster) {
        $stmt = $db->prepare("SELECT id, name, path, cluster, cluster_color, modules, total_lines, version_added, title FROM projects WHERE cluster = ? ORDER BY name LIMIT ? OFFSET ?");
        $stmt->execute([$cluster, $limit, $offset]);
    } else {
        $stmt = $db->prepare("SELECT id, name, path, cluster, cluster_color, modules, total_lines, version_added, title FROM projects ORDER BY name LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
    }
    json_response($stmt->fetchAll());
}

function api_project(): never {
    $db = get_db();
    $id = strtoupper($_GET['id'] ?? '');
    if (!$id) json_response(['error' => 'id parameter required'], 400);

    $stmt = $db->prepare("SELECT * FROM projects WHERE id = ?");
    $stmt->execute([$id]);
    $project = $stmt->fetch();
    if (!$project) json_response(['error' => 'Project not found'], 404);

    // Attach modules
    $mstmt = $db->prepare("SELECT filename, title, line_count, sort_order FROM modules WHERE project_id = ? ORDER BY sort_order");
    $mstmt->execute([$id]);
    $project['modules_list'] = $mstmt->fetchAll();

    // Attach cross-references (outgoing)
    $rstmt = $db->prepare("SELECT target_id, ref_type FROM cross_refs WHERE source_id = ?");
    $rstmt->execute([$id]);
    $project['references_out'] = $rstmt->fetchAll();

    // Attach cross-references (incoming)
    $istmt = $db->prepare("SELECT source_id, ref_type FROM cross_refs WHERE target_id = ?");
    $istmt->execute([$id]);
    $project['references_in'] = $istmt->fetchAll();

    json_response($project);
}

function api_clusters(): never {
    $db = get_db();
    $rows = $db->query("SELECT c.*, GROUP_CONCAT(p.id ORDER BY p.name) AS member_ids FROM clusters c LEFT JOIN projects p ON p.cluster = c.name GROUP BY c.name ORDER BY c.member_count DESC")->fetchAll();
    foreach ($rows as &$r) {
        $r['member_ids'] = $r['member_ids'] ? explode(',', $r['member_ids']) : [];
    }
    json_response($rows);
}

function api_cluster(): never {
    $db = get_db();
    $name = $_GET['name'] ?? '';
    if (!$name) json_response(['error' => 'name parameter required'], 400);

    $stmt = $db->prepare("SELECT * FROM clusters WHERE name = ?");
    $stmt->execute([$name]);
    $cluster = $stmt->fetch();
    if (!$cluster) json_response(['error' => 'Cluster not found'], 404);

    $pstmt = $db->prepare("SELECT id, name, path, modules, total_lines FROM projects WHERE cluster = ? ORDER BY name");
    $pstmt->execute([$name]);
    $cluster['projects'] = $pstmt->fetchAll();

    json_response($cluster);
}

function api_graph(): never {
    $db = get_db();
    $nodes = $db->query("SELECT id, name, cluster, cluster_color FROM projects ORDER BY id")->fetchAll();
    $edges = $db->query("SELECT source_id, target_id, ref_type FROM cross_refs")->fetchAll();
    json_response([
        'nodes' => $nodes,
        'edges' => $edges,
        'node_count' => count($nodes),
        'edge_count' => count($edges),
    ]);
}

function api_search(): never {
    $db = get_db();
    $term = $_GET['term'] ?? '';
    if (strlen($term) < 2) json_response(['error' => 'term must be at least 2 characters'], 400);

    // Full-text search with fallback to LIKE
    $results = [];
    try {
        $stmt = $db->prepare("SELECT DISTINCT p.id, p.name, p.cluster, p.path, MATCH(s.content) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance FROM search_index s JOIN projects p ON p.id = s.project_id WHERE MATCH(s.content) AGAINST(? IN NATURAL LANGUAGE MODE) ORDER BY relevance DESC LIMIT 20");
        $stmt->execute([$term, $term]);
        $results = $stmt->fetchAll();
    } catch (PDOException $e) {
        // Fallback to LIKE if full-text fails
    }

    if (!$results) {
        $like = '%' . $term . '%';
        $stmt = $db->prepare("SELECT DISTINCT p.id, p.name, p.cluster, p.path FROM projects p WHERE p.name LIKE ? OR p.id LIKE ? ORDER BY p.name LIMIT 20");
        $stmt->execute([$like, $like]);
        $results = $stmt->fetchAll();
    }

    json_response($results);
}

function api_releases(): never {
    $db = get_db();
    $limit = min((int)($_GET['limit'] ?? 20), 100);
    $stmt = $db->prepare("SELECT * FROM releases ORDER BY tag DESC LIMIT ?");
    $stmt->execute([$limit]);
    json_response($stmt->fetchAll());
}
