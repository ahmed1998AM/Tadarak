/**
 * HR Pro System - Employees Module
 * Handles employee management, CRUD operations, search, and filtering
 */

class Employees {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.currentView = 'grid'; // grid or list
        this.init();
    }

    init() {
        this.loadEmployees();
        this.setupEventListeners();
        this.render();
    }

    // Load employees from localStorage
    loadEmployees() {
        const stored = localStorage.getItem('hrpro_employees');
        if (stored) {
            this.employees = JSON.parse(stored);
        } else {
            // Initialize with sample data
            this.employees = this.getSampleEmployees();
            this.save();
        }
        this.filteredEmployees = [...this.employees];
    }

    // Get sample employees
    getSampleEmployees() {
        return [
            {
                id: 1,
                fullName: 'أحمد محمد علي',
                email: 'ahmed@company.com',
                phone: '0501234567',
                department: 'IT',
                position: 'مطور برمجيات',
                joinDate: '2023-01-15',
                salary: 15000,
                status: 'active',
                avatar: 'assets/images/default-avatar.png'
            },
            {
                id: 2,
                fullName: 'فاطمة حسن أحمد',
                email: 'fatima@company.com',
                phone: '0502345678',
                department: 'HR',
                position: 'أخصائي موارد بشرية',
                joinDate: '2022-06-20',
                salary: 12000,
                status: 'active',
                avatar: 'assets/images/default-avatar.png'
            },
            {
                id: 3,
                fullName: 'محمد سعيد العمري',
                email: 'mohammed@company.com',
                phone: '0503456789',
                department: 'Finance',
                position: 'محاسب',
                joinDate: '2023-03-10',
                salary: 13000,
                status: 'active',
                avatar: 'assets/images/default-avatar.png'
            },
            {
                id: 4,
                fullName: 'نورة خالد Ibrahim',
                email: 'noura@company.com',
                phone: '0504567890',
                department: 'Operations',
                position: 'مدير عمليات',
                joinDate: '2021-11-05',
                salary: 18000,
                status: 'onLeave',
                avatar: 'assets/images/default-avatar.png'
            },
            {
                id: 5,
                fullName: 'خالد عبدالله السعيد',
                email: 'khaled@company.com',
                phone: '0505678901',
                department: 'IT',
                position: 'مدير تقنية المعلومات',
                joinDate: '2020-08-15',
                salary: 25000,
                status: 'active',
                avatar: 'assets/images/default-avatar.png'
            }
        ];
    }

    // Save employees to localStorage
    save() {
        localStorage.setItem('hrpro_employees', JSON.stringify(this.employees));
    }

    // Render employees
    render() {
        const grid = document.getElementById('employeesGrid');
        if (!grid) return;

        if (this.filteredEmployees.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p data-lang="noEmployees">لا يوجد موظفين</p>
                </div>
            `;
            return;
        }

        if (this.currentView === 'grid') {
            grid.className = 'employees-grid';
            grid.innerHTML = this.filteredEmployees.map(emp => this.createEmployeeCard(emp)).join('');
        } else {
            grid.className = 'employees-list';
            grid.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th data-lang="employee">الموظف</th>
                            <th data-lang="department">القسم</th>
                            <th data-lang="position">الوظيفة</th>
                            <th data-lang="status">الحالة</th>
                            <th data-lang="actions">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredEmployees.map(emp => this.createEmployeeRow(emp)).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    // Create employee card
    createEmployeeCard(emp) {
        const statusClass = emp.status === 'active' ? 'active' : emp.status === 'onLeave' ? 'warning' : 'inactive';
        const statusText = emp.status === 'active' ? 'نشط' : emp.status === 'onLeave' ? 'في إجازة' : 'غير نشط';
        
        return `
            <div class="employee-card" data-id="${emp.id}">
                <div class="employee-header">
                    <img src="${emp.avatar}" alt="${emp.fullName}" class="employee-avatar">
                    <div class="employee-status ${statusClass}"></div>
                </div>
                <div class="employee-body">
                    <h3 class="employee-name">${emp.fullName}</h3>
                    <p class="employee-position">${emp.position}</p>
                    <div class="employee-info">
                        <span><i class="fas fa-building"></i> ${this.getDepartmentName(emp.department)}</span>
                        <span><i class="fas fa-envelope"></i> ${emp.email}</span>
                        <span><i class="fas fa-phone"></i> ${emp.phone}</span>
                    </div>
                </div>
                <div class="employee-footer">
                    <button class="btn btn-sm btn-outline" onclick="employees.viewEmployee(${emp.id})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="employees.editEmployee(${emp.id})">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="employees.deleteEmployee(${emp.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    }

    // Create employee row
    createEmployeeRow(emp) {
        const statusClass = emp.status === 'active' ? 'badge-success' : emp.status === 'onLeave' ? 'badge-warning' : 'badge-danger';
        const statusText = emp.status === 'active' ? 'نشط' : emp.status === 'onLeave' ? 'في إجازة' : 'غير نشط';
        
        return `
            <tr data-id="${emp.id}">
                <td>
                    <div class="user-cell">
                        <img src="${emp.avatar}" alt="${emp.fullName}" class="user-avatar-small">
                        <div>
                            <div class="user-name">${emp.fullName}</div>
                            <div class="user-email">${emp.email}</div>
                        </div>
                    </div>
                </td>
                <td>${this.getDepartmentName(emp.department)}</td>
                <td>${emp.position}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-icon-sm" onclick="employees.viewEmployee(${emp.id})" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon-sm" onclick="employees.editEmployee(${emp.id})" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon-sm" onclick="employees.deleteEmployee(${emp.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Get department name
    getDepartmentName(dept) {
        const names = {
            'IT': 'تقنية المعلومات',
            'HR': 'الموارد البشرية',
            'Finance': 'المالية',
            'Operations': 'العمليات'
        };
        return names[dept] || dept;
    }

    // Filter employees
    filter() {
        const searchTerm = document.getElementById('employeeSearch')?.value.toLowerCase() || '';
        const deptFilter = document.getElementById('departmentFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        this.filteredEmployees = this.employees.filter(emp => {
            const matchesSearch = !searchTerm || 
                emp.fullName.toLowerCase().includes(searchTerm) ||
                emp.email.toLowerCase().includes(searchTerm) ||
                emp.position.toLowerCase().includes(searchTerm);
            
            const matchesDept = !deptFilter || emp.department === deptFilter;
            const matchesStatus = !statusFilter || emp.status === statusFilter;

            return matchesSearch && matchesDept && matchesStatus;
        });

        this.render();
    }

    // Add new employee
    async addEmployee(employeeData) {
        const newId = Math.max(0, ...this.employees.map(e => e.id)) + 1;
        
        const newEmployee = {
            id: newId,
            ...employeeData,
            avatar: 'assets/images/default-avatar.png',
            createdAt: new Date().toISOString()
        };

        this.employees.push(newEmployee);
        this.save();
        this.filter();

        // Log activity
        auth.logActivity('add_employee', `إضافة الموظف ${newEmployee.fullName}`);

        // Send notification
        notifications.add({
            title: 'تم الإضافة',
            message: `تم إضافة الموظف ${newEmployee.fullName} بنجاح`,
            type: 'success',
            icon: 'fas fa-user-plus'
        });

        return newEmployee;
    }

    // Edit employee
    editEmployee(id) {
        const employee = this.employees.find(e => e.id === id);
        if (!employee) return;

        // Open modal with employee data (to be implemented)
        console.log('Edit employee:', employee);
        // In a real app, populate the modal form and show it
    }

    // View employee details
    viewEmployee(id) {
        const employee = this.employees.find(e => e.id === id);
        if (!employee) return;

        // Show employee details modal (to be implemented)
        console.log('View employee:', employee);
    }

    // Delete employee
    deleteEmployee(id) {
        const employee = this.employees.find(e => e.id === id);
        if (!employee) return;

        if (confirm(`هل أنت متأكد من حذف الموظف ${employee.fullName}؟`)) {
            this.employees = this.employees.filter(e => e.id !== id);
            this.save();
            this.filter();

            // Log activity
            auth.logActivity('delete_employee', `حذف الموظف ${employee.fullName}`);

            // Send notification
            notifications.add({
                title: 'تم الحذف',
                message: `تم حذف الموظف ${employee.fullName} بنجاح`,
                type: 'warning',
                icon: 'fas fa-user-times'
            });
        }
    }

    // Export employees
    exportEmployees(format = 'json') {
        let content, mimeType, extension;

        if (format === 'excel') {
            // Simple CSV export
            const headers = ['ID', 'الاسم', 'البريد', 'الهاتف', 'القسم', 'الوظيفة', 'الحالة'];
            const rows = this.employees.map(emp => [
                emp.id,
                emp.fullName,
                emp.email,
                emp.phone,
                emp.department,
                emp.position,
                emp.status
            ]);

            content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            mimeType = 'text/csv';
            extension = 'csv';
        } else {
            content = JSON.stringify(this.employees, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees-export-${new Date().toISOString().split('T')[0]}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);

        notifications.add({
            title: 'تم التصدير',
            message: 'تم تصدير قائمة الموظفين بنجاح',
            type: 'success',
            icon: 'fas fa-file-export'
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Search and filters
        document.getElementById('employeeSearch')?.addEventListener('input', () => this.filter());
        document.getElementById('departmentFilter')?.addEventListener('change', () => this.filter());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filter());

        // View toggle
        document.getElementById('gridView')?.addEventListener('click', () => {
            this.currentView = 'grid';
            document.getElementById('gridView').classList.add('active');
            document.getElementById('listView')?.classList.remove('active');
            this.render();
        });

        document.getElementById('listView')?.addEventListener('click', () => {
            this.currentView = 'list';
            document.getElementById('listView').classList.add('active');
            document.getElementById('gridView')?.classList.remove('active');
            this.render();
        });

        // Add employee button
        document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
            document.getElementById('addEmployeeModal').classList.add('active');
        });

        // Add employee form
        document.getElementById('addEmployeeForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            await this.addEmployee(data);
            
            document.getElementById('addEmployeeModal').classList.remove('active');
            e.target.reset();
        });

        // Export button
        document.getElementById('exportEmployees')?.addEventListener('click', () => {
            this.exportEmployees('excel');
        });

        // Close modal buttons
        document.querySelectorAll('#addEmployeeModal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('addEmployeeModal').classList.remove('active');
            });
        });
    }
}

// Initialize employees instance
const employees = new Employees();
