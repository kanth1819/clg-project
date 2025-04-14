let currentProjectId = null;
let editProjectModal = null;
let deleteConfirmModal = null;

// API endpoints
const API_ENDPOINTS = {
    projects: 'api/projects.php',
    team: 'api/team.php'
};

let currentProject = null;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get project ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (!projectId) {
            showError('Project ID is missing');
            return;
        }

        // Get projects from localStorage
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const project = projects.find(p => p.id === parseInt(projectId));

        if (!project) {
            showError('Project not found');
            return;
        }

        // Store current project
        currentProject = project;

        // Update project details
        document.getElementById('projectName').textContent = project.name;
        document.getElementById('projectDescription').textContent = project.description || 'No description available';
        document.getElementById('projectDueDate').textContent = formatDate(project.dueDate);
        document.getElementById('projectPriority').textContent = project.priority;
        document.getElementById('projectStatus').textContent = project.status;

        // Update both progress bars
        updateProgressUI(project.progress || 0);

        // Load tasks for this project
        loadProjectTasks(project.id);

        // Set up event listeners
        setupProgressListeners();
        setupEventListeners();
        setupTaskEventListeners();
        setupTeamManagement();

    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load project details: ' + error.message);
    }
});

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const projectContainer = document.getElementById('projectContainer');
    
    if (errorContainer && errorMessage && projectContainer) {
        errorContainer.classList.remove('d-none');
        errorMessage.textContent = message;
        projectContainer.style.display = 'none';
    }
}

function populateProjectDetails(project) {
    // Update basic project information
    updateElement('projectName', project.name);
    updateElement('projectDescription', project.description || 'No description available');
    updateElement('projectDueDate', formatDate(project.dueDate));
    updateElement('projectPriority', project.priority);
    updateElement('projectStatus', project.status);
    
    // Update progress section
    const progress = project.progress || 0;
    updateProgressUI(progress);
}

function updateProgressUI(progress) {
    // Update all progress bars
    document.querySelectorAll('.progress-bar').forEach(bar => {
        bar.style.width = `${progress}%`;
        bar.setAttribute('aria-valuenow', progress);
    });

    // Update all percentage displays
    document.querySelectorAll('#progressPercentage').forEach(element => {
        element.textContent = `${progress}%`;
    });

    // Update slider value
    const sliderValue = document.getElementById('sliderValue');
    if (sliderValue) {
        sliderValue.textContent = `${progress}%`;
    }

    // Update progress status
    const progressStatus = document.getElementById('progressStatus');
    if (progressStatus) {
        if (progress === 0) {
            progressStatus.textContent = 'Not Started';
            progressStatus.className = 'badge bg-secondary ms-2';
        } else if (progress === 100) {
            progressStatus.textContent = 'Completed';
            progressStatus.className = 'badge bg-success ms-2';
        } else {
            progressStatus.textContent = 'In Progress';
            progressStatus.className = 'badge bg-primary ms-2';
        }
    }
}

function setupProgressListeners() {
    const progressSlider = document.getElementById('progressSlider');
    const updateProgressBtn = document.getElementById('updateProgressBtn');

    if (progressSlider) {
        progressSlider.addEventListener('input', (e) => {
            const progress = parseInt(e.target.value);
            updateProgressUI(progress);
        });
    }

    if (updateProgressBtn) {
        updateProgressBtn.addEventListener('click', () => {
            const progress = parseInt(progressSlider.value);
            const projectId = getProjectIdFromUrl();
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            const projectIndex = projects.findIndex(p => p.id === projectId);

            if (projectIndex !== -1) {
                projects[projectIndex].progress = progress;
                localStorage.setItem('projects', JSON.stringify(projects));
                showToast('Success', 'Project progress updated successfully', 'success');
            } else {
                showToast('Error', 'Failed to update project progress', 'error');
            }
        });
    }
}

function loadProjectProgress(project) {
    const progress = project.progress || 0;
    const progressSlider = document.getElementById('progressSlider');
    
    if (progressSlider) {
        progressSlider.value = progress;
    }
    
    updateProgressUI(progress);
}

