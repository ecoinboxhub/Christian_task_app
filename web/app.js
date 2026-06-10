// Storage Keys
const KEYS = {
  TASKS: 'btf_tasks',
  PRAYER: 'btf_prayer',
  STUDIES: 'btf_studies',
  CATEGORIES: 'btf_categories',
  SCHEDULES: 'btf_schedules',
  HABITS: 'btf_habits',
  SETTINGS: 'btf_settings',
  NOTIF_LOG: 'btf_notif_log',
};

// State
let state = {
  tasks: [], prayerBalance: 0, studies: [], categories: [],
  schedules: [], habits: [], settings: {}, currentTab: 'tasks',
  notificationLog: [], editingTaskId: null,
};

// Alarm Sounds using Web Audio API
const ALARM_SOUNDS = [
  { id: 'gentle_chime', name: 'Gentle Chime' },
  { id: 'morning_bell', name: 'Morning Bell' },
  { id: 'soft_harp', name: 'Soft Harp' },
  { id: 'worship_tune', name: 'Worship Tune' },
  { id: 'prayer_call', name: 'Prayer Call' },
  { id: 'digital_alarm', name: 'Digital Alarm' },
  { id: 'faith_alert', name: 'Faith Alert' },
  { id: 'gentle_nudge', name: 'Gentle Nudge' },
  { id: 'hallelujah', name: 'Hallelujah' },
  { id: 'silent', name: 'Silent' },
];

const SOUND_CONFIG = {
  gentle_chime: { notes: [523.25, 659.25, 783.99], durations: [0.15, 0.15, 0.3], delay: 0.1 },
  morning_bell: { notes: [392, 392, 523.25, 523.25], durations: [0.3, 0.3, 0.4, 0.6], delay: 0.2 },
  soft_harp: { notes: [261.63, 329.63, 392, 523.25], durations: [0.2, 0.2, 0.2, 0.4], delay: 0.15 },
  worship_tune: { notes: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33], durations: [0.15, 0.15, 0.15, 0.3, 0.15, 0.3], delay: 0.1 },
  prayer_call: { notes: [440, 440, 523.25, 440, 392], durations: [0.2, 0.2, 0.3, 0.2, 0.4], delay: 0.15 },
  digital_alarm: { notes: [800, 600, 800, 600], durations: [0.1, 0.1, 0.1, 0.2], delay: 0.05 },
  faith_alert: { notes: [587.33, 739.99, 880, 587.33], durations: [0.12, 0.12, 0.25, 0.25], delay: 0.08 },
  gentle_nudge: { notes: [440, 523.25], durations: [0.1, 0.2], delay: 0.1 },
  hallelujah: { notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25], durations: [0.1, 0.1, 0.1, 0.3, 0.1, 0.1, 0.4], delay: 0.08 },
};

const AudioEngine = {
  ctx: null, isPlaying: false,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  async play(soundId = 'gentle_chime', vol = 0.7) {
    if (this.isPlaying) return;
    if (soundId === 'silent') { navigator.vibrate?.([200, 100, 200]); return; }
    try {
      this.isPlaying = true;
      const ctx = this.getCtx();
      const cfg = SOUND_CONFIG[soundId] || SOUND_CONFIG.gentle_chime;
      let t = ctx.currentTime + 0.05;
      const gain = ctx.createGain();
      gain.gain.value = vol * 0.3;
      gain.connect(ctx.destination);
      cfg.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(vol * 0.3, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + cfg.durations[i]);
        osc.connect(ng);
        ng.connect(gain);
        osc.start(t);
        osc.stop(t + cfg.durations[i] + 0.05);
        t += cfg.durations[i] + cfg.delay;
      });
      setTimeout(() => { this.isPlaying = false; }, (t - ctx.currentTime) * 1000 + 300);
    } catch (e) { this.isPlaying = false; }
  },
  stop() { this.isPlaying = false; if (this.ctx) { this.ctx.close(); this.ctx = null; } }
};

// Scripture & Encouragement Data
const SCRIPTURES = [
  { verse: 'Be strong and courageous. Do not be afraid.', ref: 'Joshua 1:9' },
  { verse: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { verse: 'Trust in the Lord with all your heart.', ref: 'Proverbs 3:5' },
  { verse: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { verse: 'Pray without ceasing.', ref: '1 Thessalonians 5:17' },
  { verse: 'For God so loved the world...', ref: 'John 3:16' },
  { verse: 'Seek first the kingdom of God.', ref: 'Matthew 6:33' },
  { verse: 'Do not be anxious about anything.', ref: 'Philippians 4:6' },
  { verse: 'Your word is a lamp to my feet.', ref: 'Psalm 119:105' },
  { verse: 'The joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
];

const ENCOURAGEMENTS = [
  'You are making wonderful progress in your faith journey!',
  'Every step brings you closer to God. Stay faithful!',
  'Your consistency is inspiring. God sees your dedication!',
  'God\'s love for you is unending. Keep pressing forward!',
  'You are not alone — God walks with you every step!',
  'Small steps of faith lead to great spiritual growth!',
  'Your commitment to spiritual growth is beautiful!',
  'Faithfulness in small things leads to greater blessings!',
  'You are a child of God, created for amazing purposes!',
  'Your light shines brightly for His kingdom!',
];

// Storage Helpers
function load(key, def) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function loadAll() {
  state.tasks = load(KEYS.TASKS, []);
  state.prayerBalance = load(KEYS.PRAYER, 0);
  state.studies = load(KEYS.STUDIES, []);
  state.categories = load(KEYS.CATEGORIES, ['Prayer','Bible Study','Worship','Service','Fellowship','Personal','Family','Work','Health']);
  state.schedules = load(KEYS.SCHEDULES, []);
  state.habits = load(KEYS.HABITS, []);
  state.settings = load(KEYS.SETTINGS, { defaultTime: '08:00', defaultSound: 'gentle_chime', snoozeDuration: 5, enableScripture: true, enableEncouragement: true });
  state.notificationLog = load(KEYS.NOTIF_LOG, []);
}

function saveAll() {
  save(KEYS.TASKS, state.tasks);
  save(KEYS.PRAYER, state.prayerBalance);
  save(KEYS.STUDIES, state.studies);
  save(KEYS.SCHEDULES, state.schedules);
  save(KEYS.HABITS, state.habits);
  save(KEYS.SETTINGS, state.settings);
  save(KEYS.NOTIF_LOG, state.notificationLog.slice(-100));
}

// Notification helpers
function scheduleWebNotif(title, body, delayMs, soundId = 'gentle_chime') {
  if (delayMs > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico', requireInteraction: true });
      }
      AudioEngine.play(soundId);
      logNotif(title, body);
    }, delayMs);
  }
}

