/**
 * HR Pro System - Employees Module
 * Handles employee management (CRUD operations)
 */

const Employees = {
    // Default departments
    departments: [
        'الإدارة',
        'الموارد البشرية',
        'تقنية المعلومات',
        'المالية',
        'المبيعات',
        'التسويق',
        'الدعم الفني',
        'العمليات',
        'الجودة',
        'الأمن'
    ],

    /**
     * Initialize employees module
     */
    init() {
        this.loadEmployees();
        this.populateDepartmentFilter();
        this.setupEventListeners();
    },

    /**
     * Load employees from localStorage
     * @returns {Array} Employees array
     */
    loadEmployees() {
        return Utils.storage.get('hr_employees', []);
    },

    /**
     * Save employees to localStorage
     * @param {Array} employees - Employees to save
     */
    saveEmployees(employees) {
        Utils.storage.set('hr_employees', employees);
        this.triggerDataChanged();
    },

    /**
     * Get all employees
     * @returns {Array} All employees
     */
    getAll() {
        return this.loadEmployees();
    },

    /**
     * Get employee by ID
     * @param {string} id - Employee ID
     * @returns {Object|null} Employee or null
     */
    getById(id) {
        const employees = this.loadEmployees();
        return employees.find(e => e.id === id) || null;
    },

    /**
     * Add new employee
     * @param {Object} employeeData - Employee data
     * @returns {boolean} Success status
     */
    add(employeeData) {
        try {
            const employees = this.loadEmployees();
            
            // Check if email already exists
            if (employeeData.email && employees.some(e => e.email === employeeData.email)) {
                Utils.showToast('البريد الإلكتروني موجود بالفعل', 'error');
                return false;
            }

            const newEmployee = {
                id: Utils.generateId(),
                fullName: employeeData.fullName,
                email: employeeData.email,
                phone: employeeData.phone,
                department: employeeData.department,
                position: employeeData.position,
                joinDate: employeeData.joinDate,
                salary: parseFloat(employeeData.salary) || 0,
                status: employeeData.status || 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            employees.push(newEmployee);
            this.saveEmployees(employees);

            // Also create user account
            if (employeeData.createAccount) {
                Auth.register({
                    username: employeeData.email.split('@')[0],
                    password: employeeData.password || '123456',
                    name: employeeData.fullName,
                    email: employeeData.email,
                    department: employeeData.department,
                    role: 'employee'
                });
            }

            Utils.showToast('تم إضافة الموظف بنجاح', 'success');
            
            // Notify (only if Notifications is available)
            if (typeof Notifications !== 'undefined') {
                try {
                    Notifications.add({
                        title: 'موظف جديد',
                        message: `تم إضافة ${employeeData.fullName} إلى النظام`,
                        type: Notifications.types.SUCCESS,
                        icon: 'fas fa-user-plus'
                    });
                } catch (e) {
                    console.log('Notification error:', e);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Add employee error:', error);
            Utils.showToast('حدث خطأ أثناء إضافة الموظف', 'error');
            return false;
        }
    },

    /**
     * Update employee
     * @param {string} id - Employee ID
     * @param {Object} employeeData - Updated employee data
     * @returns {boolean} Success status
     */
    update(id, employeeData) {
        try {
            const employees = this.loadEmployees();
            const index = employees.findIndex(e => e.id === id);

            if (index === -1) {
                Utils.showToast('الموظف غير موجود', 'error');
                return false;
            }

            employees[index] = {
                ...employees[index],
                ...employeeData,
                updatedAt: new Date().toISOString()
            };

            this.saveEmployees(employees);
            Utils.showToast('تم تحديث بيانات الموظف بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Update employee error:', error);
            Utils.showToast('حدث خطأ أثناء تحديث الموظف', 'error');
            return false;
        }
    },

    /**
     * Delete employee
     * @param {string} id - Employee ID
     * @returns {boolean} Success status
     */
    delete(id) {
        try {
            // Check permission
            if (!RBAC || !RBAC.hasPermission('employees.delete')) {
                Utils.showToast(currentLang === 'ar' ? 'ليس لديك صلاحية حذف الموظف' : 'You do not have permission to delete employees', 'error');
                return false;
            }

            if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
                return false;
            }

            let employees = this.loadEmployees();
            employees = employees.filter(e => e.id !== id);
            this.saveEmployees(employees);

            Utils.showToast('تم حذف الموظف بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Delete employee error:', error);
            Utils.showToast('حدث خطأ أثناء حذف الموظف', 'error');
            return false;
        }
    },

    /**
     * Toggle employee status
     * @param {string} id - Employee ID
     * @returns {boolean} Success status
     */
    toggleStatus(id) {
        try {
            // Check permission
            if (!RBAC || !RBAC.hasPermission('employees.update')) {
                Utils.showToast(currentLang === 'ar' ? 'ليس لديك صلاحية تغيير حالة الموظف' : 'You do not have permission to change employee status', 'error');
                return false;
            }

            const employees = this.loadEmployees();
            const index = employees.findIndex(e => e.id === id);

            if (index === -1) {
                Utils.showToast('الموظف غير موجود', 'error');
                return false;
            }

            const newStatus = employees[index].status === 'active' ? 'inactive' : 'active';
            employees[index].status = newStatus;
            employees[index].updatedAt = new Date().toISOString();

            this.saveEmployees(employees);
            Utils.showToast(
                newStatus === 'active' ? 'تم تفعيل الموظف' : 'تم تعطيل الموظف',
                'success'
            );
            return true;
        } catch (error) {
            console.error('Toggle status error:', error);
            Utils.showToast('حدث خطأ أثناء تغيير حالة الموظف', 'error');
            return false;
        }
    },

    /**
     * Edit employee (open modal)
     * @param {string} id - Employee ID
     */
    edit(id) {
        // Check permission
        if (!RBAC || !RBAC.hasPermission('employees.update')) {
            Utils.showToast(currentLang === 'ar' ? 'ليس لديك صلاحية تعديل الموظف' : 'You do not have permission to edit employees', 'error');
            return;
        }

        const employee = this.getById(id);
        if (!employee) return;

        // Fill modal with employee data
        document.getElementById('employeeModalTitle').textContent = currentLang === 'ar' ? 'تعديل موظف' : 'Edit Employee';
        document.getElementById('empFullName').value = employee.fullName;
        document.getElementById('empEmail').value = employee.email;
        document.getElementById('empPhone').value = employee.phone;
        document.getElementById('empDepartment').value = employee.department;
        document.getElementById('empPosition').value = employee.position;
        document.getElementById('empJoinDate').value = employee.joinDate.split('T')[0];
        document.getElementById('empSalary').value = employee.salary;
        document.getElementById('empStatus').value = employee.status;

        // Store editing ID
        document.getElementById('employeeForm').dataset.editId = id;

        // Open modal
        document.getElementById('employeeModal').classList.add('active');
    },

    /**
     * Populate department filter dropdown
     */
    populateDepartmentFilter() {
        const departmentFilter = document.getElementById('departmentFilter');
        const empDepartment = document.getElementById('empDepartment');

        if (departmentFilter) {
            this.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                if (currentLang === 'en') {
                    option.textContent = this.translateDepartment(dept);
                }
                departmentFilter.appendChild(option);
            });
        }

        if (empDepartment) {
            this.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                if (currentLang === 'en') {
                    option.textContent = this.translateDepartment(dept);
                }
                empDepartment.appendChild(option);
            });
        }
    },

    /**
     * Translate department name
     * @param {string} dept - Department name in Arabic
     * @returns {string} Department name in English
     */
    translateDepartment(dept) {
        const translations = {
            'الإدارة': 'Administration',
            'الموارد البشرية': 'Human Resources',
            'تقنية المعلومات': 'IT',
            'المالية': 'Finance',
            'المبيعات': 'Sales',
            'التسويق': 'Marketing',
            'الدعم الفني': 'Technical Support',
            'العمليات': 'Operations',
            'الجودة': 'Quality',
            'الأمن': 'Security'
        };
        return translations[dept] || dept;
    },

    /**
     * Render employees table
     */
    renderTable() {
        const tbody = document.getElementById('employeesTableBody');
        if (!tbody) return;

        let employees = this.loadEmployees();

        // Apply filters
        const searchTerm = document.getElementById('employeeSearch')?.value.toLowerCase() || '';
        const departmentFilter = document.getElementById('departmentFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        if (searchTerm) {
            employees = employees.filter(e => 
                e.fullName.toLowerCase().includes(searchTerm) ||
                e.email.toLowerCase().includes(searchTerm) ||
                e.position.toLowerCase().includes(searchTerm)
            );
        }

        if (departmentFilter) {
            employees = employees.filter(e => e.department === departmentFilter);
        }

        if (statusFilter) {
            employees = employees.filter(e => e.status === statusFilter);
        }

        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">${currentLang === 'ar' ? 'لا توجد بيانات' : 'No data available'}</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = employees.map(emp => `
            <tr data-id="${emp.id}">
                <td>${emp.id.substring(0, 8)}</td>
                <td>
                    <div class="employee-name">
                        <span>${emp.fullName}</span>
                        <small>${emp.email}</small>
                    </div>
                </td>
                <td>${emp.department}</td>
                <td>${emp.position}</td>
                <td>${Utils.formatDate(emp.joinDate)}</td>
                <td><span class="badge ${Utils.getStatusClass(emp.status)}">${Utils.getStatusLabel(emp.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="Employees.edit('${emp.id}')" title="${currentLang === 'ar' ? 'تعديل' : 'Edit'}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-toggle-status" onclick="Employees.toggleStatus('${emp.id}')" title="${currentLang === 'ar' ? 'تغيير الحالة' : 'Toggle Status'}">
                            <i class="fas fa-${emp.status === 'active' ? 'ban' : 'check'}"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="Employees.delete('${emp.id}')" title="${currentLang === 'ar' ? 'حذف' : 'Delete'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Edit employee (open modal)
     * @param {string} id - Employee ID
     */
    edit(id) {
        // Check permission
        if (!RBAC || !RBAC.hasPermission('employees.update')) {
            Utils.showToast(currentLang === 'ar' ? 'ليس لديك صلاحية تعديل الموظف' : 'You do not have permission to edit employees', 'error');
            return;
        }

        const employee = this.getById(id);
        if (!employee) return;

        // Fill modal with employee data
        document.getElementById('employeeModalTitle').textContent = currentLang === 'ar' ? 'تعديل موظف' : 'Edit Employee';
        document.getElementById('empFullName').value = employee.fullName;
        document.getElementById('empEmail').value = employee.email;
        document.getElementById('empPhone').value = employee.phone;
        document.getElementById('empDepartment').value = employee.department;
        document.getElementById('empPosition').value = employee.position;
        document.getElementById('empJoinDate').value = employee.joinDate.split('T')[0];
        document.getElementById('empSalary').value = employee.salary;
        document.getElementById('empStatus').value = employee.status;

        // Store editing ID
        document.getElementById('employeeForm').dataset.editId = id;

        // Open modal
        document.getElementById('employeeModal').classList.add('active');
    },

    /**
     * Export employees to CSV
     */
    exportToCSV() {
        const employees = this.loadEmployees();
        
        if (employees.length === 0) {
            Utils.showToast('لا توجد بيانات للتصدير', 'warning');
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

        Utils.exportToCSV(data, 'employees.csv');
        Utils.showToast('تم تصدير البيانات بنجاح', 'success');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add employee button - check permission first
        const addBtn = document.getElementById('addEmployeeBtn');
        if (addBtn) {
            // Permission check is handled by PermissionEnforcer via data-permission attribute
            addBtn.addEventListener('click', () => {
                if (!RBAC || !RBAC.hasPermission('employees.create')) {
                    Utils.showToast(currentLang === 'ar' ? 'ليس لديك صلاحية إضافة موظف' : 'You do not have permission to add employees', 'error');
                    return;
                }
                document.getElementById('employeeModalTitle').textContent = currentLang === 'ar' ? 'إضافة موظف' : 'Add Employee';
                document.getElementById('employeeForm').reset();
                delete document.getElementById('employeeForm').dataset.editId;
                document.getElementById('employeeModal').classList.add('active');
            });
        }

        // Employee form submit
        const form = document.getElementById('employeeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                // Check permission based on action
                const editId = form.dataset.editId;
                const requiredPermission = editId ? 'employees.update' : 'employees.create';
                
                if (!RBAC || !RBAC.hasPermission(requiredPermission)) {
                    Utils.showToast(
                        currentLang === 'ar' 
                            ? (editId ? 'ليس لديك صلاحية تعديل الموظف' : 'ليس لديك صلاحية إضافة موظف')
                            : (editId ? 'You do not have permission to edit employees' : 'You do not have permission to add employees'),
                        'error'
                    );
                    return;
                }

                const formData = {
                    fullName: document.getElementById('empFullName').value,
                    email: document.getElementById('empEmail').value,
                    phone: document.getElementById('empPhone').value,
                    department: document.getElementById('empDepartment').value,
                    position: document.getElementById('empPosition').value,
                    joinDate: document.getElementById('empJoinDate').value,
                    salary: document.getElementById('empSalary').value,
                    status: document.getElementById('empStatus').value
                };

                if (editId) {
                    this.update(editId, formData);
                } else {
                    this.add(formData);
                }

                document.getElementById('employeeModal').classList.remove('active');
                this.renderTable();
                Dashboard.refresh();
            });
        }

        // Search and filter inputs
        ['employeeSearch', 'departmentFilter', 'statusFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.renderTable());
                el.addEventListener('change', () => this.renderTable());
            }
        });

        // Export button - check permission
        const exportBtn = document.getElementById('exportEmployeesBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!RBAC || !RBAC.hasPermission('employees.export')) {
                    Utils.showToast(currentLang === 'ar' ? 'ليس لديك صلاحية التصدير' : 'You do not have permission to export', 'error');
                    return;
                }
                this.exportToCSV();
            });
        }

        // Modal close buttons
        document.querySelectorAll('#employeeModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('employeeModal').classList.remove('active');
            });
        });

        // Close modal on outside click
        document.getElementById('employeeModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'employeeModal') {
                document.getElementById('employeeModal').classList.remove('active');
            }
        });

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
     * Trigger data changed event
     */
    triggerDataChanged() {
        window.dispatchEvent(new CustomEvent('hr-data-changed', { detail: { type: 'employees' } }));
    }
};

// Initialize employees module when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('employeesPage')) {
        Employees.init();
    }
});

// Make Employees available globally
window.Employees = Employees;
