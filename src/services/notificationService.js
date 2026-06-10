import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioService, ALARM_SOUNDS } from './audioService';

const NOTIFICATIONS_KEY = 'believers_notifications';
const NOTIFICATION_LOG_KEY = 'believers_notification_log';
const SNOOZE_KEY = 'believers_snoozed';

const SCRIPTURE_REMINDERS = [
  { verse: 'Be strong and courageous. Do not be afraid.', reference: 'Joshua 1:9' },
  { verse: 'I can do all things through Christ who strengthens me.', reference: 'Philippians 4:13' },
  { verse: 'Trust in the Lord with all your heart.', reference: 'Proverbs 3:5' },
  { verse: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { verse: 'Pray without ceasing.', reference: '1 Thessalonians 5:17' },
  { verse: 'Let your light shine before others.', reference: 'Matthew 5:16' },
  { verse: 'For God so loved the world...', reference: 'John 3:16' },
  { verse: 'Seek first the kingdom of God.', reference: 'Matthew 6:33' },
  { verse: 'Do not be anxious about anything.', reference: 'Philippians 4:6' },
  { verse: 'Your word is a lamp to my feet.', reference: 'Psalm 119:105' },
];

const ENCOURAGEMENT_MESSAGES = [
  'You are making wonderful progress in your faith journey! Keep going!',
  'Every step you take brings you closer to God. Stay faithful!',
  'Your consistency is inspiring. God sees your dedication!',
  'Remember, God\'s love for you is unending. Keep pressing forward!',
  'You are not alone — God walks with you every step of the way!',
  'Small steps of faith lead to great spiritual growth!',
  'Your commitment to spiritual growth is beautiful! Keep shining!',
  'Today is a new opportunity to grow in God\'s grace!',
  'Faithfulness in small things leads to greater blessings!',
  'You are a child of God, created for amazing purposes!',
];

export const NotificationService = {
  async initialize() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    await this._cleanExpiredNotifications();
    this._startReminderChecker();
  },

  _startReminderChecker() {
    setInterval(() => {
      this.checkDueNotifications();
    }, 30000);
  },

  async scheduleNotification({ taskId, title, body, scheduledTime, soundId = 'gentle_chime', recurrence = null, snoozeable = true }) {
    const notifications = await this._getNotifications();
    const notification = {
      id: `${taskId}_${Date.now()}`,
      taskId,
      title,
      body,
      scheduledTime: scheduledTime instanceof Date ? scheduledTime.toISOString() : scheduledTime,
      soundId,
      recurrence,
      snoozeable,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [...notifications, notification];
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    this._scheduleWebNotification(notification);
    return notification;
  },

  _scheduleWebNotification(notification) {
    const scheduledTime = new Date(notification.scheduledTime).getTime();
    const now = Date.now();
    const delay = Math.max(0, scheduledTime - now);

    if (delay > 2147483647) {
      setTimeout(() => {
        this._scheduleWebNotification(notification);
      }, 2147483647);
      return;
    }

    setTimeout(async () => {
      await this.fireNotification(notification.id);
    }, delay);
  },

  async fireNotification(notificationId) {
    const notifications = await this._getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.status === 'fired') return;

    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, status: 'fired', firedAt: new Date().toISOString() } : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    await this._logNotification(notification);

    if (notification.soundId) {
      AudioService.playAlarm(notification.soundId);
    }

    this.showNotification(notification.title, notification.body);

    if (notification.recurrence && notification.recurrence !== 'none') {
      const nextTime = this._getNextRecurrenceTime(notification);
      if (nextTime) {
        await this.scheduleNotification({
          taskId: notification.taskId,
          title: notification.title,
          body: notification.body,
          scheduledTime: nextTime,
          soundId: notification.soundId,
          recurrence: notification.recurrence,
          snoozeable: notification.snoozeable,
        });
      }
    }
  },

  showNotification(title, body) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'believers-task-flow',
        requireInteraction: true,
      });
    }
  },

  async snoozeNotification(notificationId, minutes = 5) {
    const notifications = await this._getNotifications();
    const snoozedTime = new Date(Date.now() + minutes * 60 * 1000);

    const updated = notifications.map(n =>
      n.id === notificationId
        ? { ...n, status: 'snoozed', snoozedUntil: snoozedTime.toISOString(), snoozeCount: (n.snoozeCount || 0) + 1 }
        : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      AudioService.stopAlarm();
      setTimeout(() => {
        this.fireNotification(notificationId);
      }, minutes * 60 * 1000);
    }
  },

  async dismissNotification(notificationId) {
    AudioService.stopAlarm();
    const notifications = await this._getNotifications();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, status: 'dismissed' } : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  async checkDueNotifications() {
    const notifications = await this._getNotifications();
    const now = new Date();

    for (const notification of notifications) {
      if (notification.status !== 'pending') continue;

      const scheduledTime = new Date(notification.scheduledTime);
      if (scheduledTime <= now) {
        await this.fireNotification(notification.id);
      }

      if (notification.status === 'snoozed' && notification.snoozedUntil) {
        const snoozedUntil = new Date(notification.snoozedUntil);
        if (snoozedUntil <= now) {
          await this.fireNotification(notification.id);
        }
      }
    }
  },

  async getPendingNotifications() {
    const notifications = await this._getNotifications();
    return notifications.filter(n => n.status === 'pending' || n.status === 'snoozed');
  },

  async getNotificationLog(limit = 50) {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_LOG_KEY);
      const log = data ? JSON.parse(data) : [];
      return log.slice(-limit).reverse();
    } catch (e) {
      return [];
    }
  },

  getRandomScripture() {
    return SCRIPTURE_REMINDERS[Math.floor(Math.random() * SCRIPTURE_REMINDERS.length)];
  },

  getRandomEncouragement() {
    return ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
  },

  getScriptureReminderMessage() {
    const scripture = this.getRandomScripture();
    return {
      title: '📖 Scripture Reminder',
      body: `"${scripture.verse}" — ${scripture.reference}`,
    };
  },

  getEncouragementMessage() {
    return {
      title: '💪 Encouragement',
      body: this.getRandomEncouragement(),
    };
  },

  async _getNotifications() {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async _logNotification(notification) {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_LOG_KEY);
      const log = data ? JSON.parse(data) : [];
      log.push({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        firedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(log.slice(-200)));
    } catch (e) {
      console.warn('Failed to log notification:', e);
    }
  },

  _getNextRecurrenceTime(notification) {
    if (!notification.recurrence || notification.recurrence === 'none') return null;
    const lastTime = new Date(notification.scheduledTime);
    const next = new Date(lastTime);

    switch (notification.recurrence) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return null;
    }

    return next;
  },

  async _cleanExpiredNotifications() {
    const notifications = await this._getNotifications();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const valid = notifications.filter(n => {
      if (n.recurrence && n.recurrence !== 'none') return true;
      const d = new Date(n.scheduledTime);
      return d > cutoff || n.status === 'pending' || n.status === 'snoozed';
    });
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(valid));
  },

  async createReEngagementNotifications(tasks) {
    const incompleteTasks = tasks.filter(t => !t.completed);
    for (const task of incompleteTasks) {
      const scripture = this.getRandomScripture();
      const message = `"${scripture.verse}" — ${scripture.reference}`;
      const time = new Date(Date.now() + 3600000);

      await this.scheduleNotification({
        taskId: task.id,
        title: `✝️ Unfinished: ${task.title}`,
        body: message,
        scheduledTime: time,
        soundId: 'gentle_nudge',
        snoozeable: true,
      });
    }
  },

  async createHabitNotifications(habits) {
    for (const habit of habits) {
      const [hour, minute] = (habit.reminderTime || '08:00').split(':').map(Number);
      const time = new Date();
      time.setHours(hour, minute, 0, 0);

      if (time <= new Date()) {
        time.setDate(time.getDate() + 1);
      }

      await this.scheduleNotification({
        taskId: habit.id,
        title: `🔄 Habit Reminder: ${habit.title}`,
        body: habit.description || `Time for your ${habit.category} habit!`,
        scheduledTime: time,
        soundId: habit.soundId || 'gentle_chime',
        recurrence: 'daily',
        snoozeable: true,
      });
    }
  },
};
