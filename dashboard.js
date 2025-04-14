document.addEventListener('DOMContentLoaded', () => {
    // Initialize tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let projects = JSON.parse(localStorage.getItem('projects')) || [];

    // Initialize Bootstrap modal
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));

    // Show success message with custom styling
    function showSuccess(message) {
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = message;
        successToast.show();
    }
    
    // Update dashboard statistics with animation
    function updateDashboardStats() {
        const stats = [
            { selector: '.card:nth-child(1) h2', value: projects.length },
            { selector: '.card:nth-child(2) h2', value: getTasksDueToday() },
            { selector: '.card:nth-child(3) h2', value: getUniqueTeamMembers() },
            { selector: '.card:nth-child(4) h2', value: getCompletedTasks() }
        ];

        stats.forEach(stat => {
            const element = document.querySelector(stat.selector);
            if (element) {
                const currentValue = parseInt(element.textContent) || 0;
                animateNumber(element, currentValue, stat.value);
            }
        });
    }

    function animateNumber(element, start, end) {
        const duration = 1000;
        const steps = 60;
        const increment = (end - start) / steps;
        let current = start;
        let step = 0;

        const animate = () => {
            current += increment;
            step++;
            element.textContent = Math.round(current);

            if (step < steps) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
            }
        };

        requestAnimationFrame(animate);
    }

    function getTasksDueToday() {
        const today = new Date().setHours(0, 0, 0, 0);
        return projects.reduce((count, project) => {
            const projectDueDate = new Date(project.dueDate).setHours(0, 0, 0, 0);
            return count + (projectDueDate === today ? 1 : 0);
        }, 0);
    }

    function getUniqueTeamMembers() {
        const uniqueMembers = new Set();
        projects.forEach(project => {
            project.teamMembers.forEach(member => uniqueMembers.add(member));
        });
        return uniqueMembers.size;
    }

    function getCompletedTasks() {
        return projects.reduce((count, project) => {
            return count + (project.tasks.filter(task => task.status === 'completed').length);
        }, 0);
    }

    // Update task lists with enhanced drag and drop functionality
    function updateTaskLists() {
        const taskColumns = {
            backlog: document.querySelector('.col-md-4:nth-child(1) .task-list'),
            'in progress': document.querySelector('.col-md-4:nth-child(2) .task-list'),
            completed: document.querySelector('.col-md-4:nth-child(3) .task-list')
        };

        Object.values(taskColumns).forEach(list => {
            list.innerHTML = '';
            
            list.addEventListener('dragover', e => {
                e.preventDefault();
                const draggingElement = document.querySelector('.dragging');
                const afterElement = getDragAfterElement(list, e.clientY);
                
                if (draggingElement) {
                    if (afterElement) {
                        list.insertBefore(draggingElement, afterElement);
                    } else {
                        list.appendChild(draggingElement);
                    }
                }
            });

            list.addEventListener('dragenter', e => {
                e.preventDefault();
                list.classList.add('drag-over');
            });

            list.addEventListener('dragleave', () => {
                list.classList.remove('drag-over');
            });
        });

        projects.forEach(project => {
            project.tasks.forEach(task => {
                const taskElement = createTaskElement(project, task);
                const targetList = taskColumns[task.status.toLowerCase()];
                if (targetList) targetList.appendChild(taskElement);
            });
        });
    }

    function createTaskElement(project, task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.draggable = true;
        taskElement.dataset.projectId = project.id;
        taskElement.dataset.taskId = task.id;

        taskElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="task-name">${task.name}</div>
                    <div class="project-badge badge bg-secondary">${project.name}</div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline-danger delete-task-btn" onclick="event.stopPropagation(); deleteTask(${project.id}, ${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        taskElement.style.cursor = 'pointer';
        
        // Add click event only to the task name and project badge
        const taskInfo = taskElement.querySelector('div:first-child');
        taskInfo.addEventListener('click', () => {
            window.location.href = `task-details.html?taskId=${task.id}&projectId=${project.id}`;
        });
        taskInfo.style.cursor = 'pointer';
        
        taskElement.addEventListener('dragstart', () => {
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
            document.querySelectorAll('.task-list').forEach(list => {
                list.classList.remove('drag-over');
            });
            
            const newStatus = taskElement.parentElement.previousElementSibling.textContent.toLowerCase();
            updateTaskStatus(project.id, task.id, newStatus);
        });

        return taskElement;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateTaskStatus(projectId, taskId, newStatus) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            const task = project.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                localStorage.setItem('projects', JSON.stringify(projects));
                updateDashboardStats();
                showSuccess('Task status updated successfully!');
            }
        }
    }

    function deleteTask(projectId, taskId) {
        if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            try {
                const projects = JSON.parse(localStorage.getItem('projects')) || [];
                const projectIndex = projects.findIndex(p => p.id === parseInt(projectId));

                if (projectIndex === -1) {
                    showError('Project not found');
                    return;
                }

                // Find and remove the task
                const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === parseInt(taskId));
                if (taskIndex !== -1) {
                    projects[projectIndex].tasks.splice(taskIndex, 1);
                    
                    // Save updated projects to localStorage
                    localStorage.setItem('projects', JSON.stringify(projects));
                    
                    // Update UI
                    updateTaskLists();
                    updateDashboardStats();
                    showSuccess('Task deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showError('Failed to delete task');
            }
        }
    }

    // Populate project dropdown
    function populateProjectDropdown() {
        const projectSelect = document.getElementById('projectSelect');
        projectSelect.innerHTML = '<option value="" disabled selected>Select a project</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    // Add Task Button Click Handler
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        document.getElementById('addTaskForm').reset();
        populateProjectDropdown();
        addTaskModal.show();
    });

    // Save Task Button Click Handler
    document.getElementById('saveTaskBtn').addEventListener('click', () => {
        const projectId = document.getElementById('projectSelect').value;
        const taskName = document.getElementById('taskName').value;
        const taskDescription = document.getElementById('taskDescription').value;
        const taskPriority = document.getElementById('taskPriority').value;
        const taskDueDate = document.getElementById('taskDueDate').value;

        if (!taskName || !projectId) {
            alert('Please enter task name and select a project');
            return;
        }

        const project = projects.find(p => p.id === parseInt(projectId));
        if (!project) {
            alert('Selected project not found');
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            name: taskName,
            description: taskDescription,
            priority: taskPriority,
            dueDate: taskDueDate,
            status: 'backlog'
        };

        if (!project.tasks) {
            project.tasks = [];
        }
        project.tasks.push(newTask);

        localStorage.setItem('projects', JSON.stringify(projects));
        updateTaskLists();
        updateDashboardStats();

        addTaskModal.hide();
        showSuccess('Task added successfully!');
    });

    // Add event listener for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'projects') {
            projects = JSON.parse(e.newValue) || [];
            updateDashboardStats();
            updateTaskLists();
        } else if (e.key === 'tasks') {
            tasks = JSON.parse(e.newValue) || [];
            updateTaskLists();
        }
    });

    function showError(message) {
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = message;
        const successToast = new bootstrap.Toast(document.getElementById('successToast'));
        successToast.show();
    }

    // Initialize dashboard
    updateDashboardStats();
    updateTaskLists();

    // Refresh dashboard data periodically
    setInterval(() => {
        const updatedProjects = JSON.parse(localStorage.getItem('projects')) || [];
        if (JSON.stringify(projects) !== JSON.stringify(updatedProjects)) {
            projects = updatedProjects;
            updateDashboardStats();
            updateTaskLists();
        }
    }, 30000); // Refresh every 30 seconds
});