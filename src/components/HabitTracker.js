import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Alert, Switch,
} from 'react-native';
import { SchedulerService } from '../services/schedulerService';
import { NotificationService } from '../services/notificationService';
import { groqService } from '../services/groqService';
import { ALARM_SOUNDS } from '../services/audioService';

const HABIT_CATEGORIES = ['prayer', 'study', 'worship', 'service', 'fellowship', 'health', 'personal'];
const HABIT_FREQUENCIES = ['daily', 'weekly', 'monthly'];

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  const [form, setForm] = useState({
    title: '', category: 'prayer', description: '',
    recurrence: 'daily', reminderTime: '08:00',
    soundId: 'gentle_chime', hasReminder: true,
  });

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setLoading(true);
    const h = await SchedulerService.getHabits();
    setHabits(h);
    setLoading(false);
  };

  const handleAddHabit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }
    const habit = await SchedulerService.saveHabit(form);
    if (form.hasReminder) {
      await NotificationService.createHabitNotifications([habit]);
    }
    setForm({ title: '', category: 'prayer', description: '', recurrence: 'daily', reminderTime: '08:00', soundId: 'gentle_chime', hasReminder: true });
    setShowAddModal(false);
    loadHabits();
  };

  const handleCompleteHabit = async (id) => {
    const habit = await SchedulerService.completeHabit(id);
    Alert.alert('✅ Habit Completed!', `Streak: ${habit.streak} days!`);
    loadHabits();
  };

  const handleDeleteHabit = async (id) => {
    Alert.alert('Delete Habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await SchedulerService.deleteHabit(id);
        loadHabits();
      }},
    ]);
  };

  const handleAISuggest = async () => {
    const suggestions = await groqService.generateHabitSuggestions();
    setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
    setShowAIModal(true);
  };

  const applyAISuggestion = (suggestion) => {
    setForm({
      title: suggestion.title,
      category: suggestion.category || 'prayer',
      description: `Frequency: ${suggestion.frequency || 'Daily'}. Bible verse: ${suggestion.verse || ''}`,
      recurrence: suggestion.frequency?.toLowerCase() === 'weekly' ? 'weekly' : 'daily',
      reminderTime: suggestion.suggestedTime || '08:00',
      soundId: 'gentle_chime',
      hasReminder: true,
    });
    setShowAIModal(false);
    setShowAddModal(true);
  };

  const getFilteredHabits = () => {
    const today = new Date().toDateString();
    switch (activeFilter) {
      case 'today':
        return habits.filter(h => h.lastCompletedDate !== today);
      case 'completed':
        return habits.filter(h => h.lastCompletedDate === today);
      case 'streak':
        return [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0));
      default:
        return habits;
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = { prayer: '🙏', study: '📖', worship: '🎵', service: '🤝', fellowship: '👥', health: '💪', personal: '👤' };
    return icons[cat] || '📌';
  };

  const getCategoryColor = (cat) => {
    const colors = {
      prayer: '#e67e22', study: '#9b59b6', worship: '#e74c3c',
      service: '#27ae60', fellowship: '#3498db', health: '#1abc9c', personal: '#95a5a6'
    };
    return colors[cat] || '#95a5a6';
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading habits...</Text></View>;
  }

  const filtered = getFilteredHabits();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>🎯 Habit Tracker</Text>
        <Text style={styles.headerSubtitle}>Build consistent spiritual disciplines</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.quickBtnIcon}>➕</Text>
          <Text style={styles.quickBtnLabel}>New Habit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.aiBtn]} onPress={handleAISuggest}>
          <Text style={styles.quickBtnIcon}>🤖</Text>
          <Text style={styles.quickBtnLabel}>AI Suggest</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{habits.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{habits.filter(h => h.lastCompletedDate === new Date().toDateString()).length}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{Math.max(...habits.map(h => h.streak || 0), 0)}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {['all', 'today', 'completed', 'streak'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, activeFilter === f && styles.filterActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'today' ? 'All habits done today! 🎉' : 'No habits yet. Start building spiritual discipline!'}
          </Text>
        </View>
      ) : (
        filtered.map(habit => {
          const today = new Date().toDateString();
          const isCompleted = habit.lastCompletedDate === today;
          return (
            <View key={habit.id} style={styles.habitCard}>
              <View style={[styles.habitIcon, { backgroundColor: getCategoryColor(habit.category) + '20' }]}>
                <Text style={styles.habitEmoji}>{getCategoryIcon(habit.category)}</Text>
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <Text style={styles.habitMeta}>
                  {habit.recurrence} · ⏰ {habit.reminderTime || '08:00'}
                </Text>
                {habit.description ? <Text style={styles.habitDesc}>{habit.description}</Text> : null}
                <View style={styles.streakBadge}>
                  <Text style={styles.streakFire}>🔥</Text>
                  <Text style={styles.streakText}>{habit.streak || 0} day streak</Text>
                </View>
              </View>
              <View style={styles.habitActions}>
                <TouchableOpacity
                  style={[styles.completeBtn, isCompleted && styles.completedBtn]}
                  onPress={() => handleCompleteHabit(habit.id)}
                  disabled={isCompleted}>
                  <Text style={styles.completeBtnText}>{isCompleted ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteHabit(habit.id)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ New Habit</Text>

            <Text style={styles.inputLabel}>Habit Name *</Text>
            <TextInput style={styles.input} placeholder="e.g., Morning Prayer" value={form.title}
              onChangeText={t => setForm({ ...form, title: t })} />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {HABIT_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat}
                  style={[styles.catBtn, form.category === cat && { backgroundColor: getCategoryColor(cat) }]}
                  onPress={() => setForm({ ...form, category: cat })}>
                  <Text style={styles.catIcon}>{getCategoryIcon(cat)}</Text>
                  <Text style={[styles.catLabel, form.category === cat && styles.catLabelActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={styles.input} placeholder="Optional description" value={form.description}
              onChangeText={t => setForm({ ...form, description: t })} />

            <Text style={styles.inputLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {HABIT_FREQUENCIES.map(f => (
                <TouchableOpacity key={f} style={[styles.freqBtn, form.recurrence === f && styles.freqActive]}
                  onPress={() => setForm({ ...form, recurrence: f })}>
                  <Text style={[styles.freqText, form.recurrence === f && styles.freqTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Reminder Time</Text>
            <TextInput style={styles.input} placeholder="HH:MM (24h)" value={form.reminderTime}
              onChangeText={t => setForm({ ...form, reminderTime: t })} />

            <Text style={styles.inputLabel}>Alarm Sound</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {ALARM_SOUNDS.map(s => (
                <TouchableOpacity key={s.id} style={[styles.soundBtn, form.soundId === s.id && styles.soundActive]}
                  onPress={() => setForm({ ...form, soundId: s.id })}>
                  <Text style={styles.soundName}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🔔 Daily Reminder</Text>
              <Switch value={form.hasReminder} onValueChange={v => setForm({ ...form, hasReminder: v })} />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddHabit}>
                <Text style={styles.btnText}>Save Habit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showAIModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>🤖 AI Habit Suggestions</Text>
            {aiSuggestions.length === 0 ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : (
              <ScrollView>
                {aiSuggestions.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.aiCard} onPress={() => applyAISuggestion(item)}>
                    <Text style={styles.aiTitle}>{item.title}</Text>
                    <Text style={styles.aiMeta}>{item.category} · {item.frequency} · ⏰ {item.suggestedTime}</Text>
                    {item.verse && <Text style={styles.aiVerse}>📖 {item.verse}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAIModal(false)}>
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
  headerCard: { backgroundColor: '#27ae60', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  quickActions: { flexDirection: 'row', padding: 16, gap: 8 },
  quickBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  aiBtn: { backgroundColor: '#f3e5f5' },
  quickBtnIcon: { fontSize: 24, marginBottom: 4 },
  quickBtnLabel: { fontSize: 12, fontWeight: '600', color: '#2c3e50' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#27ae60' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  filterBtn: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  filterActive: { backgroundColor: '#27ae60', borderColor: '#27ae60' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#7f8c8d' },
  filterTextActive: { color: '#fff' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 40, margin: 16, marginTop: 0, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#95a5a6', fontSize: 14, textAlign: 'center' },
  habitCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  habitIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  habitEmoji: { fontSize: 20 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  habitMeta: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  habitDesc: { fontSize: 12, color: '#95a5a6', marginTop: 4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  streakFire: { fontSize: 12, marginRight: 2 },
  streakText: { fontSize: 11, fontWeight: '600', color: '#e67e22' },
  habitActions: { alignItems: 'center', gap: 8 },
  completeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  completedBtn: { backgroundColor: '#e8f5e9' },
  completeBtnText: { fontSize: 18 },
  deleteIcon: { fontSize: 14, marginTop: 4, opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '92%', maxWidth: 450, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 4 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, color: '#7f8c8d', fontWeight: '500' },
  catLabelActive: { color: '#fff' },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  freqActive: { backgroundColor: '#27ae60' },
  freqText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  freqTextActive: { color: '#fff' },
  soundBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  soundActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#27ae60' },
  soundName: { fontSize: 12, fontWeight: '500', color: '#2c3e50' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  modalButtons: { flexDirection: 'row', gap: 8, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#e74c3c', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#27ae60', padding: 14, borderRadius: 8, alignItems: 'center' },
  closeBtn: { backgroundColor: '#95a5a6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  aiCard: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#27ae60' },
  aiTitle: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  aiMeta: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  aiVerse: { fontSize: 12, color: '#9b59b6', marginTop: 4, fontStyle: 'italic' },
});

export default HabitTracker;
