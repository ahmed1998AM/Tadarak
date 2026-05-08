/**
 * HR Pro System - Notifications Module
 * Handles in-app notifications and alerts
 */

const Notifications = {
    // Notification types
    types: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    },

    /**
     * Initialize notifications system
     */
    init() {
        this.loadNotifications();
        this.updateBadge();
        this.setupEventListeners();
    },

    /**
     * Load notifications from localStorage
     * @returns {Array} Notifications array
     */
    loadNotifications() {
        return Utils.storage.get('hr_notifications', []);
    },

    /**
     * Save notifications to localStorage
     * @param {Array} notifications - Notifications to save
     */
    saveNotifications(notifications) {
        Utils.storage.set('hr_notifications', notifications);
    },

    /**
     * Add new notification
     * @param {Object} notification - Notification object
     */
    add(notification) {
        const notifications = this.loadNotifications();
        
        const newNotification = {
            id: Utils.generateId(),
            title: notification.title || 'إشعار',
            message: notification.message || '',
            type: notification.type || this.types.INFO,
            icon: notification.icon || 'fas fa-bell',
            time: new Date().toISOString(),
            read: false,
            action: notification.action || null
        };

        notifications.unshift(newNotification);
        
        // Keep only last 50 notifications
        if (notifications.length > 50) {
            notifications.splice(50);
        }

        this.saveNotifications(notifications);
        this.updateBadge();
        this.render();

        // Show toast for important notifications
        if ([this.types.SUCCESS, this.types.WARNING, this.types.ERROR].includes(newNotification.type)) {
            Utils.showToast(newNotification.message, newNotification.type);
        }
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     */
    markAsRead(notificationId) {
        const notifications = this.loadNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            this.saveNotifications(notifications);
            this.updateBadge();
            this.render();
        }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        const notifications = this.loadNotifications();
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
        this.updateBadge();
        this.render();
    },

    /**
     * Delete notification
     * @param {string} notificationId - Notification ID
     */
    delete(notificationId) {
        let notifications = this.loadNotifications();
        notifications = notifications.filter(n => n.id !== notificationId);
        this.saveNotifications(notifications);
        this.updateBadge();
        this.render();
    },

    /**
     * Clear all notifications
     */
    clearAll() {
        this.saveNotifications([]);
        this.updateBadge();
        this.render();
    },

    /**
     * Update notification badge count
     */
    updateBadge() {
        const notifications = this.loadNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    },

    /**
     * Render notifications dropdown
     */
    render() {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        const notifications = this.loadNotifications();

        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash fa-2x"></i>
                    <p data-lang="noNotifications">لا توجد إشعارات جديدة</p>
                </div>
            `;
            return;
        }

        notificationsList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    <i class="${notification.icon}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${Utils.formatDate(notification.time)}</span>
                </div>
                <button class="notification-delete" onclick="Notifications.delete('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle notifications dropdown
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationsDropdown = document.getElementById('notificationsDropdown');

        if (notificationBtn && notificationsDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsDropdown.classList.toggle('show');
                if (!notificationsDropdown.classList.contains('show')) {
                    this.markAllAsRead();
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                notificationsDropdown.classList.remove('show');
            });
        }

        // Mark all as read button
        const markAllReadBtn = document.querySelector('.mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    },

    /**
     * Notify about new task assignment
     * @param {string} taskTitle - Task title
     * @param {string} assignedTo - Assigned user name
     */
    notifyTaskAssignment(taskTitle, assignedTo) {
        this.add({
            title: 'مهمة جديدة',
            message: `تم إسناد المهمة "${taskTitle}" إليك`,
            type: this.types.INFO,
            icon: 'fas fa-tasks'
        });
    },

    /**
     * Notify about transfer request status
     * @param {string} status - Request status
     * @param {string} details - Request details
     */
    notifyTransferStatus(status, details) {
        const titles = {
            pending: 'طلب نقل جديد',
            approved: 'تم الموافقة على النقل',
            rejected: 'تم رفض النقل'
        };

        const icons = {
            pending: 'fas fa-exchange-alt',
            approved: 'fas fa-check-circle',
            rejected: 'fas fa-times-circle'
        };

        const types = {
            pending: this.types.INFO,
            approved: this.types.SUCCESS,
            rejected: this.types.ERROR
        };

        this.add({
            title: titles[status] || 'تحديث النقل',
            message: details,
            type: types[status] || this.types.INFO,
            icon: icons[status] || 'fas fa-exchange-alt'
        });
    },

    /**
     * Notify about finance request status
     * @param {string} status - Request status
     * @param {string} details - Request details
     */
    notifyFinanceStatus(status, details) {
        const titles = {
            pending: 'طلب سلفة جديد',
            approved: 'تم الموافقة على السلفة',
            rejected: 'تم رفض السلفة',
            paid: 'تم سداد السلفة'
        };

        const icons = {
            pending: 'fas fa-money-bill-wave',
            approved: 'fas fa-check-circle',
            rejected: 'fas fa-times-circle',
            paid: 'fas fa-hand-holding-usd'
        };

        const types = {
            pending: this.types.INFO,
            approved: this.types.SUCCESS,
            rejected: this.types.ERROR,
            paid: this.types.SUCCESS
        };

        this.add({
            title: titles[status] || 'تحديث السلفة',
            message: details,
            type: types[status] || this.types.INFO,
            icon: icons[status] || 'fas fa-money-bill-wave'
        });
    },

    /**
     * Notify about custody assignment
     * @param {string} assetName - Asset name
     * @param {string} assignedTo - Assigned user name
     */
    notifyCustodyAssignment(assetName, assignedTo) {
        this.add({
            title: 'عهد جديدة',
            message: `تم إسناد العهد "${assetName}" إليك`,
            type: this.types.INFO,
            icon: 'fas fa-laptop'
        });
    },

    /**
     * Notify about upcoming deadline
     * @param {string} itemType - Item type (task/custody/etc.)
     * @param {string} itemName - Item name
     * @param {string} dueDate - Due date
     */
    notifyUpcomingDeadline(itemType, itemName, dueDate) {
        this.add({
            title: 'تذكير بالموعد النهائي',
            message: `الموعد النهائي لـ "${itemName}" هو ${Utils.formatDate(dueDate)}`,
            type: this.types.WARNING,
            icon: 'fas fa-clock'
        });
    }
};

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});

// Make Notifications available globally
window.Notifications = Notifications;
