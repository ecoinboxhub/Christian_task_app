import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import TaskItem from './TaskItem';
import {TaskStore} from '../store/taskStore';
import {groqService} from '../services/groqService';
import {NotificationService} from '../services/notificationService';
import {SchedulerService} from '../services/schedulerService';
import {ALARM_SOUNDS} from '../services/audioService';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newTask, setNewTask] = useState({title: '', category: '', priority: 'medium'});
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '08:00',
    recurrence: 'none',
    recurrenceDays: [],
    hasAlarm: false,
    alarmSoundId: 'gentle_chime',
    snoozeEnabled: true,
    reminderMinutes: 5,
  });

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await TaskStore.getTasks();
      setTasks(data);
      const cats = await TaskStore.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const taskData = {
        ...newTask,
        ...scheduleForm,
      };
      const task = await TaskStore.addTask(taskData);

      if (scheduleForm.hasAlarm && scheduleForm.scheduledTime) {
        const [h, m] = scheduleForm.scheduledTime.split(':').map(Number);
        const alarmTime = new Date(scheduleForm.scheduledDate);
        alarmTime.setHours(h, m, 0, 0);

        if (scheduleForm.reminderMinutes > 0) {
          const reminderTime = new Date(alarmTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - scheduleForm.reminderMinutes);
          await NotificationService.scheduleNotification({
            taskId: task.id,
            title: `⏰ Reminder: ${task.title}`,
            body: `Starts in ${scheduleForm.reminderMinutes} min`,
            scheduledTime: reminderTime,
            soundId: 'gentle_nudge',
          });
        }

        await NotificationService.scheduleNotification({
          taskId: task.id,
          title: `🔔 ${task.title}`,
          body: `Time to work on: ${task.title}`,
          scheduledTime: alarmTime,
          soundId: scheduleForm.alarmSoundId,
          recurrence: scheduleForm.recurrence !== 'none' ? scheduleForm.recurrence : null,
          snoozeable: scheduleForm.snoozeEnabled,
        });
      }

      if (scheduleForm.recurrence && scheduleForm.recurrence !== 'none') {
        await SchedulerService.saveSchedule({
          taskId: task.id,
          title: task.title,
          category: task.category,
          startDate: scheduleForm.scheduledDate,
          time: scheduleForm.scheduledTime,
          recurrence: scheduleForm.recurrence,
          recurrenceDays: scheduleForm.recurrenceDays,
          hasAlarm: scheduleForm.hasAlarm,
          soundId: scheduleForm.alarmSoundId,
        });
      }

      setTasks(prev => [task, ...prev]);
      setNewTask({title: '', category: '', priority: 'medium'});
      setScheduleForm({
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '08:00',
        recurrence: 'none',
        recurrenceDays: [],
        hasAlarm: false,
        alarmSoundId: 'gentle_chime',
        snoozeEnabled: true,
        reminderMinutes: 5,
      });
      setShowAddModal(false);
      setShowScheduleModal(false);
      Alert.alert('✅ Success', 'Task added' + (scheduleForm.hasAlarm ? ' with alarm!' : '!'));
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      const task = await TaskStore.updateTask(id, updates);
      setTasks(prev =>
        prev.map(t => (t.id === id ? task : t)),
      );
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTask = async id => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await TaskStore.deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
          } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const handleToggleComplete = async id => {
    try {
      const task = await TaskStore.toggleComplete(id);
      setTasks(prev =>
        prev.map(t => (t.id === id ? task : t)),
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleLoadRecommendations = async () => {
    try {
      const recs = await groqService.generateTaskRecommendations(tasks);
      setRecommendations(recs);
      setShowRecommendations(true);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const addRecommendationTask = async (rec) => {
    try {
      const task = await TaskStore.addTask(rec);
      setTasks(prev => [task, ...prev]);
      setShowRecommendations(false);
    } catch (error) {
      console.error('Error adding recommendation:', error);
    }
  };

  const toggleDay = (dayIndex) => {
    setScheduleForm(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(dayIndex)
        ? prev.recurrenceDays.filter(d => d !== dayIndex)
        : [...prev.recurrenceDays, dayIndex],
    }));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    if (filter === 'scheduled') return task.scheduledDate && !task.completed;
    if (filter === 'recurring') return task.recurrence && task.recurrence !== 'none';
    if (filter === 'category' && selectedCategory) return task.category === selectedCategory && !task.completed;
    return true;
  });

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const scheduled = tasks.filter(t => t.scheduledDate && !t.completed).length;
    const recurring = tasks.filter(t => t.recurrence && t.recurrence !== 'none').length;
    return {total, completed, active, scheduled, recurring};
  };

  const stats = getStats();

  const getDueTodayCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t =>
      !t.completed && t.scheduledDate && t.scheduledDate.split('T')[0] === today
    ).length;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✝️ Believers Task Flow</Text>
        <Text style={styles.subtitle}>
          {stats.active} active · {stats.completed} completed
          {getDueTodayCount() > 0 ? ` · ${getDueTodayCount()} due today` : ''}
        </Text>
      </View>

      <View style={styles.filterContainer}>
        {['all', 'active', 'completed', 'scheduled'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => { setFilter(f); setSelectedCategory(''); }}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>➕ Add Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.recommendationsButton} onPress={handleLoadRecommendations}>
          <Text style={styles.recommendationsButtonText}>✨ AI</Text>
        </TouchableOpacity>
      </View>

      {filter === 'category' && (
        <ScrollView horizontal style={styles.categoryScroll} showsHorizontalScrollIndicator={false}>
          {categories.map(cat => (
            <TouchableOpacity key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.categoryChip} onPress={() => { setFilter('all'); setSelectedCategory(''); }}>
            <Text style={styles.categoryChipText}>Clear</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {!filter.startsWith('category') && (
        <ScrollView horizontal style={styles.categoryScroll} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.categoryChip} onPress={() => setFilter('all')}>
            <Text style={styles.categoryChipText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryChip} onPress={() => setFilter('recurring')}>
            <Text style={styles.categoryChipText}>🔄 Recurring ({stats.recurring})</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity key={cat} style={styles.categoryChip}
              onPress={() => { setFilter('category'); setSelectedCategory(cat); }}>
              <Text style={styles.categoryChipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TaskItem
            task={item}
            onToggle={handleToggleComplete}
            onDelete={handleDeleteTask}
          />
        )}
        ListHeaderComponent={
          getDueTodayCount() > 0 ? (
            <View style={styles.dueTodayBanner}>
              <Text style={styles.dueTodayText}>
                ⏰ {getDueTodayCount()} task{getDueTodayCount() > 1 ? 's' : ''} due today
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'completed' ? 'No completed tasks yet.' :
               filter === 'scheduled' ? 'No scheduled tasks.' :
               filter === 'recurring' ? 'No recurring tasks.' :
               'No tasks yet. Add one to get started!'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task title"
              value={newTask.title}
              onChangeText={text => setNewTask({...newTask, title: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (e.g., spiritual, service, study)"
              value={newTask.category}
              onChangeText={text => setNewTask({...newTask, category: text})}
            />
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityButton, newTask.priority === p && styles.priorityButtonActive]}
                  onPress={() => setNewTask({...newTask, priority: p})}>
                  <Text style={[styles.priorityButtonText, newTask.priority === p && styles.priorityButtonTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.scheduleToggleBtn} onPress={() => setShowScheduleModal(true)}>
              <Text style={styles.scheduleToggleText}>
                {scheduleForm.hasAlarm ? '🔔 Scheduled with alarm' : '📅 Add schedule & alarm'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddTask}>
                <Text style={styles.modalButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showScheduleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, {maxHeight: '85%'}]}>
            <Text style={styles.modalTitle}>⏰ Schedule & Alarm</Text>

            <Text style={styles.inputLabel}>Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={scheduleForm.scheduledDate}
              onChangeText={t => setScheduleForm({...scheduleForm, scheduledDate: t})} />

            <Text style={styles.inputLabel}>Time (Digital, 24h)</Text>
            <TextInput style={styles.input} placeholder="HH:MM" value={scheduleForm.scheduledTime}
              onChangeText={t => setScheduleForm({...scheduleForm, scheduledTime: t})} />

            <Text style={styles.inputLabel}>Recurrence</Text>
            <View style={styles.recurrenceRow}>
              {['none', 'daily', 'weekly', 'monthly'].map(r => (
                <TouchableOpacity key={r}
                  style={[styles.recurrenceBtn, scheduleForm.recurrence === r && styles.recurrenceActive]}
                  onPress={() => setScheduleForm({...scheduleForm, recurrence: r})}>
                  <Text style={[styles.recurrenceText, scheduleForm.recurrence === r && styles.recurrenceTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {scheduleForm.recurrence === 'weekly' && (
              <View>
                <Text style={styles.inputLabel}>Days of Week</Text>
                <View style={styles.daysRow}>
                  {DAY_NAMES.map((day, i) => (
                    <TouchableOpacity key={i}
                      style={[styles.dayBtn, scheduleForm.recurrenceDays.includes(i) && styles.dayActive]}
                      onPress={() => toggleDay(i)}>
                      <Text style={[styles.dayText, scheduleForm.recurrenceDays.includes(i) && styles.dayTextActive]}>
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🔔 Enable Alarm</Text>
              <Switch value={scheduleForm.hasAlarm}
                onValueChange={v => setScheduleForm({...scheduleForm, hasAlarm: v})} />
            </View>

            {scheduleForm.hasAlarm && (
              <View>
                <Text style={styles.inputLabel}>Alarm Sound</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {ALARM_SOUNDS.map(sound => (
                    <TouchableOpacity key={sound.id}
                      style={[styles.soundBtn, scheduleForm.alarmSoundId === sound.id && styles.soundActive]}
                      onPress={() => setScheduleForm({...scheduleForm, alarmSoundId: sound.id})}>
                      <Text style={styles.soundName}>{sound.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Reminder (minutes before)</Text>
                <TextInput style={styles.input} placeholder="5" keyboardType="numeric"
                  value={scheduleForm.reminderMinutes.toString()}
                  onChangeText={t => setScheduleForm({...scheduleForm, reminderMinutes: parseInt(t) || 0})} />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Snooze Allowed</Text>
                  <Switch value={scheduleForm.snoozeEnabled}
                    onValueChange={v => setScheduleForm({...scheduleForm, snoozeEnabled: v})} />
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowScheduleModal(false)}>
                <Text style={styles.modalButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={() => setShowScheduleModal(false)}>
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showRecommendations} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <Text style={styles.modalTitle}>✨ AI Recommendations</Text>
            {recommendations.length === 0 ? (
              <Text style={styles.emptyText}>No recommendations available.</Text>
            ) : (
              <FlatList
                data={recommendations}
                keyExtractor={(item, i) => i.toString()}
                renderItem={({item}) => (
                  <View style={styles.recommendationItem}>
                    <View style={styles.recInfo}>
                      <Text style={styles.recommendationTitle}>{item.title}</Text>
                      {item.category && <Text style={styles.recommendationCategory}>{item.category}</Text>}
                      {item.priority && <Text style={styles.recPriority}>🎯 {item.priority}</Text>}
                    </View>
                    <TouchableOpacity style={styles.addRecommendationButton}
                      onPress={() => addRecommendationTask(item)}>
                      <Text style={styles.addRecommendationText}>➕ Add</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            <TouchableOpacity style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowRecommendations(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#95a5a6', fontSize: 16 },
  header: { backgroundColor: '#3498db', padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  filterContainer: { flexDirection: 'row', padding: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginHorizontal: 2 },
  filterTabActive: { backgroundColor: '#3498db' },
  filterText: { color: '#7f8c8d', fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  actionsRow: { flexDirection: 'row', padding: 12, paddingBottom: 0, gap: 8 },
  addButton: { flex: 1, backgroundColor: '#27ae60', paddingVertical: 12, borderRadius: 10, alignItems: 'center', elevation: 2 },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  recommendationsButton: { backgroundColor: '#9b59b6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, elevation: 2 },
  recommendationsButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  categoryScroll: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  categoryChip: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  categoryChipActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  categoryChipText: { fontSize: 12, color: '#7f8c8d' },
  categoryChipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  dueTodayBanner: { backgroundColor: '#fff3e0', padding: 10, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#e67e22' },
  dueTodayText: { color: '#e67e22', fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#95a5a6', fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  priorityContainer: { flexDirection: 'row', marginBottom: 12 },
  priorityButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bdc3c7', alignItems: 'center', marginHorizontal: 2 },
  priorityButtonActive: { backgroundColor: '#e67e22', borderColor: '#e67e22' },
  priorityButtonText: { color: '#7f8c8d', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  priorityButtonTextActive: { color: '#fff' },
  scheduleToggleBtn: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  scheduleToggleText: { color: '#3498db', fontWeight: '600', fontSize: 14 },
  recurrenceRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  recurrenceBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  recurrenceActive: { backgroundColor: '#9b59b6' },
  recurrenceText: { fontSize: 12, fontWeight: '600', color: '#7f8c8d' },
  recurrenceTextActive: { color: '#fff' },
  daysRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  dayBtn: { flex: 1, padding: 8, borderRadius: 6, backgroundColor: '#f0f0f0', alignItems: 'center' },
  dayActive: { backgroundColor: '#3498db' },
  dayText: { fontSize: 10, fontWeight: '600', color: '#7f8c8d' },
  dayTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  soundBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  soundActive: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#27ae60' },
  soundName: { fontSize: 12, fontWeight: '500', color: '#2c3e50' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, flex: 1, marginHorizontal: 4, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e74c3c' },
  saveButton: { backgroundColor: '#27ae60' },
  closeButton: { backgroundColor: '#95a5a6', marginTop: 8 },
  modalButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  recommendationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  recInfo: { flex: 1 },
  recommendationTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  recommendationCategory: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  recPriority: { fontSize: 11, color: '#e67e22', marginTop: 2 },
  addRecommendationButton: { backgroundColor: '#9b59b6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addRecommendationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default TaskManager;
