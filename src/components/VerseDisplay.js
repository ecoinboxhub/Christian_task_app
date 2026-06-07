/**
 * Verse Display Component
 */
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {groqService} from '../services/groqService';

const VerseDisplay = () => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerse();
  }, []);

  const loadVerse = async () => {
    try {
      setLoading(true);
      const data = await groqService.generateDailyVerse();
      setVerse(data);
    } catch (error) {
      console.error('Error loading verse:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  }

  if (!verse) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {Platform.OS === 'ios' ? '📖' : ''} Daily Verse
      </Text>
      <Text style={styles.verse}>"{verse.verse}"</Text>
      <Text style={styles.reference}>— {verse.reference}</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={loadVerse}>
        <Text style={styles.refreshText}>🔄 Get Another Verse</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  verse: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 24,
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    textAlign: 'right',
  },
  refreshButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VerseDisplay;
