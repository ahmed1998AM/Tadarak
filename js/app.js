// HR Pro System - Main Application Script

// ===== Global State =====
const AppState = {
    currentLang: 'ar',
    currentTheme: 'light-theme',
    sidebarOpen: false,
    currentUser: null
};

// ===== DOM Elements =====
const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    loginPage: document.getElementById('loginPage'),
    appContainer: document.getElementById('appContainer'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    toggleSidebar: document.getElementById('toggleSidebar'),
    closeSidebar: document.getElementById('closeSidebar'),
    themeToggle: document.getElementById('themeToggle'),
    langToggle: document.getElementById('langToggle'),
    logoutBtn: document.getElementById('logoutBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    contentSections: document.querySelectorAll('.content-section'),
    pageTitle: document.getElementById('pageTitle'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    modalOverlay: document.getElementById('modalOverlay'),
    employeeModal: document.getElementById('employeeModal')
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen
    setTimeout(() => {
        if (elements.loadingScreen) {
            elements.loadingScreen.classList.add('hidden');
        }
    }, 1000);

    // Check authentication
    checkAuth();

    // Setup event listeners
    setupEventListeners();

    // Load saved preferences
    loadPreferences();
});

// ===== Event Listeners Setup =====
function setupEventListeners() {
    // Sidebar toggle
    if (elements.toggleSidebar) {
        elements.toggleSidebar.addEventListener('click', toggleSidebar);
    }

    // Close sidebar
    if (elements.closeSidebar) {
        elements.closeSidebar.addEventListener('click', closeSidebar);
    }

    // Sidebar overlay click
    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    // Language toggle
    if (elements.langToggle) {
        elements.langToggle.addEventListener('click', toggleLanguage);
    }

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }

    // Navigation items
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateTo(section);
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal();
        });
    });

    // Modal overlay click
    if (elements.modalOverlay) {
        elements.modalOverlay.addEventListener('click', closeModal);
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Employee form
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }

    // Add employee button
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => openEmployeeModal());
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close sidebar/modal
        if (e.key === 'Escape') {
            closeSidebar();
            closeModal();
        }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
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
    
    // Prevent body scroll when sidebar is open on mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflow = AppState.sidebarOpen ? 'hidden' : '';
    }
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
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme', 'orange-theme', 'red-theme');
    
    // Add current theme
    document.body.classList.add(AppState.currentTheme);
    
    // Update icon
    if (elements.themeToggle) {
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            if (AppState.currentTheme === 'light-theme') {
                icon.className = 'fas fa-moon';
            } else {
                icon.className = 'fas fa-sun';
            }
        }
    }
}

// ===== Language Functions =====
function toggleLanguage() {
    AppState.currentLang = AppState.currentLang === 'ar' ? 'en' : 'ar';
    
    // Update HTML dir and lang
    document.documentElement.lang = AppState.currentLang;
    document.documentElement.dir = AppState.currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // Update language button text
    if (elements.langToggle) {
        elements.langToggle.textContent = AppState.currentLang === 'ar' ? 'EN' : 'عربي';
    }
    
    // Apply translations
    applyTranslations();
    
    // Save preference
    savePreferences();
}

function applyTranslations() {
    if (!translations || !translations[AppState.currentLang]) return;
    
    const langData = translations[AppState.currentLang];
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (langData[key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = langData[key];
            } else {
                element.textContent = langData[key];
            }
        }
    });
    
    // Update page title based on current section
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const sectionId = activeSection.id.replace('Section', '');
        const navItem = document.querySelector(`.nav-item[data-section="${sectionId.toLowerCase()}"]`);
        if (navItem) {
            const key = navItem.querySelector('span')?.dataset.i18n;
            if (key && langData[key]) {
                elements.pageTitle.textContent = langData[key];
            }
        }
    }
}

