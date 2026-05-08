/**
 * HR Pro System - Main Application Module (Fixed Version)
 * Handles navigation, sidebar, themes, and global functionality
 */

const App = {
    currentTheme: 'light',
    
    init() {
        // Initialize language first
        if (typeof initLanguage === 'function') {
            initLanguage();
        }
        
        this.setupNavigation();
        this.setupSidebar();
        this.setupThemeToggle();
        this.setupSearch();
        this.setupModals();
        this.loadSavedTheme();
        this.checkAuth();
        
        console.log('HR Pro System initialized');
    },

    checkAuth() {
        const session = typeof Utils !== 'undefined' ? Utils.session.get('hr_session') : null;
        if (!session || !session.userId) {
            document.getElementById('loginModal')?.classList.remove('hidden');
            return;
        }
        if (typeof Auth !== 'undefined') {
            Auth.showApp();
        }
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetPage = item.getAttribute('data-page');
                if (!targetPage) return;

                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });

                const targetElement = document.getElementById(`${targetPage}Page`);
                if (targetElement) {
                    targetElement.classList.add('active');
                    this.initializePage(targetPage);
                }

                if (window.innerWidth < 768) {
                    this.closeMobileSidebar();
                }

                history.pushState({ page: targetPage }, '', `#${targetPage}`);
            });
        });

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                const item = document.querySelector(`.nav-item[data-page="${e.state.page}"]`);
                if (item) item.click();
            }
        });

        const hash = window.location.hash.substring(1);
        if (hash) {
            const item = document.querySelector(`.nav-item[data-page="${hash}"]`);
            if (item) setTimeout(() => item.click(), 100);
        }
    },

    initializePage(pageName) {
        const pageModules = {
            'dashboard': () => typeof Dashboard !== 'undefined' && Dashboard.refresh(),
            'employees': () => typeof Employees !== 'undefined' && Employees.renderTable(),
            'tasks': () => typeof Tasks !== 'undefined' && Tasks.renderKanban(),
            'transfers': () => typeof Transfers !== 'undefined' && Transfers.renderTable(),
            'custodies': () => typeof Custodies !== 'undefined' && Custodies.renderTable(),
            'finances': () => {
                if (typeof Finances !== 'undefined') {
                    Finances.renderTable();
                    Finances.updateSummary();
                }
            },
            'reports': () => {},
            'settings': () => typeof Settings !== 'undefined' && Settings.loadSettings()
        };

        if (pageModules[pageName]) {
            setTimeout(() => pageModules[pageName](), 50);
        }
    },

    setupSidebar() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                if (window.innerWidth > 768) {
                    sidebar.classList.toggle('collapsed');
                } else {
                    this.toggleMobileSidebar();
                }
            });
        }

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                overlay?.classList.remove('active');
            }
        });
    },

    toggleMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
    },

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    },

    setupSearch() {
        const searchInput = document.getElementById('globalSearch');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput) return;

        const performSearch = typeof Utils !== 'undefined' ? Utils.debounce((query) => {
            if (!query || query.length < 2) {
                if (searchResults) searchResults.classList.remove('show');
                return;
            }

            const results = [];
            const searchTerm = query.toLowerCase();

            const employees = Utils.storage.get('hr_employees', []);
            employees.forEach(emp => {
                if (emp.fullName.toLowerCase().includes(searchTerm) ||
                    emp.email.toLowerCase().includes(searchTerm) ||
                    emp.position.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'employee',
                        title: emp.fullName,
                        subtitle: emp.position,
                        icon: 'fas fa-user'
                    });
                }
            });

            if (searchResults && results.length > 0) {
                searchResults.innerHTML = results.map(result => `
                    <div class="search-result-item">
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
        }, 300) : null;

        searchInput.addEventListener('input', (e) => {
            if (performSearch) performSearch(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults?.classList.remove('show');
            }
        });
    },

    setupModals() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                if (typeof Auth !== 'undefined') {
                    await Auth.login(username, password);
                }
            });
        }

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal')?.classList.remove('active');
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    },

    loadSavedTheme() {
        const savedTheme = typeof Utils !== 'undefined' ? Utils.storage.get('hr_theme', 'light') : 'light';
        this.applyTheme(savedTheme);
    },

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const languageSelect = document.getElementById('languageSelect');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const themes = ['light', 'dark', 'blue', 'green', 'purple', 'orange', 'red'];
                const currentIndex = themes.indexOf(this.currentTheme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                this.applyTheme(nextTheme);
                
                const themeNames = {
                    'light': 'Light',
                    'dark': 'Dark',
                    'blue': 'Blue',
                    'green': 'Green',
                    'purple': 'Purple',
                    'orange': 'Orange',
                    'red': 'Red'
                };
                
                if (typeof Utils !== 'undefined') {
                    Utils.showToast(`Theme changed to ${themeNames[nextTheme]}`, 'success');
                }
            });
        }
        
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                if (typeof setLanguage === 'function') {
                    setLanguage(e.target.value);
                }
            });
        }
    },

    applyTheme(themeName) {
        const body = document.body;
        body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme', 'orange-theme', 'red-theme');
        body.classList.add(`${themeName}-theme`);
        this.currentTheme = themeName;
        
        if (typeof Utils !== 'undefined') {
            Utils.storage.set('hr_theme', themeName);
        }
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            if (themeName === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    },

    logout() {
        if (confirm(currentLang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Do you want to logout?')) {
            if (typeof Auth !== 'undefined') {
                Auth.logout();
            }
        }
    },

    toggleNotifications() {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (typeof Notifications !== 'undefined') {
                Notifications.markAllAsRead();
            }
        }
    }
};

window.App = App;
window.logout = () => App.logout();
window.toggleNotifications = () => App.toggleNotifications();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
