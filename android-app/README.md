# Standalone NFC-Enabled Driver Attendance & Maintenance Log (Android Kotlin)

This directory contains the production-ready implementation files and architecture blueprints for the Android Kotlin application. This application coordinates real-time attendance tracking via hardware secure NFC cards, standard credential verification, and Toyota Fortuner fleet vehicle maintenance logging with Firestore sync.

## Architecture Highlights
1. **Foreground NFC Dispatch (`NfcAdapter`):** Handles foreground intent dispatching to capture physical high-frequency tags dynamically. 
2. **Hybrid Authentication Scheme:**
   - Standard email/password OR legacy Corporate File Number / password.
   - Instant NFC Check-In/Check-Out with validation bounds checking for driver credentials.
3. **Tamper-Proof Time Clocking:** Utilizes Firestore `FieldValue.serverTimestamp()` to guarantee immunity against system clock tampering on target mobile devices.
4. **Interactive UI Feedbacks:** Includes XML view elements with high-fidelity status triggers and color structures matching the main Fleet Hub Dark visual guide.

---

## Directory Schema
```text
android-app/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/
│   │       │   └── com/logistics/fleethub/
│   │       │       ├── LoginActivity.kt
│   │       │       ├── AdminActivity.kt
│   │       │       ├── DriverDashboardActivity.kt
│   │       │       └── utils/
│   │       │           └── NfcUtils.kt
│   │       └── res/
│   │           ├── layout/
│   │           │   ├── activity_login.xml
│   │           │   ├── activity_admin.xml
│   │           │   └── activity_driver_dashboard.xml
│   │           └── values/
│   │               ├── strings.xml
│   │               └── colors.xml
│   └── build.gradle
└── settings.gradle
```
