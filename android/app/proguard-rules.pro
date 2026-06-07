# Add project specific ProGuard rules here.

-keepclassmembers class fqcn.javascript.interfaces.** {
   *;
}

-keep class com.facebook.react.** { *; }
-keep interface com.facebook.react.bridge.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.google.android.gms.**
