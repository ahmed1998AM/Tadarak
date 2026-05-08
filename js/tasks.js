/**
 * HR Pro System - Tasks Module
 * Handles task management with Kanban board
 */

const Tasks = {
    /**
     * Initialize tasks module
     */
    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.renderKanban();
    },

    /**
     * Load tasks from localStorage
     * @returns {Array} Tasks array
     */
    loadTasks() {
        return Utils.storage.get('hr_tasks', []);
    },

    /**
     * Save tasks to localStorage
     * @param {Array} tasks - Tasks to save
     */
    saveTasks(tasks) {
        Utils.storage.set('hr_tasks', tasks);
        this.triggerDataChanged();
    },

    /**
     * Add new task
     * @param {Object} taskData - Task data
     * @returns {boolean} Success status
     */
    add(taskData) {
        try {
            const tasks = this.loadTasks();
            
            const newTask = {
                id: Utils.generateId(),
                title: taskData.title,
                description: taskData.description || '',
                assignedTo: taskData.assignedTo || null,
                status: taskData.status || 'todo',
                priority: taskData.priority || 'medium',
                dueDate: taskData.dueDate || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: Auth.getCurrentUser()?.id || 'system'
            };

            tasks.push(newTask);
            this.saveTasks(tasks);

            Utils.showToast('تم إضافة المهمة بنجاح', 'success');
            
            // Notify assigned user (only if Notifications is available)
            if (typeof Notifications !== 'undefined' && newTask.assignedTo) {
                try {
                    Notifications.notifyTaskAssignment(newTask.title, newTask.assignedTo);
                } catch (e) {
                    console.log('Notification error:', e);
                }
            }

            return true;
        } catch (error) {
            console.error('Add task error:', error);
            Utils.showToast('حدث خطأ أثناء إضافة المهمة', 'error');
            return false;
        }
    },

    /**
     * Update task
     * @param {string} id - Task ID
     * @param {Object} taskData - Updated task data
     * @returns {boolean} Success status
     */
    update(id, taskData) {
        try {
            const tasks = this.loadTasks();
            const index = tasks.findIndex(t => t.id === id);

            if (index === -1) {
                Utils.showToast('المهمة غير موجودة', 'error');
                return false;
            }

            tasks[index] = {
                ...tasks[index],
                ...taskData,
                updatedAt: new Date().toISOString()
            };

            this.saveTasks(tasks);
            Utils.showToast('تم تحديث المهمة بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Update task error:', error);
            Utils.showToast('حدث خطأ أثناء تحديث المهمة', 'error');
            return false;
        }
    },

    /**
     * Delete task
     * @param {string} id - Task ID
     * @returns {boolean} Success status
     */
    delete(id) {
        try {
            if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Are you sure you want to delete this task?')) {
                return false;
            }

            let tasks = this.loadTasks();
            tasks = tasks.filter(t => t.id !== id);
            this.saveTasks(tasks);

            Utils.showToast('تم حذف المهمة بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Delete task error:', error);
            Utils.showToast('حدث خطأ أثناء حذف المهمة', 'error');
            return false;
        }
    },

    /**
     * Move task to different status
     * @param {string} id - Task ID
     * @param {string} newStatus - New status
     * @returns {boolean} Success status
     */
    moveTask(id, newStatus) {
        return this.update(id, { status: newStatus });
    },

    /**
     * Render Kanban board
     */
    renderKanban() {
        const columns = {
            todo: document.getElementById('todoColumn'),
            in_progress: document.getElementById('inProgressColumn'),
            review: document.getElementById('reviewColumn'),
            done: document.getElementById('doneColumn')
        };

        if (!Object.values(columns).every(col => col)) return;

        let tasks = this.loadTasks();
        
        // Filter tasks based on user role
        const currentUser = Auth.getCurrentUser();
        if (currentUser && currentUser.role !== 'admin') {
            tasks = tasks.filter(t => t.assignedTo === currentUser.id || t.createdBy === currentUser.id);
        }

        // Clear columns
        Object.values(columns).forEach(col => col.innerHTML = '');

        // Group tasks by status
        const tasksByStatus = {
            todo: [],
            in_progress: [],
            review: [],
            done: []
        };

        tasks.forEach(task => {
            if (tasksByStatus[task.status]) {
                tasksByStatus[task.status].push(task);
            }
        });

        // Update column counts
        document.querySelectorAll('.kanban-column').forEach(column => {
            const status = column.dataset.status;
            const countEl = column.querySelector('.task-count');
            if (countEl) {
                countEl.textContent = tasksByStatus[status]?.length || 0;
            }
        });

        // Render tasks in each column
        Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
            if (statusTasks.length === 0) {
                columns[status].innerHTML = `
                    <div class="no-tasks">
                        <i class="fas fa-clipboard-list"></i>
                        <p>${currentLang === 'ar' ? 'لا توجد مهام' : 'No tasks'}</p>
                    </div>
                `;
                return;
            }

            columns[status].innerHTML = statusTasks.map(task => `
                <div class="task-card" draggable="true" data-id="${task.id}" data-status="${task.status}">
                    <div class="task-header">
                        <span class="priority-badge ${task.priority}">${Utils.getStatusLabel(task.priority)}</span>
                        <button class="task-menu-btn" onclick="Tasks.showTaskMenu('${task.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    <h4 class="task-title">${task.title}</h4>
                    ${task.description ? `<p class="task-description">${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</p>` : ''}
                    <div class="task-footer">
                        ${task.dueDate ? `
                            <span class="task-due-date ${this.isOverdue(task.dueDate) ? 'overdue' : ''}">
                                <i class="far fa-clock"></i> ${Utils.formatDate(task.dueDate)}
                            </span>
                        ` : ''}
                        ${task.assignedTo ? `
                            <span class="task-assignee">
                                <i class="fas fa-user"></i>
                            </span>
                        ` : ''}
                    </div>
                </div>
            `).join('');

            // Setup drag and drop for tasks
            columns[status].querySelectorAll('.task-card').forEach(card => {
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', card.dataset.id);
                    card.classList.add('dragging');
                });

                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                });
            });
        });

        // Setup drop zones
        Object.values(columns).forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.closest('.kanban-column').dataset.status;
                
                if (taskId && newStatus) {
                    this.moveTask(taskId, newStatus);
                }
            });
        });
    },

    /**
     * Check if date is overdue
     * @param {string} date - Date string
     * @returns {boolean} Is overdue
     */
    isOverdue(date) {
        return new Date(date) < new Date();
    },

    /**
     * Show task menu
     * @param {string} taskId - Task ID
     */
    showTaskMenu(taskId) {
        const task = this.loadTasks().find(t => t.id === taskId);
        if (!task) return;

        // Simple delete confirmation for now
        if (confirm(currentLang === 'ar' ? 'هل تريد حذف هذه المهمة؟' : 'Do you want to delete this task?')) {
            this.delete(taskId);
        }
    },

    /**
     * Populate assigned to dropdown
     */
    populateAssignedToDropdown() {
        const select = document.getElementById('taskAssignedTo');
        if (!select) return;

        const employees = Utils.storage.get('hr_employees', []);
        
        select.innerHTML = '<option value="">اختر الموظف</option>';
        employees.forEach(emp => {
            if (emp.status === 'active') {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.fullName;
                select.appendChild(option);
            }
        });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add task button
        const addBtn = document.getElementById('addTaskBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.populateAssignedToDropdown();
                document.getElementById('taskModalTitle').textContent = currentLang === 'ar' ? 'إضافة مهمة' : 'Add Task';
                document.getElementById('taskForm').reset();
                delete document.getElementById('taskForm').dataset.editId;
                document.getElementById('taskModal').classList.add('active');
            });
        }

        // Task form submit
        const form = document.getElementById('taskForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const formData = {
                    title: document.getElementById('taskTitle').value,
                    description: document.getElementById('taskDescription').value,
                    assignedTo: document.getElementById('taskAssignedTo').value || null,
                    priority: document.getElementById('taskPriority').value,
                    dueDate: document.getElementById('taskDueDate').value || null,
                    status: document.getElementById('taskStatus').value
                };

                const editId = form.dataset.editId;
                if (editId) {
                    this.update(editId, formData);
                } else {
                    this.add(formData);
                }

                document.getElementById('taskModal').classList.remove('active');
                this.renderKanban();
                Dashboard.refresh();
            });
        }

        // Modal close buttons
        document.querySelectorAll('#taskModal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('taskModal').classList.remove('active');
            });
        });

        // Close modal on outside click
        document.getElementById('taskModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                document.getElementById('taskModal').classList.remove('active');
            }
        });

        // Language change
        window.addEventListener('languageChanged', () => {
            this.renderKanban();
        });

        // Data change
        window.addEventListener('hr-data-changed', () => {
            this.renderKanban();
        });
    },

    /**
     * Trigger data changed event
     */
    triggerDataChanged() {
        window.dispatchEvent(new CustomEvent('hr-data-changed', { detail: { type: 'tasks' } }));
    }
};

// Initialize tasks module when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tasksPage')) {
        Tasks.init();
    }
});

// Make Tasks available globally
window.Tasks = Tasks;
