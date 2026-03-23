# Wellness Tracker

React Native mobile app for tracking wellness through daily check-ins and habit monitoring.

## Quick Reference

```bash
npm test              # Run all tests (all 3 suites)
npm run test:unit     # Unit tests only (fast, no external deps)
npm run test:integration  # Integration tests only (real database)
npm run test:acceptance   # Acceptance/feature tests only (full stack below UI)
npm run android       # Run on Android
npm run ios           # Run on iOS
npm run lint          # ESLint (errors + warnings)
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier auto-format
npm run format:check  # Prettier check (CI-friendly)
make prep             # Lint, format, then run unit → integration → acceptance
make test             # Tests with maxWorkers=1
```

## Linting & Formatting

- **ESLint**: `@react-native/eslint-config` (includes TypeScript, React, React Hooks, Jest)
- **Prettier**: React Native defaults (`.prettierrc.js`)
- A PostToolUse hook in `.claude/settings.json` auto-runs `eslint --fix` and `prettier --write` on every file edit.
- Before code is ready to commit, run `npm run lint:fix && npm run format` across the full codebase to catch anything the per-file hook missed.

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
  screens/            # Screen components
  services/database/  # Repository pattern (checkInRepository, habitRepository, tagRepository)
  services/notifications/
  store/              # Redux slices (checkInSlice, habitsSlice, tagsSlice, settingsSlice)
  navigation/         # RootNavigator (stack), TabNavigator (bottom tabs), linking.ts
  types/              # Centralized TypeScript interfaces
  utils/              # dateUtils, analytics, ulid
  theme.ts            # Colors and common StyleSheet styles
test/
  __mocks__/          # Mocks for op-sqlite, notifee, react-native-mmkv
  helpers/            # Shared test utilities (database setup, renderWithStore, factories)
  unit/               # Unit tests — isolated, all deps mocked
  integration/        # Integration tests — real database, one concrete dependency
  acceptance/         # Acceptance tests — full stack below UI, no mocks
```

## Design Principles — Kent Beck's 4 Rules of Simple Design

All code changes should be evaluated against these rules, in priority order:

1. **Passes the tests** — Code must work correctly. Verified by running `npm test`. Never sacrifice correctness for elegance.
2. **Reveals intention** — Code should clearly communicate its purpose. Choose descriptive names, write straightforward logic, and structure code so a reader can understand *what* and *why* without extra explanation.
3. **No duplication** — Every piece of knowledge should have a single, unambiguous representation. Extract shared logic rather than copying it, but only when duplication actually exists (not speculatively).
4. **Fewest elements** — Remove anything that doesn't serve the first three rules. No speculative abstractions, unused code, or unnecessary complexity. Less is more.

## Architecture Patterns

- **Repository pattern**: Database operations isolated in `src/services/database/`. Repositories are singleton objects with async methods. Use these for all DB access.
- **Redux async thunks**: Components use hooks → hooks dispatch thunks → thunks call repositories → reducers update state.
- **Custom hooks**: All screen data access goes through hooks (`useCheckIn`, `useTags`, `useHabits`, etc.). Hooks use `useSelector`/`useDispatch` and wrap actions in `useCallback`.
- **Functional components only**: No class components. Use `useFocusEffect` for screen-level data loading.
- **Styling**: Use `colors` and `commonStyles` from `src/theme.ts`. Component-level styles via `StyleSheet.create()`.

## Navigation

- Deep links: `wellnesstracker://` prefix (e.g., `wellnesstracker://journal`, `wellnesstracker://analytics`)
- Navigation types: `HomeStackParamList`, `HabitsStackParamList`, and `TabParamList` in `src/types/index.ts`

## Database

OP SQLite with 6 tables: `tag_categories`, `tags`, `check_ins`, `check_in_tags`, `habit_completions`, `notification_outcomes`. Schema and seed data in `src/services/database/database.ts`. Default tags defined in `src/seed/defaultTags.ts`.

Key behaviors:
- Tags are archived (not deleted) when they have check-in usage — see `tagRepository.removeTag()`
- Use `loadAllTagsIncludingArchived()` when displaying historical data (e.g., Journal screen)
- Habit completions use upsert (ON CONFLICT) to increment count per day

### Schema Migrations

The app has real users — **all schema changes must be nondestructive**. The database uses a versioned migration system in `src/services/database/migrations.ts`.

**How it works:**
- SQLite's `PRAGMA user_version` tracks the current schema version (starts at 0 for fresh DBs)
- Migrations are an ordered array of async functions in `migrations.ts`
- On startup, the runner reads the current version, executes only newer migrations in order, and bumps `user_version` after each one
- No rollback mechanism — SQLite DDL is limited; keep migrations additive

**Adding a new migration:**
1. Write a new async migration function (e.g., `migrationV2`) in `migrations.ts`
2. Append it to the `migrations` array — ordering is determined by array position
3. The migration function receives the database handle and runs DDL/DML statements
4. Add integration tests in `test/integration/services/database/migrations.test.ts`
5. That's it — the runner handles version detection and execution automatically

