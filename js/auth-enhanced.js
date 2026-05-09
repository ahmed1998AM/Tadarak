/**
 * HR Pro System - Enhanced Authentication Module
 * Complete rewrite with API integration, JWT handling, and RBAC support
 */

class AuthManager {
    constructor() {
        this.api = window.api;
        this.rbac = window.rbac;
        this.ui = window.ui;
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.checkAuthState();
        this.setupEventListeners();
        this.setupSessionTimeout();
    }

    /**
     * Check current authentication state
     */
    checkAuthState() {
        if (this.api?.isAuthenticated()) {
            this.currentUser = this.api.getCurrentUser();
            
            // If on login page, redirect to dashboard
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = '/dashboard.html';
            } else {
                this.updateUI();
            }
        } else {
            // If not on login page, redirect to login
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = '/index.html?redirect=' + encodeURIComponent(window.location.pathname);
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Remember me checkbox
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe) {
            rememberMe.addEventListener('change', (e) => {
                localStorage.setItem('remember_me', e.target.checked);
            });
            
            // Restore state
            const wasRemembered = localStorage.getItem('remember_me') === 'true';
            rememberMe.checked = wasRemembered;
        }

        // Password visibility toggle
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = e.target.closest('.password-input-group')?.querySelector('input[type="password"], input[type="text"]');
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    e.target.classList.toggle('fa-eye');
                    e.target.classList.toggle('fa-eye-slash');
                }
            });
        });
    }

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const email = form.querySelector('input[type="email"]')?.value.trim();
        const password = form.querySelector('input[type="password"]')?.value;
        const rememberMe = form.querySelector('#remember-me')?.checked;

        // Validation
        if (!email || !password) {
            this.ui.showToast({
                type: 'error',
                title: 'خطأ',
                message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
                duration: 4000
            });
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';

        try {
            // Call login API
            const response = await this.api.post('/auth/login', {
                email,
                password,
                rememberMe
            });

            // Store tokens
            localStorage.setItem('hrpro_token', response.accessToken);
            localStorage.setItem('hrpro_refresh_token', response.refreshToken);
            
            if (response.user) {
                this.currentUser = response.user;
            } else {
                this.currentUser = this.api.getCurrentUser();
            }

            // Success
            this.ui.showToast({
                type: 'success',
                title: 'نجاح',
                message: `مرحباً ${this.currentUser.name}، تم تسجيل الدخول بنجاح`,
                duration: 2000
            });

            // Redirect
            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = redirect || '/dashboard.html';
            }, 500);

        } catch (error) {
            console.error('Login error:', error);
            
            this.ui.showToast({
                type: 'error',
                title: 'فشل تسجيل الدخول',
                message: error.message || 'حدث خطأ أثناء تسجيل الدخول',
                duration: 5000
            });

            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout API to invalidate token
            await this.api.post('/auth/logout').catch(() => {});
        } finally {
            // Clear local data
            this.api.logout();
            this.currentUser = null;
            
            // Clear any other stored data
            localStorage.removeItem('hrpro_company_id');
            localStorage.removeItem('expanded_submenus');
            
            // Show success message
            this.ui.showToast({
                type: 'success',
                title: 'تم تسجيل الخروج',
                message: 'إلى اللقاء! نتمنى لك يوماً سعيداً',
                duration: 2000
            });

            // Redirect to login
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 500);
        }
    }

    /**
     * Update UI based on auth state
     */
    updateUI() {
        if (!this.currentUser) return;

        // Update user info in header/sidebar
        this.updateUserInfo();

        // Apply RBAC permissions
        if (this.rbac) {
            this.rbac.applyPermissions(this.currentUser.role);
        }

        // Update sidebar if exists
        if (window.sidebar) {
            window.sidebar.updateUserInfo(this.currentUser);
            window.sidebar.applyPermissions(this.currentUser.role);
        }

        // Show/hide elements based on role
        this.updateRoleBasedUI();
    }

    /**
     * Update user info display
     */
    updateUserInfo() {
        // Header user info
        const headerUserName = document.querySelector('.header-user-name');
        const headerUserRole = document.querySelector('.header-user-role');
        const headerUserAvatar = document.querySelector('.user-avatar');

        if (headerUserName) headerUserName.textContent = this.currentUser.name;
        if (headerUserRole) {
            const roleName = this.rbac?.getRoleInfo(this.currentUser.role)?.name || this.currentUser.role;
            headerUserRole.textContent = roleName;
        }
        if (headerUserAvatar && this.currentUser.name) {
            headerUserAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }

        // Profile dropdown
        const profileName = document.querySelector('.profile-dropdown-name');
        const profileEmail = document.querySelector('.profile-dropdown-email');

        if (profileName) profileName.textContent = this.currentUser.name;
        if (profileEmail) profileEmail.textContent = this.currentUser.email;
    }

    /**
     * Update UI elements based on user role
     */
    updateRoleBasedUI() {
        // Hide/show admin-only features
        const adminElements = document.querySelectorAll('[data-requires-admin]');
        adminElements.forEach(el => {
            const isAdmin = this.rbac?.hasLevel(this.currentUser.role, 80);
            el.style.display = isAdmin ? '' : 'none';
        });

        // Update dashboard widgets based on role
        this.updateDashboardWidgets();
    }

    /**
     * Update dashboard widgets based on role
     */
    updateDashboardWidgets() {
        const widgets = document.querySelectorAll('.dashboard-widget');
        
        widgets.forEach(widget => {
            const requiredPermission = widget.dataset.permission;
            
            if (requiredPermission && this.rbac) {
                const hasAccess = this.rbac.can(this.currentUser.role, requiredPermission);
                widget.style.display = hasAccess ? '' : 'none';
            }
        });
    }

    /**
     * Setup session timeout
     */
    setupSessionTimeout() {
        let timeoutWarning;
        let timeoutLogout;
        
        const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
        const LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes total
        
        const showWarning = () => {
            const modal = document.createElement('div');
            modal.className = 'session-warning-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-icon warning">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3>انتهاء الجلسة قريباً</h3>
                    <p>ستنتهي جلستك بسبب عدم النشاط خلال <span id="countdown">5</span> دقائق</p>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="extend-session">تمديد الجلسة</button>
                        <button class="btn btn-secondary" id="logout-now">تسجيل الخروج</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            setTimeout(() => modal.classList.add('show'), 10);
            
            // Countdown
            let secondsLeft = 300;
            const countdownEl = modal.querySelector('#countdown');
            const countdownInterval = setInterval(() => {
                secondsLeft--;
                const minutes = Math.floor(secondsLeft / 60);
                countdownEl.textContent = minutes;
                
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                }
            }, 1000);
            
            // Extend session
            modal.querySelector('#extend-session').addEventListener('click', () => {
                this.extendSession();
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
                clearTimeout(timeoutLogout);
                setupTimers();
            });
            
            // Logout now
            modal.querySelector('#logout-now').addEventListener('click', () => {
                this.logout();
            });
            
            // Close on overlay click
            modal.querySelector('.modal-overlay').addEventListener('click', () => {
                this.extendSession();
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
                clearTimeout(timeoutLogout);
                setupTimers();
            });
        };
        
        const doLogout = () => {
            this.ui.showToast({
                type: 'warning',
                title: 'انتهت الجلسة',
                message: 'تم تسجيل الخروج بسبب عدم النشاط',
                duration: 3000
            });
            
            setTimeout(() => this.logout(), 1000);
        };
        
        const setupTimers = () => {
            clearTimeout(timeoutWarning);
            clearTimeout(timeoutLogout);
            
            timeoutWarning = setTimeout(showWarning, LOGOUT_TIME - WARNING_TIME);
            timeoutLogout = setTimeout(doLogout, LOGOUT_TIME);
        };
        
        // Reset timers on user activity
        const resetTimers = () => {
            if (this.api?.isAuthenticated()) {
                setupTimers();
            }
        };
        
        // Listen for user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimers, true);
        });
        
        // Initial setup
        if (this.api?.isAuthenticated()) {
            setupTimers();
        }
    }

    /**
     * Extend session
     */
    async extendSession() {
        try {
            await this.api.post('/auth/refresh-session');
            this.ui.showToast({
                type: 'success',
                title: 'تم التمديد',
                message: 'تم تمديد الجلسة بنجاح',
                duration: 2000
            });
        } catch (error) {
            console.error('Failed to extend session:', error);
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword, confirmPassword) {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new Error('يرجى ملء جميع الحقول');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('كلمات المرور غير متطابقة');
        }

        if (newPassword.length < 8) {
            throw new Error('يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل');
        }

        // Call API
        await this.api.put('/auth/change-password', {
            currentPassword,
            newPassword
        });

        this.ui.showToast({
            type: 'success',
            title: 'تم التغيير',
            message: 'تم تغيير كلمة المرور بنجاح',
            duration: 3000
        });
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        if (!email) {
            throw new Error('يرجى إدخال البريد الإلكتروني');
        }

        await this.api.post('/auth/forgot-password', { email });

        this.ui.showToast({
            type: 'success',
            title: 'تم الإرسال',
            message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
            duration: 4000
        });
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword, confirmPassword) {
        if (!token || !newPassword || !confirmPassword) {
            throw new Error('بيانات غير كاملة');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('كلمات المرور غير متطابقة');
        }

        await this.api.post('/auth/reset-password', {
            token,
            newPassword
        });

        this.ui.showToast({
            type: 'success',
            title: 'تم التعيين',
            message: 'تم إعادة تعيين كلمة المرور بنجاح',
            duration: 3000
        });
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user has specific permission
     */
    can(permission) {
        return this.rbac?.can(this.currentUser?.role, permission) || false;
    }

    /**
     * Check if user is admin or higher
     */
    isAdmin() {
        return this.rbac?.hasLevel(this.currentUser?.role, 80) || false;
    }

    /**
     * Check if user is super admin
     */
    isSuperAdmin() {
        return this.currentUser?.role === 'super_admin';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
