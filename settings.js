// Function to show notification
function showNotification(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastBody = toast.querySelector('.toast-body');
    const toastHeader = toast.querySelector('.toast-header');
    
    // Set toast type
    if (type === 'error') {
        toastHeader.className = 'toast-header bg-danger text-white';
    } else if (type === 'warning') {
        toastHeader.className = 'toast-header bg-warning text-white';
    } else {
        toastHeader.className = 'toast-header bg-success text-white';
    }
    
    // Set message
    toastBody.textContent = message;
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
}

// Function to load settings from localStorage
function loadSettings() {
    try {
        // Load user profile settings
        const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        document.getElementById('userName').value = userProfile.name || '';
        document.getElementById('userEmail').value = userProfile.email || '';
        document.getElementById('userRole').value = userProfile.role || 'member';
        
        // Load application settings
        const appSettings = JSON.parse(localStorage.getItem('appSettings')) || {};
        document.getElementById('language').value = appSettings.language || 'en';
        document.getElementById('timezone').value = appSettings.timezone || 'UTC';
        document.getElementById('dateFormat').value = appSettings.dateFormat || 'MM/DD/YYYY';
        
        // Load theme settings
        const themeSettings = JSON.parse(localStorage.getItem('themeSettings')) || {};
        document.getElementById('primaryColor').value = themeSettings.primaryColor || '#5271ff';
        document.getElementById('fontSize').value = themeSettings.fontSize || 'medium';
        
        // Set theme mode
        const themeMode = themeSettings.themeMode || 'light';
        document.getElementById(themeMode + 'Mode').checked = true;
        
        // Load notification settings
        const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings')) || {};
        document.getElementById('emailNotifications').checked = notificationSettings.emailNotifications !== false;
        document.getElementById('browserNotifications').checked = notificationSettings.browserNotifications !== false;
        document.getElementById('notifyNewProjects').checked = notificationSettings.notifyNewProjects !== false;
        document.getElementById('notifyProjectUpdates').checked = notificationSettings.notifyProjectUpdates !== false;
        document.getElementById('notifyTaskAssignments').checked = notificationSettings.notifyTaskAssignments !== false;
        document.getElementById('notifyDueDates').checked = notificationSettings.notifyDueDates !== false;
        
        console.log('Settings loaded successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error loading settings', 'error');
    }
}

// Function to save user profile
function saveUserProfile(event) {
    event.preventDefault();
    
    try {
        const userProfile = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value
        };
        
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        showNotification('User profile saved successfully');
    } catch (error) {
        console.error('Error saving user profile:', error);
        showNotification('Error saving user profile', 'error');
    }
}

// Function to save application settings
function saveAppSettings(event) {
    event.preventDefault();
    
    try {
        const appSettings = {
            language: document.getElementById('language').value,
            timezone: document.getElementById('timezone').value,
            dateFormat: document.getElementById('dateFormat').value
        };
        
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
        showNotification('Application settings saved successfully');
    } catch (error) {
        console.error('Error saving application settings:', error);
        showNotification('Error saving application settings', 'error');
    }
}

// Function to save theme settings
function saveThemeSettings(event) {
    event.preventDefault();
    
    try {
        const themeMode = document.querySelector('input[name="themeMode"]:checked').value;
        const primaryColor = document.getElementById('primaryColor').value;
        const fontSize = document.getElementById('fontSize').value;
        
        const themeSettings = {
            themeMode,
            primaryColor,
            fontSize
        };
        
        localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
        
        // Apply theme changes
        applyTheme(themeSettings);
        
        showNotification('Theme settings saved successfully');
    } catch (error) {
        console.error('Error saving theme settings:', error);
        showNotification('Error saving theme settings', 'error');
    }
}

// Function to apply theme settings
function applyTheme(themeSettings) {
    // Apply theme mode
    if (themeSettings.themeMode === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Apply primary color
    document.documentElement.style.setProperty('--primary-color', themeSettings.primaryColor);
    
    // Apply font size
    document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    document.body.classList.add('font-size-' + themeSettings.fontSize);
}

// Function to save notification settings
function saveNotificationSettings(event) {
    event.preventDefault();
    
    try {
        const notificationSettings = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            browserNotifications: document.getElementById('browserNotifications').checked,
            notifyNewProjects: document.getElementById('notifyNewProjects').checked,
            notifyProjectUpdates: document.getElementById('notifyProjectUpdates').checked,
            notifyTaskAssignments: document.getElementById('notifyTaskAssignments').checked,
            notifyDueDates: document.getElementById('notifyDueDates').checked
        };
        
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        showNotification('Notification settings saved successfully');
    } catch (error) {
        console.error('Error saving notification settings:', error);
        showNotification('Error saving notification settings', 'error');
    }
}

// Function to export data
function exportData() {
    try {
        // Get all data from localStorage
        const data = {
            projects: JSON.parse(localStorage.getItem('projects')) || [],
            tasks: JSON.parse(localStorage.getItem('tasks')) || [],
            userProfile: JSON.parse(localStorage.getItem('userProfile')) || {},
            appSettings: JSON.parse(localStorage.getItem('appSettings')) || {},
            themeSettings: JSON.parse(localStorage.getItem('themeSettings')) || {},
            notificationSettings: JSON.parse(localStorage.getItem('notificationSettings')) || {}
        };
        
        // Convert to JSON string
        const jsonData = JSON.stringify(data, null, 2);
        
        // Create a blob and download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flowtrack_data_' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Data exported successfully');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

// Function to import data
function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file to import', 'warning');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }
            
            // Import data to localStorage
            if (data.projects) localStorage.setItem('projects', JSON.stringify(data.projects));
            if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks));
            if (data.userProfile) localStorage.setItem('userProfile', JSON.stringify(data.userProfile));
            if (data.appSettings) localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
            if (data.themeSettings) localStorage.setItem('themeSettings', JSON.stringify(data.themeSettings));
            if (data.notificationSettings) localStorage.setItem('notificationSettings', JSON.stringify(data.notificationSettings));
            
            // Reload settings
            loadSettings();
            
            // Reset file input
            fileInput.value = '';
            
            showNotification('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
            showNotification('Error importing data: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        showNotification('Error reading file', 'error');
    };
    
    reader.readAsText(file);
}

// Function to clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        try {
            // Clear all data from localStorage
            localStorage.removeItem('projects');
            localStorage.removeItem('tasks');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('appSettings');
            localStorage.removeItem('themeSettings');
            localStorage.removeItem('notificationSettings');
            
            // Reset forms
            document.getElementById('userProfileForm').reset();
            document.getElementById('appSettingsForm').reset();
            document.getElementById('themeForm').reset();
            document.getElementById('notificationForm').reset();
            
            showNotification('All data cleared successfully');
        } catch (error) {
            console.error('Error clearing data:', error);
            showNotification('Error clearing data', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    loadSettings();
    
    // Add event listeners for forms
    document.getElementById('userProfileForm').addEventListener('submit', saveUserProfile);
    document.getElementById('appSettingsForm').addEventListener('submit', saveAppSettings);
    document.getElementById('themeForm').addEventListener('submit', saveThemeSettings);
    document.getElementById('notificationForm').addEventListener('submit', saveNotificationSettings);
    
    // Add event listeners for buttons
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
}); 