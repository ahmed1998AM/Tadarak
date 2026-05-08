/**
 * HR Pro System - Transfers Module
 * Handles employee transfer requests and approval workflow
 */

class Transfers {
    constructor() {
        this.transfers = [];
        this.init();
    }

    init() {
        this.loadTransfers();
        this.setupEventListeners();
        this.render();
    }

    loadTransfers() {
        const stored = localStorage.getItem('hrpro_transfers');
        if (stored) {
            this.transfers = JSON.parse(stored);
        } else {
            this.transfers = this.getSampleTransfers();
            this.save();
        }
    }

    getSampleTransfers() {
        return [
            {
                id: 1,
                employeeId: 1,
                employeeName: 'أحمد محمد علي',
                fromDepartment: 'IT',
                toDepartment: 'Operations',
                reason: 'رغبة في تغيير بيئة العمل',
                requestDate: '2024-06-01',
                status: 'pending',
                approverId: null,
                approvedDate: null,
                notes: ''
            },
            {
                id: 2,
                employeeId: 2,
                employeeName: 'فاطمة حسن أحمد',
                fromDepartment: 'HR',
                toDepartment: 'Finance',
                reason: 'تطوير المهارات المهنية',
                requestDate: '2024-05-15',
                status: 'approved',
                approverId: 1,
                approvedDate: '2024-05-20',
                notes: 'تمت الموافقة بناءً على الاحتياجات'
            },
            {
                id: 3,
                employeeId: 3,
                employeeName: 'محمد سعيد العمري',
                fromDepartment: 'Finance',
                toDepartment: 'IT',
                reason: 'الخلفية التقنية',
                requestDate: '2024-05-10',
                status: 'rejected',
                approverId: 1,
                approvedDate: '2024-05-12',
                notes: 'لا توجد وظائف شاغرة في القسم المستهدف'
            }
        ];
    }

    save() {
        localStorage.setItem('hrpro_transfers', JSON.stringify(this.transfers));
    }

    render() {
        const tbody = document.querySelector('#transfersTable tbody');
        if (!tbody) return;

        if (this.transfers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p data-lang="noTransfers">لا توجد طلبات نقل</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transfers.map(transfer => {
            const statusClass = transfer.status === 'approved' ? 'badge-success' : 
                               transfer.status === 'rejected' ? 'badge-danger' : 'badge-warning';
            const statusText = transfer.status === 'approved' ? 'موافق عليه' : 
                              transfer.status === 'rejected' ? 'مرفوض' : 'معلق';

            return `
                <tr data-id="${transfer.id}">
                    <td>${transfer.id}</td>
                    <td>${transfer.employeeName}</td>
                    <td>${this.getDeptName(transfer.fromDepartment)}</td>
                    <td>${this.getDeptName(transfer.toDepartment)}</td>
                    <td>${transfer.requestDate}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${transfer.status === 'pending' ? `
                                <button class="btn btn-icon-sm btn-success" onclick="transfers.approve(${transfer.id})" title="موافقة">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-icon-sm btn-danger" onclick="transfers.reject(${transfer.id})" title="رفض">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : `
                                <button class="btn btn-icon-sm" onclick="transfers.viewDetails(${transfer.id})" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update dashboard KPI
        dashboard?.updateKPIs();
    }

    getDeptName(dept) {
        const names = {
            'IT': 'تقنية المعلومات',
            'HR': 'الموارد البشرية',
            'Finance': 'المالية',
            'Operations': 'العمليات'
        };
        return names[dept] || dept;
    }

    requestTransfer(data) {
        const newTransfer = {
            id: Math.max(0, ...this.transfers.map(t => t.id)) + 1,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            fromDepartment: data.fromDepartment,
            toDepartment: data.toDepartment,
            reason: data.reason,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            approverId: null,
            approvedDate: null,
            notes: ''
        };

        this.transfers.push(newTransfer);
        this.save();
        this.render();

        auth.logActivity('request_transfer', `طلب نقل ${data.employeeName}`);

        notifications.add({
            title: 'تم إرسال الطلب',
            message: 'تم إرسال طلب النقل للموافقة',
            type: 'success',
            icon: 'fas fa-exchange-alt'
        });

        return newTransfer;
    }

    approve(id) {
        const index = this.transfers.findIndex(t => t.id === id);
        if (index === -1) return;

        const notes = prompt('أضف ملاحظات (اختياري):', '');
        
        this.transfers[index].status = 'approved';
        this.transfers[index].approverId = auth.getCurrentUser()?.id;
        this.transfers[index].approvedDate = new Date().toISOString().split('T')[0];
        this.transfers[index].notes = notes || '';
        
        this.save();
        this.render();

        auth.logActivity('approve_transfer', `موافقة على نقل ${this.transfers[index].employeeName}`);

        notifications.add({
            title: 'تمت الموافقة',
            message: `تمت الموافقة على طلب النقل`,
            type: 'success',
            icon: 'fas fa-check-circle'
        });
    }

    reject(id) {
        const index = this.transfers.findIndex(t => t.id === id);
        if (index === -1) return;

        const reason = prompt('سبب الرفض:', '');
        if (!reason) return;

        this.transfers[index].status = 'rejected';
        this.transfers[index].approverId = auth.getCurrentUser()?.id;
        this.transfers[index].approvedDate = new Date().toISOString().split('T')[0];
        this.transfers[index].notes = reason;
        
        this.save();
        this.render();

        auth.logActivity('reject_transfer', `رفض نقل ${this.transfers[index].employeeName}`);

        notifications.add({
            title: 'تم الرفض',
            message: 'تم رفض طلب النقل',
            type: 'warning',
            icon: 'fas fa-times-circle'
        });
    }

    viewDetails(id) {
        const transfer = this.transfers.find(t => t.id === id);
        if (!transfer) return;

        alert(`تفاصيل طلب النقل:
الموظف: ${transfer.employeeName}
من: ${this.getDeptName(transfer.fromDepartment)}
إلى: ${this.getDeptName(transfer.toDepartment)}
السبب: ${transfer.reason}
تاريخ الطلب: ${transfer.requestDate}
الحالة: ${transfer.status}
الملاحظات: ${transfer.notes || 'لا توجد'}`);
    }

    setupEventListeners() {
        document.getElementById('requestTransferBtn')?.addEventListener('click', () => {
            this.showRequestModal();
        });
    }

    showRequestModal() {
        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        const currentUser = auth.getCurrentUser();
        
        // Simple prompt for demo (can be enhanced with modal)
        const employeeId = prompt('اختر رقم الموظف:\n' + employees.map(e => `${e.id}. ${e.fullName}`).join('\n'));
        if (!employeeId) return;

        const employee = employees.find(e => e.id == employeeId);
        if (!employee) return;

        const toDepartment = prompt('القسم المستهدف (IT, HR, Finance, Operations):');
        if (!toDepartment) return;

        const reason = prompt('سبب النقل:');
        if (!reason) return;

        this.requestTransfer({
            employeeId: employee.id,
            employeeName: employee.fullName,
            fromDepartment: employee.department,
            toDepartment: toDepartment,
            reason: reason
        });
    }
}

const transfers = new Transfers();
