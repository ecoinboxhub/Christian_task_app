# Product Requirements Document: Believers Task Flow

## Product Overview
A Christian faith-based task management mobile and web application that helps believers organize their spiritual journey through task scheduling, AI-powered suggestions, habit tracking, and smart reminders.

## Target Users
- Christians seeking structured spiritual growth
- Individuals wanting to build daily prayer, study, and worship habits
- Church members tracking service and fellowship commitments
- Anyone desiring faith-based productivity tools

## Core Features

### 1. Task Management (✅ Complete)
- Create, read, update, delete tasks
- Categorization (Prayer, Study, Worship, Service, Fellowship, Personal)
- Priority levels (Low, Medium, High)
- Filter by status (All, Active, Completed, Scheduled)
- Category-based filtering
- Due today banner

### 2. Task Scheduler (✅ Complete)
- Create tasks with specific dates and digital times
- Recurrence patterns: Daily, Weekly, Monthly
- Weekly day selection for recurring tasks
- Custom recurrence intervals
- Visual schedule overview with statistics
- Next occurrence calculation

### 3. Alarm & Notification System (✅ Complete)
- 10 distinct alarm sounds: Gentle Chime, Morning Bell, Soft Harp, Worship Tune, Prayer Call, Digital Alarm, Faith Alert, Gentle Nudge, Hallelujah, Silent
- Cross-platform audio playback via Web Audio API
- Pre-reminder notification before scheduled time
- Snooze functionality (5/10/15/30 min)
- Recurring notification scheduling
- Web Notification API integration
- Notification history log
- Vibration support

### 4. AI-Powered Suggestions (✅ Complete)
- AI task recommendations based on current tasks
- Spiritual activity suggestions
- Bible reading plans (7-day customizable)
- Prayer schedule suggestions
- Daily devotion plans
- Faith-building activity ideas
- Habit suggestions with scripture verses
- All with fallback defaults when offline

### 5. Habit Tracker (✅ Complete)
- Create spiritual habits with categories
- Daily/weekly/monthly habit recurrence
- Streak tracking (consecutive days)
- Completion history
- Category-based icons and colors
- Habit filtering (All, Today, Done, Streak)
- AI habit suggestions
- Daily reminder notifications per habit

### 6. Smart Reminder System (✅ Complete)
- Re-engagement reminders for incomplete tasks
- Scripture-based reminder messages
- Daily encouragement notifications
- One-click scripture sharing
- One-click encouragement sending
- Bulk re-engage for all incomplete tasks
- Configurable reminder settings
- Snooze duration configuration
- Default reminder time and sound settings

### 7. Prayer Balance Tracker (✅ Complete)
- Track prayer commitments numerically
- Add/deduct prayer amounts
- Prayer schedule suggestions
- Visual balance display

### 8. Bible Study Planner (✅ Complete)
- Manual study topic entry
- AI-generated study topics with questions
- Duration tracking
- Reference linking
- Study list management

### 9. Christian Task Balance (✅ Complete)
- Visual progress percentage
- Faith milestone tracking
- Motivational messages based on progress
- Task completion statistics

## Technical Architecture

### Frontend (React Native)
- React Native 0.73.2
- AsyncStorage for local persistence
- Capacitor 8.4.0 for native features
- Bottom tab navigation (8 tabs)
- Cross-platform (Android + iOS)

### Web App
- Vanilla JavaScript SPA
- Web Audio API for alarm sounds
- Web Notification API for push
- LocalStorage for persistence
- PWA manifest for installability
- Responsive mobile-first design

### Backend (Node.js)
- Express server
- Web push notification support
- RESTful API endpoints
- Static web app serving
- CORS enabled

### AI Integration
- GROQ SDK (llama3-70b-8192)
- 8 specialized prompt templates
- Graceful fallback defaults

## Data Storage
- Local-first architecture
- AsyncStorage (React Native) / LocalStorage (Web)
- Keys: tasks, schedules, habits, prayer balance, studies, categories, settings, notification log

## Deployment
- Web: GitHub Pages (auto-deploy on main branch push)
- APK: GitHub Actions (manual trigger or tag push)
- Backend: Render/Railway (optional, for push notifications)

## Future Enhancements
- Cloud sync across devices
- Social features (prayer groups, accountability partners)
- Church integration (events, service scheduling)
- Multi-language support
- Bible API integration for full scripture access
- Offline-first with background sync
