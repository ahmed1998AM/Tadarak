// HR Pro System - Dashboard Module

let departmentChart = null;
let tasksChart = null;

function updateDashboard() {
    console.log('Updating dashboard...');
    
    // Update KPIs
    updateKPIs();
    
    // Update charts
    updateDepartmentChart();
    updateTasksChart();
    
    // Update activity list
    updateActivityList();
    
    console.log('Dashboard updated');
}

function updateKPIs() {
    const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
    const tasks = JSON.parse(localStorage.getItem('hr_tasks') || '[]');
    const transfers = JSON.parse(localStorage.getItem('hr_transfers') || '[]');
    const finances = JSON.parse(localStorage.getItem('hr_finances') || '[]');
    
    // Total Employees
    document.getElementById('totalEmployees').textContent = employees.length;
    
    // Active Tasks
    const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
    document.getElementById('activeTasks').textContent = activeTasksCount;
    
    // Pending Transfers
    const pendingTransfersCount = transfers.filter(t => t.status === 'pending').length;
    document.getElementById('pendingTransfers').textContent = pendingTransfersCount;
    
    // Total Advances
    const totalAdvances = finances
        .filter(f => f.type === 'advance')
        .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    document.getElementById('totalAdvances').textContent = '$' + totalAdvances.toLocaleString();
}

function updateDepartmentChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    
    const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
    
    // Group by department
    const deptCount = {};
    employees.forEach(emp => {
        const dept = emp.department || 'Other';
        deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    
    const labels = Object.keys(deptCount);
    const data = Object.values(deptCount);
    
    // Destroy existing chart
    if (departmentChart) {
        departmentChart.destroy();
    }
    
    // Create new chart with fixed height
    departmentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: [
                    '#4361ee', '#3f37c9', '#4895ef', '#4cc9f0',
                    '#f72585', '#7209b7', '#3a0ca3', '#4361ee'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTasksChart() {
    const ctx = document.getElementById('tasksChart');
    if (!ctx) return;
    
    const tasks = JSON.parse(localStorage.getItem('hr_tasks') || '[]');
    
    // Group by status
    const statusCount = {
        todo: 0,
        in_progress: 0,
        review: 0,
        completed: 0
    };
    
    tasks.forEach(task => {
        const status = task.status || 'todo';
        if (statusCount.hasOwnProperty(status)) {
            statusCount[status]++;
        }
    });
    
    // Destroy existing chart
    if (tasksChart) {
        tasksChart.destroy();
    }
    
    // Create new chart with fixed height
    tasksChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['للتنفيذ', 'قيد التنفيذ', 'مراجعة', 'مكتملة'],
            datasets: [{
                label: 'المهام',
                data: [statusCount.todo, statusCount.in_progress, statusCount.review, statusCount.completed],
                backgroundColor: [
                    '#e74c3c',
                    '#f39c12',
                    '#3498db',
                    '#2ecc71'
                ]
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
}

function updateActivityList() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const activities = JSON.parse(localStorage.getItem('hr_activities') || '[]');
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="no-data">لا يوجد نشاط حديث</p>';
        return;
    }
    
    // Show last 10 activities
    const recentActivities = activities.slice(-10).reverse();
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type || 'info'}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.message || 'نشاط جديد'}</p>
                <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'employee': 'user',
        'task': 'check-circle',
        'transfer': 'exchange-alt',
        'finance': 'money-bill-wave',
        'custody': 'laptop',
        'info': 'info-circle'
    };
    return icons[type] || 'circle';
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
}

// Export functions
window.updateDashboard = updateDashboard;
window.updateKPIs = updateKPIs;
