# How to Build APK

## Prerequisites
- Android Studio (with Android SDK)
- Java JDK 17+
- Gradle 8.14.3

## Steps to Build APK

### Option 1: Using Android Studio (Recommended)

1. **Open Android Studio**
   - Open Android Studio
   - Click "Open an existing project"
   - Navigate to: `c:\Users\ibrah\Documents\Gemini\Christian_App\android`
   - Click OK

2. **Wait for Gradle Sync**
   - Android Studio will sync the project
   - This will download Gradle and all dependencies

3. **Build the APK**
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Wait for build to complete

4. **Locate the APK**
   - Find your APK at: `android\app\build\outputs\apk\debug\app-debug.apk`

### Option 2: Using Command Line

If you have Gradle installed locally:

```bash
cd c:\Users\ibrah\Documents\Gemini\Christian_App\android
gradle assembleDebug
```

### Option 3: Download Pre-built APK (Coming Soon)

I'm working on setting up GitHub Actions to build and release APK automatically. Check back soon!

## Current Status

- ✅ Web app created and running
- ✅ Code pushed to GitHub
- ⏳ Gradle SSL configuration on local system
- 🔄 Working on automated APK build via GitHub Actions

## GitHub Repository

https://github.com/ecoinboxhub/Christian_task_app

## Need Help?

If you encounter any issues:
1. Make sure Android Studio is updated
2. Clean the project: Build → Clean Project
3. Rebuild: Build → Rebuild Project
4. Check the build logs for specific errors
