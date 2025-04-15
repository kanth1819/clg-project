// Import required dependencies
import { showToast } from './toast.js';

// Remove the import and use direct redirection
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        // Basic validation
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    username,
                    password,
                    role
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                localStorage.setItem('registrationSuccess', 'true');
                showToast('Registration successful! Redirecting to login...', 'success');
                // Force redirect to login page after a short delay
                setTimeout(() => {
                    window.location.replace('login.html');
                }, 1500);
            } else {
                // Registration failed
                showToast(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred. Please try again later.', 'error');
        }
    });
});