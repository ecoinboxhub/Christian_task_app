# Software Requirements (SWR): Believers Task Flow

## Functional Requirements

### FR1: Task Management
- FR1.1: User shall be able to create tasks with title, category, priority
- FR1.2: User shall be able to mark tasks as complete/incomplete
- FR1.3: User shall be able to delete and edit tasks
- FR1.4: System shall support task filtering (All, Active, Completed, Scheduled)
- FR1.5: System shall support category-based filtering

### FR2: Task Scheduling
- FR2.1: User shall be able to assign a date and digital time (24h format) to tasks
- FR2.2: System shall support daily, weekly, and monthly recurrence patterns
- FR2.3: Weekly recurrence shall allow selecting specific days of the week
- FR2.4: Monthly recurrence shall support specific day or last day of month
- FR2.5: System shall calculate and display next occurrence for each schedule

### FR3: Alarm & Notifications
- FR3.1: System shall provide minimum 10 distinct alarm sounds
- FR3.2: User shall be able to select alarm sound per task
- FR3.3: System shall fire notifications at scheduled task times
- FR3.4: User shall be able to set pre-reminder (minutes before task)
- FR3.5: System shall support recurring alarms for recurring tasks
- FR3.6: User shall be able to snooze notifications for configurable duration
- FR3.7: System shall log all fired notifications with timestamps

### FR4: AI Suggestions
- FR4.1: System shall provide AI-powered task recommendations
- FR4.2: System shall suggest spiritual activities with category and duration
- FR4.3: System shall generate Bible reading plans with passages and reflections
- FR4.4: System shall suggest daily prayer schedules with themes and scriptures
- FR4.5: System shall generate devotion plans with scripture and action steps
- FR4.6: System shall suggest faith-building activities with materials needed
- FR4.7: System shall generate habit suggestions with suggested times and verses
- FR4.8: All AI features shall have offline fallback defaults

### FR5: Habit Tracking
- FR5.1: User shall create habits with category, frequency, and reminder time
- FR5.2: System shall track consecutive day streaks for habits
- FR5.3: User shall mark habits as completed daily
- FR5.4: System shall filter habits by status (All, Today, Done, Streak)
- FR5.5: System shall provide AI habit suggestions
- FR5.6: Each habit shall have a configurable alarm sound

### FR6: Smart Reminders
- FR6.1: System shall display all incomplete tasks for re-engagement
- FR6.2: User shall send scripture-based reminders for individual tasks
- FR6.3: User shall send daily encouragement messages
- FR6.4: User shall re-engage all incomplete tasks in bulk
- FR6.5: System shall display notification history

### FR7: Prayer Balance
- FR7.1: User shall track prayer count with add/deduct
- FR7.2: System shall persist prayer balance across sessions

### FR8: Bible Study Planner
- FR8.1: User shall create study entries with topic and reference
- FR8.2: System shall provide AI-generated study topics with questions

### FR9: Task Balance
- FR9.1: System shall display task completion percentage
- FR9.2: System shall show motivational messages based on progress
- FR9.3: System shall display faith milestones

## Non-Functional Requirements

### NFR1: Performance
- NFR1.1: App shall load initial data within 2 seconds
- NFR1.2: All local operations shall complete within 500ms

### NFR2: Storage
- NFR2.1: All user data shall persist locally using AsyncStorage/LocalStorage
- NFR2.2: System shall handle minimum 1000 tasks without performance degradation

### NFR3: Availability
- NFR3.1: Core features shall work fully offline
- NFR3.2: AI features shall provide fallback defaults when offline

### NFR4: Cross-Platform
- NFR4.1: System shall work on Android (React Native)
- NFR4.2: System shall work on iOS (React Native)
- NFR4.3: System shall work on modern web browsers (Web App)

### NFR5: Usability
- NFR5.1: UI shall use a Christian-themed design with emojis and colors
- NFR5.2: Navigation shall use bottom tab bar with 8 tabs maximum
- NFR5.3: All user-facing text shall use encouraging, faith-based language

### NFR6: Security
- NFR6.1: API keys shall be stored in environment variables
- NFR6.2: No user data shall be transmitted without explicit consent

## Platform Support
| Platform | Support | Status |
|----------|---------|--------|
| Android (React Native) | ✅ Full | Complete |
| Web (SPA) | ✅ Full | Complete |
| iOS (React Native) | ⚠️ Partial | Configured, untested |
| PWA | ✅ Web App | Complete |

## Dependencies
- React Native 0.73.2
- Capacitor 8.4.0
- GROQ SDK (llama3-70b-8192)
- AsyncStorage
- Express.js (backend)
- Web Audio API
- Web Notification API
