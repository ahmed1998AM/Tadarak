/**
 * HR Pro System - Enhanced Security & Permissions Module
 * تحسينات الأمان والصلاحيات - إضافة للنظام الحالي
 */

const EnhancedSecurity = {
    // Session configuration
    sessionConfig: {
        expirationHours: 24,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 30
    },

    /**
     * Initialize enhanced security
     */
    init() {
        this.checkSessionExpiration();
        this.monitorActivity();
        this.setupSecurityListeners();
    },

    /**
     * Check if session is expired
     */
    checkSessionExpiration() {
        const session = Utils.session.get('hr_session');
        if (!session) return;

        const now = new Date();
        const loginTime = new Date(session.loginTime);
        const expirationTime = new Date(loginTime.getTime() + (this.sessionConfig.expirationHours * 60 * 60 * 1000));

        if (now > expirationTime) {
            console.log('Session expired');
            Auth.logout();
            Utils.showToast('انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى', 'warning');
        } else {
            // Refresh session warning before expiration
            const warningTime = new Date(expirationTime.getTime() - (15 * 60 * 1000)); // 15 minutes before
            if (now > warningTime) {
                this.showSessionWarning(expirationTime);
            }
        }
    },

    /**
     * Show session expiration warning
     */
    showSessionWarning(expirationTime) {
        const remaining = Math.round((expirationTime - new Date()) / 60000); // minutes
        console.log(`Session expires in ${remaining} minutes`);
        // Could show a modal warning here
    },

    /**
     * Monitor user activity
     */
    monitorActivity() {
        let activityTimer;
        const resetTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                // User inactive for too long
                console.log('User inactive');
            }, 30 * 60 * 1000); // 30 minutes
        };

        // Reset timer on any user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();
    },

    /**
     * Setup security event listeners
     */
    setupSecurityListeners() {
        // Prevent multiple logins from same account
        window.addEventListener('storage', (e) => {
            if (e.key === 'hr_session') {
                // Check if session was cleared in another tab
                if (!e.newValue) {
                    Auth.logout();
                }
            }
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logSecurityEvent('error', event.error.message);
        });

        // Prevent context menu on sensitive areas
        document.addEventListener('contextmenu', (event) => {
            if (event.target.closest('.sensitive-data')) {
                event.preventDefault();
            }
        });
    },

    /**
     * Log security events
     */
    logSecurityEvent(type, details) {
        const logs = Utils.storage.get('hr_security_logs', []);
        logs.unshift({
            id: Utils.generateId(),
            type,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'N/A' // Would need backend for real IP
        });

        // Keep only last 100 logs
        if (logs.length > 100) logs.splice(100);
        Utils.storage.set('hr_security_logs', logs);
    },

    /**
     * Track login attempts
     */
    trackLoginAttempt(username, success) {
        const attempts = Utils.storage.get('hr_login_attempts', {});
        const key = username.toLowerCase();

        if (!success) {
            if (!attempts[key]) {
                attempts[key] = { count: 0, firstAttempt: new Date().toISOString() };
            }
            attempts[key].count++;
            attempts[key].lastAttempt = new Date().toISOString();

            // Lock account after max attempts
            if (attempts[key].count >= this.sessionConfig.maxLoginAttempts) {
                attempts[key].locked = true;
                attempts[key].lockUntil = new Date(Date.now() + (this.sessionConfig.lockoutDurationMinutes * 60 * 1000)).toISOString();
                Utils.showToast('تم قفل الحساب بسبب محاولات الدخول المتكررة', 'error');
            }

            Utils.storage.set('hr_login_attempts', attempts);
            return false;
        } else {
            // Clear attempts on successful login
            delete attempts[key];
            Utils.storage.set('hr_login_attempts', attempts);
            return true;
        }
    },

    /**
     * Check if account is locked
     */
    isAccountLocked(username) {
        const attempts = Utils.storage.get('hr_login_attempts', {});
        const key = username.toLowerCase();
        const attempt = attempts[key];

        if (!attempt || !attempt.locked) return false;

        const lockUntil = new Date(attempt.lockUntil);
        if (new Date() > lockUntil) {
            // Lock expired
            delete attempts[key];
            Utils.storage.set('hr_login_attempts', attempts);
            return false;
        }

        const remaining = Math.round((lockUntil - new Date()) / 60000); // minutes
        Utils.showToast(`الحساب مقفل، حاول بعد ${remaining} دقيقة`, 'error');
        return true;
    }
};

