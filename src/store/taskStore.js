import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = 'believers_tasks';
const PRAYER_BALANCE_KEY = 'believers_prayer_balance';
const BIBLE_STUDY_KEY = 'believers_bible_study';
const CATEGORIES_KEY = 'believers_categories';
const SCHEDULE_SETTINGS_KEY = 'believers_schedule_settings';

const DEFAULT_TASKS = [];
const DEFAULT_PRAYER_BALANCE = 0;
const DEFAULT_BIBLE_STUDY = [];
const DEFAULT_CATEGORIES = [
  'Prayer', 'Bible Study', 'Worship', 'Service', 'Fellowship',
  'Personal', 'Family', 'Work', 'Health', 'Finance',
];
const DEFAULT_SCHEDULE_SETTINGS = {
  defaultReminderTime: '08:00',
  defaultSoundId: 'gentle_chime',
  snoozeDuration: 5,
  enableScriptureReminders: true,
  enableEncouragement: true,
  encouragementTime: '12:00',
};

export const TaskStore = {
  async getTasks() {
    try {
      const tasks = await AsyncStorage.getItem(TASKS_KEY);
      return tasks ? JSON.parse(tasks) : DEFAULT_TASKS;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return DEFAULT_TASKS;
    }
  },

  async addTask(task) {
    try {
      const tasks = await this.getTasks();
      const newTask = {
        ...task,
        id: task.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        completed: task.completed || false,
        scheduledDate: task.scheduledDate || null,
        scheduledTime: task.scheduledTime || null,
        recurrence: task.recurrence || 'none',
        recurrenceDays: task.recurrenceDays || [],
        recurrenceInterval: task.recurrenceInterval || 1,
        dayOfMonth: task.dayOfMonth || null,
        endDate: task.endDate || null,
        hasAlarm: task.hasAlarm || false,
        alarmSoundId: task.alarmSoundId || 'gentle_chime',
        snoozeEnabled: task.snoozeEnabled !== undefined ? task.snoozeEnabled : true,
        reminderMinutes: task.reminderMinutes || 0,
        category: task.category || '',
        priority: task.priority || 'medium',
        notes: task.notes || '',
        tags: task.tags || [],
      };
      const updatedTasks = [newTask, ...tasks];
      await this._saveTasks(updatedTasks);
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  async updateTask(id, updates) {
    try {
      const tasks = await this.getTasks();
      const updatedTasks = tasks.map(task =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      );
      await this._saveTasks(updatedTasks);
      return updatedTasks.find(t => t.id === id);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  async deleteTask(id) {
    try {
      const tasks = await this.getTasks();
      const updatedTasks = tasks.filter(task => task.id !== id);
      await this._saveTasks(updatedTasks);
      return updatedTasks;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async toggleComplete(id) {
    try {
      const tasks = await this.getTasks();
      const updatedTasks = tasks.map(task =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : null,
            }
          : task
      );
      await this._saveTasks(updatedTasks);
      return updatedTasks.find(t => t.id === id);
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  },

  async clearCompleted() {
    try {
      const tasks = await this.getTasks();
      const updatedTasks = tasks.filter(task => !task.completed);
      await this._saveTasks(updatedTasks);
      return updatedTasks;
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
      throw error;
    }
  },

  async getTasksByDate(date) {
    const tasks = await this.getTasks();
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    return tasks.filter(t => {
      if (t.completed) return false;
      if (t.scheduledDate) {
        const taskDate = t.scheduledDate.split('T')[0];
        return taskDate === dateStr;
      }
      return false;
    });
  },

  async getTasksByCategory(category) {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.category?.toLowerCase() === category.toLowerCase());
  },

  async getRecurringTasks() {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.recurrence && t.recurrence !== 'none');
  },

  async getTasksDueToday() {
    const tasks = await this.getTasks();
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => {
      if (t.completed) return false;
      if (t.recurrence && t.recurrence !== 'none') {
        return this._matchesRecurrence(t, new Date());
      }
      if (t.scheduledDate) {
        return t.scheduledDate.split('T')[0] === today;
      }
      return false;
    });
  },

  _matchesRecurrence(task, date) {
    const targetDay = date.getDay();
    switch (task.recurrence) {
      case 'daily': return true;
      case 'weekly':
        return !task.recurrenceDays || task.recurrenceDays.length === 0 ||
          task.recurrenceDays.includes(targetDay);
      case 'monthly': {
        const dayOfMonth = task.dayOfMonth || date.getDate();
        if (dayOfMonth === -1) {
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          return date.getDate() === lastDay;
        }
        return date.getDate() === dayOfMonth;
      }
      default: return false;
    }
  },

  // Prayer Balance
  async getPrayerBalance() {
    try {
      const balance = await AsyncStorage.getItem(PRAYER_BALANCE_KEY);
      return balance ? parseFloat(balance) : DEFAULT_PRAYER_BALANCE;
    } catch (error) {
      console.error('Error getting prayer balance:', error);
      return DEFAULT_PRAYER_BALANCE;
    }
  },

  async addPrayer(prayer) {
    try {
      const balance = await this.getPrayerBalance();
      const updatedBalance = balance + prayer;
      await AsyncStorage.setItem(PRAYER_BALANCE_KEY, updatedBalance.toString());
      return updatedBalance;
    } catch (error) {
      console.error('Error adding prayer:', error);
      throw error;
    }
  },

  async deductPrayer(amount) {
    try {
      const balance = await this.getPrayerBalance();
      const updatedBalance = balance - amount;
      await AsyncStorage.setItem(PRAYER_BALANCE_KEY, updatedBalance.toString());
      return updatedBalance;
    } catch (error) {
      console.error('Error deducting prayer:', error);
      throw error;
    }
  },

  // Bible Study
  async getBibleStudy() {
    try {
      const study = await AsyncStorage.getItem(BIBLE_STUDY_KEY);
      return study ? JSON.parse(study) : DEFAULT_BIBLE_STUDY;
    } catch (error) {
      console.error('Error getting Bible study:', error);
      return DEFAULT_BIBLE_STUDY;
    }
  },

  async addBibleStudy(study) {
    try {
      const studyData = await this.getBibleStudy();
      const newStudy = {
        ...study,
        id: study.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updatedStudy = [newStudy, ...studyData];
      await AsyncStorage.setItem(BIBLE_STUDY_KEY, JSON.stringify(updatedStudy));
      return newStudy;
    } catch (error) {
      console.error('Error adding Bible study:', error);
      throw error;
    }
  },

  async deleteBibleStudy(id) {
    try {
      const studyData = await this.getBibleStudy();
      const updatedStudy = studyData.filter(item => item.id !== id);
      await AsyncStorage.setItem(BIBLE_STUDY_KEY, JSON.stringify(updatedStudy));
      return updatedStudy;
    } catch (error) {
      console.error('Error deleting Bible study:', error);
      throw error;
    }
  },

  // Categories
  async getCategories() {
    try {
      const cats = await AsyncStorage.getItem(CATEGORIES_KEY);
      return cats ? JSON.parse(cats) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  },

  async addCategory(category) {
    const cats = await this.getCategories();
    if (!cats.includes(category)) {
      cats.push(category);
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
    }
    return cats;
  },

  async deleteCategory(category) {
    const cats = await this.getCategories();
    const updated = cats.filter(c => c !== category);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    return updated;
  },

  // Schedule Settings
  async getScheduleSettings() {
    try {
      const data = await AsyncStorage.getItem(SCHEDULE_SETTINGS_KEY);
      return data ? { ...DEFAULT_SCHEDULE_SETTINGS, ...JSON.parse(data) } : DEFAULT_SCHEDULE_SETTINGS;
    } catch (e) {
      return DEFAULT_SCHEDULE_SETTINGS;
    }
  },

  async saveScheduleSettings(settings) {
    await AsyncStorage.setItem(SCHEDULE_SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SCHEDULE_SETTINGS, ...settings }));
    return settings;
  },

  async _saveTasks(tasks) {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        TASKS_KEY, PRAYER_BALANCE_KEY, BIBLE_STUDY_KEY,
        CATEGORIES_KEY, SCHEDULE_SETTINGS_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
};
