/**
 * Task Item Component
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const TaskItem = ({task, onToggle, onDelete}) => {
  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getPriorityLabel = priority => {
    return priority?.charAt(0).toUpperCase() + (priority?.slice(1) || '');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => onToggle(task.id)}
        activeOpacity={0.7}>
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              task.completed && styles.checkboxChecked,
            ]}>
            {task.completed && (
              <Icon name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              task.completed && styles.titleCompleted,
            ]}>
            {task.title}
          </Text>
          {task.category && (
            <Text style={styles.category}>
              {Platform.OS === 'ios' ? '📂' : ''} {task.category}
            </Text>
          )}
          {task.priority && (
            <View style={styles.priorityContainer}>
              <View
                style={[
                  styles.priorityBadge,
                  {backgroundColor: getPriorityColor(task.priority)},
                ]}>
                <Text style={styles.priorityText}>
                  {getPriorityLabel(task.priority)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(task.id)}
        activeOpacity={0.7}>
        <Icon name="trash" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  category: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  priorityContainer: {
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
  },
});

export default TaskItem;