function setupEventListeners() {
    // Edit button
    const editBtn = document.getElementById('editProjectBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (currentProject) {
                populateEditForm(currentProject);
            }
        });
    }

    // Delete button
    const deleteBtn = document.getElementById('deleteProjectBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
            deleteModal.show();
        });
    }

    // Save changes button
    const saveBtn = document.getElementById('saveProjectBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProjectChanges);
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteProject);
    }
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('successToast');
    if (!toast) return;

    const toastHeader = toast.querySelector('.toast-header');
    const toastBody = toast.querySelector('.toast-body');
    
    if (toastHeader && toastBody) {
        toastHeader.className = `toast-header bg-${type} text-white`;
        toastBody.textContent = message;
        
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
    }
}

function initializeModals() {
    editProjectModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    
    // Set up progress range display
    const progressRange = document.getElementById('editProjectProgress');
    const progressValue = document.getElementById('progressValue');
    progressRange.addEventListener('input', function() {
        progressValue.textContent = this.value;
    });
    
    // Set up save button
    document.getElementById('saveProjectBtn').addEventListener('click', saveProjectChanges);
    
    // Set up delete confirmation button
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteProject);
}

function setupEditButton() {
    const editBtn = document.querySelector('.btn-edit-project');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            // Populate the edit form with current project data
            document.getElementById('editProjectName').value = document.getElementById('projectName').textContent;
            document.getElementById('editProjectDescription').value = document.getElementById('projectDescription').textContent;
            document.getElementById('editProjectDueDate').value = document.getElementById('projectDueDate').textContent;
            document.getElementById('editProjectPriority').value = document.getElementById('projectPriority').textContent;
            document.getElementById('editProjectStatus').value = document.getElementById('projectStatus').textContent;
            document.getElementById('editProjectProgress').value = document.getElementById('projectProgress').textContent.replace('%', '');
            document.getElementById('progressValue').textContent = document.getElementById('projectProgress').textContent.replace('%', '');
            
            // Show the modal
            editProjectModal.show();
        });
    }
}

async function saveProjectChanges() {
    try {
        const projectData = {
            name: document.getElementById('editProjectName').value,
            description: document.getElementById('editProjectDescription').value,
            dueDate: document.getElementById('editProjectDueDate').value,
            priority: document.getElementById('editProjectPriority').value,
            status: document.getElementById('editProjectStatus').value,
            progress: parseInt(document.getElementById('editProjectProgress').value)
        };
        
        const response = await fetch(`/api/projects/${currentProjectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update project');
        }
        
        // Close the modal
        editProjectModal.hide();
        
        // Reload the project details
        await loadProjectDetails();
        
        // Show success message
        showSuccess('Project updated successfully');
    } catch (error) {
        showError('Failed to update project: ' + error.message);
    }
}

function setupDeleteButton() {
    const deleteBtn = document.querySelector('.btn-delete-project');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteConfirmModal.show();
        });
    }
}

async function deleteProject() {
    try {
        const response = await fetch(`/api/projects/${currentProjectId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete project');
        }
        
        // Close the modal
        deleteConfirmModal.hide();
        
        // Redirect to projects page
        window.location.href = '/projects.html';
    } catch (error) {
        showError('Failed to delete project: ' + error.message);
    }
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

async function loadProjectDetails() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        currentProjectId = urlParams.get('id');
        
        if (!currentProjectId) {
            showError('Project ID is required');
            return;
        }
        
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const project = projects.find(p => p.id === parseInt(currentProjectId));

        if (!project) {
            showError("Project not found. Please check the project ID.");
            return;
        }

        // Populate project details
        populateProjectDetails(project);
        await loadTeamMembers(currentProjectId);

        // Setup invite form handler
        setupInviteForm(currentProjectId);
        
        // Setup progress slider
        setupProgressListeners();
    } catch (error) {
        showError('Failed to load project details: ' + error.message);
    }
}

