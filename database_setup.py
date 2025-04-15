import sqlite3

def setup_database(db_name="project_management.db"):
    """Creates the SQLite database and necessary tables."""
    print(f"Creating database: {db_name}")
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        role TEXT CHECK(role IN ('admin', 'team_member')) DEFAULT 'team_member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    print("Created 'users' table.")

    # Create projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        project_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        owner_user_id INTEGER,
        FOREIGN KEY (owner_user_id) REFERENCES users (user_id)
            ON DELETE SET NULL -- Set owner to NULL if user is deleted
    );
    """)
    print("Created 'projects' table.")

    # Create tasks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        task_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
        assigned_user_id INTEGER,
        due_date DATE,
        FOREIGN KEY (project_id) REFERENCES projects (project_id)
            ON DELETE CASCADE, -- Delete tasks if project is deleted
        FOREIGN KEY (assigned_user_id) REFERENCES users (user_id)
            ON DELETE SET NULL -- Set assigned user to NULL if user is deleted
    );
    """)
    print("Created 'tasks' table.")

    # Create team_members table (Junction table for many-to-many relationship between users and projects)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_members (
        team_member_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (project_id)
            ON DELETE CASCADE, -- Remove member if project is deleted
        FOREIGN KEY (user_id) REFERENCES users (user_id)
            ON DELETE CASCADE, -- Remove member if user is deleted
        UNIQUE (project_id, user_id) -- Ensure a user is only added once per project
    );
    """)
    print("Created 'team_members' table.")

    # Commit the changes and close the connection
    conn.commit()
    conn.close()
    print(f"Database '{db_name}' setup complete.")

if __name__ == "__main__":
    setup_database() 