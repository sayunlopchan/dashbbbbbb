document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include' // Important for handling cookies
                });

                const result = await response.json();

                if (result.success) {
                    // Clear any stored user data
                    localStorage.removeItem('rememberedEmail');
                    
                    // Redirect to login page
                    window.location.href = '/login';
                } else {
                    // Show error message if logout fails
                    console.error('Logout failed:', result.message);
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('An unexpected error occurred during logout.');
            }
        });
    }
}); 