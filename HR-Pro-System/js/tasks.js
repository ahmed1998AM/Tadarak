/**
 * HR Pro System - Tasks Module (Kanban Board)
 * Handles task management, drag & drop, priorities, and status tracking
 */

class Tasks {
    constructor() {
        this.tasks = [];
        this.draggedTask = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
    }

    // Load tasks from localStorage
    loadTasks() {
        const stored = localStorage.getItem('hrpro_tasks');
        if (stored) {
            this.tasks = JSON.parse(stored);
        } else {
            // Initialize with sample data
            this.tasks = this.getSampleTasks();
            this.save();
        }
    }

    // Get sample tasks
    getSampleTasks() {
        return [
            {
                id: 1,
                title: 'تطوير واجهة المستخدم',
                description: 'تحسين تصميم الصفحة الرئيسية',
                assignee: 'أحمد محمد علي',
                assigneeId: 1,
                priority: 'high',
                status: 'inprogress',
                dueDate: '2024-06-15',
                createdAt: '2024-06-01'
            },
            {
                id: 2,
                title: 'إعداد تقرير شهري',
                description: 'تقرير أداء الموظفين للشهر الحالي',
                assignee: 'فاطمة حسن أحمد',
                assigneeId: 2,
                priority: 'medium',
                status: 'todo',
                dueDate: '2024-06-20',
                createdAt: '2024-06-05'
            },
            {
                id: 3,
                title: 'مراجعة الكود',
                description: 'مراجعة كود الوحدة الجديدة',
                assignee: 'خالد عبدالله السعيد',
                assigneeId: 5,
                priority: 'urgent',
                status: 'review',
                dueDate: '2024-06-10',
                createdAt: '2024-06-03'
            },
            {
                id: 4,
                title: 'تحديث قاعدة البيانات',
                description: 'نقل البيانات إلى السيرفر الجديد',
                assignee: 'أحمد محمد علي',
                assigneeId: 1,
                priority: 'high',
                status: 'done',
                dueDate: '2024-06-08',
                createdAt: '2024-06-01'
            },
            {
                id: 5,
                title: 'اجتماع الفريق',
                description: 'اجتماع أسبوعي لمناقشة التقدم',
                assignee: 'فاطمة حسن أحمد',
                assigneeId: 2,
                priority: 'low',
                status: 'todo',
                dueDate: '2024-06-12',
                createdAt: '2024-06-06'
            }
        ];
    }

    // Save tasks to localStorage
    save() {
        localStorage.setItem('hrpro_tasks', JSON.stringify(this.tasks));
    }

    // Render Kanban board
    render() {
        const columns = ['todo', 'inprogress', 'review', 'done'];
        
        columns.forEach(status => {
            const column = document.querySelector(`[data-status="${status}"] .column-body`);
            if (!column) return;

            const statusTasks = this.tasks.filter(t => t.status === status);
            
            // Update count
            const countSpan = document.querySelector(`[data-status="${status}"] .task-count`);
            if (countSpan) {
                countSpan.textContent = statusTasks.length;
            }

            // Render tasks
            column.innerHTML = statusTasks.map(task => this.createTaskCard(task)).join('');
        });

        // Update dashboard KPI
        dashboard?.updateKPIs();
    }

    // Create task card
    createTaskCard(task) {
        const priorityClass = `priority-${task.priority}`;
        const priorityText = {
            'low': 'منخفضة',
            'medium': 'متوسطة',
            'high': 'عالية',
            'urgent': 'عاجلة'
        }[task.priority];

        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

        return `
            <div class="task-card ${priorityClass} ${isOverdue ? 'overdue' : ''}" 
                 draggable="true" 
                 data-id="${task.id}"
                 ondragstart="tasks.handleDragStart(event, ${task.id})"
                 ondragend="tasks.handleDragEnd(event)">
                <div class="task-header">
                    <span class="task-priority">${priorityText}</span>
                    <button class="btn btn-icon-sm task-menu" onclick="tasks.showTaskMenu(${task.id})">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                <h4 class="task-title">${task.title}</h4>
                <p class="task-description">${task.description || ''}</p>
                <div class="task-meta">
                    <div class="task-assignee">
                        <i class="fas fa-user"></i>
                        <span>${task.assignee || 'غير محدد'}</span>
                    </div>
                    ${task.dueDate ? `
                        <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(task.dueDate)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    }

