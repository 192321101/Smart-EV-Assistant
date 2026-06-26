# Smart EV Assistant - Android Appium E2E Test Suite

This directory contains the Appium-based E2E mobile testing suite for the Smart EV Assistant Kotlin-based Android application.

## Directory Structure

```text
appium/
├── appium_e2e_tests.py    # Main Appium test runner (executes 400 test cases)
├── generate_reports.py    # Generates professional Excel & HTML reports
├── requirements.txt       # Python dependencies (Appium-Python-Client, openpyxl)
└── README.md              # Setup and execution guide (this file)
```

## Setup Instructions

### 1. Prerequisites

Make sure you have the following installed on your machine:
- Node.js (v18+)
- Java JDK 17
- Python 3.10+
- Android Studio & SDK (with Emulator configured)

### 2. Install Appium & UIAutomator2 Driver

Install Appium globally using npm:

```bash
npm install -g appium
```

Install the UiAutomator2 driver:

```bash
appium driver install uiautomator2
```

Verify your driver installation:

```bash
appium driver list --installed
```

### 3. Install Python Dependencies

Install the Python libraries listed in `requirements.txt`:

```bash
pip install -r appium/requirements.txt
```

### 4. Build the Android App Debug APK

From the `android/frontend/` directory, build the debug APK:

```bash
cd android/frontend
./gradlew assembleDebug
```

The APK will be built and placed at:
`android/frontend/app/build/outputs/apk/debug/app-debug.apk`

---

## Running the E2E Tests

### 1. Start the Android Emulator

Open Android Studio Virtual Device Manager and start your emulator, or run it via command line:

```bash
emulator -avd <Your_AVD_Name>
```

### 2. Start the Appium Server

In a new terminal window, start the Appium server on default port 4723:

```bash
appium
```

### 3. Run the Test Suite

Execute the Python script to run all 400 test cases:

```bash
python appium/appium_e2e_tests.py
```

*Note: If the Appium server is offline, the script will automatically switch to mock/simulation mode, validating the UI states and creating test reports to verify the reporting pipeline.*

---

## Viewing Test Reports

After completion, the test results will be compiled into the `Test Results/` directory at the project root:

1. **Excel Report:** `Test Results/Excel/Automation_Test_Report.xlsx` (includes summary stats, color-coded statuses, and details of all 400 runs).
2. **HTML Report:** `Test Results/HTML/execution-report.html` (interactive, responsive dashboard featuring collapsible accordion details and screenshots).
3. **Markdown Summary:** `Test Results/Summary/summary.md` (optimized for displaying test execution stats on CI/CD summary pages).
4. **Log File:** `Test Results/Logs/execution.log` (complete debug trace of the test execution).
