/**
 * HR Pro System - Finances Module
 * Handles advances and financial collections
 */

const Finances = {
    /**
     * Initialize finances module
     */
    init() {
        this.loadFinances();
        this.setupEventListeners();
        this.renderTable();
        this.updateSummary();
    },

    /**
     * Load finances from localStorage
     * @returns {Array} Finances array
     */
    loadFinances() {
        return Utils.storage.get('hr_finances', []);
    },

    /**
     * Save finances to localStorage
     * @param {Array} finances - Finances to save
     */
    saveFinances(finances) {
        Utils.storage.set('hr_finances', finances);
        this.triggerDataChanged();
    },

    /**
     * Request new advance
     * @param {Object} advanceData - Advance data
     * @returns {boolean} Success status
     */
    requestAdvance(advanceData) {
        try {
            const finances = this.loadFinances();
            const currentUser = Auth.getCurrentUser();

            if (!currentUser) {
                Utils.showToast('يجب تسجيل الدخول أولاً', 'error');
                return false;
            }

            const newAdvance = {
                id: Utils.generateId(),
                type: 'advance',
                employeeId: currentUser.id,
                employeeName: currentUser.name,
                amount: parseFloat(advanceData.amount),
                installments: parseInt(advanceData.installments) || 12,
                remaining: parseFloat(advanceData.amount),
                reason: advanceData.reason || '',
                status: 'pending',
                requestDate: new Date().toISOString(),
                approvedDate: null,
                paidAmount: 0,
                payments: []
            };

            finances.push(newAdvance);
            this.saveFinances(finances);

            Utils.showToast('تم إرسال طلب السلفة بنجاح', 'success');
            
            // Notify admin
            Notifications.notifyFinanceStatus('pending', `طلب سلفة بقيمة ${Utils.formatCurrency(newAdvance.amount)}`);

            return true;
        } catch (error) {
            console.error('Request advance error:', error);
            Utils.showToast('حدث خطأ أثناء طلب السلفة', 'error');
            return false;
        }
    },

    /**
     * Record collection/payment
     * @param {Object} paymentData - Payment data
     * @returns {boolean} Success status
     */
    recordCollection(paymentData) {
        try {
            const finances = this.loadFinances();
            const index = finances.findIndex(f => f.id === paymentData.advanceId);

            if (index === -1) {
                Utils.showToast('السلفة غير موجودة', 'error');
                return false;
            }

            const finance = finances[index];
            const paymentAmount = parseFloat(paymentData.amount);

            if (paymentAmount > finance.remaining) {
                Utils.showToast('المبلغ المدفوع أكبر من المتبقي', 'error');
                return false;
            }

            // Add payment record
            finance.payments.push({
                id: Utils.generateId(),
                amount: paymentAmount,
                date: new Date().toISOString(),
                recordedBy: Auth.getCurrentUser()?.id || 'system'
            });

            finance.paidAmount += paymentAmount;
            finance.remaining -= paymentAmount;

            if (finance.remaining <= 0) {
                finance.status = 'paid';
            }

            this.saveFinances(finances);

            Utils.showToast('تم تسجيل التحصيل بنجاح', 'success');
            Notifications.notifyFinanceStatus('paid', `تم سداد ${Utils.formatCurrency(paymentAmount)} من السلفة`);

            return true;
        } catch (error) {
            console.error('Record collection error:', error);
            Utils.showToast('حدث خطأ أثناء تسجيل التحصيل', 'error');
            return false;
        }
    },

    /**
     * Approve/Reject advance (admin only)
     * @param {string} id - Finance ID
     * @param {string} status - New status
     * @returns {boolean} Success status
     */
    review(id, status) {
        try {
            if (!Auth.isAdmin()) {
                Utils.showToast('ليس لديك صلاحية تنفيذ هذا الإجراء', 'error');
                return false;
            }

            const finances = this.loadFinances();
            const index = finances.findIndex(f => f.id === id);

            if (index === -1) {
                Utils.showToast('الطلب غير موجود', 'error');
                return false;
            }

            const currentUser = Auth.getCurrentUser();
            finances[index].status = status;
            finances[index].approvedDate = new Date().toISOString();
            finances[index].approvedBy = currentUser.id;

            this.saveFinances(finances);

            Utils.showToast(
                status === 'approved' ? 'تمت الموافقة على السلفة' : 'تم رفض السلفة',
                'success'
            );

            // Notify employee
            Notifications.notifyFinanceStatus(status, 
                `تم ${status === 'approved' ? 'الموافقة' : 'الرفض'} لطلب السلفة الخاص بك`
            );

            return true;
        } catch (error) {
            console.error('Review finance error:', error);
            Utils.showToast('حدث خطأ أثناء مراجعة الطلب', 'error');
            return false;
        }
    },

    /**
     * Delete finance record
     * @param {string} id - Finance ID
     * @returns {boolean} Success status
     */
    delete(id) {
        try {
            if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) {
                return false;
            }

            let finances = this.loadFinances();
            finances = finances.filter(f => f.id !== id);
            this.saveFinances(finances);

            Utils.showToast('تم حذف السجل بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Delete finance error:', error);
            Utils.showToast('حدث خطأ أثناء حذف السجل', 'error');
            return false;
        }
    },

    /**
     * Update summary cards
     */
    updateSummary() {
        const finances = this.loadFinances();
        
        const totalAdvances = finances
            .filter(f => f.type === 'advance' && f.status !== 'rejected')
            .reduce((sum, f) => sum + f.amount, 0);

        const pendingRequests = finances
            .filter(f => f.type === 'advance' && f.status === 'pending')
            .length;

        const thisMonth = finances
            .filter(f => {
                const date = new Date(f.requestDate);
                const now = new Date();
                return f.type === 'advance' && 
                       date.getMonth() === now.getMonth() && 
                       date.getFullYear() === now.getFullYear();
            })
            .reduce((sum, f) => sum + f.amount, 0);

        const totalEl = document.getElementById('financeTotalAdvances');
        const pendingEl = document.getElementById('financePendingRequests');
        const monthEl = document.getElementById('financeThisMonth');

        if (totalEl) totalEl.textContent = Utils.formatCurrency(totalAdvances);
        if (pendingEl) pendingEl.textContent = Utils.formatNumber(pendingRequests);
        if (monthEl) monthEl.textContent = Utils.formatCurrency(thisMonth);
    },

    /**
     * Render finances table
     */
    renderTable() {
        const tbody = document.getElementById('financesTableBody');
        if (!tbody) return;

        let finances = this.loadFinances();

        // Filter based on user role
        const currentUser = Auth.getCurrentUser();
        if (currentUser && currentUser.role !== 'admin') {
            finances = finances.filter(f => f.employeeId === currentUser.id);
        }

        if (finances.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">${currentLang === 'ar' ? 'لا توجد سجلات مالية' : 'No financial records'}</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = finances.map(finance => `
            <tr data-id="${finance.id}">
                <td>${finance.id.substring(0, 8)}</td>
                <td>${finance.employeeName}</td>
                <td>${Utils.formatCurrency(finance.amount)}</td>
                <td>${finance.installments} ${currentLang === 'ar' ? 'قسط' : 'installments'}</td>
                <td>${Utils.formatCurrency(finance.remaining)}</td>
                <td>${Utils.formatDate(finance.requestDate)}</td>
                <td><span class="badge ${Utils.getStatusClass(finance.status)}">${Utils.getStatusLabel(finance.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        ${finance.status === 'pending' && Auth.isAdmin() ? `
                            <button class="btn-icon btn-approve" onclick="Finances.review('${finance.id}', 'approved')" title="${currentLang === 'ar' ? 'موافقة' : 'Approve'}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon btn-reject" onclick="Finances.review('${finance.id}', 'rejected')" title="${currentLang === 'ar' ? 'رفض' : 'Reject'}">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${finance.status === 'approved' && Auth.isAdmin() ? `
                            <button class="btn-icon btn-collection" onclick="Finances.showCollectionModal('${finance.id}')" title="${currentLang === 'ar' ? 'تحصيل' : 'Collect'}">
                                <i class="fas fa-hand-holding-usd"></i>
                            </button>
                        ` : ''}
                        ${finance.status === 'pending' && (!Auth.isAdmin() || finance.employeeId === currentUser?.id) ? `
                            <button class="btn-icon btn-delete" onclick="Finances.delete('${finance.id}')" title="${currentLang === 'ar' ? 'حذف' : 'Delete'}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Show collection modal (simplified - uses prompt for now)
     * @param {string} advanceId - Advance ID
     */
    showCollectionModal(advanceId) {
        const finances = this.loadFinances();
        const finance = finances.find(f => f.id === advanceId);

        if (!finance) {
            Utils.showToast('السلفة غير موجودة', 'error');
            return;
        }

        const amount = prompt(
            currentLang === 'ar' 
                ? `أدخل مبلغ التحصيل (المتبقي: ${Utils.formatCurrency(finance.remaining)}):` 
                : `Enter collection amount (Remaining: ${Utils.formatCurrency(finance.remaining)}):`
        );

        if (!amount) return;

        this.recordCollection({
            advanceId: advanceId,
            amount: parseFloat(amount)
        });

        this.renderTable();
        this.updateSummary();
        Dashboard.refresh();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Request advance button
        const requestBtn = document.getElementById('requestAdvanceBtn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => {
                this.showRequestModal();
            });
        }

        // Language change
        window.addEventListener('languageChanged', () => {
            this.renderTable();
        });

        // Data change
        window.addEventListener('hr-data-changed', () => {
            this.renderTable();
            this.updateSummary();
        });
    },

    /**
     * Show request modal (simplified - uses prompt for now)
     */
    showRequestModal() {
        const amount = prompt(currentLang === 'ar' ? 'مبلغ السلفة:' : 'Advance amount:');
        if (!amount) return;

        const installments = prompt(currentLang === 'ar' ? 'عدد الأقساط:' : 'Number of installments:') || '12';
        const reason = prompt(currentLang === 'ar' ? 'سبب الطلب (اختياري):' : 'Reason (optional):') || '';

        this.requestAdvance({
            amount: parseFloat(amount),
            installments: parseInt(installments),
            reason: reason
        });

        this.renderTable();
        this.updateSummary();
        Dashboard.refresh();
    },

    /**
     * Trigger data changed event
     */
    triggerDataChanged() {
        window.dispatchEvent(new CustomEvent('hr-data-changed', { detail: { type: 'finances' } }));
    }
};

// Initialize finances module when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('financesPage')) {
        Finances.init();
    }
});

// Make Finances available globally
window.Finances = Finances;