    // Drag and Drop handlers
    handleDragStart(event, taskId) {
        this.draggedTask = this.tasks.find(t => t.id === taskId);
        event.target.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(event) {
        event.target.classList.remove('dragging');
        this.draggedTask = null;
        
        // Remove dragging class from all dropzones
        document.querySelectorAll('[data-dropzone]').forEach(zone => {
            zone.classList.remove('drag-over');
        });
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    handleDrop(event, newStatus) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');

        if (this.draggedTask) {
            const oldStatus = this.draggedTask.status;
            
            if (oldStatus !== newStatus) {
                // Update task status
                const taskIndex = this.tasks.findIndex(t => t.id === this.draggedTask.id);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex].status = newStatus;
                    this.save();
                    this.render();

                    // Log activity
                    const statusNames = {
                        'todo': 'للتنفيذ',
                        'inprogress': 'قيد التنفيذ',
                        'review': 'مراجعة',
                        'done': 'منجزة'
                    };

                    auth.logActivity(
                        newStatus === 'done' ? 'complete_task' : 'update_task',
                        `نقل المهمة "${this.draggedTask.title}" إلى ${statusNames[newStatus]}`
                    );

                    // Send notification if completed
                    if (newStatus === 'done') {
                        notifications.add({
                            title: 'تم إنجاز المهمة',
                            message: `المهمة "${this.draggedTask.title}" تم إنجازها`,
                            type: 'success',
                            icon: 'fas fa-check-circle'
                        });
                    }
                }
            }
        }
    }

    // Add new task
    async addTask(taskData) {
        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        const assignee = employees.find(e => e.id == taskData.assignee);

        const newTask = {
            id: Math.max(0, ...this.tasks.map(t => t.id)) + 1,
            title: taskData.title,
            description: taskData.description || '',
            assignee: assignee ? assignee.fullName : 'غير محدد',
            assigneeId: taskData.assignee ? parseInt(taskData.assignee) : null,
            priority: taskData.priority || 'medium',
            status: taskData.status || 'todo',
            dueDate: taskData.dueDate || null,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.save();
        this.render();

        // Log activity
        auth.logActivity('add_task', `إضافة المهمة "${newTask.title}"`);

        // Send notification
        notifications.add({
            title: 'تم إضافة مهمة',
            message: `المهمة "${newTask.title}" أضيفت بنجاح`,
            type: 'info',
            icon: 'fas fa-tasks'
        });

        return newTask;
    }

    // Edit task
    editTask(id, taskData) {
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return false;

        this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
        this.save();
        this.render();

        auth.logActivity('edit_task', `تعديل المهمة "${this.tasks[taskIndex].title}"`);

        return true;
    }

    // Delete task
    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        if (confirm(`هل أنت متأكد من حذف المهمة "${task.title}"؟`)) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.save();
            this.render();

            auth.logActivity('delete_task', `حذف المهمة "${task.title}"`);

            notifications.add({
                title: 'تم الحذف',
                message: `تم حذف المهمة بنجاح`,
                type: 'warning',
                icon: 'fas fa-trash'
            });
        }
    }

    // Show task menu
    showTaskMenu(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Simple prompt for now (can be enhanced with a proper dropdown menu)
        const action = prompt('اختر الإجراء:\n1. تعديل\n2. حذف\n3. عرض التفاصيل');
        
        switch(action) {
            case '1':
                this.editTaskPrompt(taskId);
                break;
            case '2':
                this.deleteTask(taskId);
                break;
            case '3':
                alert(`المهمة: ${task.title}\nالوصف: ${task.description}\nالمسؤول: ${task.assignee}\nالأولوية: ${task.priority}\nتاريخ الاستحقاق: ${task.dueDate || 'غير محدد'}`);
                break;
        }
    }

    // Edit task prompt
    editTaskPrompt(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newTitle = prompt('عنوان المهمة:', task.title);
        if (newTitle) {
            this.editTask(taskId, { title: newTitle });
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Add task button
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            this.populateAssigneeDropdown();
            document.getElementById('addTaskModal').classList.add('active');
        });

        // Add task form
        document.getElementById('addTaskForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            await this.addTask(data);
            
            document.getElementById('addTaskModal').classList.remove('active');
            e.target.reset();
        });

        // Close modal buttons
        document.querySelectorAll('#addTaskModal .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('addTaskModal').classList.remove('active');
            });
        });

        // Setup dropzones
        document.querySelectorAll('[data-dropzone]').forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            zone.addEventListener('drop', (e) => {
                const status = e.currentTarget.dataset.dropzone;
                this.handleDrop(e, status);
            });
        });
    }

    // Populate assignee dropdown
    populateAssigneeDropdown() {
        const select = document.querySelector('#addTaskForm select[name="assignee"]');
        if (!select) return;

        const employees = JSON.parse(localStorage.getItem('hrpro_employees') || '[]');
        
        select.innerHTML = '<option value="">اختر الموظف</option>' +
            employees.map(emp => `<option value="${emp.id}">${emp.fullName}</option>`).join('');
    }
}

// Initialize tasks instance
const tasks = new Tasks();
