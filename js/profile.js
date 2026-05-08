/**
 * HR Pro System - User Profile Module
 * Handles user profile management, avatar upload, and permissions
 */

const UserProfile = {
    /**
     * Initialize user profile module
     */
    init() {
        this.setupEventListeners();
        this.loadUserProfile();
    },

    /**
     * Setup event listeners for profile modal
     */
    setupEventListeners() {
        // Open profile modal when clicking on user info
        const userInfoSection = document.querySelector('.user-info-section');
        if (userInfoSection) {
            userInfoSection.addEventListener('click', (e) => {
                // Don't open if clicking logout button
                if (!e.target.closest('#logoutBtn')) {
                    this.openProfileModal();
                }
            });
        }

        // Profile form submit
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Change password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeProfileModal());
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    /**
     * Switch between tabs in profile modal
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        const selectedTab = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}Tab`);

        if (selectedTab) selectedTab.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');

        // Load permissions if switching to permissions tab
        if (tabName === 'permissions') {
            this.displayPermissions();
        }
    },

    /**
     * Load current user profile data
     */
    loadUserProfile() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        // Update profile display in modal
        this.updateProfileDisplay(currentUser);
    },

    /**
     * Update profile display in modal
     * @param {Object} user - User data
     */
    updateProfileDisplay(user) {
        // Update avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            if (user.avatar) {
                profileAvatar.src = user.avatar;
            } else {
                const initials = Utils.getInitials(user.name || user.username);
                const color = Utils.generateAvatarColor(user.name || user.username);
                profileAvatar.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='${encodeURIComponent(color)}' width='100' height='100'/><text x='50' y='50' font-size='40' text-anchor='middle' dy='.3em' fill='white' font-family='Arial'>${initials}</text></svg>`;
            }
        }

        // Update profile info fields
        const fields = {
            'profileName': user.name || '',
            'profileEmail': user.email || '',
            'profileUsername': user.username || '',
            'profileDepartment': user.department || '',
            'profilePosition': user.position || '',
            'profilePhone': user.phone || '',
            'profileJoinDate': user.joinDate ? new Date(user.joinDate).toLocaleDateString('ar-EG') : ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value;
                } else {
                    el.textContent = value;
                }
            }
        });

        // Update role badge
        const roleBadge = document.getElementById('profileRoleBadge');
        if (roleBadge) {
            roleBadge.className = `role-badge ${user.role}`;
            roleBadge.textContent = user.role === 'admin' ? 'مدير النظام' : 'موظف';
        }

        // Update status
        const statusBadge = document.getElementById('profileStatusBadge');
        if (statusBadge) {
            statusBadge.className = `status-badge ${user.status}`;
            const statusLabels = {
                'active': 'نشط',
                'inactive': 'غير نشط',
                'on_leave': 'في إجازة'
            };
            statusBadge.textContent = statusLabels[user.status] || user.status;
        }
    },

    /**
     * Open profile modal
     */
    openProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            
            // Reload user data
            this.loadUserProfile();
        }
    },

    /**
     * Close profile modal
     */
    closeProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }, 300);
        }
    },

    /**
     * Handle profile update form submission
     * @param {Event} e - Submit event
     */
    async handleProfileUpdate(e) {
        e.preventDefault();

        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            Utils.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        const updatedData = {
            name: document.getElementById('profileName').value,
            email: document.getElementById('profileEmail').value,
            phone: document.getElementById('profilePhone').value,
            position: document.getElementById('profilePosition').value
        };

        // Validate email
        if (updatedData.email && !Utils.isValidEmail(updatedData.email)) {
            Utils.showToast('البريد الإلكتروني غير صحيح', 'error');
            return;
        }

        // Validate phone
        if (updatedData.phone && !Utils.isValidPhone(updatedData.phone)) {
            Utils.showToast('رقم الهاتف غير صحيح', 'error');
            return;
        }

        try {
            const users = Utils.storage.get('hr_users', []);
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex === -1) {
                Utils.showToast('المستخدم غير موجود', 'error');
                return;
            }

            // Check if email is already taken by another user
            if (updatedData.email && updatedData.email !== currentUser.email) {
                const emailExists = users.some(u => u.email === updatedData.email && u.id !== currentUser.id);
                if (emailExists) {
                    Utils.showToast('البريد الإلكتروني مستخدم بالفعل', 'error');
                    return;
                }
            }

            // Update user data
            users[userIndex] = { ...users[userIndex], ...updatedData };
            Utils.storage.set('hr_users', users);

            // Update session
            const session = Utils.session.get('hr_session');
            if (session) {
                session.name = updatedData.name;
                Utils.session.set('hr_session', session);
            }

            Utils.showToast('تم تحديث الملف الشخصي بنجاح', 'success');
            
            // Update sidebar display
            Auth.updateUserInfo();
            
            // Close modal after delay
            setTimeout(() => this.closeProfileModal(), 1000);
        } catch (error) {
            console.error('Profile update error:', error);
            Utils.showToast('حدث خطأ أثناء تحديث الملف الشخصي', 'error');
        }
    },

    /**
     * Handle avatar upload
     * @param {Event} e - Change event
     */
    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Utils.showToast('يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WebP', 'error');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            Utils.showToast('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const avatarData = event.target.result;
            this.saveAvatar(avatarData);
        };
        reader.onerror = () => {
            Utils.showToast('حدث خطأ أثناء قراءة الصورة', 'error');
        };
        reader.readAsDataURL(file);
    },

    /**
     * Save avatar to user profile
     * @param {string} avatarData - Base64 encoded image
     */
    saveAvatar(avatarData) {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        try {
            const users = Utils.storage.get('hr_users', []);
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex === -1) {
                Utils.showToast('المستخدم غير موجود', 'error');
                return;
            }

            users[userIndex].avatar = avatarData;
            Utils.storage.set('hr_users', users);

            // Update display
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                profileAvatar.src = avatarData;
            }

            // Update sidebar avatar
            Auth.updateUserInfo();

            Utils.showToast('تم تغيير الصورة الشخصية بنجاح', 'success');
        } catch (error) {
            console.error('Avatar save error:', error);
            Utils.showToast('حدث خطأ أثناء حفظ الصورة', 'error');
        }
    },

    /**
     * Handle password change
     * @param {Event} e - Submit event
     */
    async handleChangePassword(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (newPassword.length < 6) {
            Utils.showToast('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            Utils.showToast('كلمات المرور غير متطابقة', 'error');
            return;
        }

        try {
            const success = await Auth.changePassword(currentPassword, newPassword);
            if (success) {
                // Clear form
                document.getElementById('passwordForm').reset();
                // Switch to profile tab
                document.querySelector('[data-tab="profile"]').click();
            }
        } catch (error) {
            console.error('Password change error:', error);
        }
    },

    /**
     * Check user permission
     * @param {string} permission - Permission name
     * @returns {boolean} Has permission
     */
    hasPermission(permission) {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return false;

        // Admin has all permissions
        if (currentUser.role === 'admin') return true;

        // Define permissions by role
        const permissions = {
            employee: [
                'view_tasks', 'edit_own_tasks', 'view_profile', 'edit_own_profile',
                'view_custodies', 'request_advance'
            ],
            manager: [
                'view_tasks', 'edit_tasks', 'assign_tasks', 'view_employees',
                'edit_employees', 'view_custodies', 'manage_custodies',
                'approve_advances', 'view_reports'
            ],
            admin: 'all'
        };

        const userPermissions = permissions[currentUser.role] || [];
        return userPermissions === 'all' || userPermissions.includes(permission);
    },

    /**
     * Get user permissions list
     * @returns {Array} Permissions array
     */
    getUserPermissions() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return [];

        if (currentUser.role === 'admin') {
            return ['all'];
        }

        const permissions = {
            employee: [
                'view_tasks', 'edit_own_tasks', 'view_profile', 'edit_own_profile',
                'view_custodies', 'request_advance'
            ],
            manager: [
                'view_tasks', 'edit_tasks', 'assign_tasks', 'view_employees',
                'edit_employees', 'view_custodies', 'manage_custodies',
                'approve_advances', 'view_reports'
            ]
        };

        return permissions[currentUser.role] || [];
    },

    /**
     * Display permissions in modal
     */
    displayPermissions() {
        const permissionsList = document.getElementById('permissionsList');
        if (!permissionsList) return;

        const permissions = this.getUserPermissions();
        const permissionLabels = {
            'all': 'جميع الصلاحيات',
            'view_tasks': 'عرض المهام',
            'edit_tasks': 'تعديل المهام',
            'assign_tasks': 'تعيين المهام',
            'view_employees': 'عرض الموظفين',
            'edit_employees': 'تعديل الموظفين',
            'view_profile': 'عرض الملف الشخصي',
            'edit_own_profile': 'تعديل الملف الشخصي',
            'view_custodies': 'عرض العهد',
            'manage_custodies': 'إدارة العهد',
            'request_advance': 'طلب سلفة',
            'approve_advances': 'اعتماد السلف',
            'view_reports': 'عرض التقارير'
        };

        if (permissions.includes('all')) {
            permissionsList.innerHTML = '<div class="permission-item all"><i class="fas fa-check-circle"></i> جميع الصلاحيات</div>';
            return;
        }

        permissionsList.innerHTML = permissions
            .map(p => `<div class="permission-item"><i class="fas fa-check"></i> ${permissionLabels[p] || p}</div>`)
            .join('');
    }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    UserProfile.init();
});

// Make available globally
window.UserProfile = UserProfile;
