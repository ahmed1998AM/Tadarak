/**
 * HR Pro System - Notifications Module
 * Handles real-time notifications, alerts, and notification center
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.soundEnabled = true;
        this.init();
    }

    init() {
        // Load notifications from storage
        this.loadNotifications();
        
        // Setup notification permission
        this.requestPermission();
        
        // Start notification checker
        this.startNotificationChecker();
    }

    // Request browser notification permission
    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    // Load notifications from localStorage
    loadNotifications() {
        const stored = localStorage.getItem('hrpro_notifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
            this.updateUnreadCount();
        }
    }

    // Save notifications to localStorage
    saveNotifications() {
        localStorage.setItem('hrpro_notifications', JSON.stringify(this.notifications));
        this.updateUnreadCount();
    }

    // Add new notification
    add(notification) {
        const newNotification = {
            id: Date.now(),
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info', // info, success, warning, error
            icon: notification.icon || 'fas fa-bell',
            timestamp: new Date().toISOString(),
            read: false,
            action: notification.action || null
        };

        this.notifications.unshift(newNotification);
        
        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications.splice(50);
        }

        this.saveNotifications();
        
        // Show browser notification
        this.showBrowserNotification(newNotification);
        
        // Play sound
        if (this.soundEnabled) {
            this.playNotificationSound();
        }

        // Update UI
        this.updateUI();

        return newNotification;
    }

    // Show browser notification
    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotif = new Notification(notification.title, {
                body: notification.message,
                icon: 'assets/icons/favicon.svg',
                badge: 'assets/icons/favicon.svg',
                tag: notification.id.toString(),
                requireInteraction: false
            });

            browserNotif.onclick = () => {
                window.focus();
                browserNotif.close();
                this.markAsRead(notification.id);
            };
        }
    }

    // Play notification sound
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    // Mark notification as read
    markAsRead(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications[index].read = true;
            this.saveNotifications();
            this.updateUI();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateUI();
    }

    // Delete notification
    delete(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.updateUI();
    }

    // Clear all notifications
    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.updateUI();
    }

    // Update unread count
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    // Update UI elements
    updateUI() {
        // Update badge count
        const badge = document.getElementById('notificationsCount');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }

        // Update notifications panel
        this.renderNotificationsPanel();
    }

    // Render notifications panel
    renderNotificationsPanel() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p data-lang="noNotifications">لا توجد إشعارات</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon ${notif.type}">
                    <i class="${notif.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4>${notif.title}</h4>
                        <span class="notification-time">${this.formatTime(notif.timestamp)}</span>
                    </div>
                    <p>${notif.message}</p>
                    ${notif.action ? `
                        <button class="btn btn-sm btn-outline" onclick="app.handleNotificationAction('${notif.action}')">
                            ${notif.actionLabel || 'عرض'}
                        </button>
                    ` : ''}
                </div>
                <button class="btn btn-icon-sm delete-notification" onclick="notifications.delete(${notif.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    // Format time ago
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'الآن';
        } else if (diffMins < 60) {
            return `منذ ${diffMins} دقيقة`;
        } else if (diffHours < 24) {
            return `منذ ${diffHours} ساعة`;
        } else if (diffDays < 7) {
            return `منذ ${diffDays} أيام`;
        } else {
            return date.toLocaleDateString('ar-SA');
        }
    }

    // Start notification checker for periodic updates
    startNotificationChecker() {
        setInterval(() => {
            this.checkForUpdates();
        }, 30000); // Check every 30 seconds
    }

    // Check for new notifications (simulated)
    checkForUpdates() {
        // In a real app, this would poll the server
        // For demo, we'll just check for any pending actions
        this.checkPendingActions();
    }

    // Check for pending actions that need notifications
    checkPendingActions() {
        const transfers = JSON.parse(localStorage.getItem('hrpro_transfers') || '[]');
        const finances = JSON.parse(localStorage.getItem('hrpro_finances') || '[]');
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        // Check for pending transfer approvals
        const pendingTransfers = transfers.filter(t => 
            t.status === 'pending' && t.approverId === currentUser.id
        );

        pendingTransfers.forEach(transfer => {
            const existingNotif = this.notifications.find(n => 
                n.action === `transfer:${transfer.id}` && !n.read
            );

            if (!existingNotif) {
                this.add({
                    title: 'طلب نقل جديد',
                    message: `لديك طلب نقل جديد من ${transfer.employeeName}`,
                    type: 'warning',
                    icon: 'fas fa-exchange-alt',
                    action: `transfer:${transfer.id}`,
                    actionLabel: 'مراجعة'
                });
            }
        });

        // Check for pending finance approvals
        const pendingFinances = finances.filter(f => 
            f.status === 'pending' && f.approverId === currentUser.id
        );

        pendingFinances.forEach(finance => {
            const existingNotif = this.notifications.find(n => 
                n.action === `finance:${finance.id}` && !n.read
            );

            if (!existingNotif) {
                this.add({
                    title: 'طلب سلفة جديد',
                    message: `لديك طلب سلفة جديد من ${finance.employeeName}`,
                    type: 'warning',
                    icon: 'fas fa-money-bill-wave',
                    action: `finance:${finance.id}`,
                    actionLabel: 'مراجعة'
                });
            }
        });
    }

    // Toggle sound setting
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('hrpro_notif_sound', enabled.toString());
    }

    // Load sound setting
    loadSoundSetting() {
        const saved = localStorage.getItem('hrpro_notif_sound');
        this.soundEnabled = saved !== 'false';
    }
}

// Initialize notifications instance
const notifications = new NotificationManager();
