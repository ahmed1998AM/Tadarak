/**
 * HR Pro System - Utility Functions
 * Common helper functions used throughout the application
 */

const Utils = {
    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return 'ID_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Hash password using SHA-256
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Format date to local string
     * @param {Date|string} date - Date to format
     * @param {string} locale - Locale (ar/en)
     * @returns {string} Formatted date
     */
    formatDate(date, locale = 'ar') {
        const d = new Date(date);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', options);
    },

    /**
     * Format currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @param {string} locale - Locale
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'SAR', locale = 'ar') {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @param {string} locale - Locale
     * @returns {string} Formatted number
     */
    formatNumber(num, locale = 'ar') {
        return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(num);
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type (success/error/warning/info)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    /**
     * Confirm action
     * @param {string} message - Confirmation message
     * @returns {Promise<boolean>} User confirmation
     */
    confirm(message) {
        return new Promise((resolve) => {
            if (window.confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    },

    /**
     * Get status badge class
     * @param {string} status - Status value
     * @returns {string} CSS class
     */
    getStatusClass(status) {
        const statusMap = {
            active: 'active',
            inactive: 'inactive',
            on_leave: 'on_leave',
            pending: 'pending',
            approved: 'approved',
            rejected: 'rejected',
            todo: 'pending',
            in_progress: 'approved',
            review: 'pending',
            done: 'approved'
        };
        return statusMap[status] || '';
    },

    /**
     * Get status label
     * @param {string} status - Status value
     * @returns {string} Status label
     */
    getStatusLabel(status) {
        const labels = {
            ar: {
                active: 'نشط',
                inactive: 'غير نشط',
                on_leave: 'في إجازة',
                pending: 'قيد الانتظار',
                approved: 'موافق عليه',
                rejected: 'مرفوض',
                todo: 'للتنفيذ',
                in_progress: 'قيد التنفيذ',
                review: 'مراجعة',
                done: 'مكتمل'
            },
            en: {
                active: 'Active',
                inactive: 'Inactive',
                on_leave: 'On Leave',
                pending: 'Pending',
                approved: 'Approved',
                rejected: 'Rejected',
                todo: 'To Do',
                in_progress: 'In Progress',
                review: 'Review',
                done: 'Done'
            }
        };
        
        const lang = currentLang || 'ar';
        return labels[lang][status] || status;
    },

    /**
     * Export data to CSV
     * @param {Array} data - Data array
     * @param {string} filename - Filename
     */
    exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    `"${row[header] || ''}"`
                ).join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    /**
     * Export data to JSON
     * @param {Array} data - Data array
     * @param {string} filename - Filename
     */
    exportToJSON(data, filename = 'export.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    /**
     * Import JSON file
     * @returns {Promise<Array>} Imported data
     */
    importJSON() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = event => {
                    try {
                        const data = JSON.parse(event.target.result);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = error => reject(error);
                reader.readAsText(file);
            };
            
            input.click();
        });
    },

    /**
     * Validate email
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate phone number
     * @param {string} phone - Phone to validate
     * @returns {boolean} Is valid
     */
    isValidPhone(phone) {
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(phone);
    },

    /**
     * Calculate age from birth date
     * @param {Date|string} birthDate - Birth date
     * @returns {number} Age in years
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    /**
     * Get initials from name
     * @param {string} name - Full name
     * @returns {string} Initials
     */
    getInitials(name) {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * Generate avatar color from name
     * @param {string} name - Name
     * @returns {string} Color hex
     */
    generateAvatarColor(name) {
        const colors = [
            '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    },

    /**
     * LocalStorage wrapper
     */
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error writing to localStorage:', error);
                return false;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    },

    /**
     * SessionStorage wrapper
     */
    session: {
        get(key, defaultValue = null) {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from sessionStorage:', error);
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error writing to sessionStorage:', error);
                return false;
            }
        },
        
        remove(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from sessionStorage:', error);
                return false;
            }
        }
    }
};

// Make Utils available globally
window.Utils = Utils;
