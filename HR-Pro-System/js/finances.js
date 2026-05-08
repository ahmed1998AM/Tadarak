/**
 * HR Pro System - Finances Module
 * Handles loans, advances, and collections management
 */

class Finances {
    constructor() {
        this.finances = [];
        this.init();
    }

    init() {
        this.loadFinances();
        this.setupEventListeners();
        this.render();
    }

    loadFinances() {
        const stored = localStorage.getItem('hrpro_finances');
        if (stored) {
            this.finances = JSON.parse(stored);
        } else {
            this.finances = this.getSampleFinances();
            this.save();
        }
    }

    getSampleFinances() {
        return [
            {
                id: 1,
                employeeId: 1,
                employeeName: 'أحمد محمد علي',
                type: 'loan',
                amount: 5000,
                installments: 10,
                paidInstallments: 3,
                requestDate: '2024-05-01',
                status: 'approved',
                approverId: 1,
                notes: 'سلفة شخصية'
            },
            {
                id: 2,
                employeeId: 2,
                employeeName: 'فاطمة حسن أحمد',
                type: 'advance',
                amount: 2000,
                installments: 5,
                paidInstallments: 0,
                requestDate: '2024-06-05',
                status: 'pending',
                approverId: null,
                notes: 'سلفة راتب'
            },
            {
                id: 3,
                employeeId: 3,
                employeeName: 'محمد سعيد العمري',
                type: 'loan',
                amount: 10000,
                installments: 12,
                paidInstallments: 12,
                requestDate: '2024-01-15',
                status: 'completed',
                approverId: 1,
                notes: 'قرض سكني - تم السداد'
            }
        ];
    }

    save() {
        localStorage.setItem('hrpro_finances', JSON.stringify(this.finances));
    }

