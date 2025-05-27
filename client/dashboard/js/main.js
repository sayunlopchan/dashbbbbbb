const baseUrl = 'http://localhost:4000';


// token verification
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


// Elements
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mobileToggle = document.getElementById('mobileToggle');

// Restore sidebar state on page load
document.addEventListener('DOMContentLoaded', () => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed');
    const isActive = localStorage.getItem('sidebarActive') === 'true';

    // Default to collapsed if no value is stored
    if (isCollapsed === null || isCollapsed === 'true') {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }

    if (isActive) {
        sidebar.classList.add('active');
    } else {
        sidebar.classList.remove('active');
    }
});

// Desktop toggle
toggleSidebar.addEventListener('click', function () {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    sidebar.classList.remove('active');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    localStorage.setItem('sidebarActive', false);
});

// Mobile toggle
mobileToggle.addEventListener('click', function () {
    sidebar.classList.remove('collapsed');
    const isActive = sidebar.classList.toggle('active');
    localStorage.setItem('sidebarCollapsed', false);
    localStorage.setItem('sidebarActive', isActive);
});



// Global Confirmation Dialog Function
if (typeof window.confirmDialog !== 'function') {
    window.confirmDialog = function(options) {
        return new Promise((resolve) => {
            // Create modal elements
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2>${options.title || 'Confirm Action'}</h2>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <p>${options.message || 'Are you sure you want to proceed with this action?'}</p>
                    </div>
                    <div class="form-actions" style="justify-content: center; gap: 20px;">
                        <button type="button" class="btn btn-secondary" id="cancelAction">Cancel</button>
                        <button type="button" class="btn" id="confirmAction" style="transition: all 0.3s ease;">Confirm</button>
                    </div>
                </div>
            `;

            // Add to body
            document.body.appendChild(modal);

            // Get buttons
            const confirmBtn = modal.querySelector('#confirmAction');
            const cancelBtn = modal.querySelector('#cancelAction');

            // Style confirm button based on type
            if (options.type === 'delete') {
                confirmBtn.style.backgroundColor = '#e74c3c';
                confirmBtn.style.borderColor = '#e74c3c';
                confirmBtn.style.color = 'white';
            } else if (options.type === 'warning') {
                confirmBtn.style.backgroundColor = '#f39c12';
                confirmBtn.style.borderColor = '#f39c12';
                confirmBtn.style.color = 'white';
            } else {
                confirmBtn.style.backgroundColor = '#3498db';
                confirmBtn.style.borderColor = '#3498db';
                confirmBtn.style.color = 'white';
            }

            // Show modal with animation
            setTimeout(() => modal.classList.add('active'), 10);

            // Handle confirm
            confirmBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(true);
                }, 300);
            });

            // Handle cancel
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(false);
                }, 300);
            });

            // Handle click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        resolve(false);
                    }, 300);
                }
            });
        });
    };
}

// Global Notification Function
if (typeof window.toast !== 'function') {
    window.toast = function(message, type = 'info') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification-popup');
        existingNotifications.forEach(notification => {
            document.body.removeChild(notification);
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('notification-popup', type, 'show');
        
        // Define icons for different notification types
        const iconMap = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        // Choose icon based on type, default to info icon
        const icon = iconMap[type] || 'fa-info-circle';
        
        // Set notification content
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            ${message}
        `;
        
        // Add to body
        document.body.appendChild(notification);

        // Auto-remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    };
}