**Migration rules:**
- Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` — migrations may re-run on fresh databases
- Never drop or rename tables/columns — existing user data must be preserved
- Add columns with defaults: `ALTER TABLE x ADD COLUMN y TYPE NOT NULL DEFAULT z`
- Test that migrations work both on fresh databases (version 0 → latest) and incremental upgrades (version N → N+1)

**Mock considerations:**
- The OP SQLite mock in `test/__mocks__/op-sqlite.ts` must handle `PRAGMA` reads (no `=` sign, returns rows) differently from `PRAGMA` writes (has `=` sign, executes only)

## Testing — TDD Required

All code must be written using Test-Driven Development. TDD is the corollary of rule 1 (passes the tests): if code must pass tests to be correct, then the tests must exist *before* the code.

**The TDD cycle:**
1. **Red** — Write a failing test that describes the behavior you want. Run `npm test` and confirm it fails.
2. **Green** — Write the simplest code that makes the test pass. Run `npm test` and confirm it passes.
3. **Refactor** — Improve the code (apply rules 2–4) while keeping tests green. Run `npm test` after each change.

**Key practices:**
- Never write production code without a failing test demanding it.
- Each Red–Green–Refactor cycle should be small — one behavior at a time.
- Run the full test suite (`npm test`) frequently, not just the test you're working on.
- When fixing a bug, first write a test that reproduces the bug, then fix it.

### Three Test Suites

Tests are organized into three distinct suites. Each suite has a different purpose, speed, and set of constraints. When adding a test, choose the suite that matches what you are validating.

#### 1. Unit Tests (`test/unit/`)

**Purpose:** Validate that a single class, function, or component behaves correctly in isolation from its dependencies. Unit tests also serve as documentation for how a piece of code is expected to be used.

**Rules:**
- Test one unit of behavior at a time. The subject under test is a single function, reducer, component, or hook.
- **All external dependencies must be mocked** — repositories, services, navigation, native modules, etc. A test that touches the database, file system, network, or any external resource is *never* a unit test.
- Must be fast. The entire unit suite should run in seconds.
- Tests must be atomic, isolated, and order-independent. No test may depend on state left behind by another.

**What belongs here:**
- Redux slice reducers and action creators (mock repository calls in thunks)
- Pure utility functions (`dateUtils`, `analytics`, `ulid`)
- Component rendering and interaction (mock hooks/stores via `test/helpers/renderWithStore`)
- Custom hook logic (mock dispatched thunks)

**Smells:** Too much setup, slow execution, race conditions, reliance on real database or services.

#### 2. Integration Tests (`test/integration/`)

**Purpose:** Validate your code against one real concrete dependency. The primary use is testing repository/data-access code against the real OP SQLite database. These tests verify that your SQL, ORM mappings, and data transformations work correctly end-to-end with the actual dependency.

**Rules:**
- **No mocks for the dependency under test.** If testing a repository, use the real database. If testing notification scheduling, use the real notifee mock only where the native bridge forces it.
- Mocking other dependencies is acceptable — the key constraint is that the specific integration being tested uses the real implementation.
- Require more setup than unit tests (e.g., `setupTestDatabase()` from `test/helpers/database.ts`).
- Slower than unit tests but must still be kept as fast as possible.
- Tests must be atomic, isolated, and order-independent.
- Only test the features of the external system that you actually use — don't attempt exhaustive coverage of the dependency.

**Smells:** Any mocks or stubs for the dependency being integrated, testing features of the external system that the app doesn't use.

#### 3. Acceptance Tests (`test/acceptance/`)

**Purpose:** Validate that the full application stack works correctly as a whole, from just below the UI layer down through hooks, store, repositories, and database. These tests verify correct composition of building blocks — that components are wired up properly and user-facing workflows produce the expected results. Acceptance tests complement unit and integration tests: while those validate correctness in the small, acceptance tests validate correct assembly.

**Rules:**
- **No mocks, stubs, or test doubles of any kind** for application code. The only mocks allowed are for unavoidable native-bridge boundaries (React Native modules that cannot run in Jest — e.g., navigation, safe-area, MMKV storage).
- Tests attach at the application layer just below the UI: render a screen component with a real Redux store, real repositories, and a real database.
- Written in terms of user-visible behavior and business language, not implementation details. A non-developer should be able to read the test description and understand what is being validated.
- These are the slowest tests. Run them less frequently than unit tests during development, but always before committing.
- Each test exercises a complete user workflow or acceptance criterion: e.g., "user submits a check-in and sees it on the home screen."

**Smells:** Mocking application code (repositories, slices, hooks), testing implementation details rather than behavior, attempting to validate every code path (that's what unit tests are for), tests written in technical jargon rather than business language.

### Choosing the Right Test Suite

| Question | Unit | Integration | Acceptance |
|----------|------|-------------|------------|
| Does it test one function/component in isolation? | **Yes** | No | No |
| Does it need a real database or external system? | No | **Yes** | **Yes** |
| Does it validate wiring/composition across layers? | No | No | **Yes** |
| Are all app-code dependencies mocked? | **Yes** | Some | **None** |
| Should a non-developer understand the test name? | Nice to have | Nice to have | **Required** |

### Shared Test Helpers (`test/helpers/`)

- `database.ts` — `setupTestDatabase()`: resets and initializes the OP SQLite database in `beforeEach`. Used by integration and acceptance tests.
- `renderWithStore.tsx` — `makeStore(preloadedState?)` and `renderWithStore(ui, preloadedState?)`: creates a Redux store with all reducers and wraps a component in `<Provider>`. Used by unit tests (with mocked repositories) and acceptance tests (with real repositories).
- `factories.ts` — `makeHabit`, `makeTag`, `makeCategory`, `makeCheckIn`, `makeCompletion`, `makeNotificationOutcome`: build valid domain objects for testing. All accept optional `overrides`. Used across all suites.

## Android Emulator

- `adb exec-out screencap -p > /tmp/screenshot.png` to capture screenshots for debugging
