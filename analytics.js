// Chart instances
let progressChart = null;
let statusChart = null;
let priorityChart = null;

// Function to show notification
function showNotification(message, type = 'success') {
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

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Function to get priority color
function getPriorityColor(priority) {
    switch(priority.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
}

// Function to get status color
function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'completed': return 'success';
        case 'in progress': return 'primary';
        case 'on hold': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

// Function to load project data
function loadProjectData() {
    try {
        // Check if required DOM elements exist
        const requiredElements = [
            'totalProjects', 
            'activeProjects', 
            'inProgressProjects', 
            'avgProgress',
            'progressChart',
            'statusChart',
            'priorityChart',
            'upcomingDeadlines'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing required DOM elements:', missingElements);
            showNotification('Page not fully loaded. Please refresh the page.', 'error');
            return;
        }
        
        // Get projects from localStorage
        const projectsData = localStorage.getItem('projects');
        console.log('Projects data from localStorage:', projectsData);
        
        if (!projectsData) {
            console.warn('No projects data found in localStorage');
            showNotification('No projects found. Create some projects first.', 'warning');
            return;
        }
        
        let projects;
        try {
            projects = JSON.parse(projectsData);
        } catch (parseError) {
            console.error('Error parsing projects data:', parseError);
            showNotification('Error parsing project data. Data may be corrupted.', 'error');
            return;
        }
        
        if (!Array.isArray(projects)) {
            console.error('Projects data is not an array:', projects);
            showNotification('Project data format is invalid.', 'error');
            return;
        }
        
        console.log('Successfully loaded projects:', projects.length);
        
        // Update stats
        updateStats(projects);
        
        // Update charts
        updateCharts(projects);
        
        // Update upcoming deadlines
        updateUpcomingDeadlines(projects);
        
        showNotification('Analytics data refreshed successfully');
    } catch (error) {
        console.error('Error loading project data:', error);
        showNotification('Failed to load project data: ' + error.message, 'error');
    }
}

// Function to update stats
function updateStats(projects) {
    try {
        // Total projects
        const totalProjectsElement = document.getElementById('totalProjects');
        if (totalProjectsElement) {
            totalProjectsElement.textContent = projects.length;
        } else {
            console.warn('Element with id "totalProjects" not found');
        }
        
        // Active projects
        const activeProjectsElement = document.getElementById('activeProjects');
        if (activeProjectsElement) {
            const activeProjects = projects.filter(project => project.active !== false).length;
            activeProjectsElement.textContent = activeProjects;
        } else {
            console.warn('Element with id "activeProjects" not found');
        }
        
        // In progress projects
        const inProgressProjectsElement = document.getElementById('inProgressProjects');
        if (inProgressProjectsElement) {
            const inProgressProjects = projects.filter(project => 
                project.status && project.status.toLowerCase() === 'in progress'
            ).length;
            inProgressProjectsElement.textContent = inProgressProjects;
        } else {
            console.warn('Element with id "inProgressProjects" not found');
        }
        
        // Average progress
        const avgProgressElement = document.getElementById('avgProgress');
        if (avgProgressElement) {
            if (projects.length > 0) {
                const totalProgress = projects.reduce((sum, project) => sum + (project.progress || 0), 0);
                const avgProgress = Math.round(totalProgress / projects.length);
                avgProgressElement.textContent = `${avgProgress}%`;
            } else {
                avgProgressElement.textContent = '0%';
            }
        } else {
            console.warn('Element with id "avgProgress" not found');
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Function to update charts
function updateCharts(projects) {
    if (!projects || projects.length === 0) {
        console.warn('No projects data available for charts');
        // Display a message in each chart container
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div class="text-center text-muted p-4">No project data available</div>';
        });
        return;
    }
    
    try {
        // Progress Chart
        updateProgressChart(projects);
        
        // Status Chart
        updateStatusChart(projects);
        
        // Priority Chart
        updatePriorityChart(projects);
    } catch (error) {
        console.error('Error updating charts:', error);
        showNotification('Error updating charts: ' + error.message, 'error');
    }
}

// Function to update progress chart
function updateProgressChart(projects) {
    try {
        const canvas = document.getElementById('progressChart');
        if (!canvas) {
            console.error('Progress chart canvas element not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for progress chart');
            return;
        }
        
        // Destroy existing chart if it exists
        if (progressChart) {
            progressChart.destroy();
        }
        
        // Prepare data
        const labels = projects.map(project => project.name || 'Unnamed Project');
        const data = projects.map(project => project.progress || 0);
        
        // Create chart
        progressChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Progress (%)',
                    data: data,
                    backgroundColor: 'rgba(82, 113, 255, 0.7)',
                    borderColor: 'rgba(82, 113, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Progress (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Progress: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating progress chart:', error);
        const container = document.getElementById('progressChart').parentElement;
        container.innerHTML = '<div class="text-center text-danger p-4">Error creating progress chart</div>';
    }
}

// Function to update status chart
function updateStatusChart(projects) {
    try {
        const canvas = document.getElementById('statusChart');
        if (!canvas) {
            console.error('Status chart canvas element not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for status chart');
            return;
        }
        
        // Destroy existing chart if it exists
        if (statusChart) {
            statusChart.destroy();
        }
        
        // Count projects by status
        const statusCounts = {};
        projects.forEach(project => {
            const status = project.status ? project.status.toLowerCase() : 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Prepare data
        const labels = Object.keys(statusCounts).map(status => 
            status.charAt(0).toUpperCase() + status.slice(1)
        );
        const data = Object.values(statusCounts);
        const backgroundColors = labels.map(status => {
            switch(status.toLowerCase()) {
                case 'completed': return 'rgba(40, 167, 69, 0.7)';
                case 'in progress': return 'rgba(0, 123, 255, 0.7)';
                case 'on hold': return 'rgba(255, 193, 7, 0.7)';
                case 'cancelled': return 'rgba(220, 53, 69, 0.7)';
                default: return 'rgba(108, 117, 125, 0.7)';
            }
        });
        
        // Create chart
        statusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating status chart:', error);
        const container = document.getElementById('statusChart').parentElement;
        container.innerHTML = '<div class="text-center text-danger p-4">Error creating status chart</div>';
    }
}

// Function to update priority chart
function updatePriorityChart(projects) {
    try {
        const canvas = document.getElementById('priorityChart');
        if (!canvas) {
            console.error('Priority chart canvas element not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for priority chart');
            return;
        }
        
        // Destroy existing chart if it exists
        if (priorityChart) {
            priorityChart.destroy();
        }
        
        // Count projects by priority
        const priorityCounts = {};
        projects.forEach(project => {
            const priority = project.priority ? project.priority.toLowerCase() : 'unknown';
            priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        });
        
        // Prepare data
        const labels = Object.keys(priorityCounts).map(priority => 
            priority.charAt(0).toUpperCase() + priority.slice(1)
        );
        const data = Object.values(priorityCounts);
        const backgroundColors = labels.map(priority => {
            switch(priority.toLowerCase()) {
                case 'high': return 'rgba(220, 53, 69, 0.7)';
                case 'medium': return 'rgba(255, 193, 7, 0.7)';
                case 'low': return 'rgba(40, 167, 69, 0.7)';
                default: return 'rgba(108, 117, 125, 0.7)';
            }
        });
        
        // Create chart
        priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating priority chart:', error);
        const container = document.getElementById('priorityChart').parentElement;
        container.innerHTML = '<div class="text-center text-danger p-4">Error creating priority chart</div>';
    }
}

// Function to update upcoming deadlines
function updateUpcomingDeadlines(projects) {
    try {
        const upcomingDeadlinesContainer = document.getElementById('upcomingDeadlines');
        if (!upcomingDeadlinesContainer) {
            console.error('Upcoming deadlines container not found');
            return;
        }
        
        upcomingDeadlinesContainer.innerHTML = '';
        
        if (!projects || projects.length === 0) {
            upcomingDeadlinesContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No projects found</td>
                </tr>
            `;
            return;
        }
        
        // Sort projects by due date
        const sortedProjects = [...projects].sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Add projects to the table
        sortedProjects.forEach(project => {
            try {
                const row = document.createElement('tr');
                
                // Calculate days until due
                const dueDate = project.dueDate ? new Date(project.dueDate) : null;
                const today = new Date();
                const daysUntilDue = dueDate ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
                
                // Set row class based on days until due
                if (daysUntilDue !== null) {
                    if (daysUntilDue < 0) {
                        row.classList.add('table-danger');
                    } else if (daysUntilDue <= 7) {
                        row.classList.add('table-warning');
                    }
                }
                
                row.innerHTML = `
                    <td>${project.name || 'Unnamed Project'}</td>
                    <td>${formatDate(project.dueDate)}</td>
                    <td>
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${project.progress || 0}%" 
                                aria-valuenow="${project.progress || 0}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <small>${project.progress || 0}%</small>
                    </td>
                    <td><span class="badge bg-${getStatusColor(project.status)}">${project.status || 'Unknown'}</span></td>
                `;
                
                upcomingDeadlinesContainer.appendChild(row);
            } catch (projectError) {
                console.error('Error processing project for upcoming deadlines:', projectError, project);
            }
        });
    } catch (error) {
        console.error('Error updating upcoming deadlines:', error);
        const container = document.getElementById('upcomingDeadlines');
        if (container) {
            container.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading upcoming deadlines</td></tr>';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing analytics...');
    
    // Wait a short time to ensure all elements are rendered
    setTimeout(() => {
        // Load project data
        loadProjectData();
        
        // Add event listener for refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadProjectData);
        } else {
            console.warn('Refresh button not found');
        }
    }, 100);
}); 