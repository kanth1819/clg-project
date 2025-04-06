document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('taskId');
    const projectId = urlParams.get('projectId');

    if (!taskId || !projectId) {
        showError('Task or Project ID is missing');
        return;
    }

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const project = projects.find(p => p.id === parseInt(projectId));

    if (!project) {
        showError('Project not found');
        return;
    }

    const task = project.tasks.find(t => t.id === taskId);

    if (!task) {
        showError('Task not found');
        return;
    }

    // Populate task details with enhanced information
    document.getElementById('taskName').textContent = task.name;
    document.getElementById('taskDescription').textContent = task.description || 'No description available';
    document.getElementById('projectName').textContent = project.name;
    document.getElementById('projectDescription').textContent = project.description || 'No project description available';
    document.getElementById('taskPriority').textContent = task.priority;
    document.getElementById('taskPriority').className = `badge bg-${getPriorityColor(task.priority)}`;
    document.getElementById('taskDueDate').textContent = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    document.getElementById('taskStatus').textContent = task.status;
    document.getElementById('taskStatus').className = `badge bg-${getStatusColor(task.status)}`;
    
    // Add project link
    document.getElementById('projectLink').href = `project-details.html?id=${project.id}`;
    document.getElementById('projectLink').textContent = `View Project: ${project.name}`;
    
    // Update breadcrumb navigation
    document.getElementById('projectBreadcrumb').textContent = project.name;
    document.getElementById('projectBreadcrumb').href = `project-details.html?id=${project.id}`;
    document.getElementById('taskBreadcrumb').textContent = task.name;
    document.getElementById('projectLink').href = `project-details.html?id=${project.id}`;
});

function getPriorityColor(priority) {
    const colors = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'info'
    };
    return colors[priority.toLowerCase()] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'completed': 'success',
        'in progress': 'primary',
        'backlog': 'secondary'
    };
    return colors[status.toLowerCase()] || 'secondary';
}

function showError(message) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="alert alert-danger mt-4" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>${message}
            <div class="mt-3">
                <a href="dashboard.html" class="btn btn-outline-danger btn-sm">
                    <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
                </a>
            </div>
        </div>
    `;
}