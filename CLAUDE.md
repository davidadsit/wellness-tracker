# Wellness Tracker

React Native mobile app for tracking wellness through daily check-ins and habit monitoring.

## Quick Reference

```bash
npm test              # Run all tests
npm run android       # Run on Android
npm run ios           # Run on iOS
npm run lint          # ESLint
make test             # Tests with maxWorkers=1
```

## Tech Stack

- React Native 0.84, React 19, TypeScript (strict)
- State: Redux Toolkit + Redux Persist (MMKV for storage)
- Database: OP SQLite (@op-engineering/op-sqlite)
- Navigation: React Navigation 7 (native-stack + bottom-tabs)
- Notifications: Notifee
- Icons: Ionicons (@react-native-vector-icons)
- Dates: date-fns
- Testing: Jest + React Testing Library

## Project Structure

```
src/
  components/         # UI components grouped by domain (checkin/, habits/, analytics/, journal/, common/)
  hooks/              # Custom hooks (useCheckIn, useTags, useHabits, useJournal, useAnalytics)
  screens/            # Screen components (10 screens)
  services/database/  # Repository pattern (checkInRepository, habitRepository, tagRepository)
  services/notifications/
  store/              # Redux slices (checkInSlice, habitsSlice, tagsSlice, settingsSlice)
  navigation/         # RootNavigator (stack), TabNavigator (bottom tabs), linking.ts
  types/              # Centralized TypeScript interfaces
  utils/              # dateUtils, analytics, uuid
  theme.ts            # Colors and common StyleSheet styles
test/
  __mocks__/          # Mocks for op-sqlite, notifee, react-native-mmkv, uuid
  screens/            # Screen component tests
  services/database/  # Repository tests
  utils/              # Utility tests
```

## Architecture Patterns

- **Repository pattern**: Database operations isolated in `src/services/database/`. Repositories are singleton objects with async methods. Use these for all DB access.
- **Redux async thunks**: Components use hooks → hooks dispatch thunks → thunks call repositories → reducers update state.
- **Custom hooks**: All screen data access goes through hooks (`useCheckIn`, `useTags`, `useHabits`, etc.). Hooks use `useSelector`/`useDispatch` and wrap actions in `useCallback`.
- **Functional components only**: No class components. Use `useFocusEffect` for screen-level data loading.
- **Styling**: Use `colors` and `commonStyles` from `src/theme.ts`. Component-level styles via `StyleSheet.create()`.

## Navigation

- **RootNavigator** (stack): Tabs, HabitDetail, HabitForm, Settings, TagManagement, QuickCheckIn, Analytics
- **TabNavigator** (bottom tabs): Home, Check-In, Habits, Journal
- Deep links: `wellnesstracker://` prefix (e.g., `wellnesstracker://journal`, `wellnesstracker://analytics`)
- Navigation types: `RootStackParamList` and `TabParamList` in `src/types/index.ts`

## Database

OP SQLite with 5 tables: `tag_categories`, `tags`, `check_ins`, `check_in_tags`, `habit_completions`. Schema and seed data in `src/services/database/database.ts`. Default tags defined in `src/seed/defaultTags.ts`.

Key behaviors:
- Tags are archived (not deleted) when they have check-in usage — see `tagRepository.removeTag()`
- Use `getAllTagsIncludingArchived()` when displaying historical data (e.g., Journal screen)
- Habit completions use upsert (ON CONFLICT) to increment count per day

## Testing

- Tests live in `test/` (not alongside source)
- Jest config: `jest.config.js` with custom `moduleNameMapper` for native module mocks
- Navigation and safe-area mocked in `jest.setup.js`
- Run: `npm test` or `make test`
- When adding tests, mirror the `src/` directory structure under `test/`

## Android Emulator

- `adb exec-out screencap -p > /tmp/screenshot.png` to capture screenshots for debugging