    render() {
        const tbody = document.querySelector('#financesTable tbody');
        if (!tbody) return;

        if (this.finances.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p data-lang="noFinances">لا توجد سلف أو تحصيلات</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.finances.map(finance => {
            const statusClass = finance.status === 'approved' ? 'badge-success' : 
                               finance.status === 'rejected' ? 'badge-danger' : 
                               finance.status === 'completed' ? 'badge-info' : 'badge-warning';
            const statusText = finance.status === 'approved' ? 'موافق عليه' : 
                              finance.status === 'rejected' ? 'مرفوض' :
                              finance.status === 'completed' ? 'مكتمل' : 'معلق';

            const progress = finance.installments > 0 
                ? Math.round((finance.paidInstallments / finance.installments) * 100) 
                : 0;

            return `
                <tr data-id="${finance.id}">
                    <td>${finance.id}</td>
                    <td>${finance.employeeName}</td>
                    <td>${this.getTypeName(finance.type)}</td>
                    <td>${finance.amount.toLocaleString()} ر.س</td>
                    <td>
                        <div class="progress-cell">
                            <span>${finance.paidInstallments}/${finance.installments}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${finance.requestDate}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${finance.status === 'pending' ? `
                                <button class="btn btn-icon-sm btn-success" onclick="finances.approve(${finance.id})" title="موافقة">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-icon-sm btn-danger" onclick="finances.reject(${finance.id})" title="رفض">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : `
                                <button class="btn btn-icon-sm" onclick="finances.viewDetails(${finance.id})" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${finance.status === 'approved' && finance.paidInstallments < finance.installments ? `
                                    <button class="btn btn-icon-sm btn-primary" onclick="finances.addPayment(${finance.id})" title="إضافة قسط">
                                        <i class="fas fa-money-bill"></i>
                                    </button>
                                ` : ''}
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        dashboard?.updateKPIs();
    }

    getTypeName(type) {
        const names = {
            'loan': 'سلفة',
            'advance': 'دفعة مقدمة',
            'collection': 'تحصيل'
        };
        return names[type] || type;
    }

    requestFinance(data) {
        const newFinance = {
            id: Math.max(0, ...this.finances.map(f => f.id)) + 1,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            type: data.type,
            amount: parseFloat(data.amount),
            installments: parseInt(data.installments),
            paidInstallments: 0,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            approverId: null,
            notes: data.notes || ''
        };

        this.finances.push(newFinance);
        this.save();
        this.render();

        auth.logActivity('request_finance', `طلب سلفة ${data.employeeName}`);

        notifications.add({
            title: 'تم إرسال الطلب',
            message: 'تم إرسال طلب السلفة للموافقة',
            type: 'success',
            icon: 'fas fa-money-bill-wave'
        });

        return newFinance;
    }

    approve(id) {
        const index = this.finances.findIndex(f => f.id === id);
        if (index === -1) return;

        const notes = prompt('أضف ملاحظات (اختياري):', '');
        
        this.finances[index].status = 'approved';
        this.finances[index].approverId = auth.getCurrentUser()?.id;
        this.finances[index].notes = notes || '';
        
        this.save();
        this.render();

        auth.logActivity('approve_finance', `موافقة على سلفة ${this.finances[index].employeeName}`);

        notifications.add({
            title: 'تمت الموافقة',
            message: `تمت الموافقة على طلب السلفة`,
            type: 'success',
            icon: 'fas fa-check-circle'
        });
    }

    reject(id) {
        const index = this.finances.findIndex(f => f.id === id);
        if (index === -1) return;

        const reason = prompt('سبب الرفض:', '');
        if (!reason) return;

        this.finances[index].status = 'rejected';
        this.finances[index].approverId = auth.getCurrentUser()?.id;
        this.finances[index].notes = reason;
        
        this.save();
        this.render();

        auth.logActivity('reject_finance', `رفض سلفة ${this.finances[index].employeeName}`);

        notifications.add({
            title: 'تم الرفض',
            message: 'تم رفض طلب السلفة',
            type: 'warning',
            icon: 'fas fa-times-circle'
        });
    }

    addPayment(id) {
        const index = this.finances.findIndex(f => f.id === id);
        if (index === -1) return;

        const finance = this.finances[index];
        
        if (finance.paidInstallments >= finance.installments) {
            alert('تم سداد جميع الأقساط');
            return;
        }

        if (confirm(`هل تريد إضافة قسط لسلفة ${finance.employeeName}؟`)) {
            finance.paidInstallments++;
            
            if (finance.paidInstallments >= finance.installments) {
                finance.status = 'completed';
                notifications.add({
                    title: 'تم السداد الكامل',
                    message: 'تم سداد جميع أقساط السلفة',
                    type: 'success',
                    icon: 'fas fa-check-double'
                });
            }
            
            this.save();
            this.render();

            notifications.add({
                title: 'تم إضافة القسط',
                message: `تم تسجيل القسط رقم ${finance.paidInstallments}`,
                type: 'success',
                icon: 'fas fa-hand-holding-usd'
            });
        }
    }

    viewDetails(id) {
        const finance = this.finances.find(f => f.id === id);
        if (!finance) return;

        const progress = finance.installments > 0 
            ? Math.round((finance.paidInstallments / finance.installments) * 100) 
            : 0;

        alert(`تفاصيل السلفة:
الموظف: ${finance.employeeName}
النوع: ${this.getTypeName(finance.type)}
المبلغ: ${finance.amount.toLocaleString()} ر.س
عدد الأقساط: ${finance.installments}
الأقساط المدفوعة: ${finance.paidInstallments}
نسبة السداد: ${progress}%
تاريخ الطلب: ${finance.requestDate}
الحالة: ${finance.status}
الملاحظات: ${finance.notes || 'لا توجد'}`);
    }

    setupEventListeners() {
        document.getElementById('requestFinanceBtn')?.addEventListener('click', () => {
            this.showRequestModal();
        });
    }

    showRequestModal() {
        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        
        const employeeId = prompt('اختر رقم الموظف:\n' + employees.map(e => `${e.id}. ${e.fullName}`).join('\n'));
        if (!employeeId) return;

        const employee = employees.find(e => e.id == employeeId);
        if (!employee) return;

        const type = prompt('نوع الطلب (loan, advance):', 'loan');
        if (!type) return;

        const amount = prompt('المبلغ:', '');
        if (!amount) return;

        const installments = prompt('عدد الأقساط:', '12');
        if (!installments) return;

        const notes = prompt('ملاحظات (اختياري):', '');

        this.requestFinance({
            employeeId: employee.id,
            employeeName: employee.fullName,
            type: type,
            amount: amount,
            installments: installments,
            notes: notes
        });
    }
}

const finances = new Finances();
