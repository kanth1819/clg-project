import os
import shutil
from datetime import datetime
import sqlite3

def create_backup():
    # Source database file
    source_db = "project_management.db"
    
    # Create backups directory if it doesn't exist
    backup_dir = "database_backups"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"Created backup directory: {backup_dir}")
    
    # Generate timestamp for backup file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"project_management_backup_{timestamp}.db")
    
    try:
        # Verify source database exists
        if not os.path.exists(source_db):
            print(f"Error: Source database '{source_db}' not found!")
            return False
        
        # Create backup
        shutil.copy2(source_db, backup_file)
        
        # Verify backup
        if os.path.exists(backup_file):
            # Test if backup is a valid SQLite database
            try:
                conn = sqlite3.connect(backup_file)
                conn.close()
                print(f"Backup created successfully: {backup_file}")
                return True
            except sqlite3.Error as e:
                print(f"Error: Backup file is not a valid SQLite database: {e}")
                os.remove(backup_file)
                return False
        else:
            print("Error: Backup file was not created!")
            return False
            
    except Exception as e:
        print(f"Error during backup: {e}")
        return False

if __name__ == "__main__":
    create_backup() 