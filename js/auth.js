/**
 * HR Pro System - Authentication Module
 * Handles user login, logout, and session management
 */

const Auth = {
    // Default admin credentials (hashed)
    defaultAdmin: {
        username: 'admin',
        password: null, // Will be set on first initialization
        role: 'admin',
        name: 'مدير النظام',
        department: 'الإدارة',
        status: 'active'
    },

    /**
     * Initialize authentication system
     */
    async init() {
        // Check if users exist in localStorage
        const users = Utils.storage.get('hr_users', []);
        
        if (users.length === 0) {
            // Create default admin user with company_admin role
            const hashedPassword = await Utils.hashPassword('admin123');
            const adminUser = {
                id: Utils.generateId(),
                username: 'admin',
                password: hashedPassword,
                role: 'company_admin', // Use RBAC role
                name: 'مدير النظام',
                email: 'admin@hrpro.com',
                department: 'الإدارة',
                status: 'active',
                joinDate: new Date().toISOString(),
                isBlocked: false
            };
            users.push(adminUser);
            Utils.storage.set('hr_users', users);
            
            console.log('Default admin created: username=admin, password=admin123');
        }

        // Check for existing session and validate expiration
        const session = Utils.session.get('hr_session');
        if (session && session.userId) {
            // Check session expiration if EnhancedSecurity is available
            if (typeof EnhancedSecurity !== 'undefined') {
                const now = new Date();
                const loginTime = new Date(session.loginTime);
                const expirationHours = EnhancedSecurity.sessionConfig.expirationHours || 24;
                const expirationTime = new Date(loginTime.getTime() + (expirationHours * 60 * 60 * 1000));
                
                if (now > expirationTime) {
                    console.log('Session expired');
                    this.logout();
                    return;
                }
            }
            
            const currentUser = users.find(u => u.id === session.userId);
            if (currentUser && currentUser.status === 'active' && !currentUser.isBlocked) {
                this.showApp();
            } else {
                this.logout();
            }
        }
    },

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<boolean>} Success status
     */
    async login(username, password) {
        try {
            // Check if account is locked due to multiple failed attempts
            if (typeof EnhancedSecurity !== 'undefined' && EnhancedSecurity.isAccountLocked(username)) {
                return false;
            }

            const users = Utils.storage.get('hr_users', []);
            const user = users.find(u => u.username === username);

            if (!user) {
                // Track failed login attempt
                if (typeof EnhancedSecurity !== 'undefined') {
                    EnhancedSecurity.trackLoginAttempt(username, false);
                }
                Utils.showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
                return false;
            }

            // Check if user is blocked
            if (user.isBlocked) {
                Utils.showToast('حسابك محظور. يرجى التواصل مع المدير', 'error');
                return false;
            }

            // Check if user is inactive
            if (user.status !== 'active') {
                Utils.showToast('حسابك غير نشط. يرجى التواصل مع المدير', 'error');
                return false;
            }

            // Hash the entered password and compare
            const hashedPassword = await Utils.hashPassword(password);
            if (hashedPassword !== user.password) {
                // Track failed login attempt
                if (typeof EnhancedSecurity !== 'undefined') {
                    EnhancedSecurity.trackLoginAttempt(username, false);
                }
                Utils.showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
                return false;
            }

            // Track successful login attempt (clear failed attempts)
            if (typeof EnhancedSecurity !== 'undefined') {
                EnhancedSecurity.trackLoginAttempt(username, true);
            }

            // Create session
            const session = {
                userId: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                loginTime: new Date().toISOString()
            };
            Utils.session.set('hr_session', session);

            // Update last login
            user.lastLogin = new Date().toISOString();
            Utils.storage.set('hr_users', users);

            Utils.showToast('تم تسجيل الدخول بنجاح', 'success');
            this.showApp();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            Utils.showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
            return false;
        }
    },

    /**
     * Logout current user
     */
    logout() {
        Utils.session.remove('hr_session');
        window.location.reload();
    },

    /**
     * Get current logged in user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        const session = Utils.session.get('hr_session');
        if (!session || !session.userId) return null;

        const users = Utils.storage.get('hr_users', []);
        return users.find(u => u.id === session.userId) || null;
    },

    /**
     * Check if user is admin (supports both old 'admin' role and new RBAC roles)
     * @returns {boolean} Is admin
     */
    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // Support both old admin role and new RBAC admin roles
        const adminRoles = ['admin', 'super_admin', 'company_admin'];
        return adminRoles.includes(user.role);
    },

    /**
     * Show main application
     */
    showApp() {
        const loginModal = document.getElementById('loginModal');
        const appContainer = document.getElementById('appContainer');

        if (loginModal) loginModal.classList.add('hidden');
        if (appContainer) {
            appContainer.classList.remove('hidden');
            appContainer.classList.add('fade-in');
        }

        // Initialize user info in sidebar
        this.updateUserInfo();
    },

    /**
     * Update user info in sidebar
     */
    updateUserInfo() {
        const user = this.getCurrentUser();
        if (!user) return;

        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) userNameEl.textContent = user.name || user.username;
        
        // Use RBAC role name if available, otherwise fallback to old method
        if (userRoleEl) {
            if (typeof RBAC !== 'undefined' && RBAC.roles[user.role]) {
                userRoleEl.textContent = RBAC.roles[user.role].name;
            } else {
                userRoleEl.textContent = user.role === 'admin' ? 'مدير النظام' : 'موظف';
            }
        }
        
        if (userAvatarEl) {
            // Generate avatar with initials
            const initials = Utils.getInitials(user.name || user.username);
            const color = Utils.generateAvatarColor(user.name || user.username);
            userAvatarEl.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='${encodeURIComponent(color)}' width='100' height='100'/><text x='50' y='50' font-size='40' text-anchor='middle' dy='.3em' fill='white' font-family='Arial'>${initials}</text></svg>`;
        }
    },

    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success status
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                Utils.showToast('يجب تسجيل الدخول أولاً', 'error');
                return false;
            }

            // Verify current password
            const hashedCurrent = await Utils.hashPassword(currentPassword);
            if (hashedCurrent !== user.password) {
                Utils.showToast('كلمة المرور الحالية غير صحيحة', 'error');
                return false;
            }

            // Validate new password
            if (newPassword.length < 6) {
                Utils.showToast('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل', 'error');
                return false;
            }

            // Update password
            const users = Utils.storage.get('hr_users', []);
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex === -1) {
                Utils.showToast('المستخدم غير موجود', 'error');
                return false;
            }

            users[userIndex].password = await Utils.hashPassword(newPassword);
            Utils.storage.set('hr_users', users);

            Utils.showToast('تم تغيير كلمة المرور بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Change password error:', error);
            Utils.showToast('حدث خطأ أثناء تغيير كلمة المرور', 'error');
            return false;
        }
    },

    /**
     * Block/Unblock user (admin only)
     * @param {string} userId - User ID
     * @param {boolean} isBlocked - Block status
     * @returns {boolean} Success status
     */
    toggleUserBlock(userId, isBlocked) {
        if (!this.isAdmin()) {
            Utils.showToast('ليس لديك صلاحية تنفيذ هذا الإجراء', 'error');
            return false;
        }

        const users = Utils.storage.get('hr_users', []);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            Utils.showToast('المستخدم غير موجود', 'error');
            return false;
        }

        // Prevent blocking self
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            Utils.showToast('لا يمكنك حظر نفسك', 'error');
            return false;
        }

        users[userIndex].isBlocked = isBlocked;
        Utils.storage.set('hr_users', users);

        Utils.showToast(
            isBlocked ? 'تم حظر المستخدم بنجاح' : 'تم إلغاء حظر المستخدم بنجاح',
            'success'
        );
        return true;
    },

    /**
     * Register new user
     * @param {Object} userData - User data
     * @returns {Promise<boolean>} Success status
     */
    async register(userData) {
        try {
            const users = Utils.storage.get('hr_users', []);
            
            // Check if username already exists
            if (users.some(u => u.username === userData.username)) {
                Utils.showToast('اسم المستخدم موجود بالفعل', 'error');
                return false;
            }

            // Check if email already exists
            if (userData.email && users.some(u => u.email === userData.email)) {
                Utils.showToast('البريد الإلكتروني موجود بالفعل', 'error');
                return false;
            }

            const newUser = {
                id: Utils.generateId(),
                username: userData.username,
                password: await Utils.hashPassword(userData.password),
                role: userData.role || 'employee',
                name: userData.name || userData.username,
                email: userData.email || '',
                department: userData.department || '',
                status: userData.status || 'active',
                joinDate: userData.joinDate || new Date().toISOString(),
                isBlocked: false
            };

            users.push(newUser);
            Utils.storage.set('hr_users', users);

            Utils.showToast('تم إضافة المستخدم بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Register error:', error);
            Utils.showToast('حدث خطأ أثناء إضافة المستخدم', 'error');
            return false;
        }
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Make Auth available globally
window.Auth = Auth;
