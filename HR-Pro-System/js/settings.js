/**
 * HR Pro System - Settings Module
 * Handles system settings, preferences, backup/restore, and data management
 */

class Settings {
    constructor() {
        this.settings = {};
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.render();
    }

    loadSettings() {
        const stored = localStorage.getItem('hrpro_settings');
        if (stored) {
            this.settings = JSON.parse(stored);
        } else {
            this.settings = this.getDefaultSettings();
            this.save();
        }
    }

    getDefaultSettings() {
        return {
            systemName: 'HR Pro System',
            defaultLanguage: 'ar',
            theme: 'light',
            fontSize: 14,
            enableNotifications: true,
            soundNotifications: true,
            sessionTimeout: 30,
            autoBackup: true,
            dateFormat: 'YYYY-MM-DD',
            currency: 'SAR'
        };
    }

    save() {
        localStorage.setItem('hrpro_settings', JSON.stringify(this.settings));
    }

    render() {
        // Populate settings form
        document.getElementById('systemNameInput').value = this.settings.systemName;
        document.getElementById('defaultLanguage').value = this.settings.defaultLanguage;
        document.getElementById('fontSizeSlider').value = this.settings.fontSize;
        document.getElementById('enableNotifications').checked = this.settings.enableNotifications;
        document.getElementById('soundNotifications').checked = this.settings.soundNotifications;

        // Update theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.settings.theme) {
                btn.classList.add('active');
            }
        });
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.save();
        
        // Apply setting immediately
        this.applySetting(key, value);
    }

    applySetting(key, value) {
        switch(key) {
            case 'theme':
                document.body.className = `${value}-theme`;
                break;
            case 'fontSize':
                document.documentElement.style.setProperty('--font-size', `${value}px`);
                break;
            case 'enableNotifications':
                if (!value) {
                    notifications.toggleSound(false);
                }
                break;
            case 'soundNotifications':
                notifications.toggleSound(value);
                break;
            case 'systemName':
                document.title = value;
                document.querySelectorAll('.logo-text').forEach(el => {
                    el.textContent = value;
                });
                break;
        }
    }

    // Backup all data
    backupData() {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: this.settings,
            employees: JSON.parse(localStorage.getItem('hrpro_employees') || '[]'),
            tasks: JSON.parse(localStorage.getItem('hrpro_tasks') || '[]'),
            transfers: JSON.parse(localStorage.getItem('hrpro_transfers') || '[]'),
            custodies: JSON.parse(localStorage.getItem('hrpro_custodies') || '[]'),
            finances: JSON.parse(localStorage.getItem('hrpro_finances') || '[]'),
            users: JSON.parse(localStorage.getItem('hrpro_users') || '[]'),
            activities: JSON.parse(localStorage.getItem('hrpro_activities') || '[]'),
            notifications: JSON.parse(localStorage.getItem('hrpro_notifications') || '[]')
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hrpro-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        notifications.add({
            title: 'تم النسخ الاحتياطي',
            message: 'تم حفظ نسخة احتياطية من جميع البيانات',
            type: 'success',
            icon: 'fas fa-download'
        });
    }

    // Restore data from backup
    restoreData(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (!backup.version || !backup.timestamp) {
                    throw new Error('ملف النسخ الاحتياطي غير صالح');
                }

                if (confirm('هل أنت متأكد من استعادة البيانات؟ سيتم overwrite البيانات الحالية.')) {
                    // Restore each module
                    if (backup.settings) {
                        this.settings = backup.settings;
                        this.save();
                    }
                    if (backup.employees) {
                        localStorage.setItem('hrpro_employees', JSON.stringify(backup.employees));
                    }
                    if (backup.tasks) {
                        localStorage.setItem('hrpro_tasks', JSON.stringify(backup.tasks));
                    }
                    if (backup.transfers) {
                        localStorage.setItem('hrpro_transfers', JSON.stringify(backup.transfers));
                    }
                    if (backup.custodies) {
                        localStorage.setItem('hrpro_custodies', JSON.stringify(backup.custodies));
                    }
                    if (backup.finances) {
                        localStorage.setItem('hrpro_finances', JSON.stringify(backup.finances));
                    }
                    if (backup.users) {
                        localStorage.setItem('hrpro_users', JSON.stringify(backup.users));
                    }
                    if (backup.activities) {
                        localStorage.setItem('hrpro_activities', JSON.stringify(backup.activities));
                    }

                    notifications.add({
                        title: 'تمت الاستعادة',
                        message: 'تم استعادة البيانات بنجاح',
                        type: 'success',
                        icon: 'fas fa-upload'
                    });

                    setTimeout(() => location.reload(), 1000);
                }
            } catch (error) {
                notifications.add({
                    title: 'خطأ',
                    message: 'فشل استعادة البيانات: ' + error.message,
                    type: 'error',
                    icon: 'fas fa-exclamation-triangle'
                });
            }
        };

        reader.readAsText(file);
    }

    // Clear all data
    clearData() {
        if (confirm('⚠️ تحذير: هل أنت متأكد تماماً من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!')) {
            if (confirm('آخر تحذير: سيتم حذف جميع البيانات بشكل نهائي!')) {
                localStorage.removeItem('hrpro_employees');
                localStorage.removeItem('hrpro_tasks');
                localStorage.removeItem('hrpro_transfers');
                localStorage.removeItem('hrpro_custodies');
                localStorage.removeItem('hrpro_finances');
                localStorage.removeItem('hrpro_activities');
                localStorage.removeItem('hrpro_notifications');
                localStorage.removeItem('hrpro_settings');
                
                // Keep users for re-login
                
                notifications.add({
                    title: 'تم المسح',
                    message: 'تم مسح جميع البيانات',
                    type: 'warning',
                    icon: 'fas fa-trash'
                });

                setTimeout(() => location.reload(), 1000);
            }
        }
    }

    // Export settings only
    exportSettings() {
        const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hrpro-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Import settings
    importSettings(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                this.settings = { ...this.settings, ...imported };
                this.save();
                this.render();
                
                notifications.add({
                    title: 'تم الاستيراد',
                    message: 'تم استيراد الإعدادات بنجاح',
                    type: 'success',
                    icon: 'fas fa-check-circle'
                });
            } catch (error) {
                notifications.add({
                    title: 'خطأ',
                    message: 'فشل استيراد الإعدادات',
                    type: 'error',
                    icon: 'fas fa-exclamation-triangle'
                });
            }
        };

        reader.readAsText(file);
    }

    setupEventListeners() {
        // Save general settings
        document.getElementById('saveGeneralSettings')?.addEventListener('click', () => {
            this.updateSetting('systemName', document.getElementById('systemNameInput').value);
            this.updateSetting('defaultLanguage', document.getElementById('defaultLanguage').value);
            
            notifications.add({
                title: 'تم الحفظ',
                message: 'تم حفظ الإعدادات العامة',
                type: 'success',
                icon: 'fas fa-check'
            });
        });

        // Theme selector
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.updateSetting('theme', theme);
                
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Font size slider
        document.getElementById('fontSizeSlider')?.addEventListener('input', (e) => {
            this.updateSetting('fontSize', parseInt(e.target.value));
        });

        // Notifications toggles
        document.getElementById('enableNotifications')?.addEventListener('change', (e) => {
            this.updateSetting('enableNotifications', e.target.checked);
        });

        document.getElementById('soundNotifications')?.addEventListener('change', (e) => {
            this.updateSetting('soundNotifications', e.target.checked);
        });

        // Backup button
        document.getElementById('backupData')?.addEventListener('click', () => {
            this.backupData();
        });

        // Restore button
        document.getElementById('restoreData')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                this.restoreData(e.target.files[0]);
            };
            input.click();
        });

        // Clear data button
        document.getElementById('clearData')?.addEventListener('click', () => {
            this.clearData();
        });
    }
}

const settings = new Settings();
