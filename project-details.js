document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("id");

    if (!projectId) {
        showError("Project ID is missing. Please provide a valid project ID.");
        return;
    }

    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const project = projects.find(p => p.id === parseInt(projectId));

        if (!project) {
            showError("Project not found. Please check the project ID.");
            return;
        }

        // Populate project details
        populateProjectDetails(project);
        await loadTeamMembers(projectId);

        // Setup invite form handler
        setupInviteForm(projectId);
    } catch (error) {
        console.error('Error loading project:', error);
        showError("Error loading project details.");
    }
});

function showError(message) {
    document.getElementById("errorContainer").classList.remove("d-none");
    document.getElementById("errorMessage").textContent = message;
    document.getElementById("projectContainer").style.display = "none";
}

function populateProjectDetails(project) {
    document.getElementById("projectName").textContent = project.name;
    document.getElementById("projectDescription").textContent = project.description;
    document.getElementById("projectDueDate").textContent = project.dueDate;
    document.getElementById("projectPriority").textContent = project.priority;
    document.getElementById("projectStatus").textContent = project.status;
    document.getElementById("projectProgress").style.width = project.progress + "%";
    document.getElementById("projectProgress").textContent = project.progress + "%";

    // Populate tasks
    const tasksList = document.getElementById("tasksList");
    tasksList.innerHTML = '';
    project.tasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.className = "list-group-item d-flex justify-content-between align-items-center";
        taskItem.innerHTML = `
            <span>${task.name}</span>
            <span class="badge ${getStatusBadgeClass(task.status)}">${task.status}</span>
        `;
        tasksList.appendChild(taskItem);
    });
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'Completed': 'bg-success',
        'In Progress': 'bg-primary',
        'Pending': 'bg-warning',
        'Blocked': 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
}

async function loadTeamMembers(projectId) {
    try {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const project = projects.find(p => p.id === parseInt(projectId));
        const members = project?.teamMembers || [];
        
        const teamMembers = document.getElementById("teamMembers");
        teamMembers.innerHTML = '';
        
        members.forEach(member => {
            const memberDiv = document.createElement("div");
            memberDiv.className = "col-md-4 mb-3";
            memberDiv.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="member-avatar">${member.name.charAt(0)}</div>
                            <div class="ms-3">
                                <h5 class="card-title mb-0">${member.name}</h5>
                                <p class="card-text text-muted">${member.email}</p>
                                <span class="badge bg-info">${member.role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            teamMembers.appendChild(memberDiv);
        });
    } catch (error) {
        console.error('Error loading team members:', error);
        showToast('error', 'Failed to load team members');
    }
}

function setupInviteForm(projectId) {
    const inviteForm = document.getElementById('inviteForm');
    const sendInviteBtn = document.getElementById('sendInviteBtn');

    sendInviteBtn.addEventListener('click', async () => {
        const email = document.getElementById('inviteEmail').value;
        const role = document.getElementById('inviteRole').value;

        if (!email) {
            showToast('error', 'Please enter an email address');
            return;
        }

        try {
            const response = await fetch('/api/projects/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId,
                    email,
                    role
                })
            });

            const result = await response.json();

            if (response.ok) {
                showToast('success', 'Invitation sent successfully');
                document.getElementById('inviteModal').querySelector('.btn-close').click();
                inviteForm.reset();
                await loadTeamMembers(projectId);
            } else {
                showToast('error', result.message || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            showToast('error', 'Failed to send invitation');
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
