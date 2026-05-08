/**
 * HR Pro System - Authentication Module
 * Handles user login, logout, session management, and permissions
 */

class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        this.init();
    }

    init() {
        // Check for existing session
        const savedSession = localStorage.getItem('hrpro_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (this.isSessionValid(session)) {
                    this.currentUser = session.user;
                    this.startSessionTimer();
                    return true;
                } else {
                    this.logout();
                }
            } catch (e) {
                this.logout();
            }
        }
        return false;
    }

    // Hash password using SHA-256
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Login function
    async login(username, password, rememberMe = false) {
        try {
            // Get users from database
            const users = this.getUsers();
            
            // Hash the entered password
            const hashedPassword = await this.hashPassword(password);
            
            // Find user
            const user = users.find(u => 
                u.username === username && u.password === hashedPassword
            );

            if (!user) {
                throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
            }

            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('الحساب غير مفعل، يرجى التواصل مع المدير');
            }

            // Create session
            this.currentUser = {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatar: user.avatar || 'assets/images/default-avatar.png',
                department: user.department,
                permissions: user.permissions || this.getDefaultPermissions(user.role)
            };

            // Save session
            const session = {
                user: this.currentUser,
                timestamp: Date.now(),
                rememberMe: rememberMe
            };

            localStorage.setItem('hrpro_session', JSON.stringify(session));
            
            if (rememberMe) {
                localStorage.setItem('hrpro_remember', 'true');
            }

            // Start session timer
            this.startSessionTimer();

            // Log activity
            this.logActivity('login', 'تسجيل الدخول');

            return { success: true, user: this.currentUser };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout function
    logout() {
        if (this.currentUser) {
            this.logActivity('logout', 'تسجيل الخروج');
        }

        localStorage.removeItem('hrpro_session');
        localStorage.removeItem('hrpro_remember');
        this.clearSessionTimer();
        this.currentUser = null;

        // Redirect to login
        window.location.reload();
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check permission
    hasPermission(permission) {
        if (!this.currentUser) return false;
        return this.currentUser.permissions.includes(permission) || 
               this.currentUser.role === 'admin';
    }

    // Get default permissions by role
    getDefaultPermissions(role) {
        const permissions = {
            admin: ['all'],
            manager: ['view_all', 'edit_employees', 'approve_transfers', 'approve_finances', 'view_reports'],
            hr: ['view_all', 'edit_employees', 'manage_tasks', 'view_reports'],
            employee: ['view_own', 'request_transfer', 'request_finance', 'view_own_tasks']
        };
        return permissions[role] || permissions.employee;
    }

    // Get users from storage
    getUsers() {
        const users = localStorage.getItem('hrpro_users');
        if (users) {
            return JSON.parse(users);
        }

        // Default admin user (password: 123456)
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // SHA-256 of 123456
                fullName: 'مدير النظام',
                email: 'admin@hrpro.com',
                role: 'admin',
                department: 'IT',
                status: 'active',
                avatar: 'assets/images/default-avatar.png',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                username: 'manager',
                password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
                fullName: 'مدير القسم',
                email: 'manager@hrpro.com',
                role: 'manager',
                department: 'HR',
                status: 'active',
                avatar: 'assets/images/default-avatar.png',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                username: 'employee',
                password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
                fullName: 'موظف تجريبي',
                email: 'employee@hrpro.com',
                role: 'employee',
                department: 'IT',
                status: 'active',
                avatar: 'assets/images/default-avatar.png',
                createdAt: new Date().toISOString()
            }
        ];

        localStorage.setItem('hrpro_users', JSON.stringify(defaultUsers));
        return defaultUsers;
    }

    // Session validation
    isSessionValid(session) {
        if (!session || !session.user) return false;
        
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        
        // If remember me is set, session lasts 7 days
        const maxAge = session.rememberMe ? (7 * 24 * 60 * 60 * 1000) : this.sessionTimeout;
        
        return sessionAge < maxAge;
    }

    // Session timer
    startSessionTimer() {
        this.clearSessionTimer();
        this.sessionTimer = setTimeout(() => {
            this.showSessionWarning();
        }, this.sessionTimeout - (5 * 60 * 1000)); // Warn 5 minutes before timeout
    }

    clearSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    showSessionWarning() {
        if (confirm('ستنتهي جلسة العمل قريباً، هل تريد البقاء متصلاً؟')) {
            this.extendSession();
        } else {
            this.logout();
        }
    }

    extendSession() {
        const session = JSON.parse(localStorage.getItem('hrpro_session'));
        if (session) {
            session.timestamp = Date.now();
            localStorage.setItem('hrpro_session', JSON.stringify(session));
            this.startSessionTimer();
        }
    }

    // Activity logging
    logActivity(action, description) {
        const activities = this.getActivities();
        activities.unshift({
            id: Date.now(),
            userId: this.currentUser?.id || 0,
            userName: this.currentUser?.fullName || 'Unknown',
            action: action,
            description: description,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }

        localStorage.setItem('hrpro_activities', JSON.stringify(activities));
    }

    getActivities() {
        const activities = localStorage.getItem('hrpro_activities');
        return activities ? JSON.parse(activities) : [];
    }

    // Password reset request
    async requestPasswordReset(email) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, error: 'البريد الإلكتروني غير مسجل' };
        }

        // In a real app, send email with reset token
        // For demo, we'll just generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedTempPassword = await this.hashPassword(tempPassword);

        user.password = hashedTempPassword;
        localStorage.setItem('hrpro_users', JSON.stringify(users));

        return { 
            success: true, 
            message: 'تم إرسال كلمة المرور المؤقتة',
            tempPassword: tempPassword // In real app, send via email
        };
    }

    // Change password
    async changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, error: 'غير مصرح' };
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex === -1) {
            return { success: false, error: 'المستخدم غير موجود' };
        }

        const hashedOldPassword = await this.hashPassword(oldPassword);
        
        if (users[userIndex].password !== hashedOldPassword) {
            return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
        }

        users[userIndex].password = await this.hashPassword(newPassword);
        localStorage.setItem('hrpro_users', JSON.stringify(users));

        this.logActivity('password_change', 'تغيير كلمة المرور');

        return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
    }

    // Update user profile
    updateProfile(profileData) {
        if (!this.currentUser) {
            return { success: false, error: 'غير مصرح' };
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex === -1) {
            return { success: false, error: 'المستخدم غير موجود' };
        }

        users[userIndex] = { ...users[userIndex], ...profileData };
        localStorage.setItem('hrpro_users', JSON.stringify(users));

        this.currentUser = { ...this.currentUser, ...profileData };
        
        const session = JSON.parse(localStorage.getItem('hrpro_session'));
        session.user = this.currentUser;
        localStorage.setItem('hrpro_session', JSON.stringify(session));

        this.logActivity('profile_update', 'تحديث الملف الشخصي');

        return { success: true, message: 'تم تحديث الملف الشخصي' };
    }
}

// Initialize auth instance
const auth = new Auth();
