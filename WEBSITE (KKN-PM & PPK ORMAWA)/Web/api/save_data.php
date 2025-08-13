<?php
// Enable CORS and set JSON headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Database configuration
$servername = "localhost";
$username = "u906431469_airquality";
$password = "kkn12345SUKSES";
$dbname = "u906431469_airquality";

// Get raw POST data
$json_input = file_get_contents('php://input');
$payload = json_decode($json_input, true);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid JSON format",
        "error" => json_last_error_msg(),
        "received_data" => $json_input
    ]);
    exit();
}

// Validate required fields
if (empty($payload) || !isset($payload['device_id'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Device ID is required",
        "required_fields" => ["device_id"],
        "received_payload" => $payload
    ]);
    exit();
}

try {
    // Create database connection
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Prepare SQL statement
    $sql = "INSERT INTO sensor_data (
                device_id, 
                suhu, 
                kelembapan, 
                co2, 
                h2s, 
                nh3, 
                co, 
                no2, 
                pm1_0, 
                pm2_5, 
                pm10,
                timestamp
            ) VALUES (
                :device_id, 
                :suhu, 
                :kelembapan, 
                :co2, 
                :h2s, 
                :nh3, 
                :co, 
                :no2, 
                :pm1_0, 
                :pm2_5, 
                :pm10,
                NOW()
            )";
    
    $stmt = $conn->prepare($sql);
    
    // Bind parameters with proper type handling
    $stmt->bindValue(':device_id', $payload['device_id'], PDO::PARAM_STR);
    $stmt->bindValue(':suhu', isset($payload['suhu']) ? (float)$payload['suhu'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':kelembapan', isset($payload['kelembapan']) ? (float)$payload['kelembapan'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':co2', isset($payload['co2']) ? (float)$payload['co2'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':h2s', isset($payload['h2s']) ? (float)$payload['h2s'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':nh3', isset($payload['nh3']) ? (float)$payload['nh3'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':co', isset($payload['co']) ? (float)$payload['co'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':no2', isset($payload['no2']) ? (float)$payload['no2'] : null, PDO::PARAM_STR);
    $stmt->bindValue(':pm1_0', isset($payload['pm1_0']) ? (int)$payload['pm1_0'] : null, PDO::PARAM_INT);
    $stmt->bindValue(':pm2_5', isset($payload['pm2_5']) ? (int)$payload['pm2_5'] : null, PDO::PARAM_INT);
    $stmt->bindValue(':pm10', isset($payload['pm10']) ? (int)$payload['pm10'] : null, PDO::PARAM_INT);
    
    // Execute the statement
    if ($stmt->execute()) {
        // Success response
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Data saved successfully",
            "insert_id" => $conn->lastInsertId(),
            "affected_rows" => $stmt->rowCount()
        ]);
    } else {
        throw new Exception("Failed to execute query");
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error",
        "error" => $e->getMessage(),
        "error_info" => isset($stmt) ? $stmt->errorInfo() : null
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "System error",
        "error" => $e->getMessage()
    ]);
} finally {
    // Close connection
    if (isset($conn)) {
        $conn = null;
    }
}
?>