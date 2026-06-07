/**
 * Main App Component
 */
import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import TaskManager from './components/TaskManager';
import VerseDisplay from './components/VerseDisplay';
import PrayerBalance from './components/PrayerBalance';
import BibleStudyPlanner from './components/BibleStudyPlanner';
import TaskBalance from './components/TaskBalance';

const App = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskManager />;
      case 'verse':
        return <VerseDisplay />;
      case 'prayer':
        return <PrayerBalance />;
      case 'study':
        return <BibleStudyPlanner />;
      case 'balance':
        return <TaskBalance />;
      default:
        return <TaskManager />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {Platform.OS === 'ios' ? '✝️' : ''} Believers Task Flow
        </Text>
        <Text style={styles.headerSubtitle}>
          Growing in faith, one task at a time
        </Text>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
      <View style={styles.bottomNav}>
        <NavButton
          active={activeTab === 'tasks'}
          onPress={() => setActiveTab('tasks')}
          icon="✅"
          label="Tasks" />
        <NavButton
          active={activeTab === 'verse'}
          onPress={() => setActiveTab('verse')}
          icon="📖"
          label="Verse" />
        <NavButton
          active={activeTab === 'prayer'}
          onPress={() => setActiveTab('prayer')}
          icon="🙏"
          label="Prayer" />
        <NavButton
          active={activeTab === 'study'}
          onPress={() => setActiveTab('study')}
          icon="📜"
          label="Study" />
        <NavButton
          active={activeTab === 'balance'}
          onPress={() => setActiveTab('balance')}
          icon="⚖️"
          label="Balance" />
      </View>
    </SafeAreaView>
  );
};

const NavButton = ({active, onPress, icon, label}) => (
  <TouchableOpacity
    style={[styles.navButton, active && styles.navButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 10 : 4,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: '#f0f4f8',
    borderTopWidth: 3,
    borderTopColor: '#3498db',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.7,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  navLabelActive: {
    color: '#3498db',
    fontWeight: '600',
  },
});

export default App;
