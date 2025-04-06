const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'flowtrack_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create tables if they don't exist
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    const createProjectsTable = `
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            status ENUM('active', 'completed', 'on-hold') DEFAULT 'active',
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `;
    
    db.query(createUsersTable, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table ready');
    });
    
    db.query(createProjectsTable, (err) => {
        if (err) console.error('Error creating projects table:', err);
        else console.log('Projects table ready');
    });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Error registering user' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create JWT token
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '24h' });
        res.json({ token, userId: user.id, username: user.username });
    });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Get user's projects
app.get('/api/projects', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM projects WHERE user_id = ?';
    db.query(query, [req.user.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching projects' });
        res.json(results);
    });
});

// Create new project
app.post('/api/projects', authenticateToken, (req, res) => {
    const { title, description } = req.body;
    const query = 'INSERT INTO projects (title, description, user_id) VALUES (?, ?, ?)';
    
    db.query(query, [title, description, req.user.userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error creating project' });
        res.status(201).json({ message: 'Project created successfully', projectId: result.insertId });
    });
});

// Delete project
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    
    // First check if the project belongs to the user
    const checkQuery = 'SELECT user_id FROM projects WHERE id = ?';
    db.query(checkQuery, [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error checking project ownership' });
        if (results.length === 0) return res.status(404).json({ error: 'Project not found' });
        if (results[0].user_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
        
        // If authorized, delete the project
        const deleteQuery = 'DELETE FROM projects WHERE id = ?';
        db.query(deleteQuery, [projectId], (err) => {
            if (err) return res.status(500).json({ error: 'Error deleting project' });
            res.json({ message: 'Project deleted successfully' });
        });
    });
});

// Update project status
app.patch('/api/projects/:id/status', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    const { status } = req.body;
    
    if (!['active', 'completed', 'on-hold'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    const query = 'UPDATE projects SET status = ? WHERE id = ? AND user_id = ?';
    db.query(query, [status, projectId, req.user.userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error updating project status' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
        res.json({ message: 'Project status updated successfully' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});