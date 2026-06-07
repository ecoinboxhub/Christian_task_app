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
    render();
    
    // Set up navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.closest('.nav-btn').dataset.tab;
            setTab(tab);
        });
    });
});

// Navigation
function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.tab === tab);
    });
    render();
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
        category,
        priority: priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.unshift(task);
    saveTasks();
    render();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        render();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

// Prayer
function addPrayer(amount) {
    prayerBalance += amount;
    savePrayerBalance();
    render();
}

function deductPrayer(amount) {
    prayerBalance -= amount;
    savePrayerBalance();
    render();
}

// Bible Study
function addStudy(topic, reference) {
    const study = {
        id: Date.now().toString(),
        topic,
        reference,
        duration: '15 minutes',
        questions: 'Reflect on this passage and write down your thoughts.',
        createdAt: new Date().toISOString()
    };
    studies.unshift(study);
    saveStudies();
    render();
}

function deleteStudy(id) {
    studies = studies.filter(s => s.id !== id);
    saveStudies();
    render();
}

// Render Functions
function render() {
    const contentArea = document.getElementById('content-area');
    
    if (currentTab === 'tasks') {
        contentArea.innerHTML = renderTasksTab();
    } else if (currentTab === 'verse') {
        contentArea.innerHTML = renderVerseTab();
    } else if (currentTab === 'prayer') {
        contentArea.innerHTML = renderPrayerTab();
    } else if (currentTab === 'study') {
        contentArea.innerHTML = renderStudyTab();
    } else if (currentTab === 'balance') {
        contentArea.innerHTML = renderBalanceTab();
    }
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
                <input type="text" id="newTaskTitle" class="task-input" placeholder="Task title" onkeydown="if(event.key==='Enter') addTaskFromInput()">
                <div class="priority-options">
                    <button class="priority-btn active" onclick="setPriority('low', this)">Low</button>
                    <button class="priority-btn active" onclick="setPriority('medium', this)">Medium</button>
                    <button class="priority-btn active" onclick="setPriority('high', this)">High</button>
                </div>
                <input type="text" id="newTaskCategory" class="task-input" placeholder="Category (e.g., spiritual, service, study)">
                <button class="add-btn" onclick="addTaskFromInput()">Add Task</button>
            </div>
            
            <div class="task-list">
                ${tasks.filter(t => filterState === 'all' || (filterState === 'active' && !t.completed) || (filterState === 'completed' && t.completed)).map(task => renderTaskItem(task)).join('')}
            </div>
            
            ${tasks.length === 0 ? '<div class="empty-state"><p>No tasks yet. Add one to get started!</p></div>' : ''}
        </div>
    `;
    
    return html;
}

let filterState = 'all';

function filterTasks(filter) {
    filterState = filter;
    renderTasksTab();
}

function setPriority(priority, btn) {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function addTaskFromInput() {
    const title = document.getElementById('newTaskTitle').value.trim();
    const category = document.getElementById('newTaskCategory').value.trim();
    
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    const priority = document.querySelector('.priority-btn.active')?.dataset?.priority || 'medium';
    
    addTask(title, category, priority);
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskCategory').value = '';
}

function renderTaskItem(task) {
    const priorityColors = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                ${task.category ? `<div class="task-category">📂 ${task.category}</div>` : ''}
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
            <div class="verse-card">
                <h3>📖 Daily Verse</h3>
                <div class="verse-text">"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."</div>
                <div class="verse-ref">— Joshua 1:9</div>
            </div>
            <div class="verse-card">
                <h3>✨ Prayer Suggestion</h3>
                <div class="verse-text">"Keep praying for wisdom and guidance in your daily walk with Christ."</div>
            </div>
        </div>
    `;
}

function renderPrayerTab() {
    return `
        <div class="tab-content active" data-tab="prayer">
            <div class="prayer-card">
                <h3>🙏 Prayer Balance</h3>
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
        </div>
    `;
}

function renderStudyTab() {
    return `
        <div class="tab-content active" data-tab="study">
            <div class="prayer-card">
                <h3>📜 Bible Study Planner</h3>
                <button class="add-btn" onclick="addStudyFromInput()">+ Add Study</button>
            </div>
            
            <div class="study-list">
                ${studies.map(study => renderStudyItem(study)).join('')}
                ${studies.length === 0 ? '<div class="empty-state"><p>No studies yet. Add one to get started!</p></div>' : ''}
            </div>
        </div>
    `;
}

function addStudyFromInput() {
    const topic = prompt('Enter study topic:');
    const reference = prompt('Enter Bible reference:');
    
    if (topic) {
        addStudy(topic, reference || '');
    }
}

function renderStudyItem(study) {
    return `
        <div class="study-item">
            <h4>${study.topic}</h4>
            <div class="reference">${study.reference}</div>
            <div class="duration">⏱ ${study.duration}</div>
            ${study.questions ? `<div class="questions">${study.questions}</div>` : ''}
        </div>
    `;
}

function renderBalanceTab() {
    const stats = getTaskStats();
    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    return `
        <div class="tab-content active" data-tab="balance">
            <div class="balance-card">
                <h3>⚖️ Christian Task Balance</h3>
                <div class="progress-container">
                    <div class="progress-bar ${percentage > 70 ? 'progress-high' : ''}" style="width: ${percentage}%"></div>
                </div>
                <div class="balance-text">${percentage}% Completed</div>
                <div class="hint-text">
                    ${percentage < 30 ? 'Keep going! Every task brings you closer to your goals.' : 
                      percentage < 70 ? 'You\'re making great progress! Keep it up.' : 
                      'Excellent! You\'re completing tasks consistently.'}
                </div>
            </div>
        </div>
    `;
}
