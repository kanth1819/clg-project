from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime
import jwt
import os
from functools import wraps
import logging
import traceback

app = Flask(__name__, static_folder='.', static_url_path='')

# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"]
    }
})

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Fixed secret key for development
DATABASE = 'project_management.db'

# Serve static files
@app.route('/')
def root():
    try:
        return app.send_static_file('index.html')
    except Exception as e:
        app.logger.error(f"Error serving index.html: {str(e)}")
        return jsonify({'message': 'Error serving file'}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return app.send_static_file(filename)
    except Exception as e:
        app.logger.error(f"Error serving {filename}: {str(e)}")
        return jsonify({'message': 'File not found'}), 404

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id):
    """Generate JWT token"""
    return jwt.encode({'user_id': user_id}, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = get_db().execute('SELECT * FROM users WHERE user_id = ?', 
                                          (data['user_id'],)).fetchone()
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# User routes
@app.route('/api/register', methods=['POST'])
def register():
    app.logger.info(">>> Entering /api/register route handler") 
    db = None  # Initialize db variable
    try:
        data = request.get_json()
        if data is None:
            app.logger.error(">>> ERROR: request.get_json() returned None")
            return jsonify({'message': 'Invalid JSON data received'}), 400
            
        app.logger.info(">>> Processing registration data: %s", data)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        role = data.get('role', 'team_member')

        if not all([username, password, email, first_name, last_name]):
            app.logger.warning(">>> Missing required fields in registration data")
            return jsonify({'message': 'Missing required fields'}), 400

        db = get_db() # Assign database connection
        app.logger.info(">>> DB connection obtained successfully.") # ADDED LOG

        db.execute('''
            INSERT INTO users (username, password_hash, email, first_name, last_name, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, hash_password(password), email, first_name, last_name, role))
        app.logger.info(">>> SQL INSERT executed")
        db.commit()
        app.logger.info(">>> DB committed")
        app.logger.info(">>> Exiting /api/register (Success)")
        return jsonify({'message': 'User registered successfully'}), 201

    except sqlite3.IntegrityError as e:
        if db: # Check if db connection exists before rollback
            db.rollback()
            app.logger.info(">>> DB rolled back (IntegrityError)")
        app.logger.error(f">>> IntegrityError during registration: {e}")
        app.logger.error(">>> Exiting /api/register (IntegrityError)")
        return jsonify({'message': 'Username or email already exists'}), 400
    except Exception as e:
        if db: # Check if db connection exists before rollback
            db.rollback()
            app.logger.info(">>> DB rolled back (Exception)")
        # Log the exception immediately
        app.logger.error(f">>> Unexpected error during registration: {e}", exc_info=True) 
        app.logger.error(">>> Exiting /api/register (Exception)")
        return jsonify({'message': 'An unexpected error occurred on the server.'}), 500
    finally:
        # Ensure the db connection is closed if it was opened
        if db:
            app.logger.info(">>> Closing DB connection in finally block")
            db.close()
        else:
            app.logger.warning(">>> DB connection was not established, skipping close in finally block")

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'message': 'Email and password are required'}), 400

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ? AND password_hash = ?',
                     (email, hash_password(password))).fetchone()
    db.close()

    if user:
        token = generate_token(user['user_id'])
        return jsonify({
            'token': token, 
            'user_id': user['user_id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'first_name': user['first_name'],
            'last_name': user['last_name']
        })
    return jsonify({'message': 'Invalid credentials'}), 401

# Project routes
@app.route('/api/projects', methods=['GET', 'POST'])
@token_required
def handle_projects(current_user):
    print(f"Handling {request.method} request to /api/projects")
    app.logger.info(f"Handling {request.method} request to /api/projects")
    app.logger.info(f"Current user: {current_user['username']} (ID: {current_user['user_id']})")
    
    if request.method == 'GET':
        db = get_db()
        try:
            print(f"Fetching projects for user_id: {current_user['user_id']}")
            app.logger.info(f"Executing SQL query to fetch projects...")
            projects = db.execute('''
                SELECT p.*, u.username as owner_name 
                FROM projects p 
                LEFT JOIN users u ON p.owner_user_id = u.user_id
                WHERE p.owner_user_id = ? OR p.project_id IN (
                    SELECT project_id FROM team_members WHERE user_id = ?
                )
            ''', (current_user['user_id'], current_user['user_id'])).fetchall()
            
            project_list = [dict(project) for project in projects]
            app.logger.info(f"Found {len(project_list)} projects")
            app.logger.info(f"Projects: {project_list}")
            return jsonify(project_list)
            
        except Exception as e:
            print(f"Error fetching projects: {str(e)}")
            app.logger.error(f"Error fetching projects: {str(e)}")
            app.logger.error(traceback.format_exc())
            return jsonify({'message': 'Error fetching projects'}), 500
        finally:
            db.close()
            app.logger.info("Database connection closed")
    
    elif request.method == 'POST':
        print("Received POST request to create project")
        data = request.get_json()
        print("Request data:", data)
        
        if not data:
            print("No JSON data received")
            return jsonify({'message': 'No data provided'}), 400

        project_name = data.get('project_name')
        description = data.get('description')
        start_date = data.get('start_date', datetime.now().strftime('%Y-%m-%d'))
        end_date = data.get('end_date')
        priority = data.get('priority', 'medium')
        progress = data.get('progress', 0)

        if not project_name:
            print("Missing project name")
            return jsonify({'message': 'Project name is required'}), 400

        print(f"Creating project: {project_name}")
        db = get_db()
        try:
            cursor = db.execute('''
                INSERT INTO projects (project_name, description, start_date, end_date, priority, progress, owner_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (project_name, description, start_date, end_date, priority, progress, current_user['user_id']))
            
            project_id = cursor.lastrowid
            db.commit()
            
            # Fetch the created project to return
            created_project = db.execute('''
                SELECT p.*, u.username as owner_name 
                FROM projects p 
                LEFT JOIN users u ON p.owner_user_id = u.user_id
                WHERE p.project_id = ?
            ''', (project_id,)).fetchone()
            
            print(f"Project created successfully. ID: {project_id}")
            return jsonify({
                'message': 'Project created successfully',
                'project': dict(created_project)
            }), 201
            
        except Exception as e:
            print(f"Error creating project: {str(e)}")
            app.logger.error(f"Error creating project: {str(e)}")
            app.logger.error(traceback.format_exc())
            if db:
                db.rollback()
            return jsonify({'message': 'Error creating project'}), 500
        finally:
            if db:
                db.close()

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@token_required
def delete_project(current_user, project_id):
    """Deletes a specific project if the user is the owner."""
    db = get_db()
    try:
        # Check if the project exists and if the current user is the owner
        project = db.execute(
            'SELECT owner_user_id FROM projects WHERE project_id = ?',
            (project_id,)
        ).fetchone()

        if project is None:
            db.close()
            return jsonify({'message': 'Project not found'}), 404

        if project['owner_user_id'] != current_user['user_id']:
            # Add role check later if needed (e.g., admins can delete any project)
            db.close()
            return jsonify({'message': 'Unauthorized: You are not the owner of this project'}), 403

        # Proceed with deletion
        db.execute('DELETE FROM projects WHERE project_id = ?', (project_id,))
        # Related tasks and team members will be handled by CASCADE constraints if set up correctly
        db.commit()
        db.close()
        return jsonify({'message': 'Project deleted successfully'}), 200

    except Exception as e:
        if db:
            db.rollback()
            db.close()
        app.logger.error(f">>> Error deleting project {project_id}: {e}", exc_info=True)
        return jsonify({'message': 'An error occurred while deleting the project.'}), 500

# Task routes
@app.route('/api/tasks', methods=['GET', 'POST'])
@token_required
def handle_tasks(current_user):
    if request.method == 'GET':
        project_id = request.args.get('project_id')
        db = get_db()
        
        if project_id:
            tasks = db.execute('''
                SELECT t.*, u.username as assigned_username 
                FROM tasks t 
                LEFT JOIN users u ON t.assigned_user_id = u.user_id
                WHERE t.project_id = ?
            ''', (project_id,)).fetchall()
        else:
            tasks = db.execute('''
                SELECT t.*, u.username as assigned_username 
                FROM tasks t 
                LEFT JOIN users u ON t.assigned_user_id = u.user_id
                WHERE t.project_id IN (
                    SELECT project_id FROM team_members WHERE user_id = ?
                )
            ''', (current_user['user_id'],)).fetchall()
        
        db.close()
        return jsonify([dict(task) for task in tasks])
    
    elif request.method == 'POST':
        data = request.get_json()
        project_id = data.get('project_id')
        task_name = data.get('task_name')
        description = data.get('description')
        assigned_user_id = data.get('assigned_user_id')
        due_date = data.get('due_date')

        if not all([project_id, task_name]):
            return jsonify({'message': 'Project ID and task name are required'}), 400

        db = get_db()
        cursor = db.execute('''
            INSERT INTO tasks (project_id, task_name, description, assigned_user_id, due_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (project_id, task_name, description, assigned_user_id, due_date))
        task_id = cursor.lastrowid
        db.commit()
        db.close()

        return jsonify({'message': 'Task created successfully', 'task_id': task_id}), 201

# Team member routes
@app.route('/api/team-members', methods=['POST'])
@token_required
def add_team_member(current_user):
    data = request.get_json()
    project_id = data.get('project_id')
    user_id = data.get('user_id')
    role = data.get('role')

    if not all([project_id, user_id]):
        return jsonify({'message': 'Project ID and user ID are required'}), 400

    db = get_db()
    try:
        db.execute('''
            INSERT INTO team_members (project_id, user_id, role)
            VALUES (?, ?, ?)
        ''', (project_id, user_id, role))
        db.commit()
        return jsonify({'message': 'Team member added successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'User is already a member of this project'}), 400
    finally:
        db.close()

if __name__ == '__main__':
    app.logger.error("Flask application starting up...")
    app.run(debug=True) 