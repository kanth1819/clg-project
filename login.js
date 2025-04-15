// Import required dependencies
import { showToast } from './toast.js';

// Remove the import and use direct redirection
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        redirectToDashboard(user.role);
        return;
    }

    // Check if registration was successful
    const registrationSuccess = localStorage.getItem('registrationSuccess');
    if (registrationSuccess === 'true') {
        showToast('Registration successful! Please login with your credentials.', 'success');
        localStorage.removeItem('registrationSuccess');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const userData = await response.json();
                // Store user info in sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                showToast('Login successful! Redirecting to dashboard...', 'success');
                // Redirect based on role after a short delay
                setTimeout(() => {
                    redirectToDashboard(userData.role);
                }, 1500);
            } else {
                showError();
            }
        } catch (error) {
            console.error('Login error:', error);
            showError();
        }
    });

    function showError() {
        showToast('Invalid email or password', 'error');
    }

    function redirectToDashboard(role) {
        // Always redirect to the main dashboard
        window.location.replace('dashboard.html');
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