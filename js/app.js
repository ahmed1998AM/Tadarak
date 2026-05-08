/**
 * HR Pro System - Main Application Module
 * Handles navigation, sidebar, and global functionality
 */

const App = {
    /**
     * Initialize application
     */
    init() {
        // Initialize language first
        initLanguage();
        
        this.setupNavigation();
        this.setupSidebar();
        this.setupThemeToggle();
        this.setupSearch();
        this.setupModals();
        this.checkAuth();
        
        console.log('HR Pro System initialized');
    },

    /**
     * Check authentication status
     */
    checkAuth() {
        const session = Utils.session.get('hr_session');
        if (!session || !session.userId) {
            // Show login modal
            document.getElementById('loginModal')?.classList.remove('hidden');
            return;
        }

        // User is logged in
        Auth.showApp();
    },

    /**
     * Setup navigation
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetPage = item.getAttribute('data-page');
                if (!targetPage) return;

                // Update active nav item
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Hide all pages
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });

                // Show target page
                const targetElement = document.getElementById(`${targetPage}Page`);
                if (targetElement) {
                    targetElement.classList.add('active');
                    
                    // Initialize page-specific modules
                    this.initializePage(targetPage);
                }

                // Close mobile sidebar
                if (window.innerWidth < 768) {
                    document.querySelector('.sidebar')?.classList.remove('active');
                    document.querySelector('.sidebar-overlay')?.classList.remove('active');
                }

                // Update URL hash
                history.pushState({ page: targetPage }, '', `#${targetPage}`);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                const item = document.querySelector(`.nav-item[data-page="${e.state.page}"]`);
                if (item) item.click();
            }
        });

        // Load page from hash on initial load
        const hash = window.location.hash.substring(1);
        if (hash) {
            const item = document.querySelector(`.nav-item[data-page="${hash}"]`);
            if (item) setTimeout(() => item.click(), 100);
        }
    },

    /**
     * Initialize page-specific modules
     * @param {string} pageName - Page name
     */
    initializePage(pageName) {
        const pageModules = {
            'dashboard': () => Dashboard.refresh(),
            'employees': () => Employees.renderTable(),
            'tasks': () => Tasks.renderKanban(),
            'transfers': () => Transfers.renderTable(),
            'custodies': () => Custodies.renderTable(),
            'finances': () => {
                Finances.renderTable();
                Finances.updateSummary();
            },
            'reports': () => {},
            'settings': () => Settings.loadSettings()
        };

        if (pageModules[pageName]) {
            setTimeout(() => pageModules[pageName](), 50);
        }
    },

    /**
     * Setup sidebar
     */
    setupSidebar() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        // Toggle sidebar with sidebarToggle button (desktop)
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                if (window.innerWidth > 768) {
                    sidebar.classList.toggle('collapsed');
                } else {
                    sidebar.classList.toggle('active');
                    overlay?.classList.toggle('active');
                }
            });
        }

        // Toggle sidebar with menuToggle button (mobile)
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay?.classList.toggle('active');
            });
        }

        // Close sidebar when clicking on overlay
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar?.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // Close sidebar when clicking on nav item on mobile
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    sidebar?.classList.remove('active');
                    overlay?.classList.remove('active');
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                overlay?.classList.remove('active');
            }
        });
    },

    /**
     * Setup search functionality
     */
    setupSearch() {
        const searchInput = document.getElementById('globalSearch');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput) return;

        const performSearch = Utils.debounce((query) => {
            if (!query || query.length < 2) {
                if (searchResults) searchResults.classList.remove('show');
                return;
            }

            const results = [];
            const searchTerm = query.toLowerCase();

            // Search employees
            const employees = Utils.storage.get('hr_employees', []);
            employees.forEach(emp => {
                if (emp.fullName.toLowerCase().includes(searchTerm) ||
                    emp.email.toLowerCase().includes(searchTerm) ||
                    emp.position.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'employee',
                        title: emp.fullName,
                        subtitle: emp.position,
                        icon: 'fas fa-user',
                        action: () => {
                            document.querySelector('.nav-link[data-page="employees"]')?.click();
                            setTimeout(() => Employees.edit(emp.id), 200);
                        }
                    });
                }
            });

            // Search tasks
            const tasks = Utils.storage.get('hr_tasks', []);
            tasks.forEach(task => {
                if (task.title.toLowerCase().includes(searchTerm) ||
                    task.description.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'task',
                        title: task.title,
                        subtitle: Utils.getStatusLabel(task.status),
                        icon: 'fas fa-tasks',
                        action: () => {
                            document.querySelector('.nav-link[data-page="tasks"]')?.click();
                        }
                    });
                }
            });

            // Display results
            if (searchResults && results.length > 0) {
                searchResults.innerHTML = results.map(result => `
                    <div class="search-result-item" onclick="App.handleSearchResult(this)">
                        <i class="${result.icon}"></i>
                        <div class="search-result-content">
                            <h4>${result.title}</h4>
                            <p>${result.subtitle}</p>
                        </div>
                    </div>
                `).join('');
                searchResults.classList.add('show');
            } else if (searchResults) {
                searchResults.classList.remove('show');
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            performSearch(e.target.value);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults?.classList.remove('show');
            }
        });
    },

    /**
     * Handle search result click
     * @param {HTMLElement} element - Clicked element
     */
    handleSearchResult(element) {
        // This will be called from the inline onclick handler
        const index = Array.from(element.parentNode.children).indexOf(element);
        const results = document.getElementById('searchResults');
        if (results) {
            const items = results.querySelectorAll('.search-result-item');
            if (items[index]) {
                // Store action to be executed after page navigation
                sessionStorage.setItem('pendingAction', index.toString());
            }
        }
    },

    /**
     * Setup modals
     */
    setupModals() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                await Auth.login(username, password);
            });
        }

        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal')?.classList.remove('active');
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    },

    /**
     * Logout
     */
    logout() {
        if (confirm(currentLang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Do you want to logout?')) {
            Auth.logout();
        }
    },

    /**
     * Toggle notifications dropdown
     */
    toggleNotifications() {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            Notifications.markAllAsRead();
        }
    },

    /**
     * Setup theme toggle
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const languageSelect = document.getElementById('languageSelect');
        
        // Theme toggle button
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const body = document.body;
                const icon = themeToggle.querySelector('i');
                
                // Cycle through themes: light -> dark -> blue -> light
                const themes = ['light', 'dark', 'blue'];
                let currentTheme = 'light';
                
                if (body.classList.contains('dark-theme')) {
                    currentTheme = 'dark';
                } else if (body.classList.contains('blue-theme')) {
                    currentTheme = 'blue';
                }
                
                // Get next theme
                const currentIndex = themes.indexOf(currentTheme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                
                // Apply new theme
                body.classList.remove('light-theme', 'dark-theme', 'blue-theme');
                body.classList.add(`${nextTheme}-theme`);
                
                // Update icon
                if (nextTheme === 'dark') {
                    icon.className = 'fas fa-sun';
                } else if (nextTheme === 'blue') {
                    icon.className = 'fas fa-palette';
                } else {
                    icon.className = 'fas fa-moon';
                }
                
                // Save to localStorage
                Utils.storage.set('hr_theme', nextTheme);
                
                // Show toast notification
                const themeNames = {
                    'light': 'الفاتح',
                    'dark': 'الداكن',
                    'blue': 'الأزرق'
                };
                Utils.showToast(`تم تغيير السمة إلى ${themeNames[nextTheme]}`, 'success');
            });
        }
        
        // Language selector
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                setLanguage(e.target.value);
            });
        }
    }
};

// Make App functions available globally
window.App = App;
window.logout = () => App.logout();
window.toggleNotifications = () => App.toggleNotifications();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
