document.addEventListener('DOMContentLoaded', () => {
    const notificationContainer = document.getElementById('notifications');
    const tabButtons = document.querySelectorAll('.tab');
  
    // Create notification containers dynamically
    const types = ['all', 'unread', 'expiry'];
    types.forEach(type => {
      let container = document.querySelector(`.notification[data-type="${type}"]`);
      if (!container) {
        container = document.createElement('div');
        container.classList.add('notification');
        container.setAttribute('data-type', type);
        notificationContainer.appendChild(container);
      }
    });
  
    initNotificationManager();
  
    function initNotificationManager() {
      initEventListeners();
      fetchNotifications();
    }
  
    function initEventListeners() {
      tabButtons.forEach(tab => {
        tab.addEventListener('click', (event) => {
          showTab(event.target.getAttribute('data-type'));
        });
      });
    }
  
    async function fetchNotifications() {
      try {
        const response = await fetch('/api/notifications', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
  
        if (!response.ok) throw new Error('Failed to fetch notifications');
  
        const result = await response.json();
        displayNotifications(result.data);
        updateTabCounts(result.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        showErrorNotification(error.message);
      }
    }
  
    function displayNotifications(notifications) {
      // Clear existing notifications
      document.querySelectorAll('.notification').forEach(container => {
        container.innerHTML = '';
      });
  
      if (!notifications.length) {
        showNoNotificationsMessage(); // Show on all tabs
        return;
      }
  
      // Sort notifications
      const sorted = [...notifications].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (dateA !== dateB) return dateB - dateA;
  
        if (a.type === 'application' && a.status === 'unread') return -1;
        if (b.type === 'application' && b.status === 'unread') return 1;
        if (a.status === 'unread') return -1;
        if (b.status === 'unread') return 1;
        if (a.type === 'application') return -1;
        if (b.type === 'application') return 1;
  
        return 0;
      });
  
      sorted.forEach(notification => {
        const card = createNotificationCard(notification);
        const typesToAppend = ['all'];
  
        if (notification.status === 'unread') typesToAppend.push('unread');
        if (notification.type === 'membershipExpiry') typesToAppend.push('expiry');
  
        typesToAppend.forEach(type => {
          const container = document.querySelector(`.notification[data-type="${type}"]`);
          if (container) container.appendChild(card.cloneNode(true));
        });
      });
  
      // Add no-notification message to any empty tab
      document.querySelectorAll('.notification').forEach(container => {
        if (container.children.length === 0) {
          container.innerHTML = `
            <div class="no-notifications">
              <i class="fas fa-bell-slash"></i>
              <p>No notifications in this tab</p>
            </div>
          `;
        }
      });
    }
  
    function createNotificationCard(notification) {
      const card = document.createElement('div');
      card.classList.add('notification-card');
      if (notification.status === 'unread') card.classList.add('new');
  
      card.innerHTML = `
        <div class="notification-title">
          <h4>${notification.title} 
            ${notification.status === 'unread' ? '<span class="new-tag">New</span>' : ''}
          </h4>
          <span class="tag">${notification.type}</span>
        </div>
        <div class="date-time">${new Date(notification.createdAt).toLocaleString()}</div>
        <div class="content">${notification.message}</div>
        <div class="actions">
          ${notification.status === 'unread' ? `
            <span class="mark-read" data-id="${notification._id}">
              <i class="fa-solid fa-check-double"></i> Mark as read
            </span>` : ''}
          ${notification.type !== 'application' ? `
            <button class="reminder-btn" data-id="${notification._id}">
              <i class="fa-solid fa-envelope"></i> Send Reminder
            </button>` : ''}
        </div>
      `;
  
      // Add event listeners
      card.querySelector('.mark-read')?.addEventListener('click', () =>
        markNotificationAsRead(notification._id)
      );
  
      card.querySelector('.reminder-btn')?.addEventListener('click', () =>
        sendReminder(notification)
      );
  
      return card;
    }
  
    async function markNotificationAsRead(notificationId) {
      try {
        const res = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH'
        });
        if (!res.ok) throw new Error('Failed to mark as read');
        fetchNotifications(); // Refresh UI
      } catch (error) {
        console.error('Mark read error:', error);
        showErrorNotification(error.message);
      }
    }
  
    function sendReminder(notification) {
      console.log('Sending reminder:', notification);
      toast('Reminder sent successfully', 'success');
    }
  
    function updateTabCounts(notifications) {
      const allTab = document.querySelector('.tab[data-type="all"]');
      const unreadTab = document.querySelector('.tab[data-type="unread"]');
      const expiryTab = document.querySelector('.tab[data-type="expiry"]');
  
      const allCount = notifications.length;
      const unreadCount = notifications.filter(n => n.status === 'unread').length;
      const expiryCount = notifications.filter(n => n.type === 'membershipExpiry').length;
  
      if (allTab) allTab.textContent = `All (${allCount})`;
      if (unreadTab) unreadTab.textContent = `Unread (${unreadCount})`;
      if (expiryTab) expiryTab.textContent = `Membership Expiry (${expiryCount})`;
    }
  
    function showTab(tabType) {
      tabButtons.forEach(tab => tab.classList.remove('active'));
      document.querySelector(`.tab[data-type="${tabType}"]`)?.classList.add('active');
  
      document.querySelectorAll('.notification').forEach(container => {
        container.style.display = (tabType === 'all' || container.dataset.type === tabType) ? 'block' : 'none';
      });
    }
  
    function showErrorNotification(message) {
      toast(message, 'error');
    }
  
    function toast(message, type = 'success') {
      const notification = document.createElement('div');
      notification.classList.add('notification-popup', type);
      notification.textContent = message;
      document.body.appendChild(notification);
  
      setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => document.body.removeChild(notification), 500);
      }, 3000);
    }
  });
  