function logNotif(title, body) {
  state.notificationLog.unshift({ title, body, time: new Date().toISOString() });
  save(KEYS.NOTIF_LOG, state.notificationLog);
}

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ==================== RENDER ENGINE ====================
function render() {
  document.getElementById('content-area').innerHTML = getTabContent(state.currentTab);
}

function setTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  render();
}

function getTabContent(tab) {
  switch(tab) {
    case 'tasks': return renderTasks();
    case 'scheduler': return renderScheduler();
    case 'habits': return renderHabits();
    case 'verse': return renderVerse();
    case 'prayer': return renderPrayer();
    case 'study': return renderStudy();
    case 'reminders': return renderReminders();
    case 'balance': return renderBalance();
    default: return renderTasks();
  }
}

// ==================== TOAST ====================
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ==================== TASKS TAB ====================
function renderTasks() {
  const filter = state._taskFilter || 'all';
  const catFilter = state._catFilter || '';
  const stats = { total: state.tasks.length, completed: state.tasks.filter(t => t.completed).length, active: state.tasks.filter(t => !t.completed).length };
  const dueToday = state.tasks.filter(t => !t.completed && t.scheduledDate && t.scheduledDate.split('T')[0] === todayStr());

  let filtered = state.tasks;
  if (filter === 'active') filtered = filtered.filter(t => !t.completed);
  else if (filter === 'completed') filtered = filtered.filter(t => t.completed);
  else if (filter === 'scheduled') filtered = filtered.filter(t => t.scheduledDate && !t.completed);
  if (catFilter) filtered = filtered.filter(t => t.category === catFilter);

  let html = `
    <div class="tab-content active">
      <div class="task-stats">
        <h3>✝️ Believers Task Flow</h3>
        <p>${stats.active} active · ${stats.completed} completed</p>
        ${dueToday.length ? `<p style="font-size:12px;margin-top:4px;opacity:0.9">⏰ ${dueToday.length} due today</p>` : ''}
      </div>
      <div class="filter-tabs">
        ${['all','active','completed','scheduled'].map(f => `<button class="filter-tab ${filter===f?'active':''}" onclick="setTaskFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join('')}
      </div>
      <div class="add-task-form">
        <div style="display:flex;gap:8px">
          <input type="text" id="taskTitle" class="task-input" placeholder="Task name" style="flex:1">
          <button class="add-btn" style="flex:0;padding:14px 20px;width:auto" onclick="quickAddTask()">➕</button>
        </div>
        <div class="priority-options">
          ${['low','medium','high'].map(p => `<button class="priority-btn ${p==='medium'?'active':''}" onclick="setTaskPriority('${p}',this)">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" id="taskCategory" class="task-input" placeholder="Category" style="flex:1" list="catList">
          <datalist id="catList">${state.categories.map(c => `<option value="${c}">`).join('')}</datalist>
          <input type="date" id="taskDate" class="task-input" style="flex:1" value="${todayStr()}">
          <input type="time" id="taskTime" class="task-input" style="flex:1" value="${state.settings.defaultTime||'08:00'}">
        </div>
        <button class="add-btn" onclick="addFullTask()">📅 Add Task with Schedule</button>
      </div>
      <div style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span style="font-size:11px;color:#7f8c8d;font-weight:600">Categories:</span>
        ${state.categories.map(c => `<button class="cat-chip ${catFilter===c?'active':''}" onclick="setCatFilter('${c}')">${c}</button>`).join('')}
        ${catFilter ? '<button class="cat-chip" onclick="setCatFilter(\'\')">✕ Clear</button>' : ''}
      </div>
      <div class="task-list">
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No tasks found</p></div>' : filtered.map(t => renderTaskItem(t)).join('')}
      </div>
    </div>`;
  return html;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function setTaskFilter(f) { state._taskFilter = state._taskFilter === f ? 'all' : f; render(); }
function setCatFilter(c) { state._catFilter = state._catFilter === c ? '' : c; render(); }
function setTaskPriority(p, btn) {
  document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state._newPriority = p;
}

function quickAddTask() {
  const title = document.getElementById('taskTitle')?.value?.trim();
  if (!title) { toast('Enter a task name', 'error'); return; }
  addTask({ title, category: document.getElementById('taskCategory')?.value || '', priority: state._newPriority || 'medium' });
  document.getElementById('taskTitle').value = '';
  toast('✅ Task added!');
}

function addFullTask() {
  const title = document.getElementById('taskTitle')?.value?.trim();
  if (!title) { toast('Enter a task name', 'error'); return; }
  addTask({
    title,
    category: document.getElementById('taskCategory')?.value || '',
    priority: state._newPriority || 'medium',
    scheduledDate: document.getElementById('taskDate')?.value || todayStr(),
    scheduledTime: document.getElementById('taskTime')?.value || '08:00',
    hasAlarm: true,
    alarmSoundId: state.settings.defaultSound || 'gentle_chime',
    snoozeEnabled: true,
    reminderMinutes: 5,
  });
  document.getElementById('taskTitle').value = '';
  toast('📅 Task scheduled with alarm!');
}

const CAT_ICONS = { Prayer:'🙏','Bible Study':'📖',Worship:'🎵',Service:'🤝',Fellowship:'👥',Personal:'👤',Family:'👪',Work:'💼',Health:'💪' };

function renderTaskItem(t) {
  const pc = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };
  const today = todayStr();
  const isDue = t.scheduledDate && t.scheduledDate.split('T')[0] === today && !t.completed;
  return `
    <div class="task-item ${t.completed?'completed':''} ${isDue?'due-today':''}">
      <div class="task-checkbox ${t.completed?'checked':''}" onclick="toggleTask('${t.id}')"></div>
      <div class="task-info">
        <div class="task-title">${t.title}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:4px">
          ${t.category ? `<span class="task-category">${CAT_ICONS[t.category]||'📂'} ${t.category}</span>` : ''}
          <span class="priority-badge priority-${t.priority}" style="background:${pc[t.priority]}">${t.priority}</span>
          ${t.scheduledTime ? `<span class="task-category">⏰ ${t.scheduledTime}</span>` : ''}
          ${t.hasAlarm ? `<span class="task-category">🔔</span>` : ''}
          ${t.recurrence && t.recurrence !== 'none' ? `<span class="task-category">🔄 ${t.recurrence}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="editTask('${t.id}')" title="Edit">✏️</button>
        <button class="icon-btn" onclick="deleteTask('${t.id}')" title="Delete">🗑️</button>
      </div>
    </div>`;
}

function addTask(data) {
  const task = {
    id: Date.now().toString(), title: data.title || 'Task',
    category: data.category || '', priority: data.priority || 'medium',
    completed: false, createdAt: new Date().toISOString(),
    scheduledDate: data.scheduledDate || null, scheduledTime: data.scheduledTime || null,
    recurrence: data.recurrence || 'none', recurrenceDays: data.recurrenceDays || [],
    dayOfMonth: data.dayOfMonth || null, hasAlarm: data.hasAlarm || false,
    alarmSoundId: data.alarmSoundId || 'gentle_chime', snoozeEnabled: data.snoozeEnabled !== false,
    reminderMinutes: data.reminderMinutes || 0, notes: data.notes || '',
  };
  state.tasks.unshift(task);
  saveAll(); render();
  if (task.hasAlarm && task.scheduledTime) {
    scheduleTaskAlarm(task);
  }
}

function toggleTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (t) {
    t.completed = !t.completed;
    t.completedAt = t.completed ? new Date().toISOString() : null;
    saveAll(); render();
    toast(t.completed ? '✅ Completed!' : '🔄 Reopened');
  }
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveAll(); render();
  toast('🗑️ Deleted', 'warning');
}

function editTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  state.editingTaskId = id;
  const title = prompt('Edit task title:', t.title);
  if (title && title.trim()) {
    t.title = title.trim();
    const cat = prompt('Edit category:', t.category || '');
    if (cat !== null) t.category = cat;
    saveAll(); render();
    toast('✏️ Updated');
  }
  state.editingTaskId = null;
}

function quickAdd() {
  setTab('tasks');
  setTimeout(() => document.getElementById('taskTitle')?.focus(), 100);
}

function scheduleTaskAlarm(task) {
  const now = Date.now();
  const [h, m] = (task.scheduledTime || '08:00').split(':').map(Number);
  const d = new Date(task.scheduledDate || todayStr());
  d.setHours(h, m, 0, 0);
  const delay = d.getTime() - now;
  if (delay > 0) {
    scheduleWebNotif(`🔔 ${task.title}`, `Time to work on: ${task.title}`, delay, task.alarmSoundId);
  }
}

// ==================== SCHEDULER TAB ====================
function renderScheduler() {
  const recurring = state.schedules.filter(s => s.recurrence && s.recurrence !== 'none');
  const upcoming = state.schedules
    .map(s => ({ ...s, nextOccurrence: getNextOccurrence(s) }))
    .filter(s => s.nextOccurrence)
    .sort((a, b) => a.nextOccurrence - b.nextOccurrence)
    .slice(0, 10);

  let html = `
    <div class="card blue">
      <h3 class="card-title">📅 Task Scheduler</h3>
      <p class="card-subtitle">Plan your daily, weekly, and monthly tasks</p>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="add-btn" onclick="showScheduleModal()">➕ New Schedule</button>
      <button class="add-btn" style="background:var(--secondary)" onclick="showAIScheduleSuggest()">🤖 AI Suggest</button>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-num">${recurring.filter(s=>s.recurrence==='daily').length}</div><div class="stat-label">Daily</div></div>
      <div class="stat-card"><div class="stat-num">${recurring.filter(s=>s.recurrence==='weekly').length}</div><div class="stat-label">Weekly</div></div>
      <div class="stat-card"><div class="stat-num">${recurring.filter(s=>s.recurrence==='monthly').length}</div><div class="stat-label">Monthly</div></div>
      <div class="stat-card"><div class="stat-num">${state.schedules.length}</div><div class="stat-label">Total</div></div>
    </div>
    <div class="section-title">📋 Upcoming</div>
    ${upcoming.length === 0 ? '<div class="empty-state"><p>No upcoming scheduled tasks</p></div>' :
      upcoming.map(s => `
        <div class="schedule-item">
          <div class="schedule-icon">${s.recurrence==='daily'?'🔄':s.recurrence==='weekly'?'📅':'📆'}</div>
          <div class="schedule-info">
            <div class="schedule-title">${s.title}</div>
            <div class="schedule-meta">${formatRecurrence(s)} · ${formatTime(s.time)}</div>
            <div class="schedule-next">Next: ${s.nextOccurrence.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
          </div>
          <button class="icon-btn danger" onclick="deleteSchedule('${s.id}')">🗑️</button>
        </div>`).join('')}
    <div class="section-title" style="margin-top:20px">🔄 Recurring Plans</div>
    ${recurring.length === 0 ? '<div class="empty-state"><p>No recurring plans</p></div>' :
      recurring.map(s => `
        <div class="schedule-item">
          <div class="schedule-icon">🔄</div>
          <div class="schedule-info">
            <div class="schedule-title">${s.title}</div>
            <div class="schedule-meta">${formatRecurrence(s)} · ⏰ ${formatTime(s.time)}</div>
          </div>
          <button class="icon-btn danger" onclick="deleteSchedule('${s.id}')">🗑️</button>
        </div>`).join('')}
  `;
  return html;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatRecurrence(s) {
  if (!s.recurrence || s.recurrence === 'none') return 'One-time';
  if (s.recurrence === 'daily') return 'Daily';
  if (s.recurrence === 'weekly') {
    const days = s.recurrenceDays || [];
    return days.length ? `Weekly (${days.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')})` : 'Weekly';
  }
  if (s.recurrence === 'monthly') return s.dayOfMonth === -1 ? 'Monthly (last day)' : `Monthly (day ${s.dayOfMonth})`;
  return s.recurrence;
}

function getNextOccurrence(s) {
  const [h, m] = (s.time || '08:00').split(':').map(Number);
  const now = new Date();
  const today = new Date();
  today.setHours(h, m, 0, 0);
  if (!s.recurrence || s.recurrence === 'none') return today > now ? today : null;
  for (let i = 0; i < 90; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(h, m, 0, 0);
    if (matchesSchedule(s, d) && d > now) return d;
  }
  return null;
}

function matchesSchedule(s, d) {
  if (!s.recurrence || s.recurrence === 'none') return false;
  if (s.recurrence === 'daily') return true;
  if (s.recurrence === 'weekly') {
    const days = s.recurrenceDays || [];
    return days.length === 0 || days.includes(d.getDay());
  }
  if (s.recurrence === 'monthly') {
    const dom = s.dayOfMonth || d.getDate();
    return dom === -1 ? d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() : d.getDate() === dom;
  }
  return false;
}

function showScheduleModal() {
  document.getElementById('content-area').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)render()">
      <div class="modal">
        <h3>📅 Schedule Task</h3>
        <input type="text" id="schedTitle" placeholder="Task title" autofocus>
        <input type="date" id="schedDate" value="${todayStr()}">
        <input type="time" id="schedTime" value="${state.settings.defaultTime||'08:00'}">
        <input type="text" id="schedCategory" placeholder="Category" list="catList2">
        <datalist id="catList2">${state.categories.map(c => `<option value="${c}">`).join('')}</datalist>
        <div style="display:flex;gap:6px;margin:8px 0">
          ${['none','daily','weekly','monthly'].map(r =>
            `<button class="priority-btn ${r==='none'?'active':''}" onclick="selectRecurrence('${r}',this)" id="recBtn${r}">${r.charAt(0).toUpperCase()+r.slice(1)}</button>`
          ).join('')}
        </div>
        <div id="weeklyDays" style="display:none;gap:4px;margin:8px 0">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i) =>
            `<button class="day-btn" onclick="toggleDay(${i},this)" id="dayBtn${i}">${d}</button>`
          ).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin:8px 0">
          <label style="font-size:14px">🔔 Alarm:</label>
          <select id="schedSound" style="flex:1;padding:10px;border-radius:8px;border:1px solid #bdc3c7">
            ${ALARM_SOUNDS.map(s => `<option value="${s.id}" ${s.id===(state.settings.defaultSound||'gentle_chime')?'selected':''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <button class="add-btn" onclick="addScheduleFromModal()">Save Schedule</button>
        <button class="add-btn" style="background:var(--danger);margin-top:8px" onclick="render()">Cancel</button>
      </div>
    </div>`;
  state._recSelected = 'none';
  state._recDays = [];
}

let _recSelected = 'none', _recDays = [];

function selectRecurrence(r, btn) {
  _recSelected = r;
  document.querySelectorAll('#recBtnnone, #recBtndaily, #recBtnweekly, #recBtnmonthly').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('weeklyDays').style.display = r === 'weekly' ? 'flex' : 'none';
}

function toggleDay(i, btn) {
  btn.classList.toggle('active');
  const idx = _recDays.indexOf(i);
  if (idx > -1) _recDays.splice(idx, 1); else _recDays.push(i);
}

function addScheduleFromModal() {
  const title = document.getElementById('schedTitle')?.value?.trim();
  if (!title) { toast('Enter a title', 'error'); return; }
  const sched = {
    id: Date.now().toString(),
    title,
    time: document.getElementById('schedTime')?.value || '08:00',
    startDate: document.getElementById('schedDate')?.value || todayStr(),
    category: document.getElementById('schedCategory')?.value || '',
    recurrence: _recSelected || 'none',
    recurrenceDays: _recDays || [],
    soundId: document.getElementById('schedSound')?.value || 'gentle_chime',
    createdAt: new Date().toISOString(),
  };
  state.schedules.push(sched);
  const taskData = { title, category: sched.category, scheduledDate: sched.startDate, scheduledTime: sched.time, recurrence: sched.recurrence, recurrenceDays: sched.recurrenceDays, hasAlarm: true, alarmSoundId: sched.soundId };
  addTask(taskData);
  saveAll();
  toast('📅 Scheduled!');
  render();
}

function deleteSchedule(id) {
  if (!confirm('Delete this schedule?')) return;
  state.schedules = state.schedules.filter(s => s.id !== id);
  saveAll(); render();
  toast('🗑️ Deleted', 'warning');
}

function showAIScheduleSuggest() {
  const suggestions = [
    { title: 'Morning Devotion & Prayer', category: 'Prayer', time: '06:00', rec: 'daily' },
    { title: 'Bible Reading Chapter', category: 'Bible Study', time: '06:30', rec: 'daily' },
    { title: 'Worship Music Session', category: 'Worship', time: '07:00', rec: 'daily' },
    { title: 'Scripture Memorization', category: 'Bible Study', time: '12:00', rec: 'daily' },
    { title: 'Evening Prayer & Reflection', category: 'Prayer', time: '21:00', rec: 'daily' },
    { title: 'Church Service', category: 'Fellowship', time: '10:00', rec: 'weekly', days: [0] },
    { title: 'Bible Study Group', category: 'Fellowship', time: '19:00', rec: 'weekly', days: [3] },
    { title: 'Community Service', category: 'Service', time: '09:00', rec: 'monthly', dom: 1 },
  ];
  let html = `
    <div class="modal-overlay" onclick="if(event.target===this)render()">
      <div class="modal">
        <h3>🤖 AI Schedule Suggestions</h3>
        <p style="color:#7f8c8d;margin-bottom:16px">Tap a suggestion to add it to your schedule</p>
        ${suggestions.map(s => `
          <div class="recommendation-item" style="cursor:pointer" onclick="quickAddSuggestion('${s.title}','${s.category}','${s.time}','${s.rec}','${s.days||''}','${s.dom||''}')">
            <div>
              <div style="font-weight:600;color:#2c3e50">${s.title}</div>
              <div style="font-size:12px;color:#7f8c8d">${s.category} · ${formatTime(s.time)} · ${s.rec}</div>
            </div>
            <span style="color:#27ae60;font-weight:700">➕</span>
          </div>`).join('')}
        <button class="add-btn" style="background:var(--danger);margin-top:12px" onclick="render()">Close</button>
      </div>
    </div>`;
  document.getElementById('content-area').innerHTML = html;
}

function quickAddSuggestion(title, cat, time, rec, days, dom) {
  _recSelected = rec;
  _recDays = days ? days.split(',').map(Number) : [];
  const sched = { id: Date.now().toString(), title, time, startDate: todayStr(), category: cat, recurrence: rec, recurrenceDays: _recDays, dayOfMonth: dom ? parseInt(dom) : null, soundId: state.settings.defaultSound || 'gentle_chime', createdAt: new Date().toISOString() };
  state.schedules.push(sched);
  addTask({ title, category: cat, scheduledDate: todayStr(), scheduledTime: time, recurrence: rec, recurrenceDays: _recDays, hasAlarm: true, alarmSoundId: state.settings.defaultSound || 'gentle_chime' });
  saveAll();
  toast('✅ Added: ' + title);
  render();
}

// ==================== HABITS TAB ====================
function renderHabits() {
  const hfilter = state._habitFilter || 'all';
  const today = new Date().toDateString();
  const completedToday = state.habits.filter(h => h.lastCompletedDate === today).length;
  const bestStreak = Math.max(...state.habits.map(h => h.streak || 0), 0);

  let filtered = state.habits;
  if (hfilter === 'today') filtered = filtered.filter(h => h.lastCompletedDate !== today);
  else if (hfilter === 'done') filtered = filtered.filter(h => h.lastCompletedDate === today);
  else if (hfilter === 'streak') filtered = [...filtered].sort((a, b) => (b.streak || 0) - (a.streak || 0));

  let html = `
    <div class="card green">
      <h3 class="card-title">🎯 Habit Tracker</h3>
      <p class="card-subtitle">Build consistent spiritual disciplines</p>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="add-btn" onclick="showHabitModal()">➕ New Habit</button>
      <button class="add-btn" style="background:var(--secondary)" onclick="showAIHabits()">🤖 AI Suggest</button>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-num">${state.habits.length}</div><div class="stat-label">Total</div></div>
      <div class="stat-card"><div class="stat-num">${completedToday}</div><div class="stat-label">Today</div></div>
      <div class="stat-card"><div class="stat-num">${bestStreak}</div><div class="stat-label">Best Streak</div></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:12px">
      ${['all','today','done','streak'].map(f =>
        `<button class="filter-tab ${hfilter===f?'active':''}" onclick="setHabitFilter('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`
      ).join('')}
    </div>
    ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🌱</div><p>No habits yet</p></div>' :
      filtered.map(h => {
        const done = h.lastCompletedDate === today;
        const icons = { prayer:'🙏', study:'📖', worship:'🎵', service:'🤝', fellowship:'👥', health:'💪', personal:'👤' };
        const colors = { prayer:'#e67e22', study:'#9b59b6', worship:'#e74c3c', service:'#27ae60', fellowship:'#3498db', health:'#1abc9c', personal:'#95a5a6' };
        return `
          <div class="schedule-item" style="border-left:4px solid ${colors[h.category]||'#3498db'}">
            <div style="font-size:24px;margin-right:12px">${icons[h.category]||'📌'}</div>
            <div class="schedule-info" style="flex:1">
              <div class="schedule-title">${h.title}</div>
              <div class="schedule-meta">${h.recurrence} · ⏰ ${h.reminderTime||'08:00'} · 🔥 ${h.streak||0} day streak</div>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <button class="icon-btn ${done?'completed':''}" onclick="completeHabit('${h.id}')" style="font-size:20px">${done?'✅':'⬜'}</button>
              <button class="icon-btn danger" onclick="deleteHabit('${h.id}')">🗑️</button>
            </div>
          </div>`;
      }).join('')}
  `;
  return html;
}

function setHabitFilter(f) { state._habitFilter = f; render(); }

function showHabitModal(data) {
  const d = data || { title: '', category: 'prayer', description: '', recurrence: 'daily', reminderTime: state.settings.defaultTime || '08:00', soundId: state.settings.defaultSound || 'gentle_chime' };
  document.getElementById('content-area').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)render()">
      <div class="modal">
        <h3>➕ ${data?'Edit':'New'} Habit</h3>
        <input type="text" id="habitTitle" placeholder="Habit name" value="${d.title}" autofocus>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
          ${['prayer','study','worship','service','fellowship','health','personal'].map(c =>
            `<button class="cat-chip ${c===d.category?'active':''}" onclick="selectHabitCat('${c}',this)">${c}</button>`
          ).join('')}
        </div>
        <input type="text" id="habitDesc" placeholder="Description (optional)" value="${d.description}">
        <div style="display:flex;gap:6px;margin:8px 0">
          ${['daily','weekly','monthly'].map(r =>
            `<button class="priority-btn ${r===d.recurrence?'active':''}" onclick="selectHabitRec('${r}',this)">${r}</button>`
          ).join('')}
        </div>
        <input type="time" id="habitTime" value="${d.reminderTime}">
        <select id="habitSound" style="width:100%;padding:10px;border-radius:8px;border:1px solid #bdc3c7;margin:8px 0">
          ${ALARM_SOUNDS.map(s => `<option value="${s.id}" ${s.id===d.soundId?'selected':''}>${s.name}</option>`).join('')}
        </select>
        <button class="add-btn" onclick="saveHabitFromModal()">Save Habit</button>
        <button class="add-btn" style="background:var(--danger);margin-top:8px" onclick="render()">Cancel</button>
      </div>
    </div>`;
  state._habitCat = d.category;
  state._habitRec = d.recurrence;
}

