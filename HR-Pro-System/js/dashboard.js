/**
 * HR Pro System - Dashboard Module
 * Handles dashboard KPIs, charts, and activity feed
 */

const Dashboard = {
    // Chart instances
    charts: {},

    /**
     * Initialize dashboard
     */
    init() {
        this.updateKPIs();
        this.renderCharts();
        this.renderActivityFeed();
        this.setupEventListeners();
    },

    /**
     * Update KPI cards
     */
    updateKPIs() {
        // Get data from storage
        const employees = Utils.storage.get('hr_employees', []);
        const tasks = Utils.storage.get('hr_tasks', []);
        const transfers = Utils.storage.get('hr_transfers', []);
        const finances = Utils.storage.get('hr_finances', []);

        // Calculate KPIs
        const totalEmployees = employees.filter(e => e.status === 'active').length;
        const activeTasks = tasks.filter(t => t.status !== 'done').length;
        const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
        const totalAdvances = finances
            .filter(f => f.type === 'advance' && f.status !== 'rejected')
            .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

        // Update DOM
        const totalEmployeesEl = document.getElementById('totalEmployees');
        const activeTasksEl = document.getElementById('activeTasks');
        const pendingTransfersEl = document.getElementById('pendingTransfers');
        const totalAdvancesEl = document.getElementById('totalAdvances');

        if (totalEmployeesEl) totalEmployeesEl.textContent = Utils.formatNumber(totalEmployees);
        if (activeTasksEl) activeTasksEl.textContent = Utils.formatNumber(activeTasks);
        if (pendingTransfersEl) pendingTransfersEl.textContent = Utils.formatNumber(pendingTransfers);
        if (totalAdvancesEl) totalAdvancesEl.textContent = Utils.formatCurrency(totalAdvances);
    },

    /**
     * Render charts
     */
    renderCharts() {
        this.renderDepartmentChart();
        this.renderTasksChart();
    },

    /**
     * Render department distribution chart
     */
    renderDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;

        const employees = Utils.storage.get('hr_employees', []);
        
        // Group employees by department
        const departmentCounts = {};
        employees.forEach(emp => {
            const dept = emp.department || 'غير محدد';
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });

        const labels = Object.keys(departmentCounts);
        const data = Object.values(departmentCounts);

        // Destroy existing chart if exists
        if (this.charts.department) {
            this.charts.department.destroy();
        }

        // Create new chart
        this.charts.department = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#2563eb', '#10b981', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: currentLang === 'ar',
                        textDirection: currentLang === 'ar' ? 'rtl' : 'ltr'
                    }
                }
            }
        });
    },

    /**
     * Render monthly tasks chart
     */
    renderTasksChart() {
        const ctx = document.getElementById('tasksChart');
        if (!ctx) return;

        const tasks = Utils.storage.get('hr_tasks', []);
        
        // Group tasks by month (last 6 months)
        const monthNames = currentLang === 'ar' 
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthlyData = {};
        const now = new Date();
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyData[key] = { label: monthNames[date.getMonth()], count: 0 };
        }

        // Count tasks per month
        tasks.forEach(task => {
            const taskDate = new Date(task.createdAt || task.dueDate);
            const key = `${taskDate.getFullYear()}-${taskDate.getMonth()}`;
            if (monthlyData[key]) {
                monthlyData[key].count++;
            }
        });

        const labels = Object.values(monthlyData).map(d => d.label);
        const data = Object.values(monthlyData).map(d => d.count);

        // Destroy existing chart if exists
        if (this.charts.tasks) {
            this.charts.tasks.destroy();
        }

        // Create new chart
        this.charts.tasks = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: currentLang === 'ar' ? 'عدد المهام' : 'Tasks Count',
                    data: data,
                    backgroundColor: '#2563eb',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Render activity feed
     */
    renderActivityFeed() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        const activities = [];

        // Get recent employees
        const employees = Utils.storage.get('hr_employees', []);
        employees.slice(-5).forEach(emp => {
            activities.push({
                icon: 'fas fa-user-plus',
                color: 'blue',
                title: currentLang === 'ar' ? 'موظف جديد' : 'New Employee',
                description: emp.name,
                time: emp.joinDate || new Date().toISOString()
            });
        });

        // Get recent tasks
        const tasks = Utils.storage.get('hr_tasks', []);
        tasks.slice(-5).forEach(task => {
            activities.push({
                icon: 'fas fa-tasks',
                color: 'green',
                title: currentLang === 'ar' ? 'مهمة جديدة' : 'New Task',
                description: task.title,
                time: task.createdAt || new Date().toISOString()
            });
        });

        // Get recent finances
        const finances = Utils.storage.get('hr_finances', []);
        finances.slice(-5).forEach(finance => {
            activities.push({
                icon: 'fas fa-money-bill-wave',
                color: 'orange',
                title: currentLang === 'ar' ? 'معاملة مالية' : 'Financial Transaction',
                description: `${finance.type === 'advance' ? 'سلفة' : 'تحصيل'} - ${Utils.formatCurrency(finance.amount)}`,
                time: finance.requestDate || new Date().toISOString()
            });
        });

        // Sort by time and take last 10
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        const recentActivities = activities.slice(0, 10);

        if (recentActivities.length === 0) {
            activityList.innerHTML = `
                <div class="no-activity">
                    <i class="fas fa-inbox fa-2x"></i>
                    <p>${currentLang === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity'}</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="activity-time">${Utils.formatDate(activity.time)}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh dashboard on language change
        window.addEventListener('languageChanged', () => {
            this.updateKPIs();
            this.renderCharts();
            this.renderActivityFeed();
        });

        // Refresh dashboard on data change
        window.addEventListener('hr-data-changed', () => {
            this.updateKPIs();
            this.renderCharts();
            this.renderActivityFeed();
        });
    },

    /**
     * Refresh all dashboard data
     */
    refresh() {
        this.updateKPIs();
        this.renderCharts();
        this.renderActivityFeed();
    }
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the dashboard page
    if (document.getElementById('dashboardPage')) {
        Dashboard.init();
    }
});

// Make Dashboard available globally
window.Dashboard = Dashboard;
