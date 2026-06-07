/**
 * Task Store - Handles task management and persistence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = 'believers_tasks';
const PRAYER_BALANCE_KEY = 'believers_prayer_balance';
const BIBLE_STUDY_KEY = 'believers_bible_study';

// Default data
const DEFAULT_TASKS = [];
const DEFAULT_PRAYER_BALANCE = 0;
const DEFAULT_BIBLE_STUDY = [];

export const TaskStore = {
  // Tasks
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
        task.id === id ? {...task, ...updates, updatedAt: new Date().toISOString()} : task
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

  // Helper
  async _saveTasks(tasks) {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  },

  // Clear all data
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([TASKS_KEY, PRAYER_BALANCE_KEY, BIBLE_STUDY_KEY]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
};