let _habitCat = 'prayer', _habitRec = 'daily';

function selectHabitCat(c, btn) {
  _habitCat = c;
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function selectHabitRec(r, btn) {
  _habitRec = r;
  document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function saveHabitFromModal() {
  const title = document.getElementById('habitTitle')?.value?.trim();
  if (!title) { toast('Enter a habit name', 'error'); return; }
  const habit = {
    id: Date.now().toString(), title,
    category: _habitCat || 'prayer',
    description: document.getElementById('habitDesc')?.value || '',
    recurrence: _habitRec || 'daily',
    reminderTime: document.getElementById('habitTime')?.value || '08:00',
    soundId: document.getElementById('habitSound')?.value || 'gentle_chime',
    streak: 0, lastCompletedDate: null, history: [],
    createdAt: new Date().toISOString(),
  };
  state.habits.push(habit);
  saveAll();
  toast('✅ Habit created!');
  render();
}

function completeHabit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  const today = new Date().toDateString();
  if (h.lastCompletedDate === today) { toast('Already done today!', 'warning'); return; }
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  h.streak = h.lastCompletedDate === yesterday ? (h.streak || 0) + 1 : 1;
  h.lastCompletedDate = today;
  h.history = [...(h.history || []), { date: new Date().toISOString(), completed: true }];
  saveAll(); render();
  toast(`🔥 ${h.streak} day streak!`, 'success');
  AudioEngine.play('gentle_chime');
}

function deleteHabit(id) {
  if (!confirm('Delete this habit?')) return;
  state.habits = state.habits.filter(h => h.id !== id);
  saveAll(); render();
  toast('🗑️ Deleted', 'warning');
}

function showAIHabits() {
  const suggestions = [
    { title: 'Daily Prayer Time', cat: 'prayer', time: '06:00', rec: 'daily' },
    { title: 'Bible Reading', cat: 'study', time: '06:30', rec: 'daily' },
    { title: 'Worship Music', cat: 'worship', time: '07:00', rec: 'daily' },
    { title: 'Scripture Memorization', cat: 'study', time: '12:00', rec: 'daily' },
    { title: 'Evening Reflection', cat: 'prayer', time: '21:00', rec: 'daily' },
    { title: 'Church Attendance', cat: 'fellowship', time: '10:00', rec: 'weekly' },
    { title: 'Bible Study Group', cat: 'fellowship', time: '19:00', rec: 'weekly' },
    { title: 'Community Service', cat: 'service', time: '09:00', rec: 'monthly' },
  ];
  document.getElementById('content-area').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)render()">
      <div class="modal">
        <h3>🤖 AI Habit Suggestions</h3>
        ${suggestions.map(s => `
          <div class="recommendation-item" style="cursor:pointer" onclick="quickAddHabit('${s.title}','${s.cat}','${s.time}','${s.rec}')">
            <div>
              <div style="font-weight:600;color:#2c3e50">${s.title}</div>
              <div style="font-size:12px;color:#7f8c8d">${s.cat} · ${formatTime(s.time)} · ${s.rec}</div>
            </div>
            <span style="color:#27ae60;font-weight:700">➕</span>
          </div>`).join('')}
        <button class="add-btn" style="background:var(--danger);margin-top:12px" onclick="render()">Close</button>
      </div>
    </div>`;
}

function quickAddHabit(title, cat, time, rec) {
  const habit = { id: Date.now().toString(), title, category: cat, description: '', recurrence: rec, reminderTime: time, soundId: state.settings.defaultSound || 'gentle_chime', streak: 0, lastCompletedDate: null, history: [], createdAt: new Date().toISOString() };
  state.habits.push(habit);
  saveAll();
  toast('✅ Added: ' + title);
  render();
}

// ==================== VERSE TAB ====================
function renderVerse() {
  const s = getRandom(SCRIPTURES);
  const e = getRandom(ENCOURAGEMENTS);
  return `
    <div class="tab-content active">
      <div class="card green">
        <h3 class="card-title">📖 Daily Scripture</h3>
        <p class="verse-text">"${s.verse}"</p>
        <p class="verse-ref">— ${s.ref}</p>
        <button class="add-btn" style="margin-top:12px" onclick="render()">🔄 New Verse</button>
      </div>
      <div class="card gold">
        <h3 class="card-title">💪 Daily Encouragement</h3>
        <p class="verse-text" style="font-style:normal">"${e}"</p>
      </div>
      <div class="card purple">
        <h3 class="card-title">✝️ Prayer Suggestion</h3>
        <p class="verse-text" style="font-style:normal">Lord, thank You for Your unfailing love. Guide my steps today and help me walk in Your purpose. Fill me with Your peace and joy as I serve You and others. In Jesus' name, Amen.</p>
      </div>
    </div>`;
}

// ==================== PRAYER TAB ====================
function renderPrayer() {
  return `
    <div class="tab-content active">
      <div class="card gold">
        <h3 class="card-title">🙏 Prayer Balance</h3>
        <div class="prayer-balance">
          <div class="balance">${state.prayerBalance}</div>
          <div class="balance-label">prayers</div>
        </div>
        <div class="prayer-actions">
          <button class="prayer-btn" onclick="addPrayer(1)">+1</button>
          <button class="prayer-btn" onclick="addPrayer(5)">+5</button>
          <button class="prayer-btn" onclick="addPrayer(10)">+10</button>
        </div>
        <div class="prayer-actions" style="margin-top:10px">
          <button class="prayer-btn deduct" onclick="deductPrayer(1)">-1</button>
          <button class="prayer-btn deduct" onclick="deductPrayer(5)">-5</button>
          <button class="prayer-btn deduct" onclick="deductPrayer(10)">-10</button>
        </div>
      </div>
      <div class="card blue">
        <h3 class="card-title">⏰ Prayer Schedule</h3>
        <p style="color:#7f8c8d;line-height:1.8">
          🌅 <strong>6:00 AM</strong> — Morning Thanksgiving<br>
          💼 <strong>9:00 AM</strong> — Workplace Intercession<br>
          🙏 <strong>12:00 PM</strong> — Midday Reflection<br>
          🌇 <strong>6:00 PM</strong> — Evening Gratitude<br>
          🌙 <strong>9:00 PM</strong> — Nightly Peace
        </p>
      </div>
    </div>`;
}

function addPrayer(n) { state.prayerBalance += n; saveAll(); render(); toast(`🙏 +${n} prayers`); }
function deductPrayer(n) {
  if (state.prayerBalance < n) { toast('Not enough balance', 'error'); return; }
  state.prayerBalance -= n; saveAll(); render(); toast(`🙏 -${n} prayers`); }

// ==================== STUDY TAB ====================
function renderStudy() {
  return `
    <div class="tab-content active">
      <div class="card purple">
        <h3 class="card-title">📜 Bible Study Planner</h3>
        <button class="add-btn" onclick="showStudyModal()">➕ Add Study</button>
        <button class="add-btn" style="background:var(--secondary);margin-top:8px" onclick="generateStudy()">✨ AI Generate</button>
      </div>
      <div class="study-list">
        ${state.studies.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📚</div><p>No studies yet</p></div>' :
          state.studies.map(s => `
            <div class="study-item">
              <h4>${s.topic}</h4>
              ${s.reference ? `<p class="reference">${s.reference}</p>` : ''}
              <p class="duration">⏱ ${s.duration || '15 min'}</p>
              <p class="questions">${s.questions || 'Reflect on this passage'}</p>
              <button class="delete-btn" onclick="deleteStudy('${s.id}')">🗑️ Delete</button>
            </div>`).join('')}
      </div>
    </div>`;
}

function showStudyModal() {
  const topic = prompt('Enter study topic:');
  if (topic) {
    const ref = prompt('Enter Bible reference:', 'e.g., John 3:16');
    state.studies.unshift({ id: Date.now().toString(), topic, reference: ref || '', duration: '15 min', questions: 'Reflect on this passage', createdAt: new Date().toISOString() });
    saveAll(); render();
    toast('📜 Study added!');
  }
}

function generateStudy() {
  const topics = [
    { topic: 'The Fruit of the Spirit', ref: 'Galatians 5:22-23', questions: 'How can you cultivate love, joy, and peace today?' },
    { topic: 'Faith in Action', ref: 'James 2:14-26', questions: 'How does your faith show in your actions?' },
    { topic: 'God\'s Unfailing Love', ref: 'Romans 8:38-39', questions: 'What can separate you from God\'s love?' },
    { topic: 'The Armor of God', ref: 'Ephesians 6:10-18', questions: 'Which piece of armor do you need most?' },
    { topic: 'Walking in Wisdom', ref: 'Proverbs 3:1-12', questions: 'How can you trust God more in your decisions?' },
  ];
  const t = getRandom(topics);
  state.studies.unshift({ id: Date.now().toString(), topic: t.topic, reference: t.ref, duration: '15 min', questions: t.questions, createdAt: new Date().toISOString() });
  saveAll(); render();
  toast('✨ AI study generated!');
}

function deleteStudy(id) {
  if (!confirm('Delete this study?')) return;
  state.studies = state.studies.filter(s => s.id !== id);
  saveAll(); render();
  toast('🗑️ Deleted', 'warning');
}

// ==================== REMINDERS TAB ====================
function renderReminders() {
  const incomplete = state.tasks.filter(t => !t.completed);
  return `
    <div class="tab-content active">
      <div class="card gold">
        <h3 class="card-title">💡 Smart Reminders</h3>
        <p class="card-subtitle">Re-engage and stay consistent in your faith journey</p>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="add-btn" style="background:#e67e22" onclick="showScriptureReminder()">📖 Scripture</button>
        <button class="add-btn" style="background:#27ae60" onclick="showEncouragement()">💪 Encourage</button>
        <button class="add-btn" style="background:#3498db" onclick="showReminderSettings()">⚙️ Settings</button>
      </div>
      <div class="card blue">
        <h3 class="card-title">📋 Incomplete Tasks (${incomplete.length})</h3>
        ${incomplete.length === 0 ? '<p style="color:#27ae60;font-weight:600">🎉 All done! Great job!</p>' :
          incomplete.slice(0, 8).map(t => `
            <div class="recommendation-item">
              <div>
                <div style="font-weight:600;color:#2c3e50">${t.title}</div>
                ${t.category ? `<div style="font-size:12px;color:#7f8c8d">${t.category}</div>` : ''}
              </div>
              <button class="prayer-btn" style="padding:8px 14px;font-size:12px" onclick="remindTask('${t.id}')">🔔 Remind</button>
            </div>`).join('')}
        ${incomplete.length > 0 ? `<button class="add-btn" style="margin-top:12px;background:#e67e22" onclick="reengageAll()">🔔 Re-engage All (${incomplete.length})</button>` : ''}
      </div>
      <div class="card" style="border-left-color:#9b59b6">
        <h3 class="card-title">🔊 Test Alarm Sounds</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${ALARM_SOUNDS.filter(s => s.id !== 'silent').map(s =>
            `<button class="cat-chip" onclick="AudioEngine.play('${s.id}')">🔔 ${s.name}</button>`
          ).join('')}
        </div>
      </div>
      <div class="card" style="border-left-color:#95a5a6">
        <h3 class="card-title">📜 Notification History</h3>
        ${state.notificationLog.length === 0 ? '<p style="color:#95a5a6">No notifications yet</p>' :
          state.notificationLog.slice(0, 10).map(n =>
            `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px">
              <div style="font-weight:500;color:#2c3e50">${n.title}</div>
              <div style="font-size:11px;color:#95a5a6">${new Date(n.time).toLocaleString()}</div>
            </div>`).join('')}
      </div>
    </div>`;
}

function remindTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  const s = getRandom(SCRIPTURES);
  const msg = `"${s.verse}" — ${s.ref}`;
  if (Notification.permission === 'granted') {
    new Notification(`✝️ Don't forget: ${t.title}`, { body: msg, requireInteraction: true });
  }
  AudioEngine.play('gentle_nudge');
  logNotif(`✝️ Reminder: ${t.title}`, msg);
  toast(`🔔 Reminder sent for "${t.title}"`);
}