// ===== Navigation =====
function navigateTo(section) {
    // Update active nav item
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Show corresponding section
    elements.contentSections.forEach(sec => {
        sec.classList.toggle('active', sec.id === `${section}Section`);
    });
    
    // Update page title
    const activeNavItem = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (activeNavItem) {
        const key = activeNavItem.querySelector('span')?.dataset.i18n;
        if (key && translations && translations[AppState.currentLang]) {
            elements.pageTitle.textContent = translations[AppState.currentLang][key];
        }
    }
    
    // Refresh data for specific sections
    if (section === 'dashboard' && typeof updateDashboard === 'function') {
        updateDashboard();
    } else if (section === 'employees' && typeof renderEmployees === 'function') {
        renderEmployees();
    } else if (section === 'tasks' && typeof renderTasks === 'function') {
        renderTasks();
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
    
    // Simple authentication (replace with real auth in production)
    if (username === 'admin' && password === 'admin123') {
        const user = {
            username: username,
            name: 'Administrator',
            role: 'admin'
        };
        
        localStorage.setItem('hr_user', JSON.stringify(user));
        AppState.currentUser = user;
        
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        showApp();
    } else {
        showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
}

function logout() {
    localStorage.removeItem('hr_user');
    AppState.currentUser = null;
    showLogin();
    showNotification('تم تسجيل الخروج', 'info');
}

function showApp() {
    if (elements.loginPage) {
        elements.loginPage.style.display = 'none';
    }
    if (elements.appContainer) {
        elements.appContainer.style.display = 'flex';
    }
    
    // Update user name display
    if (AppState.currentUser && elements.userNameDisplay) {
        elements.userNameDisplay.textContent = AppState.currentUser.name || AppState.currentUser.username;
    }
    
    // Initialize dashboard
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
}

function showLogin() {
    if (elements.appContainer) {
        elements.appContainer.style.display = 'none';
    }
    if (elements.loginPage) {
        elements.loginPage.style.display = 'flex';
    }
}

// ===== Modal Functions =====
function openEmployeeModal(employee = null) {
    const modal = elements.employeeModal;
    const overlay = elements.modalOverlay;
    
    if (!modal || !overlay) return;
    
    // Reset form
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    
    // Set title
    const title = document.getElementById('employeeModalTitle');
    if (title) {
        title.textContent = employee ? 'تعديل موظف' : 'إضافة موظف';
    }
    
    // Fill data if editing
    if (employee) {
        document.getElementById('employeeId').value = employee.id || '';
        document.getElementById('empName').value = employee.name || '';
        document.getElementById('empJob').value = employee.job || '';
        document.getElementById('empDept').value = employee.department || '';
    }
    
    overlay.classList.add('active');
    modal.classList.add('active');
}

function closeModal() {
    if (elements.modalOverlay) {
        elements.modalOverlay.classList.remove('active');
    }
    if (elements.employeeModal) {
        elements.employeeModal.classList.remove('active');
    }
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('employeeId').value;
    const employee = {
        id: id || Date.now().toString(),
        name: document.getElementById('empName').value,
        job: document.getElementById('empJob').value,
        department: document.getElementById('empDept').value
    };
    
    // Save employee (implement your storage logic)
    if (typeof saveEmployee === 'function') {
        saveEmployee(employee);
    }
    
    closeModal();
    showNotification('تم حفظ الموظف بنجاح', 'success');
    
    // Refresh employees list
    if (typeof renderEmployees === 'function') {
        renderEmployees();
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
        if (elements.langToggle) {
            elements.langToggle.textContent = AppState.currentLang === 'ar' ? 'EN' : 'عربي';
        }
    }
    
    if (savedTheme) {
        AppState.currentTheme = savedTheme;
    }
    
    applyTheme();
    applyTranslations();
}

function savePreferences() {
    localStorage.setItem('hr_lang', AppState.currentLang);
    localStorage.setItem('hr_theme', AppState.currentTheme);
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Remove after 3 seconds
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
window.openEmployeeModal = openEmployeeModal;
window.closeModal = closeModal;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
