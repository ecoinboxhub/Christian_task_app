/**
 * Prayer Balance Component
 */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {TaskStore} from '../store/taskStore';

const PrayerBalance = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const currentBalance = await TaskStore.getPrayerBalance();
      setBalance(currentBalance);
    } catch (error) {
      console.error('Error loading prayer balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrayer = () => {
    Alert.alert(
      'Add Prayer',
      'Enter the number of prayers to add:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add 1',
          onPress: () => updateBalance(1),
        },
        {
          text: 'Add 5',
          onPress: () => updateBalance(5),
        },
        {
          text: 'Add 10',
          onPress: () => updateBalance(10),
        },
      ],
      {cancelable: false}
    );
  };

  const handleDeductPrayer = () => {
    if (balance <= 0) {
      Alert.alert('No Balance', 'You have no prayer balance left.');
      return;
    }

    Alert.alert(
      'Deduct Prayer',
      'Enter the number of prayers to deduct:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deduct 1',
          onPress: () => updateBalance(-1),
        },
        {
          text: 'Deduct 5',
          onPress: () => updateBalance(-5),
        },
        {
          text: 'Deduct 10',
          onPress: () => updateBalance(-10),
        },
      ],
      {cancelable: false}
    );
  };

  const updateBalance = async amount => {
    try {
      if (amount > 0) {
        const newBalance = await TaskStore.addPrayer(amount);
        setBalance(newBalance);
      } else {
        const newBalance = await TaskStore.deductPrayer(Math.abs(amount));
        setBalance(newBalance);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
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
        {Platform.OS === 'ios' ? '🙏' : ''} Prayer Balance
      </Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.balance}>{balance}</Text>
        <Text style={styles.balanceLabel}>prayers</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddPrayer}>
          <Text style={styles.actionButtonText}>➕ Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deductButton]}
          onPress={handleDeductPrayer}>
          <Text style={styles.actionButtonText}>➖ Deduct</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e67e22',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#95a5a6',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deductButton: {
    backgroundColor: '#d35400',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PrayerBalance;