/**
 * Advanced Role-Based Access Control (RBAC) System
 * نظام الصلاحيات المتقدم
 */

const RBAC = {
    // Define all available permissions
    permissions: {
        // Employee management
        'employees.view': 'عرض الموظفين',
        'employees.create': 'إضافة موظف',
        'employees.edit': 'تعديل موظف',
        'employees.delete': 'حذف موظف',
        'employees.export': 'تصدير بيانات الموظفين',

        // Task management
        'tasks.view': 'عرض المهام',
        'tasks.create': 'إنشاء مهمة',
        'tasks.edit': 'تعديل مهمة',
        'tasks.delete': 'حذف مهمة',
        'tasks.assign': 'تعيين مهام',

        // Transfer management
        'transfers.view': 'عرض الانتقالات',
        'transfers.request': 'طلب نقل',
        'transfers.approve': 'موافقة على نقل',

        // Custody management
        'custodies.view': 'عرض العهد',
        'custodies.assign': 'إسناد عهد',
        'custodies.return': 'إرجاع عهد',

        // Finance management
        'finances.view': 'عرض السلف',
        'finances.request': 'طلب سلفة',
        'finances.approve': 'موافقة على سلفة',
        'finances.reject': 'رفض سلفة',

        // Reports
        'reports.view': 'عرض التقارير',
        'reports.employees': 'تقرير الموظفين',
        'reports.tasks': 'تقرير المهام',
        'reports.finances': 'تقرير المالية',
        'reports.attendance': 'تقرير الحضور',
        'reports.generate': 'توليد تقارير',
        'reports.export': 'تصدير تقارير',

        // Settings
        'settings.view': 'عرض الإعدادات',
        'settings.edit': 'تعديل الإعدادات',

        // User management
        'users.view': 'عرض المستخدمين',
        'users.create': 'إضافة مستخدم',
        'users.edit': 'تعديل مستخدم',
        'users.delete': 'حذف مستخدم',
        'users.block': 'حظر/إلغاء حظر'
    },

    // Default roles with permissions
    roles: {
        'super_admin': {
            name: 'مدير النظام الأعلى',
            permissions: Object.keys(RBAC.permissions) // All permissions
        },
        'company_admin': {
            name: 'مدير الشركة',
            permissions: [
                'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.export',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign',
                'transfers.view', 'transfers.request', 'transfers.approve',
                'custodies.view', 'custodies.assign', 'custodies.return',
                'finances.view', 'finances.request', 'finances.approve', 'finances.reject',
                'reports.view', 'reports.employees', 'reports.tasks', 'reports.finances', 'reports.attendance', 'reports.generate', 'reports.export',
                'settings.view', 'settings.edit',
                'users.view', 'users.create', 'users.edit', 'users.block'
            ]
        },
        'hr_manager': {
            name: 'مدير الموارد البشرية',
            permissions: [
                'employees.view', 'employees.create', 'employees.edit',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                'transfers.view', 'transfers.request', 'transfers.approve',
                'custodies.view', 'custodies.assign', 'custodies.return',
                'finances.view', 'finances.request', 'finances.approve',
                'reports.view', 'reports.employees', 'reports.tasks', 'reports.finances', 'reports.attendance', 'reports.generate', 'reports.export',
                'settings.view',
                'users.view'
            ]
        },
        'department_manager': {
            name: 'مدير القسم',
            permissions: [
                'employees.view',
                'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
                'transfers.view', 'transfers.request',
                'custodies.view', 'custodies.assign',
                'finances.view', 'finances.request',
                'reports.view', 'reports.employees', 'reports.tasks', 'reports.generate'
            ]
        },
        'team_lead': {
            name: 'قائد الفريق',
            permissions: [
                'employees.view',
                'tasks.view', 'tasks.create', 'tasks.edit',
                'transfers.view', 'transfers.request',
                'custodies.view',
                'finances.view', 'finances.request',
                'reports.view', 'reports.tasks'
            ]
        },
        'employee': {
            name: 'موظف',
            permissions: [
                'employees.view', // View own profile only
                'tasks.view', 'tasks.create',
                'transfers.view', 'transfers.request',
                'custodies.view',
                'finances.view', 'finances.request',
                'reports.view'
            ]
        },
        'viewer': {
            name: 'مشاهد',
            permissions: [
                'employees.view',
                'tasks.view',
                'transfers.view',
                'custodies.view',
                'finances.view',
                'reports.view'
            ]
        }
    },

    /**
     * Initialize RBAC system
     */
    init() {
        this.loadRoles();
    },

    /**
     * Load custom roles from storage
     */
    loadRoles() {
        const customRoles = Utils.storage.get('hr_custom_roles', {});
        this.roles = { ...this.roles, ...customRoles };
    },

    /**
     * Check if current user has permission
     * @param {string} permission - Permission key (e.g., 'employees.create')
     * @returns {boolean} Has permission
     */
    hasPermission(permission) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        const role = this.roles[user.role];
        if (!role) return false;

        return role.permissions.includes(permission);
    },

    /**
     * Check if current user has any of the permissions
     * @param {Array<string>} permissions - Permission keys
     * @returns {boolean} Has any permission
     */
    hasAnyPermission(permissions) {
        return permissions.some(p => this.hasPermission(p));
    },

    /**
     * Check if current user has all permissions
     * @param {Array<string>} permissions - Permission keys
     * @returns {boolean} Has all permissions
     */
    hasAllPermissions(permissions) {
        return permissions.every(p => this.hasPermission(p));
    },

    /**
     * Get user's role info
     * @returns {Object|null} Role info
     */
    getCurrentUserRole() {
        const user = Auth.getCurrentUser();
        if (!user) return null;
        return this.roles[user.role] || null;
    },

    /**
     * Get user's permissions
     * @returns {Array<string>} Permissions array
     */
    getCurrentUserPermissions() {
        const role = this.getCurrentUserRole();
        if (!role) return [];
        return role.permissions;
    },

    /**
     * Check permission and show error if not authorized
     * @param {string} permission - Permission to check
     * @returns {boolean} Is authorized
     */
    authorize(permission) {
        if (!this.hasPermission(permission)) {
            Utils.showToast('ليس لديك صلاحية تنفيذ هذا الإجراء', 'error');
            return false;
        }
        return true;
    },

    /**
     * Create custom role
     * @param {string} roleId - Role ID
     * @param {string} roleName - Role name
     * @param {Array<string>} permissions - Permissions
     */
    createCustomRole(roleId, roleName, permissions) {
        const customRoles = Utils.storage.get('hr_custom_roles', {});
        customRoles[roleId] = {
            name: roleName,
            permissions
        };
        Utils.storage.set('hr_custom_roles', customRoles);
        this.loadRoles();
        Utils.showToast('تم إنشاء الدور المخصص بنجاح', 'success');
    },

    /**
     * Update role permissions
     * @param {string} roleId - Role ID
     * @param {Array<string>} permissions - New permissions
     */
    updateRolePermissions(roleId, permissions) {
        if (this.roles[roleId]) {
            const customRoles = Utils.storage.get('hr_custom_roles', {});
            if (customRoles[roleId]) {
                customRoles[roleId].permissions = permissions;
                Utils.storage.set('hr_custom_roles', customRoles);
                this.loadRoles();
                Utils.showToast('تم تحديث صلاحيات الدور بنجاح', 'success');
            } else {
                Utils.showToast('لا يمكن تعديل الأدوار الافتراضية', 'error');
            }
        }
    }
};

