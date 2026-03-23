# Wellness Tracker

A React Native mobile app for tracking mental, physical, and emotional wellness through quick daily check-ins and habit monitoring.

## Features

- **Daily Check-Ins** — Tag how you're feeling across mental, physical, and emotional health categories with custom and default tags
- **Habit Tracking** — Create daily or weekly habits with configurable targets, completion tracking, and streaks
- **Analytics** — Tag frequency charts, trends, and habit completion rates over 7/30/90 day periods
- **Reminders** — Configurable morning, midday, and evening check-in reminders via local notifications
- **Deep Linking** — Open specific screens via `wellnesstracker://` URLs

## Architecture

React Native 0.84 with TypeScript (strict). State management via Redux Toolkit with Redux Persist (MMKV storage). Local data stored in OP SQLite using a repository pattern. Navigation via React Navigation 7 (native stack + bottom tabs). Local notifications powered by Notifee.

Screens consume data through custom hooks, which dispatch async thunks to repositories and update Redux state. Database schema is managed by a versioned migration runner.

## Prerequisites

- Node.js >= 22.11.0
- Xcode (for iOS)
- JDK 17 (for Android)

## Build & Run

```bash
# iOS
make ios

# Android
make android
```

This installs dependencies (and CocoaPods for iOS) automatically.

## Testing

```bash
npm test          # All tests
make prep         # Lint, format, then run all test suites
```

## License

MIT