async function loadTeamMembers(projectId) {
    try {
        const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
        const projectMembers = teamMembers.filter(member => 
            member.projects && member.projects.includes(parseInt(projectId))
        );

        const teamMembersContainer = document.getElementById('teamMembers');
        if (!teamMembersContainer) return;

        // Update team stats
        updateTeamStats(projectMembers);

        if (projectMembers.length === 0) {
            teamMembersContainer.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="fas fa-users fa-3x mb-3"></i>
                    <h5>No team members yet</h5>
                    <p>Add team members to collaborate</p>
                </div>`;
            return;
        }

        // Render team members
        teamMembersContainer.innerHTML = projectMembers.map(member => `
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="d-flex align-items-center">
                                <div class="member-avatar me-3 bg-${member.role === 'admin' ? 'primary' : 'secondary'}">
                                    ${member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h5 class="card-title mb-1">${member.name}</h5>
                                    <p class="card-text text-muted mb-1">${member.email}</p>
                                    <span class="badge bg-${member.role === 'admin' ? 'primary' : 'info'}">${member.role}</span>
                                </div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-link text-muted" type="button" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item text-danger" onclick="removeMember(${member.id})">
                                        <i class="fas fa-user-minus me-2"></i>Remove
                                    </button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading team members:', error);
        showNotification('Failed to load team members.', 'error');
    }
}

function updateTeamStats(members) {
    const stats = {
        total: members.length,
        active: members.filter(m => m.isActive).length,
        admins: members.filter(m => m.role === 'admin').length
    };

    document.getElementById('totalMembers').textContent = stats.total;
    document.getElementById('activeMembers').textContent = stats.active;
    document.getElementById('teamAdmins').textContent = stats.admins;
}

function removeMember(memberId) {
    if (!confirm('Are you sure you want to remove this team member?')) {
        return;
    }

    try {
        const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
        const updatedMembers = teamMembers.filter(member => member.id !== memberId);
        localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));

        loadTeamMembers(currentProject.id);
        showNotification('Team member removed successfully.', 'success');
    } catch (error) {
        console.error('Error removing team member:', error);
        showNotification('Failed to remove team member.', 'error');
    }
}

function setupInviteForm(projectId) {
    const inviteForm = document.getElementById('inviteForm');
    const sendInviteBtn = document.getElementById('sendInviteBtn');
    
    if (!inviteForm || !sendInviteBtn) return;
    
    sendInviteBtn.addEventListener('click', async () => {
        const email = document.getElementById('inviteEmail').value;
        const role = document.getElementById('inviteRole').value;
        
        if (!email) {
            showToast('error', 'Please enter an email address');
            return;
        }
        
        try {
            // Get existing team members
            const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
            
            // Check if member already exists
            let existingMember = teamMembers.find(member => member.email === email);
            
            if (existingMember) {
                // Update existing member's projects
                if (!existingMember.projects) {
                    existingMember.projects = [];
                }
                
                if (!existingMember.projects.includes(parseInt(projectId))) {
                    existingMember.projects.push(parseInt(projectId));
                }
                
                // Update role if needed
                if (role === 'admin' && existingMember.role !== 'admin') {
                    existingMember.role = 'admin';
                }
                
                // Update in localStorage
                const memberIndex = teamMembers.findIndex(m => m.id === existingMember.id);
                teamMembers[memberIndex] = existingMember;
                localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
                
                showToast('success', 'Member added to project successfully');
            } else {
                // Create new member
                const newMember = {
                    id: Date.now(),
                    name: email.split('@')[0], // Simple name from email
                    email,
                    role,
                    projects: [parseInt(projectId)],
                    isActive: true,
                    dateAdded: new Date().toISOString()
                };
                
                // Add to team members
                teamMembers.push(newMember);
                localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
                
                showToast('success', 'New member added to project successfully');
            }
            
            // Close modal and reset form
            const inviteModal = bootstrap.Modal.getInstance(document.getElementById('inviteModal'));
            inviteModal.hide();
            inviteForm.reset();
            
            // Reload team members
            await loadTeamMembers(projectId);
        } catch (error) {
            console.error('Error inviting member:', error);
            showToast('error', 'Failed to invite member');
        }
    });
}

function showToast(type, message) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
}

