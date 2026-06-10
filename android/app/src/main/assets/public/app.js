// Local Storage Keys
const TASKS_KEY = 'believers_tasks';
const PRAYER_BALANCE_KEY = 'believers_prayer_balance';
const BIBLE_STUDY_KEY = 'believers_bible_study';

// State
let tasks = [];
let prayerBalance = 0;
let studies = [];
let currentTab = 'tasks';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadPrayerBalance();
    loadStudies();
    
    // Show flash effect on load
    setTimeout(() => {
        document.getElementById('flash-effect').classList.add('active');
    }, 100);
    
    render();
    
    // Set up navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.closest('.nav-btn').dataset.tab;
            setTab(tab);
        });
    });
    
    // Add click listener to hide modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.closest('.modal-overlay') && !e.target.closest('.modal')) {
            closeModal();
        }
    });
});

// Navigation
function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('content-area').innerHTML = getContentForTab(tab);
    showTabContent(tab);
}

function showTabContent(tab) {
    document.getElementById('content-area').innerHTML = getContentForTab(tab);
}

function getContentForTab(tab) {
    if (tab === 'tasks') return renderTasksTab();
    if (tab === 'verse') return renderVerseTab();
    if (tab === 'prayer') return renderPrayerTab();
    if (tab === 'study') return renderStudyTab();
    if (tab === 'balance') return renderBalanceTab();
    return renderTasksTab();
}

// Task Store
function loadTasks() {
    try {
        const data = localStorage.getItem(TASKS_KEY);
        tasks = data ? JSON.parse(data) : [];
    } catch (e) {
        tasks = [];
    }
}

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function loadPrayerBalance() {
    try {
        const data = localStorage.getItem(PRAYER_BALANCE_KEY);
        prayerBalance = data ? parseFloat(data) : 0;
    } catch (e) {
        prayerBalance = 0;
    }
}

function savePrayerBalance() {
    localStorage.setItem(PRAYER_BALANCE_KEY, prayerBalance.toString());
}

function loadStudies() {
    try {
        const data = localStorage.getItem(BIBLE_STUDY_KEY);
        studies = data ? JSON.parse(data) : [];
    } catch (e) {
        studies = [];
    }
}

function saveStudies() {
    localStorage.setItem(BIBLE_STUDY_KEY, JSON.stringify(studies));
}

// Tasks
function addTask(title, category, priority) {
    const task = {
        id: Date.now().toString(),
        title,
        category: category || '',
        priority: priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.unshift(task);
    saveTasks();
    showToast('✅ Task added successfully!', 'success');
    render();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        render();
        showToast(task.completed ? '✅ Task completed!' : '🔄 Task marked as active', 'success');
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
    showToast('🗑 Task deleted', 'warning');
}

// Prayer
function addPrayer(amount) {
    prayerBalance += amount;
    savePrayerBalance();
    render();
    showToast(`🙏 ${amount} prayers added!`, 'success');
}

function deductPrayer(amount) {
    if (prayerBalance < amount) {
        showToast('⚠️ Not enough prayer balance!', 'error');
        return;
    }
    prayerBalance -= amount;
    savePrayerBalance();
    render();
    showToast(`🙏 ${amount} prayers deducted`, 'success');
}

// Bible Study
function addStudy(topic, reference) {
    const study = {
        id: Date.now().toString(),
        topic,
        reference: reference || '',
        duration: '15 minutes',
        questions: 'Reflect on this passage and write down your thoughts.',
        createdAt: new Date().toISOString()
    };
    studies.unshift(study);
    saveStudies();
    showToast('📜 Study added!', 'success');
    render();
}

function deleteStudy(id) {
    studies = studies.filter(s => s.id !== id);
    saveStudies();
    render();
    showToast('🗑 Study removed', 'warning');
}

// Render Functions
function render() {
    document.getElementById('content-area').innerHTML = getContentForTab(currentTab);
}

function renderTasksTab() {
    const stats = getTaskStats();
    
    let html = `
        <div class="tab-content active" data-tab="tasks">
            <div class="task-stats">
                <h3>✅ Believers Task Flow</h3>
                <p>${stats.active} active, ${stats.completed} completed</p>
            </div>
            
            <div class="filter-tabs">
                <button class="filter-tab active" onclick="filterTasks('all')">All</button>
                <button class="filter-tab" onclick="filterTasks('active')">Active</button>
                <button class="filter-tab" onclick="filterTasks('completed')">Completed</button>
            </div>
            
            <div class="add-task-form">
                <h3>Add New Task</h3>
                <input type="text" id="newTaskTitle" class="task-input" placeholder="What needs to be done? 🎯">
                <div class="priority-options">
                    <button class="priority-btn" onclick="setPriority('low', this)" data-priority="low">Low</button>
                    <button class="priority-btn active" onclick="setPriority('medium', this)" data-priority="medium">Medium</button>
                    <button class="priority-btn" onclick="setPriority('high', this)" data-priority="high">High</button>
                </div>
                <input type="text" id="newTaskCategory" class="task-input" placeholder="Category (e.g., spiritual, service, study)">
                <button class="add-btn" onclick="addTaskFromInput()">Add Task</button>
            </div>
            
            <div class="task-list">
                ${renderTaskList()}
            </div>
            
            ${tasks.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No tasks yet. Add one to get started!</p></div>' : ''}
        </div>
    `;
    
    return html;
}

function renderTaskList() {
    const filter = document.querySelector('.filter-tab.active')?.innerText || 'All';
    const filteredTasks = tasks.filter(t => {
        if (filter === 'All') return true;
        if (filter === 'Active') return !t.completed;
        if (filter === 'Completed') return t.completed;
        return true;
    });
    
    if (filteredTasks.length === 0) {
        return '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No ' + filter.toLowerCase() + ' tasks found</p></div>';
    }
    
    return filteredTasks.map(task => renderTaskItem(task)).join('');
}

function filterTasks(filter) {
    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.filter-tab')).find(b => b.innerText === filter);
    if (btn) btn.classList.add('active');
    renderTasksTab();
}

function setPriority(priority, btn) {
    document.querySelectorAll('.priority-btn').forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = '';
    });
    btn.classList.add('active');
    btn.style.backgroundColor = '#fff3e0';
}

