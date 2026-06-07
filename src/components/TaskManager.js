/**
 * Task Manager Component
 */
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
} from 'react-native';
import TaskItem from './TaskItem';
import {TaskStore} from '../store/taskStore';
import {groqService} from '../services/groqService';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [newTask, setNewTask] = useState({title: '', category: '', priority: 'medium'});
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await TaskStore.getTasks();
      setTasks(data);
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
      const task = await TaskStore.addTask(newTask);
      setTasks(prev => [task, ...prev]);
      setNewTask({title: '', category: '', priority: 'medium'});
      setShowAddModal(false);
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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    return {total, completed, active};
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {Platform.OS === 'ios' ? '✅' : ''} Believers Task Flow
        </Text>
        <Text style={styles.subtitle}>
          {stats.active} active, {stats.completed} completed
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'active', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f)}>
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>
          {Platform.OS === 'ios' ? '➕' : ''} Add Task
        </Text>
      </TouchableOpacity>

      {/* AI Recommendations */}
      <TouchableOpacity
        style={styles.recommendationsButton}
        onPress={handleLoadRecommendations}>
        <Text style={styles.recommendationsButtonText}>
          {Platform.OS === 'ios' ? '✨' : ''} AI Get Recommendations
        </Text>
      </TouchableOpacity>

      {/* Task List */}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'completed' ? 'No completed tasks yet.' : 'No tasks yet. Add one to get started!'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  style={[
                    styles.priorityButton,
                    newTask.priority === p && styles.priorityButtonActive,
                  ]}
                  onPress={() => setNewTask({...newTask, priority: p})}>
                  <Text
                    style={[
                      styles.priorityButtonText,
                      newTask.priority === p && styles.priorityButtonTextActive,
                    ]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddTask}>
                <Text style={styles.modalButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recommendations Modal */}
      <Modal visible={showRecommendations} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <Text style={styles.modalTitle}>AI Recommendations</Text>
            {recommendations.length === 0 ? (
              <Text style={styles.emptyText}>No recommendations available.</Text>
            ) : (
              <FlatList
                data={recommendations}
                keyExtractor={item => item.title}
                renderItem={({item}) => (
                  <View style={styles.recommendationItem}>
                    <View>
                      <Text style={styles.recommendationTitle}>
                        {item.title}
                      </Text>
                      {item.category && (
                        <Text style={styles.recommendationCategory}>
                          {item.category}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.addRecommendationButton}
                      onPress={() => addRecommendationTask(item)}>
                      <Text style={styles.addRecommendationText}>
                        {Platform.OS === 'ios' ? '➕' : ''} Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#27ae60',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationsButton: {
    backgroundColor: '#9b59b6',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  recommendationsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  priorityButtonActive: {
    backgroundColor: '#e67e22',
    borderColor: '#e67e22',
  },
  priorityButtonText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  closeButton: {
    backgroundColor: '#95a5a6',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  recommendationCategory: {
    fontSize: 12,
    color: '#95a5a6',
  },
  addRecommendationButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addRecommendationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TaskManager;
