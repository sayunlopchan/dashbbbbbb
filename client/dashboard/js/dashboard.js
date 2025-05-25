document.addEventListener('DOMContentLoaded', async () => {
    // Function to check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'include', // Important for sending cookies
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (!result.success) {
                // Token is invalid or expired
                redirectToLogin();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            redirectToLogin();
        }
    }

    // Function to redirect to login page
    function redirectToLogin() {
        // Clear any stored tokens or user data
        localStorage.removeItem('rememberedEmail');
        
        // Redirect to login page
        window.location.href = '/unauthorized';
    }

    // Check authentication status on page load
    await checkAuthStatus();

    // Optional: Add a periodic check for token validity
    setInterval(checkAuthStatus, 5 * 60 * 1000); // Check every 5 minutes
}); 