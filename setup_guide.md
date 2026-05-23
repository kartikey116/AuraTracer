# AuraTrace SDK Integration Guide

This guide explains **exactly** how to connect your Web or Mobile application to AuraTrace in simple language.

---

## 🌐 Web Applications (React, Next.js, HTML, Vue, etc.)

### 1. Where do I put this script?
You must paste the SDK code inside the `<head>` tags of your main HTML file (usually named `index.html` or `_document.js` in Next.js).

**Put it at the very top of the `<head>` section**, before any other script tags. This ensures AuraTrace loads first and can capture crashes from other scripts.

### 2. Simple Web Example:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Website</title>

  <!-- 1. Paste the AuraTrace SDK script here at the top of <head> -->
  <script src="http://localhost:5173/telemetry.js"></script>
  <script>
    window.addEventListener('load', () => {
      TelemetrySDK.init({
        apiKey: "YOUR_PROJECT_API_KEY",
        endpoint: "http://localhost:5000/api/v1/ingest",
        debug: true
      });
    });
  </script>

  <!-- Other scripts and styles go below it -->
  <script src="my-app.js"></script>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

---

## 📱 Mobile Applications (Android, iOS, Flutter, React Native)

If you are a mobile developer, you **do not use the HTML script tag**. Instead, you send crash reports directly to the AuraTrace Server using standard **HTTP API calls** (POST requests).

### 1. The Strategy
Wrap your mobile app in a global error catcher:
- **Flutter**: Use `FlutterError.onError`
- **React Native**: Use `ErrorBoundary` or `ErrorUtils`
- **Android (Kotlin/Java)**: Use `Thread.setDefaultUncaughtExceptionHandler`
- **iOS (Swift)**: Use `NSSetUncaughtExceptionHandler`

### 2. The Simple Mobile Example
When your mobile app crashes, send a network request to the AuraTrace ingestion endpoint:

* **Endpoint**: `http://localhost:5000/api/v1/ingest?apiKey=YOUR_PROJECT_API_KEY`
* **Method**: `POST`
* **Content-Type**: `application/json`

#### Send this simple JSON Payload:
```json
{
  "apiKey": "YOUR_PROJECT_API_KEY",
  "sessionId": "user_device_session_123",
  "timestamp": "2026-05-24T00:00:00Z",
  "type": "error",
  "level": "error",
  "message": "Uncaught exception: NullPointerException on Line 42",
  "path": "MainActivity.kt",
  "metadata": {
    "stack": "NullPointerException: Attempt to invoke virtual method on a null object reference\n  at com.myapp.MainActivity.onCreate(MainActivity.kt:42)",
    "environment": {
      "browser": "MobileApp",
      "os": "Android 14",
      "userAgent": "AppVersion/1.0.0",
      "screen": "1080x2400",
      "language": "en"
    }
  }
}
```

By sending this payload when a mobile error is caught, AuraTrace will register the crash, group it, and display it in the issues feed exactly like a web crash!
