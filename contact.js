document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    const showError = (element, message) => {
        const errorElement = document.getElementById(`${element.id}-error`);
        errorElement.textContent = message;
        element.classList.add('error');
    };

    const clearError = (element) => {
        const errorElement = document.getElementById(`${element.id}-error`);
        errorElement.textContent = '';
        element.classList.remove('error');
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = (event) => {
        event.preventDefault();
        let isValid = true;

        // Clear previous errors
        [nameInput, emailInput, messageInput].forEach(input => clearError(input));

        // Validate name
        if (nameInput.value.length < 2) {
            showError(nameInput, 'Name must be at least 2 characters long');
            isValid = false;
        }

        // Validate email
        if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        // Validate message
        if (messageInput.value.length < 10) {
            showError(messageInput, 'Message must be at least 10 characters long');
            isValid = false;
        }

        if (isValid) {
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Simulate form submission
            setTimeout(() => {
                form.reset();
                submitBtn.textContent = 'Message Sent!';
                setTimeout(() => {
                    submitBtn.textContent = 'Send Message';
                    submitBtn.disabled = false;
                }, 2000);
            }, 1500);
        }

        return false;
    };

    form.addEventListener('submit', validateForm);

    // Real-time validation
    [nameInput, emailInput, messageInput].forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                clearError(input);
            }
        });
    });
});