function populateEditForm(project) {
    // Populate the edit form with current project data
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDescription').value = project.description;
    document.getElementById('editProjectDueDate').value = project.dueDate;
    document.getElementById('editProjectPriority').value = project.priority;
    document.getElementById('editProjectStatus').value = project.status;
    document.getElementById('editProjectProgress').value = project.progress;
    document.getElementById('editProjectActive').value = project.active === false ? 'false' : 'true';
    
    // Show the edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    editModal.show();
}

function setupTaskEventListeners() {
    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            showAddTaskModal();
        });
    }

    // Task list container delegation
    const taskList = document.getElementById('tasksList');
    if (taskList) {
        taskList.addEventListener('click', (event) => {
            const deleteBtn = event.target.closest('.delete-task-btn');
            const editBtn = event.target.closest('.edit-task-btn');
            
            if (deleteBtn) {
                event.stopPropagation(); // Prevent event bubbling
                const taskId = deleteBtn.getAttribute('data-task-id');
                deleteTask(taskId);
            } else if (editBtn) {
                event.stopPropagation(); // Prevent event bubbling
                const taskId = editBtn.getAttribute('data-task-id');
                editTask(taskId);
            }
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.task-filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                filterTasks(filter);
            });
        });
    }
}

function loadProjectTasks(projectId) {
    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const project = projects.find(p => p.id === parseInt(projectId));

        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        if (!project || !project.tasks || project.tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-tasks fa-3x mb-3"></i>
                    <h5>No tasks found</h5>
                    <p>Add a task to get started</p>
                </div>`;
            return;
        }

        // Group tasks by status
        const tasksByStatus = {
            'backlog': [],
            'in-progress': [],
            'completed': []
        };

        project.tasks.forEach(task => {
            const status = task.status.toLowerCase().replace(' ', '-');
            if (tasksByStatus.hasOwnProperty(status)) {
                tasksByStatus[status].push(task);
            } else {
                tasksByStatus['backlog'].push(task); // Default to backlog if status is unknown
            }
        });

        // Sort tasks in each group by due date
        Object.keys(tasksByStatus).forEach(status => {
            tasksByStatus[status].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        });

        // Clear existing content
        tasksList.innerHTML = '';

        // Add clear all button at the top
        const clearAllButton = document.createElement('div');
        clearAllButton.className = 'mb-3';
        clearAllButton.innerHTML = `
            <button class="btn btn-danger" onclick="clearAllTasks()">
                <i class="fas fa-trash me-2"></i>Clear All Tasks
            </button>
        `;
        tasksList.appendChild(clearAllButton);

        // Create task sections
        const sections = [
            { id: 'backlog', title: 'Backlog', icon: 'fa-clock', color: 'secondary' },
            { id: 'in-progress', title: 'In Progress', icon: 'fa-spinner fa-spin', color: 'primary' },
            { id: 'completed', title: 'Completed', icon: 'fa-check', color: 'success' }
        ];

        sections.forEach(section => {
            const tasks = tasksByStatus[section.id];
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'task-section mb-4';
            sectionDiv.innerHTML = `
                <div class="d-flex align-items-center mb-3">
                    <h5 class="mb-0">
                        <i class="fas ${section.icon} text-${section.color} me-2"></i>
                        ${section.title}
                        <span class="badge bg-${section.color} ms-2">${tasks.length}</span>
                    </h5>
                </div>
                <div class="task-list" id="${section.id}-tasks">
                    ${tasks.map(task => `
                        <div class="list-group-item task-item" data-task-id="${task.id}" data-status="${task.status}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <div class="me-3">
                                        <input type="checkbox" class="form-check-input task-checkbox" 
                                            ${task.status === 'completed' ? 'checked' : ''}>
                                    </div>
                                    <div>
                                        <h6 class="mb-1 ${task.status === 'completed' ? 'text-decoration-line-through text-muted' : ''}">${task.name}</h6>
                                        <p class="mb-1 small text-muted">${task.description || 'No description'}</p>
                                        <div class="task-meta">
                                            <span class="badge bg-${getPriorityColor(task.priority)} me-2">${task.priority}</span>
                                            <small class="text-muted ms-2">Due: ${formatDate(task.dueDate)}</small>
                                            ${isTaskOverdue(task) ? '<span class="badge bg-danger ms-2">Overdue</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="task-actions">
                                    <button class="btn btn-sm btn-outline-danger delete-task-btn" data-task-id="${task.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') || `
                        <div class="text-center py-3 text-muted">
                            <p class="mb-0">No tasks in ${section.title.toLowerCase()}</p>
                        </div>
                    `}
                </div>
            `;
            tasksList.appendChild(sectionDiv);
        });

        // Add event listeners for task checkboxes
        setupTaskCheckboxes();
        
        // Update project progress
        updateProjectProgress();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Failed to load tasks.', 'error');
    }
}

