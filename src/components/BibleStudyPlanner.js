/**
 * Bible Study Planner Component
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
} from 'react-native';
import {TaskStore} from '../store/taskStore';
import {groqService} from '../services/groqService';

const BibleStudyPlanner = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudy, setNewStudy] = useState({topic: '', reference: ''});

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const data = await TaskStore.getBibleStudy();
      setStudies(data);
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudy = async () => {
    if (!newStudy.topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    try {
      const study = await TaskStore.addBibleStudy(newStudy);
      setStudies(prev => [study, ...prev]);
      setNewStudy({topic: '', reference: ''});
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding study:', error);
      Alert.alert('Error', 'Failed to add study');
    }
  };

  const handleDeleteStudy = id => {
    Alert.alert('Delete Study', 'Are you sure you want to delete this study?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await TaskStore.deleteBibleStudy(id);
            setStudies(prev => prev.filter(s => s.id !== id));
          } catch (error) {
            console.error('Error deleting study:', error);
            Alert.alert('Error', 'Failed to delete study');
          }
        },
      },
    ]);
  };

  const handleGenerateStudy = async () => {
    try {
      const data = await groqService.generateBibleStudyTopic();
      const study = {
        topic: data.topic,
        reference: data.reference,
        duration: data.duration,
        questions: data.questions?.join('\n') || '',
        id: Date.now().toString(),
      };
      await TaskStore.addBibleStudy(study);
      setStudies(prev => [study, ...prev]);
    } catch (error) {
      console.error('Error generating study:', error);
      Alert.alert('Error', 'Failed to generate study topic');
    }
  };

  const renderStudyItem = ({item}) => (
    <View style={styles.studyItem}>
      <View style={styles.studyHeader}>
        <Text style={styles.studyTopic}>{item.topic}</Text>
        {item.reference && (
          <Text style={styles.studyReference}>— {item.reference}</Text>
        )}
      </View>
      {item.duration && (
        <Text style={styles.studyDuration}>⏱ {item.duration}</Text>
      )}
      {item.questions && (
        <Text style={styles.studyQuestions}>{item.questions}</Text>
      )}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteStudy(item.id)}>
        <Text style={styles.deleteButtonText}>🗑 Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading studies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {Platform.OS === 'ios' ? '📜' : ''} Bible Study Planner
        </Text>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateStudy}>
          <Text style={styles.generateButtonText}>✨ AI Generate</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>➕ Add Study</Text>
      </TouchableOpacity>
      {studies.length === 0 ? (
        <Text style={styles.emptyText}>No studies yet. Add or generate one!</Text>
      ) : (
        <FlatList
          data={studies}
          keyExtractor={item => item.id}
          renderItem={renderStudyItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Bible Study</Text>
            <TextInput
              style={styles.input}
              placeholder="Topic"
              value={newStudy.topic}
              onChangeText={text => setNewStudy({...newStudy, topic: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Bible Reference"
              value={newStudy.reference}
              onChangeText={text => setNewStudy({...newStudy, reference: text})}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddStudy}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  generateButton: {
    padding: 6,
  },
  generateButtonText: {
    color: '#9b59b6',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingBottom: 16,
  },
  studyItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  studyHeader: {
    marginBottom: 4,
  },
  studyTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  studyReference: {
    fontSize: 12,
    color: '#9b59b6',
    marginTop: 2,
  },
  studyDuration: {
    fontSize: 12,
    color: '#e67e22',
    marginTop: 4,
  },
  studyQuestions: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    lineHeight: 18,
  },
  deleteButton: {
    marginTop: 8,
    padding: 4,
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 20,
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
    width: '80%',
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
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BibleStudyPlanner;
