<?php
// forest.php — Zero-trust shared forest state API
// GET  → return current shared world state
// POST → merge client contributions into shared state
//
// State stored as JSON file on disk. No auth required (zero-trust).
// Fitness-based pruning: plants with highest growth survive at cap.
// Rate limiting: max 1 write per IP per 10 seconds.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$stateFile = __DIR__ . '/forest-state.json';
$rateFile  = __DIR__ . '/rate-limit.json';
$maxPlants = 120;
$maxSeeds  = 40;
$rateLimitSeconds = 10;

// === HELPERS ===
function loadState($file) {
    if (!file_exists($file)) {
        return [
            'plants' => [],
            'seeds'  => [],
            'epoch'  => 0,
            'contributors' => 0,
            'lastUpdate' => time(),
            'created' => time(),
        ];
    }
    $data = json_decode(file_get_contents($file), true);
    return $data ?: ['plants'=>[],'seeds'=>[],'epoch'=>0,'contributors'=>0,'lastUpdate'=>time(),'created'=>time()];
}

function saveState($file, $state) {
    $state['lastUpdate'] = time();
    $tmp = $file . '.tmp.' . getmypid();
    file_put_contents($tmp, json_encode($state), LOCK_EX);
    rename($tmp, $file);
}

function checkRateLimit($file, $ip, $seconds) {
    $limits = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    if (!is_array($limits)) $limits = [];
    $now = time();
    // Clean old entries
    foreach ($limits as $k => $t) { if ($now - $t > $seconds * 10) unset($limits[$k]); }
    if (isset($limits[$ip]) && ($now - $limits[$ip]) < $seconds) {
        return false; // rate limited
    }
    $limits[$ip] = $now;
    file_put_contents($file, json_encode($limits), LOCK_EX);
    return true;
}

function validatePlant($p) {
    // Sanitize plant data — only allow expected numeric fields
    return [
        'x'      => floatval($p['x'] ?? 0),
        'y'      => floatval($p['y'] ?? 0),
        'type'   => intval($p['type'] ?? 0) % 4,
        'growth' => max(0, min(1, floatval($p['growth'] ?? 0))),
        'age'    => max(0, intval($p['age'] ?? 0)),
        'water'  => max(0, min(15, floatval($p['water'] ?? 0))),
        'dna'    => [
            'angleVar' => max(-30, min(30, floatval($p['dna']['angleVar'] ?? 0))),
            'baseLen'  => max(5, min(80, floatval($p['dna']['baseLen'] ?? 25))),
            'shrinkMod'=> max(-0.2, min(0.2, floatval($p['dna']['shrinkMod'] ?? 0))),
            'colShift' => [
                max(-40, min(40, intval($p['dna']['colShift'][0] ?? 0))),
                max(-40, min(40, intval($p['dna']['colShift'][1] ?? 0))),
                max(-40, min(40, intval($p['dna']['colShift'][2] ?? 0))),
            ],
        ],
        'hash' => substr(md5(json_encode($p['dna'] ?? [])), 0, 8),
    ];
}

function validateSeed($s) {
    return [
        'x'    => floatval($s['x'] ?? 0),
        'y'    => floatval($s['y'] ?? 0),
        'type' => intval($s['type'] ?? 0) % 4,
        'dna'  => isset($s['dna']) ? [
            'angleVar' => max(-30, min(30, floatval($s['dna']['angleVar'] ?? 0))),
            'baseLen'  => max(5, min(80, floatval($s['dna']['baseLen'] ?? 25))),
            'shrinkMod'=> max(-0.2, min(0.2, floatval($s['dna']['shrinkMod'] ?? 0))),
            'colShift' => [
                max(-40, min(40, intval($s['dna']['colShift'][0] ?? 0))),
                max(-40, min(40, intval($s['dna']['colShift'][1] ?? 0))),
                max(-40, min(40, intval($s['dna']['colShift'][2] ?? 0))),
            ],
        ] : null,
        'life' => max(0, min(2000, intval($s['life'] ?? 500))),
    ];
}

// === GET — return shared state ===
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $state = loadState($stateFile);
    // Add server time for client sync
    $state['serverTime'] = time();
    $state['timeSinceUpdate'] = time() - ($state['lastUpdate'] ?? time());
    echo json_encode($state);
    exit;
}

// === POST — merge contributions ===
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    if (!checkRateLimit($rateFile, $ip, $rateLimitSeconds)) {
        http_response_code(429);
        echo json_encode(['error' => 'Rate limited. One contribution per ' . $rateLimitSeconds . ' seconds.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $state = loadState($stateFile);

    // Merge new plants
    $newPlants = $input['plants'] ?? [];
    if (is_array($newPlants)) {
        foreach (array_slice($newPlants, 0, 20) as $p) { // max 20 plants per contribution
            $validated = validatePlant($p);
            // Check for duplicates (same position within 5px)
            $isDupe = false;
            foreach ($state['plants'] as $existing) {
                if (abs($existing['x'] - $validated['x']) < 5 && abs($existing['y'] - $validated['y']) < 5) {
                    // Update growth if contributor's is higher
                    if ($validated['growth'] > $existing['growth']) {
                        $existing['growth'] = $validated['growth'];
                        $existing['age'] = $validated['age'];
                    }
                    $isDupe = true;
                    break;
                }
            }
            if (!$isDupe) {
                $state['plants'][] = $validated;
            }
        }
    }

    // Merge seeds
    $newSeeds = $input['seeds'] ?? [];
    if (is_array($newSeeds)) {
        foreach (array_slice($newSeeds, 0, 10) as $s) {
            $state['seeds'][] = validateSeed($s);
        }
    }

    // Prune: keep fittest plants if over cap (sort by growth desc, keep top N)
    if (count($state['plants']) > $maxPlants) {
        usort($state['plants'], function($a, $b) {
            return $b['growth'] <=> $a['growth'];
        });
        $state['plants'] = array_slice($state['plants'], 0, $maxPlants);
    }

    // Cap seeds
    if (count($state['seeds']) > $maxSeeds) {
        $state['seeds'] = array_slice($state['seeds'], -$maxSeeds);
    }

    $state['epoch']++;
    $state['contributors']++;

    saveState($stateFile, $state);

    echo json_encode([
        'ok' => true,
        'plants' => count($state['plants']),
        'seeds' => count($state['seeds']),
        'epoch' => $state['epoch'],
        'contributors' => $state['contributors'],
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
