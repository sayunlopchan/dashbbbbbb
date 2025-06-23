const baseUrl = "http://localhost:4000";
// const baseUrl = "https://dashbbbbbb-1.onrender.com";

// token verification
document.addEventListener("DOMContentLoaded", async () => {
  // Function to check authentication status
  async function checkAuthStatus() {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "GET",
        credentials: "include", // Important for sending cookies
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        // Token is invalid or expired
        redirectToLogin();
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      redirectToLogin();
    }
  }

  // Function to redirect to login page
  function redirectToLogin() {
    // Clear any stored tokens or user data
    localStorage.removeItem("rememberedEmail");

    // Redirect to login page
    window.location.href = "/unauthorized";
  }

  // Check authentication status on page load
  await checkAuthStatus();

  // Optional: Add a periodic check for token validity
  setInterval(checkAuthStatus, 5 * 60 * 1000); // Check every 5 minutes
});

// Elements
const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.querySelector(".sidebar");
const mobileToggle = document.getElementById("mobileToggle");

// Restore sidebar state on page load
// Set sidebar to collapsed on mobile, active on desktop
// 992px is the breakpoint used in CSS

document.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth < 992) {
    // Mobile: collapsed by default
    sidebar.classList.remove("active");
    sidebar.classList.add("collapsed");
  } else {
    // Desktop: active by default
    sidebar.classList.add("active");
    sidebar.classList.remove("collapsed");
  }
});

// Desktop toggle
toggleSidebar.addEventListener("click", function () {
  sidebar.classList.toggle("collapsed");
  sidebar.classList.remove("active");
});

// Mobile toggle
mobileToggle.addEventListener("click", function () {
  sidebar.classList.remove("collapsed");
  sidebar.classList.toggle("active");
});

// Global Confirmation Dialog Function
if (typeof window.confirmDialog !== "function") {
  window.confirmDialog = function (options) {
    return new Promise((resolve) => {
      // Create modal elements
      const modal = document.createElement("div");
      modal.className = "modal-overlay";
      modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2>${options.title || "Confirm Action"}</h2>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <p>${
                          options.message ||
                          "Are you sure you want to proceed with this action?"
                        }</p>
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
      const confirmBtn = modal.querySelector("#confirmAction");
      const cancelBtn = modal.querySelector("#cancelAction");

      // Style confirm button based on type
      if (options.type === "delete") {
        confirmBtn.style.backgroundColor = "#e74c3c";
        confirmBtn.style.borderColor = "#e74c3c";
        confirmBtn.style.color = "white";
      } else if (options.type === "warning") {
        confirmBtn.style.backgroundColor = "#f39c12";
        confirmBtn.style.borderColor = "#f39c12";
        confirmBtn.style.color = "white";
      } else {
        confirmBtn.style.backgroundColor = "#3498db";
        confirmBtn.style.borderColor = "#3498db";
        confirmBtn.style.color = "white";
      }

      // Show modal with animation
      setTimeout(() => modal.classList.add("active"), 10);

      // Handle confirm
      confirmBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        setTimeout(() => {
          document.body.removeChild(modal);
          resolve(true);
        }, 300);
      });

      // Handle cancel
      cancelBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        setTimeout(() => {
          document.body.removeChild(modal);
          resolve(false);
        }, 300);
      });

      // Handle click outside
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
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
if (typeof window.toast !== "function") {
  window.toast = function (message, type = "info") {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll(
      ".notification-popup"
    );
    existingNotifications.forEach((notification) => {
      document.body.removeChild(notification);
    });

    // Create notification element
    const notification = document.createElement("div");
    notification.classList.add("notification-popup", type, "show");

    // Define icons for different notification types
    const iconMap = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };

    // Choose icon based on type, default to info icon
    const icon = iconMap[type] || "fa-info-circle";

    // Set notification content
    notification.innerHTML = `
            <i class="fas ${icon}"></i>
            ${message}
        `;

    // Add to body
    document.body.appendChild(notification);

    // Auto-remove notification
    setTimeout(() => {
      notification.classList.remove("show");
      notification.classList.add("hide");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };
}

// Notification Modal Toggle Logic
document.addEventListener("DOMContentLoaded", function () {
  const notificationIcon = document.querySelector('.notification > .fa-bell');
  const notificationModal = document.querySelector('.notification-modal');
  const closeNotificationsBtn = document.querySelector('.close-notifications');
  const notificationList = document.querySelector('.notification-list');
  const notificationBadge = document.querySelector('.notification-badge');

  // Function to fetch notifications
  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications');
      const result = await response.json();

      if (result.success) {
        displayNotifications(result.data);
        updateNotificationBadge(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      notificationList.innerHTML = `
        <div class="notification-empty">
          <p>Error loading notifications. Please try again.</p>
        </div>
      `;
    }
  }

  // Function to display notifications
  function displayNotifications(notifications) {
    if (!notifications || notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="notification-empty">
          <p>No notifications to display</p>
        </div>
      `;
      return;
    }

    // Sort notifications by date (newest first) and unread status
    notifications.sort((a, b) => {
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const notificationsHTML = notifications.map(notification => `
      <div class="notification-item ${notification.status === 'unread' ? 'unread' : ''}" style="cursor: pointer;">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatNotificationDate(notification.createdAt)}</div>
      </div>
    `).join('');

    notificationList.innerHTML = notificationsHTML;

    // Add click handlers for notification items
    document.querySelectorAll('.notification-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        // Mark as read if unread
        if (notifications[index].status === 'unread') {
          markNotificationAsRead(notifications[index]._id);
        }
        // Redirect to notifications page
        window.location.href = '/notifications';
      });
    });
  }

  // Function to format notification date
  function formatNotificationDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diffTime / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Function to update notification badge
  function updateNotificationBadge(notifications) {
    if (!notificationBadge) return; // Skip if badge element doesn't exist
    
    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  // Function to mark notification as read
  async function markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        // Refresh notifications after marking as read
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  if (notificationIcon && notificationModal) {
    // Add click handler for both bell icon and notification badge
    const notificationTriggers = [notificationIcon];
    
    // Only add badge to triggers if it exists
    if (notificationBadge) {
      notificationTriggers.push(notificationBadge);
    }
    
    notificationTriggers.forEach(trigger => {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        notificationModal.classList.toggle('active');
        if (notificationModal.classList.contains('active')) {
          fetchNotifications(); // Fetch notifications when opening modal
        }
      });
    });

    // Close modal when clicking the close button
    if (closeNotificationsBtn) {
      closeNotificationsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notificationModal.classList.remove('active');
      });
    }

    // Close modal when clicking outside
    document.addEventListener('click', function (e) {
      if (
        notificationModal.classList.contains('active') &&
        !notificationModal.contains(e.target) &&
        !notificationIcon.contains(e.target) &&
        (!notificationBadge || !notificationBadge.contains(e.target))
      ) {
        notificationModal.classList.remove('active');
      }
    });
  }

  // Initial fetch of notifications to update badge
  fetchNotifications();

  // Periodically check for new notifications (every 5 minutes)
  setInterval(fetchNotifications, 5 * 60 * 1000);
});