function reengageAll() {
  const incomplete = state.tasks.filter(t => !t.completed);
  incomplete.forEach(t => remindTask(t.id));
  toast(`🔔 Reminders sent for ${incomplete.length} tasks`);
}

function showScriptureReminder() {
  const s = getRandom(SCRIPTURES);
  if (Notification.permission === 'granted') {
    new Notification('📖 Scripture Reminder', { body: `"${s.verse}" — ${s.ref}`, requireInteraction: true });
  }
  AudioEngine.play('gentle_chime');
  logNotif('📖 Scripture Reminder', `"${s.verse}" — ${s.ref}`);
  toast('📖 Scripture shared!');
}

function showEncouragement() {
  const e = getRandom(ENCOURAGEMENTS);
  if (Notification.permission === 'granted') {
    new Notification('💪 Daily Encouragement', { body: e, requireInteraction: true });
  }
  AudioEngine.play('gentle_chime');
  logNotif('💪 Encouragement', e);
  toast('💪 Encouragement sent!');
}

function showReminderSettings() {
  document.getElementById('content-area').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)render()">
      <div class="modal">
        <h3>⚙️ Reminder Settings</h3>
        <div style="margin:12px 0">
          <label style="font-weight:600;font-size:14px;color:#2c3e50">📖 Scripture Reminders</label>
          <select id="setScripture" style="width:100%;padding:10px;border-radius:8px;border:1px solid #bdc3c7;margin-top:4px">
            <option value="true" ${state.settings.enableScripture?'selected':''}>Enabled</option>
            <option value="false" ${!state.settings.enableScripture?'selected':''}>Disabled</option>
          </select>
        </div>
        <div style="margin:12px 0">
          <label style="font-weight:600;font-size:14px;color:#2c3e50">💪 Daily Encouragement</label>
          <select id="setEncourage" style="width:100%;padding:10px;border-radius:8px;border:1px solid #bdc3c7;margin-top:4px">
            <option value="true" ${state.settings.enableEncouragement?'selected':''}>Enabled</option>
            <option value="false" ${!state.settings.enableEncouragement?'selected':''}>Disabled</option>
          </select>
        </div>
        <div style="margin:12px 0">
          <label style="font-weight:600;font-size:14px;color:#2c3e50">Default Reminder Time</label>
          <input type="time" id="setTime" value="${state.settings.defaultTime||'08:00'}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #bdc3c7;margin-top:4px">
        </div>
        <div style="margin:12px 0">
          <label style="font-weight:600;font-size:14px;color:#2c3e50">Default Alarm Sound</label>
          <select id="setSound" style="width:100%;padding:10px;border-radius:8px;border:1px solid #bdc3c7;margin-top:4px">
            ${ALARM_SOUNDS.map(s => `<option value="${s.id}" ${s.id===(state.settings.defaultSound||'gentle_chime')?'selected':''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <button class="add-btn" onclick="saveReminderSettings()">Save Settings</button>
        <button class="add-btn" style="background:var(--danger);margin-top:8px" onclick="render()">Cancel</button>
      </div>
    </div>`;
}

function saveReminderSettings() {
  state.settings = {
    ...state.settings,
    enableScripture: document.getElementById('setScripture')?.value === 'true',
    enableEncouragement: document.getElementById('setEncourage')?.value === 'true',
    defaultTime: document.getElementById('setTime')?.value || '08:00',
    defaultSound: document.getElementById('setSound')?.value || 'gentle_chime',
  };
  saveAll();
  toast('⚙️ Settings saved!');
  render();
}

// ==================== BALANCE TAB ====================
function renderBalance() {
  const stats = { total: state.tasks.length, completed: state.tasks.filter(t => t.completed).length };
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  return `
    <div class="tab-content active">
      <div class="card gold">
        <h3 class="card-title">⚖️ Christian Task Balance</h3>
        <div class="progress-container">
          <div class="progress-bar ${pct > 70 ? 'progress-high' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="balance-text">
          <span style="font-size:36px;font-weight:800;color:#2c3e50">${pct}%</span>
          <span class="balance-label"> Completed</span>
        </div>
        <div class="hint-text">
          ${pct < 30 ? '🌟 Keep going! Every task brings you closer to your goals.' :
            pct < 70 ? '🔥 Great progress! Stay consistent!' :
            '🏆 Excellent! Your faith and discipline are shining!'}
        </div>
      </div>
      <div class="card blue">
        <h3 class="card-title">📈 Progress Overview</h3>
        <p style="color:#7f8c8d;line-height:1.8">• Total: ${stats.total}<br>• Completed: ${stats.completed}<br>• Active: ${stats.total - stats.completed}</p>
      </div>
      <div class="card green">
        <h3 class="card-title">🏆 Faith Milestones</h3>
        <p style="color:#7f8c8d;line-height:1.8">
          ${stats.completed >= 10 ? '✅ 10 tasks completed — You\'re building momentum!' : '⬜ 10 tasks — Keep pressing forward!'}<br>
          ${stats.completed >= 25 ? '✅ 25 tasks completed — Growing in discipline!' : '⬜ 25 tasks — You\'re on your way!'}<br>
          ${stats.completed >= 50 ? '✅ 50 tasks completed — Faith in action!' : '⬜ 50 tasks — Great things ahead!'}<br>
          ${stats.completed >= 100 ? '✅ 100 tasks completed — A true servant!' : '⬜ 100 tasks — Keep striving!'}
        </p>
      </div>
    </div>`;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  setTimeout(() => {
    document.getElementById('flash-effect').classList.add('active');
  }, 100);
  
  render();
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      setTab(e.target.closest('.nav-btn').dataset.tab);
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.modal-overlay') && !e.target.closest('.modal')) {
      render();
    }
  });

  setInterval(() => {
    saveAll();
  }, 30000);

  if (state.settings.enableEncouragement) {
    const now = new Date();
    const [eh, em] = (state.settings.defaultTime || '12:00').split(':').map(Number);
    const encourageTime = new Date();
    encourageTime.setHours(eh, em, 0, 0);
    if (encourageTime > now) {
      const delay = encourageTime.getTime() - now;
      setTimeout(() => {
        const e = getRandom(ENCOURAGEMENTS);
        if (Notification.permission === 'granted') {
          new Notification('💪 Daily Encouragement', { body: e, requireInteraction: true });
        }
        logNotif('💪 Encouragement', e);
      }, delay);
    }
  }
});
