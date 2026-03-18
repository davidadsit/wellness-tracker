# Wellness Tracker — React Native CLI App Plan

## Context
Greenfield mobile app for personal wellness tracking. Needs interactive local notifications (complete habits from the notification without opening the app), daily mood check-ins, habit tracking, and analytics. No backend — all data stays on device.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | React Native CLI | Full native access needed for notifee |
| Language | TypeScript | Catches data model bugs early |
| Navigation | React Navigation (bottom tabs + native stack) | De-facto standard |
| State | Redux Toolkit + react-redux | Store importable as singleton — needed for background notification handlers |
| Persistence | redux-persist + react-native-mmkv | Settings only; see Storage section |
| Local DB | @op-engineering/op-sqlite | Time-series queries, streak calculation |
| Charts | react-native-gifted-charts | Actively maintained, works with RN CLI |
| Notifications | notifee | Interactive actions, background handling |
| Date utils | date-fns | Lightweight, tree-shakeable |
| Permissions | react-native-permissions | iOS/Android notification permission flow |
| Testing | Jest + React Native Testing Library | Ships with RN CLI |

---

## Project Structure

```
wellness-tracker/
├── android/
├── ios/
├── src/
│   ├── components/
│   │   ├── common/         # Button, Card, Slider, EmptyState
│   │   ├── checkin/        # TagCategorySection, TagChip, CheckInHistoryItem, AddTagInline
│   │   ├── habits/         # HabitCard, HabitForm, HabitStreak
│   │   └── analytics/      # TagFrequencyChart, InsightCard
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── CheckInScreen.tsx
│   │   ├── HabitsScreen.tsx
│   │   ├── HabitDetailScreen.tsx
│   │   ├── HabitFormScreen.tsx
│   │   ├── AnalyticsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── TagManagementScreen.tsx  # Create/edit categories and tags
│   │   └── QuickCheckInScreen.tsx  # Opened via deep link from notification
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── linking.ts               # wellnesstracker:// deep link config
│   ├── seed/
│   │   └── defaultTags.ts           # Built-in categories and tags
│   ├── store/
│   │   ├── index.ts
│   │   ├── checkInSlice.ts
│   │   ├── tagsSlice.ts
│   │   ├── habitsSlice.ts
│   │   └── settingsSlice.ts
│   ├── services/
│   │   ├── database/
│   │   │   ├── database.ts          # SQLite singleton, schema init
│   │   │   ├── checkInRepository.ts
│   │   │   ├── tagRepository.ts
│   │   │   └── habitRepository.ts
│   │   └── notifications/
│   │       ├── notificationService.ts   # Schedule/cancel notifications
│   │       └── notificationHandlers.ts  # Background event handler
│   ├── hooks/
│   │   ├── useCheckIn.ts
│   │   ├── useTags.ts
│   │   ├── useHabits.ts
│   │   └── useAnalytics.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── analytics.ts             # Streak calc, trend aggregation (pure functions)
│   └── types/
│       └── index.ts
└── index.js                         # Entry point — order of init matters
```

---

## Data Models

### TypeScript Types

```typescript
// src/types/index.ts

export interface TagCategory {
  id: string;
  name: string;                   // 'Mental Health', 'Physical Health', etc.
  sortOrder: number;
  isDefault: boolean;             // true for the 4 built-in categories
  triggerTagId?: string;          // if set, category is hidden until this tag is selected
  createdAt: number;
}

export interface Tag {
  id: string;
  categoryId: string;
  label: string;                  // 'Anxious', 'Focused', 'Energized', etc.
  isDefault: boolean;             // true for built-in recommended tags
  createdAt: number;
}

export interface CheckIn {
  id: string;
  timestamp: number;              // Unix ms
  tagIds: string[];               // selected tags across all categories
  note?: string;
  source: 'manual' | 'notification';
}

export interface CheckInTag {
  checkInId: string;
  tagId: string;
}

export type HabitCategory = 'sleep' | 'water' | 'exercise' | 'nutrition' | 'mindfulness' | 'custom';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  unit?: string;                  // 'glasses', 'minutes', etc.
  color: string;                  // hex
  icon: string;
  reminderTime?: string;          // HH:MM
  isActive: boolean;
  createdAt: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;                   // YYYY-MM-DD — NOT a timestamp (timezone-safe)
  count: number;
  completedAt: number;            // Unix ms
  source: 'manual' | 'notification';
}
```

