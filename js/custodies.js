/**
 * HR Pro System - Custodies Module
 * Handles asset and custody management
 */

const Custodies = {
    // Asset types
    assetTypes: [
        'كمبيوتر محمول',
        'هاتف جوال',
        'تابلت',
        'شاشة',
        'لوحة مفاتيح',
        'ماوس',
        'سماعة',
        'كرسي مكتب',
        'مكتب',
        'أخرى'
    ],

    /**
     * Permission checks using RBAC
     */
    canAssign() {
        return RBAC.hasPermission('custodies.assign');
    },
    
    canReturn() {
        return RBAC.hasPermission('custodies.return');
    },
    
    canDelete() {
        return RBAC.hasPermission('custodies.delete');
    },

    /**
     * Initialize custodies module
     */
    init() {
        this.loadCustodies();
        this.setupEventListeners();
        this.renderTable();
        this.checkAlerts();
        this.applyPermissions();
    },

    /**
     * Load custodies from localStorage
     * @returns {Array} Custodies array
     */
    loadCustodies() {
        return Utils.storage.get('hr_custodies', []);
    },

    /**
     * Save custodies to localStorage
     * @param {Array} custodies - Custodies to save
     */
    saveCustodies(custodies) {
        Utils.storage.set('hr_custodies', custodies);
        this.triggerDataChanged();
    },

    /**
     * Add new custody
     * @param {Object} custodyData - Custody data
     * @returns {boolean} Success status
     */
    add(custodyData) {
        try {
            // Check permission
            if (!this.canAssign()) {
                Utils.showToast('ليس لديك صلاحية إسناد عهد', 'error');
                return false;
            }

            const custodies = this.loadCustodies();

            const newCustody = {
                id: Utils.generateId(),
                assetId: custodyData.assetId,
                assetName: custodyData.assetName,
                assetType: custodyData.assetType,
                assignedTo: custodyData.assignedTo,
                assignmentDate: custodyData.assignmentDate || new Date().toISOString(),
                expectedReturnDate: custodyData.expectedReturnDate || null,
                status: 'assigned',
                condition: custodyData.condition || 'good',
                notes: custodyData.notes || '',
                createdAt: new Date().toISOString()
            };

            custodies.push(newCustody);
            this.saveCustodies(custodies);

            Utils.showToast('تم إضافة العهد بنجاح', 'success');
            
            // Notify assigned user (only if Notifications is available)
            if (typeof Notifications !== 'undefined' && newCustody.assignedTo) {
                try {
                    Notifications.notifyCustodyAssignment(newCustody.assetName, newCustody.assignedTo);
                } catch (e) {
                    console.log('Notification error:', e);
                }
            }

            return true;
        } catch (error) {
            console.error('Add custody error:', error);
            Utils.showToast('حدث خطأ أثناء إضافة العهد', 'error');
            return false;
        }
    },

    /**
     * Return custody
     * @param {string} id - Custody ID
     * @returns {boolean} Success status
     */
    return(id) {
        try {
            // Check permission
            if (!this.canReturn()) {
                Utils.showToast('ليس لديك صلاحية إرجاع عهد', 'error');
                return false;
            }

            const custodies = this.loadCustodies();
            const index = custodies.findIndex(c => c.id === id);

            if (index === -1) {
                Utils.showToast('العهد غير موجودة', 'error');
                return false;
            }

            custodies[index].status = 'returned';
            custodies[index].returnDate = new Date().toISOString();
            this.saveCustodies(custodies);

            Utils.showToast('تم إرجاع العهد بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Return custody error:', error);
            Utils.showToast('حدث خطأ أثناء إرجاع العهد', 'error');
            return false;
        }
    },

    /**
     * Delete custody
     * @param {string} id - Custody ID
     * @returns {boolean} Success status
     */
    delete(id) {
        try {
            // Check permission
            if (!this.canDelete()) {
                Utils.showToast('ليس لديك صلاحية حذف عهد', 'error');
                return false;
            }

            if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه العهد؟' : 'Are you sure you want to delete this custody?')) {
                return false;
            }

            let custodies = this.loadCustodies();
            custodies = custodies.filter(c => c.id !== id);
            this.saveCustodies(custodies);

            Utils.showToast('تم حذف العهد بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Delete custody error:', error);
            Utils.showToast('حدث خطأ أثناء حذف العهد', 'error');
            return false;
        }
    },

    /**
     * Check for alerts (overdue returns)
     */
    checkAlerts() {
        const custodies = this.loadCustodies();
        const alertsContainer = document.getElementById('custodyAlerts');
        
        if (!alertsContainer) return;

        const now = new Date();
        const alerts = [];

        custodies.forEach(custody => {
            if (custody.status === 'assigned' && custody.expectedReturnDate) {
                const returnDate = new Date(custody.expectedReturnDate);
                const daysUntilReturn = Math.ceil((returnDate - now) / (1000 * 60 * 60 * 24));

                if (daysUntilReturn < 0) {
                    alerts.push({
                        type: 'danger',
                        message: `العهد "${custody.assetName}" متأخرة بالإرجاع منذ ${Math.abs(daysUntilReturn)} يوم`,
                        icon: 'fas fa-exclamation-triangle'
                    });
                } else if (daysUntilReturn <= 7) {
                    alerts.push({
                        type: 'warning',
                        message: `العهد "${custody.assetName}" ستحتاج للإرجاع خلال ${daysUntilReturn} يوم`,
                        icon: 'fas fa-clock'
                    });
                }
            }
        });

        if (alerts.length === 0) {
            alertsContainer.innerHTML = '';
            return;
        }

        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <i class="${alert.icon}"></i>
                <span>${alert.message}</span>
            </div>
        `).join('');
    },

    /**
     * Render custodies table
     */
    renderTable() {
        const tbody = document.getElementById('custodiesTableBody');
        if (!tbody) return;

        let custodies = this.loadCustodies();

        if (custodies.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">${currentLang === 'ar' ? 'لا توجد عهد مسجلة' : 'No custodies registered'}</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = custodies.map(custody => `
            <tr data-id="${custody.id}">
                <td>${custody.assetId}</td>
                <td>${custody.assetName}</td>
                <td>${custody.assetType}</td>
                <td>${custody.assignedTo}</td>
                <td>${Utils.formatDate(custody.assignmentDate)}</td>
                <td>${custody.expectedReturnDate ? Utils.formatDate(custody.expectedReturnDate) : '-'}</td>
                <td><span class="badge ${Utils.getStatusClass(custody.status)}">${Utils.getStatusLabel(custody.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        ${custody.status === 'assigned' && this.canReturn() ? `
                            <button class="btn-icon btn-return" onclick="Custodies.return('${custody.id}')" title="${currentLang === 'ar' ? 'إرجاع' : 'Return'}">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                        ${this.canDelete() ? `
                            <button class="btn-icon btn-delete" onclick="Custodies.delete('${custody.id}')" title="${currentLang === 'ar' ? 'حذف' : 'Delete'}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Apply permissions to UI elements
     */
    applyPermissions() {
        // Hide/show add button based on permission
        const addBtn = document.getElementById('addCustodyBtn');
        if (addBtn) {
            addBtn.style.display = this.canAssign() ? 'inline-block' : 'none';
        }
    },

    /**
     * Populate asset type dropdown
     */
    populateAssetTypeDropdown() {
        // This would be used if we had a modal form
        console.log('Asset types:', this.assetTypes);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add custody button
        const addBtn = document.getElementById('addCustodyBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddModal();
            });
        }

        // Language change
        window.addEventListener('languageChanged', () => {
            this.renderTable();
        });

        // Data change
        window.addEventListener('hr-data-changed', () => {
            this.renderTable();
            this.checkAlerts();
        });
    },

    /**
     * Show add modal (simplified - uses prompt for now)
     */
    showAddModal() {
        // Check permission
        if (!this.canAssign()) {
            Utils.showToast('ليس لديك صلاحية إضافة عهد', 'error');
            return;
        }

        const assetName = prompt(currentLang === 'ar' ? 'اسم الأصل:' : 'Asset name:');
        if (!assetName) return;

        const assetType = prompt(
            currentLang === 'ar' 
                ? 'نوع الأصل (كمبيوتر محمول، هاتف جوال، تابلت، أخرى):' 
                : 'Asset type (Laptop, Mobile, Tablet, Other):'
        ) || 'أخرى';

        const assignedTo = prompt(currentLang === 'ar' ? 'مسند إلى (اسم الموظف):' : 'Assigned to (employee name):');
        if (!assignedTo) return;

        const expectedReturnDate = prompt(currentLang === 'ar' ? 'تاريخ الإرجاع المتوقع (YYYY-MM-DD):' : 'Expected return date (YYYY-MM-DD):');

        const success = this.add({
            assetId: 'AST-' + Date.now(),
            assetName: assetName,
            assetType: assetType,
            assignedTo: assignedTo,
            expectedReturnDate: expectedReturnDate || null
        });

        if (success) {
            this.renderTable();
            Dashboard.refresh();
        }
    },

    /**
     * Trigger data changed event
     */
    triggerDataChanged() {
        window.dispatchEvent(new CustomEvent('hr-data-changed', { detail: { type: 'custodies' } }));
    }
};

// Initialize custodies module when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('custodiesPage')) {
        Custodies.init();
    }
});

// Make Custodies available globally
window.Custodies = Custodies;
