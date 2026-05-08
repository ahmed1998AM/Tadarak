/**
 * HR Pro System - Main Application Module
 * Handles app initialization, routing, navigation, and global events
 */

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        console.log('HR Pro System Starting...');

        // Initialize authentication
        const isAuthenticated = auth.init();

        if (isAuthenticated) {
            this.showApp();
        } else {
            this.showLogin();
        }

        // Setup global event listeners
        this.setupGlobalListeners();

        // Load Chart.js from CDN if not loaded
        if (typeof Chart === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
        }

        console.log('HR Pro System Ready!');
    }

    // Show login screen
    showLogin() {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('appContainer').classList.add('hidden');
    }

    // Show main app
    showApp() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('appContainer').classList.remove('hidden');

        // Update user info in sidebar
        const user = auth.getCurrentUser();
        if (user) {
            document.getElementById('userName').textContent = user.fullName;
            document.getElementById('headerUserName').textContent = user.fullName;
            document.getElementById('userRole').textContent = this.getRoleName(user.role);
            
            if (user.avatar) {
                document.getElementById('userAvatar').src = user.avatar;
            }
        }

        // Load initial page
        this.navigateTo('dashboard');
    }

    // Get role name
    getRoleName(role) {
        const names = {
            admin: 'مدير النظام',
            manager: 'مدير',
            hr: 'موارد بشرية',
            employee: 'موظف'
        };
        return names[role] || role;
    }

    // Navigate to page
    navigateTo(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Remove active class from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageId}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;

            // Update nav item
            const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }

            // Close mobile menu
            document.getElementById('sidebar').classList.remove('mobile-open');

            // Refresh page data
            this.refreshPage(pageId);
        }
    }

    // Refresh page data
    refreshPage(pageId) {
        switch(pageId) {
            case 'dashboard':
                dashboard?.loadDashboardData();
                break;
            case 'employees':
                employees?.render();
                break;
            case 'tasks':
                tasks?.render();
                break;
            case 'transfers':
                transfers?.render();
                break;
            case 'custodies':
                custodies?.render();
                break;
            case 'finances':
                finances?.render();
                break;
        }
    }

    // Setup global event listeners
    setupGlobalListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            const result = await auth.login(username, password, rememberMe);

            if (result.success) {
                notifications.add({
                    title: 'تم تسجيل الدخول',
                    message: `مرحباً ${result.user.fullName}`,
                    type: 'success',
                    icon: 'fas fa-check-circle'
                });
                this.showApp();
            } else {
                notifications.add({
                    title: 'خطأ',
                    message: result.error,
                    type: 'error',
                    icon: 'fas fa-exclamation-circle'
                });
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });

        // Logout buttons
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('هل تريد تسجيل الخروج؟')) {
                auth.logout();
            }
        });

        document.getElementById('headerLogout')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                auth.logout();
            }
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const currentTheme = document.body.className.includes('dark-theme') ? 'light' : 'dark';
            settings.updateSetting('theme', currentTheme);
        });

        // Language toggle
        document.getElementById('langToggle')?.addEventListener('click', () => {
            const currentLang = document.documentElement.lang;
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            const newDir = newLang === 'ar' ? 'rtl' : 'ltr';
            
            document.documentElement.lang = newLang;
            document.documentElement.dir = newDir;
            
            document.querySelector('.lang-code').textContent = newLang.toUpperCase();
            
            lang?.applyLanguage(newLang);
        });

        // Notifications panel
        document.getElementById('notificationsBtn')?.addEventListener('click', () => {
            document.getElementById('notificationsPanel').classList.toggle('open');
        });

        document.getElementById('closeNotifications')?.addEventListener('click', () => {
            document.getElementById('notificationsPanel').classList.remove('open');
        });

        document.getElementById('markAllRead')?.addEventListener('click', () => {
            notifications.markAllAsRead();
        });

        // Global search
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        // User dropdown
        document.querySelector('.dropdown-toggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('userDropdown').classList.toggle('open');
        });

        document.addEventListener('click', () => {
            document.getElementById('userDropdown')?.classList.remove('open');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K for search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearch')?.focus();
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
                document.getElementById('notificationsPanel')?.classList.remove('open');
            }
        });

        // Modal close on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            dashboard?.handleResize();
        });

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });
    }

    // Handle global search
    handleGlobalSearch(query) {
        if (!query || query.length < 2) return;

        const results = [];

        // Search employees
        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        employees.forEach(emp => {
            if (emp.fullName.toLowerCase().includes(query.toLowerCase()) ||
                emp.email.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'employee',
                    title: emp.fullName,
                    subtitle: emp.position,
                    action: () => employees.viewEmployee(emp.id)
                });
            }
        });

        // Search tasks
        const tasks = JSON.parse(localStorage.getItem('hrpro_tasks') || '[]');
        tasks.forEach(task => {
            if (task.title.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'task',
                    title: task.title,
                    subtitle: task.assignee,
                    action: () => {}
                });
            }
        });

        console.log('Search results:', results);
        // Could show results in a dropdown
    }

    // Handle notification action
    handleNotificationAction(action) {
        if (action.startsWith('transfer:')) {
            const id = parseInt(action.split(':')[1]);
            this.navigateTo('transfers');
            setTimeout(() => transfers.viewDetails(id), 500);
        } else if (action.startsWith('finance:')) {
            const id = parseInt(action.split(':')[1]);
            this.navigateTo('finances');
            setTimeout(() => finances.viewDetails(id), 500);
        }

        document.getElementById('notificationsPanel').classList.remove('open');
    }

    // Load script dynamically
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Initialize app
const app = new App();
