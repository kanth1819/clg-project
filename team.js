// Global variables
let teamMembers = [];
let projects = [];
let addMemberModal = null;
let editMemberModal = null;
let deleteMemberModal = null;
let currentMemberId = null;

// API endpoints
const API_ENDPOINTS = {
    team: 'api/team.php',
    projects: 'api/projects.php'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    addMemberModal = new bootstrap.Modal(document.getElementById('addMemberModal'));
    editMemberModal = new bootstrap.Modal(document.getElementById('editMemberModal'));
    deleteMemberModal = new bootstrap.Modal(document.getElementById('deleteMemberModal'));
    
    // Load data
    loadData();
    
    // Set up event listeners
    setupEventListeners();
});

// Load data from API
function loadData() {
    // Load projects
    fetch(API_ENDPOINTS.projects)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                projects = data.data;
                populateProjectDropdowns();
            } else {
                showToast('error', 'Failed to load projects: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            showToast('error', 'Failed to load projects. Please try again.');
        });
    
    // Load team members
    fetch(API_ENDPOINTS.team)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                teamMembers = data.data;
                updateStats();
                renderTeamMembers();
            } else {
                showToast('error', 'Failed to load team members: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error loading team members:', error);
            showToast('error', 'Failed to load team members. Please try again.');
        });
}

// Update statistics
function updateStats() {
    document.getElementById('totalTeamMembers').textContent = teamMembers.length;
    
    const activeMembers = teamMembers.filter(member => member.is_active !== false).length;
    document.getElementById('activeMembers').textContent = activeMembers;
    
    const adminCount = teamMembers.filter(member => member.role === 'admin').length;
    document.getElementById('adminCount').textContent = adminCount;
    
    document.getElementById('projectCount').textContent = projects.length;
}

// Populate project dropdowns
function populateProjectDropdowns() {
    const filterProject = document.getElementById('filterProject');
    const memberProjects = document.getElementById('memberProjects');
    const editMemberProjects = document.getElementById('editMemberProjects');
    
    // Clear existing options except the first one
    while (filterProject.options.length > 1) {
        filterProject.remove(1);
    }
    
    // Add project options
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        
        // Add to filter dropdown
        filterProject.appendChild(option.cloneNode(true));
        
        // Add to add member dropdown
        if (memberProjects) {
            memberProjects.appendChild(option.cloneNode(true));
        }
        
        // Add to edit member dropdown
        if (editMemberProjects) {
            editMemberProjects.appendChild(option.cloneNode(true));
        }
    });
}

// Render team members
function renderTeamMembers() {
    const teamMembersList = document.getElementById('teamMembersList');
    const searchTerm = document.getElementById('searchMember').value.toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const projectFilter = document.getElementById('filterProject').value;
    
    // Filter team members
    let filteredMembers = teamMembers.filter(member => {
        // Search filter
        const matchesSearch = member.name.toLowerCase().includes(searchTerm) || 
                             member.email.toLowerCase().includes(searchTerm);
        
        // Role filter
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;
        
        // Project filter
        let matchesProject = true;
        if (projectFilter !== 'all') {
            matchesProject = member.projects && member.projects.includes(parseInt(projectFilter));
        }
        
        return matchesSearch && matchesRole && matchesProject;
    });
    
    // Clear the list
    teamMembersList.innerHTML = '';
    
    // If no members found, show message
    if (filteredMembers.length === 0) {
        teamMembersList.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fas fa-users fa-3x mb-3"></i>
                <h5>No team members found</h5>
                <p>Try adjusting your filters or add a new team member</p>
            </div>
        `;
        return;
    }
    
    // Render each team member
    filteredMembers.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'col-md-4 mb-4';
        
        // Get member's projects
        const memberProjects = member.projects || [];
        const projectBadges = memberProjects.map(projectId => {
            const project = projects.find(p => p.id === parseInt(projectId));
            return project ? `<span class="badge bg-info project-badge">${project.name}</span>` : '';
        }).join('');
        
        // Create member card
        memberCard.innerHTML = `
            <div class="card team-member-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="member-avatar me-3">
                            ${member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h5 class="card-title mb-0">${member.name}</h5>
                            <p class="text-muted mb-0">${member.email}</p>
                        </div>
                    </div>
                    <div class="mb-3">
                        <span class="badge ${member.role === 'admin' ? 'bg-warning' : 'bg-primary'} role-badge">
                            ${member.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                        ${member.is_active === false ? '<span class="badge bg-danger role-badge ms-2">Inactive</span>' : ''}
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">Assigned to:</small>
                        <div class="mt-1">
                            ${projectBadges || '<span class="text-muted">No projects assigned</span>'}
                        </div>
                    </div>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-sm btn-outline-primary me-2 edit-member-btn" data-id="${member.id}">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-member-btn" data-id="${member.id}">
                            <i class="fas fa-trash-alt me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        teamMembersList.appendChild(memberCard);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-member-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.getAttribute('data-id');
            openEditModal(memberId);
        });
    });
    
    document.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.getAttribute('data-id');
            openDeleteModal(memberId);
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search and filter
    document.getElementById('searchMember').addEventListener('input', renderTeamMembers);
    document.getElementById('filterRole').addEventListener('change', renderTeamMembers);
    document.getElementById('filterProject').addEventListener('change', renderTeamMembers);
    
    // Add member
    document.getElementById('saveMemberBtn').addEventListener('click', saveNewMember);
    
    // Edit member
    document.getElementById('updateMemberBtn').addEventListener('click', updateMember);
    
    // Delete member
    document.getElementById('confirmDeleteMemberBtn').addEventListener('click', deleteMember);
}

