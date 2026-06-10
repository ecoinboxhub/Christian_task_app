import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Alert, Switch,
} from 'react-native';
import { TaskStore } from '../store/taskStore';
import { SchedulerService } from '../services/schedulerService';
import { groqService } from '../services/groqService';
import { ALARM_SOUNDS } from '../services/audioService';
import { NotificationService } from '../services/notificationService';

const TaskScheduler = () => {
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '', category: '', priority: 'medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '08:00',
    recurrence: 'none',
    recurrenceDays: [],
    dayOfMonth: null,
    recurrenceInterval: 1,
    hasAlarm: false,
    alarmSoundId: 'gentle_chime',
    snoozeEnabled: true,
    reminderMinutes: 5,
    notes: '',
  });

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const s = await SchedulerService.getSchedules();
    const t = await TaskStore.getTasks();
    const c = await TaskStore.getCategories();
    setSchedules(s);
    setTasks(t.filter(tk => !tk.completed));
    setCategories(c);
    setLoading(false);
  };

  const handleAddSchedule = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const taskData = {
      title: form.title,
      category: form.category,
      priority: form.priority,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      recurrence: form.recurrence,
      recurrenceDays: form.recurrenceDays,
      dayOfMonth: form.dayOfMonth,
      recurrenceInterval: form.recurrenceInterval,
      hasAlarm: form.hasAlarm,
      alarmSoundId: form.alarmSoundId,
      snoozeEnabled: form.snoozeEnabled,
      reminderMinutes: form.reminderMinutes,
      notes: form.notes,
    };

    const task = await TaskStore.addTask(taskData);

    await SchedulerService.saveSchedule({
      taskId: task.id,
      title: form.title,
      category: form.category,
      startDate: form.scheduledDate,
      time: form.scheduledTime,
      recurrence: form.recurrence,
      recurrenceDays: form.recurrenceDays,
      dayOfMonth: form.dayOfMonth,
      recurrenceInterval: form.recurrenceInterval,
      hasAlarm: form.hasAlarm,
      soundId: form.alarmSoundId,
    });

    if (form.hasAlarm) {
      const [h, m] = form.scheduledTime.split(':').map(Number);
      const alarmTime = new Date(form.scheduledDate);
      alarmTime.setHours(h - (form.reminderMinutes ? 0 : 0), m, 0, 0);

      if (form.reminderMinutes > 0) {
        const reminderTime = new Date(alarmTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - form.reminderMinutes);
        await NotificationService.scheduleNotification({
          taskId: task.id,
          title: `⏰ Reminder: ${form.title}`,
          body: `Starts in ${form.reminderMinutes} minutes`,
          scheduledTime: reminderTime,
          soundId: 'gentle_nudge',
        });
      }

      await NotificationService.scheduleNotification({
        taskId: task.id,
        title: `🔔 ${form.title}`,
        body: `Time for: ${form.title}`,
        scheduledTime: alarmTime,
        soundId: form.alarmSoundId,
        recurrence: form.recurrence !== 'none' ? form.recurrence : null,
        snoozeable: form.snoozeEnabled,
      });
    }

    setForm({
      title: '', category: '', priority: 'medium',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '08:00',
      recurrence: 'none', recurrenceDays: [],
      dayOfMonth: null, recurrenceInterval: 1,
      hasAlarm: false, alarmSoundId: 'gentle_chime',
      snoozeEnabled: true, reminderMinutes: 5, notes: '',
    });
    setShowAddModal(false);
    loadData();
  };

  const handleAISuggest = async () => {
    const suggestions = await groqService.generateSpiritualActivities(5);
    setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
    setShowAISuggestions(true);
  };

  const applyAISuggestion = (suggestion) => {
    setForm(prev => ({
      ...prev,
      title: suggestion.title,
      category: suggestion.category || prev.category,
      notes: suggestion.description || '',
    }));
    setShowAISuggestions(false);
  };

  const toggleDay = (dayIndex) => {
    setForm(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(dayIndex)
        ? prev.recurrenceDays.filter(d => d !== dayIndex)
        : [...prev.recurrenceDays, dayIndex],
    }));
  };

  const handleDeleteSchedule = async (id) => {
    await SchedulerService.deleteSchedule(id);
    loadData();
  };

  const getScheduleIcon = (rec) => {
    switch (rec) {
      case 'daily': return '🔄';
      case 'weekly': return '📅';
      case 'monthly': return '📆';
      default: return '📌';
    }
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    return schedules
      .filter(s => {
        const next = SchedulerService.getNextOccurrence(s);
        return next && next > now;
      })
      .sort((a, b) => {
        const aNext = SchedulerService.getNextOccurrence(a);
        const bNext = SchedulerService.getNextOccurrence(b);
        return (aNext?.getTime() || 0) - (bNext?.getTime() || 0);
      })
      .slice(0, 10);
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading scheduler...</Text></View>;
  }

  const upcoming = getUpcomingTasks();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>📅 Task Scheduler</Text>
        <Text style={styles.headerSubtitle}>Plan your spiritual journey</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.quickBtnIcon}>➕</Text>
          <Text style={styles.quickBtnLabel}>New Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.aiBtn]} onPress={handleAISuggest}>
          <Text style={styles.quickBtnIcon}>🤖</Text>
          <Text style={styles.quickBtnLabel}>AI Suggest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.recurBtn]} onPress={() => setShowRecurringModal(true)}>
          <Text style={styles.quickBtnIcon}>🔄</Text>
          <Text style={styles.quickBtnLabel}>Recurring</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Upcoming Scheduled Tasks</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming tasks. Add one to start planning!</Text>
          </View>
        ) : (
          upcoming.map(schedule => {
            const nextOccurrence = SchedulerService.getNextOccurrence(schedule);
            return (
              <View key={schedule.id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleIcon}>{getScheduleIcon(schedule.recurrence)}</Text>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                    <Text style={styles.scheduleMeta}>
                      {SchedulerService.formatRecurrence(schedule)} at {SchedulerService.formatTime(schedule.time)}
                    </Text>
                    {nextOccurrence && (
                      <Text style={styles.scheduleDate}>
                        Next: {nextOccurrence.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteSchedule(schedule.id)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                {schedule.category ? <Text style={styles.categoryBadge}>{schedule.category}</Text> : null}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Schedule Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNum}>{schedules.filter(s => s.recurrence === 'daily').length}</Text><Text style={styles.statLabel}>Daily</Text></View>
          <View style={styles.statCard}><Text style={styles.statNum}>{schedules.filter(s => s.recurrence === 'weekly').length}</Text><Text style={styles.statLabel}>Weekly</Text></View>
          <View style={styles.statCard}><Text style={styles.statNum}>{schedules.filter(s => s.recurrence === 'monthly').length}</Text><Text style={styles.statLabel}>Monthly</Text></View>
          <View style={styles.statCard}><Text style={styles.statNum}>{schedules.filter(s => !s.recurrence || s.recurrence === 'none').length}</Text><Text style={styles.statLabel}>One-time</Text></View>
        </View>
      </View>

      {/* Add Schedule Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Schedule Task</Text>

            <Text style={styles.inputLabel}>Task Title *</Text>
            <TextInput style={styles.input} placeholder="Enter task title" value={form.title}
              onChangeText={t => setForm({ ...form, title: t })} />

            <Text style={styles.inputLabel}>Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={form.scheduledDate}
              onChangeText={t => setForm({ ...form, scheduledDate: t })} />

            <Text style={styles.inputLabel}>Time (Digital)</Text>
            <TextInput style={styles.input} placeholder="HH:MM (24h format)" value={form.scheduledTime}
              onChangeText={t => setForm({ ...form, scheduledTime: t })} />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, form.category === cat && styles.chipActive]}
                  onPress={() => setForm({ ...form, category: cat })}>
                  <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity key={p} style={[styles.priorityBtn, form.priority === p && styles[`priority${p.charAt(0).toUpperCase() + p.slice(1)}Active`]]}
                  onPress={() => setForm({ ...form, priority: p })}>
                  <Text style={styles.priorityText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Recurrence</Text>
            <View style={styles.recurrenceRow}>
              {[
                { key: 'none', label: 'None' },
                { key: 'daily', label: 'Daily' },
                { key: 'weekly', label: 'Weekly' },
                { key: 'monthly', label: 'Monthly' },
              ].map(r => (
                <TouchableOpacity key={r.key}
                  style={[styles.recurrenceBtn, form.recurrence === r.key && styles.recurrenceActive]}
                  onPress={() => setForm({ ...form, recurrence: r.key })}>
                  <Text style={[styles.recurrenceText, form.recurrence === r.key && styles.recurrenceTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.recurrence === 'weekly' && (
              <View>
                <Text style={styles.inputLabel}>Days of Week</Text>
                <View style={styles.daysRow}>
                  {DAY_NAMES.map((day, i) => (
                    <TouchableOpacity key={i}
                      style={[styles.dayBtn, form.recurrenceDays.includes(i) && styles.dayActive]}
                      onPress={() => toggleDay(i)}>
                      <Text style={[styles.dayText, form.recurrenceDays.includes(i) && styles.dayTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {form.recurrence === 'monthly' && (
              <View>
                <Text style={styles.inputLabel}>Day of Month (1-31, -1 for last)</Text>
                <TextInput style={styles.input} placeholder="e.g., 15" keyboardType="numeric" value={form.dayOfMonth?.toString() || ''}
                  onChangeText={t => setForm({ ...form, dayOfMonth: t ? parseInt(t) : null })} />
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🔔 Set Alarm</Text>
              <Switch value={form.hasAlarm} onValueChange={v => setForm({ ...form, hasAlarm: v })} />
            </View>

            {form.hasAlarm && (
              <View>
                <Text style={styles.inputLabel}>Alarm Sound</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.soundScroll}>
                  {ALARM_SOUNDS.map(sound => (
                    <TouchableOpacity key={sound.id}
                      style={[styles.soundCard, form.alarmSoundId === sound.id && styles.soundActive]}
                      onPress={() => setForm({ ...form, alarmSoundId: sound.id })}>
                      <Text style={styles.soundName}>{sound.name}</Text>
                      <Text style={styles.soundDesc}>{sound.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Reminder (minutes before)</Text>
                <TextInput style={styles.input} placeholder="5" keyboardType="numeric" value={form.reminderMinutes.toString()}
                  onChangeText={t => setForm({ ...form, reminderMinutes: parseInt(t) || 0 })} />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Snooze Enabled</Text>
                  <Switch value={form.snoozeEnabled} onValueChange={v => setForm({ ...form, snoozeEnabled: v })} />
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput style={[styles.input, styles.notesInput]} placeholder="Add notes" value={form.notes}
              onChangeText={t => setForm({ ...form, notes: t })} multiline />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSchedule}>
                <Text style={styles.btnText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* AI Suggestions Modal */}
      <Modal visible={showAISuggestions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>🤖 AI Spiritual Suggestions</Text>
            {aiSuggestions.length === 0 ? (
              <Text style={styles.emptyText}>Loading suggestions...</Text>
            ) : (
              <ScrollView>
                {aiSuggestions.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.suggestionCard} onPress={() => applyAISuggestion(item)}>
                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                    {item.category && <Text style={styles.suggestionCat}>{item.category}</Text>}
                    {item.duration && <Text style={styles.suggestionDuration}>⏱ {item.duration}</Text>}
                    {item.description && <Text style={styles.suggestionDesc}>{item.description}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAISuggestions(false)}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recurring Tasks Modal */}
      <Modal visible={showRecurringModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>🔄 Recurring Tasks</Text>
            {schedules.filter(s => s.recurrence && s.recurrence !== 'none').length === 0 ? (
              <Text style={styles.emptyText}>No recurring tasks yet.</Text>
            ) : (
              <ScrollView>
                {schedules.filter(s => s.recurrence && s.recurrence !== 'none').map(s => (
                  <View key={s.id} style={styles.recurringCard}>
                    <View style={styles.recurringHeader}>
                      <Text style={styles.recurringIcon}>{getScheduleIcon(s.recurrence)}</Text>
                      <View>
                        <Text style={styles.recurringTitle}>{s.title}</Text>
                        <Text style={styles.recurringMeta}>{SchedulerService.formatRecurrence(s)}</Text>
                      </View>
                    </View>
                    {s.hasAlarm && <Text style={styles.alarmBadge}>🔔 {s.soundId || 'gentle_chime'}</Text>}
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowRecurringModal(false)}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#3498db', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  quickActions: { flexDirection: 'row', padding: 16, gap: 8 },
  quickBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  aiBtn: { backgroundColor: '#f3e5f5' },
  recurBtn: { backgroundColor: '#e8f5e9' },
  quickBtnIcon: { fontSize: 24, marginBottom: 4 },
  quickBtnLabel: { fontSize: 12, fontWeight: '600', color: '#2c3e50' },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 40, alignItems: 'center' },
  emptyText: { color: '#95a5a6', fontSize: 14, textAlign: 'center' },
  scheduleCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center' },
  scheduleIcon: { fontSize: 20, marginRight: 12 },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  scheduleMeta: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  scheduleDate: { fontSize: 11, color: '#3498db', marginTop: 2 },
  deleteIcon: { fontSize: 16, padding: 4 },
  categoryBadge: { backgroundColor: '#e8f5e9', color: '#27ae60', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 8, fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#3498db' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '92%', maxWidth: 450, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 4 },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },
  categoryScroll: { marginBottom: 4 },
  chip: { backgroundColor: '#f0f0f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#3498db' },
  chipText: { fontSize: 13, color: '#7f8c8d' },
  chipTextActive: { color: '#fff' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bdc3c7', alignItems: 'center' },
  priorityLowActive: { backgroundColor: '#27ae60', borderColor: '#27ae60' },
  priorityMediumActive: { backgroundColor: '#f39c12', borderColor: '#f39c12' },
  priorityHighActive: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  recurrenceRow: { flexDirection: 'row', gap: 8 },
  recurrenceBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  recurrenceActive: { backgroundColor: '#9b59b6' },
  recurrenceText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  recurrenceTextActive: { color: '#fff' },
  daysRow: { flexDirection: 'row', gap: 4 },
  dayBtn: { flex: 1, padding: 8, borderRadius: 6, backgroundColor: '#f0f0f0', alignItems: 'center' },
  dayActive: { backgroundColor: '#3498db' },
  dayText: { fontSize: 10, fontWeight: '600', color: '#7f8c8d' },
  dayTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  soundScroll: { marginBottom: 4 },
  soundCard: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, marginRight: 8, minWidth: 100, alignItems: 'center' },
  soundActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#27ae60' },
  soundName: { fontSize: 12, fontWeight: '600', color: '#2c3e50' },
  soundDesc: { fontSize: 10, color: '#7f8c8d' },
  modalButtons: { flexDirection: 'row', gap: 8, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#e74c3c', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#27ae60', padding: 14, borderRadius: 8, alignItems: 'center' },
  closeBtn: { backgroundColor: '#95a5a6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  suggestionCard: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#9b59b6' },
  suggestionTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  suggestionCat: { fontSize: 12, color: '#9b59b6', fontWeight: '600', marginTop: 2 },
  suggestionDuration: { fontSize: 11, color: '#e67e22', marginTop: 2 },
  suggestionDesc: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  recurringCard: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 8 },
  recurringHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recurringIcon: { fontSize: 20 },
  recurringTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  recurringMeta: { fontSize: 11, color: '#7f8c8d' },
  alarmBadge: { backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 6, fontSize: 11 },
});

export default TaskScheduler;
