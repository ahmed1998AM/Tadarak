// HR Pro System - Main Application Script (Fixed Version)

// ===== Global State =====
const AppState = {
    currentLang: 'ar',
    currentTheme: 'light-theme',
    sidebarOpen: false,
    currentUser: null
};

// ===== DOM Elements =====
let elements = {};

// Initialize DOM Elements after DOMContentLoaded
function initElements() {
    elements = {
        loadingScreen: document.getElementById('loadingScreen'),
        loginModal: document.getElementById('loginModal'),
        appContainer: document.getElementById('appContainer'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.querySelector('.sidebar-overlay'),
        menuToggle: document.getElementById('menuToggle'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        themeToggle: document.getElementById('themeToggle'),
        languageSelect: document.getElementById('languageSelect'),
        logoutBtn: document.getElementById('logoutBtn'),
        navItems: document.querySelectorAll('.nav-item'),
        pages: document.querySelectorAll('.page'),
        pageTitle: document.querySelector('.page-header h1'),
        userName: document.getElementById('userName'),
        userRole: document.getElementById('userRole')
    };
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('HR Pro System - Initializing...');
    
    // Initialize DOM Elements first
    initElements();
    
    // Hide loading screen if exists
    if (elements.loadingScreen) {
        setTimeout(() => {
            elements.loadingScreen.classList.add('hidden');
        }, 500);
    }

    // Check authentication
    checkAuth();

    // Setup event listeners
    setupEventListeners();

    // Load saved preferences
    loadPreferences();
    
    // Apply initial theme and language
    applyTheme();
    applyTranslations();
    
    console.log('HR Pro System - Initialized successfully');
});

// ===== Event Listeners Setup =====
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Menu toggle (mobile) - using menuToggle ID from header
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleSidebar);
        console.log('Menu toggle listener added');
    }

    // Sidebar toggle button (if exists in sidebar header)
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
        console.log('Sidebar toggle listener added');
    }

    // Sidebar overlay click
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeSidebar);
        console.log('Sidebar overlay listener added');
    }

    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle listener added');
    }

    // Language select - using change event for dropdown
    if (elements.languageSelect) {
        elements.languageSelect.addEventListener('change', function() {
            AppState.currentLang = this.value;
            document.documentElement.lang = AppState.currentLang;
            document.documentElement.dir = AppState.currentLang === 'ar' ? 'rtl' : 'ltr';
            applyTranslations();
            savePreferences();
            console.log('Language changed to:', AppState.currentLang);
        });
        console.log('Language select listener added');
    }

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
        console.log('Logout listener added');
    }

    // Navigation items - using data-page attribute
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            console.log('Navigating to:', page);
            navigateTo(page);
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    console.log('Navigation listeners added:', elements.navItems.length);

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login form listener added');
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    console.log('Event listeners setup complete');
}

// ===== Sidebar Functions =====
function toggleSidebar() {
    AppState.sidebarOpen = !AppState.sidebarOpen;

    if (elements.sidebar) {
        elements.sidebar.classList.toggle('active', AppState.sidebarOpen);
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.classList.toggle('active', AppState.sidebarOpen);
    }

    if (window.innerWidth <= 768) {
        document.body.style.overflow = AppState.sidebarOpen ? 'hidden' : '';
    }
    
    console.log('Sidebar toggled:', AppState.sidebarOpen);
}

function closeSidebar() {
    AppState.sidebarOpen = false;

    if (elements.sidebar) {
        elements.sidebar.classList.remove('active');
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.classList.remove('active');
    }

    document.body.style.overflow = '';
    
    console.log('Sidebar closed');
}

// ===== Theme Functions =====
function toggleTheme() {
    const themes = ['light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme', 'orange-theme', 'red-theme'];
    const currentIndex = themes.indexOf(AppState.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    AppState.currentTheme = themes[nextIndex];
    
    applyTheme();
    savePreferences();
}

function applyTheme() {
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme', 'orange-theme', 'red-theme');
    document.body.classList.add(AppState.currentTheme);
    
    if (elements.themeToggle) {
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = AppState.currentTheme === 'light-theme' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}

// ===== Language Functions =====
function applyTranslations() {
    if (!translations || !translations[AppState.currentLang]) return;
    
    const langData = translations[AppState.currentLang];
    
    // Translate all elements with data-lang attribute
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.dataset.lang;
        if (langData[key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = langData[key];
            } else {
                element.textContent = langData[key];
            }
        }
    });
    
    // Translate placeholders with data-lang-placeholder
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.dataset.langPlaceholder;
        if (langData[key]) {
            element.placeholder = langData[key];
        }
    });
}

