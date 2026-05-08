/**
 * HR Pro System - Dashboard Module
 * Handles dashboard widgets, charts, KPIs, and activity feed
 */

class Dashboard {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.setupEventListeners();
    }

    // Load all dashboard data
    async loadDashboardData() {
        this.updateKPIs();
        this.renderCharts();
        this.renderRecentActivity();
        this.startAutoRefresh();
    }

    // Update KPI cards
    updateKPIs() {
        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        const tasks = JSON.parse(localStorage.getItem('hrpro_tasks') || '[]');
        const transfers = JSON.parse(localStorage.getItem('hrpro_transfers') || '[]');
        const finances = JSON.parse(localStorage.getItem('hrpro_finances') || '[]');

        // Total Employees
        const totalEmployees = employees.length;
        document.getElementById('totalEmployees').textContent = totalEmployees;

        // Active Tasks
        const activeTasks = tasks.filter(t => t.status !== 'done').length;
        document.getElementById('activeTasks').textContent = activeTasks;

        // Pending Transfers
        const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
        document.getElementById('pendingTransfers').textContent = pendingTransfers;

        // Pending Finances
        const pendingFinances = finances.filter(f => f.status === 'pending').length;
        document.getElementById('pendingFinances').textContent = pendingFinances;
    }

    // Render charts using Chart.js
    async renderCharts() {
        // Wait for Chart.js to load
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderCharts(), 100);
            return;
        }

        await this.renderEmployeeChart();
        await this.renderMonthlyChart();
    }

    // Employee Distribution Chart
    async renderEmployeeChart() {
        const ctx = document.getElementById('employeeChart');
        if (!ctx) return;

        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        
        // Group by department
        const deptCounts = {};
        employees.forEach(emp => {
            deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
        });

        const labels = Object.keys(deptCounts);
        const data = Object.values(deptCounts);

        // Destroy existing chart
        if (this.charts.employee) {
            this.charts.employee.destroy();
        }

        this.charts.employee = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['لا توجد بيانات'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#ec4899'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true
                    }
                }
            }
        });
    }

    // Monthly Stats Chart
    async renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        // Generate last 6 months data
        const months = [];
        const employeeData = [];
        const taskData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleDateString('ar-SA', { month: 'short' });
            months.push(monthName);

            // Simulate data (in real app, fetch from database)
            employeeData.push(Math.floor(Math.random() * 10) + 20);
            taskData.push(Math.floor(Math.random() * 50) + 30);
        }

        // Destroy existing chart
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'الموظفين',
                        data: employeeData,
                        backgroundColor: '#2563eb',
                        borderRadius: 4
                    },
                    {
                        label: 'المهام',
                        data: taskData,
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render recent activity
    renderRecentActivity() {
        const list = document.getElementById('recentActivityList');
        if (!list) return;

        const activities = auth.getActivities().slice(0, 10);

        if (activities.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p data-lang="noActivity">لا يوجد نشاط حديث</p>
                </div>
            `;
            return;
        }

        list.innerHTML = activities.map(activity => {
            const icon = this.getActivityIcon(activity.action);
            const color = this.getActivityColor(activity.action);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background-color: ${color}20; color: ${color}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">${activity.description}</p>
                        <span class="activity-user">${activity.userName}</span>
                    </div>
                    <span class="activity-time">${this.formatActivityTime(activity.timestamp)}</span>
                </div>
            `;
        }).join('');
    }

    // Get icon for activity type
    getActivityIcon(action) {
        const icons = {
            login: 'fas fa-sign-in-alt',
            logout: 'fas fa-sign-out-alt',
            add_employee: 'fas fa-user-plus',
            edit_employee: 'fas fa-user-edit',
            delete_employee: 'fas fa-user-times',
            add_task: 'fas fa-task-plus',
            complete_task: 'fas fa-check-circle',
            request_transfer: 'fas fa-exchange-alt',
            approve_transfer: 'fas fa-check',
            reject_transfer: 'fas fa-times',
            request_finance: 'fas fa-money-bill',
            approve_finance: 'fas fa-hand-holding-usd',
            password_change: 'fas fa-key',
            profile_update: 'fas fa-user-cog'
        };
        return icons[action] || 'fas fa-info-circle';
    }

    // Get color for activity type
    getActivityColor(action) {
        const colors = {
            login: '#10b981',
            logout: '#6b7280',
            add_employee: '#2563eb',
            edit_employee: '#f59e0b',
            delete_employee: '#ef4444',
            add_task: '#8b5cf6',
            complete_task: '#10b981',
            request_transfer: '#f59e0b',
            approve_transfer: '#10b981',
            reject_transfer: '#ef4444',
            request_finance: '#f59e0b',
            approve_finance: '#10b981',
            password_change: '#ef4444',
            profile_update: '#2563eb'
        };
        return colors[action] || '#6b7280';
    }

    // Format activity time
    formatActivityTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        
        return date.toLocaleDateString('ar-SA');
    }

    // Setup event listeners
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.showLoading();
                setTimeout(() => {
                    this.loadDashboardData();
                    notifications.add({
                        title: 'تم التحديث',
                        message: 'تم تحديث بيانات لوحة التحكم',
                        type: 'success',
                        icon: 'fas fa-sync-alt'
                    });
                }, 500);
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportDashboard');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportDashboard());
        }
    }

    // Show loading state
    showLoading() {
        const kpiCards = document.querySelectorAll('.kpi-card');
        kpiCards.forEach(card => {
            card.style.opacity = '0.5';
        });
    }

    // Hide loading state
    hideLoading() {
        const kpiCards = document.querySelectorAll('.kpi-card');
        kpiCards.forEach(card => {
            card.style.opacity = '1';
        });
    }

    // Export dashboard data
    exportDashboard() {
        const data = {
            timestamp: new Date().toISOString(),
            kpis: {
                totalEmployees: document.getElementById('totalEmployees').textContent,
                activeTasks: document.getElementById('activeTasks').textContent,
                pendingTransfers: document.getElementById('pendingTransfers').textContent,
                pendingFinances: document.getElementById('pendingFinances').textContent
            },
            employees: JSON.parse(localStorage.getItem('hrpro_employees') || '[]'),
            tasks: JSON.parse(localStorage.getItem('hrpro_tasks') || '[]'),
            activities: auth.getActivities()
        };

        // Download as JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        notifications.add({
            title: 'تم التصدير',
            message: 'تم تصدير بيانات لوحة التحكم بنجاح',
            type: 'success',
            icon: 'fas fa-download'
        });
    }

    // Auto refresh every 5 minutes
    startAutoRefresh() {
        setInterval(() => {
            this.updateKPIs();
            this.renderRecentActivity();
        }, 5 * 60 * 1000);
    }

    // Refresh charts on resize
    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
}

// Initialize dashboard instance
const dashboard = new Dashboard();
