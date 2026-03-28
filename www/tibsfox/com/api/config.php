<?php
// PNW Research Series — Database Configuration
// IMPORTANT: Copy config.local.php over this file on the server.
// This template has NO real credentials. DO NOT commit secrets.

// To set up: cp config.local.php config.php (on server only)
// config.local.php is gitignored and contains real credentials.

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'tibsfox2_claudefox');
define('DB_USER', getenv('DB_USER') ?: 'CHANGE_ME');
define('DB_PASS', getenv('DB_PASS') ?: 'CHANGE_ME');
define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));

define('SYNC_TOKEN', getenv('SYNC_TOKEN') ?: 'CHANGE_ME');

define('ALLOWED_ORIGINS', [
    'http://localhost:8000',
    'http://localhost:3000',
    'https://tibsfox.com',
]);

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function cors_headers(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_auth(): void {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $header);
    if ($token !== SYNC_TOKEN) {
        json_response(['error' => 'Unauthorized'], 401);
    }
}
