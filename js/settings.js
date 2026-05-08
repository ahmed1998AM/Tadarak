/**
 * HR Pro System - Settings Module
 * Handles application settings and configurations
 */

const Settings = {
    /**
     * Initialize settings module
     */
    init() {
        this.loadSettings();
        this.setupEventListeners();
    },

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        // Load company name
        const companyName = Utils.storage.get('hr_company_name', 'شركة التقنية المتقدمة');
        const companyNameEl = document.getElementById('companyName');
        if (companyNameEl) companyNameEl.value = companyName;

        // Load working hours
        const workingHours = Utils.storage.get('hr_working_hours', '9:00 AM - 5:00 PM');
        const workingHoursEl = document.getElementById('workingHours');
        if (workingHoursEl) workingHoursEl.value = workingHours;

        // Load theme
        const theme = Utils.storage.get('hr_theme', 'light');
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = theme;
        this.applyTheme(theme);

        // Load language
        const language = Utils.storage.get('hr_language', 'ar');
        const languageSelect = document.getElementById('languageSelectSettings');
        if (languageSelect) languageSelect.value = language;

        // Load animations setting
        const enableAnimations = Utils.storage.get('hr_animations', true);
        const animationsCheckbox = document.getElementById('enableAnimations');
        if (animationsCheckbox) animationsCheckbox.checked = enableAnimations;
    },

    /**
     * Save general settings
     * @param {Object} settings - Settings object
     */
    saveGeneral(settings) {
        if (settings.companyName) {
            Utils.storage.set('hr_company_name', settings.companyName);
        }
        if (settings.workingHours) {
            Utils.storage.set('hr_working_hours', settings.workingHours);
        }
        
        Utils.showToast('تم حفظ الإعدادات العامة بنجاح', 'success');
    },

    /**
     * Apply theme
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme');
        document.body.classList.add(`${theme}-theme`);
        Utils.storage.set('hr_theme', theme);
        
        // Dispatch event for other modules to react
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    },

    /**
     * Change theme
     * @param {string} theme - New theme
     */
    changeTheme(theme) {
        this.applyTheme(theme);
        Utils.showToast('تم تغيير السمة بنجاح', 'success');
    },

    /**
     * Change language
     * @param {string} lang - Language code
     */
    changeLanguage(lang) {
        setLanguage(lang);
        Utils.storage.set('hr_language', lang);
        Utils.showToast('تم تغيير اللغة بنجاح', 'success');
    },

    /**
     * Toggle animations
     * @param {boolean} enabled - Enable/disable animations
     */
    toggleAnimations(enabled) {
        Utils.storage.set('hr_animations', enabled);
        
        if (!enabled) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
        
        Utils.showToast(enabled ? 'تم تفعيل الرسوم المتحركة' : 'تم تعطيل الرسوم المتحركة', 'success');
    },

    /**
     * Backup data
     */
    backupData() {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            employees: Utils.storage.get('hr_employees', []),
            tasks: Utils.storage.get('hr_tasks', []),
            transfers: Utils.storage.get('hr_transfers', []),
            custodies: Utils.storage.get('hr_custodies', []),
            finances: Utils.storage.get('hr_finances', []),
            users: Utils.storage.get('hr_users', []),
            settings: {
                companyName: Utils.storage.get('hr_company_name', ''),
                workingHours: Utils.storage.get('hr_working_hours', ''),
                theme: Utils.storage.get('hr_theme', ''),
                language: Utils.storage.get('hr_language', ''),
                animations: Utils.storage.get('hr_animations', true)
            }
        };

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `hr_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        Utils.showToast('تم تحميل النسخة الاحتياطية بنجاح', 'success');
    },

    /**
     * Restore data from backup
     */
    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const backup = JSON.parse(event.target.result);
                    
                    if (!confirm(currentLang === 'ar' 
                        ? 'هل أنت متأكد من استعادة البيانات؟ سيتم استبدال جميع البيانات الحالية.' 
                        : 'Are you sure you want to restore data? All current data will be replaced.')) {
                        return;
                    }

                    // Restore data
                    if (backup.employees) Utils.storage.set('hr_employees', backup.employees);
                    if (backup.tasks) Utils.storage.set('hr_tasks', backup.tasks);
                    if (backup.transfers) Utils.storage.set('hr_transfers', backup.transfers);
                    if (backup.custodies) Utils.storage.set('hr_custodies', backup.custodies);
                    if (backup.finances) Utils.storage.set('hr_finances', backup.finances);
                    if (backup.users) Utils.storage.set('hr_users', backup.users);
                    
                    if (backup.settings) {
                        if (backup.settings.companyName) Utils.storage.set('hr_company_name', backup.settings.companyName);
                        if (backup.settings.workingHours) Utils.storage.set('hr_working_hours', backup.settings.workingHours);
                        if (backup.settings.theme) this.applyTheme(backup.settings.theme);
                        if (backup.settings.language) setLanguage(backup.settings.language);
                        if (backup.settings.animations !== undefined) Utils.storage.set('hr_animations', backup.settings.animations);
                    }

                    Utils.showToast('تم استعادة البيانات بنجاح', 'success');
                    setTimeout(() => location.reload(), 1500);
                } catch (error) {
                    console.error('Restore error:', error);
                    Utils.showToast('حدث خطأ أثناء استعادة البيانات', 'error');
                }
            };
            
            reader.onerror = error => {
                console.error('File read error:', error);
                Utils.showToast('حدث خطأ أثناء قراءة الملف', 'error');
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    },

    /**
     * Clear all data
     */
    clearData() {
        if (!Auth.isAdmin()) {
            Utils.showToast('ليس لديك صلاحية مسح البيانات', 'error');
            return;
        }

        if (!confirm(currentLang === 'ar' 
            ? '⚠️ تحذير: هل أنت متأكد تماماً من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!' 
            : '⚠️ Warning: Are you absolutely sure you want to clear all data? This action cannot be undone!')) {
            return;
        }

        // Additional confirmation
        if (!confirm(currentLang === 'ar' 
            ? 'آخر تحذير: سيتم حذف جميع البيانات نهائياً!' 
            : 'Final warning: All data will be permanently deleted!')) {
            return;
        }

        // Clear all HR-related localStorage items
        const keys = [
            'hr_employees',
            'hr_tasks',
            'hr_transfers',
            'hr_custodies',
            'hr_finances',
            'hr_notifications',
            'hr_company_name',
            'hr_working_hours',
            'hr_theme',
            'hr_language',
            'hr_animations'
        ];

        keys.forEach(key => Utils.storage.remove(key));

        // Keep users but remove all except admin
        const users = Utils.storage.get('hr_users', []);
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
            Utils.storage.set('hr_users', [adminUser]);
        }

        Utils.showToast('تم مسح جميع البيانات بنجاح', 'success');
        setTimeout(() => location.reload(), 1500);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // General settings form
        const generalForm = document.getElementById('generalSettingsForm');
        if (generalForm) {
            generalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                this.saveGeneral({
                    companyName: document.getElementById('companyName').value,
                    workingHours: document.getElementById('workingHours').value
                });
            });
        }

        // Theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }

        // Language select
        const languageSelect = document.getElementById('languageSelectSettings');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }

        // Animations checkbox
        const animationsCheckbox = document.getElementById('enableAnimations');
        if (animationsCheckbox) {
            animationsCheckbox.addEventListener('change', (e) => {
                this.toggleAnimations(e.target.checked);
            });
        }

        // Password change form
        const passwordForm = document.getElementById('passwordChangeForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (!currentPassword || !newPassword || !confirmPassword) {
                    Utils.showToast('جميع الحقول مطلوبة', 'error');
                    return;
                }

                if (newPassword !== confirmPassword) {
                    Utils.showToast('كلمات المرور غير متطابقة', 'error');
                    return;
                }

                if (newPassword.length < 6) {
                    Utils.showToast('يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'error');
                    return;
                }

                const success = await Auth.changePassword(currentPassword, newPassword);
                if (success) {
                    passwordForm.reset();
                }
            });
        }

        // Backup button
        const backupBtn = document.getElementById('backupData');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.backupData();
            });
        }

        // Restore button
        const restoreBtn = document.getElementById('restoreData');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.restoreData();
            });
        }

        // Clear data button
        const clearBtn = document.getElementById('clearData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearData();
            });
        }
    }
};

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('settingsPage')) {
        Settings.init();
    }
});

// Make Settings available globally
window.Settings = Settings;
