import {
  Habit,
  NotificationOutcomeRecord,
  Tag,
  TagCategory,
  CheckIn,
  HabitCompletion,
} from '../../src/types';
import {ulid} from '../../src/utils/ulid';

export const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Drink Water',
  category: 'water',
  frequency: 'daily',
  targetCount: 8,
  unit: 'glasses',
  color: '#3498db',
  icon: 'water',
  isActive: true,
  createdAt: 100,
  ...overrides,
});

export const makeNotificationOutcome = (
  overrides: Partial<NotificationOutcomeRecord> = {},
): NotificationOutcomeRecord => ({
  id: ulid(),
  reminderPeriod: 'morning',
  outcome: null,
  scheduledTime: '09:00',
  sentAt: Date.now(),
  respondedAt: null,
  ...overrides,
});

export const makeTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: ulid(),
  categoryId: 'cat-mental',
  label: 'Test Tag',
  isDefault: false,
  isArchived: false,
  createdAt: Date.now(),
  ...overrides,
});

export const makeCategory = (
  overrides: Partial<TagCategory> = {},
): TagCategory => ({
  id: ulid(),
  name: 'Test Category',
  sortOrder: 5,
  isDefault: false,
  createdAt: Date.now(),
  ...overrides,
});

export const makeCheckIn = (overrides: Partial<CheckIn> = {}): CheckIn => ({
  id: ulid(),
  timestamp: Date.now(),
  tagIds: [],
  source: 'manual',
  ...overrides,
});

export const makeCompletion = (
  overrides: Partial<HabitCompletion> = {},
): HabitCompletion => ({
  id: ulid(),
  habitId: 'habit-1',
  date: '2024-01-15',
  count: 1,
  completedAt: Date.now(),
  source: 'manual',
  ...overrides,
});