/**
 * UI Helper Functions for Permissions
 * دوال مساعدة للواجهة للتعامل مع الصلاحيات
 */

const PermissionUI = {
    /**
     * Hide element if user doesn't have permission
     * @param {string} elementId - Element ID
     * @param {string} permission - Required permission
     */
    require(elementId, permission) {
        const element = document.getElementById(elementId);
        if (element && !RBAC.hasPermission(permission)) {
            element.style.display = 'none';
        }
    },

    /**
     * Hide elements by class if user doesn't have permission
     * @param {string} className - Class name
     * @param {string} permission - Required permission
     */
    requireClass(className, permission) {
        const elements = document.querySelectorAll('.' + className);
        elements.forEach(el => {
            if (!RBAC.hasPermission(permission)) {
                el.style.display = 'none';
            }
        });
    },

    /**
     * Disable button if user doesn't have permission
     * @param {string} elementId - Element ID
     * @param {string} permission - Required permission
     */
    enableIfAuthorized(elementId, permission) {
        const element = document.getElementById(elementId);
        if (element) {
            if (!RBAC.hasPermission(permission)) {
                element.disabled = true;
                element.title = 'ليس لديك صلاحية تنفيذ هذا الإجراء';
            }
        }
    },

    /**
     * Render permissions list for current user
     * @param {string} containerId - Container element ID
     */
    renderPermissions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const permissions = RBAC.getCurrentUserPermissions();
        const role = RBAC.getCurrentUserRole();

        if (!role) {
            container.innerHTML = '<p>لم يتم تحديد الدور</p>';
            return;
        }

        container.innerHTML = `
            <div class="role-info">
                <h4>الدور: ${role.name}</h4>
                <p>عدد الصلاحيات: ${permissions.length}</p>
            </div>
            <div class="permissions-grid">
                ${permissions.map(p => `
                    <div class="permission-item ${RBAC.permissions[p] ? 'granted' : ''}">
                        <i class="fas fa-check-circle"></i>
                        <span>${RBAC.permissions[p] || p}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    EnhancedSecurity.init();
    RBAC.init();
});

