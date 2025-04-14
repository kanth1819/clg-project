document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    loadDashboardStats();
    loadRecentActivity();
    setupEventListeners();
});

function loadDashboardStats() {
    // Load projects
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    document.getElementById('totalProjects').textContent = projects.length;

    // Load team members
    const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
    document.getElementById('totalMembers').textContent = teamMembers.length;

    // Load tasks
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const pendingTasks = tasks.filter(task => task.status !== 'completed').length;
    document.getElementById('pendingTasks').textContent = pendingTasks;
}

function loadRecentActivity() {
    const activityLog = document.getElementById('activityLog');
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    
    // Sort activities by timestamp in descending order
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Take only the last 10 activities
    const recentActivities = activities.slice(0, 10);
    
    activityLog.innerHTML = recentActivities.map(activity => `
        <tr>
            <td>${formatDateTime(activity.timestamp)}</td>
            <td>${activity.user}</td>
            <td>${activity.action}</td>
            <td>${activity.details}</td>
        </tr>
    `).join('');
    
    if (recentActivities.length === 0) {
        activityLog.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No recent activity</td>
            </tr>
        `;
    }
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Create Project button
    document.getElementById('createProjectBtn').addEventListener('click', () => {
        window.location.href = 'projects.html';
    });

    // Add Team Member button
    document.getElementById('addTeamMemberBtn').addEventListener('click', () => {
        window.location.href = 'team.html';
    });
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function logActivity(action, details) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    
    activities.unshift({
        timestamp: new Date().toISOString(),
        user: currentUser.name,
        action: action,
        details: details
    });
    
    // Keep only last 100 activities
    if (activities.length > 100) {
        activities.pop();
    }
    
    localStorage.setItem('activities', JSON.stringify(activities));
    loadRecentActivity();
}

// Helper function to show notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1050';
    container.appendChild(toast);
    
    document.body.appendChild(container);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(container);
    });
} 