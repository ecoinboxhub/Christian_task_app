# Believers Task Flow

A Christian task management app built with React Native.

## Features

- **Task Management**: Add, complete, delete, and update tasks with categories and priorities
- **Filtering**: View All, Active, or Completed tasks
- **Daily Bible Verse**: AI-generated verses with suggestions
- **Prayer Balance Tracker**: Track your prayer commitments
- **Bible Study Planner**: Plan and track your Bible study sessions
- **Christian Task Balance**: Visual progress tracker for your tasks
- **GROQ LLM Integration**: AI-powered recommendations for believer activities
- **Offline-First**: All data stored locally on the device
- **Mobile-First UI**: Colorful Christian-themed design with emojis

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Android SDK (for Android builds)
- Xcode 14+ (for iOS builds, Mac only)

### Setup

1. Navigate to the project directory:

```bash
cd Christian_App
```

2. Install dependencies:

```bash
npm install
```

3. For Android:

```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

4. For iOS (Mac only):

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

## Environment Setup

Create a `.env` file in the root directory:

```
GROQ_API_KEY=your-groq-api-key-here
```

Get your GROQ API key from https://console.groq.com/

## Building for Production

### Android APK

1. Generate a keystore file:

```bash
keytool -genkey -v -keystore christian-app-release.keystore -alias christian-app -keyalg RSA -keysize 2048 -validity 10000
```

2. Add your keystore to `android/app/`

3. Build the release APK:

```bash
npx react-native run-android --variant=release
```

Or build directly:

```bash
cd android && ./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### iOS (Mac only)

Open `ios/ChristianApp.xcworkspace` in Xcode and build from there.

## Project Structure

```
Christian_App/
├── src/
│   ├── components/       # React components
│   │   ├── TaskManager.js
│   │   ├── TaskItem.js
│   │   ├── VerseDisplay.js
│   │   ├── PrayerBalance.js
│   │   ├── BibleStudyPlanner.js
│   │   └── TaskBalance.js
│   ├── store/            # Data storage
│   │   └── taskStore.js
│   ├── services/         # API services
│   │   └── groqService.js
│   └── App.js            # Main app component
├── android/              # Android configuration
├── ios/                  # iOS configuration
├── package.json
└── README.md
```

## Data Storage

All data is stored locally using React Native Async Storage:
- Tasks
- Prayer balance
- Bible study sessions

## GitHub

Repository: https://github.com/ecoinboxhub/Christian_task_app.git

## License

MIT
