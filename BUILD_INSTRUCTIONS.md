# Build Instructions for Believers Task Flow

## Prerequisites

- Node.js 18+ 
- Android SDK (API level 23+)
- JDK 17+
- Android NDK r26+
- Python 3.8+

## Installation Steps

### 1. Install Dependencies

```bash
cd Christian_App
npm install
```

### 2. Android Build

#### For Development (Debug APK):

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### For Release (Release APK):

First, generate a keystore file (if you don't have one):

```bash
keytool -genkey -v -keystore christian-app-release.keystore -alias christian-app -keyalg RSA -keysize 2048 -validity 10000
```

Place the keystore in `android/app/`

Then build the release APK:

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Environment Setup

1. Copy `.env.example` to `.env` (if exists)
2. Add your GROQ API key to `.env`:

```
GROQ_API_KEY=your-groq-api-key-here
```

Get your GROQ API key from https://console.groq.com/

## Running on Emulator/Device

### Using ADB:

```bash
# List connected devices/emulators
adb devices

# Install APK on device
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Run the app
adb shell am start -n com.christianapp/.MainActivity
```

### Using React Native CLI:

```bash
npx react-native run-android
```

## APK Location

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## GitHub Repository

Code pushed to: https://github.com/ecoinboxhub/Christian_task_app.git

## Troubleshooting

### Gradle sync issues:

```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### Build errors:

Make sure you have the correct Android SDK versions installed:
- Compile SDK: 34
- Min SDK: 23

### JDK issues:

Set JAVA_HOME to JDK 17:

```bash
export JAVA_HOME=/path/to/jdk-17
```
