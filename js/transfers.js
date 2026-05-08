/**
 * HR Pro System - Transfers Module
 * Handles employee transfer requests between departments
 */

const Transfers = {
    /**
     * Initialize transfers module
     */
    init() {
        this.loadTransfers();
        this.setupEventListeners();
        this.renderTable();
    },

    /**
     * Load transfers from localStorage
     * @returns {Array} Transfers array
     */
    loadTransfers() {
        return Utils.storage.get('hr_transfers', []);
    },

    /**
     * Save transfers to localStorage
     * @param {Array} transfers - Transfers to save
     */
    saveTransfers(transfers) {
        Utils.storage.set('hr_transfers', transfers);
        this.triggerDataChanged();
    },

    /**
     * Request new transfer
     * @param {Object} transferData - Transfer data
     * @returns {boolean} Success status
     */
    request(transferData) {
        try {
            const transfers = this.loadTransfers();
            const currentUser = Auth.getCurrentUser();

            if (!currentUser) {
                Utils.showToast('يجب تسجيل الدخول أولاً', 'error');
                return false;
            }

            const newTransfer = {
                id: Utils.generateId(),
                employeeId: currentUser.id,
                employeeName: currentUser.name,
                fromDepartment: transferData.fromDepartment,
                toDepartment: transferData.toDepartment,
                reason: transferData.reason || '',
                status: 'pending',
                requestDate: new Date().toISOString(),
                reviewedAt: null,
                reviewedBy: null
            };

            transfers.push(newTransfer);
            this.saveTransfers(transfers);

            Utils.showToast('تم إرسال طلب النقل بنجاح', 'success');
            
            // Notify admin (only if Notifications is available)
            if (typeof Notifications !== 'undefined') {
                try {
                    Notifications.notifyTransferStatus('pending', `طلب نقل من ${transferData.fromDepartment} إلى ${transferData.toDepartment}`);
                } catch (e) {
                    console.log('Notification error:', e);
                }
            }

            return true;
        } catch (error) {
            console.error('Request transfer error:', error);
            Utils.showToast('حدث خطأ أثناء طلب النقل', 'error');
            return false;
        }
    },

    /**
     * Approve/Reject transfer (admin only)
     * @param {string} id - Transfer ID
     * @param {string} status - New status (approved/rejected)
     * @returns {boolean} Success status
     */
    review(id, status) {
        try {
            if (!Auth.isAdmin()) {
                Utils.showToast('ليس لديك صلاحية تنفيذ هذا الإجراء', 'error');
                return false;
            }

            const transfers = this.loadTransfers();
            const index = transfers.findIndex(t => t.id === id);

            if (index === -1) {
                Utils.showToast('الطلب غير موجود', 'error');
                return false;
            }

            const currentUser = Auth.getCurrentUser();
            transfers[index].status = status;
            transfers[index].reviewedAt = new Date().toISOString();
            transfers[index].reviewedBy = currentUser.id;

            this.saveTransfers(transfers);

            // Update employee department if approved
            if (status === 'approved') {
                const employees = Utils.storage.get('hr_employees', []);
                const empIndex = employees.findIndex(e => e.id === transfers[index].employeeId);
                if (empIndex !== -1) {
                    employees[empIndex].department = transfers[index].toDepartment;
                    employees[empIndex].updatedAt = new Date().toISOString();
                    Utils.storage.set('hr_employees', employees);
                }
            }

            Utils.showToast(
                status === 'approved' ? 'تمت الموافقة على النقل' : 'تم رفض النقل',
                'success'
            );

            // Notify employee (only if Notifications is available)
            if (typeof Notifications !== 'undefined') {
                try {
                    Notifications.notifyTransferStatus(status, 
                        `تم ${status === 'approved' ? 'الموافقة' : 'الرفض'} لطلب نقلك`
                    );
                } catch (e) {
                    console.log('Notification error:', e);
                }
            }

            return true;
        } catch (error) {
            console.error('Review transfer error:', error);
            Utils.showToast('حدث خطأ أثناء مراجعة الطلب', 'error');
            return false;
        }
    },

    /**
     * Delete transfer
     * @param {string} id - Transfer ID
     * @returns {boolean} Success status
     */
    delete(id) {
        try {
            if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) {
                return false;
            }

            let transfers = this.loadTransfers();
            transfers = transfers.filter(t => t.id !== id);
            this.saveTransfers(transfers);

            Utils.showToast('تم حذف الطلب بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Delete transfer error:', error);
            Utils.showToast('حدث خطأ أثناء حذف الطلب', 'error');
            return false;
        }
    },

    /**
     * Render transfers table
     */
    renderTable() {
        const tbody = document.getElementById('transfersTableBody');
        if (!tbody) return;

        let transfers = this.loadTransfers();

        // Filter based on user role
        const currentUser = Auth.getCurrentUser();
        if (currentUser && currentUser.role !== 'admin') {
            transfers = transfers.filter(t => t.employeeId === currentUser.id);
        }

        // Apply status filter
        const statusFilter = document.getElementById('transferStatusFilter')?.value || '';
        if (statusFilter) {
            transfers = transfers.filter(t => t.status === statusFilter);
        }

        if (transfers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">${currentLang === 'ar' ? 'لا توجد طلبات نقل' : 'No transfer requests'}</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transfers.map(transfer => `
            <tr data-id="${transfer.id}">
                <td>${transfer.id.substring(0, 8)}</td>
                <td>${transfer.employeeName}</td>
                <td>${transfer.fromDepartment}</td>
                <td>${transfer.toDepartment}</td>
                <td>${Utils.formatDate(transfer.requestDate)}</td>
                <td><span class="badge ${Utils.getStatusClass(transfer.status)}">${Utils.getStatusLabel(transfer.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        ${transfer.status === 'pending' && Auth.isAdmin() ? `
                            <button class="btn-icon btn-approve" onclick="Transfers.review('${transfer.id}', 'approved')" title="${currentLang === 'ar' ? 'موافقة' : 'Approve'}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon btn-reject" onclick="Transfers.review('${transfer.id}', 'rejected')" title="${currentLang === 'ar' ? 'رفض' : 'Reject'}">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${transfer.status === 'pending' && (!Auth.isAdmin() || transfer.employeeId === currentUser?.id) ? `
                            <button class="btn-icon btn-delete" onclick="Transfers.delete('${transfer.id}')" title="${currentLang === 'ar' ? 'حذف' : 'Delete'}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Request transfer button
        const requestBtn = document.getElementById('requestTransferBtn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => {
                this.showRequestModal();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('transferStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.renderTable());
        }

        // Language change
        window.addEventListener('languageChanged', () => {
            this.renderTable();
        });

        // Data change
        window.addEventListener('hr-data-changed', () => {
            this.renderTable();
        });
    },

    /**
     * Show request modal (simplified - uses prompt for now)
     */
    showRequestModal() {
        const employees = Utils.storage.get('hr_employees', []);
        const currentUser = Auth.getCurrentUser();
        
        if (!currentUser) {
            Utils.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        const currentEmp = employees.find(e => e.id === currentUser.id);
        if (!currentEmp) {
            Utils.showToast('بيانات الموظف غير موجودة', 'error');
            return;
        }

        // Simple prompt-based approach for now
        const toDepartment = prompt(currentLang === 'ar' ? 'أدخل القسم المطلوب النقل إليه:' : 'Enter destination department:');
        if (!toDepartment) return;

        const reason = prompt(currentLang === 'ar' ? 'سبب النقل (اختياري):' : 'Reason for transfer (optional):') || '';

        const success = this.request({
            fromDepartment: currentEmp.department,
            toDepartment: toDepartment,
            reason: reason
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
        window.dispatchEvent(new CustomEvent('hr-data-changed', { detail: { type: 'transfers' } }));
    }
};

// Initialize transfers module when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('transfersPage')) {
        Transfers.init();
    }
});

// Make Transfers available globally
window.Transfers = Transfers;