### SQLite Schema

```sql
CREATE TABLE tag_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,   -- 1 for built-in categories
  trigger_tag_id TEXT REFERENCES tags(id),  -- if set, category hidden until this tag is selected
  created_at INTEGER NOT NULL
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES tag_categories(id),
  label TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,   -- 1 for built-in recommended tags
  created_at INTEGER NOT NULL,
  UNIQUE(category_id, label)
);

CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE check_in_tags (
  check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (check_in_id, tag_id)
);

CREATE TABLE habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,             -- YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 1,
  completed_at INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  UNIQUE(habit_id, date)          -- one row per habit per day; upsert increments count
);

CREATE INDEX idx_checkin_ts ON check_ins(timestamp);
CREATE INDEX idx_checkin_tags_tag ON check_in_tags(tag_id);
CREATE INDEX idx_tags_category ON tags(category_id);
CREATE INDEX idx_completions ON habit_completions(habit_id, date);
CREATE INDEX idx_completions_date ON habit_completions(date);
```

> **Why `date TEXT` instead of a timestamp for completions:** Habits are day-scoped. A date string makes "did I complete this today" and streak queries trivial and immune to timezone issues.

### Default Seed Data

```sql
-- Categories
INSERT INTO tag_categories VALUES ('cat-mental', 'Mental Health', 1, 1, ...);
INSERT INTO tag_categories VALUES ('cat-physical', 'Physical Health', 2, 1, ...);
INSERT INTO tag_categories VALUES ('cat-emotional', 'Emotional Health', 3, 1, ...);
INSERT INTO tag_categories VALUES ('cat-symptoms', 'Symptoms', 4, 1, ...);

-- Mental Health tags
'Focused', 'Foggy', 'Calm', 'Anxious', 'Overwhelmed', 'Clear-headed', 'Distracted'

-- Physical Health tags
'Energized', 'Tired', 'Rested', 'Sore', 'Strong', 'Sluggish', 'Active', 'Ill'

-- Symptoms tags (hidden category — revealed when 'Ill' is selected in Physical Health)
'Headache', 'Nausea', 'Fever', 'Congestion', 'Sore Throat', 'Chills', 'Body Aches', 'Cough', 'Dizziness'

-- Emotional Health tags
'Happy', 'Sad', 'Grateful', 'Irritable', 'Content', 'Lonely', 'Hopeful', 'Stressed'
```

---

## Storage Architecture (Two-Layer)

**MMKV** (synchronous, key-value)
- App settings (theme, notification preferences)
- Habits list (small JSON blob, frequently read, needed synchronously in background handlers)

**SQLite** (relational)
- `tag_categories` + `tags` — user-customizable, relational
- `check_ins` + `check_in_tags` — needs date-range queries, tag-based aggregation
- `habit_completions` — needs streak aggregation, join-style queries

**Redux** — display cache only, NOT source of truth
- Rehydrate from SQLite on app open
- Persist only the `settings` slice via redux-persist/MMKV
- Tags, check-ins, and habits state are fetched from SQLite on each app open and on screen focus

**Critical:** Background notification handlers run in a headless JS context where the Redux store may not be hydrated. All background writes go directly to SQLite via repositories — never dispatch to Redux from the background handler.

---

## Navigation Structure

```
RootNavigator (NativeStackNavigator)
├── TabNavigator (BottomTabNavigator)
│   ├── Home         → HomeScreen
│   ├── Check-In     → CheckInScreen
│   ├── Habits       → HabitsScreen
│   └── Analytics    → AnalyticsScreen
├── HabitDetail      → HabitDetailScreen
├── HabitForm        → HabitFormScreen (new/edit)
├── Settings         → SettingsScreen
├── TagManagement    → TagManagementScreen  ← create/edit categories and tags
└── QuickCheckIn     → QuickCheckInScreen   ← deep-linked via wellnesstracker://check-in
```

