/**
 * HR Pro System - Custodies Module
 * Handles assets, equipment tracking, and custody management
 */

class Custodies {
    constructor() {
        this.custodies = [];
        this.init();
    }

    init() {
        this.loadCustodies();
        this.setupEventListeners();
        this.render();
    }

    loadCustodies() {
        const stored = localStorage.getItem('hrpro_custodies');
        if (stored) {
            this.custodies = JSON.parse(stored);
        } else {
            this.custodies = this.getSampleCustodies();
            this.save();
        }
    }

    getSampleCustodies() {
        return [
            {
                id: 1,
                itemName: 'MacBook Pro 16"',
                type: 'laptop',
                serialNumber: 'SN123456789',
                assignedTo: 'أحمد محمد علي',
                assignedToId: 1,
                department: 'IT',
                status: 'active',
                purchaseDate: '2023-01-15',
                warrantyDate: '2026-01-15',
                value: 8500,
                notes: 'جهاز عمل'
            },
            {
                id: 2,
                itemName: 'iPhone 14 Pro',
                type: 'phone',
                serialNumber: 'SN987654321',
                assignedTo: 'فاطمة حسن أحمد',
                assignedToId: 2,
                department: 'HR',
                status: 'active',
                purchaseDate: '2023-03-20',
                warrantyDate: '2025-03-20',
                value: 4500,
                notes: 'هاتف عمل'
            },
            {
                id: 3,
                itemName: 'iPad Air',
                type: 'tablet',
                serialNumber: 'SN456789123',
                assignedTo: 'خالد عبدالله السعيد',
                assignedToId: 5,
                department: 'IT',
                status: 'maintenance',
                purchaseDate: '2022-11-10',
                warrantyDate: '2024-11-10',
                value: 2800,
                notes: 'بحاجة لصيانة'
            },
            {
                id: 4,
                itemName: 'Dell Monitor 27"',
                type: 'other',
                serialNumber: 'SN789123456',
                assignedTo: 'محمد سعيد العمري',
                assignedToId: 3,
                department: 'Finance',
                status: 'active',
                purchaseDate: '2023-02-28',
                warrantyDate: '2026-02-28',
                value: 1200,
                notes: 'شاشة إضافية'
            },
            {
                id: 5,
                itemName: 'HP Laptop',
                type: 'laptop',
                serialNumber: 'SN321654987',
                assignedTo: null,
                assignedToId: null,
                department: 'IT',
                status: 'available',
                purchaseDate: '2023-05-15',
                warrantyDate: '2026-05-15',
                value: 3500,
                notes: 'متاح للتخصيص'
            }
        ];
    }

    save() {
        localStorage.setItem('hrpro_custodies', JSON.stringify(this.custodies));
    }

