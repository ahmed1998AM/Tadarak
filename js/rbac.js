/**
 * HR Pro System - Role-Based Access Control (RBAC)
 * Advanced permission management system
 */

class RBACManager {
    constructor() {
        this.roles = {
            super_admin: {
                name: 'مدير النظام العام',
                level: 100,
                permissions: ['*']
            },
            company_owner: {
                name: 'مالك الشركة',
                level: 90,
                permissions: ['*']
            },
            admin: {
                name: 'مدير الشركة',
                level: 80,
                permissions: [
                    'users:*',
                    'employees:*',
                    'departments:*',
                    'tasks:*',
                    'transfers:*',
                    'custodies:*',
                    'loans:*',
                    'reports:*',
                    'settings:*',
                    'audit_logs:view'
                ]
            },
            manager: {
                name: 'مدير القسم',
                level: 60,
                permissions: [
                    'employees:view',
                    'employees:edit',
                    'tasks:*',
                    'transfers:create',
                    'transfers:view',
                    'custodies:view',
                    'loans:view',
                    'reports:view'
                ]
            },
            hr: {
                name: 'موارد بشرية',
                level: 50,
                permissions: [
                    'employees:*',
                    'departments:view',
                    'transfers:create',
                    'transfers:view',
                    'custodies:*',
                    'loans:*',
                    'reports:view'
                ]
            },
            finance: {
                name: 'محاسب',
                level: 50,
                permissions: [
                    'employees:view',
                    'custodies:*',
                    'loans:*',
                    'reports:finance'
                ]
            },
            employee: {
                name: 'موظف',
                level: 10,
                permissions: [
                    'profile:view',
                    'profile:edit',
                    'tasks:view',
                    'transfers:view:own',
                    'custodies:view:own',
                    'loans:view:own'
                ]
            }
        };

        this.permissionMap = new Map();
        this.initializePermissionMap();
    }

    /**
     * Initialize permission map for fast lookup
     */
    initializePermissionMap() {
        Object.entries(this.roles).forEach(([role, data]) => {
            data.permissions.forEach(perm => {
                if (!this.permissionMap.has(perm)) {
                    this.permissionMap.set(perm, []);
                }
                this.permissionMap.get(perm).push(role);
            });
        });
    }

    /**
     * Check if user has specific permission
     */
    can(userRole, permission) {
        if (!userRole || !permission) return false;
        
        const roleData = this.roles[userRole];
        if (!roleData) return false;

        // Super admin and company owner have all permissions
        if (roleData.permissions.includes('*')) return true;

        // Check exact permission match
        if (roleData.permissions.includes(permission)) return true;

        // Check wildcard permissions (e.g., 'users:*' matches 'users:create')
        const [resource, action] = permission.split(':');
        if (action) {
            const wildcardPerm = `${resource}:*`;
            if (roleData.permissions.includes(wildcardPerm)) return true;
        }

        // Check ownership-based permissions (e.g., 'transfers:view:own')
        if (permission.endsWith(':own')) {
            const basePermission = permission.replace(':own', '');
            if (roleData.permissions.includes(basePermission)) return true;
        }

        return false;
    }

    /**
     * Check if user has any of the specified permissions
     */
    canAny(userRole, permissions) {
        return permissions.some(perm => this.can(userRole, perm));
    }

    /**
     * Check if user has all specified permissions
     */
    canAll(userRole, permissions) {
        return permissions.every(perm => this.can(userRole, perm));
    }

    /**
     * Get user's permission level
     */
    getLevel(userRole) {
        const roleData = this.roles[userRole];
        return roleData ? roleData.level : 0;
    }

    /**
     * Check if user role has higher or equal level
     */
    hasLevel(userRole, minLevel) {
        return this.getLevel(userRole) >= minLevel;
    }

    /**
     * Get all permissions for a role
     */
    getRolePermissions(userRole) {
        const roleData = this.roles[userRole];
        return roleData ? roleData.permissions : [];
    }

    /**
     * Get role information
     */
    getRoleInfo(userRole) {
        return this.roles[userRole] || null;
    }

    /**
     * Get all available roles
     */
    getAllRoles() {
        return Object.keys(this.roles);
    }

    /**
     * Check if user can access a resource based on ownership
     */
    canAccessResource(userRole, permission, resourceId, userId, resourceOwnerId) {
        // Check basic permission first
        if (!this.can(userRole, permission)) return false;

        // If permission includes ownership check
        if (permission.endsWith(':own')) {
            return userId === resourceOwnerId;
        }

        return true;
    }

    /**
     * Filter menu items based on user permissions
     */
    filterMenuItems(menuItems, userRole) {
        return menuItems.filter(item => {
            if (!item.permission) return true;
            
            if (Array.isArray(item.permission)) {
                return this.canAny(userRole, item.permission);
            }
            
            return this.can(userRole, item.permission);
        });
    }

    /**
     * Show/hide UI elements based on permissions
     */
    applyPermissions(userRole) {
        // Hide/show elements with data-permission attribute
        document.querySelectorAll('[data-permission]').forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');
            const permissions = requiredPermission.split(',').map(p => p.trim());
            
            const hasAccess = this.canAny(userRole, permissions);
            element.style.display = hasAccess ? '' : 'none';
        });

        // Disable buttons with data-permission-disabled
        document.querySelectorAll('[data-permission-disabled]').forEach(element => {
            const requiredPermission = element.getAttribute('data-permission-disabled');
            const permissions = requiredPermission.split(',').map(p => p.trim());
            
            const hasAccess = this.canAny(userRole, permissions);
            element.disabled = !hasAccess;
        });

        // Add visual indicators for restricted elements
        document.querySelectorAll('[data-restricted]').forEach(element => {
            const requiredPermission = element.getAttribute('data-restricted');
            const permissions = requiredPermission.split(',').map(p => p.trim());
            
            if (!this.canAny(userRole, permissions)) {
                element.classList.add('restricted');
                element.title = 'لا تملك الصلاحية للوصول إلى هذا العنصر';
            }
        });
    }

    /**
     * Validate user action with permission check
     */
    validateAction(userRole, action, callback, errorCallback = null) {
        if (this.can(userRole, action)) {
            if (callback) callback();
            return true;
        } else {
            if (errorCallback) errorCallback();
            else {
                this.showPermissionDenied();
            }
            return false;
        }
    }

    /**
     * Show permission denied notification
     */
    showPermissionDenied() {
        const notification = document.createElement('div');
        notification.className = 'permission-denied-toast';
        notification.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>لا تملك الصلاحية لتنفيذ هذا الإجراء</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Create permission guard for routes/pages
     */
    guard(requiredPermissions, redirectUrl = '/access-denied.html') {
        const currentUser = window.api ? window.api.getCurrentUser() : null;
        
        if (!currentUser) {
            window.location.href = '/index.html';
            return false;
        }

        const hasAccess = Array.isArray(requiredPermissions) 
            ? this.canAny(currentUser.role, requiredPermissions)
            : this.can(currentUser.role, requiredPermissions);

        if (!hasAccess) {
            window.location.href = redirectUrl;
            return false;
        }

        return true;
    }
}

// Create global instance
window.rbac = new RBACManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RBACManager;
}
