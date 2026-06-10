import os

def fix_gradle_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    with open(file_path, 'r') as f:
        content = f.read()
    
    content = content.replace("JavaVersion.VERSION_21", "JavaVersion.VERSION_17")
    
    with open(file_path, 'w') as f:
        f.write(content)
    print(f"Fixed: {file_path}")

fix_gradle_file(r"C:\Users\ibrah\Documents\Gemini\Christian_App\android\app\capacitor.build.gradle")
fix_gradle_file(r"C:\Users\ibrah\Documents\Gemini\Christian_App\android\capacitor-cordova-android-plugins\build.gradle")