function addTaskFromInput() {
    const title = document.getElementById('newTaskTitle').value.trim();
    const category = document.getElementById('newTaskCategory').value.trim();
    
    if (!title) {
        showToast('❌ Please enter a task title', 'error');
        return;
    }
    
    const btn = document.querySelector('.priority-btn.active');
    const priority = btn ? btn.dataset.priority : 'medium';
    
    addTask(title, category, priority);
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskCategory').value = '';
}

function renderTaskItem(task) {
    const priorityColors = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')" style="background-color: ${task.completed ? '#27ae60' : '#ecf0f1'}"></div>
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                ${task.category ? `<div class="task-category">${task.category}</div>` : ''}
                <div class="priority-badge priority-${task.priority}" style="background-color: ${priorityColors[task.priority]}">${task.priority}</div>
            </div>
            <div class="task-actions">
                <button class="delete-btn" onclick="deleteTask('${task.id}')">×</button>
            </div>
        </div>
    `;
}

function getTaskStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    return { total, completed, active: total - completed };
}

function renderVerseTab() {
    return `
        <div class="tab-content active" data-tab="verse">
            <div class="card green">
                <h3 class="card-title">📖 Daily Verse</h3>
                <p class="verse-text">"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."</p>
                <p class="verse-ref">— Joshua 1:9</p>
            </div>
            
            <div class="card purple">
                <h3 class="card-title">✨ Prayer Suggestion</h3>
                <p class="verse-text">"Keep praying for wisdom and guidance in your daily walk with Christ. Let your prayers be the breath of your soul."</p>
            </div>
            
            <div class="card gold">
                <h3 class="card-title">✝️ Christian Quote</h3>
                <p class="verse-text">"Faith is taking the first step even when you don't see the whole staircase."</p>
                <p class="verse-ref">— Martin Luther King Jr.</p>
            </div>
        </div>
    `;
}

function renderPrayerTab() {
    return `
        <div class="tab-content active" data-tab="prayer">
            <div class="card gold">
                <h3 class="card-title">🙏 Prayer Balance</h3>
                <div class="prayer-balance">
                    <div class="balance">${prayerBalance}</div>
                    <div class="balance-label">prayers</div>
                </div>
                <div class="prayer-actions">
                    <button class="prayer-btn" onclick="addPrayer(1)">+1</button>
                    <button class="prayer-btn" onclick="addPrayer(5)">+5</button>
                    <button class="prayer-btn" onclick="addPrayer(10)">+10</button>
                </div>
                <div class="prayer-actions" style="margin-top: 10px;">
                    <button class="prayer-btn deduct" onclick="deductPrayer(1)">-1</button>
                    <button class="prayer-btn deduct" onclick="deductPrayer(5)">-5</button>
                    <button class="prayer-btn deduct" onclick="deductPrayer(10)">-10</button>
                </div>
            </div>
            
            <div class="card blue">
                <h3 class="card-title">💡 Prayer Tips</h3>
                <p style="color: #7f8c8d; line-height: 1.6;">• Pray throughout the day, not just in times of need</p>
                <p style="color: #7f8c8d; line-height: 1.6;">• Keep a prayer journal to track your requests</p>
                <p style="color: #7f8c8d; line-height: 1.6;">• Pray for others as you would have them pray for you</p>
            </div>
        </div>
    `;
}

function renderStudyTab() {
    return `
        <div class="tab-content active" data-tab="study">
            <div class="card purple">
                <h3 class="card-title">📜 Bible Study Planner</h3>
                <button class="add-btn" onclick="showAddStudyModal()">+ Add Study</button>
            </div>
            
            <div class="study-list">
                ${studies.length > 0 ? studies.map(study => renderStudyItem(study)).join('') : '<div class="empty-state"><div class="empty-state-icon">📚</div><p>No studies yet. Add one to get started!</p></div>'}
            </div>
        </div>
    `;
}

function showAddStudyModal() {
    const topic = prompt('Enter study topic:');
    if (topic) {
        const reference = prompt('Enter Bible reference:', 'e.g., John 3:16');
        addStudy(topic, reference);
    }
}

function renderStudyItem(study) {
    return `
        <div class="study-item">
            <h4>${study.topic}</h4>
            ${study.reference ? `<p class="reference">${study.reference}</p>` : ''}
            <p class="duration">⏱ ${study.duration}</p>
            <p class="questions">Reflect: Write down what this passage means to you today</p>
            <button class="delete-btn" onclick="deleteStudy('${study.id}')" style="margin-top: 8px; width: 100%; font-size: 12px;">Delete</button>
        </div>
    `;
}

function renderBalanceTab() {
    const stats = getTaskStats();
    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    return `
        <div class="tab-content active" data-tab="balance">
            <div class="card gold">
                <h3 class="card-title">⚖️ Christian Task Balance</h3>
                <div class="progress-container">
                    <div class="progress-bar ${percentage > 70 ? 'progress-high' : ''}" style="width: ${percentage}%"></div>
                </div>
                <div class="balance-text">
                    <span style="font-size: 32px; font-weight: 800;">${percentage}%</span>
                    <span class="balance-label"> Completed</span>
                </div>
                <div class="hint-text">
                    ${percentage < 30 
                        ? '🌟 Keep going! Every task brings you closer to your goals. Focus on what matters most.'
                        : percentage < 70 
                        ? '🔥 You\'re making great progress! Keep it up and stay consistent in your faith.'
                        : '🏆 Excellent! You\'re completing tasks consistently. Your faith and discipline are shining!'}
                </div>
            </div>
            
            <div class="card blue">
                <h3 class="card-title">📈 Progress Insights</h3>
                <p style="color: #7f8c8d; line-height: 1.6;">• Total tasks: ${stats.total}</p>
                <p style="color: #7f8c8d; line-height: 1.6;">• Completed: ${stats.completed}</p>
                <p style="color: #7f8c8d; line-height: 1.6;">• Active: ${stats.active}</p>
            </div>
        </div>
    `;
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const colors = {
        success: '#27ae60',
        warning: '#f39c12',
        error: '#e74c3c'
    };
    
    toast.style.backgroundColor = colors[type];
    toast.style.color = 'white';
    toast.style.borderRadius = '50px';
    toast.style.padding = '14px 24px';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '3000';
    toast.style.animation = 'toastSlideDown 0.3s ease';
    toast.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Floating Action Button
function showAddMenu() {
    // This could show a menu for different add options
    // For now, just focus on adding a task
    setTab('tasks');
    setTimeout(() => {
        document.getElementById('newTaskTitle').focus();
    }, 100);
}

// Flash Effect
function triggerFlash() {
    const flash = document.getElementById('flash-effect');
    flash.classList.remove('active');
    void flash.offsetWidth; // trigger reflow
    flash.classList.add('active');
}
