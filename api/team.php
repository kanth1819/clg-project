<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

// Initialize database
initializeDatabase();

// Get database connection
$conn = getConnection();
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single team member
                $stmt = $conn->prepare("SELECT * FROM team_members WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $member = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($member) {
                    // Get member's projects
                    $stmt = $conn->prepare("
                        SELECT p.*, pm.role as project_role 
                        FROM projects p 
                        JOIN project_members pm ON p.id = pm.project_id 
                        WHERE pm.member_id = ?
                    ");
                    $stmt->execute([$_GET['id']]);
                    $member['projects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode($member);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Team member not found']);
                }
            } else {
                // Get all team members
                $stmt = $conn->query("SELECT * FROM team_members ORDER BY name ASC");
                $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($members);
            }
            break;
        
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name']) || !isset($data['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and email are required']);
                break;
            }
            
            $stmt = $conn->prepare("
                INSERT INTO team_members (name, email, role, department, is_active) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['role'] ?? null,
                $data['department'] ?? null,
                $data['is_active'] ?? true
            ]);
            
            $memberId = $conn->lastInsertId();
            
            // Add project assignments if provided
            if (isset($data['projects']) && is_array($data['projects'])) {
                $stmt = $conn->prepare("
                    INSERT INTO project_members (project_id, member_id, role) 
                    VALUES (?, ?, ?)
                ");
                
                foreach ($data['projects'] as $project) {
                    $stmt->execute([
                        $project['id'],
                        $memberId,
                        $project['role'] ?? 'member'
                    ]);
                }
            }
            
            echo json_encode(['id' => $memberId, 'message' => 'Team member created successfully']);
            break;
        
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Team member ID is required']);
                break;
            }
            
            $stmt = $conn->prepare("
                UPDATE team_members 
                SET name = ?, email = ?, role = ?, department = ?, is_active = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['role'] ?? null,
                $data['department'] ?? null,
                $data['is_active'] ?? true,
                $data['id']
            ]);
            
            // Update project assignments if provided
            if (isset($data['projects'])) {
                // Remove existing assignments
                $stmt = $conn->prepare("DELETE FROM project_members WHERE member_id = ?");
                $stmt->execute([$data['id']]);
                
                // Add new assignments
                if (is_array($data['projects'])) {
                    $stmt = $conn->prepare("
                        INSERT INTO project_members (project_id, member_id, role) 
                        VALUES (?, ?, ?)
                    ");
                    
                    foreach ($data['projects'] as $project) {
                        $stmt->execute([
                            $project['id'],
                            $data['id'],
                            $project['role'] ?? 'member'
                        ]);
                    }
                }
            }
            
            echo json_encode(['message' => 'Team member updated successfully']);
            break;
        
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Team member ID is required']);
                break;
            }
            
            $stmt = $conn->prepare("DELETE FROM team_members WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            
            echo json_encode(['message' => 'Team member deleted successfully']);
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?> 