document.addEventListener('DOMContentLoaded', () => {
    // Inject project modal into body
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="addProjectModal" tabindex="-1" aria-labelledby="addProjectModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addProjectModalLabel">Add New Project</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addProjectForm">
                            <div class="mb-3">
                                <label for="projectName" class="form-label">Project Name</label>
                                <input type="text" class="form-control" id="projectName" required>
                            </div>
                            <div class="mb-3">
                                <label for="projectDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="projectDescription" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="projectDueDate" class="form-label">Due Date</label>
                                <input type="date" class="form-control" id="projectDueDate" required>
                            </div>
                            <div class="mb-3">
                                <label for="projectPriority" class="form-label">Priority</label>
                                <select class="form-select" id="projectPriority" required>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveProject">Add Project</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    // Initialize projects array in localStorage if not already set
    if (!localStorage.getItem('projects')) {
        localStorage.setItem('projects', JSON.stringify([]));
    }

    const addProjectModal = new bootstrap.Modal(document.getElementById('addProjectModal'));

    // Open modal on clicking "New Project" button
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        addProjectModal.show();
    });

    // Form validation function
    function validateProjectForm() {
        const projectName = document.getElementById('projectName').value.trim();
        const projectDescription = document.getElementById('projectDescription').value.trim();
        const projectDueDate = document.getElementById('projectDueDate').value;
        const projectPriority = document.getElementById('projectPriority').value;

        const errors = [];
        if (!projectName) errors.push('Project name is required');
        if (!projectDescription) errors.push('Project description is required');
        if (!projectDueDate) errors.push('Due date is required');
        if (new Date(projectDueDate) < new Date().setHours(0, 0, 0, 0)) errors.push('Due date cannot be in the past');

        return {
            isValid: errors.length === 0,
            errors,
            data: { projectName, projectDescription, projectDueDate, projectPriority }
        };
    }

    // Handle project submission
    document.getElementById('saveProject').addEventListener('click', () => {
        const validation = validateProjectForm();
        
        if (!validation.isValid) {
            const errorMessage = validation.errors.join('\n');
            showNotification(errorMessage, 'danger');
            return;
        }

        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const newProject = {
            id: Date.now(),
            name: validation.data.projectName,
            description: validation.data.projectDescription,
            dueDate: validation.data.projectDueDate,
            priority: validation.data.projectPriority,
            status: 'active',
            tasks: [],
            teamMembers: [],
            progress: 0,
            createdAt: new Date().toISOString()
        };

        projects.push(newProject);
        localStorage.setItem('projects', JSON.stringify(projects));

        // Update UI
        addProjectToList(newProject);
        updateActiveProjectsCount();

        // Clear form & hide modal
        document.getElementById('addProjectForm').reset();
        addProjectModal.hide();

        // Show success toast notification
        const successToast = document.getElementById('successToast');
        const toastBody = successToast.querySelector('.toast-body');
        toastBody.textContent = `Project "${validation.data.projectName}" has been created successfully!`;
        const bsToast = new bootstrap.Toast(successToast, { delay: 3000 });
        bsToast.show();
    });

    // Function to update active projects count
    function updateActiveProjectsCount() {
        const activeProjectsCount = document.querySelector('.card h2');
        if (activeProjectsCount) {
            const projects = JSON.parse(localStorage.getItem('projects')) || [];
            activeProjectsCount.textContent = projects.length;
        }
    }

    // Function to add a project to the list
    function addProjectToList(project) {
        let projectsList = document.getElementById('projectsList');
        
        // Create list container if it doesn't exist
        if (!projectsList) {
            projectsList = document.createElement('div');
            projectsList.className = 'row';
            projectsList.id = 'projectsList';
            document.querySelector('.main-content').appendChild(projectsList);
        }

        const projectCard = document.createElement('div');
        projectCard.className = 'col-md-4 mb-3';
        const cardInner = document.createElement('div');
        cardInner.className = 'card h-100';
        cardInner.style.cursor = 'pointer';
        cardInner.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out';
        cardInner.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">${project.name}</h5>
                    <button class="btn btn-danger btn-sm delete-project" data-project-id="${project.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="card-text">${project.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-${getPriorityColor(project.priority)}">${project.priority}</span>
                    <small class="text-muted">Due: ${new Date(project.dueDate).toLocaleDateString()}</small>
                </div>
                <div class="progress mt-2" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" style="width: ${project.progress}%"
                         aria-valuenow="${project.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="mt-2 text-muted small">Click to view details</div>
            </div>
        `;
        projectCard.appendChild(cardInner);

        // Add hover effect
        cardInner.addEventListener('mouseenter', () => {
            cardInner.style.transform = 'translateY(-5px)';
            cardInner.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });

        cardInner.addEventListener('mouseleave', () => {
            cardInner.style.transform = 'translateY(0)';
            cardInner.style.boxShadow = 'none';
        });

        // Handle clear all projects
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                const projects = JSON.parse(localStorage.getItem('projects')) || [];
                
                if (projects.length === 0) {
                    showNotification('No projects to clear!', 'warning');
                    return;
                }

                if (confirm('Are you sure you want to clear all projects? This action cannot be undone.')) {
                    try {
                        localStorage.removeItem('projects');
                        showNotification('All projects cleared successfully!');
                        
                        // Clear the projects list with fade-out animation
                        const projectsList = document.getElementById('projectsList');
                        if (projectsList) {
                            projectsList.style.transition = 'opacity 0.3s ease-out';
                            projectsList.style.opacity = '0';
                            setTimeout(() => {
                                projectsList.innerHTML = '';
                                projectsList.style.opacity = '1';
                                updateActiveProjectsCount();
                            }, 300);
                        }
                    } catch (error) {
                        console.error('Error clearing projects:', error);
                        showNotification('Failed to clear projects. Please try again.', 'danger');
                    }
                }
            });
        }

        // Handle project deletion
        const deleteBtn = projectCard.querySelector('.delete-project');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent triggering the card click event
            const target = e.target.closest('.delete-project');
            if (!target) return;

            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                try {
                    const projectId = parseInt(target.dataset.projectId);
                    const projects = JSON.parse(localStorage.getItem('projects')) || [];
                    const projectToDelete = projects.find(p => p.id === projectId);
                    
                    if (!projectToDelete) {
                        throw new Error('Project not found');
                    }

                    const updatedProjects = projects.filter(p => p.id !== projectId);
                    localStorage.setItem('projects', JSON.stringify(updatedProjects));

                    // Clear the projects list
                    const projectsList = document.getElementById('projectsList');
                    projectsList.innerHTML = '';

                    // Reload all remaining projects
                    updatedProjects.forEach(project => addProjectToList(project));
                    updateActiveProjectsCount();
                    showNotification('Project deleted successfully!');
                } catch (error) {
                    console.error('Error deleting project:', error);
                    showNotification('Failed to delete project. Please try again.', 'danger');
                }
            }
        });


        // Redirect to project details
        projectCard.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });

        projectsList.appendChild(projectCard);
    }

    // Load existing projects
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects.forEach(addProjectToList);
    updateActiveProjectsCount();

    // Helper function for priority colors
    function getPriorityColor(priority) {
        return {
            high: 'danger',
            medium: 'warning',
            low: 'success'
        }[priority] || 'secondary';
    }

    // Enhanced notification function
    function showNotification(message, type = 'success') {
        const successToast = document.getElementById('successToast');
        const toastHeader = successToast.querySelector('.toast-header');
        const toastBody = successToast.querySelector('.toast-body');

        // Update toast appearance based on type
        toastHeader.className = `toast-header bg-${type} text-white`;
        toastBody.textContent = message;

        const bsToast = new bootstrap.Toast(successToast, { delay: 3000 });
        bsToast.show();
    }
});
