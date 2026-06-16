# Android Mobile Application Build and Deployment Guide

This guide details the Android mobile application assets generated for the **Smart EV Assistant** and provides instructions for running, testing, signing, and publishing the app.

---

## 1. Generated Build Outputs

Your project has been compiled into a professional Android codebase using **Capacitor**. The following artifacts are located under the workspace directory:

* **Android Studio Project**: Located at [android/](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android) (Open this folder directly in Android Studio to edit Java/Kotlin or resource assets).
* **Debug APK**: Located at [android/app/build/outputs/apk/debug/app-debug.apk](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android/app/build/outputs/apk/debug/app-debug.apk). Suitable for sideloading and testing on devices.
* **Pre-Signed Release APK**: Located at [android/app/build/outputs/apk/release/app-release-signed.apk](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android/app/build/outputs/apk/release/app-release-signed.apk). Pre-signed with a self-signed keystore and ready for direct installation on physical Android devices!
* **Pre-Signed Android App Bundle (AAB)**: Located at [android/app/build/outputs/bundle/release/app-release.aab](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android/app/build/outputs/bundle/release/app-release.aab). Pre-signed with a self-signed keystore and ready to upload directly to the Google Play Console.
* **Keystore File**: Located at [android/app/build/outputs/apk/release/smart-ev-assistant.keystore](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android/app/build/outputs/apk/release/smart-ev-assistant.keystore). Used for signing the release builds.

### Keystore Credentials
* **Keystore Password**: `s3cr3tp4ss`
* **Key Alias**: `ev-key`
* **Key Password**: `s3cr3tp4ss`

---

## 2. Running on Android Studio Emulator

1. **Launch Android Studio**.
2. Click **Open** and select the [android/](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android) folder.
3. Open the **Device Manager** (right sidebar or `Tools -> Device Manager`).
4. Click **Create Device**, select a hardware profile (e.g., Pixel 7), choose a system image (Android 10/API 29 or higher), and click **Finish**.
5. Click the **Play** button next to your Virtual Device in Device Manager to boot the emulator.
6. Click the green **Run 'app'** button in the top toolbar of Android Studio to compile and deploy.

---

## 3. Sideloading and Debugging on a Real Device (USB Debugging)

1. On your Android phone, go to **Settings -> About Phone** and tap **Build Number** 7 times to enable Developer Options.
2. Go to **Settings -> System -> Developer Options** and enable **USB Debugging**.
3. Connect your phone to your computer via USB.
4. Install the pre-signed release APK directly onto your phone:
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release-signed.apk
   ```
5. Launch **Smart EV Assistant** from your app drawer. It will run independently of any browser.

---

## 4. Signing Custom Builds with Your Own Keystore

Google Play requires all production apps to be digitally signed before they can be published. If you ever need to generate a new key and sign your app manually, follow these steps:

### Step 4.1: Generate a Keystore
```bash
keytool -genkey -v -keystore smart-ev-assistant.keystore -alias ev-key -keyalg RSA -keysize 2048 -validity 10000
```

### Step 4.2: Sign the Release APK
Sign the unsigned release APK using `apksigner` (part of the Android SDK Build Tools):
```bash
apksigner sign --ks smart-ev-assistant.keystore --out app-release-signed.apk android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Step 4.3: Verify the Signature
Verify the signature:
```bash
apksigner verify app-release-signed.apk
```

---

## 5. Publishing to the Google Play Store

1. Go to the [Google Play Console](https://play.google.com/console/) and sign in with your developer account.
2. Click **Create app**, fill out the basic details (app name, default language, app type), and click **Create app**.
3. Under the **Production** section in the sidebar, click **Create new release**.
4. Upload your signed Android App Bundle: [app-release.aab](file:///c:/Users/DHRANI/.gemini/antigravity/scratch/Smart%20EV%20Assistant/android/app/build/outputs/bundle/release/app-release.aab).
5. Complete the store listing checklist (upload screenshots, app icon, description, set content rating).
6. Submit the release for review. Once approved, your app will be live on the Play Store!

