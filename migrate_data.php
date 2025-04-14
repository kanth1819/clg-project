<?php
// Include database configuration
require_once 'config/database.php';

// Initialize database
initializeDatabase();

// Get database connection
$conn = getConnection();
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Function to read localStorage data from a file
function readLocalStorageData($filename) {
    if (file_exists($filename)) {
        $content = file_get_contents($filename);
        return json_decode($content, true);
    }
    return null;
}

// Function to migrate projects
function migrateProjects($conn, $projects) {
    if (empty($projects)) {
        return ['count' => 0, 'errors' => []];
    }
    
    $count = 0;
    $errors = [];
    
    foreach ($projects as $project) {
        try {
            // Check if project already exists
            $stmt = $conn->prepare("SELECT id FROM projects WHERE id = :id");
            $stmt->execute([':id' => $project['id']]);
            
            if ($stmt->rowCount() > 0) {
                // Update existing project
                $stmt = $conn->prepare("
                    UPDATE projects 
                    SET name = :name, 
                        description = :description, 
                        due_date = :due_date, 
                        priority = :priority, 
                        status = :status, 
                        progress = :progress, 
                        active = :active
                    WHERE id = :id
                ");
            } else {
                // Insert new project
                $stmt = $conn->prepare("
                    INSERT INTO projects (id, name, description, due_date, priority, status, progress, active) 
                    VALUES (:id, :name, :description, :due_date, :priority, :status, :progress, :active)
                ");
            }
            
            $stmt->execute([
                ':id' => $project['id'],
                ':name' => $project['name'],
                ':description' => $project['description'],
                ':due_date' => $project['dueDate'] ?? $project['due_date'] ?? date('Y-m-d'),
                ':priority' => $project['priority'],
                ':status' => $project['status'],
                ':progress' => $project['progress'] ?? 0,
                ':active' => isset($project['active']) ? $project['active'] : true
            ]);
            
            $count++;
        } catch (PDOException $e) {
            $errors[] = "Error migrating project {$project['id']}: " . $e->getMessage();
        }
    }
    
    return ['count' => $count, 'errors' => $errors];
}

// Function to migrate team members
function migrateTeamMembers($conn, $members) {
    if (empty($members)) {
        return ['count' => 0, 'errors' => []];
    }
    
    $count = 0;
    $errors = [];
    
    foreach ($members as $member) {
        try {
            // Check if member already exists
            $stmt = $conn->prepare("SELECT id FROM team_members WHERE id = :id");
            $stmt->execute([':id' => $member['id']]);
            
            if ($stmt->rowCount() > 0) {
                // Update existing member
                $stmt = $conn->prepare("
                    UPDATE team_members 
                    SET name = :name, 
                        email = :email, 
                        role = :role, 
                        is_active = :is_active
                    WHERE id = :id
                ");
            } else {
                // Insert new member
                $stmt = $conn->prepare("
                    INSERT INTO team_members (id, name, email, role, is_active) 
                    VALUES (:id, :name, :email, :role, :is_active)
                ");
            }
            
            $stmt->execute([
                ':id' => $member['id'],
                ':name' => $member['name'],
                ':email' => $member['email'] ?? $member['name'] . '@example.com',
                ':role' => $member['role'] ?? 'developer',
                ':is_active' => isset($member['isActive']) ? $member['isActive'] : true
            ]);
            
            $count++;
        } catch (PDOException $e) {
            $errors[] = "Error migrating member {$member['id']}: " . $e->getMessage();
        }
    }
    
    return ['count' => $count, 'errors' => $errors];
}

// Function to migrate member-project relationships
function migrateMemberProjects($conn, $projects, $members) {
    if (empty($projects) || empty($members)) {
        return ['count' => 0, 'errors' => []];
    }
    
    $count = 0;
    $errors = [];
    
    // Clear existing relationships
    $stmt = $conn->prepare("DELETE FROM member_projects");
    $stmt->execute();
    
    foreach ($projects as $project) {
        if (isset($project['member_ids']) && !empty($project['member_ids'])) {
            $memberIds = explode(',', $project['member_ids']);
            
            foreach ($memberIds as $memberId) {
                try {
                    $stmt = $conn->prepare("
                        INSERT INTO member_projects (member_id, project_id) 
                        VALUES (:member_id, :project_id)
                    ");
                    
                    $stmt->execute([
                        ':member_id' => $memberId,
                        ':project_id' => $project['id']
                    ]);
                    
                    $count++;
                } catch (PDOException $e) {
                    $errors[] = "Error migrating relationship {$memberId}-{$project['id']}: " . $e->getMessage();
                }
            }
        }
    }
    
    return ['count' => $count, 'errors' => $errors];
}

// Start migration process
echo "<h2>Data Migration from localStorage to MySQL</h2>";

// Read localStorage data
$projects = readLocalStorageData('data/projects.json');
$members = readLocalStorageData('data/members.json');

if ($projects === null && $members === null) {
    echo "<p style='color: red;'>No localStorage data found. Please make sure the data files exist.</p>";
    exit;
}

// Migrate projects
echo "<h3>Migrating Projects</h3>";
if ($projects) {
    $result = migrateProjects($conn, $projects);
    echo "<p>Migrated {$result['count']} projects.</p>";
    if (!empty($result['errors'])) {
        echo "<p style='color: red;'>Errors:</p>";
        echo "<ul>";
        foreach ($result['errors'] as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p>No projects to migrate.</p>";
}

// Migrate team members
echo "<h3>Migrating Team Members</h3>";
if ($members) {
    $result = migrateTeamMembers($conn, $members);
    echo "<p>Migrated {$result['count']} team members.</p>";
    if (!empty($result['errors'])) {
        echo "<p style='color: red;'>Errors:</p>";
        echo "<ul>";
        foreach ($result['errors'] as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p>No team members to migrate.</p>";
}

// Migrate member-project relationships
echo "<h3>Migrating Member-Project Relationships</h3>";
if ($projects && $members) {
    $result = migrateMemberProjects($conn, $projects, $members);
    echo "<p>Migrated {$result['count']} relationships.</p>";
    if (!empty($result['errors'])) {
        echo "<p style='color: red;'>Errors:</p>";
        echo "<ul>";
        foreach ($result['errors'] as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul>";
    }
} else {
    echo "<p>No relationships to migrate.</p>";
}

echo "<h3>Migration Complete</h3>";
echo "<p>Your data has been migrated from localStorage to MySQL.</p>";
echo "<p><a href='index.html'>Go to Application</a></p>";
?> 