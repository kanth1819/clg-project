document.addEventListener('DOMContentLoaded', () => {
    // Add project modal HTML
    const modalHTML = `
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
   `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize projects array in localStorage if it doesn't exist
    if (!localStorage.getItem('projects')) {
        localStorage.setItem('projects', JSON.stringify([]));
    }

    // Get the new project button and add click event
    const newProjectBtn = document.querySelector('.btn-primary');
    const addProjectModal = new bootstrap.Modal(document.getElementById('addProjectModal'));

    newProjectBtn.addEventListener('click', () => {
        addProjectModal.show();
    });

    // Handle form submission
    document.getElementById('saveProject').addEventListener('click', () => {
        const form = document.getElementById('addProjectForm');
        const formData = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            dueDate: document.getElementById('projectDueDate').value,
            priority: document.getElementById('projectPriority').value,
            status: 'active',
            tasks: [],
            teamMembers: [],
            progress: 0,
            createdAt: new Date().toISOString()
        };

        if (formData.name && formData.description && formData.dueDate) {
            // Get existing projects
            const projects = JSON.parse(localStorage.getItem('projects'));
            const projectId = projects.length; // Use array index as project ID
            projects.push(formData);
            localStorage.setItem('projects', JSON.stringify(projects));

            // Update active projects count
            const activeProjectsCount = document.querySelector('.card h2');
            if (activeProjectsCount) {
                activeProjectsCount.textContent = projects.length;
            }

            // Clear form
            form.reset();
            addProjectModal.hide();

            // Show success message
            showNotification('Project added successfully!');

            // Add project to the list
            addProjectToList(formData, projectId);
        }
    });

    // Function to add project to the list
    function addProjectToList(project, projectId) {
        const projectsList = document.querySelector('.projects-list') || document.createElement('div');
        if (!document.querySelector('.projects-list')) {
            projectsList.className = 'projects-list';
            document.querySelector('main').appendChild(projectsList);
        }

        const projectCard = document.createElement('div');
        projectCard.className = 'card mb-3 project-card';
        projectCard.style.cursor = 'pointer';
        projectCard.style.transition = 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out';
        projectCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${project.name}</h5>
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

        // Add hover effect
        projectCard.addEventListener('mouseenter', () => {
            projectCard.style.transform = 'translateY(-5px)';
            projectCard.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });

        projectCard.addEventListener('mouseleave', () => {
            projectCard.style.transform = 'translateY(0)';
            projectCard.style.boxShadow = 'none';
        });

        // Add click event to view project details
        projectCard.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${projectId}`;
        });

        projectsList.appendChild(projectCard);
    }

    // Load existing projects
    const projects = JSON.parse(localStorage.getItem('projects'));
    projects.forEach((project, index) => {
        addProjectToList(project, index);
    });

    // Helper function for priority colors
    function getPriorityColor(priority) {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'secondary';
        }
    }

    // Notification function
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        notification.style.zIndex = '1050';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});