**Screen responsibilities:**
- **HomeScreen** — today's check-in summary (selected tags), today's habit completion status, streak counts, CTA to check in if not yet done
- **CheckInScreen** — tag selection grouped by category (multi-select chips), selecting "Ill" in Physical Health reveals the Symptoms category, "+" button per category for inline tag creation, optional note, submit
- **HabitsScreen** — list of active habits with today's completion status; FAB to add
- **HabitDetailScreen** — completion history, calendar heatmap, streak stats, edit/delete
- **AnalyticsScreen** — tag frequency charts by category (7/30/90 day), bar charts for habit completion rates, tag co-occurrence insights
- **TagManagementScreen** — list categories with their tags; add/edit/reorder categories; add/edit tags within each category
- **QuickCheckInScreen** — minimal tag picker (no inline tag creation — speed over flexibility), dismisses after submit

---

## Notification Architecture

### Two Notification Types

**1. Daily Check-In Reminder**
```
Title: "How are you feeling today?"
Actions:
  - "Check In"  → foreground: true  → opens QuickCheckInScreen via deep link
  - "Dismiss"   → foreground: false → dismisses
```

**2. Habit Reminder** (one per habit with a reminderTime set)
```
Title: "Time for: {habit.name}"
Actions:
  - "✓ Done!"   → foreground: false → completes habit directly (no app open)
  - "Snooze 30m"→ foreground: false → reschedules 30 min later
```

### Stable Notification IDs

Use `habit-reminder-${habit.id}` as the notification ID. When a user edits a habit's reminder time: cancel by that ID, then create a new one. No orphaned notifications.

### Background Handler (most architecturally sensitive code)

```typescript
// src/services/notifications/notificationHandlers.ts
// Register in index.js BEFORE AppRegistry.registerComponent

import notifee, { EventType } from '@notifee/react-native';
import { habitRepository } from '../database/habitRepository';
import { format } from 'date-fns';

export function registerNotificationHandlers() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.ACTION_PRESS) return;

    const { notification, pressAction } = detail;
    const habitId = notification?.data?.habitId as string | undefined;

    switch (pressAction?.id) {
      case 'COMPLETE_HABIT':
        if (habitId) {
          // Write DIRECTLY to SQLite — do NOT dispatch to Redux
          await habitRepository.completeHabit(habitId, {
            source: 'notification',
            date: format(new Date(), 'yyyy-MM-dd'),
          });
          await notifee.cancelNotification(notification.id!);
        }
        break;

      case 'SNOOZE_HABIT':
        await rescheduleIn30Minutes(notification);
        break;

      // CHECK_IN opens app via deep link — nothing to do here
    }
  });
}
```

### Foreground Sync After Background Writes

Any screen showing today's data uses `useFocusEffect` to re-fetch from SQLite on every focus:

```typescript
useFocusEffect(useCallback(() => {
  dispatch(fetchTodayCompletions());
}, []));
```

This ensures habit completions written by background notifications are reflected when the user opens the app.

---

## Testing Strategy

**Framework**: Jest + React Native Testing Library (ships with RN CLI)

**Additional test libraries**:
- `@testing-library/react-native` — component/screen tests
- `@testing-library/jest-native` — extended matchers
- `@notifee/react-native` — manual mock for notification tests

### Layer-by-Layer Approach

| Layer | Approach |
|---|---|
| `utils/analytics.ts` | Pure function tests — no mocks needed |
| `services/database/*Repository.ts` | Tests against real in-memory SQLite with actual schema |
| `services/database/tagRepository.ts` | Seed data insertion, custom tag/category CRUD, uniqueness constraints |
| `store/*Slice.ts` reducers & selectors | Plain JS unit tests — no RN environment |
| `store/*Slice.ts` thunks | Unit tests with mocked repository layer |
| `services/notifications/notificationHandlers.ts` | Unit tests: mock notifee + repositories, assert correct calls per action ID |
| `services/notifications/notificationService.ts` | Unit tests: assert correct `createTriggerNotification` args, stable IDs, cancel-on-edit |
| `screens/*.tsx`, `components/**` | RNTL render tests for key interactions |

