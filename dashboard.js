document.addEventListener('DOMContentLoaded', () => {
    // Initialize projects from localStorage
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const tasks = [];
    
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

    // Update task lists
    function updateTaskLists() {
        const backlogTasks = document.querySelector('.col-md-4:nth-child(1) .task-list');
        const inProgressTasks = document.querySelector('.col-md-4:nth-child(2) .task-list');
        const completedTasks = document.querySelector('.col-md-4:nth-child(3) .task-list');

        // Clear existing tasks
        backlogTasks.innerHTML = '';
        inProgressTasks.innerHTML = '';
        completedTasks.innerHTML = '';

        // Add tasks from projects
        projects.forEach(project => {
            project.tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item';
                taskElement.textContent = `${project.name}: ${task.name}`;
                
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

    // Add event listener for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'projects') {
            projects = JSON.parse(e.newValue) || [];
            updateDashboardStats();
            updateTaskLists();
        }
    });
});