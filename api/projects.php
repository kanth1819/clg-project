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
                // Get single project
                $stmt = $conn->prepare("SELECT * FROM projects WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $project = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($project) {
                    // Get project members
                    $stmt = $conn->prepare("
                        SELECT tm.*, pm.role as project_role 
                        FROM team_members tm 
                        JOIN project_members pm ON tm.id = pm.member_id 
                        WHERE pm.project_id = ?
                    ");
                    $stmt->execute([$_GET['id']]);
                    $project['members'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Get project tasks
                    $stmt = $conn->prepare("SELECT * FROM tasks WHERE project_id = ?");
                    $stmt->execute([$_GET['id']]);
                    $project['tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode($project);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Project not found']);
                }
            } else {
                // Get all projects
                $stmt = $conn->query("SELECT * FROM projects ORDER BY created_at DESC");
                $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($projects);
            }
            break;
        
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Project name is required']);
                break;
            }
            
            $stmt = $conn->prepare("
                INSERT INTO projects (name, description, due_date, priority, status, progress, active) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                $data['dueDate'] ?? null,
                $data['priority'] ?? 'medium',
                $data['status'] ?? 'pending',
                $data['progress'] ?? 0,
                $data['active'] ?? true
            ]);
            
            $projectId = $conn->lastInsertId();
            
            // Add team members if provided
            if (isset($data['members']) && is_array($data['members'])) {
                $stmt = $conn->prepare("
                    INSERT INTO project_members (project_id, member_id, role) 
                    VALUES (?, ?, ?)
                ");
                
                foreach ($data['members'] as $member) {
                    $stmt->execute([
                        $projectId,
                        $member['id'],
                        $member['role'] ?? 'member'
                    ]);
                }
            }
            
            echo json_encode(['id' => $projectId, 'message' => 'Project created successfully']);
            break;
        
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Project ID is required']);
                break;
            }
            
            $stmt = $conn->prepare("
                UPDATE projects 
                SET name = ?, description = ?, due_date = ?, priority = ?, 
                    status = ?, progress = ?, active = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                $data['dueDate'] ?? null,
                $data['priority'] ?? 'medium',
                $data['status'] ?? 'pending',
                $data['progress'] ?? 0,
                $data['active'] ?? true,
                $data['id']
            ]);
            
            // Update project members if provided
            if (isset($data['members'])) {
                // Remove existing members
                $stmt = $conn->prepare("DELETE FROM project_members WHERE project_id = ?");
                $stmt->execute([$data['id']]);
                
                // Add new members
                if (is_array($data['members'])) {
                    $stmt = $conn->prepare("
                        INSERT INTO project_members (project_id, member_id, role) 
                        VALUES (?, ?, ?)
                    ");
                    
                    foreach ($data['members'] as $member) {
                        $stmt->execute([
                            $data['id'],
                            $member['id'],
                            $member['role'] ?? 'member'
                        ]);
                    }
                }
            }
            
            echo json_encode(['message' => 'Project updated successfully']);
            break;
        
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Project ID is required']);
                break;
            }
            
            $stmt = $conn->prepare("DELETE FROM projects WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            
            echo json_encode(['message' => 'Project deleted successfully']);
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