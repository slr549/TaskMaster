class TaskManager {
    constructor() {
        this.currentUser = null;
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.setMinDate();
    }


    bindEvents() {
        // Auth events
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Task events
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Filter events
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setFilter(tab.dataset.filter);
            });
        });
    }


    getUsers() {
        return JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    }

    saveUsers(users) {
        localStorage.setItem('taskmaster_users', JSON.stringify(users));
    }

    getTasks() {
        if (!this.currentUser) return [];
        return JSON.parse(localStorage.getItem(`taskmaster_tasks_${this.currentUser.id}`) || '[]');
    }

    saveTasks(tasks) {
        if (!this.currentUser) return;
        localStorage.setItem(`taskmaster_tasks_${this.currentUser.id}`, JSON.stringify(tasks));
    }


    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('taskmaster_current_user', JSON.stringify(user));
            this.showMainApp();
            this.showAlert('authAlert', 'Login berhasil!', 'success');
        } else {
            this.showAlert('authAlert', 'Email atau password salah!', 'error');
        }
    }

    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const users = this.getUsers();

        if (users.find(u => u.email === email)) {
            this.showAlert('registerAlert', 'Email sudah terdaftar!', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        this.showAlert('registerAlert', 'Registrasi berhasil! Silakan login.', 'success');
        setTimeout(() => this.showLoginForm(), 2000);
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('taskmaster_current_user');
        this.showAuthForm();
    }

    // Simulasi PHP: Task CRUD operations
    addTask() {
        const description = document.getElementById('taskDescription').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;

        const tasks = this.getTasks();
        const newTask = {
            id: Date.now(),
            user_id: this.currentUser.id,
            description,
            due_date: dueDate,
            priority,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        tasks.push(newTask);
        this.saveTasks(tasks);

        document.getElementById('taskForm').reset();
        this.setMinDate();
        this.renderTasks();
        this.updateStats();
    }

    updateTask() {
        const description = document.getElementById('editTaskDescription').value;
        const dueDate = document.getElementById('editTaskDueDate').value;
        const priority = document.getElementById('editTaskPriority').value;

        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === this.editingTaskId);

        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                description,
                due_date: dueDate,
                priority,
                updated_at: new Date().toISOString()
            };

            this.saveTasks(tasks);
            this.closeEditModal();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(filteredTasks);
        this.renderTasks();
        this.updateStats();
    }

    toggleTaskStatus(taskId) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            task.status = task.status === 'pending' ? 'completed' : 'pending';
            task.updated_at = new Date().toISOString();
            this.saveTasks(tasks);
            this.renderTasks();
            this.updateStats();
        }
    }

    // UI Management
    checkAuthStatus() {
        const savedUser = localStorage.getItem('taskmaster_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showAuthForm();
        }
    }

    showAuthForm() {
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('userName').textContent = `Halo, ${this.currentUser.name}!`;
        this.renderTasks();
        this.updateStats();
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        this.clearAlerts();
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.clearAlerts();
    }

    showAlert(containerId, message, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => container.innerHTML = '', 5000);
    }

    clearAlerts() {
        document.getElementById('authAlert').innerHTML = '';
        document.getElementById('registerAlert').innerHTML = '';
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').min = today;
        document.getElementById('editTaskDueDate').min = today;
    }

    // Task Rendering
    renderTasks() {
        const tasks = this.getTasks();
        const filteredTasks = this.filterTasks(tasks);
        const container = document.getElementById('tasksContainer');

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                        <div class="empty-state">
                            <h3>Tidak ada tugas</h3>
                            <p>${this.getEmptyMessage()}</p>
                        </div>
                    `;
            return;
        }

        container.innerHTML = filteredTasks.map(task => this.renderTaskItem(task)).join('');
    }

    renderTaskItem(task) {
        const isOverdue = new Date(task.due_date) < new Date() && task.status === 'pending';
        const priorityClass = `priority-${task.priority}`;
        const priorityText = {
            'low': 'Rendah',
            'medium': 'Sedang',
            'high': 'Tinggi'
        }[task.priority];

        return `
    <div class="task-item ${task.status}">
        <div class="task-header">
            <h4 class="task-title ${task.status}">${task.description}</h4>
            <div class="task-actions">
                <button class="btn btn-sm ${task.status === 'pending' ? 'btn-success' : 'btn-secondary'}"
                    onclick="taskManager.toggleTaskStatus(${task.id})">
                    ${task.status === 'pending' ? '✓ Selesai' : '↺ Batal'}
                </button>
                <button class="btn btn-sm btn-secondary" onclick="taskManager.editTask(${task.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="taskManager.confirmDelete(${task.id})">
                    🗑️ Hapus
                </button>
            </div>
        </div>
        <div class="task-meta">
            <span class="priority-badge ${priorityClass}">${priorityText}</span>
            <span class="due-date">
                📅 ${new Date(task.due_date).toLocaleDateString('id-ID')}
                ${isOverdue ? '<span style="color: #dc3545; font-weight: bold;">(Terlambat)</span>' : ''}
            </span>
        </div>
    </div>
    `;
    }

    // Task Management
    editTask(taskId) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            this.editingTaskId = taskId;
            document.getElementById('editTaskDescription').value = task.description;
            document.getElementById('editTaskDueDate').value = task.due_date;
            document.getElementById('editTaskPriority').value = task.priority;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    confirmDelete(taskId) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            // Simulasi confirm dialog dengan UI inline
            const taskElement = event.target.closest('.task-item');
            const originalContent = taskElement.innerHTML;

            taskElement.innerHTML = `
    <div style="text-align: center; padding: 20px;">
        <h4 style="color: #dc3545; margin-bottom: 15px;">Hapus tugas ini?</h4>
        <p style="margin-bottom: 20px;">"${task.description}"</p>
        <button class="btn btn-danger btn-sm" onclick="taskManager.deleteTask(${taskId})">Ya, Hapus</button>
        <button class="btn btn-secondary btn-sm" onclick="taskManager.renderTasks()" style="margin-left: 10px;">Batal</button>
    </div>
    `;
        }
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingTaskId = null;
    }

    // Filtering and Statistics
    setFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTasks();
    }

    filterTasks(tasks) {
        const now = new Date();

        switch (this.currentFilter) {
            case 'pending':
                return tasks.filter(t => t.status === 'pending');
            case 'completed':
                return tasks.filter(t => t.status === 'completed');
            case 'overdue':
                return tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < now);
            default:
                return tasks;
        }
    }

    getEmptyMessage() {
        switch (this.currentFilter) {
            case 'pending':
                return 'Semua tugas sudah selesai! 🎉';
            case 'completed':
                return 'Belum ada tugas yang diselesaikan.';
            case 'overdue':
                return 'Tidak ada tugas yang terlambat.';
            default:
                return 'Mulai dengan menambahkan tugas pertama Anda!';
        }
    }

    updateStats() {
        const tasks = this.getTasks();
        const now = new Date();

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const overdue = tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < now).length;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('overdueTasks').textContent = overdue;
    }
}

// Initialize the application
const taskManager = new TaskManager();

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        taskManager.closeEditModal();
    }
});

(function () { function c() { var b = a.contentDocument || a.contentWindow.document; if (b) { var d = b.createElement('script'); d.innerHTML = "window.__CF$cv$params={r:'99529128b68dfcee',t:'MTc2MTU3MjAyNi4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);"; b.getElementsByTagName('head')[0].appendChild(d) } } if (document.body) { var a = document.createElement('iframe'); a.height = 1; a.width = 1; a.style.position = 'absolute'; a.style.top = 0; a.style.left = 0; a.style.border = 'none'; a.style.visibility = 'hidden'; document.body.appendChild(a); if ('loading' !== document.readyState) c(); else if (window.addEventListener) document.addEventListener('DOMContentLoaded', c); else { var e = document.onreadystatechange || function () { }; document.onreadystatechange = function (b) { e(b); 'loading' !== document.readyState && (document.onreadystatechange = e, c()) } } } })();