### Key Testing Decisions

- **Repository tests use real SQLite** (not mocked) — the `UNIQUE(habit_id, date) ON CONFLICT DO UPDATE` upsert and `UNIQUE(category_id, label)` tag constraint must be verified at the SQL level
- **Background handler is pure async logic** — import directly and test as a plain function with mocked deps
- **Streak calculation** in `utils/analytics.ts` is the most logic-dense pure function — test exhaustively: active streak, broken streak, longest-ever, empty input, single entry
- **Tag frequency analytics** — test aggregation of tag counts over date ranges, co-occurrence detection
- **Redux thunks** mock the repository layer; test that the correct actions are dispatched given repo return values

### Test File Layout

```
src/
├── utils/__tests__/
│   └── analytics.test.ts
├── services/database/__tests__/
│   ├── checkInRepository.test.ts
│   ├── tagRepository.test.ts
│   └── habitRepository.test.ts
├── services/notifications/__tests__/
│   ├── notificationHandlers.test.ts
│   └── notificationService.test.ts
├── store/__tests__/
│   ├── checkInSlice.test.ts
│   ├── tagsSlice.test.ts
│   └── habitsSlice.test.ts
└── screens/__tests__/
    ├── HomeScreen.test.tsx
    ├── CheckInScreen.test.tsx
    └── HabitsScreen.test.tsx
```

---

## Implementation Phases

**Phase 1 — Foundation**
- `npx react-native init WellnessTracker --template react-native-template-typescript`
- Install all dependencies
- Navigation stubs (all screens render placeholder text)
- SQLite schema init (`database.ts`)
- Redux store + MMKV persistence adapter
- Jest config verified

**Phase 2 — Tags + Check-In**
- `TagCategory` / `Tag` types + `tagRepository.ts` + seed data + tests
- `CheckIn` type + `checkInRepository.ts` + tests
- `CheckInScreen` UI (tag chips grouped by category, note, submit)
- `TagManagementScreen` (add/edit categories and tags)
- `HomeScreen` today's summary
- Redux thunks + `checkInSlice` + `tagsSlice` + tests

**Phase 3 — Habits**
- `Habit` CRUD via MMKV + `habitsSlice` + tests
- `habitRepository.ts` (upsert, streak queries) + tests
- `HabitsScreen`, `HabitFormScreen`, `HabitDetailScreen`

**Phase 4 — Notifications**
- notifee channel + category setup
- `notificationService.ts` (schedule/cancel) + tests
- `notificationHandlers.ts` (background handler) + tests
- Deep link routing for `QuickCheckInScreen`
- `SettingsScreen` notification controls

**Phase 5 — Analytics + Polish**
- `AnalyticsScreen` with gifted-charts
- Tag frequency queries + trend analysis + tests
- Habit completion rate charts
- Empty states, loading states

---

## Critical Files

- **`index.js`** — database init, notification handler registration, and `AppRegistry.registerComponent` must be called in this order
- **`src/services/database/database.ts`** — SQLite singleton, WAL mode, schema creation on first launch
- **`src/services/notifications/notificationHandlers.ts`** — background event handler; most architecturally sensitive file; writes directly to SQLite
- **`src/store/index.ts`** — MMKV storage adapter, selective persist whitelist
- **`src/seed/defaultTags.ts`** — built-in categories (Mental Health, Physical Health, Emotional Health) and their recommended tags
- **`src/services/database/tagRepository.ts`** — tag/category CRUD, seed insertion on first launch
- **`src/services/database/habitRepository.ts`** — `completeHabit` upsert logic, streak calculation
- **`src/utils/analytics.ts`** — pure functions for streak, tag frequency, and trend calculation; most unit-testable file in the project
