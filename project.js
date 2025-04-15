document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, checking authentication...');
    
    // Check authentication first
    const currentUserData = sessionStorage.getItem('currentUser');
    console.log('Current user data:', currentUserData);
    
    if (!currentUserData) {
        console.error('No user data found - redirecting to login');
        window.location.href = '/login.html';
        return;
    }

    try {
        const user = JSON.parse(currentUserData);
        console.log('User data parsed:', user);
        if (!user.token) {
            throw new Error('No token in user data');
        }
        
        // Initialize the page after successful authentication
        initializePage();
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        sessionStorage.removeItem('currentUser');
        window.location.href = '/login.html';
        return;
    }
});

function initializePage() {
    // Load projects immediately
    loadProjectsFromServer();

    // Add event listener for the New Project button
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
            projectModal.show();
        });
    }

    // Add event listener for the Save Project button
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', handleProjectSave);
    }
}

async function loadProjectsFromServer() {
    console.log('Starting to load projects...');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noProjectsMessage = document.getElementById('noProjectsMessage');
    const projectsList = document.getElementById('projectsList');

    if (!projectsList) {
        console.error('Projects list container not found!');
        return;
    }

    try {
        // Show loading state
        if (loadingSpinner) {
            loadingSpinner.classList.remove('d-none');
            console.log('Showing loading spinner');
        }
        if (projectsList) projectsList.style.display = 'none';
        if (noProjectsMessage) noProjectsMessage.classList.add('d-none');

        // Get authentication token
        const currentUserData = sessionStorage.getItem('currentUser');
        console.log('Current user data:', currentUserData);
        
        if (!currentUserData) {
            throw new Error('No user data found');
        }

        const user = JSON.parse(currentUserData);
        if (!user.token) {
            throw new Error('No authentication token found');
        }

        console.log('Making API request to fetch projects...');
        const response = await fetch('/api/projects', {
            method: 'GET',
            headers: {
                'Authorization': user.token,
                'Content-Type': 'application/json'
            }
        });

        console.log('API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('Raw API response:', responseText);

        const projects = JSON.parse(responseText);
        console.log('Parsed projects:', projects);

        // Clear existing projects
        projectsList.innerHTML = '';
        console.log('Cleared existing projects');

        if (Array.isArray(projects) && projects.length > 0) {
            console.log(`Creating ${projects.length} project cards...`);
            projects.forEach((project, index) => {
                console.log(`Creating card for project ${index + 1}:`, project);
                const card = createProjectCard(project);
                projectsList.appendChild(card);
                console.log(`Added card for project ${index + 1} to DOM`);
            });
            
            if (noProjectsMessage) {
                noProjectsMessage.classList.add('d-none');
                console.log('Hiding no projects message');
            }
            projectsList.style.display = 'block';
            console.log('Showing projects list');
        } else {
            console.log('No projects found');
            if (noProjectsMessage) {
                noProjectsMessage.classList.remove('d-none');
                console.log('Showing no projects message');
            }
            projectsList.style.display = 'none';
            console.log('Hiding projects list');
        }

        updateProjectCount(projects.length);
        console.log('Updated project count');

    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification(error.message || 'Failed to load projects', 'danger');
        
        if (error.message.includes('No user data found') || error.message.includes('No authentication token found')) {
            window.location.href = '/login.html';
        }
    } finally {
        if (loadingSpinner) {
            loadingSpinner.classList.add('d-none');
            console.log('Hiding loading spinner');
        }
    }
}

// Function to validate form
function validateProjectForm() {
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const projectDeadline = document.getElementById('projectDeadline').value;
    const projectPriority = document.getElementById('projectPriority').value;

    const errors = [];
    if (!projectName) errors.push('Project name is required');
    if (!projectDescription) errors.push('Project description is required');
    if (!projectDeadline) errors.push('Due date is required');
    if (new Date(projectDeadline) < new Date().setHours(0, 0, 0, 0)) errors.push('Due date cannot be in the past');

    return {
        isValid: errors.length === 0,
        errors,
        data: { projectName, projectDescription, projectDeadline, projectPriority }
    };
}

// Handle project submission
async function handleProjectSave() {
    console.log('Saving project...');
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const projectDeadline = document.getElementById('projectDeadline').value;
    const projectPriority = document.getElementById('projectPriority').value;

    if (!projectName) {
        showNotification('Project name is required', 'danger');
        return;
    }

    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        showNotification('Please log in to create projects', 'danger');
        window.location.href = '/login.html';
        return;
    }

    const user = JSON.parse(userData);
    const token = user.token;

    const projectData = {
        project_name: projectName,
        description: projectDescription,
        end_date: projectDeadline,
        priority: projectPriority,
        progress: 0
    };

    try {
        console.log('Sending project data:', projectData);
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();
        console.log('Server response:', result);

        if (response.ok) {
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
            modal.hide();
            
            // Clear the form
            document.getElementById('projectForm').reset();
            
            // Show success message
            showNotification('Project created successfully!', 'success');
            
            // Add the new project to the list
            if (result.project) {
                const projectsList = document.getElementById('projectsList');
                const card = createProjectCard(result.project);
                projectsList.insertBefore(card, projectsList.firstChild);
                
                // Update project count
                updateProjectCount(document.querySelectorAll('.project-card').length);
                
                // Hide "no projects" message if it's showing
                const noProjectsMessage = document.getElementById('noProjectsMessage');
                if (noProjectsMessage) {
                    noProjectsMessage.classList.add('d-none');
                }
                
                // Show the projects list if it's hidden
                projectsList.style.display = 'block';
            } else {
                // Refresh the whole list if we don't have the new project data
                await loadProjectsFromServer();
            }
        } else {
            showNotification(result.message || 'Error creating project', 'danger');
        }
    } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Network error while creating project', 'danger');
    }
}

