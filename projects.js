// Global variables
let projects = [];
let addProjectModal = null;
let editProjectModal = null;
let deleteProjectModal = null;
let currentProjectId = null;

// API endpoints
const API_ENDPOINTS = {
    projects: 'api/projects.php',
    team: 'api/team.php'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    addProjectModal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    editProjectModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    deleteProjectModal = new bootstrap.Modal(document.getElementById('deleteProjectModal'));
    
    // Load data
    loadProjects();
    
    // Set up event listeners
    setupEventListeners();
});

// Load projects from API
async function loadProjects() {
    try {
        const response = await fetch(API_ENDPOINTS.projects);
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        const projects = await response.json();
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects', 'danger');
    }
}

// Render projects in the UI
function renderProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'col-md-4 mb-4';
        projectCard.innerHTML = `
            <div class="card project-card h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${project.name}</h5>
                        <div>
                            <span class="badge bg-${getPriorityColor(project.priority)}">${project.priority}</span>
                            <span class="badge bg-${project.active === false ? 'secondary' : 'success'} ms-1">${project.active === false ? 'Inactive' : 'Active'}</span>
                        </div>
                    </div>
                    <p class="card-text text-muted mb-3">${project.description || ''}</p>
                    <div class="progress mb-3" style="height: 8px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${project.progress || 0}%" 
                            aria-valuenow="${project.progress || 0}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Due: ${formatDate(project.due_date)}</small>
                            <div class="btn-group">
                                <a href="project-details.html?id=${project.id}" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-eye me-1"></i>View
                                </a>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteProject(${project.id})">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        projectsList.appendChild(projectCard);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search and filter
    document.getElementById('searchProject').addEventListener('input', renderProjects);
    document.getElementById('filterStatus').addEventListener('change', renderProjects);
    document.getElementById('filterPriority').addEventListener('change', renderProjects);
    
    // Add project
    document.getElementById('saveProjectBtn').addEventListener('click', saveNewProject);
    
    // Edit project
    document.getElementById('updateProjectBtn').addEventListener('click', updateProject);
    
    // Delete project
    document.getElementById('confirmDeleteProjectBtn').addEventListener('click', deleteProject);
}

// Open edit modal
function openEditModal(projectId) {
    currentProjectId = projectId;
    const project = projects.find(p => p.id === parseInt(projectId));
    
    if (!project) {
        showToast('error', 'Project not found');
        return;
    }
    
    // Populate form
    document.getElementById('editProjectId').value = project.id;
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDescription').value = project.description;
    document.getElementById('editProjectDueDate').value = formatDateForInput(project.due_date);
    document.getElementById('editProjectPriority').value = project.priority;
    document.getElementById('editProjectStatus').value = project.status;
    document.getElementById('editProjectProgress').value = project.progress;
    
    // Set selected team members
    const editProjectMembers = document.getElementById('editProjectMembers');
    if (project.member_ids) {
        const memberIds = project.member_ids.split(',').map(id => parseInt(id));
        Array.from(editProjectMembers.options).forEach(option => {
            option.selected = memberIds.includes(parseInt(option.value));
        });
    } else {
        Array.from(editProjectMembers.options).forEach(option => {
            option.selected = false;
        });
    }
    
    // Show modal
    editProjectModal.show();
}

// Open delete modal
function openDeleteModal(projectId) {
    currentProjectId = projectId;
    deleteProjectModal.show();
}

// Save new project
function saveNewProject() {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    const dueDate = document.getElementById('projectDueDate').value;
    const priority = document.getElementById('projectPriority').value;
    const status = document.getElementById('projectStatus').value;
    const progress = parseInt(document.getElementById('projectProgress').value);
    const membersSelect = document.getElementById('projectMembers');
    
    // Validate inputs
    if (!name || !description || !dueDate || !priority || !status) {
        showToast('error', 'Please fill in all required fields');
        return;
    }
    
    // Get selected team members
    const selectedMembers = Array.from(membersSelect.selectedOptions).map(option => parseInt(option.value));
    
    // Create new project object
    const newProject = {
        name,
        description,
        due_date: dueDate,
        priority,
        status,
        progress,
        active: true,
        member_ids: selectedMembers.join(',')
    };
    
    // Add project to database
    fetch(API_ENDPOINTS.projects, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload data
            loadProjects();
            
            // Close modal and reset form
            addProjectModal.hide();
            document.getElementById('addProjectForm').reset();
            
            // Show success message
            showToast('success', 'Project added successfully');
        } else {
            showToast('error', 'Failed to add project: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to add project. Please try again.');
    });
}

// Update project
function updateProject() {
    const projectId = parseInt(document.getElementById('editProjectId').value);
    const name = document.getElementById('editProjectName').value;
    const description = document.getElementById('editProjectDescription').value;
    const dueDate = document.getElementById('editProjectDueDate').value;
    const priority = document.getElementById('editProjectPriority').value;
    const status = document.getElementById('editProjectStatus').value;
    const progress = parseInt(document.getElementById('editProjectProgress').value);
    const membersSelect = document.getElementById('editProjectMembers');
    
    // Validate inputs
    if (!name || !description || !dueDate || !priority || !status) {
        showToast('error', 'Please fill in all required fields');
        return;
    }
    
    // Get selected team members
    const selectedMembers = Array.from(membersSelect.selectedOptions).map(option => parseInt(option.value));
    
    // Create updated project object
    const updatedProject = {
        id: projectId,
        name,
        description,
        due_date: dueDate,
        priority,
        status,
        progress,
        active: true,
        member_ids: selectedMembers.join(',')
    };
    
    // Update project in database
    fetch(API_ENDPOINTS.projects, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProject)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload data
            loadProjects();
            
            // Close modal
            editProjectModal.hide();
            
            // Show success message
            showToast('success', 'Project updated successfully');
        } else {
            showToast('error', 'Failed to update project: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to update project. Please try again.');
    });
}

// Delete project
async function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_ENDPOINTS.projects}?id=${projectId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete project');
            }
            
            showNotification('Project deleted successfully', 'success');
            loadProjects(); // Reload the projects list
        } catch (error) {
            console.error('Error deleting project:', error);
            showNotification('Failed to delete project', 'danger');
        }
    }
}

// Clear all projects
async function clearAllProjects() {
    if (confirm('Are you sure you want to clear all projects? This action cannot be undone.')) {
        try {
            const response = await fetch(API_ENDPOINTS.projects);
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }
            const projects = await response.json();
            
            if (projects.length === 0) {
                showNotification('No projects to clear', 'warning');
                return;
            }
            
            // Delete each project
            for (const project of projects) {
                await fetch(`${API_ENDPOINTS.projects}?id=${project.id}`, {
                    method: 'DELETE'
                });
            }
            
            showNotification('All projects cleared successfully', 'success');
            loadProjects(); // Reload the projects list
        } catch (error) {
            console.error('Error clearing projects:', error);
            showNotification('Failed to clear projects', 'danger');
        }
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForInput(dateString) {
    return new Date(dateString).toISOString().split('T')[0];
}

function getPriorityColor(priority) {
    switch(priority?.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
}

// Show toast notification
function showToast(type, message) {
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

// Show notification
function showNotification(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastHeader = toast.querySelector('.toast-header');
    const toastBody = toast.querySelector('.toast-body');
    
    toastHeader.className = `toast-header bg-${type} text-white`;
    toastBody.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
} 