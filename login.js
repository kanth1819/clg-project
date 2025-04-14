// Import required dependencies
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Get team members from localStorage
        const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
        const user = teamMembers.find(member => member.email === email);

        if (user) {
            // In a real application, you would hash the password and compare properly
            // This is just for demonstration
            if (password === 'password') { // Default password for demonstration
                // Store user info in sessionStorage
                const userInfo = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                };
                sessionStorage.setItem('currentUser', JSON.stringify(userInfo));

                // Redirect based on role
                if (user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'worker-dashboard.html';
                }
            } else {
                showError();
            }
        } else {
            showError();
        }
    });

    function showError() {
        loginError.classList.remove('d-none');
        setTimeout(() => {
            loginError.classList.add('d-none');
        }, 3000);
    }
});

// Check if user is already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
});

// Check if user is already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
});