import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Alert, Switch,
} from 'react-native';
import { TaskStore } from '../store/taskStore';
import { NotificationService } from '../services/notificationService';
import { AudioService } from '../services/audioService';

const SmartReminder = () => {
  const [incompleteTasks, setIncompleteTasks] = useState([]);
  const [notificationLog, setNotificationLog] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const tasks = await TaskStore.getTasks();
    setIncompleteTasks(tasks.filter(t => !t.completed));
    const log = await NotificationService.getNotificationLog(20);
    setNotificationLog(log);
    const s = await TaskStore.getScheduleSettings();
    setSettings(s);
    setLoading(false);
  };

  const handleSendReminder = async (task) => {
    const scripture = NotificationService.getRandomScripture();
    await NotificationService.scheduleNotification({
      taskId: task.id,
      title: `✝️ Don't forget: ${task.title}`,
      body: `"${scripture.verse}" — ${scripture.reference}`,
      scheduledTime: new Date(),
      soundId: 'gentle_nudge',
      snoozeable: true,
    });
    AudioService.playAlarm('gentle_nudge');
    Alert.alert('✅ Reminder Sent', `Scripture reminder scheduled for "${task.title}"`);
    loadData();
  };

  const handleSendEncouragement = () => {
    const msg = NotificationService.getEncouragementMessage();
    Alert.alert(msg.title, msg.body, [
      { text: 'Thanks! 🙏', style: 'default' },
    ]);
  };

  const handleSendScripture = () => {
    const msg = NotificationService.getScriptureReminderMessage();
    Alert.alert(msg.title, msg.body, [
      { text: 'Amen! 🙌', style: 'default' },
    ]);
  };

  const handleReEngageAll = async () => {
    Alert.alert(
      'Re-engage All Tasks',
      `Send reminders for all ${incompleteTasks.length} incomplete tasks with scripture messages?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send All',
          onPress: async () => {
            await NotificationService.createReEngagementNotifications(incompleteTasks);
            Alert.alert('✅ Done', `Reminders scheduled for ${incompleteTasks.length} tasks`);
            loadData();
          },
        },
      ]
    );
  };

  const handleSettingsUpdate = async (key, value) => {
    const updated = { ...settings, [key]: value };
    await TaskStore.saveScheduleSettings(updated);
    setSettings(updated);
  };

  const handleTestAlarm = (soundId) => {
    AudioService.playAlarm(soundId);
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>💡 Smart Reminders</Text>
        <Text style={styles.headerSubtitle}>Re-engage and stay consistent</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={handleSendScripture}>
          <Text style={styles.quickBtnIcon}>📖</Text>
          <Text style={styles.quickBtnLabel}>Scripture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.encourageBtn]} onPress={handleSendEncouragement}>
          <Text style={styles.quickBtnIcon}>💪</Text>
          <Text style={styles.quickBtnLabel}>Encourage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.settingsBtn]} onPress={() => setShowSettings(!showSettings)}>
          <Text style={styles.quickBtnIcon}>⚙️</Text>
          <Text style={styles.quickBtnLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {showSettings && settings && (
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>⚙️ Reminder Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>📖 Scripture Reminders</Text>
            <Switch value={settings.enableScriptureReminders} onValueChange={v => handleSettingsUpdate('enableScriptureReminders', v)} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>💪 Daily Encouragement</Text>
            <Switch value={settings.enableEncouragement} onValueChange={v => handleSettingsUpdate('enableEncouragement', v)} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Snooze Duration (min)</Text>
            <View style={styles.snoozeControls}>
              {[5, 10, 15, 30].map(m => (
                <TouchableOpacity key={m} style={[styles.snoozeBtn, settings.snoozeDuration === m && styles.snoozeActive]}
                  onPress={() => handleSettingsUpdate('snoozeDuration', m)}>
                  <Text style={[styles.snoozeText, settings.snoozeDuration === m && styles.snoozeTextActive]}>{m}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.inputLabel}>Default Reminder Time</Text>
          <View style={styles.timeRow}>
            {['06:00', '08:00', '12:00', '18:00', '20:00'].map(t => (
              <TouchableOpacity key={t} style={[styles.timeBtn, settings.defaultReminderTime === t && styles.timeActive]}
                onPress={() => handleSettingsUpdate('defaultReminderTime', t)}>
                <Text style={[styles.timeText, settings.defaultReminderTime === t && styles.timeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Incomplete Tasks ({incompleteTasks.length})</Text>
          {incompleteTasks.length > 0 && (
            <TouchableOpacity onPress={handleReEngageAll}>
              <Text style={styles.reengageLink}>Re-engage All</Text>
            </TouchableOpacity>
          )}
        </View>
        {incompleteTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>All tasks completed! Great job staying faithful!</Text>
          </View>
        ) : (
          incompleteTasks.slice(0, 10).map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.category && <Text style={styles.taskCat}>{task.category}</Text>}
                {task.scheduledTime && <Text style={styles.taskTime}>⏰ {task.scheduledTime}</Text>}
              </View>
              <TouchableOpacity style={styles.remindBtn} onPress={() => handleSendReminder(task)}>
                <Text style={styles.remindBtnText}>🔔 Remind</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📜 Notification History</Text>
        {notificationLog.length === 0 ? (
          <Text style={styles.emptyText}>No notification history yet.</Text>
        ) : (
          notificationLog.slice(0, 10).map((log, i) => (
            <View key={i} style={styles.logItem}>
              <Text style={styles.logTitle}>{log.title}</Text>
              <Text style={styles.logDate}>
                {new Date(log.firedAt).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#e67e22', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  quickActions: { flexDirection: 'row', padding: 16, gap: 8 },
  quickBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  encourageBtn: { backgroundColor: '#e8f5e9' },
  settingsBtn: { backgroundColor: '#e3f2fd' },
  quickBtnIcon: { fontSize: 24, marginBottom: 4 },
  quickBtnLabel: { fontSize: 12, fontWeight: '600', color: '#2c3e50' },
  settingsCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingLabel: { fontSize: 14, color: '#2c3e50' },
  snoozeControls: { flexDirection: 'row', gap: 6 },
  snoozeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f0f0f0' },
  snoozeActive: { backgroundColor: '#e67e22' },
  snoozeText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  snoozeTextActive: { color: '#fff' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginTop: 10, marginBottom: 6 },
  timeRow: { flexDirection: 'row', gap: 6 },
  timeBtn: { flex: 1, padding: 8, borderRadius: 6, backgroundColor: '#f0f0f0', alignItems: 'center' },
  timeActive: { backgroundColor: '#3498db' },
  timeText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  timeTextActive: { color: '#fff' },
  section: { padding: 16, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reengageLink: { color: '#e67e22', fontWeight: '600', fontSize: 13 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#95a5a6', fontSize: 14, textAlign: 'center' },
  taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  taskCat: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  taskTime: { fontSize: 11, color: '#e67e22', marginTop: 2 },
  remindBtn: { backgroundColor: '#e67e22', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  remindBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logItem: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#3498db' },
  logTitle: { fontSize: 13, fontWeight: '500', color: '#2c3e50' },
  logDate: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
});

export default SmartReminder;