// ===== Navigation =====
function navigateTo(page) {
    console.log('Navigating to page:', page);
    
    if (!page) {
        page = 'dashboard';
    }
    
    // Update active nav item
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Show corresponding page
    elements.pages.forEach(p => {
        const isActive = p.id === page + 'Page';
        p.classList.toggle('active', isActive);
        console.log('Page', p.id, 'active:', isActive);
    });

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        closeSidebar();
    }

    // Update page title
    const activeNavItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNavItem && elements.pageTitle) {
        const span = activeNavItem.querySelector('span');
        if (span && span.dataset.lang) {
            const key = span.dataset.lang;
            if (translations && translations[AppState.currentLang] && translations[AppState.currentLang][key]) {
                elements.pageTitle.textContent = translations[AppState.currentLang][key];
            }
        }
    }

    // Refresh data for specific pages
    if (page === 'dashboard' && typeof updateDashboard === 'function') {
        setTimeout(updateDashboard, 100);
    } else if (page === 'employees' && typeof renderEmployees === 'function') {
        setTimeout(renderEmployees, 100);
    } else if (page === 'tasks' && typeof renderTasks === 'function') {
        setTimeout(renderTasks, 100);
    }
}

// ===== Authentication =====
function checkAuth() {
    const user = localStorage.getItem('hr_user');
    if (user) {
        AppState.currentUser = JSON.parse(user);
        showApp();
    } else {
        showLogin();
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        const user = {
            username: username,
            name: 'Administrator',
            role: 'admin'
        };
        
        localStorage.setItem('hr_user', JSON.stringify(user));
        AppState.currentUser = user;
        
        if (typeof showNotification === 'function') {
            showNotification('تم تسجيل الدخول بنجاح', 'success');
        }
        showApp();
    } else {
        if (typeof showNotification === 'function') {
            showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        }
    }
}

function logout() {
    localStorage.removeItem('hr_user');
    AppState.currentUser = null;
    showLogin();
    if (typeof showNotification === 'function') {
        showNotification('تم تسجيل الخروج', 'info');
    }
}

function showApp() {
    if (elements.loginModal) {
        elements.loginModal.classList.add('hidden');
        elements.loginModal.style.display = 'none';
    }
    if (elements.appContainer) {
        elements.appContainer.classList.remove('hidden');
        elements.appContainer.style.display = 'flex';
    }
    
    if (AppState.currentUser && elements.userName) {
        elements.userName.textContent = AppState.currentUser.name || AppState.currentUser.username;
    }
    
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
}

function showLogin() {
    if (elements.appContainer) {
        elements.appContainer.classList.add('hidden');
        elements.appContainer.style.display = 'none';
    }
    if (elements.loginModal) {
        elements.loginModal.classList.remove('hidden');
        elements.loginModal.style.display = 'flex';
    }
}

// ===== Preferences =====
function loadPreferences() {
    const savedLang = localStorage.getItem('hr_lang');
    const savedTheme = localStorage.getItem('hr_theme');
    
    if (savedLang) {
        AppState.currentLang = savedLang;
        document.documentElement.lang = AppState.currentLang;
        document.documentElement.dir = AppState.currentLang === 'ar' ? 'rtl' : 'ltr';
        if (elements.languageSelect) {
            elements.languageSelect.value = AppState.currentLang;
        }
    }
    
    if (savedTheme) {
        AppState.currentTheme = savedTheme;
    }
}

function savePreferences() {
    localStorage.setItem('hr_lang', AppState.currentLang);
    localStorage.setItem('hr_theme', AppState.currentTheme);
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== Utility Functions =====
function formatDate(date) {
    return new Date(date).toLocaleDateString(AppState.currentLang === 'ar' ? 'ar-EG' : 'en-US');
}

function formatNumber(num) {
    return num.toLocaleString(AppState.currentLang === 'ar' ? 'ar-EG' : 'en-US');
}

// Export functions for use in other modules
window.AppState = AppState;
window.navigateTo = navigateTo;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatNumber = formatNumber;

// Add app.navigate alias for compatibility
window.app = {
    navigate: navigateTo,
    showSection: navigateTo
};

// Add missing exports for sidebar and theme functions
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
