/**
 * HR Pro System - Reports Module
 * Handles report generation, export to PDF/Excel, and analytics
 */

class Reports {
    constructor() {
        this.reports = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // Generate employees report
    generateEmployeesReport() {
        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        
        return {
            title: 'تقرير الموظفين',
            generatedAt: new Date().toISOString(),
            summary: {
                total: employees.length,
                active: employees.filter(e => e.status === 'active').length,
                onLeave: employees.filter(e => e.status === 'onLeave').length,
                inactive: employees.filter(e => e.status === 'inactive').length
            },
            byDepartment: this.groupBy(employees, 'department'),
            data: employees
        };
    }

    // Generate tasks report
    generateTasksReport() {
        const tasks = JSON.parse(localStorage.getItem('hrpro_tasks') || '[]');
        
        return {
            title: 'تقرير المهام',
            generatedAt: new Date().toISOString(),
            summary: {
                total: tasks.length,
                todo: tasks.filter(t => t.status === 'todo').length,
                inProgress: tasks.filter(t => t.status === 'inprogress').length,
                review: tasks.filter(t => t.status === 'review').length,
                done: tasks.filter(t => t.status === 'done').length
            },
            byPriority: this.groupBy(tasks, 'priority'),
            byAssignee: this.groupBy(tasks, 'assignee'),
            data: tasks
        };
    }

    // Generate finances report
    generateFinancesReport() {
        const finances = JSON.parse(localStorage.getItem('hrpro_finances') || '[]');
        
        const totalAmount = finances.reduce((sum, f) => sum + f.amount, 0);
        const pendingAmount = finances
            .filter(f => f.status === 'approved' && f.paidInstallments < f.installments)
            .reduce((sum, f) => sum + f.amount, 0);

        return {
            title: 'تقرير السلف والتحصيلات',
            generatedAt: new Date().toISOString(),
            summary: {
                total: finances.length,
                totalAmount: totalAmount,
                pending: finances.filter(f => f.status === 'pending').length,
                approved: finances.filter(f => f.status === 'approved').length,
                completed: finances.filter(f => f.status === 'completed').length,
                pendingAmount: pendingAmount
            },
            byType: this.groupBy(finances, 'type'),
            data: finances
        };
    }

    // Generate transfers report
    generateTransfersReport() {
        const transfers = JSON.parse(localStorage.getItem('hrpro_transfers') || '[]');
        
        return {
            title: 'تقرير الانتقالات',
            generatedAt: new Date().toISOString(),
            summary: {
                total: transfers.length,
                pending: transfers.filter(t => t.status === 'pending').length,
                approved: transfers.filter(t => t.status === 'approved').length,
                rejected: transfers.filter(t => t.status === 'rejected').length
            },
            byFromDept: this.groupBy(transfers, 'fromDepartment'),
            byToDept: this.groupBy(transfers, 'toDepartment'),
            data: transfers
        };
    }

    // Group array by key
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const value = item[key] || 'غير محدد';
            result[value] = (result[value] || 0) + 1;
            return result;
        }, {});
    }

    // Export to JSON
    exportJSON(reportName) {
        let report;
        
        switch(reportName) {
            case 'employees': report = this.generateEmployeesReport(); break;
            case 'tasks': report = this.generateTasksReport(); break;
            case 'finances': report = this.generateFinancesReport(); break;
            case 'transfers': report = this.generateTransfersReport(); break;
            default: return;
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName}-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        notifications.add({
            title: 'تم التصدير',
            message: `تم تصدير تقرير ${report.title}`,
            type: 'success',
            icon: 'fas fa-file-download'
        });
    }

    // Export to CSV/Excel
    exportCSV(reportName) {
        let report, headers, rows;
        
        switch(reportName) {
            case 'employees':
                report = this.generateEmployeesReport();
                headers = ['ID', 'الاسم', 'البريد', 'الهاتف', 'القسم', 'الوظيفة', 'الحالة', 'تاريخ التعيين'];
                rows = report.data.map(e => [e.id, e.fullName, e.email, e.phone, e.department, e.position, e.status, e.joinDate]);
                break;
                
            case 'tasks':
                report = this.generateTasksReport();
                headers = ['ID', 'العنوان', 'الوصف', 'المسؤول', 'الأولوية', 'الحالة', 'تاريخ الاستحقاق'];
                rows = report.data.map(t => [t.id, t.title, t.description, t.assignee, t.priority, t.status, t.dueDate]);
                break;
                
            case 'finances':
                report = this.generateFinancesReport();
                headers = ['ID', 'الموظف', 'النوع', 'المبلغ', 'الأقساط', 'المدفوع', 'تاريخ الطلب', 'الحالة'];
                rows = report.data.map(f => [f.id, f.employeeName, f.type, f.amount, f.installments, f.paidInstallments, f.requestDate, f.status]);
                break;
                
            case 'transfers':
                report = this.generateTransfersReport();
                headers = ['ID', 'الموظف', 'من القسم', 'إلى القسم', 'السبب', 'تاريخ الطلب', 'الحالة'];
                rows = report.data.map(t => [t.id, t.employeeName, t.fromDepartment, t.toDepartment, t.reason, t.requestDate, t.status]);
                break;
                
            default: return;
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        notifications.add({
            title: 'تم التصدير',
            message: `تم تصدير تقرير ${report.title} إلى Excel`,
            type: 'success',
            icon: 'fas fa-file-excel'
        });
    }

    // Print report
    printReport(reportName) {
        let report;
        
        switch(reportName) {
            case 'employees': report = this.generateEmployeesReport(); break;
            case 'tasks': report = this.generateTasksReport(); break;
            case 'finances': report = this.generateFinancesReport(); break;
            case 'transfers': report = this.generateTransfersReport(); break;
            default: return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${report.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
                    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
                    .meta { color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background-color: #2563eb; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                    .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
                    .summary-card h3 { margin: 0; color: #2563eb; font-size: 24px; }
                    .summary-card p { margin: 5px 0 0; color: #666; }
                </style>
            </head>
            <body>
                <h1>${report.title}</h1>
                <div class="meta">تاريخ التقرير: ${new Date(report.generatedAt).toLocaleDateString('ar-SA')}</div>
                
                <div class="summary">
                    ${Object.entries(report.summary).map(([key, value]) => `
                        <div class="summary-card">
                            <h3>${typeof value === 'number' ? value.toLocaleString() : value}</h3>
                            <p>${this.translateKey(key)}</p>
                        </div>
                    `).join('')}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            ${Object.keys(report.data[0] || {}).map(key => `<th>${key}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${report.data.map(row => `
                            <tr>
                                ${Object.values(row).map(val => `<td>${val || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Translate key
    translateKey(key) {
        const translations = {
            total: 'الإجمالي',
            active: 'نشط',
            onLeave: 'في إجازة',
            inactive: 'غير نشط',
            pending: 'معلق',
            approved: 'موافق عليه',
            rejected: 'مرفوض',
            completed: 'مكتمل',
            todo: 'للتنفيذ',
            inProgress: 'قيد التنفيذ',
            review: 'مراجعة',
            done: 'منجز',
            totalAmount: 'إجمالي المبلغ',
            pendingAmount: 'المبلغ المعلق'
        };
        return translations[key] || key;
    }

    setupEventListeners() {
        document.querySelectorAll('.report-card').forEach(card => {
            const buttons = card.querySelectorAll('[data-format]');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const format = e.currentTarget.dataset.format;
                    const reportType = card.dataset.report;
                    
                    if (format === 'pdf') {
                        this.printReport(reportType);
                    } else if (format === 'excel') {
                        this.exportCSV(reportType);
                    }
                });
            });
        });
    }
}

const reports = new Reports();
