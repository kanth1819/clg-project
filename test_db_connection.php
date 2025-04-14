<?php
// Include database configuration
require_once 'config/database.php';

// Test database connection
echo "<h2>Testing Database Connection</h2>";

// Initialize database
echo "<p>Initializing database...</p>";
$initialized = initializeDatabase();
if ($initialized) {
    echo "<p style='color: green;'>Database initialized successfully!</p>";
} else {
    echo "<p style='color: red;'>Failed to initialize database.</p>";
    exit;
}

// Get database connection
echo "<p>Connecting to database...</p>";
$conn = getConnection();
if ($conn) {
    echo "<p style='color: green;'>Connected to database successfully!</p>";
    
    // Check tables
    echo "<h3>Checking Tables</h3>";
    $tables = ['projects', 'team_members', 'member_projects', 'tasks'];
    foreach ($tables as $table) {
        $stmt = $conn->prepare("SHOW TABLES LIKE :table");
        $stmt->execute([':table' => $table]);
        if ($stmt->rowCount() > 0) {
            echo "<p style='color: green;'>Table '$table' exists.</p>";
            
            // Count records
            $stmt = $conn->prepare("SELECT COUNT(*) FROM $table");
            $stmt->execute();
            $count = $stmt->fetchColumn();
            echo "<p>Table '$table' has $count records.</p>";
        } else {
            echo "<p style='color: red;'>Table '$table' does not exist.</p>";
        }
    }
    
    // Sample data insertion (if tables are empty)
    echo "<h3>Inserting Sample Data</h3>";
    
    // Check if projects table is empty
    $stmt = $conn->prepare("SELECT COUNT(*) FROM projects");
    $stmt->execute();
    $projectCount = $stmt->fetchColumn();
    
    if ($projectCount == 0) {
        // Insert sample project
        $stmt = $conn->prepare("
            INSERT INTO projects (name, description, due_date, priority, status, progress, active) 
            VALUES (:name, :description, :due_date, :priority, :status, :progress, :active)
        ");
        $stmt->execute([
            ':name' => 'Sample Project',
            ':description' => 'This is a sample project for testing.',
            ':due_date' => date('Y-m-d', strtotime('+30 days')),
            ':priority' => 'medium',
            ':status' => 'in-progress',
            ':progress' => 25,
            ':active' => true
        ]);
        echo "<p style='color: green;'>Sample project inserted.</p>";
    } else {
        echo "<p>Projects table already has data.</p>";
    }
    
    // Check if team_members table is empty
    $stmt = $conn->prepare("SELECT COUNT(*) FROM team_members");
    $stmt->execute();
    $memberCount = $stmt->fetchColumn();
    
    if ($memberCount == 0) {
        // Insert sample team member
        $stmt = $conn->prepare("
            INSERT INTO team_members (name, email, role, is_active) 
            VALUES (:name, :email, :role, :is_active)
        ");
        $stmt->execute([
            ':name' => 'John Doe',
            ':email' => 'john.doe@example.com',
            ':role' => 'developer',
            ':is_active' => true
        ]);
        echo "<p style='color: green;'>Sample team member inserted.</p>";
    } else {
        echo "<p>Team members table already has data.</p>";
    }
    
    echo "<h3>Database Connection Test Complete</h3>";
    echo "<p>Your database is properly configured and ready to use.</p>";
} else {
    echo "<p style='color: red;'>Failed to connect to database.</p>";
    echo "<p>Please check your database configuration in config/database.php</p>";
}
?> 