/**
 * HR Pro System - Language Translations
 * Multi-language support for Arabic and English
 */

const translations = {
    ar: {
        // General
        systemTitle: 'HR Pro System',
        loginSubtitle: 'نظام إدارة الموارد البشرية الاحترافي',
        home: 'الرئيسية',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        add: 'إضافة',
        search: 'بحث',
        export: 'تصدير',
        import: 'استيراد',
        loading: 'جاري التحميل...',
        noData: 'لا توجد بيانات',
        confirm: 'تأكيد',
        
        // Login
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        rememberMe: 'تذكرني',
        forgotPassword: 'نسيت كلمة المرور؟',
        login: 'تسجيل الدخول',
        logout: 'خروج',
        
        // Dashboard
        dashboard: 'لوحة التحكم',
        totalEmployees: 'إجمالي الموظفين',
        activeTasks: 'المهام النشطة',
        pendingTransfers: 'طلبات الانتظار',
        totalAdvances: 'إجمالي السلف',
        employeeDistribution: 'توزيع الموظفين',
        monthlyTasks: 'المهام الشهرية',
        recentActivity: 'النشاط الأخير',
        
        // Employees
        employees: 'الموظفين',
        addEmployee: 'إضافة موظف',
        searchEmployee: 'بحث عن موظف...',
        allDepartments: 'جميع الأقسام',
        allStatuses: 'جميع الحالات',
        active: 'نشط',
        inactive: 'غير نشط',
        onLeave: 'في إجازة',
        employeeId: 'رقم الموظف',
        name: 'الاسم',
        department: 'القسم',
        position: 'المنصب',
        joinDate: 'تاريخ التعيين',
        status: 'الحالة',
        actions: 'الإجراءات',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        salary: 'الراتب',
        
        // Tasks
        tasks: 'المهام',
        addTask: 'إضافة مهمة',
        toDo: 'للتنفيذ',
        inProgress: 'قيد التنفيذ',
        review: 'مراجعة',
        done: 'مكتمل',
        taskTitle: 'عنوان المهمة',
        description: 'الوصف',
        assignedTo: 'مسندة إلى',
        priority: 'الأولوية',
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        urgent: 'عاجلة',
        dueDate: 'تاريخ الاستحقاق',
        
        // Transfers
        transfers: 'الانتقالات',
        requestTransfer: 'طلب نقل',
        transferId: 'رقم الطلب',
        employee: 'الموظف',
        fromDepartment: 'من القسم',
        toDepartment: 'إلى القسم',
        requestDate: 'تاريخ الطلب',
        pending: 'قيد الانتظار',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        
        // Custodies
        custodies: 'العهد والأصول',
        addCustody: 'إضافة عهد',
        assetId: 'رقم الأصل',
        assetName: 'اسم الأصل',
        assetType: 'النوع',
        assignmentDate: 'تاريخ الإسناد',
        returnDate: 'تاريخ الإرجاع المتوقع',
        
        // Finances
        finances: 'السلف والتحصيلات',
        requestAdvance: 'طلب سلفة',
        advanceId: 'رقم السلفة',
        amount: 'المبلغ',
        installments: 'الأقساط',
        remaining: 'المتبقي',
        pendingRequests: 'الطلبات المعلقة',
        thisMonth: 'هذا الشهر',
        
        // Reports
        reports: 'التقارير',
        employeeReport: 'تقرير الموظفين',
        employeeReportDesc: 'تقرير شامل عن جميع الموظفين',
        tasksReport: 'تقرير المهام',
        tasksReportDesc: 'أداء المهام والإنجازات',
        financesReport: 'تقرير المالية',
        financesReportDesc: 'السلف والتحصيلات المالية',
        attendanceReport: 'تقرير الحضور',
        attendanceReportDesc: 'سجل الحضور والغياب',
        
        // Settings
        settings: 'الإعدادات',
        generalSettings: 'الإعدادات العامة',
        companyName: 'اسم الشركة',
        workingHours: 'ساعات العمل',
        weekendDays: 'أيام العطلة',
        appearanceSettings: 'إعدادات المظهر',
        theme: 'السمة',
        light: 'فاتح',
        dark: 'داكن',
        blue: 'أزرق',
        language: 'اللغة',
        enableAnimations: 'تفعيل الرسوم المتحركة',
        securitySettings: 'إعدادات الأمان',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        changePassword: 'تغيير كلمة المرور',
        backupSettings: 'النسخ الاحتياطي',
        backupNow: 'نسخ احتياطي الآن',
        restoreData: 'استعادة بيانات',
        clearData: 'مسح البيانات',
        
        // Notifications
        notifications: 'الإشعارات',
        markAllRead: 'تحديد الكل كمقروء',
        noNotifications: 'لا توجد إشعارات جديدة',
        
        // Messages
        loginSuccess: 'تم تسجيل الدخول بنجاح',
        loginFailed: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        saveSuccess: 'تم الحفظ بنجاح',
        saveFailed: 'فشل الحفظ',
        deleteSuccess: 'تم الحذف بنجاح',
        deleteConfirm: 'هل أنت متأكد من الحذف؟',
        required: 'هذا الحقل مطلوب',
        invalidEmail: 'البريد الإلكتروني غير صحيح',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        
        // Placeholders
        searchPlaceholder: 'بحث شامل...'
    },
    
    en: {
        // General
        systemTitle: 'HR Pro System',
        loginSubtitle: 'Professional Human Resources Management System',
        home: 'Home',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        add: 'Add',
        search: 'Search',
        export: 'Export',
        import: 'Import',
        loading: 'Loading...',
        noData: 'No Data',
        confirm: 'Confirm',
        
        // Login
        username: 'Username',
        password: 'Password',
        rememberMe: 'Remember Me',
        forgotPassword: 'Forgot Password?',
        login: 'Login',
        logout: 'Logout',
        
        // Dashboard
        dashboard: 'Dashboard',
        totalEmployees: 'Total Employees',
        activeTasks: 'Active Tasks',
        pendingTransfers: 'Pending Transfers',
        totalAdvances: 'Total Advances',
        employeeDistribution: 'Employee Distribution',
        monthlyTasks: 'Monthly Tasks',
        recentActivity: 'Recent Activity',
        
        // Employees
        employees: 'Employees',
        addEmployee: 'Add Employee',
        searchEmployee: 'Search employee...',
        allDepartments: 'All Departments',
        allStatuses: 'All Statuses',
        active: 'Active',
        inactive: 'Inactive',
        onLeave: 'On Leave',
        employeeId: 'Employee ID',
        name: 'Name',
        department: 'Department',
        position: 'Position',
        joinDate: 'Join Date',
        status: 'Status',
        actions: 'Actions',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        salary: 'Salary',
        
        // Tasks
        tasks: 'Tasks',
        addTask: 'Add Task',
        toDo: 'To Do',
        inProgress: 'In Progress',
        review: 'Review',
        done: 'Done',
        taskTitle: 'Task Title',
        description: 'Description',
        assignedTo: 'Assigned To',
        priority: 'Priority',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent',
        dueDate: 'Due Date',
        
        // Transfers
        transfers: 'Transfers',
        requestTransfer: 'Request Transfer',
        transferId: 'Transfer ID',
        employee: 'Employee',
        fromDepartment: 'From Department',
        toDepartment: 'To Department',
        requestDate: 'Request Date',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        
        // Custodies
        custodies: 'Custodies',
        addCustody: 'Add Custody',
        assetId: 'Asset ID',
        assetName: 'Asset Name',
        assetType: 'Type',
        assignmentDate: 'Assignment Date',
        returnDate: 'Expected Return Date',
        
        // Finances
        finances: 'Finances',
        requestAdvance: 'Request Advance',
        advanceId: 'Advance ID',
        amount: 'Amount',
        installments: 'Installments',
        remaining: 'Remaining',
        pendingRequests: 'Pending Requests',
        thisMonth: 'This Month',
        
        // Reports
        reports: 'Reports',
        employeeReport: 'Employee Report',
        employeeReportDesc: 'Comprehensive employee report',
        tasksReport: 'Tasks Report',
        tasksReportDesc: 'Task performance and achievements',
        financesReport: 'Finances Report',
        financesReportDesc: 'Advances and financial collections',
        attendanceReport: 'Attendance Report',
        attendanceReportDesc: 'Attendance and absence records',
        
        // Settings
        settings: 'Settings',
        generalSettings: 'General Settings',
        companyName: 'Company Name',
        workingHours: 'Working Hours',
        weekendDays: 'Weekend Days',
        appearanceSettings: 'Appearance Settings',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        blue: 'Blue',
        language: 'Language',
        enableAnimations: 'Enable Animations',
        securitySettings: 'Security Settings',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        changePassword: 'Change Password',
        backupSettings: 'Backup Settings',
        backupNow: 'Backup Now',
        restoreData: 'Restore Data',
        clearData: 'Clear Data',
        
        // Notifications
        notifications: 'Notifications',
        markAllRead: 'Mark All as Read',
        noNotifications: 'No new notifications',
        
        // Messages
        loginSuccess: 'Login successful',
        loginFailed: 'Invalid username or password',
        saveSuccess: 'Saved successfully',
        saveFailed: 'Save failed',
        deleteSuccess: 'Deleted successfully',
        deleteConfirm: 'Are you sure you want to delete?',
        required: 'This field is required',
        invalidEmail: 'Invalid email address',
        passwordMismatch: 'Passwords do not match',
        
        // Placeholders
        searchPlaceholder: 'Global search...'
    }
};

// Current language
let currentLang = 'ar';

/**
 * Set application language
 * @param {string} lang - Language code (ar/en)
 */
function setLanguage(lang) {
    if (!translations[lang]) return;
    
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update all elements with data-lang attribute
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Save to localStorage
    localStorage.setItem('hrpro_language', lang);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Get translation by key
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function t(key) {
    return translations[currentLang][key] || key;
}

/**
 * Initialize language from localStorage or default
 */
function initLanguage() {
    const savedLang = localStorage.getItem('hrpro_language') || 'ar';
    setLanguage(savedLang);
}

// Export functions
window.setLanguage = setLanguage;
window.t = t;
window.initLanguage = initLanguage;
