import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import TaskManager from './components/TaskManager';
import VerseDisplay from './components/VerseDisplay';
import PrayerBalance from './components/PrayerBalance';
import BibleStudyPlanner from './components/BibleStudyPlanner';
import TaskBalance from './components/TaskBalance';
import TaskScheduler from './components/TaskScheduler';
import SmartReminder from './components/SmartReminder';
import HabitTracker from './components/HabitTracker';
import {NotificationService} from './services/notificationService';

const TABS = [
  {key: 'tasks', icon: '✅', label: 'Tasks'},
  {key: 'scheduler', icon: '📅', label: 'Schedule'},
  {key: 'habits', icon: '🎯', label: 'Habits'},
  {key: 'verse', icon: '📖', label: 'Verse'},
  {key: 'prayer', icon: '🙏', label: 'Prayer'},
  {key: 'study', icon: '📜', label: 'Study'},
  {key: 'reminders', icon: '💡', label: 'Remind'},
  {key: 'balance', icon: '⚖️', label: 'Balance'},
];

const App = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    NotificationService.initialize();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskManager />;
      case 'scheduler':
        return <TaskScheduler />;
      case 'habits':
        return <HabitTracker />;
      case 'verse':
        return <VerseDisplay />;
      case 'prayer':
        return <PrayerBalance />;
      case 'study':
        return <BibleStudyPlanner />;
      case 'reminders':
        return <SmartReminder />;
      case 'balance':
        return <TaskBalance />;
      default:
        return <TaskManager />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      <View style={styles.content}>
        {renderContent()}
      </View>
      <View style={styles.bottomNav}>
        {TABS.map(tab => (
          <NavButton
            key={tab.key}
            active={activeTab === tab.key}
            onPress={() => setActiveTab(tab.key)}
            icon={tab.icon}
            label={tab.label} />
        ))}
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
    paddingVertical: 8,
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: '#f0f4f8',
    borderTopWidth: 3,
    borderTopColor: '#3498db',
  },
  navIcon: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.7,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 8,
    color: '#7f8c8d',
  },
  navLabelActive: {
    color: '#3498db',
    fontWeight: '600',
  },
});

export default App;
