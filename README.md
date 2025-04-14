# FlowTrack - Project Management System

FlowTrack is a web-based project management system that helps teams organize projects, track tasks, and manage team members.

## Database Connection

This project uses MySQL as its database. Follow these steps to connect your project to MySQL:

### Prerequisites

1. **MySQL Server** - Make sure MySQL is installed and running on your system
2. **PHP** - PHP 7.4 or higher is required
3. **Web Server** - Apache, Nginx, or any other web server that supports PHP

### Configuration

The database configuration is stored in `config/database.php`. The default settings are:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'flowtrack');
```

If your MySQL setup is different, update these values accordingly.

### Database Initialization

The database and tables will be automatically created when you first access the application. However, you can manually initialize the database by running:

```
test_db_connection.php
```

This script will:
1. Create the database if it doesn't exist
2. Create all required tables
3. Insert sample data if tables are empty

### Migrating Data from localStorage

If you have existing data in localStorage that you want to migrate to MySQL:

1. Open `export_localStorage.html` in your browser
2. Click the "Export Data" button to export your localStorage data to JSON files
3. Download the JSON files and place them in the `data` directory
4. Run `migrate_data.php` to import the data into MySQL

## Project Structure

- `api/` - API endpoints for CRUD operations
- `config/` - Configuration files
- `data/` - Data files for migration
- `img/` - Images and icons
- `*.html` - HTML pages
- `*.js` - JavaScript files

## API Endpoints

- `api/team.php` - Team member operations
- `api/projects.php` - Project operations

## Troubleshooting

If you encounter issues connecting to the database:

1. Check that MySQL is running
2. Verify your database credentials in `config/database.php`
3. Make sure PHP has the PDO and PDO_MySQL extensions enabled
4. Check the PHP error log for detailed error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details. 