    render() {
        const grid = document.getElementById('custodiesGrid');
        if (!grid) return;

        const searchTerm = document.getElementById('custodySearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('custodyTypeFilter')?.value || '';

        let filtered = this.custodies;

        if (searchTerm) {
            filtered = filtered.filter(c => 
                c.itemName.toLowerCase().includes(searchTerm) ||
                c.serialNumber.toLowerCase().includes(searchTerm) ||
                (c.assignedTo && c.assignedTo.toLowerCase().includes(searchTerm))
            );
        }

        if (typeFilter) {
            filtered = filtered.filter(c => c.type === typeFilter);
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p data-lang="noCustodies">لا توجد عهد</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(custody => {
            const statusClass = custody.status === 'active' ? 'badge-success' : 
                               custody.status === 'maintenance' ? 'badge-warning' : 
                               custody.status === 'available' ? 'badge-info' : 'badge-danger';
            const statusText = custody.status === 'active' ? 'نشط' : 
                              custody.status === 'maintenance' ? 'صيانة' :
                              custody.status === 'available' ? 'متاح' : 'غير نشط';

            const isWarrantyExpiring = custody.warrantyDate && 
                new Date(custody.warrantyDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return `
                <div class="custody-card" data-id="${custody.id}">
                    <div class="custody-header">
                        <div class="custody-icon">
                            <i class="${this.getTypeIcon(custody.type)}"></i>
                        </div>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="custody-body">
                        <h3 class="custody-name">${custody.itemName}</h3>
                        <p class="custody-serial"><i class="fas fa-barcode"></i> ${custody.serialNumber}</p>
                        
                        ${custody.assignedTo ? `
                            <div class="custody-assignee">
                                <i class="fas fa-user"></i>
                                <span>${custody.assignedTo}</span>
                            </div>
                        ` : '<p class="custody-unassigned">غير مخصص</p>'}
                        
                        <div class="custody-details">
                            <div class="detail-item">
                                <i class="fas fa-tag"></i>
                                <span>${this.getTypeName(custody.type)}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-money-bill"></i>
                                <span>${custody.value.toLocaleString()} ر.س</span>
                            </div>
                        </div>
                        
                        <div class="custody-dates">
                            <div class="date-item">
                                <span class="label">تاريخ الشراء:</span>
                                <span>${custody.purchaseDate}</span>
                            </div>
                            <div class="date-item ${isWarrantyExpiring ? 'expiring' : ''}">
                                <span class="label">الضمان حتى:</span>
                                <span>${custody.warrantyDate}</span>
                                ${isWarrantyExpiring ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="custody-footer">
                        <button class="btn btn-sm btn-outline" onclick="custodies.viewDetails(${custody.id})">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                        ${custody.status === 'available' ? `
                            <button class="btn btn-sm btn-primary" onclick="custodies.assign(${custody.id})">
                                <i class="fas fa-user-plus"></i> تخصيص
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-warning" onclick="custodies.return(${custody.id})">
                                <i class="fas fa-undo"></i> إرجاع
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    getTypeIcon(type) {
        const icons = {
            'laptop': 'fas fa-laptop',
            'phone': 'fas fa-mobile-alt',
            'tablet': 'fas fa-tablet-alt',
            'other': 'fas fa-box'
        };
        return icons[type] || 'fas fa-box';
    }

    getTypeName(type) {
        const names = {
            'laptop': 'لابتوب',
            'phone': 'هاتف',
            'tablet': 'جهاز لوحي',
            'other': 'أخرى'
        };
        return names[type] || type;
    }

    addCustody(data) {
        const newCustody = {
            id: Math.max(0, ...this.custodies.map(c => c.id)) + 1,
            itemName: data.itemName,
            type: data.type,
            serialNumber: data.serialNumber,
            assignedTo: null,
            assignedToId: null,
            department: data.department,
            status: 'available',
            purchaseDate: data.purchaseDate,
            warrantyDate: data.warrantyDate,
            value: parseFloat(data.value),
            notes: data.notes || ''
        };

        this.custodies.push(newCustody);
        this.save();
        this.render();

        notifications.add({
            title: 'تم الإضافة',
            message: `تم إضافة العهد "${newCustody.itemName}"`,
            type: 'success',
            icon: 'fas fa-box'
        });

        return newCustody;
    }

    assign(id) {
        const index = this.custodies.findIndex(c => c.id === id);
        if (index === -1) return;

        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        const employeeId = prompt('اختر رقم الموظف:\n' + employees.map(e => `${e.id}. ${e.fullName}`).join('\n'));
        
        if (!employeeId) return;
        
        const employee = employees.find(e => e.id == employeeId);
        if (!employee) return;

        this.custodies[index].assignedTo = employee.fullName;
        this.custodies[index].assignedToId = employee.id;
        this.custodies[index].department = employee.department;
        this.custodies[index].status = 'active';
        
        this.save();
        this.render();

        auth.logActivity('assign_custody', `تخصيص ${this.custodies[index].itemName} لـ ${employee.fullName}`);

        notifications.add({
            title: 'تم التخصيص',
            message: `تم تخصيص ${this.custodies[index].itemName} لـ ${employee.fullName}`,
            type: 'success',
            icon: 'fas fa-check-circle'
        });
    }

    return(id) {
        const index = this.custodies.findIndex(c => c.id === id);
        if (index === -1) return;

        if (confirm(`هل تريد إرجاع ${this.custodies[index].itemName}؟`)) {
            this.custodies[index].assignedTo = null;
            this.custodies[index].assignedToId = null;
            this.custodies[index].department = null;
            this.custodies[index].status = 'available';
            
            this.save();
            this.render();

            auth.logActivity('return_custody', `إرجاع ${this.custodies[index].itemName}`);

            notifications.add({
                title: 'تم الإرجاع',
                message: 'تم إرجاع العهد بنجاح',
                type: 'info',
                icon: 'fas fa-undo'
            });
        }
    }

    viewDetails(id) {
        const custody = this.custodies.find(c => c.id === id);
        if (!custody) return;

        alert(`تفاصيل العهد:
الاسم: ${custody.itemName}
النوع: ${this.getTypeName(custody.type)}
الرقم التسلسلي: ${custody.serialNumber}
${custody.assignedTo ? 'المخصص له: ' + custody.assignedTo : 'غير مخصص'}
القسم: ${custody.department || '-'}
الحالة: ${custody.status}
القيمة: ${custody.value.toLocaleString()} ر.س
تاريخ الشراء: ${custody.purchaseDate}
تاريخ انتهاء الضمان: ${custody.warrantyDate}
ملاحظات: ${custody.notes || 'لا توجد'}`);
    }

    setupEventListeners() {
        document.getElementById('custodySearch')?.addEventListener('input', () => this.render());
        document.getElementById('custodyTypeFilter')?.addEventListener('change', () => this.render());

        document.getElementById('addCustodyBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    }

    showAddModal() {
        // Simple prompts for demo
        const itemName = prompt('اسم الجهاز/العهد:', '');
        if (!itemName) return;

        const type = prompt('النوع (laptop, phone, tablet, other):', 'laptop');
        if (!type) return;

        const serialNumber = prompt('الرقم التسلسلي:', '');
        if (!serialNumber) return;

        const department = prompt('القسم (IT, HR, Finance, Operations):', 'IT');
        if (!department) return;

        const purchaseDate = prompt('تاريخ الشراء (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        const warrantyDate = prompt('تاريخ انتهاء الضمان (YYYY-MM-DD):', '');
        const value = prompt('القيمة:', '');

        if (!value) return;

        this.addCustody({
            itemName,
            type,
            serialNumber,
            department,
            purchaseDate,
            warrantyDate,
            value
        });
    }
}

const custodies = new Custodies();
