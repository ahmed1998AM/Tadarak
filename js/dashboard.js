// HR Pro System - Dashboard Module

function updateDashboard() {
    // Get data from storage
    const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
    const tasks = JSON.parse(localStorage.getItem('hr_tasks') || '[]');
    const transfers = JSON.parse(localStorage.getItem('hr_transfers') || '[]');
    const finances = JSON.parse(localStorage.getItem('hr_finances') || '[]');

    // Update stats
    document.getElementById('totalEmployees').textContent = employees.length;
    
    const activeTasksCount = tasks.filter(t => t.status !== 'done').length;
    document.getElementById('activeTasks').textContent = activeTasksCount;
    
    const pendingTransfersCount = transfers.filter(t => t.status === 'pending').length;
    document.getElementById('pendingTransfers').textContent = pendingTransfersCount;
    
    const totalFinancesAmount = finances.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    document.getElementById('totalFinances').textContent = totalFinancesAmount.toLocaleString();

    // Update charts
    updateEmployeesChart(employees);
    updateTasksChart(tasks);
}

function updateEmployeesChart(employees) {
    const ctx = document.getElementById('employeesChart');
    if (!ctx) return;

    // Count employees by department
    const deptCount = {};
    employees.forEach(emp => {
        const dept = emp.department || 'Other';
        deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    const labels = Object.keys(deptCount);
    const data = Object.values(deptCount);

    // Destroy existing chart if exists
    if (window.employeesChartInstance) {
        window.employeesChartInstance.destroy();
    }

    // Create new chart
    const config = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4361ee',
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c',
                    '#9c27b0',
                    '#00bcd4'
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
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    };

    window.employeesChartInstance = new Chart(ctx, config);
}

function updateTasksChart(tasks) {
    const ctx = document.getElementById('tasksChart');
    if (!ctx) return;

    // Count tasks by status
    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'inProgress').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;

    // Destroy existing chart if exists
    if (window.tasksChartInstance) {
        window.tasksChartInstance.destroy();
    }

    // Create new chart
    const config = {
        type: 'bar',
        data: {
            labels: ['للقيام به', 'قيد التنفيذ', 'منجز'],
            datasets: [{
                label: 'المهام',
                data: [todoCount, inProgressCount, doneCount],
                backgroundColor: [
                    '#f39c12',
                    '#3498db',
                    '#2ecc71'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };

    window.tasksChartInstance = new Chart(ctx, config);
}

// Make functions available globally
window.updateDashboard = updateDashboard;
