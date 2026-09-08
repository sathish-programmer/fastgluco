# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep Capacitor core classes
-keep class com.getcapacitor.** { *; }

# Keep all plugins (including Cordova plugins)
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.bridge.Plugin { *; }

# Keep Cordova plugins classes
-keep class org.apache.cordova.** { *; }
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# Keep FileProvider to prevent camera cache save crashes
-keep class androidx.core.content.FileProvider { *; }

# Keep specific plugins
-keep class com.capacitorjs.plugins.camera.** { *; }
-keep class com.capacitorjs.plugins.toast.** { *; }
-keep class com.capacitorjs.plugins.filesystem.** { *; }

# R8 Optimization Configuration
-repackageclasses
-allowaccessmodification
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable

# Strip debug logging in production to reduce binary size and memory
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
