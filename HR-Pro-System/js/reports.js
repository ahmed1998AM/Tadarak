/**
 * HR Pro System - Reports Module
 * Handles report generation and export
 */

const Reports = {
    /**
     * Initialize reports module
     */
    init() {
        this.setupEventListeners();
    },

    /**
     * Generate report
     * @param {string} type - Report type (employees/tasks/finances/attendance)
     * @param {string} format - Export format (pdf/excel/csv)
     */
    generate(type, format) {
        switch (type) {
            case 'employees':
                this.generateEmployeeReport(format);
                break;
            case 'tasks':
                this.generateTasksReport(format);
                break;
            case 'finances':
                this.generateFinancesReport(format);
                break;
            case 'attendance':
                this.generateAttendanceReport(format);
                break;
            default:
                Utils.showToast('نوع التقرير غير معروف', 'error');
        }
    },

    /**
     * Generate employee report
     * @param {string} format - Export format
     */
    generateEmployeeReport(format) {
        const employees = Utils.storage.get('hr_employees', []);
        
        if (employees.length === 0) {
            Utils.showToast('لا توجد بيانات موظفين', 'warning');
            return;
        }

        const data = employees.map(emp => ({
            'Employee ID': emp.id,
            'Full Name': emp.fullName,
            'Email': emp.email,
            'Phone': emp.phone,
            'Department': emp.department,
            'Position': emp.position,
            'Join Date': emp.joinDate,
            'Salary': emp.salary,
            'Status': emp.status
        }));

        this.export(data, `employee_report_${new Date().toISOString().split('T')[0]}`, format);
    },

    /**
     * Generate tasks report
     * @param {string} format - Export format
     */
    generateTasksReport(format) {
        const tasks = Utils.storage.get('hr_tasks', []);
        
        if (tasks.length === 0) {
            Utils.showToast('لا توجد بيانات مهام', 'warning');
            return;
        }

        const employees = Utils.storage.get('hr_employees', []);
        
        const data = tasks.map(task => {
            const assignee = employees.find(e => e.id === task.assignedTo);
            return {
                'Task ID': task.id,
                'Title': task.title,
                'Description': task.description,
                'Assigned To': assignee ? assignee.fullName : 'Unassigned',
                'Status': task.status,
                'Priority': task.priority,
                'Due Date': task.dueDate,
                'Created At': task.createdAt
            };
        });

        this.export(data, `tasks_report_${new Date().toISOString().split('T')[0]}`, format);
    },

    /**
     * Generate finances report
     * @param {string} format - Export format
     */
    generateFinancesReport(format) {
        const finances = Utils.storage.get('hr_finances', []);
        
        if (finances.length === 0) {
            Utils.showToast('لا توجد بيانات مالية', 'warning');
            return;
        }

        const data = finances.map(finance => ({
            'Record ID': finance.id,
            'Type': finance.type === 'advance' ? 'سلفة' : 'تحصيل',
            'Employee': finance.employeeName,
            'Amount': finance.amount,
            'Remaining': finance.remaining,
            'Installments': finance.installments,
            'Status': finance.status,
            'Request Date': finance.requestDate,
            'Approved Date': finance.approvedDate || '-'
        }));

        this.export(data, `finances_report_${new Date().toISOString().split('T')[0]}`, format);
    },

    /**
     * Generate attendance report
     * @param {string} format - Export format
     */
    generateAttendanceReport(format) {
        // For now, generate a sample attendance report
        // In a real system, this would pull from an attendance tracking system
        
        const employees = Utils.storage.get('hr_employees', []);
        
        if (employees.length === 0) {
            Utils.showToast('لا توجد بيانات موظفين', 'warning');
            return;
        }

        const today = new Date();
        const data = employees.map(emp => {
            // Sample data - in real system this would be actual attendance records
            const status = ['present', 'absent', 'late', 'on_leave'][Math.floor(Math.random() * 4)];
            return {
                'Employee ID': emp.id,
                'Name': emp.fullName,
                'Department': emp.department,
                'Date': today.toISOString().split('T')[0],
                'Check In': status === 'present' || status === 'late' ? '08:30' : '-',
                'Check Out': status === 'present' ? '17:00' : '-',
                'Status': status
            };
        });

        this.export(data, `attendance_report_${new Date().toISOString().split('T')[0]}`, format);
    },

    /**
     * Export data
     * @param {Array} data - Data to export
     * @param {string} filename - Filename
     * @param {string} format - Export format
     */
    export(data, filename, format) {
        switch (format.toLowerCase()) {
            case 'csv':
                Utils.exportToCSV(data, `${filename}.csv`);
                break;
            case 'excel':
                // For Excel, we'll use CSV as a simple alternative
                // In production, you'd use a library like SheetJS
                Utils.exportToCSV(data, `${filename}.csv`);
                break;
            case 'pdf':
                this.exportToPDF(data, filename);
                break;
            default:
                Utils.showToast('صيغة التصدير غير مدعومة', 'error');
        }

        Utils.showToast('تم تصدير التقرير بنجاح', 'success');
    },

    /**
     * Export to PDF (simplified version)
     * @param {Array} data - Data to export
     * @param {string} filename - Filename
     */
    exportToPDF(data, filename) {
        // Simple print-based PDF export
        // In production, you'd use a library like jsPDF or html2pdf
        
        const printWindow = window.open('', '_blank');
        
        let tableRows = '';
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            
            tableRows += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
            
            data.forEach(row => {
                tableRows += '<tr>' + headers.map(h => `<td>${row[h]}</td>`).join('') + '</tr>';
            });
        }

        const html = `
            <!DOCTYPE html>
            <html dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}" lang="${currentLang}">
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: ${currentLang === 'ar' ? 'right' : 'left'}; }
                    th { background-color: #2563eb; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .date { color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${currentLang === 'ar' ? 'تقرير' : 'Report'}: ${filename}</h1>
                    <p class="date">${currentLang === 'ar' ? 'تاريخ الطباعة:' : 'Print Date:'} ${new Date().toLocaleString(currentLang)}</p>
                </div>
                <table>
                    ${tableRows}
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Report generation is handled via inline onclick handlers in the HTML
        console.log('Reports module initialized');
    }
};

// Make generateReport function available globally for HTML onclick handlers
window.generateReport = (type, format) => {
    Reports.generate(type, format);
};

// Initialize reports module when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reportsPage')) {
        Reports.init();
    }
});

// Make Reports available globally
window.Reports = Reports;