// Make available globally
window.EnhancedSecurity = EnhancedSecurity;
window.RBAC = RBAC;
window.PermissionUI = PermissionUI;

/**
 * Apply permissions to UI elements on page load
 * Automatically hides/disables elements based on user permissions
 */
const PermissionEnforcer = {
    /**
     * Initialize permission enforcement
     */
    init() {
        this.applyPermissionsToUI();
    },

    /**
     * Apply permissions to all elements with data-permission attribute
     */
    applyPermissionsToUI() {
        // Wait for RBAC to be initialized
        if (typeof RBAC === 'undefined' || !RBAC.init) {
            setTimeout(() => this.applyPermissionsToUI(), 100);
            return;
        }

        const user = Auth.getCurrentUser();
        if (!user) return;

        // Get all elements with data-permission attribute
        const permissionElements = document.querySelectorAll('[data-permission]');
        
        permissionElements.forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');
            
            if (requiredPermission && !RBAC.hasPermission(requiredPermission)) {
                // Hide element if user doesn't have permission
                element.style.display = 'none';
                element.setAttribute('data-hidden-by-permission', 'true');
            }
        });

        // Also check for permission-required class
        const requiredElements = document.querySelectorAll('.permission-required');
        requiredElements.forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');
            
            if (requiredPermission && !RBAC.hasPermission(requiredPermission)) {
                element.style.display = 'none';
                element.setAttribute('data-hidden-by-permission', 'true');
            }
        });

        console.log('Permissions applied to UI elements');
    },

    /**
     * Re-apply permissions (useful after role change)
     */
    refresh() {
        // Show all hidden elements first
        const hiddenElements = document.querySelectorAll('[data-hidden-by-permission]');
        hiddenElements.forEach(element => {
            element.style.display = '';
            element.removeAttribute('data-hidden-by-permission');
        });

        // Re-apply permissions
        this.applyPermissionsToUI();
    }
};

// Initialize permission enforcer when DOM is ready and after RBAC
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PermissionEnforcer.init();
    }, 200);
});

// Make available globally
window.PermissionEnforcer = PermissionEnforcer;