function isTaskOverdue(task) {
    if (task.status === 'completed') return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function filterTasks(filter) {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        const status = item.getAttribute('data-status');
        if (filter === 'all' || status === filter) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function editTask(taskId) {
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const task = tasks.find(t => t.id === taskId);

        if (!task) {
            showToast('Error', 'Task not found', 'error');
            return;
        }

        // Populate edit form
        document.getElementById('editTaskName').value = task.name;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskDueDate').value = task.dueDate;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskStatus').value = task.status;

        // Store task ID for saving
        document.getElementById('editTaskForm').setAttribute('data-task-id', taskId);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing task:', error);
        showToast('Error', 'Failed to edit task', 'error');
    }
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const projectIndex = projects.findIndex(p => p.id === currentProject.id);

        if (projectIndex === -1) {
            showNotification('Project not found.', 'error');
            return;
        }

        // Ensure tasks array exists
        if (!projects[projectIndex].tasks) {
            projects[projectIndex].tasks = [];
        }

        const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === parseInt(taskId));
        
        if (taskIndex === -1) {
            showNotification('Task not found.', 'error');
            return;
        }

        // Remove the task
        projects[projectIndex].tasks.splice(taskIndex, 1);
        
        // Update localStorage
        localStorage.setItem('projects', JSON.stringify(projects));
        
        // Update UI
        loadProjectTasks(currentProject.id);
        
        // Update project progress
        const completedTasks = projects[projectIndex].tasks.filter(t => t.status === 'completed').length;
        const totalTasks = projects[projectIndex].tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        updateProgressUI(progress);
        
        showNotification('Task deleted successfully.', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task.', 'error');
    }
}

function showAddTaskModal() {
    // Reset form
    document.getElementById('addTaskForm').reset();
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];
    
    // Show modal
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    addTaskModal.show();
}

function saveNewTask() {
    try {
        const taskName = document.getElementById('taskName').value;
        const taskDescription = document.getElementById('taskDescription').value;
        const taskDueDate = document.getElementById('taskDueDate').value;
        const taskPriority = document.getElementById('taskPriority').value;
        const taskStatus = document.getElementById('taskStatus').value;

        if (!taskName || !taskDueDate) {
            showToast('Error', 'Please fill in all required fields', 'error');
            return;
        }

        // Get projects from localStorage
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const projectIndex = projects.findIndex(p => p.id === currentProject.id);

        if (projectIndex === -1) {
            showToast('Error', 'Project not found', 'error');
            return;
        }

        // Initialize tasks array if it doesn't exist
        if (!projects[projectIndex].tasks) {
            projects[projectIndex].tasks = [];
        }

        const newTask = {
            id: Date.now(),
            name: taskName,
            description: taskDescription,
            dueDate: taskDueDate,
            priority: taskPriority,
            status: taskStatus,
            createdAt: new Date().toISOString()
        };

        // Add task to project
        projects[projectIndex].tasks.push(newTask);
        localStorage.setItem('projects', JSON.stringify(projects));

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();
        document.getElementById('addTaskForm').reset();

        // Reload tasks and show success message
        loadProjectTasks(currentProject.id);
        showToast('Success', 'Task added successfully', 'success');
        updateProjectProgress();
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Error', 'Failed to save task', 'error');
    }
}

