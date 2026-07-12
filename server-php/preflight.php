<?php
// Aztech Co-Works — Preflight Check
// Upload to document root, visit in browser, then DELETE.
error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

$checks = [];

// PHP version
$ver = PHP_VERSION;
$ok = version_compare($ver, '8.1.0', '>=');
$checks[] = ['PHP Version', $ver, $ok, 'Need 8.1+. Go to hPanel > PHP Configuration.'];

// Required extensions
foreach (['pdo_sqlite', 'curl', 'mbstring', 'json', 'session'] as $ext) {
    $loaded = extension_loaded($ext);
    $checks[] = ["ext: $ext", $loaded ? 'loaded' : 'MISSING', $loaded, 'Enable in hPanel > PHP Configuration > Extensions.'];
}

// Optional
foreach (['openssl', 'fileinfo'] as $ext) {
    $loaded = extension_loaded($ext);
    $checks[] = ["ext: $ext (optional)", $loaded ? 'loaded' : 'missing', $loaded, 'Recommended but not critical.'];
}

// Write permission
$canWrite = is_writable(__DIR__);
$checks[] = ['Document root writable', $canWrite ? 'yes' : 'NO', $canWrite, 'chmod 755 the document root.'];

// Try creating data/ directory
$dataDir = __DIR__ . '/data';
if ($canWrite && !is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$dataOk = is_dir($dataDir) && is_writable($dataDir);
$checks[] = ['data/ directory', $dataOk ? 'writable' : 'FAILED', $dataOk, 'Create data/ folder, chmod 755.'];

// SQLite test
$sqliteOk = false;
$sqliteMsg = 'skipped';
if (extension_loaded('pdo_sqlite')) {
    try {
        $testPath = ($dataOk ? $dataDir : __DIR__) . '/preflight_test.db';
        $pdo = new PDO("sqlite:$testPath");
        $pdo->exec('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY)');
        $pdo->exec('INSERT INTO t (id) VALUES (1)');
        $val = $pdo->query('SELECT id FROM t')->fetchColumn();
        $sqliteOk = ($val == 1);
        $sqliteMsg = $sqliteOk ? 'read/write OK' : 'query failed';
        $pdo = null;
        @unlink($testPath);
    } catch (Exception $e) {
        $sqliteMsg = $e->getMessage();
    }
} else {
    $sqliteMsg = 'pdo_sqlite not loaded';
}
$checks[] = ['SQLite read/write', $sqliteMsg, $sqliteOk, 'Database must be creatable.'];

// Web server
$server = $_SERVER['SERVER_SOFTWARE'] ?? 'unknown';
$checks[] = ['Web server', $server, true, ''];

// .htaccess support
$htaccess = !str_contains(strtolower($server), 'nginx');
$checks[] = ['.htaccess support', $htaccess ? 'likely yes (Apache/LiteSpeed)' : 'NO (Nginx)', $htaccess, 'Hostinger LiteSpeed supports .htaccess.'];

$allPass = true;
foreach ($checks as $c) { if (!$c[2]) $allPass = false; }
?>
<!DOCTYPE html>
<html>
<head>
<title>Aztech Preflight</title>
<style>
body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a2340}
h1{font-size:1.5rem;margin-bottom:4px}
.sub{color:#6b7a90;margin-bottom:24px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e2e6ec}
th{font-size:.8rem;text-transform:uppercase;color:#6b7a90}
.pass{color:#16a34a;font-weight:600}
.fail{color:#dc2626;font-weight:600}
.hint{font-size:.8rem;color:#6b7a90}
.banner{padding:16px 20px;border-radius:8px;font-weight:600;margin-bottom:24px}
.ok{background:#dcfce7;color:#15803d}
.bad{background:#fef2f2;color:#dc2626}
.warn{margin-top:24px;padding:12px 16px;background:#fef3c7;color:#92400e;border-radius:8px;font-size:.9rem}
</style>
</head>
<body>
<h1>Aztech Co-Works &mdash; Preflight Check</h1>
<p class="sub">Checking PHP environment on Hostinger</p>
<div class="banner <?php echo $allPass ? 'ok' : 'bad'; ?>">
<?php echo $allPass ? 'All checks passed. Ready to deploy!' : 'Some checks failed. Fix the issues below.'; ?>
</div>
<table>
<tr><th>Check</th><th>Result</th><th>Fix</th></tr>
<?php foreach ($checks as $c): ?>
<tr>
<td><?php echo htmlspecialchars($c[0]); ?></td>
<td class="<?php echo $c[2] ? 'pass' : 'fail'; ?>"><?php echo htmlspecialchars((string)$c[1]); ?></td>
<td class="hint"><?php echo $c[2] ? '&#10003;' : htmlspecialchars($c[3]); ?></td>
</tr>
<?php endforeach; ?>
</table>
<div class="warn"><strong>Delete this file</strong> after checking.</div>
</body>
</html>
