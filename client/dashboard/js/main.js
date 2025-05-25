// const baseUrl = 'http://localhost:4000/api';
const baseUrl = 'https://newdashboard-cron-email.onrender.com/api';


// Toggle sidebar
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mobileToggle = document.getElementById('mobileToggle');

toggleSidebar.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    sidebar.classList.remove('active');
});

mobileToggle.addEventListener('click', function() {
  sidebar.classList.remove('collapsed');
  sidebar.classList.toggle('active');
});

// Global Notification Function
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
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


