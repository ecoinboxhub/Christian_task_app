import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEDULES_KEY = 'believers_schedules';
const HABITS_KEY = 'believers_habits';

const RECURRENCE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
};

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const SchedulerService = {
  RECURRENCE_TYPES,
  DAYS_OF_WEEK,

  async getSchedules() {
    try {
      const data = await AsyncStorage.getItem(SCHEDULES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveSchedule(schedule) {
    const schedules = await this.getSchedules();
    const newSchedule = {
      ...schedule,
      id: schedule.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newSchedule, ...schedules];
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(updated));
    return newSchedule;
  },

  async updateSchedule(id, updates) {
    const schedules = await this.getSchedules();
    const updated = schedules.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(updated));
    return updated.find(s => s.id === id);
  },

  async deleteSchedule(id) {
    const schedules = await this.getSchedules();
    const updated = schedules.filter(s => s.id !== id);
    await AsyncStorage.setItem(SCHEDULES_KEY, JSON.stringify(updated));
    return updated;
  },

  getNextOccurrence(schedule) {
    const now = new Date();
    const taskTime = new Date(schedule.startDate || now);
    const [hours, minutes] = (schedule.time || '08:00').split(':').map(Number);
    taskTime.setHours(hours, minutes, 0, 0);

    if (!schedule.recurrence || schedule.recurrence === 'none') {
      return taskTime > now ? taskTime : null;
    }

    const occurrences = this.getOccurrencesBetween(schedule, now, new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), 1);
    return occurrences.length > 0 ? new Date(occurrences[0]) : null;
  },

  getOccurrencesBetween(schedule, startDate, endDate, limit = 10) {
    const occurrences = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    const [hours, minutes] = (schedule.time || '08:00').split(':').map(Number);

    current.setHours(hours, minutes, 0, 0);

    const maxIterations = 200;
    let iterations = 0;

    while (current <= end && occurrences.length < limit && iterations < maxIterations) {
      iterations++;

      if (this._matchesSchedule(schedule, current)) {
        occurrences.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    return occurrences;
  },

  _matchesSchedule(schedule, date) {
    if (!schedule.recurrence || schedule.recurrence === 'none') {
      const startDate = new Date(schedule.startDate || date);
      return date.toDateString() === startDate.toDateString();
    }

    switch (schedule.recurrence) {
      case RECURRENCE_TYPES.DAILY:
        return true;

      case RECURRENCE_TYPES.WEEKLY: {
        const days = schedule.recurrenceDays || [];
        if (days.length === 0) return true;
        return days.includes(date.getDay());
      }

      case RECURRENCE_TYPES.MONTHLY: {
        const dayOfMonth = schedule.dayOfMonth || date.getDate();
        if (dayOfMonth === -1) {
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
          return date.getDate() === lastDay;
        }
        return date.getDate() === dayOfMonth;
      }

      case RECURRENCE_TYPES.CUSTOM: {
        const interval = schedule.recurrenceInterval || 1;
        const startDate = new Date(schedule.startDate || date);
        const diffDays = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return diffDays % interval === 0;
      }

      default:
        return false;
    }
  },

  getSchedulesDueToday(schedules) {
    const today = new Date();
    return schedules.filter(s => this._matchesSchedule(s, today));
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  },

  formatRecurrence(schedule) {
    if (!schedule.recurrence || schedule.recurrence === 'none') return 'One-time';
    switch (schedule.recurrence) {
      case RECURRENCE_TYPES.DAILY:
        return 'Daily';
      case RECURRENCE_TYPES.WEEKLY: {
        const days = schedule.recurrenceDays || [];
        if (days.length === 0 || days.length === 7) return 'Weekly';
        return `Weekly (${days.map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ')})`;
      }
      case RECURRENCE_TYPES.MONTHLY:
        return schedule.dayOfMonth === -1 ? 'Monthly (last day)' : `Monthly (day ${schedule.dayOfMonth})`;
      case RECURRENCE_TYPES.CUSTOM:
        return `Every ${schedule.recurrenceInterval || 1} day(s)`;
      default:
        return 'One-time';
    }
  },

  // Habits
  async getHabits() {
    try {
      const data = await AsyncStorage.getItem(HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async saveHabit(habit) {
    const habits = await this.getHabits();
    const newHabit = {
      ...habit,
      id: habit.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      streak: 0,
      lastCompletedDate: null,
      history: [],
    };
    const updated = [newHabit, ...habits];
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    return newHabit;
  },

  async updateHabit(id, updates) {
    const habits = await this.getHabits();
    const updated = habits.map(h =>
      h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
    );
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    return updated.find(h => h.id === id);
  },

  async deleteHabit(id) {
    const habits = await this.getHabits();
    const updated = habits.filter(h => h.id !== id);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    return updated;
  },

  async completeHabit(id) {
    const habits = await this.getHabits();
    const now = new Date();
    const today = now.toDateString();

    const updated = habits.map(h => {
      if (h.id !== id) return h;

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = h.lastCompletedDate === yesterday.toDateString();

      return {
        ...h,
        streak: wasYesterday ? (h.streak || 0) + 1 : 1,
        lastCompletedDate: today,
        history: [...(h.history || []), { date: now.toISOString(), completed: true }],
      };
    });

    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
    return updated.find(h => h.id === id);
  },

  async getHabitsDueToday() {
    const habits = await this.getHabits();
    const today = new Date().toDateString();
    return habits.filter(h => {
      if (h.lastCompletedDate === today) return false;
      if (!h.recurrence || h.recurrence === 'none') return true;
      return this._matchesSchedule(h, new Date());
    });
  },
};
