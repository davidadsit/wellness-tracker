# Wellness Tracker

A React Native mobile app for tracking mental, physical, and emotional wellness through quick daily check-ins and habit monitoring written with Claude Code.

## Features

- **Daily Check-Ins** — Tag how you're feeling across mental, physical, and emotional health categories
- **Conditional Categories** — Selecting "Sick" automatically reveals a Symptoms category with relevant tags
- **Custom Tags & Categories** — Add your own tags and categories beyond the defaults
- **Tag Management** — Edit, archive, and delete custom tags with data-safe archiving for tags used in check-ins
- **Habit Tracking** — Create daily or weekly habits with configurable targets and completion tracking
- **Streaks** — View current and longest streaks for each habit
- **Analytics** — Tag frequency charts, trends, and habit completion rates over 7/30/90 day periods
- **Notifications** — Configurable daily check-in reminders via local notifications
- **Deep Linking** — Open specific screens via `wellnesstracker://` URLs
- **Quick Check-In** — Streamlined check-in flow accessible from notifications

## Default Tag Categories

| Category | Tags |
|----------|------|
| Mental Health | Focused, Foggy, Calm, Anxious, Overwhelmed, Clear-headed, Distracted |
| Physical Health | Energized, Tired, Rested, Sore, Strong, Sluggish, Active, Sick |
| Symptoms* | Headache, Nausea, Fever, Congestion, Sore Throat, Chills, Body Aches, Cough, Dizziness |
| Emotional Health | Happy, Sad, Grateful, Irritable, Content, Lonely, Hopeful, Stressed |

*Symptoms category appears only when "Sick" is selected.

## Tech Stack

- **Framework:** React Native 0.84 with React 19
- **Language:** TypeScript (strict)
- **State:** Redux Toolkit + Redux Persist (MMKV storage)
- **Database:** OP SQLite
- **Navigation:** React Navigation 7 (native stack + bottom tabs)
- **Charts:** React Native Gifted Charts
- **Notifications:** Notifee
- **Icons:** Ionicons via @react-native-vector-icons
- **Testing:** Jest + React Testing Library

## Prerequisites

- Node.js >= 22.11.0
- Xcode (for iOS)
- JDK 17 (for Android)
- Android SDK with an emulator or connected device

## Getting Started

```bash
# Install dependencies
make install

# iOS
make pods
make ios

# Android
make android
```

Or manually:

```bash
npm install
cd ios && npx pod-install && cd ..
npx react-native run-ios
npx react-native run-android
```

## Scripts

| Command | Description |
|---------|-------------|
| `make install` | Install npm dependencies |
| `make pods` | Install iOS CocoaPods |
| `make ios` | Full iOS setup and run |
| `make android` | Full Android setup and run |
| `make test` | Run tests |
| `make clean` | Remove node_modules, Pods, and build artifacts |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── analytics/    # Charts and insight cards
│   ├── checkin/      # Tag chips, category sections, history items
│   ├── common/       # Card, TagBadge, EmptyState
│   └── habits/       # Habit cards, forms, streaks
├── hooks/            # Custom React hooks (useTags, useCheckIn, useHabits, useAnalytics)
├── navigation/       # Stack and tab navigators, deep linking config
├── screens/          # All app screens
├── seed/             # Default tag category/tag data
├── services/
│   ├── database/     # SQLite database, repositories
│   └── notifications/# Notification scheduling and handlers
├── store/            # Redux slices (tags, checkIn, habits, settings)
├── theme.ts          # Shared colors and common styles
├── types/            # TypeScript interfaces
└── utils/            # Date formatting, analytics calculations, UUID
```

## Deep Links

| URL | Screen |
|-----|--------|
| `wellnesstracker://home` | Home |
| `wellnesstracker://checkin` | Check-In |
| `wellnesstracker://check-in` | Quick Check-In |
| `wellnesstracker://habits` | Habits |
| `wellnesstracker://habit/:habitId` | Habit Detail |
| `wellnesstracker://analytics` | Analytics |
| `wellnesstracker://settings` | Settings |
| `wellnesstracker://tags` | Tag Management |

## Testing

```bash
make test
# or
npm test
```

Tests cover database repositories, Redux slices, notification handlers, analytics utilities, and screen rendering.

## License

MIT