// Open edit modal
function openEditModal(memberId) {
    currentMemberId = memberId;
    const member = teamMembers.find(m => m.id === parseInt(memberId));
    
    if (!member) {
        showToast('error', 'Member not found');
        return;
    }
    
    // Populate form
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberEmail').value = member.email;
    document.getElementById('editMemberRole').value = member.role;
    
    // Set selected projects
    const editMemberProjects = document.getElementById('editMemberProjects');
    if (member.projects && member.projects.length > 0) {
        Array.from(editMemberProjects.options).forEach(option => {
            option.selected = member.projects.includes(parseInt(option.value));
        });
    } else {
        Array.from(editMemberProjects.options).forEach(option => {
            option.selected = false;
        });
    }
    
    // Show modal
    editMemberModal.show();
}

// Open delete modal
function openDeleteModal(memberId) {
    currentMemberId = memberId;
    deleteMemberModal.show();
}

// Save new member
function saveNewMember() {
    const name = document.getElementById('memberName').value;
    const email = document.getElementById('memberEmail').value;
    const role = document.getElementById('memberRole').value;
    const projectsSelect = document.getElementById('memberProjects');
    
    // Validate inputs
    if (!name || !email || !role) {
        showToast('error', 'Please fill in all required fields');
        return;
    }
    
    // Get selected projects
    const selectedProjects = Array.from(projectsSelect.selectedOptions).map(option => parseInt(option.value));
    
    // Create new member object
    const newMember = {
        name,
        email,
        role,
        projects: selectedProjects,
        is_active: true
    };
    
    // Send invitation email
    fetch('send-invite.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            email: email,
            role: role
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add team member to database
            fetch(API_ENDPOINTS.team, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMember)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Reload data
                    loadData();
                    
                    // Close modal and reset form
                    addMemberModal.hide();
                    document.getElementById('addMemberForm').reset();
                    
                    // Show success message
                    showToast('success', 'Team member added and invitation email sent successfully');
                } else {
                    showToast('error', 'Failed to add team member: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', 'Failed to add team member. Please try again.');
            });
        } else {
            showToast('error', 'Failed to send invitation email: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to send invitation email. Please try again.');
    });
}

// Update member
function updateMember() {
    const memberId = parseInt(document.getElementById('editMemberId').value);
    const name = document.getElementById('editMemberName').value;
    const email = document.getElementById('editMemberEmail').value;
    const role = document.getElementById('editMemberRole').value;
    const projectsSelect = document.getElementById('editMemberProjects');
    
    // Validate inputs
    if (!name || !email || !role) {
        showToast('error', 'Please fill in all required fields');
        return;
    }
    
    // Get selected projects
    const selectedProjects = Array.from(projectsSelect.selectedOptions).map(option => parseInt(option.value));
    
    // Create updated member object
    const updatedMember = {
        id: memberId,
        name,
        email,
        role,
        projects: selectedProjects,
        is_active: true
    };
    
    // Update team member in database
    fetch(API_ENDPOINTS.team, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMember)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload data
            loadData();
            
            // Close modal
            editMemberModal.hide();
            
            // Show success message
            showToast('success', 'Team member updated successfully');
        } else {
            showToast('error', 'Failed to update team member: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to update team member. Please try again.');
    });
}

// Delete member
function deleteMember() {
    const memberId = parseInt(currentMemberId);
    
    // Delete team member from database
    fetch(`${API_ENDPOINTS.team}?id=${memberId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload data
            loadData();
            
            // Close modal
            deleteMemberModal.hide();
            
            // Show success message
            showToast('success', 'Team member removed successfully');
        } else {
            showToast('error', 'Failed to remove team member: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'Failed to remove team member. Please try again.');
    });
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