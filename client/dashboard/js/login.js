document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic client-side validation
        if (!emailInput.value || !passwordInput.value) {
            showErrorMessage('Please enter both email and password');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            const result = await response.json();

            if (result.success) {
                // Remember me functionality
                if (rememberCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', emailInput.value);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Redirect to dashboard or show success message
                window.location.href = '/dashboard';
            } else {
                // Show error message from server
                showErrorMessage(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showErrorMessage('An unexpected error occurred. Please try again.');
        }
    });

    // Populate remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }

    // Error message display function
    function showErrorMessage(message) {
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create and insert error message
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message');
        errorDiv.textContent = message;
        
        // Insert after the login header
        const loginHeader = document.querySelector('.login-header');
        loginHeader.insertAdjacentElement('afterend', errorDiv);
    }

    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password a');
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Forgot password functionality will be implemented soon.');
    });

    // Sign up link
    const signUpLink = document.querySelector('.register-link a');
    signUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Sign up functionality will be implemented soon.');
    });
}); 