function saveTaskChanges() {
    try {
        const taskId = parseInt(document.getElementById('editTaskForm').getAttribute('data-task-id'));
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) {
            showToast('Error', 'Task not found', 'error');
            return;
        }

        tasks[taskIndex] = {
            ...tasks[taskIndex],
            name: document.getElementById('editTaskName').value,
            description: document.getElementById('editTaskDescription').value,
            dueDate: document.getElementById('editTaskDueDate').value,
            priority: document.getElementById('editTaskPriority').value,
            status: document.getElementById('editTaskStatus').value,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        modal.hide();

        // Reload tasks and show success message
        loadProjectTasks(currentProject.id);
        showToast('Success', 'Task updated successfully', 'success');
        updateProjectProgress();
    } catch (error) {
        console.error('Error saving task changes:', error);
        showToast('Error', 'Failed to save task changes', 'error');
    }
}

function updateTaskStatus(taskId, newStatus) {
    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const projectIndex = projects.findIndex(p => p.id === currentProject.id);

        if (projectIndex !== -1) {
            const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                projects[projectIndex].tasks[taskIndex].status = newStatus;
                localStorage.setItem('projects', JSON.stringify(projects));
                loadProjectTasks(currentProject.id);
                updateProjectProgress();
            }
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        showToast('Error', 'Failed to update task status', 'error');
    }
}

function updateProjectProgress() {
    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const project = projects.find(p => p.id === currentProject.id);
        
        if (!project || !project.tasks || project.tasks.length === 0) {
            updateProgressUI(0);
            return;
        }

        const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
        const progress = Math.round((completedTasks / project.tasks.length) * 100);

        // Update project progress
        const projectIndex = projects.findIndex(p => p.id === currentProject.id);
        if (projectIndex !== -1) {
            projects[projectIndex].progress = progress;
            localStorage.setItem('projects', JSON.stringify(projects));
            updateProgressUI(progress);
        }
    } catch (error) {
        console.error('Error updating project progress:', error);
        showToast('Error', 'Failed to update project progress', 'error');
    }
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
        case 'backlog': return 'secondary';
        default: return 'secondary';
    }
}

function clearAllTasks() {
    if (!confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
        return;
    }

    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const projectIndex = projects.findIndex(p => p.id === currentProject.id);

        if (projectIndex === -1) {
            showNotification('Project not found.', 'error');
            return;
        }

        // Clear all tasks
        projects[projectIndex].tasks = [];
        
        // Update localStorage
        localStorage.setItem('projects', JSON.stringify(projects));
        
        // Update UI
        loadProjectTasks(currentProject.id);
        
        // Reset progress to 0
        updateProgressUI(0);
        
        showNotification('All tasks cleared successfully.', 'success');
    } catch (error) {
        console.error('Error clearing tasks:', error);
        showNotification('Failed to clear tasks.', 'error');
    }
}

function setupTeamManagement() {
    const addMemberBtn = document.getElementById('addMemberBtn');
    const inviteForm = document.getElementById('inviteForm');

    if (addMemberBtn && inviteForm) {
        addMemberBtn.addEventListener('click', () => {
            const name = document.getElementById('memberName').value.trim();
            const email = document.getElementById('memberEmail').value.trim();
            const role = document.getElementById('memberRole').value;

            if (!name || !email) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            try {
                // Get existing team members
                const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
                
                // Check if member already exists
                const existingMember = teamMembers.find(member => member.email === email);
                if (existingMember) {
                    showNotification('Team member with this email already exists.', 'error');
                    return;
                }

                // Create new team member
                const newMember = {
                    id: Date.now(),
                    name: name,
                    email: email,
                    role: role,
                    projects: [currentProject.id],
                    isActive: true,
                    dateAdded: new Date().toISOString()
                };

                // Add to team members
                teamMembers.push(newMember);
                localStorage.setItem('teamMembers', JSON.stringify(teamMembers));

                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('inviteModal'));
                modal.hide();
                inviteForm.reset();

                // Reload team members display
                loadTeamMembers(currentProject.id);
                showNotification('Team member added successfully.', 'success');
            } catch (error) {
                console.error('Error adding team member:', error);
                showNotification('Failed to add team member.', 'error');
            }
        });
    }
}



