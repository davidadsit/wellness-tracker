import {Habit, NotificationOutcomeRecord} from '../../src/types';

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
  id: 'outcome-1',
  reminderPeriod: 'midday',
  outcome: null,
  scheduledTime: '13:00',
  sentAt: Date.now(),
  respondedAt: null,
  ...overrides,
});
