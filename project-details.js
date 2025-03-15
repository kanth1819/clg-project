document.addEventListener('DOMContentLoaded', () => {
    // Get project ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        // Get projects from localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        const project = projects[projectId];

        if (project) {
            // Initialize project data structure if needed
            if (!project.tasks) project.tasks = [];
            if (!project.teamMembers) project.teamMembers = [];
            if (!project.progress) project.progress = 0;

            // Update project details in the UI
            document.getElementById('projectName').textContent = project.name;
            document.getElementById('projectDescription').textContent = project.description;
            document.getElementById('projectDueDate').textContent = new Date(project.dueDate).toLocaleDateString();
            document.getElementById('projectPriority').textContent = project.priority.charAt(0).toUpperCase() + project.priority.slice(1);
            document.getElementById('projectStatus').textContent = project.status.charAt(0).toUpperCase() + project.status.slice(1);
            document.getElementById('projectProgress').style.width = `${project.progress}%`;
            document.getElementById('projectProgress').textContent = `${project.progress}%`;

            // Render tasks
            renderTasks(project.tasks);
            // Render team members
            renderTeamMembers(project.teamMembers);

            // Add Task Button Event Listener
            document.getElementById('addTaskBtn').addEventListener('click', () => {
                const taskName = prompt('Enter task name:');
                if (taskName) {
                    const task = {
                        id: Date.now(),
                        name: taskName,
                        completed: false,
                        createdAt: new Date().toISOString()
                    };
                    project.tasks.push(task);
                    updateProjectInStorage(projects);
                    renderTasks(project.tasks);
                    updateProgress(project);
                }
            });

            // Add Team Member Button Event Listener
            document.getElementById('addMemberBtn').addEventListener('click', () => {
                const memberName = prompt('Enter team member name:');
                if (memberName) {
                    const member = {
                        id: Date.now(),
                        name: memberName,
                        role: 'Member',
                        joinedAt: new Date().toISOString()
                    };
                    project.teamMembers.push(member);
                    updateProjectInStorage(projects);
                    renderTeamMembers(project.teamMembers);
                }
            });
        } else {
            showError('Project not found');
        }
    } else {
        showError('No project ID provided');
    }

    function renderTasks(tasks) {
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = tasks.map(task => `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <div>
                    <input type="checkbox" class="form-check-input me-2" 
                           ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask(${task.id})">
                    <span class="${task.completed ? 'text-decoration-line-through' : ''}">${task.name}</span>
                </div>
                <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `).join('');
    }

    function renderTeamMembers(members) {
        const teamMembersContainer = document.getElementById('teamMembers');
        teamMembersContainer.innerHTML = members.map(member => `
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${member.name}</h5>
                        <p class="card-text text-muted">${member.role}</p>
                        <button class="btn btn-danger btn-sm" onclick="removeMember(${member.id})">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function updateProgress(project) {
        if (project.tasks.length === 0) {
            project.progress = 0;
        } else {
            const completedTasks = project.tasks.filter(task => task.completed).length;
            project.progress = Math.round((completedTasks / project.tasks.length) * 100);
        }
        document.getElementById('projectProgress').style.width = `${project.progress}%`;
        document.getElementById('projectProgress').textContent = `${project.progress}%`;
        updateProjectInStorage(projects);
    }

    function updateProjectInStorage(projects) {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function showError(message) {
        const container = document.querySelector('.project-details-container');
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        `;
    }

    // Global functions for event handlers
    window.toggleTask = function(taskId) {
        const task = project.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            updateProjectInStorage(projects);
            renderTasks(project.tasks);
            updateProgress(project);
        }
    };

    window.deleteTask = function(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            project.tasks = project.tasks.filter(t => t.id !== taskId);
            updateProjectInStorage(projects);
            renderTasks(project.tasks);
            updateProgress(project);
        }
    };

    window.removeMember = function(memberId) {
        if (confirm('Are you sure you want to remove this team member?')) {
            project.teamMembers = project.teamMembers.filter(m => m.id !== memberId);
            updateProjectInStorage(projects);
            renderTeamMembers(project.teamMembers);
        }
    };
});