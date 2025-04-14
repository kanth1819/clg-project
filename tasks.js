document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables
    let allTasks = [];
    const tasksList = document.getElementById('tasksList');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const projectFilter = document.getElementById('projectFilter');
    const sortBy = document.getElementById('sortBy');

    // Load and display tasks
    function loadTasks() {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        allTasks = [];
        
        // Extract all tasks from projects
        projects.forEach(project => {
            if (project.tasks && project.tasks.length > 0) {
                project.tasks.forEach(task => {
                    allTasks.push({
                        ...task,
                        projectId: project.id,
                        projectName: project.name
                    });
                });
            }
        });

        // Populate project filter
        populateProjectFilter(projects);
        
        // Apply filters and display tasks
        filterAndDisplayTasks();
    }

    // Populate project filter dropdown
    function populateProjectFilter(projects) {
        const projectFilter = document.getElementById('projectFilter');
        projectFilter.innerHTML = '<option value="all">All Projects</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }

    // Filter and display tasks
    function filterAndDisplayTasks() {
        const status = statusFilter.value;
        const priority = priorityFilter.value;
        const projectId = projectFilter.value;
        const sort = sortBy.value;

        // Apply filters
        let filteredTasks = allTasks.filter(task => {
            const statusMatch = status === 'all' || task.status.toLowerCase() === status;
            const priorityMatch = priority === 'all' || task.priority.toLowerCase() === priority;
            const projectMatch = projectId === 'all' || task.projectId.toString() === projectId;
            return statusMatch && priorityMatch && projectMatch;
        });

        // Apply sorting
        filteredTasks.sort((a, b) => {
            switch(sort) {
                case 'dueDate':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority.toLowerCase()] - priorityOrder[b.priority.toLowerCase()];
                case 'project':
                    return a.projectName.localeCompare(b.projectName);
                default:
                    return 0;
            }
        });

        // Display tasks
        displayTasks(filteredTasks);
    }

    // Display tasks in the UI
    function displayTasks(tasks) {
        tasksList.innerHTML = '';
        
        if (tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-tasks fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No tasks found</h4>
                    <p class="text-muted">Try adjusting your filters</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'col-md-6 col-lg-4';
            taskCard.innerHTML = `
                <div class="card task-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${task.name}</h5>
                            <span class="task-priority bg-${getPriorityColor(task.priority)}">${task.priority}</span>
                        </div>
                        <p class="card-text text-muted mb-3">${task.description || 'No description available'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="task-status bg-${getStatusColor(task.status)}">${task.status}</span>
                                <span class="task-project ms-2">${task.projectName}</span>
                            </div>
                            <div class="task-due-date">
                                <i class="far fa-calendar-alt me-1"></i>
                                ${formatDate(task.dueDate)}
                            </div>
                        </div>
                        <div class="mt-3">
                            <a href="task-details.html?taskId=${task.id}&projectId=${task.projectId}" 
                               class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-eye me-1"></i>View Details
                            </a>
                        </div>
                    </div>
                </div>
            `;
            tasksList.appendChild(taskCard);
        });
    }

    // Helper functions
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
            case 'backlog': return 'secondary';
            default: return 'secondary';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Event listeners
    statusFilter.addEventListener('change', filterAndDisplayTasks);
    priorityFilter.addEventListener('change', filterAndDisplayTasks);
    projectFilter.addEventListener('change', filterAndDisplayTasks);
    sortBy.addEventListener('change', filterAndDisplayTasks);

    // Initial load
    loadTasks();

    // Refresh tasks periodically
    setInterval(loadTasks, 30000); // Refresh every 30 seconds
}); 