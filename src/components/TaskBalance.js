/**
 * Christian Task Balance Component
 */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {TaskStore} from '../store/taskStore';

const TaskBalance = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const tasks = await TaskStore.getTasks();
      const completed = tasks.filter(t => t.completed).length;
      const total = tasks.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      setBalance(percentage);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCompleted = async () => {
    Alert.alert(
      'Clear Completed',
      'Are you sure you want to clear all completed tasks?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskStore.clearCompleted();
              loadBalance();
            } catch (error) {
              console.error('Error clearing completed:', error);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {Platform.OS === 'ios' ? '⚖️' : ''} Christian Task Balance
      </Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressOuter}>
          <View
            style={[
              styles.progressInner,
              {width: `${balance}%`},
              balance > 70 && styles.progressHigh,
            ]}
          />
        </View>
        <Text style={styles.balanceText}>{balance}% Completed</Text>
      </View>
      {balance > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCompleted}>
          <Text style={styles.clearButtonText}>🗑 Clear Completed Tasks</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.hint}>
        {balance < 30
          ? 'Keep going! Every task brings you closer to your goals.'
          : balance < 70
          ? 'You\'re making great progress! Keep it up.'
          : 'Excellent! You\'re completing tasks consistently.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e8f6f3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1abc9c',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressOuter: {
    backgroundColor: '#dfe6e9',
    borderRadius: 10,
    height: 20,
    overflow: 'hidden',
  },
  progressInner: {
    backgroundColor: '#1abc9c',
    borderRadius: 10,
    height: '100%',
    transition: 'width 0.3s ease',
  },
  progressHigh: {
    backgroundColor: '#27ae60',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1abc9c',
    marginTop: 8,
    textAlign: 'center',
  },
  clearButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 18,
  },
});

export default TaskBalance;
