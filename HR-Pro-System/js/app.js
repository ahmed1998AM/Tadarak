/**
 * HR Pro System - Main Application Module
 * Handles navigation, sidebar, and global functionality
 */

const App = {
    /**
     * Initialize application
     */
    init() {
        this.setupNavigation();
        this.setupSidebar();
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
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetPage = link.getAttribute('data-page');
                if (!targetPage) return;

                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

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
                }

                // Update URL hash
                history.pushState({ page: targetPage }, '', `#${targetPage}`);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                const link = document.querySelector(`.nav-link[data-page="${e.state.page}"]`);
                if (link) link.click();
            }
        });

        // Load page from hash on initial load
        const hash = window.location.hash.substring(1);
        if (hash) {
            const link = document.querySelector(`.nav-link[data-page="${hash}"]`);
            if (link) setTimeout(() => link.click(), 100);
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
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar?.classList.remove('active');
            });
        }
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
