document.addEventListener('DOMContentLoaded', () => {
    // Initialize projects from localStorage
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));

    // Show success message
    function showSuccess(message) {
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = message;
        successToast.show();
    }
    
    // Update dashboard statistics
    function updateDashboardStats() {
        // Update active projects count
        document.querySelector('.card:nth-child(1) h2').textContent = projects.length;

        // Calculate tasks due today
        const today = new Date().setHours(0, 0, 0, 0);
        const tasksDueToday = projects.reduce((count, project) => {
            const projectDueDate = new Date(project.dueDate).setHours(0, 0, 0, 0);
            return count + (projectDueDate === today ? 1 : 0);
        }, 0);
        document.querySelector('.card:nth-child(2) h2').textContent = tasksDueToday;

        // Update team members count (unique members across all projects)
        const uniqueMembers = new Set();
        projects.forEach(project => {
            project.teamMembers.forEach(member => uniqueMembers.add(member));
        });
        document.querySelector('.card:nth-child(3) h2').textContent = uniqueMembers.size;

        // Calculate completed tasks
        const completedTasks = projects.reduce((count, project) => {
            return count + (project.tasks.filter(task => task.status === 'completed').length);
        }, 0);
        document.querySelector('.card:nth-child(4) h2').textContent = completedTasks;
    }

    // Update task lists with drag and drop functionality
    function updateTaskLists() {
        const backlogTasks = document.querySelector('.col-md-4:nth-child(1) .task-list');
        const inProgressTasks = document.querySelector('.col-md-4:nth-child(2) .task-list');
        const completedTasks = document.querySelector('.col-md-4:nth-child(3) .task-list');

        const taskLists = [backlogTasks, inProgressTasks, completedTasks];
        taskLists.forEach(list => {
            list.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(list, e.clientY);
                const draggingElement = document.querySelector('.dragging');
                if (draggingElement) {
                    if (afterElement) {
                        list.insertBefore(draggingElement, afterElement);
                    } else {
                        list.appendChild(draggingElement);
                    }
                }
            });
        });

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

        // Clear existing tasks
        backlogTasks.innerHTML = '';
        inProgressTasks.innerHTML = '';
        completedTasks.innerHTML = '';

        // Add tasks from projects
        projects.forEach(project => {
            project.tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item';
                taskElement.draggable = true;
                taskElement.textContent = `${project.name}: ${task.name}`;
                taskElement.dataset.projectId = project.id;
                taskElement.dataset.taskId = task.id;

                taskElement.addEventListener('dragstart', () => {
                    taskElement.classList.add('dragging');
                });

                taskElement.addEventListener('dragend', () => {
                    taskElement.classList.remove('dragging');
                    const newStatus = taskElement.parentElement.previousElementSibling.textContent.toLowerCase();
                    updateTaskStatus(project.id, task.id, newStatus);
                });
                
                switch(task.status.toLowerCase()) {
                    case 'backlog':
                        backlogTasks.appendChild(taskElement);
                        break;
                    case 'in progress':
                        inProgressTasks.appendChild(taskElement);
                        break;
                    case 'completed':
                        completedTasks.appendChild(taskElement);
                        break;
                }
            });
        });
    }

    // Initialize dashboard
    updateDashboardStats();
    updateTaskLists();

    // Update task status and save to localStorage
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

    // Add event listener for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'projects') {
            projects = JSON.parse(e.newValue) || [];
            updateDashboardStats();
            updateTaskLists();
        }
    });

    // Initial update
    updateDashboardStats();
    updateTaskLists();
});