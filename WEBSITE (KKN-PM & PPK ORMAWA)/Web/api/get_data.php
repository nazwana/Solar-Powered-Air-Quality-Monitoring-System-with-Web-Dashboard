<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database configuration
$servername = "localhost";
$username = "u906431469_airquality";
$password = "kkn12345SUKSES";
$dbname = "u906431469_airquality";

// Get query parameters
$device_id = $_GET['device_id'] ?? null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$last_hours = $_GET['last_hours'] ?? null;
$start_date = $_GET['start_date'] ?? null;
$end_date = $_GET['end_date'] ?? null;
$download_all = isset($_GET['download_all']) ? (bool)$_GET['download_all'] : false;

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "SELECT * FROM sensor_data WHERE device_id = :device_id";
    $params = [':device_id' => $device_id];
    
    // Filter berdasarkan waktu
    if ($last_hours && !$download_all) {
        $sql .= " AND timestamp >= DATE_SUB(NOW(), INTERVAL :last_hours HOUR)";
        $params[':last_hours'] = (int)$last_hours;
    } elseif ($start_date && $end_date && !$download_all) {
        $sql .= " AND timestamp BETWEEN :start_date AND :end_date";
        $params[':start_date'] = $start_date;
        $params[':end_date'] = $end_date;
    }
    
    $sql .= " ORDER BY timestamp DESC";
    
    // Jika bukan untuk download semua, batasi jumlah data
    if (!$download_all && $limit > 0) {
        $sql .= " LIMIT :limit";
        $params[':limit'] = $limit;
    }
    
    $stmt = $conn->prepare($sql);
    
    foreach ($params as $key => $value) {
        $param_type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue($key, $value, $param_type);
    }
    
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $data,
        "count" => count($data)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>