// Function to create a project card
function createProjectCard(project) {
    console.log('Creating card for project:', project);
    const card = document.createElement('div');
    card.className = 'col-12 mb-3';
    
    // Format the date
    const dueDate = project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set';
    console.log('Formatted due date:', dueDate);
    
    // Get priority class
    const priorityClass = getPriorityClass(project.priority);
    console.log('Priority class:', priorityClass);
    
    const cardHTML = `
        <div class="card project-card" data-project-id="${project.project_id}" style="border-radius: 8px; border: 1px solid #e0e0e0;">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-title mb-0" style="font-size: 1.25rem; color: #333;">${project.project_name}</h5>
                    <div>
                        <button class="btn btn-primary btn-sm edit-project">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-project ms-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="card-text text-muted mb-3">${project.description || ''}</p>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="${priorityClass}">${project.priority} Priority</span>
                    <span class="text-muted">Due: ${dueDate}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">${project.tasks?.length || 0} Tasks</small>
                    <small class="text-muted">${project.team_members?.length || 0} Members</small>
                </div>
                <div class="mt-2">
                    <small class="text-muted">Click to view details</small>
                </div>
            </div>
        </div>
    `;
    
    console.log('Generated card HTML:', cardHTML);
    card.innerHTML = cardHTML;

    // Add hover effect
    const projectCard = card.querySelector('.project-card');
    if (!projectCard) {
        console.error('Project card element not found in generated HTML');
        return card;
    }

    projectCard.addEventListener('mouseenter', () => {
        projectCard.style.transform = 'translateY(-5px)';
        projectCard.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        projectCard.style.transition = 'all 0.3s ease';
    });

    projectCard.addEventListener('mouseleave', () => {
        projectCard.style.transform = 'translateY(0)';
        projectCard.style.boxShadow = 'none';
    });

    // Add click handler for project details
    projectCard.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-project') && !e.target.closest('.edit-project')) {
            window.location.href = `project-details.html?id=${project.project_id}`;
        }
    });

    // Add delete functionality
    const deleteBtn = card.querySelector('.delete-project');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this project?')) {
                const token = JSON.parse(sessionStorage.getItem('currentUser'))?.token;
                if (!token) {
                    showNotification('Authentication required.', 'danger');
                    return;
                }

                try {
                    const response = await fetch(`/api/projects/${project.project_id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': token }
                    });

                    if (response.ok) {
                        card.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            card.remove();
                            updateProjectCount(document.querySelectorAll('.project-card').length);
                            
                            // Show no projects message if no projects left
                            if (document.querySelectorAll('.project-card').length === 0) {
                                const noProjectsMessage = document.getElementById('noProjectsMessage');
                                if (noProjectsMessage) {
                                    noProjectsMessage.classList.remove('d-none');
                                }
                            }
                        }, 300);
                        showNotification('Project deleted successfully!', 'success');
                    } else {
                        const result = await response.json();
                        showNotification(result.message || 'Error deleting project', 'danger');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('Network error while deleting project', 'danger');
                }
            }
        });
    } else {
        console.error('Delete button not found in generated card');
    }

    console.log('Returning completed card element');
    return card;
}

// Helper function for priority styling
function getPriorityClass(priority) {
    const priorityLower = (priority || 'medium').toLowerCase();
    switch (priorityLower) {
        case 'low':
            return 'badge bg-success';
        case 'medium':
            return 'badge bg-warning text-dark';
        case 'high':
            return 'badge bg-danger';
        default:
            return 'badge bg-secondary';
    }
}

// Function to update project count
function updateProjectCount(count) {
    const countElement = document.querySelector('.card h2');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Helper function for priority colors
function getPriorityColor(priority) {
    const colors = {
        high: 'danger',
        medium: 'warning',
        low: 'success'
    };
    return colors[priority?.toLowerCase()] || 'secondary';
}

// Function to show notifications
function showNotification(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastHeader = toast.querySelector('.toast-header');
    const toastBody = toast.querySelector('.toast-body');

    toastHeader.className = `toast-header bg-${type} text-white`;
    toastBody.textContent = message;

    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
}

// Add event listener for Clear All button
const clearAllBtn = document.getElementById('clearAllBtn');
if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
        const projectCards = document.querySelectorAll('.project-card');
        if (projectCards.length === 0) {
            showNotification('No projects to clear!', 'warning');
            return;
        }

        if (confirm('Are you sure you want to clear ALL your projects? This action cannot be undone.')) {
            let token = null;
            try {
                const currentUserData = sessionStorage.getItem('currentUser');
                if (currentUserData) token = JSON.parse(currentUserData).token;
            } catch (e) { /* ignore */ }

            if (!token) {
                showNotification('Authentication error. Cannot clear projects.', 'danger');
                return;
            }

            let hasError = false;
            for (const card of projectCards) {
                const projectId = card.dataset.projectId;
                try {
                    const response = await fetch(`/api/projects/${projectId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': token
                        }
                    });

                    if (!response.ok) {
                        hasError = true;
                        const result = await response.json();
                        console.error(`Error deleting project ${projectId}:`, result);
                    }
                } catch (error) {
                    hasError = true;
                    console.error(`Network error deleting project ${projectId}:`, error);
                }
            }

            const projectsList = document.getElementById('projectsList');
            if (projectsList) {
                projectsList.style.transition = 'opacity 0.3s ease-out';
                projectsList.style.opacity = '0';
                setTimeout(() => {
                    projectsList.innerHTML = `
                        <div class="col-12 text-center mt-4">
                            <p class="text-muted">No projects found. Click "New Project" to create one.</p>
                        </div>
                    `;
                    projectsList.style.opacity = '1';
                    updateProjectCount(0);
                }, 300);
            }

            if (hasError) {
                showNotification('Some projects could not be deleted. Please refresh the page.', 'warning');
            } else {
                showNotification('All projects cleared successfully!', 'success');
            }
        }
    });
}

