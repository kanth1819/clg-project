document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is a worker
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role === 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    loadDashboardStats();
    loadTasks();
    setupEventListeners();
});

function loadDashboardStats() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const userTasks = tasks.filter(task => task.assignedTo === currentUser.id);

    // Update task counts
    document.getElementById('myTasks').textContent = userTasks.filter(task => task.status !== 'completed').length;
    document.getElementById('completedTasks').textContent = userTasks.filter(task => task.status === 'completed').length;

    // Count active projects
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const userProjects = projects.filter(project => 
        project.teamMembers && project.teamMembers.includes(currentUser.id)
    );
    document.getElementById('activeProjects').textContent = userProjects.length;
}

function loadTasks() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const userTasks = tasks.filter(task => task.assignedTo === currentUser.id);
    const tasksList = document.getElementById('tasksList');

    if (userTasks.length === 0) {
        tasksList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No tasks assigned</td>
            </tr>
        `;
        return;
    }

    tasksList.innerHTML = userTasks.map(task => `
        <tr>
            <td>${task.name}</td>
            <td>${getProjectName(task.projectId)}</td>
            <td>${formatDate(task.dueDate)}</td>
            <td><span class="badge bg-${getPriorityColor(task.priority)}">${task.priority}</span></td>
            <td><span class="badge bg-${getStatusColor(task.status)}">${task.status}</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="markTaskComplete(${task.id})">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Task filter dropdown
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            filterTasks(e.target.dataset.filter);
        });
    });
}

// Helper functions
function getProjectName(projectId) {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function getPriorityColor(priority) {
    switch(priority.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
}

function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'completed': return 'success';
        case 'in progress': return 'primary';
        case 'blocked': return 'danger';
        default: return 'secondary';
    }
}

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

function filterTasks(filter) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let filteredTasks = tasks.filter(task => task.assignedTo === currentUser.id);

    switch(filter) {
        case 'today':
            const today = new Date().toDateString();
            filteredTasks = filteredTasks.filter(task => 
                new Date(task.dueDate).toDateString() === today
            );
            break;
        case 'week':
            const weekDates = getThisWeekDates();
            filteredTasks = filteredTasks.filter(task => {
                const dueDate = new Date(task.dueDate);
                return dueDate >= weekDates.start && dueDate <= weekDates.end;
            });
            break;
        case 'priority':
            filteredTasks = filteredTasks.filter(task => 
                task.priority.toLowerCase() === 'high'
            );
            break;
    }

    const tasksList = document.getElementById('tasksList');
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No tasks found</td>
            </tr>
        `;
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <tr>
            <td>${task.name}</td>
            <td>${getProjectName(task.projectId)}</td>
            <td>${formatDate(task.dueDate)}</td>
            <td><span class="badge bg-${getPriorityColor(task.priority)}">${task.priority}</span></td>
            <td><span class="badge bg-${getStatusColor(task.status)}">${task.status}</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="markTaskComplete(${task.id})">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getThisWeekDates() {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay()));
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    end.setHours(23, 59, 59, 999);
    return { start, end };
} 